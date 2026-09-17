import { useState, useEffect } from 'react';
import StatCard from '../components/StatCard';
import StatusBadge from '../components/StatusBadge';
import api from '../api';

const DEFAULT_ORDERS = [
  { id: '4001', customer: 'Rahul Sharma', date: '14 Sep 2026', amount: 1250, status: 'Delivered' },
  { id: '4002', customer: 'Priya Patel', date: '15 Sep 2026', amount: 780, status: 'In Transit' },
  { id: '4003', customer: 'Arjun Mehta', date: '15 Sep 2026', amount: 2100, status: 'Processing' },
  { id: '4004', customer: 'Neha Singh', date: '16 Sep 2026', amount: 560, status: 'Delivered' },
  { id: '4005', customer: 'Rahul Sharma', date: '16 Sep 2026', amount: 1800, status: 'Pending' },
];

const ENTITY_SUMMARIES = [
  {
    table: 'CUSTOMER',
    type: 'Strong Entity',
    pk: 'customer_id (NUMBER)',
    countKey: 'totalCustomers',
    fks: 'None (Root Client Entity)',
    desc: 'Stores registered client records placing courier bookings.',
    route: 'customers',
    columns: [
      { name: 'customer_id', type: 'NUMBER', pk: true, nullable: false, desc: 'Primary key uniquely identifying customer' },
      { name: 'name', type: 'VARCHAR2(100)', pk: false, nullable: false, desc: 'Customer full name' },
      { name: 'email', type: 'VARCHAR2(100)', pk: false, nullable: true, desc: 'Email address' },
      { name: 'street', type: 'VARCHAR2(150)', pk: false, nullable: true, desc: 'Street address' },
      { name: 'city', type: 'VARCHAR2(100)', pk: false, nullable: true, desc: 'City' },
      { name: 'pin', type: 'VARCHAR2(20)', pk: false, nullable: true, desc: 'Postal PIN code' },
    ]
  },
  {
    table: 'ORDERS',
    type: 'Strong Entity',
    pk: 'order_id (NUMBER)',
    countKey: 'totalOrders',
    fks: 'customer_id → CUSTOMER, service_id → COURIER_SERVICE',
    desc: 'Shipment booking orders placed by customers.',
    route: 'orders',
    columns: [
      { name: 'order_id', type: 'NUMBER', pk: true, nullable: false, desc: 'Primary key uniquely identifying order' },
      { name: 'customer_id', type: 'NUMBER', fk: true, target: 'CUSTOMER', nullable: false, desc: 'FK referencing CUSTOMER(customer_id)' },
      { name: 'service_id', type: 'NUMBER', fk: true, target: 'COURIER_SERVICE', nullable: true, desc: 'FK referencing COURIER_SERVICE(service_id)' },
      { name: 'order_date', type: 'TIMESTAMP', pk: false, nullable: true, desc: 'Booking timestamp' },
      { name: 'status', type: 'VARCHAR2(50)', pk: false, nullable: true, desc: 'Pending, Processing, In Transit, Delivered, Cancelled' },
      { name: 'amount', type: 'NUMBER(10,2)', pk: false, nullable: true, desc: 'Total order invoice cost' },
    ]
  },
  {
    table: 'PARCEL',
    type: 'Strong Entity',
    pk: 'parcel_id (NUMBER)',
    countKey: 'totalParcels',
    fks: 'order_id → ORDERS, courier_id → COURIER, staff_id → STAFF',
    desc: 'Physical parcels dispatched through the courier distribution network.',
    route: 'parcels',
    columns: [
      { name: 'parcel_id', type: 'NUMBER', pk: true, nullable: false, desc: 'Primary key uniquely identifying parcel' },
      { name: 'order_id', type: 'NUMBER', fk: true, target: 'ORDERS', nullable: false, desc: 'FK referencing ORDERS (1:1)' },
      { name: 'price', type: 'NUMBER(10,2)', pk: false, nullable: true, desc: 'Declared valuation for insurance' },
      { name: 'courier_id', type: 'NUMBER', fk: true, target: 'COURIER', nullable: true, desc: 'FK referencing COURIER partner' },
      { name: 'staff_id', type: 'NUMBER', fk: true, target: 'STAFF', nullable: true, desc: 'FK referencing assigned STAFF' },
    ]
  },
  {
    table: 'COURIER',
    type: 'Supertype Entity',
    pk: 'courier_id (NUMBER)',
    countKey: 'totalCouriers',
    fks: 'None (Specialized into roles)',
    desc: 'Courier service operators and logistics partner organizations.',
    route: 'couriers',
    columns: [
      { name: 'courier_id', type: 'NUMBER', pk: true, nullable: false, desc: 'Primary key uniquely identifying courier' },
      { name: 'name', type: 'VARCHAR2(100)', pk: false, nullable: false, desc: 'Courier company / partner name' },
      { name: 'email', type: 'VARCHAR2(100)', pk: false, nullable: true, desc: 'Official contact email' },
    ]
  },
  {
    table: 'BRANCH',
    type: 'Identifying Owner',
    pk: 'branch_id (NUMBER)',
    countKey: 'totalBranches',
    fks: 'None (Identifies weak DELIVERY_ATTEMPT)',
    desc: 'Regional delivery hubs and sorting distribution centers.',
    route: 'branches',
    columns: [
      { name: 'branch_id', type: 'NUMBER', pk: true, nullable: false, desc: 'Primary key uniquely identifying branch' },
      { name: 'branch_name', type: 'VARCHAR2(100)', pk: false, nullable: false, desc: 'Branch facility name (e.g. Chennai Central Hub)' },
      { name: 'street', type: 'VARCHAR2(150)', pk: false, nullable: true, desc: 'Street address' },
      { name: 'city', type: 'VARCHAR2(100)', pk: false, nullable: true, desc: 'Operating city' },
      { name: 'pin', type: 'VARCHAR2(20)', pk: false, nullable: true, desc: 'Postal PIN code' },
    ]
  },
  {
    table: 'STAFF',
    type: 'Subtype Entity',
    pk: 'staff_id (NUMBER)',
    countKey: 'totalStaff',
    fks: 'branch_id → BRANCH',
    desc: 'Employees managing package sortation, transport, and customer operations.',
    route: 'staff',
    columns: [
      { name: 'staff_id', type: 'NUMBER', pk: true, nullable: false, desc: 'Primary key uniquely identifying staff' },
      { name: 'name', type: 'VARCHAR2(100)', pk: false, nullable: false, desc: 'Staff employee name' },
      { name: 'role', type: 'VARCHAR2(50)', pk: false, nullable: true, desc: 'Role designation (Manager, Supervisor, Driver, etc.)' },
      { name: 'department', type: 'VARCHAR2(100)', pk: false, nullable: true, desc: 'Operating department' },
      { name: 'branch_id', type: 'NUMBER', fk: true, target: 'BRANCH', nullable: true, desc: 'FK referencing BRANCH(branch_id)' },
    ]
  },
  {
    table: 'COURIER_SERVICE',
    type: 'Strong Entity',
    pk: 'service_id (NUMBER)',
    countKey: null,
    fks: 'branch_id → BRANCH, courier_id → COURIER',
    desc: 'Catalog of shipping speed options and tariff rates (Express, Standard, Overnight).',
    route: 'services',
    columns: [
      { name: 'service_id', type: 'NUMBER', pk: true, nullable: false, desc: 'Primary key uniquely identifying service tariff' },
      { name: 'branch_id', type: 'NUMBER', fk: true, target: 'BRANCH', nullable: true, desc: 'FK referencing BRANCH(branch_id)' },
      { name: 'courier_id', type: 'NUMBER', fk: true, target: 'COURIER', nullable: true, desc: 'FK referencing COURIER(courier_id)' },
      { name: 'charges', type: 'NUMBER(10,2)', pk: false, nullable: true, desc: 'Tariff base rate amount' },
    ]
  },
  {
    table: 'VEHICLE',
    type: 'Strong Entity',
    pk: 'vehicle_no (VARCHAR2)',
    countKey: 'totalVehicles',
    fks: 'staff_id → STAFF',
    desc: 'Fleet transportation vehicles assigned to couriers and drivers.',
    route: 'vehicles',
    columns: [
      { name: 'vehicle_no', type: 'VARCHAR2(50)', pk: true, nullable: false, desc: 'Primary key registration number (e.g. TN01AB1234)' },
      { name: 'license_no', type: 'VARCHAR2(50)', pk: false, nullable: true, desc: 'Transport department permit / license' },
      { name: 'staff_id', type: 'NUMBER', fk: true, target: 'STAFF', nullable: true, desc: 'FK referencing driver STAFF(staff_id)' },
    ]
  },
  {
    table: 'PAYMENT',
    type: 'Strong Entity',
    pk: 'payment_id (NUMBER)',
    countKey: 'totalPayments',
    fks: 'customer_id → CUSTOMER, order_id → ORDERS',
    desc: 'Financial transactions settling shipment invoices.',
    route: 'payments',
    columns: [
      { name: 'payment_id', type: 'NUMBER', pk: true, nullable: false, desc: 'Primary key uniquely identifying transaction' },
      { name: 'customer_id', type: 'NUMBER', fk: true, target: 'CUSTOMER', nullable: false, desc: 'FK referencing CUSTOMER(customer_id)' },
      { name: 'order_id', type: 'NUMBER', fk: true, target: 'ORDERS', nullable: false, desc: 'FK referencing ORDERS(order_id)' },
      { name: 'amount', type: 'NUMBER(10,2)', pk: false, nullable: false, desc: 'Transaction amount' },
      { name: 'status', type: 'VARCHAR2(50)', pk: false, nullable: true, desc: 'Payment settlement status (Paid, Pending, Refunded)' },
    ]
  },
  {
    table: 'TRACKING_EVENT',
    type: 'Strong Entity',
    pk: 'event_id (NUMBER)',
    countKey: null,
    fks: 'parcel_id → PARCEL',
    desc: 'Audit timeline and status checkpoints for parcel journey verification.',
    route: 'tracking',
    columns: [
      { name: 'event_id', type: 'NUMBER', pk: true, nullable: false, desc: 'Primary key uniquely identifying event' },
      { name: 'parcel_id', type: 'NUMBER', fk: true, target: 'PARCEL', nullable: false, desc: 'FK referencing PARCEL(parcel_id)' },
      { name: 'event_type', type: 'VARCHAR2(100)', pk: false, nullable: false, desc: 'Event status milestone (Dispatched, In Transit, Delivered)' },
      { name: 'event_time', type: 'TIMESTAMP', pk: false, nullable: true, desc: 'Audit scan timestamp' },
    ]
  },
  {
    table: 'DELIVERY_ATTEMPT',
    type: 'Weak Entity',
    pk: '(attempt_no, branch_id)',
    countKey: null,
    fks: 'branch_id → BRANCH (Identifying FK)',
    desc: 'Weak entity dependent on owner BRANCH for identification; logs courier doorstep delivery attempts.',
    route: 'delivery',
    columns: [
      { name: 'attempt_no', type: 'NUMBER', pk: true, nullable: false, desc: 'Partial key (Discriminator) within branch' },
      { name: 'branch_id', type: 'NUMBER', pk: true, fk: true, target: 'BRANCH', nullable: false, desc: 'Identifying FK referencing owner BRANCH(branch_id)' },
      { name: 'courier_id', type: 'NUMBER', fk: true, target: 'COURIER', nullable: true, desc: 'FK referencing assigned COURIER' },
      { name: 'attempt_date', type: 'TIMESTAMP', pk: false, nullable: true, desc: 'Doorstep attempt timestamp' },
      { name: 'status', type: 'VARCHAR2(50)', pk: false, nullable: true, desc: 'Delivered, Pending, Failed' },
      { name: 'remarks', type: 'VARCHAR2(255)', pk: false, nullable: true, desc: 'Driver observation notes' },
    ]
  }
];

