export default function Modal({ isOpen, title, onClose, children }) {
  if (!isOpen) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(16, 39, 30, 0.45)',
        backdropFilter: 'blur(3px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        padding: '20px'
      }}
      onClick={onClose}
    >
      <div
        style={{
          backgroundColor: '#fff',
          borderRadius: '14px',
          width: '100%',
          maxWidth: '520px',
          boxShadow: '0 20px 40px rgba(0,0,0,0.18)',
          border: '1px solid #e1e9e4',
          overflow: 'hidden',
          animation: 'fadeIn 0.15s ease-out'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          style={{
            padding: '16px 22px',
            borderBottom: '1px solid #edf1ee',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}
        >
          <h3 style={{ margin: 0, fontSize: '16px', color: '#17251e' }}>{title}</h3>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              color: '#89968f',
              fontSize: '20px',
              cursor: 'pointer',
              padding: '2px 6px',
              lineHeight: 1
            }}
          >
            ×
          </button>
        </div>
        <div style={{ padding: '22px' }}>
          {children}
        </div>
      </div>
    </div>
  );
}
