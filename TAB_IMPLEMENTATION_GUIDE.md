# Customer Details Page - Tab Implementation Guide

## Overview
This guide explains how to add tabs to the customer details page to organize content better and reduce scrolling.

## Implementation Steps

### 1. Add Tab State

After the existing state declarations (around line 38), add:

```javascript
// Tab state - controls which content to display
const [activeTab, setActiveTab] = useState('overview')
```

### 2. Add Tab Navigation

After the header section and before `<div className="row">` (around line 1710), add:

```jsx
{/* Tabs Navigation */}
<ul className="nav nav-tabs mb-3">
  <li className="nav-item">
    <button 
      className={`nav-link ${activeTab === 'overview' ? 'active' : ''}`}
      onClick={() => setActiveTab('overview')}
    >
      <i className="bi bi-person-circle me-1"></i>Overview
    </button>
  </li>
  <li className="nav-item">
    <button 
      className={`nav-link ${activeTab === 'products' ? 'active' : ''}`}
      onClick={() => setActiveTab('products')}
    >
      <i className="bi bi-box-seam me-1"></i>Products
    </button>
  </li>
  <li className="nav-item">
    <button 
      className={`nav-link ${activeTab === 'documents' ? 'active' : ''}`}
      onClick={() => setActiveTab('documents')}
    >
      <i className="bi bi-file-earmark-text me-1"></i>Documents
    </button>
  </li>
  <li className="nav-item">
    <button 
      className={`nav-link ${activeTab === 'fees' ? 'active' : ''}`}
      onClick={() => setActiveTab('fees')}
    >
      <i className="bi bi-currency-pound me-1"></i>Fees
    </button>
  </li>
  <li className="nav-item">
    <button 
      className={`nav-link ${activeTab === 'timeline' ? 'active' : ''}`}
      onClick={() => setActiveTab('timeline')}
    >
      <i className="bi bi-clock-history me-1"></i>Timeline
    </button>
  </li>
  <li className="nav-item">
    <button 
      className={`nav-link ${activeTab === 'enquiries' ? 'active' : ''}`}
      onClick={() => setActiveTab('enquiries')}
    >
      <i className="bi bi-envelope me-1"></i>Enquiries
    </button>
  </li>
</ul>
```

### 3. Wrap Sections with Conditional Rendering

#### Overview Tab (Keep these sections):
- Customer Information
- Joint Account Holders  
- Stage Management

Wrap these sections with:
```jsx
{activeTab === 'overview' && (
  <div className="col-lg-8 order-1 order-lg-1">
    {/* Customer Information */}
    {/* Joint Account Holders */}
    {/* Stage Management */}
  </div>
)}
```

#### Products Tab:
Move or show "Product Summary" section when `activeTab === 'products'`:
```jsx
{activeTab === 'products' && (
  <div className="col-12">
    {/* Product Summary card */}
  </div>
)}
```

#### Documents Tab:
```jsx
{activeTab === 'documents' && (
  <div className="col-12">
    <CustomerDocuments customerId={customer.id} />
  </div>
)}
```

#### Fees Tab:
Show "Fees Summary" section:
```jsx
{activeTab === 'fees' && (
  <div className="col-12">
    {/* Fees Summary card with all fee management */}
  </div>
)}
```

#### Timeline Tab:
Move timeline and notes sections:
```jsx
{activeTab === 'timeline' && (
  <div className="col-12">
    {/* Add Note card */}
    {/* Customer Journey Timeline card */}
  </div>
)}
```

#### Enquiries Tab:
Show linked enquiries:
```jsx
{activeTab === 'enquiries' && (
  <div className="col-12">
    {/* Linked Enquiries card */}
  </div>
)}
```

### 4. Keep Sidebar Always Visible

The sidebar with Quick Actions and Stage History should remain visible on all tabs:

```jsx
<div className="col-lg-4 order-2 order-lg-2">
  {/* Quick Actions */}
  {/* Stage History Timeline */}
</div>
```

## Section Locations in Current File

- **Customer Information**: Lines ~1712-1970
- **Joint Account Holders**: Lines ~1972-2076  
- **Product Summary**: Lines ~2078-2510
- **Stage Management**: Lines ~2512-2574
- **Customer Documents**: Lines ~2576-2596 
- **Fees Summary**: Lines ~2598-2918
- **Linked Enquiries**: Lines ~2920-3023
- **Add Note**: Lines ~3025-3068
- **Customer Journey Timeline**: Lines ~3070-3186
- **Quick Actions** (Sidebar): Lines ~3193-3232
- **Stage History** (Sidebar): Lines ~3234-3312

## CSS for Tab Buttons

The tabs use Bootstrap nav-tabs classes, which should already be styled. If you need custom styling, add to `globals.css`:

```css
.nav-tabs .nav-link {
  cursor: pointer;
  border: none;
  border-bottom: 3px solid transparent;
  color: #6c757d;
  transition: all 0.3s ease;
}

.nav-tabs .nav-link:hover {
  border-bottom-color: #dee2e6;
  color: #495057;
}

.nav-tabs .nav-link.active {
  border-bottom-color: #0d6efd;
  color: #0d6efd;
  font-weight: 600;
}
```

## Benefits

1. **Reduced Scrolling**: Users can jump directly to the section they need
2. **Better Organization**: Related information is grouped logically
3. **Improved Performance**: Only active tab content is rendered (if using conditional rendering)
4. **Modern UX**: Tab interface is intuitive and familiar to users
5. **Maintains Context**: Sidebar stays visible for quick actions

## Testing Checklist

- [ ] All tabs are clickable and switch content correctly
- [ ] Overview tab shows customer info, joint holders, and stage management
- [ ] Products tab shows all products with add/edit functionality
- [ ] Documents tab shows CustomerDocuments component
- [ ] Fees tab shows all fees with add/edit/payment functionality
- [ ] Timeline tab shows notes and timeline with pagination
- [ ] Enquiries tab shows linked enquiries
- [ ] Sidebar remains visible on all tabs
- [ ] All existing functionality works (add, edit, delete operations)
- [ ] No console errors
- [ ] Responsive design works on mobile/tablet

## Notes

- The sidebar (Quick Actions and Stage History) should be visible on ALL tabs
- Make sure to test all CRUD operations after implementing tabs
- Keep the existing modal dialogs (they work across all tabs)
- The tab state persists during the session but resets on page reload (currently set to 'overview')
- Consider adding tab state to URL parameters for bookmarkable tabs (optional enhancement)
