import { useState, useEffect } from 'react';
import DataTable from '../components/DataTable';
import Modal from '../components/Modal';
import AlertBanner from '../components/AlertBanner';
import api from '../api';

const columns = [
  { key: 'courierId', label: 'COURIER ID' },
  { key: 'name', label: 'COURIER NAME' },
  { key: 'email', label: 'EMAIL' },
];

export default function Couriers() {
  const [couriers, setCouriers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [alert, setAlert] = useState(null);

  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingCourier, setEditingCourier] = useState(null);
  const [deletingCourier, setDeletingCourier] = useState(null);

  const [formData, setFormData] = useState({ name: '', email: '' });

  const loadCouriers = async () => {
    setLoading(true);
    try {
      const data = await api.getCouriers();
      setCouriers(Array.isArray(data) ? data : []);
    } catch (err) {
      setCouriers([]);
      setAlert({ type: 'error', message: `Backend/Database unavailable: ${err.message}` });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCouriers();
  }, []);

  const handleOpenAdd = () => {
    setFormData({ name: '', email: '' });
    setIsAddOpen(true);
  };

  const handleOpenEdit = (c) => {
    setEditingCourier(c);
    setFormData({ name: c.name || '', email: c.email || '' });
  };

  const handleSaveAdd = async (e) => {
    e.preventDefault();
    try {
      await api.createCourier(formData);
      setAlert({ type: 'success', message: 'Courier partner added successfully.' });
      setIsAddOpen(false);
      await loadCouriers();
    } catch (err) {
      setAlert({ type: 'error', message: `Failed to add courier: ${err.message}` });
    }
  };

  const handleSaveEdit = async (e) => {
    e.preventDefault();
    if (!editingCourier) return;
    try {
      await api.updateCourier(editingCourier.courierId, formData);
      setAlert({ type: 'success', message: `Courier #${editingCourier.courierId} updated.` });
      setEditingCourier(null);
      await loadCouriers();
    } catch (err) {
      setAlert({ type: 'error', message: `Failed to update courier #${editingCourier.courierId}: ${err.message}` });
    }
  };

  const handleConfirmDelete = async () => {
    if (!deletingCourier) return;
    try {
      await api.deleteCourier(deletingCourier.courierId);
      setAlert({ type: 'success', message: `Courier #${deletingCourier.courierId} removed.` });
      setDeletingCourier(null);
      await loadCouriers();
    } catch (err) {
      setAlert({ type: 'error', message: `Failed to delete courier #${deletingCourier.courierId}: ${err.message}` });
      setDeletingCourier(null);
    }
  };

  return (
    <main className="content">
      <div className="pageHead">
        <div>
          <p className="eyebrow">MANAGEMENT</p>
          <h1>Couriers</h1>
          <p className="muted">Manage delivery partner organizations in Oracle COURIER table.</p>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button className="filterBtn" onClick={loadCouriers} style={{ cursor: 'pointer', background: '#fff' }} title="Reload couriers from Oracle">
            ↻ Refresh
          </button>
          <button className="primary" onClick={handleOpenAdd}>
            ＋ Add Courier
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
        rows={couriers}
        searchPlaceholder="Search couriers by ID, name, email..."
        onEdit={handleOpenEdit}
        onDelete={(row) => setDeletingCourier(row)}
      />

      {/* Add Modal */}
      <Modal isOpen={isAddOpen} title="Add Courier Company" onClose={() => setIsAddOpen(false)}>
        <form onSubmit={handleSaveAdd}>
          <div style={{ display: 'grid', gap: '12px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '11px', fontWeight: '600', color: '#405148', marginBottom: '4px' }}>Courier Partner Name *</label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                style={{ width: '100%', padding: '8px 12px', border: '1px solid #dce5df', borderRadius: '7px', fontSize: '12px', boxSizing: 'border-box' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '11px', fontWeight: '600', color: '#405148', marginBottom: '4px' }}>Official Email *</label>
              <input
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                style={{ width: '100%', padding: '8px 12px', border: '1px solid #dce5df', borderRadius: '7px', fontSize: '12px', boxSizing: 'border-box' }}
              />
            </div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' }}>
            <button type="button" className="filterBtn" onClick={() => setIsAddOpen(false)} style={{ cursor: 'pointer' }}>Cancel</button>
            <button type="submit" className="primary">Add Courier</button>
          </div>
        </form>
      </Modal>

      {/* Edit Modal */}
      <Modal isOpen={Boolean(editingCourier)} title={`Edit Courier #${editingCourier?.courierId}`} onClose={() => setEditingCourier(null)}>
        <form onSubmit={handleSaveEdit}>
          <div style={{ display: 'grid', gap: '12px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '11px', fontWeight: '600', color: '#405148', marginBottom: '4px' }}>Courier Partner Name *</label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                style={{ width: '100%', padding: '8px 12px', border: '1px solid #dce5df', borderRadius: '7px', fontSize: '12px', boxSizing: 'border-box' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '11px', fontWeight: '600', color: '#405148', marginBottom: '4px' }}>Official Email *</label>
              <input
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                style={{ width: '100%', padding: '8px 12px', border: '1px solid #dce5df', borderRadius: '7px', fontSize: '12px', boxSizing: 'border-box' }}
              />
            </div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' }}>
            <button type="button" className="filterBtn" onClick={() => setEditingCourier(null)} style={{ cursor: 'pointer' }}>Cancel</button>
            <button type="submit" className="primary">Update Courier</button>
          </div>
        </form>
      </Modal>

      {/* Delete Modal */}
      <Modal isOpen={Boolean(deletingCourier)} title="Confirm Delete" onClose={() => setDeletingCourier(null)}>
        <p style={{ fontSize: '13px', color: '#33473d', margin: '0 0 20px 0', lineHeight: 1.5 }}>
          Are you sure you want to remove Courier partner <b>{deletingCourier?.name}</b>?
        </p>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
          <button type="button" className="filterBtn" onClick={() => setDeletingCourier(null)} style={{ cursor: 'pointer' }}>Cancel</button>
          <button
            type="button"
            className="filterBtn"
            onClick={handleConfirmDelete}
            style={{ backgroundColor: '#b55353', color: '#fff', borderColor: '#b55353', cursor: 'pointer' }}
          >
            Delete Courier
          </button>
        </div>
      </Modal>
    </main>
  );
}
