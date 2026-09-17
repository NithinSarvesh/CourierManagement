export default function AlertBanner({ type = 'info', message, onDismiss }) {
  if (!message) return null;

  const styles = {
    success: {
      bg: '#eaf7ef',
      color: '#1e6843',
      border: '#c3e8d2',
      icon: '✓',
    },
    error: {
      bg: '#fdf2f2',
      color: '#991b1b',
      border: '#fecaca',
      icon: '⚠',
    },
    warning: {
      bg: '#fffbeb',
      color: '#92400e',
      border: '#fde68a',
      icon: 'ℹ',
    },
    info: {
      bg: '#eff6ff',
      color: '#1e40af',
      border: '#bfdbfe',
      icon: '🛈',
    }
  }[type] || {
    bg: '#f3f4f6',
    color: '#1f2937',
    border: '#e5e7eb',
    icon: 'ℹ'
  };

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '12px 18px',
        borderRadius: '9px',
        backgroundColor: styles.bg,
        color: styles.color,
        border: `1px solid ${styles.border}`,
        marginBottom: '18px',
        fontSize: '12px',
        lineHeight: '1.4',
        boxShadow: '0 2px 6px rgba(0,0,0,0.03)'
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <span style={{ fontWeight: 'bold', fontSize: '14px' }}>{styles.icon}</span>
        <span>{message}</span>
      </div>
      {onDismiss && (
        <button
          onClick={onDismiss}
          style={{
            background: 'none',
            border: 'none',
            color: styles.color,
            cursor: 'pointer',
            fontSize: '16px',
            padding: '0 4px',
            fontWeight: 'bold',
            lineHeight: 1
          }}
          title="Dismiss"
        >
          ×
        </button>
      )}
    </div>
  );
}
