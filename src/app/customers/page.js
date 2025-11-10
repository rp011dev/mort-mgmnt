'use client'
import { useState, useEffect, Suspense } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { useAuth } from '../../hooks/useAuth'

// Tell Next.js this is a dynamic page
export const dynamic = 'force-dynamic'
export const fetchCache = 'force-no-store'

function CustomersContent() {
  const { user, loading: authLoading, logout, authenticatedFetch } = useAuth()
  const searchParams = useSearchParams()
  const [customers, setCustomers] = useState([])
  const [allCustomers, setAllCustomers] = useState([]) // For filter dropdown options
  const [searchTerm, setSearchTerm] = useState('')
  const [stageFilter, setStageFilter] = useState('all')
  const [lenderFilter, setLenderFilter] = useState('all')
  const [mortgageTypeFilter, setMortgageTypeFilter] = useState('all')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [currentPage, setCurrentPage] = useState(1)
  const [pagination, setPagination] = useState({})
  const [loading, setLoading] = useState(false)
  const [initialLoad, setInitialLoad] = useState(true)

  useEffect(() => {
    // Check for URL parameters and set initial filters
    const stage = searchParams.get('stage')
    if (stage && stage !== 'all') {
      setStageFilter(stage)
    }
    
    // Only load customers after auth is ready
    if (!authLoading && authenticatedFetch) {
      loadAllCustomers() // Load all customers for filter options
      setInitialLoad(false)
    }
  }, [searchParams, authLoading, authenticatedFetch])

  useEffect(() => {
    if (!initialLoad && !authLoading && authenticatedFetch) {
      searchCustomers() // Load customers when filters change, but not on initial load
    }
  }, [stageFilter, lenderFilter, mortgageTypeFilter, categoryFilter, initialLoad, authLoading, authenticatedFetch])

  useEffect(() => {
    if (!initialLoad && !authLoading && authenticatedFetch) {
      searchCustomers() // Search when initial load is complete
    }
  }, [initialLoad, authLoading, authenticatedFetch])

  // Auto-search when user types 2 or more characters
  useEffect(() => {
    if (!initialLoad && !authLoading && authenticatedFetch && searchTerm.length >= 2) {
      searchCustomers(1) // Start from page 1 when searching
    }
  }, [searchTerm, initialLoad, authLoading, authenticatedFetch])

  const loadAllCustomers = async () => {
    if (!authenticatedFetch) {
      console.warn('❌ authenticatedFetch not available yet, skipping loadAllCustomers')
      return
    }
    
    try {
      const response = await authenticatedFetch('/api/customers?limit=100') // Get all customers for filter options
      const data = await response.json()
      setAllCustomers(data.customers || []) // Extract the customers array
    } catch (error) {
      console.error('Error loading all customers:', error)
      setAllCustomers([]) // Set empty array on error
    }
  }

  const searchCustomers = async (page = 1) => {
    if (!authenticatedFetch) {
      console.warn('authenticatedFetch not available yet, skipping searchCustomers')
      return
    }
    
    setLoading(true)
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '12'
      })
      
      if (searchTerm && searchTerm.trim()) params.append('search', searchTerm.trim())
      if (stageFilter !== 'all') params.append('stage', stageFilter)
      if (lenderFilter !== 'all') params.append('lender', lenderFilter)
      if (mortgageTypeFilter !== 'all') params.append('mortgageType', mortgageTypeFilter)
      if (categoryFilter !== 'all') params.append('category', categoryFilter)
      
      const response = await authenticatedFetch(`/api/customers?${params}`)
      const data = await response.json()
      
      setCustomers(data.customers || [])
      setPagination(data.pagination || {})
      setCurrentPage(page)
    } catch (error) {
      console.error('Error searching customers:', error)
      setCustomers([])
      setPagination({})
    } finally {
      setLoading(false)
    }
  }

  const handleSearchClick = (e) => {
    if (e) {
      e.preventDefault() // Prevent form submission if called from form
    }
    searchCustomers(1) // Start from page 1 when filtering
  }

  const handleNextPage = () => {
    if (pagination.hasNextPage) {
      searchCustomers(currentPage + 1)
    }
  }

  const handlePreviousPage = () => {
    if (pagination.hasPreviousPage) {
      searchCustomers(currentPage - 1)
    }
  }

  const handlePageClick = (page) => {
    searchCustomers(page)
  }

  const getStageDisplay = (stage) => {
    const stages = {
      'initial-enquiry-assessment': 'Initial Enquiry Assessment',
      'document-verification': 'Document Verification',
      'decision-in-principle': 'Decision In Principle',
      'application-submitted-lender': 'Application Submitted Lender',
      'case-submitted-network': 'Case Submitted Network',
      'offer-generated': 'Offer Generated',
      'solicitor-initial-quote-issued': 'Solicitor - Initial Quote Issued',
      'solicitor-quote-accepted-fee-paid': 'Solicitor - Quote Accepted & Fee Paid',
      'solicitor-initial-search-legal-enquiries': 'Solicitor - Initial Search and Legal Enquiries',
      'solicitor-contracts-prepared': 'Solicitor - Contracts Prepared',
      'exchange-completion': 'Exchange & Completion'
    }
    return stages[stage] || stage
  }

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: 'GBP'
    }).format(amount)
  }

  const getStageProgress = (stage) => {
    const progress = {
      'initial-enquiry-assessment': 9,
      'document-verification': 18,
      'decision-in-principle': 27,
      'application-submitted-lender': 36,
      'case-submitted-network': 45,
      'offer-generated': 54,
      'solicitor-initial-quote-issued': 63,
      'solicitor-quote-accepted-fee-paid': 72,
      'solicitor-initial-search-legal-enquiries': 81,
      'solicitor-contracts-prepared': 90,
      'exchange-completion': 100
    }
    return progress[stage] || 0
  }

  // Get unique values for filter dropdowns from all customers
  const getUniqueLenders = () => {
    if (!Array.isArray(allCustomers)) return []
    const lenders = allCustomers.map(customer => customer.lender).filter(Boolean)
    return [...new Set(lenders)].sort()
  }

  const getUniqueMortgageTypes = () => {
    if (!Array.isArray(allCustomers)) return []
    const types = allCustomers.map(customer => customer.mortgageType).filter(type => type && type !== 'NA')
    return [...new Set(types)].sort()
  }

  const getUniqueCategories = () => {
    if (!Array.isArray(allCustomers)) return []
    const categories = allCustomers.map(customer => customer.category).filter(Boolean)
    return [...new Set(categories)].sort()
  }

  const handleStageFilterChange = (e) => {
    const newValue = e.target.value
    setStageFilter(newValue)
    setCurrentPage(1)
    // Trigger search immediately with new filter
    setTimeout(() => {
      searchCustomersWithFilter({ stage: newValue })
    }, 0)
  }

  const handleLenderFilterChange = (e) => {
    const newValue = e.target.value
    setLenderFilter(newValue)
    setCurrentPage(1)
    // Trigger search immediately with new filter
    setTimeout(() => {
      searchCustomersWithFilter({ lender: newValue })
    }, 0)
  }

  const handleMortgageTypeFilterChange = (e) => {
    const newValue = e.target.value
    setMortgageTypeFilter(newValue)
    setCurrentPage(1)
    // Trigger search immediately with new filter
    setTimeout(() => {
      searchCustomersWithFilter({ mortgageType: newValue })
    }, 0)
  }

  const handleCategoryFilterChange = (e) => {
    const newValue = e.target.value
    setCategoryFilter(newValue)
    setCurrentPage(1)
    // Trigger search immediately with new filter
    setTimeout(() => {
      searchCustomersWithFilter({ category: newValue })
    }, 0)
  }

  const searchCustomersWithFilter = async (overrideFilters = {}, page = 1) => {
    if (!authenticatedFetch) {
      console.warn('authenticatedFetch not available yet, skipping searchCustomersWithFilter')
      return
    }
    
    setLoading(true)
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '8'
      })
      
      if (searchTerm && searchTerm.trim()) params.append('search', searchTerm.trim())
      
      const currentStage = overrideFilters.stage !== undefined ? overrideFilters.stage : stageFilter
      const currentLender = overrideFilters.lender !== undefined ? overrideFilters.lender : lenderFilter
      const currentMortgageType = overrideFilters.mortgageType !== undefined ? overrideFilters.mortgageType : mortgageTypeFilter
      const currentCategory = overrideFilters.category !== undefined ? overrideFilters.category : categoryFilter
      
      if (currentStage !== 'all') params.append('stage', currentStage)
      if (currentLender !== 'all') params.append('lender', currentLender)
      if (currentMortgageType !== 'all') params.append('mortgageType', currentMortgageType)
      if (currentCategory !== 'all') params.append('category', currentCategory)
      
      const response = await authenticatedFetch(`/api/customers?${params}`)
      const data = await response.json()
      
      setCustomers(data.customers || [])
      setPagination(data.pagination || {})
      setCurrentPage(page)
    } catch (error) {
      console.error('Error searching customers:', error)
      setCustomers([])
      setPagination({})
    } finally {
      setLoading(false)
    }
  }

  const handleClearFilters = () => {
    setSearchTerm('')
    setStageFilter('all')
    setLenderFilter('all')
    setMortgageTypeFilter('all')
    setCategoryFilter('all')
    setCurrentPage(1)
    // Reset to show all customers
    searchCustomers(1)
  }

  // Generate page numbers for pagination (limit to 5 visible pages)
  const getPageNumbers = () => {
    const pageNumbers = []
    const maxVisiblePages = 5
    const totalPages = pagination.totalPages || 1
    let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2))
    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1)
    
    // Adjust start page if we're near the end
    if (endPage - startPage + 1 < maxVisiblePages) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1)
    }
    
    for (let i = startPage; i <= endPage; i++) {
      pageNumbers.push(i)
    }
    
    return pageNumbers
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
    <div className="container py-5">
      

      {/* Search Section */}
      <div className="search-container">
        <h5 className="text-primary mb-2" style={{fontSize: '1.1rem'}}>
          <i className="bi bi-search me-2"></i>
          Search Customers
        </h5>
        <form onSubmit={handleSearchClick}>
          <div className="row">
            <div className="col-md-8">
              <input
                type="text"
                className="form-control"
                placeholder="Start typing (2+ letters) to search by name, email, phone, postcode (includes joint holders)..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleSearchClick(e)
                  }
                }}
              />
            </div>
            <div className="col-md-4">
              <button type="submit" className="btn btn-primary w-100">
                <i className="bi bi-search me-2"></i>Search
              </button>
            </div>
          </div>
        </form>

        {searchTerm.trim().length === 1 && (
          <div className="mt-2 alert alert-light py-2">
            <small className="text-muted">
              <i className="bi bi-info-circle me-1"></i>
              Type one more character to start searching...
            </small>
          </div>
        )}
      </div>

      {/* Filter Section */}
      <div className="card mb-4">
        <div className="card-body">
          <h5 className="card-title">Additional Filters</h5>

          {/* Active Filter Indicator */}
          {stageFilter !== 'all' && (
            <div className="row mb-3">
              <div className="col-12">
                <div className="alert alert-info d-flex justify-content-between align-items-center">
                  <span>
                    <i className="bi bi-funnel-fill me-2"></i>
                    <strong>Filter Applied:</strong> Showing customers with stage: <span className="badge bg-primary">{getStageDisplay(stageFilter)}</span>
                  </span>
                  <button 
                    className="btn btn-sm btn-outline-info"
                    onClick={() => {
                      setStageFilter('all')
                      window.history.pushState({}, '', '/customers')
                    }}
                  >
                    Clear Filter
                  </button>
                </div>
              </div>
            </div>
          )}
          
          {/* Filter Dropdowns */}
          <div className="row">
            <div className="col-md-3 mb-3">
              <label className="form-label">Stage</label>
              <select 
                className="form-select"
                value={stageFilter}
                onChange={handleStageFilterChange}
              >
                <option value="all">All Stages</option>
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
            <div className="col-md-3 mb-3">
              <label className="form-label">Lender</label>
              <select 
                className="form-select"
                value={lenderFilter}
                onChange={handleLenderFilterChange}
              >
                <option value="all">All Lenders</option>
                {getUniqueLenders().map(lender => (
                  <option key={lender} value={lender}>{lender}</option>
                ))}
              </select>
            </div>
            <div className="col-md-3 mb-3">
              <label className="form-label">Mortgage Type</label>
              <select 
                className="form-select"
                value={mortgageTypeFilter}
                onChange={handleMortgageTypeFilterChange}
              >
                <option value="all">All Types</option>
                {getUniqueMortgageTypes().map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </div>
            <div className="col-md-3 mb-3">
              <label className="form-label">Category</label>
              <select 
                className="form-select"
                value={categoryFilter}
                onChange={handleCategoryFilterChange}
              >
                <option value="all">All Categories</option>
                {getUniqueCategories().map(category => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="row">
            <div className="col-12 d-flex gap-2 align-items-center">
              <button 
                className="btn btn-primary"
                onClick={handleSearchClick}
                disabled={loading}
              >
                {loading ? 'Searching...' : 'Search'}
              </button>
              <button 
                className="btn btn-outline-secondary"
                onClick={handleClearFilters}
                disabled={loading}
              >
                Clear All Filters
              </button>
              <span className="ms-3 text-muted">
                Showing {customers.length} of {pagination.totalCustomers || 0} customers 
                (Page {currentPage} of {pagination.totalPages || 1})
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Top Pagination Controls */}
      {pagination.totalPages > 1 && (
        <div className="d-flex justify-content-between align-items-center mb-3">
          <div className="d-flex gap-2">
            <button
              className="btn btn-outline-primary"
              onClick={handlePreviousPage}
              disabled={!pagination.hasPreviousPage || loading}
            >
              ← Previous
            </button>
            <button
              className="btn btn-outline-primary"
              onClick={handleNextPage}
              disabled={!pagination.hasNextPage || loading}
            >
              Next →
            </button>
          </div>
          <span className="text-muted">
            Page {currentPage} of {pagination.totalPages}
          </span>
        </div>
      )}

      {/* Customers List */}
      {loading ? (
        <div className="text-center py-4">
          <div className="spinner-border" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="mt-2">Loading customers...</p>
        </div>
      ) : customers.length === 0 ? (
        <div className="text-center py-4">
          <p className="text-muted">No customers found matching the selected filters.</p>
        </div>
      ) : (
        <div className="row">
          {customers.map(customer => (
            <div key={customer.id} className="col-xl-3 col-lg-4 col-md-6 mb-2">
              <div className="card customer-card h-100 d-flex flex-column">
                <div className="card-header d-flex justify-content-between align-items-center py-2">
                  <h6 className="mb-0">
                    {customer.firstName} {customer.lastName}
                  </h6>
                  <small className="text-muted">{customer.id}</small>
                </div>
                <div className="card-body py-2 px-3 flex-grow-1 d-flex flex-column">
                  <div className="flex-grow-1">
                    <div className="row mb-2">
                      <div className="col-6">
                        <small className="text-muted">Email:</small>
                        <div className="small">{customer.email}</div>
                      </div>
                      <div className="col-6">
                        <small className="text-muted">Phone:</small>
                        <div className="small">{customer.phone}</div>
                      </div>
                    </div>

                    <div className="row mb-2">
                      <div className="col-6">
                        <small className="text-muted">Postcode:</small>
                        <div className="small">{customer.postcode}</div>
                      </div>
                      <div className="col-6">
                        <small className="text-muted">Loan Amount:</small>
                        <div className="small">{formatCurrency(customer.loanAmount)}</div>
                      </div>
                    </div>

                    <div className="mb-2">
                      <small className="text-muted">Current Stage:</small>
                      <div>
                        <span className={`badge stage-badge stage-${customer.currentStage}`}>
                          {getStageDisplay(customer.currentStage)}
                        </span>
                      </div>
                    </div>

                    <div className="mb-2">
                      <small className="text-muted">Progress:</small>
                      <div className="progress mt-1" style={{height: '6px'}}>
                        <div 
                          className="progress-bar" 
                          role="progressbar" 
                          style={{width: `${getStageProgress(customer.currentStage)}%`}}
                        ></div>
                      </div>
                      <small className="text-muted small">{getStageProgress(customer.currentStage)}% Complete</small>
                    </div>
                    {customer.customerAccountType === 'Joint' && customer.jointHolders?.length > 0 && (
                      <div className="mb-2 pb-2">
                        <small className="text-muted">Joint Holder{customer.jointHolders.length > 1 ? 's' : ''}:</small>
                        {customer.jointHolders.map((holder, index) => (
                          <div key={index} className="mb-0">
                            <strong>{holder.firstName} {holder.lastName}</strong>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="d-grid mt-auto">
                    <Link 
                      href={`/customers/${customer.id}`}
                      className="btn btn-primary btn-sm w-100"
                    >
                      Manage Customer
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Bottom Pagination */}
      {pagination.totalPages > 1 && (
        <div className="row mt-4">
          <div className="col-12">
            <nav aria-label="Customer pagination">
              <ul className="pagination justify-content-center">
                <li className={`page-item ${!pagination.hasPreviousPage ? 'disabled' : ''}`}>
                  <button 
                    className="page-link" 
                    onClick={handlePreviousPage}
                    disabled={!pagination.hasPreviousPage || loading}
                  >
                    Previous
                  </button>
                </li>
                
                {/* First page if not visible */}
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
                
                {/* Page numbers */}
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
                
                {/* Last page if not visible */}
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
    </div>
  )
}

// Wrap the customer content in Suspense
export default function Customers() {
  return (
    <Suspense fallback={
      <div className="container py-5">
        <div className="text-center">
          <div className="spinner-border" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="mt-2">Loading customer management...</p>
        </div>
      </div>
    }>
      <CustomersContent />
    </Suspense>
  )
}
