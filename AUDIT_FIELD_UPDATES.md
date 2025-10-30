# Audit Field Updates - Summary

## Changes Made

### 1. Updated Audit Field Names
Changed from generic field names to underscore-prefixed standard naming:

**Old Fields → New Fields:**
- `createdBy` → `_createdBy`
- `createdAt` → `_createdAt`
- `updatedBy` → `_modifiedBy`
- `updatedAt` → `_lastModified`

### 2. Removed "System Migration" Hardcoded Value
Changed all instances of hardcoded `"System Migration"` to:
- Use logged-in user's name when available (extracted from JWT token)
- Fall back to `"System"` only when no user is authenticated

### 3. Files Updated

#### **Core Utilities:**
- ✅ `/src/utils/authMiddleware.js`
  - Updated `createAuditFields()` to use new field names
  - Returns `_createdBy`, `_createdAt`, `_modifiedBy`, `_lastModified`

- ✅ `/src/utils/concurrencyManager.js`
  - Changed default parameter from `'System Migration'` to `'System'`
  - Uses `_modifiedBy` and `_lastModified` field names

#### **API Routes Updated:**

1. **Customers API** (`/src/app/api/customers/route.js`)
   - ✅ POST (Create): Uses logged-in user or falls back to 'System'
   - ✅ PUT (Update): Uses logged-in user or falls back to 'System'
   - All audit fields use new naming convention

2. **Enquiries API** (`/src/app/api/enquiries/route.js`)
   - ✅ POST (Create): Uses logged-in user or falls back to 'System'
   - ✅ PUT (Update): Uses logged-in user or falls back to 'System'
   - All audit fields use new naming convention

3. **Notes API** (`/src/app/api/notes/route.js`)
   - ✅ POST (Create): Uses logged-in user's name as `author` and audit fields
   - ✅ PUT (Update): Uses logged-in user for audit trail
   - All audit fields use new naming convention

4. **Stage History API** (`/src/app/api/stage-history/[customerId]/route.js`)
   - ✅ POST (Create): Uses logged-in user's name for `user` field and audit fields
   - All audit fields use new naming convention

#### **Documentation:**
- ✅ Updated `/AUDIT_TRAIL_IMPLEMENTATION.md` with correct field names

## Database Schema

### Current Audit Fields in All Collections:

```javascript
{
  // ... other fields ...
  
  // Creation tracking
  "_createdBy": "Jane Smith",        // Who created this record
  "_createdAt": "2025-10-30T10:30:00.000Z",  // When it was created
  
  // Modification tracking
  "_modifiedBy": "John Admin",       // Who last modified this record
  "_lastModified": "2025-10-30T15:45:00.000Z",  // When it was last modified
  
  // Version control
  "_version": 3
}
```

## How It Works Now

### 1. User Creates/Updates a Record:
```javascript
// Frontend sends request with JWT token
const response = await fetch('/api/customers', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify(customerData)
})
```

### 2. Backend Extracts User from Token:
```javascript
const user = getUserFromRequest(request)
// Returns: { userId: 'USR001', email: 'john@gkfinance.com', name: 'John Admin', role: 'admin' }
```

### 3. Audit Fields Are Created:
```javascript
// For CREATE operations
const auditFields = createAuditFields(user, true)
// Returns:
{
  _createdBy: 'John Admin',
  _createdAt: '2025-10-30T10:30:00.000Z',
  _modifiedBy: 'John Admin',
  _lastModified: '2025-10-30T10:30:00.000Z'
}

// For UPDATE operations
const auditFields = createAuditFields(user, false)
// Returns:
{
  _modifiedBy: 'John Admin',
  _lastModified: '2025-10-30T10:30:00.000Z'
}
```

### 4. Fallback When No User is Logged In:
```javascript
// If user token is missing or invalid
{
  _createdBy: 'System',
  _createdAt: '2025-10-30T10:30:00.000Z',
  _modifiedBy: 'System',
  _lastModified: '2025-10-30T10:30:00.000Z'
}
```

## Special Fields by Collection

### Customers & Enquiries:
- `_createdBy`: Name of user who created the record
- `_createdAt`: ISO timestamp of creation
- `_modifiedBy`: Name of user who last updated
- `_lastModified`: ISO timestamp of last update

### Notes:
- `author`: User's name (visible field for note attribution)
- `_createdBy`: Same as author (for audit trail)
- `_createdAt`: ISO timestamp of creation
- `_modifiedBy`: Name of user who last updated the note
- `_lastModified`: ISO timestamp of last update

### Stage History:
- `user`: User's name (visible field showing who moved the stage)
- `_createdBy`: Same as user (for audit trail)
- `_createdAt`: ISO timestamp of stage change
- `_modifiedBy`: Same as _createdBy (stage entries are typically not updated)
- `_lastModified`: ISO timestamp

## Benefits of These Changes

1. ✅ **Consistent Naming**: All audit fields follow the `_fieldName` convention
2. ✅ **Real User Tracking**: Uses actual logged-in user's name instead of "System Migration"
3. ✅ **Backwards Compatible**: Falls back to "System" when no user is authenticated
4. ✅ **Standard Compliance**: Matches your existing database schema pattern
5. ✅ **Clear Attribution**: Easy to see who created/modified any record

## Testing Checklist

- [ ] Login as a user
- [ ] Create a new customer → Check `_createdBy` has your name
- [ ] Update the customer → Check `_modifiedBy` has your name
- [ ] Create a new enquiry → Check `_createdBy` has your name
- [ ] Update the enquiry → Check `_modifiedBy` has your name
- [ ] Add a note → Check both `author` and `_createdBy` have your name
- [ ] Change customer stage → Check both `user` and `_createdBy` have your name
- [ ] Verify all `_lastModified` timestamps are updated correctly

## Migration Note

**Existing records in the database** may still have:
- Old field names (`createdBy`, `updatedBy`, etc.)
- `"System Migration"` as the value

These are historical values and don't need to be changed. All **new records** created from now on will use:
- New field names (`_createdBy`, `_modifiedBy`, etc.)
- Actual logged-in user's name or `"System"` as fallback

If you want to standardize all existing records, you would need to run a database migration script (let me know if you need help with that).
