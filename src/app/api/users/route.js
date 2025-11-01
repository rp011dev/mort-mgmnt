import { NextResponse } from 'next/server'
import { getCollection } from '../../../utils/mongoDb'
import { MONGODB_CONFIG } from '../../../config/dataConfig'
export const dynamic = 'force-dynamic'


// Get collection reference once
let usersColl = null

async function getUsersCollection() {
  if (!usersColl) {
    usersColl = await getCollection(MONGODB_CONFIG.collections.users)
  }
  return usersColl
}

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const activeOnly = searchParams.get('activeOnly')
    
    const usersCollection = await getUsersCollection()
    
    // Build query
    const query = activeOnly === 'true' ? { active: true } : {}
    
    // Fetch users from MongoDB
    let users = await usersCollection.find(query).toArray()
    
    // Remove passwords from response
    users = users.map(({ password, _id, ...user }) => user)
    
    return NextResponse.json(users)
  } catch (error) {
    console.error('Error reading users:', error)
    return NextResponse.json({ error: 'Failed to read users' }, { status: 500 })
  }
}

export async function POST(request) {
  try {
    const userData = await request.json()
    
    const usersCollection = await getUsersCollection()
    
    // Get the highest ID
    const lastUser = await usersCollection
      .find()
      .sort({ id: -1 })
      .limit(1)
      .toArray()
    
    const lastId = lastUser.length > 0 ? parseInt(lastUser[0].id) : 0
    const newId = String(lastId + 1)
    
    // Create new user
    const newUser = {
      id: newId,
      name: userData.name,
      email: userData.email,
      role: userData.role || 'Advisor',
      password: userData.password, // Should be hashed in production
      active: true
    }
    
    // Insert into MongoDB
    await usersCollection.insertOne(newUser)
    
    // Remove password from response
    const { password, _id, ...userWithoutPassword } = newUser
    
    return NextResponse.json(userWithoutPassword, { status: 201 })
  } catch (error) {
    console.error('Error creating user:', error)
    return NextResponse.json({ error: 'Failed to create user' }, { status: 500 })
  }
}

export async function PUT(request) {
  try {
    const { userId, updates } = await request.json()
    
    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 })
    }
    
    const usersCollection = await getUsersCollection()
    
    // Don't allow ID to be changed
    const { id, _id, ...updateData } = updates
    
    // Update user in MongoDB
    const result = await usersCollection.findOneAndUpdate(
      { id: userId },
      { $set: updateData },
      { returnDocument: 'after' }
    )
    
    if (!result) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }
    
    // Remove password from response
    const { password, _id: mongoId, ...userWithoutPassword } = result
    
    return NextResponse.json(userWithoutPassword)
  } catch (error) {
    console.error('Error updating user:', error)
    return NextResponse.json({ error: 'Failed to update user' }, { status: 500 })
  }
}
