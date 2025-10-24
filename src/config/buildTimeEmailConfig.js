// Build-time Email Configuration for GK Finance
// This file contains email provider settings that are included in the application build

export const BUILT_IN_EMAIL_CONFIG = {
  // Application Information
  app: {
    name: 'GK Finance',
    company: 'GK Finance Ltd',
    website: 'https://gkfinance.com',
    supportEmail: 'support@gkfinance.com'
  },

  // Outlook Personal Accounts Configuration
  outlookPersonal: {
    host: 'smtp-mail.outlook.com',
    port: 587,
    secure: false,
    service: 'outlook',
    domains: ['outlook.com', 'hotmail.com', 'live.com', 'msn.com'],
    name: 'Outlook Personal',
    instructions: [
      'Go to https://account.microsoft.com/security',
      'Enable 2-factor authentication',
      'Click "Advanced security options"',
      'Under "App passwords", create new password',
      'Name it "GK Finance Calendar"',
      'Use the generated 16-character password'
    ],
    tls: {
      ciphers: 'SSLv3',
      rejectUnauthorized: false
    }
  },

  // Office 365 Business Accounts Configuration
  outlookBusiness: {
    host: 'smtp.office365.com',
    port: 587,
    secure: false,
    service: 'office365',
    name: 'Office 365 Business',
    instructions: [
      'Contact your IT administrator',
      'Ensure SMTP authentication is enabled',
      'Generate app password if required',
      'Use your business email credentials'
    ],
    tls: {
      ciphers: 'SSLv3',
      rejectUnauthorized: false
    }
  },

  // Gmail Configuration
  gmail: {
    host: 'smtp.gmail.com',
    port: 587,
    secure: false,
    service: 'gmail',
    domains: ['gmail.com'],
    name: 'Gmail',
    instructions: [
      'Enable 2-factor authentication',
      'Go to Google Account Security',
      'Generate App Password for Mail',
      'Use app password instead of regular password'
    ]
  },

  // Default fallback settings
  defaults: {
    timeout: 10000,
    retries: 3,
    connectionTimeout: 5000,
    greetingTimeout: 5000,
    socketTimeout: 10000
  },

  // Email template settings
  templates: {
    encoding: 'utf-8',
    charset: 'UTF-8',
    priority: 'normal',
    headers: {
      'X-Mailer': 'GK Finance Calendar System',
      'X-Priority': '3'
    }
  },

  // Calendar settings
  calendar: {
    timezone: 'Europe/London',
    method: 'REQUEST',
    version: '2.0',
    prodId: '-//GK Finance//Calendar System//EN'
  }
}

// Auto-detect email provider based on email address
export function detectEmailProvider(emailAddress) {
  if (!emailAddress || typeof emailAddress !== 'string') {
    return null
  }

  const domain = emailAddress.toLowerCase().split('@')[1]
  
  if (!domain) {
    return null
  }

  // Check Outlook personal domains
  if (BUILT_IN_EMAIL_CONFIG.outlookPersonal.domains.includes(domain)) {
    return {
      type: 'outlookPersonal',
      config: BUILT_IN_EMAIL_CONFIG.outlookPersonal,
      requiresAppPassword: true
    }
  }

  // Check Gmail
  if (BUILT_IN_EMAIL_CONFIG.gmail.domains.includes(domain)) {
    return {
      type: 'gmail',
      config: BUILT_IN_EMAIL_CONFIG.gmail,
      requiresAppPassword: true
    }
  }

  // Default to Office 365 for custom domains
  return {
    type: 'outlookBusiness',
    config: BUILT_IN_EMAIL_CONFIG.outlookBusiness,
    requiresAppPassword: false
  }
}

// Get complete transporter configuration
export function getBuildTimeTransporterConfig(emailUser, emailPassword, customConfig = {}) {
  const provider = detectEmailProvider(emailUser)
  
  if (!provider) {
    throw new Error('Unable to detect email provider from email address')
  }

  const baseConfig = {
    host: provider.config.host,
    port: provider.config.port,
    secure: provider.config.secure,
    auth: {
      user: emailUser,
      pass: emailPassword
    },
    ...BUILT_IN_EMAIL_CONFIG.defaults,
    ...provider.config.tls ? { tls: provider.config.tls } : {},
    ...customConfig
  }

  return {
    config: baseConfig,
    provider: provider.type,
    providerName: provider.config.name,
    instructions: provider.config.instructions,
    requiresAppPassword: provider.requiresAppPassword
  }
}

// Validate email configuration
export function validateBuildTimeConfig(emailUser, emailPassword) {
  const errors = []
  const warnings = []

  if (!emailUser) {
    errors.push('Email address is required')
  } else if (!emailUser.includes('@')) {
    errors.push('Invalid email address format')
  }

  if (!emailPassword) {
    errors.push('Email password is required')
  }

  const provider = detectEmailProvider(emailUser)
  
  if (provider?.requiresAppPassword && emailPassword && emailPassword.length < 16) {
    warnings.push(`${provider.config.name} typically requires App Passwords (16+ characters)`)
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    provider: provider?.config.name || 'Unknown'
  }
}
