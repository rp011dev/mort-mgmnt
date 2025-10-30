import { NextResponse } from 'next/server'
import { getCollection } from '@/utils/mongoDb'
import { MONGODB_CONFIG } from '@/config/dataConfig'
import { verifyPassword, generateToken } from '@/utils/auth'

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
    console.log('Login attempt for email:', email, 'password =? ', password);
    // Validate input
    if (!email || !password) {
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
    console.log('User found:', user)
    
    if (!user) {
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      )
    }
    
    // Verify password
    const isPasswordValid = await verifyPassword(password, user.password)
    
    if (!isPasswordValid) {
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      )
    }
    
    // Generate JWT token
    const token = generateToken({
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role
    })
    
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
    return NextResponse.json(
      { error: 'Login failed. Please try again.' },
      { status: 500 }
    )
  }
}
