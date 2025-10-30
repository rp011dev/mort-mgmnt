'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

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

  const logout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    setUser(null)
    setAuthenticated(false)
    router.push('/login')
  }

  return { user, loading, authenticated, logout }
}
