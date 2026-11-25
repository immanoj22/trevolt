import { mockRequest } from './mock/index.js';
import { getToken, clearAuth } from './auth.js';

const BASE = (import.meta.env.VITE_API_URL || 'http://localhost:5000/api').replace(/\/$/, '');
export const USE_MOCK = import.meta.env.VITE_USE_MOCK === 'true';

async function request(method, path, { query, body } = {}) {
  const q = Object.fromEntries(Object.entries(query || {}).filter(([, v]) => v !== '' && v != null));

  if (USE_MOCK) {
    await new Promise((r) => setTimeout(r, 120));
    return mockRequest(method, path, q, body);
  }

  const qs = new URLSearchParams(q).toString();
  const headers = { 'Content-Type': 'application/json' };
  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;

  let res;
  try {
    res = await fetch(`${BASE}/admin${path}${qs ? '?' + qs : ''}`, {
      method, headers, body: body ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new Error('Cannot reach the server. Check VITE_API_URL and that the API is running.');
  }
  const json = await res.json().catch(() => ({}));
  if (res.status === 401 && path !== '/login') {
    clearAuth();
    window.location.assign('/login');
    throw new Error('Session expired');
  }
  if (!res.ok || json.success === false) throw Object.assign(new Error(json.message || `Request failed (${res.status})`), { status: res.status });
  return json;
}

const get = (path, query) => request('GET', path, { query });
const patch = (path, body) => request('PATCH', path, { body });

export const api = {
  login: (email, password) => request('POST', '/login', { body: { email, password } }),
  stats: () => get('/stats'),
  users: (query) => get('/users', query),
  user: (id) => get(`/users/${id}`),
  updateUser: (id, body) => patch(`/users/${id}`, body),
  adjust: (id, amount, note) => request('POST', `/users/${id}/adjust`, { body: { amount, note } }),
  transactions: (query) => get('/transactions', query),
  processTransaction: (id, action, note) => patch(`/transactions/${id}`, { action, note }),
  orders: (query) => get('/orders', query),
  positions: (query) => get('/positions', query),
  instruments: () => get('/instruments'),
  updateInstrument: (id, body) => patch(`/instruments/${id}`, body),
};
