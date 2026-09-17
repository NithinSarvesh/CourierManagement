import { useState, useRef, useEffect, useCallback } from 'react';

// ==========================================================
// 20 ORACLE DATABASE ENTITIES METADATA & INITIAL COORDINATES
// ==========================================================

const INITIAL_NODES = {
  CUSTOMER: {
    id: 'CUSTOMER',
    name: 'CUSTOMER',
    type: 'STRONG',
    badge: 'Strong Entity',
    x: 80,
    y: 60,
    width: 210,
    height: 220,
    pk: ['customer_id'],
    attributes: [
      { name: 'customer_id', type: 'NUMBER', isPk: true },
      { name: 'name', type: 'VARCHAR2(100)', isPk: false, notNull: true },
      { name: 'email', type: 'VARCHAR2(100)', isPk: false },
      { name: 'street', type: 'VARCHAR2(150)', isPk: false },
      { name: 'city', type: 'VARCHAR2(100)', isPk: false },
      { name: 'pin', type: 'VARCHAR2(20)', isPk: false },
    ],
    relations: ['orders', 'payment'],
    crudRoute: 'customers',
  },
  ORDERS: {
    id: 'ORDERS',
    name: 'ORDERS',
    type: 'STRONG',
    badge: 'Strong Entity',
    x: 420,
    y: 60,
    width: 210,
    height: 230,
    pk: ['order_id'],
    attributes: [
      { name: 'order_id', type: 'NUMBER', isPk: true },
      { name: 'customer_id', type: 'NUMBER', isFk: true, ref: 'CUSTOMER(customer_id)' },
      { name: 'service_id', type: 'NUMBER', isFk: true, ref: 'COURIER_SERVICE(service_id)' },
      { name: 'order_date', type: 'TIMESTAMP', isPk: false },
      { name: 'status', type: 'VARCHAR2(50)', isPk: false },
      { name: 'amount', type: 'NUMBER(10,2)', isPk: false },
    ],
    relations: ['customer', 'courier_service', 'parcel', 'payment'],
    crudRoute: 'orders',
  },
  COURIER_SERVICE: {
    id: 'COURIER_SERVICE',
    name: 'COURIER_SERVICE',
    type: 'STRONG',
    badge: 'Relational Entity',
    x: 770,
    y: 60,
    width: 210,
    height: 190,
    pk: ['service_id'],
    attributes: [
      { name: 'service_id', type: 'NUMBER', isPk: true },
      { name: 'branch_id', type: 'NUMBER', isFk: true, ref: 'BRANCH(branch_id)' },
      { name: 'courier_id', type: 'NUMBER', isFk: true, ref: 'COURIER(courier_id)' },
      { name: 'charges', type: 'NUMBER(10,2)', isPk: false },
    ],
    relations: ['branch', 'courier', 'orders'],
    crudRoute: 'services',
  },
  BRANCH: {
    id: 'BRANCH',
    name: 'BRANCH',
    type: 'STRONG',
    badge: 'Identifying Owner',
    x: 1120,
    y: 60,
    width: 210,
    height: 210,
    pk: ['branch_id'],
    attributes: [
      { name: 'branch_id', type: 'NUMBER', isPk: true },
      { name: 'branch_name', type: 'VARCHAR2(100)', isPk: false, notNull: true },
      { name: 'street', type: 'VARCHAR2(150)', isPk: false },
      { name: 'city', type: 'VARCHAR2(100)', isPk: false },
      { name: 'pin', type: 'VARCHAR2(20)', isPk: false },
    ],
    relations: ['staff', 'courier_service', 'delivery_attempt'],
    crudRoute: 'branches',
  },
  STAFF: {
    id: 'STAFF',
    name: 'STAFF',
    type: 'STRONG_SUPERTYPE',
    badge: 'Supertype (ISA)',
    x: 1480,
    y: 60,
    width: 210,
    height: 210,
    pk: ['staff_id'],
    attributes: [
      { name: 'staff_id', type: 'NUMBER', isPk: true },
      { name: 'role', type: 'VARCHAR2(50)', isPk: false },
      { name: 'branch_id', type: 'NUMBER', isFk: true, ref: 'BRANCH(branch_id)' },
      { name: 'name', type: 'VARCHAR2(100)', isPk: false, notNull: true },
      { name: 'department', type: 'VARCHAR2(100)', isPk: false },
    ],
    relations: ['branch', 'vehicle', 'parcel', 'manager', 'customer_support', 'accountant'],
    crudRoute: 'staff',
  },
  COURIER: {
    id: 'COURIER',
    name: 'COURIER',
    type: 'STRONG_SUPERTYPE',
    badge: 'Supertype (ISA)',
    x: 1840,
    y: 60,
    width: 200,
    height: 170,
    pk: ['courier_id'],
    attributes: [
      { name: 'courier_id', type: 'NUMBER', isPk: true },
      { name: 'name', type: 'VARCHAR2(100)', isPk: false, notNull: true },
      { name: 'email', type: 'VARCHAR2(100)', isPk: false },
    ],
    relations: ['courier_service', 'parcel', 'delivery_attempt', 'delivery_boy', 'branch_staff', 'driver'],
    crudRoute: 'couriers',
  },

  // Second Row
  PAYMENT: {
    id: 'PAYMENT',
    name: 'PAYMENT',
    type: 'STRONG_SUPERTYPE',
    badge: 'Supertype (ISA)',
    x: 230,
    y: 430,
    width: 210,
    height: 210,
    pk: ['payment_id'],
    attributes: [
      { name: 'payment_id', type: 'NUMBER', isPk: true },
      { name: 'customer_id', type: 'NUMBER', isFk: true, ref: 'CUSTOMER(customer_id)' },
      { name: 'order_id', type: 'NUMBER', isFk: true, ref: 'ORDERS(order_id)' },
      { name: 'amount', type: 'NUMBER(10,2)', isPk: false },
      { name: 'status', type: 'VARCHAR2(50)', isPk: false },
    ],
    relations: ['customer', 'orders', 'cash_mode', 'card_mode', 'online_mode'],
    crudRoute: 'payments',
  },
  PARCEL: {
    id: 'PARCEL',
    name: 'PARCEL',
    type: 'STRONG',
    badge: 'Strong Entity',
    x: 640,
    y: 430,
    width: 210,
    height: 210,
    pk: ['parcel_id'],
    attributes: [
      { name: 'parcel_id', type: 'NUMBER', isPk: true },
      { name: 'order_id', type: 'NUMBER', isFk: true, ref: 'ORDERS(order_id)' },
      { name: 'price', type: 'NUMBER(10,2)', isPk: false },
      { name: 'courier_id', type: 'NUMBER', isFk: true, ref: 'COURIER(courier_id)' },
      { name: 'staff_id', type: 'NUMBER', isFk: true, ref: 'STAFF(staff_id)' },
    ],
    relations: ['orders', 'courier', 'staff', 'tracking_event'],
    crudRoute: 'parcels',
  },
  TRACKING_EVENT: {
    id: 'TRACKING_EVENT',
    name: 'TRACKING_EVENT',
    type: 'STRONG',
    badge: 'Strong Entity',
    x: 990,
    y: 430,
    width: 210,
    height: 190,
    pk: ['event_id'],
    attributes: [
      { name: 'event_id', type: 'NUMBER', isPk: true },
      { name: 'parcel_id', type: 'NUMBER', isFk: true, ref: 'PARCEL(parcel_id)' },
      { name: 'event_type', type: 'VARCHAR2(100)', isPk: false },
      { name: 'event_time', type: 'TIMESTAMP', isPk: false },
    ],
    relations: ['parcel'],
    crudRoute: 'tracking',
  },
  DELIVERY_ATTEMPT: {
    id: 'DELIVERY_ATTEMPT',
    name: 'DELIVERY_ATTEMPT',
    type: 'WEAK',
    badge: 'Weak Entity',
    x: 1350,
    y: 430,
    width: 220,
    height: 220,
    pk: ['branch_id', 'attempt_no'],
    attributes: [
      { name: 'branch_id', type: 'NUMBER', isPk: true, isFk: true, ref: 'BRANCH(branch_id)' },
      { name: 'attempt_no', type: 'NUMBER', isPk: true, isDiscriminator: true },
      { name: 'courier_id', type: 'NUMBER', isFk: true, ref: 'COURIER(courier_id)' },
      { name: 'attempt_time', type: 'TIMESTAMP', isPk: false },
      { name: 'status', type: 'VARCHAR2(50)', isPk: false },
    ],
    relations: ['branch', 'courier'],
    crudRoute: 'delivery',
  },
  VEHICLE: {
    id: 'VEHICLE',
    name: 'VEHICLE',
    type: 'STRONG',
    badge: 'Strong Entity',
    x: 1720,
    y: 430,
    width: 200,
    height: 170,
    pk: ['vehicle_no'],
    attributes: [
      { name: 'vehicle_no', type: 'VARCHAR2(50)', isPk: true },
      { name: 'license_no', type: 'VARCHAR2(50)', isPk: false },
      { name: 'staff_id', type: 'NUMBER', isFk: true, ref: 'STAFF(staff_id)' },
    ],
    relations: ['staff'],
    crudRoute: 'vehicles',
  },

  // Third Row: Specialization / Subtypes (ISA)
  CASH_MODE: {
    id: 'CASH_MODE',
    name: 'CASH_MODE',
    type: 'SUBTYPE',
    supertype: 'PAYMENT',
    badge: 'ISA Subtype',
    x: 80,
    y: 780,
    width: 170,
    height: 130,
    pk: ['payment_id'],
    attributes: [
      { name: 'payment_id', type: 'NUMBER', isPk: true, isFk: true, ref: 'PAYMENT(payment_id)' },
    ],
    relations: ['payment'],
  },
  CARD_MODE: {
    id: 'CARD_MODE',
    name: 'CARD_MODE',
    type: 'SUBTYPE',
    supertype: 'PAYMENT',
    badge: 'ISA Subtype',
    x: 270,
    y: 780,
    width: 170,
    height: 130,
    pk: ['payment_id'],
    attributes: [
      { name: 'payment_id', type: 'NUMBER', isPk: true, isFk: true, ref: 'PAYMENT(payment_id)' },
    ],
    relations: ['payment'],
  },
  ONLINE_MODE: {
    id: 'ONLINE_MODE',
    name: 'ONLINE_MODE',
    type: 'SUBTYPE',
    supertype: 'PAYMENT',
    badge: 'ISA Subtype',
    x: 460,
    y: 780,
    width: 170,
    height: 130,
    pk: ['payment_id'],
    attributes: [
      { name: 'payment_id', type: 'NUMBER', isPk: true, isFk: true, ref: 'PAYMENT(payment_id)' },
    ],
    relations: ['payment'],
  },

  MANAGER: {
    id: 'MANAGER',
    name: 'MANAGER',
    type: 'SUBTYPE',
    supertype: 'STAFF',
    badge: 'ISA Subtype',
    x: 900,
    y: 780,
    width: 175,
    height: 150,
    pk: ['staff_id'],
    attributes: [
      { name: 'staff_id', type: 'NUMBER', isPk: true, isFk: true, ref: 'STAFF(staff_id)' },
      { name: 'manager_id', type: 'NUMBER', isPk: false },
    ],
    relations: ['staff'],
  },
  CUSTOMER_SUPPORT: {
    id: 'CUSTOMER_SUPPORT',
    name: 'CUSTOMER_SUPPORT',
    type: 'SUBTYPE',
    supertype: 'STAFF',
    badge: 'ISA Subtype',
    x: 1100,
    y: 780,
    width: 185,
    height: 150,
    pk: ['staff_id'],
    attributes: [
      { name: 'staff_id', type: 'NUMBER', isPk: true, isFk: true, ref: 'STAFF(staff_id)' },
      { name: 'staff_timing', type: 'VARCHAR2(50)', isPk: false },
    ],
    relations: ['staff'],
  },
  ACCOUNTANT: {
    id: 'ACCOUNTANT',
    name: 'ACCOUNTANT',
    type: 'SUBTYPE',
    supertype: 'STAFF',
    badge: 'ISA Subtype',
    x: 1310,
    y: 780,
    width: 175,
    height: 150,
    pk: ['staff_id'],
    attributes: [
      { name: 'staff_id', type: 'NUMBER', isPk: true, isFk: true, ref: 'STAFF(staff_id)' },
      { name: 'qualification', type: 'VARCHAR2(100)', isPk: false },
    ],
    relations: ['staff'],
  },

  DELIVERY_BOY: {
    id: 'DELIVERY_BOY',
    name: 'DELIVERY_BOY',
    type: 'SUBTYPE',
    supertype: 'COURIER',
    badge: 'ISA Subtype',
    x: 1600,
    y: 780,
    width: 175,
    height: 150,
    pk: ['courier_id'],
    attributes: [
      { name: 'courier_id', type: 'NUMBER', isPk: true, isFk: true, ref: 'COURIER(courier_id)' },
      { name: 'area_assigned', type: 'VARCHAR2(100)', isPk: false },
    ],
    relations: ['courier'],
  },
  BRANCH_STAFF: {
    id: 'BRANCH_STAFF',
    name: 'BRANCH_STAFF',
    type: 'SUBTYPE',
    supertype: 'COURIER',
    badge: 'ISA Subtype',
    x: 1800,
    y: 780,
    width: 175,
    height: 150,
    pk: ['courier_id'],
    attributes: [
      { name: 'courier_id', type: 'NUMBER', isPk: true, isFk: true, ref: 'COURIER(courier_id)' },
      { name: 'department', type: 'VARCHAR2(100)', isPk: false },
    ],
    relations: ['courier'],
  },
  DRIVER: {
    id: 'DRIVER',
    name: 'DRIVER',
    type: 'SUBTYPE',
    supertype: 'COURIER',
    badge: 'ISA Subtype',
    x: 2000,
    y: 780,
    width: 175,
    height: 150,
    pk: ['courier_id'],
    attributes: [
      { name: 'courier_id', type: 'NUMBER', isPk: true, isFk: true, ref: 'COURIER(courier_id)' },
      { name: 'license_no', type: 'VARCHAR2(50)', isPk: false },
    ],
    relations: ['courier'],
  },
};

