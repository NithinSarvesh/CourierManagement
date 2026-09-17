import { useState, useEffect } from 'react';
import api from '../api';
import AlertBanner from '../components/AlertBanner';

const PREDEFINED_OPERATIONS = [
  {
    id: 'GET_CUSTOMER_ORDER_COUNT',
    name: 'Get Customer Order Count',
    type: 'Stored Procedure (IN / OUT)',
    description: 'Demonstrates passing customer_id as an IN parameter and reading the order count via an OUT parameter.',
    plsqlSignature: 'PROCEDURE GET_CUSTOMER_ORDER_COUNT(p_customer_id IN NUMBER, p_count OUT NUMBER)',
    plsqlCode: `CREATE OR REPLACE PROCEDURE GET_CUSTOMER_ORDER_COUNT(
    p_customer_id IN NUMBER,
    p_count OUT NUMBER
) AS
BEGIN
    SELECT COUNT(*) INTO p_count FROM ORDERS WHERE customer_id = p_customer_id;
END;`,
    fields: [
      { name: 'customerId', label: 'Customer ID', type: 'number', default: 1001 }
    ]
  },
  {
    id: 'UPDATE_PARCEL_STATUS',
    name: 'Update Parcel Status & Log Audit',
    type: 'Stored Procedure (DML & Audit)',
    description: 'Updates parcel and order status, inserts a new event into TRACKING_EVENT table with timestamp, and commits the change.',
    plsqlSignature: 'PROCEDURE UPDATE_PARCEL_STATUS(p_parcel_id IN NUMBER, p_new_status IN VARCHAR2, p_message OUT VARCHAR2)',
    plsqlCode: `CREATE OR REPLACE PROCEDURE UPDATE_PARCEL_STATUS(
    p_parcel_id IN NUMBER,
    p_new_status IN VARCHAR2,
    p_message OUT VARCHAR2
) AS
    v_order_id NUMBER;
    v_new_event_id NUMBER;
BEGIN
    SELECT order_id INTO v_order_id FROM PARCEL WHERE parcel_id = p_parcel_id;
    UPDATE ORDERS SET status = p_new_status WHERE order_id = v_order_id;
    SELECT NVL(MAX(event_id), 7000) + 1 INTO v_new_event_id FROM TRACKING_EVENT;
    INSERT INTO TRACKING_EVENT (event_id, parcel_id, event_type, event_time)
    VALUES (v_new_event_id, p_parcel_id, p_new_status, CURRENT_TIMESTAMP);
    COMMIT;
    p_message := 'Parcel ' || p_parcel_id || ' status updated to ' || p_new_status || ' successfully.';
EXCEPTION
    WHEN NO_DATA_FOUND THEN
        p_message := 'Error: Parcel ID ' || p_parcel_id || ' not found.';
    WHEN OTHERS THEN
        ROLLBACK;
        p_message := 'Error updating parcel status: ' || SQLERRM;
END;`,
    fields: [
      { name: 'parcelId', label: 'Parcel ID', type: 'number', default: 6001 },
      { name: 'newStatus', label: 'New Status', type: 'select', options: ['Delivered', 'In Transit', 'Processing', 'Cancelled'], default: 'Delivered' }
    ]
  },
  {
    id: 'CALCULATE_DELIVERY_CHARGE',
    name: 'Calculate Delivery Charge',
    type: 'Stored Procedure (Business Logic)',
    description: 'Computes total shipping tariff using base rate, service charges from COURIER_SERVICE, weight factor, and transit distance.',
    plsqlSignature: 'PROCEDURE CALCULATE_DELIVERY_CHARGE(p_weight_kg IN NUMBER, p_distance_km IN NUMBER, p_service_id IN NUMBER, p_final_charge OUT NUMBER)',
    plsqlCode: `CREATE OR REPLACE PROCEDURE CALCULATE_DELIVERY_CHARGE(
    p_weight_kg IN NUMBER,
    p_distance_km IN NUMBER,
    p_service_id IN NUMBER,
    p_final_charge OUT NUMBER
) AS
    v_base_rate NUMBER := 50;
    v_weight_factor NUMBER := 15;
    v_distance_factor NUMBER := 0.5;
    v_service_charge NUMBER := 0;
BEGIN
    BEGIN
        SELECT NVL(charges, 0) INTO v_service_charge FROM COURIER_SERVICE WHERE service_id = p_service_id;
    EXCEPTION
        WHEN NO_DATA_FOUND THEN
            v_service_charge := 50;
    END;
    p_final_charge := v_base_rate + v_service_charge + (p_weight_kg * v_weight_factor) + (p_distance_km * v_distance_factor);
END;`,
    fields: [
      { name: 'weightKg', label: 'Weight (kg)', type: 'number', default: 4.5 },
      { name: 'distanceKm', label: 'Distance (km)', type: 'number', default: 85.0 },
      { name: 'serviceId', label: 'Service ID', type: 'number', default: 301 }
    ]
  },
  {
    id: 'CALCULATE_DISCOUNT',
    name: 'Calculate Customer Discount',
    type: 'Stored Function (Return Value)',
    description: 'Calls an Oracle stored function that evaluates discount tiers (15% for >= ₹2000, 10% for >= ₹1000) and returns the discounted value.',
    plsqlSignature: 'FUNCTION CALCULATE_DISCOUNT(p_amount IN NUMBER) RETURN NUMBER',
    plsqlCode: `CREATE OR REPLACE FUNCTION CALCULATE_DISCOUNT(
    p_amount IN NUMBER
) RETURN NUMBER AS
    v_discount NUMBER := 0;
BEGIN
    IF p_amount >= 2000 THEN
        v_discount := ROUND(p_amount * 0.15, 2);
    ELSIF p_amount >= 1000 THEN
        v_discount := ROUND(p_amount * 0.10, 2);
    ELSIF p_amount >= 500 THEN
        v_discount := ROUND(p_amount * 0.05, 2);
    ELSE
        v_discount := 0;
    END IF;
    RETURN v_discount;
END;`,
    fields: [
      { name: 'amount', label: 'Order Amount (₹)', type: 'number', default: 2100.0 }
    ]
  },
  {
    id: 'PROCESS_DELIVERY_ATTEMPT',
    name: 'Process Delivery Attempt',
    type: 'Stored Procedure (Relational Insert)',
    description: 'Determines the next sequential attempt_no for a branch and records the courier delivery outcome with timestamp.',
    plsqlSignature: 'PROCEDURE PROCESS_DELIVERY_ATTEMPT(p_branch_id IN NUMBER, p_courier_id IN NUMBER, p_status IN VARCHAR2, p_remarks IN VARCHAR2, p_result OUT VARCHAR2)',
    plsqlCode: `CREATE OR REPLACE PROCEDURE PROCESS_DELIVERY_ATTEMPT(
    p_branch_id IN NUMBER,
    p_courier_id IN NUMBER,
    p_status IN VARCHAR2,
    p_remarks IN VARCHAR2,
    p_result OUT VARCHAR2
) AS
    v_next_attempt NUMBER;
BEGIN
    SELECT NVL(MAX(attempt_no), 0) + 1 INTO v_next_attempt 
    FROM DELIVERY_ATTEMPT WHERE branch_id = p_branch_id;
    
    INSERT INTO DELIVERY_ATTEMPT (branch_id, courier_id, attempt_no, attempt_time, status)
    VALUES (p_branch_id, p_courier_id, v_next_attempt, CURRENT_TIMESTAMP, p_status);
    
    COMMIT;
    p_result := 'Delivery attempt #' || v_next_attempt || ' recorded for branch ' || p_branch_id || ' with status: ' || p_status;
EXCEPTION
    WHEN OTHERS THEN
        ROLLBACK;
        p_result := 'Failed to record delivery attempt: ' || SQLERRM;
END;`,
    fields: [
      { name: 'branchId', label: 'Branch ID', type: 'number', default: 1 },
      { name: 'courierId', label: 'Courier ID', type: 'number', default: 101 },
      { name: 'status', label: 'Attempt Status', type: 'select', options: ['Delivered', 'Pending', 'Failed'], default: 'Delivered' },
      { name: 'remarks', label: 'Remarks', type: 'text', default: 'Handed over directly to recipient' }
    ]
  },
  {
    id: 'RECORD_PAYMENT_TXN',
    name: 'Record Payment with Transaction Control',
    type: 'Transaction Procedure (COMMIT / ROLLBACK)',
    description: 'Demonstrates ACID transactions: verifies order, inserts payment, populates subtype table (CASH/CARD/ONLINE), updates order status, and performs COMMIT.',
    plsqlSignature: 'PROCEDURE RECORD_PAYMENT_TXN(p_customer_id IN NUMBER, p_order_id IN NUMBER, p_amount IN NUMBER, p_mode IN VARCHAR2, p_result OUT VARCHAR2)',
    plsqlCode: `CREATE OR REPLACE PROCEDURE RECORD_PAYMENT_TXN(
    p_customer_id IN NUMBER,
    p_order_id IN NUMBER,
    p_amount IN NUMBER,
    p_mode IN VARCHAR2,
    p_result OUT VARCHAR2
) AS
    v_payment_id NUMBER;
    v_order_count NUMBER;
BEGIN
    SELECT COUNT(*) INTO v_order_count FROM ORDERS WHERE order_id = p_order_id;
    IF v_order_count = 0 THEN
        p_result := 'Error: Order ' || p_order_id || ' does not exist.';
        RETURN;
    END IF;
    SELECT NVL(MAX(payment_id), 5000) + 1 INTO v_payment_id FROM PAYMENT;
    INSERT INTO PAYMENT (payment_id, customer_id, order_id, amount, status)
    VALUES (v_payment_id, p_customer_id, p_order_id, p_amount, 'Paid');
    IF UPPER(p_mode) = 'CASH' THEN
        INSERT INTO CASH_MODE (payment_id) VALUES (v_payment_id);
    ELSIF UPPER(p_mode) = 'CARD' THEN
        INSERT INTO CARD_MODE (payment_id) VALUES (v_payment_id);
    ELSE
        INSERT INTO ONLINE_MODE (payment_id) VALUES (v_payment_id);
    END IF;
    UPDATE ORDERS SET status = 'Delivered' WHERE order_id = p_order_id;
    COMMIT;
    p_result := 'Transaction Committed: Payment #' || v_payment_id || ' of ₹' || p_amount || ' processed via ' || p_mode || '. Order marked Delivered.';
EXCEPTION
    WHEN OTHERS THEN
        ROLLBACK;
        p_result := 'Transaction Rolled Back: ' || SQLERRM;
END;`,
    fields: [
      { name: 'customerId', label: 'Customer ID', type: 'number', default: 1001 },
      { name: 'orderId', label: 'Order ID', type: 'number', default: 4005 },
      { name: 'amount', label: 'Amount (₹)', type: 'number', default: 1800.0 },
      { name: 'mode', label: 'Payment Mode', type: 'select', options: ['Cash', 'Card', 'Online'], default: 'Online' }
    ]
  },
  {
    id: 'DEMO_EXCEPTION_HANDLING',
    name: 'PL/SQL Exception Handling Demo',
    type: 'Exception Handling Procedure',
    description: 'Demonstrates handling of system NO_DATA_FOUND and custom user-defined exceptions with meaningful recovery messages.',
    plsqlSignature: 'PROCEDURE DEMO_EXCEPTION_HANDLING(p_customer_id IN NUMBER, p_order_id IN NUMBER, p_result OUT VARCHAR2)',
    plsqlCode: `CREATE OR REPLACE PROCEDURE DEMO_EXCEPTION_HANDLING(
    p_customer_id IN NUMBER,
    p_order_id IN NUMBER,
    p_result OUT VARCHAR2
) AS
    v_cust_name VARCHAR2(100);
    v_order_amount NUMBER;
    NEGATIVE_AMOUNT_EXC EXCEPTION;
BEGIN
    SELECT name INTO v_cust_name FROM CUSTOMER WHERE customer_id = p_customer_id;
    SELECT amount INTO v_order_amount FROM ORDERS WHERE order_id = p_order_id;
    IF v_order_amount < 0 THEN
        RAISE NEGATIVE_AMOUNT_EXC;
    END IF;
    p_result := 'Verification Passed: Customer [' || v_cust_name || '] has valid Order #' || p_order_id || ' with amount ₹' || v_order_amount;
EXCEPTION
    WHEN NO_DATA_FOUND THEN
        p_result := 'HANDLED EXCEPTION (NO_DATA_FOUND): Customer ID ' || p_customer_id || ' or Order ID ' || p_order_id || ' does not exist in database.';
    WHEN NEGATIVE_AMOUNT_EXC THEN
        p_result := 'HANDLED USER EXCEPTION (NEGATIVE_AMOUNT): Order amount cannot be negative.';
    WHEN OTHERS THEN
        p_result := 'HANDLED GENERAL EXCEPTION: ' || SQLERRM;
END;`,
    fields: [
      { name: 'customerId', label: 'Customer ID (Try 1001 or 9999 for missing)', type: 'number', default: 1001 },
      { name: 'orderId', label: 'Order ID (Try 4001 or 9999 for missing)', type: 'number', default: 4001 }
    ]
  },
  {
    id: 'GENERATE_BRANCH_REPORT',
    name: 'Generate Branch Staff Report (Explicit Cursor)',
    type: 'Cursor-Based Stored Procedure',
    description: 'Demonstrates explicit PL/SQL cursor iteration (OPEN, FETCH loop, %NOTFOUND, CLOSE) to assemble a formatted multi-line branch roster.',
    plsqlSignature: 'PROCEDURE GENERATE_BRANCH_REPORT(p_branch_id IN NUMBER, p_report OUT VARCHAR2)',
    plsqlCode: `CREATE OR REPLACE PROCEDURE GENERATE_BRANCH_REPORT(
    p_branch_id IN NUMBER,
    p_report OUT VARCHAR2
) AS
    v_branch_name VARCHAR2(100);
    v_city VARCHAR2(100);
    v_staff_line VARCHAR2(4000) := '';
    v_staff_count NUMBER := 0;
    CURSOR c_staff IS
        SELECT staff_id, name, role, department 
        FROM STAFF WHERE branch_id = p_branch_id ORDER BY staff_id;
    v_staff_rec c_staff%ROWTYPE;
BEGIN
    SELECT branch_name, city INTO v_branch_name, v_city FROM BRANCH WHERE branch_id = p_branch_id;
    v_staff_line := 'BRANCH REPORT: ' || v_branch_name || ' (' || v_city || ')' || CHR(10) || 'STAFF ROSTER (via PL/SQL Cursor):' || CHR(10);
    OPEN c_staff;
    LOOP
        FETCH c_staff INTO v_staff_rec;
        EXIT WHEN c_staff%NOTFOUND;
        v_staff_count := v_staff_count + 1;
        v_staff_line := v_staff_line || '  #' || v_staff_count || ' ID:' || v_staff_rec.staff_id || ' | ' || v_staff_rec.name || ' | ' || v_staff_rec.role || ' (' || v_staff_rec.department || ')' || CHR(10);
    END LOOP;
    CLOSE c_staff;
    IF v_staff_count = 0 THEN
        v_staff_line := v_staff_line || '  (No staff currently assigned)' || CHR(10);
    END IF;
    v_staff_line := v_staff_line || 'Total Staff Count: ' || v_staff_count;
    p_report := v_staff_line;
EXCEPTION
    WHEN NO_DATA_FOUND THEN
        p_report := 'Error: Branch ID ' || p_branch_id || ' does not exist.';
    WHEN OTHERS THEN
        IF c_staff%ISOPEN THEN CLOSE c_staff; END IF;
        p_report := 'Error generating branch report: ' || SQLERRM;
END;`,
    fields: [
      { name: 'branchId', label: 'Branch ID (1: Chennai, 2: Mumbai, 3: Bengaluru)', type: 'number', default: 1 }
    ]
  }
];

