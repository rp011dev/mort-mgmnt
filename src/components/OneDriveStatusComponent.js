'use client'

import { useState, useEffect } from 'react'

export default function OneDriveStatusComponent() {
  const [status, setStatus] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    checkOneDriveStatus()
  }, [])

  const checkOneDriveStatus = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/onedrive-status')
      const data = await response.json()
      setStatus(data)
    } catch (error) {
      console.error('Error checking OneDrive status:', error)
      setStatus({
        status: 'error',
        message: 'Failed to check OneDrive status'
      })
    } finally {
      setLoading(false)
    }
  }

  const getStatusBadge = (status) => {
    switch (status) {
      case 'success':
        return <span className="badge bg-success">✅ Connected</span>
      case 'warning':
        return <span className="badge bg-warning">⚠️ Warning</span>
      case 'error':
        return <span className="badge bg-danger">❌ Error</span>
      default:
        return <span className="badge bg-secondary">🔄 Checking...</span>
    }
  }

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  if (loading) {
    return (
      <div className="card border-primary">
        <div className="card-header bg-primary text-white">
          <h5 className="card-title mb-0">
            <i className="bi bi-cloud-check me-2"></i>
            OneDrive Integration Status
          </h5>
        </div>
        <div className="card-body">
          <div className="d-flex justify-content-center">
            <div className="spinner-border text-primary" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="card border-primary mb-4">
      <div className="card-header bg-primary text-white">
        <div className="d-flex justify-content-between align-items-center">
          <h5 className="card-title mb-0">
            <i className="bi bi-cloud-check me-2"></i>
            OneDrive Direct Integration Status
          </h5>
          {getStatusBadge(status?.status)}
        </div>
      </div>
      <div className="card-body">
        {status?.status === 'error' && (
          <div className="alert alert-danger">
            <strong>Error:</strong> {status.message}
            <br />
            <small>Data Directory: {status.dataDirectory}</small>
          </div>
        )}

        {status?.status === 'warning' && (
          <div className="alert alert-warning">
            <strong>Warning:</strong> {status.message}
            <br />
            <small>Current Directory: {status.dataDirectory}</small>
          </div>
        )}

        {status?.status === 'success' && (
          <>
            <div className="alert alert-success">
              <strong>Success:</strong> {status.message}
            </div>
            
            <div className="row">
              <div className="col-md-6">
                <h6><i className="bi bi-folder2-open me-2"></i>Data Directory</h6>
                <p className="text-muted small">{status.dataDirectory}</p>
                
                <h6><i className="bi bi-file-earmark-text me-2"></i>Data Files Summary</h6>
                <ul className="list-unstyled">
                  <li>📁 Total Files: <strong>{status.summary?.totalFiles || 0}</strong></li>
                  <li>✅ Available Files: <strong>{status.summary?.existingFiles || 0}</strong></li>
                  <li>💾 Total Size: <strong>{formatFileSize(status.summary?.totalSize || 0)}</strong></li>
                </ul>

                <h6><i className="bi bi-file-earmark-medical me-2"></i>Documents Folder</h6>
                <p className="text-muted small">{status.documentsFolder?.path}</p>
                <ul className="list-unstyled">
                  <li>📂 Status: <strong>{status.documentsFolder?.exists ? '✅ Available' : '❌ Not Found'}</strong></li>
                  <li>📄 Document Files: <strong>{status.documentsFolder?.fileCount || 0}</strong></li>
                  <li>💾 Documents Size: <strong>{formatFileSize(status.documentsFolder?.totalSize || 0)}</strong></li>
                </ul>
              </div>
              
              <div className="col-md-6">
                <h6><i className="bi bi-list-check me-2"></i>Data Files Status</h6>
                <div className="table-responsive">
                  <table className="table table-sm">
                    <thead>
                      <tr>
                        <th>File</th>
                        <th>Status</th>
                        <th>Size</th>
                      </tr>
                    </thead>
                    <tbody>
                      {status.fileStatus && Object.entries(status.fileStatus).map(([key, file]) => (
                        <tr key={key}>
                          <td>{key}.json</td>
                          <td>
                            {file.exists ? (
                              <span className="badge bg-success">✅</span>
                            ) : (
                              <span className="badge bg-danger">❌</span>
                            )}
                          </td>
                          <td className="text-muted small">
                            {file.exists ? formatFileSize(file.size) : 'N/A'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </>
        )}

        <div className="mt-3">
          <button 
            className="btn btn-outline-primary btn-sm" 
            onClick={checkOneDriveStatus}
            disabled={loading}
          >
            <i className="bi bi-arrow-clockwise me-1"></i>
            Refresh Status
          </button>
        </div>
      </div>
    </div>
  )
}
