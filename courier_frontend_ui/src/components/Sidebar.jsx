const navGroups = [
  {
    title: null,
    items: [
      ['dashboard', '🏠', 'Dashboard'],
    ],
  },
  {
    title: 'PEOPLE',
    items: [
      ['customers', '👥', 'Customers'],
      ['staff', '🧑‍💼', 'Staff'],
      ['couriers', '🚚', 'Couriers'],
    ],
  },
  {
    title: 'OPERATIONS',
    items: [
      ['branches', '🏢', 'Branches'],
      ['services', '🛠️', 'Courier Services'],
      ['vehicles', '🚐', 'Vehicles'],
      ['delivery', '🔄', 'Delivery Attempts'],
    ],
  },
  {
    title: 'DELIVERY',
    items: [
      ['orders', '📋', 'Orders'],
      ['parcels', '📦', 'Parcels'],
      ['tracking', '📍', 'Tracking Events'],
    ],
  },
  {
    title: 'PAYMENTS',
    items: [
      ['payments', '💳', 'Payments'],
    ],
  },
  {
    title: 'DATABASE',
    items: [
      ['eerDiagram', '🔗', 'Full EER'],
      ['dbSchema', '🗄️', 'Database Schema'],
      ['sqlEditor', '🧮', 'SQL Console'],
      ['plsqlOps', '⚙️', 'PL/SQL'],
      ['sqlQueries', '📋', 'SQL Catalog'],
    ],
  },
];

export default function Sidebar({ active, onChange, collapsed, onToggle }) {
  return (
    <aside className={`sidebar ${collapsed ? 'collapsed' : ''}`}>
      <div className="logo" onClick={() => onChange('dashboard')}>
        <span>📦</span>
        {!collapsed && <h2>CourierX</h2>}
        <button
          className="sidebarToggle"
          onClick={(e) => {
            e.stopPropagation();
            onToggle();
          }}
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          aria-label="Toggle sidebar"
        >
          {collapsed ? '›' : '☰'}
        </button>
      </div>

      {navGroups.map((group, gIdx) => (
        <div key={gIdx}>
          {group.title && !collapsed && (
            <div className="nav-title">{group.title}</div>
          )}
          {group.title && collapsed && (
            <div style={{ height: '1px', background: 'rgba(255,255,255,0.12)', margin: '8px 4px' }} />
          )}

          <nav>
            {group.items.map(([id, icon, label]) => {
              const isActive = active === id;
              return (
                <button
                  key={id}
                  className={`nav-btn ${isActive ? 'active' : ''}`}
                  onClick={() => onChange(id)}
                  title={label}
                >
                  <span className="icon">{icon}</span>
                  {!collapsed && <span>{label}</span>}
                </button>
              );
            })}
          </nav>
        </div>
      ))}

      {/* Footer */}
      <div className="sideFooter">
        <div className="avatar" title="System Administrator">A</div>
        {!collapsed && (
          <div>
            <b>Oracle DBA</b>
            <small>COURIER_APP</small>
          </div>
        )}
      </div>
    </aside>
  );
}