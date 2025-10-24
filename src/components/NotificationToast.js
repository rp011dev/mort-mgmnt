'use client'
import { useEffect, useState } from 'react'

export default function NotificationToast({ 
  isOpen, 
  onClose, 
  message = "",
  type = "info", // success, error, warning, info
  duration = 4000,
  title = null,
  autoClose = true
}) {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    if (isOpen) {
      setIsVisible(true)
      if (autoClose && duration > 0) {
        const timer = setTimeout(() => {
          handleClose()
        }, duration)
        return () => clearTimeout(timer)
      }
    }
  }, [isOpen, duration, autoClose])

  const handleClose = () => {
    setIsVisible(false)
    setTimeout(() => {
      onClose()
    }, 300)
  }

  const getTypeConfig = () => {
    switch (type) {
      case 'success':
        return {
          icon: 'bi-check-circle-fill',
          bgClass: 'toast-success',
          iconColor: 'text-success'
        }
      case 'error':
        return {
          icon: 'bi-x-circle-fill',
          bgClass: 'toast-error',
          iconColor: 'text-danger'
        }
      case 'warning':
        return {
          icon: 'bi-exclamation-triangle-fill',
          bgClass: 'toast-warning',
          iconColor: 'text-warning'
        }
      case 'info':
      default:
        return {
          icon: 'bi-info-circle-fill',
          bgClass: 'toast-info',
          iconColor: 'text-info'
        }
    }
  }

  if (!isOpen) return null

  const config = getTypeConfig()

  return (
    <>
      <style jsx>{`
        .toast-container {
          position: fixed;
          top: 20px;
          right: 20px;
          z-index: 1060;
          max-width: 400px;
          min-width: 300px;
        }
        
        .modern-toast {
          border: none;
          border-radius: 12px;
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.15);
          backdrop-filter: blur(10px);
          border: 1px solid rgba(255, 255, 255, 0.2);
          transform: translateX(400px);
          opacity: 0;
          transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
          overflow: hidden;
        }
        
        .modern-toast.show {
          transform: translateX(0);
          opacity: 1;
        }
        
        .toast-success {
          background: linear-gradient(135deg, rgba(25, 135, 84, 0.95) 0%, rgba(32, 201, 151, 0.95) 100%);
          color: white;
        }
        
        .toast-error {
          background: linear-gradient(135deg, rgba(220, 53, 69, 0.95) 0%, rgba(231, 76, 60, 0.95) 100%);
          color: white;
        }
        
        .toast-warning {
          background: linear-gradient(135deg, rgba(255, 193, 7, 0.95) 0%, rgba(255, 235, 59, 0.95) 100%);
          color: #000;
        }
        
        .toast-info {
          background: linear-gradient(135deg, rgba(13, 202, 240, 0.95) 0%, rgba(0, 123, 255, 0.95) 100%);
          color: white;
        }
        
        .toast-header-modern {
          border-bottom: none;
          padding: 1rem 1.25rem 0.5rem;
          background: transparent;
        }
        
        .toast-body-modern {
          padding: 0.5rem 1.25rem 1rem;
          background: transparent;
        }
        
        .toast-close-btn {
          background: rgba(255, 255, 255, 0.2);
          border: none;
          border-radius: 50%;
          width: 28px;
          height: 28px;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s ease;
          opacity: 0.8;
        }
        
        .toast-close-btn:hover {
          background: rgba(255, 255, 255, 0.3);
          opacity: 1;
          transform: scale(1.1);
        }
        
        .toast-icon {
          width: 24px;
          height: 24px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 18px;
          margin-right: 0.75rem;
        }
        
        .progress-bar-container {
          position: absolute;
          bottom: 0;
          left: 0;
          right: 0;
          height: 3px;
          background: rgba(255, 255, 255, 0.2);
          overflow: hidden;
        }
        
        .progress-bar {
          height: 100%;
          background: rgba(255, 255, 255, 0.6);
          transform-origin: left;
          animation: progress-animation ${duration}ms linear;
        }
        
        @keyframes progress-animation {
          from {
            transform: scaleX(1);
          }
          to {
            transform: scaleX(0);
          }
        }
      `}</style>
      
      <div className="toast-container">
        <div className={`toast modern-toast ${config.bgClass} ${isVisible ? 'show' : ''}`} role="alert">
          <div className="toast-header-modern d-flex align-items-center justify-content-between">
            <div className="d-flex align-items-center">
              <div className="toast-icon">
                <i className={config.icon}></i>
              </div>
              {title && <strong className="me-auto">{title}</strong>}
            </div>
            <button 
              type="button" 
              className="toast-close-btn"
              onClick={handleClose}
            >
              <i className="bi bi-x" style={{fontSize: '14px'}}></i>
            </button>
          </div>
          <div className="toast-body-modern">
            {message}
          </div>
          {autoClose && duration > 0 && (
            <div className="progress-bar-container">
              <div className="progress-bar"></div>
            </div>
          )}
        </div>
      </div>
    </>
  )
}
