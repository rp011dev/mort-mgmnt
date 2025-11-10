'use client'
import { useState, useEffect, Suspense } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { useAuth } from '../../hooks/useAuth'

// Tell Next.js this is a dynamic page
export const dynamic = 'force-dynamic'
export const fetchCache = 'force-no-store'

function EnquiriesContent() {
  const { user, loading: authLoading, logout, authenticatedFetch } = useAuth()
  const searchParams = useSearchParams()
  const [enquiries, setEnquiries] = useState([])
  const [allEnquiries, setAllEnquiries] = useState([])
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [typeFilter, setTypeFilter] = useState('all')
  const [assignedToFilter, setAssignedToFilter] = useState('all')
  const [currentPage, setCurrentPage] = useState(1)
  const [pagination, setPagination] = useState({})
  const [initialLoad, setInitialLoad] = useState(true)
  const [deleteModalOpen, setDeleteModalOpen] = useState(false)
  const [enquiryToDelete, setEnquiryToDelete] = useState(null)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    // Check for URL parameters and set initial filters
    const status = searchParams.get('status')
    if (status && status !== 'all') {
      setStatusFilter(status)
    }
    
    // Only load enquiries after auth is ready
    if (!authLoading && authenticatedFetch) {
      loadAllEnquiries()
      setInitialLoad(false)
    }
  }, [searchParams, authLoading, authenticatedFetch])

  useEffect(() => {
    if (!initialLoad && !authLoading && authenticatedFetch) {
      searchEnquiries() // Load enquiries when filters change, but not on initial load
    }
  }, [statusFilter, typeFilter, assignedToFilter, initialLoad, authLoading, authenticatedFetch])

  useEffect(() => {
    if (!initialLoad && !authLoading && authenticatedFetch) {
      searchEnquiries() // Search when initial load is complete
    }
  }, [initialLoad, authLoading, authenticatedFetch])

  const loadAllEnquiries = async () => {
    if (!authenticatedFetch) {
      console.warn('authenticatedFetch not available yet, skipping loadAllEnquiries')
      return
    }
    
    try {
      const response = await authenticatedFetch('/api/enquiries?limit=100')
      const data = await response.json()
      setAllEnquiries(data.enquiries || [])
    } catch (error) {
      console.error('Error loading all enquiries:', error)
      setAllEnquiries([])
    }
  }

  const searchEnquiries = async (page = 1) => {
    if (!authenticatedFetch) {
      console.warn('authenticatedFetch not available yet, skipping searchEnquiries')
      return
    }
    
    setLoading(true)
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '12'
      })
      
      if (searchTerm.trim()) {
        params.append('search', searchTerm.trim())
      }
      
      if (statusFilter !== 'all') {
        params.append('status', statusFilter)
      }
      
      if (typeFilter !== 'all') {
        params.append('type', typeFilter)
      }
      
      if (assignedToFilter !== 'all') {
        params.append('assignedTo', assignedToFilter)
      }

      const response = await authenticatedFetch(`/api/enquiries?${params}`)
      const data = await response.json()
      
      setEnquiries(data.enquiries || [])
      setPagination(data.pagination || {})
      setCurrentPage(page)
    } catch (error) {
      console.error('Error searching enquiries:', error)
      setEnquiries([])
      setPagination({})
    } finally {
      setLoading(false)
    }
  }

  const handleSearchClick = () => {
    setCurrentPage(1)
    searchEnquiries(1)
  }

  const handleClearFilters = () => {
    setSearchTerm('')
    setStatusFilter('all')
    setTypeFilter('all')
    setAssignedToFilter('all')
    setCurrentPage(1)
    searchEnquiries(1)
  }

  const handleStatusFilterChange = (e) => {
    setStatusFilter(e.target.value)
    setCurrentPage(1)
    setTimeout(() => searchEnquiries(1), 100)
  }

  const handleTypeFilterChange = (e) => {
    setTypeFilter(e.target.value)
    setCurrentPage(1)
    setTimeout(() => searchEnquiries(1), 100)
  }

  const handleAssignedToFilterChange = (e) => {
    setAssignedToFilter(e.target.value)
    setCurrentPage(1)
    setTimeout(() => searchEnquiries(1), 100)
  }

  const handlePageClick = (page) => {
    searchEnquiries(page)
  }

  const handleNextPage = () => {
    if (pagination.hasNextPage) {
      searchEnquiries(currentPage + 1)
    }
  }

  const handlePreviousPage = () => {
    if (pagination.hasPreviousPage) {
      searchEnquiries(currentPage - 1)
    }
  }

  const getStatusDisplay = (status) => {
    switch (status) {
      case 'new': return 'New'
      case 'contacted': return 'Contacted'
      case 'in-progress': return 'In Progress'
      case 'qualified': return 'Qualified'
      case 'follow-up': return 'Follow Up'
      case 'converted': return 'Converted'
      case 'closed': return 'Closed'
      case 'lost': return 'Lost'
      default: return status ? status.charAt(0).toUpperCase() + status.slice(1) : 'Unknown'
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
    if (!amount) return 'N/A'
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: 'GBP'
    }).format(amount)
  }

  const getUniqueStatuses = () => {
    return [...new Set(allEnquiries.map(enquiry => enquiry.status))]
  }

  const getUniqueTypes = () => {
    return [...new Set(allEnquiries.map(enquiry => enquiry.enquiryType))]
  }

  const getUniqueAssignees = () => {
    return [...new Set(allEnquiries.filter(enquiry => enquiry.assignedTo).map(enquiry => enquiry.assignedTo))]
  }

  // Delete enquiry functions
  const handleDeleteClick = (enquiry) => {
    console.log('Delete clicked for enquiry:', enquiry)
    console.log('Enquiry ID:', enquiry?.id)
    console.log('Enquiry keys:', Object.keys(enquiry || {}))
    setEnquiryToDelete(enquiry)
    setDeleteModalOpen(true)
  }

  const handleDeleteConfirm = async () => {
    if (!enquiryToDelete) return

    console.log('Deleting enquiry:', enquiryToDelete)
    console.log('Enquiry ID type:', typeof enquiryToDelete.id)
    console.log('Enquiry ID value:', enquiryToDelete.id)
    
    // Basic validation
    if (!enquiryToDelete.id || typeof enquiryToDelete.id !== 'string' || enquiryToDelete.id.trim() === '') {
      console.error('Invalid enquiry ID:', enquiryToDelete.id)
      console.error('Full enquiry object:', JSON.stringify(enquiryToDelete, null, 2))
      alert(`Invalid enquiry ID: "${enquiryToDelete.id}". Cannot delete this enquiry.`)
      setDeleteModalOpen(false)
      setEnquiryToDelete(null)
      return
    }

    setDeleting(true)
    try {
      const url = `/api/enquiries?enquiryId=${encodeURIComponent(enquiryToDelete.id)}&version=${enquiryToDelete._version || 1}`
      console.log('DELETE URL:', url)
      
      const response = await authenticatedFetch(url, {
        method: 'DELETE',
      })

      if (response.ok) {
        // Remove from local state
        setEnquiries(prev => prev.filter(e => e.id !== enquiryToDelete.id))
        setAllEnquiries(prev => prev.filter(e => e.id !== enquiryToDelete.id))
        
        // Close modal and reset state
        setDeleteModalOpen(false)
        setEnquiryToDelete(null)
        
        // Show success message (you could add a toast notification here)
        console.log('Enquiry deleted successfully')
      } else {
        const error = await response.json()
        console.error('Failed to delete enquiry:', error.error)
        alert('Failed to delete enquiry: ' + error.error)
      }
    } catch (error) {
      console.error('Error deleting enquiry:', error)
      alert('Error deleting enquiry. Please try again.')
    } finally {
      setDeleting(false)
    }
  }

  const handleDeleteCancel = () => {
    setDeleteModalOpen(false)
    setEnquiryToDelete(null)
  }

  const getPageNumbers = () => {
    const totalPages = pagination.totalPages || 1
    const current = currentPage
    const delta = 2
    const range = []
    const rangeWithDots = []

    for (let i = Math.max(2, current - delta); i <= Math.min(totalPages - 1, current + delta); i++) {
      range.push(i)
    }

    if (current - delta > 2) {
      rangeWithDots.push(1, '...')
    } else {
      rangeWithDots.push(1)
    }

    rangeWithDots.push(...range)

    if (current + delta < totalPages - 1) {
      rangeWithDots.push('...', totalPages)
    } else {
      rangeWithDots.push(totalPages)
    }

    return rangeWithDots.filter((item, index, array) => array.indexOf(item) === index)
  }

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
    <div className="container py-3">
      <div className="d-flex justify-content-between align-items-center mb-3">
          <Link href="/enquiries/new" className="btn btn-success btn-sm">
            + New Enquiry
          </Link>
        <div className="d-flex gap-2">
          <Link href="/" className="btn btn-outline-primary btn-sm">
            Back to Home
          </Link>
        </div>
      </div>

      {/* Filter Section */}
      <div className="card mb-3">
        <div className="card-body py-2">
          <h6 className="card-title mb-2">Search & Filter Enquiries</h6>
          
          {/* Search Field */}
          <div className="row mb-2">
            <div className="col-12">
              <label className="form-label small">Search by Name, Email, Phone, or Postcode</label>
              <input
                type="text"
                className="form-control form-control-sm"
                placeholder="Search enquiries..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleSearchClick()
                  }
                }}
              />
            </div>
          </div>

          {/* Active Filter Indicator */}
          {statusFilter !== 'all' && (
            <div className="row mb-2">
              <div className="col-12">
                <div className="alert alert-info py-2 d-flex justify-content-between align-items-center">
                  <span className="small">
                    <i className="bi bi-funnel-fill me-1"></i>
                    <strong>Filter Applied:</strong> Showing enquiries with status: <span className="badge bg-primary small">{getStatusDisplay(statusFilter)}</span>
                  </span>
                  <button 
                    className="btn btn-sm btn-outline-info"
                    onClick={() => {
                      setStatusFilter('all')
                      window.history.pushState({}, '', '/enquiries')
                    }}
                  >
                    Clear
                  </button>
                </div>
              </div>
            </div>
          )}
          
          {/* Filter Dropdowns */}
          <div className="row">
            <div className="col-md-4 mb-2">
              <label className="form-label small">Status</label>
              <select 
                className="form-select form-select-sm"
                value={statusFilter}
                onChange={handleStatusFilterChange}
              >
                <option value="all">All Statuses</option>
                {getUniqueStatuses().map(status => (
                  <option key={status} value={status}>{getStatusDisplay(status)}</option>
                ))}
              </select>
            </div>
            <div className="col-md-4 mb-2">
              <label className="form-label small">Type</label>
              <select 
                className="form-select form-select-sm"
                value={typeFilter}
                onChange={handleTypeFilterChange}
              >
                <option value="all">All Types</option>
                {getUniqueTypes().map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </div>
            <div className="col-md-4 mb-2">
              <label className="form-label small">Assigned To</label>
              <select 
                className="form-select form-select-sm"
                value={assignedToFilter}
                onChange={handleAssignedToFilterChange}
              >
                <option value="all">All Assignees</option>
                <option value="null">Unassigned</option>
                {getUniqueAssignees().map(assignee => (
                  <option key={assignee} value={assignee}>{assignee}</option>
                ))}
              </select>
            </div>
          </div>
          
          <div className="row">
            <div className="col-12 d-flex gap-2 align-items-center">
              <button 
                className="btn btn-primary btn-sm"
                onClick={handleSearchClick}
                disabled={loading}
              >
                {loading ? 'Searching...' : 'Search'}
              </button>
              <button 
                className="btn btn-outline-secondary btn-sm"
                onClick={handleClearFilters}
                disabled={loading}
              >
                Clear All Filters
              </button>
              <span className="ms-3 text-muted small">
                Showing {enquiries.length} of {pagination.totalEnquiries || 0} enquiries 
                (Page {currentPage} of {pagination.totalPages || 1})
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Top Pagination Controls */}
      {pagination.totalPages > 1 && (
        <div className="d-flex justify-content-between align-items-center mb-2">
          <div className="d-flex gap-1">
            <button
              className="btn btn-outline-primary btn-sm"
              onClick={handlePreviousPage}
              disabled={!pagination.hasPreviousPage || loading}
            >
              ← Previous
            </button>
            <button
              className="btn btn-outline-primary btn-sm"
              onClick={handleNextPage}
              disabled={!pagination.hasNextPage || loading}
            >
              Next →
            </button>
          </div>
          <span className="text-muted small">
            Page {currentPage} of {pagination.totalPages}
          </span>
        </div>
      )}

      {/* Enquiries List */}
      {loading ? (
        <div className="text-center py-4">
          <div className="spinner-border" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="mt-2">Loading enquiries...</p>
        </div>
      ) : enquiries.length === 0 ? (
        <div className="text-center py-4">
          <p className="text-muted">No enquiries found matching the selected filters.</p>
        </div>
      ) : (
        <div className="row">
          {enquiries.map(enquiry => (
            <div key={enquiry.id} className="col-xl-3 col-lg-4 col-md-6 mb-2">
              <div className="card customer-card h-100 d-flex flex-column">
                <div className="card-header d-flex justify-content-between align-items-center py-1">
                  <h6 className="mb-0 small fw-bold">
                    {enquiry.firstName} {enquiry.lastName}
                  </h6>
                  <small className="text-muted">{enquiry.id}</small>
                </div>
                <div className="card-body py-2 px-3 flex-grow-1 d-flex flex-column">
                  <div className="flex-grow-1">
                    <div className="row mb-2">
                      <div className="col-6">
                        <small className="text-muted">Status:</small>
                        <div>
                          <span className={`badge bg-${getStatusColor(enquiry.status)} small`}>
                            {getStatusDisplay(enquiry.status)}
                          </span>
                        </div>
                      </div>
                      <div className="col-6">
                        <small className="text-muted">Type:</small>
                        <div className="small fw-medium">{enquiry.enquiryType}</div>
                      </div>
                    </div>

                    <div className="mb-2">
                      <small className="text-muted">Contact:</small>
                      <div className="small">
                        <i className="bi bi-envelope me-1"></i>
                        <a href={`mailto:${enquiry.email}`} className="text-decoration-none">
                          {enquiry.email}
                        </a>
                      </div>
                      <div className="small">
                        <i className="bi bi-telephone me-1"></i>
                        <a href={`tel:${enquiry.phone}`} className="text-decoration-none">
                          {enquiry.phone}
                        </a>
                      </div>
                    </div>

                    {enquiry.loanAmount && (
                      <div className="mb-2">
                        <small className="text-muted">Loan Amount:</small>
                        <div className="small fw-medium">{formatCurrency(enquiry.loanAmount)}</div>
                      </div>
                    )}

                    <div className="mb-2">
                      <small className="text-muted">Preferred Lender:</small>
                      <div className="small fw-medium">{enquiry.preferredLender}</div>
                    </div>

                    {enquiry.assignedTo && (
                      <div className="mb-2">
                        <small className="text-muted">Assigned To:</small>
                        <div className="small fw-medium">{enquiry.assignedTo}</div>
                      </div>
                    )}
                  </div>

                  {/* Fixed button position at bottom */}
                  <div className="mt-auto">
                    <div className="row g-1">
                      <div className="col-8">
                        <Link 
                          href={`/enquiries/${enquiry.id}`}
                          className="btn btn-primary btn-sm small w-100"
                        >
                          Manage Enquiry
                        </Link>
                      </div>
                      <div className="col-4">
                        <button
                          type="button"
                          className="btn btn-outline-danger btn-sm small w-100"
                          onClick={() => handleDeleteClick(enquiry)}
                          title="Delete Enquiry"
                        >
                          <i className="bi bi-trash"></i>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Bottom Pagination */}
      {pagination.totalPages > 1 && (
        <div className="row mt-3">
          <div className="col-12">
            <nav aria-label="Enquiry pagination">
              <ul className="pagination justify-content-center pagination-sm">
                <li className={`page-item ${!pagination.hasPreviousPage ? 'disabled' : ''}`}>
                  <button 
                    className="page-link" 
                    onClick={handlePreviousPage}
                    disabled={!pagination.hasPreviousPage || loading}
                  >
                    Previous
                  </button>
                </li>
                
                {getPageNumbers()[0] > 1 && (
                  <>
                    <li className="page-item">
                      <button className="page-link" onClick={() => handlePageClick(1)}>1</button>
                    </li>
                    {getPageNumbers()[0] > 2 && (
                      <li className="page-item disabled">
                        <span className="page-link">...</span>
                      </li>
                    )}
                  </>
                )}
                
                {getPageNumbers().map(number => (
                  <li key={number} className={`page-item ${currentPage === number ? 'active' : ''}`}>
                    <button 
                      className="page-link" 
                      onClick={() => handlePageClick(number)}
                      disabled={loading}
                    >
                      {number}
                    </button>
                  </li>
                ))}
                
                {getPageNumbers()[getPageNumbers().length - 1] < pagination.totalPages && (
                  <>
                    {getPageNumbers()[getPageNumbers().length - 1] < pagination.totalPages - 1 && (
                      <li className="page-item disabled">
                        <span className="page-link">...</span>
                      </li>
                    )}
                    <li className="page-item">
                      <button className="page-link" onClick={() => handlePageClick(pagination.totalPages)}>
                        {pagination.totalPages}
                      </button>
                    </li>
                  </>
                )}
                
                <li className={`page-item ${!pagination.hasNextPage ? 'disabled' : ''}`}>
                  <button 
                    className="page-link" 
                    onClick={handleNextPage}
                    disabled={!pagination.hasNextPage || loading}
                  >
                    Next
                  </button>
                </li>
              </ul>
            </nav>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteModalOpen && (
        <div className="modal d-block" tabIndex="-1" style={{backgroundColor: 'rgba(0,0,0,0.5)'}}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Confirm Delete</h5>
                <button 
                  type="button" 
                  className="btn-close" 
                  onClick={handleDeleteCancel}
                  disabled={deleting}
                ></button>
              </div>
              <div className="modal-body">
                <div className="d-flex align-items-center mb-3">
                  <i className="bi bi-exclamation-triangle-fill text-warning me-2" style={{fontSize: '2rem'}}></i>
                  <div>
                    <h6 className="mb-1">Are you sure you want to delete this enquiry?</h6>
                    <p className="mb-0 text-muted">This action cannot be undone.</p>
                  </div>
                </div>
                {enquiryToDelete && (
                  <div className="border-start border-warning ps-3">
                    <strong>{enquiryToDelete.firstName} {enquiryToDelete.lastName}</strong>
                    <br />
                    <small className="text-muted">ID: {enquiryToDelete.id}</small>
                    <br />
                    <small className="text-muted">Email: {enquiryToDelete.email}</small>
                  </div>
                )}
              </div>
              <div className="modal-footer">
                <button 
                  type="button" 
                  className="btn btn-secondary" 
                  onClick={handleDeleteCancel}
                  disabled={deleting}
                >
                  Cancel
                </button>
                <button 
                  type="button" 
                  className="btn btn-danger" 
                  onClick={handleDeleteConfirm}
                  disabled={deleting}
                >
                  {deleting ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                      Deleting...
                    </>
                  ) : (
                    <>
                      <i className="bi bi-trash me-2"></i>
                      Delete Enquiry
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// Wrap the enquiries content in Suspense
export default function Enquiries() {
  return (
    <Suspense fallback={
      <div className="container py-5">
        <div className="text-center">
          <div className="spinner-border" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="mt-2">Loading enquiries...</p>
        </div>
      </div>
    }>
      <EnquiriesContent />
    </Suspense>
  )
  
}
