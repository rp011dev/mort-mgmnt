import { NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'
export const dynamic = 'force-dynamic'


//const enquiriesFilePath= null

// Enable CORS for Microsoft Forms/Power Automate integration
export async function OPTIONS(request) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  })
}

export async function POST(request) {
  try {
    // Add CORS headers
    const headers = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    }

    const enquiryData = await request.json()
    
    console.log('Microsoft Forms webhook received:', enquiryData)
    
    // Validate required fields
    const requiredFields = ['firstName', 'lastName', 'email', 'enquiryType']
    const missingFields = requiredFields.filter(field => !enquiryData[field])
    
    if (missingFields.length > 0) {
      return NextResponse.json({ 
        error: 'Missing required fields', 
        missingFields,
        success: false
      }, { status: 400, headers })
    }
    
    const fileContents = fs.readFileSync(enquiriesFilePath, 'utf8')
    const enquiries = JSON.parse(fileContents)
    
    // Generate new enquiry ID
    const maxId = enquiries.reduce((max, enquiry) => {
      const num = parseInt(enquiry.id.replace('ENQ', ''))
      return num > max ? num : max
    }, 0)

    // Auto-assign based on enquiry type
    const autoAssignment = {
      'Mortgage': 'John Smith',
      'Protection': 'Emma Davis',
      'Remortgage': 'Sarah Johnson',
      'Insurance': 'Emma Davis'
    }

    // Clean and format the data
    const newEnquiry = {
      id: `ENQ${String(maxId + 1).padStart(3, '0')}`,
      firstName: String(enquiryData.firstName).trim(),
      lastName: String(enquiryData.lastName).trim(),
      email: String(enquiryData.email).toLowerCase().trim(),
      phone: enquiryData.phone ? String(enquiryData.phone).trim() : '',
      postcode: enquiryData.postcode ? String(enquiryData.postcode).toUpperCase().trim() : '',
      address: enquiryData.address ? String(enquiryData.address).trim() : '',
      enquiryDate: new Date().toISOString().split('T')[0],
      enquiryType: enquiryData.enquiryType,
      loanAmount: parseInt(enquiryData.loanAmount) || 0,
      propertyValue: parseInt(enquiryData.propertyValue) || 0,
      employmentStatus: enquiryData.employmentStatus || 'employed',
      annualIncome: parseInt(enquiryData.annualIncome) || 0,
      preferredLender: enquiryData.preferredLender || '',
      mortgageType: enquiryData.mortgageType || 'Repayment',
      notes: enquiryData.notes ? String(enquiryData.notes).trim() : 'Enquiry submitted via Microsoft Forms',
      status: 'open',
      assignedTo: autoAssignment[enquiryData.enquiryType] || 'John Smith',
      followUpDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      source: 'microsoft-forms'
    }
    
    enquiries.push(newEnquiry)
    
    fs.writeFileSync(enquiriesFilePath, JSON.stringify(enquiries, null, 2))
    
    console.log('New enquiry created:', newEnquiry.id)
    
    return NextResponse.json({ 
      message: 'Enquiry received successfully',
      enquiryId: newEnquiry.id,
      success: true,
      assignedTo: newEnquiry.assignedTo
    }, { status: 201, headers })
    
  } catch (error) {
    console.error('Microsoft Forms webhook error:', error)
    return NextResponse.json({ 
      error: 'Failed to process enquiry',
      success: false,
      details: error.message
    }, { 
      status: 500,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      }
    })
  }
}

// Test endpoint to verify webhook is working
export async function GET(request) {
  return NextResponse.json({
    message: 'Microsoft Forms webhook endpoint is active',
    timestamp: new Date().toISOString(),
    endpoint: '/api/enquiries/webhook/microsoft-forms'
  })
}
