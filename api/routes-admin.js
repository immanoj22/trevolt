// Admin API (plain JSON, Bearer JWT signed with ADMIN_JWT_SECRET). Contract: docs/admin-api.md
import { Router } from 'express';
import { db, tx, post, now } from './db.js';
import { verifyPassword, signJwt, verifyJwt, tokenFrom, ADMIN_JWT_SECRET } from './auth.js';
import { ApiError, instruments, updateInstrument, positionView, pushUser } from './engine.js';

const r2 = (n) => +n.toFixed(2);
const ORDER_STATUS = { open: 'open', filled: 'completed', cancelled: 'cancelled' }; // admin vocabulary -> DB value

// Runs fn and wraps its { data, total } in the contract envelope.
const h = (fn) => (req, res) => {
  try { res.json({ success: true, ...fn(req) }); } catch (e) {
    if (!(e instanceof ApiError)) console.error(e);
    res.status(e instanceof ApiError ? e.status : 500).json({ success: false, message: e instanceof ApiError ? e.message : 'Internal error' });
  }
};
const paging = (req) => {
  const page = Math.max(+req.query.page || 1, 1), limit = Math.min(Math.max(+req.query.limit || 20, 1), 200);
  return { limit, offset: (page - 1) * limit };
};
// Builds "WHERE a = ? AND b LIKE ?" from the filters that were actually supplied.
const where = (conds) => {
  const used = conds.filter(([, v]) => v !== undefined && v !== '');
  return [used.length ? `WHERE ${used.map(([c]) => c).join(' AND ')}` : '', used.flatMap(([, v]) => (Array.isArray(v) ? v : [v]))];
};
const paged = (req, table, base, order, view, joinUsers = false) => {
  const { limit, offset } = paging(req);
  const from = joinUsers ? `${table} t JOIN users u ON u.id = t.user_id` : table;
  const total = db.prepare(`SELECT COUNT(*) n FROM ${from} ${base[0]}`).get(...base[1]).n;
  const rows = db.prepare(`SELECT ${joinUsers ? 't.*, u.email AS user_email' : '*'} FROM ${from} ${base[0]} ORDER BY ${order} LIMIT ? OFFSET ?`).all(...base[1], limit, offset);
  return { data: rows.map(view), total };
};

const userView = (u) => ({ id: u.id, accountId: u.account_id, email: u.email, name: `${u.first_name || ''} ${u.last_name || ''}`.trim() || u.email,
  kycStatus: u.kyc_status, status: u.status, balanceUSD: u.balance, createdAt: u.created_at, lastLoginAt: u.last_login_at });
const txView = (t) => ({ id: t.id, type: t.type, userId: t.user_id, userEmail: t.user_email, amount: t.amount, currency: t.currency, method: t.method, reference: t.reference,
  status: t.status, createdAt: t.created_at, processedAt: t.processed_at });
const orderView = (o) => ({ id: o.id, userId: o.user_id, userEmail: o.user_email, symbol: instruments.get(o.inst_id).symbol, side: o.side, type: o.type, quantity: o.quantity,
  price: o.price || o.exe_price, filledQuantity: o.filled_qty, status: o.status === 'completed' ? 'filled' : o.status, createdAt: o.created_at });
const positionAdmin = (p) => { const v = positionView(p); return { id: p.id, userId: p.user_id, userEmail: p.user_email, symbol: v.pairName, side: p.side, size: p.qty,
  entryPrice: p.entry, markPrice: v.close_price, pnl: v.pnl, margin: r2(p.margin), openedAt: p.opened_at }; };
const instrumentView = (i) => ({ id: i.id, symbol: i.symbol, name: i.name, price: i.mid, spreadPips: i.spreadPips, maxLeverage: i.maxLeverage, minLot: i.minLot, status: i.status });

const find = (table, id, what) => {
  const row = db.prepare(`SELECT * FROM ${table} WHERE id = ?`).get(id);
  if (!row) throw new ApiError(`${what} not found`, 404);
  return row;
};
const oneOf = (value, allowed, field) => {
  if (!allowed.includes(value)) throw new ApiError(`${field} must be one of: ${allowed.join(', ')}`);
  return value;
};

