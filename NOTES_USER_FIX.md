# Fix: Notes Using Wrong User Name

## Problem
Notes were being created with the `currentUser` from frontend state (likely from UserSelector component) instead of the actual logged-in user from JWT token.

## Files Updated

### 1. Customer Details Page (`/src/app/customers/[id]/page.js`)

**Before:**
```javascript
const response = await fetch(`/api/notes`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    customerId: customerId,
    note: newNote.trim(),
    author: currentUser ? currentUser.name : 'Unknown User',  // ❌ Wrong!
    stage: customer.currentStage
  })
})
```

**After:**
```javascript
const token = localStorage.getItem('token')
const response = await fetch(`/api/notes`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`  // ✅ Added JWT token
  },
  body: JSON.stringify({
    customerId: customerId,
    note: newNote.trim(),
    stage: customer.currentStage
    // ✅ Removed author field - backend extracts from JWT
  })
})
```

### 2. Enquiry Details Page (`/src/app/enquiries/[id]/page.js`)

**Before:**
```javascript
const response = await fetch(`/api/notes`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    enquiryId: params.id,
    note: newNote.trim(),
    author: currentUser ? currentUser.name : 'Unknown User',  // ❌ Wrong!
    stage: enquiry?.status || 'new'
  })
})
```

**After:**
```javascript
const token = localStorage.getItem('token')
const response = await fetch(`/api/notes`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`  // ✅ Added JWT token
  },
  body: JSON.stringify({
    enquiryId: params.id,
    note: newNote.trim(),
    stage: enquiry?.status || 'new'
    // ✅ Removed author field - backend extracts from JWT
  })
})
```

## Backend Handling

The Notes API (`/src/app/api/notes/route.js`) already has the logic to extract user from JWT token:

```javascript
export async function POST(request) {
  // Extract user from token for audit trail
  const user = getUserFromRequest(request)
  
  // Use logged-in user's name or provided author or fallback
  const noteAuthor = user ? (user.name || user.email) : (author || 'System')
  
  // Generate new note
  const newNote = {
    id: newNoteId,
    referenceId: referenceId,
    author: noteAuthor,  // ✅ Uses JWT user
    stage: stage || null,
    note: note,
    timestamp: currentTimestamp,
    ...auditFields,
    _version: 1
  }
  
  // Insert the note
  await collection.insertOne(newNote)
}
```

## Result

Now when "Gaurav Khanna" is logged in and adds a note:

### Customer Notes:
```javascript
{
  "id": "NOTE123",
  "referenceId": "GKF00001",
  "author": "Gaurav Khanna",  // ✅ Correct!
  "note": "Called customer to confirm details",
  "stage": "application-submitted",
  "timestamp": "2025-10-30T12:00:00.000Z",
  "_createdBy": "Gaurav Khanna",  // ✅ Correct!
  "_createdAt": "2025-10-30T12:00:00.000Z",
  "_modifiedBy": "Gaurav Khanna",  // ✅ Correct!
  "_lastModified": "2025-10-30T12:00:00.000Z",
  "_version": 1
}
```

### Enquiry Notes:
```javascript
{
  "id": "NOTE124",
  "referenceId": "ENQ045",
  "author": "Gaurav Khanna",  // ✅ Correct!
  "note": "Follow up needed for property valuation",
  "stage": "in-progress",
  "timestamp": "2025-10-30T12:30:00.000Z",
  "_createdBy": "Gaurav Khanna",  // ✅ Correct!
  "_createdAt": "2025-10-30T12:30:00.000Z",
  "_modifiedBy": "Gaurav Khanna",  // ✅ Correct!
  "_lastModified": "2025-10-30T12:30:00.000Z",
  "_version": 1
}
```

## Complete Audit Trail Fix Summary

All user identity tracking now uses JWT token exclusively:

| Feature | Status | Authenticated Via |
|---------|--------|-------------------|
| Customer Creation | ✅ Fixed | JWT Token |
| Customer Updates | ✅ Fixed | JWT Token |
| Enquiry Creation | ✅ Fixed | JWT Token |
| Enquiry Updates | ✅ Fixed | JWT Token |
| Stage History | ✅ Fixed | JWT Token |
| Customer Notes | ✅ Fixed | JWT Token |
| Enquiry Notes | ✅ Fixed | JWT Token |

## Benefits

1. ✅ **Security**: User identity from verified JWT, not frontend state
2. ✅ **Accuracy**: Always records actual logged-in user
3. ✅ **Consistency**: Same user across all operations
4. ✅ **Simplicity**: No need to manage `currentUser` state in frontend
5. ✅ **Single Source of Truth**: Backend determines user identity

## Testing Checklist

- [ ] Login as "Gaurav Khanna"
- [ ] Add a note to a customer
- [ ] Check MongoDB - `author` should be "Gaurav Khanna"
- [ ] Add a note to an enquiry
- [ ] Check MongoDB - `author` should be "Gaurav Khanna"
- [ ] Verify all audit fields (`_createdBy`, `_modifiedBy`) show "Gaurav Khanna"
- [ ] Logout and login as different user
- [ ] Add notes again and verify new user's name is recorded

## Important Note

The **UserSelector** component in the navigation is for:
- **Viewing** customers assigned to specific users
- **Filtering** the customer list
- **NOT** for determining who is making changes

All operations (notes, stage changes, updates) use the JWT token of the logged-in user, not the UserSelector value.
