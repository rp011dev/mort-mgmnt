'use client'
import { notFound } from 'next/navigation'
import { useState } from 'react'
// Dummy referral data for demo
const referrals = [
  {
    id: '1',
    type: 'Solicitor',
    referralName: 'John Smith',
    address: '123 Main St, London',
    customerName: 'Alice Brown',
    amount: 500,
    feeStatus: 'PAID',
    status: 'Open',
    notes: 'Urgent case, handled quickly.'
  },
  {
    id: '2',
    type: 'Insurance',
    referralName: 'Jane Doe',
    address: '456 Market Ave, Bristol',
    customerName: 'Bob Green',
    amount: 350,
    feeStatus: 'UNPAID',
    status: 'Inprogress',
    notes: 'Waiting for documents.'
  }
]

export default function ReferralDetailPage({ params }) {
  const referral = referrals.find(r => r.id === params.id)
  if (!referral) return notFound()

  const [edit, setEdit] = useState(false)
  const [form, setForm] = useState({ ...referral })

  function handleChange(e) {
    const { name, value } = e.target
    setForm(f => ({ ...f, [name]: value }))
  }

  function handleEdit() {
    setEdit(true)
  }
  function handleSave() {
    // Here you would call an API to persist changes
    setEdit(false)
  }
  function handleCancel() {
    setForm({ ...referral })
    setEdit(false)
  }


  return (
    <div className="container py-4">
      <h2 className="mb-4">Referral Details</h2>
      <div className="card shadow-sm" style={{maxWidth: 480, margin: '0 auto'}}>
        <div className="card-body p-3">
          <form className="row g-2">
            <div className="col-12">
              <label className="form-label mb-1">Type</label>
              {edit ? (
                <input name="type" className="form-control form-control-sm" value={form.type} onChange={handleChange} />
              ) : (
                <div className="fw-bold text-primary">{form.type}</div>
              )}
            </div>
            <div className="col-12">
              <label className="form-label mb-1">Referral Name</label>
              {edit ? (
                <input name="referralName" className="form-control form-control-sm" value={form.referralName} onChange={handleChange} />
              ) : (
                <div>{form.referralName}</div>
              )}
            </div>
            <div className="col-12">
              <label className="form-label mb-1">Property/Transaction Address</label>
              {edit ? (
                <input name="address" className="form-control form-control-sm" value={form.address} onChange={handleChange} />
              ) : (
                <div>{form.address}</div>
              )}
            </div>
            <div className="col-12">
              <label className="form-label mb-1">Customer Name</label>
              {edit ? (
                <input name="customerName" className="form-control form-control-sm" value={form.customerName} onChange={handleChange} />
              ) : (
                <div>{form.customerName}</div>
              )}
            </div>
            <div className="col-12">
              <label className="form-label mb-1">Fees/Referral Amount</label>
              {edit ? (
                <input name="amount" type="number" className="form-control form-control-sm" value={form.amount} onChange={handleChange} />
              ) : (
                <div>£{form.amount}</div>
              )}
            </div>
            <div className="col-6">
              <label className="form-label mb-1">Fee Status</label>
              {edit ? (
                <select name="feeStatus" className="form-select form-select-sm" value={form.feeStatus} onChange={handleChange}>
                  <option value="PAID">PAID</option>
                  <option value="UNPAID">UNPAID</option>
                </select>
              ) : (
                <span className={`badge ${form.feeStatus === 'PAID' ? 'bg-success' : 'bg-warning text-dark'}`}>{form.feeStatus}</span>
              )}
            </div>
            <div className="col-6">
              <label className="form-label mb-1">Status</label>
              {edit ? (
                <select name="status" className="form-select form-select-sm" value={form.status} onChange={handleChange}>
                  <option value="Open">Open</option>
                  <option value="Inprogress">Inprogress</option>
                  <option value="Close">Close</option>
                </select>
              ) : (
                <span className={`badge ${form.status === 'Open' ? 'bg-success' : form.status === 'Inprogress' ? 'bg-warning text-dark' : 'bg-secondary'}`}>{form.status}</span>
              )}
            </div>
            <div className="col-12">
              <label className="form-label mb-1">Notes</label>
              {edit ? (
                <textarea name="notes" className="form-control form-control-sm" value={form.notes} onChange={handleChange} />
              ) : (
                <div>{form.notes}</div>
              )}
            </div>
            <div className="col-12 d-flex justify-content-end gap-2 mt-2">
              {edit ? (
                <>
                  <button type="button" className="btn btn-success btn-sm" onClick={handleSave}>Save</button>
                  <button type="button" className="btn btn-secondary btn-sm" onClick={handleCancel}>Cancel</button>
                </>
              ) : (
                <button type="button" className="btn btn-primary btn-sm" onClick={handleEdit}>Edit</button>
              )}
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
