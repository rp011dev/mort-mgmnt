# Stage History Audit Field Fix

## Problem
Stage history records were showing:
```javascript
{
  "_createdBy": "Ujwal Khanna",  // ✅ Correct
  "_createdAt": "2025-10-30T01:25:52.378Z",  // ✅ Correct
  "_modifiedBy": "System",  // ❌ Wrong - should be "Ujwal Khanna"
  "_lastModified": "2025-10-30T01:25:52.378Z"  // ✅ Correct timestamp
}
```

## Root Cause
The `addVersioningToRecord()` function was **overwriting** the audit fields that were already set by `createAuditFields()`.

**Flow was:**
1. `createAuditFields()` sets `_modifiedBy: "Ujwal Khanna"`
2. Audit fields spread into the new record object
3. `addVersioningToRecord()` called, which **overwrites** `_modifiedBy` with default "System"

## Solution

### 1. Modified `addVersioningToRecord()` Function
Changed from **always overwriting** to **only setting if missing**:

**Before:**
```javascript
export function addVersioningToRecord(record, userId = 'System') {
  const now = new Date().toISOString()
  
  record._version = (record._version || 0) + 1
  record._lastModified = now  // ❌ Always overwrites
  record._modifiedBy = userId  // ❌ Always overwrites
  
  if (!record._createdAt) {
    record._createdAt = record.createdAt || now
    record._createdBy = userId
  }
  
  return record
}
```

**After:**
```javascript
export function addVersioningToRecord(record, userId = 'System') {
  const now = new Date().toISOString()
  
  record._version = (record._version || 0) + 1
  
  // Only set if missing
  if (!record._lastModified) {
    record._lastModified = now
  }
  if (!record._modifiedBy) {
    record._modifiedBy = userId
  }
  
  // Set creation info if not exists
  if (!record._createdAt) {
    record._createdAt = record.createdAt || now
  }
  if (!record._createdBy) {
    record._createdBy = userId
  }
  
  return record
}
```

### 2. Updated API Calls
Made sure to pass the userName parameter:

**Stage History API:**
```javascript
const userName = loggedInUser ? (loggedInUser.name || loggedInUser.email) : (user || 'System')
addVersioningToRecord(newEntry, userName)
```

**Customers API:**
```javascript
const userName = user ? (user.name || user.email) : 'System'
addVersioningToRecord(newCustomer, userName)
```

## Result

Now when creating a stage history entry:
```javascript
{
  "_createdBy": "Ujwal Khanna",  // ✅ Correct
  "_createdAt": "2025-10-30T01:25:52.378Z",  // ✅ Correct
  "_modifiedBy": "Ujwal Khanna",  // ✅ Now correct!
  "_lastModified": "2025-10-30T01:25:52.378Z"  // ✅ Correct
}
```

## Files Modified

1. ✅ `/src/utils/concurrencyManager.js`
   - Modified `addVersioningToRecord()` to preserve existing audit fields

2. ✅ `/src/app/api/stage-history/[customerId]/route.js`
   - Pass `userName` to `addVersioningToRecord()`

3. ✅ `/src/app/api/customers/route.js`
   - Pass `userName` to `addVersioningToRecord()`

## Testing

To verify the fix:
1. Login as a user
2. Change a customer's stage
3. Check MongoDB stage history collection
4. Verify `_modifiedBy` shows your name (not "System")
5. Create a new customer
6. Check MongoDB customers collection
7. Verify both `_createdBy` and `_modifiedBy` show your name

## Benefits

- ✅ Audit fields are no longer overwritten
- ✅ Logged-in user's name is properly tracked
- ✅ Version control still works correctly
- ✅ Backward compatible (still works if audit fields are missing)
