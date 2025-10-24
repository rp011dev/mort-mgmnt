'use client'

import { useUser } from '../context/UserContext'
import styles from './UserSelector.module.css'

export default function UserSelector() {
  const { currentUser, users, loading, switchUser } = useUser()

  if (loading) {
    return (
      <div className="dropdown">
        <button className="btn btn-outline-light dropdown-toggle" type="button" disabled>
          <i className="bi bi-person-circle me-2"></i>
          Loading...
        </button>
      </div>
    )
  }

  if (!currentUser) {
    return null
  }

  return (
    <div className="dropdown h-100" style={{ position: 'static' }}>
      <button 
        className="btn btn-outline-light dropdown-toggle d-flex align-items-center h-100" 
        type="button" 
        data-bs-toggle="dropdown" 
        aria-expanded="false"
        style={{ border: 'none', background: 'transparent', padding: '0.5rem 1rem' }}
      >
        <i className="bi bi-person-circle me-2" style={{ fontSize: '1.2rem' }}></i>
        <div className="text-start d-none d-sm-block">
          <div style={{ fontSize: '0.9rem', lineHeight: '1.2' }}>{currentUser.name}</div>
          <div style={{ fontSize: '0.75rem', opacity: '0.8' }}>{currentUser.role}</div>
        </div>
        <div className="d-sm-none">
          <span style={{ fontSize: '0.9rem' }}>{currentUser.name.split(' ')[0]}</span>
        </div>
      </button>
      <ul className="dropdown-menu dropdown-menu-end shadow" 
          style={{ 
            minWidth: '200px', 
            position: 'absolute', 
            zIndex: 10000, 
            top: 'calc(100% + 0.5rem)', 
            right: '0',
            border: 'none',
            borderRadius: '8px',
            padding: '0.5rem'
          }}>
        {users.map(user => (
          <li key={user.id}>
            <button 
              className={`dropdown-item d-flex align-items-center ${styles.userOption} ${user.id === currentUser.id ? 'active' : ''}`}
              onClick={() => switchUser(user.id)}
              style={{ 
                borderRadius: '6px',
                padding: '0.5rem 0.75rem',
                margin: '0.125rem 0'
              }}
            >
              <div className="me-3">
                <i className={`bi ${user.id === currentUser.id ? 'bi-person-check-fill' : 'bi-person'}`}></i>
              </div>
              <div className="flex-grow-1">
                <div className="fw-semibold" style={{ color: '#0d6efd' }}>{user.name}</div>
                <div className="text-muted small">{user.role}</div>
              </div>
            </button>
          </li>
        ))}
      </ul>
    </div>
  )
}
