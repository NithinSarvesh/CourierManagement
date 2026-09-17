import { useState, useEffect } from 'react';
import DataTable from '../components/DataTable';
import Modal from '../components/Modal';
import AlertBanner from '../components/AlertBanner';
import api from '../api';

const DEFAULT_ATTEMPTS = [
  { branchId: 1, courierId: 101, attemptNo: 1, attemptTime: '2026-09-14 16:30', status: 'Delivered' },
  { branchId: 1, courierId: 102, attemptNo: 2, attemptTime: '2026-09-15 15:00', status: 'Pending' },
  { branchId: 2, courierId: 103, attemptNo: 1, attemptTime: '2026-09-15 17:30', status: 'Failed' },
];

const columns = [
  { key: 'branchId', label: 'BRANCH ID' },
  { key: 'courierId', label: 'COURIER ID' },
  { key: 'attemptNo', label: 'ATTEMPT #' },
  { key: 'attemptTime', label: 'TIME' },
  { key: 'status', label: 'STATUS' },
];

export default function Delivery() {
  const [attempts, setAttempts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [alert, setAlert] = useState(null);

  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingAttempt, setEditingAttempt] = useState(null);
  const [deletingAttempt, setDeletingAttempt] = useState(null);

  const [formData, setFormData] = useState({
    branchId: 1,
    courierId: 101,
    attemptNo: 1,
    status: 'Delivered',
  });

  const loadAttempts = async () => {
    setLoading(true);
    try {
      const data = await api.getDeliveryAttempts();
      setAttempts(Array.isArray(data) && data.length > 0 ? data : DEFAULT_ATTEMPTS);
    } catch (err) {
      setAttempts(DEFAULT_ATTEMPTS);
      setAlert({ type: 'warning', message: `${err.message} — Showing local delivery attempts view.` });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAttempts();
  }, []);

  const handleOpenAdd = () => {
    setFormData({ branchId: 1, courierId: 101, attemptNo: 0, status: 'Delivered' });
    setIsAddOpen(true);
  };

  const handleOpenEdit = (a) => {
    setEditingAttempt(a);
    setFormData({
      branchId: a.branchId,
      courierId: a.courierId || 101,
      attemptNo: a.attemptNo,
      status: a.status || 'Delivered',
    });
  };

  const handleSaveAdd = async (e) => {
    e.preventDefault();
    try {
      await api.createDeliveryAttempt(formData);
      setAlert({ type: 'success', message: 'Delivery attempt recorded in Oracle DB.' });
      setIsAddOpen(false);
      loadAttempts();
    } catch (err) {
      const nextNo = Math.max(...attempts.filter(a => a.branchId === formData.branchId).map(a => a.attemptNo || 0), 0) + 1;
      setAttempts([...attempts, { ...formData, attemptNo: nextNo, attemptTime: new Date().toISOString().replace('T', ' ').substring(0, 16) }]);
      setAlert({ type: 'info', message: 'Attempt added (local session preview).' });
      setIsAddOpen(false);
    }
  };

  const handleSaveEdit = async (e) => {
    e.preventDefault();
    if (!editingAttempt) return;
    try {
      await api.updateDeliveryAttempt(editingAttempt.branchId, editingAttempt.attemptNo, formData);
      setAlert({ type: 'success', message: `Attempt #${editingAttempt.attemptNo} updated.` });
      setEditingAttempt(null);
      loadAttempts();
    } catch (err) {
      setAttempts(attempts.map(a => (a.branchId === editingAttempt.branchId && a.attemptNo === editingAttempt.attemptNo) ? { ...a, ...formData } : a));
      setAlert({ type: 'info', message: `Attempt #${editingAttempt.attemptNo} updated (local session preview).` });
      setEditingAttempt(null);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deletingAttempt) return;
    try {
      await api.deleteDeliveryAttempt(deletingAttempt.branchId, deletingAttempt.attemptNo);
      setAlert({ type: 'success', message: `Attempt #${deletingAttempt.attemptNo} deleted.` });
      setDeletingAttempt(null);
      loadAttempts();
    } catch (err) {
      setAttempts(attempts.filter(a => !(a.branchId === deletingAttempt.branchId && a.attemptNo === deletingAttempt.attemptNo)));
      setAlert({ type: 'info', message: `Attempt #${deletingAttempt.attemptNo} deleted (local session preview).` });
      setDeletingAttempt(null);
    }
  };

  return (
    <main className="content">
      <div className="pageHead">
        <div>
          <p className="eyebrow">MANAGEMENT</p>
          <h1>Delivery Attempts</h1>
          <p className="muted">Track individual courier doorstep delivery trials and outcomes.</p>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button className="filterBtn" onClick={loadAttempts} style={{ cursor: 'pointer', background: '#fff' }} title="Reload delivery attempts from Oracle">
            ↻ Refresh
          </button>
          <button className="primary" onClick={handleOpenAdd}>
            ＋ Record Delivery Attempt
          </button>
        </div>
      </div>

      {alert && (
        <AlertBanner
          type={alert.type}
          message={alert.message}
          onDismiss={() => setAlert(null)}
        />
      )}

      <DataTable
        columns={columns}
        rows={attempts}
        searchPlaceholder="Search delivery attempts by ID, branch ID, recipient, status..."
        onEdit={handleOpenEdit}
        onDelete={(row) => setDeletingAttempt(row)}
      />

      {/* Add Modal */}
      <Modal isOpen={isAddOpen} title="Record Delivery Attempt" onClose={() => setIsAddOpen(false)}>
        <form onSubmit={handleSaveAdd}>
          <div style={{ display: 'grid', gap: '12px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '11px', fontWeight: '600', color: '#405148', marginBottom: '4px' }}>Branch ID (Composite PK Part 1) *</label>
              <input
                type="number"
                required
                value={formData.branchId}
                onChange={(e) => setFormData({ ...formData, branchId: parseInt(e.target.value) || 1 })}
                style={{ width: '100%', padding: '8px 12px', border: '1px solid #dce5df', borderRadius: '7px', fontSize: '12px', boxSizing: 'border-box' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '11px', fontWeight: '600', color: '#405148', marginBottom: '4px' }}>Courier ID (FK: COURIER) *</label>
              <input
                type="number"
                required
                value={formData.courierId}
                onChange={(e) => setFormData({ ...formData, courierId: parseInt(e.target.value) || 101 })}
                style={{ width: '100%', padding: '8px 12px', border: '1px solid #dce5df', borderRadius: '7px', fontSize: '12px', boxSizing: 'border-box' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '11px', fontWeight: '600', color: '#405148', marginBottom: '4px' }}>Status *</label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                style={{ width: '100%', padding: '8px 12px', border: '1px solid #dce5df', borderRadius: '7px', fontSize: '12px', background: '#fff' }}
              >
                <option value="Delivered">Delivered</option>
                <option value="Pending">Pending</option>
                <option value="Failed">Failed</option>
              </select>
            </div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' }}>
            <button type="button" className="filterBtn" onClick={() => setIsAddOpen(false)} style={{ cursor: 'pointer' }}>Cancel</button>
            <button type="submit" className="primary">Record Attempt</button>
          </div>
        </form>
      </Modal>

      {/* Edit Modal */}
      <Modal isOpen={Boolean(editingAttempt)} title={`Edit Attempt (Branch #${editingAttempt?.branchId}, Attempt #${editingAttempt?.attemptNo})`} onClose={() => setEditingAttempt(null)}>
        <form onSubmit={handleSaveEdit}>
          <div style={{ display: 'grid', gap: '12px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '11px', fontWeight: '600', color: '#405148', marginBottom: '4px' }}>Courier Partner ID (FK) *</label>
              <input
                type="number"
                required
                value={formData.courierId}
                onChange={(e) => setFormData({ ...formData, courierId: parseInt(e.target.value) || 101 })}
                style={{ width: '100%', padding: '8px 12px', border: '1px solid #dce5df', borderRadius: '7px', fontSize: '12px', boxSizing: 'border-box' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '11px', fontWeight: '600', color: '#405148', marginBottom: '4px' }}>Status *</label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                style={{ width: '100%', padding: '8px 12px', border: '1px solid #dce5df', borderRadius: '7px', fontSize: '12px', background: '#fff' }}
              >
                <option value="Delivered">Delivered</option>
                <option value="Pending">Pending</option>
                <option value="Failed">Failed</option>
              </select>
            </div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' }}>
            <button type="button" className="filterBtn" onClick={() => setEditingAttempt(null)} style={{ cursor: 'pointer' }}>Cancel</button>
            <button type="submit" className="primary">Update Attempt</button>
          </div>
        </form>
      </Modal>

      {/* Delete Modal */}
      <Modal isOpen={Boolean(deletingAttempt)} title="Confirm Delete" onClose={() => setDeletingAttempt(null)}>
        <p style={{ fontSize: '13px', color: '#33473d', margin: '0 0 20px 0', lineHeight: 1.5 }}>
          Are you sure you want to remove Delivery Attempt #{deletingAttempt?.attemptNo} for branch #{deletingAttempt?.branchId}?
        </p>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
          <button type="button" className="filterBtn" onClick={() => setDeletingAttempt(null)} style={{ cursor: 'pointer' }}>Cancel</button>
          <button
            type="button"
            className="filterBtn"
            onClick={handleConfirmDelete}
            style={{ backgroundColor: '#b55353', color: '#fff', borderColor: '#b55353', cursor: 'pointer' }}
          >
            Delete Attempt
          </button>
        </div>
      </Modal>
    </main>
  );
}
