// Fees management utility functions

export const FEE_TYPES = {
  APPLICATION: 'Application Fee',
  SOLICITOR_REFERRAL: 'Solicitor Referral Fee',
  MORTGAGE_PROCURATION: 'Mortgage Procuration Fee'
}

export const FEE_STATUSES = {
  PAID: 'PAID',
  UNPAID: 'UNPAID',
  NA: 'NA'
}

export const formatCurrency = (amount, currency = 'GBP') => {
  return new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency: currency
  }).format(amount)
}

export const formatDate = (dateString) => {
  if (!dateString) return 'N/A'
  return new Date(dateString).toLocaleDateString('en-GB', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  })
}

export const formatDateTime = (dateString) => {
  if (!dateString) return 'N/A'
  return new Date(dateString).toLocaleString('en-GB', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

export const getStatusBadgeClass = (status) => {
  switch (status) {
    case FEE_STATUSES.PAID:
      return 'bg-success'
    case FEE_STATUSES.UNPAID:
      return 'bg-danger'
    case FEE_STATUSES.NA:
      return 'bg-secondary'
    default:
      return 'bg-secondary'
  }
}

export const calculateTotalFees = (fees, status = null) => {
  let filteredFees = fees
  
  if (status) {
    filteredFees = fees.filter(fee => fee.status === status)
  }
  
  return filteredFees.reduce((total, fee) => total + fee.amount, 0)
}

export const getOverdueFees = (fees) => {
  const now = new Date()
  return fees.filter(fee => {
    if (fee.status === FEE_STATUSES.PAID || fee.status === FEE_STATUSES.NA) {
      return false
    }
    if (!fee.dueDate) return false
    return new Date(fee.dueDate) < now
  })
}

export const getUpcomingFees = (fees, daysAhead = 30) => {
  const now = new Date()
  const futureDate = new Date()
  futureDate.setDate(now.getDate() + daysAhead)
  
  return fees.filter(fee => {
    if (fee.status === FEE_STATUSES.PAID || fee.status === FEE_STATUSES.NA) {
      return false
    }
    if (!fee.dueDate) return false
    const dueDate = new Date(fee.dueDate)
    return dueDate >= now && dueDate <= futureDate
  })
}

export const getFeesSummary = (fees) => {
  const totalAmount = calculateTotalFees(fees)
  const paidAmount = calculateTotalFees(fees, FEE_STATUSES.PAID)
  const unpaidAmount = calculateTotalFees(fees, FEE_STATUSES.UNPAID)
  const naAmount = calculateTotalFees(fees, FEE_STATUSES.NA)
  const overdueFees = getOverdueFees(fees)
  const upcomingFees = getUpcomingFees(fees)
  
  return {
    totalAmount,
    paidAmount,
    unpaidAmount,
    naAmount,
    totalCount: fees.length,
    paidCount: fees.filter(f => f.status === FEE_STATUSES.PAID).length,
    unpaidCount: fees.filter(f => f.status === FEE_STATUSES.UNPAID).length,
    naCount: fees.filter(f => f.status === FEE_STATUSES.NA).length,
    overdueCount: overdueFees.length,
    upcomingCount: upcomingFees.length,
    overdueFees,
    upcomingFees
  }
}
