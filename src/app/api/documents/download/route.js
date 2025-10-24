import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs/promises'
import path from 'path'
import { getOneDriveDocumentsPath } from '../../../../config/dataConfig.js'

// Tell Next.js this is a dynamic route
export const dynamic = 'force-dynamic'

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

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const customerId = searchParams.get('customerId')
    const filename = searchParams.get('filename')
    const isView = searchParams.get('view') === 'true'
    
    if (!customerId || !filename) {
      return NextResponse.json({ error: 'Customer ID and filename are required' }, { status: 400 })
    }

    const documentsDir = getDocumentsDir()
    const customerDir = path.join(documentsDir, customerId)
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
    
    // Read file
    const fileBuffer = await fs.readFile(filePath)
    
    // Get file extension for content type
    const extension = path.extname(filename).toLowerCase()
    let contentType = 'application/octet-stream'
    
    switch (extension) {
      case '.pdf': contentType = 'application/pdf'; break
      case '.jpg':
      case '.jpeg': contentType = 'image/jpeg'; break
      case '.png': contentType = 'image/png'; break
      case '.gif': contentType = 'image/gif'; break
      case '.doc': contentType = 'application/msword'; break
      case '.docx': contentType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'; break
      case '.txt': contentType = 'text/plain'; break
    }
    
    // Return file with appropriate headers
    const disposition = isView ? 'inline' : 'attachment'
    return new NextResponse(fileBuffer, {
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `${disposition}; filename="${filename}"`,
        'Content-Length': fileBuffer.length.toString(),
      },
    })
  } catch (error) {
    console.error('Error downloading document:', error)
    return NextResponse.json({ error: 'Failed to download document' }, { status: 500 })
  }
}
