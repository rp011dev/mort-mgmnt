// API route for syncing data FROM OneDrive
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
    
    // Sync files
    const results = await oneDriveManager.syncOneDriveToLocal(localDataPath);
    
    return NextResponse.json({
      success: true,
      message: 'Data synced from OneDrive',
      results
    });
  } catch (error) {
    console.error('Error syncing from OneDrive:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error.message 
      }, 
      { status: 500 }
    );
  }
}
