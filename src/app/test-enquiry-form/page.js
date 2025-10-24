'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

// Tell Next.js this is a dynamic page
export const dynamic = 'force-dynamic'
export const fetchCache = 'force-no-store'

export default function TestEnquiryForm() {
  const router = useRouter()
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    address: '',
    postcode: '',
    enquiryType: 'Mortgage',
    notes: ''
  })

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      const response = await fetch('/api/enquiries', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      if (response.ok) {
        router.push('/enquiries')
      } else {
        console.error('Failed to submit enquiry')
      }
    } catch (error) {
      console.error('Error submitting enquiry:', error)
    }
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  return (
    <div className="container mt-4">
      <div className="row justify-content-center">
        <div className="col-md-8">
          <div className="card">
            <div className="card-header">
              <h4 className="mb-0">Test Enquiry Form</h4>
            </div>
            <div className="card-body">
              <form onSubmit={handleSubmit}>
                <div className="row mb-3">
                  <div className="col-md-6">
                    <label className="form-label">First Name</label>
                    <input
                      type="text"
                      className="form-control"
                      name="firstName"
                      value={formData.firstName}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label">Last Name</label>
                    <input
                      type="text"
                      className="form-control"
                      name="lastName"
                      value={formData.lastName}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                </div>

                <div className="row mb-3">
                  <div className="col-md-6">
                    <label className="form-label">Email</label>
                    <input
                      type="email"
                      className="form-control"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label">Phone</label>
                    <input
                      type="tel"
                      className="form-control"
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                </div>

                <div className="mb-3">
                  <label className="form-label">Address</label>
                  <textarea
                    className="form-control"
                    name="address"
                    value={formData.address}
                    onChange={handleInputChange}
                    rows="2"
                    required
                  />
                </div>

                <div className="row mb-3">
                  <div className="col-md-6">
                    <label className="form-label">Postcode</label>
                    <input
                      type="text"
                      className="form-control"
                      name="postcode"
                      value={formData.postcode}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
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
                </div>

                <div className="mb-3">
                  <label className="form-label">Notes</label>
                  <textarea
                    className="form-control"
                    name="notes"
                    value={formData.notes}
                    onChange={handleInputChange}
                    rows="3"
                  />
                </div>

                <div className="d-flex gap-2">
                  <button type="submit" className="btn btn-primary">
                    Submit Test Enquiry
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
