# Fix: Stage History Using Wrong User Name

## Problem
Stage history was recording "Ujwal Khanna" instead of the currently logged-in user "Gaurav Khanna".

## Root Cause
The issue had two parts:

### 1. Frontend Sending User in Request Body
The frontend (`/src/app/customers/[id]/page.js`) was sending the `user` field in the request body:

```javascript
body: JSON.stringify({
  stage: newStage,
  user: currentUser ? currentUser.name : 'Unknown User'  // ❌ Wrong!
})
```

### 2. Backend Accepting Frontend User Value
The backend API was accepting the `user` parameter from the request and using it as a fallback:

```javascript
const { stage, notes, user, direction } = await req.json()
const userName = loggedInUser ? (loggedInUser.name || loggedInUser.email) : (user || 'System')
```

If the frontend sent `user: "Ujwal Khanna"`, it would be stored even though "Gaurav Khanna" was logged in.

## Solution

### 1. Backend: Ignore Frontend User Value
Updated `/src/app/api/stage-history/[customerId]/route.js`:

**Before:**
```javascript
const { stage, notes, user, direction } = await req.json()
const userName = loggedInUser ? (loggedInUser.name || loggedInUser.email) : (user || 'System')
```

**After:**
```javascript
const { stage, notes, direction } = await req.json()  // Removed 'user' from destructuring
const userName = loggedInUser ? (loggedInUser.name || loggedInUser.email) : 'System'
```

Now the backend **always** uses the JWT token to get the logged-in user's name, never accepting it from the frontend.

### 2. Frontend: Stop Sending User Field
Updated `/src/app/customers/[id]/page.js`:

**Before:**
```javascript
const stageHistoryResponse = await fetch(`/api/stage-history/${customerId}`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    stage: newStage,
    previousStage: customer.currentStage,
    direction: direction,
    notes: `Stage moved ${direction} via customer management`,
    user: currentUser ? currentUser.name : 'Unknown User'  // ❌ Removed
  })
})
```

**After:**
```javascript
const token = localStorage.getItem('token')
const stageHistoryResponse = await fetch(`/api/stage-history/${customerId}`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`  // ✅ Added auth header
  },
  body: JSON.stringify({
    stage: newStage,
    previousStage: customer.currentStage,
    direction: direction,
    notes: `Stage moved ${direction} via customer management`
    // ✅ Removed user field - backend will extract from JWT
  })
})
```

## Result

Now when "Gaurav Khanna" is logged in and changes a stage:

```javascript
{
  "id": "SH123",
  "customerId": "GKF00001",
  "stage": "Application Submitted",
  "user": "Gaurav Khanna",  // ✅ Correct!
  "notes": "Stage moved forward via customer management",
  "timestamp": "2025-10-30T12:00:00.000Z",
  "_createdBy": "Gaurav Khanna",  // ✅ Correct!
  "_createdAt": "2025-10-30T12:00:00.000Z",
  "_modifiedBy": "Gaurav Khanna",  // ✅ Correct!
  "_lastModified": "2025-10-30T12:00:00.000Z",
  "_version": 1
}
```

## Benefits

1. ✅ **Security**: User identity comes from verified JWT token, not from frontend
2. ✅ **Accuracy**: Always records the actual logged-in user
3. ✅ **Consistency**: User name matches across all audit fields
4. ✅ **Simplicity**: Frontend doesn't need to manage user state for API calls
5. ✅ **Trust**: Backend is the single source of truth for user identity

## Files Modified

1. ✅ `/src/app/api/stage-history/[customerId]/route.js`
   - Removed `user` from request body destructuring
   - Always use `getUserFromRequest()` for user identity

2. ✅ `/src/app/customers/[id]/page.js`
   - Removed `user` field from stage history request body
   - Added `Authorization` header with JWT token

## Testing

1. Login as "Gaurav Khanna"
2. Open a customer detail page
3. Change the customer's stage
4. Check MongoDB stage history collection
5. Verify all these fields show "Gaurav Khanna":
   - `user`
   - `_createdBy`
   - `_modifiedBy`

## Important Note

