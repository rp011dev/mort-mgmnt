// Email Configuration for GK Finance Calendar Invites
// This configuration supports multiple email providers with Outlook optimization

export const EMAIL_PROVIDERS = {
  OUTLOOK_PERSONAL: {
    name: 'Outlook Personal',
    host: 'smtp-mail.outlook.com',
    port: 587,
    secure: false,
    domains: ['outlook.com', 'hotmail.com', 'live.com'],
    requiresAppPassword: true,
    setupUrl: 'https://account.microsoft.com/security'
  },
  OUTLOOK_BUSINESS: {
    name: 'Office 365 Business',
    host: 'smtp.office365.com', 
    port: 587,
    secure: false,
    domains: ['*'], // Any custom domain with Office 365
    requiresAppPassword: true,
    setupUrl: 'https://admin.microsoft.com'
  },
  GMAIL: {
    name: 'Gmail',
    host: 'smtp.gmail.com',
    port: 587,
    secure: false,
    domains: ['gmail.com'],
    requiresAppPassword: true,
    setupUrl: 'https://myaccount.google.com/security'
  },
  YAHOO: {
    name: 'Yahoo Mail',
    host: 'smtp.mail.yahoo.com',
    port: 587,
    secure: false,
    domains: ['yahoo.com', 'yahoo.co.uk'],
    requiresAppPassword: true,
    setupUrl: 'https://login.yahoo.com/account/security'
  }
}

export const DEFAULT_EMAIL_CONFIG = {
  from: '"GK Finance" <noreply@gkfinance.com>',
  replyTo: process.env.EMAIL_USER || 'noreply@gkfinance.com',
  subject: {
    phone: 'Phone Call Appointment - GK Finance',
    online: 'Online Meeting Invitation - GK Finance', 
    'face-to-face': 'Face-to-Face Meeting Invitation - GK Finance'
  },
  timeout: 10000, // 10 seconds
  retries: 3
}

export const getEmailProvider = (emailAddress) => {
  if (!emailAddress) return null
  
  const domain = emailAddress.split('@')[1]?.toLowerCase()
  if (!domain) return null

  // Check for specific domain matches first
  for (const [key, provider] of Object.entries(EMAIL_PROVIDERS)) {
    if (provider.domains.includes(domain)) {
      return { key, ...provider }
    }
  }

  // Check for Office 365 business (any domain that's not a known public provider)
  const publicDomains = ['gmail.com', 'yahoo.com', 'yahoo.co.uk', 'outlook.com', 'hotmail.com', 'live.com']
  if (!publicDomains.includes(domain)) {
    return { key: 'OUTLOOK_BUSINESS', ...EMAIL_PROVIDERS.OUTLOOK_BUSINESS }
  }

  return null
}

export const getTransporterConfig = () => {
  const emailUser = process.env.EMAIL_USER
  const emailPassword = process.env.EMAIL_PASSWORD
  const emailHost = process.env.EMAIL_HOST
  const emailPort = process.env.EMAIL_PORT
  const emailSecure = process.env.EMAIL_SECURE

  // If custom SMTP settings are provided, use them
  if (emailHost) {
    return {
      host: emailHost,
      port: parseInt(emailPort) || 587,
      secure: emailSecure === 'true',
      auth: {
        user: emailUser,
        pass: emailPassword
      },
      tls: {
        ciphers: 'SSLv3',
        rejectUnauthorized: false
      }
    }
  }

  // Auto-detect provider based on email address
  const provider = getEmailProvider(emailUser)
  
  if (provider) {
    return {
      host: provider.host,
      port: provider.port,
      secure: provider.secure,
      auth: {
        user: emailUser,
        pass: emailPassword
      },
      tls: {
        ciphers: 'SSLv3',
        rejectUnauthorized: false
      }
    }
  }

  // Fallback to Gmail service
  return {
    service: 'gmail',
    auth: {
      user: emailUser,
      pass: emailPassword
    }
  }
}

export const validateEmailConfig = () => {
  const errors = []
  
  if (!process.env.EMAIL_USER) {
    errors.push('EMAIL_USER is required in environment variables')
  }
  
  if (!process.env.EMAIL_PASSWORD) {
    errors.push('EMAIL_PASSWORD is required in environment variables')
  }
  
  const provider = getEmailProvider(process.env.EMAIL_USER)
  if (provider?.requiresAppPassword && process.env.EMAIL_PASSWORD?.length < 16) {
    errors.push(`${provider.name} requires an App Password (16+ characters). Regular passwords will not work.`)
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    provider: provider?.name || 'Unknown',
    setupUrl: provider?.setupUrl
  }
}

export const EMAIL_TEMPLATES = {
  subject: (meetingType, customerName) => {
    const baseSubject = DEFAULT_EMAIL_CONFIG.subject[meetingType] || 'Meeting Invitation - GK Finance'
    return `${baseSubject} - ${customerName}`
  },
  
  getICSMethod: () => 'REQUEST', // Standard calendar invitation method
  
  organizerEmail: () => process.env.EMAIL_USER || 'noreply@gkfinance.com',
  
  fromAddress: () => `"GK Finance" <${process.env.EMAIL_USER || 'noreply@gkfinance.com'}>`
}
