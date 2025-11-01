import { NextResponse } from 'next/server'
import { getCollection } from '../../../utils/mongoDb'
import { MONGODB_CONFIG } from '../../../config/dataConfig'
import { 
  ConcurrencyError, 
  createConflictResponse 
} from '../../../utils/concurrencyManager.js'
import { getUserFromRequest, createAuditFields } from '../../../utils/authMiddleware'
export const dynamic = 'force-dynamic'


// Get collection reference once
let notesCollection = null

async function getNotesCollection() {
  if (!notesCollection) {
    notesCollection = await getCollection(MONGODB_CONFIG.collections.notes)
  }
  return notesCollection
}

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const customerId = searchParams.get('customerId')
    const enquiryId = searchParams.get('enquiryId')
    const noteId = searchParams.get('noteId')
    const page = parseInt(searchParams.get('page')) || 1
    const limit = parseInt(searchParams.get('limit')) || 10
    const sortOrder = searchParams.get('sortOrder') || 'desc' // desc = newest first, asc = oldest first
    
    const collection = await getNotesCollection()
    
    // Build query filter
    let query = {}
    
    // Determine referenceId (customerId or enquiryId)
    const referenceId = customerId || enquiryId
    
    if (referenceId) {
      query.referenceId = referenceId
    }
    
    // If specific noteId is requested
    if (noteId) {
      query.id = noteId
      const note = await collection.findOne(query, { projection: { _id: 0 } })
      if (note) {
        return NextResponse.json(note)
      }
      return NextResponse.json({ error: 'Note not found' }, { status: 404 })
    }
    
    // Count total notes for pagination
    const totalNotes = await collection.countDocuments(query)
    const totalPages = Math.ceil(totalNotes / limit)
    const startIndex = (page - 1) * limit
    
    // Determine sort order
    const sortDirection = sortOrder === 'desc' ? -1 : 1
    
    // Get paginated notes
    const notes = await collection.find(query, {
      projection: { _id: 0 }
    })
    .sort({ timestamp: sortDirection })
    .skip(startIndex)
    .limit(limit)
    .toArray()
    
    // Return paginated response
    return NextResponse.json({
      notes: notes,
      pagination: {
        currentPage: page,
        totalPages: totalPages,
        totalNotes: totalNotes,
        notesPerPage: limit,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
        startIndex: startIndex + 1,
        endIndex: Math.min(startIndex + notes.length, totalNotes)
      }
    })
  } catch (error) {
    console.error('Error reading notes:', error)
    return NextResponse.json({ error: 'Failed to read notes' }, { status: 500 })
  }
}

export async function POST(request) {
  try {
    // Extract user from token for audit trail
    const user = getUserFromRequest(request)
    
    const { customerId, enquiryId, note, author, stage } = await request.json()
    
    // Determine the referenceId (either customerId or enquiryId)
    const referenceId = customerId || enquiryId
    
    if (!referenceId) {
      return NextResponse.json({ 
        error: 'Either customerId or enquiryId must be provided' 
      }, { status: 400 })
    }
    
    if (!note) {
      return NextResponse.json({ 
        error: 'Note content is required' 
      }, { status: 400 })
    }
    
    const collection = await getNotesCollection()
    
    // Find the highest note ID to generate the next one
    const lastNote = await collection.find({})
      .sort({ id: -1 })
      .limit(1)
      .toArray()
    
    // Extract numeric part from id (e.g., "NOTE123" -> 123)
    let nextNoteNumber = 1
    if (lastNote.length > 0 && lastNote[0].id) {
      const lastNoteNumber = parseInt(lastNote[0].id.replace(/^NOTE/, '')) || 0
      nextNoteNumber = lastNoteNumber + 1
    }
    
    const newNoteId = `NOTE${nextNoteNumber}`
    const currentTimestamp = new Date().toISOString()
    
    // Use logged-in user's name or provided author or fallback
    const noteAuthor = user ? (user.name || user.email) : (author || 'System')
    
    // Add audit trail fields
    const auditFields = user ? createAuditFields(user, true) : {
      _createdBy: noteAuthor,
      _createdAt: currentTimestamp,
      _modifiedBy: noteAuthor,
      _lastModified: currentTimestamp
    }
    
    // Generate new note
    const newNote = {
      id: newNoteId,
      referenceId: referenceId,
      author: noteAuthor,
      stage: stage || null,
      note: note,
      timestamp: currentTimestamp,
      ...auditFields,
      _version: 1
    }
    
    // Insert the note
    const result = await collection.insertOne(newNote)
    
    if (result.acknowledged) {
      return NextResponse.json({
        success: true,
        message: 'Note added successfully',
        note: newNote,
        noteId: newNoteId,
        _id: result.insertedId
      })
    } else {
      return NextResponse.json({ error: 'Failed to save note' }, { status: 500 })
    }
  } catch (error) {
    if (error instanceof ConcurrencyError) {
      return createConflictResponse(error.message, error.conflictData)
    }
    console.error('Error saving note:', error)
    return NextResponse.json({ error: 'Failed to save note' }, { status: 500 })
  }
}

