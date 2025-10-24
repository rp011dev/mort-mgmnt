import { NextResponse } from 'next/server'
import fs from 'fs/promises'
import { existsSync, mkdirSync } from 'fs'
import path from 'path'
import { DATA_PATHS } from '../../../config/dataConfig.js'
import { 
  ConcurrencyError, 
  addVersioningToRecord, 
  validateVersion, 
  checkFileTimestamp, 
  createConflictResponse 
} from '../../../utils/concurrencyManager.js'

const enquiriesFile = DATA_PATHS.enquiries

// Helper function to ensure directory and file exist
async function ensureEnquiriesFile() {
  const dir = path.dirname(enquiriesFile)
  if (!existsSync(dir)) {
    console.log('Creating directory:', dir)
    mkdirSync(dir, { recursive: true })
  }

  try {
    await fs.access(enquiriesFile)
  } catch {
    console.log('Creating new enquiries file')
    await fs.writeFile(enquiriesFile, '[]')
  }
}

// Helper function to read enquiries
async function readEnquiries() {
  try {
    const content = await fs.readFile(enquiriesFile, 'utf8')
    const enquiries = JSON.parse(content)
    return Array.isArray(enquiries) ? enquiries : []
  } catch (error) {
    console.error('Error reading enquiries:', error)
    return []
  }
}

// Named export for GET method
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const enquiryId = searchParams.get('enquiryId')
    const page = parseInt(searchParams.get('page')) || 1
    const limit = parseInt(searchParams.get('limit')) || 8
    
    // Filter parameters
    const statusFilter = searchParams.get('status')
    const typeFilter = searchParams.get('type')
    const assignedToFilter = searchParams.get('assignedTo')
    const searchTerm = searchParams.get('search')
    
    await ensureEnquiriesFile()
    let enquiries = await readEnquiries()
    
    // If enquiryId is provided, return that specific enquiry
    if (enquiryId) {
      const enquiry = enquiries.find(e => e.id === enquiryId)
      if (!enquiry) {
        return NextResponse.json({ error: 'Enquiry not found' }, { status: 404 })
      }
      return NextResponse.json(enquiry)
    }
    
    // Apply search filter
    if (searchTerm && searchTerm.trim()) {
      const term = searchTerm.toLowerCase().trim()
      enquiries = enquiries.filter(enquiry => 
        enquiry.firstName?.toLowerCase().includes(term) ||
        enquiry.lastName?.toLowerCase().includes(term) ||
        enquiry.email?.toLowerCase().includes(term) ||
        enquiry.phone?.includes(term) ||
        enquiry.postcode?.toLowerCase().includes(term) ||
        enquiry.notes?.toLowerCase().includes(term)
      )
    }
    
    // Apply other filters
    if (statusFilter && statusFilter !== 'all') {
      enquiries = enquiries.filter(enquiry => enquiry.status === statusFilter)
    }
    
    if (typeFilter && typeFilter !== 'all') {
      enquiries = enquiries.filter(enquiry => enquiry.enquiryType === typeFilter)
    }
    
    if (assignedToFilter && assignedToFilter !== 'all') {
      if (assignedToFilter === 'null') {
        enquiries = enquiries.filter(enquiry => !enquiry.assignedTo)
      } else {
        enquiries = enquiries.filter(enquiry => enquiry.assignedTo === assignedToFilter)
      }
    }
    
    // Sort enquiries by enquiry date (newest first)
    enquiries.sort((a, b) => new Date(b.enquiryDate) - new Date(a.enquiryDate))
    
    // Apply pagination
    const startIndex = (page - 1) * limit
    const endIndex = startIndex + limit
    const paginatedEnquiries = enquiries.slice(startIndex, endIndex)
    
    return NextResponse.json({
      enquiries: paginatedEnquiries,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(enquiries.length / limit),
        totalEnquiries: enquiries.length,
        enquiriesPerPage: limit,
        hasNextPage: endIndex < enquiries.length,
        hasPreviousPage: page > 1
      },
      filters: {
        search: searchTerm,
        status: statusFilter,
        type: typeFilter,
        assignedTo: assignedToFilter
      }
    })
  } catch (error) {
    console.error('Error reading enquiries:', error)
    return NextResponse.json({ error: 'Failed to read enquiries' }, { status: 500 })
  }
}

// Named export for POST method
export async function POST(request) {
  try {
    console.log('Starting POST request to /api/enquiries')
    
    const enquiryData = await request.json()
    console.log('Received enquiry data:', enquiryData)
    
    if (!enquiryData) {
      console.log('No enquiry data provided')
      return NextResponse.json({ error: 'Enquiry data is required' }, { status: 400 })
    }

    // Validate required fields
    const requiredFields = ['firstName', 'lastName', 'email', 'enquiryType']
    const missingFields = requiredFields.filter(field => !enquiryData[field])
    if (missingFields.length > 0) {
      console.log('Missing required fields:', missingFields)
      return NextResponse.json({ 
        error: 'Missing required fields', 
        missingFields 
      }, { status: 400 })
    }

    await ensureEnquiriesFile()
    
    // Check file timestamp before reading
    await checkFileTimestamp(enquiriesFile)
    
    const enquiries = await readEnquiries()

    // Generate new enquiry ID
    const existingNumbers = enquiries
      .filter(e => e && e.id && typeof e.id === 'string' && e.id.startsWith('ENQ'))
      .map(e => {
        const num = parseInt(e.id.replace('ENQ', ''), 10)
        return isNaN(num) ? 0 : num
      })
      .filter(num => num > 0)

    const maxId = existingNumbers.length > 0 ? Math.max(...existingNumbers) : 0
    const newId = maxId + 1

    console.log(`Generating new enquiry ID: ENQ${String(newId).padStart(3, '0')} (maxId: ${maxId})`)

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
      mortgageType: enquiryData.mortgageType || 'Repayment'
    }

    // Add versioning to the new enquiry
    addVersioningToRecord(newEnquiry)

    console.log('Created new enquiry:', newEnquiry.id)

    // Add to enquiries array and save
    enquiries.push(newEnquiry)
    await fs.writeFile(enquiriesFile, JSON.stringify(enquiries, null, 2))
    console.log('Successfully saved enquiry to file')

    return NextResponse.json({
      message: 'Enquiry created successfully',
      enquiry: newEnquiry
    }, { status: 201 })

  } catch (error) {
    if (error instanceof ConcurrencyError) {
      return createConflictResponse(error.message, error.conflictData)
    }
    console.error('Error processing request:', error)
    return NextResponse.json({
      error: 'Failed to process request',
      details: error.message
    }, { status: 500 })
  }
}

