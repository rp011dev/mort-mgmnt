# Products and Fees API Audit Trail Implementation

## Overview
Extended JWT authentication and audit trail tracking to products and fees APIs, ensuring all database operations are tracked with the logged-in user's information.

## Changes Made

### Backend Updates

#### 1. Products API (`/src/app/api/products/route.js`)

**Added:**
- Import of `getUserFromRequest` and `createAuditFields` from authMiddleware
- User extraction from JWT token in POST and PUT methods
- Audit trail fields for all create and update operations

**POST Method (Add Product):**
```javascript
export async function POST(request) {
  // Extract user from token for audit trail
  const user = getUserFromRequest(request)
  
  // ... existing code ...
  
  // Add audit trail fields
  const timestamp = new Date().toISOString()
  const auditFields = user ? createAuditFields(user, true) : {
    _createdBy: 'System',
    _createdAt: timestamp,
    _modifiedBy: 'System',
    _lastModified: timestamp
  }
  
  // Prepare the product document
  const newProduct = {
    ...product,
    productId: nextProductId,
    customerId,
    ...auditFields,
    _version: 1
  }
}
```

**PUT Method (Update Product):**
```javascript
export async function PUT(request) {
  // Extract user from token for audit trail
  const user = getUserFromRequest(request)
  
  // ... existing code ...
  
  // Add audit trail fields
  const timestamp = new Date().toISOString()
  const auditFields = user ? {
    _modifiedBy: user.name || user.email,
    _lastModified: timestamp
  } : {
    _modifiedBy: 'System',
    _lastModified: timestamp
  }
  
  const updateData = {
    ...fieldsToUpdate,
    customerId,
    productId,
    ...auditFields,
    _version: (currentProduct._version || 0) + 1
  }
}
```

#### 2. Fees API (`/src/app/api/fees/route.js`)

**Added:**
- Import of `getUserFromRequest` and `createAuditFields` from authMiddleware
- User extraction from JWT token in POST and PUT methods
- Audit trail fields plus special `addedBy` field for fees

**POST Method (Add Fee):**
```javascript
export async function POST(request) {
  // Extract user from token for audit trail
  const user = getUserFromRequest(request)
  
  // ... existing code ...
  
  // Add audit trail fields
  const timestamp = new Date().toISOString()
  const userName = user ? (user.name || user.email) : 'System'
  const auditFields = user ? createAuditFields(user, true) : {
    _createdBy: 'System',
    _createdAt: timestamp,
    _modifiedBy: 'System',
    _lastModified: timestamp
  }
  
  const newFee = {
    feeId: newFeeId,
    customerId: customerId,
    type: type,
    amount: parseFloat(amount),
    // ... other fields ...
    addedBy: userName,  // Special field for fees
    ...auditFields,
    _version: 1
  }
}
```

**PUT Method (Update Fee Status):**
```javascript
export async function PUT(request) {
  // Extract user from token for audit trail
  const user = getUserFromRequest(request)
  
  // ... existing code ...
  
  // Add audit trail fields
  const timestamp = new Date().toISOString()
  const auditFields = user ? {
    _modifiedBy: user.name || user.email,
    _lastModified: timestamp
  } : {
    _modifiedBy: 'System',
    _lastModified: timestamp
  }
  
  const updateData = {
    status: status.toUpperCase(),
    ...auditFields,
    _version: (currentFee._version || 0) + 1
  }
}
```

### Frontend Updates

#### Customer Detail Page (`/src/app/customers/[id]/page.js`)

**Updated Functions:**

