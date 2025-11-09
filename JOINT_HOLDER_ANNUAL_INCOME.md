# Joint Account Holder Annual Income Feature

## Overview

Added annual income field for joint account holders to enable complete financial information capture during the enquiry process. This field is now available across all stages: enquiry creation, enquiry details, and customer conversion.

## Changes Implemented

### 1. Create New Enquiry Page (`src/app/enquiries/new/page.js`)

#### State Management
Added `jointAnnualIncome` to the form state:
```javascript
jointAnnualIncome: '0'
```

#### UI Changes
Added annual income field in the Joint Account Holder section:
- **Location**: After Address field
- **Layout**: Row with Address (col-md-8) and Annual Income (col-md-4)
- **Field Type**: Number input with minimum value of 0
- **Styling**: Small form control (`form-control-sm`) for compact layout

```javascript
<div className="col-md-4">
  <label className="form-label small mb-1">Annual Income</label>
  <input
    type="number"
    className="form-control form-control-sm"
    name="jointAnnualIncome"
    value={formData.jointAnnualIncome}
    onChange={handleInputChange}
    min="0"
    placeholder="Enter annual income"
  />
</div>
```

### 2. Enquiry Details Page (`src/app/enquiries/[id]/page.js`)

#### View Mode Display
Added annual income display in both Personal Details and Joint Account Holder sections:
- **Primary Account Holder**: Shows annual income with currency formatting (£) and thousand separators
- **Joint Account Holder**: Shows joint annual income with currency formatting
- **Conditional Display**: Only shows if value is not null/undefined

#### Edit Mode
Added annual income fields for both primary and joint account holders:
- **Primary Annual Income**: Editable number field in Personal Details section
- **Joint Annual Income**: Editable number field in Joint Account Holder section
- **Layout**: Joint annual income appears alongside Postcode in edit mode

#### Edit Functions
- `handleStartEdit`: Initializes `jointAnnualIncome` field from enquiry data
- `handleSaveEdit`: Includes `jointAnnualIncome` in update payload with proper integer conversion

#### Conversion Form Data
Updated the joint holders array to include annual income:
```javascript
jointHolders.push({
  firstName: enquiry.jointFirstName || '',
  lastName: enquiry.jointLastName || '',
  email: enquiry.jointEmail || '',
  phone: enquiry.jointPhone || '',
  dateOfBirth: enquiry.jointDateOfBirth || '',
  postcode: enquiry.jointPostcode || '',
  employmentStatus: enquiry.jointEmploymentStatus || 'employed',
  address: enquiry.jointAddress || '',
  annualIncome: enquiry.jointAnnualIncome || '0'  // NEW FIELD
});
```

#### Conversion Modal UI
Added annual income field in the joint holder display:
- **Location**: After Postcode field in the Address row
- **Layout**: Address (col-md-6), Postcode (col-md-3), Annual Income (col-md-3)
- **Field Type**: Number input with editable value
- **Features**: Real-time updates to conversion form data

```javascript
<div className="col-md-3 mb-3">
  <label className="form-label">Annual Income</label>
  <input
    type="number"
    className="form-control"
    value={holder.annualIncome || '0'}
    onChange={(e) => {
      const updatedHolders = [...conversionFormData.jointHolders];
      updatedHolders[index].annualIncome = e.target.value;
      handleFormChange('jointHolders', updatedHolders);
    }}
    min="0"
    placeholder="Annual income"
  />
</div>
```

### 3. API Endpoint (`src/app/api/enquiries/route.js`)

#### POST Endpoint
Added `jointAnnualIncome` to the new enquiry object:
```javascript
jointAnnualIncome: enquiryData.jointAnnualIncome || 0,
```

**Default Value**: 0 (consistent with other income fields)
**Type**: Number

#### Database Schema
The field is automatically stored in MongoDB when an enquiry is created with the following characteristics:
- **Field Name**: `jointAnnualIncome`
- **Type**: Number
- **Default**: 0
- **Optional**: Yes (not required for sole accounts)

## Data Flow

### 1. Enquiry Creation
```
User Input (Create New Enquiry)
  ↓
Form State (jointAnnualIncome)
  ↓
POST /api/enquiries
  ↓
MongoDB (enquiries collection)
```

### 2. Enquiry to Customer Conversion
```
MongoDB (enquiries collection)
  ↓
Enquiry Details Page Load
  ↓
Build jointHolders Array (including annualIncome)
  ↓
Conversion Form Pre-population
  ↓
User Review/Edit in Modal
  ↓
POST /api/customers (with jointHolders array)
  ↓
MongoDB (customers collection)
```

## Benefits

1. **Complete Financial Profile**: Captures both primary and joint account holder income for accurate affordability assessment
2. **Data Consistency**: Ensures joint holder data structure matches primary account holder
3. **Seamless Conversion**: Annual income automatically transfers when converting enquiry to customer
4. **Better Decision Making**: Provides comprehensive financial information for mortgage applications

## Testing Checklist

- [ ] Create new enquiry with Joint account type
- [ ] Fill in joint holder annual income field
- [ ] Submit form and verify data saved
- [ ] Open enquiry details page
- [ ] Verify joint holder annual income displays correctly
- [ ] Click "Convert to Customer"
- [ ] Verify annual income pre-populated in conversion modal
- [ ] Edit annual income in modal
- [ ] Complete conversion
- [ ] Verify customer record has joint holder with annual income

## Database Fields

### Enquiry Collection
```javascript
{
  // ... other enquiry fields
  jointAnnualIncome: Number,  // NEW FIELD (default: 0)
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

### Customer Collection (via jointHolders array)
```javascript
{
  // ... other customer fields
  jointHolders: [
    {
      firstName: String,
      lastName: String,
      email: String,
      phone: String,
      dateOfBirth: String,
      postcode: String,
      employmentStatus: String,
      address: String,
      annualIncome: Number  // Transferred from enquiry
    }
  ]
}
```

## Related Files

- `/src/app/enquiries/new/page.js` - Create New Enquiry form
- `/src/app/enquiries/[id]/page.js` - Enquiry Details and Conversion
- `/src/app/api/enquiries/route.js` - Enquiries API endpoints
- `/src/app/api/customers/route.js` - Customers API (receives joint holder data)

## Date Implemented

November 7, 2025

## Notes

- Annual income is stored as a number (not string) for mathematical operations
- Default value of 0 ensures compatibility with existing records
- Field is optional and not validated as required (similar to primary account holder's annual income)
- UI uses compact styling (`form-control-sm`) to maintain page density
- Conversion modal allows editing before final customer creation
