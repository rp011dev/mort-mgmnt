// Email Configuration Manager for GK Finance
// Centralized configuration management with build-time settings

import { 
  BUILT_IN_EMAIL_CONFIG, 
  detectEmailProvider, 
  getBuildTimeTransporterConfig,
  validateBuildTimeConfig 
} from './buildTimeEmailConfig'

export class EmailConfigManager {
  constructor() {
    this.config = BUILT_IN_EMAIL_CONFIG
    
    // READ EMAIL CREDENTIALS FROM ENVIRONMENT VARIABLES
    this.emailUser = process.env.EMAIL_USER        // Your email address (sender)
    this.emailPassword = process.env.EMAIL_PASSWORD // Your App Password
    
    // OPTIONAL CUSTOM SMTP SETTINGS (overrides auto-detection)
    this.customHost = process.env.EMAIL_HOST       // SMTP server
    this.customPort = process.env.EMAIL_PORT       // SMTP port
    this.customSecure = process.env.EMAIL_SECURE   // SSL/TLS setting
  }

  // Get the current email provider configuration
  getCurrentProvider() {
    if (this.customHost) {
      return {
        type: 'custom',
        name: 'Custom SMTP',
        host: this.customHost,
        port: parseInt(this.customPort) || 587,
        secure: this.customSecure === 'true'
      }
    }

    return detectEmailProvider(this.emailUser)
  }

  // Get complete transporter configuration
  getTransporterConfig() {
    // If custom SMTP settings are provided, use them
    if (this.customHost) {
      return {
        host: this.customHost,
        port: parseInt(this.customPort) || 587,
        secure: this.customSecure === 'true',
        auth: {
          user: this.emailUser,
          pass: this.emailPassword
        },
        ...this.config.defaults,
        tls: {
          ciphers: 'SSLv3',
          rejectUnauthorized: false
        }
      }
    }

    // Use build-time configuration
    const transporterInfo = getBuildTimeTransporterConfig(this.emailUser, this.emailPassword)
    return transporterInfo.config
  }

  // Validate current configuration
  validateConfig() {
    return validateBuildTimeConfig(this.emailUser, this.emailPassword)
  }

  // Get email sender information
  getSenderInfo() {
    return {
      from: `"${this.config.app.name}" <${this.emailUser}>`,
      replyTo: this.emailUser,
      organization: this.config.app.company
    }
  }

  // Get calendar settings
  getCalendarSettings() {
    return this.config.calendar
  }

  // Get setup instructions for current provider
  getSetupInstructions() {
    const provider = this.getCurrentProvider()
    
    if (provider?.type === 'custom') {
      return [
        'Using custom SMTP configuration',
        'Ensure EMAIL_HOST, EMAIL_PORT, and EMAIL_SECURE are set correctly',
        'Verify your SMTP server credentials'
      ]
    }

    return provider?.config?.instructions || provider?.instructions || [
      'Configure your email provider settings',
      'Ensure proper authentication is enabled'
    ]
  }

  // Test email configuration
  async testConfiguration() {
    try {
      const nodemailer = await import('nodemailer')
      const transporter = nodemailer.createTransporter(this.getTransporterConfig())
      
      // Verify connection
      await transporter.verify()
      
      return {
        success: true,
        message: 'Email configuration is valid',
        provider: this.getCurrentProvider()
      }
    } catch (error) {
      return {
        success: false,
        message: 'Email configuration test failed',
        error: error.message,
        provider: this.getCurrentProvider(),
        instructions: this.getSetupInstructions()
      }
    }
  }

  // Get configuration summary for debugging
  getConfigSummary() {
    const provider = this.getCurrentProvider()
    const validation = this.validateConfig()
    
    return {
      isConfigured: !!this.emailUser && !!this.emailPassword,
      provider: provider?.type || 'unknown',
      providerName: provider?.name || provider?.config?.name || 'Unknown',
      emailUser: this.emailUser ? `${this.emailUser.substring(0, 3)}***@${this.emailUser.split('@')[1]}` : 'Not set',
      hasPassword: !!this.emailPassword,
      passwordLength: this.emailPassword?.length || 0,
      validation,
      customSMTP: !!this.customHost,
      instructions: this.getSetupInstructions()
    }
  }
}

// Export singleton instance
export const emailConfig = new EmailConfigManager()

// Export utility functions
export { BUILT_IN_EMAIL_CONFIG, detectEmailProvider, getBuildTimeTransporterConfig, validateBuildTimeConfig }
