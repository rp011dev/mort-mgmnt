# GridFS Document Management System

## Overview
Complete document management system using MongoDB GridFS for storing files with rich metadata tracking, status management, and full audit trail.

## Features

✅ **GridFS Storage** - Efficient storage of large files in MongoDB  
✅ **Metadata Tracking** - Track uploader, upload date, document type, customer  
✅ **Status Management** - Three statuses: received, in review, verified  
✅ **Audit Trail** - Full tracking of who uploaded, when, and modifications  
✅ **File Search** - Search by customer, type, status, date range  
✅ **Download Support** - Stream files directly from GridFS  
✅ **Authentication Required** - All operations require JWT token  
✅ **File Size Limit** - 10MB maximum per file  

## Database Schema

### GridFS Collections

MongoDB GridFS automatically creates two collections:
- `documents.files` - File metadata
- `documents.chunks` - File content in chunks (default 255KB per chunk)

### File Metadata Structure

```javascript
{
  // GridFS Standard Fields
  "_id": ObjectId("..."),
  "filename": "passport_scan.pdf",
  "length": 2458624,  // File size in bytes
  "chunkSize": 261120,  // Chunk size (default 255KB)
  "uploadDate": ISODate("2025-10-30T12:00:00.000Z"),
  
  // Custom Metadata
  "metadata": {
    // Customer & Document Info
    "customerId": "GKF00001",
    "documentType": "passport",
    "originalName": "passport_scan.pdf",
    "mimeType": "application/pdf",
    "size": 2458624,
    
    // Uploader Info
    "uploadedBy": "Gaurav Khanna",
    "uploadedByEmail": "gaurav@gkfinance.com",
    "uploadDate": "2025-10-30T12:00:00.000Z",
    
    // Status Management
    "status": "received",  // "received", "in review", "verified"
    
    // Audit Trail
    "_createdBy": "Gaurav Khanna",
    "_createdAt": "2025-10-30T12:00:00.000Z",
    "_modifiedBy": "Gaurav Khanna",
    "_lastModified": "2025-10-30T12:00:00.000Z",
    "_version": 1
  }
}
```

## API Endpoints

### 1. Upload Document

**Endpoint:** `POST /api/documents-gridfs`  
**Auth:** Required (JWT token)  
**Content-Type:** `multipart/form-data`

**Form Data:**
- `file` (required) - File to upload
- `customerId` (required) - Customer ID (e.g., "GKF00001")
- `documentType` (required) - Type of document (e.g., "passport", "proof_of_address")
- `status` (optional) - Initial status (default: "received")

**Example:**
```javascript
const formData = new FormData()
formData.append('file', fileBlob)
formData.append('customerId', 'GKF00001')
formData.append('documentType', 'passport')
formData.append('status', 'received')

const token = localStorage.getItem('token')
const response = await fetch('/api/documents-gridfs', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`
  },
  body: formData
})

