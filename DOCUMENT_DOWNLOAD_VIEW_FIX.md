# Document Download/View Authentication Fix

## Issue
Document download and view functionality was failing with authentication error:
```json
{
  "error": "Unauthorized - Authentication required",
  "message": "Please login to access this resource"
}
```

## Root Cause
The download endpoint (`/api/documents-gridfs/download/route.js`) was trying to use `jsonwebtoken` library for token verification, but the project uses `jose` library (which is Edge Runtime compatible). Additionally, there was a mismatch in how tokens were being validated.

**Problem Code:**
```javascript
// This was using the wrong JWT library
const jwt = require('jsonwebtoken')
user = jwt.verify(tokenFromQuery, process.env.JWT_SECRET)
```

## Solution
Updated the download endpoint to use `jose` library for JWT verification, matching the authentication pattern used throughout the rest of the application.

**Fixed Code:**
```javascript
import { jwtVerify } from 'jose'

// Validate token from query param using jose
const secret = new TextEncoder().encode(
  process.env.JWT_SECRET || 'your-secret-key-change-in-production'
)
const { payload } = await jwtVerify(tokenFromQuery, secret)
user = payload
```

## Changes Made

### File: `/src/app/api/documents-gridfs/download/route.js`

1. **Added jose import:**
   ```javascript
   import { jwtVerify } from 'jose'
   ```

2. **Updated token verification logic:**
   - Replaced `jsonwebtoken` with `jose`
   - Used proper TextEncoder for secret key (required by jose)
   - Added proper error handling
   - Matches authentication pattern used in `authMiddleware.js`

## How Document Download/View Works

### Flow:
1. **User clicks View/Download button** in CustomerDocuments component
2. **Token is retrieved** from localStorage
3. **URL is constructed** with fileId and token as query parameters
4. **New window opens** with the download URL
5. **Server validates token** using jose library
6. **File is streamed** from GridFS to user

### Frontend Code (CustomerDocuments.js):
```javascript
const handleDownload = (fileId, filename) => {
  const token = localStorage.getItem('token')
  const downloadUrl = `/api/documents-gridfs/download?fileId=${fileId}&token=${encodeURIComponent(token)}`
  window.open(downloadUrl, '_blank')
}

const handleView = (fileId, filename) => {
  const token = localStorage.getItem('token')
  const viewUrl = `/api/documents-gridfs/download?fileId=${fileId}&token=${encodeURIComponent(token)}&view=true`
  window.open(viewUrl, '_blank')
}
```

### Backend Code (Download Route):
```javascript
export async function GET(request) {
  const { searchParams } = new URL(request.url)
  const fileId = searchParams.get('fileId')
  const tokenFromQuery = searchParams.get('token')
  const view = searchParams.get('view') === 'true'

  // Try to get user from Authorization header first
  let user = getUserFromRequest(request)
  
  // If no user from header, validate token from query param
  if (!user && tokenFromQuery) {
    const secret = new TextEncoder().encode(process.env.JWT_SECRET)
    const { payload } = await jwtVerify(tokenFromQuery, secret)
    user = payload
  }
  
  // Stream file from GridFS
  const { stream, metadata } = await downloadFileFromGridFS(fileId)
  // ... return file with appropriate headers
}
```

## Why Token in URL?

When opening a document in a new window/tab, the browser doesn't automatically send the Authorization header. We have two options:

1. **Token in URL** (Current approach) ✅
   - Pros: Simple, works in new windows, no CORS issues
   - Cons: Token visible in URL (but only during download)
   - Security: Token is validated server-side, URL is temporary

2. **Blob approach** (Alternative)
   - Pros: Token not in URL
   - Cons: Complex, requires fetching file first, memory intensive
   - Not suitable for large files

## Authentication Methods Supported

The download endpoint supports **two authentication methods**:

### 1. Authorization Header (Primary)
```javascript
fetch('/api/documents-gridfs/download?fileId=123', {
  headers: {
    'Authorization': 'Bearer <token>'
  }
})
```

### 2. Token Query Parameter (For new windows)
```javascript
window.open('/api/documents-gridfs/download?fileId=123&token=<token>')
```

This dual approach allows:
- Normal API calls to use header authentication
- New window/download links to use query parameter authentication

## Security Considerations

### Token Validation
- ✅ Token is validated using jose library (Edge Runtime compatible)
- ✅ Same JWT secret used across application
- ✅ Token expiration is checked
- ✅ Invalid tokens return 401 Unauthorized

### Token in URL
- ⚠️ Token is temporarily visible in URL during download
- ✅ Token has short expiration time
- ✅ HTTPS encrypts the URL in transit
- ✅ Token is only valid for authenticated users
- ✅ Server validates token on every request

### Best Practices Followed
- Token validation matches application-wide authentication
- Proper error handling and logging
- Content-Disposition headers for security
- MIME type validation
- File size limits enforced elsewhere

## Testing

### Test Steps:
1. ✅ Login to the application
2. ✅ Navigate to customer details page
3. ✅ Go to Documents tab
4. ✅ Upload a document
5. ✅ Click "View" button on a document
   - Should open document in new tab
   - Should not show authentication error
6. ✅ Click "Download" button on a document
   - Should download file
   - Should not show authentication error
7. ✅ Test with different file types (PDF, images, etc.)

### Expected Behavior:
- ✅ Documents open in new tab for viewing
- ✅ Documents download successfully
- ✅ No authentication errors
- ✅ Proper Content-Type headers
- ✅ Proper Content-Disposition (inline for view, attachment for download)

## Browser Compatibility

### Supported:
- ✅ Chrome/Edge (Chromium)
- ✅ Firefox
- ✅ Safari
- ✅ Mobile browsers

### Content-Disposition Behavior:
- **`inline`** (view=true): Browser attempts to display in tab
  - PDFs: Shown in browser PDF viewer
  - Images: Displayed directly
  - Other: Downloaded or shown based on MIME type
  
- **`attachment`** (download): Browser downloads file
  - All file types trigger download dialog

## Related Files

### Modified:
- `/src/app/api/documents-gridfs/download/route.js` - Fixed JWT verification

### Uses Download/View:
- `/src/components/CustomerDocuments.js` - Frontend component with download/view buttons
- `/src/utils/authMiddleware.js` - Authentication middleware
- `/src/utils/gridFsManager.js` - GridFS file operations

## Alternative Approaches Considered

### 1. Pre-signed URLs
- Generate temporary URLs with embedded credentials
- More complex server-side logic
- Not implemented due to added complexity

### 2. Fetch + Blob
```javascript
// Not used - too complex for this use case
const response = await authenticatedFetch('/api/documents-gridfs/...')
const blob = await response.blob()
const url = URL.createObjectURL(blob)
window.open(url)
```
- Pros: No token in URL
- Cons: Complex, memory intensive, not suitable for large files
- Not implemented due to complexity and memory concerns

### 3. Proxy through authenticated page
- Create an intermediate page that fetches and displays
- More complex routing
- Not implemented due to added complexity

## Conclusion

The document download and view functionality is now **FIXED** and **WORKING**. The download endpoint correctly validates JWT tokens using the `jose` library, matching the authentication pattern used throughout the application.

**Key Fix:** Replaced `jsonwebtoken` with `jose` for Edge Runtime compatibility.

**Status: ✅ RESOLVED**

Date Fixed: November 10, 2025
