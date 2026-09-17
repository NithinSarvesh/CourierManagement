import { useState, useEffect } from 'react';
import DataTable from '../components/DataTable';
import Modal from '../components/Modal';
import AlertBanner from '../components/AlertBanner';
import api from '../api';

const columns = [
  { key: 'parcelId', label: 'PARCEL ID' },
  { key: 'orderId', label: 'ORDER ID' },
  { key: 'price', label: 'PRICE' },
  { key: 'courierId', label: 'COURIER ID' },
  { key: 'staffId', label: 'STAFF ID' },
];

export default function Parcels() {
  const [parcels, setParcels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [alert, setAlert] = useState(null);

  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingParcel, setEditingParcel] = useState(null);
  const [deletingParcel, setDeletingParcel] = useState(null);

  const [formData, setFormData] = useState({
    orderId: 4001,
    price: 500.0,
    courierId: 101,
    staffId: 204,
  });

  const loadParcels = async () => {
    setLoading(true);
    try {
      const data = await api.getParcels();
      setParcels(Array.isArray(data) ? data : []);
    } catch (err) {
      setParcels([]);
      setAlert({ type: 'error', message: `Backend/Database unavailable: ${err.message}` });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadParcels();
  }, []);

  const handleOpenAdd = () => {
    setFormData({ orderId: 4001, price: 650.0, courierId: 101, staffId: 204 });
    setIsAddOpen(true);
  };

  const handleOpenEdit = (parcel) => {
    setEditingParcel(parcel);
    setFormData({
      orderId: parcel.orderId,
      price: parcel.price || 0.0,
      courierId: parcel.courierId || 101,
      staffId: parcel.staffId || 204,
    });
  };

  const handleSaveAdd = async (e) => {
    e.preventDefault();
    try {
      await api.createParcel(formData);
      setAlert({ type: 'success', message: 'Parcel registered and saved to Oracle PARCEL table.' });
      setIsAddOpen(false);
      await loadParcels();
    } catch (err) {
      setAlert({ type: 'error', message: `Failed to add parcel: ${err.message}` });
    }
  };

  const handleSaveEdit = async (e) => {
    e.preventDefault();
    if (!editingParcel) return;
    try {
      await api.updateParcel(editingParcel.parcelId, formData);
      setAlert({ type: 'success', message: `Parcel #${editingParcel.parcelId} updated successfully.` });
      setEditingParcel(null);
      await loadParcels();
    } catch (err) {
      setAlert({ type: 'error', message: `Failed to update parcel #${editingParcel.parcelId}: ${err.message}` });
    }
  };

  const handleConfirmDelete = async () => {
    if (!deletingParcel) return;
    try {
      await api.deleteParcel(deletingParcel.parcelId);
      setAlert({ type: 'success', message: `Parcel #${deletingParcel.parcelId} deleted successfully.` });
      setDeletingParcel(null);
      await loadParcels();
    } catch (err) {
      setAlert({ type: 'error', message: `Failed to delete parcel #${deletingParcel.parcelId}: ${err.message}` });
      setDeletingParcel(null);
    }
  };

  return (
    <main className="content">
      <div className="pageHead">
        <div>
          <p className="eyebrow">MANAGEMENT</p>
          <h1>Parcels</h1>
          <p className="muted">Manage package units linked to orders and handlers in Oracle DB.</p>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button className="filterBtn" onClick={loadParcels} style={{ cursor: 'pointer', background: '#fff' }} title="Reload parcels from Oracle">
            ↻ Refresh
          </button>
          <button className="primary" onClick={handleOpenAdd}>
            ＋ Add Parcel
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
        rows={parcels}
        searchPlaceholder="Search parcels by ID, order ID, price, courier, staff..."
        onEdit={handleOpenEdit}
        onDelete={(row) => setDeletingParcel(row)}
      />

      {/* Add Parcel Modal */}
      <Modal isOpen={isAddOpen} title="Register New Parcel" onClose={() => setIsAddOpen(false)}>
        <form onSubmit={handleSaveAdd}>
          <div style={{ display: 'grid', gap: '12px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '11px', fontWeight: '600', color: '#405148', marginBottom: '4px' }}>Order ID (FK: ORDERS) *</label>
              <input
                type="number"
                required
                value={formData.orderId}
                onChange={(e) => setFormData({ ...formData, orderId: parseInt(e.target.value) || 0 })}
                style={{ width: '100%', padding: '8px 12px', border: '1px solid #dce5df', borderRadius: '7px', fontSize: '12px', boxSizing: 'border-box' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '11px', fontWeight: '600', color: '#405148', marginBottom: '4px' }}>Price / Valuation (₹) *</label>
              <input
                type="number"
                step="any"
                required
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) || 0 })}
                style={{ width: '100%', padding: '8px 12px', border: '1px solid #dce5df', borderRadius: '7px', fontSize: '12px', boxSizing: 'border-box' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '11px', fontWeight: '600', color: '#405148', marginBottom: '4px' }}>Courier Partner ID (FK: COURIER)</label>
              <input
                type="number"
                value={formData.courierId}
                onChange={(e) => setFormData({ ...formData, courierId: parseInt(e.target.value) || 0 })}
                style={{ width: '100%', padding: '8px 12px', border: '1px solid #dce5df', borderRadius: '7px', fontSize: '12px', boxSizing: 'border-box' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '11px', fontWeight: '600', color: '#405148', marginBottom: '4px' }}>Assigned Staff ID (FK: STAFF)</label>
              <input
                type="number"
                value={formData.staffId}
                onChange={(e) => setFormData({ ...formData, staffId: parseInt(e.target.value) || 0 })}
                style={{ width: '100%', padding: '8px 12px', border: '1px solid #dce5df', borderRadius: '7px', fontSize: '12px', boxSizing: 'border-box' }}
              />
            </div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' }}>
            <button type="button" className="filterBtn" onClick={() => setIsAddOpen(false)} style={{ cursor: 'pointer' }}>Cancel</button>
            <button type="submit" className="primary">Register Parcel</button>
          </div>
        </form>
      </Modal>

      {/* Edit Parcel Modal */}
      <Modal isOpen={Boolean(editingParcel)} title={`Edit Parcel #${editingParcel?.parcelId}`} onClose={() => setEditingParcel(null)}>
        <form onSubmit={handleSaveEdit}>
          <div style={{ display: 'grid', gap: '12px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '11px', fontWeight: '600', color: '#405148', marginBottom: '4px' }}>Order ID (FK) *</label>
              <input
                type="number"
                required
                value={formData.orderId}
                onChange={(e) => setFormData({ ...formData, orderId: parseInt(e.target.value) || 0 })}
                style={{ width: '100%', padding: '8px 12px', border: '1px solid #dce5df', borderRadius: '7px', fontSize: '12px', boxSizing: 'border-box' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '11px', fontWeight: '600', color: '#405148', marginBottom: '4px' }}>Price / Valuation (₹) *</label>
              <input
                type="number"
                step="any"
                required
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) || 0 })}
                style={{ width: '100%', padding: '8px 12px', border: '1px solid #dce5df', borderRadius: '7px', fontSize: '12px', boxSizing: 'border-box' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '11px', fontWeight: '600', color: '#405148', marginBottom: '4px' }}>Courier Partner ID (FK)</label>
              <input
                type="number"
                value={formData.courierId}
                onChange={(e) => setFormData({ ...formData, courierId: parseInt(e.target.value) || 0 })}
                style={{ width: '100%', padding: '8px 12px', border: '1px solid #dce5df', borderRadius: '7px', fontSize: '12px', boxSizing: 'border-box' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '11px', fontWeight: '600', color: '#405148', marginBottom: '4px' }}>Assigned Staff ID (FK)</label>
              <input
                type="number"
                value={formData.staffId}
                onChange={(e) => setFormData({ ...formData, staffId: parseInt(e.target.value) || 0 })}
                style={{ width: '100%', padding: '8px 12px', border: '1px solid #dce5df', borderRadius: '7px', fontSize: '12px', boxSizing: 'border-box' }}
              />
            </div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' }}>
            <button type="button" className="filterBtn" onClick={() => setEditingParcel(null)} style={{ cursor: 'pointer' }}>Cancel</button>
            <button type="submit" className="primary">Update Parcel</button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal isOpen={Boolean(deletingParcel)} title="Confirm Delete" onClose={() => setDeletingParcel(null)}>
        <p style={{ fontSize: '13px', color: '#33473d', margin: '0 0 20px 0', lineHeight: 1.5 }}>
          Are you sure you want to delete Parcel #{deletingParcel?.parcelId}?
        </p>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
          <button type="button" className="filterBtn" onClick={() => setDeletingParcel(null)} style={{ cursor: 'pointer' }}>Cancel</button>
          <button
            type="button"
            className="filterBtn"
            onClick={handleConfirmDelete}
            style={{ backgroundColor: '#b55353', color: '#fff', borderColor: '#b55353', cursor: 'pointer' }}
          >
            Delete Parcel
          </button>
        </div>
      </Modal>
    </main>
  );
}
