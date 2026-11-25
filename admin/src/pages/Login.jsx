import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api, USE_MOCK } from '../api.js';
import { setAuth } from '../auth.js';

export default function Login() {
  const nav = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setBusy(true); setError('');
    try {
      const { data } = await api.login(email, password);
      setAuth({ token: data.token, admin: data.admin });
      nav('/', { replace: true });
    } catch (err) {
      setError(err.message || 'Login failed');
    } finally { setBusy(false); }
  }

  return (
    <div className="login-wrap">
      <form className="card login-card" onSubmit={submit}>
        <div className="login-brand"><img src="/mark.svg" alt="" width="40" height="40" /><div><strong>Trevolt Admin</strong><span className="muted">Sign in to continue</span></div></div>
        <label className="field"><span>Email</span>
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="username" required autoFocus />
        </label>
        <label className="field"><span>Password</span>
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" required />
        </label>
        {error && <p className="form-error">{error}</p>}
        <button className="btn btn-primary btn-block" disabled={busy}>{busy ? 'Signing in...' : 'Sign in'}</button>
        {USE_MOCK && <p className="muted small center">Mock mode: any email and password works.</p>}
      </form>
    </div>
  );
}
