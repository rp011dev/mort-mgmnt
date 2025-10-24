'use client'

import { createContext, useContext, useState, useEffect } from 'react'

const UserContext = createContext()

export function UserProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null)
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await fetch('/api/users?activeOnly=true')
        if (response.ok) {
          const usersData = await response.json()
          setUsers(usersData)
          
          // Set default user (first advisor if available, otherwise first user)
          const defaultUser = usersData.find(u => u.role === 'Advisor') || usersData[0]
          if (defaultUser) {
            setCurrentUser(defaultUser)
          }
        }
      } catch (error) {
        console.error('Error fetching users:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchUsers()
  }, [])

  const switchUser = (userId) => {
    const user = users.find(u => u.id === userId)
    if (user) {
      setCurrentUser(user)
    }
  }

  return (
    <UserContext.Provider value={{
      currentUser,
      users,
      loading,
      switchUser
    }}>
      {children}
    </UserContext.Provider>
  )
}

export function useUser() {
  const context = useContext(UserContext)
  if (!context) {
    throw new Error('useUser must be used within a UserProvider')
  }
  return context
}
