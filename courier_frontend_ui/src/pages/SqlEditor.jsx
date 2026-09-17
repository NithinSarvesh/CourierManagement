import { useState } from 'react';
import api from '../api';

const SAMPLE_QUERIES = [
  {
    label: 'All Orders Delivered',
    sql: `SELECT * FROM ORDERS WHERE status = 'Delivered';`,
  },
  {
    label: 'Customer + Orders JOIN',
    sql: `SELECT c.customer_id, c.name, o.order_id, o.status, o.amount\nFROM CUSTOMER c\nJOIN ORDERS o ON c.customer_id = o.customer_id\nORDER BY o.order_id DESC;`,
  },
  {
    label: 'Customer Spending (GROUP BY)',
    sql: `SELECT c.customer_id, c.name, COUNT(o.order_id) AS total_orders, NVL(SUM(o.amount), 0) AS total_spent\nFROM CUSTOMER c\nLEFT JOIN ORDERS o ON c.customer_id = o.customer_id\nGROUP BY c.customer_id, c.name\nORDER BY total_spent DESC;`,
  },
  {
    label: 'High-Value Customers (HAVING)',
    sql: `SELECT c.name, COUNT(o.order_id) AS orders_count, SUM(o.amount) AS total_spent\nFROM CUSTOMER c\nJOIN ORDERS o ON c.customer_id = o.customer_id\nGROUP BY c.name\nHAVING SUM(o.amount) > 1000;`,
  },
  {
    label: 'Orders Above Average (Subquery)',
    sql: `SELECT order_id, customer_id, status, amount\nFROM ORDERS\nWHERE amount > (SELECT AVG(amount) FROM ORDERS)\nORDER BY amount DESC;`,
  },
  {
    label: '4-Table Multi-Join',
    sql: `SELECT o.order_id, c.name AS customer_name, p.parcel_id, p.price, cr.name AS courier_name, s.name AS staff_name\nFROM ORDERS o\nJOIN CUSTOMER c ON o.customer_id = c.customer_id\nJOIN PARCEL p ON o.order_id = p.order_id\nLEFT JOIN COURIER cr ON p.courier_id = cr.courier_id\nLEFT JOIN STAFF s ON p.staff_id = s.staff_id;`,
  },
  {
    label: 'Query Oracle View: VW_CUSTOMER_ORDER_SUMMARY',
    sql: `SELECT * FROM VW_CUSTOMER_ORDER_SUMMARY;`,
  },
];

