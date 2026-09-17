export default function StatusBadge({children}){
 const s=String(children||'').toLowerCase();
 let cls=s.includes('deliver')||s.includes('paid')||s.includes('active')?'success':s.includes('transit')||s.includes('pending')||s.includes('processing')?'warning':s.includes('cancel')||s.includes('failed')?'danger':'neutral';
 return <span className={'badge '+cls}><i/> {children}</span>
}