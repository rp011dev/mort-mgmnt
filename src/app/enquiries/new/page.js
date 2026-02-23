'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useAuth } from '../../../hooks/useAuth'

export default function NewEnquiry() {
  const { user, loading: authLoading, logout, authenticatedFetch } = useAuth()
  const router = useRouter()
  const [users, setUsers] = useState([])
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    postcode: '',
    address: '',
    dateOfBirth: '',
    customerAccountType: 'Sole',
    enquiryType: 'Mortgage',
    loanAmount: '0',
    propertyValue: '0',
    employmentStatus: 'employed',
    annualIncome: '0',
    preferredLender: '',
    mortgageType: 'Repayment',
    notes: '',
    status: 'new',
    assignedTo: '',
    followUpDate: '',
    // Joint account holder fields
    jointFirstName: '',
    jointLastName: '',
    jointEmail: '',
    jointPhone: '',
    jointDateOfBirth: '',
    jointPostcode: '',
    jointEmploymentStatus: 'employed',
    jointAddress: '',
    jointAnnualIncome: '0'
  })
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState({})
  const [successMessage, setSuccessMessage] = useState('')

  useEffect(() => {
    if (!authLoading && authenticatedFetch) {
      loadUsers()
    }
  }, [authLoading, authenticatedFetch])

  const loadUsers = async () => {
    if (!authenticatedFetch) {
      console.warn('authenticatedFetch not available yet')
      return
    }
    
    try {
      const response = await authenticatedFetch('/api/users')
      if (response.ok) {
        const data = await response.json()
        setUsers(data.users || [])
      }
    } catch (error) {
      console.error('Error loading users:', error)
    }
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }))
    }
  }

  const validateForm = () => {
    const newErrors = {}
    
    if (!formData.firstName.trim()) newErrors.firstName = 'First name is required'
    if (!formData.lastName.trim()) newErrors.lastName = 'Last name is required'
    if (!formData.phone.trim()) newErrors.phone = 'Phone is required'
    
    // Email validation (only if provided)
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address'
    }
    
    // Phone validation (UK format)
    if (formData.phone && !/^(\+44|0)[0-9]{10,11}$/.test(formData.phone.replace(/\s/g, ''))) {
      newErrors.phone = 'Please enter a valid UK phone number'
    }
    
    // Joint account holder validation
    if (formData.customerAccountType === 'Joint') {
      if (!formData.jointFirstName.trim()) newErrors.jointFirstName = 'Joint account holder first name is required'
      if (!formData.jointLastName.trim()) newErrors.jointLastName = 'Joint account holder last name is required'
      if (!formData.jointPhone.trim()) newErrors.jointPhone = 'Joint account holder phone is required'
      
      // Joint email validation (only if provided)
      if (formData.jointEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.jointEmail)) {
        newErrors.jointEmail = 'Please enter a valid email address'
      }
      
      // Joint phone validation (UK format)
      if (formData.jointPhone && !/^(\+44|0)[0-9]{10,11}$/.test(formData.jointPhone.replace(/\s/g, ''))) {
        newErrors.jointPhone = 'Please enter a valid UK phone number'
      }
    }
    
    if (formData.enquiryType === 'Mortgage') {
      // Loan amount and property value are now optional fields
      // No validation required
    }
    
    // Annual income is now optional - no validation required

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!validateForm()) {
      return
    }

    setLoading(true)
    try {
      const enquiryData = {
        ...formData,
        enquiryDate: new Date().toISOString().split('T')[0],
        loanAmount: formData.enquiryType === 'Mortgage' ? parseInt(formData.loanAmount) || 0 : 0,
        propertyValue: formData.enquiryType === 'Mortgage' ? parseInt(formData.propertyValue) || 0 : 0,
        annualIncome: parseInt(formData.annualIncome) || 0,
        assignedTo: formData.assignedTo || null,
        followUpDate: formData.followUpDate || null
      }

      // Clean up mortgage-specific fields for Protection enquiries
      if (formData.enquiryType === 'Protection') {
        enquiryData.mortgageType = 'NA'
        enquiryData.preferredLender = formData.preferredLender || 'Legal & General'
      }

      const response = await authenticatedFetch('/api/enquiries', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(enquiryData)
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to create enquiry')
      }

      const result = await response.json()
      setSuccessMessage('Enquiry created successfully!')
      
      // Redirect after showing success message
      setTimeout(() => {
        router.push(`/enquiries/${result.enquiry.id}`)
      }, 1500)
    } catch (error) {
      console.error('Error creating enquiry:', error)
      setErrors({ general: 'Failed to create enquiry: ' + error.message })
    } finally {
      setLoading(false)
    }
  }

  const lenders = ['Halifax', 'Nationwide', 'Barclays', 'HSBC', 'Santander', 'Legal & General', 'Other']
  const activeUsers = users.filter(user => user.active)

  // Show loading state while checking authentication
  if (authLoading) {
    return (
      <div className="container py-5">
        <div className="text-center">
          <div className="spinner-border" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="mt-2">Checking authentication...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="container py-5">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1>Create New Enquiry</h1>
        <Link href="/enquiries" className="btn btn-outline-primary">
          Back to Enquiries
        </Link>
      </div>

      <div className="row">
        <div className="col-lg-10 col-xl-8 mx-auto">
          <div className="card">
            <div className="card-body py-3">
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

              {/* General Error Message */}
              {errors.general && (
                <div className="alert alert-danger alert-dismissible fade show" role="alert">
                  <i className="bi bi-exclamation-triangle me-2"></i>
                  {errors.general}
                  <button 
                    type="button" 
                    className="btn-close" 
                    onClick={() => setErrors(prev => ({ ...prev, general: '' }))}
                  ></button>
                </div>
              )}

              <form onSubmit={handleSubmit}>
                {/* Personal Information */}
                <h6 className="card-title mb-3 fw-bold">Personal Information</h6>
                <div className="row mb-2">
                  <div className="col-md-6">
                    <label className="form-label small mb-1">First Name *</label>
                    <input
                      type="text"
                      className={`form-control form-control-sm ${errors.firstName ? 'is-invalid' : ''}`}
                      name="firstName"
                      value={formData.firstName}
                      onChange={handleInputChange}
                      required
                    />
                    {errors.firstName && <div className="invalid-feedback">{errors.firstName}</div>}
                  </div>
                  <div className="col-md-6">
                    <label className="form-label small mb-1">Last Name *</label>
                    <input
                      type="text"
                      className={`form-control form-control-sm ${errors.lastName ? 'is-invalid' : ''}`}
                      name="lastName"
                      value={formData.lastName}
                      onChange={handleInputChange}
                      required
                    />
                    {errors.lastName && <div className="invalid-feedback">{errors.lastName}</div>}
                  </div>
                </div>

                <div className="row mb-2">
                  <div className="col-md-6">
                    <label className="form-label small mb-1">Email</label>
                    <input
                      type="email"
                      className={`form-control form-control-sm ${errors.email ? 'is-invalid' : ''}`}
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                    />
                    {errors.email && <div className="invalid-feedback">{errors.email}</div>}
                  </div>
                  <div className="col-md-6">
                    <label className="form-label small mb-1">Phone *</label>
                    <input
                      type="tel"
                      className={`form-control form-control-sm ${errors.phone ? 'is-invalid' : ''}`}
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      placeholder="07XXXXXXXXX"
                      required
                    />
                    {errors.phone && <div className="invalid-feedback">{errors.phone}</div>}
                  </div>
                </div>

                <div className="row mb-2">
                  <div className="col-md-4">
                    <label className="form-label small mb-1">Date of Birth</label>
                    <input
                      type="date"
                      className="form-control form-control-sm"
                      name="dateOfBirth"
                      value={formData.dateOfBirth}
                      onChange={handleInputChange}
                    />
                  </div>
                  <div className="col-md-4">
                    <label className="form-label small mb-1">Account Type</label>
                    <select
                      className="form-select form-select-sm"
                      name="customerAccountType"
                      value={formData.customerAccountType}
                      onChange={handleInputChange}
                    >
                      <option value="Sole">Sole</option>
                      <option value="Joint">Joint</option>
                    </select>
                  </div>
                  <div className="col-md-4">
                    <label className="form-label small mb-1">Postcode</label>
                    <input
                      type="text"
                      className={`form-control form-control-sm ${errors.postcode ? 'is-invalid' : ''}`}
                      name="postcode"
                      value={formData.postcode}
                      onChange={handleInputChange}
                    />
                    {errors.postcode && <div className="invalid-feedback">{errors.postcode}</div>}
                  </div>
                </div>

                <div className="row mb-2">
                  <div className="col-md-6">
                    <label className="form-label small mb-1">Employment Status</label>
                    <select
                      className="form-select form-select-sm"
                      name="employmentStatus"
                      value={formData.employmentStatus}
                      onChange={handleInputChange}
                    >
                      <option value="employed">Employed</option>
                      <option value="self-employed">Self Employed</option>
                      <option value="retired">Retired</option>
                      <option value="unemployed">Unemployed</option>
                    </select>
                  </div>
                  <div className="col-md-6">
                    <label className="form-label small mb-1">Annual Income</label>
                    <input
                      type="number"
                      className={`form-control form-control-sm ${errors.annualIncome ? 'is-invalid' : ''}`}
                      name="annualIncome"
                      value={formData.annualIncome}
                      onChange={handleInputChange}
                      min="0"
                      placeholder="Enter annual income (optional)"
                    />
                    {errors.annualIncome && <div className="invalid-feedback">{errors.annualIncome}</div>}
                  </div>
                </div>

                <div className="mb-3">
                  <label className="form-label small mb-1">Address</label>
                  <textarea
                    className={`form-control form-control-sm ${errors.address ? 'is-invalid' : ''}`}
                    name="address"
                    value={formData.address}
                    onChange={handleInputChange}
                    rows="2"
                  />
                  {errors.address && <div className="invalid-feedback">{errors.address}</div>}
                </div>

                {/* Joint Account Holder Information */}
                {formData.customerAccountType === 'Joint' && (
                  <>
                    <h6 className="card-title mb-3 mt-4 fw-bold">Joint Account Holder Information</h6>
                    <div className="row mb-2">
                      <div className="col-md-6">
                        <label className="form-label small mb-1">First Name *</label>
                        <input
                          type="text"
                          className={`form-control form-control-sm ${errors.jointFirstName ? 'is-invalid' : ''}`}
                          name="jointFirstName"
                          value={formData.jointFirstName}
                          onChange={handleInputChange}
                          required
                        />
                        {errors.jointFirstName && <div className="invalid-feedback">{errors.jointFirstName}</div>}
                      </div>
                      <div className="col-md-6">
                        <label className="form-label small mb-1">Last Name *</label>
                        <input
                          type="text"
                          className={`form-control form-control-sm ${errors.jointLastName ? 'is-invalid' : ''}`}
                          name="jointLastName"
                          value={formData.jointLastName}
                          onChange={handleInputChange}
                          required
                        />
                        {errors.jointLastName && <div className="invalid-feedback">{errors.jointLastName}</div>}
                      </div>
                    </div>

                    <div className="row mb-2">
                      <div className="col-md-6">
                        <label className="form-label small mb-1">Email</label>
                        <input
                          type="email"
                          className={`form-control form-control-sm ${errors.jointEmail ? 'is-invalid' : ''}`}
                          name="jointEmail"
                          value={formData.jointEmail}
                          onChange={handleInputChange}
                        />
                        {errors.jointEmail && <div className="invalid-feedback">{errors.jointEmail}</div>}
                      </div>
                      <div className="col-md-6">
                        <label className="form-label small mb-1">Phone *</label>
                        <input
                          type="tel"
                          className={`form-control form-control-sm ${errors.jointPhone ? 'is-invalid' : ''}`}
                          name="jointPhone"
                          value={formData.jointPhone}
                          onChange={handleInputChange}
                          placeholder="07XXXXXXXXX"
                          required
                        />
                        {errors.jointPhone && <div className="invalid-feedback">{errors.jointPhone}</div>}
                      </div>
                    </div>

                    <div className="row mb-2">
                      <div className="col-md-4">
                        <label className="form-label small mb-1">Date of Birth</label>
                        <input
                          type="date"
                          className="form-control form-control-sm"
                          name="jointDateOfBirth"
                          value={formData.jointDateOfBirth}
                          onChange={handleInputChange}
                        />
                      </div>
                      <div className="col-md-4">
                        <label className="form-label small mb-1">Employment Status</label>
                        <select
                          className="form-select form-select-sm"
                          name="jointEmploymentStatus"
                          value={formData.jointEmploymentStatus}
                          onChange={handleInputChange}
                        >
                          <option value="employed">Employed</option>
                          <option value="self-employed">Self Employed</option>
                          <option value="retired">Retired</option>
                          <option value="unemployed">Unemployed</option>
                        </select>
                      </div>
                      <div className="col-md-4">
                        <label className="form-label small mb-1">Postcode</label>
                        <input
                          type="text"
                          className={`form-control form-control-sm ${errors.jointPostcode ? 'is-invalid' : ''}`}
                          name="jointPostcode"
                          value={formData.jointPostcode}
                          onChange={handleInputChange}
                        />
                        {errors.jointPostcode && <div className="invalid-feedback">{errors.jointPostcode}</div>}
                      </div>
                    </div>

                    <div className="row mb-2">
                      <div className="col-md-8">
                        <label className="form-label small mb-1">Address</label>
                        <textarea
                          className={`form-control form-control-sm ${errors.jointAddress ? 'is-invalid' : ''}`}
                          name="jointAddress"
                          value={formData.jointAddress}
                          onChange={handleInputChange}
                          rows="2"
                        />
                        {errors.jointAddress && <div className="invalid-feedback">{errors.jointAddress}</div>}
                      </div>
                      <div className="col-md-4">
                        <label className="form-label small mb-1">Annual Income</label>
                        <input
                          type="number"
                          className={`form-control form-control-sm ${errors.jointAnnualIncome ? 'is-invalid' : ''}`}
                          name="jointAnnualIncome"
                          value={formData.jointAnnualIncome}
                          onChange={handleInputChange}
                          min="0"
                          placeholder="Enter annual income"
                        />
                        {errors.jointAnnualIncome && <div className="invalid-feedback">{errors.jointAnnualIncome}</div>}
                      </div>
                    </div>
                  </>
                )}

                {/* Enquiry Details */}
                <h6 className="card-title mb-3 mt-4 fw-bold">Enquiry Details</h6>
                <div className="row mb-2">
                  <div className="col-md-6">
                    <label className="form-label small mb-1">Enquiry Type</label>
                    <select
                      className="form-select form-select-sm"
                      name="enquiryType"
                      value={formData.enquiryType}
                      onChange={handleInputChange}
                    >
                      <option value="Mortgage">Mortgage</option>
                      <option value="Remortgage">Remortgage</option>
                      <option value="Protection">Protection</option>
                      <option value="Insurance">Insurance</option>
                    </select>
                  </div>
                  <div className="col-md-6">
                    <label className="form-label small mb-1">Preferred Lender</label>
                    <select
                      className="form-select form-select-sm"
                      name="preferredLender"
                      value={formData.preferredLender}
                      onChange={handleInputChange}
                    >
                      <option value="">Select Lender</option>
                      {lenders.map(lender => (
                        <option key={lender} value={lender}>{lender}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {formData.enquiryType === 'Mortgage' && (
                  <>
                    <div className="row mb-2">
                      <div className="col-md-4">
                        <label className="form-label small mb-1">Loan Amount</label>
                        <input
                          type="number"
                          className={`form-control form-control-sm ${errors.loanAmount ? 'is-invalid' : ''}`}
                          name="loanAmount"
                          value={formData.loanAmount}
                          onChange={handleInputChange}
                          min="0"
                          placeholder="Enter loan amount (optional)"
                        />
                        {errors.loanAmount && <div className="invalid-feedback">{errors.loanAmount}</div>}
                      </div>
                      <div className="col-md-4">
                        <label className="form-label small mb-1">Property Value</label>
                        <input
                          type="number"
                          className={`form-control form-control-sm ${errors.propertyValue ? 'is-invalid' : ''}`}
                          name="propertyValue"
                          value={formData.propertyValue}
                          onChange={handleInputChange}
                          min="0"
                          placeholder="Enter property value (optional)"
                        />
                        {errors.propertyValue && <div className="invalid-feedback">{errors.propertyValue}</div>}
                      </div>
                      <div className="col-md-4">
                        <label className="form-label small mb-1">Mortgage Type</label>
                        <select
                          className="form-select form-select-sm"
                          name="mortgageType"
                          value={formData.mortgageType}
                          onChange={handleInputChange}
                        >
                          <option value="">Select Type</option>
                          <option value="LTD Company BTL">LTD Company BTL</option>
                          <option value="BTL">BTL</option>
                          <option value="First Time Buyer">First Time Buyer</option>
                          <option value="Home Mover">Home Mover</option>
                          <option value="Remortgage">Remortgage</option>
                          <option value="Product Transfer">Product Transfer</option>
                          <option value="Further Advance">Further Advance</option>
                        </select>
                      </div>
                    </div>
                  </>
                )}

                <div className="mb-3">
                  <label className="form-label small mb-1">Notes</label>
                  <textarea
                    className="form-control form-control-sm"
                    name="notes"
                    value={formData.notes}
                    onChange={handleInputChange}
                    rows="2"
                    placeholder="Additional notes about the enquiry..."
                  />
                </div>

                {/* Management Details */}
                <h6 className="card-title mb-3 mt-4 fw-bold">Management Details</h6>
                <div className="row mb-2">
                  <div className="col-md-4">
                    <label className="form-label small mb-1">Status</label>
                    <select
                      className="form-select form-select-sm"
                      name="status"
                      value={formData.status}
                      onChange={handleInputChange}
                    >
                      <option value="new">New</option>
                      <option value="contacted">Contacted</option>
                      <option value="in-progress">In Progress</option>
                      <option value="qualified">Qualified</option>
                      <option value="follow-up">Follow Up</option>
                    </select>
                  </div>
                  <div className="col-md-4">
                    <label className="form-label small mb-1">Assign To</label>
                    <select
                      className="form-select form-select-sm"
                      name="assignedTo"
                      value={formData.assignedTo}
                      onChange={handleInputChange}
                    >
                      <option value="">Unassigned</option>
                      {activeUsers.map(user => (
                        <option key={user.id} value={user.name}>
                          {user.name} - {user.role}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="col-md-4">
                    <label className="form-label small mb-1">Follow Up Date</label>
                    <input
                      type="date"
                      className="form-control form-control-sm"
                      name="followUpDate"
                      value={formData.followUpDate}
                      onChange={handleInputChange}
                    />
                  </div>
                </div>

                <div className="d-flex gap-2 mt-4">
                  <button
                    type="submit"
                    className="btn btn-primary btn-sm"
                    disabled={loading}
                  >
                    {loading ? 'Creating...' : 'Create Enquiry'}
                  </button>
                  <Link href="/enquiries" className="btn btn-outline-secondary btn-sm">
                    Cancel
                  </Link>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
