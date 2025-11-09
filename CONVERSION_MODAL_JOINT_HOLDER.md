# Joint Account Holder Display in Conversion Modal

## Overview
Added joint account holder fields display and editing capability in the "Convert Enquiry to Customer" modal popup.

## What Changed

### File: `src/app/enquiries/[id]/page.js`

Added a new section in the conversion modal that displays and allows editing of joint account holder information before converting the enquiry to a customer.

---

## Implementation

### Location
The joint account holder section appears in the conversion modal between:
1. **Personal Information** section (primary account holder)
2. **Application Details** section

### Display Condition
The section only displays when **ALL** of these conditions are met:
```javascript
conversionFormData.customerAccountType === 'Joint' 
&& conversionFormData.jointHolders 
&& conversionFormData.jointHolders.length > 0
```

### Features Added

#### 1. **Visual Section Header**
- Clear heading: "Joint Account Holder Information"
- Styled with Bootstrap primary color
- Consistent with other modal sections

#### 2. **Joint Holder Badge**
- Blue info badge showing "Joint Holder 1", "Joint Holder 2", etc.
- Helps identify multiple holders (future-proof for 3+ holders)

#### 3. **Editable Fields**
All 8 joint account holder fields are displayed and editable:

| Field | Type | Placeholder |
|-------|------|-------------|
| First Name | Text input | - |
| Last Name | Text input | - |
| Email | Email input | - |
| Phone | Tel input | 07XXXXXXXXX |
| Date of Birth | Date input | - |
| Employment Status | Dropdown | employed/self-employed/retired/unemployed |
| Address | Text input | - |
| Postcode | Text input | - |

#### 4. **Live Editing**
Each field has an `onChange` handler that updates the `jointHolders` array in `conversionFormData`:

```javascript
onChange={(e) => {
  const updatedHolders = [...conversionFormData.jointHolders];
  updatedHolders[index].firstName = e.target.value;
  handleFormChange('jointHolders', updatedHolders);
}}
```

#### 5. **Responsive Layout**
- 2-column layout for most fields (col-md-6)
- Address field takes 8 columns (col-md-8)
- Postcode field takes 4 columns (col-md-4)
- Stacks vertically on mobile devices

#### 6. **Bordered Container**
Each joint holder is displayed in a bordered, rounded container with padding for clear visual separation.

---

## User Experience

### Before This Update:
1. User opens conversion modal
2. Sees primary account holder fields
3. **No visibility of joint holder information** ❌
4. Must manually check/remember joint holder details
5. Converts enquiry
6. Joint holder data is transferred but user couldn't verify it

### After This Update:
1. User opens conversion modal
2. Sees primary account holder fields
3. **Sees joint account holder section with all details** ✅
4. Can review and edit joint holder information
5. Can verify all data before converting
6. Converts enquiry with confidence

---

## Visual Structure

```
┌─────────────────────────────────────────────────┐
│  Convert Enquiry to Customer                   │
├─────────────────────────────────────────────────┤
│                                                 │
│  📋 Personal Information (Primary Holder)      │
│  ├─ First Name: John                           │
│  ├─ Last Name: Smith                           │
│  ├─ Email: john@example.com                    │
│  └─ ... other fields ...                       │
│                                                 │
│  👥 Joint Account Holder Information           │
│  ┌───────────────────────────────────────┐     │
│  │ [i] Joint Holder 1                    │     │
│  ├───────────────────────────────────────┤     │
│  │ First Name: Jane                      │     │
│  │ Last Name: Smith                      │     │
│  │ Email: jane@example.com               │     │
│  │ Phone: 07987654321                    │     │
│  │ Date of Birth: 1985-05-15             │     │
│  │ Employment Status: employed           │     │
│  │ Address: 10 Downing Street            │     │
│  │ Postcode: SW1A 1AA                    │     │
│  └───────────────────────────────────────┘     │
│                                                 │
│  🏢 Application Details                        │
│  └─ ... application fields ...                 │
│                                                 │
│  [Cancel]  [Convert to Customer]               │
└─────────────────────────────────────────────────┘
```

---

## Code Structure

### Main Component
```javascript
{/* Joint Account Holder Information */}
{conversionFormData.customerAccountType === 'Joint' && 
 conversionFormData.jointHolders && 
 conversionFormData.jointHolders.length > 0 && (
  <div className="mb-4">
    <h6 className="text-primary mb-3">Joint Account Holder Information</h6>
    {conversionFormData.jointHolders.map((holder, index) => (
      <div key={index} className="border rounded p-3 mb-3">
        {/* Badge */}
        <div className="d-flex justify-content-between align-items-center mb-3">
          <span className="badge bg-info">Joint Holder {index + 1}</span>
        </div>
        
        {/* All input fields */}
        {/* ... */}
      </div>
    ))}
  </div>
)}
```

### Update Handler Pattern
```javascript
onChange={(e) => {
  const updatedHolders = [...conversionFormData.jointHolders];
  updatedHolders[index].fieldName = e.target.value;
  handleFormChange('jointHolders', updatedHolders);
}}
```

