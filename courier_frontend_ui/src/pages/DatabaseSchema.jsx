import { useState, useEffect } from 'react';
import api from '../api';
import AlertBanner from '../components/AlertBanner';

const DEFAULT_SCHEMA = [
  {
    tableName: 'CUSTOMER',
    description: 'Client accounts placing package delivery orders',
    pk: 'customer_id',
    columns: [
      { name: 'customer_id', type: 'NUMBER', pk: true, fk: false, nullable: false, desc: 'Primary Key uniquely identifying each customer' },
      { name: 'name', type: 'VARCHAR2(100)', pk: false, fk: false, nullable: false, desc: 'Full name of customer' },
      { name: 'email', type: 'VARCHAR2(100)', pk: false, fk: false, nullable: true, desc: 'Email address for booking notifications' },
      { name: 'street', type: 'VARCHAR2(150)', pk: false, fk: false, nullable: true, desc: 'Street address' },
      { name: 'city', type: 'VARCHAR2(100)', pk: false, fk: false, nullable: true, desc: 'City of residence' },
      { name: 'pin', type: 'VARCHAR2(20)', pk: false, fk: false, nullable: true, desc: 'Postal PIN code' },
    ],
    relationships: [
      { target: 'ORDERS', type: '1:N', foreignKey: 'customer_id', desc: 'Customer places one or many orders (FK: orders.customer_id)' },
      { target: 'PAYMENT', type: '1:N', foreignKey: 'customer_id', desc: 'Customer executes payments (FK: payment.customer_id)' },
    ],
    ddl: `CREATE TABLE CUSTOMER (\n    customer_id NUMBER PRIMARY KEY,\n    name VARCHAR2(100) NOT NULL,\n    email VARCHAR2(100),\n    street VARCHAR2(150),\n    city VARCHAR2(100),\n    pin VARCHAR2(20)\n);`
  },
  {
    tableName: 'ORDERS',
    description: 'Customer shipment bookings tracking status and charges',
    pk: 'order_id',
    columns: [
      { name: 'order_id', type: 'NUMBER', pk: true, fk: false, nullable: false, desc: 'Primary Key uniquely identifying each order' },
      { name: 'customer_id', type: 'NUMBER', pk: false, fk: true, target: 'CUSTOMER(customer_id)', nullable: false, desc: 'Foreign Key to CUSTOMER table' },
      { name: 'service_id', type: 'NUMBER', pk: false, fk: true, target: 'COURIER_SERVICE(service_id)', nullable: true, desc: 'Foreign Key to COURIER_SERVICE table' },
      { name: 'order_date', type: 'TIMESTAMP', pk: false, fk: false, nullable: true, desc: 'Date and time booking was registered (DEFAULT CURRENT_TIMESTAMP)' },
      { name: 'status', type: 'VARCHAR2(50)', pk: false, fk: false, nullable: true, desc: 'Shipment milestone (Pending, Processing, In Transit, Delivered, Cancelled)' },
      { name: 'amount', type: 'NUMBER(10,2)', pk: false, fk: false, nullable: true, desc: 'Total monetary order invoice amount' },
    ],
    relationships: [
      { target: 'CUSTOMER', type: 'N:1', foreignKey: 'customer_id', desc: 'Belongs to CUSTOMER' },
      { target: 'COURIER_SERVICE', type: 'N:1', foreignKey: 'service_id', desc: 'Uses COURIER_SERVICE tariff' },
      { target: 'PARCEL', type: '1:1', foreignKey: 'order_id', desc: 'Contains physical PARCEL item' },
      { target: 'PAYMENT', type: '1:1', foreignKey: 'order_id', desc: 'Settled by PAYMENT transaction' },
    ],
    ddl: `CREATE TABLE ORDERS (\n    order_id NUMBER PRIMARY KEY,\n    customer_id NUMBER,\n    service_id NUMBER,\n    order_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,\n    status VARCHAR2(50),\n    amount NUMBER(10, 2),\n    CONSTRAINT fk_orders_customer FOREIGN KEY (customer_id) REFERENCES CUSTOMER(customer_id) ON DELETE CASCADE,\n    CONSTRAINT fk_orders_service FOREIGN KEY (service_id) REFERENCES COURIER_SERVICE(service_id) ON DELETE SET NULL\n);`
  },
  {
    tableName: 'PARCEL',
    description: 'Physical package units shipped through the courier network',
    pk: 'parcel_id',
    columns: [
      { name: 'parcel_id', type: 'NUMBER', pk: true, fk: false, nullable: false, desc: 'Primary Key uniquely identifying parcel' },
      { name: 'order_id', type: 'NUMBER', pk: false, fk: true, target: 'ORDERS(order_id)', nullable: false, desc: 'Foreign Key to parent order' },
      { name: 'price', type: 'NUMBER(10,2)', pk: false, fk: false, nullable: true, desc: 'Declared valuation for insurance and transit' },
      { name: 'courier_id', type: 'NUMBER', pk: false, fk: true, target: 'COURIER(courier_id)', nullable: true, desc: 'Foreign Key to assigned partner courier' },
      { name: 'staff_id', type: 'NUMBER', pk: false, fk: true, target: 'STAFF(staff_id)', nullable: true, desc: 'Foreign Key to handling staff employee' },
    ],
    relationships: [
      { target: 'ORDERS', type: '1:1', foreignKey: 'order_id', desc: 'Directly linked to ORDERS' },
      { target: 'COURIER', type: 'N:1', foreignKey: 'courier_id', desc: 'Dispatched by COURIER partner' },
      { target: 'STAFF', type: 'N:1', foreignKey: 'staff_id', desc: 'Managed by assigned STAFF' },
      { target: 'TRACKING_EVENT', type: '1:N', foreignKey: 'parcel_id', desc: 'Logs milestone history in TRACKING_EVENT' },
    ],
    ddl: `CREATE TABLE PARCEL (\n    parcel_id NUMBER PRIMARY KEY,\n    order_id NUMBER,\n    price NUMBER(10, 2),\n    courier_id NUMBER,\n    staff_id NUMBER,\n    CONSTRAINT fk_parcel_order FOREIGN KEY (order_id) REFERENCES ORDERS(order_id) ON DELETE CASCADE,\n    CONSTRAINT fk_parcel_courier FOREIGN KEY (courier_id) REFERENCES COURIER(courier_id) ON DELETE SET NULL,\n    CONSTRAINT fk_parcel_staff FOREIGN KEY (staff_id) REFERENCES STAFF(staff_id) ON DELETE SET NULL\n);`
  },
  {
    tableName: 'COURIER',
    description: 'Partner logistics companies and courier organizations',
    pk: 'courier_id',
    columns: [
      { name: 'courier_id', type: 'NUMBER', pk: true, fk: false, nullable: false, desc: 'Primary Key uniquely identifying courier company' },
      { name: 'name', type: 'VARCHAR2(100)', pk: false, fk: false, nullable: false, desc: 'Organization trade name' },
      { name: 'email', type: 'VARCHAR2(100)', pk: false, fk: false, nullable: true, desc: 'Official customer contact email' },
    ],
    relationships: [
      { target: 'COURIER_SERVICE', type: '1:N', foreignKey: 'courier_id', desc: 'Provides services at branches' },
      { target: 'PARCEL', type: '1:N', foreignKey: 'courier_id', desc: 'Transports parcels' },
      { target: 'DELIVERY_BOY', type: '1:1', foreignKey: 'courier_id', desc: 'Specialized subtype (Delivery Boy)' },
      { target: 'BRANCH_STAFF', type: '1:1', foreignKey: 'courier_id', desc: 'Specialized subtype (Branch Staff)' },
      { target: 'DRIVER', type: '1:1', foreignKey: 'courier_id', desc: 'Specialized subtype (Driver)' },
    ],
    ddl: `CREATE TABLE COURIER (\n    courier_id NUMBER PRIMARY KEY,\n    name VARCHAR2(100) NOT NULL,\n    email VARCHAR2(100)\n);`
  },
  {
    tableName: 'BRANCH',
    description: 'Regional sorting hubs, terminals, and operational centers',
    pk: 'branch_id',
    columns: [
      { name: 'branch_id', type: 'NUMBER', pk: true, fk: false, nullable: false, desc: 'Primary Key uniquely identifying branch hub' },
      { name: 'branch_name', type: 'VARCHAR2(100)', pk: false, fk: false, nullable: false, desc: 'Designation name of branch' },
      { name: 'street', type: 'VARCHAR2(150)', pk: false, fk: false, nullable: true, desc: 'Street address' },
      { name: 'city', type: 'VARCHAR2(100)', pk: false, fk: false, nullable: true, desc: 'Operating city' },
      { name: 'pin', type: 'VARCHAR2(20)', pk: false, fk: false, nullable: true, desc: 'Postal PIN code' },
    ],
    relationships: [
      { target: 'STAFF', type: '1:N', foreignKey: 'branch_id', desc: 'Employs branch staff' },
      { target: 'COURIER_SERVICE', type: '1:N', foreignKey: 'branch_id', desc: 'Hosts courier service contracts' },
      { target: 'DELIVERY_ATTEMPT', type: '1:N', foreignKey: 'branch_id', desc: 'Owns delivery attempts (Identifying Relationship)' },
    ],
    ddl: `CREATE TABLE BRANCH (\n    branch_id NUMBER PRIMARY KEY,\n    branch_name VARCHAR2(100) NOT NULL,\n    street VARCHAR2(150),\n    city VARCHAR2(100),\n    pin VARCHAR2(20)\n);`
  },
  {
    tableName: 'STAFF',
    description: 'Employees across operations, accounting, and transport roles',
    pk: 'staff_id',
    columns: [
      { name: 'staff_id', type: 'NUMBER', pk: true, fk: false, nullable: false, desc: 'Primary Key identifier' },
      { name: 'role', type: 'VARCHAR2(50)', pk: false, fk: false, nullable: true, desc: 'Job role (Manager, Accountant, Driver, Support)' },
      { name: 'branch_id', type: 'NUMBER', pk: false, fk: true, target: 'BRANCH(branch_id)', nullable: true, desc: 'Foreign Key to assigned branch' },
      { name: 'name', type: 'VARCHAR2(100)', pk: false, fk: false, nullable: false, desc: 'Employee full name' },
      { name: 'department', type: 'VARCHAR2(100)', pk: false, fk: false, nullable: true, desc: 'Department unit' },
    ],
    relationships: [
      { target: 'BRANCH', type: 'N:1', foreignKey: 'branch_id', desc: 'Assigned to BRANCH' },
      { target: 'PARCEL', type: '1:N', foreignKey: 'staff_id', desc: 'Handles PARCEL' },
      { target: 'VEHICLE', type: '1:N', foreignKey: 'staff_id', desc: 'Drives VEHICLE' },
      { target: 'MANAGER', type: '1:1', foreignKey: 'staff_id', desc: 'Specialized subtype (Manager)' },
      { target: 'CUSTOMER_SUPPORT', type: '1:1', foreignKey: 'staff_id', desc: 'Specialized subtype (Support)' },
      { target: 'ACCOUNTANT', type: '1:1', foreignKey: 'staff_id', desc: 'Specialized subtype (Accountant)' },
    ],
    ddl: `CREATE TABLE STAFF (\n    staff_id NUMBER PRIMARY KEY,\n    role VARCHAR2(50),\n    branch_id NUMBER,\n    name VARCHAR2(100) NOT NULL,\n    department VARCHAR2(100),\n    CONSTRAINT fk_staff_branch FOREIGN KEY (branch_id) REFERENCES BRANCH(branch_id) ON DELETE SET NULL\n);`
  },
  {
    tableName: 'COURIER_SERVICE',
    description: 'Relational table between branches, couriers, and tariffs',
    pk: 'service_id',
    columns: [
      { name: 'service_id', type: 'NUMBER', pk: true, fk: false, nullable: false, desc: 'Primary Key identifier' },
      { name: 'branch_id', type: 'NUMBER', pk: false, fk: true, target: 'BRANCH(branch_id)', nullable: false, desc: 'Foreign Key to BRANCH' },
      { name: 'courier_id', type: 'NUMBER', pk: false, fk: true, target: 'COURIER(courier_id)', nullable: false, desc: 'Foreign Key to COURIER' },
      { name: 'charges', type: 'NUMBER(10,2)', pk: false, fk: false, nullable: true, desc: 'Service fee charged' },
    ],
    relationships: [
      { target: 'BRANCH', type: 'N:1', foreignKey: 'branch_id', desc: 'Offered at BRANCH' },
      { target: 'COURIER', type: 'N:1', foreignKey: 'courier_id', desc: 'Operated by COURIER' },
      { target: 'ORDERS', type: '1:N', foreignKey: 'service_id', desc: 'Selected for ORDERS' },
    ],
    ddl: `CREATE TABLE COURIER_SERVICE (\n    service_id NUMBER PRIMARY KEY,\n    branch_id NUMBER,\n    courier_id NUMBER,\n    charges NUMBER(10, 2),\n    CONSTRAINT fk_cs_branch FOREIGN KEY (branch_id) REFERENCES BRANCH(branch_id) ON DELETE CASCADE,\n    CONSTRAINT fk_cs_courier FOREIGN KEY (courier_id) REFERENCES COURIER(courier_id) ON DELETE CASCADE\n);`
  },
  {
    tableName: 'PAYMENT',
    description: 'Financial transactions recording order settlements',
    pk: 'payment_id',
    columns: [
      { name: 'payment_id', type: 'NUMBER', pk: true, fk: false, nullable: false, desc: 'Primary Key identifier' },
      { name: 'customer_id', type: 'NUMBER', pk: false, fk: true, target: 'CUSTOMER(customer_id)', nullable: false, desc: 'Foreign Key to CUSTOMER' },
      { name: 'order_id', type: 'NUMBER', pk: false, fk: true, target: 'ORDERS(order_id)', nullable: false, desc: 'Foreign Key to ORDERS' },
      { name: 'amount', type: 'NUMBER(10,2)', pk: false, fk: false, nullable: true, desc: 'Payment amount' },
      { name: 'status', type: 'VARCHAR2(50)', pk: false, fk: false, nullable: true, desc: 'Payment status (Paid, Pending, Refunded)' },
    ],
    relationships: [
      { target: 'CUSTOMER', type: 'N:1', foreignKey: 'customer_id', desc: 'Paid by CUSTOMER' },
      { target: 'ORDERS', type: '1:1', foreignKey: 'order_id', desc: 'Settles ORDERS' },
      { target: 'CASH_MODE', type: '1:1', foreignKey: 'payment_id', desc: 'Subtype: Cash on delivery' },
      { target: 'CARD_MODE', type: '1:1', foreignKey: 'payment_id', desc: 'Subtype: Card terminal' },
      { target: 'ONLINE_MODE', type: '1:1', foreignKey: 'payment_id', desc: 'Subtype: Online payment gateway' },
    ],
    ddl: `CREATE TABLE PAYMENT (\n    payment_id NUMBER PRIMARY KEY,\n    customer_id NUMBER,\n    order_id NUMBER,\n    amount NUMBER(10, 2),\n    status VARCHAR2(50),\n    CONSTRAINT fk_payment_customer FOREIGN KEY (customer_id) REFERENCES CUSTOMER(customer_id) ON DELETE CASCADE,\n    CONSTRAINT fk_payment_order FOREIGN KEY (order_id) REFERENCES ORDERS(order_id) ON DELETE CASCADE\n);`
  },
  {
    tableName: 'VEHICLE',
    description: 'Fleet transport vehicles allocated to delivery staff drivers',
    pk: 'vehicle_no',
    columns: [
      { name: 'vehicle_no', type: 'VARCHAR2(50)', pk: true, fk: false, nullable: false, desc: 'License Plate (Primary Key)' },
      { name: 'license_no', type: 'VARCHAR2(50)', pk: false, fk: false, nullable: true, desc: 'Commercial driver permit number' },
      { name: 'staff_id', type: 'NUMBER', pk: false, fk: true, target: 'STAFF(staff_id)', nullable: true, desc: 'Assigned driver employee' },
    ],
    relationships: [
      { target: 'STAFF', type: 'N:1', foreignKey: 'staff_id', desc: 'Driven by STAFF' },
    ],
    ddl: `CREATE TABLE VEHICLE (\n    vehicle_no VARCHAR2(50) PRIMARY KEY,\n    license_no VARCHAR2(50),\n    staff_id NUMBER,\n    CONSTRAINT fk_vehicle_staff FOREIGN KEY (staff_id) REFERENCES STAFF(staff_id) ON DELETE SET NULL\n);`
  },
  {
    tableName: 'TRACKING_EVENT',
    description: 'Audit checkpoints recording time and transit event milestones',
    pk: 'event_id',
    columns: [
      { name: 'event_id', type: 'NUMBER', pk: true, fk: false, nullable: false, desc: 'Primary Key event identifier' },
      { name: 'parcel_id', type: 'NUMBER', pk: false, fk: true, target: 'PARCEL(parcel_id)', nullable: false, desc: 'Foreign Key to PARCEL' },
      { name: 'event_type', type: 'VARCHAR2(100)', pk: false, fk: false, nullable: true, desc: 'Milestone (Picked Up, In Transit, Delivered)' },
      { name: 'event_time', type: 'TIMESTAMP', pk: false, fk: false, nullable: true, desc: 'Timestamp of event' },
    ],
    relationships: [
      { target: 'PARCEL', type: 'N:1', foreignKey: 'parcel_id', desc: 'Logs milestone for PARCEL' },
    ],
    ddl: `CREATE TABLE TRACKING_EVENT (\n    event_id NUMBER PRIMARY KEY,\n    parcel_id NUMBER,\n    event_type VARCHAR2(100),\n    event_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,\n    CONSTRAINT fk_te_parcel FOREIGN KEY (parcel_id) REFERENCES PARCEL(parcel_id) ON DELETE CASCADE\n);`
  },
  {
    tableName: 'DELIVERY_ATTEMPT',
    description: 'Weak Entity documenting repeated delivery trials per branch',
    pk: '(branch_id, attempt_no)',
    columns: [
      { name: 'branch_id', type: 'NUMBER', pk: true, fk: true, target: 'BRANCH(branch_id)', nullable: false, desc: 'Composite PK part 1 & FK to BRANCH' },
      { name: 'attempt_no', type: 'NUMBER', pk: true, fk: false, nullable: false, desc: 'Composite PK part 2 (Discriminator)' },
      { name: 'courier_id', type: 'NUMBER', pk: false, fk: true, target: 'COURIER(courier_id)', nullable: true, desc: 'Foreign Key to assigned courier' },
      { name: 'attempt_time', type: 'TIMESTAMP', pk: false, fk: false, nullable: true, desc: 'Timestamp of delivery trial' },
      { name: 'status', type: 'VARCHAR2(50)', pk: false, fk: false, nullable: true, desc: 'Trial result (Delivered, Pending, Failed)' },
    ],
    relationships: [
      { target: 'BRANCH', type: 'N:1', foreignKey: 'branch_id', desc: 'Identifying Owner: BRANCH' },
      { target: 'COURIER', type: 'N:1', foreignKey: 'courier_id', desc: 'Attempt executed by COURIER' },
    ],
    ddl: `CREATE TABLE DELIVERY_ATTEMPT (\n    branch_id NUMBER,\n    courier_id NUMBER,\n    attempt_no NUMBER,\n    attempt_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,\n    status VARCHAR2(50),\n    PRIMARY KEY (branch_id, attempt_no),\n    CONSTRAINT fk_da_branch FOREIGN KEY (branch_id) REFERENCES BRANCH(branch_id) ON DELETE CASCADE,\n    CONSTRAINT fk_da_courier FOREIGN KEY (courier_id) REFERENCES COURIER(courier_id) ON DELETE SET NULL\n);`
  },
];

