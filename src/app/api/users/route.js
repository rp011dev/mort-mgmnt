import { NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'
import { DATA_PATHS } from '../../../config/dataConfig.js'

const usersFilePath = DATA_PATHS.users

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const activeOnly = searchParams.get('activeOnly')
    
    const fileContents = fs.readFileSync(usersFilePath, 'utf8')
    let users = JSON.parse(fileContents)
    
    // Filter for active users only if requested
    if (activeOnly === 'true') {
      users = users.filter(user => user.active === true)
    }
    
    return NextResponse.json(users)
  } catch (error) {
    console.error('Error reading users:', error)
    return NextResponse.json({ error: 'Failed to read users' }, { status: 500 })
  }
}

export async function POST(request) {
  try {
    const userData = await request.json()
    
    // Read current users
    const fileContents = fs.readFileSync(usersFilePath, 'utf8')
    const users = JSON.parse(fileContents)
    
    // Generate new user ID
    const newId = `user${String(users.length + 1).padStart(3, '0')}`
    
    // Create new user
    const newUser = {
      id: newId,
      ...userData,
      active: true
    }
    
    // Add to users array
    users.push(newUser)
    
    // Write back to file
    fs.writeFileSync(usersFilePath, JSON.stringify(users, null, 2))
    
    return NextResponse.json(newUser, { status: 201 })
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
    
    // Read current users
    const fileContents = fs.readFileSync(usersFilePath, 'utf8')
    const users = JSON.parse(fileContents)
    
    // Find and update the user
    const userIndex = users.findIndex(u => u.id === userId)
    if (userIndex === -1) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }
    
    // Update the user while preserving the ID
    users[userIndex] = {
      ...users[userIndex],
      ...updates,
      id: userId // Ensure ID doesn't change
    }
    
    // Write back to file
    fs.writeFileSync(usersFilePath, JSON.stringify(users, null, 2))
    
    return NextResponse.json(users[userIndex])
  } catch (error) {
    console.error('Error updating user:', error)
    return NextResponse.json({ error: 'Failed to update user' }, { status: 500 })
  }
}
