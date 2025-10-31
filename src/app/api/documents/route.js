import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs/promises'
import path from 'path'
import { getOneDriveDocumentsPath } from '../../../config/dataConfig.js'

// OneDrive documents directory
const getDocumentsDir = () => {
  try {
    return getOneDriveDocumentsPath()
  } catch (error) {
    console.error('OneDrive not available, falling back to local storage:', error.message)
    // Fallback to local storage if OneDrive is not available
    return path.join(process.cwd(), 'public', 'documents')
  }
}

// Ensure documents directory exists
async function ensureDocumentsDir() {
  const documentsDir = getDocumentsDir()
  try {
    await fs.access(documentsDir)
  } catch {
    await fs.mkdir(documentsDir, { recursive: true })
  }
  return documentsDir
}

// Ensure customer directory exists
async function ensureCustomerDir(customerId) {
  const documentsDir = await ensureDocumentsDir()
  const customerDir = path.join(documentsDir, customerId)
  try {
    await fs.access(customerDir)
  } catch {
    await fs.mkdir(customerDir, { recursive: true })
  }
  return customerDir
}

// GET - List documents for a customer
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const customerId = searchParams.get('customerId')
    
    if (!customerId) {
      return NextResponse.json({ error: 'Customer ID is required' }, { status: 400 })
    }

    await ensureDocumentsDir()
    const customerDir = await ensureCustomerDir(customerId)
    
    try {
      const files = await fs.readdir(customerDir)
      const documents = []
      
      for (const file of files) {
        const filePath = path.join(customerDir, file)
        const stats = await fs.stat(filePath)
        
        documents.push({
          name: file,
          size: stats.size,
          uploadDate: stats.birthtime.toISOString()
        })
      }
      
      // Sort by upload date (newest first)
      documents.sort((a, b) => new Date(b.uploadDate) - new Date(a.uploadDate))
      
      return NextResponse.json({ documents })
    } catch (error) {
      return NextResponse.json({ documents: [] })
    }
  } catch (error) {
    console.error('Error listing documents:', error)
    return NextResponse.json({ error: 'Failed to list documents' }, { status: 500 })
  }
}

// POST - Upload documents
export async function POST(request) {
  try {
    const formData = await request.formData()
    const customerId = formData.get('customerId')
    const files = formData.getAll('files')
    
    if (!customerId) {
      return NextResponse.json({ error: 'Customer ID is required' }, { status: 400 })
    }
    
    if (!files || files.length === 0) {
      return NextResponse.json({ error: 'No files provided' }, { status: 400 })
    }

    await ensureDocumentsDir()
    const customerDir = await ensureCustomerDir(customerId)
    
    const uploadedFiles = []
    
    for (const file of files) {
      if (file.size === 0) continue
      
      // Get file extension and validate
      const extension = path.extname(file.name).toLowerCase()
      const allowedExtensions = ['.pdf', '.jpg', '.jpeg', '.png', '.doc', '.docx', '.txt']
      
      if (!allowedExtensions.includes(extension)) {
        return NextResponse.json({ 
          error: `File type ${extension} is not allowed.` 
        }, { status: 400 })
      }
      
      // Save file
      const filePath = path.join(customerDir, file.name)
      const arrayBuffer = await file.arrayBuffer()
      const buffer = Buffer.from(arrayBuffer)
      
      await fs.writeFile(filePath, buffer)
      uploadedFiles.push(file.name)
    }
    
    return NextResponse.json({ 
      message: 'Files uploaded successfully',
      files: uploadedFiles
    })
  } catch (error) {
    console.error('Error uploading documents:', error)
    return NextResponse.json({ error: 'Failed to upload documents' }, { status: 500 })
  }
}

// DELETE - Delete a document
export async function DELETE(request) {
  try {
    const { searchParams } = new URL(request.url)
    const customerId = searchParams.get('customerId')
    const filename = searchParams.get('filename')
    
    if (!customerId || !filename) {
      return NextResponse.json({ error: 'Customer ID and filename are required' }, { status: 400 })
    }

    const customerDir = await ensureCustomerDir(customerId)
    const filePath = path.join(customerDir, filename)
    
    // Security check - ensure the file is within the customer directory
    const resolvedPath = path.resolve(filePath)
    const resolvedCustomerDir = path.resolve(customerDir)
    
    if (!resolvedPath.startsWith(resolvedCustomerDir)) {
      return NextResponse.json({ error: 'Invalid file path' }, { status: 400 })
    }
    
    // Check if file exists
    try {
      await fs.access(filePath)
    } catch {
      return NextResponse.json({ error: 'File not found' }, { status: 404 })
    }
    
    // Delete file
    await fs.unlink(filePath)
    
    return NextResponse.json({ message: 'File deleted successfully' })
  } catch (error) {
    console.error('Error deleting document:', error)
    return NextResponse.json({ error: 'Failed to delete document' }, { status: 500 })
  }
}
