import { NextResponse } from 'next/server'
import { getCollection } from '@/utils/mongoDb'
import { MONGODB_CONFIG } from '@/config/dataConfig'
import { verifyPassword, generateToken } from '@/utils/auth'
import { logSuccessfulLogin, logFailedLogin } from '@/utils/authAuditManager'
export const dynamic = 'force-dynamic'


let usersCollection = null

async function getUsersCollection() {
  if (!usersCollection) {
    usersCollection = await getCollection(MONGODB_CONFIG.collections.user)
  }
  return usersCollection
}

export async function POST(request) {
  try {
    const { email, password } = await request.json()
    console.log('Login attempt for email:', email)
    
    // Validate input
    if (!email || !password) {
      await logFailedLogin(email || 'unknown', 'Missing email or password', request)
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      )
    }
    
    const usersCollection = await getUsersCollection()
    
    // Find user by email
    const user = await usersCollection.findOne({ 
      email: email.toLowerCase(),
      active: true 
    })
    console.log('User found:', user ? 'Yes' : 'No')
    
    if (!user) {
      // Log failed login - user not found
      await logFailedLogin(email, 'User not found or inactive', request)
      
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      )
    }
    
    // Verify password
    const isPasswordValid = await verifyPassword(password, user.password)
    
    if (!isPasswordValid) {
      // Log failed login - invalid password
      await logFailedLogin(email, 'Invalid password', request)
      
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      )
    }
    
    // Generate JWT token
    const token = generateToken({
      userId: user.id,
      email: user.email,
      name: user.name,
      role: user.role
    })
    
    // Log successful login
    await logSuccessfulLogin({
      userId: user.id,
      email: user.email,
      name: user.name,
      role: user.role
    }, request)
    
    // Return token and user info (without password)
    return NextResponse.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role
      }
    })
    
  } catch (error) {
    console.error('Login error:', error)
    
    // Log failed login - system error
    try {
      const { email } = await request.json()
      await logFailedLogin(email || 'unknown', `System error: ${error.message}`, request)
    } catch {
      // Ignore if we can't parse the request again
    }
    
    return NextResponse.json(
      { error: 'Login failed. Please try again.' },
      { status: 500 }
    )
  }
}