const result = await response.json()
```

**Response:**
```json
{
  "success": true,
  "message": "Document uploaded successfully",
  "fileId": "672345abc123def456789012",
  "filename": "passport_scan.pdf",
  "size": 2458624,
  "uploadDate": "2025-10-30T12:00:00.000Z",
  "metadata": {
    "customerId": "GKF00001",
    "documentType": "passport",
    "status": "received",
    "uploadedBy": "Gaurav Khanna"
  }
}
```

### 2. List/Search Documents

**Endpoint:** `GET /api/documents-gridfs`  
**Auth:** Required (JWT token)

**Query Parameters:**

| Parameter | Type | Description | Example |
|-----------|------|-------------|---------|
| `customerId` | string | Filter by customer | `customerId=GKF00001` |
| `documentType` | string | Filter by document type | `documentType=passport` |
| `status` | string | Filter by status | `status=verified` |
| `uploadedBy` | string | Filter by uploader | `uploadedBy=Gaurav Khanna` |
| `fileId` | string | Get specific file metadata | `fileId=672345abc...` |
| `action` | string | Action: 'list', 'search', 'byStatus' | `action=search` |
| `startDate` | ISO string | Filter from date | `startDate=2025-10-01T00:00:00Z` |
| `endDate` | ISO string | Filter to date | `endDate=2025-10-31T23:59:59Z` |
| `page` | number | Page number (default: 1) | `page=2` |
| `limit` | number | Results per page (default: 50) | `limit=100` |

**Examples:**

1. **List all documents for a customer:**
```javascript
GET /api/documents-gridfs?customerId=GKF00001
```

2. **List documents by type:**
```javascript
GET /api/documents-gridfs?customerId=GKF00001&documentType=passport
```

3. **Get documents by status:**
```javascript
GET /api/documents-gridfs?action=byStatus&status=in review&limit=100
```

4. **Search with filters:**
```javascript
GET /api/documents-gridfs?action=search&customerId=GKF00001&status=verified&page=1
```

5. **Get specific file metadata:**
```javascript
GET /api/documents-gridfs?fileId=672345abc123def456789012
```

**Response:**
```json
{
  "files": [
    {
      "fileId": "672345abc123def456789012",
      "filename": "passport_scan.pdf",
      "size": 2458624,
      "uploadDate": "2025-10-30T12:00:00.000Z",
      "customerId": "GKF00001",
      "documentType": "passport",
      "status": "verified",
      "uploadedBy": "Gaurav Khanna",
      "uploadedByEmail": "gaurav@gkfinance.com"
    }
  ],
  "count": 1
}
```

**Paginated Response:**
```json
{
  "files": [...],
  "pagination": {
    "currentPage": 1,
    "totalPages": 5,
    "totalFiles": 234,
    "filesPerPage": 50,
    "hasNextPage": true,
    "hasPreviousPage": false
  }
}
```

### 3. Download Document

**Endpoint:** `GET /api/documents-gridfs/download`  
**Auth:** Required (JWT token)

**Query Parameters:**
- `fileId` (required) - File ID to download

**Example:**
```javascript
const token = localStorage.getItem('token')
const fileId = '672345abc123def456789012'

const response = await fetch(`/api/documents-gridfs/download?fileId=${fileId}`, {
  headers: {
    'Authorization': `Bearer ${token}`
  }
})

// Get file as blob
const blob = await response.blob()

// Create download link
const url = window.URL.createObjectURL(blob)
const a = document.createElement('a')
a.href = url
a.download = 'document.pdf'  // Get filename from Content-Disposition header
document.body.appendChild(a)
a.click()
window.URL.revokeObjectURL(url)
```

**Response Headers:**
```
Content-Type: application/pdf
Content-Disposition: attachment; filename="passport_scan.pdf"
Content-Length: 2458624
X-File-ID: 672345abc123def456789012
X-Upload-Date: 2025-10-30T12:00:00.000Z
X-Uploaded-By: Gaurav Khanna
```

### 4. Update Document Status

**Endpoint:** `PUT /api/documents-gridfs`  
**Auth:** Required (JWT token)  
**Content-Type:** `application/json`

**Body:**
```json
{
  "fileId": "672345abc123def456789012",
  "updates": {
    "status": "verified"
  }
}
```

**Valid Status Values:**
- `"received"` - Default status when uploaded
- `"in review"` - Document is being reviewed
- `"verified"` - Document has been verified

**Example:**
```javascript
const token = localStorage.getItem('token')

const response = await fetch('/api/documents-gridfs', {
  method: 'PUT',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    fileId: '672345abc123def456789012',
    updates: {
      status: 'verified'
    }
  })
})

const result = await response.json()
```

**Response:**
```json
{
  "success": true,
  "message": "Document metadata updated successfully",
  "metadata": {
    "fileId": "672345abc123def456789012",
    "filename": "passport_scan.pdf",
    "size": 2458624,
    "status": "verified",
    "uploadedBy": "Gaurav Khanna",
    "_modifiedBy": "John Admin",
    "_lastModified": "2025-10-30T14:30:00.000Z",
    "_version": 2
  }
}
```

### 5. Delete Document

**Endpoint:** `DELETE /api/documents-gridfs`  
**Auth:** Required (JWT token)

**Query Parameters:**
- `fileId` (required) - File ID to delete

**Example:**
```javascript
const token = localStorage.getItem('token')
const fileId = '672345abc123def456789012'

