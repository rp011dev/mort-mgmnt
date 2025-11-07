# Authentication Audit Trail System

## Overview
Complete authentication audit logging system that tracks all login, logout, and failed authentication attempts in a dedicated MongoDB collection.

## Features

✅ **Login Success Tracking** - Records successful logins with user details  
✅ **Login Failure Tracking** - Logs all failed login attempts with reasons  
✅ **Logout Tracking** - Records when users log out  
✅ **IP Address Tracking** - Captures user's IP address for each event  
✅ **User Agent Tracking** - Logs browser/device information  
✅ **Security Monitoring** - Detect suspicious login patterns  
✅ **Admin Dashboard** - API endpoints to view audit logs (admin only)

## Database Schema

### Collection: `authAudit`

```javascript
{
  // Event Information
  "eventType": "LOGIN_SUCCESS",  // or "LOGIN_FAILED", "LOGOUT"
  "timestamp": "2025-10-30T12:00:00.000Z",
  "success": true,  // true for success, false for failures
  
  // User Information (for successful logins and logouts)
  "userId": "USR001",
  "email": "gaurav@gkfinance.com",
  "userName": "Gaurav Khanna",
  "userRole": "admin",
  
  // For failed logins only
  "failureReason": "Invalid password",  // or "User not found", "Missing credentials", etc.
  
  // Request Metadata
  "ipAddress": "192.168.1.100",
  "userAgent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)...",
  
  // Version Control
  "_version": 1
}
```

## Implementation Details

### 1. Backend Components

#### Audit Manager (`/src/utils/authAuditManager.js`)

Core utility functions for logging authentication events:

**Functions:**
- `logSuccessfulLogin(user, request)` - Log successful logins
- `logFailedLogin(email, reason, request)` - Log failed attempts
- `logLogout(user, request)` - Log logout events
- `getAuthAuditLogs(filters, pagination)` - Retrieve audit logs
- `getRecentFailedLogins(email, hours)` - Get failed attempts for specific email
- `getUserLoginStats(userId, days)` - Get login statistics for a user

**Example Usage:**
```javascript
import { logSuccessfulLogin, logFailedLogin } from '@/utils/authAuditManager'

// On successful login
await logSuccessfulLogin({
  userId: 'USR001',
  email: 'user@example.com',
  name: 'John Doe',
  role: 'admin'
}, request)

// On failed login
await logFailedLogin('user@example.com', 'Invalid password', request)
```

#### Configuration Updates

**`/src/config/dataConfig.js`** - Added new collection:
```javascript
collections: {
  // ... existing collections
  authAudit: 'authAudit'
}
```

### 2. API Endpoints

#### Login API (`/src/app/api/auth/login/route.js`)

**Enhanced with audit logging:**

```javascript
POST /api/auth/login
```

**Audit Events:**
- ✅ Logs successful login with user details
- ⚠️ Logs failed login if user not found
- ⚠️ Logs failed login if password is invalid
- ⚠️ Logs failed login if credentials missing
- ⚠️ Logs failed login on system errors

**Example Scenarios:**

1. **Successful Login:**
```javascript
{
  "eventType": "LOGIN_SUCCESS",
  "userId": "USR001",
  "email": "gaurav@gkfinance.com",
  "userName": "Gaurav Khanna",
  "userRole": "admin",
  "timestamp": "2025-10-30T12:00:00.000Z",
  "ipAddress": "192.168.1.100",
  "userAgent": "Mozilla/5.0...",
  "success": true
}
```

2. **Failed Login - Wrong Password:**
```javascript
{
  "eventType": "LOGIN_FAILED",
  "email": "gaurav@gkfinance.com",
  "failureReason": "Invalid password",
  "timestamp": "2025-10-30T12:00:00.000Z",
  "ipAddress": "192.168.1.100",
  "userAgent": "Mozilla/5.0...",
  "success": false
}
```

