# API Updates for Joint Account Holder Fields

## Overview
Updated the `/api/enquiries` endpoint to support joint account holder information for enquiries with account type "Joint".

## Changes Made

### File: `src/app/api/enquiries/route.js`

---

## 1. POST `/api/enquiries` - Create Enquiry

### What Changed:
Added 8 new fields to capture joint account holder information when creating an enquiry.

### New Fields Added:
```javascript
{
  jointFirstName: string,
  jointLastName: string,
  jointEmail: string,
  jointPhone: string,
  jointDateOfBirth: string,
  jointPostcode: string,
  jointEmploymentStatus: string,
  jointAddress: string
}
```

### Implementation:
```javascript
const newEnquiry = {
  // ... existing fields ...
  
  // Joint account holder fields
  jointFirstName: enquiryData.jointFirstName || '',
  jointLastName: enquiryData.jointLastName || '',
  jointEmail: enquiryData.jointEmail || '',
  jointPhone: enquiryData.jointPhone || '',
  jointDateOfBirth: enquiryData.jointDateOfBirth || '',
  jointPostcode: enquiryData.jointPostcode || '',
  jointEmploymentStatus: enquiryData.jointEmploymentStatus || 'employed',
  jointAddress: enquiryData.jointAddress || '',
  
  // ... audit fields ...
}
```

### Request Example:
```bash
POST /api/enquiries
Content-Type: application/json

{
  "firstName": "John",
  "lastName": "Smith",
  "email": "john.smith@example.com",
  "phone": "07123456789",
  "postcode": "SW1A 1AA",
  "address": "10 Downing Street, London",
  "customerAccountType": "Joint",
  "enquiryType": "Mortgage",
  
  // Joint account holder fields
  "jointFirstName": "Jane",
  "jointLastName": "Smith",
  "jointEmail": "jane.smith@example.com",
  "jointPhone": "07987654321",
  "jointDateOfBirth": "1985-05-15",
  "jointPostcode": "SW1A 1AA",
  "jointEmploymentStatus": "employed",
  "jointAddress": "10 Downing Street, London",
  
  // ... other fields ...
}
```

### Response Example:
```json
{
  "message": "Enquiry created successfully",
  "enquiry": {
    "id": "ENQ001",
    "firstName": "John",
    "lastName": "Smith",
    "email": "john.smith@example.com",
    "customerAccountType": "Joint",
    "jointFirstName": "Jane",
    "jointLastName": "Smith",
    "jointEmail": "jane.smith@example.com",
    "jointPhone": "07987654321",
    // ... all other fields ...
    "_version": 1,
    "_createdAt": "2025-11-07T10:30:00.000Z"
  }
}
```

---

## 2. GET `/api/enquiries` - Retrieve Enquiries

### What Changed:
Enhanced search functionality to include joint account holder fields in the search query.

### Search Enhancement:
When a user searches, the API now searches across these additional fields:
- `jointFirstName`
- `jointLastName`
- `jointEmail`
- `jointPhone`
- `jointPostcode`

### Implementation:
```javascript
// Apply search filter
if (searchTerm && searchTerm.trim()) {
  const term = searchTerm.toLowerCase().trim();
  query.$or = [
    // Primary account holder fields
    { firstName: { $regex: term, $options: 'i' } },
    { lastName: { $regex: term, $options: 'i' } },
    { email: { $regex: term, $options: 'i' } },
    { phone: { $regex: term, $options: 'i' } },
    { postcode: { $regex: term, $options: 'i' } },
    { notes: { $regex: term, $options: 'i' } },
    
    // Joint account holder search fields
    { jointFirstName: { $regex: term, $options: 'i' } },
    { jointLastName: { $regex: term, $options: 'i' } },
    { jointEmail: { $regex: term, $options: 'i' } },
    { jointPhone: { $regex: term, $options: 'i' } },
    { jointPostcode: { $regex: term, $options: 'i' } }
  ];
}
```

### Single Enquiry Retrieval:
```bash
GET /api/enquiries?enquiryId=ENQ001
```

**Response includes all joint account holder fields:**
```json
{
  "id": "ENQ001",
  "firstName": "John",
  "lastName": "Smith",
  "customerAccountType": "Joint",
  "jointFirstName": "Jane",
  "jointLastName": "Smith",
  "jointEmail": "jane.smith@example.com",
  "jointPhone": "07987654321",
  "jointDateOfBirth": "1985-05-15",
  "jointPostcode": "SW1A 1AA",
  "jointEmploymentStatus": "employed",
  "jointAddress": "10 Downing Street, London",
  // ... all other fields ...
}
```

