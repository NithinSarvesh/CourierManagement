import { useState, useEffect } from 'react';
import DataTable from '../components/DataTable';
import Modal from '../components/Modal';
import AlertBanner from '../components/AlertBanner';
import api from '../api';

const DEFAULT_BRANCHES = [
  { branchId: 1, branchName: 'Chennai Central Hub', street: '10 Mount Road', city: 'Chennai', pin: '600002' },
  { branchId: 2, branchName: 'Mumbai West Terminal', street: '22 Bandra Link Road', city: 'Mumbai', pin: '400050' },
  { branchId: 3, branchName: 'Bengaluru North Station', street: '14 Outer Ring Road', city: 'Bengaluru', pin: '560045' },
  { branchId: 4, branchName: 'Delhi Hub Central', street: '5 Barakhamba Road', city: 'Delhi', pin: '110001' },
];

const columns = [
  { key: 'branchId', label: 'BRANCH ID' },
  { key: 'branchName', label: 'BRANCH NAME' },
  { key: 'street', label: 'STREET' },
  { key: 'city', label: 'CITY' },
  { key: 'pin', label: 'PIN' },
];

export default function Branches() {
  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [alert, setAlert] = useState(null);

  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingBranch, setEditingBranch] = useState(null);
  const [deletingBranch, setDeletingBranch] = useState(null);

  const [formData, setFormData] = useState({
    branchName: '',
    street: '',
    city: '',
    pin: ''
  });

  const loadBranches = async () => {
    setLoading(true);
    try {
      const data = await api.getBranches();
      setBranches(Array.isArray(data) && data.length > 0 ? data : DEFAULT_BRANCHES);
    } catch (err) {
      setBranches(DEFAULT_BRANCHES);
      setAlert({ type: 'warning', message: `${err.message} — Showing local branches view.` });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBranches();
  }, []);

  const handleOpenAdd = () => {
    setFormData({ branchName: '', street: '', city: '', pin: '' });
    setIsAddOpen(true);
  };

  const handleOpenEdit = (b) => {
    setEditingBranch(b);
    setFormData({
      branchName: b.branchName || '',
      street: b.street || '',
      city: b.city || '',
      pin: b.pin || ''
    });
  };

  const handleSaveAdd = async (e) => {
    e.preventDefault();
    try {
      await api.createBranch(formData);
      setAlert({ type: 'success', message: 'Branch registered successfully in Oracle BRANCH table.' });
      setIsAddOpen(false);
      loadBranches();
    } catch (err) {
      const newId = Math.max(...branches.map(b => b.branchId || 0), 0) + 1;
      setBranches([...branches, { branchId: newId, ...formData }]);
      setAlert({ type: 'info', message: 'Branch registered (local session preview).' });
      setIsAddOpen(false);
    }
  };

  const handleSaveEdit = async (e) => {
    e.preventDefault();
    if (!editingBranch) return;
    try {
      await api.updateBranch(editingBranch.branchId, formData);
      setAlert({ type: 'success', message: `Branch #${editingBranch.branchId} updated.` });
      setEditingBranch(null);
      loadBranches();
    } catch (err) {
      setBranches(branches.map(b => b.branchId === editingBranch.branchId ? { ...b, ...formData } : b));
      setAlert({ type: 'info', message: `Branch #${editingBranch.branchId} updated (local session preview).` });
      setEditingBranch(null);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deletingBranch) return;
    try {
      await api.deleteBranch(deletingBranch.branchId);
      setAlert({ type: 'success', message: `Branch #${deletingBranch.branchId} deleted.` });
      setDeletingBranch(null);
      loadBranches();
    } catch (err) {
      setBranches(branches.filter(b => b.branchId !== deletingBranch.branchId));
      setAlert({ type: 'info', message: `Branch #${deletingBranch.branchId} deleted (local session preview).` });
      setDeletingBranch(null);
    }
  };

  return (
    <main className="content">
      <div className="pageHead">
        <div>
          <p className="eyebrow">MANAGEMENT</p>
          <h1>Branches</h1>
          <p className="muted">Manage delivery hubs and distribution centers across regions.</p>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button className="filterBtn" onClick={loadBranches} style={{ cursor: 'pointer', background: '#fff' }} title="Reload branches from Oracle">
            ↻ Refresh
          </button>
          <button className="primary" onClick={handleOpenAdd}>
            ＋ Add Branch
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
        rows={branches}
        searchPlaceholder="Search branches by ID, name, city, street, PIN..."
        onEdit={handleOpenEdit}
        onDelete={(row) => setDeletingBranch(row)}
      />

      {/* Add Modal */}
      <Modal isOpen={isAddOpen} title="Register New Branch" onClose={() => setIsAddOpen(false)}>
        <form onSubmit={handleSaveAdd}>
          <div style={{ display: 'grid', gap: '12px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '11px', fontWeight: '600', color: '#405148', marginBottom: '4px' }}>Branch Name *</label>
              <input
                type="text"
                required
                value={formData.branchName}
                onChange={(e) => setFormData({ ...formData, branchName: e.target.value })}
                style={{ width: '100%', padding: '8px 12px', border: '1px solid #dce5df', borderRadius: '7px', fontSize: '12px', boxSizing: 'border-box' }}
                placeholder="e.g. Pune City Hub"
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '11px', fontWeight: '600', color: '#405148', marginBottom: '4px' }}>Street Address *</label>
              <input
                type="text"
                required
                value={formData.street}
                onChange={(e) => setFormData({ ...formData, street: e.target.value })}
                style={{ width: '100%', padding: '8px 12px', border: '1px solid #dce5df', borderRadius: '7px', fontSize: '12px', boxSizing: 'border-box' }}
              />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '10px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: '600', color: '#405148', marginBottom: '4px' }}>City *</label>
                <input
                  type="text"
                  required
                  value={formData.city}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  style={{ width: '100%', padding: '8px 12px', border: '1px solid #dce5df', borderRadius: '7px', fontSize: '12px', boxSizing: 'border-box' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: '600', color: '#405148', marginBottom: '4px' }}>PIN *</label>
                <input
                  type="text"
                  required
                  value={formData.pin}
                  onChange={(e) => setFormData({ ...formData, pin: e.target.value })}
                  style={{ width: '100%', padding: '8px 12px', border: '1px solid #dce5df', borderRadius: '7px', fontSize: '12px', boxSizing: 'border-box' }}
                />
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' }}>
            <button type="button" className="filterBtn" onClick={() => setIsAddOpen(false)} style={{ cursor: 'pointer' }}>Cancel</button>
            <button type="submit" className="primary">Register Branch</button>
          </div>
        </form>
      </Modal>

      {/* Edit Modal */}
      <Modal isOpen={Boolean(editingBranch)} title={`Edit Branch #${editingBranch?.branchId}`} onClose={() => setEditingBranch(null)}>
        <form onSubmit={handleSaveEdit}>
          <div style={{ display: 'grid', gap: '12px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '11px', fontWeight: '600', color: '#405148', marginBottom: '4px' }}>Branch Name *</label>
              <input
                type="text"
                required
                value={formData.branchName}
                onChange={(e) => setFormData({ ...formData, branchName: e.target.value })}
                style={{ width: '100%', padding: '8px 12px', border: '1px solid #dce5df', borderRadius: '7px', fontSize: '12px', boxSizing: 'border-box' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '11px', fontWeight: '600', color: '#405148', marginBottom: '4px' }}>Street Address *</label>
              <input
                type="text"
                required
                value={formData.street}
                onChange={(e) => setFormData({ ...formData, street: e.target.value })}
                style={{ width: '100%', padding: '8px 12px', border: '1px solid #dce5df', borderRadius: '7px', fontSize: '12px', boxSizing: 'border-box' }}
              />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '10px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: '600', color: '#405148', marginBottom: '4px' }}>City *</label>
                <input
                  type="text"
                  required
                  value={formData.city}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  style={{ width: '100%', padding: '8px 12px', border: '1px solid #dce5df', borderRadius: '7px', fontSize: '12px', boxSizing: 'border-box' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: '600', color: '#405148', marginBottom: '4px' }}>PIN *</label>
                <input
                  type="text"
                  required
                  value={formData.pin}
                  onChange={(e) => setFormData({ ...formData, pin: e.target.value })}
                  style={{ width: '100%', padding: '8px 12px', border: '1px solid #dce5df', borderRadius: '7px', fontSize: '12px', boxSizing: 'border-box' }}
                />
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' }}>
            <button type="button" className="filterBtn" onClick={() => setEditingBranch(null)} style={{ cursor: 'pointer' }}>Cancel</button>
            <button type="submit" className="primary">Update Branch</button>
          </div>
        </form>
      </Modal>

      {/* Delete Modal */}
      <Modal isOpen={Boolean(deletingBranch)} title="Confirm Delete" onClose={() => setDeletingBranch(null)}>
        <p style={{ fontSize: '13px', color: '#33473d', margin: '0 0 20px 0', lineHeight: 1.5 }}>
          Are you sure you want to delete branch <b>{deletingBranch?.branchName}</b>?
          This will trigger referential integrity checks on linked staff and services in Oracle.
        </p>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
          <button type="button" className="filterBtn" onClick={() => setDeletingBranch(null)} style={{ cursor: 'pointer' }}>Cancel</button>
          <button
            type="button"
            className="filterBtn"
            onClick={handleConfirmDelete}
            style={{ backgroundColor: '#b55353', color: '#fff', borderColor: '#b55353', cursor: 'pointer' }}
          >
            Delete Branch
          </button>
        </div>
      </Modal>
    </main>
  );
}