// ==========================================================
// 23 ORACLE RELATIONAL RELATIONSHIPS (FK & ISA)
// ==========================================================

const RELATIONSHIPS = [
  // Core FK Relationships
  { from: 'CUSTOMER', to: 'ORDERS', type: 'FK', cardinality: '1 : N', label: 'places', fkCol: 'customer_id' },
  { from: 'CUSTOMER', to: 'PAYMENT', type: 'FK', cardinality: '1 : N', label: 'makes', fkCol: 'customer_id' },
  { from: 'COURIER_SERVICE', to: 'ORDERS', type: 'FK', cardinality: '1 : N', label: 'selected for', fkCol: 'service_id' },
  { from: 'BRANCH', to: 'COURIER_SERVICE', type: 'FK', cardinality: '1 : N', label: 'offers', fkCol: 'branch_id' },
  { from: 'COURIER', to: 'COURIER_SERVICE', type: 'FK', cardinality: '1 : N', label: 'fulfills', fkCol: 'courier_id' },
  { from: 'ORDERS', to: 'PARCEL', type: 'FK', cardinality: '1 : 1', label: 'contains', fkCol: 'order_id' },
  { from: 'ORDERS', to: 'PAYMENT', type: 'FK', cardinality: '1 : 1', label: 'settled by', fkCol: 'order_id' },
  { from: 'COURIER', to: 'PARCEL', type: 'FK', cardinality: '1 : N', label: 'dispatches', fkCol: 'courier_id' },
  { from: 'STAFF', to: 'PARCEL', type: 'FK', cardinality: '1 : N', label: 'handles', fkCol: 'staff_id' },
  { from: 'BRANCH', to: 'STAFF', type: 'FK', cardinality: '1 : N', label: 'employs', fkCol: 'branch_id' },
  { from: 'STAFF', to: 'VEHICLE', type: 'FK', cardinality: '1 : N', label: 'operates', fkCol: 'staff_id' },
  { from: 'PARCEL', to: 'TRACKING_EVENT', type: 'FK', cardinality: '1 : N', label: 'generates', fkCol: 'parcel_id' },

  // Identifying Weak Entity Relationship
  { from: 'BRANCH', to: 'DELIVERY_ATTEMPT', type: 'IDENTIFYING', cardinality: '1 : N (Identifying)', label: 'logs attempt', fkCol: 'branch_id' },
  { from: 'COURIER', to: 'DELIVERY_ATTEMPT', type: 'FK', cardinality: '1 : N', label: 'executes', fkCol: 'courier_id' },

  // Specialization / Generalization (ISA)
  { from: 'STAFF', to: 'MANAGER', type: 'ISA', cardinality: 'ISA', label: 'specializes', fkCol: 'staff_id' },
  { from: 'STAFF', to: 'CUSTOMER_SUPPORT', type: 'ISA', cardinality: 'ISA', label: 'specializes', fkCol: 'staff_id' },
  { from: 'STAFF', to: 'ACCOUNTANT', type: 'ISA', cardinality: 'ISA', label: 'specializes', fkCol: 'staff_id' },

  { from: 'COURIER', to: 'DELIVERY_BOY', type: 'ISA', cardinality: 'ISA', label: 'specializes', fkCol: 'courier_id' },
  { from: 'COURIER', to: 'BRANCH_STAFF', type: 'ISA', cardinality: 'ISA', label: 'specializes', fkCol: 'courier_id' },
  { from: 'COURIER', to: 'DRIVER', type: 'ISA', cardinality: 'ISA', label: 'specializes', fkCol: 'courier_id' },

  { from: 'PAYMENT', to: 'CASH_MODE', type: 'ISA', cardinality: 'ISA', label: 'specializes', fkCol: 'payment_id' },
  { from: 'PAYMENT', to: 'CARD_MODE', type: 'ISA', cardinality: 'ISA', label: 'specializes', fkCol: 'payment_id' },
  { from: 'PAYMENT', to: 'ONLINE_MODE', type: 'ISA', cardinality: 'ISA', label: 'specializes', fkCol: 'payment_id' },
];

