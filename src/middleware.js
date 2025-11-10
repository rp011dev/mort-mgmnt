import { NextResponse } from 'next/server'
import { verifyTokenEdge } from './utils/authMiddleware'

// List of API routes that DON'T require authentication
const PUBLIC_API_ROUTES = [
  '/api/auth/login',
  '/api/auth/verify',
  '/api/enquiries/webhook', // External webhook from Microsoft Forms
  '/api/documents-gridfs/download', // Handles auth via query param token
]

// List of routes that should bypass middleware entirely
const EXCLUDED_ROUTES = [
  '/_next',
  '/favicon.ico',
  '/static',
  '/images',
]

export async function middleware(request) {
  const { pathname } = request.nextUrl

  // Skip middleware for excluded routes
  if (EXCLUDED_ROUTES.some(route => pathname.startsWith(route))) {
    return NextResponse.next()
  }

  // Check if this is an API route
  if (pathname.startsWith('/api')) {
    // Allow public API routes
    if (PUBLIC_API_ROUTES.some(route => pathname.startsWith(route))) {
      return NextResponse.next()
    }

    // All other API routes require authentication
    const authHeader = request.headers.get('authorization')
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.warn(`[Auth] Unauthorized API access attempt: ${pathname}`)
      return NextResponse.json(
        { 
          error: 'Unauthorized - Authentication required',
          message: 'Please login to access this resource'
        },
        { status: 401 }
      )
    }

    const token = authHeader.substring(7) // Remove "Bearer " prefix
    
    try {
      const decoded = await verifyTokenEdge(token)
      
      if (!decoded) {
        console.warn(`[Auth] Invalid token for API access: ${pathname}`)
        return NextResponse.json(
          { 
            error: 'Unauthorized - Invalid or expired token',
            message: 'Your session has expired. Please login again.'
          },
          { status: 401 }
        )
      }

      // Token is valid, allow the request to proceed
      // Add user info to headers for downstream use
      const response = NextResponse.next()
      response.headers.set('x-user-id', decoded.userId)
      response.headers.set('x-user-email', decoded.email)
      response.headers.set('x-user-name', decoded.name)
      response.headers.set('x-user-role', decoded.role)
      
      console.log(`[Auth] Authenticated API access: ${pathname} by ${decoded.email}`)
      return response
      
    } catch (error) {
      console.error('[Auth] Token verification failed:', error.message)
      return NextResponse.json(
        { 
          error: 'Unauthorized - Token verification failed',
          message: 'Invalid authentication token'
        },
        { status: 401 }
      )
    }
  }

  // For non-API routes, just proceed normally
  return NextResponse.next()
}

// Configure which routes the middleware should run on
export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
}
