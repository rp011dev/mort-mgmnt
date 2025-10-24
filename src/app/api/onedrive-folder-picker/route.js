import { NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'
import os from 'os'

export async function GET() {
  try {
    const homeDir = os.homedir()
    
    // Common OneDrive locations
    const oneDrivePaths = [
      path.join(homeDir, 'OneDrive - TEST Office 365'),
      path.join(homeDir, 'OneDrive'),
      path.join(homeDir, 'OneDrive - Personal'),
      path.join(homeDir, 'Library', 'CloudStorage', 'OneDrive-TESTOffice365'),
      path.join(homeDir, 'Library', 'CloudStorage', 'OneDrive-Personal')
    ]
    
    const availableFolders = []
    
    for (const oneDrivePath of oneDrivePaths) {
      if (fs.existsSync(oneDrivePath)) {
        // Check for existing GK-Finance-Data folder
        const gkFinanceDataPath = path.join(oneDrivePath, 'GK-Finance-Data')
        
        availableFolders.push({
          oneDriveRoot: oneDrivePath,
          gkFinanceDataPath: gkFinanceDataPath,
          exists: fs.existsSync(gkFinanceDataPath),
          name: path.basename(oneDrivePath),
          dataFolder: path.join(gkFinanceDataPath, 'data'),
          documentsFolder: path.join(gkFinanceDataPath, 'documents'),
          hasData: fs.existsSync(path.join(gkFinanceDataPath, 'data')),
          hasDocuments: fs.existsSync(path.join(gkFinanceDataPath, 'documents'))
        })
      }
    }
    
    return NextResponse.json({
      success: true,
      availableFolders,
      homeDirectory: homeDir
    })
    
  } catch (error) {
    console.error('Error scanning OneDrive folders:', error)
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 })
  }
}

export async function POST(request) {
  try {
    const { selectedPath } = await request.json()
    
    if (!selectedPath) {
      return NextResponse.json({
        success: false,
        error: 'No path provided'
      }, { status: 400 })
    }
    
    // Validate the selected path exists
    if (!fs.existsSync(selectedPath)) {
      return NextResponse.json({
        success: false,
        error: 'Selected path does not exist'
      }, { status: 400 })
    }
    
    // Create data and documents folders if they don't exist
    const dataFolder = path.join(selectedPath, 'data')
    const documentsFolder = path.join(selectedPath, 'documents')
    
    if (!fs.existsSync(dataFolder)) {
      fs.mkdirSync(dataFolder, { recursive: true })
    }
    
    if (!fs.existsSync(documentsFolder)) {
      fs.mkdirSync(documentsFolder, { recursive: true })
    }
    
    // Save the selected path to a configuration file
    const configPath = path.join(process.cwd(), '.onedrive-config.json')
    const config = {
      selectedPath,
      dataFolder,
      documentsFolder,
      updatedAt: new Date().toISOString()
    }
    
    fs.writeFileSync(configPath, JSON.stringify(config, null, 2))
    
    return NextResponse.json({
      success: true,
      message: 'OneDrive folder configured successfully',
      config
    })
    
  } catch (error) {
    console.error('Error configuring OneDrive folder:', error)
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 })
  }
}
