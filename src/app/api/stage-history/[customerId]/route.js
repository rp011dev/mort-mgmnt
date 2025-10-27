import { NextResponse } from 'next/server'
import fs from 'fs/promises'
import { DATA_PATHS } from '../../../../config/dataConfig'
import { 
  ConcurrencyError, 
  addVersioningToRecord, 
  validateVersion, 
  checkFileTimestamp, 
  createConflictResponse 
} from '../../../../utils/concurrencyManager.js'

const STAGE_HISTORY_FILE = DATA_PATHS.stageHistory

// Helper function to ensure the data file exists
async function ensureDataFile() {
  try {
    await fs.access(STAGE_HISTORY_FILE)
    // Check if file exists but is empty or invalid
    const content = await fs.readFile(STAGE_HISTORY_FILE, 'utf-8')
    try {
      const data = JSON.parse(content)
      if (!data || typeof data !== 'object') {
        throw new Error('Invalid data structure')
      }
    } catch (e) {
      console.log('Reinitializing stage history file with empty structure')
      await fs.writeFile(STAGE_HISTORY_FILE, JSON.stringify({}), 'utf-8')
    }
  } catch (error) {
    console.log('Creating new stage history file')
    // Create directory if it doesn't exist
    const dir = path.dirname(STAGE_HISTORY_FILE)
    await fs.mkdir(dir, { recursive: true })
    // Create empty stage history file with initial structure
    await fs.writeFile(STAGE_HISTORY_FILE, JSON.stringify({}), 'utf-8')
  }
}

// Helper function to read stage history data
async function readStageHistory() {
  await ensureDataFile()
  try {
    const content = await fs.readFile(STAGE_HISTORY_FILE, 'utf-8')
    const data = JSON.parse(content)
    //console.log('Raw stage history data:', data)
    
    // Ensure the data structure is correct
    if (typeof data !== 'object' || data === null) {
      console.log('Invalid data structure, initializing empty object')
      return {}
    }
    
    return data
  } catch (error) {
    console.error('Error reading stage history file:', error)
    return {}
  }
}

// Helper function to write stage history data
async function writeStageHistory(data) {
  try {
    await fs.writeFile(STAGE_HISTORY_FILE, JSON.stringify(data, null, 2), 'utf-8')
  } catch (error) {
    console.error('Error writing stage history file:', error)
    throw error
  }
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
    const stageHistory = await readStageHistory()
    
    // Get customer's history
    let customerHistory = stageHistory[customerId] || [];
    //console.log('Raw customer history:', customerHistory);

    // Ensure we have an array and sort by timestamp (newest first)
    if (Array.isArray(customerHistory)) {
      customerHistory = customerHistory.sort((a, b) => 
        new Date(b.timestamp) - new Date(a.timestamp)
      );
    } else {
      customerHistory = [];
    }

    //console.log('Processed customer history:', customerHistory);

    // Get current stage from most recent entry
    const currentStage = customerHistory.length > 0 ? customerHistory[0].stage : null;
    console.log('Current stage:', currentStage);

    return NextResponse.json({
      customerHistory,
      currentStage,
      totalItems: customerHistory.length
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

    //console.log('POST stage history - Request body:', { stage, notes, user, direction })

    if (!customerId || !stage) {
      return NextResponse.json(
        { error: 'Customer ID and stage are required' },
        { status: 400 }
      )
    }

    // Check file timestamp before reading
    await checkFileTimestamp(STAGE_HISTORY_FILE)

    const stageHistory = await readStageHistory()
    //console.log('Current stage history:', stageHistory)
    
    // Initialize customer history if it doesn't exist
    if (!stageHistory[customerId]) {
      console.log('Initializing history for customer:', customerId)
      stageHistory[customerId] = []
    }

    // Create new history entry
    const newEntry = {
      id: `SH${Date.now()}`,
      stage,
      timestamp: new Date().toISOString(),
      notes: notes || `Stage moved ${direction || 'to'} ${stage}`,
      user: user || 'System'
    }

    // Add versioning to the new entry
    addVersioningToRecord(newEntry)

    // Add to beginning of customer's history array (newest first)
    stageHistory[customerId].unshift(newEntry)

    await writeStageHistory(stageHistory)

    return NextResponse.json({
      customerHistory: stageHistory[customerId],
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
