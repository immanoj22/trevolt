// Dev-only fake backend. Used by api.js when VITE_USE_MOCK=true.
// Returns the same shapes as the real API (see docs/admin-api.md). State lives in memory.

const names = ['Amelia Hart', 'Noah Fischer', 'Priya Nair', 'Lucas Moreau', 'Sofia Rossi', 'Daniel Okafor', 'Mei Tanaka', 'Oliver Grant', 'Isabela Duarte', 'Karim Haddad', 'Hannah Weber', 'Arjun Mehta', 'Elena Petrova', 'Jonas Lindqvist', 'Chloe Martin', 'Tomas Novak', 'Aisha Rahman', 'Mateo Silva', 'Freya Olsen', 'Victor Lang', 'Grace Kim', 'Rafael Ortiz', 'Nina Kowalski', 'Samuel Bright'];
const kycs = ['approved', 'approved', 'approved', 'pending', 'rejected', 'pending'];
const day = 86400000;
const now = Date.now();
const iso = (ms) => new Date(ms).toISOString();

const instruments = [
  ['EURUSD', 'Euro / US Dollar', 1.0842, 0.8, 500],
  ['GBPUSD', 'British Pound / US Dollar', 1.2715, 1.1, 500],
  ['USDJPY', 'US Dollar / Japanese Yen', 151.32, 1.0, 500],
  ['AUDUSD', 'Australian Dollar / US Dollar', 0.6587, 1.2, 400],
  ['USDCAD', 'US Dollar / Canadian Dollar', 1.3641, 1.4, 400],
  ['USDCHF', 'US Dollar / Swiss Franc', 0.8812, 1.5, 400],
  ['XAUUSD', 'Gold / US Dollar', 2345.6, 25, 200],
  ['US30', 'Dow Jones 30', 38920.5, 200, 100],
  ['NAS100', 'Nasdaq 100', 17850.2, 150, 100],
].map(([symbol, name, price, spreadPips, maxLeverage], i) => ({
  id: 'ins_' + (i + 1), symbol, name, price, spreadPips, maxLeverage, minLot: 0.01, status: i === 5 ? 'disabled' : 'active',
}));

const users = names.map((name, i) => ({
  id: 'usr_' + (i + 1),
  accountId: 'TV' + (100230 + i * 17),
  email: name.toLowerCase().replace(/[^a-z ]/g, '').replace(' ', '.') + '@example.com',
  name,
  kycStatus: kycs[i % kycs.length],
  status: i === 6 || i === 15 ? 'blocked' : 'active',
  balanceUSD: Math.round((200 + ((i * 7919) % 48000)) * 100) / 100,
  createdAt: iso(now - (i * 3 + 1) * day),
  lastLoginAt: iso(now - ((i * 5) % 40) * 3600000),
}));
const byId = (id) => users.find((u) => u.id === id);

const orders = Array.from({ length: 48 }, (_, i) => {
  const u = users[(i * 5) % users.length];
  const ins = instruments[i % instruments.length];
  const status = ['open', 'filled', 'filled', 'cancelled'][i % 4];
  const qty = [0.1, 0.25, 0.5, 1, 2][i % 5];
  return {
    id: 'ord_' + (5000 + i), userId: u.id, userEmail: u.email, symbol: ins.symbol,
    side: i % 3 ? 'buy' : 'sell', type: i % 4 === 0 ? 'limit' : 'market', quantity: qty,
    price: +(ins.price * (1 + ((i % 7) - 3) / 2000)).toFixed(ins.price > 100 ? 2 : 4),
    filledQuantity: status === 'filled' ? qty : 0, status, createdAt: iso(now - i * 2.3 * 3600000),
  };
});

const positions = Array.from({ length: 26 }, (_, i) => {
  const u = users[(i * 3) % users.length];
  const ins = instruments[(i * 2) % instruments.length];
  const dec = ins.price > 100 ? 2 : 4;
  const entry = +(ins.price * (1 - ((i % 5) - 2) / 1500)).toFixed(dec);
  const size = [0.1, 0.3, 0.5, 1][i % 4];
  const side = i % 2 ? 'sell' : 'buy';
  const diff = (ins.price - entry) * (side === 'buy' ? 1 : -1);
  return {
    id: 'pos_' + (900 + i), userId: u.id, userEmail: u.email, symbol: ins.symbol, side, size,
    entryPrice: entry, markPrice: ins.price, pnl: +(diff * size * (ins.price > 100 ? 10 : 100000)).toFixed(2),
    margin: +(size * 100000 * (ins.price > 100 ? 0.8 : 1) * 0.002 + 40).toFixed(2), openedAt: iso(now - i * 5.1 * 3600000),
  };
});

