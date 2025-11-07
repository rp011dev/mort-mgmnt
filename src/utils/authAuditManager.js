import { getCollection } from './mongoDb'
import { MONGODB_CONFIG } from '../config/dataConfig'

// Get collection reference
let authAuditCollection = null

async function getAuthAuditCollection() {
  if (!authAuditCollection) {
    authAuditCollection = await getCollection(MONGODB_CONFIG.collections.authAudit)
  }
  return authAuditCollection
}

/**
 * Extract request metadata for audit logging
 * @param {Request} request - Next.js request object
 * @returns {Object} - Metadata about the request
 */
function extractRequestMetadata(request) {
  const userAgent = request.headers.get('user-agent') || 'Unknown'
  const xForwardedFor = request.headers.get('x-forwarded-for')
  const xRealIp = request.headers.get('x-real-ip')
  
  // Determine IP address (priority: x-real-ip > x-forwarded-for > fallback)
  let ipAddress = 'Unknown'
  if (xRealIp) {
    ipAddress = xRealIp
  } else if (xForwardedFor) {
    // x-forwarded-for can be a comma-separated list, take the first one
    ipAddress = xForwardedFor.split(',')[0].trim()
  }
  
  return {
    ipAddress,
    userAgent,
    timestamp: new Date().toISOString()
  }
}

/**
 * Log a successful login attempt
 * @param {Object} user - User object (userId, email, name, role)
 * @param {Request} request - Next.js request object
 * @returns {Promise<Object>} - Inserted audit log
 */
export async function logSuccessfulLogin(user, request) {
  try {
    const collection = await getAuthAuditCollection()
    const metadata = extractRequestMetadata(request)
    
    const auditLog = {
      eventType: 'LOGIN_SUCCESS',
      userId: user.userId,
      email: user.email,
      userName: user.name,
      userRole: user.role,
      timestamp: metadata.timestamp,
      ipAddress: metadata.ipAddress,
      userAgent: metadata.userAgent,
      success: true,
      _version: 1
    }
    
    const result = await collection.insertOne(auditLog)
    console.log(`✅ Login audit logged for user: ${user.email}`)
    
    return { ...auditLog, _id: result.insertedId }
  } catch (error) {
    console.error('Error logging successful login:', error)
    // Don't throw - audit logging should not break the login flow
    return null
  }
}

/**
 * Log a failed login attempt
 * @param {string} email - Email address used in failed attempt
 * @param {string} reason - Reason for failure (e.g., 'Invalid credentials', 'User not found')
 * @param {Request} request - Next.js request object
 * @returns {Promise<Object>} - Inserted audit log
 */
export async function logFailedLogin(email, reason, request) {
  try {
    const collection = await getAuthAuditCollection()
    const metadata = extractRequestMetadata(request)
    
    const auditLog = {
      eventType: 'LOGIN_FAILED',
      email: email,
      failureReason: reason,
      timestamp: metadata.timestamp,
      ipAddress: metadata.ipAddress,
      userAgent: metadata.userAgent,
      success: false,
      _version: 1
    }
    
    const result = await collection.insertOne(auditLog)
    console.log(`⚠️ Failed login audit logged for email: ${email}, reason: ${reason}`)
    
    return { ...auditLog, _id: result.insertedId }
  } catch (error) {
    console.error('Error logging failed login:', error)
    // Don't throw - audit logging should not break the login flow
    return null
  }
}

/**
 * Log a logout event
 * @param {Object} user - User object (userId, email, name, role)
 * @param {Request} request - Next.js request object
 * @returns {Promise<Object>} - Inserted audit log
 */
export async function logLogout(user, request) {
  try {
    const collection = await getAuthAuditCollection()
    const metadata = extractRequestMetadata(request)
    
    const auditLog = {
      eventType: 'LOGOUT',
      userId: user.userId,
      email: user.email,
      userName: user.name,
      userRole: user.role,
      timestamp: metadata.timestamp,
      ipAddress: metadata.ipAddress,
      userAgent: metadata.userAgent,
      success: true,
      _version: 1
    }
    
    const result = await collection.insertOne(auditLog)
    console.log(`✅ Logout audit logged for user: ${user.email}`)
    
    return { ...auditLog, _id: result.insertedId }
  } catch (error) {
    console.error('Error logging logout:', error)
    // Don't throw - audit logging should not break the logout flow
    return null
  }
}

