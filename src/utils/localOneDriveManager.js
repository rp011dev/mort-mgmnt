// Local OneDrive Folder Manager
// Uses OneDrive desktop sync folder instead of API integration

import fs from 'fs';
import path from 'path';
import os from 'os';

class LocalOneDriveManager {
  constructor() {
    this.oneDrivePath = this.detectOneDrivePath();
    this.appFolder = 'GK-Finance-Data';
    this.dataFolder = path.join(this.oneDrivePath, this.appFolder, 'data');
    this.documentsFolder = path.join(this.oneDrivePath, this.appFolder, 'documents');
    this.backupsFolder = path.join(this.oneDrivePath, this.appFolder, 'backups');
  }

  // Detect OneDrive folder path based on OS
  detectOneDrivePath() {
    const homeDir = os.homedir();
    
    // Common OneDrive paths
    const possiblePaths = [
      // Windows paths
      path.join(homeDir, 'OneDrive'),
      path.join(homeDir, 'OneDrive - Personal'),
      path.join(homeDir, 'OneDrive - Business'),
      
      // macOS paths
      path.join(homeDir, 'OneDrive'),
      path.join(homeDir, 'OneDrive - Personal'),
      path.join(homeDir, 'OneDrive - Santander Office 365'),
      path.join(homeDir, 'Library', 'CloudStorage', 'OneDrive-Personal'),
      path.join(homeDir, 'Library', 'CloudStorage', 'OneDrive-SantanderOffice365'),
      
      // Custom environment variable
      process.env.ONEDRIVE_PATH
    ].filter(Boolean);

    // Find the first existing path
    for (const testPath of possiblePaths) {
      if (fs.existsSync(testPath)) {
        console.log(`OneDrive detected at: ${testPath}`);
        return testPath;
      }
    }

    // Fallback to a local folder if OneDrive not found
    const fallbackPath = path.join(homeDir, 'Documents', 'GK-Finance-OneDrive');
    console.warn(`OneDrive not detected, using fallback: ${fallbackPath}`);
    return path.dirname(fallbackPath);
  }

  // Initialize folder structure
  async initialize() {
    try {
      // Create main app folder
      const appFolderPath = path.join(this.oneDrivePath, this.appFolder);
      if (!fs.existsSync(appFolderPath)) {
        fs.mkdirSync(appFolderPath, { recursive: true });
      }

      // Create subfolders
      [this.dataFolder, this.documentsFolder, this.backupsFolder].forEach(folder => {
        if (!fs.existsSync(folder)) {
          fs.mkdirSync(folder, { recursive: true });
        }
      });

      console.log('OneDrive folder structure initialized');
      return true;
    } catch (error) {
      console.error('Error initializing OneDrive folders:', error);
      return false;
    }
  }

  // Check if OneDrive is available and syncing
  isOneDriveAvailable() {
    try {
      // Check if main OneDrive folder exists
      if (!fs.existsSync(this.oneDrivePath)) {
        return { available: false, reason: 'OneDrive folder not found' };
      }

      // Check if app folder is accessible
      const appFolderPath = path.join(this.oneDrivePath, this.appFolder);
      if (!fs.existsSync(appFolderPath)) {
        // Try to create it
        fs.mkdirSync(appFolderPath, { recursive: true });
      }

      // Test write access
      const testFile = path.join(appFolderPath, '.gk-finance-test');
      fs.writeFileSync(testFile, new Date().toISOString());
      fs.unlinkSync(testFile);

      return { available: true, path: this.oneDrivePath };
    } catch (error) {
      return { available: false, reason: error.message };
    }
  }

  // Get file path for data file
  getDataFilePath(fileName) {
    if (!fileName.endsWith('.json')) {
      fileName += '.json';
    }
    return path.join(this.dataFolder, fileName);
  }

  // Read JSON data file
  async readDataFile(fileName) {
    try {
      const filePath = this.getDataFilePath(fileName);
      
      if (!fs.existsSync(filePath)) {
        console.log(`Data file not found in OneDrive: ${fileName}`);
        return null;
      }

      const fileContent = fs.readFileSync(filePath, 'utf8');
      return JSON.parse(fileContent);
    } catch (error) {
      console.error(`Error reading OneDrive data file ${fileName}:`, error);
      return null;
    }
  }

  // Write JSON data file
  async writeDataFile(fileName, data) {
    try {
      const filePath = this.getDataFilePath(fileName);
      
      // Ensure directory exists
      const dir = path.dirname(filePath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }

      // Write file with pretty formatting
      fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
      
      console.log(`Data file written to OneDrive: ${fileName}`);
      return true;
    } catch (error) {
      console.error(`Error writing OneDrive data file ${fileName}:`, error);
      return false;
    }
  }

  // Copy local data files to OneDrive
  async syncLocalToOneDrive(localDataPath) {
    try {
      const results = [];
      
      // List of data files to sync
      const dataFiles = ['customers.json', 'enquiries.json', 'users.json', 'products.json', 'fees.json', 'notes.json', 'authors.json'];
      
      for (const fileName of dataFiles) {
        try {
          const localFilePath = path.join(localDataPath, fileName);
          
          if (fs.existsSync(localFilePath)) {
            const data = JSON.parse(fs.readFileSync(localFilePath, 'utf8'));
            const success = await this.writeDataFile(fileName, data);
            results.push({ file: fileName, status: success ? 'success' : 'failed' });
          } else {
            results.push({ file: fileName, status: 'not_found' });
          }
        } catch (error) {
          results.push({ file: fileName, status: 'error', error: error.message });
        }
      }
      
      return results;
    } catch (error) {
      console.error('Error syncing local to OneDrive:', error);
      throw error;
    }
  }

