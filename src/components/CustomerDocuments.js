'use client'
import { useState, useEffect } from 'react'

export default function CustomerDocuments({ customerId }) {
  const [customerDocuments, setCustomerDocuments] = useState([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [deleting, setDeleting] = useState(null)
  const [uploadProgress, setUploadProgress] = useState({})
  const [selectedFiles, setSelectedFiles] = useState([])
  const [selectedDocumentType, setSelectedDocumentType] = useState('')
  const [showUploadModal, setShowUploadModal] = useState(false)
  const [updatingStatus, setUpdatingStatus] = useState(null)

  // Document types that can be uploaded
  const documentTypes = {
    proofOfIncome: 'Proof of Income',
    proofOfAddress: 'Proof of Address',
    bankStatements: 'Bank Statements',
    identification: 'Identification',
    mortgageApplication: 'Mortgage Application',
    propertyDocuments: 'Property Documents',
    creditReport: 'Credit Report',
    employmentVerification: 'Employment Verification',
    otherDocuments: 'Other Documents'
  }

  useEffect(() => {
    loadDocuments()
  }, [customerId])

  const loadDocuments = async () => {
    try {
      setLoading(true)
      console.log('📄 Loading documents for customer:', customerId)
      
      // Use GridFS API to load documents
      const token = localStorage.getItem('token')
      const response = await fetch(`/api/documents-gridfs?customerId=${customerId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      
      console.log('📄 Documents API response status:', response.status)
      
      if (response.ok) {
        const data = await response.json()
        console.log('📄 Documents loaded:', data.files?.length || 0, 'files')
        
        // Set documents directly as array (GridFS returns array of files)
        setCustomerDocuments(data.files || [])
      } else {
        console.error('📄 Failed to load documents:', response.status, response.statusText)
        const errorData = await response.json()
        console.error('📄 Error details:', errorData)
      }
    } catch (error) {
      console.error('📄 Error loading documents:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleFileSelection = (files) => {
    setSelectedFiles(Array.from(files))
    setShowUploadModal(true)
  }

  const cancelUpload = () => {
    setSelectedFiles([])
    setSelectedDocumentType('')
    setShowUploadModal(false)
    // Reset file input
    const fileInput = document.getElementById('document-upload-input')
    if (fileInput) fileInput.value = ''
  }

  const confirmUpload = async () => {
    if (!selectedDocumentType || selectedFiles.length === 0) return

    setUploading(true)
    setShowUploadModal(false)
    
    // Set initial progress
    setUploadProgress({ [selectedDocumentType]: 0 })

    try {
      const token = localStorage.getItem('token')
      
      // Upload files one by one to GridFS
      let uploadedCount = 0
      const totalFiles = selectedFiles.length

      for (const file of selectedFiles) {
        const formData = new FormData()
        formData.append('file', file) // GridFS API expects 'file' not 'files'
        formData.append('customerId', customerId)
        formData.append('documentType', selectedDocumentType)
        formData.append('status', 'received') // Default status

        const response = await fetch('/api/documents-gridfs', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`
          },
          body: formData
        })

        if (response.ok) {
          uploadedCount++
          // Update progress
          const progress = Math.round((uploadedCount / totalFiles) * 100)
          setUploadProgress({ [selectedDocumentType]: progress })
        } else {
          const error = await response.json()
          console.error('Upload failed for file:', file.name, error)
          alert(`Upload failed for ${file.name}: ${error.error || 'Unknown error'}`)
          break
        }
      }

      // Show success if all files uploaded
      if (uploadedCount === totalFiles) {
        setTimeout(() => {
          setUploadProgress({})
          loadDocuments()
        }, 1000)
      } else {
        setUploadProgress({})
      }
    } catch (error) {
      console.error('Error uploading files:', error)
      alert('Upload failed. Please try again.')
      setUploadProgress({})
    } finally {
      setUploading(false)
      setSelectedFiles([])
      setSelectedDocumentType('')
      // Reset file input
      const fileInput = document.getElementById('document-upload-input')
      if (fileInput) fileInput.value = ''
    }
  }

  const handleDocumentStatusChange = async (fileId, newStatus) => {
    try {
      setUpdatingStatus(fileId)
      
      const token = localStorage.getItem('token')
      const response = await fetch('/api/documents-gridfs', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          fileId,
          updates: { status: newStatus }
        })
      })

      if (response.ok) {
        // Update status locally for immediate feedback
        setCustomerDocuments(prev => 
          prev.map(doc => 
            doc.fileId === fileId ? { ...doc, status: newStatus } : doc
          )
        )
      } else {
        const error = await response.json()
        console.error('Failed to update status:', error)
        alert(`Failed to update status: ${error.error || 'Unknown error'}`)
      }
    } catch (error) {
      console.error('Error updating document status:', error)
      alert('Failed to update status. Please try again.')
    } finally {
      setUpdatingStatus(null)
    }
  }

  const getDocumentTypeInfo = (docType) => {
    const typeInfo = {
      proofOfIncome: {
        title: 'Proof of Income',
        description: 'Payslips, P60, employment contract',
        icon: 'bi-file-earmark-text',
        color: 'text-success'
      },
      proofOfAddress: {
        title: 'Proof of Address',
        description: 'Utility bills, council tax, bank statement',
        icon: 'bi-house-door',
        color: 'text-primary'
      },
      bankStatements: {
        title: 'Bank Statements',
        description: 'Last 3-6 months of bank statements',
        icon: 'bi-bank',
        color: 'text-info'
      },
      identification: {
        title: 'Identification',
        description: 'Passport, driving license, ID card',
        icon: 'bi-person-badge',
        color: 'text-warning'
      },
      mortgageApplication: {
        title: 'Mortgage Application',
        description: 'Completed mortgage application form',
        icon: 'bi-file-earmark-pdf',
        color: 'text-danger'
      },
      propertyDocuments: {
        title: 'Property Documents',
        description: 'Property details, valuation, survey',
        icon: 'bi-building',
        color: 'text-success'
      },
      creditReport: {
        title: 'Credit Report',
        description: 'Credit score and credit history',
        icon: 'bi-graph-up',
        color: 'text-primary'
      },
      employmentVerification: {
        title: 'Employment Verification',
        description: 'HR letter, employment confirmation',
        icon: 'bi-briefcase',
        color: 'text-info'
      },
      otherDocuments: {
        title: 'Other Documents',
        description: 'Additional supporting documents',
        icon: 'bi-file-earmark',
        color: 'text-secondary'
      }
    }
    
    return typeInfo[docType] || typeInfo.otherDocuments
  }

  const handleDelete = async (fileId, filename) => {
    if (!fileId) {
      alert('Document ID is not available')
      return
    }
    
    if (!confirm(`Are you sure you want to delete ${filename}?`)) return

    setDeleting(fileId)
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`/api/documents-gridfs?fileId=${fileId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        await loadDocuments()
      } else {
        const error = await response.json()
        alert(`Delete failed: ${error.error || 'Unknown error'}`)
      }
    } catch (error) {
      console.error('Error deleting file:', error)
      alert('Delete failed. Please try again.')
    } finally {
      setDeleting(null)
    }
  }

  const handleDownload = (fileId, filename) => {
    if (!fileId) {
      alert('Document ID is not available')
      return
    }
    
    const token = localStorage.getItem('token')
    // Create a link with authorization token in URL for download
    const downloadUrl = `/api/documents-gridfs/download?fileId=${fileId}&token=${encodeURIComponent(token)}`
    window.open(downloadUrl, '_blank')
  }

  const handleView = (fileId, filename) => {
    if (!fileId) {
      alert('Document ID is not available')
      return
    }
    
    const token = localStorage.getItem('token')
    // Create a link with authorization token in URL for viewing
    const viewUrl = `/api/documents-gridfs/download?fileId=${fileId}&token=${encodeURIComponent(token)}&view=true`
    window.open(viewUrl, '_blank')
  }

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const handleDragOver = (e) => {
    e.preventDefault()
    e.stopPropagation()
  }

  const handleDragEnter = (e) => {
    e.preventDefault()
    e.stopPropagation()
  }

  const handleDragLeave = (e) => {
    e.preventDefault()
    e.stopPropagation()
  }

  const handleDrop = (e) => {
    e.preventDefault()
    e.stopPropagation()
    const files = e.dataTransfer.files
    if (files.length > 0) {
      handleFileSelection(files)
    }
  }

  return (
    <>
      <div className="card mb-4">
        <div className="card-header d-flex justify-content-between align-items-center py-1">
          <h6 className="mb-0 fw-bold small">Document Status & Upload</h6>
          <button 
            className="btn btn-sm btn-primary"
            onClick={() => document.getElementById('document-upload-input').click()}
            disabled={uploading}
          >
            <i className="bi bi-cloud-upload me-1"></i>
            {uploading ? 'Uploading...' : 'Upload Documents'}
          </button>
        </div>
      
      <div className="card-body">
        <small className="text-muted d-flex align-items-center mb-3">
          <i className="bi bi-database text-success me-1"></i>
          Documents stored in Database
        </small>
        
        {/* Hidden file input */}
        <input
          type="file"
          id="document-upload-input"
          className="d-none"
          accept=".pdf,.jpg,.jpeg,.png,.doc,.docx,.txt"
          multiple
          onChange={(e) => handleFileSelection(e.target.files)}
        />

        {/* Drag & Drop Zone */}
        <div 
          className="border border-2 border-dashed border-primary bg-light p-3 mb-3 text-center rounded"
          style={{ cursor: 'pointer' }}
          onDragOver={handleDragOver}
          onDragEnter={handleDragEnter}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => document.getElementById('document-upload-input').click()}
        >
          <i className="bi bi-cloud-upload fs-3 text-primary mb-2 d-block"></i>
          <p className="mb-0 text-muted">
            <strong>Click to browse</strong> or drag and drop files here
          </p>
          <small className="text-muted">
            PDF, JPG, PNG, DOC, DOCX, TXT (No file size limit)
          </small>
        </div>

        {/* Upload Progress */}
        {Object.entries(uploadProgress).map(([docType, progress]) => (
          progress !== undefined && (
            <div key={docType} className="mb-3">
              <div className="d-flex align-items-center justify-content-between">
                <small className="text-muted fw-medium">
                  Uploading {documentTypes[docType] || docType}...
                </small>
                <small className="text-muted fw-bold">{progress}%</small>
              </div>
              <div className="progress" style={{height: '6px'}}>
                <div
                  className="progress-bar bg-primary"
                  role="progressbar"
                  style={{width: `${progress}%`}}
                ></div>
              </div>
            </div>
          )
        ))}

        {/* Documents Table */}
        {loading ? (
          <div className="text-center py-3">
            <div className="spinner-border spinner-border-sm me-2" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
            Loading documents...
          </div>
        ) : (
          (() => {
            // customerDocuments is already an array from GridFS API
            const allDocuments = customerDocuments || []

            return allDocuments.length > 0 ? (
              <div className="table-responsive">
                <table className="table fees-table">
                  <thead>
                    <tr>
                      <th>File Name</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {allDocuments
                      .sort((a, b) => new Date(b.uploadDate) - new Date(a.uploadDate))
                      .map((doc, index) => (
                      <tr 
                        key={doc.fileId || index}
                        className="table-row-tooltip"
                        data-tooltip={`${getDocumentTypeInfo(doc.documentType).title} | ${doc.filename || 'Unknown'} | ${formatFileSize(doc.size)} | Uploaded: ${new Date(doc.uploadDate).toLocaleDateString('en-GB')}`}
                        style={{ cursor: 'help' }}
                      >
                        <td>
                          <div className="d-flex align-items-center">
                            <i 
                              className={`bi ${getDocumentTypeInfo(doc.documentType).icon} ${getDocumentTypeInfo(doc.documentType).color} me-2 document-type-icon fast-tooltip`}
                              title={`${getDocumentTypeInfo(doc.documentType).title}\n${getDocumentTypeInfo(doc.documentType).description}`}
                              style={{cursor: 'help'}}
                            ></i>
                            <strong 
                              title={`File: ${doc.filename || 'Unknown'}\nSize: ${formatFileSize(doc.size) || 'Unknown'}\nUploaded: ${new Date(doc.uploadDate).toLocaleString('en-GB')}\nUploaded by: ${doc.uploadedBy || 'Unknown'}`}
                              style={{cursor: 'help'}}
                              className="me-2 fast-tooltip"
                            >
                              {doc.filename || `document_${new Date(doc.uploadDate).getTime()}`}
                            </strong>
                            <span 
                              className="document-info-icon ms-2 fast-tooltip"
                              title={`Document Type: ${getDocumentTypeInfo(doc.documentType).title}\nUploaded: ${new Date(doc.uploadDate).toLocaleDateString('en-GB', {
                                day: '2-digit',
                                month: 'short',
                                year: 'numeric'
                              })} at ${new Date(doc.uploadDate).toLocaleTimeString('en-GB', {
                                hour: '2-digit',
                                minute: '2-digit'
                              })}\nSize: ${formatFileSize(doc.size)}\nUploaded by: ${doc.uploadedBy || 'Unknown'}`}
                            >
                              i
                            </span>
                          </div>
                        </td>
                        <td>
                          <select
                            className={`form-select form-select-sm ${
                              doc.status === 'verified' ? 'border-success text-success' :
                              doc.status === 'in review' ? 'border-warning text-warning' :
                              'border-primary text-primary'
                            }`}
                            value={doc.status}
                            onChange={(e) => handleDocumentStatusChange(doc.fileId, e.target.value)}
                            style={{minWidth: '120px'}}
                            disabled={updatingStatus === doc.fileId}
                          >
                            <option value="received">Received</option>
                            <option value="in review">In Review</option>
                            <option value="verified">Verified</option>
                          </select>
                        </td>
                        <td>
                          <div className="d-flex gap-1">
                            <button
                              className="btn btn-sm btn-outline-primary fee-action-btn"
                              onClick={() => handleView(doc.fileId, doc.filename)}
                              title="View Document"
                              disabled={!doc.fileId}
                            >
                              <i className="bi bi-eye"></i>
                            </button>
                            <button
                              className="btn btn-sm btn-outline-secondary fee-action-btn"
                              onClick={() => handleDownload(doc.fileId, doc.filename)}
                              title="Download Document"
                              disabled={!doc.fileId}
                            >
                              <i className="bi bi-download"></i>
                            </button>
                            <button
                              className="btn btn-sm btn-outline-danger fee-action-btn"
                              onClick={() => handleDelete(doc.fileId, doc.filename)}
                              disabled={deleting === doc.fileId || !doc.fileId}
                              title="Delete Document"
                            >
                              {deleting === doc.fileId ? (
                                <div className="spinner-border spinner-border-sm" role="status">
                                  <span className="visually-hidden">Deleting...</span>
                                </div>
                              ) : (
                                <i className="bi bi-trash"></i>
                              )}
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center text-muted py-4">
                <i className="bi bi-file-earmark-x display-6 mb-3"></i>
                <p className="mb-0">No documents uploaded for this customer.</p>
              </div>
            )
          })()
        )}
      </div>
    </div>

    {/* Document Type Selection Modal - Outside card container */}
    {showUploadModal && (
        <div 
          className="modal show d-block" 
          style={{ 
            position: 'fixed', 
            top: 0, 
            left: 0, 
            zIndex: 9999, 
            width: '100vw', 
            height: '100vh', 
            overflow: 'auto',
            outline: 0,
            backgroundColor: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
          onClick={cancelUpload}
        >
          <div 
            className="modal-dialog"
            style={{ 
              position: 'relative',
              width: '90%',
              maxWidth: '500px',
              margin: '0 auto',
              pointerEvents: 'none'
            }}
          >
            <div 
              className="modal-content"
              style={{ 
                position: 'relative',
                display: 'flex',
                flexDirection: 'column',
                width: '100%',
                pointerEvents: 'auto',
                backgroundColor: '#fff',
                backgroundClip: 'padding-box',
                border: '1px solid rgba(0,0,0,.2)',
                borderRadius: '0.375rem',
                boxShadow: '0 0.5rem 1rem rgba(0,0,0,.15)'
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="modal-header">
                <h5 className="modal-title">Select Document Type</h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={cancelUpload}
                ></button>
              </div>
              <div className="modal-body">
                <div className="mb-3">
                  <p className="text-muted">
                    You have selected <strong>{selectedFiles.length}</strong> file{selectedFiles.length > 1 ? 's' : ''} to upload.
                    Please choose which document type these files belong to:
                  </p>
                  
                  {/* Selected Files Preview */}
                  <div className="mb-3">
                    <small className="text-muted fw-bold">Selected Files:</small>
                    <ul className="list-unstyled mt-1">
                      {selectedFiles.map((file, index) => (
                        <li key={index} className="d-flex justify-content-between align-items-center py-1">
                          <span className="small">{file.name}</span>
                          <span className="small text-muted">{(file.size / 1024 / 1024).toFixed(2)} MB</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Document Type Selector */}
                  <label className="form-label">Document Type *</label>
                  <select
                    className="form-select"
                    value={selectedDocumentType}
                    onChange={(e) => setSelectedDocumentType(e.target.value)}
                    required
                  >
                    <option value="">Choose document type...</option>
                    {Object.entries(documentTypes).map(([key, label]) => (
                      <option key={key} value={key}>
                        {label}
                      </option>
                    ))}
                  </select>
                  <div className="form-text">
                    Select the appropriate document category for the uploaded files.
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={cancelUpload}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={confirmUpload}
                  disabled={!selectedDocumentType || selectedFiles.length === 0}
                >
                  <i className="bi bi-cloud-upload me-1"></i>
                  Upload {selectedFiles.length} File{selectedFiles.length > 1 ? 's' : ''}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
