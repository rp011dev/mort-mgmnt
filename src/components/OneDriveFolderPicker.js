'use client'

import { useState, useEffect } from 'react'

export default function OneDriveFolderPicker() {
  const [availableFolders, setAvailableFolders] = useState([])
  const [selectedFolder, setSelectedFolder] = useState(null)
  const [loading, setLoading] = useState(true)
  const [configuring, setConfiguring] = useState(false)
  const [currentConfig, setCurrentConfig] = useState(null)

  useEffect(() => {
    loadAvailableFolders()
    loadCurrentConfig()
  }, [])

  const loadAvailableFolders = async () => {
    try {
      const response = await fetch('/api/onedrive-folder-picker')
      const data = await response.json()
      
      if (data.success) {
        setAvailableFolders(data.availableFolders)
      } else {
        console.error('Failed to load OneDrive folders:', data.error)
      }
    } catch (error) {
      console.error('Error loading OneDrive folders:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadCurrentConfig = async () => {
    try {
      const response = await fetch('/api/onedrive-status')
      const data = await response.json()
      
      if (data.status === 'success') {
        setCurrentConfig({
          dataDirectory: data.dataDirectory,
          documentsFolder: data.documentsFolder?.path
        })
      }
    } catch (error) {
      console.error('Error loading current config:', error)
    }
  }

  const handleFolderSelect = async (folder) => {
    setConfiguring(true)
    
    try {
      const response = await fetch('/api/onedrive-folder-picker', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          selectedPath: folder.gkFinanceDataPath
        })
      })
      
      const result = await response.json()
      
      if (result.success) {
        setSelectedFolder(folder)
        setCurrentConfig({
          dataDirectory: result.config.dataFolder,
          documentsFolder: result.config.documentsFolder
        })
        
        // Refresh the page to reload with new configuration
        setTimeout(() => {
          window.location.reload()
        }, 2000)
        
        alert('OneDrive folder configured successfully! The page will refresh to apply changes.')
      } else {
        alert('Failed to configure OneDrive folder: ' + result.error)
      }
    } catch (error) {
      console.error('Error configuring folder:', error)
      alert('Error configuring folder: ' + error.message)
    } finally {
      setConfiguring(false)
    }
  }

  const createNewFolder = async (oneDriveRoot) => {
    setConfiguring(true)
    
    try {
      const newGKFinanceDataPath = `${oneDriveRoot}/GK-Finance-Data`
      
      const response = await fetch('/api/onedrive-folder-picker', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          selectedPath: newGKFinanceDataPath
        })
      })
      
      const result = await response.json()
      
      if (result.success) {
        alert('New GK-Finance-Data folder created successfully! The page will refresh.')
        setTimeout(() => {
          window.location.reload()
        }, 2000)
      } else {
        alert('Failed to create folder: ' + result.error)
      }
    } catch (error) {
      console.error('Error creating folder:', error)
      alert('Error creating folder: ' + error.message)
    } finally {
      setConfiguring(false)
    }
  }

  if (loading) {
    return (
      <div className="card border-primary">
        <div className="card-header bg-primary text-white">
          <h6 className="card-title mb-0">
            <i className="bi bi-folder2-open me-2"></i>
            OneDrive Folder Selector
          </h6>
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
        <h6 className="card-title mb-0">
          <i className="bi bi-folder2-open me-2"></i>
          OneDrive Folder Selector
        </h6>
      </div>
      <div className="card-body">
        {currentConfig && (
          <div className="alert alert-info mb-3">
            <h6><i className="bi bi-info-circle me-2"></i>Current Configuration</h6>
            <div className="small">
              <strong>Data Folder:</strong> <code>{currentConfig.dataDirectory}</code><br/>
              <strong>Documents Folder:</strong> <code>{currentConfig.documentsFolder}</code>
            </div>
          </div>
        )}

        <p className="mb-3">
          Select your OneDrive folder where GK Finance data should be stored. The application will use:
        </p>
        <ul className="small text-muted mb-3">
          <li><strong>Selected Folder + /data</strong> - for JSON data files</li>
          <li><strong>Selected Folder + /documents</strong> - for customer documents</li>
        </ul>

        {availableFolders.length === 0 ? (
          <div className="alert alert-warning">
            <h6><i className="bi bi-exclamation-triangle me-2"></i>No OneDrive Found</h6>
            <p className="mb-0">Please install and configure OneDrive on your system first.</p>
          </div>
        ) : (
          <div className="row">
            {availableFolders.map((folder, index) => (
              <div key={index} className="col-12 mb-3">
                <div className={`card ${folder.exists ? 'border-success' : 'border-warning'}`}>
                  <div className="card-body">
                    <div className="d-flex justify-content-between align-items-start">
                      <div className="flex-grow-1">
                        <h6 className="card-title">
                          <i className="bi bi-cloud me-2"></i>
                          {folder.name}
                        </h6>
                        <p className="small text-muted mb-2">
                          <code>{folder.gkFinanceDataPath}</code>
                        </p>
                        
                        <div className="row">
                          <div className="col-6">
                            <small>
                              📁 GK-Finance-Data: {folder.exists ? '✅ Exists' : '❌ Missing'}<br/>
                              📄 Data Folder: {folder.hasData ? '✅ Ready' : '⚠️ Will be created'}<br/>
                              📋 Documents Folder: {folder.hasDocuments ? '✅ Ready' : '⚠️ Will be created'}
                            </small>
                          </div>
                        </div>
                      </div>
                      
                      <div className="ms-3">
                        {folder.exists ? (
                          <button 
                            className="btn btn-success btn-sm"
                            onClick={() => handleFolderSelect(folder)}
                            disabled={configuring}
                          >
                            {configuring ? (
                              <>
                                <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                                Configuring...
                              </>
                            ) : (
                              <>
                                <i className="bi bi-check-circle me-2"></i>
                                Select This Folder
                              </>
                            )}
                          </button>
                        ) : (
                          <button 
                            className="btn btn-outline-warning btn-sm"
                            onClick={() => createNewFolder(folder.oneDriveRoot)}
                            disabled={configuring}
                          >
                            {configuring ? (
                              <>
                                <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                                Creating...
                              </>
                            ) : (
                              <>
                                <i className="bi bi-plus-circle me-2"></i>
                                Create & Select
                              </>
                            )}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
