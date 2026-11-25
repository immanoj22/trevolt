import React from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App.jsx';
import './styles.css';
import { USE_MOCK } from './api.js';
import { getToken, setAuth } from './auth.js';

try {
  document.documentElement.dataset.theme = localStorage.getItem('trevolt_admin_theme') === 'dark' ? 'dark' : 'light';
} catch { /* ignore */ }

// Mock mode: skip login on every route except /login itself.
if (USE_MOCK && !getToken() && location.pathname !== '/login') {
  setAuth({ token: 'mock-token', admin: { id: 'adm_1', email: 'admin@trevolt.demo', name: 'Demo Admin' } });
}

createRoot(document.getElementById('root')).render(
  <React.StrictMode><BrowserRouter><App /></BrowserRouter></React.StrictMode>
);
