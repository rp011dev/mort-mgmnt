import { NextResponse } from 'next/server'
import { getUserFromRequest } from '@/utils/authMiddleware'
import {
  uploadFileToGridFS,
  downloadFileFromGridFS,
  deleteFileFromGridFS,
  getFileMetadata,
  listFilesByCustomer,
  updateFileMetadata,
  getFilesByStatus,
  searchFiles
} from '@/utils/gridFsManager'
export const dynamic = 'force-dynamic'


// No file size limit - removed as per requirements

/**
 * GET - List/Search documents
 * Query params:
 * - customerId: Filter by customer
 * - documentType: Filter by document type
 * - status: Filter by status
 * - fileId: Get specific file metadata
 * - action: 'list', 'search', 'byStatus'
 */
export async function GET(request) {
  try {
    // Check authentication
    const user = getUserFromRequest(request)
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized - Valid token required' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const action = searchParams.get('action') || 'list'
    const fileId = searchParams.get('fileId')
    const customerId = searchParams.get('customerId')
    const documentType = searchParams.get('documentType')
    const status = searchParams.get('status')
    const uploadedBy = searchParams.get('uploadedBy')
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    const page = parseInt(searchParams.get('page')) || 1
    const limit = parseInt(searchParams.get('limit')) || 50

    // Get specific file metadata
    if (fileId) {
      const metadata = await getFileMetadata(fileId)
      return NextResponse.json(metadata)
    }

    // Get files by status
    if (action === 'byStatus' && status) {
      const files = await getFilesByStatus(status, limit)
      return NextResponse.json({ files, count: files.length })
    }

    // Search files with filters
    if (action === 'search') {
      const criteria = {}
      if (customerId) criteria.customerId = customerId
      if (documentType) criteria.documentType = documentType
      if (status) criteria.status = status
      if (uploadedBy) criteria.uploadedBy = uploadedBy
      if (startDate) criteria.startDate = startDate
      if (endDate) criteria.endDate = endDate

      const result = await searchFiles(criteria, { page, limit })
      return NextResponse.json(result)
    }

    // List files by customer
    if (customerId) {
      const files = await listFilesByCustomer(customerId, documentType)
      return NextResponse.json({ files, count: files.length })
    }

    // Default: search all with pagination
    const result = await searchFiles({}, { page, limit })
    return NextResponse.json(result)

  } catch (error) {
    console.error('Error in GET documents:', error)
    return NextResponse.json(
      { error: 'Failed to retrieve documents', details: error.message },
      { status: 500 }
    )
  }
}

/**
 * POST - Upload a document
 * Body: multipart/form-data with:
 * - file: The file to upload
 * - customerId: Customer ID
 * - documentType: Type of document
 * - status: Optional status (default: 'received')
 */
export async function POST(request) {
  try {
    // Check authentication
    const user = getUserFromRequest(request)
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized - Valid token required' },
        { status: 401 }
      )
    }

    // Parse multipart form data
    const formData = await request.formData()
    const file = formData.get('file')
    const customerId = formData.get('customerId')
    const documentType = formData.get('documentType')
    const status = formData.get('status') || 'received'

    // Validate required fields
    if (!file || !customerId || !documentType) {
      return NextResponse.json(
        { error: 'Missing required fields: file, customerId, documentType' },
        { status: 400 }
      )
    }

    // File size limit removed as per requirements

    // Validate status
    const validStatuses = ['received', 'in review', 'verified']
    if (!validStatuses.includes(status)) {
      return NextResponse.json(
        { error: `Invalid status. Must be one of: ${validStatuses.join(', ')}` },
        { status: 400 }
      )
    }

    // Convert file to buffer
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    // Prepare metadata
    const metadata = {
      customerId,
      documentType,
      filename: file.name,
      originalName: file.name,
      mimeType: file.type,
      size: file.size,
      uploadedBy: user.name || user.email,
      uploadedByEmail: user.email,
      status
    }

    // Upload to GridFS
    const result = await uploadFileToGridFS(buffer, metadata)

    return NextResponse.json({
      success: true,
      message: 'Document uploaded successfully',
      ...result,
      metadata: {
        customerId,
        documentType,
        status,
        uploadedBy: metadata.uploadedBy
      }
    }, { status: 201 })

  } catch (error) {
    console.error('Error uploading document:', error)
    return NextResponse.json(
      { error: 'Failed to upload document', details: error.message },
      { status: 500 }
    )
  }
}

/**
 * PUT - Update document metadata (e.g., change status)
 * Body: JSON with:
 * - fileId: File ID to update
 * - updates: Object with fields to update (e.g., { status: 'verified' })
 */
export async function PUT(request) {
  try {
    // Check authentication
    const user = getUserFromRequest(request)
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized - Valid token required' },
        { status: 401 }
      )
    }

    const { fileId, updates } = await request.json()

    // Validate required fields
    if (!fileId || !updates) {
      return NextResponse.json(
        { error: 'Missing required fields: fileId, updates' },
        { status: 400 }
      )
    }

    // Validate status if being updated
    if (updates.status) {
      const validStatuses = ['received', 'in review', 'verified']
      if (!validStatuses.includes(updates.status)) {
        return NextResponse.json(
          { error: `Invalid status. Must be one of: ${validStatuses.join(', ')}` },
          { status: 400 }
        )
      }
    }

    // Update metadata
    const success = await updateFileMetadata(fileId, updates, user.name || user.email)

    if (!success) {
      return NextResponse.json(
        { error: 'Document not found or update failed' },
        { status: 404 }
      )
    }

    // Get updated metadata
    const updatedMetadata = await getFileMetadata(fileId)

    return NextResponse.json({
      success: true,
      message: 'Document metadata updated successfully',
      metadata: updatedMetadata
    })

  } catch (error) {
    console.error('Error updating document metadata:', error)
    return NextResponse.json(
      { error: 'Failed to update document', details: error.message },
      { status: 500 }
    )
  }
}

/**
 * DELETE - Delete a document
 * Query params:
 * - fileId: File ID to delete
 */
export async function DELETE(request) {
  try {
    // Check authentication
    const user = getUserFromRequest(request)
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized - Valid token required' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const fileId = searchParams.get('fileId')

    if (!fileId) {
      return NextResponse.json(
        { error: 'Missing required parameter: fileId' },
        { status: 400 }
      )
    }

    // Delete from GridFS
    await deleteFileFromGridFS(fileId)

    return NextResponse.json({
      success: true,
      message: 'Document deleted successfully',
      fileId
    })

  } catch (error) {
    console.error('Error deleting document:', error)
    return NextResponse.json(
      { error: 'Failed to delete document', details: error.message },
      { status: 500 }
    )
  }
}
