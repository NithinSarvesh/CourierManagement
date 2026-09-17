import { useState, useEffect } from 'react';
import DataTable from '../components/DataTable';
import Modal from '../components/Modal';
import AlertBanner from '../components/AlertBanner';
import api from '../api';

const columns = [
  { key: 'orderId', label: 'ORDER ID' },
  { key: 'customerId', label: 'CUSTOMER ID' },
  { key: 'serviceId', label: 'SERVICE ID' },
  { key: 'orderDate', label: 'ORDER DATE' },
  { key: 'status', label: 'STATUS' },
  { key: 'amount', label: 'AMOUNT' },
];

export default function Orders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [alert, setAlert] = useState(null);

  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingOrder, setEditingOrder] = useState(null);
  const [deletingOrder, setDeletingOrder] = useState(null);

  const [formData, setFormData] = useState({
    customerId: 1001,
    serviceId: 301,
    status: 'Pending',
    amount: 500.0,
  });

  const loadOrders = async () => {
    setLoading(true);
    try {
      const data = await api.getOrders();
      setOrders(Array.isArray(data) ? data : []);
    } catch (err) {
      setOrders([]);
      setAlert({ type: 'error', message: `Backend/Database unavailable: ${err.message}` });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOrders();
  }, []);

  const handleOpenAdd = () => {
    setFormData({ customerId: 1001, serviceId: 301, status: 'Pending', amount: 750.0 });
    setIsAddOpen(true);
  };

  const handleOpenEdit = (order) => {
    setEditingOrder(order);
    setFormData({
      customerId: order.customerId,
      serviceId: order.serviceId,
      status: order.status || 'Pending',
      amount: order.amount || 0.0,
    });
  };

  const handleSaveAdd = async (e) => {
    e.preventDefault();
    try {
      await api.createOrder(formData);
      setAlert({ type: 'success', message: 'Order created and persisted in Oracle ORDERS table.' });
      setIsAddOpen(false);
      await loadOrders();
    } catch (err) {
      setAlert({ type: 'error', message: `Failed to create order: ${err.message}` });
    }
  };

  const handleSaveEdit = async (e) => {
    e.preventDefault();
    if (!editingOrder) return;
    try {
      await api.updateOrder(editingOrder.orderId, formData);
      setAlert({ type: 'success', message: `Order #${editingOrder.orderId} updated successfully.` });
      setEditingOrder(null);
      await loadOrders();
    } catch (err) {
      setAlert({ type: 'error', message: `Failed to update order #${editingOrder.orderId}: ${err.message}` });
    }
  };

  const handleConfirmDelete = async () => {
    if (!deletingOrder) return;
    try {
      await api.deleteOrder(deletingOrder.orderId);
      setAlert({ type: 'success', message: `Order #${deletingOrder.orderId} removed.` });
      setDeletingOrder(null);
      await loadOrders();
    } catch (err) {
      setAlert({ type: 'error', message: `Failed to delete order #${deletingOrder.orderId}: ${err.message}` });
      setDeletingOrder(null);
    }
  };

  return (
    <main className="content">
      <div className="pageHead">
        <div>
          <p className="eyebrow">MANAGEMENT</p>
          <h1>Orders</h1>
          <p className="muted">Manage and review shipments in Oracle ORDERS table.</p>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button className="filterBtn" onClick={loadOrders} style={{ cursor: 'pointer', background: '#fff' }} title="Reload orders from Oracle">
            ↻ Refresh
          </button>
          <button className="primary" onClick={handleOpenAdd}>
            ＋ Add Order
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
        rows={orders}
        searchPlaceholder="Search orders by ID, customer ID, status, amount..."
        onEdit={handleOpenEdit}
        onDelete={(row) => setDeletingOrder(row)}
      />

      {/* Add Order Modal */}
      <Modal isOpen={isAddOpen} title="Create New Order" onClose={() => setIsAddOpen(false)}>
        <form onSubmit={handleSaveAdd}>
          <div style={{ display: 'grid', gap: '12px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '11px', fontWeight: '600', color: '#405148', marginBottom: '4px' }}>Customer ID (FK: CUSTOMER) *</label>
              <input
                type="number"
                required
                value={formData.customerId}
                onChange={(e) => setFormData({ ...formData, customerId: parseInt(e.target.value) || 0 })}
                style={{ width: '100%', padding: '8px 12px', border: '1px solid #dce5df', borderRadius: '7px', fontSize: '12px', boxSizing: 'border-box' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '11px', fontWeight: '600', color: '#405148', marginBottom: '4px' }}>Service ID (FK: COURIER_SERVICE)</label>
              <input
                type="number"
                value={formData.serviceId}
                onChange={(e) => setFormData({ ...formData, serviceId: parseInt(e.target.value) || 0 })}
                style={{ width: '100%', padding: '8px 12px', border: '1px solid #dce5df', borderRadius: '7px', fontSize: '12px', boxSizing: 'border-box' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '11px', fontWeight: '600', color: '#405148', marginBottom: '4px' }}>Order Status *</label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                style={{ width: '100%', padding: '8px 12px', border: '1px solid #dce5df', borderRadius: '7px', fontSize: '12px', background: '#fff' }}
              >
                <option value="Pending">Pending</option>
                <option value="Processing">Processing</option>
                <option value="In Transit">In Transit</option>
                <option value="Delivered">Delivered</option>
                <option value="Cancelled">Cancelled</option>
              </select>
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
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' }}>
            <button type="button" className="filterBtn" onClick={() => setIsAddOpen(false)} style={{ cursor: 'pointer' }}>Cancel</button>
            <button type="submit" className="primary">Create Order</button>
          </div>
        </form>
      </Modal>

      {/* Edit Order Modal */}
      <Modal isOpen={Boolean(editingOrder)} title={`Edit Order #${editingOrder?.orderId}`} onClose={() => setEditingOrder(null)}>
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
              <label style={{ display: 'block', fontSize: '11px', fontWeight: '600', color: '#405148', marginBottom: '4px' }}>Service ID (FK)</label>
              <input
                type="number"
                value={formData.serviceId}
                onChange={(e) => setFormData({ ...formData, serviceId: parseInt(e.target.value) || 0 })}
                style={{ width: '100%', padding: '8px 12px', border: '1px solid #dce5df', borderRadius: '7px', fontSize: '12px', boxSizing: 'border-box' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '11px', fontWeight: '600', color: '#405148', marginBottom: '4px' }}>Order Status *</label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                style={{ width: '100%', padding: '8px 12px', border: '1px solid #dce5df', borderRadius: '7px', fontSize: '12px', background: '#fff' }}
              >
                <option value="Pending">Pending</option>
                <option value="Processing">Processing</option>
                <option value="In Transit">In Transit</option>
                <option value="Delivered">Delivered</option>
                <option value="Cancelled">Cancelled</option>
              </select>
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
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' }}>
            <button type="button" className="filterBtn" onClick={() => setEditingOrder(null)} style={{ cursor: 'pointer' }}>Cancel</button>
            <button type="submit" className="primary">Update Order</button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal isOpen={Boolean(deletingOrder)} title="Confirm Delete" onClose={() => setDeletingOrder(null)}>
        <p style={{ fontSize: '13px', color: '#33473d', margin: '0 0 20px 0', lineHeight: 1.5 }}>
          Are you sure you want to delete Order #{deletingOrder?.orderId}?
          This will cascade to associated parcels and payments in Oracle DB.
        </p>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
          <button type="button" className="filterBtn" onClick={() => setDeletingOrder(null)} style={{ cursor: 'pointer' }}>Cancel</button>
          <button
            type="button"
            className="filterBtn"
            onClick={handleConfirmDelete}
            style={{ backgroundColor: '#b55353', color: '#fff', borderColor: '#b55353', cursor: 'pointer' }}
          >
            Delete Order
          </button>
        </div>
      </Modal>
    </main>
  );
}
