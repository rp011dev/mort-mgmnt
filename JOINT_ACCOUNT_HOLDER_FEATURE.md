# Joint Account Holder Feature Implementation

## Overview
Added support for joint account holders in the enquiry management system. When a user selects "Joint" as the account type, additional fields appear to capture the second account holder's information.

## Changes Made

### 1. Create New Enquiry Page (`src/app/enquiries/new/page.js`)

#### Added State Fields:
```javascript
jointFirstName: ''
jointLastName: ''
jointEmail: ''
jointPhone: ''
jointDateOfBirth: ''
jointPostcode: ''
jointEmploymentStatus: 'employed'
jointAddress: ''
```

#### Updated Validation:
- When `customerAccountType === 'Joint'`, the following fields are required:
  - Joint First Name
  - Joint Last Name
  - Joint Email (with email format validation)
  - Joint Phone (with UK phone format validation)
  - Joint Postcode
  - Joint Address

#### UI Changes:
- Joint account holder form section appears dynamically when "Account Type" is set to "Joint"
- Form includes all personal details fields for the second account holder
- Fields are displayed in a clear, organized layout with appropriate labels
- Validation errors are shown inline for each field

### 2. Enquiry Details Page (`src/app/enquiries/[id]/page.js`)

#### View Mode:
- Displays joint account holder information when:
  - Account type is "Joint"
  - At least one joint account holder field has data
- Shows all joint account holder details including:
  - Name (clickable email link)
  - Email (clickable email link)
  - Phone (clickable phone link)
  - Date of Birth
  - Employment Status
  - Address
  - Postcode
- Section is separated with a horizontal line for clarity

#### Edit Mode:
- Joint account holder fields appear when "Joint" is selected
- All fields are editable
- Same field structure as the create page
- Data persists when switching between account types

#### Save Functionality:
- Joint account holder data is only saved when account type is "Joint"
- Fields are cleared if account type is changed from "Joint" to "Sole"

## Fields Added

| Field Name | Type | Required (Joint) | Validation |
|------------|------|------------------|------------|
| `jointFirstName` | String | Yes | Non-empty |
| `jointLastName` | String | Yes | Non-empty |
| `jointEmail` | String | Yes | Valid email format |
| `jointPhone` | String | Yes | UK phone format |
| `jointDateOfBirth` | Date | No | - |
| `jointPostcode` | String | Yes | Non-empty |
| `jointEmploymentStatus` | Select | No | employed/self-employed/retired/unemployed |
| `jointAddress` | Text | Yes | Non-empty |

## Usage

### Creating a New Enquiry with Joint Account Holder:

1. Navigate to "Create New Enquiry"
2. Fill in the primary account holder's personal details
3. Select "Joint" from the "Account Type" dropdown
4. Fill in all required joint account holder fields
5. Complete the rest of the enquiry form
6. Click "Create Enquiry"

### Viewing Joint Account Holder Information:

1. Open any enquiry with account type "Joint"
2. Scroll to the "Enquiry Information" card
3. Joint account holder details will be displayed below the primary account holder
4. Section is clearly labeled "Joint Account Holder"

### Editing Joint Account Holder Information:

1. Open an enquiry
2. Click "Edit Enquiry"
3. Change "Account Type" to "Joint" (if not already)
4. Joint account holder fields will appear
5. Update the necessary fields
6. Click "Save Changes"

## Database Schema

The following fields should be added to the enquiry collection/table:

```javascript
{
  // Existing fields...
  customerAccountType: String, // 'Sole' or 'Joint'
  
  // New joint account holder fields
  jointFirstName: String,
  jointLastName: String,
  jointEmail: String,
  jointPhone: String,
  jointDateOfBirth: String,
  jointPostcode: String,
  jointEmploymentStatus: String,
  jointAddress: String
}
```

## API Updates Required

Ensure your API endpoints handle the new joint account holder fields:

### POST `/api/enquiries`
- Accept and validate joint account holder fields
- Only process these fields when `customerAccountType === 'Joint'`

### PUT `/api/enquiries?enquiryId={id}`
- Update joint account holder fields
- Clear these fields when account type changes from 'Joint' to 'Sole'

### GET `/api/enquiries?enquiryId={id}`
- Return joint account holder fields in the response

## Testing Checklist

- [ ] Create new enquiry with Joint account type
- [ ] Verify all joint account holder fields are required when Joint is selected
- [ ] Verify validation works for email and phone fields
- [ ] Create enquiry and verify data is saved correctly
- [ ] View enquiry details and verify joint account holder information displays
- [ ] Edit enquiry and update joint account holder information
- [ ] Change account type from Joint to Sole and verify fields are hidden
- [ ] Change account type from Sole to Joint and verify fields appear
- [ ] Verify joint account holder data persists after page refresh
- [ ] Test with empty joint account holder fields (should show nothing in view mode)

## Benefits

1. **Complete Information Capture**: Captures all necessary details for both account holders
2. **Validation**: Ensures data quality with proper validation rules
3. **User-Friendly**: Fields appear/disappear dynamically based on account type
4. **Consistent UI**: Maintains the same design patterns as existing forms
5. **Edit Capability**: Full CRUD support for joint account holder information
6. **Clear Presentation**: Joint account holder info is clearly separated and labeled

## Future Enhancements

- Add annual income field for joint account holder
- Support for more than 2 account holders
- Automatic duplication of address from primary to joint holder
- Joint account holder document upload section
- Individual notes/history tracking for each account holder