This pattern:
1. Creates a copy of the jointHolders array
2. Updates the specific field for the specific holder
3. Calls handleFormChange to update the entire array

---

## Example Scenarios

### Scenario 1: Joint Account with Full Data
**When modal opens:**
- Personal Information shows: John Smith
- Joint Account Holder section displays
- Shows Jane Smith with all 8 fields populated
- User can review, edit if needed, and convert

### Scenario 2: Joint Account with Partial Data
**When modal opens:**
- Personal Information shows: John Smith
- Joint Account Holder section displays
- Shows Jane Smith with only name and email
- User can fill in missing fields before converting
- Ensures complete data before customer creation

### Scenario 3: Sole Account
**When modal opens:**
- Personal Information shows: John Smith
- Joint Account Holder section does NOT display
- Only primary holder and application details shown
- Clean, uncluttered interface for sole accounts

---

## Data Flow

### 1. Enquiry Loaded
```javascript
enquiry = {
  customerAccountType: 'Joint',
  jointFirstName: 'Jane',
  jointLastName: 'Smith',
  // ... other joint fields
}
```

### 2. Conversion Form Opened
```javascript
// useEffect builds jointHolders array
jointHolders = [{
  firstName: 'Jane',
  lastName: 'Smith',
  email: 'jane@example.com',
  // ... other fields
}]

conversionFormData = {
  customerAccountType: 'Joint',
  jointHolders: jointHolders,
  // ... other fields
}
```

### 3. Modal Displays
```javascript
// Conditional rendering shows joint holder section
{conversionFormData.customerAccountType === 'Joint' && 
 conversionFormData.jointHolders.length > 0 && (
  // Display joint holder form fields
)}
```

### 4. User Edits (Optional)
```javascript
// User changes email
updatedHolders[0].email = 'jane.smith@newdomain.com'
handleFormChange('jointHolders', updatedHolders)
```

### 5. Conversion Happens
```javascript
customerData = {
  customerAccountType: 'Joint',
  jointHolders: conversionFormData.jointHolders,
  // ... includes edited data
}
```

---

## Benefits

### 1. **Transparency**
Users can see exactly what data will be transferred to the customer record.

### 2. **Verification**
Users can verify joint holder information before conversion.

### 3. **Editing Capability**
Users can correct or complete joint holder data during conversion.

### 4. **Data Quality**
Ensures high-quality customer data by allowing review before creation.

### 5. **User Confidence**
Users feel confident knowing exactly what customer record will be created.

### 6. **Error Prevention**
Reduces errors by allowing data verification at conversion time.

---

## Styling Details

### Section Styling
- **Margin Bottom**: `mb-4` (Bootstrap spacing)
- **Heading**: Text-primary color for consistency
- **Container**: Border, rounded corners, padding

### Field Layout
- **Row/Column**: Bootstrap grid system
- **Responsive**: Stacks on mobile, side-by-side on desktop
- **Spacing**: Consistent margin-bottom on each field

### Badge Styling
- **Color**: Info badge (blue)
- **Position**: Top of each holder container
- **Content**: "Joint Holder 1", "Joint Holder 2", etc.

---

## Future Enhancements

### 1. **Add Joint Holder Button**
Allow users to add additional joint holders during conversion:
```javascript
<button onClick={addJointHolder}>
  + Add Another Joint Holder
</button>
```

### 2. **Remove Joint Holder Button**
Allow users to remove joint holders:
```javascript
<button onClick={() => removeJointHolder(index)}>
  Remove Joint Holder
</button>
```

### 3. **Validation**
Add validation for required joint holder fields:
- Email format validation
- Phone number format validation
- Required field checks

### 4. **Address Lookup**
Add postcode lookup for joint holder address:
```javascript
<button onClick={() => lookupAddress(holder.postcode)}>
  Lookup Address
</button>
```

### 5. **Copy Address**
Quick action to copy primary holder's address:
```javascript
<button onClick={() => copyPrimaryAddress(index)}>
  Copy Primary Address
</button>
```

### 6. **Annual Income**
Add annual income field for joint holders.

---

## Testing Checklist

- [ ] Open conversion modal for Joint account enquiry
- [ ] Verify joint holder section displays
- [ ] Verify all 8 fields are shown with correct values
- [ ] Edit first name and verify update works
- [ ] Edit email and verify update works
- [ ] Change employment status and verify update works
- [ ] Convert enquiry and verify joint holder data is saved
- [ ] Open conversion modal for Sole account enquiry
- [ ] Verify joint holder section does NOT display
- [ ] Test with partial joint holder data
- [ ] Test with empty joint holder fields
- [ ] Test on mobile device (responsive layout)

---

## Summary

✅ **Joint account holder information is now visible and editable in the conversion modal!**

Users can:
- See all joint holder details before converting
- Review and verify the information
- Edit any field if needed
- Convert with confidence knowing exactly what will be created

The modal provides a complete view of both the primary and joint account holders, ensuring data quality and transparency throughout the conversion process. 🎉
