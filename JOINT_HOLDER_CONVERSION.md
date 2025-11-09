# Joint Account Holder Conversion to Customer

## Overview
Updated the "Convert to Customer" functionality to automatically propagate joint account holder information from enquiries to the customer record.

## What Changed

### File: `src/app/enquiries/[id]/page.js`

When converting an enquiry with account type "Joint" to a customer, the joint account holder details are now automatically included in the customer's `jointHolders` array.

---

## Implementation Details

### Before Conversion (useEffect)
When the conversion form is opened, the system now checks if the enquiry has a joint account holder and prepares the data:

```javascript
useEffect(() => {
  if (enquiry && showConversionForm) {
    // Build joint holders array if enquiry has joint account holder
    const jointHolders = [];
    if (enquiry.customerAccountType === 'Joint' && 
        (enquiry.jointFirstName || enquiry.jointLastName)) {
      jointHolders.push({
        firstName: enquiry.jointFirstName || '',
        lastName: enquiry.jointLastName || '',
        email: enquiry.jointEmail || '',
        phone: enquiry.jointPhone || '',
        dateOfBirth: enquiry.jointDateOfBirth || '',
        postcode: enquiry.jointPostcode || '',
        employmentStatus: enquiry.jointEmploymentStatus || 'employed',
        address: enquiry.jointAddress || ''
      });
    }

    // Pre-populate form with enquiry data including jointHolders
    setConversionFormData({
      // ... primary account holder fields ...
      customerAccountType: enquiry.customerAccountType || 'Sole',
      jointHolders: jointHolders, // Now includes joint holder data
      // ... other fields ...
    })
  }
}, [enquiry, showConversionForm])
```

### During Conversion (handleConvertToCustomer)
The existing conversion logic already passes the `jointHolders` array to the customer creation API:

```javascript
const customerData = {
  firstName: conversionFormData.firstName,
  lastName: conversionFormData.lastName,
  email: conversionFormData.email,
  // ... other fields ...
  customerAccountType: conversionFormData.customerAccountType || 'Sole',
  jointHolders: conversionFormData.jointHolders || [], // Includes joint holder data
  // ... remaining fields ...
}
```

---

## How It Works

### Step 1: User Opens Conversion Form
1. User clicks "Convert to Customer" button
2. `showConversionForm` is set to `true`
3. `useEffect` triggers and checks if enquiry has joint account holder

### Step 2: Joint Holder Detection
The system checks two conditions:
```javascript
if (enquiry.customerAccountType === 'Joint' && 
    (enquiry.jointFirstName || enquiry.jointLastName))
```

### Step 3: Joint Holder Data Mapping
If conditions are met, creates a joint holder object with all fields:
- `firstName` → from `enquiry.jointFirstName`
- `lastName` → from `enquiry.jointLastName`
- `email` → from `enquiry.jointEmail`
- `phone` → from `enquiry.jointPhone`
- `dateOfBirth` → from `enquiry.jointDateOfBirth`
- `postcode` → from `enquiry.jointPostcode`
- `employmentStatus` → from `enquiry.jointEmploymentStatus`
- `address` → from `enquiry.jointAddress`

### Step 4: Customer Creation
When user confirms conversion, the customer is created with:
- Primary account holder details
- `customerAccountType: 'Joint'`
- `jointHolders` array containing the joint account holder

---

## Data Flow Diagram

```
┌─────────────────────────────────────────┐
│         Enquiry Record                  │
├─────────────────────────────────────────┤
│ customerAccountType: "Joint"            │
│ firstName: "John"                       │
│ lastName: "Smith"                       │
│ jointFirstName: "Jane"                  │
│ jointLastName: "Smith"                  │
│ jointEmail: "jane@example.com"          │
│ jointPhone: "07987654321"               │
│ jointDateOfBirth: "1985-05-15"          │
│ jointPostcode: "SW1A 1AA"               │
│ jointEmploymentStatus: "employed"       │
│ jointAddress: "10 Downing Street"       │
└─────────────────────────────────────────┘
                   │
                   │ Convert to Customer
                   ▼
┌─────────────────────────────────────────┐
│         Customer Record                 │
├─────────────────────────────────────────┤
│ customerAccountType: "Joint"            │
│ firstName: "John"                       │
│ lastName: "Smith"                       │
│ jointHolders: [                         │
│   {                                     │
│     firstName: "Jane",                  │
│     lastName: "Smith",                  │
│     email: "jane@example.com",          │
│     phone: "07987654321",               │
│     dateOfBirth: "1985-05-15",          │
│     postcode: "SW1A 1AA",               │
│     employmentStatus: "employed",       │
│     address: "10 Downing Street"        │
│   }                                     │
│ ]                                       │
└─────────────────────────────────────────┘
```

---

## Examples

### Example 1: Sole Account Enquiry
**Enquiry:**
```json
{
  "id": "ENQ001",
  "customerAccountType": "Sole",
  "firstName": "John",
  "lastName": "Smith",
  "email": "john@example.com"
}
```

**Converted Customer:**
```json
{
  "id": "CUST-2025-001",
  "customerAccountType": "Sole",
  "firstName": "John",
  "lastName": "Smith",
  "email": "john@example.com",
  "jointHolders": []  // Empty array for Sole account
}
```