### Search Examples:

**Search by joint account holder name:**
```bash
GET /api/enquiries?search=Jane
```

**Search by joint account holder email:**
```bash
GET /api/enquiries?search=jane.smith@example.com
```

**Search by joint account holder phone:**
```bash
GET /api/enquiries?search=07987654321
```

All searches will now return enquiries where the search term matches either the primary account holder OR the joint account holder fields.

---

## 3. PUT `/api/enquiries` - Update Enquiry

### What Changed:
The PUT endpoint now accepts and updates joint account holder fields.

### Implementation:
The existing PUT logic already handles all fields dynamically, so joint account holder fields are automatically included in updates.

```javascript
// Update the enquiry
const updateData = {
  ...enquiryData,  // This includes all fields, including joint holder fields
  ...auditFields,
  _version: (currentEnquiry._version || 0) + 1
};
```

### Request Example:
```bash
PUT /api/enquiries?enquiryId=ENQ001
Content-Type: application/json

{
  "firstName": "John",
  "lastName": "Smith",
  "customerAccountType": "Joint",
  
  // Update joint account holder fields
  "jointFirstName": "Jane",
  "jointLastName": "Doe",  // Changed from Smith
  "jointEmail": "jane.doe@example.com",  // Updated
  "jointPhone": "07999888777",  // Updated
  "jointDateOfBirth": "1985-05-15",
  "jointPostcode": "SW1A 1AA",
  "jointEmploymentStatus": "self-employed",  // Changed
  "jointAddress": "10 Downing Street, London",
  
  // ... other fields ...
  "version": 1
}
```

### Response Example:
```json
{
  "message": "Enquiry updated successfully",
  "enquiry": {
    "id": "ENQ001",
    "jointFirstName": "Jane",
    "jointLastName": "Doe",
    "jointEmail": "jane.doe@example.com",
    "jointEmploymentStatus": "self-employed",
    // ... all updated fields ...
    "_version": 2,
    "_lastModified": "2025-11-07T11:00:00.000Z",
    "_modifiedBy": "admin@example.com"
  }
}
```

### Changing Account Type:

**From Joint to Sole:**
```bash
PUT /api/enquiries?enquiryId=ENQ001

{
  "customerAccountType": "Sole",
  // Clear joint holder fields
  "jointFirstName": "",
  "jointLastName": "",
  "jointEmail": "",
  "jointPhone": "",
  "jointDateOfBirth": "",
  "jointPostcode": "",
  "jointEmploymentStatus": "",
  "jointAddress": "",
  "version": 2
}
```

**From Sole to Joint:**
```bash
PUT /api/enquiries?enquiryId=ENQ001

{
  "customerAccountType": "Joint",
  // Add joint holder fields
  "jointFirstName": "Jane",
  "jointLastName": "Smith",
  // ... other joint fields ...
  "version": 3
}
```

---

## Field Specifications

| Field Name | Type | Default | Required (Joint) | Description |
|------------|------|---------|------------------|-------------|
| `jointFirstName` | String | `''` | Yes | First name of joint account holder |
| `jointLastName` | String | `''` | Yes | Last name of joint account holder |
| `jointEmail` | String | `''` | Yes | Email address of joint account holder |
| `jointPhone` | String | `''` | Yes | Phone number of joint account holder |
| `jointDateOfBirth` | String | `''` | No | Date of birth (YYYY-MM-DD format) |
| `jointPostcode` | String | `''` | Yes | Postcode of joint account holder |
| `jointEmploymentStatus` | String | `'employed'` | No | Employment status (employed/self-employed/retired/unemployed) |
| `jointAddress` | String | `''` | Yes | Full address of joint account holder |

---

## Database Schema

Ensure your MongoDB collection includes these fields:

```javascript
{
  // Existing fields
  id: String,
  firstName: String,
  lastName: String,
  email: String,
  phone: String,
  customerAccountType: String, // 'Sole' or 'Joint'
  
  // New joint account holder fields
  jointFirstName: String,
  jointLastName: String,
  jointEmail: String,
  jointPhone: String,
  jointDateOfBirth: String,
  jointPostcode: String,
  jointEmploymentStatus: String,
  jointAddress: String,
  
  // Audit fields
  _version: Number,
  _createdAt: String,
  _createdBy: String,
  _lastModified: String,
  _modifiedBy: String
}
```

---

## Validation Notes

