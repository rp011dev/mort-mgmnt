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

// Legacy data paths - kept for backward compatibility if needed
// Note: All document storage now uses GridFS in MongoDB
export const DATA_PATHS = {
  // These are deprecated - kept only for reference
  // All data is now stored in MongoDB collections
}

console.log('📁 Using MongoDB for all data storage')
console.log('📁 Database:', MONGODB_CONFIG.database)

export default DATA_PATHS
