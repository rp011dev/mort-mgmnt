import { NextResponse } from 'next/server'
import { getUserFromRequest } from '@/utils/authMiddleware'
import { downloadFileFromGridFS } from '@/utils/gridFsManager'

/**
 * GET - Download a document
 * Query params:
 * - fileId: File ID to download
 */
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const fileId = searchParams.get('fileId')
    const tokenFromQuery = searchParams.get('token')
    const view = searchParams.get('view') === 'true'

    // Check authentication - support token in query param for downloads
    let user = getUserFromRequest(request)
    
    // If no user from header, try query param token
    if (!user && tokenFromQuery) {
      // Validate token from query param
      const jwt = require('jsonwebtoken')
      try {
        user = jwt.verify(tokenFromQuery, process.env.JWT_SECRET || 'your-secret-key-change-in-production')
      } catch (err) {
        return NextResponse.json(
          { error: 'Invalid token' },
          { status: 401 }
        )
      }
    }
    
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized - Valid token required' },
        { status: 401 }
      )
    }

    if (!fileId) {
      return NextResponse.json(
        { error: 'Missing required parameter: fileId' },
        { status: 400 }
      )
    }

    // Get file from GridFS
    const { stream, metadata } = await downloadFileFromGridFS(fileId)

    // Convert stream to buffer
    const chunks = []
    for await (const chunk of stream) {
      chunks.push(chunk)
    }
    const buffer = Buffer.concat(chunks)

    // Return file with appropriate headers
    const disposition = view ? 'inline' : 'attachment'
    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Type': metadata.mimeType || 'application/octet-stream',
        'Content-Disposition': `${disposition}; filename="${metadata.filename}"`,
        'Content-Length': metadata.size.toString(),
        'X-File-ID': fileId,
        'X-Upload-Date': metadata.uploadDate,
        'X-Uploaded-By': metadata.uploadedBy || 'Unknown'
      }
    })

  } catch (error) {
    console.error('Error downloading document:', error)
    
    if (error.message === 'File not found') {
      return NextResponse.json(
        { error: 'Document not found' },
        { status: 404 }
      )
    }
    
    return NextResponse.json(
      { error: 'Failed to download document', details: error.message },
      { status: 500 }
    )
  }
}
