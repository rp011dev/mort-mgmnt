// Enhanced Data Manager with OneDrive integration
import OneDriveManager from './oneDriveManager';
import OneDriveAuth from './oneDriveAuth';

class HybridDataManager {
  constructor() {
    this.oneDriveManager = null;
    this.auth = null;
    this.useOneDrive = false;
    this.syncMode = 'auto'; // 'auto', 'manual', 'offline'
  }

  // Initialize the data manager
  async initialize() {
    if (typeof window !== 'undefined') {
      this.auth = new OneDriveAuth();
      await this.auth.initialize();
      
      if (this.auth.isLoggedIn()) {
        this.oneDriveManager = new OneDriveManager();
        const accessToken = await this.auth.getAccessToken();
        await this.oneDriveManager.initialize(accessToken);
        this.useOneDrive = true;
      }
    }
  }

  // Generic data operations that work with both local and OneDrive
  async getData(dataType) {
    try {
      // Try OneDrive first if available
      if (this.useOneDrive && this.oneDriveManager) {
        const oneDriveData = await this.oneDriveManager.downloadJSONData(`${dataType}.json`);
        if (oneDriveData) {
          // Update local cache
          await this.updateLocalData(dataType, oneDriveData);
          return oneDriveData;
        }
      }
    } catch (error) {
      console.warn(`OneDrive fetch failed for ${dataType}, falling back to local:`, error);
    }

    // Fallback to local API
    return await this.getLocalData(dataType);
  }

  async saveData(dataType, data) {
    try {
      // Save locally first
      await this.updateLocalData(dataType, data);
      
      // Sync to OneDrive if available
      if (this.useOneDrive && this.oneDriveManager && this.syncMode === 'auto') {
        await this.oneDriveManager.uploadJSONData(`${dataType}.json`, data);
        console.log(`${dataType} synced to OneDrive`);
      }
      
      return data;
    } catch (error) {
      console.error(`Error saving ${dataType}:`, error);
      throw error;
    }
  }

  // Local data operations
  async getLocalData(dataType) {
    const response = await fetch(`/api/${dataType}`);
    if (response.ok) {
      return await response.json();
    }
    throw new Error(`Failed to fetch ${dataType} locally`);
  }

  async updateLocalData(dataType, data) {
    const response = await fetch(`/api/${dataType}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data)
    });
    
    if (!response.ok) {
      throw new Error(`Failed to update ${dataType} locally`);
    }
    
    return await response.json();
  }

  // Customer operations
  async getCustomers() {
    return await this.getData('customers');
  }

  async addCustomer(customer) {
    const customers = await this.getCustomers();
    customers.push(customer);
    return await this.saveData('customers', customers);
  }

  async updateCustomer(customerId, updatedCustomer) {
    const customers = await this.getCustomers();
    const index = customers.findIndex(c => c.id === customerId);
    if (index !== -1) {
      customers[index] = { ...customers[index], ...updatedCustomer };
      await this.saveData('customers', customers);
    }
    return customers;
  }

  // Enquiry operations
  async getEnquiries() {
    return await this.getData('enquiries');
  }

  async addEnquiry(enquiry) {
    const enquiries = await this.getEnquiries();
    enquiries.push(enquiry);
    return await this.saveData('enquiries', enquiries);
  }

  async updateEnquiry(enquiryId, updatedEnquiry) {
    const enquiries = await this.getEnquiries();
    const index = enquiries.findIndex(e => e.id === enquiryId);
    if (index !== -1) {
      enquiries[index] = { ...enquiries[index], ...updatedEnquiry };
      await this.saveData('enquiries', enquiries);
    }
    return enquiries;
  }

  // Fee operations
  async getFees() {
    return await this.getData('fees');
  }

  async updateFeeStatus(feeId, status) {
    const fees = await this.getFees();
    const index = fees.findIndex(f => f.id === feeId);
    if (index !== -1) {
      fees[index].status = status;
      fees[index].updatedAt = new Date().toISOString();
      await this.saveData('fees', fees);
    }
    return fees;
  }

  // Document operations
  async uploadDocument(customerId, file, documentType) {
    try {
      // Upload to OneDrive if available
      if (this.useOneDrive && this.oneDriveManager) {
        const oneDriveFile = await this.oneDriveManager.uploadDocument(customerId, file, documentType);
        
        // Update customer's document list
        const customers = await this.getCustomers();
        const customerIndex = customers.findIndex(c => c.id === customerId);
        if (customerIndex !== -1) {
          if (!customers[customerIndex].documents) {
            customers[customerIndex].documents = [];
          }
          
          customers[customerIndex].documents.push({
            id: oneDriveFile.id,
            type: documentType,
            name: oneDriveFile.name,
            uploadedAt: oneDriveFile.uploadedAt,
            size: oneDriveFile.size,
            status: 'pending',
            storageLocation: 'onedrive'
          });
          
          await this.saveData('customers', customers);
        }
        
        return oneDriveFile;
      }
    } catch (error) {
      console.error('OneDrive upload failed:', error);
    }
    
    // Fallback to local storage
    // Implementation depends on your local file storage setup
    throw new Error('Local document storage not implemented');
  }

  // Sync operations
  async forceSyncToOneDrive() {
    if (!this.useOneDrive || !this.oneDriveManager) {
      throw new Error('OneDrive not available');
    }

    const dataTypes = ['customers', 'enquiries', 'users', 'products', 'fees', 'notes', 'authors'];
    const results = [];

    for (const dataType of dataTypes) {
      try {
        const localData = await this.getLocalData(dataType);
        await this.oneDriveManager.uploadJSONData(`${dataType}.json`, localData);
        results.push({ dataType, status: 'success' });
      } catch (error) {
        results.push({ dataType, status: 'failed', error: error.message });
      }
    }

    return results;
  }

  async forceSyncFromOneDrive() {
    if (!this.useOneDrive || !this.oneDriveManager) {
      throw new Error('OneDrive not available');
    }

    const dataTypes = ['customers', 'enquiries', 'users', 'products', 'fees', 'notes', 'authors'];
    const results = [];

    for (const dataType of dataTypes) {
      try {
        const oneDriveData = await this.oneDriveManager.downloadJSONData(`${dataType}.json`);
        await this.updateLocalData(dataType, oneDriveData);
        results.push({ dataType, status: 'success' });
      } catch (error) {
        results.push({ dataType, status: 'failed', error: error.message });
      }
    }

    return results;
  }

  // Configuration
  setSyncMode(mode) {
    this.syncMode = mode; // 'auto', 'manual', 'offline'
  }

  getSyncMode() {
    return this.syncMode;
  }

  isOneDriveAvailable() {
    return this.useOneDrive && this.oneDriveManager !== null;
  }

  getConnectionStatus() {
    return {
      oneDriveConnected: this.useOneDrive,
      syncMode: this.syncMode,
      user: this.auth?.getCurrentUser() || null
    };
  }
}

// Create singleton instance
let dataManagerInstance = null;

export const getDataManager = async () => {
  if (!dataManagerInstance) {
    dataManagerInstance = new HybridDataManager();
    await dataManagerInstance.initialize();
  }
  return dataManagerInstance;
};

export default HybridDataManager;
