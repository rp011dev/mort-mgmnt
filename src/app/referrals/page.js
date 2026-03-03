
"use client"
import Link from 'next/link'
import { useState } from 'react'

function ReferralDetailsModal({ referral, show, onClose, onEdit, onSave, onChange, edit, form }) {
  if (!show || !referral) return null
  return (
    <div className="modal fade show" style={{ display: 'block', background: 'rgba(0,0,0,0.3)' }} tabIndex="-1">
      <div className="modal-dialog modal-dialog-centered">
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title">Referral Details</h5>
            <button type="button" className="btn-close" onClick={onClose}></button>
          </div>
          <div className="modal-body">
            <form className="row g-2">
              <div className="col-12">
                <label className="form-label mb-1">Type</label>
                {edit ? (
                  <input name="type" className="form-control form-control-sm" value={form.type} onChange={onChange} />
                ) : (
                  <div className="fw-bold text-primary">{referral.type}</div>
                )}
              </div>
              <div className="col-12">
                <label className="form-label mb-1">Referral Name</label>
                {edit ? (
                  <input name="referralName" className="form-control form-control-sm" value={form.referralName} onChange={onChange} />
                ) : (
                  <div>{referral.referralName}</div>
                )}
              </div>
              <div className="col-12">
                <label className="form-label mb-1">Property/Transaction Address</label>
                {edit ? (
                  <input name="address" className="form-control form-control-sm" value={form.address} onChange={onChange} />
                ) : (
                  <div>{referral.address}</div>
                )}
              </div>
              <div className="col-12">
                <label className="form-label mb-1">Customer Name</label>
                {edit ? (
                  <input name="customerName" className="form-control form-control-sm" value={form.customerName} onChange={onChange} />
                ) : (
                  <div>{referral.customerName}</div>
                )}
              </div>
              <div className="col-12">
                <label className="form-label mb-1">Fees/Referral Amount</label>
                {edit ? (
                  <input name="amount" type="number" className="form-control form-control-sm" value={form.amount} onChange={onChange} />
                ) : (
                  <div>£{referral.amount}</div>
                )}
              </div>
              <div className="col-6">
                <label className="form-label mb-1">Fee Status</label>
                {edit ? (
                  <select name="feeStatus" className="form-select form-select-sm" value={form.feeStatus} onChange={onChange}>
                    <option value="PAID">PAID</option>
                    <option value="UNPAID">UNPAID</option>
                  </select>
                ) : (
                  <span className={`badge ${referral.feeStatus === 'PAID' ? 'bg-success' : 'bg-warning text-dark'}`}>{referral.feeStatus}</span>
                )}
              </div>
              <div className="col-6">
                <label className="form-label mb-1">Status</label>
                {edit ? (
                  <select name="status" className="form-select form-select-sm" value={form.status} onChange={onChange}>
                    <option value="Open">Open</option>
                    <option value="Inprogress">Inprogress</option>
                    <option value="Close">Close</option>
                  </select>
                ) : (
                  <span className={`badge ${referral.status === 'Open' ? 'bg-success' : referral.status === 'Inprogress' ? 'bg-warning text-dark' : 'bg-secondary'}`}>{referral.status}</span>
                )}
              </div>
              <div className="col-12">
                <label className="form-label mb-1">Notes</label>
                {edit ? (
                  <textarea name="notes" className="form-control form-control-sm" value={form.notes} onChange={onChange} />
                ) : (
                  <div>{referral.notes}</div>
                )}
              </div>
              <div className="col-12 d-flex justify-content-end gap-2 mt-2">
                {edit ? (
                  <>
                    <button type="button" className="btn btn-success btn-sm" onClick={onSave}>Save</button>
                    <button type="button" className="btn btn-secondary btn-sm" onClick={onClose}>Cancel</button>
                  </>
                ) : (
                  <button type="button" className="btn btn-primary btn-sm" onClick={onEdit}>Edit</button>
                )}
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}

// Dummy referral data for demo
const referrals = [
  {
    id: '1',
    type: 'Solicitor',
    referralName: 'John Smith',
    address: '123 Main St, London',
    customerName: 'Alice Brown',
    status: 'Open',
    feeStatus: 'PAID',
    amount: 500,
    notes: 'Urgent case, handled quickly.'
  },
  {
    id: '2',
    type: 'Insurance',
    referralName: 'Jane Doe',
    address: '456 Market Ave, Bristol',
    customerName: 'Bob Green',
    status: 'Inprogress',
    feeStatus: 'UNPAID',
    amount: 350,
    notes: 'Waiting for documents.'
  }
]

export default function ReferralsPage() {
  const [view, setView] = useState('card')
  const [modalOpen, setModalOpen] = useState(false)
  const [selected, setSelected] = useState(null)
  const [edit, setEdit] = useState(false)
  const [form, setForm] = useState(null)

  function openModal(ref) {
    setSelected(ref)
    setForm({ ...ref })
    setModalOpen(true)
    setEdit(false)
  }
  function closeModal() {
    setModalOpen(false)
    setSelected(null)
    setEdit(false)
  }
  function handleEdit() {
    setEdit(true)
  }
  function handleSave() {
    // Here you would call an API to persist changes
    setEdit(false)
    setSelected({ ...form })
  }
  function handleChange(e) {
    const { name, value } = e.target
    setForm(f => ({ ...f, [name]: value }))
      }

      return (
        <div className="container py-4">
          <div className="d-flex justify-content-between align-items-center mb-3">
            <h2 className="mb-0">Referral Portal</h2>
            <button
              className="btn btn-outline-secondary btn-sm"
              onClick={() => setView(view === 'card' ? 'table' : 'card')}
            >
              {view === 'card' ? 'Table View' : 'Card View'}
            </button>
          </div>
          {view === 'card' ? (
            <div className="row">
              {referrals.map(ref => (
                <div key={ref.id} className="col-xl-3 col-lg-4 col-md-6 mb-2">
                  <span className="text-decoration-none" style={{cursor: 'pointer'}} onClick={() => openModal(ref)}>
                    <div className="card customer-card h-100 d-flex flex-column">
                      <div className="card-header d-flex justify-content-between align-items-center py-2">
                        <h6 className="mb-0 text-primary">{ref.customerName}</h6>
                        <span className="badge bg-secondary">{ref.type}</span>
                      </div>
                      <div className="card-body py-2 px-3 flex-grow-1 d-flex flex-column">
                        <div className="flex-grow-1">
                          <div className="mb-2">
                            <small className="text-muted">Property/Transaction Address:</small>
                            <div className="small">{ref.address}</div>
                          </div>
                          <div className="mb-2">
                            <small className="text-muted">Referral Name:</small>
                            <div className="small">{ref.referralName}</div>
                          </div>
                          <div className="mb-2">
                            <small className="text-muted">Status:</small>
                            <span className={`badge ${ref.status === 'Open' ? 'bg-success' : ref.status === 'Inprogress' ? 'bg-warning text-dark' : 'bg-secondary'}`}>{ref.status}</span>
                          </div>
                        </div>
                        <div className="d-grid mt-auto">
                          <span className="btn btn-outline-primary btn-sm w-100">View Details</span>
                        </div>
                      </div>
                    </div>
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="table-responsive">
              <table className="table compact-table align-middle" style={{ fontSize: '0.97rem', borderRadius: '12px', boxShadow: '0 6px 24px rgba(0,0,0,0.10)', overflow: 'hidden', background: '#fff' }}>
                <thead className="table-light">
                  <tr>
                    <th style={{padding: '6px 10px', fontWeight: 600, fontSize: '0.98rem'}}>Type</th>
                    <th style={{padding: '6px 10px', fontWeight: 600, fontSize: '0.98rem'}}>Referral Name</th>
                    <th style={{padding: '6px 10px', fontWeight: 600, fontSize: '0.98rem'}}>Property/Transaction Address</th>
                    <th style={{padding: '6px 10px', fontWeight: 600, fontSize: '0.98rem'}}>Customer Name</th>
                    <th style={{padding: '6px 10px', fontWeight: 600, fontSize: '0.98rem'}}>Status</th>
                    <th style={{padding: '6px 10px'}}></th>
                  </tr>
                </thead>
                <tbody>
                  {referrals.map(ref => (
                    <tr key={ref.id} style={{verticalAlign: 'middle', borderRadius: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)'}}>
                      <td style={{padding: '6px 10px'}}><span className="badge bg-secondary" style={{fontSize: '0.85rem', padding: '4px 8px'}}>{ref.type}</span></td>
                      <td style={{padding: '6px 10px'}}><span className="fw-bold text-primary" style={{fontSize: '1rem'}}>{ref.referralName}</span></td>
                      <td style={{padding: '6px 10px'}}>{ref.address}</td>
                      <td style={{padding: '6px 10px'}}>{ref.customerName}</td>
                      <td style={{padding: '6px 10px'}}>
                        <span className={`badge ${ref.status === 'Open' ? 'bg-success' : ref.status === 'Inprogress' ? 'bg-warning text-dark' : 'bg-secondary'}`}>{ref.status}</span>
                      </td>
                      <td style={{padding: '6px 10px'}}>
                        <button className="btn btn-outline-primary btn-sm" style={{padding: '2px 10px', fontSize: '0.92rem'}} onClick={() => openModal(ref)}>View Details</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          <ReferralDetailsModal
            referral={selected}
            show={modalOpen}
            onClose={closeModal}
            onEdit={handleEdit}
            onSave={handleSave}
            onChange={handleChange}
            edit={edit}
            form={form}
          />
          {/* Style block must be outside conditional rendering */}
          <style jsx>{`
            .compact-table th, .compact-table td {
              padding: 6px 10px !important;
            }
            .compact-table {
              border-radius: 12px;
              box-shadow: 0 6px 24px rgba(0,0,0,0.10);
              overflow: hidden;
              background: #fff;
            }
            .compact-table tbody tr {
              border-radius: 8px;
              box-shadow: 0 2px 8px rgba(0,0,0,0.06);
            }
            .customer-card:hover {
              transform: translateY(-4px) scale(1.02);
              box-shadow: 0 6px 24px rgba(0,0,0,0.12);
            }
            .modal {
              z-index: 1055;
            }
          `}</style>
        </div>
      )
    }
  
