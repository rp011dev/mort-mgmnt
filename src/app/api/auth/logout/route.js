import { NextResponse } from 'next/server'
import { getUserFromRequest } from '@/utils/authMiddleware'
import { logLogout } from '@/utils/authAuditManager'
export const dynamic = 'force-dynamic'


export async function POST(request) {
  try {
    // Extract user from JWT token
    const user = getUserFromRequest(request)
    
    if (!user) {
      return NextResponse.json(
        { error: 'No active session found' },
        { status: 401 }
      )
    }
    
    // Log the logout event
    await logLogout(user, request)
    
    // Return success response
    return NextResponse.json({
      success: true,
      message: 'Logged out successfully'
    })
    
  } catch (error) {
    console.error('Logout error:', error)
    return NextResponse.json(
      { error: 'Logout failed. Please try again.' },
      { status: 500 }
    )
  }
}
