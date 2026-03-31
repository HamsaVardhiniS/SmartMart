import { BrowserRouter, Routes, Route, NavLink } from 'react-router-dom';
import { LayoutDashboard, ShoppingCart, Package, Users, Truck, BarChart3, Settings } from 'lucide-react';
import './App.css';
import Overview from './pages/Overview';
import POS from './pages/POS';
import Inventory from './pages/Inventory';

import HR from './pages/HR';
import Procurement from './pages/Procurement';
import Analytics from './pages/Analytics';
import Admin from './pages/Admin';

function App() {
  return (
    <BrowserRouter>
      <div className="app-container">
        <aside className="sidebar">
          <h2><div className="gradient-text">SmartMart</div></h2>
          
          <nav style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <NavLink to="/" className={({isActive}) => `nav-item hover-lift ${isActive ? 'active' : ''}`}>
              <LayoutDashboard size={20} /> Dashboard
            </NavLink>
            <NavLink to="/pos" className={({isActive}) => `nav-item hover-lift ${isActive ? 'active' : ''}`}>
              <ShoppingCart size={20} /> Point of Sale
            </NavLink>
            <NavLink to="/inventory" className={({isActive}) => `nav-item hover-lift ${isActive ? 'active' : ''}`}>
              <Package size={20} /> Inventory
            </NavLink>
            <NavLink to="/hr" className={({isActive}) => `nav-item hover-lift ${isActive ? 'active' : ''}`}>
              <Users size={20} /> HR Status
            </NavLink>
            <NavLink to="/procurement" className={({isActive}) => `nav-item hover-lift ${isActive ? 'active' : ''}`}>
              <Truck size={20} /> Procurement
            </NavLink>
            <NavLink to="/analytics" className={({isActive}) => `nav-item hover-lift ${isActive ? 'active' : ''}`}>
              <BarChart3 size={20} /> Analytics
            </NavLink>
            <NavLink to="/admin" className={({isActive}) => `nav-item hover-lift ${isActive ? 'active' : ''}`}>
              <Settings size={20} /> Admin
            </NavLink>
          </nav>
        </aside>

        <main className="main-content">
          <Routes>
            <Route path="/" element={<Overview />} />
            <Route path="/pos" element={<POS />} />
            <Route path="/inventory" element={<Inventory />} />
            <Route path="/hr" element={<HR />} />
            <Route path="/procurement" element={<Procurement />} />
            <Route path="/analytics" element={<Analytics />} />
            <Route path="/admin" element={<Admin />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}

export default App;
