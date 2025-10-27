// Data configuration for Application
import path from 'path'
import os from 'os'
import fs from 'fs'

// MongoDB Configuration
export const MONGODB_CONFIG = {
  uri: process.env.MONGODB_URI || 'mongodb://localhost:27017',
  dbName: process.env.MONGODB_DB || 'gkf',
  collections: {
    customers: 'customer',
    enquiries: 'enquiry',
    users: 'user',
    authors: 'author',
    products: 'product',
    fees: 'fee',
    notes: 'note',
    stageHistory: 'stageHistory'
  }
}

// Function to load saved OneDrive configuration
const loadSavedConfig = () => {
  try {
    const fs = require('fs')
    const configPath = path.join(process.cwd(), '.onedrive-config.json')
    
    if (fs.existsSync(configPath)) {
      const config = JSON.parse(fs.readFileSync(configPath, 'utf8'))
      
      // Verify the configured path still exists
      if (fs.existsSync(config.dataFolder)) {
        console.log(`✅ Using saved OneDrive config: ${config.dataFolder}`)
        return {
          dataFolder: config.dataFolder,
          documentsFolder: config.documentsFolder,
          isConfigured: true
        }
      } else {
        console.warn(`⚠️ Saved config path no longer exists: ${config.dataFolder}`)
      }
    }
  } catch (error) {
    console.warn('Could not load saved OneDrive config:', error.message)
  }
  
  return null
}

// Function to get OneDrive data path directly
export const getOneDrivePath = () => {
  // First, try to use saved configuration
  const savedConfig = loadSavedConfig()
  if (savedConfig && savedConfig.isConfigured) {
    return savedConfig.dataFolder
  }

  const homeDir = os.homedir()
  
  // Priority order for OneDrive paths (fallback when no config exists)
  const oneDrivePaths = [
    path.join(homeDir, 'OneDrive - TEST Office 365', 'GK-Finance-Data', 'data'),
    path.join(homeDir, 'OneDrive', 'GK-Finance-Data', 'data'),
    path.join(homeDir, 'OneDrive - Personal', 'GK-Finance-Data', 'data'),
    path.join(homeDir, 'Library', 'CloudStorage', 'OneDrive-TESTOffice365', 'GK-Finance-Data', 'data'),
    path.join(homeDir, 'Library', 'CloudStorage', 'OneDrive-Personal', 'GK-Finance-Data', 'data')
  ]
  
  // Try each OneDrive path and return the first one that exists
  for (const testPath of oneDrivePaths) {
    try {
      if (fs.existsSync(testPath)) {
        console.log(`✅ Using auto-detected OneDrive data path: ${testPath}`)
        return testPath
      }
    } catch (error) {
      console.warn(`❌ Cannot access path: ${testPath}`)
      continue
    }
  }
  
  // If no OneDrive path found, create one in the first available OneDrive location
  const oneDriveRoots = [
    path.join(homeDir, 'OneDrive - TEST Office 365'),
    path.join(homeDir, 'OneDrive'),
    path.join(homeDir, 'OneDrive - Personal'),
    path.join(homeDir, 'Library', 'CloudStorage', 'OneDrive-TESTOffice365'),
    path.join(homeDir, 'Library', 'CloudStorage', 'OneDrive-Personal')
  ]
  
  for (const rootPath of oneDriveRoots) {
    try {
      if (fs.existsSync(rootPath)) {
        const newDataPath = path.join(rootPath, 'GK-Finance-Data', 'data')
        console.log(`🔧 Creating OneDrive data directory: ${newDataPath}`)
        fs.mkdirSync(newDataPath, { recursive: true })
        return newDataPath
      }
    } catch (error) {
      continue
    }
  }
  
  // If absolutely no OneDrive found, throw error
  throw new Error('OneDrive not found. Please install OneDrive and sync it before using this application.')
}

// Get the base data directory
export const DATA_DIR = "/Users/rajeshpote/Library/CloudStorage/OneDrive-SharedLibraries-onedrive/GK-Finance-Data/data"
//getOneDrivePath()

// Get the base OneDrive directory (parent of data folder)
export const getOneDriveBaseDir = () => {
  const dataDir = getOneDrivePath()
  // Remove '/data' from the end to get the base GK-Finance-Data directory
  return path.dirname(dataDir)
}

// Get OneDrive documents path
export const getOneDriveDocumentsPath = () => {
  // First, try to use saved configuration
  const savedConfig = loadSavedConfig()
  if (savedConfig && savedConfig.isConfigured) {
    return savedConfig.documentsFolder
  }

  // Fallback to auto-detection
  const baseDir = getOneDriveBaseDir()
  return path.join(baseDir, 'documents')
}

// Individual file paths
export const DATA_PATHS = {
  customers: path.join(DATA_DIR, 'customers.json'),
  enquiries: path.join(DATA_DIR, 'enquiries.json'),
  users: path.join(DATA_DIR, 'users.json'),
  authors: path.join(DATA_DIR, 'authors.json'),
  products: path.join(DATA_DIR, 'products.json'),
  fees: path.join(DATA_DIR, 'fees.json'),
  notes: path.join(DATA_DIR, 'notes.json'),
  stageHistory: path.join(DATA_DIR, 'stageHistory.json')
}

// Log the current directories being used
console.log('📁 Data directory:', DATA_DIR)

export default DATA_PATHS
