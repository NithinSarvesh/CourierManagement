import { useState, useEffect } from 'react';
import DataTable from '../components/DataTable';
import Modal from '../components/Modal';
import AlertBanner from '../components/AlertBanner';
import api from '../api';

const columns = [
  { key: 'paymentId', label: 'PAYMENT ID' },
  { key: 'customerId', label: 'CUSTOMER ID' },
  { key: 'orderId', label: 'ORDER ID' },
  { key: 'amount', label: 'AMOUNT' },
  { key: 'status', label: 'STATUS' },
];

export default function Payments() {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [alert, setAlert] = useState(null);

  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingPayment, setEditingPayment] = useState(null);
  const [deletingPayment, setDeletingPayment] = useState(null);

  const [formData, setFormData] = useState({
    customerId: 1001,
    orderId: 4001,
    amount: 1000.0,
    status: 'Paid',
  });

  const loadPayments = async () => {
    setLoading(true);
    try {
      const data = await api.getPayments();
      setPayments(Array.isArray(data) ? data : []);
    } catch (err) {
      setPayments([]);
      setAlert({ type: 'error', message: `Backend/Database unavailable: ${err.message}` });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPayments();
  }, []);

  const handleOpenAdd = () => {
    setFormData({ customerId: 1001, orderId: 4001, amount: 1000.0, status: 'Paid' });
    setIsAddOpen(true);
  };

  const handleOpenEdit = (p) => {
    setEditingPayment(p);
    setFormData({
      customerId: p.customerId,
      orderId: p.orderId,
      amount: p.amount || 0.0,
      status: p.status || 'Paid',
    });
  };

  const handleSaveAdd = async (e) => {
    e.preventDefault();
    try {
      await api.createPayment(formData);
      setAlert({ type: 'success', message: 'Payment recorded in Oracle PAYMENT table.' });
      setIsAddOpen(false);
      await loadPayments();
    } catch (err) {
      setAlert({ type: 'error', message: `Failed to record payment: ${err.message}` });
    }
  };

  const handleSaveEdit = async (e) => {
    e.preventDefault();
    if (!editingPayment) return;
    try {
      await api.updatePayment(editingPayment.paymentId, formData);
      setAlert({ type: 'success', message: `Payment #${editingPayment.paymentId} updated.` });
      setEditingPayment(null);
      await loadPayments();
    } catch (err) {
      setAlert({ type: 'error', message: `Failed to update payment #${editingPayment.paymentId}: ${err.message}` });
    }
  };

  const handleConfirmDelete = async () => {
    if (!deletingPayment) return;
    try {
      await api.deletePayment(deletingPayment.paymentId);
      setAlert({ type: 'success', message: `Payment #${deletingPayment.paymentId} deleted.` });
      setDeletingPayment(null);
      await loadPayments();
    } catch (err) {
      setAlert({ type: 'error', message: `Failed to delete payment #${deletingPayment.paymentId}: ${err.message}` });
      setDeletingPayment(null);
    }
  };

  return (
    <main className="content">
      <div className="pageHead">
        <div>
          <p className="eyebrow">MANAGEMENT</p>
          <h1>Payments</h1>
          <p className="muted">Manage and review financial transactions and invoice settlements.</p>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button className="filterBtn" onClick={loadPayments} style={{ cursor: 'pointer', background: '#fff' }} title="Reload payments from Oracle">
            ↻ Refresh
          </button>
          <button className="primary" onClick={handleOpenAdd}>
            ＋ Record Payment
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
        rows={payments}
        searchPlaceholder="Search payments by ID, customer ID, method, amount..."
        onEdit={handleOpenEdit}
        onDelete={(row) => setDeletingPayment(row)}
      />

      {/* Add Modal */}
      <Modal isOpen={isAddOpen} title="Record New Payment" onClose={() => setIsAddOpen(false)}>
        <form onSubmit={handleSaveAdd}>
          <div style={{ display: 'grid', gap: '12px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '11px', fontWeight: '600', color: '#405148', marginBottom: '4px' }}>Customer ID (FK) *</label>
              <input
                type="number"
                required
                value={formData.customerId}
                onChange={(e) => setFormData({ ...formData, customerId: parseInt(e.target.value) || 0 })}
                style={{ width: '100%', padding: '8px 12px', border: '1px solid #dce5df', borderRadius: '7px', fontSize: '12px', boxSizing: 'border-box' }}
              />
            </div>
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
              <label style={{ display: 'block', fontSize: '11px', fontWeight: '600', color: '#405148', marginBottom: '4px' }}>Amount (₹) *</label>
              <input
                type="number"
                step="any"
                required
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: parseFloat(e.target.value) || 0 })}
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
                <option value="Paid">Paid</option>
                <option value="Pending">Pending</option>
                <option value="Refunded">Refunded</option>
              </select>
            </div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' }}>
            <button type="button" className="filterBtn" onClick={() => setIsAddOpen(false)} style={{ cursor: 'pointer' }}>Cancel</button>
            <button type="submit" className="primary">Record Payment</button>
          </div>
        </form>
      </Modal>

      {/* Edit Modal */}
      <Modal isOpen={Boolean(editingPayment)} title={`Edit Payment #${editingPayment?.paymentId}`} onClose={() => setEditingPayment(null)}>
        <form onSubmit={handleSaveEdit}>
          <div style={{ display: 'grid', gap: '12px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '11px', fontWeight: '600', color: '#405148', marginBottom: '4px' }}>Customer ID (FK) *</label>
              <input
                type="number"
                required
                value={formData.customerId}
                onChange={(e) => setFormData({ ...formData, customerId: parseInt(e.target.value) || 0 })}
                style={{ width: '100%', padding: '8px 12px', border: '1px solid #dce5df', borderRadius: '7px', fontSize: '12px', boxSizing: 'border-box' }}
              />
            </div>
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
              <label style={{ display: 'block', fontSize: '11px', fontWeight: '600', color: '#405148', marginBottom: '4px' }}>Amount (₹) *</label>
              <input
                type="number"
                step="any"
                required
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: parseFloat(e.target.value) || 0 })}
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
                <option value="Paid">Paid</option>
                <option value="Pending">Pending</option>
                <option value="Refunded">Refunded</option>
              </select>
            </div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' }}>
            <button type="button" className="filterBtn" onClick={() => setEditingPayment(null)} style={{ cursor: 'pointer' }}>Cancel</button>
            <button type="submit" className="primary">Update Payment</button>
          </div>
        </form>
      </Modal>

      {/* Delete Modal */}
      <Modal isOpen={Boolean(deletingPayment)} title="Confirm Delete" onClose={() => setDeletingPayment(null)}>
        <p style={{ fontSize: '13px', color: '#33473d', margin: '0 0 20px 0', lineHeight: 1.5 }}>
          Are you sure you want to remove Payment record #{deletingPayment?.paymentId}?
        </p>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
          <button type="button" className="filterBtn" onClick={() => setDeletingPayment(null)} style={{ cursor: 'pointer' }}>Cancel</button>
          <button
            type="button"
            className="filterBtn"
            onClick={handleConfirmDelete}
            style={{ backgroundColor: '#b55353', color: '#fff', borderColor: '#b55353', cursor: 'pointer' }}
          >
            Delete Payment
          </button>
        </div>
      </Modal>
    </main>
  );
}