3. **Failed Login - User Not Found:**
```javascript
{
  "eventType": "LOGIN_FAILED",
  "email": "unknown@example.com",
  "failureReason": "User not found or inactive",
  "timestamp": "2025-10-30T12:00:00.000Z",
  "ipAddress": "192.168.1.100",
  "userAgent": "Mozilla/5.0...",
  "success": false
}
```

#### Logout API (`/src/app/api/auth/logout/route.js`)

**New endpoint for logout tracking:**

```javascript
POST /api/auth/logout
Headers: Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "message": "Logged out successfully"
}
```

**Audit Event:**
```javascript
{
  "eventType": "LOGOUT",
  "userId": "USR001",
  "email": "gaurav@gkfinance.com",
  "userName": "Gaurav Khanna",
  "userRole": "admin",
  "timestamp": "2025-10-30T14:00:00.000Z",
  "ipAddress": "192.168.1.100",
  "userAgent": "Mozilla/5.0...",
  "success": true
}
```

#### Audit Logs API (`/src/app/api/auth/audit/route.js`)

**Admin-only endpoint to view audit logs:**

```javascript
GET /api/auth/audit
Headers: Authorization: Bearer <admin-token>
```

**Query Parameters:**

| Parameter | Type | Description | Example |
|-----------|------|-------------|---------|
| `action` | string | Action type: 'logs', 'failedLogins', 'stats' | `action=logs` |
| `userId` | string | Filter by user ID | `userId=USR001` |
| `email` | string | Filter by email (partial match) | `email=gaurav` |
| `eventType` | string | Filter by event: LOGIN_SUCCESS, LOGIN_FAILED, LOGOUT | `eventType=LOGIN_FAILED` |
| `success` | boolean | Filter by success status | `success=false` |
| `startDate` | ISO string | Start date for filtering | `startDate=2025-10-01T00:00:00Z` |
| `endDate` | ISO string | End date for filtering | `endDate=2025-10-31T23:59:59Z` |
| `page` | number | Page number (default: 1) | `page=2` |
| `limit` | number | Results per page (default: 50) | `limit=100` |

**Examples:**

1. **Get All Audit Logs (Paginated):**
```bash
GET /api/auth/audit?page=1&limit=50
```

2. **Get Failed Logins Only:**
```bash
GET /api/auth/audit?eventType=LOGIN_FAILED&page=1
```

3. **Get Recent Failed Logins for Specific Email:**
```bash
GET /api/auth/audit?action=failedLogins&email=user@example.com&hours=24
```

4. **Get Login Statistics for User:**
```bash
GET /api/auth/audit?action=stats&userId=USR001&days=30
```

**Response Format:**
```json
{
  "logs": [...],
  "pagination": {
    "currentPage": 1,
    "totalPages": 5,
    "totalLogs": 234,
    "logsPerPage": 50,
    "hasNextPage": true,
    "hasPreviousPage": false
  }
}
```

### 3. Frontend Updates

#### useAuth Hook (`/src/hooks/useAuth.js`)

**Enhanced logout function:**

```javascript
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
```

## Security Features

### 1. Failed Login Detection

Monitor suspicious login patterns:

```javascript
import { getRecentFailedLogins } from '@/utils/authAuditManager'

// Check failed attempts in last 24 hours
const failedAttempts = await getRecentFailedLogins('user@example.com', 24)

if (failedAttempts.length >= 5) {
  console.log('⚠️ Multiple failed login attempts detected!')
  // Implement account lockout or additional security measures
}
```

### 2. IP Address Tracking

Track logins from different locations:

```javascript
const logs = await getAuthAuditLogs({ 
  userId: 'USR001',
  eventType: 'LOGIN_SUCCESS'
})

const uniqueIPs = [...new Set(logs.logs.map(log => log.ipAddress))]
console.log(`User logged in from ${uniqueIPs.length} different IP addresses`)
```

### 3. User Activity Statistics

```javascript
const stats = await getUserLoginStats('USR001', 30)

console.log('User Stats:', {
  totalLogins: stats.totalLogins,
  totalLogouts: stats.totalLogouts,
  failedAttempts: stats.failedAttempts,
  lastLogin: stats.lastLogin,
  uniqueIPs: stats.uniqueIPs
})
```

