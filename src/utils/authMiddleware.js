import { NextResponse } from 'next/server'
import * as jose from 'jose'

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production'

/**
 * Verify and decode a JWT token (Edge Runtime compatible)
 * @param {string} token - JWT token
 * @returns {Promise<object|null>} - Decoded token payload or null if invalid
 */
export async function verifyTokenEdge(token) {
  try {
    const secret = new TextEncoder().encode(JWT_SECRET)
    const { payload } = await jose.jwtVerify(token, secret)
    return payload
  } catch (error) {
    console.error('Token verification failed:', error.message)
    return null
  }
}

/**
 * Extract token from Authorization header
 * @param {string} authHeader - Authorization header value
 * @returns {string|null} - Token or null
 */
export function extractToken(authHeader) {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null
  }
  return authHeader.substring(7)
}

/**
 * Extract and verify user from request headers (Edge Runtime compatible)
 * @param {Request} request - Next.js request object
 * @returns {Promise<Object|null>} - User object or null if invalid/missing token
 */
export async function getUserFromRequest(request) {
  try {
    const authHeader = request.headers.get('authorization')
    
    if (!authHeader) {
      return null
    }
    
    const token = extractToken(authHeader)
    
    if (!token) {
      return null
    }
    
    const decoded = await verifyTokenEdge(token)
    
    if (!decoded) {
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
 * Middleware to require authentication (Edge Runtime compatible)
 * Returns user if authenticated, otherwise returns error response
 * @param {Request} request - Next.js request object
 * @returns {Promise<Object>} - { user, error } where error is NextResponse if auth failed
 */
export async function requireAuth(request) {
  const user = await getUserFromRequest(request)
  
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