/**
 * Get authentication audit logs with filtering and pagination
 * @param {Object} filters - Filter options (userId, email, eventType, startDate, endDate)
 * @param {Object} pagination - Pagination options (page, limit)
 * @returns {Promise<Object>} - Paginated audit logs
 */
export async function getAuthAuditLogs(filters = {}, pagination = { page: 1, limit: 50 }) {
  try {
    const collection = await getAuthAuditCollection()
    const { page, limit } = pagination
    
    // Build query
    const query = {}
    
    if (filters.userId) {
      query.userId = filters.userId
    }
    
    if (filters.email) {
      query.email = { $regex: filters.email, $options: 'i' }
    }
    
    if (filters.eventType) {
      query.eventType = filters.eventType
    }
    
    if (filters.success !== undefined) {
      query.success = filters.success
    }
    
    if (filters.startDate || filters.endDate) {
      query.timestamp = {}
      if (filters.startDate) {
        query.timestamp.$gte = filters.startDate
      }
      if (filters.endDate) {
        query.timestamp.$lte = filters.endDate
      }
    }
    
    // Count total documents
    const totalLogs = await collection.countDocuments(query)
    const totalPages = Math.ceil(totalLogs / limit)
    
    // Get paginated results
    const logs = await collection
      .find(query, { projection: { _id: 0 } })
      .sort({ timestamp: -1 }) // Most recent first
      .skip((page - 1) * limit)
      .limit(limit)
      .toArray()
    
    return {
      logs,
      pagination: {
        currentPage: page,
        totalPages,
        totalLogs,
        logsPerPage: limit,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1
      }
    }
  } catch (error) {
    console.error('Error fetching auth audit logs:', error)
    throw error
  }
}

/**
 * Get failed login attempts for a specific email (useful for security monitoring)
 * @param {string} email - Email address to check
 * @param {number} hours - Number of hours to look back (default: 24)
 * @returns {Promise<Array>} - Failed login attempts
 */
export async function getRecentFailedLogins(email, hours = 24) {
  try {
    const collection = await getAuthAuditCollection()
    const cutoffTime = new Date()
    cutoffTime.setHours(cutoffTime.getHours() - hours)
    
    const failedLogins = await collection
      .find({
        email: email,
        eventType: 'LOGIN_FAILED',
        timestamp: { $gte: cutoffTime.toISOString() }
      })
      .sort({ timestamp: -1 })
      .toArray()
    
    return failedLogins
  } catch (error) {
    console.error('Error fetching recent failed logins:', error)
    return []
  }
}

/**
 * Get login statistics for a user
 * @param {string} userId - User ID
 * @param {number} days - Number of days to analyze (default: 30)
 * @returns {Promise<Object>} - Login statistics
 */
export async function getUserLoginStats(userId, days = 30) {
  try {
    const collection = await getAuthAuditCollection()
    const cutoffTime = new Date()
    cutoffTime.setDate(cutoffTime.getDate() - days)
    
    const logs = await collection
      .find({
        userId: userId,
        timestamp: { $gte: cutoffTime.toISOString() }
      })
      .toArray()
    
    const stats = {
      totalLogins: logs.filter(log => log.eventType === 'LOGIN_SUCCESS').length,
      totalLogouts: logs.filter(log => log.eventType === 'LOGOUT').length,
      failedAttempts: logs.filter(log => log.eventType === 'LOGIN_FAILED').length,
      lastLogin: logs.find(log => log.eventType === 'LOGIN_SUCCESS')?.timestamp || null,
      lastLogout: logs.find(log => log.eventType === 'LOGOUT')?.timestamp || null,
      uniqueIPs: [...new Set(logs.map(log => log.ipAddress))].length
    }
    
    return stats
  } catch (error) {
    console.error('Error fetching user login stats:', error)
    return null
  }
}
