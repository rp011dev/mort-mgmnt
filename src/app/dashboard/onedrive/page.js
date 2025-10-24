'use client';

import React from 'react';
import OneDriveStatusComponent from '../../../components/OneDriveStatusComponent';
import OneDriveFolderPicker from '../../../components/OneDriveFolderPicker';

export default function OneDrivePage() {
  return (
    <div>
      

      <div className="container py-5">
        {/* OneDrive Folder Configuration */}
        <div className="row">
          <div className="col-12">
            <OneDriveFolderPicker />
          </div>
        </div>

        {/* OneDrive Direct Integration Status */}
        <div className="row">
          <div className="col-12">
            <OneDriveStatusComponent />
          </div>
        </div>

        {/* Integration Information Card */}
        <div className="row mt-4">
          <div className="col-12">
            <div className="card border-info">
              <div className="card-header bg-info text-white">
                <h5 className="mb-0">
                  <i className="bi bi-info-circle me-2"></i>
                  About OneDrive Direct Integration
                </h5>
              </div>
              <div className="card-body">
                <div className="row">
                  <div className="col-md-6">
                    <h6><i className="bi bi-check-circle-fill text-success me-2"></i>Current Setup</h6>
                    <ul className="list-unstyled">
                      <li>🔗 <strong>Direct Access:</strong> No symbolic links required</li>
                      <li>☁️ <strong>OneDrive Path:</strong> Automatic detection and usage</li>
                      <li>🔄 <strong>Auto Sync:</strong> OneDrive handles all synchronization</li>
                      <li>💾 <strong>Data Location:</strong> OneDrive/GK-Finance-Data/data/</li>
                      <li>📁 <strong>All Data Files:</strong> Stored directly in OneDrive</li>
                    </ul>
                  </div>
                  
                  <div className="col-md-6">
                    <h6><i className="bi bi-star-fill text-warning me-2"></i>Key Benefits</h6>
                    <ul className="list-unstyled">
                      <li>🚀 <strong>Performance:</strong> Direct file system access</li>
                      <li>🛡️ <strong>Reliability:</strong> No link resolution overhead</li>
                      <li>🔧 <strong>Maintenance:</strong> Zero symbolic link management</li>
                      <li>💼 <strong>Enterprise:</strong> Santander Office 365 support</li>
                      <li>📱 <strong>Accessibility:</strong> Files available on all devices</li>
                    </ul>
                  </div>
                </div>
                
                <div className="row mt-4">
                  <div className="col-12">
                    <div className="alert alert-success d-flex align-items-center">
                      <i className="bi bi-check-circle-fill me-2"></i>
                      <div>
                        <strong>Integration Active:</strong> Your Application is now reading and writing all data files directly from OneDrive without any symbolic links or complex configurations.
                      </div>
                    </div>
                  </div>
                </div>

                {/* Technical Details */}
                <div className="row mt-4">
                  <div className="col-12">
                    <h6><i className="bi bi-gear-fill text-primary me-2"></i>Technical Implementation</h6>
                    <div className="row">
                      <div className="col-md-4">
                        <div className="card bg-light">
                          <div className="card-body text-center">
                            <i className="bi bi-hdd-fill display-6 text-primary"></i>
                            <h6 className="mt-2">Direct File Access</h6>
                            <small className="text-muted">Application reads/writes directly to OneDrive folder</small>
                          </div>
                        </div>
                      </div>
                      <div className="col-md-4">
                        <div className="card bg-light">
                          <div className="card-body text-center">
                            <i className="bi bi-cloud-arrow-up-fill display-6 text-success"></i>
                            <h6 className="mt-2">Automatic Sync</h6>
                            <small className="text-muted">OneDrive desktop app handles cloud synchronization</small>
                          </div>
                        </div>
                      </div>
                      <div className="col-md-4">
                        <div className="card bg-light">
                          <div className="card-body text-center">
                            <i className="bi bi-shield-check-fill display-6 text-warning"></i>
                            <h6 className="mt-2">Enterprise Security</h6>
                            <small className="text-muted">Santander Office 365 compliance and security</small>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
