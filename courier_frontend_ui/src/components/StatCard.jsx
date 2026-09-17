export default function StatCard({icon,label,value,change}){
 return <div className="stat"><div className="statTop"><div className="statIcon">{icon}</div><span className="trend">↗ {change}</span></div><small>{label}</small><strong>{value}</strong><div className="statLine"/></div>
}