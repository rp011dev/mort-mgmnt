import { NextResponse } from 'next/server'
import { getCollection } from '../../../../utils/mongoDb'
import { MONGODB_CONFIG } from '../../../../config/dataConfig'
import { 
  ConcurrencyError, 
  addVersioningToRecord, 
  validateVersion, 
  createConflictResponse 
} from '../../../../utils/concurrencyManager.js'
import { getUserFromRequest, createAuditFields } from '../../../../utils/authMiddleware'
export const dynamic = 'force-dynamic'


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
  
    // Find all entries matching the pattern
  const allEntries = await collection
    .find({ id: { $regex: /^SH\d+$/ } })
    .toArray()
  
  if (allEntries.length > 0) {
    // Extract numbers and find the maximum
    const numbers = allEntries.map(entry => parseInt(entry.id.replace('SH', ''), 10))
    const lastNumber = Math.max(...numbers)
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

    const collection = await getStageHistoryCollection()
    
    // Fetch all stage history entries for this customer, sorted by timestamp (newest first)
    const customerHistory = await collection
      .find({ customerId })
      .sort({ timestamp: -1 })
      .toArray()

    // Remove MongoDB _id field from results
    const cleanHistory = customerHistory.map(({ _id, ...entry }) => entry)

    // Get customer details to fetch current stage
    const customersCollection = await getCollection(MONGODB_CONFIG.collections.customers)
    const customer = await customersCollection.findOne({ id: customerId })
    
    // Get current stage of this customer
    const currentStage = customer?.currentStage || null

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
    // Extract user from token for audit trail
    const loggedInUser = getUserFromRequest(req)
    
    const { customerId } = params
    const { stage, notes, direction } = await req.json()

    if (!customerId || !stage) {
      return NextResponse.json(
        { error: 'Customer ID and stage are required' },
        { status: 400 }
      )
    }

    const collection = await getStageHistoryCollection()

    // Get the next available ID
    const nextId = await getNextStageHistoryId()

    // ALWAYS use logged-in user's name for audit trail (ignore any user passed from frontend)
    const userName = loggedInUser ? (loggedInUser.name || loggedInUser.email) : 'System'
    
    // Add audit trail fields
    const timestamp = new Date().toISOString()
    const auditFields = loggedInUser ? createAuditFields(loggedInUser, true) : {
      _createdBy: userName,
      _createdAt: timestamp,
      _modifiedBy: userName,
      _lastModified: timestamp
    }

    // Create new history entry
    const newEntry = {
      customerId,
      id: nextId,
      stage,
      timestamp: timestamp,
      notes: notes || `Stage moved ${direction || 'to'} ${stage}`,
      user: userName,
      ...auditFields
    }

    // Add versioning to the new entry (pass userName to avoid overwriting audit fields)
    addVersioningToRecord(newEntry, userName)

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