export default function PlsqlOperations({ go }) {
  const [operations] = useState(PREDEFINED_OPERATIONS);
  const [selectedOpId, setSelectedOpId] = useState(PREDEFINED_OPERATIONS[0].id);
  const [formValues, setFormValues] = useState({});
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Quick Runner for reference procedure
  const [quickCustId, setQuickCustId] = useState(1001);
  const [quickResult, setQuickResult] = useState(null);
  const [quickLoading, setQuickLoading] = useState(false);
  const [quickError, setQuickError] = useState(null);

  const handleQuickRun = async () => {
    if (!quickCustId) return;
    setQuickLoading(true);
    setQuickError(null);
    try {
      const data = await api.getCustomerOrderCount(quickCustId);
      setQuickResult(data);
    } catch (err) {
      setQuickError(err.message || 'Procedure execution failed.');
    } finally {
      setQuickLoading(false);
    }
  };

  const currentOp = operations.find((op) => op.id === selectedOpId) || operations[0];

  // Initialize form default values whenever selected operation changes
  useEffect(() => {
    const defaults = {};
    if (currentOp?.fields) {
      currentOp.fields.forEach((f) => {
        defaults[f.name] = f.default !== undefined ? f.default : '';
      });
    }
    setFormValues(defaults);
    setResult(null);
    setError(null);
  }, [selectedOpId]);

  const handleInputChange = (name, value) => {
    setFormValues((prev) => ({ ...prev, [name]: value }));
  };

  const handleExecute = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const payload = {
        operation: currentOp.id,
        ...formValues
      };
      const response = await api.executePlsql(payload);
      setResult(response);
    } catch (err) {
      setError(err.message || 'Failed to execute PL/SQL operation');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="content">
      <div className="tool-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <div>
          <span className="eyebrow">ORACLE PROCEDURE</span>
          <h2 style={{ fontSize: '24px', fontWeight: '800', color: 'var(--text-dark)', margin: 0 }}>PL/SQL Operations</h2>
          <p className="muted">
            Execute the customer order count procedure and interactive Oracle PL/SQL routines.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '8px' }}>
          <button className="back-btn" onClick={() => go && go('dashboard')}>
            ← Dashboard
          </button>
          <button className="secondary-btn" onClick={() => go && go('eerDiagram')}>
            🔗 Full EER
          </button>
          <button className="primary-btn" onClick={() => go && go('sqlEditor')}>
            💻 SQL Console
          </button>
        </div>
      </div>

      {/* Reference Featured Card: GET_CUSTOMER_ORDER_COUNT */}
      <div className="plsql-card">
        <h3>GET_CUSTOMER_ORDER_COUNT</h3>
        <p>Returns the total number of orders belonging to a customer from Oracle ORDERS table.</p>

        <div className="plsql-form">
          <input
            type="number"
            id="plsqlCustomerId"
            value={quickCustId}
            onChange={(e) => setQuickCustId(e.target.value)}
            placeholder="Customer ID e.g. 1001"
          />
          <button className="primary-btn" onClick={handleQuickRun} disabled={quickLoading}>
            {quickLoading ? 'Running...' : 'Run Procedure'}
          </button>
        </div>
      </div>

      {quickError && (
        <div style={{ background: '#fff0f0', border: '1px solid #fecaca', color: '#b91c1c', padding: '12px 16px', borderRadius: '8px', marginBottom: '18px', fontSize: '12px' }}>
          {quickError}
        </div>
      )}

      {quickResult && (
        <div id="plsqlResult" style={{ marginBottom: '24px' }}>
          <div className="dashboard-box" style={{ borderLeft: '4px solid var(--sidebar-green)', padding: '18px 22px' }}>
            <span className="eyebrow">PROCEDURE EXECUTION RESULT</span>
            <h2 style={{ margin: '4px 0 0', fontSize: '18px', color: 'var(--text-dark)' }}>
              Customer #{quickResult.customerId}
            </h2>
            <p style={{ color: 'var(--muted)', margin: '8px 0 0', fontSize: '12px' }}>Total Orders Recorded in Oracle DB:</p>
            <h1 style={{ color: 'var(--sidebar-dark)', margin: '4px 0 0', fontSize: '32px', fontWeight: '800' }}>
              {quickResult.totalOrders}
            </h1>
          </div>
        </div>
      )}

      {error && <AlertBanner type="error" message={error} onDismiss={() => setError(null)} />}

      <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: '20px', alignItems: 'start' }}>
        {/* Left: Operation Selector */}
        <section className="panel" style={{ padding: '0', overflow: 'hidden' }}>
          <div style={{ padding: '16px 18px', borderBottom: '1px solid #edf1ee' }}>
            <h2 style={{ fontSize: '13px', margin: 0, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#405148' }}>
              PL/SQL Routines
            </h2>
          </div>
          <div style={{ maxHeight: '620px', overflowY: 'auto' }}>
            {operations.map((op) => {
              const isSelected = op.id === selectedOpId;
              return (
                <div
                  key={op.id}
                  onClick={() => setSelectedOpId(op.id)}
                  style={{
                    padding: '14px 16px',
                    borderBottom: '1px solid #edf1ee',
                    cursor: 'pointer',
                    backgroundColor: isSelected ? '#edf7f1' : 'transparent',
                    borderLeft: isSelected ? '4px solid #287f55' : '4px solid transparent',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <div style={{ fontSize: '9px', fontWeight: 'bold', color: '#287f55', textTransform: 'uppercase', marginBottom: '4px' }}>
                    {op.type}
                  </div>
                  <div style={{ fontSize: '12px', fontWeight: isSelected ? 'bold' : '500', color: '#17251e', lineHeight: 1.3 }}>
                    {op.name}
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Right: Operation Detail, Form, & Results */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <section className="panel" style={{ padding: '24px' }}>
            <div style={{ marginBottom: '18px' }}>
              <span className="trend" style={{ marginBottom: '8px', display: 'inline-block' }}>
                {currentOp.type}
              </span>
              <h2 style={{ fontSize: '18px', margin: '4px 0 6px 0', color: '#17251e' }}>
                {currentOp.name}
              </h2>
              <p style={{ fontSize: '12px', color: '#75867e', margin: 0, lineHeight: 1.5 }}>
                {currentOp.description}
              </p>
            </div>

            {/* Signature Badge */}
            <div style={{ backgroundColor: '#f5f8f6', border: '1px solid #e2eae5', borderRadius: '8px', padding: '10px 14px', marginBottom: '20px' }}>
              <small style={{ display: 'block', color: '#788b81', fontSize: '9px', fontWeight: 'bold', textTransform: 'uppercase', marginBottom: '3px' }}>
                PL/SQL Signature
              </small>
              <code style={{ fontSize: '11px', color: '#1e6843', fontWeight: '600' }}>
                {currentOp.plsqlSignature}
              </code>
            </div>

            {/* Parameter Input Form */}
            <form onSubmit={handleExecute}>
              <div style={{ display: 'grid', gridTemplateColumns: currentOp.fields.length > 2 ? 'repeat(2, 1fr)' : '1fr', gap: '14px', marginBottom: '20px' }}>
                {currentOp.fields.map((f) => (
                  <div key={f.name}>
                    <label style={{ display: 'block', fontSize: '11px', fontWeight: '600', color: '#33473d', marginBottom: '6px' }}>
                      {f.label}
                    </label>
                    {f.type === 'select' ? (
                      <select
                        value={formValues[f.name] ?? ''}
                        onChange={(e) => handleInputChange(f.name, e.target.value)}
                        style={{
                          width: '100%',
                          padding: '9px 12px',
                          borderRadius: '8px',
                          border: '1px solid #dce5df',
                          fontSize: '12px',
                          background: '#fff'
                        }}
                      >
                        {f.options.map((opt) => (
                          <option key={opt} value={opt}>{opt}</option>
                        ))}
                      </select>
                    ) : (
                      <input
                        type={f.type}
                        step={f.type === 'number' ? 'any' : undefined}
                        value={formValues[f.name] ?? ''}
                        onChange={(e) => handleInputChange(f.name, e.target.value)}
                        required
                        style={{
                          width: '100%',
                          padding: '9px 12px',
                          borderRadius: '8px',
                          border: '1px solid #dce5df',
                          fontSize: '12px',
                          boxSizing: 'border-box'
                        }}
                      />
                    )}
                  </div>
                ))}
              </div>

              <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                <button
                  type="submit"
                  className="primary"
                  disabled={loading}
                  style={{
                    padding: '10px 22px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    fontWeight: 'bold',
                    opacity: loading ? 0.7 : 1
                  }}
                >
                  {loading ? 'Executing on Oracle...' : '⚡ Execute PL/SQL'}
                </button>
              </div>
            </form>

            {/* PL/SQL Source Code Accordion / Viewer */}
            <div style={{ marginTop: '24px' }}>
              <details style={{ background: '#10271e', borderRadius: '8px', overflow: 'hidden' }}>
                <summary style={{ padding: '10px 14px', color: '#a0c4b2', fontSize: '11px', fontWeight: 'bold', cursor: 'pointer', outline: 'none' }}>
                  ▸ View Stored PL/SQL Definition Code
                </summary>
                <pre style={{ margin: 0, padding: '14px 18px', color: '#e8f5ed', fontSize: '11px', lineHeight: '1.45', fontFamily: 'monospace', overflowX: 'auto', whiteSpace: 'pre-wrap', wordBreak: 'break-word', borderTop: '1px solid #234839' }}>
                  <code>{currentOp.plsqlCode}</code>
                </pre>
              </details>
            </div>
          </section>

          {/* Execution Result Box */}
          {result && (
            <section className="panel" style={{ borderLeft: '4px solid #287f55', padding: '22px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                <div>
                  <h3 style={{ margin: 0, fontSize: '15px', color: '#17251e' }}>Execution Outcome</h3>
                  <small style={{ color: '#75867e' }}>
                    Completed in {result.executionTimeMs} ms • Status: {result.status}
                  </small>
                </div>
                <span className="trend" style={{ backgroundColor: '#edf8f1', color: '#287f55', fontWeight: 'bold' }}>
                  ✓ Oracle PL/SQL Engine
                </span>
              </div>

              {/* Status Message */}
              <div style={{ backgroundColor: '#edf7f1', border: '1px solid #d2ecd9', borderRadius: '8px', padding: '12px 16px', marginBottom: '16px' }}>
                <strong style={{ display: 'block', fontSize: '11px', color: '#1f6e47', marginBottom: '4px', textTransform: 'uppercase' }}>
                  DBMS Output / Result
                </strong>
                <p style={{ margin: 0, fontSize: '13px', color: '#173626', fontWeight: '500', whiteSpace: 'pre-wrap' }}>
                  {result.message}
                </p>
              </div>

              {/* Returned Parameters Grid */}
              {result.result && Object.keys(result.result).length > 0 && (
                <div>
                  <h4 style={{ margin: '0 0 8px 0', fontSize: '11px', color: '#667b70', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Captured OUT Parameters &amp; Values:
                  </h4>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '10px' }}>
                    {Object.entries(result.result).map(([key, val]) => (
                      <div key={key} style={{ background: '#f5f8f6', padding: '10px 14px', borderRadius: '8px', border: '1px solid #e1e9e4' }}>
                        <span style={{ display: 'block', fontSize: '10px', color: '#7a8e83', textTransform: 'uppercase' }}>{key}</span>
                        <strong style={{ display: 'block', fontSize: '14px', color: '#1a3328', marginTop: '2px', wordBreak: 'break-word', whiteSpace: 'pre-wrap' }}>
                          {typeof val === 'number' ? (key.toLowerCase().includes('charge') || key.toLowerCase().includes('payable') || key.toLowerCase().includes('discount') ? `₹${val.toFixed(2)}` : val) : String(val)}
                        </strong>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </section>
          )}
        </div>
      </div>
    </main>
  );
}