const response = await fetch(`/api/documents-gridfs?fileId=${fileId}`, {
  method: 'DELETE',
  headers: {
    'Authorization': `Bearer ${token}`
  }
})

const result = await response.json()
```

**Response:**
```json
{
  "success": true,
  "message": "Document deleted successfully",
  "fileId": "672345abc123def456789012"
}
```

## Document Types

Recommended document type values (can be customized):

- `passport` - Passport
- `drivers_license` - Driver's License
- `proof_of_address` - Proof of Address
- `bank_statement` - Bank Statement
- `payslip` - Payslip/Pay Stub
- `tax_return` - Tax Return
- `property_deed` - Property Deed
- `valuation_report` - Property Valuation Report
- `insurance_policy` - Insurance Policy
- `employment_letter` - Employment Letter
- `other` - Other Documents

## File Size and Type Restrictions

**Maximum File Size:** 10MB per file

**Recommended File Types:**
- PDF (`.pdf`)
- Images (`.jpg`, `.jpeg`, `.png`)
- Documents (`.doc`, `.docx`)
- Text (`.txt`)

Note: File type validation can be added based on `mimeType` in the frontend or backend.

## Status Workflow

```
received (default)
    ↓
in review
    ↓
verified
```

**Status Descriptions:**
- **received** - Document has been uploaded and is awaiting review
- **in review** - Document is currently being reviewed by staff
- **verified** - Document has been verified and approved

## GridFS Utility Functions

### Upload File
```javascript
import { uploadFileToGridFS } from '@/utils/gridFsManager'

const result = await uploadFileToGridFS(fileBuffer, {
  customerId: 'GKF00001',
  documentType: 'passport',
  filename: 'passport_scan.pdf',
  originalName: 'passport_scan.pdf',
  mimeType: 'application/pdf',
  size: 2458624,
  uploadedBy: 'Gaurav Khanna',
  uploadedByEmail: 'gaurav@gkfinance.com',
  status: 'received'
})
```

### Download File
```javascript
import { downloadFileFromGridFS } from '@/utils/gridFsManager'

const { stream, metadata } = await downloadFileFromGridFS(fileId)
```

### Delete File
```javascript
import { deleteFileFromGridFS } from '@/utils/gridFsManager'

await deleteFileFromGridFS(fileId)
```

### List Files
```javascript
import { listFilesByCustomer } from '@/utils/gridFsManager'

const files = await listFilesByCustomer('GKF00001', 'passport')
```

### Update Metadata
```javascript
import { updateFileMetadata } from '@/utils/gridFsManager'

await updateFileMetadata(fileId, { status: 'verified' }, 'John Admin')
```

### Search Files
```javascript
import { searchFiles } from '@/utils/gridFsManager'

