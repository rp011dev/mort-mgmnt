# Enquiry Update API Fix - Immutable Field Error

## Issue

When updating an enquiry via the PUT `/api/enquiries` endpoint, MongoDB was throwing an error:

```
errorResponse: Performing an update on the path '_id' would modify the immutable field '_id'
Error Code: 66
Error Name: ImmutableField
```

## Root Cause

The `enquiryData` object received from the frontend included MongoDB internal fields:
- `_id` (immutable field - cannot be updated)
- `_version` (managed separately by concurrency control)
- `_createdBy` (should not be modified after creation)
- `_createdAt` (should not be modified after creation)

The code was spreading the entire `enquiryData` object into the `updateData`, which caused MongoDB to reject the operation when it encountered the `_id` field.

```javascript
// BEFORE (Problematic Code)
const updateData = {
  ...enquiryData,  // This includes _id and other internal fields
  ...auditFields,
  _version: (currentEnquiry._version || 0) + 1
};
```

## Solution

Destructure and exclude MongoDB internal/immutable fields before creating the update object:

```javascript
// AFTER (Fixed Code)
// Exclude MongoDB internal/immutable fields before update
const { _id, _version: oldVersion, _createdBy, _createdAt, ...updateFields } = enquiryData;

// Prepare update data with versioning and audit trail
const updateData = {
  ...updateFields,  // Only includes editable business fields
  ...auditFields,   // _modifiedBy and _lastModified
  _version: (currentEnquiry._version || 0) + 1
};
```

## Fields Excluded

1. **`_id`** - MongoDB immutable document identifier
2. **`_version`** - Concurrency control field, incremented separately
3. **`_createdBy`** - Audit field, should never change after creation
4. **`_createdAt`** - Audit field, should never change after creation

## Fields Preserved

All business fields including:
- Enquiry details (firstName, lastName, email, phone, etc.)
- Account information (customerAccountType, productType, etc.)
- Joint account holder fields (jointFirstName, jointLastName, etc.)
- Custom fields (notes, status, stage, etc.)

## Audit Trail

The fix preserves proper audit trail management:
- `_modifiedBy` - Updated with current user or 'System'
- `_lastModified` - Updated with current timestamp
- `_version` - Incremented for optimistic locking

## Testing

To test the fix:

1. **Create a Joint Enquiry:**
   - Navigate to "Create New Enquiry"
   - Select Account Type: "Joint"
   - Fill in all joint holder fields
   - Submit

2. **Edit the Enquiry:**
   - Open the enquiry details page
   - Click "Edit"
   - Modify any fields (customer or joint holder)
   - Click "Save"

3. **Verify Success:**
   - Should see success message: "Enquiry updated successfully"
   - No MongoDB error 66
   - Changes should be reflected in the database
   - Version number should increment

## Related Files

- `/src/app/api/enquiries/route.js` - PUT method (lines 255-270)
- `/src/app/enquiries/[id]/page.js` - Frontend edit functionality
- `JOINT_ACCOUNT_HOLDER_FEATURE.md` - Joint holder feature documentation

## Impact

This fix enables:
- ✅ Updating enquiries without MongoDB errors
- ✅ Editing joint account holder information
- ✅ Proper concurrency control with version management
- ✅ Maintaining audit trail integrity
- ✅ Complete joint holder workflow (create → view → edit → convert)

## Date Fixed

December 2024

## Related Error Codes

- MongoDB Error Code 66: ImmutableField
- HTTP Status 500: Internal Server Error (before fix)
- HTTP Status 200: Success (after fix)
