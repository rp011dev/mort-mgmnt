'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useUser } from '../../../context/UserContext'

export default function EnquiryDetails({ params }) {
  const { currentUser } = useUser()
  const [enquiry, setEnquiry] = useState(null)
  const [enquiryNotes, setEnquiryNotes] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [converting, setConverting] = useState(false)
  const [showConversionForm, setShowConversionForm] = useState(false)
  const [conversionFormData, setConversionFormData] = useState({})
  const [isEditing, setIsEditing] = useState(false)
  const [editFormData, setEditFormData] = useState({})
  const [saving, setSaving] = useState(false)
  const [successMessage, setSuccessMessage] = useState('')
  const [errorMessage, setErrorMessage] = useState('')
  const [showCustomerSearch, setShowCustomerSearch] = useState(false)
  const [customerSearchQuery, setCustomerSearchQuery] = useState('')
  const [customerSearchResults, setCustomerSearchResults] = useState([])
  const [allCustomers, setAllCustomers] = useState([])
  const [associatingCustomer, setAssociatingCustomer] = useState(false)
  const [newNote, setNewNote] = useState('')
  const [addingNote, setAddingNote] = useState(false)
  const [showMeetingModal, setShowMeetingModal] = useState(false)
  const [meetingType, setMeetingType] = useState('')
  const [meetingData, setMeetingData] = useState({
    date: '',
    time: '',
    duration: '30',
    notes: '',
    clientName: '',
    clientEmail: '',
    clientPhone: ''
  })
  const router = useRouter()

  useEffect(() => {
    loadEnquiry()
    loadNotes()
  }, [params.id])

  useEffect(() => {
    if (enquiry && showConversionForm) {
      // Pre-populate form with enquiry data
      setConversionFormData({
        firstName: enquiry.firstName || '',
        lastName: enquiry.lastName || '',
        email: enquiry.email || '',
        phone: enquiry.phone || '',
        postcode: enquiry.postcode || '',
        address: enquiry.address || '',
        dateOfBirth: enquiry.dateOfBirth || '',
        customerAccountType: enquiry.customerAccountType || 'Sole',
        jointHolders: [],
        category: enquiry.enquiryType === 'Mortgage' ? 'Mortgages' : enquiry.enquiryType === 'Protection' ? 'Protection' : 'Insurance',
        lender: enquiry.preferredLender || '',
        mortgageType: enquiry.mortgageType || '',
        loanAmount: enquiry.loanAmount || '',
        propertyValue: enquiry.propertyValue || '',
        employmentStatus: enquiry.employmentStatus || '',
        annualIncome: enquiry.annualIncome || '',
        productStartDate: '',
        productEndDate: '',
        currentStage: 'initial-enquiry-assessment',
        addProduct: false,
        productReferenceNumber: '',
        rateOfInterest: '',
        propertyAddress: '',
        propertyPostcode: ''
      })
    }
  }, [enquiry, showConversionForm])

  const loadEnquiry = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/enquiries?enquiryId=${params.id}`)
      
      if (!response.ok) {
        throw new Error('Enquiry not found')
      }
      
      const data = await response.json()
      setEnquiry(data)
    } catch (error) {
      console.error('Error loading enquiry:', error)
      setError(error.message)
    } finally {
      setLoading(false)
    }
  }

  const loadNotes = async () => {
    try {
      const response = await fetch(`/api/notes?enquiryId=${params.id}&sortOrder=desc`)
      if (response.ok) {
        const data = await response.json()
        // The API returns paginated data with notes array inside
        // Sort by timestamp to ensure newest first (in case API doesn't sort properly)
        const sortedNotes = (data.notes || []).sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
        setEnquiryNotes(sortedNotes)
      }
    } catch (error) {
      console.error('Error loading notes:', error)
      setEnquiryNotes([]) // Ensure it's always an array
    }
  }

  const addNote = async () => {
    if (!newNote.trim()) return

    try {
      setAddingNote(true)
      
      const response = await fetch(`/api/notes`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          enquiryId: params.id,
          note: newNote.trim(),
          author: currentUser ? currentUser.name : 'Unknown User',
          stage: enquiry?.status || 'new'
        })
      })

      if (!response.ok) {
        throw new Error('Failed to add note')
      }

      const savedNote = await response.json()
      // Add new note at the beginning (top) of the array for newest first display
      setEnquiryNotes(prev => Array.isArray(prev) ? [savedNote, ...prev] : [savedNote])
      setNewNote('')
    } catch (error) {
      console.error('Error adding note:', error)
      setErrorMessage('Failed to add note')
    } finally {
      setAddingNote(false)
    }
  }

  const handleConvertToCustomer = async () => {
    if (!enquiry) return
    
    setConverting(true)
    try {
      // Use the form data for conversion
      const customerData = {
        firstName: conversionFormData.firstName,
        lastName: conversionFormData.lastName,
        email: conversionFormData.email,
        phone: conversionFormData.phone,
        postcode: conversionFormData.postcode,
        address: conversionFormData.address,
        dateOfBirth: conversionFormData.dateOfBirth,
        customerAccountType: conversionFormData.customerAccountType || 'Sole',
        jointHolders: conversionFormData.jointHolders || [],
        submissionDate: new Date().toISOString().split('T')[0],
        category: conversionFormData.category,
        productReferenceNumber: conversionFormData.productReferenceNumber,
        lender: conversionFormData.lender,
        mortgageType: conversionFormData.mortgageType,
        ltv: conversionFormData.propertyValue > 0 ? parseFloat((conversionFormData.loanAmount / conversionFormData.propertyValue * 100).toFixed(1)) : 0,
        rateOfInterest: parseFloat(conversionFormData.rateOfInterest) || 0,
        productStartDate: conversionFormData.productStartDate,
        productEndDate: conversionFormData.productEndDate,
        currentStage: conversionFormData.currentStage || 'initial-enquiry-assessment',
        stageHistory: [
          {
            stage: conversionFormData.currentStage || 'initial-enquiry-assessment',
            notes: `Converted from enquiry ${enquiry.id}: ${enquiry.notes || 'Initial enquiry conversion'}`,
            timestamp: new Date().toISOString(),
            user: currentUser ? currentUser.name : 'System'
          }
        ],
        loanAmount: parseFloat(conversionFormData.loanAmount) || 0,
        propertyValue: parseFloat(conversionFormData.propertyValue) || 0,
        employmentStatus: conversionFormData.employmentStatus,
        annualIncome: parseFloat(conversionFormData.annualIncome) || 0,
        enquiryId: enquiry.id, // Associate the enquiry ID with the customer
        convertedFromEnquiry: true, // Flag to indicate this customer was converted from an enquiry
        documents: {
          payslips: 'received',
          bankStatements: 'received',
          idDocument: 'received',
          proofOfAddress: 'received'
        }
      }

      // Add to customers
      const customerResponse = await fetch('/api/customers', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(customerData)
      })

      if (!customerResponse.ok) {
        throw new Error('Failed to create customer')
      }

      const newCustomer = await customerResponse.json()

      // Create product if product information is provided
      if (conversionFormData.addProduct && conversionFormData.productReferenceNumber) {
        try {
          const productData = {
            customerId: newCustomer.id,
            product: {
              productReferenceNumber: conversionFormData.productReferenceNumber,
              category: conversionFormData.category,
              lender: conversionFormData.lender,
              mortgageType: conversionFormData.mortgageType,
              ltv: conversionFormData.propertyValue > 0 ? parseFloat((conversionFormData.loanAmount / conversionFormData.propertyValue * 100).toFixed(1)) : 0,
              loanAmount: parseFloat(conversionFormData.loanAmount) || 0,
              propertyValue: parseFloat(conversionFormData.propertyValue) || 0,
              submissionDate: new Date().toISOString().split('T')[0],
              productStartDate: conversionFormData.productStartDate,
              productEndDate: conversionFormData.productEndDate,
              propertyAddress: conversionFormData.propertyAddress,
              propertyPostcode: conversionFormData.propertyPostcode
            }
          }

          const productResponse = await fetch('/api/products', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(productData)
          })

          if (!productResponse.ok) {
            console.warn('Failed to create product, but customer was created successfully')
          }
        } catch (productError) {
          console.warn('Product creation failed:', productError)
          // Continue with customer creation even if product fails
        }
      }

      // Update enquiry status to closed (converted)
      const updatedEnquiry = {
        ...enquiry,
        status: 'closed',
        convertedDate: new Date().toISOString().split('T')[0],
        customerId: newCustomer.id,
        closureReason: 'converted-to-customer'
      }

      const updateResponse = await fetch(`/api/enquiries?enquiryId=${enquiry.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updatedEnquiry)
      })

      if (!updateResponse.ok) {
        throw new Error('Failed to update enquiry status')
      }

      const updatedEnquiryResult = await updateResponse.json()
      setEnquiry(updatedEnquiryResult.enquiry)
      setShowConversionForm(false)
      
      const successMsg = conversionFormData.addProduct && conversionFormData.productReferenceNumber 
        ? `Enquiry successfully converted to customer with product! Customer ID: ${newCustomer.id}`
        : `Enquiry successfully converted to customer! Customer ID: ${newCustomer.id}`
      
      setSuccessMessage(successMsg)
      
      // Clear success message after 5 seconds and redirect
      setTimeout(() => {
        setSuccessMessage('')
        router.push(`/customers/${newCustomer.id}`)
      }, 5000)
    } catch (error) {
      console.error('Error converting enquiry:', error)
      setErrorMessage('Failed to convert enquiry to customer: ' + error.message)
      
      // Clear error message after 5 seconds
      setTimeout(() => {
        setErrorMessage('')
      }, 5000)
    } finally {
      setConverting(false)
    }
  }

  const handleFormChange = (field, value) => {
    setConversionFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleStartConversion = () => {
    setShowConversionForm(true)
  }

  const handleStartEdit = () => {
    setEditFormData({
      firstName: enquiry.firstName || '',
      lastName: enquiry.lastName || '',
      email: enquiry.email || '',
      phone: enquiry.phone || '',
      postcode: enquiry.postcode || '',
      address: enquiry.address || '',
      enquiryType: enquiry.enquiryType || 'Mortgage',
      loanAmount: enquiry.loanAmount || '',
      propertyValue: enquiry.propertyValue || '',
      employmentStatus: enquiry.employmentStatus || 'employed',
      annualIncome: enquiry.annualIncome || '',
      preferredLender: enquiry.preferredLender || '',
      mortgageType: enquiry.mortgageType || 'Repayment',
      notes: enquiry.notes || '',
      status: enquiry.status || 'new',
      assignedTo: enquiry.assignedTo || '',
      followUpDate: enquiry.followUpDate || ''
    })
    setIsEditing(true)
  }

  const handleCancelEdit = () => {
    setIsEditing(false)
    setEditFormData({})
  }

  const handleEditFormChange = (field, value) => {
    setEditFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleSaveEdit = async () => {
    setSaving(true)
    try {
      const updatedData = {
        ...editFormData,
        loanAmount: editFormData.enquiryType === 'Mortgage' ? parseInt(editFormData.loanAmount) || 0 : 0,
        propertyValue: editFormData.enquiryType === 'Mortgage' ? parseInt(editFormData.propertyValue) || 0 : 0,
        annualIncome: parseInt(editFormData.annualIncome) || 0,
        assignedTo: editFormData.assignedTo || null,
        followUpDate: editFormData.followUpDate || null
      }

      // Clean up mortgage-specific fields for Protection enquiries
      if (editFormData.enquiryType === 'Protection') {
        updatedData.mortgageType = 'NA'
        updatedData.preferredLender = editFormData.preferredLender || 'Legal & General'
      }

      const response = await fetch(`/api/enquiries?enquiryId=${enquiry.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updatedData)
      })

      if (!response.ok) {
        throw new Error('Failed to update enquiry')
      }

      const result = await response.json()
      setEnquiry(result.enquiry)
      setIsEditing(false)
      setEditFormData({})
      setSuccessMessage('Enquiry updated successfully!')
      
      // Clear success message after 3 seconds
      setTimeout(() => {
        setSuccessMessage('')
      }, 3000)
    } catch (error) {
      console.error('Error updating enquiry:', error)
      setErrorMessage('Failed to update enquiry: ' + error.message)
      
      // Clear error message after 5 seconds
      setTimeout(() => {
        setErrorMessage('')
      }, 5000)
    } finally {
      setSaving(false)
    }
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'new': return 'primary'
      case 'contacted': return 'info'
      case 'in-progress': return 'warning'
      case 'qualified': return 'success'
      case 'follow-up': return 'secondary'
      case 'converted': return 'success'
      case 'closed': return 'success'
      case 'lost': return 'danger'
      default: return 'secondary'
    }
  }

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: 'GBP'
    }).format(amount)
  }

  const loadCustomers = async () => {
    try {
      const response = await fetch('/api/customers')
      if (!response.ok) {
        throw new Error('Failed to fetch customers')
      }
      const data = await response.json()
      setAllCustomers(data.customers || [])
    } catch (error) {
      console.error('Error loading customers:', error)
      setAllCustomers([])
    }
  }

  const handleCustomerSearch = (query) => {
    setCustomerSearchQuery(query)
    if (!query.trim()) {
      setCustomerSearchResults([])
      return
    }

    // Load customers if not already loaded
    if (allCustomers.length === 0) {
      loadCustomers()
    }

    // Filter customers that match the search and don't already have this enquiry associated
    const filteredCustomers = allCustomers.filter(customer => {
      // Search in various fields
      const searchTerm = query.toLowerCase()
      return (
        customer.id.toLowerCase().includes(searchTerm) ||
        customer.firstName.toLowerCase().includes(searchTerm) ||
        customer.lastName.toLowerCase().includes(searchTerm) ||
        customer.email.toLowerCase().includes(searchTerm) ||
        customer.phone.includes(searchTerm) ||
        customer.postcode.toLowerCase().includes(searchTerm)
      )
    })
    
    setCustomerSearchResults(filteredCustomers)
  }

  const handleAssociateCustomer = async (customer) => {
    setAssociatingCustomer(true)
    try {
      // Update the enquiry to associate it with this customer
      const updatedEnquiry = {
        ...enquiry,
        customerId: customer.id,
        status: enquiry.status === 'new' ? 'contacted' : enquiry.status // Update status if it was new
      }

      const response = await fetch(`/api/enquiries?enquiryId=${enquiry.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updatedEnquiry)
      })

      if (!response.ok) {
        throw new Error('Failed to associate customer')
      }

      const result = await response.json()
      setEnquiry(result.enquiry)
      
      // Clear search
      setCustomerSearchQuery('')
      setCustomerSearchResults([])
      setShowCustomerSearch(false)
      
      // Show success message
      setSuccessMessage(`Enquiry successfully associated with customer ${customer.id} (${customer.firstName} ${customer.lastName})`)
      setTimeout(() => {
        setSuccessMessage('')
      }, 5000)

    } catch (error) {
      console.error('Error associating customer:', error)
      setErrorMessage('Failed to associate customer: ' + error.message)
      setTimeout(() => {
        setErrorMessage('')
      }, 5000)
    } finally {
      setAssociatingCustomer(false)
    }
  }

  // Meeting Functions
  const openMeetingModal = (type) => {
    setMeetingType(type)
    setMeetingData(prev => ({
      ...prev,
      clientName: `${enquiry.firstName} ${enquiry.lastName}`,
      clientEmail: enquiry.email,
      clientPhone: enquiry.phone
    }))
    setShowMeetingModal(true)
  }

  const closeMeetingModal = () => {
    setShowMeetingModal(false)
    setMeetingType('')
    setMeetingData({
      date: '',
      time: '',
      duration: '30',
      notes: '',
      clientName: '',
      clientEmail: '',
      clientPhone: ''
    })
  }

  const handleMeetingSubmit = () => {
    // Here you would integrate with your calendar/meeting system
    const meetingDetails = {
      type: meetingType,
      enquiryId: enquiry.id,
      ...meetingData
    }
    
    console.log('Meeting scheduled:', meetingDetails)
    
    // Show success message
    alert(`${getMeetingTypeDisplay(meetingType)} scheduled successfully for ${meetingData.date} at ${meetingData.time}`)
    
    closeMeetingModal()
  }

  const getMeetingTypeDisplay = (type) => {
    const types = {
      'phone': 'Phone Call',
      'online': 'Online Meeting',
      'face-to-face': 'Face-to-Face Meeting'
    }
    return types[type] || type
  }

  // Load customers when component mounts
  useEffect(() => {
    loadCustomers()
  }, [])

  if (loading) {
    return (
      <div className="container mt-4">
        <div className="text-center">
          <div className="spinner-border" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="mt-2">Loading enquiry details...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="container mt-4">
        <div className="alert alert-danger" role="alert">
          <h4 className="alert-heading">Error</h4>
          <p>{error}</p>
          <hr />
          <Link href="/enquiries" className="btn btn-primary">
            Back to Enquiry Management
          </Link>
        </div>
      </div>
    )
  }

  if (!enquiry) {
    return (
      <div className="container mt-4">
        <div className="alert alert-warning" role="alert">
          <h4 className="alert-heading">Enquiry Not Found</h4>
          <p>The enquiry you are looking for doesnt exist.</p>
          <hr />
          <Link href="/enquiries" className="btn btn-primary">
            Back to Enquiry Management
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="container mt-4">
      {/* Header */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h1 className="mb-1">Enquiry Details</h1>
        </div>
        <div>
          <Link href="/enquiries" className="btn btn-outline-secondary me-2">
            Back to Enquiry Management
          </Link>
          {!isEditing && enquiry.status !== 'closed' && (
            <>
              <button
                className="btn btn-outline-primary me-2"
                onClick={handleStartEdit}
              >
                Edit Enquiry
              </button>
              {!enquiry.customerId && (
                <button
                  className="btn btn-outline-info me-2"
                  onClick={() => setShowCustomerSearch(true)}
                  disabled={associatingCustomer}
                >
                  <i className="bi bi-person-plus me-1"></i>
                  Associate Customer
                </button>
              )}
              <button
                className={`btn ${enquiry.customerId ? 'btn-outline-success' : 'btn-success'}`}
                onClick={handleStartConversion}
                disabled={converting || enquiry.customerId}
                title={enquiry.customerId ? "Enquiry is already associated with a customer" : "Convert this enquiry to a new customer"}
              >
                {enquiry.customerId ? (
                  <>
                    <i className="bi bi-check-circle me-1"></i>
                    Already Associated
                  </>
                ) : (
                  'Convert to Customer'
                )}
              </button>
            </>
          )}
          {isEditing && (
            <>
              <button
                className="btn btn-success me-2"
                onClick={handleSaveEdit}
                disabled={saving}
              >
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
              <button
                className="btn btn-outline-secondary"
                onClick={handleCancelEdit}
              >
                Cancel
              </button>
            </>
          )}
        </div>
      </div>

      {/* Success Message */}
      {successMessage && (
        <div className="alert alert-success alert-dismissible fade show" role="alert">
          <i className="bi bi-check-circle me-2"></i>
          {successMessage}
          <button 
            type="button" 
            className="btn-close" 
            onClick={() => setSuccessMessage('')}
          ></button>
        </div>
      )}

      {/* Error Message */}
      {errorMessage && (
        <div className="alert alert-danger alert-dismissible fade show" role="alert">
          <i className="bi bi-exclamation-triangle me-2"></i>
          {errorMessage}
          <button 
            type="button" 
            className="btn-close" 
            onClick={() => setErrorMessage('')}
          ></button>
        </div>
      )}

      <div className="row">
        {/* Main Details */}
        <div className="col-lg-8">
          <div className="card mb-2">
            <div className="card-header d-flex justify-content-between align-items-center py-1">
              <h6 className="mb-0" style={{fontSize: '0.85rem'}}>Enquiry Information</h6>
              <span className={`badge bg-${getStatusColor(enquiry.status)}`} style={{fontSize: '0.7rem'}}>
                {enquiry.status.charAt(0).toUpperCase() + enquiry.status.slice(1)}
              </span>
            </div>
            <div className="card-body py-2 px-3">
              {!isEditing ? (
                // View Mode
                <div className="row">
                  <div className="col-md-6">
                    <h6 className="text-muted mb-2 section-title" style={{fontSize: '0.8rem'}}>Personal Details</h6>
                    <div className="mb-2 detail-item">
                      <span className="detail-label">Name:</span> 
                      <span className="detail-value fw-semibold">{enquiry.firstName} {enquiry.lastName}</span>
                    </div>
                    <div className="mb-2 detail-item">
                      <span className="detail-label">Email:</span> 
                      <a href={`mailto:${enquiry.email}`} className="detail-value detail-link">{enquiry.email}</a>
                    </div>
                    <div className="mb-2 detail-item">
                      <span className="detail-label">Phone:</span> 
                      <a href={`tel:${enquiry.phone}`} className="detail-value detail-link">{enquiry.phone}</a>
                    </div>
                    {enquiry.dateOfBirth && (
                      <div className="mb-2 detail-item">
                        <span className="detail-label">Date of Birth:</span> 
                        <span className="detail-value">{new Date(enquiry.dateOfBirth).toLocaleDateString()}</span>
                      </div>
                    )}
                    <div className="mb-2 detail-item">
                      <span className="detail-label">Account Type:</span> 
                      <span className="detail-value">
                        <span className={`badge ${enquiry.customerAccountType === 'Joint' ? 'bg-primary' : 'bg-secondary'}`}>
                          {enquiry.customerAccountType || 'Sole'}
                        </span>
                      </span>
                    </div>
                    <div className="mb-2 detail-item">
                      <span className="detail-label">Address:</span> 
                      <span className="detail-value">{enquiry.address}</span>
                    </div>
                    <div className="mb-0 detail-item">
                      <span className="detail-label">Postcode:</span> 
                      <span className="detail-value fw-semibold text-primary">{enquiry.postcode}</span>
                    </div>
                  </div>
                  <div className="col-md-6">
                    <h6 className="text-muted mb-2 section-title" style={{fontSize: '0.8rem'}}>Enquiry Details</h6>
                    <div className="mb-2 detail-item">
                      <span className="detail-label">Enquiry ID:</span> 
                      <span className="detail-value fw-bold text-info">{enquiry.id}</span>
                    </div>
                    <div className="mb-2 detail-item">
                      <span className="detail-label">Type:</span> 
                      <span className="detail-value">
                        <span className={`badge ${enquiry.enquiryType === 'Mortgage' ? 'bg-success' : 'bg-warning'}`}>
                          {enquiry.enquiryType}
                        </span>
                      </span>
                    </div>
                    <div className="mb-2 detail-item">
                      <span className="detail-label">Date:</span> 
                      <span className="detail-value">{new Date(enquiry.enquiryDate).toLocaleDateString()}</span>
                    </div>
                    <div className="mb-2 detail-item">
                      <span className="detail-label">Assigned To:</span> 
                      <span className="detail-value">
                        {enquiry.assignedTo ? (
                          <span className="badge bg-info">{enquiry.assignedTo}</span>
                        ) : (
                          <span className="text-muted">Unassigned</span>
                        )}
                      </span>
                    </div>
                    {enquiry.followUpDate && (
                      <div className="mb-2 detail-item">
                        <span className="detail-label">Follow-up Date:</span> 
                        <span className="detail-value text-warning fw-semibold">{new Date(enquiry.followUpDate).toLocaleDateString()}</span>
                      </div>
                    )}
                    {enquiry.customerId && (
                      <div className="mb-2 detail-item">
                        <span className="detail-label">Associated Customer:</span> 
                        <Link href={`/customers/${enquiry.customerId}`} className="detail-value detail-link">
                          {enquiry.customerId}
                        </Link>
                      </div>
                    )}
                    {enquiry.convertedDate && (
                      <div className="mb-0 detail-item">
                        <span className="detail-label">Converted Date:</span> 
                        <span className="detail-value text-success fw-semibold">{new Date(enquiry.convertedDate).toLocaleDateString()}</span>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                // Edit Mode
                <form>
                  <h6 className="text-muted mb-2" style={{fontSize: '0.75rem'}}>Personal Details</h6>
                  <div className="row mb-2">
                    <div className="col-md-6">
                      <label className="form-label small">First Name</label>
                      <input
                        type="text"
                        className="form-control form-control-sm"
                        value={editFormData.firstName}
                        onChange={(e) => handleEditFormChange('firstName', e.target.value)}
                      />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label small">Last Name</label>
                      <input
                        type="text"
                        className="form-control form-control-sm"
                        value={editFormData.lastName}
                        onChange={(e) => handleEditFormChange('lastName', e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="row mb-2">
                    <div className="col-md-6">
                      <label className="form-label small">Email</label>
                      <input
                        type="email"
                        className="form-control form-control-sm"
                        value={editFormData.email}
                        onChange={(e) => handleEditFormChange('email', e.target.value)}
                      />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label small">Phone</label>
                      <input
                        type="tel"
                        className="form-control form-control-sm"
                        value={editFormData.phone}
                        onChange={(e) => handleEditFormChange('phone', e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="row mb-2">
                    <div className="col-md-6">
                      <label className="form-label small">Postcode</label>
                      <input
                        type="text"
                        className="form-control form-control-sm"
                        value={editFormData.postcode}
                        onChange={(e) => handleEditFormChange('postcode', e.target.value)}
                      />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label small">Employment Status</label>
                      <select
                        className="form-select form-select-sm"
                        value={editFormData.employmentStatus}
                        onChange={(e) => handleEditFormChange('employmentStatus', e.target.value)}
                      >
                        <option value="employed">Employed</option>
                        <option value="self-employed">Self Employed</option>
                        <option value="retired">Retired</option>
                        <option value="unemployed">Unemployed</option>
                      </select>
                    </div>
                  </div>
                  <div className="row mb-2">
                    <div className="col-md-6">
                      <label className="form-label small">Date of Birth</label>
                      <input
                        type="date"
                        className="form-control form-control-sm"
                        value={editFormData.dateOfBirth || ''}
                        onChange={(e) => handleEditFormChange('dateOfBirth', e.target.value)}
                      />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label small">Account Type</label>
                      <select
                        className="form-select form-select-sm"
                        value={editFormData.customerAccountType || 'Sole'}
                        onChange={(e) => handleEditFormChange('customerAccountType', e.target.value)}
                      >
                        <option value="Sole">Sole</option>
                        <option value="Joint">Joint</option>
                      </select>
                    </div>
                  </div>
                  <div className="mb-2">
                    <label className="form-label small">Address</label>
                    <textarea
                      className="form-control form-control-sm"
                      value={editFormData.address}
                      onChange={(e) => handleEditFormChange('address', e.target.value)}
                      rows="2"
                    />
                  </div>
                  <div className="mb-2">
                    <label className="form-label small">Annual Income</label>
                    <input
                      type="number"
                      className="form-control form-control-sm"
                      value={editFormData.annualIncome}
                      onChange={(e) => handleEditFormChange('annualIncome', e.target.value)}
                    />
                  </div>

                  <h6 className="text-muted mb-2 mt-3" style={{fontSize: '0.75rem'}}>Enquiry Details</h6>
                  <div className="row mb-2">
                    <div className="col-md-6">
                      <label className="form-label small">Enquiry Type</label>
                      <select
                        className="form-select form-select-sm"
                        value={editFormData.enquiryType}
                        onChange={(e) => handleEditFormChange('enquiryType', e.target.value)}
                      >
                        <option value="Mortgage">Mortgage</option>
                        <option value="Protection">Protection</option>
                      </select>
                    </div>
                    <div className="col-md-6">
                      <label className="form-label small">Preferred Lender</label>
                      <select
                        className="form-select form-select-sm"
                        value={editFormData.preferredLender}
                        onChange={(e) => handleEditFormChange('preferredLender', e.target.value)}
                      >
                        <option value="">Select Lender</option>
                        <option value="Halifax">Halifax</option>
                        <option value="Nationwide">Nationwide</option>
                        <option value="Barclays">Barclays</option>
                        <option value="HSBC">HSBC</option>
                        <option value="Santander">Santander</option>
                        <option value="Legal & General">Legal & General</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>
                  </div>

                  {editFormData.enquiryType === 'Mortgage' && (
                    <>
                      <div className="row mb-2">
                        <div className="col-md-6">
                          <label className="form-label small">Loan Amount</label>
                          <input
                            type="number"
                            className="form-control form-control-sm"
                            value={editFormData.loanAmount}
                            onChange={(e) => handleEditFormChange('loanAmount', e.target.value)}
                          />
                        </div>
                        <div className="col-md-6">
                          <label className="form-label small">Property Value</label>
                          <input
                            type="number"
                            className="form-control form-control-sm"
                            value={editFormData.propertyValue}
                            onChange={(e) => handleEditFormChange('propertyValue', e.target.value)}
                          />
                        </div>
                      </div>
                      <div className="mb-2">
                        <label className="form-label small">Mortgage Type</label>
                        <select
                          className="form-select form-select-sm"
                          value={editFormData.mortgageType}
                          onChange={(e) => handleEditFormChange('mortgageType', e.target.value)}
                        >
                          <option value="LTD Company BTL">LTD Company BTL</option>
                          <option value="BTL">BTL</option>
                          <option value="First Time Buyer">First Time Buyer</option>
                          <option value="Home Mover">Home Mover</option>
                          <option value="Remortgage">Remortgage</option>
                          <option value="Product Transfer">Product Transfer</option>
                          <option value="Further Advance">Further Advance</option>
                        </select>
                      </div>
                    </>
                  )}

                  <div className="mb-2">
                    <label className="form-label small">Notes</label>
                    <textarea
                      className="form-control form-control-sm"
                      value={editFormData.notes}
                      onChange={(e) => handleEditFormChange('notes', e.target.value)}
                      rows="2"
                    />
                  </div>

                  <h6 className="text-muted mb-2 mt-3" style={{fontSize: '0.75rem'}}>Management Details</h6>
                  <div className="row mb-2">
                    <div className="col-md-6">
                      <label className="form-label small">Status</label>
                      <select
                        className="form-select form-select-sm"
                        value={editFormData.status}
                        onChange={(e) => handleEditFormChange('status', e.target.value)}
                      >
                        <option value="new">New</option>
                        <option value="contacted">Contacted</option>
                        <option value="in-progress">In Progress</option>
                        <option value="qualified">Qualified</option>
                        <option value="follow-up">Follow Up</option>
                      </select>
                    </div>
                    <div className="col-md-6">
                      <label className="form-label small">Assign To</label>
                      <select
                        className="form-select form-select-sm"
                        value={editFormData.assignedTo}
                        onChange={(e) => handleEditFormChange('assignedTo', e.target.value)}
                      >
                        <option value="">Unassigned</option>
                        <option value="advisor1">advisor1</option>
                        <option value="advisor2">advisor2</option>
                        <option value="advisor3">advisor3</option>
                      </select>
                    </div>
                  </div>
                  <div className="mb-2">
                    <label className="form-label small">Follow Up Date</label>
                    <input
                      type="date"
                      className="form-control form-control-sm"
                      value={editFormData.followUpDate}
                      onChange={(e) => handleEditFormChange('followUpDate', e.target.value)}
                    />
                  </div>
                </form>
              )}
            </div>
          </div>

          {/* Financial Details */}
          {(enquiry.loanAmount || enquiry.propertyValue || enquiry.annualIncome) && (
            <div className="card mb-2">
              <div className="card-header py-1">
                <h6 className="mb-0" style={{fontSize: '0.85rem'}}>Financial Information</h6>
              </div>
              <div className="card-body py-2 px-3">
                <div className="row">
                  <div className="col-md-4">
                    {enquiry.loanAmount && (
                      <div className="mb-2 detail-item">
                        <span className="detail-label">Loan Amount:</span> 
                        <span className="detail-value fw-bold text-success">{formatCurrency(enquiry.loanAmount)}</span>
                      </div>
                    )}
                  </div>
                  <div className="col-md-4">
                    {enquiry.propertyValue && (
                      <div className="mb-2 detail-item">
                        <span className="detail-label">Property Value:</span> 
                        <span className="detail-value fw-bold text-info">{formatCurrency(enquiry.propertyValue)}</span>
                      </div>
                    )}
                  </div>
                  <div className="col-md-4">
                    {enquiry.annualIncome && (
                      <div className="mb-2 detail-item">
                        <span className="detail-label">Annual Income:</span> 
                        <span className="detail-value fw-bold text-primary">{formatCurrency(enquiry.annualIncome)}</span>
                      </div>
                    )}
                  </div>
                </div>
                {enquiry.loanAmount && enquiry.propertyValue && (
                  <div className="row">
                    <div className="col-md-4">
                      <div className="mb-2 detail-item">
                        <span className="detail-label">LTV:</span> 
                        <span className="detail-value">
                          <span className={`badge ${((enquiry.loanAmount / enquiry.propertyValue) * 100) > 80 ? 'bg-warning' : 'bg-success'}`}>
                            {((enquiry.loanAmount / enquiry.propertyValue) * 100).toFixed(1)}%
                          </span>
                        </span>
                      </div>
                    </div>
                  </div>
                )}
                {enquiry.employmentStatus && (
                  <div className="row">
                    <div className="col-md-6">
                      <div className="mb-2 detail-item">
                        <span className="detail-label">Employment Status:</span> 
                        <span className="detail-value">{enquiry.employmentStatus}</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Mortgage Details */}
          {(enquiry.mortgageType || enquiry.preferredLender) && (
            <div className="card mb-2">
              <div className="card-header py-1">
                <h6 className="mb-0" style={{fontSize: '0.85rem'}}>Mortgage Preferences</h6>
              </div>
              <div className="card-body py-2 px-3">
                <div className="row">
                  {enquiry.mortgageType && (
                    <div className="col-md-6">
                      <div className="mb-2 detail-item">
                        <span className="detail-label">Mortgage Type:</span> 
                        <span className="detail-value">{enquiry.mortgageType}</span>
                      </div>
                    </div>
                  )}
                  {enquiry.preferredLender && (
                    <div className="col-md-6">
                      <div className="mb-2 detail-item">
                        <span className="detail-label">Preferred Lender:</span> 
                        <span className="detail-value">{enquiry.preferredLender}</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Add Note */}
          <div className="card mb-2">
            <div className="card-header py-1">
              <h6 className="mb-0" style={{fontSize: '0.85rem'}}>Add Note</h6>
            </div>
            <div className="card-body py-2 px-3">
              <div className="row mb-2">
                <div className="col-md-6">
                  <label className="form-label small">Author</label>
                  <div className="form-control-plaintext bg-light p-2 rounded small" style={{fontSize: '0.75rem'}}>
                    <i className="bi bi-person-circle me-2"></i>
                    <strong>{currentUser ? currentUser.name : 'Loading...'}</strong>
                    {currentUser && (
                      <div className="text-muted small">
                        {currentUser.role} - {currentUser.department}
                      </div>
                    )}
                  </div>
                </div>
                <div className="col-md-6">
                  <label className="form-label small">Current Status</label>
                  <input
                    type="text"
                    className="form-control form-control-sm"
                    value={enquiry?.status?.charAt(0).toUpperCase() + enquiry?.status?.slice(1) || 'Unknown'}
                    disabled
                  />
                </div>
              </div>
              <div className="mb-2">
                <label className="form-label small">Note</label>
                <textarea
                  className="form-control form-control-sm"
                  rows="2"
                  placeholder="Add a note to the enquiry timeline..."
                  value={newNote}
                  onChange={(e) => setNewNote(e.target.value)}
                />
              </div>
              <button
                className="btn btn-primary btn-sm"
                onClick={addNote}
                disabled={!newNote.trim() || addingNote}
              >
                {addingNote ? 'Adding Note...' : 'Add Note'}
              </button>
            </div>
          </div>

          {/* Notes Timeline */}
          <div className="card mb-2">
            <div className="card-header py-1">
              <h6 className="mb-0" style={{fontSize: '0.85rem'}}>Notes Timeline</h6>
            </div>
            <div className="card-body py-2 px-3">
              <div className="timeline">
                {enquiryNotes && enquiryNotes.length > 0 ? (
                  enquiryNotes.map((note, index) => (
                    <div key={note.id || index} className="timeline-item mb-2" style={{fontSize: '0.75rem', lineHeight: '1.2'}}>
                      <div className="d-flex mb-1">
                        <div className="timeline-marker me-2">
                          <span className="badge bg-primary" style={{fontSize: '0.65rem'}}>
                            {note.stage?.charAt(0).toUpperCase() + note.stage?.slice(1) || 'Note'}
                          </span>
                        </div>
                        <div className="flex-grow-1">
                          <div className="d-flex justify-content-between align-items-start">
                            <div className="fw-medium" style={{fontSize: '0.7rem'}}>
                              {new Date(note.timestamp).toLocaleString('en-GB')}
                            </div>
                            <small className="text-muted" style={{fontSize: '0.65rem'}}>{note.author}</small>
                          </div>
                        </div>
                      </div>
                      <div className="w-100 ps-0">
                        <div className="text-muted" style={{whiteSpace: 'pre-wrap', wordWrap: 'break-word', fontSize: '0.7rem'}}>{note.note}</div>
                      </div>
                    </div>
                  ))
                ) : enquiry?.notes ? (
                  <div className="timeline-item mb-2" style={{fontSize: '0.75rem', lineHeight: '1.2'}}>
                    <div className="d-flex mb-1">
                      <div className="timeline-marker me-2">
                        <span className="badge bg-secondary" style={{fontSize: '0.65rem'}}>Initial</span>
                      </div>
                      <div className="flex-grow-1">
                        <div className="fw-medium" style={{fontSize: '0.7rem'}}>Initial enquiry notes</div>
                      </div>
                    </div>
                    <div className="w-100 ps-0">
                      <div className="text-muted" style={{fontSize: '0.7rem'}}>{enquiry.notes}</div>
                    </div>
                  </div>
                ) : (
                  <p className="text-muted text-center py-2 mb-0 small">No notes available for this enquiry.</p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="col-lg-4">
          {/* Quick Actions */}
          <div className="card">
            <div className="card-header py-1">
              <h6 className="mb-0" style={{fontSize: '0.85rem'}}>Quick Actions</h6>
            </div>
            <div className="card-body py-2 px-3">
              <div className="d-grid gap-1">
                <a href={`mailto:${enquiry.email}`} className="btn btn-outline-primary btn-sm">
                  Send Email
                </a>
                <a href={`tel:${enquiry.phone}`} className="btn btn-outline-primary btn-sm">
                  Call Customer
                </a>
                
                {/* Meeting Scheduling Buttons */}
                <div className="d-grid gap-1 mt-2">
                  <div className="small text-muted text-center fw-bold" style={{fontSize: '0.75rem'}}>Schedule Meetings</div>
                  <button 
                    className="btn btn-primary btn-sm"
                    onClick={() => openMeetingModal('phone')}
                  >
                    <i className="bi bi-telephone-fill me-1"></i>
                    <span style={{fontSize: '0.75rem'}}>Schedule Phone Call</span>
                  </button>
                  <button 
                    className="btn btn-success btn-sm"
                    onClick={() => openMeetingModal('online')}
                  >
                    <i className="bi bi-camera-video-fill me-1"></i>
                    <span style={{fontSize: '0.75rem'}}>Schedule Online Meeting</span>
                  </button>
                  <button 
                    className="btn btn-info btn-sm"
                    onClick={() => openMeetingModal('face-to-face')}
                  >
                    <i className="bi bi-calendar-plus-fill me-1"></i>
                    <span style={{fontSize: '0.75rem'}}>Schedule Face-to-Face</span>
                  </button>
                </div>

                {enquiry.status !== 'closed' && !enquiry.customerId && (
                  <button
                    className="btn btn-outline-info btn-sm mt-2"
                    onClick={() => setShowCustomerSearch(true)}
                    disabled={associatingCustomer}
                  >
                    <i className="bi bi-person-plus me-1"></i>
                    <span style={{fontSize: '0.75rem'}}>Associate Customer</span>
                  </button>
                )}
                {enquiry.status !== 'closed' && (
                  <button
                    className={`btn btn-sm ${enquiry.customerId ? 'btn-outline-success' : 'btn-success'}`}
                    onClick={handleStartConversion}
                    disabled={converting || enquiry.customerId}
                    title={enquiry.customerId ? "Enquiry is already associated with a customer" : "Convert this enquiry to a new customer"}
                  >
                    {enquiry.customerId ? (
                      <>
                        <i className="bi bi-check-circle me-1"></i>
                        <span style={{fontSize: '0.75rem'}}>Already Associated</span>
                      </>
                    ) : (
                      <span style={{fontSize: '0.75rem'}}>Convert to Customer</span>
                    )}
                  </button>
                )}
                {enquiry.customerId && (
                  <Link href={`/customers/${enquiry.customerId}`} className="btn btn-primary btn-sm">
                    <span style={{fontSize: '0.75rem'}}>View Customer Record</span>
                  </Link>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Conversion Form Modal */}
      {showConversionForm && (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-lg modal-dialog-scrollable">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Convert Enquiry to Customer</h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setShowConversionForm(false)}
                  disabled={converting}
                ></button>
              </div>
              <div className="modal-body">
                <form>
                  {/* Personal Information */}
                  <div className="mb-4">
                    <h6 className="text-primary mb-3">Personal Information</h6>
                    <div className="row">
                      <div className="col-md-6 mb-3">
                        <label className="form-label">First Name *</label>
                        <input
                          type="text"
                          className="form-control"
                          value={conversionFormData.firstName || ''}
                          onChange={(e) => handleFormChange('firstName', e.target.value)}
                          required
                        />
                      </div>
                      <div className="col-md-6 mb-3">
                        <label className="form-label">Last Name *</label>
                        <input
                          type="text"
                          className="form-control"
                          value={conversionFormData.lastName || ''}
                          onChange={(e) => handleFormChange('lastName', e.target.value)}
                          required
                        />
                      </div>
                    </div>
                    <div className="row">
                      <div className="col-md-6 mb-3">
                        <label className="form-label">Email *</label>
                        <input
                          type="email"
                          className="form-control"
                          value={conversionFormData.email || ''}
                          onChange={(e) => handleFormChange('email', e.target.value)}
                          required
                        />
                      </div>
                      <div className="col-md-6 mb-3">
                        <label className="form-label">Phone *</label>
                        <input
                          type="tel"
                          className="form-control"
                          value={conversionFormData.phone || ''}
                          onChange={(e) => handleFormChange('phone', e.target.value)}
                          required
                        />
                      </div>
                    </div>
                    <div className="row">
                      <div className="col-md-6 mb-3">
                        <label className="form-label">Date of Birth</label>
                        <input
                          type="date"
                          className="form-control"
                          value={conversionFormData.dateOfBirth || ''}
                          onChange={(e) => handleFormChange('dateOfBirth', e.target.value)}
                        />
                      </div>
                      <div className="col-md-6 mb-3">
                        <label className="form-label">Account Type</label>
                        <select
                          className="form-select"
                          value={conversionFormData.customerAccountType || 'Sole'}
                          onChange={(e) => handleFormChange('customerAccountType', e.target.value)}
                        >
                          <option value="Sole">Sole</option>
                          <option value="Joint">Joint</option>
                        </select>
                      </div>
                    </div>
                    <div className="row">
                      <div className="col-md-8 mb-3">
                        <label className="form-label">Address *</label>
                        <input
                          type="text"
                          className="form-control"
                          value={conversionFormData.address || ''}
                          onChange={(e) => handleFormChange('address', e.target.value)}
                          required
                        />
                      </div>
                      <div className="col-md-4 mb-3">
                        <label className="form-label">Postcode *</label>
                        <input
                          type="text"
                          className="form-control"
                          value={conversionFormData.postcode || ''}
                          onChange={(e) => handleFormChange('postcode', e.target.value)}
                          required
                        />
                      </div>
                    </div>
                  </div>

                  {/* Application Details */}
                  <div className="mb-4">
                    <h6 className="text-primary mb-3">Application Details</h6>
                    <div className="row">
                      <div className="col-md-6 mb-3">
                        <label className="form-label">Category *</label>
                        <select
                          className="form-select"
                          value={conversionFormData.category || ''}
                          onChange={(e) => handleFormChange('category', e.target.value)}
                          required
                        >
                          <option value="">Select category</option>
                          <option value="Mortgages">Mortgages</option>
                          <option value="Protection">Protection</option>
                          <option value="Insurance">Insurance</option>
                        </select>
                      </div>
                      <div className="col-md-6 mb-3">
                        <label className="form-label">Current Stage *</label>
                        <select
                          className="form-select"
                          value={conversionFormData.currentStage || ''}
                          onChange={(e) => handleFormChange('currentStage', e.target.value)}
                          required
                        >
                          <option value="">Select stage</option>
                          <option value="initial-enquiry-assessment">Initial Enquiry Assessment</option>
                          <option value="document-verification">Document Verification</option>
                          <option value="decision-in-principle">Decision In Principle</option>
                          <option value="application-submitted-lender">Application Submitted Lender</option>
                          <option value="case-submitted-network">Case Submitted Network</option>
                          <option value="offer-generated">Offer Generated</option>
                          <option value="solicitor-initial-quote-issued">Solicitor - Initial Quote Issued</option>
                          <option value="solicitor-quote-accepted-fee-paid">Solicitor - Quote Accepted & Fee Paid</option>
                          <option value="solicitor-initial-search-legal-enquiries">Solicitor - Initial Search and Legal Enquiries</option>
                          <option value="solicitor-contracts-prepared">Solicitor - Contracts Prepared</option>
                          <option value="exchange-completion">Exchange & Completion</option>
                        </select>
                      </div>
                    </div>
                    <div className="row">
                      <div className="col-md-6 mb-3">
                        <label className="form-label">Preferred Lender</label>
                        <input
                          type="text"
                          className="form-control"
                          value={conversionFormData.lender || ''}
                          onChange={(e) => handleFormChange('lender', e.target.value)}
                          placeholder="e.g., Halifax, Nationwide"
                        />
                      </div>
                      <div className="col-md-6 mb-3">
                        <label className="form-label">Mortgage Type</label>
                        <select
                          className="form-select"
                          value={conversionFormData.mortgageType || ''}
                          onChange={(e) => handleFormChange('mortgageType', e.target.value)}
                        >
                          <option value="">Select type</option>
                          <option value="First Time Buyer">First Time Buyer</option>
                          <option value="Remortgage">Remortgage</option>
                          <option value="Buy to Let">Buy to Let</option>
                          <option value="Right to Buy">Right to Buy</option>
                          <option value="Help to Buy">Help to Buy</option>
                          <option value="Shared Ownership">Shared Ownership</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Financial Information */}
                  <div className="mb-4">
                    <h6 className="text-primary mb-3">Financial Information</h6>
                    <div className="row">
                      <div className="col-md-6 mb-3">
                        <label className="form-label">Loan Amount (£)</label>
                        <input
                          type="number"
                          className="form-control"
                          value={conversionFormData.loanAmount || ''}
                          onChange={(e) => handleFormChange('loanAmount', e.target.value)}
                          placeholder="0"
                          min="0"
                          step="1000"
                        />
                      </div>
                      <div className="col-md-6 mb-3">
                        <label className="form-label">Property Value (£)</label>
                        <input
                          type="number"
                          className="form-control"
                          value={conversionFormData.propertyValue || ''}
                          onChange={(e) => handleFormChange('propertyValue', e.target.value)}
                          placeholder="0"
                          min="0"
                          step="1000"
                        />
                      </div>
                    </div>
                    <div className="row">
                      <div className="col-md-6 mb-3">
                        <label className="form-label">Annual Income (£)</label>
                        <input
                          type="number"
                          className="form-control"
                          value={conversionFormData.annualIncome || ''}
                          onChange={(e) => handleFormChange('annualIncome', e.target.value)}
                          placeholder="0"
                          min="0"
                          step="1000"
                        />
                      </div>
                      <div className="col-md-6 mb-3">
                        <label className="form-label">Employment Status</label>
                        <select
                          className="form-select"
                          value={conversionFormData.employmentStatus || ''}
                          onChange={(e) => handleFormChange('employmentStatus', e.target.value)}
                        >
                          <option value="">Select status</option>
                          <option value="employed">Employed</option>
                          <option value="self-employed">Self-employed</option>
                          <option value="retired">Retired</option>
                          <option value="student">Student</option>
                          <option value="unemployed">Unemployed</option>
                          <option value="other">Other</option>
                        </select>
                      </div>
                    </div>
                    {conversionFormData.loanAmount && conversionFormData.propertyValue && (
                      <div className="row">
                        <div className="col-12">
                          <div className="alert alert-info">
                            <strong>LTV:</strong> {((conversionFormData.loanAmount / conversionFormData.propertyValue) * 100).toFixed(1)}%
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Product Information (Optional) */}
                  <div className="mb-4">
                    <div className="d-flex justify-content-between align-items-center mb-3">
                      <h6 className="text-primary mb-0">Product Information</h6>
                      <div className="form-check form-switch">
                        <input
                          className="form-check-input"
                          type="checkbox"
                          id="addProductToggle"
                          checked={conversionFormData.addProduct || false}
                          onChange={(e) => handleFormChange('addProduct', e.target.checked)}
                        />
                        <label className="form-check-label" htmlFor="addProductToggle">
                          Add Product
                        </label>
                      </div>
                    </div>
                    
                    {conversionFormData.addProduct && (
                      <>
                        <div className="row">
                          <div className="col-md-6 mb-3">
                            <label className="form-label">Product Reference Number</label>
                            <input
                              type="text"
                              className="form-control"
                              value={conversionFormData.productReferenceNumber || ''}
                              onChange={(e) => handleFormChange('productReferenceNumber', e.target.value)}
                              placeholder="e.g., MTG-2025-001"
                            />
                          </div>
                          <div className="col-md-6 mb-3">
                            <label className="form-label">Rate of Interest (%)</label>
                            <input
                              type="number"
                              className="form-control"
                              value={conversionFormData.rateOfInterest || ''}
                              onChange={(e) => handleFormChange('rateOfInterest', e.target.value)}
                              placeholder="0.00"
                              min="0"
                              step="0.01"
                            />
                          </div>
                        </div>
                        
                        <div className="row">
                          <div className="col-md-6 mb-3">
                            <label className="form-label">Product Start Date</label>
                            <input
                              type="date"
                              className="form-control"
                              value={conversionFormData.productStartDate || ''}
                              onChange={(e) => handleFormChange('productStartDate', e.target.value)}
                            />
                          </div>
                          <div className="col-md-6 mb-3">
                            <label className="form-label">Product End Date</label>
                            <input
                              type="date"
                              className="form-control"
                              value={conversionFormData.productEndDate || ''}
                              onChange={(e) => handleFormChange('productEndDate', e.target.value)}
                            />
                          </div>
                        </div>
                        
                        {conversionFormData.category === 'Mortgages' && (
                          <div className="row">
                            <div className="col-md-6 mb-3">
                              <label className="form-label">Property Address</label>
                              <input
                                type="text"
                                className="form-control"
                                value={conversionFormData.propertyAddress || ''}
                                onChange={(e) => handleFormChange('propertyAddress', e.target.value)}
                                placeholder="Property address for mortgage"
                              />
                            </div>
                            <div className="col-md-6 mb-3">
                              <label className="form-label">Property Postcode</label>
                              <input
                                type="text"
                                className="form-control"
                                value={conversionFormData.propertyPostcode || ''}
                                onChange={(e) => handleFormChange('propertyPostcode', e.target.value)}
                                placeholder="Property postcode"
                              />
                            </div>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </form>
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowConversionForm(false)}
                  disabled={converting}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="btn btn-success"
                  onClick={handleConvertToCustomer}
                  disabled={
                    converting || 
                    !conversionFormData.firstName || 
                    !conversionFormData.lastName || 
                    !conversionFormData.email ||
                    !conversionFormData.phone ||
                    !conversionFormData.address ||
                    !conversionFormData.postcode ||
                    !conversionFormData.category ||
                    !conversionFormData.currentStage ||
                    (conversionFormData.addProduct && !conversionFormData.productReferenceNumber)
                  }
                >
                  {converting ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                      Converting...
                    </>
                  ) : (
                    'Convert to Customer'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Customer Search Modal */}
      {showCustomerSearch && (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-lg modal-dialog-scrollable">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Associate Customer with Enquiry</h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => {
                    setShowCustomerSearch(false)
                    setCustomerSearchQuery('')
                    setCustomerSearchResults([])
                  }}
                  disabled={associatingCustomer}
                ></button>
              </div>
              <div className="modal-body">
                <div className="mb-3">
                  <label className="form-label">Search for Customers</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Search by ID, name, email, phone, or postcode..."
                    value={customerSearchQuery}
                    onChange={(e) => handleCustomerSearch(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        handleCustomerSearch(customerSearchQuery)
                      }
                    }}
                  />
                  <div className="form-text">
                    Search for existing customers to link with this enquiry ({enquiry.firstName} {enquiry.lastName})
                  </div>
                </div>

                {customerSearchResults.length > 0 && (
                  <div>
                    <h6>Search Results ({customerSearchResults.length})</h6>
                    <div className="list-group">
                      {customerSearchResults.map((customer) => (
                        <div key={customer.id} className="list-group-item">
                          <div className="d-flex justify-content-between align-items-start">
                            <div className="flex-grow-1">
                              <div className="d-flex justify-content-between align-items-center mb-2">
                                <h6 className="mb-0">
                                  {customer.id} - {customer.firstName} {customer.lastName}
                                </h6>
                                <span className={`badge ${customer.category === 'Mortgages' ? 'bg-primary' : 'bg-info'}`}>
                                  {customer.category}
                                </span>
                              </div>
                              <div className="row">
                                <div className="col-md-6">
                                  <small className="text-muted">
                                    <strong>Email:</strong> {customer.email}
                                  </small>
                                </div>
                                <div className="col-md-6">
                                  <small className="text-muted">
                                    <strong>Phone:</strong> {customer.phone}
                                  </small>
                                </div>
                                <div className="col-md-6">
                                  <small className="text-muted">
                                    <strong>Postcode:</strong> {customer.postcode}
                                  </small>
                                </div>
                                <div className="col-md-6">
                                  <small className="text-muted">
                                    <strong>Stage:</strong> {customer.currentStage}
                                  </small>
                                </div>
                                <div className="col-md-6">
                                  <small className="text-muted">
                                    <strong>Lender:</strong> {customer.lender}
                                  </small>
                                </div>
                                <div className="col-md-6">
                                  <small className="text-muted">
                                    <strong>Loan Amount:</strong> {formatCurrency(customer.loanAmount)}
                                  </small>
                                </div>
                              </div>
                              <div className="mt-2">
                                <small className="text-muted">
                                  <strong>Address:</strong> {customer.address}
                                </small>
                              </div>
                            </div>
                            <div className="ms-3">
                              <button
                                className="btn btn-sm btn-success"
                                onClick={() => handleAssociateCustomer(customer)}
                                disabled={associatingCustomer}
                              >
                                {associatingCustomer ? (
                                  <>
                                    <span className="spinner-border spinner-border-sm me-1" role="status" aria-hidden="true"></span>
                                    Associating...
                                  </>
                                ) : (
                                  <>
                                    <i className="bi bi-link me-1"></i>
                                    Associate
                                  </>
                                )}
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {customerSearchQuery && customerSearchResults.length === 0 && (
                  <div className="text-center text-muted py-4">
                    <i className="bi bi-search" style={{fontSize: '2rem'}}></i>
                    <p className="mt-2">No customers found matching your search.</p>
                    <p className="small">Try different search terms or check the customer database.</p>
                  </div>
                )}

                {!customerSearchQuery && (
                  <div className="text-center text-muted py-4">
                    <i className="bi bi-search" style={{fontSize: '2rem'}}></i>
                    <p className="mt-2">Start typing to search for customers to associate.</p>
                    <p className="small">You can search by customer ID, name, email, phone, or postcode.</p>
                  </div>
                )}
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => {
                    setShowCustomerSearch(false)
                    setCustomerSearchQuery('')
                    setCustomerSearchResults([])
                  }}
                  disabled={associatingCustomer}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Meeting Setup Modal */}
      {showMeetingModal && (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-lg">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">
                  <i className={`bi bi-${meetingType === 'phone' ? 'telephone' : meetingType === 'online' ? 'camera-video' : 'person-check'} me-2`}></i>
                  Schedule {getMeetingTypeDisplay(meetingType)}
                </h5>
                <button type="button" className="btn-close" onClick={closeMeetingModal}></button>
              </div>
              <div className="modal-body">
                <div className="row">
                  <div className="col-md-6 mb-3">
                    <label className="form-label">Client Name</label>
                    <input
                      type="text"
                      className="form-control"
                      value={meetingData.clientName}
                      onChange={(e) => setMeetingData({...meetingData, clientName: e.target.value})}
                      placeholder="Enter client name"
                    />
                  </div>
                  <div className="col-md-6 mb-3">
                    <label className="form-label">Client Email</label>
                    <input
                      type="email"
                      className="form-control"
                      value={meetingData.clientEmail}
                      onChange={(e) => setMeetingData({...meetingData, clientEmail: e.target.value})}
                      placeholder="Enter client email"
                    />
                  </div>
                </div>
                <div className="row">
                  <div className="col-md-6 mb-3">
                    <label className="form-label">Client Phone</label>
                    <input
                      type="tel"
                      className="form-control"
                      value={meetingData.clientPhone}
                      onChange={(e) => setMeetingData({...meetingData, clientPhone: e.target.value})}
                      placeholder="Enter client phone number"
                    />
                  </div>
                  <div className="col-md-6 mb-3">
                    <label className="form-label">Duration (minutes)</label>
                    <select
                      className="form-select"
                      value={meetingData.duration}
                      onChange={(e) => setMeetingData({...meetingData, duration: e.target.value})}
                    >
                      <option value="15">15 minutes</option>
                      <option value="30">30 minutes</option>
                      <option value="45">45 minutes</option>
                      <option value="60">1 hour</option>
                      <option value="90">1.5 hours</option>
                      <option value="120">2 hours</option>
                    </select>
                  </div>
                </div>
                <div className="row">
                  <div className="col-md-6 mb-3">
                    <label className="form-label">Date</label>
                    <input
                      type="date"
                      className="form-control"
                      value={meetingData.date}
                      onChange={(e) => setMeetingData({...meetingData, date: e.target.value})}
                      min={new Date().toISOString().split('T')[0]}
                    />
                  </div>
                  <div className="col-md-6 mb-3">
                    <label className="form-label">Time</label>
                    <input
                      type="time"
                      className="form-control"
                      value={meetingData.time}
                      onChange={(e) => setMeetingData({...meetingData, time: e.target.value})}
                    />
                  </div>
                </div>
                <div className="mb-3">
                  <label className="form-label">Meeting Notes</label>
                  <textarea
                    className="form-control"
                    rows="3"
                    value={meetingData.notes}
                    onChange={(e) => setMeetingData({...meetingData, notes: e.target.value})}
                    placeholder="Add any specific agenda items or notes for the meeting..."
                  ></textarea>
                </div>
                {meetingType === 'face-to-face' && (
                  <div className="mb-3">
                    <div className="alert alert-info">
                      <i className="bi bi-info-circle me-2"></i>
                      <strong>In-Person Meeting:</strong> Please confirm the meeting location with the client. 
                      Consider office address or clients preferred location.
                    </div>
                  </div>
                )}
                {meetingType === 'online' && (
                  <div className="mb-3">
                    <div className="alert alert-success">
                      <i className="bi bi-camera-video me-2"></i>
                      <strong>Online Meeting:</strong> A video conference link will be automatically generated 
                      and sent to the clients email address.
                    </div>
                  </div>
                )}
                {meetingType === 'phone' && (
                  <div className="mb-3">
                    <div className="alert alert-primary">
                      <i className="bi bi-telephone me-2"></i>
                      <strong>Phone Call:</strong> You will call the client at the scheduled time using 
                      the provided phone number.
                    </div>
                  </div>
                )}
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={closeMeetingModal}>
                  Cancel
                </button>
                <button 
                  type="button" 
                  className={`btn btn-${meetingType === 'phone' ? 'primary' : meetingType === 'online' ? 'success' : 'info'}`}
                  onClick={handleMeetingSubmit}
                  disabled={!meetingData.date || !meetingData.time || !meetingData.clientName}
                >
                  <i className={`bi bi-${meetingType === 'phone' ? 'telephone' : meetingType === 'online' ? 'camera-video' : 'calendar-plus'}-fill me-2`}></i>
                  Schedule {getMeetingTypeDisplay(meetingType)}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