const txs = Array.from({ length: 40 }, (_, i) => {
  const u = users[(i * 7) % users.length];
  const type = i % 3 === 2 ? 'withdrawal' : 'deposit';
  const status = i < 8 ? 'pending' : i % 5 === 0 ? 'rejected' : 'approved';
  const method = ['Card', 'Bank transfer', 'USDT (TRC20)', 'Skrill'][i % 4];
  return {
    id: 'txn_' + (7000 + i), type, userId: u.id, userEmail: u.email,
    amount: [250, 500, 1200, 3000, 150, 800, 5000][i % 7], currency: 'USD', method,
    reference: 'REF' + (880100 + i * 13), status, createdAt: iso(now - i * 7 * 3600000),
    processedAt: status === 'pending' ? null : iso(now - i * 7 * 3600000 + 2400000),
  };
});

const page = (list, q) => {
  const p = Math.max(1, +q.page || 1), l = +q.limit || 20;
  return { data: list.slice((p - 1) * l, p * l), total: list.length };
};
const fail = (message, status = 400) => Object.assign(new Error(message), { status });

export function mockRequest(method, path, query = {}, body = {}) {
  let m;
  if (path === '/login') return { data: { token: 'mock-token', admin: { id: 'adm_1', email: body.email || 'admin@trevolt.demo', name: 'Demo Admin' } } };
  if (path === '/stats') {
    return { data: {
      users: users.length, newUsers7d: users.filter((u) => now - Date.parse(u.createdAt) < 7 * day).length,
      kycPending: users.filter((u) => u.kycStatus === 'pending').length,
      depositsPending: txs.filter((t) => t.type === 'deposit' && t.status === 'pending').length,
      withdrawalsPending: txs.filter((t) => t.type === 'withdrawal' && t.status === 'pending').length,
      openOrders: orders.filter((o) => o.status === 'open').length, openPositions: positions.length,
      totalBalanceUSD: users.reduce((s, u) => s + u.balanceUSD, 0), volume24hUSD: 1847320.55,
      recent: [
        { type: 'deposit', text: 'Amelia Hart requested a deposit of $500.00', at: iso(now - 600000) },
        { type: 'kyc', text: 'Priya Nair submitted KYC documents', at: iso(now - 2400000) },
        { type: 'withdrawal', text: 'Lucas Moreau requested a withdrawal of $1,200.00', at: iso(now - 5400000) },
        { type: 'user', text: 'New account TV100502 registered', at: iso(now - 9000000) },
        { type: 'order', text: 'Mei Tanaka opened a SELL 0.50 XAUUSD position', at: iso(now - 14400000) },
        { type: 'deposit', text: 'Deposit of $3,000.00 approved for Oliver Grant', at: iso(now - 21600000) },
        { type: 'user', text: 'Tomas Novak was blocked by an admin', at: iso(now - 40000000) },
      ] } };
  }
  if (path === '/users' && method === 'GET') {
    const s = (query.search || '').toLowerCase();
    return page(users.filter((u) => (!s || (u.email + u.name + u.accountId).toLowerCase().includes(s))
      && (!query.status || u.status === query.status) && (!query.kyc || u.kycStatus === query.kyc)), query);
  }
  if ((m = path.match(/^\/users\/([^/]+)\/adjust$/))) {
    const u = byId(m[1]); if (!u) throw fail('User not found', 404);
    if (!body.amount || !body.note) throw fail('Amount and note are required');
    u.balanceUSD = Math.round((u.balanceUSD + Number(body.amount)) * 100) / 100;
    return { data: { balanceUSD: u.balanceUSD } };
  }
  if ((m = path.match(/^\/users\/([^/]+)$/))) {
    const u = byId(m[1]); if (!u) throw fail('User not found', 404);
    if (method === 'PATCH') { Object.assign(u, body); return { data: u }; }
    return { data: { ...u,
      positions: positions.filter((p) => p.userId === u.id),
      recentOrders: orders.filter((o) => o.userId === u.id).slice(0, 8),
      transactions: txs.filter((t) => t.userId === u.id).slice(0, 8) } };
  }
  if (path === '/transactions') {
    return page(txs.filter((t) => (!query.type || t.type === query.type) && (!query.status || t.status === query.status)), query);
  }
  if ((m = path.match(/^\/transactions\/([^/]+)$/))) {
    const t = txs.find((x) => x.id === m[1]); if (!t) throw fail('Transaction not found', 404);
    if (t.status !== 'pending') throw fail('Transaction is already processed');
    const u = byId(t.userId);
    t.status = body.action === 'approve' ? 'approved' : 'rejected'; t.processedAt = iso(Date.now());
    if (t.status === 'approved' && t.type === 'deposit') u.balanceUSD += t.amount;
    return { data: t };
  }
  if (path === '/orders') return page(orders.filter((o) => (!query.status || o.status === query.status) && (!query.symbol || o.symbol === query.symbol)), query);
  if (path === '/positions') return page(positions.filter((p) => !query.symbol || p.symbol === query.symbol), query);
  if (path === '/instruments') return { data: instruments, total: instruments.length };
  if ((m = path.match(/^\/instruments\/([^/]+)$/))) {
    const x = instruments.find((i) => i.id === m[1]); if (!x) throw fail('Instrument not found', 404);
    Object.assign(x, body); return { data: x };
  }
  throw fail('Not found: ' + path, 404);
}
