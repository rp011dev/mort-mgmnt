// Notes management utility - now uses API to save to JSON file

export const getCustomerNotes = async (customerId) => {
  try {
    const response = await fetch(`/api/notes?customerId=${customerId}`)
    const notes = await response.json()
    
    if (!response.ok) {
      throw new Error(notes.error || 'Failed to fetch notes')
    }
    
    // Sort notes by timestamp (newest first)
    return notes.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
  } catch (error) {
    console.error('Error fetching notes:', error)
    return []
  }
}

export const addCustomerNote = async (customerId, note, author = 'Current User', stage = null) => {
  try {
    const response = await fetch('/api/notes', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        customerId,
        note,
        author,
        stage
      })
    })
    
    if (!response.ok) {
      throw new Error('Failed to save note')
    }
    
    const newNote = await response.json()
    return newNote
  } catch (error) {
    console.error('Error adding note:', error)
    throw error
  }
}

export const getAllNotes = async () => {
  try {
    // Fetch all notes (no customerId parameter)
    const response = await fetch('/api/notes')
    const notes = await response.json()
    
    if (!response.ok) {
      throw new Error(notes.error || 'Failed to fetch all notes')
    }
    
    return notes
  } catch (error) {
    console.error('Error fetching all notes:', error)
    return {}
  }
}

export const getNotesCount = async (customerId) => {
  const notes = await getCustomerNotes(customerId)
  return notes.length
}

export const getLatestNote = async (customerId) => {
  const notes = await getCustomerNotes(customerId)
  if (notes.length === 0) return null
  
  return notes.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))[0]
}
