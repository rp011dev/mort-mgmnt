import { NextResponse } from 'next/server'
import { getCollection } from '../../../utils/mongoDb'
import { MONGODB_CONFIG } from '../../../config/dataConfig'
import { 
  ConcurrencyError, 
  createConflictResponse 
} from '../../../utils/concurrencyManager.js'

// Get collection reference once
let feesCollection = null

async function getFeesCollection() {
  if (!feesCollection) {
    feesCollection = await getCollection(MONGODB_CONFIG.collections.fees)
  }
  return feesCollection
}

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const customerId = searchParams.get('customerId')
    const feeId = searchParams.get('feeId')
    const status = searchParams.get('status') // Filter by status: PAID, UNPAID, NA
    
    const collection = await getFeesCollection()
    
    // Build query filter
    let query = {}
    
    if (customerId) {
      query.customerId = customerId
    }
    
    if (feeId) {
      query.feeId = feeId
      // Find specific fee
      const fee = await collection.findOne(query, { projection: { _id: 0 } })
      if (fee) {
        return NextResponse.json(fee)
      }
      return NextResponse.json({ error: 'Fee not found' }, { status: 404 })
    }
    
    if (status) {
      query.status = status.toUpperCase()
    }
    
    // Get all matching fees
    const fees = await collection.find(query, { 
      projection: { _id: 0 } 
    }).sort({ addedDate: -1 }).toArray()
    
    return NextResponse.json(fees)
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
    
    const collection = await getFeesCollection()
    
    // Find the highest feeId to generate the next one
    const lastFee = await collection.find({})
      .sort({ feeId: -1 })
      .limit(1)
      .toArray()
    
    // Extract numeric part from feeId (e.g., "FEE123" -> 123)
    let nextFeeNumber = 1
    if (lastFee.length > 0 && lastFee[0].feeId) {
      const lastFeeNumber = parseInt(lastFee[0].feeId.replace(/^FEE/, '')) || 0
      nextFeeNumber = lastFeeNumber + 1
    }
    
    const newFeeId = `FEE${nextFeeNumber}`
    
    // Generate new fee
    const newFee = {
      feeId: newFeeId,
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
      reference: reference || `${type.substring(0, 3).toUpperCase()}-${Date.now()}`,
      _version: 1,
      _lastModified: new Date().toISOString()
    }
    
    // Insert the fee
    const result = await collection.insertOne(newFee)
    
    if (result.acknowledged) {
      return NextResponse.json({
        success: true,
        message: 'Fee added successfully',
        fee: newFee,
        feeId: newFeeId,
        _id: result.insertedId
      })
    } else {
      return NextResponse.json({ error: 'Failed to save fee' }, { status: 500 })
    }
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
    const { feeId, customerId, status, paymentMethod, paidDate, version } = await request.json()
    
    if (!feeId || !customerId || !status) {
      return NextResponse.json({ 
        error: 'FeeId, customerId, and status are required' 
      }, { status: 400 })
    }
    
    // Validate status
    const validStatuses = ['PAID', 'UNPAID', 'NA']
    if (!validStatuses.includes(status.toUpperCase())) {
      return NextResponse.json({ 
        error: 'Status must be PAID, UNPAID, or NA' 
      }, { status: 400 })
    }
    
    const collection = await getFeesCollection()
    
    // Find current fee using both feeId and customerId
    const currentFee = await collection.findOne({ 
      feeId: feeId,
      customerId: customerId 
    })
    
    if (!currentFee) {
      return NextResponse.json({ error: 'Fee not found' }, { status: 404 })
    }
    
    // Validate version for concurrency control
    if (version && currentFee._version !== version) {
      return createConflictResponse('Version mismatch', {
        serverVersion: currentFee._version,
        clientVersion: version,
        serverData: currentFee
      })
    }
    
    // Prepare update data
    const updateData = {
      status: status.toUpperCase(),
      _version: (currentFee._version || 0) + 1,
      _lastModified: new Date().toISOString()
    }
    
    if (status.toUpperCase() === 'PAID') {
      updateData.paidDate = paidDate || new Date().toISOString()
      updateData.paymentMethod = paymentMethod || currentFee.paymentMethod
    } else {
      updateData.paidDate = null
      updateData.paymentMethod = null
    }
    
    // Update the fee with version check
    const result = await collection.findOneAndUpdate(
      { 
        feeId: feeId,
        customerId: customerId,
        _version: version || currentFee._version 
      },
      { $set: updateData },
      { returnDocument: 'after' }
    )
    
    if (!result) {
      return NextResponse.json({ 
        error: 'Failed to update fee, possible concurrent modification' 
      }, { status: 409 })
    }
    
    return NextResponse.json({
      success: true,
      message: 'Fee updated successfully',
      fee: result
    })
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
    const customerId = searchParams.get('customerId')
    const version = searchParams.get('version')
    
    if (!feeId || !customerId) {
      return NextResponse.json({ 
        error: 'FeeId and customerId are required' 
      }, { status: 400 })
    }
    
    const collection = await getFeesCollection()
    
    // Find current fee first to check version
    const currentFee = await collection.findOne({ 
      feeId: feeId,
      customerId: customerId 
    })
    
    if (!currentFee) {
      return NextResponse.json({ error: 'Fee not found' }, { status: 404 })
    }
    
    // Validate version for concurrency control
    if (version && currentFee._version !== parseInt(version)) {
      return createConflictResponse('Version mismatch', {
        serverVersion: currentFee._version,
        clientVersion: parseInt(version),
        serverData: currentFee
      })
    }
    
    // Delete the fee with version check
    const result = await collection.deleteOne({ 
      feeId: feeId,
      customerId: customerId,
      _version: version ? parseInt(version) : currentFee._version
    })
    
    if (result.deletedCount === 0) {
      return NextResponse.json({ 
        error: 'Failed to delete fee, possible concurrent modification' 
      }, { status: 409 })
    }
    
    return NextResponse.json({ 
      success: true,
      message: 'Fee deleted successfully'
    })
  } catch (error) {
    if (error instanceof ConcurrencyError) {
      return createConflictResponse(error.message, error.conflictData)
    }
    console.error('Error deleting fee:', error)
    return NextResponse.json({ error: 'Failed to delete fee' }, { status: 500 })
  }
}
