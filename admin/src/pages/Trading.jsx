import { useState } from 'react';
import { api } from '../api.js';
import { useLoad } from '../hooks.js';
import { money, num, date } from '../format.js';
import { Badge, Pager, Empty, Tabs, Pnl } from '../components/ui.jsx';

const LIMIT = 15;

export default function Trading() {
  const [tab, setTab] = useState('orders');
  const [symbol, setSymbol] = useState('');
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const isOrders = tab === 'orders';
  const { data, total, loading, error } = useLoad(
    () => (isOrders ? api.orders({ symbol, status, page, limit: LIMIT }) : api.positions({ symbol, page, limit: LIMIT })),
    [tab, symbol, status, page]);
  const { data: instruments } = useLoad(() => api.instruments(), []);
  const symbols = instruments ? instruments.map((i) => i.symbol) : [];

  return (
    <>
      <div className="toolbar">
        <Tabs tabs={[['orders', 'Orders'], ['positions', 'Positions']]} value={tab} onChange={(v) => { setTab(v); setPage(1); }} />
        <select value={symbol} onChange={(e) => { setSymbol(e.target.value); setPage(1); }}>
          <option value="">All symbols</option>{symbols.map((s) => <option key={s}>{s}</option>)}
        </select>
        {isOrders && (
          <select value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }}>
            <option value="">All statuses</option><option value="open">Open</option><option value="filled">Filled</option><option value="cancelled">Cancelled</option>
          </select>
        )}
      </div>
      <div className="card table-card">
        {data?.length ? (
          <div className="table-wrap">
            {isOrders ? (
              <table>
                <thead><tr><th>ID</th><th>User</th><th>Symbol</th><th>Side</th><th>Type</th><th className="r">Quantity</th><th className="r">Price</th><th className="r">Filled</th><th>Status</th><th>Created</th></tr></thead>
                <tbody>{data.map((o) => (
                  <tr key={o.id}><td className="mono">{o.id}</td><td>{o.userEmail}</td><td><strong>{o.symbol}</strong></td><td><Badge>{o.side}</Badge></td><td>{o.type}</td>
                    <td className="r num">{num(o.quantity)}</td><td className="r num">{num(o.price, o.price > 100 ? 2 : 4)}</td><td className="r num">{num(o.filledQuantity)}</td>
                    <td><Badge>{o.status}</Badge></td><td className="muted nowrap">{date(o.createdAt)}</td></tr>
                ))}</tbody>
              </table>
            ) : (
              <table>
                <thead><tr><th>ID</th><th>User</th><th>Symbol</th><th>Side</th><th className="r">Size</th><th className="r">Entry</th><th className="r">Mark</th><th className="r">P&amp;L</th><th className="r">Margin</th><th>Opened</th></tr></thead>
                <tbody>{data.map((p) => (
                  <tr key={p.id}><td className="mono">{p.id}</td><td>{p.userEmail}</td><td><strong>{p.symbol}</strong></td><td><Badge>{p.side}</Badge></td>
                    <td className="r num">{num(p.size)}</td><td className="r num">{num(p.entryPrice, p.entryPrice > 100 ? 2 : 4)}</td><td className="r num">{num(p.markPrice, p.markPrice > 100 ? 2 : 4)}</td>
                    <td className="r num"><Pnl value={p.pnl}>{money(p.pnl)}</Pnl></td><td className="r num">{money(p.margin)}</td><td className="muted nowrap">{date(p.openedAt)}</td></tr>
                ))}</tbody>
              </table>
            )}
          </div>
        ) : <Empty loading={loading} error={error}>Nothing found for these filters.</Empty>}
        <Pager page={page} total={total} limit={LIMIT} onPage={setPage} />
      </div>
    </>
  );
}