const result = await searchFiles(
  { customerId: 'GKF00001', status: 'verified' },
  { page: 1, limit: 50 }
)
```

## Frontend Integration Example

### Upload Component
```javascript
const uploadDocument = async (file, customerId, documentType) => {
  try {
    const formData = new FormData()
    formData.append('file', file)
    formData.append('customerId', customerId)
    formData.append('documentType', documentType)
    formData.append('status', 'received')

    const token = localStorage.getItem('token')
    const response = await fetch('/api/documents-gridfs', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
      },
      body: formData
    })

    if (!response.ok) {
      throw new Error('Upload failed')
    }

    const result = await response.json()
    console.log('Uploaded:', result)
    
    // Reload document list
    await loadDocuments()
  } catch (error) {
    console.error('Error uploading document:', error)
  }
}
```

### List Documents Component
```javascript
const loadDocuments = async () => {
  try {
    const token = localStorage.getItem('token')
    const response = await fetch(
      `/api/documents-gridfs?customerId=${customerId}`,
      {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      }
    )

    const data = await response.json()
    setDocuments(data.files)
  } catch (error) {
    console.error('Error loading documents:', error)
  }
}
```

### Download Document
```javascript
const downloadDocument = async (fileId, filename) => {
  try {
    const token = localStorage.getItem('token')
    const response = await fetch(
      `/api/documents-gridfs/download?fileId=${fileId}`,
      {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      }
    )

    const blob = await response.blob()
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    document.body.appendChild(a)
    a.click()
    window.URL.revokeObjectURL(url)
    document.body.removeChild(a)
  } catch (error) {
    console.error('Error downloading document:', error)
  }
}
```

### Update Status
```javascript
const updateDocumentStatus = async (fileId, newStatus) => {
  try {
    const token = localStorage.getItem('token')
    const response = await fetch('/api/documents-gridfs', {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        fileId,
        updates: { status: newStatus }
      })
    })

    const result = await response.json()
    console.log('Status updated:', result)
    
    // Reload document list
    await loadDocuments()
  } catch (error) {
    console.error('Error updating status:', error)
  }
}
```

### Delete Document
```javascript
const deleteDocument = async (fileId) => {
  if (!confirm('Are you sure you want to delete this document?')) {
    return
  }

  try {
    const token = localStorage.getItem('token')
    const response = await fetch(
      `/api/documents-gridfs?fileId=${fileId}`,
      {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      }
    )

    const result = await response.json()
    console.log('Deleted:', result)
    
    // Reload document list
    await loadDocuments()
  } catch (error) {
    console.error('Error deleting document:', error)
  }
}
```

## Benefits

1. ✅ **Scalable Storage** - GridFS handles files of any size
2. ✅ **Rich Metadata** - Track extensive information about each file
3. ✅ **Audit Trail** - Complete history of uploads and modifications
4. ✅ **Status Tracking** - Workflow management with status updates
5. ✅ **Efficient Streaming** - Download files without loading entire file in memory
6. ✅ **MongoDB Integration** - Files stored alongside other data
7. ✅ **Authentication Required** - All operations secured with JWT
8. ✅ **Search Capabilities** - Query by customer, type, status, date range

## MongoDB Queries

### Find all documents for a customer
```javascript
db.getCollection('documents.files').find({
  'metadata.customerId': 'GKF00001'
})
```

### Find documents by status
```javascript
db.getCollection('documents.files').find({
  'metadata.status': 'in review'
})
```

### Find documents uploaded by specific user
```javascript
db.getCollection('documents.files').find({
  'metadata.uploadedBy': 'Gaurav Khanna'
})
```

### Count documents by type
```javascript
db.getCollection('documents.files').aggregate([
  {
    $group: {
      _id: '$metadata.documentType',
      count: { $sum: 1 }
    }
  },
  { $sort: { count: -1 } }
])
```

### Get total storage used per customer
```javascript
db.getCollection('documents.files').aggregate([
  {
    $group: {
      _id: '$metadata.customerId',
      totalSize: { $sum: '$length' },
      documentCount: { $sum: 1 }
    }
  },
  { $sort: { totalSize: -1 } }
])
```

## Files Created

1. ✅ `/src/utils/gridFsManager.js` - GridFS utility functions
2. ✅ `/src/app/api/documents-gridfs/route.js` - Main CRUD operations
3. ✅ `/src/app/api/documents-gridfs/download/route.js` - Download endpoint
4. ✅ `/GRIDFS_DOCUMENT_MANAGEMENT.md` - This documentation

## Summary

The GridFS Document Management System provides a complete solution for storing and managing customer documents with:
- Secure file storage using MongoDB GridFS
- Rich metadata tracking (uploader, date, type, status)
- Status workflow management (received → in review → verified)
- Complete audit trail with version tracking
- Authentication required for all operations
- Efficient search and filtering capabilities
- Download support with streaming

All document operations are logged and tracked, ensuring compliance and accountability.