export default function DatabaseSchema({ go }) {
  const [schema, setSchema] = useState(DEFAULT_SCHEMA);
  const [selectedTable, setSelectedTable] = useState('CUSTOMER');
  const [showDdl, setShowDdl] = useState(false);

  useEffect(() => {
    api.getDatabaseSchema()
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) {
          // Merge DDL from DEFAULT_SCHEMA
          const merged = data.map(t => {
            const def = DEFAULT_SCHEMA.find(d => d.tableName === t.tableName);
            return { ...t, ddl: def?.ddl || '' };
          });
          setSchema(merged);
        }
      })
      .catch(() => {
        // Use DEFAULT_SCHEMA if offline
      });
  }, []);

  const currentTable = schema.find((t) => t.tableName === selectedTable) || schema[0];

  return (
    <main className="content">
      <div className="pageHead" style={{ flexWrap: 'wrap', gap: '10px' }}>
        <div>
          <p className="eyebrow">DATABASE DICTIONARY &amp; SCHEMA METADATA</p>
          <h1>Database Schema</h1>
          <p className="muted">
            Relational structure of the Oracle database: Tables, Columns, Primary Keys, Foreign Keys, Nullability, and Constraints.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            className="filterBtn"
            onClick={() => go('sqlEditor')}
            style={{ cursor: 'pointer', background: '#fff' }}
          >
            ⚡ SQL Editor
          </button>
          <button
            className="filterBtn"
            onClick={() => go('eerDiagram')}
            style={{ cursor: 'pointer', background: '#fff' }}
          >
            📊 EER Diagram
          </button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '260px 1fr', gap: '22px', alignItems: 'start' }}>
        {/* Table Selector */}
        <section className="panel" style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ padding: '16px 18px', borderBottom: '1px solid #edf1ee' }}>
            <h2 style={{ fontSize: '12px', margin: 0, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#405148' }}>
              Oracle Tables ({schema.length})
            </h2>
          </div>
          <div style={{ maxHeight: '680px', overflowY: 'auto' }}>
            {schema.map((t) => {
              const isSelected = t.tableName === selectedTable;
              return (
                <div
                  key={t.tableName}
                  onClick={() => {
                    setSelectedTable(t.tableName);
                    setShowDdl(false);
                  }}
                  style={{
                    padding: '13px 18px',
                    borderBottom: '1px solid #edf1ee',
                    cursor: 'pointer',
                    backgroundColor: isSelected ? '#edf7f1' : 'transparent',
                    borderLeft: isSelected ? '4px solid #287f55' : '4px solid transparent',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <div style={{ fontWeight: isSelected ? 'bold' : '600', fontSize: '12px', color: '#17251e' }}>
                    {t.tableName}
                  </div>
                  <small style={{ color: '#77887f', fontSize: '10px', display: 'block', marginTop: '2px' }}>
                    PK: {t.pk} • {t.columns?.length || 0} cols
                  </small>
                </div>
              );
            })}
          </div>
        </section>

        {/* Table Details */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <section className="panel" style={{ padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
              <div>
                <span className="trend" style={{ marginBottom: '6px', display: 'inline-block' }}>
                  TABLE: {currentTable.tableName}
                </span>
                <h2 style={{ fontSize: '20px', margin: '4px 0 6px 0', color: '#17251e' }}>
                  {currentTable.tableName}
                </h2>
                <p style={{ fontSize: '12px', color: '#75867e', margin: 0 }}>
                  {currentTable.description}
                </p>
              </div>

              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  className="filterBtn"
                  onClick={() => setShowDdl(!showDdl)}
                  style={{ cursor: 'pointer' }}
                >
                  {showDdl ? 'Hide DDL' : 'View Oracle DDL'}
                </button>
              </div>
            </div>

            {/* DDL Code Viewer */}
            {showDdl && (
              <div style={{ marginBottom: '20px', background: '#10271e', borderRadius: '8px', overflow: 'hidden' }}>
                <div style={{ padding: '8px 14px', background: '#162e24', color: '#a0c4b2', fontSize: '10px', fontWeight: 'bold' }}>
                  ORACLE DDL SPECIFICATION
                </div>
                <pre style={{ margin: 0, padding: '14px 18px', color: '#e8f5ed', fontSize: '11px', lineHeight: 1.45, fontFamily: 'monospace' }}>
                  <code>{currentTable.ddl}</code>
                </pre>
              </div>
            )}

            {/* Columns Table */}
            <div className="tablePanel" style={{ marginTop: '14px', marginBottom: '24px' }}>
              <div className="tableScroll">
                <table>
                  <thead>
                    <tr>
                      <th>COLUMN NAME</th>
                      <th>DATA TYPE</th>
                      <th>KEY TYPE</th>
                      <th>NULLABLE</th>
                      <th>DESCRIPTION</th>
                    </tr>
                  </thead>
                  <tbody>
                    {currentTable.columns.map((c) => (
                      <tr key={c.name}>
                        <td>
                          <code style={{ fontWeight: 700, color: '#1a3328', fontSize: '13px' }}>
                            {c.name}
                          </code>
                        </td>
                        <td>
                          <span style={{ fontSize: '11.5px', color: '#2563eb', fontFamily: 'monospace', fontWeight: 600 }}>
                            {c.type}
                          </span>
                        </td>
                        <td>
                          {c.pk && <span className="badge success">PK</span>}
                          {c.fk && (
                            <span className="badge warning" style={{ marginLeft: c.pk ? '6px' : 0 }}>
                              FK {c.target ? `➔ ${c.target}` : ''}
                            </span>
                          )}
                          {!c.pk && !c.fk && <span style={{ color: '#a0aca4' }}>—</span>}
                        </td>
                        <td>
                          {c.nullable ? (
                            <span style={{ color: '#667b70', fontSize: '12px' }}>YES</span>
                          ) : (
                            <span style={{ color: '#b91c1c', fontWeight: 800, fontSize: '11px', background: '#fdf2f2', padding: '2px 7px', borderRadius: '4px', border: '1px solid #fecaca' }}>
                              NO (NOT NULL)
                            </span>
                          )}
                        </td>
                        <td style={{ color: '#4a5e52', fontSize: '12.5px' }}>{c.desc}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Relationships Box */}
            {currentTable.relationships && currentTable.relationships.length > 0 && (
              <div style={{ borderTop: '1px solid #edf1ee', paddingTop: '18px' }}>
                <h3 style={{ fontSize: '13px', color: '#17251e', margin: '0 0 10px 0' }}>
                  Relational Dependencies &amp; Foreign Keys
                </h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '10px' }}>
                  {currentTable.relationships.map((rel, i) => (
                    <div
                      key={i}
                      style={{
                        background: '#f8faf9',
                        border: '1px solid #e1e9e4',
                        borderRadius: '8px',
                        padding: '10px 14px',
                        fontSize: '11px'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                        <span style={{ fontWeight: 'bold', color: '#1f6e47' }}>{currentTable.tableName} ➔ {rel.target}</span>
                        <span className="badge neutral">{rel.type}</span>
                      </div>
                      <div style={{ color: '#667b70' }}>{rel.desc}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </section>
        </div>
      </div>
    </main>
  );
}
