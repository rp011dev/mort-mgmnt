import { NextResponse } from 'next/server'
import { emailConfig } from '../../../config/emailConfigManager'

export async function GET() {
  try {
    // Get configuration summary (safe for debugging)
    const configSummary = emailConfig.getConfigSummary()
    
    return NextResponse.json({
      success: true,
      message: 'Email configuration status',
      config: configSummary
    })
  } catch (error) {
    return NextResponse.json({
      success: false,
      message: 'Failed to get email configuration',
      error: error.message
    }, { status: 500 })
  }
}

export async function POST() {
  try {
    // Test email configuration
    const testResult = await emailConfig.testConfiguration()
    
    return NextResponse.json(testResult)
  } catch (error) {
    return NextResponse.json({
      success: false,
      message: 'Configuration test failed',
      error: error.message
    }, { status: 500 })
  }
}
