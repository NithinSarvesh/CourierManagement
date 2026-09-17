import { useState, useEffect } from 'react';
import DataTable from '../components/DataTable';
import Modal from '../components/Modal';
import AlertBanner from '../components/AlertBanner';
import api from '../api';

const DEFAULT_STAFF = [
  { staffId: 201, role: 'Manager', branchId: 1, name: 'Ravi Kumar', department: 'Operations' },
  { staffId: 202, role: 'Customer Support', branchId: 1, name: 'Anita Rao', department: 'Support' },
  { staffId: 203, role: 'Accountant', branchId: 2, name: 'Vikram Das', department: 'Finance' },
  { staffId: 204, role: 'Delivery Boy', branchId: 3, name: 'Suresh Nair', department: 'Logistics' },
  { staffId: 205, role: 'Driver', branchId: 1, name: 'Manoj Verma', department: 'Transport' },
];

const columns = [
  { key: 'staffId', label: 'STAFF ID' },
  { key: 'name', label: 'NAME' },
  { key: 'role', label: 'ROLE' },
  { key: 'department', label: 'DEPARTMENT' },
  { key: 'branchId', label: 'BRANCH ID' },
];

export default function Staff() {
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(true);
  const [alert, setAlert] = useState(null);

  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingStaff, setEditingStaff] = useState(null);
  const [deletingStaff, setDeletingStaff] = useState(null);

  const [formData, setFormData] = useState({
    name: '',
    role: 'Delivery Boy',
    department: 'Logistics',
    branchId: 1,
  });

  const loadStaff = async () => {
    setLoading(true);
    try {
      const data = await api.getStaff();
      setStaff(Array.isArray(data) && data.length > 0 ? data : DEFAULT_STAFF);
    } catch (err) {
      setStaff(DEFAULT_STAFF);
      setAlert({ type: 'warning', message: `${err.message} — Showing local staff view.` });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStaff();
  }, []);

  const handleOpenAdd = () => {
    setFormData({ name: '', role: 'Delivery Boy', department: 'Logistics', branchId: 1 });
    setIsAddOpen(true);
  };

  const handleOpenEdit = (s) => {
    setEditingStaff(s);
    setFormData({
      name: s.name || '',
      role: s.role || 'Staff',
      department: s.department || 'Operations',
      branchId: s.branchId || 1,
    });
  };

  const handleSaveAdd = async (e) => {
    e.preventDefault();
    try {
      await api.createStaff(formData);
      setAlert({ type: 'success', message: 'Staff member added to Oracle STAFF table.' });
      setIsAddOpen(false);
      loadStaff();
    } catch (err) {
      const newId = Math.max(...staff.map(s => s.staffId || 0), 200) + 1;
      setStaff([...staff, { staffId: newId, ...formData }]);
      setAlert({ type: 'info', message: 'Staff added (local session preview).' });
      setIsAddOpen(false);
    }
  };

  const handleSaveEdit = async (e) => {
    e.preventDefault();
    if (!editingStaff) return;
    try {
      await api.updateStaff(editingStaff.staffId, formData);
      setAlert({ type: 'success', message: `Staff #${editingStaff.staffId} updated.` });
      setEditingStaff(null);
      loadStaff();
    } catch (err) {
      setStaff(staff.map(s => s.staffId === editingStaff.staffId ? { ...s, ...formData } : s));
      setAlert({ type: 'info', message: `Staff #${editingStaff.staffId} updated (local session preview).` });
      setEditingStaff(null);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deletingStaff) return;
    try {
      await api.deleteStaff(deletingStaff.staffId);
      setAlert({ type: 'success', message: `Staff #${deletingStaff.staffId} deleted.` });
      setDeletingStaff(null);
      loadStaff();
    } catch (err) {
      setStaff(staff.filter(s => s.staffId !== deletingStaff.staffId));
      setAlert({ type: 'info', message: `Staff #${deletingStaff.staffId} deleted (local session preview).` });
      setDeletingStaff(null);
    }
  };

  return (
    <main className="content">
      <div className="pageHead">
        <div>
          <p className="eyebrow">MANAGEMENT</p>
          <h1>Staff</h1>
          <p className="muted">Manage employees and roles across operational branches.</p>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button className="filterBtn" onClick={loadStaff} style={{ cursor: 'pointer', background: '#fff' }} title="Reload staff from Oracle">
            ↻ Refresh
          </button>
          <button className="primary" onClick={handleOpenAdd}>
            ＋ Add Staff
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
        rows={staff}
        searchPlaceholder="Search staff by ID, name, role, salary, branch..."
        onEdit={handleOpenEdit}
        onDelete={(row) => setDeletingStaff(row)}
      />

      {/* Add Modal */}
      <Modal isOpen={isAddOpen} title="Add Staff Member" onClose={() => setIsAddOpen(false)}>
        <form onSubmit={handleSaveAdd}>
          <div style={{ display: 'grid', gap: '12px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '11px', fontWeight: '600', color: '#405148', marginBottom: '4px' }}>Staff Name *</label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                style={{ width: '100%', padding: '8px 12px', border: '1px solid #dce5df', borderRadius: '7px', fontSize: '12px', boxSizing: 'border-box' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '11px', fontWeight: '600', color: '#405148', marginBottom: '4px' }}>Role *</label>
              <select
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                style={{ width: '100%', padding: '8px 12px', border: '1px solid #dce5df', borderRadius: '7px', fontSize: '12px', background: '#fff' }}
              >
                <option value="Manager">Manager</option>
                <option value="Customer Support">Customer Support</option>
                <option value="Accountant">Accountant</option>
                <option value="Delivery Boy">Delivery Boy</option>
                <option value="Driver">Driver</option>
              </select>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '11px', fontWeight: '600', color: '#405148', marginBottom: '4px' }}>Department *</label>
              <input
                type="text"
                required
                value={formData.department}
                onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                style={{ width: '100%', padding: '8px 12px', border: '1px solid #dce5df', borderRadius: '7px', fontSize: '12px', boxSizing: 'border-box' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '11px', fontWeight: '600', color: '#405148', marginBottom: '4px' }}>Branch ID (FK: BRANCH) *</label>
              <input
                type="number"
                required
                value={formData.branchId}
                onChange={(e) => setFormData({ ...formData, branchId: parseInt(e.target.value) || 1 })}
                style={{ width: '100%', padding: '8px 12px', border: '1px solid #dce5df', borderRadius: '7px', fontSize: '12px', boxSizing: 'border-box' }}
              />
            </div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' }}>
            <button type="button" className="filterBtn" onClick={() => setIsAddOpen(false)} style={{ cursor: 'pointer' }}>Cancel</button>
            <button type="submit" className="primary">Add Staff</button>
          </div>
        </form>
      </Modal>

      {/* Edit Modal */}
      <Modal isOpen={Boolean(editingStaff)} title={`Edit Staff #${editingStaff?.staffId}`} onClose={() => setEditingStaff(null)}>
        <form onSubmit={handleSaveEdit}>
          <div style={{ display: 'grid', gap: '12px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '11px', fontWeight: '600', color: '#405148', marginBottom: '4px' }}>Staff Name *</label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                style={{ width: '100%', padding: '8px 12px', border: '1px solid #dce5df', borderRadius: '7px', fontSize: '12px', boxSizing: 'border-box' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '11px', fontWeight: '600', color: '#405148', marginBottom: '4px' }}>Role *</label>
              <select
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                style={{ width: '100%', padding: '8px 12px', border: '1px solid #dce5df', borderRadius: '7px', fontSize: '12px', background: '#fff' }}
              >
                <option value="Manager">Manager</option>
                <option value="Customer Support">Customer Support</option>
                <option value="Accountant">Accountant</option>
                <option value="Delivery Boy">Delivery Boy</option>
                <option value="Driver">Driver</option>
              </select>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '11px', fontWeight: '600', color: '#405148', marginBottom: '4px' }}>Department *</label>
              <input
                type="text"
                required
                value={formData.department}
                onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                style={{ width: '100%', padding: '8px 12px', border: '1px solid #dce5df', borderRadius: '7px', fontSize: '12px', boxSizing: 'border-box' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '11px', fontWeight: '600', color: '#405148', marginBottom: '4px' }}>Branch ID (FK) *</label>
              <input
                type="number"
                required
                value={formData.branchId}
                onChange={(e) => setFormData({ ...formData, branchId: parseInt(e.target.value) || 1 })}
                style={{ width: '100%', padding: '8px 12px', border: '1px solid #dce5df', borderRadius: '7px', fontSize: '12px', boxSizing: 'border-box' }}
              />
            </div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' }}>
            <button type="button" className="filterBtn" onClick={() => setEditingStaff(null)} style={{ cursor: 'pointer' }}>Cancel</button>
            <button type="submit" className="primary">Update Staff</button>
          </div>
        </form>
      </Modal>

      {/* Delete Modal */}
      <Modal isOpen={Boolean(deletingStaff)} title="Confirm Delete" onClose={() => setDeletingStaff(null)}>
        <p style={{ fontSize: '13px', color: '#33473d', margin: '0 0 20px 0', lineHeight: 1.5 }}>
          Are you sure you want to remove staff member <b>{deletingStaff?.name}</b>?
        </p>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
          <button type="button" className="filterBtn" onClick={() => setDeletingStaff(null)} style={{ cursor: 'pointer' }}>Cancel</button>
          <button
            type="button"
            className="filterBtn"
            onClick={handleConfirmDelete}
            style={{ backgroundColor: '#b55353', color: '#fff', borderColor: '#b55353', cursor: 'pointer' }}
          >
            Delete Staff
          </button>
        </div>
      </Modal>
    </main>
  );
}
