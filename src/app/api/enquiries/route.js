import { NextResponse } from 'next/server';
import { getCollection } from '../../../utils/mongoDb';
import { MONGODB_CONFIG } from '../../../config/dataConfig';
import { ConcurrencyError, createConflictResponse } from '../../../utils/concurrencyManager.js';
import { getUserFromRequest, createAuditFields } from '../../../utils/authMiddleware';

// Get collection reference once
let enquiriesCollection = null;

async function getEnquiriesCollection() {
  if (!enquiriesCollection) {
    enquiriesCollection = await getCollection(MONGODB_CONFIG.collections.enquiries);
  }
  return enquiriesCollection;
}

// Named export for GET method
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const enquiryId = searchParams.get('enquiryId');
    const page = parseInt(searchParams.get('page')) || 1;
    const limit = parseInt(searchParams.get('limit')) || 8;
    
    // Filter parameters
    const statusFilter = searchParams.get('status');
    const typeFilter = searchParams.get('type');
    const assignedToFilter = searchParams.get('assignedTo');
    const searchTerm = searchParams.get('search');
    
    const collection = await getEnquiriesCollection();
    
    // If enquiryId is provided, return that specific enquiry
    if (enquiryId) {
      const enquiry = await collection.findOne({ id: enquiryId });
      if (!enquiry) {
        return NextResponse.json({ error: 'Enquiry not found' }, { status: 404 });
      }
      return NextResponse.json(enquiry);
    }
    
    // Build MongoDB query
    const query = {};
    const sort = { enquiryDate: -1 };
    
    // Apply search filter
    if (searchTerm && searchTerm.trim()) {
      const term = searchTerm.toLowerCase().trim();
      query.$or = [
        { firstName: { $regex: term, $options: 'i' } },
        { lastName: { $regex: term, $options: 'i' } },
        { email: { $regex: term, $options: 'i' } },
        { phone: { $regex: term, $options: 'i' } },
        { postcode: { $regex: term, $options: 'i' } },
        { notes: { $regex: term, $options: 'i' } }
      ];
    }
    
    // Apply other filters
    if (statusFilter && statusFilter !== 'all') {
      query.status = statusFilter;
    }
    
    if (typeFilter && typeFilter !== 'all') {
      query.enquiryType = typeFilter;
    }
    
    if (assignedToFilter && assignedToFilter !== 'all') {
      if (assignedToFilter === 'null') {
        query.assignedTo = null;
      } else {
        query.assignedTo = assignedToFilter;
      }
    }
    
    // Get total count for pagination
    const totalEnquiries = await collection.countDocuments(query);
    
    // Get paginated results
    const paginatedEnquiries = await collection
      .find(query)
      .sort(sort)
      .skip((page - 1) * limit)
      .limit(limit)
      .toArray();
    
    return NextResponse.json({
      enquiries: paginatedEnquiries,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(totalEnquiries / limit),
        totalEnquiries,
        enquiriesPerPage: limit,
        hasNextPage: (page * limit) < totalEnquiries,
        hasPreviousPage: page > 1
      },
      filters: {
        search: searchTerm,
        status: statusFilter,
        type: typeFilter,
        assignedTo: assignedToFilter
      }
    });
  } catch (error) {
    console.error('Error reading enquiries:', error);
    return NextResponse.json({ error: 'Failed to read enquiries' }, { status: 500 });
  }
}

// Named export for POST method
export async function POST(request) {
  try {
    // Extract user from token for audit trail
    const user = getUserFromRequest(request)
    
    const enquiryData = await request.json();
    
    if (!enquiryData) {
      return NextResponse.json({ error: 'Enquiry data is required' }, { status: 400 });
    }

    // Validate required fields
    const requiredFields = ['firstName', 'lastName', 'email', 'enquiryType'];
    const missingFields = requiredFields.filter(field => !enquiryData[field]);
    if (missingFields.length > 0) {
      return NextResponse.json({ 
        error: 'Missing required fields', 
        missingFields 
      }, { status: 400 });
    }

    const collection = await getEnquiriesCollection();
    
    // Find the highest existing ID
    const lastEnquiry = await collection
      .find({ id: { $regex: /^ENQ\d+$/ } })
      .sort({ id: -1 })
      .limit(1)
      .toArray();
    
    const lastId = lastEnquiry.length > 0 
      ? parseInt(lastEnquiry[0].id.replace('ENQ', ''), 10) 
      : 0;
    const newId = lastId + 1;

    // Add audit trail fields
    const timestamp = new Date().toISOString()
    const auditFields = user ? createAuditFields(user, true) : {
      _createdBy: 'System',
      _createdAt: timestamp,
      _modifiedBy: 'System',
      _lastModified: timestamp
    }

    // Create new enquiry with all required fields
    const newEnquiry = {
      id: `ENQ${String(newId).padStart(3, '0')}`,
      firstName: enquiryData.firstName,
      lastName: enquiryData.lastName,
      email: enquiryData.email,
      phone: enquiryData.phone || '',
      postcode: enquiryData.postcode || '',
      address: enquiryData.address || '',
      dateOfBirth: enquiryData.dateOfBirth || '',
      customerAccountType: enquiryData.customerAccountType || 'Sole',
      enquiryDate: new Date().toISOString(),
      enquiryType: enquiryData.enquiryType,
      status: 'new',
      notes: enquiryData.notes || '',
      assignedTo: null,
      loanAmount: enquiryData.loanAmount || 0,
      propertyValue: enquiryData.propertyValue || 0,
      employmentStatus: enquiryData.employmentStatus || 'employed',
      annualIncome: enquiryData.annualIncome || 0,
      preferredLender: enquiryData.preferredLender || '',
      mortgageType: enquiryData.mortgageType || 'Repayment',
      ...auditFields,
      _version: 1
    };

    // Insert the new enquiry
    await collection.insertOne(newEnquiry);

    return NextResponse.json({
      message: 'Enquiry created successfully',
      enquiry: newEnquiry
    }, { status: 201 });

  } catch (error) {
    if (error instanceof ConcurrencyError) {
      return createConflictResponse(error.message, error.conflictData);
    }
    console.error('Error processing request:', error);
    return NextResponse.json({
      error: 'Failed to process request',
      details: error.message
    }, { status: 500 });
  }
}

