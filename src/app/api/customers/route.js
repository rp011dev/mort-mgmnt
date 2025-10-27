
import { 
  ConcurrencyError, 
  addVersioningToRecord, 
  createConflictResponse 
} from '../../../utils/concurrencyManager.js';


import { NextResponse } from 'next/server';
import { getCollection } from '../../../utils/mongoDb';
import { MONGODB_CONFIG } from '../../../config/dataConfig';

// Get collection reference once
let customersColl = null;

async function getCustomersCollection() {
  if (!customersColl) {
    customersColl = await getCollection(MONGODB_CONFIG.collections.customers);
  }
  return customersColl;
}

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const customerId = searchParams.get('customerId')
    const page = parseInt(searchParams.get('page')) || 1
    const limit = parseInt(searchParams.get('limit')) || 8
    
    // Filter parameters
    const stageFilter = searchParams.get('stage')
    const lenderFilter = searchParams.get('lender')
    const mortgageTypeFilter = searchParams.get('mortgageType')
    const categoryFilter = searchParams.get('category')
    const searchTerm = searchParams.get('search')

    const customersCollection =  await getCustomersCollection();
    
    // If customerId is provided, return that specific customer
    if (customerId) {
      const customer = await customersCollection.findOne({ id: customerId })
      if (!customer) {
        return NextResponse.json({ error: 'Customer not found' }, { status: 404 })
      }
      return NextResponse.json(customer)
    }

    // Build MongoDB query
    const query = {}
    
    if (searchTerm && searchTerm.trim()) {
      query.$or = [
        { firstName: { $regex: searchTerm, $options: 'i' } },
        { lastName: { $regex: searchTerm, $options: 'i' } },
        { email: { $regex: searchTerm, $options: 'i' } },
        { phone: { $regex: searchTerm, $options: 'i' } },
        { postcode: { $regex: searchTerm, $options: 'i' } }
      ]
    }
    
    if (stageFilter && stageFilter !== 'all') {
      query.currentStage = stageFilter
    }
    
    if (lenderFilter && lenderFilter !== 'all') {
      query.lender = lenderFilter
    }
    
    if (mortgageTypeFilter && mortgageTypeFilter !== 'all') {
      query.mortgageType = mortgageTypeFilter
    }
    
    if (categoryFilter && categoryFilter !== 'all') {
      query.category = categoryFilter
    }

    // Get total count for pagination
    const totalCustomers = await customersCollection.countDocuments(query)
    const totalPages = Math.ceil(totalCustomers / limit)

    // Get paginated results
    const paginatedCustomers = await customersCollection
      .find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .toArray()
    
    return NextResponse.json({
      customers: paginatedCustomers,
      pagination: {
        currentPage: page,
        totalPages,
        totalCustomers,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1
      }
    })
  } catch (error) {

    return NextResponse.json({ error: 'Failed to fetch customers' }, { status: 500 })
  }
}

export async function POST(request) {
  try {
    const customerData = await request.json()
    const customersCollection =  await getCustomersCollection();
    
    // Generate new customer ID (always generate a new one, ignore any incoming ID)
    const lastCustomer = await customersCollection
      .find()
      .sort({ id: -1 })
      .limit(1)
      .toArray()
      
    const lastId = lastCustomer[0]?.id || 'GKF00000'
    const newIdNumber = parseInt(lastId.slice(3)) + 1
    const newId = `GKF${String(newIdNumber).padStart(5, '0')}`
    
    // Generate product reference number based on category
    const productPrefix = customerData.category === 'Mortgages' ? 'MTG' : 
                         customerData.category === 'Protection' ? 'PRO' : 'INS'
    const currentYear = new Date().getFullYear()
    
    const lastProductRef = await customersCollection
      .find({ 
        category: customerData.category,
        productReferenceNumber: { 
          $regex: `^${productPrefix}-${currentYear}-` 
        }
      })
      .sort({ productReferenceNumber: -1 })
      .limit(1)
      .toArray()
    
    let productNumber = 1
    if (lastProductRef.length > 0) {
      productNumber = parseInt(lastProductRef[0].productReferenceNumber.split('-')[2]) + 1
    }
    
    const productReferenceNumber = `${productPrefix}-${currentYear}-${String(productNumber).padStart(3, '0')}`
    
    // Create new customer with generated IDs (remove any incoming id to ensure fresh generation)
    const { id: incomingId, productReferenceNumber: incomingRef, ...cleanCustomerData } = customerData
    
    const newCustomer = {
      id: newId,
      productReferenceNumber: productReferenceNumber,
      ...cleanCustomerData,
      dateOfBirth: cleanCustomerData.dateOfBirth || '',
      customerAccountType: cleanCustomerData.customerAccountType || 'Sole',
      jointHolders: cleanCustomerData.jointHolders || [],
      submissionDate: cleanCustomerData.submissionDate || new Date().toISOString().split('T')[0],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      _version: 0  // Initialize version number
    }

    // Add versioning to the new customer
    addVersioningToRecord(newCustomer)
    
    // Insert into MongoDB
    await customersCollection.insertOne(newCustomer)
    
    return NextResponse.json(newCustomer, { status: 201 })
  } catch (error) {
    if (error instanceof ConcurrencyError) {
      return createConflictResponse(error.message, error.conflictData)
    }

    return NextResponse.json({ error: 'Failed to create customer' }, { status: 500 })
  }
}

export async function PUT(request) {
  try {
    const requestData = await request.json()
    const { customerId, updates, version } = requestData
    
    if (!customerId) {
      return NextResponse.json({ error: 'Customer ID is required' }, { status: 400 })
    }
    
    if (!updates) {
      return NextResponse.json({ error: 'Updates data is required' }, { status: 400 })
    }
    
    const customersCollection =  await getCustomersCollection();
    
    // Find the current customer to get its version
    const currentCustomer = await customersCollection.findOne({ id: customerId })
    if (!currentCustomer) {
      return NextResponse.json({ error: 'Customer not found' }, { status: 404 })
    }

    // Get current version or initialize to 0
    const currentVersion = currentCustomer._version || 0

    // Validate version for concurrency control
    if (version !== undefined && version !== currentVersion) {
      return NextResponse.json({ 
        error: 'The document was modified by another user. Please refresh and try again.',
        code: 'VERSION_CONFLICT'
      }, { status: 409 })
    }
    
    // Prepare update data with version increment
    const { _id, ...baseUpdateData } = {
      ...currentCustomer,
      ...updates,
      id: customerId, // Ensure ID doesn't change
      updatedAt: new Date().toISOString(),
      _version: currentVersion + 1  // Increment version
    }

    
    // Update in MongoDB with optimistic locking
    const result = await customersCollection.findOneAndUpdate(
      { 
        id: customerId,
        _version: currentVersion  // Only update if version matches
      },
      { 
        $set: baseUpdateData,
        $currentDate: { lastModified: true }
      },
      { 
        returnDocument: 'after'
      }
    );
    
    if (!result) {
      console.error('Version conflict or update failed');
      return NextResponse.json({ 
        error: 'The document was modified by another user. Please refresh and try again.',
        code: 'VERSION_CONFLICT'
      }, { status: 409 });
    }
    
    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof ConcurrencyError) {
      return createConflictResponse(error.message, error.conflictData)
    }

    return NextResponse.json({ error: 'Failed to update customer' }, { status: 500 })
  }
}
