import { GridFSBucket, ObjectId } from 'mongodb'
import { getDb } from './mongoDb'
import { Readable } from 'stream'

let gridFSBucket = null

/**
 * Get or create GridFS bucket
 * @returns {GridFSBucket} GridFS bucket instance
 */
export async function getGridFSBucket() {
  if (!gridFSBucket) {
    const db = await getDb()
    gridFSBucket = new GridFSBucket(db, {
      bucketName: 'documents' // Will create documents.files and documents.chunks collections
    })
  }
  return gridFSBucket
}

/**
 * Upload a file to GridFS
 * @param {Buffer} fileBuffer - File buffer
 * @param {Object} metadata - File metadata
 * @returns {Promise<Object>} Upload result with file ID
 */
export async function uploadFileToGridFS(fileBuffer, metadata) {
  try {
    const bucket = await getGridFSBucket()
    
    return new Promise((resolve, reject) => {
      const uploadStream = bucket.openUploadStream(metadata.filename, {
        metadata: {
          customerId: metadata.customerId,
          documentType: metadata.documentType,
          originalName: metadata.originalName,
          mimeType: metadata.mimeType,
          size: metadata.size,
          uploadedBy: metadata.uploadedBy,
          uploadedByEmail: metadata.uploadedByEmail,
          uploadDate: new Date().toISOString(),
          status: metadata.status || 'received', // 'received', 'in review', 'verified'
          _createdBy: metadata.uploadedBy,
          _createdAt: new Date().toISOString(),
          _modifiedBy: metadata.uploadedBy,
          _lastModified: new Date().toISOString(),
          _version: 1
        }
      })

      const readableStream = Readable.from(fileBuffer)
      
      readableStream.pipe(uploadStream)
        .on('error', (error) => {
          console.error('Error uploading file to GridFS:', error)
          reject(error)
        })
        .on('finish', () => {
          resolve({
            fileId: uploadStream.id.toString(),
            filename: metadata.filename,
            size: metadata.size,
            uploadDate: new Date().toISOString()
          })
        })
    })
  } catch (error) {
    console.error('Error in uploadFileToGridFS:', error)
    throw error
  }
}

/**
 * Download a file from GridFS
 * @param {string} fileId - File ID
 * @returns {Promise<Object>} File stream and metadata
 */
export async function downloadFileFromGridFS(fileId) {
  try {
    const bucket = await getGridFSBucket()
    
    // Get file metadata
    const files = await bucket.find({ _id: new ObjectId(fileId) }).toArray()
    
    if (!files || files.length === 0) {
      throw new Error('File not found')
    }
    
    const fileInfo = files[0]
    
    // Create download stream
    const downloadStream = bucket.openDownloadStream(new ObjectId(fileId))
    
    return {
      stream: downloadStream,
      metadata: {
        filename: fileInfo.filename,
        mimeType: fileInfo.metadata?.mimeType || 'application/octet-stream',
        size: fileInfo.length,
        uploadDate: fileInfo.uploadDate,
        ...fileInfo.metadata
      }
    }
  } catch (error) {
    console.error('Error downloading file from GridFS:', error)
    throw error
  }
}

/**
 * Delete a file from GridFS
 * @param {string} fileId - File ID
 * @returns {Promise<boolean>} Success status
 */
export async function deleteFileFromGridFS(fileId) {
  try {
    const bucket = await getGridFSBucket()
    await bucket.delete(new ObjectId(fileId))
    return true
  } catch (error) {
    console.error('Error deleting file from GridFS:', error)
    throw error
  }
}

/**
 * Get file metadata without downloading
 * @param {string} fileId - File ID
 * @returns {Promise<Object>} File metadata
 */
export async function getFileMetadata(fileId) {
  try {
    const bucket = await getGridFSBucket()
    const files = await bucket.find({ _id: new ObjectId(fileId) }).toArray()
    
    if (!files || files.length === 0) {
      throw new Error('File not found')
    }
    
    const fileInfo = files[0]
    
    return {
      fileId: fileInfo._id.toString(),
      filename: fileInfo.filename,
      size: fileInfo.length,
      uploadDate: fileInfo.uploadDate,
      chunkSize: fileInfo.chunkSize,
      ...fileInfo.metadata
    }
  } catch (error) {
    console.error('Error getting file metadata:', error)
    throw error
  }
}

