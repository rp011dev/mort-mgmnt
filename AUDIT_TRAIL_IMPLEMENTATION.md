# Audit Trail Implementation

## Overview
All API endpoints for customers, enquiries, notes, and stage history now include audit trail functionality that automatically tracks which user made changes.

## What Was Added

### 1. Authentication Middleware (`/src/utils/authMiddleware.js`)
Created utility functions to:
- Extract user information from JWT tokens in request headers
- Validate authentication
- Generate audit trail fields automatically

### 2. Audit Fields Added to Database Records

All create/update operations now include:

**For Create Operations:**
- `_createdBy`: User's name (from JWT token)
- `_createdAt`: Timestamp of creation
- `_modifiedBy`: User's name (same as _createdBy initially)
- `_lastModified`: Timestamp (same as _createdAt initially)

**For Update Operations:**
- `_modifiedBy`: User's name (from JWT token)
- `_lastModified`: Timestamp of update

### 3. Updated API Endpoints

#### **Customers API** (`/src/app/api/customers/route.js`)
- ✅ POST (Create Customer) - Tracks who created the customer
- ✅ PUT (Update Customer) - Tracks who updated the customer

#### **Enquiries API** (`/src/app/api/enquiries/route.js`)
- ✅ POST (Create Enquiry) - Tracks who created the enquiry
- ✅ PUT (Update Enquiry) - Tracks who updated the enquiry

#### **Notes API** (`/src/app/api/notes/route.js`)
- ✅ POST (Add Note) - Uses logged-in user's name as author
- ✅ PUT (Update Note) - Tracks who updated the note

#### **Stage History API** (`/src/app/api/stage-history/[customerId]/route.js`)
- ✅ POST (Add Stage Entry) - Uses logged-in user's name for the entry

## How It Works

### 1. Frontend Makes Authenticated Request
```javascript
const response = await fetch('/api/customers', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${localStorage.getItem('token')}`
  },
  body: JSON.stringify(customerData)
})
```

### 2. Backend Extracts User from Token
```javascript
const user = getUserFromRequest(request)
// Returns: { userId: 'USR001', email: 'user@example.com', name: 'John Doe', role: 'admin' }
```

### 3. Audit Fields Are Added Automatically
```javascript
const auditFields = createAuditFields(user, true) // true for create operation
// Returns:
// {
//   _createdBy: 'John Doe',
//   _createdAt: '2025-10-30T10:30:00.000Z',
//   _modifiedBy: 'John Doe',
//   _lastModified: '2025-10-30T10:30:00.000Z'
// }
```

### 4. Data is Saved with Audit Trail
All records now contain information about who created/updated them and when.

## Frontend Integration Required

### Update Your API Calls
Make sure all API calls include the Authorization header:

```javascript
// Get token from localStorage
const token = localStorage.getItem('token')

// Include in all API requests
const headers = {
  'Content-Type': 'application/json',
  'Authorization': `Bearer ${token}`
}

// Example: Create customer
await fetch('/api/customers', {
  method: 'POST',
  headers,
  body: JSON.stringify(customerData)
})

// Example: Update customer
await fetch('/api/customers', {
  method: 'PUT',
  headers,
  body: JSON.stringify({ customerId, updates, version })
})

// Example: Add note
await fetch('/api/notes', {
  method: 'POST',
  headers,
  body: JSON.stringify({ customerId, note })
})

// Example: Update stage
await fetch(`/api/stage-history/${customerId}`, {
  method: 'POST',
  headers,
  body: JSON.stringify({ stage, notes, direction })
})
```

## Database Schema Updates

### Customers Collection
```javascript
{
  id: "GKF00001",
  firstName: "John",
  lastName: "Doe",
  // ... other fields ...
  _createdBy: "Jane Smith",
  _createdAt: "2025-10-30T10:30:00.000Z",
  _modifiedBy: "John Admin",
  _lastModified: "2025-10-30T15:45:00.000Z",
  _version: 3
}
```

### Enquiries Collection
```javascript
{
  id: "ENQ001",
  firstName: "Sarah",
  lastName: "Johnson",
  // ... other fields ...
  _createdBy: "Jane Smith",
  _createdAt: "2025-10-30T09:00:00.000Z",
  _modifiedBy: "John Admin",
  _lastModified: "2025-10-30T14:30:00.000Z",
  _version: 2
}
```

### Notes Collection
```javascript
{
  id: "NOTE123",
  referenceId: "GKF00001",
  author: "Jane Smith",  // Auto-populated from logged-in user
  note: "Customer called to confirm details",
  timestamp: "2025-10-30T11:00:00.000Z",
  _createdBy: "Jane Smith",
  _createdAt: "2025-10-30T11:00:00.000Z",
  _modifiedBy: "Jane Smith",
  _lastModified: "2025-10-30T11:00:00.000Z",
  _version: 1
}
```

### Stage History Collection
```javascript
{
  id: "SH45",
  customerId: "GKF00001",
  stage: "Application Submitted",
  user: "Jane Smith",  // Auto-populated from logged-in user
  notes: "Stage moved to Application Submitted",
  timestamp: "2025-10-30T12:00:00.000Z",
  _createdBy: "Jane Smith",
  _createdAt: "2025-10-30T12:00:00.000Z",
  _modifiedBy: "Jane Smith",
  _lastModified: "2025-10-30T12:00:00.000Z",
  _version: 1
}
```

## Fallback Behavior

If no authentication token is provided or token is invalid:
- Audit fields will use "System" as the default user
- This ensures the application continues to work even if authentication fails
- However, you should ensure all frontend pages send the token

## Benefits

1. **Full Audit Trail**: Know exactly who made what changes and when
2. **Accountability**: Track user actions for compliance and troubleshooting
3. **Data Integrity**: Audit information is automatically added, reducing human error
4. **Security**: Uses JWT tokens to verify user identity
5. **Transparency**: Easy to see the history of changes to any record

## Testing

### Test the Audit Trail:
1. Login as a user
2. Create a new customer or enquiry
3. Check MongoDB - the record should have `_createdBy` with your name
4. Update the record
5. Check MongoDB - the record should have `_modifiedBy` with your name and `_lastModified` timestamp
6. Add a note
7. Check MongoDB - the note's `author` should be your name and `_createdBy` should match
8. Update stage history
9. Check MongoDB - the stage entry's `user` should be your name and `_createdBy` should match

## Next Steps

### Frontend Updates Needed:
1. ✅ All API calls already include Authorization header via `useAuth` hook
2. ✅ Display audit information in the UI:
   - Show "Created by" and "Last updated by" on customer/enquiry detail pages
   - Show note author automatically (already done)
   - Show stage history user (already done)

### Optional Enhancements:
- Add a "History" or "Audit Log" view to show all changes to a record
- Display "Last updated by {name} on {date}" in list views
- Add filters to search by who created/updated records
- Export audit trail data for compliance reporting