export default function Dashboard({ go }) {
  const [stats, setStats] = useState({
    totalCustomers: 5,
    totalOrders: 5,
    totalParcels: 4,
    totalCouriers: 4,
    totalBranches: 4,
    totalStaff: 5,
    totalVehicles: 3,
    totalPayments: 5,
    pendingDeliveries: 3,
    activeParcels: 3,
    totalRevenue: 6490.0,
    connected: false,
    recentOrders: DEFAULT_ORDERS,
  });
  const [loading, setLoading] = useState(true);
  const [selectedEntity, setSelectedEntity] = useState(ENTITY_SUMMARIES[0]);
  const [expandedEntities, setExpandedEntities] = useState({ CUSTOMER: true });

  useEffect(() => {
    api.getDashboardStats()
      .then((data) => {
        if (data) {
          const recent = (data.recentOrders && data.recentOrders.length > 0)
            ? data.recentOrders.map(o => ({
                id: o.ORDER_ID || o.order_id || o.id,
                customer: o.CUSTOMER || o.customer || `Customer #${o.CUSTOMER_ID || o.customer_id}`,
                date: o.ORDER_DATE || o.order_date || 'Recent',
                amount: o.AMOUNT || o.amount,
                status: o.STATUS || o.status || 'Pending'
              }))
            : DEFAULT_ORDERS;

          setStats({
            totalCustomers: data.totalCustomers ?? 5,
            totalOrders: data.totalOrders ?? 5,
            totalParcels: data.totalParcels ?? 4,
            totalCouriers: data.totalCouriers ?? 4,
            totalBranches: data.totalBranches ?? 4,
            totalStaff: data.totalStaff ?? 5,
            totalVehicles: data.totalVehicles ?? 3,
            totalPayments: data.totalPayments ?? 5,
            pendingDeliveries: data.pendingDeliveries ?? 3,
            activeParcels: data.activeParcels ?? 3,
            totalRevenue: data.totalRevenue ?? 6490.0,
            connected: data.connected ?? false,
            recentOrders: recent
          });
        }
      })
      .catch(() => {
        // Fallback gracefully
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  const formatCurrency = (val) => {
    return `₹${Number(val || 0).toLocaleString('en-IN')}`;
  };

  const toggleExpand = (tableName) => {
    setExpandedEntities(prev => ({
      ...prev,
      [tableName]: !prev[tableName]
    }));
  };

  const dbMetrics = [
    { label: 'Customers', count: stats.totalCustomers, icon: '👥', route: 'customers', tag: 'Strong Entity' },
    { label: 'Orders', count: stats.totalOrders, icon: '📦', route: 'orders', tag: 'Strong Entity' },
    { label: 'Parcels', count: stats.totalParcels, icon: '▥', route: 'parcels', tag: 'Strong Entity' },
    { label: 'Couriers', count: stats.totalCouriers, icon: '◈', route: 'couriers', tag: 'Supertype' },
    { label: 'Branches', count: stats.totalBranches, icon: '🏢', route: 'branches', tag: 'Owner Entity' },
    { label: 'Staff', count: stats.totalStaff, icon: '♙', route: 'staff', tag: 'Subtype Entity' },
    { label: 'Vehicles', count: stats.totalVehicles, icon: '🚚', route: 'vehicles', tag: 'Strong Entity' },
    { label: 'Payments', count: stats.totalPayments, icon: '₹', route: 'payments', tag: 'Strong Entity' },
    { label: 'Pending Deliveries', count: stats.pendingDeliveries, icon: '🎯', route: 'orders', tag: 'Status Filter' },
  ];

  const [selectedNetworkKey, setSelectedNetworkKey] = useState(null);

  const NETWORK_ENTITIES = [
    { key: 'customer', name: 'CUSTOMER', count: stats.totalCustomers, route: 'customers', relations: ['orders', 'payment'], fields: [['customerId', 'pk'], ['name', 'normal'], ['email', 'normal'], ['city', 'normal']] },
    { key: 'orders', name: 'ORDERS', count: stats.totalOrders, route: 'orders', relations: ['customer', 'courier_service', 'payment', 'parcel'], fields: [['orderId', 'pk'], ['customerId', 'fk'], ['serviceId', 'fk'], ['status', 'normal']] },
    { key: 'parcel', name: 'PARCEL', count: stats.totalParcels, route: 'parcels', relations: ['orders', 'courier', 'staff', 'tracking_event'], fields: [['parcelId', 'pk'], ['orderId', 'fk'], ['courierId', 'fk'], ['staffId', 'fk']] },
    { key: 'payment', name: 'PAYMENT', count: stats.totalPayments, route: 'payments', relations: ['customer', 'orders', 'cash_mode', 'card_mode', 'online_mode'], fields: [['paymentId', 'pk'], ['customerId', 'fk'], ['orderId', 'fk'], ['status', 'normal']] },
    { key: 'courier', name: 'COURIER', count: stats.totalCouriers, route: 'couriers', relations: ['courier_service', 'parcel', 'delivery_attempt'], fields: [['courierId', 'pk'], ['name', 'normal'], ['email', 'normal']] },
    { key: 'branch', name: 'BRANCH', count: stats.totalBranches, route: 'branches', relations: ['staff', 'courier_service', 'delivery_attempt'], fields: [['branchId', 'pk'], ['branchName', 'normal'], ['city', 'normal']] },
    { key: 'staff', name: 'STAFF', count: stats.totalStaff, route: 'staff', relations: ['branch', 'vehicle', 'parcel'], fields: [['staffId', 'pk'], ['branchId', 'fk'], ['name', 'normal'], ['role', 'normal']] },
    { key: 'courier_service', name: 'COURIER_SERVICE', count: 4, route: 'services', relations: ['branch', 'courier', 'orders'], fields: [['serviceId', 'pk'], ['branchId', 'fk'], ['courierId', 'fk'], ['charges', 'normal']] },
    { key: 'vehicle', name: 'VEHICLE', count: stats.totalVehicles, route: 'vehicles', relations: ['staff'], fields: [['vehicleNo', 'pk'], ['staffId', 'fk'], ['licenseNo', 'normal']] },
    { key: 'tracking_event', name: 'TRACKING_EVENT', count: 8, route: 'tracking', relations: ['parcel'], fields: [['eventId', 'pk'], ['parcelId', 'fk'], ['eventType', 'normal']] },
    { key: 'delivery_attempt', name: 'DELIVERY_ATTEMPT', count: 4, route: 'delivery', relations: ['branch', 'courier'], fields: [['branchId', 'pk'], ['attemptNo', 'pk'], ['courierId', 'fk'], ['status', 'normal']] },
  ];

  const handleSelectNetwork = (key) => {
    setSelectedNetworkKey(prev => prev === key ? null : key);
  };

  return (
    <main className="content">
      {/* Reference Welcome Card */}
      <div className="welcome">
        <div>
          <h2>Welcome to CourierX 📦</h2>
          <p>
            Manage customers, couriers, branches, orders, parcels, payments and delivery operations in Oracle FREEPDB1.
          </p>
        </div>
        <div className="dashboard-actions">
          <button className="primary-btn" onClick={() => go('eerDiagram')}>
            Open Full EER →
          </button>
        </div>
      </div>

      {/* Database Connection Indicator Banner */}
      <div style={{
        background: stats.connected ? '#eef8f2' : '#fcf6ed',
        border: `1px solid ${stats.connected ? '#b8e2c8' : '#fae3c6'}`,
        borderRadius: '10px',
        padding: '12px 18px',
        marginBottom: '20px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '10px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{
            display: 'inline-block',
            width: '9px',
            height: '9px',
            borderRadius: '50%',
            background: stats.connected ? '#62a85c' : '#e67e22',
            boxShadow: `0 0 6px ${stats.connected ? '#62a85c' : '#e67e22'}`
          }} />
          <div>
            <strong style={{ fontSize: '13px', color: '#17251e' }}>
              {stats.connected ? 'Oracle Database Connected (FREEPDB1)' : 'Oracle Demonstration Mode'}
            </strong>
            <span style={{ fontSize: '11px', color: '#556960', marginLeft: '10px' }}>
              Host: <code>localhost:1521</code> &bull; Schema: <code>COURIER_APP</code>
            </span>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button className="secondary-btn" onClick={() => go('sqlEditor')} style={{ fontSize: '11px', padding: '5px 10px' }}>
            🧮 SQL Console
          </button>
          <button className="secondary-btn" onClick={() => go('plsqlOps')} style={{ fontSize: '11px', padding: '5px 10px' }}>
            ⚙️ PL/SQL
          </button>
          <button className="secondary-btn" onClick={() => go('dbSchema')} style={{ fontSize: '11px', padding: '5px 10px' }}>
            🗄️ Schema
          </button>
        </div>
      </div>
      {/* Primary KPI Stats Cards (8 Cards in 2 rows of 4) */}
      <div className="stats">
        <div className="stat-card" onClick={() => go('customers')} style={{ cursor: 'pointer' }} title="Manage Customers">
          <div className="stat-icon">👥</div>
          <div>
            <p>Customers</p>
            <h2>{stats.totalCustomers}</h2>
          </div>
        </div>
        <div className="stat-card" onClick={() => go('orders')} style={{ cursor: 'pointer' }} title="Manage Orders">
          <div className="stat-icon">📋</div>
          <div>
            <p>Orders</p>
            <h2>{stats.totalOrders}</h2>
          </div>
        </div>
        <div className="stat-card" onClick={() => go('parcels')} style={{ cursor: 'pointer' }} title="Manage Parcels">
          <div className="stat-icon">📦</div>
          <div>
            <p>Parcels</p>
            <h2>{stats.totalParcels}</h2>
          </div>
        </div>
        <div className="stat-card" onClick={() => go('payments')} style={{ cursor: 'pointer' }} title="Manage Payments">
          <div className="stat-icon">💳</div>
          <div>
            <p>Payments</p>
            <h2>{stats.totalPayments}</h2>
          </div>
        </div>
        <div className="stat-card" onClick={() => go('couriers')} style={{ cursor: 'pointer' }} title="Manage Couriers">
          <div className="stat-icon">🚚</div>
          <div>
            <p>Couriers</p>
            <h2>{stats.totalCouriers}</h2>
          </div>
        </div>
        <div className="stat-card" onClick={() => go('branches')} style={{ cursor: 'pointer' }} title="Manage Branches">
          <div className="stat-icon">🏢</div>
          <div>
            <p>Branches</p>
            <h2>{stats.totalBranches}</h2>
          </div>
        </div>
        <div className="stat-card" onClick={() => go('staff')} style={{ cursor: 'pointer' }} title="Manage Staff">
          <div className="stat-icon">🧑‍💼</div>
          <div>
            <p>Staff</p>
            <h2>{stats.totalStaff}</h2>
          </div>
        </div>
        <div className="stat-card" onClick={() => go('vehicles')} style={{ cursor: 'pointer' }} title="Manage Vehicles">
          <div className="stat-icon">🚐</div>
          <div>
            <p>Vehicles</p>
            <h2>{stats.totalVehicles}</h2>
          </div>
        </div>
      </div>

      {/* ================= ENTITY NETWORK (DASHBOARD) ================= */}
      <div className="network-box">
        <div className="network-header">
          <div>
            <span className="eyebrow">DATABASE RELATIONSHIPS</span>
            <h2>Interactive Entity Network</h2>
            <p>Select an entity to highlight its foreign-key relationships and live record counts.</p>
          </div>
          <button className="secondary-btn" onClick={() => go('eerDiagram')}>
            Open Full EER →
          </button>
        </div>

        {/* Legend */}
        <div className="key-legend">
          <span><i className="legend pk"></i> Primary Key</span>
          <span><i className="legend fk"></i> Foreign Key</span>
          <span><i className="legend normal"></i> Attribute</span>
          <span><i className="legend relation"></i> Relationship</span>
          {selectedNetworkKey && (
            <button
              onClick={() => setSelectedNetworkKey(null)}
              style={{ marginLeft: 'auto', background: 'none', border: 'none', color: 'var(--danger)', fontSize: '11px', cursor: 'pointer', fontWeight: 'bold' }}
            >
              Clear Selection ×
            </button>
          )}
        </div>

        {/* Actual Entity Boxes */}
        <div className="entity-network" style={{ minHeight: 'auto', padding: '24px' }}>
          <div id="entityCards" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '16px' }}>
            {NETWORK_ENTITIES.map((ent) => {
              const isSelected = selectedNetworkKey === ent.key;
              const selectedEntObj = selectedNetworkKey ? NETWORK_ENTITIES.find(e => e.key === selectedNetworkKey) : null;
              const isRelated = selectedEntObj && (selectedEntObj.relations.includes(ent.key) || ent.relations.includes(selectedNetworkKey));
              const isDimmed = selectedNetworkKey && !isSelected && !isRelated;

              let cardClass = 'entity-card';
              if (isSelected) cardClass += ' selected';
              if (isRelated) cardClass += ' related';
              if (isDimmed) cardClass += ' dimmed';

              return (
                <div
                  key={ent.key}
                  className={cardClass}
                  onClick={() => handleSelectNetwork(ent.key)}
                  title="Click to highlight related foreign-key entities"
                >
                  <div className="entity-title">
                    <span>{ent.name}</span>
                    <span className="entity-count">{ent.count ?? '-'}</span>
                  </div>
                  <div className="entity-attributes">
                    {ent.fields.map(([fieldName, type], fIdx) => (
                      <div key={fIdx} className="attribute">
                        <span className={`key-tag ${type === 'pk' ? 'pk-tag' : type === 'fk' ? 'fk-tag' : 'normal-tag'}`}>
                          {type === 'pk' ? 'PK' : type === 'fk' ? 'FK' : 'ATTR'}
                        </span>
                        <span>{fieldName}</span>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Extended DBMS Entity Record Counts Grid */}
      <div style={{ marginTop: '22px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
          <div>
            <h3 style={{ fontSize: '14px', margin: 0, fontWeight: 700, color: '#17251e' }}>
              DBMS Live Table Record Counts
            </h3>
            <p style={{ fontSize: '11px', color: '#75867e', margin: '2px 0 0' }}>
              Real-time row counts queried across Oracle relational tables via Spring Boot JDBC
            </p>
          </div>
          <button className="textBtn" onClick={() => go('dbSchema')}>
            View full schema &rarr;
          </button>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
          gap: '10px'
        }}>
          {dbMetrics.map((m) => (
            <div
              key={m.label}
              onClick={() => go(m.route)}
              style={{
                background: '#fff',
                border: '1px solid #e1e9e4',
                borderRadius: '10px',
                padding: '12px 14px',
                cursor: 'pointer',
                transition: 'transform 0.15s, box-shadow 0.15s',
                boxShadow: '0 2px 6px rgba(21,60,41,0.03)',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 6px 14px rgba(40,127,85,0.12)';
                e.currentTarget.style.borderColor = '#287f55';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 2px 6px rgba(21,60,41,0.03)';
                e.currentTarget.style.borderColor = '#e1e9e4';
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '18px' }}>{m.icon}</span>
                <span style={{
                  fontSize: '9px',
                  background: '#eef6f1',
                  color: '#287f55',
                  padding: '2px 6px',
                  borderRadius: '10px',
                  fontWeight: 600
                }}>
                  {m.tag}
                </span>
              </div>
              <div style={{ fontSize: '20px', fontWeight: 800, color: '#17251e', marginTop: '6px' }}>
                {m.count}
              </div>
              <div style={{ fontSize: '11px', color: '#687a71', fontWeight: 500, marginTop: '2px' }}>
                {m.label}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Orders & Quick Actions Grid */}
      <div className="dashGrid" style={{ marginTop: '22px' }}>
        {/* Recent Shipments Panel */}
        <section className="panel">
          <div className="panelHead">
            <div>
              <h2>Recent Orders</h2>
              <p>Latest shipments recorded in Oracle Database</p>
            </div>
            <button className="textBtn" onClick={() => go('orders')}>
              View all →
            </button>
          </div>
          <div className="miniTable">
            <table>
              <thead>
                <tr>
                  <th>ORDER ID</th>
                  <th>CUSTOMER</th>
                  <th>DATE</th>
                  <th>AMOUNT</th>
                  <th>STATUS</th>
                </tr>
              </thead>
              <tbody>
                {stats.recentOrders.map((o) => (
                  <tr key={o.id}>
                    <td><b>ORD-{o.id}</b></td>
                    <td>{o.customer}</td>
                    <td>{o.date}</td>
                    <td>{formatCurrency(o.amount)}</td>
                    <td><StatusBadge>{o.status}</StatusBadge></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* Quick Actions Panel */}
        <section className="panel quick">
          <div className="panelHead">
            <div>
              <h2>Quick Actions</h2>
              <p>Common tasks &amp; DBMS tools</p>
            </div>
          </div>
          {[
            ['👥', 'Manage Customers', 'customers', 'View, add and filter customers'],
            ['📋', 'Manage Orders', 'orders', 'Review bookings & delivery status'],
            ['📦', 'Manage Parcels', 'parcels', 'Package valuations & assignments'],
            ['💳', 'Manage Payments', 'payments', 'Financial transactions & invoices'],
            ['🧮', 'SQL Console', 'sqlEditor', 'Run custom SQL queries on Oracle'],
            ['⚙️', 'PL/SQL Procedure', 'plsqlOps', 'Execute stored procedures & triggers'],
            ['🔗', 'Full EER Diagram', 'eerDiagram', 'Movable 20-entity design canvas'],
            ['🗄️', 'Database Schema', 'dbSchema', 'Table structures, PK/FK & DDL'],
          ].map((x) => (
            <button key={x[1]} onClick={() => go(x[2])}>
              <span>{x[0]}</span>
              <div>
                <b>{x[1]}</b>
                <small>{x[3]}</small>
              </div>
              <em>›</em>
            </button>
          ))}
        </section>
      </div>

      {/* ========================================================================= */}
      {/* DATABASE OVERVIEW SECTION */}
      {/* ========================================================================= */}
      <section className="panel" style={{ marginTop: '24px', overflow: 'hidden' }}>
        <div className="panelHead" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '20px' }}>🗄</span>
              <h2 style={{ fontSize: '16px', margin: 0, letterSpacing: '0.02em' }}>
                DATABASE OVERVIEW
              </h2>
            </div>
            <p style={{ margin: '4px 0 0', fontSize: '11px', color: '#75867e' }}>
              Oracle 26ai relational schema &bull; Click any entity card to inspect columns, data types, primary keys, and foreign keys
            </p>
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button className="filterBtn" onClick={() => go('sqlEditor')} style={{ cursor: 'pointer', background: '#f5f8f6', fontSize: '11px' }}>
              ⚡ Open SQL Editor
            </button>
            <button className="filterBtn" onClick={() => go('eerDiagram')} style={{ cursor: 'pointer', background: '#f5f8f6', fontSize: '11px' }}>
              📊 Visual EER Diagram
            </button>
            <button className="primary" onClick={() => go('dbSchema')} style={{ fontSize: '11px', padding: '8px 14px' }}>
              📋 Full Schema &amp; DDL
            </button>
          </div>
        </div>

        {/* Expandable Entity Cards Grid */}
        <div style={{ padding: '18px', background: '#f8faf9', borderBottom: '1px solid #edf1ee' }}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
            gap: '12px'
          }}>
            {ENTITY_SUMMARIES.map((ent) => {
              const isExpanded = Boolean(expandedEntities[ent.table]);
              return (
                <div
                  key={ent.table}
                  style={{
                    background: '#fff',
                    border: isExpanded ? '1.5px solid #287f55' : '1px solid #dce5df',
                    borderRadius: '9px',
                    boxShadow: isExpanded ? '0 4px 12px rgba(40,127,85,0.08)' : '0 2px 4px rgba(0,0,0,0.02)',
                    transition: 'all 0.15s ease',
                    overflow: 'hidden'
                  }}
                >
                  {/* Card Header (Clickable to expand/collapse) */}
                  <div
                    onClick={() => toggleExpand(ent.table)}
                    style={{
                      padding: '12px 14px',
                      cursor: 'pointer',
                      background: isExpanded ? '#edf7f1' : '#fff',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      borderBottom: isExpanded ? '1px solid #d2e8db' : 'none'
                    }}
                  >
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <b style={{ fontSize: '14px', color: '#17251e', fontFamily: 'monospace' }}>
                          {ent.table}
                        </b>
                        <span style={{
                          fontSize: '9px',
                          padding: '2px 6px',
                          borderRadius: '10px',
                          fontWeight: 700,
                          background: ent.type.includes('Weak') ? '#fef3c7' : '#eaf7ef',
                          color: ent.type.includes('Weak') ? '#b45309' : '#287f55'
                        }}>
                          {ent.type}
                        </span>
                      </div>
                      <small style={{ color: '#75867e', fontSize: '10px', marginTop: '2px', display: 'block' }}>
                        PK: <code>{ent.pk}</code>
                      </small>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span style={{
                        fontSize: '9px',
                        background: '#f0f4f2',
                        padding: '2px 6px',
                        borderRadius: '10px',
                        color: '#405148',
                        fontWeight: 600
                      }}>
                        {ent.columns.length} cols
                      </span>
                      <span style={{ color: '#88a294', fontSize: '14px', fontWeight: 'bold' }}>
                        {isExpanded ? '▾' : '▸'}
                      </span>
                    </div>
                  </div>

                  {/* Expanded Attributes View */}
                  {isExpanded && (
                    <div style={{ padding: '12px 14px' }}>
                      <p style={{ fontSize: '11px', color: '#687a71', margin: '0 0 8px 0' }}>
                        {ent.desc}
                      </p>

                      <div style={{ fontSize: '10px', color: '#405148', marginBottom: '8px' }}>
                        <strong>FK Relations:</strong> <span style={{ color: '#2563eb' }}>{ent.fks}</span>
                      </div>

                      {/* Columns Mini-Table */}
                      <table style={{ margin: '0 0 8px 0', border: '1px solid #edf1ee' }}>
                        <thead>
                          <tr>
                            <th style={{ fontSize: '8px', padding: '6px 8px' }}>COLUMN</th>
                            <th style={{ fontSize: '8px', padding: '6px 8px' }}>DATA TYPE</th>
                            <th style={{ fontSize: '8px', padding: '6px 8px' }}>KEY</th>
                            <th style={{ fontSize: '8px', padding: '6px 8px' }}>NULL</th>
                          </tr>
                        </thead>
                        <tbody>
                          {ent.columns.map((c) => (
                            <tr key={c.name}>
                              <td style={{ padding: '6px 8px' }}>
                                <code style={{ fontWeight: 600, color: c.pk ? '#287f55' : c.fk ? '#2563eb' : '#17251e' }}>
                                  {c.name}
                                </code>
                              </td>
                              <td style={{ padding: '6px 8px', fontSize: '10px', color: '#556960' }}>
                                {c.type}
                              </td>
                              <td style={{ padding: '6px 8px' }}>
                                {c.pk ? (
                                  <span style={{ fontSize: '8px', fontWeight: 700, color: '#137333', background: '#e6f4ea', padding: '1px 4px', borderRadius: '3px' }}>PK</span>
                                ) : c.fk ? (
                                  <span style={{ fontSize: '8px', fontWeight: 700, color: '#1d4ed8', background: '#eff6ff', padding: '1px 4px', borderRadius: '3px' }}>FK</span>
                                ) : (
                                  <span style={{ color: '#ccc' }}>—</span>
                                )}
                              </td>
                              <td style={{ padding: '6px 8px', fontSize: '9px', color: c.nullable ? '#829189' : '#b91c1c' }}>
                                {c.nullable ? 'YES' : 'NO'}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>

                      <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '6px' }}>
                        <button
                          className="textBtn"
                          onClick={(e) => {
                            e.stopPropagation();
                            go(ent.route);
                          }}
                          style={{ fontSize: '11px', fontWeight: 600 }}
                        >
                          Manage {ent.table} Data &rarr;
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>
    </main>
  );
}