### Frontend Validation (Already Implemented):
- All joint holder fields marked with * are required when `customerAccountType === 'Joint'`
- Email validation: Standard email format
- Phone validation: UK phone format (starts with 0 or +44)

### Backend Validation:
The API accepts these fields but relies on frontend validation. Consider adding backend validation:

```javascript
// Example backend validation for joint account holders
if (enquiryData.customerAccountType === 'Joint') {
  const jointRequiredFields = [
    'jointFirstName',
    'jointLastName',
    'jointEmail',
    'jointPhone',
    'jointPostcode',
    'jointAddress'
  ];
  
  const missingJointFields = jointRequiredFields.filter(
    field => !enquiryData[field] || !enquiryData[field].trim()
  );
  
  if (missingJointFields.length > 0) {
    return NextResponse.json({
      error: 'Missing required joint account holder fields',
      missingFields: missingJointFields
    }, { status: 400 });
  }
}
```

---

## Backward Compatibility

✅ **Fully backward compatible** - Existing enquiries without joint account holder data will still work:
- Fields default to empty strings
- No required fields at API level (validation is frontend-only)
- Existing enquiries can be updated to add joint holder information

---

## Testing Checklist

### POST Endpoint:
- [ ] Create enquiry with `customerAccountType: 'Sole'` (joint fields should be empty)
- [ ] Create enquiry with `customerAccountType: 'Joint'` with all joint fields
- [ ] Create enquiry with `customerAccountType: 'Joint'` with partial joint fields
- [ ] Verify joint fields are stored correctly in database
- [ ] Verify audit fields are created properly

### GET Endpoint:
- [ ] Retrieve single enquiry with joint account holder
- [ ] Verify all joint fields are returned
- [ ] Search by joint account holder first name
- [ ] Search by joint account holder last name
- [ ] Search by joint account holder email
- [ ] Search by joint account holder phone
- [ ] Search by joint account holder postcode
- [ ] Verify pagination works with joint holder enquiries

### PUT Endpoint:
- [ ] Update joint account holder fields
- [ ] Change account type from Sole to Joint (add joint fields)
- [ ] Change account type from Joint to Sole (clear joint fields)
- [ ] Update only specific joint fields
- [ ] Verify version increment works
- [ ] Verify audit trail is updated

---

## API Response Status Codes

| Code | Meaning | When |
|------|---------|------|
| 200 | Success | GET/PUT successful |
| 201 | Created | POST successful |
| 400 | Bad Request | Missing required fields |
| 404 | Not Found | Enquiry ID doesn't exist |
| 409 | Conflict | Version mismatch (concurrent update) |
| 500 | Server Error | Database or server error |

---

## Migration Notes

If you have existing enquiries in your database, they will automatically work with this update:
- Old enquiries will have empty string values for joint holder fields
- No database migration required
- Fields are added on-the-fly when enquiries are created or updated

---

## Future Enhancements

Consider adding:
1. **Validation endpoint**: Separate endpoint to validate joint holder data
2. **Joint holder history**: Track changes to joint holder information
3. **Duplicate detection**: Check if joint holder already exists in system
4. **Joint holder relationships**: Link joint holders across multiple enquiries
5. **Joint holder documents**: Separate document storage for each holder

---

## Complete API Examples

### Create Joint Enquiry:
```bash
curl -X POST http://localhost:3000/api/enquiries \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "firstName": "John",
    "lastName": "Smith",
    "email": "john@example.com",
    "phone": "07123456789",
    "postcode": "SW1A 1AA",
    "address": "10 Downing Street",
    "customerAccountType": "Joint",
    "enquiryType": "Mortgage",
    "jointFirstName": "Jane",
    "jointLastName": "Smith",
    "jointEmail": "jane@example.com",
    "jointPhone": "07987654321",
    "jointPostcode": "SW1A 1AA",
    "jointAddress": "10 Downing Street"
  }'
```

### Update Joint Holder Info:
```bash
curl -X PUT "http://localhost:3000/api/enquiries?enquiryId=ENQ001" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "jointEmail": "jane.smith@newdomain.com",
    "jointPhone": "07999888777",
    "version": 1
  }'
```

### Search Joint Holders:
```bash
curl "http://localhost:3000/api/enquiries?search=jane&page=1&limit=10" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## Summary

✅ **POST** - Accepts and stores 8 joint account holder fields
✅ **GET** - Returns joint holder fields and searches across them
✅ **PUT** - Updates joint holder fields with version control
✅ **DELETE** - No changes needed (deletes entire enquiry including joint data)

All API endpoints are now fully compatible with joint account holder functionality! 🎉
