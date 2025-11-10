'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { authenticatedFetch, isAuthenticated, getAuthHeaders } from '@/utils/authenticatedFetch'

export function useAuth(requireAuth = true) {
  const router = useRouter()
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [authenticated, setAuthenticated] = useState(false)

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const token = localStorage.getItem('token')
        const storedUser = localStorage.getItem('user')

        if (!token || !storedUser) {
          if (requireAuth) {
            router.push('/login')
          }
          setLoading(false)
          return
        }

        // Verify token with backend
        const response = await fetch('/api/auth/verify', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        })

        if (!response.ok) {
          // Token is invalid or expired
          localStorage.removeItem('token')
          localStorage.removeItem('user')
          if (requireAuth) {
            router.push('/login')
          }
          setLoading(false)
          return
        }

        const data = await response.json()
        setUser(data.user)
        setAuthenticated(true)
        setLoading(false)
      } catch (error) {
        console.error('Auth check error:', error)
        localStorage.removeItem('token')
        localStorage.removeItem('user')
        if (requireAuth) {
          router.push('/login')
        }
        setLoading(false)
      }
    }

    checkAuth()
  }, [requireAuth, router])

  const logout = async () => {
    try {
      // Call logout API to log the event
      const token = localStorage.getItem('token')
      if (token) {
        await fetch('/api/auth/logout', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        })
      }
    } catch (error) {
      console.error('Logout API error:', error)
      // Continue with logout even if API call fails
    } finally {
      // Clear local storage and redirect
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      setUser(null)
      setAuthenticated(false)
      router.push('/login')
    }
  }

  return { 
    user, 
    loading, 
    authenticated, 
    logout,
    // Export utility functions for use in components
    authenticatedFetch,
    isAuthenticated,
    getAuthHeaders
  }
}
