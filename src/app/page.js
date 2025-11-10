'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useAuth } from '../hooks/useAuth'

export default function Home() {
  const { user, loading: authLoading, logout, authenticatedFetch } = useAuth()
  const [customers, setCustomers] = useState([])
  const [searchTerm, setSearchTerm] = useState('')
  const [searchResults, setSearchResults] = useState([])
  const [isSearching, setIsSearching] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!authLoading && authenticatedFetch) {
      loadCustomers()
    }
  }, [authLoading, authenticatedFetch])

  // Auto-search when user types 2 or more characters
  useEffect(() => {
    if (searchTerm.trim().length >= 2) {
      // Auto search with 2+ characters
      setIsSearching(true)
      const results = customers.filter(customer => {
        const searchLower = searchTerm.toLowerCase()
        // Search in main customer fields
        const mainMatch = (customer.lastName?.toLowerCase() || '').includes(searchLower) ||
          (customer.firstName?.toLowerCase() || '').includes(searchLower) ||
          (customer.email?.toLowerCase() || '').includes(searchLower) ||
          ((customer.phone || '').toString().toLowerCase()).includes(searchLower) ||
          (customer.postcode?.toLowerCase() || '').includes(searchLower)
        
        // Search in joint holders
        const jointHolderMatch = customer.jointHolders?.some(holder => 
          (holder.firstName?.toLowerCase() || '').includes(searchLower) ||
          (holder.lastName?.toLowerCase() || '').includes(searchLower) ||
          (holder.email?.toLowerCase() || '').includes(searchLower) ||
          ((holder.phone || '').toString().toLowerCase()).includes(searchLower) ||
          (holder.postcode?.toLowerCase() || '').includes(searchLower)
        )
        
        return mainMatch || jointHolderMatch
      })
      setSearchResults(results)
    } else if (searchTerm.trim().length === 0) {
      // Clear search when empty
      setSearchResults([])
      setIsSearching(false)
    } else {
      // 1 character - show that we're ready to search but don't search yet
      setIsSearching(false)
      setSearchResults([])
    }
  }, [searchTerm, customers])

  const loadAllData = async (endpoint, dataKey = null, supportsPagination = true) => {
    if (!authenticatedFetch) {
      console.warn('authenticatedFetch not available yet')
      return []
    }

    if (!supportsPagination) {
      // For APIs that don't support pagination, just make a single call
      try {
        const response = await authenticatedFetch(endpoint)
        if (!response.ok) return []
        const result = await response.json()
        return dataKey ? result[dataKey] : result
      } catch (error) {
        console.error(`Error loading data from ${endpoint}:`, error)
        return []
      }
    }

    // For APIs that support pagination
    let allData = []
    let page = 1
    let hasMoreData = true

    while (hasMoreData) {
      try {
        const url = `${endpoint}${endpoint.includes('?') ? '&' : '?'}page=${page}&limit=50`
        const response = await authenticatedFetch(url)
        if (!response.ok) break

        const result = await response.json()
        const pageData = dataKey ? result[dataKey] : result
        const pagination = result.pagination

        if (!pageData || (Array.isArray(pageData) && pageData.length === 0)) {
          hasMoreData = false
        } else {
          allData = allData.concat(pageData)
          // Use pagination metadata if available, otherwise check if we got less than requested
          if (pagination) {
            hasMoreData = pagination.hasNextPage
          } else {
            hasMoreData = pageData.length === 50 // Continue if we got a full page
          }
          page++
        }
      } catch (error) {
        console.error(`Error loading page ${page} for ${endpoint}:`, error)
        hasMoreData = false
      }
    }

    return allData
  }

  const loadCustomers = async () => {
    try {
      setLoading(true)
      
      // Load all customers using pagination
      const customersData = await loadAllData('/api/customers', 'customers', true)
      setCustomers(customersData || [])
    } catch (error) {
      console.error('Error loading customers:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = (e) => {
    e.preventDefault()
    // The search is now handled automatically by useEffect
    // This function just ensures the form submission doesn't reload the page
    if (searchTerm.trim().length >= 2) {
      // Force trigger search in case it hasn't happened yet
      setIsSearching(true)
      const results = customers.filter(customer => {
        const searchLower = searchTerm.toLowerCase()
        // Search in main customer fields
        const mainMatch = (customer.lastName?.toLowerCase() || '').includes(searchLower) ||
          (customer.firstName?.toLowerCase() || '').includes(searchLower) ||
          (customer.email?.toLowerCase() || '').includes(searchLower) ||
          ((customer.phone || '').toString().toLowerCase()).includes(searchLower) ||
          (customer.postcode?.toLowerCase() || '').includes(searchLower)
        
        // Search in joint holders
        const jointHolderMatch = customer.jointHolders?.some(holder => 
          (holder.firstName?.toLowerCase() || '').includes(searchLower) ||
          (holder.lastName?.toLowerCase() || '').includes(searchLower) ||
          (holder.email?.toLowerCase() || '').includes(searchLower) ||
          ((holder.phone || '').toString().toLowerCase()).includes(searchLower) ||
          (holder.postcode?.toLowerCase() || '').includes(searchLower)
        )
        
        return mainMatch || jointHolderMatch
      })
      setSearchResults(results)
    }
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

  const getStageStats = () => {
    const stats = {
      total: customers.length,
      inProgress: 0,
      offerGenerated: 0,
      exchangeCompletion: 0
    }
    
    customers.forEach(customer => {
      const stage = customer.currentStage
      if (stage === 'offer-generated') {
        stats.offerGenerated++
      } else if (stage === 'exchange-completion') {
        stats.exchangeCompletion++
      } else {
        stats.inProgress++
      }
    })
    
    return stats
  }

  const stats = getStageStats()

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
    <div>
      {/* Hero Section */}


      <div className="container py-5">
        {/* Quick Stats Summary */}
        {loading ? (
          <div className="row mb-3">
            <div className="col-12 text-center">
              <div className="spinner-border text-primary" role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
              <p className="mt-2 text-muted small">Loading customers...</p>
            </div>
          </div>
        ) : (
          <div className="row mb-3">
            <div className="col-md-3 mb-2">
              <div className="stats-card">
                <h4 className="text-primary" style={{fontSize: '1.5rem'}}>{stats.total}</h4>
                <p className="mb-0 small">Total Customers</p>
              </div>
            </div>
            <div className="col-md-3 mb-2">
              <div className="stats-card">
                <h4 className="text-info" style={{fontSize: '1.5rem'}}>{stats.inProgress}</h4>
                <p className="mb-0 small">In Progress</p>
              </div>
            </div>
            <div className="col-md-3 mb-2">
              <div className="stats-card">
                <h4 className="text-warning" style={{fontSize: '1.5rem'}}>{stats.offerGenerated}</h4>
                <p className="mb-0 small">Offer Generated</p>
              </div>
            </div>
            <div className="col-md-3 mb-2">
              <div className="stats-card">
                <h4 className="text-success" style={{fontSize: '1.5rem'}}>{stats.exchangeCompletion}</h4>
                <p className="mb-0 small">Exchange & Completion</p>
              </div>
            </div>
          </div>
        )}

        {/* Search Section */}
        <div className="search-container">
          <h5 className="text-primary mb-2" style={{fontSize: '1.1rem'}}>
            <i className="bi bi-search me-2"></i>
            Search Customers
          </h5>
          <form onSubmit={handleSearch}>
            <div className="row">
              <div className="col-md-8">
                <input
                  type="text"
                  className="form-control"
                  placeholder="Start typing (2+ letters) to search by name, postcode, phone, email (includes joint holders)..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
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

          {isSearching && (
            <div className="mt-3">
              <h6 style={{fontSize: '1rem'}}>Search Results ({searchResults.length} found)</h6>
              {searchResults.length === 0 ? (
                <div className="alert alert-info">
                  No customers found matching your search criteria.
                </div>
              ) : (
                <div className="row">
                  {searchResults.map(customer => (
                    <div key={customer.id} className="col-md-6 col-lg-4 mb-2">
                      <div className="card customer-card h-100 d-flex flex-column">
                        <div className="card-header d-flex justify-content-between align-items-center py-2">
                          <h6 className="mb-0" style={{fontSize: '0.9rem'}}>
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
                                <span className={`badge stage-badge stage-${customer.currentStage}`} style={{fontSize: '0.7rem'}}>
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
                              View Details
                            </Link>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div className="row">
          <div className="col-md-4 mb-3">
            <div className="card h-100">
              <div className="card-body text-center py-3 px-3">
                <div className="mb-2">
                  <i className="bi bi-graph-up text-primary" style={{ fontSize: '1.2rem' }}></i>
                </div>
                <h5 className="text-primary mb-1" style={{fontSize: '1rem'}}>Analytics Dashboard</h5>
                <p className="card-text text-muted small mb-2">
                  View detailed statistics and analytics of all mortgage applications
                </p>
                <Link href="/dashboard" className="btn btn-primary btn-sm">
                  View Dashboard
                </Link>
              </div>
            </div>
          </div>
          <div className="col-md-4 mb-3">
            <div className="card h-100">
              <div className="card-body text-center py-3 px-3">
                <div className="mb-2">
                  <i className="bi bi-people text-success" style={{ fontSize: '1.2rem' }}></i>
                </div>
                <h5 className="text-success mb-1" style={{fontSize: '1rem'}}>Customer Management</h5>
                <p className="card-text text-muted small mb-2">
                  View and manage all customers in the mortgage application pipeline
                </p>
                <Link href="/customers" className="btn btn-success btn-sm">
                  Manage Customers
                </Link>
              </div>
            </div>
          </div>
          <div className="col-md-4 mb-3">
            <div className="card h-100">
              <div className="card-body text-center py-3 px-3">
                <div className="mb-2">
                  <i className="bi bi-funnel text-warning" style={{ fontSize: '1.2rem' }}></i>
                </div>
                <h5 className="text-warning mb-1" style={{fontSize: '1rem'}}>Enquiry Management</h5>
                <p className="card-text text-muted small mb-2">
                  Manage initial enquiries before they become full applications
                </p>
                <Link href="/enquiries" className="btn btn-warning btn-sm">
                  Enquiry Management
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
