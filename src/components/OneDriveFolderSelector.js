'use client'

import { useState, useEffect } from 'react'

export default function OneDriveFolderSelector() {
  const [availablePaths, setAvailablePaths] = useState([])
  const [selectedPath, setSelectedPath] = useState('')
  const [currentPath, setCurrentPath] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')

  useEffect(() => {
    loadOneDrivePaths()
  }, [])

  const loadOneDrivePaths = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/onedrive-paths')
      const data = await response.json()
      
      if (response.ok) {
        setAvailablePaths(data.availablePaths || [])
        setCurrentPath(data.currentPath || '')
        setSelectedPath(data.currentPath || '')
      } else {
        setMessage({ type: 'error', text: data.message || 'Failed to load OneDrive paths' })
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Network error: ' + error.message })
    } finally {
      setLoading(false)
    }
  }

  const updateOneDrivePath = async () => {
    if (!selectedPath) {
      setMessage({ type: 'warning', text: 'Please select a OneDrive path' })
      return
    }

    try {
      setSaving(true)
      const response = await fetch('/api/onedrive-paths', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ selectedPath })
      })
      
      const data = await response.json()
      
      if (response.ok) {
        setCurrentPath(selectedPath)
        setMessage({ type: 'success', text: 'OneDrive path updated successfully! Data will now be stored in the selected location.' })
        // Reload page after 2 seconds to refresh status
        setTimeout(() => window.location.reload(), 2000)
      } else {
        setMessage({ type: 'error', text: data.message || 'Failed to update OneDrive path' })
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Network error: ' + error.message })
    } finally {
      setSaving(false)
    }
  }

  const testSelectedPath = async () => {
    if (!selectedPath) {
      setMessage({ type: 'warning', text: 'Please select a path to test' })
      return
    }

    try {
      const response = await fetch('/api/onedrive-paths/test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ testPath: selectedPath })
      })
      
      const data = await response.json()
      
      if (response.ok) {
        setMessage({ type: 'success', text: `✅ Path is accessible and ready for use!` })
      } else {
        setMessage({ type: 'error', text: data.message || 'Path test failed' })
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Network error: ' + error.message })
    }
  }

  if (loading) {
    return (
      <div className="card">
        <div className="card-body text-center">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="mt-2">Detecting OneDrive paths...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="card border-primary">
      <div className="card-header bg-primary text-white">
        <h5 className="mb-0">
          <i className="bi bi-folder-symlink me-2"></i>
          OneDrive Folder Selection
        </h5>
      </div>
      <div className="card-body">
        {/* Current Path Display */}
        <div className="row mb-4">
          <div className="col-12">
            <h6><i className="bi bi-check-circle-fill text-success me-2"></i>Current OneDrive Path</h6>
            <div className="alert alert-info">
              <code>{currentPath || 'Not configured'}</code>
            </div>
          </div>
        </div>

        {/* Available Paths */}
        <div className="row mb-4">
          <div className="col-12">
            <h6><i className="bi bi-search me-2"></i>Available OneDrive Locations</h6>
            
            {availablePaths.length > 0 ? (
              <div>
                {availablePaths.map((pathInfo, index) => (
                  <div key={index} className="form-check mb-2">
                    <input
                      className="form-check-input"
                      type="radio"
                      name="onedrivePath"
                      id={`path${index}`}
                      value={pathInfo.path}
                      checked={selectedPath === pathInfo.path}
                      onChange={(e) => setSelectedPath(e.target.value)}
                    />
                    <label className="form-check-label w-100" htmlFor={`path${index}`}>
                      <div className="d-flex justify-content-between align-items-center">
                        <div>
                          <strong>{pathInfo.name}</strong>
                          <br />
                          <small className="text-muted">{pathInfo.path}</small>
                        </div>
                        <div className="text-end">
                          {pathInfo.exists ? (
                            <span className="badge bg-success">Available</span>
                          ) : (
                            <span className="badge bg-warning">Will be created</span>
                          )}
                        </div>
                      </div>
                    </label>
                  </div>
                ))}
              </div>
            ) : (
              <div className="alert alert-warning">
                <i className="bi bi-exclamation-triangle me-2"></i>
                No OneDrive installations detected. Please install OneDrive and try again.
              </div>
            )}
          </div>
        </div>

        {/* Message Display */}
        {message && (
          <div className={`alert alert-${message.type} d-flex align-items-center`}>
            <i className={`bi bi-${message.type === 'success' ? 'check-circle-fill' : 
                                  message.type === 'error' ? 'exclamation-triangle-fill' : 
                                  'info-circle-fill'} me-2`}></i>
            <div>{message.text}</div>
          </div>
        )}

        {/* Action Buttons */}
        {availablePaths.length > 0 && (
          <div className="row">
            <div className="col-12">
              <div className="d-flex gap-2">
                <button
                  className="btn btn-outline-secondary"
                  onClick={testSelectedPath}
                  disabled={!selectedPath || saving}
                >
                  <i className="bi bi-check-circle me-1"></i>
                  Test Path
                </button>
                
                <button
                  className="btn btn-primary"
                  onClick={updateOneDrivePath}
                  disabled={!selectedPath || saving || selectedPath === currentPath}
                >
                  {saving ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                      Updating...
                    </>
                  ) : (
                    <>
                      <i className="bi bi-save me-1"></i>
                      {selectedPath === currentPath ? 'Current Path' : 'Update Path'}
                    </>
                  )}
                </button>

                <button
                  className="btn btn-outline-primary"
                  onClick={loadOneDrivePaths}
                  disabled={loading || saving}
                >
                  <i className="bi bi-arrow-clockwise me-1"></i>
                  Refresh
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Help Information */}
        <div className="row mt-4">
          <div className="col-12">
            <div className="alert alert-light">
              <h6><i className="bi bi-info-circle me-2"></i>How it works:</h6>
              <ul className="mb-0 small">
                <li>The application will create a GK-Finance-Data folder in your selected OneDrive location</li>
                <li>All data files will be stored in the data subfolder within this directory</li>
                <li>OneDrive will automatically sync files to the cloud and other devices</li>
                <li>You can change the location anytime, and existing data will be migrated</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
