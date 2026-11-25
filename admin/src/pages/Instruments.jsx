import { useState } from 'react';
import { api } from '../api.js';
import { useLoad } from '../hooks.js';
import { num } from '../format.js';
import { Badge, Empty } from '../components/ui.jsx';

export default function Instruments() {
  const { data, loading, error } = useLoad(() => api.instruments(), []);
  if (!data) return <Empty loading={loading} error={error} />;
  return (
    <div className="card table-card">
      <div className="table-wrap"><table>
        <thead><tr><th>Symbol</th><th>Name</th><th className="r">Price</th><th>Spread (pips)</th><th>Max leverage</th><th className="r">Min lot</th><th>Status</th><th></th></tr></thead>
        <tbody>{data.map((i) => <Row key={i.id} ins={i} />)}</tbody>
      </table></div>
    </div>
  );
}

function Row({ ins }) {
  const [spread, setSpread] = useState(String(ins.spreadPips));
  const [lev, setLev] = useState(String(ins.maxLeverage));
  const [status, setStatus] = useState(ins.status);
  const [base, setBase] = useState({ spread: String(ins.spreadPips), lev: String(ins.maxLeverage), status: ins.status });
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState({ text: '', bad: false });
  const dirty = spread !== base.spread || lev !== base.lev || status !== base.status;

  async function save() {
    if (!(Number(spread) >= 0) || !(Number(lev) >= 1)) return setMsg({ text: 'Invalid value', bad: true });
    setBusy(true); setMsg({ text: '', bad: false });
    try {
      await api.updateInstrument(ins.id, { spreadPips: Number(spread), maxLeverage: Number(lev), status });
      setBase({ spread, lev, status }); setMsg({ text: 'Saved', bad: false });
    } catch (e) { setMsg({ text: e.message, bad: true }); }
    finally { setBusy(false); }
  }

  return (
    <tr>
      <td><strong>{ins.symbol}</strong></td><td className="muted">{ins.name}</td>
      <td className="r num">{num(ins.price, ins.price > 100 ? 2 : 4)}</td>
      <td><input className="cell-input" type="number" step="0.1" min="0" value={spread} onChange={(e) => setSpread(e.target.value)} /></td>
      <td><input className="cell-input" type="number" step="1" min="1" value={lev} onChange={(e) => setLev(e.target.value)} /></td>
      <td className="r num">{ins.minLot}</td>
      <td>
        <button className="switch-btn" onClick={() => setStatus(status === 'active' ? 'disabled' : 'active')} title="Toggle status">
          <span className={status === 'active' ? 'switch on' : 'switch'} /><Badge>{status}</Badge>
        </button>
      </td>
      <td className="r nowrap">
        {msg.text && <span className={msg.bad ? 'neg small' : 'pos small'}>{msg.text} </span>}
        <button className="btn btn-primary btn-sm" disabled={!dirty || busy} onClick={save}>Save</button>
      </td>
    </tr>
  );
}
