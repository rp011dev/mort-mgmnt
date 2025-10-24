'use client'

import { usePathname } from 'next/navigation'
import UserSelector from './UserSelector'

export default function Navigation() {
  const pathname = usePathname()

  const isActive = (path) => {
    if (path === '/' && pathname === '/') return true
    if (path !== '/' && pathname.startsWith(path)) return true
    return false
  }

  return (
    <nav className="navbar navbar-expand-lg navbar-dark bg-primary shadow-sm" style={{ minHeight: '60px', position: 'relative', zIndex: 9999 }}>
      <div className="container h-100">
        <a className="navbar-brand d-flex align-items-center h-100" href="/">
          <div style={{ height: '35px', marginTop: '-2px' }}>
            <svg width="220" height="35" viewBox="0 0 220 35" fill="none" xmlns="http://www.w3.org/2000/svg">
              {/* Decorative house icon */}
              <path d="M5 5L15 0L25 5V20H5V5Z" fill="#0088cc"/>
              
              {/* GK FINANCE text */}
              <text x="30" y="20" fontFamily="Arial" fontSize="16" fontWeight="bold" fill="#ffffff">
                GK FINANCE
              </text>
              
              {/* MORTGAGE & INSURANCE text */}
              <text x="30" y="30" fontFamily="Arial" fontSize="8" letterSpacing="1" fill="#ffffff" opacity="0.9">
                MORTGAGE & INSURANCE
              </text>
            </svg>
          </div>
        </a>
        
        <button 
          className="navbar-toggler" 
          type="button" 
          data-bs-toggle="collapse" 
          data-bs-target="#navbarNav"
          aria-controls="navbarNav"
          aria-expanded="false"
          aria-label="Toggle navigation"
        >
          <span className="navbar-toggler-icon"></span>
        </button>
        
        <div className="collapse navbar-collapse" id="navbarNav">
          <ul className="navbar-nav me-auto">
                        <li className="nav-item">
              <a 
                className={`nav-link px-2 py-1 rounded ${isActive('/') ? 'active' : ''}`} 
                href="/"
              >
                <i className="bi bi-house me-1"></i>
                Home
              </a>
            </li>
            <li className="nav-item">
              <a 
                className={`nav-link px-2 py-1 rounded ${isActive('/dashboard') ? 'active' : ''}`} 
                href="/dashboard"
              >
                <i className="bi bi-graph-up me-1"></i>
                Dashboard
              </a>
            </li>
            <li className="nav-item">
              <a 
                className={`nav-link px-2 py-1 rounded ${isActive('/customers') ? 'active' : ''}`} 
                href="/customers"
              >
                <i className="bi bi-people me-1"></i>
                Customers
              </a>
            </li>
            <li className="nav-item">
              <a 
                className={`nav-link px-2 py-1 rounded ${isActive('/enquiries') ? 'active' : ''}`} 
                href="/enquiries"
              >
                <i className="bi bi-funnel me-1"></i>
                Enquiries
              </a>
            </li>
            <li className="nav-item">
              <a 
                className={`nav-link px-2 py-1 rounded ${isActive('/dashboard/onedrive') ? 'active' : ''}`} 
                href="/dashboard/onedrive"
              >
                <i className="bi bi-cloud-arrow-up me-1"></i>
                OneDrive
              </a>
            </li>
          </ul>
          
          <div className="d-flex align-items-center h-100" style={{ position: 'relative', zIndex: 1050 }}>
            <UserSelector />
          </div>
        </div>
      </div>
    </nav>
  )
}
