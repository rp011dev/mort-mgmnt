// API route for listing backups
import { NextResponse } from 'next/server';
import LocalOneDriveManager from '../../../../utils/localOneDriveManager';

export async function GET() {
  try {
    const oneDriveManager = new LocalOneDriveManager();
    await oneDriveManager.initialize();
    
    // Check if OneDrive is available
    const status = oneDriveManager.getStatus();
    if (!status.available) {
      return NextResponse.json([]);
    }
    
    // List backups
    const backups = oneDriveManager.listBackups();
    
    return NextResponse.json(backups);
  } catch (error) {
    console.error('Error listing backups:', error);
    return NextResponse.json(
      { error: error.message }, 
      { status: 500 }
    );
  }
}
