import { NextResponse } from 'next/server'
import { verifyToken, extractToken } from './auth'

/**
 * Extract and verify user from request headers
 * @param {Request} request - Next.js request object
 * @returns {Object|null} - User object or null if invalid/missing token
 */
export function getUserFromRequest(request) {
  try {
    const authHeader = request.headers.get('authorization')
    
    if (!authHeader) {
      console.log('No authorization header found')
      return null
    }
    
    const token = extractToken(authHeader)
    
    if (!token) {
      console.log('No token extracted from authorization header')
      return null
    }
    
    const decoded = verifyToken(token)
    
    if (!decoded) {
      console.log('Token verification failed')
      return null
    }
    
    // Return user info from token
    return {
      userId: decoded.userId,
      email: decoded.email,
      name: decoded.name,
      role: decoded.role
    }
  } catch (error) {
    console.error('Error extracting user from request:', error)
    return null
  }
}

/**
 * Middleware to require authentication
 * Returns user if authenticated, otherwise returns error response
 * @param {Request} request - Next.js request object
 * @returns {Object} - { user, error } where error is NextResponse if auth failed
 */
export function requireAuth(request) {
  const user = getUserFromRequest(request)
  
  if (!user) {
    return {
      user: null,
      error: NextResponse.json(
        { error: 'Unauthorized - Valid token required' },
        { status: 401 }
      )
    }
  }
  
  return { user, error: null }
}

/**
 * Create audit trail fields for database operations
 * @param {Object} user - User object from token
 * @param {boolean} isCreate - Whether this is a create operation (vs update)
 * @returns {Object} - Audit fields to include in database operation
 */
export function createAuditFields(user, isCreate = false) {
  const timestamp = new Date().toISOString()
  
  const auditFields = {
    _modifiedBy: user.name || user.email,
    _lastModified: timestamp
  }
  
  if (isCreate) {
    auditFields._createdBy = user.name || user.email
    auditFields._createdAt = timestamp
  }
  
  return auditFields
}
