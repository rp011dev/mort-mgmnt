'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { useUser } from '../../../context/UserContext'
import { useAuth } from '../../../hooks/useAuth'
import ConfirmModal from '../../../components/ConfirmModal'
import NotificationToast from '../../../components/NotificationToast'
import CustomerDocuments from '../../../components/CustomerDocuments'
import { 
  FEE_TYPES, 
  FEE_STATUSES, 
  formatCurrency, 
  formatDate, 
  formatDateTime, 
  getStatusBadgeClass, 
  getFeesSummary 
} from '../../../utils/feesManager'

export default function CustomerDetail() {
  const { user, loading: authLoading, logout } = useAuth()
  const params = useParams()
  const router = useRouter()
  const customerId = params.id
  const { currentUser } = useUser()
  const [customer, setCustomer] = useState(null)
  const [customerNotes, setCustomerNotes] = useState([])
  const [customerProducts, setCustomerProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [isEditing, setIsEditing] = useState(false)
  const [editFormData, setEditFormData] = useState({})
  const [saving, setSaving] = useState(false)
  const [newNote, setNewNote] = useState('')
  const [addingNote, setAddingNote] = useState(false)
  const [linkedEnquiries, setLinkedEnquiries] = useState([])
  const [loadingEnquiries, setLoadingEnquiries] = useState(false)
  
  // Timeline pagination states
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalNotes, setTotalNotes] = useState(0)
  const [loadingNotes, setLoadingNotes] = useState(false)
  const notesPerPage = 10
  
  // Stage History states
  const [stageHistory, setStageHistory] = useState([])
  const [paginatedStageHistory, setPaginatedStageHistory] = useState([])
  const [stageCurrentPage, setStageCurrentPage] = useState(1)
  const [stageTotalPages, setStageTotalPages] = useState(1)
  const [totalStages, setTotalStages] = useState(0)
  const [loadingStageHistory, setLoadingStageHistory] = useState(false)
  const [currentStageCustomers, setCurrentStageCustomers] = useState([])
  const [customerCurrentStage, setCustomerCurrentStage] = useState(null)
  const stagesPerPage = 15 // Show 15 stages per page

  // Update paginated history when page changes
  useEffect(() => {
    if (stageHistory.length > 0) {
      const startIndex = (stageCurrentPage - 1) * stagesPerPage
      const endIndex = startIndex + stagesPerPage
      setPaginatedStageHistory(stageHistory.slice(startIndex, endIndex))
    }
  }, [stageCurrentPage, stageHistory, stagesPerPage])
  
  // Product management states
  const [addingProduct, setAddingProduct] = useState(false)
  const [editingProduct, setEditingProduct] = useState(null)
  const [newProductData, setNewProductData] = useState({})
  const [productFormData, setProductFormData] = useState({})
  const [savingProduct, setSavingProduct] = useState(false)

  // Meeting scheduling states
  const [showMeetingModal, setShowMeetingModal] = useState(false)
  const [meetingType, setMeetingType] = useState('')
  const [meetingData, setMeetingData] = useState({
    subject: '',
    date: '',
    time: '',
    duration: '30',
    agenda: '',
    location: '',
    attendees: '',
    notes: ''
  })

  // Fees management states
  const [customerFees, setCustomerFees] = useState([])
  const [loadingFees, setLoadingFees] = useState(false)
  const [addingFee, setAddingFee] = useState(false)
  const [editingFee, setEditingFee] = useState(null)
  const [showPaymentMethodModal, setShowPaymentMethodModal] = useState(false)
  const [selectedFeeForPayment, setSelectedFeeForPayment] = useState(null)
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState('Bank Transfer')
  const [changingFeeStatus, setChangingFeeStatus] = useState(null)
  const [newFeeData, setNewFeeData] = useState({
    type: '',
    amount: '',
    status: 'UNPAID',
    dueDate: '',
    description: '',
    paymentMethod: '',
    reference: ''
  })
  const [savingFee, setSavingFee] = useState(false)

  // Document upload states
  const [uploadingDocument, setUploadingDocument] = useState(null)
  const [uploadProgress, setUploadProgress] = useState({})
  const [customerDocuments, setCustomerDocuments] = useState({})
  const [loadingDocuments, setLoadingDocuments] = useState(false)
  const [showUploadModal, setShowUploadModal] = useState(false)
  const [selectedFiles, setSelectedFiles] = useState([])
  const [selectedDocumentType, setSelectedDocumentType] = useState('')
  const [deletingDocument, setDeletingDocument] = useState(null)

  // Joint customer holder states
  const [jointHolders, setJointHolders] = useState([])
  const [showJointHolderModal, setShowJointHolderModal] = useState(false)
  const [editingJointHolder, setEditingJointHolder] = useState(null)
  const [jointHolderFormData, setJointHolderFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    dateOfBirth: '',
    address: '',
    postcode: '',
    employmentStatus: 'employed',
    annualIncome: 0
  })
  const [savingJointHolder, setSavingJointHolder] = useState(false)

  // Modern modal states
  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    title: '',
    message: '',
    details: '',
    type: 'danger',
    onConfirm: () => {},
    confirmText: 'Confirm',
    cancelText: 'Cancel'
  })
  
  const [notification, setNotification] = useState({
    isOpen: false,
    message: '',
    type: 'info',
    title: ''
  })

  const paymentMethods = [
    'Bank Transfer',
    'Credit Card',
    'Debit Card',
    'Cash',
    'Cheque',
    'Direct Debit',
    'Standing Order',
    'PayPal',
    'Other'
  ]

  const stages = [
    'initial-enquiry-assessment',
    'document-verification',
    'decision-in-principle',
    'application-submitted-lender',
    'case-submitted-network',
    'offer-generated',
    'solicitor-initial-quote-issued',
    'solicitor-quote-accepted-fee-paid',
    'solicitor-initial-search-legal-enquiries',
    'solicitor-contracts-prepared',
    'exchange-completion'
  ]

  const stageDisplayNames = {
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

  // Helper function to get document type icon and display info
  const getDocumentTypeInfo = (docType) => {
    const documentTypes = {
      payslips: {
        icon: 'bi-file-earmark-text',
        color: 'text-success',
        title: 'Payslips',
        description: 'Recent payslip documents'
      },
      bankStatements: {
        icon: 'bi-bank',
        color: 'text-primary',
        title: 'Bank Statements',
        description: 'Bank statement documents'
      },
      idDocument: {
        icon: 'bi-person-badge',
        color: 'text-warning',
        title: 'ID Document',
        description: 'Identity verification documents (Passport, Driving License)'
      },
      proofOfAddress: {
        icon: 'bi-house-door',
        color: 'text-info',
        title: 'Proof of Address',
        description: 'Address verification documents (Utility bills, Council tax)'
      },
      employmentContract: {
        icon: 'bi-briefcase',
        color: 'text-secondary',
        title: 'Employment Contract',
        description: 'Employment contract documents'
      },
      SA302: {
        icon: 'bi-calculator',
        color: 'text-danger',
        title: 'SA302 Tax Calculation',
        description: 'Self-assessment tax calculation documents'
      },
      P60: {
        icon: 'bi-receipt',
        color: 'text-dark',
        title: 'P60 End of Year Certificate',
        description: 'Annual income and tax certificate'
      }
    }

    return documentTypes[docType] || {
      icon: 'bi-file-earmark',
      color: 'text-secondary',
      title: docType.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase()),
      description: 'Document file'
    }
  }

  useEffect(() => {
    loadCustomer()
    loadNotes()
    loadProducts()
    loadFees()
    loadCustomerDocuments()
    loadStageHistory()
  }, [customerId])

  const loadStageHistory = async () => {
    try {
      setLoadingStageHistory(true)
      //console.log('Loading stage history for customer:', customerId)
      
      const response = await fetch(`/api/stage-history/${customerId}`)
      const data = await response.json()
      
      if (!response.ok) {
        console.error('Stage history API error:', data)
        throw new Error(data.error || 'Failed to load stage history')
      }
      
      //console.log('Stage history loaded:', data)
      
      const { customerHistory, stageCustomers, currentStage } = data
      const history = customerHistory || []
      setStageHistory(history)
      setCurrentStageCustomers(stageCustomers || [])
      setCustomerCurrentStage(currentStage)
      setTotalStages(history.length)
      
      // Calculate total pages
      const totalPages = Math.ceil(history.length / stagesPerPage)
      setStageTotalPages(totalPages)
      
      // Set initial paginated data
      const startIndex = (stageCurrentPage - 1) * stagesPerPage
      const endIndex = startIndex + stagesPerPage
      setPaginatedStageHistory(history.slice(startIndex, endIndex))
      
      // console.log('Stage history state updated:', {
      //   customerHistory: history,
      //   stageCustomers,
      //   currentStage,
      //   totalStages: history.length,
      //   totalPages,
      //   paginatedHistory: history.slice(startIndex, endIndex)
      // })
    } catch (error) {
      console.error('Error loading stage history:', error)
      showNotification(
        error.message || 'Failed to load stage history',
        'error',
        'Stage History Error'
      )
    } finally {
      setLoadingStageHistory(false)
    }
  }

  const loadCustomer = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/customers?customerId=${customerId}`)
      if (!response.ok) {
        throw new Error('Customer not found')
      }
      const data = await response.json()
      setCustomer(data)
      setEditFormData(data)
      
      // Initialize joint holders from customer data
      setJointHolders(data.jointHolders || [])
      
      // Load linked enquiries after customer data is loaded
      loadLinkedEnquiriesWithCustomerData(data)
    } catch (error) {
      console.error('Error loading customer:', error)
      setError(error.message)
    } finally {
      setLoading(false)
    }
  }

  const loadProducts = async () => {
    try {
      const response = await fetch(`/api/products?customerId=${customerId}`)
      if (response.ok) {
        const data = await response.json()
        // API might return an array directly or an object with a products/items field
        const products = Array.isArray(data)
          ? data
          : (data.products || data.items || data.data || [])
        setCustomerProducts(products)
      } else {
        console.error('Failed to load products:', response.status, await response.text())
      }
    } catch (error) {
      console.error('Error loading products:', error)
    }
  }

  const loadFees = async () => {
    try {
      setLoadingFees(true)
      const response = await fetch(`/api/fees?customerId=${customerId}`)
      if (response.ok) {
        const fees = await response.json()
        setCustomerFees(fees)
      }
    } catch (error) {
      console.error('Error loading fees:', error)
    } finally {
      setLoadingFees(false)
    }
  }

  const loadCustomerDocuments = async () => {
    try {
      setLoadingDocuments(true)
      const response = await fetch(`/api/documents/list/${customerId}`)
      if (response.ok) {
        const result = await response.json()
        setCustomerDocuments(result.documents || {})
      }
    } catch (error) {
      console.error('Error loading customer documents:', error)
    } finally {
      setLoadingDocuments(false)
    }
  }

  // Helper functions for modern modals
  const showNotification = (message, type = 'info', title = '') => {
    setNotification({
      isOpen: true,
      message,
      type,
      title
    })
  }

  const showConfirmation = (title, message, onConfirm, options = {}) => {
    setConfirmModal({
      isOpen: true,
      title,
      message,
      details: options.details || '',
      type: options.type || 'danger',
      onConfirm,
      confirmText: options.confirmText || 'Confirm',
      cancelText: options.cancelText || 'Cancel'
    })
  }

  const closeConfirmModal = () => {
    setConfirmModal(prev => ({ ...prev, isOpen: false }))
  }

  const closeNotification = () => {
    setNotification(prev => ({ ...prev, isOpen: false }))
  }

  const viewDocument = (documentType, fileName) => {
    try {
      const viewUrl = `/api/documents/view/${customerId}/${documentType}?fileName=${encodeURIComponent(fileName)}`
      
      // Open in new tab/window for viewing
      const newWindow = window.open(viewUrl, '_blank')
      
      // Check if popup was blocked
      if (!newWindow) {
        showNotification(
          'Please allow popups for this site to view documents in a new tab',
          'warning',
          'Popup Blocked'
        )
        // Fallback: navigate in same tab
        window.location.href = viewUrl
      }
      
    } catch (error) {
      console.error('Error viewing document:', error)
      showNotification(
        `Failed to open document: ${error.message}`,
        'error',
        'View Failed'
      )
    }
  }

  const downloadDocument = (documentType, fileName) => {
    try {
      const downloadUrl = `/api/documents/view/${customerId}/${documentType}?fileName=${encodeURIComponent(fileName)}&download=true`
      
      // Create a temporary link element for download
      const link = document.createElement('a')
      link.href = downloadUrl
      link.download = fileName
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      
      showNotification(
        `Download started for "${fileName}"`,
        'success',
        'Download Started'
      )
      
    } catch (error) {
      console.error('Error downloading document:', error)
      showNotification(
        `Failed to download document: ${error.message}`,
        'error',
        'Download Failed'
      )
    }
  }

  const deleteDocument = async (documentType, fileName) => {
    const documentKey = `${documentType}-${fileName}`
    
    const confirmDelete = () => {
      performDeleteDocument(documentType, fileName, documentKey)
      closeConfirmModal()
    }

    showConfirmation(
      'Delete Document',
      'This action cannot be undone. Are you sure you want to delete this document?',
      confirmDelete,
      {
        type: 'danger',
        confirmText: 'Delete Document',
        cancelText: 'Keep Document',
        details: `File: ${fileName}\nType: ${documentType.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}`
      }
    )
  }

  const performDeleteDocument = async (documentType, fileName, documentKey) => {
    try {
      setDeletingDocument(documentKey)
      
      const response = await fetch(`/api/documents/delete?customerId=${customerId}&documentType=${documentType}&fileName=${encodeURIComponent(fileName)}`, {
        method: 'DELETE'
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to delete document')
      }

      const result = await response.json()
      
      // Clear any previous errors
      setError('')
      
      // Show success notification
      showNotification(
        `Document "${fileName}" has been deleted successfully`,
        'success',
        'Document Deleted'
      )
      
      // Reload documents list to reflect changes
      await loadCustomerDocuments()
      
    } catch (error) {
      console.error('Error deleting document:', error)
      
      // Set error state for user feedback
      setError(`Failed to delete document "${fileName}": ${error.message}`)
      
      // Show error notification
      showNotification(
        `Failed to delete document "${fileName}": ${error.message}`,
        'error',
        'Delete Failed'
      )
    } finally {
      setDeletingDocument(null)
    }
  }

  const loadNotes = async (page = currentPage) => {
    try {
      setLoadingNotes(true)
      const response = await fetch(`/api/notes?customerId=${customerId}&page=${page}&limit=${notesPerPage}&sortOrder=desc`)
      if (response.ok) {
        const data = await response.json()
        setCustomerNotes(data.notes)
        setTotalPages(data.pagination.totalPages)
        setTotalNotes(data.pagination.totalNotes)
        setCurrentPage(data.pagination.currentPage)
      }
    } catch (error) {
      console.error('Error loading notes:', error)
    } finally {
      setLoadingNotes(false)
    }
  }

  const loadLinkedEnquiries = async () => {
    if (!customer) return
    loadLinkedEnquiriesWithCustomerData(customer)
  }

  const loadLinkedEnquiriesWithCustomerData = async (customerData) => {
    try {
      setLoadingEnquiries(true)
      //console.log('Loading enquiries for customer:', customerData)
      //console.log('Customer ID:', customerId)
      
      // Request all enquiries with a high limit to get all records
      const response = await fetch(`/api/enquiries?limit=1000`)
      if (response.ok) {
        const responseData = await response.json()
        // The API returns an object with enquiries array when paginated
        const allEnquiries = responseData.enquiries || responseData
        //console.log('All enquiries:', allEnquiries)
        
        // Filter enquiries that are linked to this customer
        const customerEnquiries = allEnquiries.filter(enquiry => {
          const matchesCustomerId = enquiry.customerId === customerId
          const matchesName = enquiry.firstName?.toLowerCase() === customerData?.firstName?.toLowerCase() && 
                             enquiry.lastName?.toLowerCase() === customerData?.lastName?.toLowerCase()
          const matchesEmail = enquiry.email?.toLowerCase() === customerData?.email?.toLowerCase()

          //console.log(`Enquiry ${enquiry.id}:`, {
          //  matchesCustomerId,
          //  matchesName,
          //  matchesEmail,
          //  enquiryCustomerId: enquiry.customerId,
          //  currentCustomerId: customerId,
          //  enquiryEmail: enquiry.email?.toLowerCase(),
          //  customerEmail: customerData?.email?.toLowerCase()
          //})

          return matchesCustomerId || matchesName || matchesEmail
        })
        
        //console.log('Filtered customer enquiries:', customerEnquiries)
        setLinkedEnquiries(customerEnquiries)
      }
    } catch (error) {
      console.error('Error loading linked enquiries:', error)
    } finally {
      setLoadingEnquiries(false)
    }
  }

  const handleEdit = () => {
    setIsEditing(true)
    setEditFormData(customer)
  }

  const handleCancelEdit = () => {
    setIsEditing(false)
    setEditFormData(customer)
  }

  const handleSaveEdit = async () => {
    try {
      setSaving(true)
      const response = await fetch(`/api/customers`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          customerId: customerId,
          updates: editFormData
        })
      })

      if (!response.ok) {
        throw new Error('Failed to update customer')
      }

      const updatedCustomer = await response.json()
      setCustomer(updatedCustomer)
      setIsEditing(false)
    } catch (error) {
      console.error('Error updating customer:', error)
      setError('Failed to update customer')
    } finally {
      setSaving(false)
    }
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setEditFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const moveToStage = async (newStage, direction) => {
    try {
      // First update the customer's current stage
      const customerResponse = await fetch(`/api/customers`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          customerId: customerId,
          updates: {
            currentStage: newStage
          }
        })
      })

      if (!customerResponse.ok) {
        throw new Error('Failed to update stage')
      }

      // Then add a new stage history entry
      const token = localStorage.getItem('token')
      const stageHistoryResponse = await fetch(`/api/stage-history/${customerId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          stage: newStage,
          previousStage: customer.currentStage,
          direction: direction,
          notes: `Stage moved ${direction} via customer management`
        })
      })

      if (!stageHistoryResponse.ok) {
        throw new Error('Failed to update stage history')
      }

      // Get the updated stage history data
      const stageHistoryData = await stageHistoryResponse.json()
      
      // Update customer and stage history state directly
      setCustomer(prev => ({
        ...prev,
        currentStage: newStage
      }))
      
      const history = stageHistoryData.customerHistory || []
      setStageHistory(history)
      setCustomerCurrentStage(stageHistoryData.currentStage)
      setTotalStages(history.length)
      
      // Calculate total pages
      const totalPages = Math.ceil(history.length / stagesPerPage)
      setStageTotalPages(totalPages)
      
      // Reset to first page when new entry is added
      setStageCurrentPage(1)
      
      // Set paginated data for first page
      const startIndex = 0
      const endIndex = stagesPerPage
      setPaginatedStageHistory(history.slice(startIndex, endIndex))

      showNotification(
        `Stage moved ${direction} successfully`,
        'success',
        'Stage Updated'
      )

    } catch (error) {
      console.error('Error updating stage:', error)
      showNotification(
        'Failed to update stage',
        'error',
        'Stage Update Error'
      )
    }
  }

  const handleDocumentStatusChange = async (docType, newStatus) => {
    try {
      const updatedDocuments = {
        ...customer.documents,
        [docType]: newStatus
      }

      const response = await fetch(`/api/customers`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          customerId: customerId,
          updates: {
            documents: updatedDocuments
          }
        })
      })

      if (!response.ok) {
        throw new Error('Failed to update document status')
      }

      const updatedCustomer = await response.json()
      setCustomer(updatedCustomer)
      
    } catch (error) {
      console.error('Error updating document status:', error)
      setError('Failed to update document status')
    }
  }

  const handleDocumentUpload = async (docType, files) => {
    if (!files || files.length === 0) return

    try {
      setUploadingDocument(docType)
      setUploadProgress({ ...uploadProgress, [docType]: 0 })

      const uploadPromises = Array.from(files).map(async (file, index) => {
        const formData = new FormData()
        formData.append('file', file)
        formData.append('customerId', customerId)
        formData.append('documentType', docType)

        const response = await fetch('/api/documents/upload', {
          method: 'POST',
          body: formData,
        })

        if (!response.ok) {
          throw new Error(`Failed to upload ${file.name}`)
        }

        // Update progress
        const progress = Math.round(((index + 1) / files.length) * 100)
        setUploadProgress({ ...uploadProgress, [docType]: progress })

        return await response.json()
      })

      await Promise.all(uploadPromises)
      
      // Update document status to 'received' after successful upload
      await handleDocumentStatusChange(docType, 'received')
      
      // Reload documents list
      await loadCustomerDocuments()
      
      setUploadProgress({ ...uploadProgress, [docType]: 100 })
      
      // Show success message
      setError('')
      showNotification(
        `${files.length} ${docType.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())} file(s) uploaded successfully!`,
        'success',
        'Upload Complete'
      )
      
    } catch (error) {
      console.error('Error uploading documents:', error)
      setError(`Failed to upload ${docType}: ${error.message}`)
    } finally {
      setUploadingDocument(null)
      setTimeout(() => {
        setUploadProgress({ ...uploadProgress, [docType]: undefined })
      }, 2000)
    }
  }

  const handleFileSelection = (files) => {
    setSelectedFiles(Array.from(files))
    setShowUploadModal(true)
  }

  const confirmUpload = async () => {
    if (!selectedDocumentType || selectedFiles.length === 0) return

    await handleDocumentUpload(selectedDocumentType, selectedFiles)
    
    // Reset modal state
    setShowUploadModal(false)
    setSelectedFiles([])
    setSelectedDocumentType('')
  }

  const cancelUpload = () => {
    setShowUploadModal(false)
    setSelectedFiles([])
    setSelectedDocumentType('')
  }

  const handleDragOver = (e) => {
    e.preventDefault()
    e.stopPropagation()
  }

  const handleDragEnter = (e) => {
    e.preventDefault()
    e.stopPropagation()
  }

  const handleDragLeave = (e) => {
    e.preventDefault()
    e.stopPropagation()
  }

  const handleDrop = (e) => {
    e.preventDefault()
    e.stopPropagation()
    
    const files = e.dataTransfer.files
    if (files && files.length > 0) {
      handleFileSelection(files)
    }
  }

  const addNote = async () => {
    if (!newNote.trim()) return

    try {
      setAddingNote(true)
      
      const token = localStorage.getItem('token')
      const response = await fetch(`/api/notes`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          customerId: customerId,
          note: newNote.trim(),
          stage: customer.currentStage
        })
      })

      if (!response.ok) {
        throw new Error('Failed to add note')
      }

      const savedNote = await response.json()
      setNewNote('')
      
      // Refresh notes to show the new note (will go to page 1 to show most recent)
      await handleNoteAdded()
    } catch (error) {
      console.error('Error adding note:', error)
      setError('Failed to add note')
    } finally {
      setAddingNote(false)
    }
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

  const getCurrentStageIndex = () => {
    return stages.indexOf(customer.currentStage)
  }

  const canMoveToPreviousStage = () => {
    return getCurrentStageIndex() > 0
  }

  const canMoveToNextStage = () => {
    return getCurrentStageIndex() < stages.length - 1
  }

  // Timeline pagination functions
  const handleNextPage = async () => {
    if (currentPage < totalPages) {
      const nextPage = currentPage + 1
      await loadNotes(nextPage)
    }
  }

  const handlePreviousPage = async () => {
    if (currentPage > 1) {
      const prevPage = currentPage - 1
      await loadNotes(prevPage)
    }
  }

  const refreshCurrentPage = async () => {
    await loadNotes(currentPage)
  }

  // Load first page when notes are added
    const handleNoteAdded = () => {
    setNewNote('')
    setAddingNote(false)
    // Refresh notes via API
    loadNotes(currentPage)
  }

  // Stage History pagination functions
  const updateStageHistoryPagination = (stageHistory) => {
    if (!stageHistory || stageHistory.length === 0) {
      setTotalStages(0)
      setStageTotalPages(1)
      setPaginatedStageHistory([])
      return
    }

    const reversedHistory = [...stageHistory].reverse()
    setTotalStages(reversedHistory.length)
    const totalPages = Math.ceil(reversedHistory.length / stagesPerPage)
    setStageTotalPages(totalPages)
    
    // Calculate current page items
    const startIndex = (stageCurrentPage - 1) * stagesPerPage
    const endIndex = startIndex + stagesPerPage
    const currentPageItems = reversedHistory.slice(startIndex, endIndex)
    setPaginatedStageHistory(currentPageItems)
  }

  const handleStageNextPage = () => {
    if (stageCurrentPage < stageTotalPages) {
      setStageCurrentPage(prev => prev + 1)
    }
  }

  const handleStagePreviousPage = () => {
    if (stageCurrentPage > 1) {
      setStageCurrentPage(prev => prev - 1)
    }
  }

  // Fee management functions
  const addFee = async () => {
    if (!newFeeData.type || !newFeeData.amount) {
      showNotification('Please fill in all required fields', 'warning', 'Missing Information')
      return
    }

    try {
      setSavingFee(true)
      const token = localStorage.getItem('token')
      const response = await fetch('/api/fees', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          customerId,
          ...newFeeData,
          amount: parseFloat(newFeeData.amount)
        }),
      })

      if (response.ok) {
        setNewFeeData({
          type: '',
          amount: '',
          status: 'UNPAID',
          dueDate: '',
          description: '',
          paymentMethod: '',
          reference: ''
        })
        setAddingFee(false)
        await loadFees()
      } else {
        const error = await response.json()
        showNotification(`Error: ${error.error}`, 'error', 'Add Fee Failed')
      }
    } catch (error) {
      console.error('Error adding fee:', error)
      showNotification('Failed to add fee', 'error', 'Add Fee Failed')
    } finally {
      setSavingFee(false)
    }
  }

  const updateFeeStatus = async (feeId, status, paymentMethod = null) => {
    try {
      const requestBody = {
        feeId,
        status,
        customerId,
        paymentMethod
      }
      
      // Add current timestamp for paid date if marking as PAID
      if (status === 'PAID') {
        requestBody.paidDate = new Date().toISOString()
      }

      const token = localStorage.getItem('token')
      const response = await fetch('/api/fees', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(requestBody),
      })

      if (response.ok) {
        await loadFees()
        showNotification('Fee updated successfully', 'success', 'Fee Updated')
      } else {
        const error = await response.json()
        showNotification(`Error: ${error.error}`, 'error', 'Update Fee Failed')
      }
    } catch (error) {
      console.error('Error updating fee:', error)
      showNotification('Failed to update fee', 'error', 'Update Fee Failed')
    }
  }

  const deleteFee = async (feeId) => {
    const fee = customerFees.find(f => f.feeId === feeId)
    
    const confirmDelete = () => {
      performDeleteFee(feeId)
      closeConfirmModal()
    }

    showConfirmation(
      'Delete Fee',
      'This action cannot be undone. Are you sure you want to delete this fee?',
      confirmDelete,
      {
        type: 'danger',
        confirmText: 'Delete Fee',
        cancelText: 'Keep Fee',
        details: fee ? `Fee Type: ${fee.type}\nAmount: ${formatCurrency(fee.amount)}\nStatus: ${fee.status}` : `Fee ID: ${feeId}`
      }
    )
  }

  const performDeleteFee = async (feeId) => {
    try {
      const response = await fetch(`/api/fees?feeId=${feeId}&customerId=${customerId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        await loadFees()
        showNotification('Fee deleted successfully', 'success', 'Fee Deleted')
      } else {
        const error = await response.json()
        showNotification(`Error: ${error.error}`, 'error', 'Delete Fee Failed')
      }
    } catch (error) {
      console.error('Error deleting fee:', error)
      showNotification('Failed to delete fee', 'error', 'Delete Fee Failed')
    }
  }

  const handleFeeInputChange = (e) => {
    const { name, value } = e.target
    setNewFeeData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleStatusChange = (fee, newStatus) => {
    // Add changing animation
    setChangingFeeStatus(fee.feeId)
    
    if (newStatus === 'PAID' && fee.status !== 'PAID') {
      // Show payment method selection for new PAID status
      setSelectedFeeForPayment(fee)
      setSelectedPaymentMethod(fee.paymentMethod || 'Bank Transfer')
      setShowPaymentMethodModal(true)
    } else {
      // Direct status update for other changes
      updateFeeStatus(fee.feeId, newStatus, null)
    }
    
    // Remove animation after 600ms
    setTimeout(() => setChangingFeeStatus(null), 600)
  }

  const confirmPaymentMethod = () => {
    if (selectedFeeForPayment) {
      updateFeeStatus(selectedFeeForPayment.feeId, 'PAID', selectedPaymentMethod)
      setShowPaymentMethodModal(false)
      setSelectedFeeForPayment(null)
      // Remove changing animation after modal closes
      setTimeout(() => setChangingFeeStatus(null), 600)
    }
  }

  const cancelPaymentMethod = () => {
    setShowPaymentMethodModal(false)
    setSelectedFeeForPayment(null)
    setChangingFeeStatus(null)
  }

  // Product management functions
  const addProduct = async () => {
    try {
      setSavingProduct(true)
      
      const token = localStorage.getItem('token')
      const response = await fetch(`/api/products`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          customerId: customerId,
          ...newProductData
        })
      })

      if (!response.ok) {
        throw new Error('Failed to add product')
      }

      await loadProducts() // Reload products
      setAddingProduct(false)
      setNewProductData({})
    } catch (error) {
      console.error('Error adding product:', error)
      setError('Failed to add product')
    } finally {
      setSavingProduct(false)
    }
  }

  const saveProduct = async (index) => {
    try {
      setSavingProduct(true)
      
      const token = localStorage.getItem('token')
      const response = await fetch(`/api/products`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          customerId: customerId,
          productIndex: index,
          ...productFormData
        })
      })

      if (!response.ok) {
        throw new Error('Failed to update product')
      }

      await loadProducts() // Reload products
      setEditingProduct(null)
      setProductFormData({})
    } catch (error) {
      console.error('Error updating product:', error)
      setError('Failed to update product')
    } finally {
      setSavingProduct(false)
    }
  }

  const removeProduct = async (index) => {
    if (!confirm('Are you sure you want to remove this product?')) {
      return
    }

    try {
      const product = customerProducts[index]
      const response = await fetch(`/api/products?customerId=${customerId}&productIndex=${index}&productId=${product.productId}&version=${product._version}`, {
        method: 'DELETE'
      })

      if (!response.ok) {
        throw new Error('Failed to remove product')
      }

      await loadProducts() // Reload products
    } catch (error) {
      console.error('Error removing product:', error)
      setError('Failed to remove product')
    }
  }

  const startEditingProduct = (index) => {
    setEditingProduct(index)
    setProductFormData(customerProducts[index])
  }

  const cancelEditProduct = () => {
    setEditingProduct(null)
    setProductFormData({})
  }

  // Joint customer holder management functions
  const openJointHolderModal = (holderIndex = null) => {
    if (holderIndex !== null) {
      // Editing existing holder
      setEditingJointHolder(holderIndex)
      setJointHolderFormData(jointHolders[holderIndex])
    } else {
      // Adding new holder
      setEditingJointHolder(null)
      setJointHolderFormData({
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        dateOfBirth: '',
        address: '',
        postcode: '',
        employmentStatus: 'employed',
        annualIncome: 0
      })
    }
    setShowJointHolderModal(true)
  }

  const closeJointHolderModal = () => {
    setShowJointHolderModal(false)
    setEditingJointHolder(null)
    setJointHolderFormData({
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      dateOfBirth: '',
      address: '',
      postcode: '',
      employmentStatus: 'employed',
      annualIncome: 0
    })
  }

  const handleJointHolderFormChange = (field, value) => {
    setJointHolderFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const saveJointHolder = async () => {
    try {
      setSavingJointHolder(true)
      
      let updatedJointHolders = [...jointHolders]
      
      if (editingJointHolder !== null) {
        // Update existing holder
        updatedJointHolders[editingJointHolder] = jointHolderFormData
      } else {
        // Add new holder
        updatedJointHolders.push(jointHolderFormData)
      }
      
      // Update customer with joint holders
      const updatedCustomerData = {
        ...customer,
        jointHolders: updatedJointHolders
      }
      
      const response = await fetch('/api/customers', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          customerId: customerId,
          updates: { jointHolders: updatedJointHolders },
          version: customer._version
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to save joint holder')
      }

      const updatedCustomer = await response.json()
      setCustomer(updatedCustomer)
      setJointHolders(updatedJointHolders)
      closeJointHolderModal()
      
      showNotification(
        editingJointHolder !== null ? 'Joint holder updated successfully' : 'Joint holder added successfully',
        'success',
        'Joint Holder'
      )
    } catch (error) {
      console.error('Error saving joint holder:', error)
      showNotification(
        'Failed to save joint holder: ' + error.message,
        'error',
        'Joint Holder Error'
      )
    } finally {
      setSavingJointHolder(false)
    }
  }

  const removeJointHolder = async (holderIndex) => {
    if (!confirm('Are you sure you want to remove this joint holder?')) {
      return
    }

    try {
      const updatedJointHolders = jointHolders.filter((_, index) => index !== holderIndex)
      
      const response = await fetch('/api/customers', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          customerId: customerId,
          updates: { jointHolders: updatedJointHolders },
          version: customer._version
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to remove joint holder')
      }

      const updatedCustomer = await response.json()
      setCustomer(updatedCustomer)
      setJointHolders(updatedJointHolders)
      
      showNotification(
        'Joint holder removed successfully',
        'success',
        'Joint Holder'
      )
    } catch (error) {
      console.error('Error removing joint holder:', error)
      showNotification(
        'Failed to remove joint holder: ' + error.message,
        'error',
        'Joint Holder Error'
      )
    }
  }

  // Meeting Functions
  const openMeetingModal = (type) => {
    setMeetingType(type)
    
    // Set default values based on meeting type
    const defaultSubject = `${type === 'phone' ? 'Phone Call' : type === 'online' ? 'Online Meeting' : 'Face-to-Face Meeting'} - ${customer.firstName} ${customer.lastName}`
    const defaultAttendees = `${customer.email}`
    const defaultLocation = type === 'phone' ? 'Phone Call' : type === 'online' ? 'Online Video Call' : customer.address || 'Office - Location TBD'
    
    // Set default date/time
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    const defaultDate = tomorrow.toISOString().split('T')[0]
    const defaultTime = type === 'phone' ? '10:00' : type === 'online' ? '14:00' : '11:00'
    
    setMeetingData({
      subject: defaultSubject,
      date: defaultDate,
      time: defaultTime,
      duration: type === 'phone' ? '30' : type === 'online' ? '60' : '90',
      agenda: '',
      location: defaultLocation,
      attendees: defaultAttendees,
      notes: ''
    })
    
    setShowMeetingModal(true)
  }

  const closeMeetingModal = () => {
    setShowMeetingModal(false)
    setMeetingType('')
    setMeetingData({
      subject: '',
      date: '',
      time: '',
      duration: '30',
      agenda: '',
      location: '',
      attendees: '',
      notes: ''
    })
  }

  const handleMeetingDataChange = (field, value) => {
    setMeetingData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const createOutlookCalendarLink = (meetingData) => {
    const startDateTime = new Date(`${meetingData.date}T${meetingData.time}`)
    const endDateTime = new Date(startDateTime.getTime() + (parseInt(meetingData.duration) * 60000))
    
    // Format dates for Outlook desktop app (yyyyMMddTHHmmssZ)
    const formatDateForOutlook = (date) => {
      return date.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '')
    }
    
    // Format dates for Outlook web (ISO format)
    const formatDateForOutlookWeb = (date) => {
      return date.toISOString()
    }
    
    const body = `${meetingData.agenda ? `Agenda:\n${meetingData.agenda}\n\n` : ''}Customer Details:\n- Name: ${customer.firstName} ${customer.lastName}\n- Email: ${customer.email}\n- Phone: ${customer.phone}\n- Product: ${customer.category || 'N/A'}\n- Current Stage: ${customer.currentStage || 'N/A'}${meetingData.notes ? `\n\nAdditional Notes:\n${meetingData.notes}` : ''}`
    
    return {
      // Desktop Outlook protocol with send parameter
      desktop: `outlook://calendar/deeplink/compose?${new URLSearchParams({
        subject: meetingData.subject,
        startdt: formatDateForOutlook(startDateTime),
        enddt: formatDateForOutlook(endDateTime),
        location: meetingData.location,
        body: body,
        to: meetingData.attendees || customer.email,
        send: '1' // Auto-send the invite
      }).toString()}`,
      
      // Outlook Web App with attendees
      web: `https://outlook.live.com/calendar/0/deeplink/compose?${new URLSearchParams({
        subject: meetingData.subject,
        startdt: formatDateForOutlookWeb(startDateTime),
        enddt: formatDateForOutlookWeb(endDateTime),
        location: meetingData.location,
        body: body,
        to: meetingData.attendees || customer.email
      }).toString()}`,
      
      // Office 365 / Outlook Online with attendees
      office365: `https://outlook.office365.com/calendar/deeplink/compose?${new URLSearchParams({
        subject: meetingData.subject,
        startdt: formatDateForOutlookWeb(startDateTime),
        enddt: formatDateForOutlookWeb(endDateTime),
        location: meetingData.location,
        body: body,
        to: meetingData.attendees || customer.email
      }).toString()}`,
      
      // ICS file download as fallback
      ics: createICSFile(meetingData, startDateTime, endDateTime, body)
    }
  }

  // Send calendar invite via email
  const sendCalendarInviteEmail = async (meetingData) => {
    const startDateTime = new Date(`${meetingData.date}T${meetingData.time}`)
    const endDateTime = new Date(startDateTime.getTime() + (parseInt(meetingData.duration) * 60000))
    
    const icsContent = createICSFileContent(meetingData, startDateTime, endDateTime)
    
    try {
      const response = await fetch('/api/send-calendar-invite', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          to: meetingData.attendees || customer.email,
          subject: `Calendar Invite: ${meetingData.subject}`,
          meeting: {
            ...meetingData,
            startDateTime: startDateTime.toISOString(),
            endDateTime: endDateTime.toISOString(),
            customerName: `${customer.firstName} ${customer.lastName}`,
            customerEmail: customer.email,
            customerPhone: customer.phone
          },
          icsContent: icsContent
        })
      })

      if (!response.ok) {
        throw new Error('Failed to send calendar invite')
      }

      return await response.json()
    } catch (error) {
      console.error('Error sending calendar invite:', error)
      throw error
    }
  }

  const createICSFileContent = (meetingData, startDateTime, endDateTime) => {
    const formatDateForICS = (date) => {
      return date.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '') + 'Z'
    }
    
    const description = `${meetingData.agenda ? `Agenda: ${meetingData.agenda}\\n\\n` : ''}Customer Details:\\n- Name: ${customer.firstName} ${customer.lastName}\\n- Email: ${customer.email}\\n- Phone: ${customer.phone}\\n- Product: ${customer.category || 'N/A'}\\n- Current Stage: ${customer.currentStage || 'N/A'}${meetingData.notes ? `\\n\\nAdditional Notes: ${meetingData.notes}` : ''}`
    
    return [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//GK Finance//Mortgage Management System//EN',
      'METHOD:REQUEST',
      'BEGIN:VEVENT',
      `DTSTART:${formatDateForICS(startDateTime)}`,
      `DTEND:${formatDateForICS(endDateTime)}`,
      `DTSTAMP:${formatDateForICS(new Date())}`,
      `UID:${Date.now()}-${Math.random().toString(36).substr(2, 9)}@gkfinance.com`,
      `SUMMARY:${meetingData.subject}`,
      `DESCRIPTION:${description}`,
      `LOCATION:${meetingData.location}`,
      `ORGANIZER;CN=GK Finance:MAILTO:noreply@gkfinance.com`,
      `ATTENDEE;CN=${customer.firstName} ${customer.lastName};RSVP=TRUE:MAILTO:${customer.email}`,
      ...(meetingData.attendees && meetingData.attendees !== customer.email ? 
         meetingData.attendees.split(',').map(email => 
           `ATTENDEE;CN=${email.trim()};RSVP=TRUE:MAILTO:${email.trim()}`
         ) : []),
      'STATUS:CONFIRMED',
      'SEQUENCE:0',
      'PRIORITY:5',
      'CLASS:PUBLIC',
      'TRANSP:OPAQUE',
      'END:VEVENT',
      'END:VCALENDAR'
    ].join('\r\n')
  }

  const createICSFile = (meetingData, startDateTime, endDateTime, description) => {
    const icsContent = createICSFileContent(meetingData, startDateTime, endDateTime)
    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' })
    return URL.createObjectURL(blob)
  }

  const handleCreateAppointment = async (method = 'desktop') => {
    const outlookLinks = createOutlookCalendarLink(meetingData)
    
    try {
      if (method === 'email') {
        // Send calendar invite via email
        const result = await sendCalendarInviteEmail(meetingData)
        showNotification('Calendar invite sent successfully via email!', 'success', 'Email Sent')
        closeMeetingModal()
        return
      } else if (method === 'desktop') {
        // Try desktop Outlook first
        window.location.href = outlookLinks.desktop
      } else if (method === 'web') {
        // Open Outlook Web App
        window.open(outlookLinks.web, '_blank')
      } else if (method === 'office365') {
        // Open Office 365 Outlook
        window.open(outlookLinks.office365, '_blank')
      } else if (method === 'ics') {
        // Download ICS file
        const link = document.createElement('a')
        link.href = outlookLinks.ics
        link.download = `meeting-${customer.firstName}-${customer.lastName}-${meetingData.date}.ics`
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        URL.revokeObjectURL(outlookLinks.ics)
      }
      
      // Add a small delay before closing modal to ensure the action is triggered
      setTimeout(() => {
        closeMeetingModal()
      }, 500)
    } catch (error) {
      console.error('Error creating appointment:', error)
      showNotification(
        `Error creating appointment: ${error.message}. Please try the ICS download option or contact support.`,
        'error',
        'Appointment Error'
      )
    }
  }

  // Individual schedule functions for quick actions
  const schedulePhoneCall = () => {
    openMeetingModal('phone')
  }

  const scheduleOnlineMeeting = () => {
    openMeetingModal('online')
  }

  const scheduleFaceToFaceMeeting = () => {
    openMeetingModal('face-to-face')
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

  if (loading) {
    return (
      <div className="container mt-4">
        <div className="text-center">
          <div className="spinner-border" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="mt-2">Loading customer details...</p>
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
          <Link href="/customers" className="btn btn-primary">
            Back to Customer Management
          </Link>
        </div>
      </div>
    )
  }

  if (!customer) {
    return (
      <div className="container mt-4">
        <div className="alert alert-warning" role="alert">
          <h4 className="alert-heading">Customer Not Found</h4>
          <p>The customer you are looking for does not exist.</p>
          <hr />
          <Link href="/customers" className="btn btn-primary">
            Back to Customer Management
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="container mt-2">
      {/* Header */}
      <div className="d-flex flex-column flex-sm-row justify-content-between align-items-start align-items-sm-center mb-2 gap-1">
        <div>
          <h3 className="mb-0 small fw-bold">Customer Details</h3>
        </div>
        <div>
          <Link href="/customers" className="btn btn-outline-secondary btn-sm small">
            <i className="bi bi-arrow-left me-1"></i>Back
          </Link>
        </div>
      </div>

      <div className="row">
        <div className="col-lg-8 order-1 order-lg-1">
          {/* Customer Information */}
          <div className="card mb-2">
            <div className="card-header d-flex flex-column flex-sm-row justify-content-between align-items-start align-items-sm-center gap-1 py-1">
              <div>
                <h6 className="mb-0 fw-bold small">Customer Information - {customer.id}</h6>
              </div>
              <div className="d-flex flex-column flex-sm-row align-items-stretch align-items-sm-center gap-1">
                {!isEditing ? (
                  <button className="btn btn-sm btn-primary small" onClick={handleEdit}>
                    <i className="bi bi-pencil me-1"></i>
                    Edit
                  </button>
                ) : (
                  <>
                    <button 
                      className="btn btn-sm btn-success small" 
                      onClick={handleSaveEdit}
                      disabled={saving}
                    >
                      {saving ? 'Saving...' : 'Save'}
                    </button>
                    <button className="btn btn-sm btn-outline-secondary small" onClick={handleCancelEdit}>
                      Cancel
                    </button>
                  </>
                )}
              </div>
            </div>
            <div className="card-body py-1">
              {!isEditing ? (
                <div className="row g-1">
                  <div className="col-md-6">
                    <div className="small">
                      <div className="mb-2 detail-item">
                        <span className="detail-label">Name:</span> 
                        <span className="detail-value fw-semibold">{customer.firstName} {customer.lastName}</span>
                      </div>
                      <div className="mb-2 detail-item">
                        <span className="detail-label">Email:</span> 
                        <a href={`mailto:${customer.email}`} className="detail-value detail-link">{customer.email}</a>
                      </div>
                      <div className="mb-2 detail-item">
                        <span className="detail-label">Phone:</span> 
                        <a href={`tel:${customer.phone}`} className="detail-value detail-link">{customer.phone}</a>
                      </div>
                      {customer.dateOfBirth && (
                        <div className="mb-2 detail-item">
                          <span className="detail-label">Date of Birth:</span> 
                          <span className="detail-value">{new Date(customer.dateOfBirth).toLocaleDateString()}</span>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="small">
                      <div className="mb-2 detail-item">
                        <span className="detail-label">Account Type:</span> 
                        <span className="detail-value">
                          <span className={`badge ${customer.customerAccountType === 'Joint' ? 'bg-primary' : 'bg-secondary'}`}>
                            {customer.customerAccountType || 'Sole'}
                          </span>
                        </span>
                      </div>
                      <div className="mb-2 detail-item">
                        <span className="detail-label">Address:</span> 
                        <span className="detail-value">{customer.address}</span>
                      </div>
                      <div className="mb-2 detail-item">
                        <span className="detail-label">Postcode:</span> 
                        <span className="detail-value fw-semibold text-primary">{customer.postcode}</span>
                      </div>
                      <div className="mb-2 detail-item">
                        <span className="detail-label">Employment:</span> 
                        <span className="detail-value">{customer.employmentStatus}</span>
                      </div>
                      <div className="mb-2 detail-item">
                        <span className="detail-label">Annual Income:</span> 
                        <span className="detail-value fw-bold text-success">{formatCurrency(customer.annualIncome)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <form>
                  <h6 className="text-muted small fw-bold mb-1">Personal Details</h6>
                  <div className="row mb-1">
                    <div className="col-md-6">
                      <label className="form-label small mb-0">First Name</label>
                      <input
                        type="text"
                        className="form-control form-control-sm small"
                        name="firstName"
                        value={editFormData.firstName}
                        onChange={handleInputChange}
                      />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label small mb-0">Last Name</label>
                      <input
                        type="text"
                        className="form-control form-control-sm small"
                        name="lastName"
                        value={editFormData.lastName}
                        onChange={handleInputChange}
                      />
                    </div>
                  </div>
                  <div className="row mb-1">
                    <div className="col-md-6">
                      <label className="form-label small mb-0">Email</label>
                      <input
                        type="email"
                        className="form-control form-control-sm small"
                        name="email"
                        value={editFormData.email}
                        onChange={handleInputChange}
                      />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label small mb-0">Phone</label>
                      <input
                        type="tel"
                        className="form-control form-control-sm small"
                        name="phone"
                        value={editFormData.phone}
                        onChange={handleInputChange}
                      />
                    </div>
                  </div>
                  <div className="row mb-1">
                    <div className="col-md-6">
                      <label className="form-label small mb-0">Date of Birth</label>
                      <input
                        type="date"
                        className="form-control form-control-sm small"
                        name="dateOfBirth"
                        value={editFormData.dateOfBirth || ''}
                        onChange={handleInputChange}
                      />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label small mb-0">Account Type</label>
                      <select
                        className="form-select form-select-sm small"
                        name="customerAccountType"
                        value={editFormData.customerAccountType || 'Sole'}
                        onChange={handleInputChange}
                      >
                        <option value="Sole">Sole</option>
                        <option value="Joint">Joint</option>
                      </select>
                    </div>
                  </div>
                  <div className="mb-1">
                    <label className="form-label small mb-0">Address</label>
                    <textarea
                      className="form-control form-control-sm small"
                      name="address"
                      value={editFormData.address}
                      onChange={handleInputChange}
                      rows="1"
                    />
                  </div>
                  <div className="row mb-1">
                    <div className="col-md-4">
                      <label className="form-label small mb-0">Postcode</label>
                      <input
                        type="text"
                        className="form-control form-control-sm small"
                        name="postcode"
                        value={editFormData.postcode}
                        onChange={handleInputChange}
                      />
                    </div>
                    <div className="col-md-4">
                      <label className="form-label small mb-0">Employment Status</label>
                      <select
                        className="form-select form-select-sm small"
                        name="employmentStatus"
                        value={editFormData.employmentStatus}
                        onChange={handleInputChange}
                      >
                        <option value="employed">Employed</option>
                        <option value="self-employed">Self Employed</option>
                        <option value="retired">Retired</option>
                        <option value="unemployed">Unemployed</option>
                      </select>
                    </div>
                    <div className="col-md-4">
                      <label className="form-label small mb-0">Annual Income</label>
                      <input
                        type="number"
                        className="form-control form-control-sm small"
                        name="annualIncome"
                        value={editFormData.annualIncome}
                        onChange={handleInputChange}
                      />
                    </div>
                  </div>
                </form>
              )}
            </div>
          </div>

          {/* Joint Customer Holders */}
          <div className="card mb-2">
            <div className="card-header d-flex justify-content-between align-items-center py-1">
              <h6 className="mb-0 fw-bold small">Joint Account Holders</h6>
              {customer.customerAccountType === 'Joint' && (
                <button 
                  className="btn btn-sm btn-primary small"
                  onClick={() => openJointHolderModal()}
                >
                  <i className="bi bi-plus-circle me-1"></i>
                  Add Holder
                </button>
              )}
            </div>
            <div className="card-body py-1">
              {customer.customerAccountType === 'Joint' ? (
                jointHolders && jointHolders.length > 0 ? (
                  jointHolders.map((holder, index) => (
                    <div key={index} className="border rounded p-2 mb-2">
                      <div className="d-flex justify-content-between align-items-start mb-1">
                        <h6 className="mb-0 small fw-bold">{holder.firstName} {holder.lastName}</h6>
                        <div className="btn-group" role="group">
                          <button 
                            className="btn btn-sm btn-outline-secondary"
                            onClick={() => openJointHolderModal(index)}
                            title="Edit holder"
                          >
                            <i className="bi bi-pencil small"></i>
                          </button>
                          <button 
                            className="btn btn-sm btn-outline-danger"
                            onClick={() => removeJointHolder(index)}
                            title="Remove holder"
                          >
                            <i className="bi bi-trash small"></i>
                          </button>
                        </div>
                      </div>
                      
                      <div className="row small">
                        <div className="col-md-6">
                          <div className="mb-1 detail-item">
                            <span className="detail-label">Email:</span> 
                            <span className="detail-value">{holder.email || 'N/A'}</span>
                          </div>
                          <div className="mb-1 detail-item">
                            <span className="detail-label">Phone:</span> 
                            <span className="detail-value">{holder.phone || 'N/A'}</span>
                          </div>
                          {holder.dateOfBirth && (
                            <div className="mb-1 detail-item">
                              <span className="detail-label">DOB:</span> 
                              <span className="detail-value">{new Date(holder.dateOfBirth).toLocaleDateString()}</span>
                            </div>
                          )}
                        </div>
                        <div className="col-md-6">
                          <div className="mb-1 detail-item">
                            <span className="detail-label">Employment:</span> 
                            <span className="detail-value">{holder.employmentStatus || 'N/A'}</span>
                          </div>
                          <div className="mb-1 detail-item">
                            <span className="detail-label">Income:</span> 
                            <span className="detail-value fw-semibold text-success">{holder.annualIncome ? formatCurrency(holder.annualIncome) : 'N/A'}</span>
                          </div>
                          <div className="mb-1 detail-item">
                            <span className="detail-label">Address:</span> 
                            <span className="detail-value">{holder.address || 'N/A'}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-muted text-center py-2 small">
                    No joint account holders added yet. Click &quot;Add Holder&quot; to get started.
                  </div>
                )
              ) : (
                <div className="alert alert-info py-2 mb-0 small">
                  <i className="bi bi-info-circle me-2"></i>
                  Joint account holders are only available for Joint account types. 
                  To add joint holders, change the account type to &quot;Joint&quot; in the Customer Information section.
                </div>
              )}
            </div>
          </div>

          {/* Product Summary */}
          <div className="card mb-2">
            <div className="card-header d-flex justify-content-between align-items-center py-1">
              <h6 className="mb-0 fw-bold small">Product Summary</h6>
              <button 
                className="btn btn-sm btn-primary small"
                onClick={() => setAddingProduct(true)}
                disabled={addingProduct}
              >
                <i className="bi bi-plus-circle me-1"></i>
                Add
              </button>
            </div>
            <div className="card-body py-1">
              {/* Existing Products */}
              {customerProducts && customerProducts.length > 0 ? (
                customerProducts.map((product, index) => (
                  <div key={index} className="border rounded p-1 mb-1">
                    <div className="d-flex justify-content-between align-items-start mb-0">
                      <h6 className="mb-0 small fw-bold">{product.productReferenceNumber || `Product ${index + 1}`}</h6>
                      <div className="btn-group" role="group">
                        <button 
                          className="btn btn-sm btn-outline-secondary"
                          onClick={() => startEditingProduct(index)}
                        >
                          <i className="bi bi-pencil small"></i>
                        </button>
                        <button 
                          className="btn btn-sm btn-outline-danger"
                          onClick={() => removeProduct(index)}
                        >
                          <i className="bi bi-trash small"></i>
                        </button>
                      </div>
                    </div>
                    
                    {editingProduct === index ? (
                      // Edit Mode
                      <div>
                        <div className="row mb-1">
                          <div className="col-md-6">
                            <label className="form-label small">Product Reference</label>
                            <input
                              type="text"
                              className="form-control form-control-sm"
                              value={productFormData.productReferenceNumber || ''}
                              onChange={(e) => setProductFormData({...productFormData, productReferenceNumber: e.target.value})}
                            />
                          </div>
                          <div className="col-md-6">
                            <label className="form-label small">Category</label>
                            <select
                              className="form-select form-select-sm"
                              value={productFormData.category || ''}
                              onChange={(e) => setProductFormData({...productFormData, category: e.target.value})}
                            >
                              <option value="">Select Category</option>
                              <option value="Mortgages">Mortgages</option>
                              <option value="Insurance">Insurance</option>
                              <option value="Remortgage">Remortgage</option>
                              <option value="Buy to Let">Buy to Let</option>
                            </select>
                          </div>
                        </div>
                        <div className="row mb-1">
                          <div className="col-md-6">
                            <label className="form-label small">Lender</label>
                            <input
                              type="text"
                              className="form-control form-control-sm"
                              value={productFormData.lender || ''}
                              onChange={(e) => setProductFormData({...productFormData, lender: e.target.value})}
                            />
                          </div>
                          <div className="col-md-6">
                            <label className="form-label small">Mortgage Type</label>
                            <select
                              className="form-select form-select-sm"
                              value={productFormData.mortgageType || ''}
                              onChange={(e) => setProductFormData({...productFormData, mortgageType: e.target.value})}
                            >
                              <option value="">Select Type</option>
                              <option value="LTD Company BTL">LTD Company BTL</option>
                              <option value="BTL">BTL</option>
                              <option value="First Time Buyer">First Time Buyer</option>
                              <option value="Home Mover">Home Mover</option>
                              <option value="Remortgage">Remortgage</option>
                              <option value="Product Transfer">Product Transfer</option>
                              <option value="Further Advance">Further Advance</option>
                              <option value="NA">N/A</option>
                            </select>
                          </div>
                        </div>
                        <div className="row mb-1">
                          <div className="col-md-6">
                            <label className="form-label small">LTV %</label>
                            <input
                              type="number"
                              step="0.1"
                              className="form-control form-control-sm"
                              value={productFormData.ltv || ''}
                              onChange={(e) => setProductFormData({...productFormData, ltv: parseFloat(e.target.value)})}
                            />
                          </div>
                          <div className="col-md-6">
                            <label className="form-label small">Rate of Interest (ROI) %</label>
                            <input
                              type="number"
                              step="0.01"
                              className="form-control form-control-sm"
                              value={productFormData.rateOfInterest || ''}
                              onChange={(e) => setProductFormData({...productFormData, rateOfInterest: parseFloat(e.target.value)})}
                              placeholder="e.g. 3.75"
                            />
                          </div>
                        </div>
                        <div className="row mb-1">
                          <div className="col-md-8">
                            <label className="form-label small">Property Address</label>
                            <textarea
                              className="form-control form-control-sm"
                              rows="1"
                              value={productFormData.propertyAddress || ''}
                              onChange={(e) => setProductFormData({...productFormData, propertyAddress: e.target.value})}
                              placeholder="Enter property address"
                            />
                          </div>
                          <div className="col-md-4">
                            <label className="form-label small">Property Postcode</label>
                            <input
                              type="text"
                              className="form-control form-control-sm"
                              value={productFormData.propertyPostcode || ''}
                              onChange={(e) => setProductFormData({...productFormData, propertyPostcode: e.target.value})}
                              placeholder="Enter postcode"
                            />
                          </div>
                        </div>
                        <div className="row mb-1">
                          <div className="col-md-4">
                            <label className="form-label small">Loan Amount</label>
                            <input
                              type="number"
                              className="form-control form-control-sm"
                              value={productFormData.loanAmount || ''}
                              onChange={(e) => setProductFormData({...productFormData, loanAmount: parseInt(e.target.value)})}
                            />
                          </div>
                          <div className="col-md-4">
                            <label className="form-label">Property Value</label>
                            <input
                              type="number"
                              className="form-control form-control-sm"
                              value={productFormData.propertyValue || ''}
                              onChange={(e) => setProductFormData({...productFormData, propertyValue: parseInt(e.target.value)})}
                            />
                          </div>
                          <div className="col-md-4">
                            <label className="form-label">Submission Date</label>
                            <input
                              type="date"
                              className="form-control form-control-sm"
                              value={productFormData.submissionDate || ''}
                              onChange={(e) => setProductFormData({...productFormData, submissionDate: e.target.value})}
                            />
                          </div>
                        </div>
                        <div className="row mb-3">
                          <div className="col-md-6">
                            <label className="form-label">Product Start Date</label>
                            <input
                              type="date"
                              className="form-control form-control-sm"
                              value={productFormData.productStartDate || ''}
                              onChange={(e) => setProductFormData({...productFormData, productStartDate: e.target.value})}
                            />
                          </div>
                          <div className="col-md-6">
                            <label className="form-label">Product End Date</label>
                            <input
                              type="date"
                              className="form-control form-control-sm"
                              value={productFormData.productEndDate || ''}
                              onChange={(e) => setProductFormData({...productFormData, productEndDate: e.target.value})}
                            />
                          </div>
                        </div>
                        <div className="d-flex gap-2">
                          <button 
                            className="btn btn-sm btn-success"
                            onClick={() => saveProduct(index)}
                            disabled={savingProduct}
                          >
                            {savingProduct ? 'Saving...' : 'Save'}
                          </button>
                          <button 
                            className="btn btn-sm btn-secondary"
                            onClick={() => cancelEditProduct()}
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      // View Mode
                      <div className="row small">
                        <div className="col-md-6">
                          <div className="mb-2 detail-item">
                            <span className="detail-label">Ref:</span> 
                            <span className="detail-value">{product.productReferenceNumber || 'N/A'}</span>
                          </div>
                          <div className="mb-2 detail-item">
                            <span className="detail-label">Category:</span> 
                            <span className="detail-value">{product.category || 'N/A'}</span>
                          </div>
                          <div className="mb-2 detail-item">
                            <span className="detail-label">Lender:</span> 
                            <span className="detail-value">{product.lender || 'N/A'}</span>
                          </div>
                          <div className="mb-2 detail-item">
                            <span className="detail-label">Type:</span> 
                            <span className="detail-value">{product.mortgageType || 'N/A'}</span>
                          </div>
                          <div className="mb-2 detail-item">
                            <span className="detail-label">Address:</span> 
                            <span className="detail-value">{product.propertyAddress || 'N/A'} {product.propertyPostcode && `(${product.propertyPostcode})`}</span>
                          </div>
                        </div>
                        <div className="col-md-6">
                          <div className="mb-2 detail-item">
                            <span className="detail-label">Loan:</span> 
                            <span className="detail-value fw-bold text-success">{product.loanAmount ? formatCurrency(product.loanAmount) : 'N/A'}</span>
                          </div>
                          <div className="mb-2 detail-item">
                            <span className="detail-label">Value:</span> 
                            <span className="detail-value fw-bold text-success">{product.propertyValue ? formatCurrency(product.propertyValue) : 'N/A'}</span>
                          </div>
                          <div className="mb-2 detail-item">
                            <span className="detail-label">LTV:</span> 
                            <span className="detail-value">{product.ltv ? `${product.ltv}%` : 'N/A'}</span>
                          </div>
                          <div className="mb-2 detail-item">
                            <span className="detail-label">ROI:</span> 
                            <span className="detail-value">{product.rateOfInterest ? `${product.rateOfInterest}%` : 'N/A'}</span>
                          </div>
                          <div className="mb-2 detail-item">
                            <span className="detail-label">Submitted:</span> 
                            <span className="detail-value">{product.submissionDate || 'N/A'}</span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ))
              ) : (
                <div className="text-muted text-center py-1 small">
                  No products added yet. Click Add to get started.
                </div>
              )}

              {/* Add New Product Form */}
              {addingProduct && (
                <div className="border rounded p-1 bg-light">
                  <h6 className="mb-1 small fw-bold">Add New Product</h6>
                  <div className="row mb-2">
                    <div className="col-md-6">
                      <label className="form-label">Product Reference</label>
                      <input
                        type="text"
                        className="form-control form-control-sm"
                        value={newProductData.productReferenceNumber || ''}
                        onChange={(e) => setNewProductData({...newProductData, productReferenceNumber: e.target.value})}
                      />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label">Category</label>
                      <select
                        className="form-select form-select-sm"
                        value={newProductData.category || ''}
                        onChange={(e) => setNewProductData({...newProductData, category: e.target.value})}
                      >
                        <option value="">Select Category</option>
                        <option value="Mortgages">Mortgages</option>
                        <option value="Insurance">Insurance</option>
                        <option value="Remortgage">Remortgage</option>
                        <option value="Buy to Let">Buy to Let</option>
                      </select>
                    </div>
                  </div>
                  <div className="row mb-2">
                    <div className="col-md-6">
                      <label className="form-label">Lender</label>
                      <input
                        type="text"
                        className="form-control form-control-sm"
                        value={newProductData.lender || ''}
                        onChange={(e) => setNewProductData({...newProductData, lender: e.target.value})}
                      />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label">Mortgage Type</label>
                      <select
                        className="form-select form-select-sm"
                        value={newProductData.mortgageType || ''}
                        onChange={(e) => setNewProductData({...newProductData, mortgageType: e.target.value})}
                      >
                        <option value="">Select Type</option>
                        <option value="LTD Company BTL">LTD Company BTL</option>
                        <option value="BTL">BTL</option>
                        <option value="First Time Buyer">First Time Buyer</option>
                        <option value="Home Mover">Home Mover</option>
                        <option value="Remortgage">Remortgage</option>
                        <option value="Product Transfer">Product Transfer</option>
                        <option value="Further Advance">Further Advance</option>
                        <option value="NA">N/A</option>
                      </select>
                    </div>
                  </div>
                  <div className="row mb-2">
                    <div className="col-md-6">
                      <label className="form-label">LTV %</label>
                      <input
                        type="number"
                        step="0.1"
                        className="form-control form-control-sm"
                        value={newProductData.ltv || ''}
                        onChange={(e) => setNewProductData({...newProductData, ltv: parseFloat(e.target.value)})}
                      />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label">Rate of Interest (ROI) %</label>
                      <input
                        type="number"
                        step="0.01"
                        className="form-control form-control-sm"
                        value={newProductData.rateOfInterest || ''}
                        onChange={(e) => setNewProductData({...newProductData, rateOfInterest: parseFloat(e.target.value)})}
                        placeholder="e.g. 3.75"
                      />
                    </div>
                  </div>
                  <div className="row mb-2">
                    <div className="col-md-8">
                      <label className="form-label">Property Address</label>
                      <textarea
                        className="form-control form-control-sm"
                        rows="2"
                        value={newProductData.propertyAddress || ''}
                        onChange={(e) => setNewProductData({...newProductData, propertyAddress: e.target.value})}
                        placeholder="Enter property address"
                      />
                    </div>
                    <div className="col-md-4">
                      <label className="form-label">Property Postcode</label>
                      <input
                        type="text"
                        className="form-control form-control-sm"
                        value={newProductData.propertyPostcode || ''}
                        onChange={(e) => setNewProductData({...newProductData, propertyPostcode: e.target.value})}
                        placeholder="Enter postcode"
                      />
                    </div>
                  </div>
                  <div className="row mb-2">
                    <div className="col-md-4">
                      <label className="form-label">Loan Amount</label>
                      <input
                        type="number"
                        className="form-control form-control-sm"
                        value={newProductData.loanAmount || ''}
                        onChange={(e) => setNewProductData({...newProductData, loanAmount: parseInt(e.target.value)})}
                      />
                    </div>
                    <div className="col-md-4">
                      <label className="form-label">Property Value</label>
                      <input
                        type="number"
                        className="form-control form-control-sm"
                        value={newProductData.propertyValue || ''}
                        onChange={(e) => setNewProductData({...newProductData, propertyValue: parseInt(e.target.value)})}
                      />
                    </div>
                    <div className="col-md-4">
                      <label className="form-label">Submission Date</label>
                      <input
                        type="date"
                        className="form-control form-control-sm"
                        value={newProductData.submissionDate || ''}
                        onChange={(e) => setNewProductData({...newProductData, submissionDate: e.target.value})}
                      />
                    </div>
                  </div>
                  <div className="row mb-3">
                    <div className="col-md-6">
                      <label className="form-label">Product Start Date</label>
                      <input
                        type="date"
                        className="form-control form-control-sm"
                        value={newProductData.productStartDate || ''}
                        onChange={(e) => setNewProductData({...newProductData, productStartDate: e.target.value})}
                      />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label">Product End Date</label>
                      <input
                        type="date"
                        className="form-control form-control-sm"
                        value={newProductData.productEndDate || ''}
                        onChange={(e) => setNewProductData({...newProductData, productEndDate: e.target.value})}
                      />
                    </div>
                  </div>
                  <div className="d-flex gap-2">
                    <button 
                      className="btn btn-sm btn-primary"
                      onClick={addProduct}
                      disabled={savingProduct}
                    >
                      {savingProduct ? 'Adding...' : 'Add Product'}
                    </button>
                    <button 
                      className="btn btn-sm btn-secondary"
                      onClick={() => {
                        setAddingProduct(false)
                        setNewProductData({})
                      }}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

   {/* Stage Management */}
          <div className="card mb-2">
            <div className="card-header py-1">
              <h6 className="mb-0 fw-bold small">Stage Management</h6>
            </div>
            <div className="card-body py-1">
              <div className="mb-1">
                <strong className="small">Stage:</strong>
                <span className={`badge stage-badge stage-${customer.currentStage} ms-1 small`}>
                  {stageDisplayNames[customer.currentStage]}
                </span>
              </div>
              
              <div className="mb-0">
                <strong className="small">Progress:</strong>
                <div className="progress mt-1" style={{height: '6px'}}>
                  <div 
                    className="progress-bar" 
                    role="progressbar" 
                    style={{width: `${getStageProgress(customer.currentStage)}%`}}
                  ></div>
                </div>
                <small className="text-muted">{getStageProgress(customer.currentStage)}%</small>
              </div>

              <div className="d-flex gap-2">
                {canMoveToPreviousStage() && (
                  <button
                    className="btn btn-outline-secondary"
                    onClick={() => moveToStage(stages[getCurrentStageIndex() - 1], 'backward')}
                  >
                    ← {stageDisplayNames[stages[getCurrentStageIndex() - 1]]}
                  </button>
                )}
                {canMoveToNextStage() && (
                  <button
                    className="btn btn-outline-primary"
                    onClick={() => moveToStage(stages[getCurrentStageIndex() + 1], 'forward')}
                  >
                    {stageDisplayNames[stages[getCurrentStageIndex() + 1]]} →
                  </button>
                )}
                {!canMoveToPreviousStage() && !canMoveToNextStage() && (
                  <div className="text-muted small">
                    <i className="bi bi-check-circle text-success me-1"></i>
                    Journey complete
                  </div>
                )}
              </div>
            </div>
          </div>

    

          {/* Customer Documents */}
          {/* Only one instance should remain below */}

       

          {/* Customer Documents */}
          <CustomerDocuments customerId={customer.id} />

          {/* Custom Document Table Actions: Add View/Delete buttons to each document row */}
          {/* If you use a custom table, add the following logic to your document table rendering: */}
          {/*
          <table>
            <thead>
              <tr>
                ...existing columns...
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {documents.map(doc => (
                <tr key={doc.id}>
                  ...existing cells...
                  <td>
                    <button className="btn btn-sm btn-outline-primary" onClick={() => window.open(doc.url, '_blank')}>View</button>
                    <button className="btn btn-sm btn-outline-danger ms-2" onClick={() => handleDelete(doc.id)}>Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          */}

      {/* Fees Summary */}
          <div className="card mb-2">
            <div className="card-header d-flex justify-content-between align-items-center py-1">
              <h6 className="mb-0 fw-bold small">Fees Summary</h6>
              <button 
                className="btn btn-sm btn-primary small"
                onClick={() => setAddingFee(true)}
                disabled={addingFee}
              >
                <i className="bi bi-plus-circle me-1"></i>
                Add
              </button>
            </div>
            <div className="card-body py-1">
              {loadingFees ? (
                <div className="text-center py-3">
                  <div className="spinner-border spinner-border-sm me-2" role="status">
                    <span className="visually-hidden">Loading...</span>
                  </div>
                  Loading fees...
                </div>
              ) : (
                <>
                  {/* Fees Summary Cards */}
                  {customerFees.length > 0 && (
                    <div className="row mb-2">
                      <div className="col-sm-6 col-lg-3">
                        <div className="card fee-summary-card paid">
                          <div className="card-body text-center py-1">
                            <h6 className="card-title text-success mb-0 small">Paid</h6>
                            <div className="text-success small fw-bold">{formatCurrency(getFeesSummary(customerFees).paidAmount)}</div>
                          </div>
                        </div>
                      </div>
                      <div className="col-sm-6 col-lg-3">
                        <div className="card fee-summary-card unpaid">
                          <div className="card-body text-center py-1">
                            <h6 className="card-title text-danger mb-0 small">Outstanding</h6>
                            <div className="text-danger small fw-bold">{formatCurrency(getFeesSummary(customerFees).unpaidAmount)}</div>
                          </div>
                        </div>
                      </div>
                      <div className="col-sm-6 col-lg-3">
                        <div className="card fee-summary-card na">
                          <div className="card-body text-center py-1">
                            <h6 className="card-title text-secondary mb-1">N/A</h6>
                            <h4 className="text-secondary mb-0">{formatCurrency(getFeesSummary(customerFees).naAmount)}</h4>
                          </div>
                        </div>
                      </div>
                      <div className="col-sm-6 col-lg-3">
                        <div className="card fee-summary-card total">
                          <div className="card-body text-center py-2">
                            <h6 className="card-title text-primary mb-1">Total Amount</h6>
                            <h4 className="text-primary mb-0">{formatCurrency(getFeesSummary(customerFees).totalAmount)}</h4>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Existing Fees */}
                  {customerFees && customerFees.length > 0 ? (
                    <div className="table-responsive">
                      <table className="table fees-table">
                        <thead>
                          <tr>
                            <th>Fee Type</th>
                            <th>Amount</th>
                            <th>Status</th>
                            <th>Due Date</th>
                            <th>Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {customerFees.map((fee) => {
                            const isOverdue = fee.status === 'UNPAID' && fee.dueDate && new Date(fee.dueDate) < new Date();
                            const tooltipContent = `Fee Type: ${fee.type} | Amount: ${formatCurrency(fee.amount, fee.currency)} | Status: ${fee.status} | Due: ${formatDate(fee.dueDate)} | Added: ${formatDate(fee.addedDate)} by ${fee.addedBy}${fee.description ? ` | Description: ${fee.description}` : ''}${fee.reference ? ` | Reference: ${fee.reference}` : ''}${fee.paidDate ? ` | Paid: ${formatDate(fee.paidDate)}` : ''}`;
                            
                            return (
                              <tr 
                                key={fee.feeId} 
                                className={`fee-row-tooltip ${isOverdue ? 'fee-row-overdue' : ''}`}
                                data-tooltip={tooltipContent}
                                style={{ cursor: 'help' }}
                              >
                                <td>
                                  <div className="d-flex align-items-center">
                                    <strong 
                                      title={`${fee.description || 'No description available'}\nAdded: ${formatDate(fee.addedDate)} by ${fee.addedBy}`}
                                      style={{cursor: 'help'}}
                                      className="me-2"
                                    >
                                      {fee.type}
                                    </strong>
                                    <span 
                                      className="fee-description-icon"
                                      title={`${fee.description || 'No description available'}\nAdded: ${formatDate(fee.addedDate)} by ${fee.addedBy}`}
                                    >
                                      i
                                    </span>
                                  </div>
                                </td>
                                <td>
                                  <div className="d-flex align-items-center">
                                    <strong className="me-2">{formatCurrency(fee.amount, fee.currency)}</strong>
                                    {fee.reference && (
                                      <span 
                                        className="fee-reference-icon"
                                        title={`Payment Reference: ${fee.reference}${fee.paidDate ? `\nPaid Date: ${formatDate(fee.paidDate)}` : ''}${fee.paymentMethod ? `\nPayment Method: ${fee.paymentMethod}` : ''}`}
                                      >
                                        i
                                      </span>
                                    )}
                                  </div>
                                </td>
                                <td>
                                  <select
                                    className={`form-select form-select-sm fee-status-dropdown fee-status-${fee.status.toLowerCase()} ${changingFeeStatus === fee.feeId ? 'fee-status-changing' : ''}`}
                                    value={fee.status}
                                    onChange={(e) => handleStatusChange(fee, e.target.value)}
                                  >
                                    <option value="PAID">PAID</option>
                                    <option value="UNPAID">UNPAID</option>
                                    <option value="NA">NA</option>
                                  </select>
                                </td>
                                <td>
                                  {formatDate(fee.dueDate)}
                                </td>
                                <td>
                                  <button 
                                    className="btn btn-sm btn-outline-danger fee-action-btn"
                                    onClick={() => deleteFee(fee.feeId)}
                                    title="Delete Fee"
                                  >
                                    <i className="bi bi-trash"></i>
                                  </button>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="text-center text-muted py-4">
                      <i className="bi bi-receipt display-6 mb-3"></i>
                      <p className="mb-0">No fees recorded for this customer.</p>
                    </div>
                  )}

                  {/* Add New Fee Form */}
                  {addingFee && (
                    <div className="border-top pt-3 mt-3">
                      <h6 className="mb-2 small fw-bold">Add New Fee</h6>
                      <div className="row mb-2">
                        <div className="col-md-6">
                          <label className="form-label small">Fee Type *</label>
                          <select
                            className="form-select form-select-sm"
                            name="type"
                            value={newFeeData.type}
                            onChange={handleFeeInputChange}
                          >
                            <option value="">Select Fee Type</option>
                            <option value={FEE_TYPES.APPLICATION}>Application Fee</option>
                            <option value={FEE_TYPES.SOLICITOR_REFERRAL}>Solicitor Referral Fee</option>
                            <option value={FEE_TYPES.MORTGAGE_PROCURATION}>Mortgage Procuration Fee</option>
                          </select>
                        </div>
                        <div className="col-md-3">
                          <label className="form-label small">Amount (£) *</label>
                          <input
                            type="number"
                            step="0.01"
                            className="form-control form-control-sm"
                            name="amount"
                            value={newFeeData.amount}
                            onChange={handleFeeInputChange}
                            placeholder="0.00"
                          />
                        </div>
                        <div className="col-md-3">
                          <label className="form-label small">Status</label>
                          <select
                            className="form-select form-select-sm"
                            name="status"
                            value={newFeeData.status}
                            onChange={handleFeeInputChange}
                          >
                            <option value={FEE_STATUSES.UNPAID}>Unpaid</option>
                            <option value={FEE_STATUSES.PAID}>Paid</option>
                            <option value={FEE_STATUSES.NA}>Not Applicable</option>
                          </select>
                        </div>
                      </div>
                      <div className="row mb-2">
                        <div className="col-md-4">
                          <label className="form-label small">Due Date</label>
                          <input
                            type="date"
                            className="form-control form-control-sm"
                            name="dueDate"
                            value={newFeeData.dueDate}
                            onChange={handleFeeInputChange}
                          />
                        </div>
                        <div className="col-md-4">
                          <label className="form-label small">Payment Method</label>
                          <select
                            className="form-select form-select-sm"
                            name="paymentMethod"
                            value={newFeeData.paymentMethod}
                            onChange={handleFeeInputChange}
                            disabled={newFeeData.status !== 'PAID'}
                          >
                            <option value="">Select Payment Method</option>
                            {paymentMethods.map(method => (
                              <option key={method} value={method}>{method}</option>
                            ))}
                          </select>
                        </div>
                        <div className="col-md-4">
                          <label className="form-label small">Reference</label>
                          <input
                            type="text"
                            className="form-control form-control-sm"
                            name="reference"
                            value={newFeeData.reference}
                            onChange={handleFeeInputChange}
                            placeholder="Auto-generated if empty"
                          />
                        </div>
                      </div>
                      <div className="mb-2">
                        <label className="form-label small">Description</label>
                        <textarea
                          className="form-control form-control-sm"
                          name="description"
                          value={newFeeData.description}
                          onChange={handleFeeInputChange}
                          rows="2"
                          placeholder="Optional description or notes about this fee"
                        />
                      </div>
                      <div className="d-flex gap-2">
                        <button 
                          className="btn btn-sm btn-primary"
                          onClick={addFee}
                          disabled={savingFee || !newFeeData.type || !newFeeData.amount}
                        >
                          {savingFee ? 'Adding...' : 'Add Fee'}
                        </button>
                        <button 
                          className="btn btn-sm btn-secondary"
                          onClick={() => {
                            setAddingFee(false)
                            setNewFeeData({
                              type: '',
                              amount: '',
                              status: 'UNPAID',
                              dueDate: '',
                              description: '',
                              paymentMethod: '',
                              reference: ''
                            })
                          }}
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>

          {/* Payment Method Modal */}
          {showPaymentMethodModal && (
            <div className="modal show d-block payment-modal-backdrop">
              <div className="modal-dialog modal-dialog-centered">
                <div className="modal-content payment-modal-content">
                  <div className="modal-header payment-modal-header">
                    <h5 className="modal-title">
                      <i className="bi bi-credit-card me-2"></i>
                      Select Payment Method
                    </h5>
                    <button 
                      type="button" 
                      className="btn-close btn-close-white" 
                      onClick={cancelPaymentMethod}
                    ></button>
                  </div>
                  <div className="modal-body payment-modal-body">
                    <div className="alert alert-success border-0" style={{background: 'linear-gradient(135deg, #d4edda 0%, #c3e6cb 100%)'}}>
                      <div className="d-flex align-items-center">
                        <i className="bi bi-check-circle-fill text-success me-3" style={{fontSize: '1.5rem'}}></i>
                        <div>
                          <strong>Marking fee as PAID</strong>
                          <div className="text-muted">Payment will be recorded with current timestamp</div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="row mb-3">
                      <div className="col-md-6">
                        <label className="form-label text-muted">Fee Type</label>
                        <div className="fw-bold">{selectedFeeForPayment?.type}</div>
                      </div>
                      <div className="col-md-6">
                        <label className="form-label text-muted">Amount</label>
                        <div className="fw-bold text-success" style={{fontSize: '1.25rem'}}>
                          {selectedFeeForPayment && formatCurrency(selectedFeeForPayment.amount)}
                        </div>
                      </div>
                    </div>
                    
                    <div className="mb-3">
                      <label className="form-label fw-semibold">Payment Method</label>
                      <select
                        className="form-select form-select-lg"
                        value={selectedPaymentMethod}
                        onChange={(e) => setSelectedPaymentMethod(e.target.value)}
                        style={{
                          border: '2px solid #e9ecef',
                          borderRadius: 'var(--radius-md)',
                          fontSize: '1rem',
                          fontWeight: '500'
                        }}
                      >
                        {paymentMethods.map(method => (
                          <option key={method} value={method}>{method}</option>
                        ))}
                      </select>
                    </div>
                    
                    <div className="alert alert-info border-0" style={{background: 'linear-gradient(135deg, #d1ecf1 0%, #bee5eb 100%)'}}>
                      <div className="d-flex align-items-center">
                        <i className="bi bi-info-circle-fill text-info me-3"></i>
                        <small>
                          <strong>Timestamp:</strong> Payment date will be automatically set to {new Date().toLocaleString('en-GB')}
                        </small>
                      </div>
                    </div>
                  </div>
                  <div className="modal-footer payment-modal-footer">
                    <button 
                      type="button" 
                      className="btn btn-secondary" 
                      onClick={cancelPaymentMethod}
                    >
                      <i className="bi bi-x-circle me-1"></i>
                      Cancel
                    </button>
                    <button 
                      type="button" 
                      className="btn btn-success btn-lg" 
                      onClick={confirmPaymentMethod}
                      style={{
                        background: 'linear-gradient(135deg, #28a745 0%, #20c997 100%)',
                        border: 'none',
                        fontWeight: '600'
                      }}
                    >
                      <i className="bi bi-check-circle-fill me-2"></i>
                      Confirm Payment
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          {/* Linked Enquiries */}
          <div className="card mb-2">
            <div className="card-header d-flex justify-content-between align-items-center py-1">
              <h6 className="mb-0 fw-bold small">Linked Enquiries</h6>
              <span className="badge bg-secondary small">{linkedEnquiries.length}</span>
            </div>
            <div className="card-body py-1">
              {loadingEnquiries ? (
                <div className="text-center py-3">
                  <div className="spinner-border spinner-border-sm me-2" role="status">
                    <span className="visually-hidden">Loading...</span>
                  </div>
                  Loading enquiries...
                </div>
              ) : linkedEnquiries.length > 0 ? (
                <div className="table-responsive">
                  <table className="table table-hover">
                    <thead className="table-light">
                      <tr>
                        <th>Enquiry ID</th>
                        <th>Type</th>
                        <th>Status</th>
                        <th>Date</th>
                        <th>Amount</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {linkedEnquiries.map((enquiry, index) => (
                        <tr key={enquiry.id || index}>
                          <td>
                            <Link href={`/enquiries/${enquiry.id}`} className="text-decoration-none">
                              <strong>{enquiry.id}</strong>
                            </Link>
                          </td>
                          <td>
                            <span className={`badge ${enquiry.enquiryType === 'Mortgage' ? 'bg-primary' : 'bg-info'}`}>
                              {enquiry.enquiryType || 'N/A'}
                            </span>
                          </td>
                          <td>
                            <span className={`badge ${
                              enquiry.status === 'open' ? 'bg-success' : 
                              enquiry.status === 'closed' ? 'bg-secondary' : 
                              enquiry.status === 'converted' ? 'bg-warning' : 'bg-light text-dark'
                            }`}>
                              {enquiry.status || 'Unknown'}
                            </span>
                          </td>
                          <td>
                            {enquiry.submissionDate ? 
                              new Date(enquiry.submissionDate).toLocaleDateString('en-GB') : 'N/A'}
                          </td>
                          <td>
                            {enquiry.loanAmount ? formatCurrency(enquiry.loanAmount) : 'N/A'}
                          </td>
                          <td>
                            <Link 
                              href={`/enquiries/${enquiry.id}`} 
                              className="btn btn-sm btn-outline-primary"
                            >
                              View
                            </Link>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center text-muted py-1 small">
                  <i className="bi bi-inbox display-6 mb-1"></i>
                  <p className="mb-0 small">No linked enquiries found.</p>
                </div>
              )}
            </div>
          </div>

          {/* Add Note */}
          <div className="card mb-2">
            <div className="card-header py-1">
              <h6 className="mb-0 fw-bold small">Add Note</h6>
            </div>
            <div className="card-body py-1">
              <div className="row mb-1">
                <div className="col-md-6">
                  <label className="form-label small mb-0">Author</label>
                  <div className="form-control-plaintext bg-light p-1 rounded small">
                    <i className="bi bi-person-circle me-1"></i>
                    <strong>{user ? user.name : 'Loading...'}</strong>
                    {user && (
                      <div className="text-muted small">
                        {user.role || 'User'}
                      </div>
                    )}
                  </div>
                </div>
                <div className="col-md-6">
                  <label className="form-label small mb-0">Current Stage</label>
                  <input
                    type="text"
                    className="form-control form-control-sm small"
                    value={stageDisplayNames[customer.currentStage]}
                    disabled
                  />
                </div>
              </div>
              <div className="mb-1">
                <label className="form-label small mb-0">Note</label>
                <textarea
                  className="form-control form-control-sm small"
                  rows="1"
                  placeholder="Add a note..."
                  value={newNote}
                  onChange={(e) => setNewNote(e.target.value)}
                />
              </div>
              <button
                className="btn btn-primary btn-sm small"
                onClick={addNote}
                disabled={!newNote.trim() || addingNote}
              >
                {addingNote ? 'Adding Note...' : 'Add Note'}
              </button>
            </div>
          </div>

          {/* Customer Journey Timeline */}
          <div className="card mb-2">
            <div className="card-header d-flex justify-content-between align-items-center py-1">
              <h6 className="mb-0 fw-bold small">Timeline</h6>
              <div className="d-flex align-items-center gap-1">
                <small className="text-muted">
                  {currentPage}/{totalPages} ({totalNotes})
                </small>
              </div>
            </div>
            <div className="card-body py-1">
              {loadingNotes ? (
                <div className="text-center py-1">
                  <div className="spinner-border spinner-border-sm me-1" role="status">
                    <span className="visually-hidden">Loading...</span>
                  </div>
                  Loading...
                </div>
              ) : (
                <div className="timeline">
                  {customerNotes && customerNotes.length > 0 ? (
                    customerNotes.map((note, index) => (
                      <div key={note.id || index} className="timeline-item mb-1" style={{fontSize: '0.75rem'}}>
                        <div className="d-flex align-items-center mb-0">
                          <div className="timeline-marker me-1">
                            <span className={`badge stage-badge stage-${note.stage}`} style={{fontSize: '0.65rem', padding: '0.1rem 0.4rem'}}>
                              {stageDisplayNames[note.stage] || note.stage}
                            </span>
                          </div>
                          <div className="fw-medium flex-grow-1" style={{fontSize: '0.7rem'}}>
                            {new Date(note.timestamp).toLocaleString('en-GB')}
                          </div>
                          <small className="text-muted" style={{fontSize: '0.65rem'}}>{note.author}</small>
                        </div>
                        <div className="w-100 ps-0" style={{fontSize: '0.7rem'}}>
                          <div className="text-muted" style={{whiteSpace: 'pre-wrap', wordWrap: 'break-word', lineHeight: '1.2'}}>{note.note}</div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-muted">No notes available for this customer.</p>
                  )}
                </div>
              )}
              
              {/* Timeline Pagination */}
              {totalNotes > notesPerPage && (
                <div className="timeline-pagination d-flex justify-content-between align-items-center flex-wrap">
                  <div className="text-muted small mb-2 mb-md-0">
                    Showing {((currentPage - 1) * notesPerPage) + 1} to {Math.min(currentPage * notesPerPage, totalNotes)} of {totalNotes} notes
                  </div>
                  <div className="d-flex gap-2 align-items-center justify-content-center">
                    <button 
                      className="btn btn-outline-primary btn-sm"
                      onClick={handlePreviousPage}
                      disabled={currentPage === 1 || loadingNotes}
                      style={{
                        whiteSpace: 'nowrap',
                        display: 'inline-flex',
                        alignItems: 'center',
                        minWidth: '85px',
                        justifyContent: 'center'
                      }}
                    >
                      <i className="bi bi-chevron-left me-1"></i>
                      Previous
                    </button>
                    <span className="page-info d-inline-flex align-items-center justify-content-center" style={{minWidth: '60px'}}>
                      {currentPage} / {totalPages}
                    </span>
                    <button 
                      className="btn btn-outline-primary btn-sm"
                      onClick={handleNextPage}
                      disabled={currentPage === totalPages || loadingNotes}
                      style={{
                        whiteSpace: 'nowrap',
                        display: 'inline-flex',
                        alignItems: 'center',
                        minWidth: '85px',
                        justifyContent: 'center'
                      }}
                    >
                      Next
                      <i className="bi bi-chevron-right ms-1"></i>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="col-lg-4 order-2 order-lg-2">
          {/* Quick Actions */}
          <div className="card mb-2">
            <div className="card-header py-1">
              <h6 className="mb-0 fw-bold small">Quick Actions</h6>
            </div>
            <div className="card-body py-1">
              <div className="d-grid gap-1">
                <a href={`mailto:${customer.email}`} className="btn btn-outline-primary btn-sm small">
                  <i className="bi bi-envelope me-1"></i>Email
                </a>
                <a href={`tel:${customer.phone}`} className="btn btn-outline-primary btn-sm small">
                  <i className="bi bi-telephone me-1"></i>Call
                </a>
                <button className="btn btn-outline-info btn-sm small">
                  <i className="bi bi-file-text me-1"></i>Report
                </button>
                <button className="btn btn-outline-warning btn-sm small">
                  <i className="bi bi-calendar-check me-1"></i>Follow-up
                </button>
                
                {/* Meeting Buttons */}
                <hr className="my-1" />
                <button className="btn btn-primary btn-sm small" onClick={schedulePhoneCall}>
                  <i className="bi bi-telephone-fill me-1"></i>
                  Phone
                </button>
                <button className="btn btn-success btn-sm small" onClick={scheduleOnlineMeeting}>
                  <i className="bi bi-camera-video-fill me-1"></i>
                  Online
                </button>
                <button className="btn btn-info btn-sm small" onClick={scheduleFaceToFaceMeeting}>
                  <i className="bi bi-calendar-plus-fill me-1"></i>
                  In-Person
                </button>
              </div>
            </div>
          </div>

          {/* Stage History Timeline */}
          <div className="card mb-2">
            <div className="card-header d-flex justify-content-between align-items-center py-1">
              <h6 className="mb-0 fw-bold small">Stage History</h6>
              {loadingStageHistory ? (
                <div className="spinner-border spinner-border-sm text-primary" role="status">
                  <span className="visually-hidden">Loading...</span>
                </div>
              ) : (
                <small className="text-muted">
                  {((stageCurrentPage - 1) * stagesPerPage) + 1} to {Math.min(stageCurrentPage * stagesPerPage, totalStages)} / {totalStages}
                </small>
              )}
            </div>
            <div className="card-body py-1">
              <div className="timeline">
                {paginatedStageHistory && paginatedStageHistory.length > 0 ? (
                  paginatedStageHistory.map((historyItem, index) => (
                    <div key={historyItem.id} className="timeline-item mb-1" style={{fontSize: '0.75rem'}}>
                      <div className="d-flex align-items-center mb-0">
                        <div className="timeline-marker me-1">
                          <span className={`badge stage-badge stage-${historyItem.stage}`} style={{fontSize: '0.65rem', padding: '0.1rem 0.4rem'}}>
                            {stageDisplayNames[historyItem.stage] || historyItem.stage}
                          </span>
                        </div>
                        <div className="fw-medium text-primary flex-grow-1" style={{fontSize: '0.7rem'}}>
                          {new Date(historyItem.timestamp || historyItem.date).toLocaleString('en-GB')}
                        </div>
                        <small className="text-muted" style={{fontSize: '0.65rem'}}>{historyItem.user || 'System'}</small>
                      </div>
                      <div className="w-100 ps-0" style={{fontSize: '0.7rem'}}>
                        <div className="text-muted" style={{whiteSpace: 'pre-wrap', wordWrap: 'break-word', lineHeight: '1.2'}}>{historyItem.notes}</div>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-muted small">No stage history available.</p>
                )}
              </div>
              
              {/* Stage History Pagination */}
              {totalStages > stagesPerPage && (
                <div className="d-flex justify-content-between align-items-center mt-3 border-top pt-3">
                  <button 
                    className="btn btn-outline-primary btn-sm"
                    onClick={() => setStageCurrentPage(prev => Math.max(prev - 1, 1))}
                    disabled={stageCurrentPage === 1 || loadingStageHistory}
                    style={{
                      whiteSpace: 'nowrap',
                      display: 'inline-flex',
                      alignItems: 'center',
                      minWidth: '85px',
                      justifyContent: 'center'
                    }}
                  >
                    <i className="bi bi-chevron-left me-1"></i>
                    Previous
                  </button>
                  <span className="page-info d-inline-flex align-items-center justify-content-center" style={{minWidth: '60px'}}>
                    {stageCurrentPage} / {stageTotalPages}
                  </span>
                  <button 
                    className="btn btn-outline-primary btn-sm"
                    onClick={() => setStageCurrentPage(prev => Math.min(prev + 1, stageTotalPages))}
                    disabled={stageCurrentPage === stageTotalPages || loadingStageHistory}
                    style={{
                      whiteSpace: 'nowrap',
                      display: 'inline-flex',
                      alignItems: 'center',
                      minWidth: '85px',
                      justifyContent: 'center'
                    }}
                  >
                    Next
                    <i className="bi bi-chevron-right ms-1"></i>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Meeting Appointment Modal */}
      {showMeetingModal && (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-lg">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">
                  <i className={`bi bi-${meetingType === 'phone' ? 'telephone' : meetingType === 'online' ? 'camera-video' : 'calendar-plus'} me-2`}></i>
                  Schedule {meetingType === 'phone' ? 'Phone Call' : meetingType === 'online' ? 'Online Meeting' : 'Face-to-Face Meeting'}
                </h5>
                <button type="button" className="btn-close" onClick={closeMeetingModal}></button>
              </div>
              <div className="modal-body">
                <div className="row mb-3">
                  <div className="col-12">
                    <label className="form-label">Subject *</label>
                    <input
                      type="text"
                      className="form-control"
                      value={meetingData.subject}
                      onChange={(e) => handleMeetingDataChange('subject', e.target.value)}
                      placeholder="Enter meeting subject"
                    />
                  </div>
                </div>
                
                <div className="row mb-3">
                  <div className="col-md-6">
                    <label className="form-label">Date *</label>
                    <input
                      type="date"
                      className="form-control"
                      value={meetingData.date}
                      onChange={(e) => handleMeetingDataChange('date', e.target.value)}
                      min={new Date().toISOString().split('T')[0]}
                    />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label">Time *</label>
                    <input
                      type="time"
                      className="form-control"
                      value={meetingData.time}
                      onChange={(e) => handleMeetingDataChange('time', e.target.value)}
                    />
                  </div>
                </div>

                <div className="row mb-3">
                  <div className="col-md-6">
                    <label className="form-label">Duration (minutes) *</label>
                    <select
                      className="form-select"
                      value={meetingData.duration}
                      onChange={(e) => handleMeetingDataChange('duration', e.target.value)}
                    >
                      <option value="15">15 minutes</option>
                      <option value="30">30 minutes</option>
                      <option value="45">45 minutes</option>
                      <option value="60">1 hour</option>
                      <option value="90">1.5 hours</option>
                      <option value="120">2 hours</option>
                    </select>
                  </div>
                  <div className="col-md-6">
                    <label className="form-label">Location</label>
                    <input
                      type="text"
                      className="form-control"
                      value={meetingData.location}
                      onChange={(e) => handleMeetingDataChange('location', e.target.value)}
                      placeholder="Enter meeting location"
                    />
                  </div>
                </div>

                <div className="row mb-3">
                  <div className="col-12">
                    <label className="form-label">Attendees (Email addresses, separated by commas)</label>
                    <input
                      type="text"
                      className="form-control"
                      value={meetingData.attendees}
                      onChange={(e) => handleMeetingDataChange('attendees', e.target.value)}
                      placeholder="customer@email.com, colleague@company.com"
                    />
                    <small className="form-text text-muted">
                      Customer email ({customer.email}) is included by default
                    </small>
                  </div>
                </div>

                <div className="row mb-3">
                  <div className="col-12">
                    <label className="form-label">Agenda / Purpose *</label>
                    <textarea
                      className="form-control"
                      rows="4"
                      value={meetingData.agenda}
                      onChange={(e) => handleMeetingDataChange('agenda', e.target.value)}
                      placeholder="Enter meeting agenda and discussion points..."
                    ></textarea>
                  </div>
                </div>

                <div className="row mb-3">
                  <div className="col-12">
                    <label className="form-label">Additional Notes</label>
                    <textarea
                      className="form-control"
                      rows="3"
                      value={meetingData.notes}
                      onChange={(e) => handleMeetingDataChange('notes', e.target.value)}
                      placeholder="Any additional notes or preparation required..."
                    ></textarea>
                  </div>
                </div>

                {/* Meeting Integration Information */}
                <div className="alert alert-info">
                  <i className="bi bi-info-circle me-2"></i>
                  <strong>Calendar Invite:</strong> Click &quot;Send Calendar Invite&quot; to automatically email a professional calendar invitation to the customer with all meeting details and an ICS attachment for their calendar application.
                </div>

                {/* Meeting Type Specific Information */}
                {meetingType === 'phone' && (
                  <div className="alert alert-info">
                    <i className="bi bi-telephone me-2"></i>
                    <strong>Phone Call:</strong> You will call the customer at {customer.phone} at the scheduled time.
                  </div>
                )}
                
                {meetingType === 'online' && (
                  <div className="alert alert-success">
                    <i className="bi bi-camera-video me-2"></i>
                    <strong>Online Meeting:</strong> Remember to generate and include a video conference link in the calendar invitation.
                  </div>
                )}
                
                {meetingType === 'face-to-face' && (
                  <div className="alert alert-warning">
                    <i className="bi bi-geo-alt me-2"></i>
                    <strong>In-Person Meeting:</strong> Confirm the meeting location with the customer before finalizing the appointment.
                  </div>
                )}

                <div className="border-top pt-3 mt-3">
                  <h6 className="text-muted mb-2">Customer Information</h6>
                  <div className="row text-sm">
                    <div className="col-md-6">
                      <p className="mb-1"><strong>Name:</strong> {customer.firstName} {customer.lastName}</p>
                      <p className="mb-1"><strong>Email:</strong> {customer.email}</p>
                      {customer.dateOfBirth && (
                        <p className="mb-1"><strong>Date of Birth:</strong> {new Date(customer.dateOfBirth).toLocaleDateString()}</p>
                      )}
                    </div>
                    <div className="col-md-6">
                      <p className="mb-1"><strong>Phone:</strong> {customer.phone}</p>
                      <p className="mb-1"><strong>Account Type:</strong> {customer.customerAccountType || 'Sole'}</p>
                      <p className="mb-1"><strong>Stage:</strong> {customer.currentStage}</p>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={closeMeetingModal}>
                  Cancel
                </button>
                
                {/* Single Calendar Invite Button */}
                <button 
                  type="button" 
                  className={`btn btn-${meetingType === 'phone' ? 'primary' : meetingType === 'online' ? 'success' : 'info'}`}
                  onClick={() => handleCreateAppointment('email')}
                  disabled={!meetingData.subject || !meetingData.date || !meetingData.time || !meetingData.agenda}
                >
                  <i className="bi bi-envelope-fill me-2"></i>
                  Send Calendar Invite
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Document Type Selection Modal */}
      {showUploadModal && (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Select Document Type</h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={cancelUpload}
                ></button>
              </div>
              <div className="modal-body">
                <div className="mb-3">
                  <p className="text-muted">
                    You have selected <strong>{selectedFiles.length}</strong> file{selectedFiles.length > 1 ? 's' : ''} to upload.
                    Please choose which document type these files belong to:
                  </p>
                  
                  {/* Selected Files Preview */}
                  <div className="mb-3">
                    <small className="text-muted fw-bold">Selected Files:</small>
                    <ul className="list-unstyled mt-1">
                      {selectedFiles.map((file, index) => (
                        <li key={index} className="d-flex justify-content-between align-items-center py-1">
                          <span className="small">{file.name}</span>
                          <span className="small text-muted">{(file.size / 1024 / 1024).toFixed(2)} MB</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Document Type Selector */}
                  <label className="form-label">Document Type *</label>
                  <select
                    className="form-select"
                    value={selectedDocumentType}
                    onChange={(e) => setSelectedDocumentType(e.target.value)}
                    required
                  >
                    <option value="">Choose document type...</option>
                    {Object.keys(customer.documents || {}).map(docType => (
                      <option key={docType} value={docType}>
                        {docType.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                      </option>
                    ))}
                  </select>
                  <div className="form-text">
                    Select the appropriate document category for the uploaded files.
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={cancelUpload}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={confirmUpload}
                  disabled={!selectedDocumentType || selectedFiles.length === 0}
                >
                  <i className="bi bi-cloud-upload me-1"></i>
                  Upload {selectedFiles.length} File{selectedFiles.length > 1 ? 's' : ''}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Joint Customer Holder Modal */}
      {showJointHolderModal && (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-lg modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">
                  {editingJointHolder !== null ? 'Edit Joint Account Holder' : 'Add Joint Account Holder'}
                </h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={closeJointHolderModal}
                ></button>
              </div>
              <div className="modal-body">
                <form>
                  <div className="row mb-3">
                    <div className="col-md-6">
                      <label className="form-label">First Name *</label>
                      <input
                        type="text"
                        className="form-control"
                        value={jointHolderFormData.firstName}
                        onChange={(e) => handleJointHolderFormChange('firstName', e.target.value)}
                        required
                      />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label">Last Name *</label>
                      <input
                        type="text"
                        className="form-control"
                        value={jointHolderFormData.lastName}
                        onChange={(e) => handleJointHolderFormChange('lastName', e.target.value)}
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
                        value={jointHolderFormData.email}
                        onChange={(e) => handleJointHolderFormChange('email', e.target.value)}
                      />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label">Phone</label>
                      <input
                        type="tel"
                        className="form-control"
                        value={jointHolderFormData.phone}
                        onChange={(e) => handleJointHolderFormChange('phone', e.target.value)}
                      />
                    </div>
                  </div>
                  
                  <div className="row mb-3">
                    <div className="col-md-6">
                      <label className="form-label">Date of Birth</label>
                      <input
                        type="date"
                        className="form-control"
                        value={jointHolderFormData.dateOfBirth}
                        onChange={(e) => handleJointHolderFormChange('dateOfBirth', e.target.value)}
                      />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label">Employment Status</label>
                      <select
                        className="form-select"
                        value={jointHolderFormData.employmentStatus}
                        onChange={(e) => handleJointHolderFormChange('employmentStatus', e.target.value)}
                      >
                        <option value="employed">Employed</option>
                        <option value="self-employed">Self Employed</option>
                        <option value="retired">Retired</option>
                        <option value="unemployed">Unemployed</option>
                      </select>
                    </div>
                  </div>
                  
                  <div className="row mb-3">
                    <div className="col-md-8">
                      <label className="form-label">Address</label>
                      <textarea
                        className="form-control"
                        rows="2"
                        value={jointHolderFormData.address}
                        onChange={(e) => handleJointHolderFormChange('address', e.target.value)}
                      />
                    </div>
                    <div className="col-md-4">
                      <label className="form-label">Postcode</label>
                      <input
                        type="text"
                        className="form-control"
                        value={jointHolderFormData.postcode}
                        onChange={(e) => handleJointHolderFormChange('postcode', e.target.value)}
                      />
                    </div>
                  </div>
                  
                  <div className="mb-3">
                    <label className="form-label">Annual Income</label>
                    <input
                      type="number"
                      className="form-control"
                      value={jointHolderFormData.annualIncome}
                      onChange={(e) => handleJointHolderFormChange('annualIncome', parseInt(e.target.value) || 0)}
                      min="0"
                      placeholder="Enter annual income"
                    />
                  </div>
                </form>
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={closeJointHolderModal}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={saveJointHolder}
                  disabled={savingJointHolder || !jointHolderFormData.firstName || !jointHolderFormData.lastName}
                >
                  {savingJointHolder ? 'Saving...' : (editingJointHolder !== null ? 'Update Holder' : 'Add Holder')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modern Modals */}
      <ConfirmModal
        isOpen={confirmModal.isOpen}
        onClose={closeConfirmModal}
        onConfirm={confirmModal.onConfirm}
        title={confirmModal.title}
        message={confirmModal.message}
        details={confirmModal.details}
        type={confirmModal.type}
        confirmText={confirmModal.confirmText}
        cancelText={confirmModal.cancelText}
      />

      <NotificationToast
        isOpen={notification.isOpen}
        onClose={closeNotification}
        message={notification.message}
        type={notification.type}
        title={notification.title}
      />
    </div>
  )
}