export const adminRoutes = () => {
  const r = Router();

  r.post('/login', h((req) => {
    const a = db.prepare('SELECT * FROM admins WHERE email = ?').get(String(req.body?.email || '').trim().toLowerCase());
    if (!a || !verifyPassword(req.body?.password, a.password_hash)) throw new ApiError('Invalid email or password', 401);
    return { data: { token: signJwt({ adminId: a.id, role: 'admin' }, ADMIN_JWT_SECRET, 12 * 3600), admin: { id: a.id, email: a.email, name: a.name } } };
  }));

  r.use((req, res, next) => { // everything below needs an admin token (user tokens are signed with another secret)
    const claims = verifyJwt(tokenFrom(req.headers), ADMIN_JWT_SECRET);
    if (claims?.role !== 'admin' || !db.prepare('SELECT 1 FROM admins WHERE id = ?').get(claims.adminId)) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }
    next();
  });

  r.get('/stats', h(() => {
    const n = (sql, ...a) => db.prepare(sql).get(...a).n;
    const since7d = new Date(Date.now() - 7 * 864e5).toISOString(), since24h = new Date(Date.now() - 864e5).toISOString();
    const recent = [
      ...db.prepare('SELECT u.email, t.type, t.amount, t.status, t.created_at FROM requests t JOIN users u ON u.id = t.user_id ORDER BY t.created_at DESC LIMIT 6').all()
        .map((t) => ({ type: t.type, text: `${t.email} ${t.status === 'pending' ? 'requested' : t.status} a ${t.type} of $${t.amount}`, at: t.created_at })),
      ...db.prepare('SELECT email, created_at FROM users ORDER BY created_at DESC LIMIT 4').all().map((u) => ({ type: 'signup', text: `${u.email} signed up`, at: u.created_at })),
      ...db.prepare('SELECT u.email, t.inst_id, t.direction, t.gross_pnl, t.created_at FROM trades t JOIN users u ON u.id = t.user_id ORDER BY t.created_at DESC LIMIT 4').all()
        .map((t) => ({ type: 'trade', text: `${t.email} closed ${t.direction} ${instruments.get(t.inst_id).symbol} for $${t.gross_pnl}`, at: t.created_at })),
    ].sort((a, b) => (a.at < b.at ? 1 : -1)).slice(0, 10);
    return { data: {
      users: n('SELECT COUNT(*) n FROM users'), newUsers7d: n('SELECT COUNT(*) n FROM users WHERE created_at >= ?', since7d),
      kycPending: n("SELECT COUNT(*) n FROM users WHERE kyc_status = 'pending'"),
      depositsPending: n("SELECT COUNT(*) n FROM requests WHERE type = 'deposit' AND status = 'pending'"),
      withdrawalsPending: n("SELECT COUNT(*) n FROM requests WHERE type = 'withdrawal' AND status = 'pending'"),
      openOrders: n("SELECT COUNT(*) n FROM orders WHERE status = 'open'"), openPositions: n('SELECT COUNT(*) n FROM positions'),
      totalBalanceUSD: r2(db.prepare('SELECT COALESCE(SUM(balance), 0) s FROM users').get().s),
      volume24hUSD: r2(db.prepare('SELECT COALESCE(SUM(notional), 0) s FROM fills WHERE created_at >= ?').get(since24h).s), recent } };
  }));

  r.get('/users', h((req) => {
    const q = req.query.search ? `%${req.query.search}%` : undefined;
    return paged(req, 'users', where([['(email LIKE ? OR first_name LIKE ? OR last_name LIKE ? OR account_id LIKE ?)', q && [q, q, q, q]],
      ['status = ?', req.query.status], ['kyc_status = ?', req.query.kyc]]), 'created_at DESC', userView);
  }));
  r.get('/users/:id', h((req) => {
    const u = find('users', req.params.id, 'User');
    const withEmail = (p) => ({ ...p, user_email: u.email });
    return { data: { ...userView(u),
      positions: db.prepare('SELECT * FROM positions WHERE user_id = ?').all(u.id).map((p) => positionAdmin(withEmail(p))),
      recentOrders: db.prepare('SELECT * FROM orders WHERE user_id = ? ORDER BY created_at DESC LIMIT 20').all(u.id).map((o) => orderView(withEmail(o))),
      transactions: db.prepare('SELECT * FROM requests WHERE user_id = ? ORDER BY created_at DESC LIMIT 20').all(u.id).map((t) => txView(withEmail(t))) } };
  }));
  r.patch('/users/:id', h((req) => {
    const u = find('users', req.params.id, 'User'), b = req.body || {};
    const kyc = b.kycStatus === undefined ? u.kyc_status : oneOf(b.kycStatus, ['pending', 'approved', 'rejected'], 'kycStatus');
    const status = b.status === undefined ? u.status : oneOf(b.status, ['active', 'blocked'], 'status');
    db.prepare('UPDATE users SET kyc_status = ?, status = ? WHERE id = ?').run(kyc, status, u.id);
    return { data: userView(find('users', u.id, 'User')) };
  }));
  r.post('/users/:id/adjust', h((req) => {
    const u = find('users', req.params.id, 'User'), amount = +req.body?.amount;
    if (!Number.isFinite(amount) || amount === 0) throw new ApiError('amount must be a non-zero number');
    if (u.balance + amount < 0) throw new ApiError('Adjustment would make the balance negative');
    const balanceUSD = post(u.id, 'adjustment', amount, null, req.body?.note || 'Admin adjustment');
    pushUser(u.id);
    return { data: { balanceUSD } };
  }));

  r.get('/transactions', h((req) => paged(req, 'requests', where([['t.type = ?', req.query.type], ['t.status = ?', req.query.status]]), 't.created_at DESC', txView, true)));
  r.patch('/transactions/:id', h((req) => {
    const t = find('requests', req.params.id, 'Transaction'), action = oneOf(req.body?.action, ['approve', 'reject'], 'action');
    if (t.status !== 'pending') throw new ApiError(`Transaction is already ${t.status}`);
    tx(() => {
      // a withdrawal was debited when requested: approving keeps that, rejecting returns the funds
      if (action === 'approve' && t.type === 'deposit') post(t.user_id, 'deposit', t.amount, t.id, 'Deposit approved');
      if (action === 'reject' && t.type === 'withdrawal') post(t.user_id, 'withdrawal_refund', t.amount, t.id, 'Withdrawal rejected');
      db.prepare('UPDATE requests SET status = ?, processed_at = ?, note = ? WHERE id = ?').run(action === 'approve' ? 'approved' : 'rejected', now(), req.body?.note || null, t.id);
    });
    pushUser(t.user_id);
    return { data: txView({ ...db.prepare('SELECT * FROM requests WHERE id = ?').get(t.id), user_email: db.prepare('SELECT email FROM users WHERE id = ?').get(t.user_id).email }) };
  }));

  r.get('/orders', h((req) => {
    const st = req.query.status && oneOf(req.query.status, Object.keys(ORDER_STATUS), 'status');
    const inst = req.query.symbol && [...instruments.values()].find((i) => i.symbol === req.query.symbol.toUpperCase());
    return paged(req, 'orders', where([['t.status = ?', st && ORDER_STATUS[st]], ['t.inst_id = ?', req.query.symbol ? inst?.id || '-' : undefined]]), 't.created_at DESC', orderView, true);
  }));
  r.get('/positions', h((req) => {
    const inst = req.query.symbol && [...instruments.values()].find((i) => i.symbol === req.query.symbol.toUpperCase());
    return paged(req, 'positions', where([['t.inst_id = ?', req.query.symbol ? inst?.id || '-' : undefined]]), 't.opened_at DESC', positionAdmin, true);
  }));

  r.get('/instruments', h(() => ({ data: [...instruments.values()].map(instrumentView) })));
  r.patch('/instruments/:id', h((req) => {
    const i = instruments.get(req.params.id), b = req.body || {};
    if (!i) throw new ApiError('Instrument not found', 404);
    const fields = {};
    if (b.spreadPips !== undefined) { if (!(+b.spreadPips >= 0)) throw new ApiError('spreadPips must be >= 0'); fields.spreadPips = +b.spreadPips; }
    if (b.maxLeverage !== undefined) { if (!(+b.maxLeverage >= 1)) throw new ApiError('maxLeverage must be >= 1'); fields.maxLeverage = Math.round(+b.maxLeverage); }
    if (b.status !== undefined) fields.status = oneOf(b.status, ['active', 'disabled'], 'status');
    return { data: instrumentView(updateInstrument(i.id, fields)) };
  }));

  r.use((req, res) => res.status(404).json({ success: false, message: 'Not found' }));
  return r;
};
