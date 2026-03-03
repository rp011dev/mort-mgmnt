"use client"
import Link from 'next/link'
import { useState } from 'react'

function ReferralDetailsModal({ referral, show, onClose, onEdit, onSave, onChange, edit, form, isNew }) {
  if (!show || !referral) return null
  return (
    <div className="modal fade show" style={{ display: 'block', background: 'rgba(0,0,0,0.3)' }} tabIndex="-1">
      <div className="modal-dialog modal-dialog-centered" style={{ maxWidth: '400px' }}>
        <div className="modal-content" style={{ borderRadius: '10px', fontSize: '0.97rem' }}>
          <div className="modal-header py-2 px-3" style={{ borderBottom: '1px solid #eee' }}>
            <h6 className="modal-title mb-0" style={{ fontSize: '1.05rem' }}>{isNew ? 'Add Referral' : 'Referral Details'}</h6>
            <button type="button" className="btn-close" style={{ fontSize: '0.8rem' }} onClick={onClose}></button>
          </div>
          <div className="modal-body py-2 px-3">
            <form className="row g-1">
              <div className="col-12 mb-1">
                <label className="form-label mb-0" style={{ fontSize: '0.93rem' }}>Type</label>
                {edit || isNew ? (
                  <input name="type" className="form-control form-control-sm" style={{ height: '28px', fontSize: '0.95rem' }} value={form.type || ''} onChange={onChange} />
                ) : (
                  <div className="fw-bold text-primary">{referral.type}</div>
                )}
              </div>
              <div className="col-12 mb-1">
                <label className="form-label mb-0" style={{ fontSize: '0.93rem' }}>Referral Name</label>
                {edit || isNew ? (
                  <input name="referralName" className="form-control form-control-sm" style={{ height: '28px', fontSize: '0.95rem' }} value={form.referralName || ''} onChange={onChange} />
                ) : (
                  <div>{referral.referralName}</div>
                )}
              </div>
              <div className="col-12 mb-1">
                <label className="form-label mb-0" style={{ fontSize: '0.93rem' }}>Property/Transaction Address</label>
                {edit || isNew ? (
                  <input name="address" className="form-control form-control-sm" style={{ height: '28px', fontSize: '0.95rem' }} value={form.address || ''} onChange={onChange} />
                ) : (
                  <div>{referral.address}</div>
                )}
              </div>
              <div className="col-12 mb-1">
                <label className="form-label mb-0" style={{ fontSize: '0.93rem' }}>Customer Name</label>
                {edit || isNew ? (
                  <input name="customerName" className="form-control form-control-sm" style={{ height: '28px', fontSize: '0.95rem' }} value={form.customerName || ''} onChange={onChange} />
                ) : (
                  <div>{referral.customerName}</div>
                )}
              </div>
              <div className="col-12 mb-1">
                <label className="form-label mb-0" style={{ fontSize: '0.93rem' }}>Fees/Referral Amount</label>
                {edit || isNew ? (
                  <input name="amount" type="number" className="form-control form-control-sm" style={{ height: '28px', fontSize: '0.95rem' }} value={form.amount || ''} onChange={onChange} />
                ) : (
                  <div>£{referral.amount}</div>
                )}
              </div>
              <div className="col-6 mb-1">
                <label className="form-label mb-0" style={{ fontSize: '0.93rem' }}>Fee Status</label>
                {edit || isNew ? (
                  <select name="feeStatus" className="form-select form-select-sm" style={{ height: '28px', fontSize: '0.95rem' }} value={form.feeStatus || ''} onChange={onChange}>
                    <option value="PAID">PAID</option>
                    <option value="UNPAID">UNPAID</option>
                  </select>
                ) : (
                  <span className={`badge ${referral.feeStatus === 'PAID' ? 'bg-success' : 'bg-warning text-dark'}`}>{referral.feeStatus}</span>
                )}
              </div>
              <div className="col-6 mb-1">
                <label className="form-label mb-0" style={{ fontSize: '0.93rem' }}>Status</label>
                {edit || isNew ? (
                  <select name="status" className="form-select form-select-sm" style={{ height: '28px', fontSize: '0.95rem' }} value={form.status || ''} onChange={onChange}>
                    <option value="Open">Open</option>
                    <option value="Inprogress">Inprogress</option>
                    <option value="Close">Close</option>
                  </select>
                ) : (
                  <span className={`badge ${referral.status === 'Open' ? 'bg-success' : referral.status === 'Inprogress' ? 'bg-warning text-dark' : 'bg-secondary'}`}>{referral.status}</span>
                )}
              </div>
              <div className="col-12 mb-1">
                <label className="form-label mb-0" style={{ fontSize: '0.93rem' }}>Notes</label>
                {edit || isNew ? (
                  <textarea name="notes" className="form-control form-control-sm" style={{ minHeight: '40px', fontSize: '0.95rem' }} value={form.notes || ''} onChange={onChange} />
                ) : (
                  <div>{referral.notes}</div>
                )}
              </div>
              <div className="col-12 d-flex justify-content-end gap-2 mt-1">
                {(edit || isNew) ? (
                  <>
                    <button type="button" className="btn btn-success btn-sm px-2 py-1" style={{ fontSize: '0.92rem' }} onClick={onSave}>{isNew ? 'Add' : 'Save'}</button>
                    <button type="button" className="btn btn-secondary btn-sm px-2 py-1" style={{ fontSize: '0.92rem' }} onClick={onClose}>Cancel</button>
                  </>
                ) : (
                  <button type="button" className="btn btn-primary btn-sm px-2 py-1" style={{ fontSize: '0.92rem' }} onClick={onEdit}>Edit</button>
                )}
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}

import { useEffect } from 'react'
import { authenticatedFetch } from '@/utils/authenticatedFetch'

export default function ReferralsPage() {
  const [view, setView] = useState('card')
  const [modalOpen, setModalOpen] = useState(false)
  const [selected, setSelected] = useState(null)
  const [edit, setEdit] = useState(false)
  const [form, setForm] = useState(null)
  const [referrals, setReferrals] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [addMode, setAddMode] = useState(false);
  const emptyReferral = {
    type: '',
    referralName: '',
    address: '',
    customerName: '',
    amount: '',
    feeStatus: 'UNPAID',
    status: 'Open',
    notes: ''
  };

  // Fetch referrals from API
  useEffect(() => {
    async function fetchReferrals() {
      setLoading(true)
      setError(null)
      try {
        const res = await authenticatedFetch('/api/referrals')
        if (!res.ok) throw new Error('Failed to fetch referrals')
        const data = await res.json()
        setReferrals(data)
      } catch (err) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }
    fetchReferrals()
  }, [])

  async function openModal(ref) {
    // Defensive: use id if present, else fallback to referralName (for new)
    const id = ref.id || ref._id || ref.referralName;
    if (!id || id === 'undefined') {
      setSelected(ref);
      setForm({ ...ref });
      setModalOpen(true);
      setEdit(false);
      return;
    }
    // Fetch latest details for selected referral
    try {
      const res = await authenticatedFetch(`/api/referrals/${id}`);
      if (!res.ok) throw new Error('Failed to fetch referral details');
      const data = await res.json();
      setSelected(data);
      setForm({ ...data });
      setModalOpen(true);
      setEdit(false);
    } catch (err) {
      setError(err.message)
    }
  }
  function closeModal() {
    setModalOpen(false)
    setSelected(null)
    setEdit(false)
    setAddMode(false)
  }
  function handleEdit() {
    setEdit(true)
  }
  async function handleSave() {
    if (addMode) {
      // POST new referral
      try {
        const res = await authenticatedFetch('/api/referrals', {
          method: 'POST',
          body: JSON.stringify(form)
        });
        if (!res.ok) throw new Error('Failed to add referral');
        setAddMode(false);
        setModalOpen(false);
        // Refresh referrals list
        const listRes = await authenticatedFetch('/api/referrals');
        if (listRes.ok) setReferrals(await listRes.json());
      } catch (err) {
        setError(err.message);
      }
    } else {
      // PATCH referral via API
      try {
        // Remove _id from update payload to avoid MongoDB immutable field error
        const { _id, id, ...updateFields } = form;
        const res = await authenticatedFetch(`/api/referrals/${form._id || form.id}`, {
          method: 'PATCH',
          body: JSON.stringify(updateFields)
        });
        if (!res.ok) throw new Error('Failed to update referral');
        setEdit(false);
        setSelected({ ...form });
        // Refresh referrals list
        const listRes = await authenticatedFetch('/api/referrals');
        if (listRes.ok) setReferrals(await listRes.json());
      } catch (err) {
        setError(err.message);
      }
    }
  }
  function handleChange(e) {
    const { name, value } = e.target
    setForm(f => ({ ...f, [name]: value }))
  }

  function handleAddReferral() {
    setForm({ ...emptyReferral });
    setSelected(emptyReferral);
    setAddMode(true);
    setModalOpen(true);
    setEdit(false);
  }

  const [searchText, setSearchText] = useState("");
  const [filterType, setFilterType] = useState("");
  const [filterFeeStatus, setFilterFeeStatus] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [total, setTotal] = useState(0);

  async function handleSearch(p = page) {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (searchText.trim()) params.append("search", searchText.trim());
      if (filterType) params.append("type", filterType);
      if (filterFeeStatus) params.append("feeStatus", filterFeeStatus);
      if (filterStatus) params.append("status", filterStatus);
      params.append("page", p);
      params.append("pageSize", pageSize);
      const res = await authenticatedFetch(`/api/referrals?${params.toString()}`);
      if (!res.ok) throw new Error("Failed to fetch referrals");
      const result = await res.json();
      setReferrals(result.data);
      setTotal(result.total);
      setPage(result.page);
      setPageSize(result.pageSize);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  function handlePageChange(newPage) {
    handleSearch(newPage);
  }

  // Auto-search when typing (min 2 chars)
  useEffect(() => {
    if (searchText.trim().length >= 2) {
      handleSearch(1);
    } else if (searchText.trim().length === 0) {
      handleSearch(1);
    }
    // eslint-disable-next-line
  }, [searchText]);

  // Auto-search when filter changes
  useEffect(() => {
    handleSearch(1);
    // eslint-disable-next-line
  }, [filterType, filterFeeStatus, filterStatus]);

  // Defensive: ensure referrals is always an array
  let safeReferrals = [];
  if (Array.isArray(referrals)) {
    safeReferrals = referrals;
  } else if (Array.isArray(referrals?.data)) {
    safeReferrals = referrals.data;
  }

  function handleReset() {
    setSearchText("");
    setFilterType("");
    setFilterFeeStatus("");
    setFilterStatus("");
    handleSearch(1);
  }

  return (
    <div className="container py-4">
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h2 className="mb-0">Referral Portal</h2>
        <div className="d-flex gap-2">
          <button
            className="btn btn-success btn-sm"
            onClick={handleAddReferral}
          >
            + Add Referral
          </button>
          <button
            className="btn btn-outline-secondary btn-sm"
            onClick={() => setView(view === 'card' ? 'table' : 'card')}
          >
            {view === 'card' ? 'Table View' : 'Card View'}
          </button>
        </div>
      </div>
      <div className="row mb-3 g-2 search-filter-row">
        <div className="col-md-4">
          <input
            type="text"
            className="form-control form-control-sm"
            placeholder="Search by Referral Name, Address, Customer Name"
            value={searchText}
            onChange={e => setSearchText(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSearch()}
          />
        </div>
        <div className="col-md-2">
          <select className="form-select form-select-sm" value={filterType} onChange={e => setFilterType(e.target.value)}>
            <option value="">Type</option>
            <option value="Solicitor">Solicitor</option>
            <option value="Insurance">Insurance</option>
            <option value="Other">Other</option>
          </select>
        </div>
        <div className="col-md-2">
          <select className="form-select form-select-sm" value={filterFeeStatus} onChange={e => setFilterFeeStatus(e.target.value)}>
            <option value="">Fee Status</option>
            <option value="PAID">PAID</option>
            <option value="UNPAID">UNPAID</option>
          </select>
        </div>
        <div className="col-md-2">
          <select className="form-select form-select-sm" value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
            <option value="">Status</option>
            <option value="Open">Open</option>
            <option value="Inprogress">Inprogress</option>
            <option value="Close">Close</option>
          </select>
        </div>
        <div className="col-md-2 d-flex align-items-center">
          <button className="btn btn-outline-secondary btn-sm w-100" style={{ minHeight: '32px' }} onClick={handleReset}>Reset</button>
        </div>
      </div>
      {error && <div className="alert alert-danger py-2 px-3 mb-2">{error}</div>}
      {loading ? (
        <div className="text-center py-4">Loading referrals...</div>
      ) : view === 'card' ? (
        <div className="row">
          {safeReferrals.map(ref => (
            <div key={ref._id || ref.id} className="col-xl-3 col-lg-4 col-md-6 mb-2">
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
              {safeReferrals.map(ref => (
                <tr key={ref._id || ref.id} style={{verticalAlign: 'middle', borderRadius: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)'}}>
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
        isNew={addMode}
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
        .search-filter-row {
          background: #f8f9fa;
          border-radius: 10px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.06);
          padding: 12px 8px;
          margin-bottom: 12px;
        }
        .search-filter-row input.form-control {
          border-radius: 8px;
          border: 1px solid #d1d5db;
          font-size: 0.97rem;
        }
        .search-filter-row select.form-select {
          border-radius: 8px;
          font-size: 0.97rem;
        }
        .search-filter-row .btn-outline-secondary {
          border-radius: 8px;
          font-size: 0.97rem;
          border: 1px solid #bdbdbd;
          background: #fff;
          color: #333;
          transition: background 0.2s, color 0.2s;
        }
        .search-filter-row .btn-outline-secondary:hover {
          background: #e2e6ea;
          color: #222;
        }
        .search-filter-row .btn-success {
          border-radius: 8px;
          font-size: 0.97rem;
          box-shadow: 0 2px 8px rgba(40,167,69,0.08);
        }
      `}</style>
    </div>
  )
}

