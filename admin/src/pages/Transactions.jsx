import { useState } from 'react';
import { api } from '../api.js';
import { useLoad } from '../hooks.js';
import { money, date } from '../format.js';
import { Badge, Pager, Empty, Tabs, Confirm } from '../components/ui.jsx';

const LIMIT = 15;

export default function Transactions() {
  const [type, setType] = useState('deposit');
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const [pending, setPending] = useState(null); // { tx, action }
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const { data, total, loading, error, reload } = useLoad(
    () => api.transactions({ type, status, page, limit: LIMIT }), [type, status, page]);

  async function confirm() {
    setBusy(true); setErr('');
    try { await api.processTransaction(pending.tx.id, pending.action); setPending(null); reload(); }
    catch (e) { setErr(e.message); }
    finally { setBusy(false); }
  }
  const verb = pending?.action === 'approve' ? 'Approve' : 'Reject';

  return (
    <>
      <div className="toolbar">
        <Tabs tabs={[['deposit', 'Deposits'], ['withdrawal', 'Withdrawals']]} value={type} onChange={(v) => { setType(v); setPage(1); }} />
        <select value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }}>
          <option value="">All statuses</option><option value="pending">Pending</option><option value="approved">Approved</option><option value="rejected">Rejected</option>
        </select>
      </div>
      <div className="card table-card">
        {data?.length ? (
          <div className="table-wrap"><table>
            <thead><tr><th>ID</th><th>User</th><th>Method</th><th>Reference</th><th className="r">Amount</th><th>Status</th><th>Requested</th><th>Processed</th><th></th></tr></thead>
            <tbody>
              {data.map((t) => (
                <tr key={t.id}>
                  <td className="mono">{t.id}</td><td>{t.userEmail}</td><td>{t.method}</td><td className="mono muted">{t.reference}</td>
                  <td className="r num">{money(t.amount)} <span className="muted">{t.currency}</span></td>
                  <td><Badge>{t.status}</Badge></td>
                  <td className="muted nowrap">{date(t.createdAt)}</td><td className="muted nowrap">{date(t.processedAt)}</td>
                  <td className="r nowrap">
                    {t.status === 'pending' && <>
                      <button className="btn btn-primary btn-sm" onClick={() => { setErr(''); setPending({ tx: t, action: 'approve' }); }}>Approve</button>{' '}
                      <button className="btn btn-ghost btn-sm" onClick={() => { setErr(''); setPending({ tx: t, action: 'reject' }); }}>Reject</button>
                    </>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table></div>
        ) : <Empty loading={loading} error={error}>No {type}s found.</Empty>}
        <Pager page={page} total={total} limit={LIMIT} onPage={setPage} />
      </div>
      {pending && (
        <Confirm title={`${verb} ${pending.tx.type}`} confirmLabel={verb} danger={pending.action === 'reject'} busy={busy} error={err}
          message={`${verb} the ${pending.tx.type} of ${money(pending.tx.amount)} from ${pending.tx.userEmail}? ${
            pending.action === 'approve' ? (pending.tx.type === 'deposit' ? 'The amount will be credited to the user.' : 'The withdrawal will be finalised.')
              : (pending.tx.type === 'withdrawal' ? 'The reserved amount will be returned to the user.' : 'No funds will be credited.')}`}
          onConfirm={confirm} onCancel={() => setPending(null)} />
      )}
    </>
  );
}
