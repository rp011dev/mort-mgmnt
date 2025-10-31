// Data configuration for Application

// MongoDB Configuration
export const MONGODB_CONFIG = {
  uri: process.env.MONGODB_URI || 'mongodb://localhost:27017',
  dbName: process.env.MONGODB_DB || 'gkf',
  database: process.env.MONGODB_DB || 'gkf', // Alias for compatibility
  collections: {
    customers: 'customer',
    enquiries: 'enquiry',
    users: 'user',
    authors: 'author',
    products: 'product',
    fees: 'fee',
    notes: 'note',
    stageHistory: 'stageHistory',
    user: 'user',
    authAudit: 'authAudit',
    // GridFS collections are automatically created
    documents: 'documents' // GridFS bucket name
  }
}