// Named export for PUT method
export async function PUT(request) {
  try {
    // Extract user from token for audit trail
    const user = getUserFromRequest(request)
    
    const { searchParams } = new URL(request.url);
    const enquiryId = searchParams.get('enquiryId');
    const { version, ...enquiryData } = await request.json();
    
    if (!enquiryId || !enquiryData) {
      return NextResponse.json({ error: 'Enquiry ID and data are required' }, { status: 400 });
    }
    
    const collection = await getEnquiriesCollection();
    
    // Find current enquiry
    const currentEnquiry = await collection.findOne({ id: enquiryId });
    
    if (!currentEnquiry) {
      return NextResponse.json({ error: 'Enquiry not found' }, { status: 404 });
    }
    
    // Validate version for concurrency control
    if (version && currentEnquiry._version !== version) {
      return createConflictResponse('Version mismatch', {
        serverVersion: currentEnquiry._version,
        clientVersion: version,
        serverData: currentEnquiry
      });
    }
    
    // Add audit trail fields
    const timestamp = new Date().toISOString()
    const auditFields = user ? {
      _modifiedBy: user.name || user.email,
      _lastModified: timestamp
    } : {
      _modifiedBy: 'System',
      _lastModified: timestamp
    }
    
    // Prepare update data with versioning and audit trail
    const updateData = {
      ...enquiryData,
      ...auditFields,
      _version: (currentEnquiry._version || 0) + 1
    };
    
    // Update the enquiry
    const result = await collection.findOneAndUpdate(
      { 
        id: enquiryId,
        _version: version || currentEnquiry._version 
      },
      { $set: updateData },
      { returnDocument: 'after' }
    );
    
    if (!result) {
      return NextResponse.json({ error: 'Failed to update enquiry, possible concurrent modification' }, { status: 409 });
    }

    return NextResponse.json({ 
      message: 'Enquiry updated successfully', 
      enquiry: result
    });
  } catch (error) {
    if (error instanceof ConcurrencyError) {
      return createConflictResponse(error.message, error.conflictData);
    }
    console.error('Error updating enquiry:', error);
    return NextResponse.json({ error: 'Failed to update enquiry' }, { status: 500 });
  }
}

// Named export for DELETE method
export async function DELETE(request) {
  try {
    const { searchParams } = new URL(request.url);
    const enquiryId = searchParams.get('enquiryId');
    const version = searchParams.get('version');
    
    if (!enquiryId) {
      return NextResponse.json({ error: 'Enquiry ID is required' }, { status: 400 });
    }
    
    const collection = await getEnquiriesCollection();
    
    // Find current enquiry first to check version
    const currentEnquiry = await collection.findOne({ id: enquiryId });
    
    if (!currentEnquiry) {
      return NextResponse.json({ error: 'Enquiry not found' }, { status: 404 });
    }
    
    // Validate version for concurrency control
    if (version && currentEnquiry._version !== parseInt(version)) {
      return createConflictResponse('Version mismatch', {
        serverVersion: currentEnquiry._version,
        clientVersion: parseInt(version),
        serverData: currentEnquiry
      });
    }
    
    // Delete the enquiry with version check
    const result = await collection.deleteOne({ 
      id: enquiryId,
      _version: version ? parseInt(version) : currentEnquiry._version
    });
    
    if (result.deletedCount === 0) {
      return NextResponse.json({ 
        error: 'Failed to delete enquiry, possible concurrent modification' 
      }, { status: 409 });
    }

    return NextResponse.json({ 
      message: 'Enquiry deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting enquiry:', error);
    if (error instanceof ConcurrencyError) {
      return createConflictResponse(error.message, error.conflictData);
    }
    return NextResponse.json({ error: 'Failed to delete enquiry: ' + error.message }, { status: 500 });
  }
}
