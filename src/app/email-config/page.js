'use client'
import { useState, useEffect } from 'react'

export default function EmailConfigChecker() {
  const [configStatus, setConfigStatus] = useState(null)
  const [testResult, setTestResult] = useState(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    checkConfiguration()
  }, [])

  const checkConfiguration = async () => {
    try {
      const response = await fetch('/api/email-config')
      const data = await response.json()
      setConfigStatus(data.config)
    } catch (error) {
      console.error('Error checking config:', error)
    }
  }

  const testConfiguration = async () => {
    setLoading(true)
    setTestResult(null)
    
    try {
      const response = await fetch('/api/email-config', { method: 'POST' })
      const data = await response.json()
      setTestResult(data)
    } catch (error) {
      setTestResult({
        success: false,
        message: 'Test failed',
        error: error.message
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container py-5">
      <div className="row justify-content-center">
        <div className="col-lg-8">
          <h1 className="mb-4">Email Configuration Status</h1>
          
          {/* Configuration Status */}
          <div className="card mb-4">
            <div className="card-header">
              <h5 className="mb-0">Current Configuration</h5>
            </div>
            <div className="card-body">
              {configStatus ? (
                <div>
                  <div className="row mb-3">
                    <div className="col-sm-4"><strong>Status:</strong></div>
                    <div className="col-sm-8">
                      <span className={`badge ${configStatus.isConfigured ? 'bg-success' : 'bg-danger'}`}>
                        {configStatus.isConfigured ? 'Configured' : 'Not Configured'}
                      </span>
                    </div>
                  </div>
                  
                  <div className="row mb-3">
                    <div className="col-sm-4"><strong>Email User:</strong></div>
                    <div className="col-sm-8">
                      <code>{configStatus.emailUser}</code>
                    </div>
                  </div>
                  
                  <div className="row mb-3">
                    <div className="col-sm-4"><strong>Provider:</strong></div>
                    <div className="col-sm-8">
                      <span className="badge bg-info">{configStatus.providerName}</span>
                    </div>
                  </div>
                  
                  <div className="row mb-3">
                    <div className="col-sm-4"><strong>Password Set:</strong></div>
                    <div className="col-sm-8">
                      <span className={`badge ${configStatus.hasPassword ? 'bg-success' : 'bg-danger'}`}>
                        {configStatus.hasPassword ? `Yes (${configStatus.passwordLength} chars)` : 'No'}
                      </span>
                    </div>
                  </div>
                  
                  <div className="row mb-3">
                    <div className="col-sm-4"><strong>Custom SMTP:</strong></div>
                    <div className="col-sm-8">
                      <span className={`badge ${configStatus.customSMTP ? 'bg-warning' : 'bg-secondary'}`}>
                        {configStatus.customSMTP ? 'Yes' : 'Auto-detected'}
                      </span>
                    </div>
                  </div>

                  <div className="row mb-3">
                    <div className="col-sm-4"><strong>Validation:</strong></div>
                    <div className="col-sm-8">
                      {configStatus.validation.isValid ? (
                        <span className="badge bg-success">Valid</span>
                      ) : (
                        <div>
                          <span className="badge bg-danger">Invalid</span>
                          <ul className="mt-2 mb-0 text-danger">
                            {configStatus.validation.errors.map((error, index) => (
                              <li key={index}>{error}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center">
                  <div className="spinner-border" role="status">
                    <span className="visually-hidden">Loading...</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Setup Instructions */}
          {configStatus && configStatus.instructions && (
            <div className="card mb-4">
              <div className="card-header">
                <h5 className="mb-0">Setup Instructions</h5>
              </div>
              <div className="card-body">
                <ol>
                  {configStatus.instructions.map((instruction, index) => (
                    <li key={index}>{instruction}</li>
                  ))}
                </ol>
              </div>
            </div>
          )}

          {/* Test Configuration */}
          <div className="card mb-4">
            <div className="card-header">
              <h5 className="mb-0">Test Email Connection</h5>
            </div>
            <div className="card-body">
              <button 
                className="btn btn-primary"
                onClick={testConfiguration}
                disabled={loading || !configStatus?.isConfigured}
              >
                {loading ? 'Testing...' : 'Test Email Connection'}
              </button>
              
              {testResult && (
                <div className={`alert mt-3 ${testResult.success ? 'alert-success' : 'alert-danger'}`}>
                  <strong>{testResult.success ? 'Success!' : 'Failed!'}</strong> {testResult.message}
                  {testResult.error && (
                    <div className="mt-2">
                      <strong>Error:</strong> {testResult.error}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Configuration Help */}
          <div className="card">
            <div className="card-header">
              <h5 className="mb-0">How to Set Email Credentials</h5>
            </div>
            <div className="card-body">
              <ol>
                <li>Create a <code>.env.local</code> file in your project root</li>
                <li>Add your email credentials:
                  <pre className="bg-light p-3 mt-2">
{`EMAIL_USER=your-email@outlook.com
EMAIL_PASSWORD=your-16-character-app-password`}
                  </pre>
                </li>
                <li>Get your App Password from: <a href="https://account.microsoft.com/security" target="_blank" rel="noopener noreferrer">Microsoft Account Security</a></li>
                <li>Restart your development server: <code>npm run dev</code></li>
              </ol>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
