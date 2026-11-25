const KEY = 'trevolt_admin_auth';

export function getAuth() {
  try { return JSON.parse(localStorage.getItem(KEY)); } catch { return null; }
}
export function getToken() { return getAuth()?.token || null; }
export function setAuth(v) { try { localStorage.setItem(KEY, JSON.stringify(v)); } catch { /* storage unavailable */ } }
export function clearAuth() { try { localStorage.removeItem(KEY); } catch { /* ignore */ } }