1. **addProduct()** - Added Authorization header
```javascript
const addProduct = async () => {
  try {
    setSavingProduct(true)
    
    const token = localStorage.getItem('token')
    const response = await fetch(`/api/products`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`  // ✅ Added
      },
      body: JSON.stringify({
        customerId: customerId,
        ...newProductData
      })
    })
    // ... rest of function
  }
}
```

2. **saveProduct()** - Added Authorization header
```javascript
const saveProduct = async (index) => {
  try {
    setSavingProduct(true)
    
    const token = localStorage.getItem('token')
    const response = await fetch(`/api/products`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`  // ✅ Added
      },
      // ... rest of function
    })
  }
}
```

3. **addFee()** - Added Authorization header
```javascript
const addFee = async () => {
  try {
    setSavingFee(true)
    const token = localStorage.getItem('token')
    const response = await fetch('/api/fees', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`  // ✅ Added
      },
      body: JSON.stringify({
        customerId,
        ...newFeeData,
        amount: parseFloat(newFeeData.amount)
      }),
    })
    // ... rest of function
  }
}
```

4. **updateFeeStatus()** - Added Authorization header
```javascript
const updateFeeStatus = async (feeId, status, paymentMethod = null) => {
  try {
    const token = localStorage.getItem('token')
    const response = await fetch('/api/fees', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`  // ✅ Added
      },
      body: JSON.stringify(requestBody),
    })
    // ... rest of function
  }
}
```

## Database Schema

### Products Collection
```javascript
{
  "productId": 1,
  "customerId": "GKF00001",
  "productName": "Residential Mortgage",
  "provider": "Lloyds Bank",
  "startDate": "2025-01-15",
  // ... other product fields ...
  "_createdBy": "Gaurav Khanna",
  "_createdAt": "2025-10-30T12:00:00.000Z",
  "_modifiedBy": "Gaurav Khanna",
  "_lastModified": "2025-10-30T12:00:00.000Z",
  "_version": 1
}
```

### Fees Collection
```javascript
{
  "feeId": "FEE123",
  "customerId": "GKF00001",
  "type": "Arrangement Fee",
  "amount": 999.00,
  "currency": "GBP",
  "status": "PAID",
  "addedBy": "Gaurav Khanna",  // Visible field
  "paidDate": "2025-10-30T12:00:00.000Z",
  "addedDate": "2025-10-30T11:00:00.000Z",
  // ... other fee fields ...
  "_createdBy": "Gaurav Khanna",  // Audit trail
  "_createdAt": "2025-10-30T11:00:00.000Z",
  "_modifiedBy": "Gaurav Khanna",
  "_lastModified": "2025-10-30T12:00:00.000Z",
  "_version": 2
}
```

## Complete Audit Trail System

All CRUD operations now track user identity via JWT token:

| API Endpoint | Operations | Audit Fields | Status |
|-------------|-----------|--------------|--------|
| **Customers** | POST, PUT | _createdBy, _createdAt, _modifiedBy, _lastModified | ✅ Complete |
| **Enquiries** | POST, PUT | _createdBy, _createdAt, _modifiedBy, _lastModified | ✅ Complete |
| **Notes** | POST, PUT | author, _createdBy, _createdAt, _modifiedBy, _lastModified | ✅ Complete |
| **Stage History** | POST | user, _createdBy, _createdAt, _modifiedBy, _lastModified | ✅ Complete |
| **Products** | POST, PUT | _createdBy, _createdAt, _modifiedBy, _lastModified | ✅ Complete |
| **Fees** | POST, PUT | addedBy, _createdBy, _createdAt, _modifiedBy, _lastModified | ✅ Complete |

## How It Works

### 1. User Performs Action
- User is logged in with JWT token stored in localStorage
- Frontend retrieves token: `const token = localStorage.getItem('token')`
- Frontend includes in request: `Authorization: Bearer ${token}`

### 2. Backend Extracts User
```javascript
const user = getUserFromRequest(request)
// Returns: { userId: 'USR001', email: 'gaurav@gkfinance.com', name: 'Gaurav Khanna', role: 'admin' }
```

### 3. Backend Creates Audit Fields
```javascript
const auditFields = createAuditFields(user, true)  // true = create operation
// Returns:
// {
//   _createdBy: 'Gaurav Khanna',
//   _createdAt: '2025-10-30T12:00:00.000Z',
//   _modifiedBy: 'Gaurav Khanna',
//   _lastModified: '2025-10-30T12:00:00.000Z'
// }
```

### 4. Record Saved with Audit Trail
All operations now include complete tracking of who did what and when.

## Benefits

1. ✅ **Complete Audit Trail**: All database operations tracked
2. ✅ **Security**: User identity verified via JWT, not from frontend
3. ✅ **Consistency**: Same audit pattern across all APIs
4. ✅ **Compliance**: Full history of who created/modified records
5. ✅ **Debugging**: Easy to trace issues to specific users
6. ✅ **Accountability**: Clear record of all user actions

## Testing Checklist

- [ ] Login as a user
- [ ] Add a product to a customer
- [ ] Check MongoDB products collection - verify `_createdBy` shows your name
- [ ] Update the product
- [ ] Check MongoDB - verify `_modifiedBy` shows your name and `_lastModified` updated
- [ ] Add a fee to a customer
- [ ] Check MongoDB fees collection - verify `addedBy` and `_createdBy` show your name
- [ ] Change fee status to PAID
- [ ] Check MongoDB - verify `_modifiedBy` shows your name and `_lastModified` updated
- [ ] Logout and login as different user
- [ ] Add/update products and fees
- [ ] Verify new user's name is recorded in all audit fields

## Files Modified

### Backend:
1. ✅ `/src/app/api/products/route.js` - Added JWT auth and audit trails to POST and PUT
2. ✅ `/src/app/api/fees/route.js` - Added JWT auth and audit trails to POST and PUT

### Frontend:
3. ✅ `/src/app/customers/[id]/page.js` - Added Authorization headers to:
   - addProduct()
   - saveProduct()
   - addFee()
   - updateFeeStatus()

### Documentation:
4. ✅ `/PRODUCTS_FEES_AUDIT_FIX.md` - This file

## Summary

The products and fees APIs now have the same level of audit trail tracking as customers, enquiries, notes, and stage history. All database operations are tracked with:
- Who created the record (_createdBy)
- When it was created (_createdAt)
- Who last modified it (_modifiedBy)
- When it was last modified (_lastModified)
- Version number for concurrency control (_version)

The system uses JWT tokens as the single source of truth for user identity, ensuring accurate and secure tracking of all user actions.
