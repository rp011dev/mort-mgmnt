'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'Login failed')
        setLoading(false)
        return
      }

      // Store token and user info
      localStorage.setItem('token', data.token)
      localStorage.setItem('user', JSON.stringify(data.user))

      // Redirect to home page
      router.push('/')
    } catch (err) {
      console.error('Login error:', err)
      setError('An error occurred. Please try again.')
      setLoading(false)
    }
  }

return (
    <div className="d-flex align-items-center justify-content-center" style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
        <div className="container">
            <div className="row justify-content-center">
                <div className="col-11 col-sm-8 col-md-6 col-lg-5 col-xl-4">
                    <div className="card shadow-lg border-0" style={{ borderRadius: '1rem' }}>
                        <div className="card-body p-4">
                            {/* Logo/Brand */}
                            <div className="text-center mb-3">
                                <div className="mb-2 d-flex justify-content-center align-items-center" style={{ height: '50px', width: '100%' }}>
                                    <svg width="240" height="45" viewBox="0 0 240 45" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ display: 'block', margin: '0 auto' }}>
                                        {/* Decorative house icon */}
                                        <path d="M10 10L25 2L40 10V35H10V10Z" fill="#0088cc"/>
                                        
                                        {/* GK FINANCE text */}
                                        <text x="55" y="25" fontFamily="Arial, sans-serif" fontSize="18" fontWeight="bold" fill="#667eea" textAnchor="start">
                                            GK FINANCE
                                        </text>
                                        
                                        {/* MORTGAGE & INSURANCE text */}
                                        <text x="55" y="37" fontFamily="Arial, sans-serif" fontSize="9" letterSpacing="1.5" fill="#667eea" opacity="0.9" textAnchor="start">
                                            MORTGAGE &amp; INSURANCE
                                        </text>
                                    </svg>
                                </div>
                            </div>

                            {/* Welcome Text */}
                            <div className="text-center mb-3">
                                <h6 className="fw-bold mb-0" style={{ textAlign: 'center' }}>Welcome Back!</h6>
                            </div>

                            {/* Error Alert */}
                            {error && (
                                <div className="alert alert-danger alert-dismissible fade show" role="alert">
                                    <i className="bi bi-exclamation-triangle-fill me-2"></i>
                                    {error}
                                    <button 
                                        type="button" 
                                        className="btn-close" 
                                        onClick={() => setError('')}
                                        aria-label="Close"
                                    ></button>
                                </div>
                            )}

                            {/* Login Form */}
                            <form onSubmit={handleSubmit}>
                                {/* Email Input */}
                                <div className="mb-2">
                                    <label htmlFor="email" className="form-label small mb-1">
                                        <i className="bi bi-envelope me-1"></i>Email
                                    </label>
                                    <input
                                        id="email"
                                        name="email"
                                        type="email"
                                        autoComplete="email"
                                        required
                                        className="form-control"
                                        placeholder="Enter your email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        disabled={loading}
                                        style={{ borderRadius: '0.5rem' }}
                                    />
                                </div>

                                {/* Password Input */}
                                <div className="mb-2">
                                    <label htmlFor="password" className="form-label small mb-1">
                                        <i className="bi bi-lock me-1"></i>Password
                                    </label>
                                    <div className="input-group">
                                        <input
                                            id="password"
                                            name="password"
                                            type={showPassword ? 'text' : 'password'}
                                            autoComplete="current-password"
                                            required
                                            className="form-control"
                                            placeholder="Enter your password"
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            disabled={loading}
                                            style={{ borderRadius: '0.5rem 0 0 0.5rem' }}
                                        />
                                        <button
                                            className="btn btn-outline-secondary btn-sm"
                                            type="button"
                                            onClick={() => setShowPassword(!showPassword)}
                                            disabled={loading}
                                            style={{ borderRadius: '0 0.5rem 0.5rem 0' }}
                                        >
                                            <i className={`bi bi-eye${showPassword ? '-slash' : ''}`}></i>
                                        </button>
                                    </div>
                                </div>

                                {/* Submit Button */}
                                <div className="d-grid mt-3">
                                    <button
                                        type="submit"
                                        disabled={loading}
                                        className="btn btn-primary"
                                        style={{ borderRadius: '0.5rem' }}
                                    >
                                        {loading ? (
                                            <>
                                                <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                                                Signing in...
                                            </>
                                        ) : (
                                            <>
                                                <i className="bi bi-box-arrow-in-right me-2"></i>
                                                Sign In
                                            </>
                                        )}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
)
}
