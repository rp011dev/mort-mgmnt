'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useAuth } from '../../hooks/useAuth'

export default function Dashboard() {
  const { user, loading: authLoading, logout, authenticatedFetch } = useAuth()
  const [customers, setCustomers] = useState([])
  const [enquiries, setEnquiries] = useState([])
  const [fees, setFees] = useState([])
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('applications')
  const [hoveredTab, setHoveredTab] = useState(null)
  const [showAlerts, setShowAlerts] = useState({
    oneMonth: false,
    threeMonths: false,
    sixMonths: false
  })

  useEffect(() => {
    if (!authLoading && authenticatedFetch) {
      loadData()
      
      // Set up auto-refresh every 30 seconds for real-time updates
      const interval = setInterval(loadData, 30000)
      
      return () => clearInterval(interval)
    }
  }, [authLoading, authenticatedFetch])

  const loadAllData = async (endpoint, dataKey = null, supportsPagination = true) => {
    // Safety guard: ensure authenticatedFetch is available
    if (!authenticatedFetch) {
      console.error('authenticatedFetch not available')
      return []
    }

    if (!supportsPagination) {
      // For APIs that don't support pagination (like fees), just make a single call
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

  const loadData = async () => {
    try {
      setLoading(true)
      
      // Load all data by paginating until no more data is returned
      const [customersData, enquiriesData, feesData, productsData] = await Promise.all([
        loadAllData('/api/customers', 'customers', true), // supports pagination
        loadAllData('/api/enquiries', 'enquiries', true), // supports pagination
        loadAllData('/api/fees', null, false), // doesn't support pagination
        loadAllData('/api/products', null, false) // doesn't support pagination
      ])

      setCustomers(customersData)
      setEnquiries(enquiriesData)
      setFees(feesData)
      setProducts(productsData)
    } catch (error) {
      console.error('Error loading dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  const getStageStats = () => {
    const stats = {}
    customers.forEach(customer => {
      stats[customer.currentStage] = (stats[customer.currentStage] || 0) + 1
    })
    return stats
  }

  const getEnquiryStats = () => {
    const stats = {}
    enquiries.forEach(enquiry => {
      stats[enquiry.status] = (stats[enquiry.status] || 0) + 1
    })
    return stats
  }

  const getFeesStats = () => {
    let totalFees = 0
    let paidAmount = 0
    let unpaidAmount = 0
    let overdueAmount = 0
    let totalCount = 0
    let paidCount = 0
    let unpaidCount = 0
    let overdueCount = 0

    // fees is now a flat array from the API
    if (Array.isArray(fees)) {
      fees.forEach(fee => {
        totalCount++
        totalFees += fee.amount || 0
        
        if (fee.status === 'PAID') {
          paidAmount += fee.amount || 0
          paidCount++
        } else if (fee.status === 'UNPAID') {
          unpaidAmount += fee.amount || 0
          unpaidCount++
          
          // Check if overdue
          if (fee.dueDate) {
            const dueDate = new Date(fee.dueDate)
            const today = new Date()
            if (dueDate < today) {
              overdueAmount += fee.amount || 0
              overdueCount++
            }
          }
        }
      })
    }

    return {
      totalFees,
      paidAmount,
      unpaidAmount,
      overdueAmount,
      totalCount,
      paidCount,
      unpaidCount,
      overdueCount
    }
  }

  const getProductEndDateAlerts = () => {
    const alerts = {
      oneMonth: [],
      threeMonths: [],
      sixMonths: []
    }

    const today = new Date()
    const oneMonthFromNow = new Date(today.getTime() + (30 * 24 * 60 * 60 * 1000))
    const threeMonthsFromNow = new Date(today.getTime() + (90 * 24 * 60 * 60 * 1000))
    const sixMonthsFromNow = new Date(today.getTime() + (180 * 24 * 60 * 60 * 1000))

    // Debug: Check what we have
    let customersWithProducts = 0
    let productsWithEndDates = 0
    let futureEndDates = 0
    let pastEndDates = 0

    // Iterate through products data to find end dates
    products.forEach(customerProducts => {
      const customer = customers.find(c => c.id === customerProducts.customerId)
      
      if (customer && customerProducts.products) {
        customersWithProducts++
        
        customerProducts.products.forEach(product => {
          if (product.productEndDate) {
            productsWithEndDates++
            const endDate = new Date(product.productEndDate)
            
            if (endDate > today) {
              futureEndDates++
              const daysUntilEnd = Math.ceil((endDate - today) / (1000 * 60 * 60 * 24))
              
              // Create enhanced customer object with product info
              const customerWithProduct = {
                ...customer,
                productEndDate: product.productEndDate,
                productReferenceNumber: product.productReferenceNumber,
                category: product.category,
                lender: product.lender,
                rateOfInterest: product.rateOfInterest
              }
              
              if (endDate <= oneMonthFromNow && endDate > today) {
                alerts.oneMonth.push(customerWithProduct)
              } else if (endDate <= threeMonthsFromNow && endDate > oneMonthFromNow) {
                alerts.threeMonths.push(customerWithProduct)
              } else if (endDate <= sixMonthsFromNow && endDate > threeMonthsFromNow) {
                alerts.sixMonths.push(customerWithProduct)
              }
            } else {
              pastEndDates++
            }
          }
        })
      }
    })

    return alerts
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

  const toggleAlertSection = (alertType) => {
    setShowAlerts(prev => ({
      ...prev,
      [alertType]: !prev[alertType]
    }))
  }

  const stats = getStageStats()
  const enquiryStats = getEnquiryStats()
  const feesStats = getFeesStats()
  // Only calculate product alerts if both customers and products data are loaded
  const productAlerts = customers.length > 0 && products.length > 0 ? getProductEndDateAlerts() : {
    oneMonth: [],
    threeMonths: [],
    sixMonths: []
  }

  // Applications and Enquiry Stats Component
  const ApplicationsStats = () => (
    <div>
      {/* Customer Statistics */}
        <div className="row mb-3">
          <div className="col-12 mb-2">
            <h5 className="text-primary mb-2" style={{fontSize: '1.1rem'}}>
          <i className="bi bi-graph-up me-2"></i>
          Application Statistics
            </h5>
            <p className="text-muted small mb-0">Overview of all customer applications by stage</p>
          </div>
          
          {/* First Row - Initial stages */}
          <div className="col-md-3 mb-2">
            <Link href="/customers" className="text-decoration-none">
          <div className="card stats-card h-100 stats-clickable">
            <div className="card-body text-center py-2">
              <h4 className="text-primary" style={{fontSize: '1.5rem'}}>{customers.length}</h4>
              <p className="mb-0 small">Total Customers</p>
            </div>
          </div>
            </Link>
          </div>
          <div className="col-md-3 mb-2">
            <Link href="/customers?stage=initial-enquiry-assessment" className="text-decoration-none">
          <div className="card stats-card h-100 stats-clickable">
            <div className="card-body text-center py-2">
              <h4 className="text-warning" style={{fontSize: '1.5rem'}}>{stats['initial-enquiry-assessment'] || 0}</h4>
              <p className="mb-0 small">Initial Assessment</p>
            </div>
          </div>
            </Link>
          </div>
          <div className="col-md-3 mb-2">
            <Link href="/customers?stage=document-verification" className="text-decoration-none">
          <div className="card stats-card h-100 stats-clickable">
            <div className="card-body text-center py-2">
              <h4 className="text-info" style={{fontSize: '1.5rem'}}>{stats['document-verification'] || 0}</h4>
              <p className="mb-0 small">Document Verification</p>
            </div>
          </div>
            </Link>
          </div>
          <div className="col-md-3 mb-2">
            <Link href="/customers?stage=decision-in-principle" className="text-decoration-none">
          <div className="card stats-card h-100 stats-clickable">
            <div className="card-body text-center py-2">
              <h4 className="text-primary" style={{fontSize: '1.5rem'}}>{stats['decision-in-principle'] || 0}</h4>
              <p className="mb-0 small">Decision In Principle</p>
            </div>
          </div>
            </Link>
          </div>
          
          {/* Second Row - Application stages */}
          <div className="col-md-3 mb-2">
            <Link href="/customers?stage=application-submitted-lender" className="text-decoration-none">
          <div className="card stats-card h-100 stats-clickable">
            <div className="card-body text-center py-2">
              <h4 className="text-warning" style={{fontSize: '1.5rem'}}>{stats['application-submitted-lender'] || 0}</h4>
              <p className="mb-0 small">Application Submitted to Lender</p>
            </div>
          </div>
            </Link>
          </div>
          <div className="col-md-3 mb-2">
            <Link href="/customers?stage=case-submitted-network" className="text-decoration-none">
          <div className="card stats-card h-100 stats-clickable">
            <div className="card-body text-center py-2">
              <h4 className="text-info" style={{fontSize: '1.5rem'}}>{stats['case-submitted-network'] || 0}</h4>
              <p className="mb-0 small">Case Submitted Network</p>
            </div>
          </div>
            </Link>
          </div>
          <div className="col-md-3 mb-2">
            <Link href="/customers?stage=offer-generated" className="text-decoration-none">
          <div className="card stats-card h-100 stats-clickable">
            <div className="card-body text-center py-2">
              <h4 className="text-success" style={{fontSize: '1.5rem'}}>{stats['offer-generated'] || 0}</h4>
              <p className="mb-0 small">Offers Generated</p>
            </div>
          </div>
            </Link>
          </div>
          <div className="col-md-3 mb-2">
            <Link href="/customers?stage=solicitor-initial-quote-issued" className="text-decoration-none">
          <div className="card stats-card h-100 stats-clickable">
            <div className="card-body text-center py-2">
              <h4 className="text-secondary" style={{fontSize: '1.5rem'}}>{stats['solicitor-initial-quote-issued'] || 0}</h4>
              <p className="mb-0 small">Solicitor Quote Issued</p>
            </div>
          </div>
            </Link>
          </div>
          
          {/* Third Row - Solicitor stages */}
          <div className="col-md-3 mb-2">
            <Link href="/customers?stage=solicitor-quote-accepted-fee-paid" className="text-decoration-none">
          <div className="card stats-card h-100 stats-clickable">
            <div className="card-body text-center py-2">
              <h4 className="text-primary" style={{fontSize: '1.5rem'}}>{stats['solicitor-quote-accepted-fee-paid'] || 0}</h4>
              <p className="mb-0 small">Solicitor Quote Accepted</p>
            </div>
          </div>
            </Link>
          </div>
          <div className="col-md-3 mb-2">
            <Link href="/customers?stage=solicitor-initial-search-legal-enquiries" className="text-decoration-none">
          <div className="card stats-card h-100 stats-clickable">
            <div className="card-body text-center py-2">
              <h4 className="text-warning" style={{fontSize: '1.5rem'}}>{stats['solicitor-initial-search-legal-enquiries'] || 0}</h4>
              <p className="mb-0 small">Legal Search & Enquiries</p>
            </div>
          </div>
            </Link>
          </div>
          <div className="col-md-3 mb-2">
            <Link href="/customers?stage=solicitor-contracts-prepared" className="text-decoration-none">
          <div className="card stats-card h-100 stats-clickable">
            <div className="card-body text-center py-2">
              <h4 className="text-info" style={{fontSize: '1.5rem'}}>{stats['solicitor-contracts-prepared'] || 0}</h4>
              <p className="mb-0 small">Contracts Prepared</p>
            </div>
          </div>
            </Link>
          </div>
          <div className="col-md-3 mb-2">
            <Link href="/customers?stage=exchange-completion" className="text-decoration-none">
          <div className="card stats-card h-100 stats-clickable">
            <div className="card-body text-center py-2">
              <h4 className="text-success" style={{fontSize: '1.5rem'}}>{stats['exchange-completion'] || 0}</h4>
              <p className="mb-0 small">Exchange & Completion</p>
            </div>
          </div>
            </Link>
          </div>
        </div>

        {/* Enquiry Stats */}
      <div className="row mb-3">
        <div className="col-12 mb-2">
          <h5 className="text-info mb-2" style={{fontSize: '1.1rem'}}>
            <i className="bi bi-envelope me-2"></i>
            Enquiry Statistics
          </h5>
        </div>
        <div className="col-md-3 mb-2">
          <Link href="/enquiries" className="text-decoration-none">
            <div className="card stats-card h-100 stats-clickable">
              <div className="card-body text-center py-2">
                <h4 className="text-info" style={{fontSize: '1.5rem'}}>{enquiries.length}</h4>
                <p className="mb-0 small">Total Enquiries</p>
              </div>
            </div>
          </Link>
        </div>
        <div className="col-md-3 mb-2">
          <Link href="/enquiries?status=open" className="text-decoration-none">
            <div className="card stats-card h-100 stats-clickable">
              <div className="card-body text-center py-2">
                <h4 className="text-success" style={{fontSize: '1.5rem'}}>{enquiryStats['open'] || 0}</h4>
                <p className="mb-0 small">Open</p>
              </div>
            </div>
          </Link>
        </div>
        <div className="col-md-3 mb-2">
          <Link href="/enquiries?status=in-progress" className="text-decoration-none">
            <div className="card stats-card h-100 stats-clickable">
              <div className="card-body text-center py-2">
                <h4 className="text-warning" style={{fontSize: '1.5rem'}}>{enquiryStats['in-progress'] || 0}</h4>
                <p className="mb-0 small">In Progress</p>
              </div>
            </div>
          </Link>
        </div>
        <div className="col-md-3 mb-2">
          <Link href="/enquiries?status=converted" className="text-decoration-none">
            <div className="card stats-card h-100 stats-clickable">
              <div className="card-body text-center py-2">
                <h4 className="text-primary" style={{fontSize: '1.5rem'}}>{enquiryStats['converted'] || 0}</h4>
                <p className="mb-0 small">Converted</p>
              </div>
            </div>
          </Link>
        </div>
      </div>

      {/* Progress Overview */}
      <div className="row mb-3">
        <div className="col-12">
          <div className="card">
            <div className="card-header py-2">
              <h6 className="mb-0" style={{fontSize: '1rem'}}>Application Pipeline Overview</h6>
            </div>
            <div className="card-body py-2 px-3">
              <div className="row">
                {Object.entries(stats).map(([stage, count]) => (
                  <div key={stage} className="col-lg-4 col-md-6 mb-2">
                    <div className="d-flex justify-content-between align-items-center mb-1">
                      <span className={`badge stage-badge stage-${stage}`} style={{fontSize: '0.7rem'}}>
                        {getStageDisplay(stage)}
                      </span>
                      <strong className="small">{count} customers</strong>
                    </div>
                    <div className="progress" style={{height: '6px'}}>
                      <div 
                        className="progress-bar"
                        role="progressbar"
                        style={{width: `${(count / customers.length) * 100}%`}}
                      ></div>
                    </div>
                    <small className="text-muted" style={{fontSize: '0.75rem'}}>
                      {((count / customers.length) * 100).toFixed(1)}% of total
                    </small>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )

  // Fees Dashboard Component
  const FeesDashboard = () => (
    <div>
      <div className="row mb-3">
        <div className="col-12 mb-2">
          <div className="d-flex justify-content-between align-items-center">
            <div>
              <h5 className="text-success mb-1" style={{fontSize: '1.1rem'}}>
                <i className="bi bi-currency-pound me-2"></i>
                Fees Dashboard
              </h5>
              <p className="text-muted mb-0 small">Overview of all customer fees across the platform</p>
            </div>
            <button 
              className="btn btn-outline-success btn-sm"
              onClick={loadData}
              disabled={loading}
              title="Refresh fees data"
            >
              <i className="bi bi-arrow-clockwise me-1"></i>
              <span style={{fontSize: '0.75rem'}}>{loading ? 'Refreshing...' : 'Refresh'}</span>
            </button>
          </div>
        </div>
        
        {/* Fee Summary Cards */}
        <div className="col-md-3 mb-2">
          <div className="card fee-summary-card total h-100">
            <div className="card-body text-center py-2">
              <h5 className="text-primary" style={{fontSize: '1.2rem'}}>{formatCurrency(feesStats.totalFees)}</h5>
              <h6 className="card-title small">Total Fees</h6>
              <small className="text-muted" style={{fontSize: '0.75rem'}}>{feesStats.totalCount} fees</small>
            </div>
          </div>
        </div>
        <div className="col-md-3 mb-2">
          <div className="card fee-summary-card paid h-100">
            <div className="card-body text-center py-2">
              <h5 className="text-success" style={{fontSize: '1.2rem'}}>{formatCurrency(feesStats.paidAmount)}</h5>
              <h6 className="card-title small">Total Paid</h6>
              <small className="text-muted" style={{fontSize: '0.75rem'}}>{feesStats.paidCount} fees</small>
            </div>
          </div>
        </div>
        <div className="col-md-3 mb-2">
          <div className="card fee-summary-card unpaid h-100">
            <div className="card-body text-center py-2">
              <h5 className="text-warning" style={{fontSize: '1.2rem'}}>{formatCurrency(feesStats.unpaidAmount)}</h5>
              <h6 className="card-title small">Outstanding</h6>
              <small className="text-muted" style={{fontSize: '0.75rem'}}>{feesStats.unpaidCount} fees</small>
            </div>
          </div>
        </div>
        <div className="col-md-3 mb-2">
          <div className="card fee-summary-card overdue h-100">
            <div className="card-body text-center py-2">
              <h5 className="text-danger" style={{fontSize: '1.2rem'}}>{formatCurrency(feesStats.overdueAmount)}</h5>
              <h6 className="card-title small">Overdue</h6>
              <small className="text-muted" style={{fontSize: '0.75rem'}}>{feesStats.overdueCount} fees</small>
            </div>
          </div>
        </div>
      </div>

      {/* Fees Breakdown by Customer */}
      <div className="row mb-3">
        <div className="col-12">
          <div className="card">
            <div className="card-header py-2">
              <h6 className="mb-0" style={{fontSize: '1rem'}}>Fees by Customer</h6>
            </div>
            <div className="card-body py-2 px-3">
              {Object.entries(
                fees.reduce((grouped, fee) => {
                  if (!grouped[fee.customerId]) {
                    grouped[fee.customerId] = []
                  }
                  grouped[fee.customerId].push(fee)
                  return grouped
                }, {})
              ).map(([customerId, customerFees]) => {
                const customer = customers.find(c => c.id === customerId)
                const customerTotal = customerFees.reduce((sum, fee) => sum + (fee.amount || 0), 0)
                const paidFees = customerFees.filter(fee => fee.status === 'PAID')
                const unpaidFees = customerFees.filter(fee => fee.status === 'UNPAID')
                
                return (
                  <div key={customerId} className="border-bottom py-2">
                    <div className="row align-items-center">
                      <div className="col-md-4">
                        <h6 className="mb-1 small">
                          {customer ? `${customer.firstName} ${customer.lastName}` : customerId}
                        </h6>
                        <small className="text-muted" style={{fontSize: '0.75rem'}}>
                          {customer?.category} - {customer?.productReferenceNumber}
                        </small>
                      </div>
                      <div className="col-md-2 text-center">
                        <strong className="small">{formatCurrency(customerTotal)}</strong>
                        <div className="small text-muted" style={{fontSize: '0.7rem'}}>Total</div>
                      </div>
                      <div className="col-md-2 text-center">
                        <span className="text-success small">{paidFees.length}</span>
                        <div className="small text-muted" style={{fontSize: '0.7rem'}}>Paid</div>
                      </div>
                      <div className="col-md-2 text-center">
                        <span className="text-warning small">{unpaidFees.length}</span>
                        <div className="small text-muted" style={{fontSize: '0.7rem'}}>Outstanding</div>
                      </div>
                      <div className="col-md-2 text-end">
                        <Link href={`/customers/${customerId}`} className="btn btn-sm btn-outline-primary">
                          <span style={{fontSize: '0.75rem'}}>View Details</span>
                        </Link>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  )

  // Product End Date Alerts Component
  const ProductAlerts = () => (
    <div>
      <div className="row mb-3">
        <div className="col-12 mb-2">
          <h5 className="text-warning mb-2" style={{fontSize: '1.1rem'}}>
            <i className="bi bi-exclamation-triangle me-2"></i>
            Product End Date Alerts
          </h5>
          <p className="text-muted small mb-0">Monitor products nearing their end dates</p>
        </div>
      </div>

      {/* Alert Summary Cards */}
      <div className="row mb-3">
        <div className="col-md-4 mb-2">
          <div 
            className="card alert-card alert-danger h-100" 
            style={{ cursor: 'pointer' }}
            onClick={() => toggleAlertSection('oneMonth')}
          >
            <div className="card-body text-center py-2">
              <h4 className="text-danger" style={{fontSize: '1.5rem'}}>{productAlerts.oneMonth.length}</h4>
              <h6 className="card-title small">Ending in 1 Month</h6>
              <small className="text-muted" style={{fontSize: '0.75rem'}}>
                {showAlerts.oneMonth ? 'Click to hide details' : 'Click to view details'}
              </small>
              <div className="mt-1">
                <i className={`bi bi-chevron-${showAlerts.oneMonth ? 'up' : 'down'}`}></i>
              </div>
            </div>
          </div>
        </div>
        <div className="col-md-4 mb-2">
          <div 
            className="card alert-card alert-warning h-100" 
            style={{ cursor: 'pointer' }}
            onClick={() => toggleAlertSection('threeMonths')}
          >
            <div className="card-body text-center py-2">
              <h4 className="text-warning" style={{fontSize: '1.5rem'}}>{productAlerts.threeMonths.length}</h4>
              <h6 className="card-title small">Ending in 3 Months</h6>
              <small className="text-muted" style={{fontSize: '0.75rem'}}>
                {showAlerts.threeMonths ? 'Click to hide details' : 'Click to view details'}
              </small>
              <div className="mt-1">
                <i className={`bi bi-chevron-${showAlerts.threeMonths ? 'up' : 'down'}`}></i>
              </div>
            </div>
          </div>
        </div>
        <div className="col-md-4 mb-2">
          <div 
            className="card alert-card alert-info h-100" 
            style={{ cursor: 'pointer' }}
            onClick={() => toggleAlertSection('sixMonths')}
          >
            <div className="card-body text-center py-2">
              <h4 className="text-info" style={{fontSize: '1.5rem'}}>{productAlerts.sixMonths.length}</h4>
              <h6 className="card-title small">Ending in 6 Months</h6>
              <small className="text-muted" style={{fontSize: '0.75rem'}}>
                {showAlerts.sixMonths ? 'Click to hide details' : 'Click to view details'}
              </small>
              <div className="mt-1">
                <i className={`bi bi-chevron-${showAlerts.sixMonths ? 'up' : 'down'}`}></i>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Detailed Alerts */}
      {productAlerts.oneMonth.length > 0 && showAlerts.oneMonth && (
        <div className="row mb-4">
          <div className="col-12">
            <div className="card border-danger">
              <div className="card-header bg-danger text-white">
                <h5 className="mb-0">
                  <i className="bi bi-exclamation-circle me-2"></i>
                  Critical: Products Ending Within 1 Month
                </h5>
              </div>
              <div className="card-body">
                {productAlerts.oneMonth.map(customer => (
                  <div key={customer.id} className="alert alert-danger d-flex justify-content-between align-items-center">
                    <div>
                      <strong>{customer.firstName} {customer.lastName}</strong>
                      <div className="small">
                        Product: {customer.productReferenceNumber} | End Date: {customer.productEndDate}
                        {customer.rateOfInterest && <span> | ROI: {customer.rateOfInterest}%</span>}
                      </div>
                    </div>
                    <Link href={`/customers/${customer.id}`} className="btn btn-sm btn-danger">
                      Take Action
                    </Link>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {productAlerts.threeMonths.length > 0 && showAlerts.threeMonths && (
        <div className="row mb-4">
          <div className="col-12">
            <div className="card border-warning">
              <div className="card-header bg-warning text-dark">
                <h5 className="mb-0">
                  <i className="bi bi-clock me-2"></i>
                  Warning: Products Ending Within 3 Months
                </h5>
              </div>
              <div className="card-body">
                {productAlerts.threeMonths.map(customer => (
                  <div key={customer.id} className="alert alert-warning d-flex justify-content-between align-items-center">
                    <div>
                      <strong>{customer.firstName} {customer.lastName}</strong>
                      <div className="small">
                        Product: {customer.productReferenceNumber} | End Date: {customer.productEndDate}
                        {customer.rateOfInterest && <span> | ROI: {customer.rateOfInterest}%</span>}
                      </div>
                    </div>
                    <Link href={`/customers/${customer.id}`} className="btn btn-sm btn-warning">
                      Plan Renewal
                    </Link>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {productAlerts.sixMonths.length > 0 && showAlerts.sixMonths && (
        <div className="row mb-4">
          <div className="col-12">
            <div className="card border-info">
              <div className="card-header bg-info text-white">
                <h5 className="mb-0">
                  <i className="bi bi-info-circle me-2"></i>
                  Info: Products Ending Within 6 Months
                </h5>
              </div>
              <div className="card-body">
                {productAlerts.sixMonths.map(customer => (
                  <div key={customer.id} className="alert alert-info d-flex justify-content-between align-items-center">
                    <div>
                      <strong>{customer.firstName} {customer.lastName}</strong>
                      <div className="small">
                        Product: {customer.productReferenceNumber} | End Date: {customer.productEndDate}
                        {customer.rateOfInterest && <span> | ROI: {customer.rateOfInterest}%</span>}
                      </div>
                    </div>
                    <Link href={`/customers/${customer.id}`} className="btn btn-sm btn-info">
                      Monitor
                    </Link>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )

  // Special Events Component (Birthday Events)
  const SpecialEvents = () => {
    // Helper function to get upcoming birthdays
    const getUpcomingBirthdays = () => {
      const today = new Date()
      const currentMonth = today.getMonth()
      const currentDate = today.getDate()
      
      const upcomingBirthdays = customers.filter(customer => {
        if (!customer.dateOfBirth) return false
        
        const birthDate = new Date(customer.dateOfBirth)
        const birthMonth = birthDate.getMonth()
        const birthDay = birthDate.getDate()
        
        // Check if birthday is within the next 30 days
        const nextMonth = new Date(today)
        nextMonth.setDate(nextMonth.getDate() + 30)
        
        const birthdayThisYear = new Date(today.getFullYear(), birthMonth, birthDay)
        const birthdayNextYear = new Date(today.getFullYear() + 1, birthMonth, birthDay)
        
        return (birthdayThisYear >= today && birthdayThisYear <= nextMonth) ||
               (birthdayNextYear >= today && birthdayNextYear <= nextMonth)
      }).map(customer => {
        const birthDate = new Date(customer.dateOfBirth)
        const birthdayThisYear = new Date(today.getFullYear(), birthDate.getMonth(), birthDate.getDate())
        const birthdayNextYear = new Date(today.getFullYear() + 1, birthDate.getMonth(), birthDate.getDate())
        
        const upcomingBirthday = birthdayThisYear >= today ? birthdayThisYear : birthdayNextYear
        const daysUntil = Math.ceil((upcomingBirthday - today) / (1000 * 60 * 60 * 24))
        
        return {
          ...customer,
          upcomingBirthday,
          daysUntil,
          age: today.getFullYear() - birthDate.getFullYear() - (birthdayThisYear < today ? 0 : -1)
        }
      }).sort((a, b) => a.daysUntil - b.daysUntil)
      
      return upcomingBirthdays
    }

    // Helper function to get today's birthdays
    const getTodaysBirthdays = () => {
      const today = new Date()
      const currentMonth = today.getMonth()
      const currentDate = today.getDate()
      
      return customers.filter(customer => {
        if (!customer.dateOfBirth) return false
        
        const birthDate = new Date(customer.dateOfBirth)
        return birthDate.getMonth() === currentMonth && birthDate.getDate() === currentDate
      }).map(customer => {
        const birthDate = new Date(customer.dateOfBirth)
        const age = today.getFullYear() - birthDate.getFullYear()
        return { ...customer, age }
      })
    }

    const upcomingBirthdays = getUpcomingBirthdays()
    const todaysBirthdays = getTodaysBirthdays()

    return (
      <div>
        {/* Today's Birthdays */}
        {todaysBirthdays.length > 0 && (
          <div className="row mb-4">
            <div className="col-12">
              <div className="card border-success">
                <div className="card-header bg-success text-white">
                  <h5 className="mb-0">
                    <i className="bi bi-cake me-2"></i>
                    Today&apos;s Birthdays ({todaysBirthdays.length})
                  </h5>
                </div>
                <div className="card-body">
                  {todaysBirthdays.map(customer => (
                    <div key={customer.id} className="alert alert-success d-flex justify-content-between align-items-center mb-2">
                      <div>
                        <strong>🎂 {customer.firstName} {customer.lastName}</strong>
                        <div className="small">
                          Turning {customer.age} today! | Email: {customer.email || 'N/A'} | Phone: {customer.phone || 'N/A'}
                        </div>
                      </div>
                      <div className="d-flex gap-2">
                        <Link href={`/customers/${customer.id}`} className="btn btn-sm btn-success">
                          View Profile
                        </Link>
                        <button 
                          className="btn btn-sm btn-outline-success"
                          onClick={() => window.open(`mailto:${customer.email}?subject=Happy Birthday ${customer.firstName}!&body=Dear ${customer.firstName},%0A%0AWishing you a very Happy Birthday! 🎂%0A%0ABest regards,%0AGK Finance Team`, '_blank')}
                          disabled={!customer.email}
                          title={customer.email ? 'Send Birthday Email' : 'No email available'}
                        >
                          <i className="bi bi-envelope"></i>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Upcoming Birthdays */}
        <div className="row mb-3">
          <div className="col-12 mb-2">
            <h5 className="text-primary mb-2" style={{fontSize: '1.1rem'}}>
              <i className="bi bi-calendar-event me-2"></i>
              Upcoming Birthdays (Next 30 Days)
            </h5>
            <p className="text-muted small mb-0">Keep track of customer birthdays for relationship building</p>
          </div>
        </div>

        {upcomingBirthdays.length > 0 ? (
          <div className="row">
            <div className="col-12">
              <div className="card">
                <div className="card-header">
                  <h6 className="mb-0">
                    <i className="bi bi-gift me-2"></i>
                    {upcomingBirthdays.length} Upcoming Birthday{upcomingBirthdays.length !== 1 ? 's' : ''}
                  </h6>
                </div>
                <div className="card-body">
                  {upcomingBirthdays.map(customer => (
                    <div key={customer.id} className="alert alert-info d-flex justify-content-between align-items-center mb-2">
                      <div>
                        <strong>{customer.firstName} {customer.lastName}</strong>
                        <div className="small">
                          Birthday: {customer.upcomingBirthday.toLocaleDateString()} | 
                          {customer.daysUntil === 0 ? ' Today!' : 
                           customer.daysUntil === 1 ? ' Tomorrow' : 
                           ` In ${customer.daysUntil} days`} | 
                          Turning {customer.age + (customer.daysUntil === 0 ? 0 : 1)}
                        </div>
                        <div className="small text-muted">
                          Email: {customer.email || 'N/A'} | Phone: {customer.phone || 'N/A'}
                        </div>
                      </div>
                      <div className="d-flex gap-2">
                        <Link href={`/customers/${customer.id}`} className="btn btn-sm btn-info">
                          View Profile
                        </Link>
                        <button 
                          className="btn btn-sm btn-outline-info"
                          onClick={() => window.open(`mailto:${customer.email}?subject=Birthday Wishes from GK Finance&body=Dear ${customer.firstName},%0A%0AWe wanted to wish you an early Happy Birthday! 🎂%0A%0AYour special day is coming up on ${customer.upcomingBirthday.toLocaleDateString()} and we wanted to reach out to send our best wishes.%0A%0ABest regards,%0AGK Finance Team`, '_blank')}
                          disabled={!customer.email}
                          title={customer.email ? 'Send Birthday Email' : 'No email available'}
                        >
                          <i className="bi bi-envelope"></i>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="row">
            <div className="col-12">
              <div className="alert alert-info">
                <i className="bi bi-info-circle me-2"></i>
                No upcoming birthdays in the next 30 days.
              </div>
            </div>
          </div>
        )}

        {/* Birthday Statistics */}
        <div className="row mt-4">
          <div className="col-md-4 mb-3">
            <div className="card bg-light">
              <div className="card-body text-center">
                <h4 className="text-success">{todaysBirthdays.length}</h4>
                <p className="mb-0 small">Today&apos;s Birthdays</p>
              </div>
            </div>
          </div>
          <div className="col-md-4 mb-3">
            <div className="card bg-light">
              <div className="card-body text-center">
                <h4 className="text-info">{upcomingBirthdays.length}</h4>
                <p className="mb-0 small">Next 30 Days</p>
              </div>
            </div>
          </div>
          <div className="col-md-4 mb-3">
            <div className="card bg-light">
              <div className="card-body text-center">
                <h4 className="text-primary">{customers.filter(c => c.dateOfBirth).length}</h4>
                <p className="mb-0 small">Customers with DOB</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
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
    <div>
   

      <div className="container py-5">
        {/* Sub Navigation */}
        <div className="row mb-3">
          <div className="col-12">
            <div className="card">
              <div className="card-header py-3">
                <ul className="nav nav-tabs card-header-tabs">
                  <li className="nav-item">
                    <button 
                      className={`nav-link ${activeTab === 'applications' ? 'active' : ''}`}
                      onClick={() => setActiveTab('applications')}
                      onMouseEnter={() => setHoveredTab('applications')}
                      onMouseLeave={() => setHoveredTab(null)}
                      style={{
                        fontSize: '0.9rem', 
                        whiteSpace: 'nowrap', 
                        paddingTop: '0.75rem', 
                        paddingBottom: '0.75rem',
                        backgroundColor: activeTab === 'applications' ? '#0d6efd' : 
                                       hoveredTab === 'applications' ? '#e3f2fd' : '#f8f9fa',
                        color: activeTab === 'applications' ? 'white' : 
                               hoveredTab === 'applications' ? '#0d6efd' : '#495057',
                        border: '1px solid #dee2e6',
                        fontWeight: activeTab === 'applications' ? 'bold' : 'normal',
                        transition: 'all 0.3s ease'
                      }}
                    >
                      <i className="bi bi-graph-up me-1"></i>
                      <span className="d-none d-md-inline">Application & Enquiry Stats</span>
                      <span className="d-md-none">Apps & Enquiries</span>
                    </button>
                  </li>
                  <li className="nav-item">
                    <button 
                      className={`nav-link ${activeTab === 'fees' ? 'active' : ''}`}
                      onClick={() => setActiveTab('fees')}
                      onMouseEnter={() => setHoveredTab('fees')}
                      onMouseLeave={() => setHoveredTab(null)}
                      style={{
                        fontSize: '0.9rem', 
                        whiteSpace: 'nowrap', 
                        paddingTop: '0.75rem', 
                        paddingBottom: '0.75rem',
                        backgroundColor: activeTab === 'fees' ? '#198754' : 
                                       hoveredTab === 'fees' ? '#e8f5e8' : '#f8f9fa',
                        color: activeTab === 'fees' ? 'white' : 
                               hoveredTab === 'fees' ? '#198754' : '#495057',
                        border: '1px solid #dee2e6',
                        fontWeight: activeTab === 'fees' ? 'bold' : 'normal',
                        transition: 'all 0.3s ease'
                      }}
                    >
                      <i className="bi bi-currency-pound me-1"></i>
                      <span className="d-none d-md-inline">Fees Dashboard</span>
                      <span className="d-md-none">Fees</span>
                    </button>
                  </li>
                  <li className="nav-item">
                    <button 
                      className={`nav-link ${activeTab === 'alerts' ? 'active' : ''}`}
                      onClick={() => setActiveTab('alerts')}
                      onMouseEnter={() => setHoveredTab('alerts')}
                      onMouseLeave={() => setHoveredTab(null)}
                      style={{
                        fontSize: '0.9rem', 
                        whiteSpace: 'nowrap', 
                        paddingTop: '0.75rem', 
                        paddingBottom: '0.75rem',
                        backgroundColor: activeTab === 'alerts' ? '#dc3545' : 
                                       hoveredTab === 'alerts' ? '#fdeaea' : '#f8f9fa',
                        color: activeTab === 'alerts' ? 'white' : 
                               hoveredTab === 'alerts' ? '#dc3545' : '#495057',
                        border: '1px solid #dee2e6',
                        fontWeight: activeTab === 'alerts' ? 'bold' : 'normal',
                        transition: 'all 0.3s ease'
                      }}
                    >
                      <i className="bi bi-exclamation-triangle me-1"></i>
                      <span className="d-none d-md-inline">Product End Date Alerts</span>
                      <span className="d-md-none">Alerts</span>
                    </button>
                  </li>
                  <li className="nav-item">
                    <button 
                      className={`nav-link ${activeTab === 'events' ? 'active' : ''}`}
                      onClick={() => setActiveTab('events')}
                      onMouseEnter={() => setHoveredTab('events')}
                      onMouseLeave={() => setHoveredTab(null)}
                      style={{
                        fontSize: '0.9rem', 
                        whiteSpace: 'nowrap', 
                        paddingTop: '0.75rem', 
                        paddingBottom: '0.75rem',
                        backgroundColor: activeTab === 'events' ? '#6f42c1' : 
                                       hoveredTab === 'events' ? '#f3f0ff' : '#f8f9fa',
                        color: activeTab === 'events' ? 'white' : 
                               hoveredTab === 'events' ? '#6f42c1' : '#495057',
                        border: '1px solid #dee2e6',
                        fontWeight: activeTab === 'events' ? 'bold' : 'normal',
                        transition: 'all 0.3s ease'
                      }}
                    >
                      <i className="bi bi-calendar-event me-1"></i>
                      <span className="d-none d-md-inline">Special Events</span>
                      <span className="d-md-none">Events</span>
                    </button>
                  </li>
                </ul>
              </div>
              <div className="card-body py-2 px-3">
                {activeTab === 'applications' && <ApplicationsStats />}
                {activeTab === 'fees' && <FeesDashboard />}
                {activeTab === 'alerts' && <ProductAlerts />}
                {activeTab === 'events' && <SpecialEvents />}
              </div>
            </div>
          </div>
        </div>
      
      </div>
    </div>
  )
}
