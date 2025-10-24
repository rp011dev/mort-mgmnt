import { NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'
import os from 'os'

// Function to detect all possible OneDrive paths
function detectOneDrivePaths() {
  const homeDir = os.homedir()
  const possiblePaths = [
    {
      name: 'OneDrive - TEST Office 365',
      path: path.join(homeDir, 'OneDrive - TEST Office 365'),
      type: 'business'
    },
    {
      name: 'OneDrive Personal',
      path: path.join(homeDir, 'OneDrive'),
      type: 'personal'
    },
    {
      name: 'OneDrive - Personal',
      path: path.join(homeDir, 'OneDrive - Personal'),
      type: 'personal'
    },
    {
      name: 'OneDrive (Cloud Storage)',
      path: path.join(homeDir, 'Library', 'CloudStorage', 'OneDrive-TESTOffice365'),
      type: 'business'
    },
    {
      name: 'OneDrive Personal (Cloud Storage)',
      path: path.join(homeDir, 'Library', 'CloudStorage', 'OneDrive-Personal'),
      type: 'personal'
    }
  ]

  return possiblePaths.map(pathInfo => ({
    ...pathInfo,
    exists: fs.existsSync(pathInfo.path),
    dataPath: path.join(pathInfo.path, 'GK-Finance-Data', 'data')
  })).filter(pathInfo => pathInfo.exists || pathInfo.type === 'business') // Keep business paths even if not existing yet
}

// Function to get current configured path
function getCurrentDataPath() {
  try {
    // Try to import the current data config
    const configPath = path.join(process.cwd(), 'src', 'config', 'dataConfig.js')
    delete require.cache[require.resolve('../../../config/dataConfig.js')]
    const { DATA_DIR } = require('../../../config/dataConfig.js')
    return DATA_DIR
  } catch (error) {
    return null
  }
}

export async function GET() {
  try {
    const availablePaths = detectOneDrivePaths()
    const currentPath = getCurrentDataPath()

    return NextResponse.json({
      availablePaths,
      currentPath,
      homeDirectory: os.homedir()
    })
  } catch (error) {
    console.error('Error detecting OneDrive paths:', error)
    return NextResponse.json({
      error: 'Failed to detect OneDrive paths',
      message: error.message
    }, { status: 500 })
  }
}

export async function POST(request) {
  try {
    const { selectedPath } = await request.json()

    if (!selectedPath) {
      return NextResponse.json({
        error: 'Selected path is required'
      }, { status: 400 })
    }

    // Validate the selected path exists or can be created
    const dataPath = path.join(selectedPath, 'GK-Finance-Data', 'data')
    
    try {
      // Create the directory structure if it doesn't exist
      fs.mkdirSync(dataPath, { recursive: true })
    } catch (error) {
      return NextResponse.json({
        error: 'Cannot create directory',
        message: `Failed to create directory at ${dataPath}: ${error.message}`
      }, { status: 400 })
    }

    // Update the data configuration file
    const configContent = `// Data configuration for Application
// This file centralizes data file paths for easy management
// Uses direct OneDrive paths without symbolic links

import path from 'path'
import os from 'os'

// Get the configured OneDrive data path directly
export const getOneDrivePath = () => {
  // Use the selected OneDrive path
  const selectedPath = '${dataPath.replace(/\\/g, '\\\\')}'
  
  const fs = require('fs')
  if (fs.existsSync(selectedPath)) {
    console.log('✅ Using configured OneDrive data path:', selectedPath)
    return selectedPath
  }
  
  // If configured path doesn't exist, try to create it
  try {
    fs.mkdirSync(selectedPath, { recursive: true })
    console.log('🔧 Created OneDrive data directory:', selectedPath)
    return selectedPath
  } catch (error) {
    console.error('❌ Cannot access configured OneDrive path:', selectedPath)
    throw new Error(\`OneDrive path not accessible: \${selectedPath}\`)
  }
}

// Get the base data directory
export const DATA_DIR = getOneDrivePath()

// Individual file paths
export const DATA_PATHS = {
  customers: path.join(DATA_DIR, 'customers.json'),
  enquiries: path.join(DATA_DIR, 'enquiries.json'),
  users: path.join(DATA_DIR, 'users.json'),
  authors: path.join(DATA_DIR, 'authors.json'),
  products: path.join(DATA_DIR, 'products.json'),
  fees: path.join(DATA_DIR, 'fees.json'),
  notes: path.join(DATA_DIR, 'notes.json')
}

// Log the current data directory being used
console.log('📁 Data directory:', DATA_DIR)

export default DATA_PATHS`

    const configPath = path.join(process.cwd(), 'src', 'config', 'dataConfig.js')
    fs.writeFileSync(configPath, configContent, 'utf8')

    // Copy existing data files to new location if they don't exist there
    const currentDataPath = getCurrentDataPath()
    if (currentDataPath && currentDataPath !== dataPath && fs.existsSync(currentDataPath)) {
      const dataFiles = ['customers.json', 'enquiries.json', 'users.json', 'authors.json', 'products.json', 'fees.json', 'notes.json']
      
      for (const fileName of dataFiles) {
        const sourcePath = path.join(currentDataPath, fileName)
        const targetPath = path.join(dataPath, fileName)
        
        if (fs.existsSync(sourcePath) && !fs.existsSync(targetPath)) {
          fs.copyFileSync(sourcePath, targetPath)
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: 'OneDrive path updated successfully',
      newPath: dataPath,
      previousPath: currentDataPath
    })

  } catch (error) {
    console.error('Error updating OneDrive path:', error)
    return NextResponse.json({
      error: 'Failed to update OneDrive path',
      message: error.message
    }, { status: 500 })
  }
}
