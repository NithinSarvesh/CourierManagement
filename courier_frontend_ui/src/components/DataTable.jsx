import { useState } from 'react';
import StatusBadge from './StatusBadge';

export default function DataTable({
  columns,
  rows = [],
  searchable = true,
  searchPlaceholder = 'Search records...',
  onView,
  onEdit,
  onDelete,
  searchTerm: externalSearch,
  onSearchChange: externalSearchChange
}) {
  const [internalSearch, setInternalSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  const searchQuery = externalSearch !== undefined ? externalSearch : internalSearch;
  const handleSearchChange = (val) => {
    if (externalSearchChange) externalSearchChange(val);
    else setInternalSearch(val);
    setCurrentPage(1);
  };

  const filteredRows = (rows || []).filter((row) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return columns.some((col) => {
      const val = row[col.key];
      return val !== undefined && val !== null && String(val).toLowerCase().includes(q);
    });
  });

  const totalPages = Math.max(1, Math.ceil(filteredRows.length / pageSize));
  const validPage = Math.min(currentPage, totalPages);
  const startIdx = (validPage - 1) * pageSize;
  const pageRows = filteredRows.slice(startIdx, startIdx + pageSize);

  const renderCell = (v, key) => {
    if (v === null || v === undefined) return <span style={{ color: '#a0aca4' }}>—</span>;
    if (key.toLowerCase().includes('status')) return <StatusBadge>{String(v)}</StatusBadge>;
    if (typeof v === 'number' && key.toLowerCase().includes('amount')) {
      return <strong style={{ color: '#1a3328' }}>₹{Number(v).toLocaleString('en-IN')}</strong>;
    }
    if (typeof v === 'number' && key.toLowerCase().includes('price')) {
      return <strong style={{ color: '#1a3328' }}>₹{Number(v).toLocaleString('en-IN')}</strong>;
    }
    if (typeof v === 'number' && key.toLowerCase().includes('charge')) {
      return <strong style={{ color: '#1a3328' }}>₹{Number(v).toLocaleString('en-IN')}</strong>;
    }
    if (key.toLowerCase().endsWith('id') || key === 'vehicleNo') {
      return (
        <code style={{
          fontWeight: 700,
          color: '#245a3c',
          backgroundColor: '#eef6f0',
          padding: '2px 7px',
          borderRadius: '5px',
          fontSize: '12px'
        }}>
          {String(v)}
        </code>
      );
    }
    return String(v);
  };

  const hasActions = Boolean(onView || onEdit || onDelete);

  return (
    <div className="tablePanel">
      {searchable && (
        <div className="tableTools">
          <div className="searchBox">
            <span style={{ fontSize: '14px', color: '#7a8e83', userSelect: 'none' }}>🔎</span>
            <input
              placeholder={searchPlaceholder}
              value={searchQuery}
              onChange={(e) => handleSearchChange(e.target.value)}
            />
            {searchQuery && (
              <button
                onClick={() => handleSearchChange('')}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#9aa8a0',
                  cursor: 'pointer',
                  fontSize: '15px',
                  lineHeight: 1,
                  padding: '2px 4px'
                }}
                title="Clear search"
              >
                ×
              </button>
            )}
          </div>
          {searchQuery && (
            <button
              className="filterBtn"
              onClick={() => handleSearchChange('')}
            >
              Reset Filters
            </button>
          )}
        </div>
      )}

      <div className="tableScroll">
        <table>
          <thead>
            <tr>
              {columns.map((c) => (
                <th key={c.key}>{c.label}</th>
              ))}
              {hasActions && <th style={{ textAlign: 'right' }}>ACTIONS</th>}
            </tr>
          </thead>
          <tbody>
            {pageRows.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length + (hasActions ? 1 : 0)}
                  style={{ textAlign: 'center', padding: '48px 16px', color: '#7a8e83' }}
                >
                  <div style={{ fontSize: '28px', marginBottom: '8px' }}>📂</div>
                  <strong style={{ display: 'block', fontSize: '14px', color: '#33473d' }}>
                    No matching records found
                  </strong>
                  <span style={{ fontSize: '12px' }}>
                    Try refining your search term or clearing the filter.
                  </span>
                </td>
              </tr>
            ) : (
              pageRows.map((r, i) => (
                <tr key={r.id || r[columns[0].key] || i}>
                  {columns.map((c) => (
                    <td key={c.key}>{renderCell(r[c.key], c.key)}</td>
                  ))}
                  {hasActions && (
                    <td style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>
                      {onView && (
                        <button
                          className="table-btn-view"
                          onClick={() => onView(r)}
                          title="View Record Details"
                        >
                          View
                        </button>
                      )}
                      {onEdit && (
                        <button
                          className="table-btn-edit"
                          onClick={() => onEdit(r)}
                          title="Edit Record"
                        >
                          Edit
                        </button>
                      )}
                      {onDelete && (
                        <button
                          className="table-btn-delete"
                          onClick={() => onDelete(r)}
                          title="Delete Record"
                        >
                          Delete
                        </button>
                      )}
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="tableFoot">
        <span>
          Showing <b>{filteredRows.length === 0 ? 0 : startIdx + 1}</b>–
          <b>{Math.min(startIdx + pageSize, filteredRows.length)}</b> of <b>{filteredRows.length}</b> records
          {searchQuery && ` (filtered from ${rows.length} total)`}
        </span>
        <div>
          <button
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={validPage <= 1}
            title="Previous page"
          >
            ‹
          </button>
          <button className="page">{validPage}</button>
          <button
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            disabled={validPage >= totalPages}
            title="Next page"
          >
            ›
          </button>
        </div>
      </div>
    </div>
  );
}