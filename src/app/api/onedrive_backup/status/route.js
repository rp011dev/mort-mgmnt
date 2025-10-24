// API route for OneDrive status check
import { NextResponse } from 'next/server';
import LocalOneDriveManager from '../../../../utils/localOneDriveManager';

export async function GET() {
  try {
    const oneDriveManager = new LocalOneDriveManager();
    await oneDriveManager.initialize();
    
    const status = oneDriveManager.getStatus();
    
    return NextResponse.json(status);
  } catch (error) {
    console.error('Error checking OneDrive status:', error);
    return NextResponse.json(
      { 
        available: false, 
        reason: `Error: ${error.message}`,
        error: error.message 
      }, 
      { status: 500 }
    );
  }
}
