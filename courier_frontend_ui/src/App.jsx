import { useState, useEffect, useCallback } from 'react';
import api from './api';
import Sidebar from './components/Sidebar';
import Navbar from './components/Navbar';
import Dashboard from './pages/Dashboard';
import Customers from './pages/Customers';
import Couriers from './pages/Couriers';
import Branches from './pages/Branches';
import Staff from './pages/Staff';
import Services from './pages/Services';
import Orders from './pages/Orders';
import Payments from './pages/Payments';
import Parcels from './pages/Parcels';
import Tracking from './pages/Tracking';
import Vehicles from './pages/Vehicles';
import Delivery from './pages/Delivery';
import SqlQueries from './pages/SqlQueries';
import SqlEditor from './pages/SqlEditor';
import PlsqlOperations from './pages/PlsqlOperations';
import EerDiagram from './pages/EerDiagram';
import DatabaseSchema from './pages/DatabaseSchema';

const pages = {
  dashboard: ['Dashboard', Dashboard],
  customers: ['Customers', Customers],
  couriers: ['Couriers', Couriers],
  branches: ['Branches', Branches],
  staff: ['Staff', Staff],
  services: ['Courier Services', Services],
  orders: ['Orders', Orders],
  payments: ['Payments', Payments],
  parcels: ['Parcels', Parcels],
  tracking: ['Tracking Events', Tracking],
  vehicles: ['Vehicles', Vehicles],
  delivery: ['Delivery Attempts', Delivery],
  sqlQueries: ['SQL Catalog', SqlQueries],
  sqlEditor: ['SQL Console', SqlEditor],
  plsqlOps: ['PL/SQL', PlsqlOperations],
  eerDiagram: ['Full EER', EerDiagram],
  dbSchema: ['Database Schema', DatabaseSchema],
};

export default function App() {
  const [active, setActive] = useState('dashboard');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [backendConnected, setBackendConnected] = useState(null);
  const [title, Page] = pages[active] || pages['dashboard'];

  const toggleSidebar = () => setSidebarCollapsed((prev) => !prev);

  const checkConnection = useCallback(async () => {
    try {
      const stats = await api.getDashboardStats();
      setBackendConnected(stats?.connected !== false);
    } catch {
      setBackendConnected(false);
    }
  }, []);

  useEffect(() => {
    checkConnection();
    const interval = setInterval(checkConnection, 15000);
    return () => clearInterval(interval);
  }, [checkConnection]);

  return (
    <div className="app">
      <Sidebar
        active={active}
        onChange={setActive}
        collapsed={sidebarCollapsed}
        onToggle={toggleSidebar}
      />
      <div className={`workspace ${sidebarCollapsed ? 'collapsed' : ''}`}>
        <Navbar
          title={title}
          collapsed={sidebarCollapsed}
          onToggleSidebar={toggleSidebar}
          backendConnected={backendConnected}
          onRefreshConnection={checkConnection}
        />
        <Page go={setActive} backendConnected={backendConnected} />
      </div>
    </div>
  );
}
