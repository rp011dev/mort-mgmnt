# Authentication System - Implementation Guide

## Overview
MongoDB-based authentication system with JWT tokens for the mortgage management application.

## What Was Implemented

### 1. Users API Migration to MongoDB
**File:** `/src/app/api/users/route.js`
- ✅ GET: Fetches active users from MongoDB (passwords excluded)
- ✅ POST: Creates new users with sequential ID generation
- ✅ PUT: Updates users in MongoDB (ID immutable, passwords excluded from response)

### 2. Authentication Utilities
**File:** `/src/utils/auth.js`
- `hashPassword()` - Hash passwords using bcryptjs
- `verifyPassword()` - Verify password against hash
- `generateToken()` - Create JWT tokens (24h expiry)
- `verifyToken()` - Verify and decode JWT tokens
- `extractToken()` - Extract token from Authorization header

### 3. Authentication API Endpoints

#### Login Endpoint
**File:** `/src/app/api/auth/login/route.js`
- POST method for user authentication
- Validates email and password
- Returns JWT token and user info (without password)
- Checks user is active before allowing login

#### Token Verification Endpoint
**File:** `/src/app/api/auth/verify/route.js`
- GET method to verify JWT tokens
- Returns user info if token is valid
- Returns 401 if token is invalid or expired

### 4. Login Page
**File:** `/src/app/login/page.js`
- Clean, centered login form
- Email and password fields
- Error handling and loading states
- Stores token and user info in localStorage
- Redirects to /dashboard on success

### 5. Authentication Hook
**File:** `/src/hooks/useAuth.js`
- `useAuth()` hook for client-side authentication
- Automatically checks token validity
- Redirects to /login if not authenticated
- Provides `logout()` function
- Returns `user`, `loading`, `authenticated` states

## How to Use

### Protecting a Page
```javascript
'use client'
import { useAuth } from '@/hooks/useAuth'

export default function ProtectedPage() {
  const { user, loading, logout } = useAuth()
  
  if (loading) {
    return <div>Loading...</div>
  }
  
  return (
    <div>
      <h1>Welcome {user.name}</h1>
      <button onClick={logout}>Logout</button>
    </div>
  )
}
```

### Making Authenticated API Calls
```javascript
const token = localStorage.getItem('token')

const response = await fetch('/api/some-endpoint', {
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  }
})
```

## User Collection Schema
```javascript
{
  _id: ObjectId,
  id: "U1",              // Sequential user ID
  name: "John Doe",
  email: "john@example.com",
  role: "admin",         // or "user"
  password: "hashed",    // bcrypt hashed password
  active: true
}
```

## Security Notes

### Important: Change JWT Secret
In production, set the JWT_SECRET environment variable:
```bash
JWT_SECRET=your-secure-random-string
```

### Password Hashing
- All passwords are hashed with bcryptjs (10 salt rounds)
- Passwords are NEVER returned in API responses
- Login endpoint verifies passwords securely

### Token Expiry
- Tokens expire after 24 hours
- Users must re-login after expiry
- Token verification happens on protected routes

## Testing the System

### 1. Test Login
Navigate to: `http://localhost:3000/login`
- Enter email and password from MongoDB user collection
- Should redirect to dashboard on success

### 2. Test Protected Routes
Add `useAuth()` hook to any page to protect it:
```javascript
const { user, loading } = useAuth()
```

### 3. Test Token Verification
```bash
curl -H "Authorization: Bearer YOUR_TOKEN" http://localhost:3000/api/auth/verify
```

## Next Steps

### Optional Enhancements
1. **Password Reset**: Add forgot password functionality
2. **Remember Me**: Implement longer-lived refresh tokens
3. **Session Management**: Track active sessions in MongoDB
4. **Rate Limiting**: Prevent brute force login attempts
5. **2FA**: Add two-factor authentication
6. **Audit Log**: Track login/logout events

### Protect Existing Pages
Update these files to require authentication:
- `/src/app/dashboard/page.js`
- `/src/app/customers/page.js`
- `/src/app/customers/[id]/page.js`
- `/src/app/enquiries/page.js`

Simply add at the top:
```javascript
'use client'
import { useAuth } from '@/hooks/useAuth'

export default function YourPage() {
  const { user, loading } = useAuth()
  
  if (loading) return <div>Loading...</div>
  
  // Rest of your component
}
```

## Dependencies Installed
- `bcryptjs`: Password hashing
- `jsonwebtoken`: JWT token generation and verification

## Files Created/Modified
1. ✅ `/src/utils/auth.js` - Authentication utilities
2. ✅ `/src/app/api/auth/login/route.js` - Login endpoint
3. ✅ `/src/app/api/auth/verify/route.js` - Token verification
4. ✅ `/src/app/login/page.js` - Login UI
5. ✅ `/src/hooks/useAuth.js` - Authentication hook
6. ✅ `/src/app/api/users/route.js` - Migrated to MongoDB (GET, POST, PUT)

## Summary
The authentication system is now fully functional and ready to use. Users can log in with their MongoDB credentials, receive a JWT token, and access protected routes. The system is secure, scalable, and follows best practices for password handling and token management.