export async function PUT(request) {
  try {
    // Extract user from token for audit trail
    const user = getUserFromRequest(request)
    
    const { noteId, referenceId, note, author, stage, version } = await request.json()
    
    if (!noteId || !referenceId) {
      return NextResponse.json({ 
        error: 'NoteId and referenceId are required' 
      }, { status: 400 })
    }
    
    const collection = await getNotesCollection()
    
    // Find current note using both noteId and referenceId
    const currentNote = await collection.findOne({ 
      id: noteId,
      referenceId: referenceId 
    })
    
    if (!currentNote) {
      return NextResponse.json({ error: 'Note not found' }, { status: 404 })
    }
    
    // Validate version for concurrency control
    if (version && currentNote._version !== version) {
      return createConflictResponse('Version mismatch', {
        serverVersion: currentNote._version,
        clientVersion: version,
        serverData: currentNote
      })
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
    
    // Prepare update data
    const updateData = {
      ...auditFields,
      _version: (currentNote._version || 0) + 1
    }
    
    // Only update fields that are provided
    if (note !== undefined) updateData.note = note
    if (author !== undefined) updateData.author = author
    if (stage !== undefined) updateData.stage = stage
    
    // Update the note with version check
    const result = await collection.findOneAndUpdate(
      { 
        id: noteId,
        referenceId: referenceId,
        _version: version || currentNote._version 
      },
      { $set: updateData },
      { returnDocument: 'after' }
    )
    
    if (!result) {
      return NextResponse.json({ 
        error: 'Failed to update note, possible concurrent modification' 
      }, { status: 409 })
    }
    
    return NextResponse.json({
      success: true,
      message: 'Note updated successfully',
      note: result
    })
  } catch (error) {
    if (error instanceof ConcurrencyError) {
      return createConflictResponse(error.message, error.conflictData)
    }
    console.error('Error updating note:', error)
    return NextResponse.json({ error: 'Failed to update note' }, { status: 500 })
  }
}

export async function DELETE(request) {
  try {
    const { searchParams } = new URL(request.url)
    const noteId = searchParams.get('noteId')
    const referenceId = searchParams.get('referenceId')
    const version = searchParams.get('version')
    
    if (!noteId || !referenceId) {
      return NextResponse.json({ 
        error: 'NoteId and referenceId are required' 
      }, { status: 400 })
    }
    
    const collection = await getNotesCollection()
    
    // Find current note first to check version
    const currentNote = await collection.findOne({ 
      id: noteId,
      referenceId: referenceId 
    })
    
    if (!currentNote) {
      return NextResponse.json({ error: 'Note not found' }, { status: 404 })
    }
    
    // Validate version for concurrency control
    if (version && currentNote._version !== parseInt(version)) {
      return createConflictResponse('Version mismatch', {
        serverVersion: currentNote._version,
        clientVersion: parseInt(version),
        serverData: currentNote
      })
    }
    
    // Delete the note with version check
    const result = await collection.deleteOne({ 
      id: noteId,
      referenceId: referenceId,
      _version: version ? parseInt(version) : currentNote._version
    })
    
    if (result.deletedCount === 0) {
      return NextResponse.json({ 
        error: 'Failed to delete note, possible concurrent modification' 
      }, { status: 409 })
    }
    
    return NextResponse.json({ 
      success: true,
      message: 'Note deleted successfully'
    })
  } catch (error) {
    if (error instanceof ConcurrencyError) {
      return createConflictResponse(error.message, error.conflictData)
    }
    console.error('Error deleting note:', error)
    return NextResponse.json({ error: 'Failed to delete note' }, { status: 500 })
  }
}
