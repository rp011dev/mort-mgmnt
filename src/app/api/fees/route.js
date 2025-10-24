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

const feesFilePath = DATA_PATHS.fees

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const customerId = searchParams.get('customerId')
    const feeId = searchParams.get('feeId')
    const status = searchParams.get('status') // Filter by status: PAID, UNPAID, NA
    
    const fileContents = fs.readFileSync(feesFilePath, 'utf8')
    const fees = JSON.parse(fileContents)
    
    let targetFees = []
    
    // Get fees for specific customer
    if (customerId) {
      targetFees = fees[customerId] || []
    } else if (feeId) {
      // Find specific fee across all customers
      for (const customerFees of Object.values(fees)) {
        const fee = customerFees.find(f => f.id === feeId)
        if (fee) {
          return NextResponse.json(fee)
        }
      }
      return NextResponse.json({ error: 'Fee not found' }, { status: 404 })
    } else {
      // Return all fees flattened
      targetFees = Object.values(fees).flat()
    }
    
    // Filter by status if provided
    if (status) {
      targetFees = targetFees.filter(fee => fee.status === status.toUpperCase())
    }
    
    // Sort by addedDate (newest first)
    targetFees.sort((a, b) => new Date(b.addedDate) - new Date(a.addedDate))
    
    return NextResponse.json(targetFees)
  } catch (error) {
    console.error('Error reading fees:', error)
    return NextResponse.json({ error: 'Failed to read fees' }, { status: 500 })
  }
}

export async function POST(request) {
  try {
    const { customerId, type, amount, currency = 'GBP', status, dueDate, description, paymentMethod, reference } = await request.json()
    
    if (!customerId || !type || !amount || !status) {
      return NextResponse.json({ 
        error: 'CustomerId, type, amount, and status are required' 
      }, { status: 400 })
    }
    
    // Validate status
    const validStatuses = ['PAID', 'UNPAID', 'NA']
    if (!validStatuses.includes(status.toUpperCase())) {
      return NextResponse.json({ 
        error: 'Status must be PAID, UNPAID, or NA' 
      }, { status: 400 })
    }
    
    // Check file timestamp before reading
    await checkFileTimestamp(feesFilePath)
    
    // Read current fees
    const fileContents = fs.readFileSync(feesFilePath, 'utf8')
    const fees = JSON.parse(fileContents)
    
    // Generate new fee
    const newFee = {
      id: `FEE${Date.now()}`,
      customerId: customerId,
      type: type,
      amount: parseFloat(amount),
      currency: currency,
      status: status.toUpperCase(),
      dueDate: dueDate || null,
      paidDate: status.toUpperCase() === 'PAID' ? new Date().toISOString() : null,
      addedDate: new Date().toISOString(),
      addedBy: 'Current User',
      description: description || '',
      paymentMethod: status.toUpperCase() === 'PAID' ? paymentMethod : null,
      reference: reference || `${type.substring(0, 3).toUpperCase()}-${Date.now()}`
    }
    
    // Add versioning to the new fee
    addVersioningToRecord(newFee)
    
    // Add fee to customer
    if (!fees[customerId]) {
      fees[customerId] = []
    }
    fees[customerId].push(newFee)
    
    // Write back to file
    fs.writeFileSync(feesFilePath, JSON.stringify(fees, null, 2))
    
    return NextResponse.json(newFee)
  } catch (error) {
    if (error instanceof ConcurrencyError) {
      return createConflictResponse(error.message, error.conflictData)
    }
    console.error('Error saving fee:', error)
    return NextResponse.json({ error: 'Failed to save fee' }, { status: 500 })
  }
}

export async function PUT(request) {
  try {
    const { feeId, status, paymentMethod, paidDate, version } = await request.json()
    
    if (!feeId || !status) {
      return NextResponse.json({ 
        error: 'FeeId and status are required' 
      }, { status: 400 })
    }
    
    // Validate status
    const validStatuses = ['PAID', 'UNPAID', 'NA']
    if (!validStatuses.includes(status.toUpperCase())) {
      return NextResponse.json({ 
        error: 'Status must be PAID, UNPAID, or NA' 
      }, { status: 400 })
    }
    
    // Check file timestamp before reading
    await checkFileTimestamp(feesFilePath)
    
    // Read current fees
    const fileContents = fs.readFileSync(feesFilePath, 'utf8')
    const fees = JSON.parse(fileContents)
    
    // Find and update the fee
    let feeFound = false
    for (const customerId in fees) {
      const customerFees = fees[customerId]
      const feeIndex = customerFees.findIndex(f => f.id === feeId)
      
      if (feeIndex !== -1) {
        const currentFee = customerFees[feeIndex]
        
        // Validate version for concurrency control
        if (version) {
          validateVersion(currentFee, version)
        }
        
        // Update the fee
        customerFees[feeIndex].status = status.toUpperCase()
        customerFees[feeIndex].lastModified = new Date().toISOString()
        
        if (status.toUpperCase() === 'PAID') {
          customerFees[feeIndex].paidDate = paidDate || new Date().toISOString()
          customerFees[feeIndex].paymentMethod = paymentMethod || customerFees[feeIndex].paymentMethod
        } else {
          customerFees[feeIndex].paidDate = null
          customerFees[feeIndex].paymentMethod = null
        }
        
        // Update versioning
        addVersioningToRecord(customerFees[feeIndex])
        
        feeFound = true
        break
      }
    }
    
    if (!feeFound) {
      return NextResponse.json({ error: 'Fee not found' }, { status: 404 })
    }
    
    // Write back to file
    fs.writeFileSync(feesFilePath, JSON.stringify(fees, null, 2))
    
    return NextResponse.json({ message: 'Fee updated successfully' })
  } catch (error) {
    if (error instanceof ConcurrencyError) {
      return createConflictResponse(error.message, error.conflictData)
    }
    console.error('Error updating fee:', error)
    return NextResponse.json({ error: 'Failed to update fee' }, { status: 500 })
  }
}

export async function DELETE(request) {
  try {
    const { searchParams } = new URL(request.url)
    const feeId = searchParams.get('feeId')
    const version = searchParams.get('version')
    
    if (!feeId) {
      return NextResponse.json({ error: 'FeeId is required' }, { status: 400 })
    }
    
    // Check file timestamp before reading
    await checkFileTimestamp(feesFilePath)
    
    // Read current fees
    const fileContents = fs.readFileSync(feesFilePath, 'utf8')
    const fees = JSON.parse(fileContents)
    
    // Find and delete the fee
    let feeFound = false
    for (const customerId in fees) {
      const customerFees = fees[customerId]
      const feeIndex = customerFees.findIndex(f => f.id === feeId)
      
      if (feeIndex !== -1) {
        const currentFee = customerFees[feeIndex]
        
        // Validate version for concurrency control
        if (version) {
          validateVersion(currentFee, version)
        }
        
        customerFees.splice(feeIndex, 1)
        feeFound = true
        break
      }
    }
    
    if (!feeFound) {
      return NextResponse.json({ error: 'Fee not found' }, { status: 404 })
    }
    
    // Write back to file
    fs.writeFileSync(feesFilePath, JSON.stringify(fees, null, 2))
    
    return NextResponse.json({ message: 'Fee deleted successfully' })
  } catch (error) {
    if (error instanceof ConcurrencyError) {
      return createConflictResponse(error.message, error.conflictData)
    }
    console.error('Error deleting fee:', error)
    return NextResponse.json({ error: 'Failed to delete fee' }, { status: 500 })
  }
}
