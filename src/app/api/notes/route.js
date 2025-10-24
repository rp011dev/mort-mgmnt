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

const notesFilePath = DATA_PATHS.notes

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const customerId = searchParams.get('customerId')
    const enquiryId = searchParams.get('enquiryId')
    const page = parseInt(searchParams.get('page')) || 1
    const limit = parseInt(searchParams.get('limit')) || 10
    const sortOrder = searchParams.get('sortOrder') || 'desc' // desc = newest first, asc = oldest first
    
    const fileContents = fs.readFileSync(notesFilePath, 'utf8')
    const notes = JSON.parse(fileContents)
    
    let targetNotes = []
    
    // Get notes for specific customer or enquiry
    if (customerId) {
      targetNotes = notes[customerId] || []
    } else if (enquiryId) {
      targetNotes = notes[enquiryId] || []
    } else {
      // If no specific ID, return all notes flattened
      targetNotes = Object.values(notes).flat()
    }
    
    // Sort notes by timestamp
    const sortedNotes = [...targetNotes].sort((a, b) => {
      const dateA = new Date(a.timestamp)
      const dateB = new Date(b.timestamp)
      return sortOrder === 'desc' ? dateB - dateA : dateA - dateB
    })
    
    // Calculate pagination
    const totalNotes = sortedNotes.length
    const totalPages = Math.ceil(totalNotes / limit)
    const startIndex = (page - 1) * limit
    const endIndex = startIndex + limit
    const paginatedNotes = sortedNotes.slice(startIndex, endIndex)
    
    // Return paginated response
    return NextResponse.json({
      notes: paginatedNotes,
      pagination: {
        currentPage: page,
        totalPages: totalPages,
        totalNotes: totalNotes,
        notesPerPage: limit,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
        startIndex: startIndex + 1,
        endIndex: Math.min(endIndex, totalNotes)
      }
    })
  } catch (error) {
    console.error('Error reading notes:', error)
    return NextResponse.json({ error: 'Failed to read notes' }, { status: 500 })
  }
}

export async function POST(request) {
  try {
    const { customerId, enquiryId, note, author, stage } = await request.json()
    
    // Determine the target ID (either customerId or enquiryId)
    const targetId = customerId || enquiryId
    
    if (!targetId) {
      return NextResponse.json({ error: 'Either customerId or enquiryId must be provided' }, { status: 400 })
    }
    
    // Check file timestamp before reading
    await checkFileTimestamp(notesFilePath)
    
    // Read current notes
    const fileContents = fs.readFileSync(notesFilePath, 'utf8')
    const notes = JSON.parse(fileContents)
    
    // Generate new note
    const newNote = {
      id: `NOTE${Date.now()}`,
      author: author || 'Current User',
      stage: stage,
      note: note,
      timestamp: new Date().toISOString()
    }
    
    // Add versioning to the new note
    addVersioningToRecord(newNote)
    
    // Add note to customer or enquiry
    if (!notes[targetId]) {
      notes[targetId] = []
    }
    notes[targetId].push(newNote)
    
    // Write back to file
    fs.writeFileSync(notesFilePath, JSON.stringify(notes, null, 2))
    
    return NextResponse.json(newNote)
  } catch (error) {
    if (error instanceof ConcurrencyError) {
      return createConflictResponse(error.message, error.conflictData)
    }
    console.error('Error saving note:', error)
    return NextResponse.json({ error: 'Failed to save note' }, { status: 500 })
  }
}
