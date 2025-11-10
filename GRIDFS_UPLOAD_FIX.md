# GridFS Document Upload Fix

## Issue
Document uploads were failing with the following error:
```
Error uploading document: TypeError: Content-Type was not one of "multipart/form-data" or "application/x-www-form-urlencoded".
POST /api/documents-gridfs 500 in 44ms
```

## Root Cause
The `authenticatedFetch` utility was **always** setting `Content-Type: application/json` for all requests, including FormData uploads. When uploading files with FormData, the browser needs to automatically set the `Content-Type` header as `multipart/form-data` with the proper boundary parameter.

**Problem Code:**
```javascript
// This was ALWAYS setting Content-Type to application/json
const headers = {
  'Content-Type': 'application/json',  // ❌ Breaks FormData uploads
  ...options.headers,
  'Authorization': `Bearer ${token}`
}
```

## Solution
Modified `authenticatedFetch` to detect FormData and skip setting Content-Type in those cases:

**Fixed Code:**
```javascript
// Don't set Content-Type for FormData - let browser set it with boundary
const headers = {
  ...options.headers,
  'Authorization': `Bearer ${token}`
}

// Only add Content-Type for non-FormData requests
if (!(options.body instanceof FormData)) {
  headers['Content-Type'] = 'application/json'
}
```

## Changes Made

### File: `src/utils/authenticatedFetch.js`

1. **Updated `authenticatedFetch()` function:**
   - Added FormData detection: `if (!(options.body instanceof FormData))`
   - Only sets `Content-Type: application/json` for non-FormData requests
   - Allows browser to set proper multipart/form-data header with boundary

2. **Updated `getAuthHeaders()` function:**
   - Added optional parameter `includeContentType` (default: true)
   - More flexible for different types of requests
   - Better documentation

## How FormData Uploads Work Now

### Frontend (`CustomerDocuments.js`):
```javascript
const formData = new FormData()
formData.append('file', file)
formData.append('customerId', customerId)
formData.append('documentType', selectedDocumentType)
formData.append('status', 'received')

const response = await authenticatedFetch('/api/documents-gridfs', {
  method: 'POST',
  body: formData  // ✅ No Content-Type set, browser handles it
})
```

### Backend (`/api/documents-gridfs/route.js`):
```javascript
export async function POST(request) {
  // Parse multipart form data
  const formData = await request.formData()  // ✅ Works now!
  const file = formData.get('file')
  const customerId = formData.get('customerId')
  // ... rest of processing
}
```

## Technical Details

### Why FormData Needs Special Handling:
1. **Boundary Parameter**: FormData requires a unique boundary string to separate fields
2. **Browser Automatic**: Browser automatically generates: `multipart/form-data; boundary=----WebKitFormBoundary...`
3. **Manual Setting Breaks It**: If you manually set `Content-Type: multipart/form-data`, you'll be missing the boundary
4. **Let Browser Do It**: Best practice is to not set Content-Type at all for FormData

### Content-Type Examples:
- **JSON Request**: `Content-Type: application/json`
- **FormData Upload**: `Content-Type: multipart/form-data; boundary=----WebKitFormBoundary...`
- **URL Encoded**: `Content-Type: application/x-www-form-urlencoded`

## Testing

### Test Steps:
1. ✅ Navigate to a customer details page
2. ✅ Click on "Documents" tab
3. ✅ Select a file to upload
4. ✅ Choose document type
5. ✅ Click upload
6. ✅ Verify file uploads successfully
7. ✅ Verify no console errors
8. ✅ Verify document appears in list

### Expected Behavior:
- File uploads complete successfully
- No Content-Type errors in console
- Documents appear in GridFS storage
- Metadata is stored correctly

## Impact Analysis

### What's Fixed:
- ✅ Document uploads to GridFS now work
- ✅ FormData requests handled correctly
- ✅ Browser sets proper Content-Type with boundary
- ✅ All other API calls still work (JSON)

### What's Not Affected:
- ✅ Regular JSON API calls still set `Content-Type: application/json`
- ✅ GET requests work normally
- ✅ Authentication still works correctly
- ✅ All existing functionality preserved

## Related Files

### Modified:
- `src/utils/authenticatedFetch.js` - Fixed FormData handling

### Uses Document Upload:
- `src/components/CustomerDocuments.js` - Main upload component
- `src/app/api/documents-gridfs/route.js` - Backend endpoint

## Future Improvements

1. **Add Upload Progress**: Show progress bar for large file uploads
2. **Add File Validation**: Client-side validation before upload
3. **Add Multiple File Upload**: Upload multiple files at once
4. **Add Drag & Drop**: Improve UX with drag and drop
5. **Add Preview**: Show preview before upload

## Prevention

To prevent similar issues in the future:
1. **Always check** if body is FormData before setting Content-Type
2. **Document** special handling requirements in code comments
3. **Test** file uploads after any authentication changes
4. **Remember** browser sets FormData Content-Type automatically

## Conclusion

The document upload functionality is now **FIXED** and **WORKING**. The `authenticatedFetch` utility correctly handles both JSON and FormData requests without conflicts.

**Status: ✅ RESOLVED**

Date Fixed: November 10, 2025