## Testing

### Test Login Success
1. Login with valid credentials
2. Check MongoDB `authAudit` collection
3. Verify record with `eventType: "LOGIN_SUCCESS"`
4. Verify user details are correct (userId, email, name, role)
5. Verify IP address and user agent are captured

### Test Failed Logins
1. **Wrong Password:**
   - Try login with incorrect password
   - Check for record with `failureReason: "Invalid password"`

2. **Non-existent User:**
   - Try login with non-existent email
   - Check for record with `failureReason: "User not found or inactive"`

3. **Missing Credentials:**
   - Send request without email or password
   - Check for record with `failureReason: "Missing email or password"`

### Test Logout
1. Login as a user
2. Click logout button
3. Check MongoDB for `eventType: "LOGOUT"` record
4. Verify user is redirected to login page

### Test Audit Logs API
1. Login as admin user
2. Call `/api/auth/audit` with various filters
3. Verify pagination works correctly
4. Test different query parameters

### Test Security Features
1. Attempt 5+ failed logins for same email
2. Query failed logins: `/api/auth/audit?action=failedLogins&email=test@example.com`
3. Verify all attempts are logged

## Querying Audit Logs

### MongoDB Queries

**Get all failed logins today:**
```javascript
db.authAudit.find({
  eventType: "LOGIN_FAILED",
  timestamp: {
    $gte: new Date().toISOString().split('T')[0] + 'T00:00:00.000Z'
  }
})
```

**Get successful logins for specific user:**
```javascript
db.authAudit.find({
  eventType: "LOGIN_SUCCESS",
  userId: "USR001"
}).sort({ timestamp: -1 })
```

**Count failed attempts by email:**
```javascript
db.authAudit.aggregate([
  { $match: { eventType: "LOGIN_FAILED" } },
  { $group: { _id: "$email", count: { $sum: 1 } } },
  { $sort: { count: -1 } }
])
```

**Get login activity for last 7 days:**
```javascript
const sevenDaysAgo = new Date()
sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

db.authAudit.find({
  timestamp: { $gte: sevenDaysAgo.toISOString() }
}).sort({ timestamp: -1 })
```

## Benefits

1. ✅ **Complete Audit Trail** - Every authentication event is logged
2. ✅ **Security Monitoring** - Detect brute force attacks and suspicious activity
3. ✅ **Compliance** - Meet regulatory requirements for access logging
4. ✅ **Troubleshooting** - Debug login issues with detailed logs
5. ✅ **User Activity Tracking** - Know when and where users access the system
6. ✅ **Forensics** - Investigate security incidents with historical data

## Future Enhancements

Potential additions to the system:

- [ ] Real-time alerts for multiple failed logins
- [ ] Account lockout after N failed attempts
- [ ] Email notifications for suspicious activity
- [ ] Geolocation tracking based on IP
- [ ] Session duration tracking
- [ ] Dashboard UI for viewing audit logs
- [ ] Export audit logs to CSV/PDF
- [ ] Automated compliance reports

## Files Modified/Created

### Created:
1. ✅ `/src/utils/authAuditManager.js` - Core audit logging utilities
2. ✅ `/src/app/api/auth/logout/route.js` - Logout API endpoint
3. ✅ `/src/app/api/auth/audit/route.js` - Audit logs viewing API (admin only)
4. ✅ `/AUTH_AUDIT_IMPLEMENTATION.md` - This documentation

### Modified:
5. ✅ `/src/config/dataConfig.js` - Added `authAudit` collection
6. ✅ `/src/app/api/auth/login/route.js` - Added audit logging
7. ✅ `/src/hooks/useAuth.js` - Updated logout to call API

## Summary

The authentication audit trail system provides comprehensive logging of all authentication events. Every login, logout, and failed attempt is recorded with detailed metadata including user information, IP address, timestamp, and reason for failure. Admin users can query these logs through the API to monitor security, troubleshoot issues, and ensure compliance with access control requirements.
