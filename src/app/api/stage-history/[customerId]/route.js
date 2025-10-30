import { NextResponse } from 'next/server'
import { getCollection } from '../../../../utils/mongoDb'
import { MONGODB_CONFIG } from '../../../../config/dataConfig'
import { 
  ConcurrencyError, 
  addVersioningToRecord, 
  validateVersion, 
  createConflictResponse 
} from '../../../../utils/concurrencyManager.js'

// Get collection reference once
let stageHistoryColl = null

async function getStageHistoryCollection() {
  if (!stageHistoryColl) {
    stageHistoryColl = await getCollection(MONGODB_CONFIG.collections.stageHistory)
  }
  return stageHistoryColl
}

// Helper function to get the next available ID
async function getNextStageHistoryId() {
  const collection = await getStageHistoryCollection()
  
  // Find the highest ID number
  const lastEntry = await collection
    .find({ id: { $regex: /^SH\d+$/ } })
    .sort({ id: -1 })
    .limit(1)
    .toArray()
  
  if (lastEntry.length > 0) {
    const lastId = lastEntry[0].id
    const lastNumber = parseInt(lastId.replace('SH', ''), 10)
    return `SH${lastNumber + 1}`
  }
  
  return 'SH1'
}

// GET endpoint to retrieve stage history for a customer
export async function GET(req, { params }) {
  try {
    const { customerId } = params
    
    if (!customerId) {
      return NextResponse.json(
        { error: 'Customer ID is required' },
        { status: 400 }
      )
    }

    console.log('Reading stage history for customer:', customerId)
    const collection = await getStageHistoryCollection()
    
    // Fetch all stage history entries for this customer, sorted by timestamp (newest first)
    const customerHistory = await collection
      .find({ customerId })
      .sort({ timestamp: -1 })
      .toArray()

    // Remove MongoDB _id field from results
    const cleanHistory = customerHistory.map(({ _id, ...entry }) => entry)

    // Get current stage from most recent entry
    const currentStage = cleanHistory.length > 0 ? cleanHistory[0].stage : null
    console.log('Current stage:', currentStage)

    return NextResponse.json({
      customerHistory: cleanHistory,
      currentStage,
      totalItems: cleanHistory.length
    })

  } catch (error) {
    console.error('Error in GET stage history:', error)
    return NextResponse.json(
      { 
        error: 'Failed to read stage history',
        details: error.message 
      },
      { status: 500 }
    )
  }
}

// POST endpoint to add new stage history entry for a customer
export async function POST(req, { params }) {
  try {
    const { customerId } = params
    const { stage, notes, user, direction } = await req.json()

    if (!customerId || !stage) {
      return NextResponse.json(
        { error: 'Customer ID and stage are required' },
        { status: 400 }
      )
    }

    const collection = await getStageHistoryCollection()

    // Get the next available ID
    const nextId = await getNextStageHistoryId()

    // Create new history entry
    const newEntry = {
      customerId,
      id: nextId,
      stage,
      timestamp: new Date().toISOString(),
      notes: notes || `Stage moved ${direction || 'to'} ${stage}`,
      user: user || 'System'
    }

    // Add versioning to the new entry
    addVersioningToRecord(newEntry)

    // Insert the new entry into MongoDB
    await collection.insertOne(newEntry)

    // Fetch all history for this customer (sorted newest first)
    const customerHistory = await collection
      .find({ customerId })
      .sort({ timestamp: -1 })
      .toArray()

    // Remove MongoDB _id field from results
    const cleanHistory = customerHistory.map(({ _id, ...entry }) => entry)

    return NextResponse.json({
      customerHistory: cleanHistory,
      currentStage: stage
    })

  } catch (error) {
    if (error instanceof ConcurrencyError) {
      return createConflictResponse(error.message, error.conflictData)
    }
    console.error('Error in POST stage history:', error)
    return NextResponse.json(
      { error: 'Failed to update stage history' },
      { status: 500 }
    )
  }
}

// OPTIONS endpoint for CORS support
export async function OPTIONS(req) {
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type'
    }
  })
}
