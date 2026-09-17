import { useState, useEffect } from 'react';
import api from '../api';
import AlertBanner from '../components/AlertBanner';

const PREDEFINED_QUERIES = [
  {
    key: 'customer-orders',
    title: 'Customer + Orders (2-Table Relational JOIN)',
    category: 'JOIN Operations',
    description: 'Demonstrates 1-to-Many relational join between Customer and Orders tables on customer_id.',
    sql: `SELECT c.customer_id, c.name AS customer_name, c.email, c.city, o.order_id, TO_CHAR(o.order_date, 'YYYY-MM-DD HH24:MI') AS order_date, o.status, o.amount\nFROM CUSTOMER c\nJOIN ORDERS o ON c.customer_id = o.customer_id\nORDER BY o.order_id DESC`
  },
  {
    key: 'customer-order-parcel',
    title: 'Customer + Order + Parcel + Courier (4-Table Multi-Join)',
    category: 'JOIN Operations',
    description: 'Performs a 4-table join connecting Customers, Orders, Parcels, and Courier partners for tracking shipment ownership.',
    sql: `SELECT c.name AS customer_name, o.order_id, o.status AS order_status, p.parcel_id, p.price, NVL(cr.name, 'Unassigned') AS courier_partner\nFROM CUSTOMER c\nJOIN ORDERS o ON c.customer_id = o.customer_id\nJOIN PARCEL p ON o.order_id = p.order_id\nLEFT JOIN COURIER cr ON p.courier_id = cr.courier_id\nORDER BY o.order_id DESC`
  },
  {
    key: 'pending-orders',
    title: 'Pending & Active Orders (Filtering & Ordering)',
    category: 'Selection & Filtering',
    description: 'Filters orders requiring delivery action (status in \'Pending\', \'In Transit\', \'Processing\').',
    sql: `SELECT order_id, customer_id, TO_CHAR(order_date, 'YYYY-MM-DD HH24:MI') AS order_date, status, amount\nFROM ORDERS\nWHERE status IN ('Pending', 'In Transit', 'Processing')\nORDER BY order_id ASC`
  },
  {
    key: 'customer-spending',
    title: 'Customer Spending & Frequency (GROUP BY & Aggregates)',
    category: 'Aggregation & GROUP BY',
    description: 'Demonstrates COUNT, SUM, and AVG aggregate functions grouped by customer record.',
    sql: `SELECT c.customer_id, c.name, COUNT(o.order_id) AS total_orders, NVL(SUM(o.amount), 0) AS total_spent, NVL(ROUND(AVG(o.amount), 2), 0) AS avg_order_val\nFROM CUSTOMER c\nLEFT JOIN ORDERS o ON c.customer_id = o.customer_id\nGROUP BY c.customer_id, c.name\nORDER BY total_spent DESC`
  },
  {
    key: 'high-value-customers',
    title: 'High-Value Customer Filter (HAVING Clause)',
    category: 'HAVING Filter',
    description: 'Filters grouped results using the HAVING clause for customers who have spent more than ₹1,000.',
    sql: `SELECT c.customer_id, c.name, COUNT(o.order_id) AS orders_placed, SUM(o.amount) AS total_spent\nFROM CUSTOMER c\nJOIN ORDERS o ON c.customer_id = o.customer_id\nGROUP BY c.customer_id, c.name\nHAVING SUM(o.amount) > 1000\nORDER BY total_spent DESC`
  },
  {
    key: 'above-avg-orders',
    title: 'Orders Exceeding Average Amount (Nested Subquery)',
    category: 'Subqueries',
    description: 'Demonstrates an uncorrelated subquery in the WHERE clause computing the overall average order value.',
    sql: `SELECT order_id, customer_id, status, amount, (SELECT ROUND(AVG(amount), 2) FROM ORDERS) AS overall_avg\nFROM ORDERS\nWHERE amount > (SELECT AVG(amount) FROM ORDERS)\nORDER BY amount DESC`
  },
  {
    key: 'active-customers-exist',
    title: 'Customers with Bookings (Correlated Subquery / EXISTS)',
    category: 'Subqueries',
    description: 'Uses the correlated EXISTS operator to identify customers who have placed at least one non-cancelled order.',
    sql: `SELECT c.customer_id, c.name, c.email, c.city\nFROM CUSTOMER c\nWHERE EXISTS (SELECT 1 FROM ORDERS o WHERE o.customer_id = c.customer_id AND o.status <> 'Cancelled')\nORDER BY c.customer_id`
  },
  {
    key: 'branch-statistics',
    title: 'Branch Resource Allocation (Multi-Join Aggregation)',
    category: 'Aggregation & GROUP BY',
    description: 'Aggregates total staff and services assigned per operational branch.',
    sql: `SELECT b.branch_id, b.branch_name, b.city, COUNT(DISTINCT s.staff_id) AS staff_count, COUNT(DISTINCT cs.service_id) AS services_count\nFROM BRANCH b\nLEFT JOIN STAFF s ON b.branch_id = s.branch_id\nLEFT JOIN COURIER_SERVICE cs ON b.branch_id = cs.branch_id\nGROUP BY b.branch_id, b.branch_name, b.city\nORDER BY b.branch_id`
  },
  {
    key: 'tracking-history',
    title: 'Audit Trail & Tracking Events (Chronological Join)',
    category: 'JOIN Operations',
    description: 'Fetches timeline of parcel tracking events joined with parcel pricing and order details.',
    sql: `SELECT te.event_id, te.parcel_id, te.event_type, TO_CHAR(te.event_time, 'YYYY-MM-DD HH24:MI') AS event_timestamp, p.order_id, p.price\nFROM TRACKING_EVENT te\nJOIN PARCEL p ON te.parcel_id = p.parcel_id\nORDER BY te.event_time DESC`
  },
  {
    key: 'payment-breakdown',
    title: 'Payment Mode Specialization (CASE & Subtype Joins)',
    category: 'Advanced Relational Queries',
    description: 'Demonstrates subtype mapping across PAYMENT, CASH_MODE, CARD_MODE, and ONLINE_MODE tables.',
    sql: `SELECT p.payment_id, p.customer_id, p.order_id, p.amount, p.status, CASE WHEN cm.payment_id IS NOT NULL THEN 'Cash Mode' WHEN crd.payment_id IS NOT NULL THEN 'Card Mode' WHEN onl.payment_id IS NOT NULL THEN 'Online Mode' ELSE 'Unspecified' END AS payment_channel\nFROM PAYMENT p\nLEFT JOIN CASH_MODE cm ON p.payment_id = cm.payment_id\nLEFT JOIN CARD_MODE crd ON p.payment_id = crd.payment_id\nLEFT JOIN ONLINE_MODE onl ON p.payment_id = onl.payment_id\nORDER BY p.payment_id DESC`
  },
  {
    key: 'view-customer-summary',
    title: 'Querying Oracle View: VW_CUSTOMER_ORDER_SUMMARY',
    category: 'Database Views',
    description: 'Demonstrates database view encapsulation by selecting pre-compiled aggregates from VW_CUSTOMER_ORDER_SUMMARY.',
    sql: `SELECT * FROM VW_CUSTOMER_ORDER_SUMMARY ORDER BY total_amount_spent DESC`
  },
  {
    key: 'view-active-tracking',
    title: 'Querying Oracle View: VW_ACTIVE_PARCEL_TRACKING',
    category: 'Database Views',
    description: 'Executes against the compiled Oracle View that joins parcel details with latest tracking event.',
    sql: `SELECT * FROM VW_ACTIVE_PARCEL_TRACKING ORDER BY parcel_id ASC`
  }
];

