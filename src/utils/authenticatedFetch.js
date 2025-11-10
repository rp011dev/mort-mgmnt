'use client'

/**
 * Authenticated Fetch Utility
 * 
 * This utility ensures that API calls are ONLY made when a valid token exists.
 * It prevents unnecessary network requests to the backend when not authenticated.
 */

/**
 * Check if user is authenticated and has a valid token
 * @returns {boolean} - True if token exists, false otherwise
 */
export function isAuthenticated() {
  if (typeof window === 'undefined') return false
  
  const token = localStorage.getItem('token')
  return !!token
}

/**
 * Get the authentication token
 * @returns {string|null} - JWT token or null
 */
export function getAuthToken() {
  if (typeof window === 'undefined') return null
  
  return localStorage.getItem('token')
}

/**
 * Get authentication headers for API requests
 * @param {boolean} includeContentType - Whether to include Content-Type header (default: true)
 * @returns {Object} - Headers object with Authorization
 */
export function getAuthHeaders(includeContentType = true) {
  const token = getAuthToken()
  
  const headers = {}
  
  if (includeContentType) {
    headers['Content-Type'] = 'application/json'
  }
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }
  
  return headers
}

/**
 * Authenticated fetch wrapper
 * Automatically adds auth headers and checks token before making request
 * 
 * @param {string} url - API endpoint URL
 * @param {Object} options - Fetch options
 * @returns {Promise<Response>} - Fetch response
 * @throws {Error} - If not authenticated
 */
export async function authenticatedFetch(url, options = {}) {
  // Check if token exists before making the request
  if (!isAuthenticated()) {
    console.error('🚫 API call blocked: Not authenticated')
    throw new Error('Authentication required. Please login to continue.')
  }

  const token = getAuthToken()
  
  // Merge headers with authentication
  // Don't set Content-Type for FormData - let browser set it with boundary
  const headers = {
    ...options.headers,
    'Authorization': `Bearer ${token}`
  }
  
  // Only add Content-Type for non-FormData requests
  if (!(options.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json'
  }

  // Make the authenticated request
  const response = await fetch(url, {
    ...options,
    headers
  })

  // Handle 401 Unauthorized - token expired or invalid
  if (response.status === 401) {
    console.error('🚫 Authentication failed: Token expired or invalid')
    
    // Clear invalid token
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    
    // Redirect to login
    if (typeof window !== 'undefined') {
      window.location.href = '/login'
    }
    
    throw new Error('Session expired. Please login again.')
  }

  return response
}

/**
 * Convenience methods for common HTTP verbs
 */

export const authFetch = {
  /**
   * GET request with authentication
   */
  get: async (url) => {
    return authenticatedFetch(url, { method: 'GET' })
  },

  /**
   * POST request with authentication
   */
  post: async (url, data) => {
    return authenticatedFetch(url, {
      method: 'POST',
      body: JSON.stringify(data)
    })
  },

  /**
   * PUT request with authentication
   */
  put: async (url, data) => {
    return authenticatedFetch(url, {
      method: 'PUT',
      body: JSON.stringify(data)
    })
  },

  /**
   * DELETE request with authentication
   */
  delete: async (url) => {
    return authenticatedFetch(url, { method: 'DELETE' })
  }
}

/**
 * Example usage:
 * 
 * // Using authenticatedFetch
 * try {
 *   const response = await authenticatedFetch('/api/customers', {
 *     method: 'POST',
 *     body: JSON.stringify(customerData)
 *   })
 *   const data = await response.json()
 * } catch (error) {
 *   // Handle authentication error
 *   console.error(error.message)
 * }
 * 
 * // Using convenience methods
 * try {
 *   const response = await authFetch.get('/api/customers')
 *   const customers = await response.json()
 * } catch (error) {
 *   console.error(error.message)
 * }
 */
