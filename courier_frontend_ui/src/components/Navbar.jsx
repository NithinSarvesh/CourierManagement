export default function Navbar({
  title,
  onToggleSidebar,
  collapsed,
  backendConnected,
  onRefreshConnection,
}) {
  const isOffline = backendConnected === false;
  const isConnecting = backendConnected === null;

  return (
    <header className="navbar">
      <button
        className="navbarToggle"
        onClick={onToggleSidebar}
        title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        aria-label="Toggle navigation sidebar"
      >
        ☰
      </button>

      <div>
        <h1 style={{ fontSize: '18px', fontWeight: '800', color: 'var(--text-dark)', margin: 0 }}>
          {title}
        </h1>
        <p style={{ color: 'var(--muted)', fontSize: '11px', margin: '2px 0 0' }}>
          Courier &amp; Parcel Tracking System &bull; Oracle FREEPDB1
        </p>
      </div>

      <div className="header-search" style={{ marginLeft: '24px' }}>
        <input
          id="globalSearch"
          type="text"
          placeholder="🔎 Search across entities..."
          readOnly
          style={{ cursor: 'default' }}
          title="Use search bar on individual entity pages"
        />
      </div>

      <div
        className={`status ${isOffline ? 'offline' : ''}`}
        style={{
          marginLeft: 'auto',
          cursor: onRefreshConnection ? 'pointer' : 'default',
          transition: 'all 0.2s ease',
        }}
        onClick={onRefreshConnection}
        title={
          isOffline
            ? 'Backend or Oracle DB is unreachable. Click to retry connection.'
            : isConnecting
            ? 'Testing backend connection...'
            : 'Connected to Spring Boot & Oracle FREEPDB1. Click to refresh status.'
        }
      >
        <span className={`status-dot ${isOffline ? 'offline' : ''}`}></span>
        {isConnecting ? 'Connecting...' : isOffline ? 'Backend Offline' : 'Backend Connected'}
      </div>
    </header>
  );
}