export default function SqlEditor({ go }) {
  const [sql, setSql] = useState("SELECT *\nFROM ORDERS\nWHERE status = 'Delivered';");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);

  const handleExecuteSQL = async () => {
    const query = sql.trim();
    if (!query) {
      setErrorMsg('Please enter an SQL query to execute.');
      return;
    }

    setLoading(true);
    setErrorMsg(null);
    setResult(null);

    try {
      const data = await api.executeSql(query);
      if (data.status === 'ERROR') {
        setErrorMsg(data.message || 'Oracle database execution failed.');
        setResult(data);
      } else {
        setResult(data);
      }
    } catch (err) {
      setErrorMsg(err.message || 'Failed to connect to backend SQL runner.');
      setResult({
        status: 'ERROR',
        message: err.message,
        executionTimeMs: 0,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleClear = () => {
    setSql('');
    setResult(null);
    setErrorMsg(null);
  };

  const handleFormat = () => {
    let formatted = sql;
    const keywords = [
      'SELECT', 'FROM', 'WHERE', 'LEFT JOIN', 'RIGHT JOIN', 'INNER JOIN', 'JOIN',
      'ON', 'GROUP BY', 'HAVING', 'ORDER BY', 'INSERT INTO', 'VALUES', 'UPDATE',
      'SET', 'DELETE FROM', 'AS', 'AND', 'OR', 'NOT', 'IN', 'EXISTS', 'LIKE',
      'IS NULL', 'IS NOT NULL', 'COUNT', 'SUM', 'AVG', 'MIN', 'MAX', 'ROUND',
      'NVL', 'TO_CHAR', 'DISTINCT', 'UNION', 'LIMIT', 'OFFSET'
    ];

    keywords.forEach((kw) => {
      const regex = new RegExp(`\\b${kw}\\b`, 'gi');
      formatted = formatted.replace(regex, kw);
    });
    setSql(formatted);
  };

  return (
    <main className="content">
      {/* Header */}
      <div className="tool-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <div>
          <span className="eyebrow">DATABASE TOOL</span>
          <h2 style={{ fontSize: '24px', fontWeight: '800', color: 'var(--text-dark)', margin: 0 }}>SQL Console</h2>
          <p className="muted">Execute SELECT, INSERT, UPDATE, DELETE and JOIN queries against Oracle FREEPDB1.</p>
        </div>

        <div style={{ display: 'flex', gap: '8px' }}>
          <button className="back-btn" onClick={() => go && go('dashboard')}>
            ← Dashboard
          </button>
          <button className="secondary-btn" onClick={() => go && go('eerDiagram')}>
            🔗 Full EER
          </button>
          <button className="secondary-btn" onClick={() => go && go('dbSchema')}>
            🗄️ Database Schema
          </button>
        </div>
      </div>

      {/* SQL Editor Box */}
      <div className="sql-box">
        <label style={{ display: 'block', fontSize: '11px', fontWeight: '700', color: 'var(--muted)', marginBottom: '8px' }}>
          SQL STATEMENT (Press Ctrl + Enter to Run):
        </label>

        <textarea
          id="sqlInput"
          value={sql}
          onChange={(e) => setSql(e.target.value)}
          placeholder={`Example:\nSELECT * FROM ORDERS WHERE status = 'Delivered';`}
          onKeyDown={(e) => {
            if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
              handleExecuteSQL();
            }
          }}
        />

        <div className="sql-actions">
          <button className="secondary-btn" onClick={handleFormat} title="Auto-uppercase SQL keywords">
            Format SQL
          </button>
          <button className="secondary-btn" onClick={handleClear}>
            Clear
          </button>
          <button className="primary-btn" onClick={handleExecuteSQL} disabled={loading}>
            {loading ? 'Executing...' : 'Execute SQL'}
          </button>
        </div>

        {/* Quick Example Chips */}
        <div style={{ marginTop: '16px', paddingTop: '14px', borderTop: '1px solid var(--border)' }}>
          <span style={{ fontSize: '10px', fontWeight: '800', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            Quick Examples:
          </span>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '8px' }}>
            {SAMPLE_QUERIES.map((q, idx) => (
              <button
                key={idx}
                className="filterBtn"
                onClick={() => setSql(q.sql)}
                style={{ fontSize: '10px', padding: '4px 9px', borderRadius: '6px' }}
                title={q.sql}
              >
                {q.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Execution Results Section */}
      {errorMsg && (
        <div
          style={{
            background: '#fff0f0',
            border: '1px solid #fecaca',
            color: '#b91c1c',
            borderRadius: '9px',
            padding: '14px 18px',
            marginBottom: '18px',
            fontSize: '12px',
          }}
        >
          <b style={{ display: 'block', marginBottom: '4px' }}>⚠️ Oracle SQL Execution Error</b>
          <span>{errorMsg}</span>
        </div>
      )}

      {result && result.status === 'SUCCESS' && (
        <div className="sql-result">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', flexWrap: 'wrap', gap: '8px' }}>
            <div>
              <h3 style={{ fontSize: '15px', fontWeight: '800', color: 'var(--text-dark)', margin: 0 }}>
                Query Result
              </h3>
              <p className="muted" style={{ margin: '2px 0 0', fontSize: '11px' }}>
                {result.rowCount} row(s) returned in {result.executionTimeMs} ms
              </p>
            </div>

            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <span
                style={{
                  background: '#eaf7ef',
                  color: '#2c895c',
                  border: '1px solid #b7ebd0',
                  borderRadius: '16px',
                  padding: '3px 10px',
                  fontSize: '10px',
                  fontWeight: '700',
                }}
              >
                ● SUCCESS
              </span>
              <span style={{ fontSize: '11px', color: 'var(--muted)' }}>
                Time: <b>{result.executionTimeMs} ms</b>
              </span>
            </div>
          </div>

          {/* Dynamic Columns & Rows Table */}
          {result.rows && result.rows.length > 0 ? (
            <div className="table-container" style={{ maxHeight: '480px', overflowY: 'auto' }}>
              <table className="data-table">
                <thead>
                  <tr>
                    {result.columns && result.columns.map((col, idx) => (
                      <th key={idx}>{col}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {result.rows.map((row, rIdx) => (
                    <tr key={rIdx}>
                      {result.columns.map((col, cIdx) => {
                        const val = row[col];
                        let renderedVal;
                        if (val === null || val === undefined) {
                          renderedVal = <em style={{ color: '#9aa8a0', fontSize: '11.5px' }}>NULL</em>;
                        } else if (typeof val === 'object') {
                          if (val.bytes) {
                            renderedVal = <span style={{ color: '#556960', fontSize: '12px' }}>Timestamp</span>;
                          } else {
                            try {
                              renderedVal = JSON.stringify(val);
                            } catch {
                              renderedVal = String(val);
                            }
                          }
                        } else if (col.toLowerCase().endsWith('id')) {
                          renderedVal = (
                            <code style={{ fontWeight: 700, color: '#1f5f3e', background: '#eef6f0', padding: '2px 6px', borderRadius: '4px', fontSize: '12px' }}>
                              {String(val)}
                            </code>
                          );
                        } else {
                          renderedVal = String(val);
                        }

                        return (
                          <td key={cIdx}>
                            {renderedVal}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p style={{ color: 'var(--muted)', fontSize: '12px', padding: '16px 0' }}>
              Query executed successfully, but returned 0 rows.
            </p>
          )}
        </div>
      )}
    </main>
  );
}
