import { useState, useEffect } from 'react';
import DataTable from '../components/DataTable';
import Modal from '../components/Modal';
import AlertBanner from '../components/AlertBanner';
import api from '../api';

const columns = [
  { key: 'serviceId', label: 'SERVICE ID' },
  { key: 'branchId', label: 'BRANCH ID' },
  { key: 'courierId', label: 'COURIER ID' },
  { key: 'charges', label: 'CHARGES (₹)' },
];

export default function Services() {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [alert, setAlert] = useState(null);

  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingService, setEditingService] = useState(null);
  const [deletingService, setDeletingService] = useState(null);

  const [formData, setFormData] = useState({
    branchId: 1,
    courierId: 101,
    charges: 100.0,
  });

  const loadServices = async () => {
    setLoading(true);
    try {
      const data = await api.getServices();
      setServices(Array.isArray(data) ? data : []);
    } catch (err) {
      setServices([]);
      setAlert({ type: 'error', message: `Backend/Database unavailable: ${err.message}` });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadServices();
  }, []);

  const handleOpenAdd = () => {
    setFormData({ branchId: 1, courierId: 101, charges: 120.0 });
    setIsAddOpen(true);
  };

  const handleOpenEdit = (s) => {
    setEditingService(s);
    setFormData({
      branchId: s.branchId || 1,
      courierId: s.courierId || 101,
      charges: s.charges || 0.0,
    });
  };

  const handleSaveAdd = async (e) => {
    e.preventDefault();
    try {
      await api.createService(formData);
      setAlert({ type: 'success', message: 'Courier service added to Oracle DB.' });
      setIsAddOpen(false);
      await loadServices();
    } catch (err) {
      setAlert({ type: 'error', message: `Failed to add service: ${err.message}` });
    }
  };

  const handleSaveEdit = async (e) => {
    e.preventDefault();
    if (!editingService) return;
    try {
      await api.updateService(editingService.serviceId, formData);
      setAlert({ type: 'success', message: `Service #${editingService.serviceId} updated.` });
      setEditingService(null);
      await loadServices();
    } catch (err) {
      setAlert({ type: 'error', message: `Failed to update service #${editingService.serviceId}: ${err.message}` });
    }
  };

  const handleConfirmDelete = async () => {
    if (!deletingService) return;
    try {
      await api.deleteService(deletingService.serviceId);
      setAlert({ type: 'success', message: `Service #${deletingService.serviceId} deleted.` });
      setDeletingService(null);
      await loadServices();
    } catch (err) {
      setAlert({ type: 'error', message: `Failed to delete service #${deletingService.serviceId}: ${err.message}` });
      setDeletingService(null);
    }
  };

  return (
    <main className="content">
      <div className="pageHead">
        <div>
          <p className="eyebrow">MANAGEMENT</p>
          <h1>Courier Services</h1>
          <p className="muted">Manage operational service offerings and pricing tariffs per branch.</p>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button className="filterBtn" onClick={loadServices} style={{ cursor: 'pointer', background: '#fff' }} title="Reload services from Oracle">
            ↻ Refresh
          </button>
          <button className="primary" onClick={handleOpenAdd}>
            ＋ Add Service
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
        rows={services}
        searchPlaceholder="Search courier services by type, cost, branch ID..."
        onEdit={handleOpenEdit}
        onDelete={(row) => setDeletingService(row)}
      />

      {/* Add Modal */}
      <Modal isOpen={isAddOpen} title="Register New Service Tariff" onClose={() => setIsAddOpen(false)}>
        <form onSubmit={handleSaveAdd}>
          <div style={{ display: 'grid', gap: '12px' }}>
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
            <div>
              <label style={{ display: 'block', fontSize: '11px', fontWeight: '600', color: '#405148', marginBottom: '4px' }}>Courier Partner ID (FK: COURIER) *</label>
              <input
                type="number"
                required
                value={formData.courierId}
                onChange={(e) => setFormData({ ...formData, courierId: parseInt(e.target.value) || 101 })}
                style={{ width: '100%', padding: '8px 12px', border: '1px solid #dce5df', borderRadius: '7px', fontSize: '12px', boxSizing: 'border-box' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '11px', fontWeight: '600', color: '#405148', marginBottom: '4px' }}>Base Charges (₹) *</label>
              <input
                type="number"
                step="any"
                required
                value={formData.charges}
                onChange={(e) => setFormData({ ...formData, charges: parseFloat(e.target.value) || 0 })}
                style={{ width: '100%', padding: '8px 12px', border: '1px solid #dce5df', borderRadius: '7px', fontSize: '12px', boxSizing: 'border-box' }}
              />
            </div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' }}>
            <button type="button" className="filterBtn" onClick={() => setIsAddOpen(false)} style={{ cursor: 'pointer' }}>Cancel</button>
            <button type="submit" className="primary">Register Service</button>
          </div>
        </form>
      </Modal>

      {/* Edit Modal */}
      <Modal isOpen={Boolean(editingService)} title={`Edit Service #${editingService?.serviceId}`} onClose={() => setEditingService(null)}>
        <form onSubmit={handleSaveEdit}>
          <div style={{ display: 'grid', gap: '12px' }}>
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
              <label style={{ display: 'block', fontSize: '11px', fontWeight: '600', color: '#405148', marginBottom: '4px' }}>Base Charges (₹) *</label>
              <input
                type="number"
                step="any"
                required
                value={formData.charges}
                onChange={(e) => setFormData({ ...formData, charges: parseFloat(e.target.value) || 0 })}
                style={{ width: '100%', padding: '8px 12px', border: '1px solid #dce5df', borderRadius: '7px', fontSize: '12px', boxSizing: 'border-box' }}
              />
            </div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' }}>
            <button type="button" className="filterBtn" onClick={() => setEditingService(null)} style={{ cursor: 'pointer' }}>Cancel</button>
            <button type="submit" className="primary">Update Service</button>
          </div>
        </form>
      </Modal>

      {/* Delete Modal */}
      <Modal isOpen={Boolean(deletingService)} title="Confirm Delete" onClose={() => setDeletingService(null)}>
        <p style={{ fontSize: '13px', color: '#33473d', margin: '0 0 20px 0', lineHeight: 1.5 }}>
          Are you sure you want to delete service tariff #{deletingService?.serviceId}?
        </p>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
          <button type="button" className="filterBtn" onClick={() => setDeletingService(null)} style={{ cursor: 'pointer' }}>Cancel</button>
          <button
            type="button"
            className="filterBtn"
            onClick={handleConfirmDelete}
            style={{ backgroundColor: '#b55353', color: '#fff', borderColor: '#b55353', cursor: 'pointer' }}
          >
            Delete Service
          </button>
        </div>
      </Modal>
    </main>
  );
}