// Named export for PUT method
export async function PUT(request) {
  try {
    const { searchParams } = new URL(request.url)
    const enquiryId = searchParams.get('enquiryId')
    const { version, ...enquiryData } = await request.json()
    
    if (!enquiryId || !enquiryData) {
      return NextResponse.json({ error: 'Enquiry ID and data are required' }, { status: 400 })
    }
    
    await ensureEnquiriesFile()
    
    // Check file timestamp before reading
    await checkFileTimestamp(enquiriesFile)
    
    const enquiries = await readEnquiries()
    const enquiryIndex = enquiries.findIndex(e => e.id === enquiryId)
    
    if (enquiryIndex === -1) {
      return NextResponse.json({ error: 'Enquiry not found' }, { status: 404 })
    }
    
    const currentEnquiry = enquiries[enquiryIndex]
    
    // Validate version for concurrency control
    if (version) {
      validateVersion(currentEnquiry, version)
    }
    
    // Update the enquiry
    const updatedEnquiry = { ...currentEnquiry, ...enquiryData }
    
    // Update versioning
    addVersioningToRecord(updatedEnquiry)
    
    enquiries[enquiryIndex] = updatedEnquiry
    
    try {
      await fs.writeFile(enquiriesFile, JSON.stringify(enquiries, null, 2))
      return NextResponse.json({ 
        message: 'Enquiry updated successfully', 
        enquiry: updatedEnquiry 
      })
    } catch (error) {
      return NextResponse.json({ error: 'Failed to save enquiry update' }, { status: 500 })
    }
  } catch (error) {
    if (error instanceof ConcurrencyError) {
      return createConflictResponse(error.message, error.conflictData)
    }
    console.error('Error updating enquiry:', error)
    return NextResponse.json({ error: 'Failed to update enquiry' }, { status: 500 })
  }
}

// Named export for DELETE method
export async function DELETE(request) {
  try {
    const { searchParams } = new URL(request.url)
    const enquiryId = searchParams.get('enquiryId')
    const version = searchParams.get('version')
    
    console.log(`DELETE request for enquiry ID: ${enquiryId}, version: ${version}`)
    
    if (!enquiryId) {
      return NextResponse.json({ error: 'Enquiry ID is required' }, { status: 400 })
    }
    
    await ensureEnquiriesFile()
    
    // Check file timestamp before reading (skip timestamp validation for now)
    try {
      await checkFileTimestamp(enquiriesFile)
    } catch (timestampError) {
      console.log('Timestamp check error (continuing):', timestampError.message)
      // Continue with deletion even if timestamp check fails
    }
    
    const enquiries = await readEnquiries()
    const enquiryIndex = enquiries.findIndex(e => e.id === enquiryId)
    
    console.log(`Found enquiry at index: ${enquiryIndex}`)
    
    if (enquiryIndex === -1) {
      return NextResponse.json({ error: 'Enquiry not found' }, { status: 404 })
    }
    
    const currentEnquiry = enquiries[enquiryIndex]
    console.log(`Current enquiry version: ${currentEnquiry._version}, client version: ${version}`)
    
    // Validate version for concurrency control
    try {
      if (version) {
        validateVersion(currentEnquiry, parseInt(version))
      }
    } catch (versionError) {
      console.error('Version validation error:', versionError)
      if (versionError instanceof ConcurrencyError) {
        const conflictResponse = createConflictResponse(versionError)
        return NextResponse.json(conflictResponse, { status: 409 })
      }
      return NextResponse.json({ error: 'Version validation failed' }, { status: 409 })
    }
    
    // Remove the enquiry
    enquiries.splice(enquiryIndex, 1)
    console.log(`Removed enquiry from array, new length: ${enquiries.length}`)
    
    try {
      await fs.writeFile(enquiriesFile, JSON.stringify(enquiries, null, 2))
      console.log('Enquiry deleted successfully')
      return NextResponse.json({ 
        message: 'Enquiry deleted successfully'
      })
    } catch (writeError) {
      console.error('Failed to save after deletion:', writeError)
      return NextResponse.json({ error: 'Failed to save after deletion' }, { status: 500 })
    }
  } catch (error) {
    console.error('Error deleting enquiry:', error)
    if (error instanceof ConcurrencyError) {
      const conflictResponse = createConflictResponse(error)
      return NextResponse.json(conflictResponse, { status: 409 })
    }
    return NextResponse.json({ error: 'Failed to delete enquiry: ' + error.message }, { status: 500 })
  }
}
