import { NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'
import { DATA_DIR, DATA_PATHS, getOneDriveDocumentsPath } from '../../../config/dataConfig.js'

export async function GET() {
  try {
    // Check if data directory exists and is accessible
    const dataExists = fs.existsSync(DATA_DIR)
    
    if (!dataExists) {
      return NextResponse.json({
        status: 'error',
        message: 'Data directory not found',
        dataDirectory: DATA_DIR,
        isOneDrive: false
      })
    }

    // Verify this is OneDrive path
    const isOneDrive = DATA_DIR.includes('OneDrive')
    
    if (!isOneDrive) {
      return NextResponse.json({
        status: 'warning',
        message: 'Data is not being read from OneDrive',
        dataDirectory: DATA_DIR,
        isOneDrive: false
      })
    }

    // Check each data file
    const fileStatus = {}
    for (const [key, filePath] of Object.entries(DATA_PATHS)) {
      fileStatus[key] = {
        exists: fs.existsSync(filePath),
        path: filePath,
        size: fs.existsSync(filePath) ? fs.statSync(filePath).size : 0,
        lastModified: fs.existsSync(filePath) ? fs.statSync(filePath).mtime : null
      }
    }

    // Check documents folder
    const documentsPath = getOneDriveDocumentsPath()
    const documentsExists = fs.existsSync(documentsPath)
    let documentsFolderInfo = {
      exists: documentsExists,
      path: documentsPath,
      fileCount: 0,
      totalSize: 0,
      lastModified: null
    }

    if (documentsExists) {
      try {
        const files = fs.readdirSync(documentsPath)
        const stats = fs.statSync(documentsPath)
        documentsFolderInfo.lastModified = stats.mtime
        
        // Count files and calculate total size
        let totalSize = 0
        let fileCount = 0
        
        for (const file of files) {
          const filePath = path.join(documentsPath, file)
          try {
            const fileStats = fs.statSync(filePath)
            if (fileStats.isFile()) {
              fileCount++
              totalSize += fileStats.size
            }
          } catch (error) {
            // Skip files that can't be accessed
            continue
          }
        }
        
        documentsFolderInfo.fileCount = fileCount
        documentsFolderInfo.totalSize = totalSize
      } catch (error) {
        console.warn('Error reading documents folder:', error)
      }
    }

    return NextResponse.json({
      status: 'success',
      message: 'Application is reading data directly from OneDrive',
      dataDirectory: DATA_DIR,
      isOneDrive,
      fileStatus,
      documentsFolder: documentsFolderInfo,
      summary: {
        totalFiles: Object.keys(fileStatus).length,
        existingFiles: Object.values(fileStatus).filter(f => f.exists).length,
        totalSize: Object.values(fileStatus).reduce((acc, f) => acc + f.size, 0),
        documentsFileCount: documentsFolderInfo.fileCount,
        documentsTotalSize: documentsFolderInfo.totalSize
      }
    })
    
  } catch (error) {
    console.error('Error checking OneDrive status:', error)
    return NextResponse.json({
      status: 'error',
      message: error.message,
      dataDirectory: DATA_DIR
    }, { status: 500 })
  }
}