export default function EerDiagram({ go }) {
  const [nodes, setNodes] = useState(INITIAL_NODES);
  const [selectedEntityId, setSelectedEntityId] = useState(null);
  const [selectedRel, setSelectedRel] = useState(null);
  const [categoryFilter, setCategoryFilter] = useState('ALL');

  // Canvas Viewport transform: zoom & pan
  const [scale, setScale] = useState(0.85);
  const [pan, setPan] = useState({ x: 30, y: 20 });
  const [isPanning, setIsPanning] = useState(false);
  const panStartRef = useRef({ mouseX: 0, mouseY: 0, origX: 0, origY: 0 });

  // Dragging individual node state
  const draggingNodeRef = useRef(null);

  const canvasOuterRef = useRef(null);

  // Zoom helpers
  const handleZoomIn = () => setScale((s) => Math.min(1.8, +(s + 0.15).toFixed(2)));
  const handleZoomOut = () => setScale((s) => Math.max(0.45, +(s - 0.15).toFixed(2)));
  const handleReset = () => {
    setNodes(INITIAL_NODES);
    setScale(0.85);
    setPan({ x: 30, y: 20 });
    setSelectedEntityId(null);
    setSelectedRel(null);
  };
  const handleFit = () => {
    setScale(0.68);
    setPan({ x: 10, y: 10 });
  };

  // Mouse Wheel Zoom
  const handleWheel = (e) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? -0.08 : 0.08;
    setScale((s) => Math.min(1.8, Math.max(0.45, +(s + delta).toFixed(2))));
  };

  // Pan Canvas Mouse Handlers
  const handleCanvasMouseDown = (e) => {
    // If clicking directly on the canvas background, initiate pan
    if (e.target.closest('.eer-node') || e.target.closest('.eer-inspector') || e.target.closest('.eer-toolbar')) {
      return;
    }
    setIsPanning(true);
    panStartRef.current = {
      mouseX: e.clientX,
      mouseY: e.clientY,
      origX: pan.x,
      origY: pan.y,
    };
  };

  const handleMouseMove = useCallback((e) => {
    // Handling node dragging
    if (draggingNodeRef.current) {
      const { id, startMouseX, startMouseY, initialNodeX, initialNodeY } = draggingNodeRef.current;
      const dx = (e.clientX - startMouseX) / scale;
      const dy = (e.clientY - startMouseY) / scale;

      setNodes((prev) => ({
        ...prev,
        [id]: {
          ...prev[id],
          x: Math.max(10, Math.round(initialNodeX + dx)),
          y: Math.max(10, Math.round(initialNodeY + dy)),
        },
      }));
      return;
    }

    // Handling canvas panning
    if (isPanning) {
      const dx = e.clientX - panStartRef.current.mouseX;
      const dy = e.clientY - panStartRef.current.mouseY;
      setPan({
        x: panStartRef.current.origX + dx,
        y: panStartRef.current.origY + dy,
      });
    }
  }, [isPanning, scale]);

  const handleMouseUp = useCallback(() => {
    setIsPanning(false);
    draggingNodeRef.current = null;
  }, []);

  useEffect(() => {
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [handleMouseMove, handleMouseUp]);

  // Initiate Node Dragging
  const handleNodeHeaderMouseDown = (e, nodeId) => {
    e.stopPropagation();
    setSelectedEntityId(nodeId);
    setSelectedRel(null);
    const node = nodes[nodeId];
    draggingNodeRef.current = {
      id: nodeId,
      startMouseX: e.clientX,
      startMouseY: e.clientY,
      initialNodeX: node.x,
      initialNodeY: node.y,
    };
  };

  // Determine active connections for highlighting
  const connectedNodeIds = new Set();
  if (selectedEntityId) {
    connectedNodeIds.add(selectedEntityId);
    RELATIONSHIPS.forEach((rel) => {
      if (rel.from === selectedEntityId) connectedNodeIds.add(rel.to);
      if (rel.to === selectedEntityId) connectedNodeIds.add(rel.from);
    });
  }

  // Filter nodes based on active category
  const isNodeVisible = (node) => {
    if (categoryFilter === 'ALL') return true;
    if (categoryFilter === 'CORE') return node.type.startsWith('STRONG');
    if (categoryFilter === 'SUBTYPES') return node.type === 'SUBTYPE';
    if (categoryFilter === 'WEAK') return node.type === 'WEAK';
    return true;
  };

  const selectedEntity = selectedEntityId ? nodes[selectedEntityId] : null;

  return (
    <main className="content" style={{ paddingBottom: '20px' }}>
      {/* Header */}
      <div className="pageHead" style={{ marginBottom: '14px' }}>
        <div>
          <p className="eyebrow">DATABASE DESIGN &amp; ARCHITECTURE</p>
          <h1>Full EER Diagram</h1>
          <p className="muted">
            Interactive, movable database design canvas displaying all 20 Oracle entities, primary keys (🔑), foreign keys (🔗), ISA hierarchies, and weak entities.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '8px' }}>
          <button className="secondary-btn" onClick={() => go && go('dashboard')} title="Back to Dashboard">
            ← Dashboard
          </button>
          <button className="secondary-btn" onClick={() => go && go('dbSchema')} title="Inspect Relational Schema">
            🗄️ Database Schema
          </button>
          <button className="primary-btn" onClick={() => go && go('sqlEditor')} title="Execute SQL Queries">
            💻 SQL Console
          </button>
        </div>
      </div>

      {/* Main EER Canvas Viewport */}
      <div className="eer-page-wrapper">
        {/* Canvas Toolbar & Category Toggles */}
        <div className="eer-toolbar">
          <div className="eer-toolbar-left">
            <span style={{ fontSize: '11px', fontWeight: '700', color: 'var(--muted)', marginRight: '6px' }}>
              FILTER VIEW:
            </span>
            {[
              { id: 'ALL', label: 'All Entities (20)' },
              { id: 'CORE', label: 'Core Logistics (10)' },
              { id: 'SUBTYPES', label: 'Specializations / ISA (9)' },
              { id: 'WEAK', label: 'Weak Entity (1)' },
            ].map((cat) => (
              <button
                key={cat.id}
                onClick={() => setCategoryFilter(cat.id)}
                style={{
                  padding: '5px 11px',
                  borderRadius: '6px',
                  fontSize: '11px',
                  cursor: 'pointer',
                  border: '1px solid',
                  borderColor: categoryFilter === cat.id ? 'var(--sidebar-green)' : 'var(--border-dark)',
                  background: categoryFilter === cat.id ? 'var(--sidebar-green)' : '#fff',
                  color: categoryFilter === cat.id ? '#fff' : 'var(--text)',
                  fontWeight: categoryFilter === cat.id ? '700' : '500',
                  transition: 'all 0.15s',
                }}
              >
                {cat.label}
              </button>
            ))}
          </div>

          <div className="eer-toolbar-right">
            <button className="filterBtn" onClick={handleZoomOut} title="Zoom Out">
              −
            </button>
            <span style={{ fontSize: '11px', fontWeight: '700', minWidth: '45px', textAlign: 'center', color: 'var(--muted)' }}>
              {Math.round(scale * 100)}%
            </span>
            <button className="filterBtn" onClick={handleZoomIn} title="Zoom In">
              ＋
            </button>
            <button className="filterBtn" onClick={handleFit} title="Fit entire schema to canvas">
              Fit to Screen
            </button>
            <button className="filterBtn" onClick={handleReset} title="Reset positions & zoom">
              Reset Layout
            </button>
          </div>
        </div>

        {/* Outer Canvas Container */}
        <div
          className={`eer-canvas-outer ${isPanning ? 'panning' : ''}`}
          ref={canvasOuterRef}
          onMouseDown={handleCanvasMouseDown}
          onWheel={handleWheel}
        >
          {/* Transformable Inner Viewport */}
          <div
            className="eer-canvas-viewport"
            style={{
              transform: `translate(${pan.x}px, ${pan.y}px) scale(${scale})`,
            }}
          >
            {/* SVG Lines Layer */}
            <svg id="eerSvgLayer">
              <defs>
                {/* Regular Arrowhead */}
                <marker id="arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                  <path d="M 0 1 L 10 5 L 0 9 z" fill="#687d32" />
                </marker>
                {/* Active Highlight Arrowhead */}
                <marker id="arrow-active" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                  <path d="M 0 1 L 10 5 L 0 9 z" fill="#299bb8" />
                </marker>
                {/* ISA Triangular Marker */}
                <marker id="isa-marker" viewBox="0 0 12 12" refX="10" refY="6" markerWidth="8" markerHeight="8" orient="auto-start-reverse">
                  <path d="M 0 1 L 11 6 L 0 11 z" fill="#8669bd" />
                </marker>
              </defs>

              {RELATIONSHIPS.map((rel, idx) => {
                const source = nodes[rel.from];
                const target = nodes[rel.to];
                if (!source || !target) return null;
                if (!isNodeVisible(source) || !isNodeVisible(target)) return null;

                // Center coordinates of source and target nodes
                const x1 = source.x + (source.width || 200) / 2;
                const y1 = source.y + (source.height || 200) / 2;
                const x2 = target.x + (target.width || 200) / 2;
                const y2 = target.y + (target.height || 200) / 2;

                const isRelSelected = selectedRel === rel;
                const isConnectedToActiveNode =
                  selectedEntityId && (rel.from === selectedEntityId || rel.to === selectedEntityId);
                const isDimmed = selectedEntityId && !isConnectedToActiveNode && !isRelSelected;

                let strokeColor = '#7a8d67';
                let strokeWidth = '1.6';
                let strokeDash = 'none';
                let markerEnd = 'url(#arrow)';

                if (rel.type === 'ISA') {
                  strokeColor = isConnectedToActiveNode ? '#8669bd' : '#a08fd5';
                  strokeDash = '5 4';
                  markerEnd = 'url(#isa-marker)';
                  strokeWidth = isConnectedToActiveNode ? '2.5' : '1.8';
                } else if (rel.type === 'IDENTIFYING') {
                  strokeColor = isConnectedToActiveNode ? '#d97706' : '#c27803';
                  strokeWidth = isConnectedToActiveNode ? '3' : '2';
                } else if (isConnectedToActiveNode || isRelSelected) {
                  strokeColor = '#299bb8';
                  strokeWidth = '2.8';
                  markerEnd = 'url(#arrow-active)';
                }

                if (isDimmed) {
                  strokeColor = '#d3ded2';
                  strokeWidth = '1';
                }

                // Midpoint for relationship label
                const midX = (x1 + x2) / 2;
                const midY = (y1 + y2) / 2;

                return (
                  <g
                    key={`${rel.from}-${rel.to}-${idx}`}
                    style={{ cursor: 'pointer', transition: 'all 0.2s' }}
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedRel(rel);
                      setSelectedEntityId(null);
                    }}
                  >
                    <line
                      x1={x1}
                      y1={y1}
                      x2={x2}
                      y2={y2}
                      stroke={strokeColor}
                      strokeWidth={strokeWidth}
                      strokeDasharray={strokeDash}
                      markerEnd={markerEnd}
                      opacity={isDimmed ? 0.25 : 1}
                    />
                    {/* Relationship Badge Tag */}
                    {!isDimmed && (
                      <g transform={`translate(${midX}, ${midY})`}>
                        <rect
                          x="-28"
                          y="-9"
                          width="56"
                          height="18"
                          rx="4"
                          fill="#ffffff"
                          stroke={strokeColor}
                          strokeWidth="1"
                          filter="drop-shadow(0 1px 2px rgba(0,0,0,0.1))"
                        />
                        <text
                          textAnchor="middle"
                          y="3"
                          fontSize="8"
                          fontWeight="700"
                          fill={rel.type === 'ISA' ? '#8669bd' : '#405148'}
                        >
                          {rel.cardinality}
                        </text>
                      </g>
                    )}
                  </g>
                );
              })}
            </svg>

            {/* Entity Nodes Layer */}
            <div id="eerNodesLayer">
              {Object.values(nodes).map((node) => {
                if (!isNodeVisible(node)) return null;

                const isSelected = selectedEntityId === node.id;
                const isRelated = selectedEntityId && connectedNodeIds.has(node.id) && !isSelected;
                const isDimmed = selectedEntityId && !connectedNodeIds.has(node.id);

                let nodeClass = 'eer-node';
                if (node.type === 'WEAK') nodeClass += ' weak-entity';
                if (node.type === 'SUBTYPE') nodeClass += ' subtype-entity';
                if (isSelected) nodeClass += ' selected';
                if (isRelated) nodeClass += ' related';
                if (isDimmed) nodeClass += ' dimmed';

                return (
                  <div
                    key={node.id}
                    className={nodeClass}
                    style={{
                      left: `${node.x}px`,
                      top: `${node.y}px`,
                      width: `${node.width || 200}px`,
                    }}
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedEntityId(node.id);
                      setSelectedRel(null);
                    }}
                  >
                    {/* Draggable Header */}
                    <div
                      className="eer-node-header"
                      onMouseDown={(e) => handleNodeHeaderMouseDown(e, node.id)}
                      title="Drag to reposition entity on canvas"
                    >
                      <span className="eer-node-name">{node.name}</span>
                      <span
                        className="eer-node-badge"
                        style={{
                          background: node.type === 'WEAK' ? '#fef3c7' : node.type === 'SUBTYPE' ? '#ede9fe' : '#eef7f2',
                          color: node.type === 'WEAK' ? '#b45309' : node.type === 'SUBTYPE' ? '#7c3aed' : '#287f55',
                          border: `1px solid ${node.type === 'WEAK' ? '#fde68a' : node.type === 'SUBTYPE' ? '#ddd6fe' : '#d1e7dd'}`,
                        }}
                      >
                        {node.badge}
                      </span>
                    </div>

                    {/* Attributes List */}
                    <div className="eer-node-attributes">
                      {node.attributes.map((attr, aIdx) => {
                        let rowClass = 'eer-attr-row';
                        if (attr.isPk) rowClass += ' is-pk';
                        if (attr.isFk) rowClass += ' is-fk';

                        return (
                          <div key={aIdx} className={rowClass} title={`${attr.name} (${attr.type})`}>
                            {attr.isPk && (
                              <span className="key-tag pk-tag" title="Primary Key">
                                🔑 PK
                              </span>
                            )}
                            {attr.isFk && (
                              <span className="key-tag fk-tag" title={`Foreign Key referencing ${attr.ref || ''}`}>
                                🔗 FK
                              </span>
                            )}
                            {!attr.isPk && !attr.isFk && (
                              <span style={{ color: 'var(--muted)', fontSize: '9px', width: '12px', textAlign: 'center' }}>
                                ○
                              </span>
                            )}
                            <span style={{ fontWeight: attr.isPk ? '700' : '400', flex: 1 }}>{attr.name}</span>
                            <span style={{ fontSize: '8px', color: '#88988e' }}>{attr.type}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Floating Entity Inspector / Relationship Info Drawer */}
          {selectedEntity && (
            <div className="eer-inspector">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <span className="eyebrow" style={{ color: selectedEntity.type === 'WEAK' ? '#b45309' : 'var(--sidebar-dark)' }}>
                  {selectedEntity.badge.toUpperCase()}
                </span>
                <button
                  onClick={() => setSelectedEntityId(null)}
                  style={{ background: 'none', border: '0', cursor: 'pointer', fontSize: '18px', color: 'var(--muted)' }}
                  title="Close Inspector"
                >
                  ×
                </button>
              </div>

              <h3>{selectedEntity.name}</h3>
              <p className="muted" style={{ fontSize: '11px', marginBottom: '14px' }}>
                {selectedEntity.type === 'WEAK'
                  ? 'Weak entity identified through owner BRANCH via composite key (branch_id, attempt_no).'
                  : selectedEntity.type === 'SUBTYPE'
                  ? `Specialized subtype table inheriting primary key and identity from ${selectedEntity.supertype}.`
                  : 'Strong standalone entity stored in Oracle FREEPDB1 schema.'}
              </p>

              {/* PK Details */}
              <div style={{ background: '#fff9e6', border: '1px solid #fde68a', borderRadius: '7px', padding: '8px 10px', marginBottom: '12px' }}>
                <span style={{ fontSize: '10px', fontWeight: '800', color: 'var(--pk)' }}>PRIMARY KEY:</span>
                <p style={{ margin: '3px 0 0', fontSize: '11px', fontWeight: '700', color: '#854d0e' }}>
                  🔑 {selectedEntity.pk.join(', ')}
                </p>
              </div>

              {/* Attributes Count */}
              <div style={{ marginBottom: '14px' }}>
                <span style={{ fontSize: '10px', fontWeight: '800', color: 'var(--muted)' }}>ATTRIBUTES ({selectedEntity.attributes.length}):</span>
                <div style={{ marginTop: '6px', maxHeight: '140px', overflowY: 'auto' }}>
                  {selectedEntity.attributes.map((a, idx) => (
                    <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', padding: '3px 0', borderBottom: '1px solid #f0f4ee' }}>
                      <span style={{ fontWeight: a.isPk ? '700' : '400', color: a.isPk ? 'var(--pk)' : a.isFk ? 'var(--fk)' : 'var(--text)' }}>
                        {a.isPk ? '🔑 ' : a.isFk ? '🔗 ' : ''} {a.name}
                      </span>
                      <span style={{ color: '#88988e' }}>{a.type}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Related Entities */}
              <div style={{ marginBottom: '16px' }}>
                <span style={{ fontSize: '10px', fontWeight: '800', color: 'var(--muted)' }}>CONNECTED RELATIONSHIPS:</span>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px', marginTop: '6px' }}>
                  {RELATIONSHIPS.filter((r) => r.from === selectedEntity.id || r.to === selectedEntity.id).map((r, idx) => {
                    const other = r.from === selectedEntity.id ? r.to : r.from;
                    return (
                      <span
                        key={idx}
                        onClick={() => setSelectedEntityId(other)}
                        style={{
                          background: 'var(--pale-green-2)',
                          border: '1px solid var(--border)',
                          borderRadius: '5px',
                          padding: '3px 7px',
                          fontSize: '10px',
                          cursor: 'pointer',
                          color: 'var(--sidebar-dark)',
                          fontWeight: '600',
                        }}
                        title={`Click to focus ${other}`}
                      >
                        {other} ({r.cardinality})
                      </span>
                    );
                  })}
                </div>
              </div>

              {/* Navigation Action */}
              {selectedEntity.crudRoute && go && (
                <button
                  className="primary-btn"
                  onClick={() => go(selectedEntity.crudRoute)}
                  style={{ width: '100%', justifyContent: 'center' }}
                >
                  Open {selectedEntity.name} Table Records →
                </button>
              )}
            </div>
          )}

          {/* Relationship Inspector */}
          {selectedRel && (
            <div className="eer-inspector">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <span className="eyebrow" style={{ color: 'var(--fk)' }}>RELATIONSHIP DETAILS</span>
                <button onClick={() => setSelectedRel(null)} style={{ background: 'none', border: '0', cursor: 'pointer', fontSize: '18px' }}>
                  ×
                </button>
              </div>

              <h3>{selectedRel.from} ➔ {selectedRel.to}</h3>
              <p className="muted" style={{ fontSize: '11px', marginBottom: '12px' }}>
                Relationship Type: <b>{selectedRel.type}</b> ({selectedRel.label})
              </p>

              <div style={{ background: 'var(--pale-green-2)', border: '1px solid var(--border)', borderRadius: '7px', padding: '10px', fontSize: '11px' }}>
                <p style={{ margin: '0 0 6px' }}>
                  <b>Source Entity:</b> {selectedRel.from}
                </p>
                <p style={{ margin: '0 0 6px' }}>
                  <b>Target Entity:</b> {selectedRel.to}
                </p>
                <p style={{ margin: '0 0 6px' }}>
                  <b>Foreign Key Column:</b> <code>{selectedRel.fkCol}</code>
                </p>
                <p style={{ margin: '0' }}>
                  <b>Cardinality:</b> {selectedRel.cardinality}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Legend */}
        <div className="key-legend" style={{ borderRadius: '0 0 10px 10px' }}>
          <span>
            <i className="legend pk"></i> <b>🔑 Primary Key (PK)</b>
          </span>
          <span>
            <i className="legend fk"></i> <b>🔗 Foreign Key (FK)</b>
          </span>
          <span>
            <i className="legend normal"></i> Regular Attribute
          </span>
          <span>
            <i className="legend weak"></i> <b>Weak Entity (DELIVERY_ATTEMPT)</b>
          </span>
          <span>
            <i className="legend relation"></i> <b>ISA Specialization / Subtype</b>
          </span>
          <span style={{ marginLeft: 'auto', color: 'var(--muted)', fontSize: '10px' }}>
            Tip: Click &amp; drag entity headers to rearrange. Click canvas background to pan.
          </span>
        </div>
      </div>
    </main>
  );
}
