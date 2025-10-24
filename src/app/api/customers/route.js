import { NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'
import { DATA_PATHS } from '../../../config/dataConfig.js'
import { 
  ConcurrencyError, 
  addVersioningToRecord, 
  validateVersion, 
  checkFileTimestamp, 
  createConflictResponse 
} from '../../../utils/concurrencyManager.js'

const customersFilePath = DATA_PATHS.customers

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
    
    const fileContents = fs.readFileSync(customersFilePath, 'utf8')
    let customers = JSON.parse(fileContents)
    
    // If customerId is provided, return that specific customer
    if (customerId) {
      const customer = customers.find(c => c.id === customerId)
      if (!customer) {
        return NextResponse.json({ error: 'Customer not found' }, { status: 404 })
      }
      return NextResponse.json(customer)
    }
    
    // Apply search filter
    if (searchTerm && searchTerm.trim()) {
      const term = searchTerm.toLowerCase().trim()
      customers = customers.filter(customer => 
        (customer.firstName?.toLowerCase() || '').includes(term) ||
        (customer.lastName?.toLowerCase() || '').includes(term) ||
        (customer.email?.toLowerCase() || '').includes(term) ||
        (customer.phone?.toString() || '').includes(term) ||
        (customer.postcode?.toLowerCase() || '').includes(term)
      )
    }
    
    // Apply other filters
    if (stageFilter && stageFilter !== 'all') {
      customers = customers.filter(customer => customer.currentStage === stageFilter)
    }
    
    if (lenderFilter && lenderFilter !== 'all') {
      customers = customers.filter(customer => customer.lender === lenderFilter)
    }
    
    if (mortgageTypeFilter && mortgageTypeFilter !== 'all') {
      customers = customers.filter(customer => customer.mortgageType === mortgageTypeFilter)
    }
    
    if (categoryFilter && categoryFilter !== 'all') {
      customers = customers.filter(customer => customer.category === categoryFilter)
    }
    
    // Calculate pagination
    const totalCustomers = customers.length
    const totalPages = Math.ceil(totalCustomers / limit)
    const startIndex = (page - 1) * limit
    const endIndex = startIndex + limit
    const paginatedCustomers = customers.slice(startIndex, endIndex)
    
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
    console.error('Error fetching customers:', error)
    return NextResponse.json({ error: 'Failed to fetch customers' }, { status: 500 })
  }
}

export async function POST(request) {
  try {
    const customerData = await request.json()
    
    // Check file timestamp before reading
    await checkFileTimestamp(customersFilePath)
    
    // Read current customers
    const fileContents = fs.readFileSync(customersFilePath, 'utf8')
    const customers = JSON.parse(fileContents)
    
    // Generate new customer ID (always generate a new one, ignore any incoming ID)
    const existingIds = customers.map(c => c.id)
    let newIdNumber = 1
    let newId = `GKF${String(newIdNumber).padStart(5, '0')}`
    
    // Find the next available ID
    while (existingIds.includes(newId)) {
      newIdNumber++
      newId = `GKF${String(newIdNumber).padStart(5, '0')}`
    }
    
    console.log(`Creating new customer with ID: ${newId} (found ${existingIds.length} existing customers)`)
    
    // Generate product reference number based on category
    const productPrefix = customerData.category === 'Mortgages' ? 'MTG' : 
                         customerData.category === 'Protection' ? 'PRO' : 'INS'
    const currentYear = new Date().getFullYear()
    const existingProductNumbers = customers
      .filter(c => c.category === customerData.category)
      .map(c => c.productReferenceNumber)
      .filter(Boolean)
    
    let productNumber = 1
    let productReferenceNumber = `${productPrefix}-${currentYear}-${String(productNumber).padStart(3, '0')}`
    
    while (existingProductNumbers.includes(productReferenceNumber)) {
      productNumber++
      productReferenceNumber = `${productPrefix}-${currentYear}-${String(productNumber).padStart(3, '0')}`
    }
    
    // Create new customer with generated IDs (remove any incoming id to ensure fresh generation)
    const { id: incomingId, productReferenceNumber: incomingRef, ...cleanCustomerData } = customerData
    
    const newCustomer = {
      id: newId,
      productReferenceNumber: productReferenceNumber,
      ...cleanCustomerData,
      dateOfBirth: cleanCustomerData.dateOfBirth || '',
      customerAccountType: cleanCustomerData.customerAccountType || 'Sole',
      jointHolders: cleanCustomerData.jointHolders || [],
      submissionDate: cleanCustomerData.submissionDate || new Date().toISOString().split('T')[0]
    }

    // Add versioning to the new customer
    addVersioningToRecord(newCustomer)
    
    // Add to customers array
    customers.push(newCustomer)
    
    // Write back to file
    fs.writeFileSync(customersFilePath, JSON.stringify(customers, null, 2))
    
    return NextResponse.json(newCustomer, { status: 201 })
  } catch (error) {
    if (error instanceof ConcurrencyError) {
      return createConflictResponse(error.message, error.conflictData)
    }
    console.error('Error creating customer:', error)
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
    
    // Check file timestamp before reading
    await checkFileTimestamp(customersFilePath)
    
    // Read current customers
    const fileContents = fs.readFileSync(customersFilePath, 'utf8')
    const customers = JSON.parse(fileContents)
    
    // Find the customer
    const customerIndex = customers.findIndex(c => c.id === customerId)
    if (customerIndex === -1) {
      return NextResponse.json({ error: 'Customer not found' }, { status: 404 })
    }
    
    const currentCustomer = customers[customerIndex]
    
    // Validate version for concurrency control
    if (version) {
      validateVersion(currentCustomer, version)
    }
    
    // Update the customer while preserving the ID and structure
    const updatedCustomer = {
      ...currentCustomer,
      ...updates,
      id: customerId // Ensure ID doesn't change
    }
    
    // Update versioning
    addVersioningToRecord(updatedCustomer)
    
    customers[customerIndex] = updatedCustomer
    
    // Write back to file
    fs.writeFileSync(customersFilePath, JSON.stringify(customers, null, 2))
    
    return NextResponse.json(updatedCustomer)
  } catch (error) {
    if (error instanceof ConcurrencyError) {
      return createConflictResponse(error.message, error.conflictData)
    }
    console.error('Error updating customer:', error)
    return NextResponse.json({ error: 'Failed to update customer' }, { status: 500 })
  }
}