  // Copy OneDrive data files to local
  async syncOneDriveToLocal(localDataPath) {
    try {
      const results = [];
      
      // Ensure local directory exists
      if (!fs.existsSync(localDataPath)) {
        fs.mkdirSync(localDataPath, { recursive: true });
      }
      
      // List of data files to sync
      const dataFiles = ['customers.json', 'enquiries.json', 'users.json', 'products.json', 'fees.json', 'notes.json', 'authors.json'];
      
      for (const fileName of dataFiles) {
        try {
          const oneDriveData = await this.readDataFile(fileName);
          
          if (oneDriveData) {
            const localFilePath = path.join(localDataPath, fileName);
            fs.writeFileSync(localFilePath, JSON.stringify(oneDriveData, null, 2), 'utf8');
            results.push({ file: fileName, status: 'success' });
          } else {
            results.push({ file: fileName, status: 'not_found' });
          }
        } catch (error) {
          results.push({ file: fileName, status: 'error', error: error.message });
        }
      }
      
      return results;
    } catch (error) {
      console.error('Error syncing OneDrive to local:', error);
      throw error;
    }
  }

  // Create backup
  async createBackup(localDataPath) {
    try {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-').split('T')[0];
      const backupFolderName = `backup-${timestamp}-${Date.now()}`;
      const backupPath = path.join(this.backupsFolder, backupFolderName);
      
      // Create backup folder
      fs.mkdirSync(backupPath, { recursive: true });
      
      // Copy all data files
      const dataFiles = ['customers.json', 'enquiries.json', 'users.json', 'products.json', 'fees.json', 'notes.json', 'authors.json'];
      const results = [];
      
      for (const fileName of dataFiles) {
        try {
          const localFilePath = path.join(localDataPath, fileName);
          const backupFilePath = path.join(backupPath, fileName);
          
          if (fs.existsSync(localFilePath)) {
            fs.copyFileSync(localFilePath, backupFilePath);
            results.push({ file: fileName, status: 'backed_up' });
          }
        } catch (error) {
          results.push({ file: fileName, status: 'error', error: error.message });
        }
      }
      
      // Create backup info file
      const backupInfo = {
        created: new Date().toISOString(),
        files: results,
        source: 'local-data'
      };
      
      fs.writeFileSync(
        path.join(backupPath, 'backup-info.json'), 
        JSON.stringify(backupInfo, null, 2)
      );
      
      console.log(`Backup created: ${backupFolderName}`);
      return { success: true, backupPath: backupFolderName, results };
    } catch (error) {
      console.error('Error creating backup:', error);
      return { success: false, error: error.message };
    }
  }

  // Store document file
  async storeDocument(customerId, file, documentType) {
    try {
      const customerDocPath = path.join(this.documentsFolder, customerId.toString());
      
      // Create customer document folder
      if (!fs.existsSync(customerDocPath)) {
        fs.mkdirSync(customerDocPath, { recursive: true });
      }
      
      // Create filename with timestamp
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const fileName = `${documentType}_${timestamp}_${file.name}`;
      const filePath = path.join(customerDocPath, fileName);
      
      // If file is a File object (from browser), we'd need to handle it differently
      // For server-side, assume file is a buffer or path
      if (Buffer.isBuffer(file)) {
        fs.writeFileSync(filePath, file);
      } else if (typeof file === 'string' && fs.existsSync(file)) {
        fs.copyFileSync(file, filePath);
      }
      
      return {
        success: true,
        fileName,
        path: filePath,
        relativePath: path.relative(this.oneDrivePath, filePath)
      };
    } catch (error) {
      console.error('Error storing document:', error);
      return { success: false, error: error.message };
    }
  }

  // Get OneDrive status and info
  getStatus() {
    const availability = this.isOneDriveAvailable();
    
    return {
      available: availability.available,
      reason: availability.reason,
      oneDrivePath: this.oneDrivePath,
      appFolder: this.appFolder,
      folders: {
        data: this.dataFolder,
        documents: this.documentsFolder,
        backups: this.backupsFolder
      }
    };
  }

  // List backup folders
  listBackups() {
    try {
      if (!fs.existsSync(this.backupsFolder)) {
        return [];
      }
      
      const backups = fs.readdirSync(this.backupsFolder)
        .filter(item => {
          const backupPath = path.join(this.backupsFolder, item);
          return fs.statSync(backupPath).isDirectory();
        })
        .map(backupName => {
          const backupPath = path.join(this.backupsFolder, backupName);
          const infoPath = path.join(backupPath, 'backup-info.json');
          
          let info = { created: 'Unknown' };
          if (fs.existsSync(infoPath)) {
            try {
              info = JSON.parse(fs.readFileSync(infoPath, 'utf8'));
            } catch (error) {
              console.error(`Error reading backup info for ${backupName}:`, error);
            }
          }
          
          return {
            name: backupName,
            path: backupPath,
            created: info.created,
            files: info.files || []
          };
        })
        .sort((a, b) => new Date(b.created) - new Date(a.created));
      
      return backups;
    } catch (error) {
      console.error('Error listing backups:', error);
      return [];
    }
  }
}

export default LocalOneDriveManager;
