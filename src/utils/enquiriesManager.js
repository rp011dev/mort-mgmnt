// Enquiries management utility - now uses API instead of direct import
// import enquiriesData from '../data/enquiries.json' // Now using API

export const getAllEnquiries = () => {
  return enquiriesData
}

export const getEnquiryById = (id) => {
  return enquiriesData.find(enquiry => enquiry.id === id)
}

export const getEnquiriesByStatus = (status) => {
  return enquiriesData.filter(enquiry => enquiry.status === status)
}

export const getEnquiriesByType = (type) => {
  return enquiriesData.filter(enquiry => enquiry.enquiryType === type)
}

export const getEnquiriesByAssignee = (assignedTo) => {
  return enquiriesData.filter(enquiry => enquiry.assignedTo === assignedTo)
}

export const searchEnquiries = (searchTerm) => {
  const term = searchTerm.toLowerCase()
  return enquiriesData.filter(enquiry => 
    enquiry.firstName.toLowerCase().includes(term) ||
    enquiry.lastName.toLowerCase().includes(term) ||
    enquiry.email.toLowerCase().includes(term) ||
    enquiry.phone.includes(term) ||
    enquiry.postcode.toLowerCase().includes(term) ||
    enquiry.notes.toLowerCase().includes(term)
  )
}

export const getEnquiryStats = () => {
  const stats = {
    total: enquiriesData.length,
    byStatus: {},
    byType: {},
    byAssignee: {}
  }
  
  enquiriesData.forEach(enquiry => {
    // Count by status
    stats.byStatus[enquiry.status] = (stats.byStatus[enquiry.status] || 0) + 1
    
    // Count by type
    stats.byType[enquiry.enquiryType] = (stats.byType[enquiry.enquiryType] || 0) + 1
    
    // Count by assignee
    const assignee = enquiry.assignedTo || 'unassigned'
    stats.byAssignee[assignee] = (stats.byAssignee[assignee] || 0) + 1
  })
  
  return stats
}

// Convert enquiry to customer when progressing to application
export const convertEnquiryToCustomer = (enquiry) => {
  const customerData = {
    firstName: enquiry.firstName,
    lastName: enquiry.lastName,
    email: enquiry.email,
    phone: enquiry.phone,
    postcode: enquiry.postcode,
    address: enquiry.address,
    submissionDate: new Date().toISOString().split('T')[0],
    category: enquiry.enquiryType === 'Mortgage' ? 'Mortgages' : 'Protection',
    lender: enquiry.preferredLender,
    mortgageType: enquiry.mortgageType,
    ltv: enquiry.propertyValue > 0 ? (enquiry.loanAmount / enquiry.propertyValue * 100).toFixed(1) : 0,
    productStartDate: '',
    productEndDate: '',
    currentStage: 'application-submitted',
    stageHistory: [
      {
        stage: 'initial-enquiry',
        date: enquiry.enquiryDate,
        notes: `Converted from enquiry ${enquiry.id}: ${enquiry.notes}`
      },
      {
        stage: 'application-submitted',
        date: new Date().toISOString().split('T')[0],
        notes: 'Application submitted after initial enquiry'
      }
    ],
    loanAmount: enquiry.loanAmount,
    propertyValue: enquiry.propertyValue,
    employmentStatus: enquiry.employmentStatus,
    annualIncome: enquiry.annualIncome,
    documents: {
      payslips: 'pending',
      bankStatements: 'pending',
      idDocument: 'pending',
      proofOfAddress: 'pending'
    }
  }
  
  return customerData
}
