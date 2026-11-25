import { useState, useEffect } from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { getAuth, clearAuth } from '../auth.js';
import { USE_MOCK } from '../api.js';

const NAV = [
  ['/', 'Dashboard', 'M3 12l9-8 9 8M5 10v10h5v-6h4v6h5V10'],
  ['/users', 'Users', 'M16 11a4 4 0 10-8 0 4 4 0 008 0zM4 21c0-4 4-6 8-6s8 2 8 6'],
  ['/transactions', 'Transactions', 'M7 4v14m0 0l-3-3m3 3l3-3M17 20V6m0 0l-3 3m3-3l3 3'],
  ['/trading', 'Orders & Positions', 'M4 19V9m6 10V5m6 14v-7m6 7H2'],
  ['/instruments', 'Instruments', 'M4 7h16M4 12h16M4 17h10'],
];
const TITLES = { '/': 'Dashboard', '/users': 'Users', '/transactions': 'Transactions', '/trading': 'Orders & Positions', '/instruments': 'Instruments' };

function Icon({ d }) {
  return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d={d} /></svg>;
}

export default function Layout() {
  const nav = useNavigate();
  const { pathname } = useLocation();
  const admin = getAuth()?.admin;
  const [dark, setDark] = useState(document.documentElement.dataset.theme === 'dark');
  const [menu, setMenu] = useState(false);

  useEffect(() => {
    document.documentElement.dataset.theme = dark ? 'dark' : 'light';
    try { localStorage.setItem('trevolt_admin_theme', dark ? 'dark' : 'light'); } catch { /* ignore */ }
  }, [dark]);
  useEffect(() => setMenu(false), [pathname]);

  const logout = () => { clearAuth(); nav('/login'); };

  return (
    <div className="shell">
      <aside className="sidebar">
        <div className="brand"><img src="/mark.svg" alt="" width="32" height="32" /><span>Trevolt Admin</span></div>
        <nav>
          {NAV.map(([to, label, d]) => (
            <NavLink key={to} to={to} end={to === '/'} className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}>
              <Icon d={d} /><span>{label}</span>
            </NavLink>
          ))}
        </nav>
        {USE_MOCK && <div className="mock-note">Mock data mode</div>}
      </aside>
      <div className="main">
        <header className="topbar">
          <h1>{TITLES[pathname] || 'Admin'}</h1>
          <div className="row">
            <button className="btn btn-ghost btn-sm" onClick={() => setDark(!dark)}>{dark ? 'Light theme' : 'Dark theme'}</button>
            <div className="user-menu">
              <button className="user-btn" onClick={() => setMenu(!menu)}>
                <span className="avatar">{(admin?.name || 'A')[0]}</span>
                <span className="user-name">{admin?.name || 'Admin'}</span>
              </button>
              {menu && (
                <div className="dropdown">
                  <div className="dropdown-info"><strong>{admin?.name}</strong><span className="muted">{admin?.email}</span></div>
                  <button className="dropdown-item" onClick={logout}>Log out</button>
                </div>
              )}
            </div>
          </div>
        </header>
        <main className="content"><Outlet /></main>
      </div>
    </div>
  );
}
