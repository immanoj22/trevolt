import { api } from '../api.js';
import { useLoad } from '../hooks.js';
import { money, int, ago } from '../format.js';
import { Empty, Badge } from '../components/ui.jsx';

export default function Dashboard() {
  const { data: s, loading, error } = useLoad(() => api.stats(), []);
  if (!s) return <Empty loading={loading} error={error} />;

  const cards = [
    ['Users', int(s.users)],
    ['New users (7d)', int(s.newUsers7d)],
    ['KYC pending', int(s.kycPending), s.kycPending > 0],
    ['Pending deposits', int(s.depositsPending), s.depositsPending > 0],
    ['Pending withdrawals', int(s.withdrawalsPending), s.withdrawalsPending > 0],
    ['Open orders', int(s.openOrders)],
    ['Open positions', int(s.openPositions)],
    ['Total balance', money(s.totalBalanceUSD)],
    ['24h volume', money(s.volume24hUSD)],
  ];
  return (
    <>
      <div className="stat-grid">
        {cards.map(([label, value, warn]) => (
          <div className="card stat" key={label}>
            <span className="muted">{label}</span>
            <strong className={warn ? 'num warn' : 'num'}>{value}</strong>
          </div>
        ))}
      </div>
      <div className="card">
        <div className="card-head"><h2>Recent activity</h2></div>
        {s.recent?.length ? (
          <ul className="activity">
            {s.recent.map((r, i) => (
              <li key={i}>
                <Badge tone="blue">{r.type === "kyc" ? "KYC" : r.type}</Badge>
                <span className="grow">{r.text}</span>
                <span className="muted nowrap">{ago(r.at)}</span>
              </li>
            ))}
          </ul>
        ) : <Empty>No recent activity.</Empty>}
      </div>
    </>
  );
}
