'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

export default function NewEnquiry() {
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
    followUpDate: ''
  })
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState({})
  const [successMessage, setSuccessMessage] = useState('')
  const router = useRouter()

  useEffect(() => {
    loadUsers()
  }, [])

  const loadUsers = async () => {
    try {
      const response = await fetch('/api/users')
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
    if (!formData.email.trim()) newErrors.email = 'Email is required'
    if (!formData.phone.trim()) newErrors.phone = 'Phone is required'
    if (!formData.postcode.trim()) newErrors.postcode = 'Postcode is required'
    if (!formData.address.trim()) newErrors.address = 'Address is required'
    
    // Email validation
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address'
    }
    
    // Phone validation (UK format)
    if (formData.phone && !/^(\+44|0)[0-9]{10,11}$/.test(formData.phone.replace(/\s/g, ''))) {
      newErrors.phone = 'Please enter a valid UK phone number'
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

      const response = await fetch('/api/enquiries', {
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

  return (
    <div className="container py-5">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1>Create New Enquiry</h1>
        <Link href="/enquiries" className="btn btn-outline-primary">
          Back to Enquiries
        </Link>
      </div>

      <div className="row">
        <div className="col-lg-8 mx-auto">
          <div className="card">
            <div className="card-body">
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
                <h5 className="card-title mb-4">Personal Information</h5>
                <div className="row mb-3">
                  <div className="col-md-6">
                    <label className="form-label">First Name *</label>
                    <input
                      type="text"
                      className={`form-control ${errors.firstName ? 'is-invalid' : ''}`}
                      name="firstName"
                      value={formData.firstName}
                      onChange={handleInputChange}
                      required
                    />
                    {errors.firstName && <div className="invalid-feedback">{errors.firstName}</div>}
                  </div>
                  <div className="col-md-6">
                    <label className="form-label">Last Name *</label>
                    <input
                      type="text"
                      className={`form-control ${errors.lastName ? 'is-invalid' : ''}`}
                      name="lastName"
                      value={formData.lastName}
                      onChange={handleInputChange}
                      required
                    />
                    {errors.lastName && <div className="invalid-feedback">{errors.lastName}</div>}
                  </div>
                </div>

                <div className="row mb-3">
                  <div className="col-md-6">
                    <label className="form-label">Email *</label>
                    <input
                      type="email"
                      className={`form-control ${errors.email ? 'is-invalid' : ''}`}
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      required
                    />
                    {errors.email && <div className="invalid-feedback">{errors.email}</div>}
                  </div>
                  <div className="col-md-6">
                    <label className="form-label">Phone *</label>
                    <input
                      type="tel"
                      className={`form-control ${errors.phone ? 'is-invalid' : ''}`}
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      placeholder="07XXXXXXXXX"
                      required
                    />
                    {errors.phone && <div className="invalid-feedback">{errors.phone}</div>}
                  </div>
                </div>

                <div className="row mb-3">
                  <div className="col-md-6">
                    <label className="form-label">Date of Birth</label>
                    <input
                      type="date"
                      className="form-control"
                      name="dateOfBirth"
                      value={formData.dateOfBirth}
                      onChange={handleInputChange}
                    />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label">Account Type</label>
                    <select
                      className="form-select"
                      name="customerAccountType"
                      value={formData.customerAccountType}
                      onChange={handleInputChange}
                    >
                      <option value="Sole">Sole</option>
                      <option value="Joint">Joint</option>
                    </select>
                  </div>
                </div>

                <div className="row mb-3">
                  <div className="col-md-6">
                    <label className="form-label">Postcode *</label>
                    <input
                      type="text"
                      className={`form-control ${errors.postcode ? 'is-invalid' : ''}`}
                      name="postcode"
                      value={formData.postcode}
                      onChange={handleInputChange}
                      required
                    />
                    {errors.postcode && <div className="invalid-feedback">{errors.postcode}</div>}
                  </div>
                  <div className="col-md-6">
                    <label className="form-label">Employment Status</label>
                    <select
                      className="form-select"
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
                </div>

                <div className="mb-3">
                  <label className="form-label">Address *</label>
                  <textarea
                    className={`form-control ${errors.address ? 'is-invalid' : ''}`}
                    name="address"
                    value={formData.address}
                    onChange={handleInputChange}
                    rows="2"
                    required
                  />
                  {errors.address && <div className="invalid-feedback">{errors.address}</div>}
                </div>

                <div className="mb-4">
                  <label className="form-label">Annual Income</label>
                  <input
                    type="number"
                    className={`form-control ${errors.annualIncome ? 'is-invalid' : ''}`}
                    name="annualIncome"
                    value={formData.annualIncome}
                    onChange={handleInputChange}
                    min="0"
                    placeholder="Enter annual income (optional)"
                  />
                  {errors.annualIncome && <div className="invalid-feedback">{errors.annualIncome}</div>}
                </div>

                {/* Enquiry Details */}
                <h5 className="card-title mb-4">Enquiry Details</h5>
                <div className="row mb-3">
                  <div className="col-md-6">
                    <label className="form-label">Enquiry Type</label>
                    <select
                      className="form-select"
                      name="enquiryType"
                      value={formData.enquiryType}
                      onChange={handleInputChange}
                    >
                      <option value="Mortgage">Mortgage</option>
                      <option value="Protection">Protection</option>
                    </select>
                  </div>
                  <div className="col-md-6">
                    <label className="form-label">Preferred Lender</label>
                    <select
                      className="form-select"
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
                    <div className="row mb-3">
                      <div className="col-md-6">
                        <label className="form-label">Loan Amount</label>
                        <input
                          type="number"
                          className={`form-control ${errors.loanAmount ? 'is-invalid' : ''}`}
                          name="loanAmount"
                          value={formData.loanAmount}
                          onChange={handleInputChange}
                          min="0"
                          placeholder="Enter loan amount (optional)"
                        />
                        {errors.loanAmount && <div className="invalid-feedback">{errors.loanAmount}</div>}
                      </div>
                      <div className="col-md-6">
                        <label className="form-label">Property Value</label>
                        <input
                          type="number"
                          className={`form-control ${errors.propertyValue ? 'is-invalid' : ''}`}
                          name="propertyValue"
                          value={formData.propertyValue}
                          onChange={handleInputChange}
                          min="0"
                          placeholder="Enter property value (optional)"
                        />
                        {errors.propertyValue && <div className="invalid-feedback">{errors.propertyValue}</div>}
                      </div>
                    </div>

                    <div className="mb-3">
                      <label className="form-label">Mortgage Type</label>
                      <select
                        className="form-select"
                        name="mortgageType"
                        value={formData.mortgageType}
                        onChange={handleInputChange}
                      >
                        <option value="">Select Mortgage Type</option>
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

                <div className="mb-3">
                  <label className="form-label">Notes</label>
                  <textarea
                    className="form-control"
                    name="notes"
                    value={formData.notes}
                    onChange={handleInputChange}
                    rows="3"
                    placeholder="Additional notes about the enquiry..."
                  />
                </div>

                {/* Management Details */}
                <h5 className="card-title mb-4">Management Details</h5>
                <div className="row mb-3">
                  <div className="col-md-6">
                    <label className="form-label">Status</label>
                    <select
                      className="form-select"
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
                  <div className="col-md-6">
                    <label className="form-label">Assign To</label>
                    <select
                      className="form-select"
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
                </div>

                <div className="mb-4">
                  <label className="form-label">Follow Up Date</label>
                  <input
                    type="date"
                    className="form-control"
                    name="followUpDate"
                    value={formData.followUpDate}
                    onChange={handleInputChange}
                  />
                </div>

                <div className="d-flex gap-2">
                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={loading}
                  >
                    {loading ? 'Creating...' : 'Create Enquiry'}
                  </button>
                  <Link href="/enquiries" className="btn btn-outline-secondary">
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
