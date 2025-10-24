'use client'
import { useEffect } from 'react'

export default function ConfirmModal({ 
  isOpen, 
  onClose, 
  onConfirm, 
  title = "Confirm Action",
  message = "Are you sure you want to proceed?",
  confirmText = "Confirm",
  cancelText = "Cancel",
  type = "danger", // danger, warning, info, success
  icon = null,
  details = null
}) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }
    
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [isOpen])

  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        onClose()
      }
    }

    if (isOpen) {
      document.addEventListener('keydown', handleEscape)
    }

    return () => {
      document.removeEventListener('keydown', handleEscape)
    }
  }, [isOpen, onClose])

  if (!isOpen) return null

  const getTypeConfig = () => {
    switch (type) {
      case 'danger':
        return {
          iconClass: 'bi-exclamation-triangle-fill text-danger',
          buttonClass: 'btn-danger',
          gradientClass: 'danger-gradient'
        }
      case 'warning':
        return {
          iconClass: 'bi-exclamation-triangle-fill text-warning',
          buttonClass: 'btn-warning',
          gradientClass: 'warning-gradient'
        }
      case 'info':
        return {
          iconClass: 'bi-info-circle-fill text-info',
          buttonClass: 'btn-info',
          gradientClass: 'info-gradient'
        }
      case 'success':
        return {
          iconClass: 'bi-check-circle-fill text-success',
          buttonClass: 'btn-success',
          gradientClass: 'success-gradient'
        }
      default:
        return {
          iconClass: 'bi-question-circle-fill text-primary',
          buttonClass: 'btn-primary',
          gradientClass: 'primary-gradient'
        }
    }
  }

  const config = getTypeConfig()

  return (
    <>
      <style jsx>{`
        .confirm-modal-backdrop {
          background: rgba(0, 0, 0, 0.6);
          backdrop-filter: blur(8px);
          z-index: 1055;
        }
        
        .confirm-modal-content {
          border: none;
          border-radius: 16px;
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
          overflow: hidden;
          transform: scale(0.9);
          opacity: 0;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          max-width: 500px;
          margin: 0 auto;
        }
        
        .confirm-modal-content.show {
          transform: scale(1);
          opacity: 1;
        }
        
        .confirm-modal-header {
          background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
          border-bottom: 1px solid rgba(0, 0, 0, 0.1);
          padding: 1.5rem;
        }
        
        .confirm-modal-body {
          padding: 2rem 1.5rem;
          background: white;
        }
        
        .confirm-modal-footer {
          background: #f8f9fa;
          padding: 1.25rem 1.5rem;
          border-top: 1px solid rgba(0, 0, 0, 0.1);
        }
        
        .confirm-icon {
          width: 48px;
          height: 48px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 24px;
          margin-bottom: 1rem;
        }
        
        .danger-gradient {
          background: linear-gradient(135deg, rgba(220, 53, 69, 0.1) 0%, rgba(220, 53, 69, 0.05) 100%);
        }
        
        .warning-gradient {
          background: linear-gradient(135deg, rgba(255, 193, 7, 0.1) 0%, rgba(255, 193, 7, 0.05) 100%);
        }
        
        .info-gradient {
          background: linear-gradient(135deg, rgba(13, 202, 240, 0.1) 0%, rgba(13, 202, 240, 0.05) 100%);
        }
        
        .success-gradient {
          background: linear-gradient(135deg, rgba(25, 135, 84, 0.1) 0%, rgba(25, 135, 84, 0.05) 100%);
        }
        
        .primary-gradient {
          background: linear-gradient(135deg, rgba(13, 110, 253, 0.1) 0%, rgba(13, 110, 253, 0.05) 100%);
        }
        
        .confirm-details {
          background: #f8f9fa;
          border-radius: 8px;
          padding: 1rem;
          font-family: 'Courier New', monospace;
          font-size: 0.9rem;
          border-left: 4px solid var(--bs-primary);
          margin-top: 1rem;
        }
        
        .btn-modern {
          border-radius: 8px;
          font-weight: 600;
          padding: 0.75rem 1.5rem;
          border: none;
          transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        }
        
        .btn-modern:hover {
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        }
        
        .btn-modern:active {
          transform: translateY(0);
        }
        
        .btn-secondary-modern {
          background: #6c757d;
          color: white;
        }
        
        .btn-secondary-modern:hover {
          background: #5a6268;
          color: white;
        }
      `}</style>
      
      <div className="modal show d-block confirm-modal-backdrop">
        <div className="modal-dialog modal-dialog-centered">
          <div className={`modal-content confirm-modal-content ${isOpen ? 'show' : ''}`}>
            <div className="confirm-modal-header">
              <div className="d-flex align-items-center">
                <div className={`confirm-icon ${config.gradientClass} me-3`}>
                  <i className={icon || config.iconClass}></i>
                </div>
                <div>
                  <h5 className="modal-title mb-0 fw-bold">{title}</h5>
                </div>
              </div>
            </div>
            
            <div className="confirm-modal-body text-center">
              <p className="mb-0 text-muted fs-6">{message}</p>
              {details && (
                <div className="confirm-details text-start">
                  {details}
                </div>
              )}
            </div>
            
            <div className="confirm-modal-footer d-flex gap-3 justify-content-end">
              <button 
                type="button" 
                className="btn btn-secondary-modern btn-modern"
                onClick={onClose}
              >
                <i className="bi bi-x-circle me-2"></i>
                {cancelText}
              </button>
              <button 
                type="button" 
                className={`btn ${config.buttonClass} btn-modern`}
                onClick={onConfirm}
              >
                <i className="bi bi-check-circle me-2"></i>
                {confirmText}
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
