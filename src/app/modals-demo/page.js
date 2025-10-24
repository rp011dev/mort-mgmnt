'use client'
import { useState } from 'react'
import ConfirmModal from '../../components/ConfirmModal'
import NotificationToast from '../../components/NotificationToast'

export default function ModalsDemo() {
  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    title: '',
    message: '',
    details: '',
    type: 'danger',
    onConfirm: () => {},
    confirmText: 'Confirm',
    cancelText: 'Cancel'
  })
  
  const [notification, setNotification] = useState({
    isOpen: false,
    message: '',
    type: 'info',
    title: ''
  })

  const showNotification = (message, type = 'info', title = '') => {
    setNotification({
      isOpen: true,
      message,
      type,
      title
    })
  }

  const showConfirmation = (title, message, onConfirm, options = {}) => {
    setConfirmModal({
      isOpen: true,
      title,
      message,
      details: options.details || '',
      type: options.type || 'danger',
      onConfirm,
      confirmText: options.confirmText || 'Confirm',
      cancelText: options.cancelText || 'Cancel'
    })
  }

  const closeConfirmModal = () => {
    setConfirmModal(prev => ({ ...prev, isOpen: false }))
  }

  const closeNotification = () => {
    setNotification(prev => ({ ...prev, isOpen: false }))
  }

  const handleDemoDelete = () => {
    const confirmDelete = () => {
      showNotification('Item deleted successfully!', 'success', 'Delete Successful')
      closeConfirmModal()
    }

    showConfirmation(
      'Delete Item',
      'This action cannot be undone. Are you sure you want to delete this item?',
      confirmDelete,
      {
        type: 'danger',
        confirmText: 'Delete Item',
        cancelText: 'Keep Item',
        details: 'File: example-document.pdf\nType: Important Document\nSize: 2.5 MB'
      }
    )
  }

  return (
    <div className="container mt-5">
      <div className="row justify-content-center">
        <div className="col-md-8">
          <div className="card">
            <div className="card-header">
              <h3 className="card-title mb-0">Modern Modals Demo</h3>
            </div>
            <div className="card-body">
              <p className="mb-4">
                This page demonstrates the new modern modals that replace old browser popups.
              </p>
              
              <div className="row g-3">
                <div className="col-md-6">
                  <h5>Confirmation Modals</h5>
                  <div className="d-grid gap-2">
                    <button 
                      className="btn btn-danger"
                      onClick={handleDemoDelete}
                    >
                      <i className="bi bi-trash me-2"></i>
                      Test Delete Confirmation
                    </button>
                    
                    <button 
                      className="btn btn-warning"
                      onClick={() => showConfirmation(
                        'Warning Action',
                        'This action requires your attention.',
                        () => {
                          showNotification('Warning action confirmed', 'warning', 'Action Completed')
                          closeConfirmModal()
                        },
                        { type: 'warning', confirmText: 'Proceed', cancelText: 'Cancel' }
                      )}
                    >
                      <i className="bi bi-exclamation-triangle me-2"></i>
                      Test Warning Modal
                    </button>
                    
                    <button 
                      className="btn btn-info"
                      onClick={() => showConfirmation(
                        'Information Required',
                        'Please confirm this information action.',
                        () => {
                          showNotification('Information confirmed', 'info', 'Thank You')
                          closeConfirmModal()
                        },
                        { type: 'info', confirmText: 'Confirm', cancelText: 'Cancel' }
                      )}
                    >
                      <i className="bi bi-info-circle me-2"></i>
                      Test Info Modal
                    </button>
                  </div>
                </div>
                
                <div className="col-md-6">
                  <h5>Notification Toasts</h5>
                  <div className="d-grid gap-2">
                    <button 
                      className="btn btn-success"
                      onClick={() => showNotification('Operation completed successfully!', 'success', 'Success')}
                    >
                      <i className="bi bi-check-circle me-2"></i>
                      Test Success Toast
                    </button>
                    
                    <button 
                      className="btn btn-danger"
                      onClick={() => showNotification('An error occurred while processing your request.', 'error', 'Error')}
                    >
                      <i className="bi bi-x-circle me-2"></i>
                      Test Error Toast
                    </button>
                    
                    <button 
                      className="btn btn-warning"
                      onClick={() => showNotification('Please review your input before proceeding.', 'warning', 'Warning')}
                    >
                      <i className="bi bi-exclamation-triangle me-2"></i>
                      Test Warning Toast
                    </button>
                    
                    <button 
                      className="btn btn-info"
                      onClick={() => showNotification('Here is some helpful information for you.', 'info', 'Information')}
                    >
                      <i className="bi bi-info-circle me-2"></i>
                      Test Info Toast
                    </button>
                  </div>
                </div>
              </div>
              
              <div className="mt-4 pt-4 border-top">
                <h6>Features:</h6>
                <ul className="list-unstyled">
                  <li><i className="bi bi-check-circle text-success me-2"></i>Modern, animated design</li>
                  <li><i className="bi bi-check-circle text-success me-2"></i>Responsive and accessible</li>
                  <li><i className="bi bi-check-circle text-success me-2"></i>Keyboard support (ESC to close)</li>
                  <li><i className="bi bi-check-circle text-success me-2"></i>Auto-dismiss for notifications</li>
                  <li><i className="bi bi-check-circle text-success me-2"></i>Backdrop blur effect</li>
                  <li><i className="bi bi-check-circle text-success me-2"></i>Progress bar for timed notifications</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Modals */}
      <ConfirmModal
        isOpen={confirmModal.isOpen}
        onClose={closeConfirmModal}
        onConfirm={confirmModal.onConfirm}
        title={confirmModal.title}
        message={confirmModal.message}
        details={confirmModal.details}
        type={confirmModal.type}
        confirmText={confirmModal.confirmText}
        cancelText={confirmModal.cancelText}
      />

      <NotificationToast
        isOpen={notification.isOpen}
        onClose={closeNotification}
        message={notification.message}
        type={notification.type}
        title={notification.title}
      />
    </div>
  )
}
