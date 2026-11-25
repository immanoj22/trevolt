// SQLite persistence (built-in node:sqlite): schema, wallet ledger primitive and first-run seed.
import { DatabaseSync } from 'node:sqlite';
import { mkdirSync } from 'node:fs';
import { randomBytes } from 'node:crypto';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { pairs } from './data.js';
import { hashPassword } from './auth.js';

const dir = path.join(path.dirname(fileURLToPath(import.meta.url)), 'data');
mkdirSync(dir, { recursive: true });
export const db = new DatabaseSync(process.env.DB_FILE || path.join(dir, 'trevolt.db'));

export const uid = (prefix) => `${prefix}_${randomBytes(6).toString('hex')}`;
export const now = () => new Date().toISOString();

// Runs fn inside a transaction; rolls back if it throws.
export const tx = (fn) => {
  db.exec('BEGIN');
  try { const r = fn(); db.exec('COMMIT'); return r; } catch (e) { db.exec('ROLLBACK'); throw e; }
};

db.exec(`
PRAGMA journal_mode = WAL;
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY, account_id TEXT UNIQUE NOT NULL, email TEXT UNIQUE NOT NULL,
  first_name TEXT, last_name TEXT, dob TEXT, password_hash TEXT NOT NULL,
  kyc_status TEXT NOT NULL DEFAULT 'pending', status TEXT NOT NULL DEFAULT 'active',
  balance REAL NOT NULL DEFAULT 0, created_at TEXT NOT NULL, last_login_at TEXT);
CREATE TABLE IF NOT EXISTS admins (
  id TEXT PRIMARY KEY, email TEXT UNIQUE NOT NULL, name TEXT, password_hash TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS instruments (
  id TEXT PRIMARY KEY, symbol TEXT UNIQUE NOT NULL, price REAL NOT NULL, open_price REAL NOT NULL,
  spread_pips REAL NOT NULL, max_leverage INTEGER NOT NULL, min_lot REAL NOT NULL, status TEXT NOT NULL DEFAULT 'active');
-- every balance change is one ledger row; users.balance is the running total
CREATE TABLE IF NOT EXISTS ledger (
  id INTEGER PRIMARY KEY AUTOINCREMENT, user_id TEXT NOT NULL, type TEXT NOT NULL, amount REAL NOT NULL,
  balance_after REAL NOT NULL, ref TEXT, note TEXT, created_at TEXT NOT NULL);
-- deposit / withdrawal requests; a withdrawal debits the balance when requested
CREATE TABLE IF NOT EXISTS requests (
  id TEXT PRIMARY KEY, user_id TEXT NOT NULL, type TEXT NOT NULL, amount REAL NOT NULL, currency TEXT NOT NULL DEFAULT 'USD',
  method TEXT, reference TEXT, status TEXT NOT NULL DEFAULT 'pending', note TEXT, created_at TEXT NOT NULL, processed_at TEXT);
CREATE TABLE IF NOT EXISTS orders (
  id TEXT PRIMARY KEY, user_id TEXT NOT NULL, inst_id TEXT NOT NULL, side TEXT NOT NULL, type TEXT NOT NULL,
  price REAL NOT NULL DEFAULT 0, stop_price REAL NOT NULL DEFAULT 0, quantity REAL NOT NULL, filled_qty REAL NOT NULL DEFAULT 0,
  exe_price REAL NOT NULL DEFAULT 0, status TEXT NOT NULL, leverage INTEGER NOT NULL, fee REAL NOT NULL DEFAULT 0,
  take_profit REAL NOT NULL DEFAULT 0, stop_loss REAL NOT NULL DEFAULT 0, created_at TEXT NOT NULL, filled_at TEXT);
CREATE TABLE IF NOT EXISTS positions (
  id TEXT PRIMARY KEY, user_id TEXT NOT NULL, inst_id TEXT NOT NULL, side TEXT NOT NULL, qty REAL NOT NULL, entry REAL NOT NULL,
  leverage INTEGER NOT NULL, margin REAL NOT NULL, take_profit REAL NOT NULL DEFAULT 0, stop_loss REAL NOT NULL DEFAULT 0,
  opened_at TEXT NOT NULL, UNIQUE (user_id, inst_id, side));
CREATE TABLE IF NOT EXISTS fills (
  id TEXT PRIMARY KEY, order_id TEXT NOT NULL, user_id TEXT NOT NULL, inst_id TEXT NOT NULL, side TEXT NOT NULL, order_type TEXT NOT NULL,
  price REAL NOT NULL, qty REAL NOT NULL, notional REAL NOT NULL, fee REAL NOT NULL, created_at TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS trades (
  id TEXT PRIMARY KEY, user_id TEXT NOT NULL, inst_id TEXT NOT NULL, direction TEXT NOT NULL, entry REAL NOT NULL, close_price REAL NOT NULL,
  qty REAL NOT NULL, gross_pnl REAL NOT NULL, fee REAL NOT NULL, after_balance REAL NOT NULL, created_at TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS leverage_pref (user_id TEXT NOT NULL, inst_id TEXT NOT NULL, leverage INTEGER NOT NULL, PRIMARY KEY (user_id, inst_id));
`);

