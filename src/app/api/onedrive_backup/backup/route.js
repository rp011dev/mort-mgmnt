// API route for creating backups
import { NextResponse } from 'next/server';
import LocalOneDriveManager from '../../../../utils/localOneDriveManager';
import path from 'path';

export async function POST() {
  try {
    const oneDriveManager = new LocalOneDriveManager();
    await oneDriveManager.initialize();
    
    // Check if OneDrive is available
    const status = oneDriveManager.getStatus();
    if (!status.available) {
      return NextResponse.json(
        { 
          success: false, 
          error: `OneDrive not available: ${status.reason}` 
        }, 
        { status: 400 }
      );
    }
    
    // Path to local data files
    const localDataPath = path.join(process.cwd(), 'src/data');
    
    // Create backup
    const result = await oneDriveManager.createBackup(localDataPath);
    
    return NextResponse.json(result);
  } catch (error) {
    console.error('Error creating backup:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error.message 
      }, 
      { status: 500 }
    );
  }
}
