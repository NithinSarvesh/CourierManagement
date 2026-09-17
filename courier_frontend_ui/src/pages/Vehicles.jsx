import { useState, useEffect } from 'react';
import DataTable from '../components/DataTable';
import Modal from '../components/Modal';
import AlertBanner from '../components/AlertBanner';
import api from '../api';

const columns = [
  { key: 'vehicleNo', label: 'VEHICLE NO' },
  { key: 'licenseNo', label: 'DRIVER LICENSE' },
  { key: 'staffId', label: 'ASSIGNED DRIVER (STAFF ID)' },
];

export default function Vehicles() {
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [alert, setAlert] = useState(null);

  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState(null);
  const [deletingVehicle, setDeletingVehicle] = useState(null);

  const [formData, setFormData] = useState({
    vehicleNo: '',
    licenseNo: '',
    staffId: 205,
  });

  const loadVehicles = async () => {
    setLoading(true);
    try {
      const data = await api.getVehicles();
      setVehicles(Array.isArray(data) ? data : []);
    } catch (err) {
      setVehicles([]);
      setAlert({ type: 'error', message: `Backend/Database unavailable: ${err.message}` });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadVehicles();
  }, []);

  const handleOpenAdd = () => {
    setFormData({ vehicleNo: '', licenseNo: '', staffId: 205 });
    setIsAddOpen(true);
  };

  const handleOpenEdit = (v) => {
    setEditingVehicle(v);
    setFormData({
      vehicleNo: v.vehicleNo,
      licenseNo: v.licenseNo || '',
      staffId: v.staffId || 205,
    });
  };

  const handleSaveAdd = async (e) => {
    e.preventDefault();
    try {
      await api.createVehicle(formData);
      setAlert({ type: 'success', message: 'Vehicle added to Oracle VEHICLE table.' });
      setIsAddOpen(false);
      await loadVehicles();
    } catch (err) {
      setAlert({ type: 'error', message: `Failed to add vehicle: ${err.message}` });
    }
  };

  const handleSaveEdit = async (e) => {
    e.preventDefault();
    if (!editingVehicle) return;
    try {
      await api.updateVehicle(editingVehicle.vehicleNo, formData);
      setAlert({ type: 'success', message: `Vehicle ${editingVehicle.vehicleNo} updated.` });
      setEditingVehicle(null);
      await loadVehicles();
    } catch (err) {
      setAlert({ type: 'error', message: `Failed to update vehicle ${editingVehicle.vehicleNo}: ${err.message}` });
    }
  };

  const handleConfirmDelete = async () => {
    if (!deletingVehicle) return;
    try {
      await api.deleteVehicle(deletingVehicle.vehicleNo);
      setAlert({ type: 'success', message: `Vehicle ${deletingVehicle.vehicleNo} removed.` });
      setDeletingVehicle(null);
      await loadVehicles();
    } catch (err) {
      setAlert({ type: 'error', message: `Failed to delete vehicle ${deletingVehicle.vehicleNo}: ${err.message}` });
      setDeletingVehicle(null);
    }
  };

  return (
    <main className="content">
      <div className="pageHead">
        <div>
          <p className="eyebrow">MANAGEMENT</p>
          <h1>Vehicles</h1>
          <p className="muted">Manage transportation fleet and driver assignments in Oracle DB.</p>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button className="filterBtn" onClick={loadVehicles} style={{ cursor: 'pointer', background: '#fff' }} title="Reload vehicles from Oracle">
            ↻ Refresh
          </button>
          <button className="primary" onClick={handleOpenAdd}>
            ＋ Add Vehicle
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
        rows={vehicles}
        searchPlaceholder="Search vehicles by vehicle no, model, type, courier ID..."
        onEdit={handleOpenEdit}
        onDelete={(row) => setDeletingVehicle(row)}
      />

      {/* Add Modal */}
      <Modal isOpen={isAddOpen} title="Register New Fleet Vehicle" onClose={() => setIsAddOpen(false)}>
        <form onSubmit={handleSaveAdd}>
          <div style={{ display: 'grid', gap: '12px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '11px', fontWeight: '600', color: '#405148', marginBottom: '4px' }}>Vehicle Registration No (PK) *</label>
              <input
                type="text"
                required
                value={formData.vehicleNo}
                onChange={(e) => setFormData({ ...formData, vehicleNo: e.target.value.toUpperCase() })}
                style={{ width: '100%', padding: '8px 12px', border: '1px solid #dce5df', borderRadius: '7px', fontSize: '12px', boxSizing: 'border-box' }}
                placeholder="e.g. DL04AB9999"
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '11px', fontWeight: '600', color: '#405148', marginBottom: '4px' }}>Permit / License No *</label>
              <input
                type="text"
                required
                value={formData.licenseNo}
                onChange={(e) => setFormData({ ...formData, licenseNo: e.target.value })}
                style={{ width: '100%', padding: '8px 12px', border: '1px solid #dce5df', borderRadius: '7px', fontSize: '12px', boxSizing: 'border-box' }}
                placeholder="e.g. LIC-9921"
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '11px', fontWeight: '600', color: '#405148', marginBottom: '4px' }}>Assigned Driver (Staff ID FK) *</label>
              <input
                type="number"
                required
                value={formData.staffId}
                onChange={(e) => setFormData({ ...formData, staffId: parseInt(e.target.value) || 0 })}
                style={{ width: '100%', padding: '8px 12px', border: '1px solid #dce5df', borderRadius: '7px', fontSize: '12px', boxSizing: 'border-box' }}
              />
            </div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' }}>
            <button type="button" className="filterBtn" onClick={() => setIsAddOpen(false)} style={{ cursor: 'pointer' }}>Cancel</button>
            <button type="submit" className="primary">Register Vehicle</button>
          </div>
        </form>
      </Modal>

      {/* Edit Modal */}
      <Modal isOpen={Boolean(editingVehicle)} title={`Edit Vehicle ${editingVehicle?.vehicleNo}`} onClose={() => setEditingVehicle(null)}>
        <form onSubmit={handleSaveEdit}>
          <div style={{ display: 'grid', gap: '12px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '11px', fontWeight: '600', color: '#405148', marginBottom: '4px' }}>Permit / License No *</label>
              <input
                type="text"
                required
                value={formData.licenseNo}
                onChange={(e) => setFormData({ ...formData, licenseNo: e.target.value })}
                style={{ width: '100%', padding: '8px 12px', border: '1px solid #dce5df', borderRadius: '7px', fontSize: '12px', boxSizing: 'border-box' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '11px', fontWeight: '600', color: '#405148', marginBottom: '4px' }}>Assigned Driver (Staff ID FK) *</label>
              <input
                type="number"
                required
                value={formData.staffId}
                onChange={(e) => setFormData({ ...formData, staffId: parseInt(e.target.value) || 0 })}
                style={{ width: '100%', padding: '8px 12px', border: '1px solid #dce5df', borderRadius: '7px', fontSize: '12px', boxSizing: 'border-box' }}
              />
            </div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' }}>
            <button type="button" className="filterBtn" onClick={() => setEditingVehicle(null)} style={{ cursor: 'pointer' }}>Cancel</button>
            <button type="submit" className="primary">Update Vehicle</button>
          </div>
        </form>
      </Modal>

      {/* Delete Modal */}
      <Modal isOpen={Boolean(deletingVehicle)} title="Confirm Delete" onClose={() => setDeletingVehicle(null)}>
        <p style={{ fontSize: '13px', color: '#33473d', margin: '0 0 20px 0', lineHeight: 1.5 }}>
          Are you sure you want to remove vehicle <b>{deletingVehicle?.vehicleNo}</b>?
        </p>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
          <button type="button" className="filterBtn" onClick={() => setDeletingVehicle(null)} style={{ cursor: 'pointer' }}>Cancel</button>
          <button
            type="button"
            className="filterBtn"
            onClick={handleConfirmDelete}
            style={{ backgroundColor: '#b55353', color: '#fff', borderColor: '#b55353', cursor: 'pointer' }}
          >
            Delete Vehicle
          </button>
        </div>
      </Modal>
    </main>
  );
}
