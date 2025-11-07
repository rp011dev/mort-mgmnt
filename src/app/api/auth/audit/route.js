import { NextResponse } from 'next/server'
import { getUserFromRequest } from '@/utils/authMiddleware'
import { 
  getAuthAuditLogs, 
  getRecentFailedLogins, 
  getUserLoginStats 
} from '@/utils/authAuditManager'

export const dynamic = 'force-dynamic'

export async function GET(request) {
  try {
    // Check authentication
    const currentUser = getUserFromRequest(request)
    
    if (!currentUser) {
      return NextResponse.json(
        { error: 'Unauthorized - Valid token required' },
        { status: 401 }
      )
    }
    
    // Only admins can view audit logs
    if (currentUser.role !== 'admin') {
      return NextResponse.json(
        { error: 'Forbidden - Admin access required' },
        { status: 403 }
      )
    }
    
    const { searchParams } = new URL(request.url)
    
    // Get query parameters
    const action = searchParams.get('action') // 'logs', 'failedLogins', 'stats'
    const userId = searchParams.get('userId')
    const email = searchParams.get('email')
    const eventType = searchParams.get('eventType') // LOGIN_SUCCESS, LOGIN_FAILED, LOGOUT
    const success = searchParams.get('success') // 'true' or 'false'
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    const page = parseInt(searchParams.get('page')) || 1
    const limit = parseInt(searchParams.get('limit')) || 50
    
    // Handle different actions
    if (action === 'failedLogins' && email) {
      const hours = parseInt(searchParams.get('hours')) || 24
      const failedLogins = await getRecentFailedLogins(email, hours)
      
      return NextResponse.json({
        email,
        hours,
        failedLogins,
        count: failedLogins.length
      })
    }
    
    if (action === 'stats' && userId) {
      const days = parseInt(searchParams.get('days')) || 30
      const stats = await getUserLoginStats(userId, days)
      
      return NextResponse.json({
        userId,
        days,
        stats
      })
    }
    
    // Default: Get audit logs with filters
    const filters = {}
    
    if (userId) filters.userId = userId
    if (email) filters.email = email
    if (eventType) filters.eventType = eventType
    if (success !== null && success !== undefined) {
      filters.success = success === 'true'
    }
    if (startDate) filters.startDate = startDate
    if (endDate) filters.endDate = endDate
    
    const result = await getAuthAuditLogs(filters, { page, limit })
    
    return NextResponse.json(result)
    
  } catch (error) {
    console.error('Error fetching auth audit logs:', error)
    return NextResponse.json(
      { error: 'Failed to fetch audit logs' },
      { status: 500 }
    )
  }
}
