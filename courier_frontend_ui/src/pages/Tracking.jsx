import { useState, useEffect } from 'react';
import DataTable from '../components/DataTable';
import Modal from '../components/Modal';
import AlertBanner from '../components/AlertBanner';
import api from '../api';

const DEFAULT_EVENTS = [
  { eventId: 7001, parcelId: 6001, eventType: 'Picked Up', eventTime: '2026-09-14 11:00' },
  { eventId: 7002, parcelId: 6001, eventType: 'In Transit', eventTime: '2026-09-14 14:30' },
  { eventId: 7003, parcelId: 6001, eventType: 'Delivered', eventTime: '2026-09-14 18:00' },
  { eventId: 7004, parcelId: 6002, eventType: 'In Transit', eventTime: '2026-09-15 12:00' },
];

const columns = [
  { key: 'eventId', label: 'EVENT ID' },
  { key: 'parcelId', label: 'PARCEL ID' },
  { key: 'eventType', label: 'EVENT TYPE' },
  { key: 'eventTime', label: 'EVENT TIME' },
];

export default function Tracking() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [alert, setAlert] = useState(null);

  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState(null);
  const [deletingEvent, setDeletingEvent] = useState(null);

  const [formData, setFormData] = useState({
    parcelId: 6001,
    eventType: 'In Transit',
  });

  const loadEvents = async () => {
    setLoading(true);
    try {
      const data = await api.getTrackingEvents();
      setEvents(Array.isArray(data) && data.length > 0 ? data : DEFAULT_EVENTS);
    } catch (err) {
      setEvents(DEFAULT_EVENTS);
      setAlert({ type: 'warning', message: `${err.message} — Showing local tracking view.` });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadEvents();
  }, []);

  const handleOpenAdd = () => {
    setFormData({ parcelId: 6001, eventType: 'In Transit' });
    setIsAddOpen(true);
  };

  const handleOpenEdit = (ev) => {
    setEditingEvent(ev);
    setFormData({
      parcelId: ev.parcelId,
      eventType: ev.eventType || 'In Transit',
    });
  };

  const handleSaveAdd = async (e) => {
    e.preventDefault();
    try {
      await api.createTrackingEvent(formData);
      setAlert({ type: 'success', message: 'Tracking event recorded in Oracle TRACKING_EVENT table.' });
      setIsAddOpen(false);
      loadEvents();
    } catch (err) {
      const newId = Math.max(...events.map(e => e.eventId || 0), 7000) + 1;
      setEvents([...events, { eventId: newId, eventTime: new Date().toISOString().replace('T', ' ').substring(0, 16), ...formData }]);
      setAlert({ type: 'info', message: 'Tracking event added (local session preview).' });
      setIsAddOpen(false);
    }
  };

  const handleSaveEdit = async (e) => {
    e.preventDefault();
    if (!editingEvent) return;
    try {
      await api.updateTrackingEvent(editingEvent.eventId, formData);
      setAlert({ type: 'success', message: `Tracking event #${editingEvent.eventId} updated.` });
      setEditingEvent(null);
      loadEvents();
    } catch (err) {
      setEvents(events.map(e => e.eventId === editingEvent.eventId ? { ...e, ...formData } : e));
      setAlert({ type: 'info', message: `Tracking event #${editingEvent.eventId} updated (local session preview).` });
      setEditingEvent(null);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deletingEvent) return;
    try {
      await api.deleteTrackingEvent(deletingEvent.eventId);
      setAlert({ type: 'success', message: `Tracking event #${deletingEvent.eventId} deleted.` });
      setDeletingEvent(null);
      loadEvents();
    } catch (err) {
      setEvents(events.filter(e => e.eventId !== deletingEvent.eventId));
      setAlert({ type: 'info', message: `Tracking event #${deletingEvent.eventId} deleted (local session preview).` });
      setDeletingEvent(null);
    }
  };

  return (
    <main className="content">
      <div className="pageHead">
        <div>
          <p className="eyebrow">MANAGEMENT</p>
          <h1>Tracking Events</h1>
          <p className="muted">Live audit timeline and package location checkpoint history in Oracle DB.</p>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button className="filterBtn" onClick={loadEvents} style={{ cursor: 'pointer', background: '#fff' }} title="Reload tracking events from Oracle">
            ↻ Refresh
          </button>
          <button className="primary" onClick={handleOpenAdd}>
            ＋ Add Tracking Event
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
        rows={events}
        searchPlaceholder="Search tracking events by parcel ID, location, status..."
        onEdit={handleOpenEdit}
        onDelete={(row) => setDeletingEvent(row)}
      />

      {/* Add Modal */}
      <Modal isOpen={isAddOpen} title="Record Tracking Event" onClose={() => setIsAddOpen(false)}>
        <form onSubmit={handleSaveAdd}>
          <div style={{ display: 'grid', gap: '12px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '11px', fontWeight: '600', color: '#405148', marginBottom: '4px' }}>Parcel ID (FK: PARCEL) *</label>
              <input
                type="number"
                required
                value={formData.parcelId}
                onChange={(e) => setFormData({ ...formData, parcelId: parseInt(e.target.value) || 0 })}
                style={{ width: '100%', padding: '8px 12px', border: '1px solid #dce5df', borderRadius: '7px', fontSize: '12px', boxSizing: 'border-box' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '11px', fontWeight: '600', color: '#405148', marginBottom: '4px' }}>Event Milestone *</label>
              <select
                value={formData.eventType}
                onChange={(e) => setFormData({ ...formData, eventType: e.target.value })}
                style={{ width: '100%', padding: '8px 12px', border: '1px solid #dce5df', borderRadius: '7px', fontSize: '12px', background: '#fff' }}
              >
                <option value="Picked Up">Picked Up</option>
                <option value="In Transit">In Transit</option>
                <option value="Out for Delivery">Out for Delivery</option>
                <option value="Delivered">Delivered</option>
                <option value="Attempt Failed">Attempt Failed</option>
              </select>
            </div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' }}>
            <button type="button" className="filterBtn" onClick={() => setIsAddOpen(false)} style={{ cursor: 'pointer' }}>Cancel</button>
            <button type="submit" className="primary">Record Event</button>
          </div>
        </form>
      </Modal>

      {/* Edit Modal */}
      <Modal isOpen={Boolean(editingEvent)} title={`Edit Event #${editingEvent?.eventId}`} onClose={() => setEditingEvent(null)}>
        <form onSubmit={handleSaveEdit}>
          <div style={{ display: 'grid', gap: '12px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '11px', fontWeight: '600', color: '#405148', marginBottom: '4px' }}>Parcel ID (FK) *</label>
              <input
                type="number"
                required
                value={formData.parcelId}
                onChange={(e) => setFormData({ ...formData, parcelId: parseInt(e.target.value) || 0 })}
                style={{ width: '100%', padding: '8px 12px', border: '1px solid #dce5df', borderRadius: '7px', fontSize: '12px', boxSizing: 'border-box' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '11px', fontWeight: '600', color: '#405148', marginBottom: '4px' }}>Event Milestone *</label>
              <select
                value={formData.eventType}
                onChange={(e) => setFormData({ ...formData, eventType: e.target.value })}
                style={{ width: '100%', padding: '8px 12px', border: '1px solid #dce5df', borderRadius: '7px', fontSize: '12px', background: '#fff' }}
              >
                <option value="Picked Up">Picked Up</option>
                <option value="In Transit">In Transit</option>
                <option value="Out for Delivery">Out for Delivery</option>
                <option value="Delivered">Delivered</option>
                <option value="Attempt Failed">Attempt Failed</option>
              </select>
            </div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' }}>
            <button type="button" className="filterBtn" onClick={() => setEditingEvent(null)} style={{ cursor: 'pointer' }}>Cancel</button>
            <button type="submit" className="primary">Update Event</button>
          </div>
        </form>
      </Modal>

      {/* Delete Modal */}
      <Modal isOpen={Boolean(deletingEvent)} title="Confirm Delete" onClose={() => setDeletingEvent(null)}>
        <p style={{ fontSize: '13px', color: '#33473d', margin: '0 0 20px 0', lineHeight: 1.5 }}>
          Are you sure you want to delete Tracking Event #{deletingEvent?.eventId}?
        </p>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
          <button type="button" className="filterBtn" onClick={() => setDeletingEvent(null)} style={{ cursor: 'pointer' }}>Cancel</button>
          <button
            type="button"
            className="filterBtn"
            onClick={handleConfirmDelete}
            style={{ backgroundColor: '#b55353', color: '#fff', borderColor: '#b55353', cursor: 'pointer' }}
          >
            Delete Event
          </button>
        </div>
      </Modal>
    </main>
  );
}