// Applies a balance change and records it. Returns the new balance.
export const post = (userId, type, amount, ref = null, note = null, at = now()) => {
  const { balance } = db.prepare('SELECT balance FROM users WHERE id = ?').get(userId);
  const next = +(balance + amount).toFixed(2);
  db.prepare('UPDATE users SET balance = ? WHERE id = ?').run(next, userId);
  db.prepare('INSERT INTO ledger (user_id, type, amount, balance_after, ref, note, created_at) VALUES (?,?,?,?,?,?,?)')
    .run(userId, type, +amount.toFixed(2), next, ref, note, at);
  return next;
};

const ago = (min) => new Date(Date.now() - min * 60000).toISOString();

// ---- first-run seed (credentials come from env, see README / .env.example) ----
const seed = () => {
  const demoPass = process.env.SEED_DEMO_PASSWORD || 'Demo@12345';
  const adminPass = process.env.SEED_ADMIN_PASSWORD || 'Admin@12345';
  const P = (sym) => pairs.find((p) => p.tickerRoot === sym);
  const iid = (sym) => P(sym).pairId;
  const cs = (sym) => P(sym).contractSize;

  for (const p of pairs) {
    db.prepare('INSERT INTO instruments (id, symbol, price, open_price, spread_pips, max_leverage, min_lot) VALUES (?,?,?,?,?,?,?)')
      .run(p.pairId, p.tickerRoot, p.markPrice, +(p.markPrice / (1 + p.change / 100)).toFixed(p.quoteDecimal), p.spread, p.maxLeverage, 0.01);
  }
  db.prepare('INSERT INTO admins (id, email, name, password_hash) VALUES (?,?,?,?)')
    .run('admin1', process.env.SEED_ADMIN_EMAIL || 'admin@trevolt.test', 'Trevolt Admin', hashPassword(adminPass));

  const user = (id, acc, email, first, last, kyc, ageDays) => db.prepare(
    'INSERT INTO users (id, account_id, email, first_name, last_name, password_hash, kyc_status, created_at, last_login_at) VALUES (?,?,?,?,?,?,?,?,?)')
    .run(id, acc, email, first, last, hashPassword(demoPass), kyc, ago(ageDays * 1440), ago(ageDays * 20));
  user('user1', 'ACC1001', process.env.SEED_DEMO_EMAIL || 'alex@demo.com', 'Alex', 'Morgan', 'approved', 60);
  user('user2', 'ACC1002', 'jordan@demo.com', 'Jordan', 'Lee', 'approved', 21);
  user('user3', 'ACC1003', 'sam@demo.com', 'Sam', 'Rivera', 'pending', 3);

  const order = (o) => {
    const id = uid('ord'), done = o.status === 'completed';
    db.prepare(`INSERT INTO orders (id, user_id, inst_id, side, type, price, stop_price, quantity, filled_qty, exe_price, status, leverage, fee, created_at, filled_at)
      VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`).run(id, o.user, iid(o.sym), o.side, o.type, o.price, o.stop || 0, o.lots * cs(o.sym),
      done ? o.lots * cs(o.sym) : 0, done ? o.price : 0, o.status, 100, +(o.lots * 3.5).toFixed(2), ago(o.mins), done ? ago(o.mins) : null);
    if (done) db.prepare('INSERT INTO fills (id, order_id, user_id, inst_id, side, order_type, price, qty, notional, fee, created_at) VALUES (?,?,?,?,?,?,?,?,?,?,?)')
      .run(uid('fil'), id, o.user, iid(o.sym), o.side, o.type, o.price, o.lots * cs(o.sym),
        +(o.lots * cs(o.sym) * (P(o.sym).baseCurrency === 'USD' ? 1 : o.price)).toFixed(2), +(o.lots * 3.5).toFixed(2), ago(o.mins));
  };
  const position = (userId, sym, side, qty, entry, lev, mins) => db.prepare(
    'INSERT INTO positions (id, user_id, inst_id, side, qty, entry, leverage, margin, opened_at) VALUES (?,?,?,?,?,?,?,?,?)')
    .run(uid('pos'), userId, iid(sym), side, qty, entry, lev, +(qty * (P(sym).baseCurrency === 'USD' ? 1 : entry) / lev).toFixed(2), ago(mins));
  const closedTrade = (userId, sym, dir, entry, close, lots, pnl, fee, mins) => {
    post(userId, 'pnl', pnl, null, `Closed ${sym}`, ago(mins));
    const after = post(userId, 'fee', -fee, null, `Commission ${sym}`, ago(mins));
    db.prepare('INSERT INTO trades (id, user_id, inst_id, direction, entry, close_price, qty, gross_pnl, fee, after_balance, created_at) VALUES (?,?,?,?,?,?,?,?,?,?,?)')
      .run(uid('trd'), userId, iid(sym), dir, entry, close, lots * cs(sym), pnl, fee, after, ago(mins));
  };
  const req = (userId, type, amount, method, ref, status, mins) => db.prepare(
    'INSERT INTO requests (id, user_id, type, amount, method, reference, status, created_at, processed_at) VALUES (?,?,?,?,?,?,?,?,?)')
    .run(uid('req'), userId, type, amount, method, ref, status, ago(mins), status === 'pending' ? null : ago(mins - 30));

  // Demo user: 25k deposited, three closed trades, one withdrawal -> 24,850.75 balance
  post('user1', 'deposit', 20000, null, 'Initial deposit', ago(60 * 1440)); req('user1', 'deposit', 20000, 'BANK', 'DEP-1001', 'approved', 60 * 1440);
  post('user1', 'deposit', 5000, null, 'Top-up', ago(30 * 1440)); req('user1', 'deposit', 5000, 'BANK', 'DEP-1002', 'approved', 30 * 1440);
  closedTrade('user1', 'GBPUSD', 'long', 1.2864, 1.2921, 0.8, 456.0, 2.8, 1300);
  closedTrade('user1', 'USDJPY', 'short', 151.88, 151.22, 0.6, 261.9, 2.1, 4300);
  closedTrade('user1', 'USDCAD', 'long', 1.384, 1.3811, 1.0, -210.0, 3.5, 7200);
  post('user1', 'withdrawal', -648.75, null, 'Withdrawal', ago(2000)); req('user1', 'withdrawal', 648.75, 'BANK', 'WDR-1001', 'approved', 2000);
  position('user1', 'EURUSD', 'long', 50000, 1.0832, 100, 600);
  position('user1', 'XAUUSD', 'short', 30, 2698.1, 50, 900);
  order({ user: 'user1', sym: 'EURUSD', side: 'buy', type: 'market', price: 1.0832, lots: 0.5, status: 'completed', mins: 600 });
  order({ user: 'user1', sym: 'XAUUSD', side: 'sell', type: 'market', price: 2698.1, lots: 0.3, status: 'completed', mins: 900 });
  order({ user: 'user1', sym: 'GBPUSD', side: 'buy', type: 'limit', price: 1.2864, lots: 0.8, status: 'completed', mins: 1500 });
  order({ user: 'user1', sym: 'AUDUSD', side: 'buy', type: 'limit', price: 0.652, lots: 1.0, status: 'cancelled', mins: 2000 });
  order({ user: 'user1', sym: 'EURUSD', side: 'buy', type: 'limit', price: 1.0815, lots: 0.5, status: 'open', mins: 25 });
  order({ user: 'user1', sym: 'GBPUSD', side: 'sell', type: 'limit', price: 1.3005, lots: 0.3, status: 'open', mins: 80 });
  order({ user: 'user1', sym: 'USDJPY', side: 'buy', type: 'limit', price: 150.45, lots: 0.4, status: 'open', mins: 140 });
  order({ user: 'user1', sym: 'EURUSD', side: 'sell', type: 'stop_limit', price: 1.0778, stop: 1.0785, lots: 0.5, status: 'open', mins: 200 });

  // Second user: some history, one position, a pending withdrawal (amount already reserved)
  post('user2', 'deposit', 9000, null, 'Initial deposit', ago(20 * 1440)); req('user2', 'deposit', 9000, 'BANK', 'DEP-2001', 'approved', 20 * 1440);
  closedTrade('user2', 'XAUUSD', 'long', 2650.2, 2661.9, 0.5, 585, 1.75, 5000);
  post('user2', 'withdrawal', -750, null, 'Withdrawal request', ago(90)); req('user2', 'withdrawal', 750, 'BANK', 'WDR-2001', 'pending', 90);
  position('user2', 'GBPUSD', 'long', 20000, 1.2901, 100, 300);
  order({ user: 'user2', sym: 'GBPUSD', side: 'buy', type: 'market', price: 1.2901, lots: 0.2, status: 'completed', mins: 300 });
  req('user2', 'deposit', 2000, 'BANK', 'DEP-2002', 'pending', 45);

  // Third user: KYC pending, small pending deposit
  post('user3', 'deposit', 1500, null, 'Initial deposit', ago(2 * 1440)); req('user3', 'deposit', 1500, 'UPI', 'DEP-3001', 'approved', 2 * 1440);
  req('user3', 'deposit', 500, 'UPI', 'DEP-3002', 'pending', 20);
};

if (!db.prepare('SELECT 1 FROM users LIMIT 1').get()) tx(seed);
