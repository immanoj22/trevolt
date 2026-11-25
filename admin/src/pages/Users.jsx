import { useState } from 'react';
import { api } from '../api.js';
import { useLoad, useDebounced } from '../hooks.js';
import { money, num, date } from '../format.js';
import { Badge, Pager, Empty, Modal, Pnl } from '../components/ui.jsx';

const LIMIT = 15;

export default function Users() {
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [kyc, setKyc] = useState('');
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState(null);
  const q = useDebounced(search);
  const { data, total, loading, error, reload } = useLoad(
    () => api.users({ search: q, status, kyc, page, limit: LIMIT }), [q, status, kyc, page]);

  const set = (fn) => (e) => { fn(e.target.value); setPage(1); };

  return (
    <>
      <div className="toolbar">
        <input className="search" placeholder="Search name, email or account ID" value={search} onChange={set(setSearch)} />
        <select value={status} onChange={set(setStatus)}>
          <option value="">All statuses</option><option value="active">Active</option><option value="blocked">Blocked</option>
        </select>
        <select value={kyc} onChange={set(setKyc)}>
          <option value="">All KYC</option><option value="pending">KYC pending</option><option value="approved">KYC approved</option><option value="rejected">KYC rejected</option>
        </select>
      </div>
      <div className="card table-card">
        {data?.length ? (
          <div className="table-wrap">
            <table>
              <thead><tr><th>Account</th><th>Name</th><th>Email</th><th>KYC</th><th>Status</th><th className="r">Balance</th><th>Joined</th><th>Last login</th></tr></thead>
              <tbody>
                {data.map((u) => (
                  <tr key={u.id} className="click" onClick={() => setSelected(u.id)}>
                    <td className="mono">{u.accountId}</td><td>{u.name}</td><td className="muted">{u.email}</td>
                    <td><Badge>{u.kycStatus}</Badge></td><td><Badge>{u.status}</Badge></td>
                    <td className="r num">{money(u.balanceUSD)}</td><td className="muted nowrap">{date(u.createdAt)}</td><td className="muted nowrap">{date(u.lastLoginAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : <Empty loading={loading} error={error}>No users match these filters.</Empty>}
        <Pager page={page} total={total} limit={LIMIT} onPage={setPage} />
      </div>
      {selected && <UserPanel id={selected} onClose={() => setSelected(null)} onChanged={reload} />}
    </>
  );
}

function UserPanel({ id, onClose, onChanged }) {
  const { data: u, loading, error, reload } = useLoad(() => api.user(id), [id]);
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [msg, setMsg] = useState({ text: '', bad: false });
  const [busy, setBusy] = useState(false);

  async function run(fn, ok) {
    setBusy(true); setMsg({ text: '', bad: false });
    try { await fn(); setMsg({ text: ok, bad: false }); reload(); onChanged(); return true; }
    catch (e) { setMsg({ text: e.message, bad: true }); return false; }
    finally { setBusy(false); }
  }
  const patch = (body, ok) => run(() => api.updateUser(id, body), ok);
  async function adjust(e) {
    e.preventDefault();
    const n = Number(amount);
    if (!n) return setMsg({ text: 'Enter a non-zero amount.', bad: true });
    if (!note.trim()) return setMsg({ text: 'A note is required.', bad: true });
    if (await run(() => api.adjust(id, n, note.trim()), 'Balance updated.')) { setAmount(''); setNote(''); }
  }

  return (
    <Modal side title={u ? u.name : 'User'} onClose={onClose}>
      {!u ? <Empty loading={loading} error={error} /> : (
        <>
          <div className="detail-grid">
            <div><span className="muted">Account</span><strong className="mono">{u.accountId}</strong></div>
            <div><span className="muted">Email</span><strong>{u.email}</strong></div>
            <div><span className="muted">Balance</span><strong className="num">{money(u.balanceUSD)}</strong></div>
            <div><span className="muted">Status</span><Badge>{u.status}</Badge></div>
            <div><span className="muted">KYC</span><Badge>{u.kycStatus}</Badge></div>
            <div><span className="muted">Last login</span><strong>{date(u.lastLoginAt)}</strong></div>
          </div>

          <div className="actions">
            {u.kycStatus !== 'approved' && <button className="btn btn-primary btn-sm" disabled={busy} onClick={() => patch({ kycStatus: 'approved' }, 'KYC approved.')}>Approve KYC</button>}
            {u.kycStatus !== 'rejected' && <button className="btn btn-ghost btn-sm" disabled={busy} onClick={() => patch({ kycStatus: 'rejected' }, 'KYC rejected.')}>Reject KYC</button>}
            {u.status === 'active'
              ? <button className="btn btn-danger btn-sm" disabled={busy} onClick={() => patch({ status: 'blocked' }, 'User blocked.')}>Block user</button>
              : <button className="btn btn-ghost btn-sm" disabled={busy} onClick={() => patch({ status: 'active' }, 'User unblocked.')}>Unblock user</button>}
          </div>

          <form className="adjust" onSubmit={adjust}>
            <h4>Adjust balance</h4>
            <div className="row">
              <input type="number" step="0.01" placeholder="Amount, e.g. -50" value={amount} onChange={(e) => setAmount(e.target.value)} />
              <input className="grow" placeholder="Note (required)" value={note} onChange={(e) => setNote(e.target.value)} />
              <button className="btn btn-primary btn-sm" disabled={busy}>Apply</button>
            </div>
          </form>
          {msg.text && <p className={msg.bad ? 'form-error' : 'form-ok'}>{msg.text}</p>}

          <h4>Open positions</h4>
          <MiniTable rows={u.positions} empty="No open positions."
            head={['Symbol', 'Side', 'Size', 'P&L']}
            row={(p) => [p.symbol, <Badge>{p.side}</Badge>, num(p.size), <Pnl value={p.pnl}>{money(p.pnl)}</Pnl>]} />
          <h4>Recent orders</h4>
          <MiniTable rows={u.recentOrders} empty="No orders."
            head={['Symbol', 'Side', 'Qty', 'Status']}
            row={(o) => [o.symbol, <Badge>{o.side}</Badge>, num(o.quantity), <Badge>{o.status}</Badge>]} />
          <h4>Transactions</h4>
          <MiniTable rows={u.transactions} empty="No transactions."
            head={['Type', 'Amount', 'Status', 'Date']}
            row={(t) => [<Badge>{t.type}</Badge>, money(t.amount), <Badge>{t.status}</Badge>, date(t.createdAt)]} />
        </>
      )}
    </Modal>
  );
}

function MiniTable({ rows, head, row, empty }) {
  if (!rows?.length) return <p className="muted small">{empty}</p>;
  return (
    <div className="table-wrap mini"><table>
      <thead><tr>{head.map((h) => <th key={h}>{h}</th>)}</tr></thead>
      <tbody>{rows.map((r) => <tr key={r.id}>{row(r).map((c, i) => <td key={i} className={i === head.length - 1 && head[i] !== 'Date' && head[i] !== 'Status' ? 'num' : ''}>{c}</td>)}</tr>)}</tbody>
    </table></div>
  );
}