export default function SqlQueries() {
  const [queries, setQueries] = useState(PREDEFINED_QUERIES);
  const [selectedKey, setSelectedKey] = useState(PREDEFINED_QUERIES[0].key);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    // Try fetching live list from backend, fallback to PREDEFINED_QUERIES
    api.getSqlQueries()
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) {
          setQueries(data);
        }
      })
      .catch(() => {
        // Keep PREDEFINED_QUERIES if offline
      });
  }, []);

  const currentQuery = queries.find((q) => q.key === selectedKey) || queries[0];
  const categories = ['All', ...new Set(queries.map((q) => q.category))];

  const filteredQueries = selectedCategory === 'All'
    ? queries
    : queries.filter((q) => q.category === selectedCategory);

  const handleExecute = async () => {
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const data = await api.runSqlQuery(selectedKey);
      setResult(data);
    } catch (err) {
      setError(err.message || 'Failed to execute query');
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    if (currentQuery?.sql) {
      navigator.clipboard.writeText(currentQuery.sql);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <main className="content">
      <div className="pageHead">
        <div>
          <p className="eyebrow">DATABASE DEMONSTRATION</p>
          <h1>SQL Queries</h1>
          <p className="muted">
            Predefined Oracle SQL query catalog demonstrating Relational Joins, Aggregates, GROUP BY, HAVING, Subqueries &amp; Views.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            className="primary"
            onClick={() => go('sqlEditor')}
            style={{ fontSize: '12px', padding: '9px 16px', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
          >
            ⚡ Open SQL Editor &rarr;
          </button>
        </div>
      </div>

      <AlertBanner type="info" message="All queries run against Oracle Database (FREEPDB1) via Spring Boot JDBC. No arbitrary client injection is permitted." />

      {error && <AlertBanner type="error" message={error} onDismiss={() => setError(null)} />}

      <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: '20px', alignItems: 'start' }}>
        {/* Left Side: Query Selector List */}
        <section className="panel" style={{ padding: '0', overflow: 'hidden' }}>
          <div style={{ padding: '16px 18px', borderBottom: '1px solid #edf1ee' }}>
            <h2 style={{ fontSize: '13px', margin: '0 0 10px 0', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#405148' }}>
              Query Categories
            </h2>
            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  style={{
                    border: '1px solid #dce5df',
                    borderRadius: '16px',
                    padding: '4px 10px',
                    fontSize: '10px',
                    cursor: 'pointer',
                    background: selectedCategory === cat ? '#287f55' : '#fff',
                    color: selectedCategory === cat ? '#fff' : '#60746a',
                    fontWeight: selectedCategory === cat ? 'bold' : 'normal'
                  }}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          <div style={{ maxHeight: '600px', overflowY: 'auto' }}>
            {filteredQueries.map((q) => {
              const isSelected = q.key === selectedKey;
              return (
                <div
                  key={q.key}
                  onClick={() => {
                    setSelectedKey(q.key);
                    setResult(null);
                    setError(null);
                  }}
                  style={{
                    padding: '14px 16px',
                    borderBottom: '1px solid #edf1ee',
                    cursor: 'pointer',
                    backgroundColor: isSelected ? '#edf7f1' : 'transparent',
                    borderLeft: isSelected ? '4px solid #287f55' : '4px solid transparent',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                    <span style={{ fontSize: '9px', fontWeight: 'bold', color: '#287f55', textTransform: 'uppercase' }}>
                      {q.category}
                    </span>
                  </div>
                  <div style={{ fontSize: '12px', fontWeight: isSelected ? 'bold' : '500', color: '#17251e', lineHeight: 1.3 }}>
                    {q.title}
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Right Side: Query Details & Execution */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <section className="panel" style={{ padding: '22px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '14px' }}>
              <div>
                <span className="trend" style={{ marginBottom: '8px', display: 'inline-block' }}>
                  {currentQuery?.category}
                </span>
                <h2 style={{ fontSize: '18px', margin: '4px 0 6px 0', color: '#17251e' }}>
                  {currentQuery?.title}
                </h2>
                <p style={{ fontSize: '12px', color: '#75867e', margin: 0 }}>
                  {currentQuery?.description}
                </p>
              </div>

              <button
                className="primary"
                onClick={handleExecute}
                disabled={loading}
                style={{
                  padding: '10px 20px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  fontWeight: '600',
                  opacity: loading ? 0.7 : 1
                }}
              >
                {loading ? 'Executing...' : '▶ Run Query'}
              </button>
            </div>

            {/* SQL Code Block */}
            <div style={{ position: 'relative', marginTop: '16px' }}>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  backgroundColor: '#162e24',
                  padding: '8px 14px',
                  borderTopLeftRadius: '8px',
                  borderTopRightRadius: '8px',
                  borderBottom: '1px solid #234839'
                }}
              >
                <span style={{ color: '#a0c4b2', fontSize: '10px', fontWeight: 'bold', letterSpacing: '0.08em' }}>
                  ORACLE SQL STATEMENT
                </span>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <button
                    onClick={() => go('sqlEditor')}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#68d391',
                      fontSize: '11px',
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}
                  >
                    Open in Editor ↗
                  </button>
                  <button
                    onClick={handleCopy}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#c1dfcf',
                      fontSize: '11px',
                      cursor: 'pointer'
                    }}
                  >
                    {copied ? '✓ Copied!' : 'Copy SQL'}
                  </button>
                </div>
              </div>
              <pre
                style={{
                  margin: 0,
                  padding: '16px',
                  backgroundColor: '#10271e',
                  color: '#e8f5ed',
                  fontSize: '12px',
                  lineHeight: '1.5',
                  fontFamily: 'Consolas, Monaco, "Courier New", monospace',
                  borderBottomLeftRadius: '8px',
                  borderBottomRightRadius: '8px',
                  overflowX: 'auto',
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-word'
                }}
              >
                <code>{currentQuery?.sql}</code>
              </pre>
            </div>
          </section>

          {/* Results Table */}
          {result && (
            <section className="panel" style={{ overflow: 'hidden' }}>
              <div className="panelHead">
                <div>
                  <h2>Query Execution Results</h2>
                  <p>
                    {result.rowCount} row(s) returned in {result.executionTimeMs} ms from Oracle Database
                  </p>
                </div>
                <span
                  style={{
                    backgroundColor: '#edf8f1',
                    color: '#287f55',
                    fontSize: '11px',
                    padding: '4px 10px',
                    borderRadius: '12px',
                    fontWeight: 'bold'
                  }}
                >
                  ✓ Oracle FREEPDB1
                </span>
              </div>

              {result.rows && result.rows.length > 0 ? (
                <div className="tableScroll" style={{ maxHeight: '420px' }}>
                  <table>
                    <thead>
                      <tr>
                        {result.columns.map((col) => (
                          <th key={col}>{col.toUpperCase()}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {result.rows.map((row, idx) => (
                        <tr key={idx}>
                          {result.columns.map((col) => {
                            const val = row[col];
                            return (
                              <td key={col}>
                                {val === null || val === undefined ? (
                                  <em style={{ color: '#9aa8a0', fontSize: '11.5px' }}>NULL</em>
                                ) : col.toLowerCase().endsWith('id') ? (
                                  <code style={{ fontWeight: 700, color: '#1f5f3e', background: '#eef6f0', padding: '2px 6px', borderRadius: '4px', fontSize: '12px' }}>
                                    {String(val)}
                                  </code>
                                ) : (
                                  String(val)
                                )}
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div style={{ padding: '36px', textAlign: 'center', color: '#829189', fontSize: '12px' }}>
                  Query executed successfully, but returned 0 rows.
                </div>
              )}
            </section>
          )}
        </div>
      </div>
    </main>
  );
}