/**
 * List files by customer ID and optional document type
 * @param {string} customerId - Customer ID
 * @param {string} documentType - Optional document type filter
 * @returns {Promise<Array>} List of files
 */
export async function listFilesByCustomer(customerId, documentType = null) {
  try {
    const bucket = await getGridFSBucket()
    
    const query = { 'metadata.customerId': customerId }
    if (documentType) {
      query['metadata.documentType'] = documentType
    }
    
    const files = await bucket.find(query).toArray()
    
    return files.map(file => ({
      fileId: file._id.toString(),
      filename: file.filename,
      size: file.length,
      uploadDate: file.uploadDate,
      ...file.metadata
    }))
  } catch (error) {
    console.error('Error listing files:', error)
    throw error
  }
}

/**
 * Update file metadata (e.g., status)
 * @param {string} fileId - File ID
 * @param {Object} updates - Metadata updates
 * @param {string} modifiedBy - User making the change
 * @returns {Promise<boolean>} Success status
 */
export async function updateFileMetadata(fileId, updates, modifiedBy) {
  try {
    const db = await getDb()
    const filesCollection = db.collection('documents.files')
    
    const timestamp = new Date().toISOString()
    
    // Build update object for nested metadata fields
    const updateDoc = {
      $set: {}
    }
    
    // Update metadata fields
    Object.keys(updates).forEach(key => {
      updateDoc.$set[`metadata.${key}`] = updates[key]
    })
    
    // Add audit fields
    updateDoc.$set['metadata._modifiedBy'] = modifiedBy
    updateDoc.$set['metadata._lastModified'] = timestamp
    updateDoc.$inc = { 'metadata._version': 1 }
    
    const result = await filesCollection.updateOne(
      { _id: new ObjectId(fileId) },
      updateDoc
    )
    
    return result.modifiedCount > 0
  } catch (error) {
    console.error('Error updating file metadata:', error)
    throw error
  }
}

/**
 * Get files by status
 * @param {string} status - Status to filter by
 * @param {number} limit - Max number of results
 * @returns {Promise<Array>} List of files
 */
export async function getFilesByStatus(status, limit = 100) {
  try {
    const bucket = await getGridFSBucket()
    
    const files = await bucket
      .find({ 'metadata.status': status })
      .limit(limit)
      .toArray()
    
    return files.map(file => ({
      fileId: file._id.toString(),
      filename: file.filename,
      customerId: file.metadata?.customerId,
      documentType: file.metadata?.documentType,
      size: file.length,
      uploadDate: file.uploadDate,
      ...file.metadata
    }))
  } catch (error) {
    console.error('Error getting files by status:', error)
    throw error
  }
}

/**
 * Search files by criteria
 * @param {Object} criteria - Search criteria
 * @param {Object} pagination - Pagination options
 * @returns {Promise<Object>} Paginated results
 */
export async function searchFiles(criteria = {}, pagination = { page: 1, limit: 50 }) {
  try {
    const db = await getDb()
    const filesCollection = db.collection('documents.files')
    
    const { page, limit } = pagination
    
    // Build query
    const query = {}
    
    if (criteria.customerId) {
      query['metadata.customerId'] = criteria.customerId
    }
    
    if (criteria.documentType) {
      query['metadata.documentType'] = criteria.documentType
    }
    
    if (criteria.status) {
      query['metadata.status'] = criteria.status
    }
    
    if (criteria.uploadedBy) {
      query['metadata.uploadedBy'] = criteria.uploadedBy
    }
    
    if (criteria.startDate || criteria.endDate) {
      query.uploadDate = {}
      if (criteria.startDate) {
        query.uploadDate.$gte = new Date(criteria.startDate)
      }
      if (criteria.endDate) {
        query.uploadDate.$lte = new Date(criteria.endDate)
      }
    }
    
    // Count total
    const totalFiles = await filesCollection.countDocuments(query)
    const totalPages = Math.ceil(totalFiles / limit)
    
    // Get paginated results
    const files = await filesCollection
      .find(query)
      .sort({ uploadDate: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .toArray()
    
    return {
      files: files.map(file => ({
        fileId: file._id.toString(),
        filename: file.filename,
        size: file.length,
        uploadDate: file.uploadDate,
        ...file.metadata
      })),
      pagination: {
        currentPage: page,
        totalPages,
        totalFiles,
        filesPerPage: limit,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1
      }
    }
  } catch (error) {
    console.error('Error searching files:', error)
    throw error
  }
}
