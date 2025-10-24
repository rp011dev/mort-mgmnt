// Concurrency management utility for optimistic locking
import fs from 'fs'

export class ConcurrencyError extends Error {
  constructor(message, currentData, conflictDetails) {
    super(message)
    this.name = 'ConcurrencyError'
    this.currentData = currentData
    this.conflictDetails = conflictDetails
    this.isConflict = true
  }
}

export function addVersioningToRecord(record, userId = 'System Migration') {
  const now = new Date().toISOString()
  
  // Modify the record in place and also return it
  record._version = (record._version || 0) + 1
  record._lastModified = now
  record._modifiedBy = userId
  
  // Set creation info if not exists
  if (!record._createdAt) {
    record._createdAt = record.createdAt || now
    record._createdBy = userId
  }
  
  return record
}

export function validateVersion(currentRecord, clientVersion, recordType = 'record') {
  // If no version info provided, allow the update (backward compatibility)
  if (!clientVersion && !currentRecord._version) {
    return true
  }

  // Check version-based conflict
  if (clientVersion && 
      currentRecord._version !== clientVersion) {
    throw new ConcurrencyError(
      `${recordType} has been modified by another user`,
      currentRecord,
      {
        expectedVersion: clientVersion,
        actualVersion: currentRecord._version,
        lastModified: currentRecord._lastModified,
        lastModifiedBy: currentRecord._modifiedBy
      }
    )
  }

  return true
}

export function checkFileTimestamp(filePath, expectedTimestamp) {
  try {
    const stats = fs.statSync(filePath)
    const actualTimestamp = stats.mtime.toISOString()
    
    if (expectedTimestamp && expectedTimestamp !== actualTimestamp) {
      throw new ConcurrencyError(
        'Data file has been modified by another user',
        null,
        {
          expectedFileTimestamp: expectedTimestamp,
          actualFileTimestamp: actualTimestamp
        }
      )
    }
    
    return actualTimestamp
  } catch (error) {
    if (error instanceof ConcurrencyError) {
      throw error
    }
    // File doesn't exist or other error, allow operation
    return new Date().toISOString()
  }
}

export function getCurrentUser(request) {
  // Extract user from headers, session, or auth token
  // For now, return a default user - this should be replaced with actual auth
  const userAgent = request?.headers?.get('user-agent') || 'unknown'
  const xForwardedFor = request?.headers?.get('x-forwarded-for')
  const userIp = xForwardedFor || 'localhost'
  
  // This is a placeholder - in a real app, you'd get this from JWT token or session
  return {
    id: 'user_' + Buffer.from(userAgent + userIp).toString('base64').substring(0, 8),
    name: 'Current User',
    email: 'user@gkfinance.com'
  }
}

export function createConflictResponse(error) {
  return {
    error: 'CONFLICT',
    type: 'concurrency_conflict',
    message: error.message,
    currentData: error.currentData,
    conflictDetails: error.conflictDetails,
    requiresUserAction: true,
    timestamp: new Date().toISOString()
  }
}