### Example 2: Joint Account Enquiry
**Enquiry:**
```json
{
  "id": "ENQ002",
  "customerAccountType": "Joint",
  "firstName": "John",
  "lastName": "Smith",
  "email": "john@example.com",
  "jointFirstName": "Jane",
  "jointLastName": "Smith",
  "jointEmail": "jane@example.com",
  "jointPhone": "07987654321",
  "jointDateOfBirth": "1985-05-15",
  "jointPostcode": "SW1A 1AA",
  "jointEmploymentStatus": "employed",
  "jointAddress": "10 Downing Street, London"
}
```

**Converted Customer:**
```json
{
  "id": "CUST-2025-002",
  "customerAccountType": "Joint",
  "firstName": "John",
  "lastName": "Smith",
  "email": "john@example.com",
  "jointHolders": [
    {
      "firstName": "Jane",
      "lastName": "Smith",
      "email": "jane@example.com",
      "phone": "07987654321",
      "dateOfBirth": "1985-05-15",
      "postcode": "SW1A 1AA",
      "employmentStatus": "employed",
      "address": "10 Downing Street, London"
    }
  ]
}
```

### Example 3: Joint Account with Partial Data
**Enquiry:**
```json
{
  "id": "ENQ003",
  "customerAccountType": "Joint",
  "firstName": "John",
  "lastName": "Smith",
  "jointFirstName": "Jane",
  "jointLastName": "Smith",
  "jointEmail": "",  // Empty
  "jointPhone": ""   // Empty
}
```

**Converted Customer:**
```json
{
  "id": "CUST-2025-003",
  "customerAccountType": "Joint",
  "firstName": "John",
  "lastName": "Smith",
  "jointHolders": [
    {
      "firstName": "Jane",
      "lastName": "Smith",
      "email": "",      // Preserves empty values
      "phone": "",      // Preserves empty values
      "dateOfBirth": "",
      "postcode": "",
      "employmentStatus": "employed",  // Default value
      "address": ""
    }
  ]
}
```

---

## Field Mapping

| Enquiry Field | Customer Field (in jointHolders[0]) |
|---------------|-------------------------------------|
| `jointFirstName` | `firstName` |
| `jointLastName` | `lastName` |
| `jointEmail` | `email` |
| `jointPhone` | `phone` |
| `jointDateOfBirth` | `dateOfBirth` |
| `jointPostcode` | `postcode` |
| `jointEmploymentStatus` | `employmentStatus` |
| `jointAddress` | `address` |

---

## Validation & Edge Cases

### ✅ Handled Cases:

1. **Sole Account**: `jointHolders` array is empty
2. **Joint Account with Full Data**: All fields populated
3. **Joint Account with Partial Data**: Empty strings preserved
4. **Missing Joint Fields**: Defaults to empty string
5. **Default Employment Status**: Falls back to 'employed' if not provided

### 🔍 Detection Logic:

Joint holder is only added if **both** conditions are true:
1. `customerAccountType === 'Joint'`
2. At least one name field exists (`jointFirstName` OR `jointLastName`)

This prevents creating empty joint holder objects.

---

## Testing Checklist

### Conversion Tests:
- [ ] Convert Sole account enquiry → Verify `jointHolders` is empty array
- [ ] Convert Joint account with full data → Verify all fields transferred
- [ ] Convert Joint account with partial data → Verify empty fields preserved
- [ ] Convert Joint account with only names → Verify other fields are empty strings
- [ ] Verify converted customer displays joint holder on customer details page
- [ ] Verify joint holder can be edited after conversion
- [ ] Check enquiry status is set to "closed" after conversion
- [ ] Verify enquiry `customerId` field is set to new customer ID

### Database Verification:
- [ ] Check customer record has `jointHolders` array
- [ ] Verify `customerAccountType` is 'Joint'
- [ ] Confirm all joint holder fields are present
- [ ] Ensure no data loss during conversion

---

## Benefits

1. **Automatic Data Transfer**: No manual entry needed for joint holder
2. **Data Integrity**: All joint holder information preserved
3. **Time Saving**: Reduces data entry time significantly
4. **Error Reduction**: Eliminates transcription errors
5. **Audit Trail**: Original enquiry remains linked to customer

---

## Customer API Compatibility

The customer API should support the `jointHolders` array structure:

```javascript
{
  customerAccountType: String,    // 'Sole' or 'Joint'
  jointHolders: Array,            // Array of joint holder objects
  // Each joint holder object contains:
  // - firstName, lastName, email, phone
  // - dateOfBirth, postcode, employmentStatus, address
}
```

---

## Future Enhancements

1. **Multiple Joint Holders**: Support for more than 2 account holders
2. **Joint Holder Validation**: Add validation before conversion
3. **Joint Holder Preview**: Show joint holder data in conversion modal
4. **Editable Joint Holders**: Allow editing joint holder data during conversion
5. **Joint Holder Documents**: Transfer documents for each holder
6. **Annual Income**: Add annual income field for joint holders

---

## User Flow

### Before This Update:
1. User creates Joint enquiry with John & Jane
2. User converts to customer
3. Customer record created with only John
4. User must manually add Jane as joint holder ❌

### After This Update:
1. User creates Joint enquiry with John & Jane
2. User converts to customer
3. Customer record created with John AND Jane automatically ✅
4. Both account holders are immediately available

---

## Summary

✅ **Joint account holder data is now automatically transferred** when converting an enquiry to a customer!

The system:
- Detects joint account enquiries
- Extracts all 8 joint holder fields
- Creates properly formatted `jointHolders` array
- Passes data to customer creation API
- Maintains data integrity throughout

No additional configuration or manual steps required! 🎉
