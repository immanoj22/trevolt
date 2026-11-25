// Trading engine: simulated price feed, order matching, positions, PnL and the client response shapes.
// Everything is USD-margined. Quantities are base units (1 lot = contractSize units).
import { db, tx, post, uid, now } from './db.js';
import { pairs } from './data.js';

export class ApiError extends Error {
  constructor(message, status = 400, errors = undefined) { super(message); this.status = status; this.errors = errors; }
}

const FEE_PER_LOT = 3.5; // commission in USD, charged on every fill (open and close)
const TICK_MS = 1500;
const ORDER_TYPES = ['market', 'limit', 'stop_market', 'stop_limit'];
const r2 = (n) => +n.toFixed(2);

// ---- instruments: DB row (admin-editable, price) + static metadata from data.js, kept live in memory ----
export const instruments = new Map(); // id -> instrument
const bySymbol = new Map();
const loadInstrument = (row) => {
  const meta = pairs.find((p) => p.pairId === row.id);
  const i = { ...meta, id: row.id, symbol: row.symbol, name: `${meta.baseCurrency}/${meta.quoteCurrency}`, base: meta.baseCurrency, quote: meta.quoteCurrency,
    cs: meta.contractSize, pip: meta.pipSize, dec: meta.quoteDecimal, anchor: meta.markPrice,
    mid: row.price, openPrice: row.open_price, spreadPips: row.spread_pips, maxLeverage: row.max_leverage, minLot: row.min_lot, status: row.status };
  instruments.set(i.id, i); bySymbol.set(i.symbol, i);
  return i;
};
db.prepare('SELECT * FROM instruments').all().forEach(loadInstrument);

const half = (i) => (i.spreadPips * i.pip) / 2;
export const ask = (i) => +(i.mid + half(i)).toFixed(i.dec);
export const bid = (i) => +(i.mid - half(i)).toFixed(i.dec);
export const findInstrument = (idOrSymbol) => instruments.get(idOrSymbol) || bySymbol.get(idOrSymbol);
export const livePrice = (symbol) => (bySymbol.get(symbol) || instruments.get('pair0')).mid;

// Updates admin-editable fields (spreadPips, maxLeverage, status) and persists them.
export const updateInstrument = (id, fields) => {
  const i = instruments.get(id);
  Object.assign(i, fields);
  db.prepare('UPDATE instruments SET spread_pips = ?, max_leverage = ?, status = ? WHERE id = ?').run(i.spreadPips, i.maxLeverage, i.status, id);
  return i;
};

// ---- money maths ----
const notional = (i, qty, price) => (i.base === 'USD' ? qty : qty * price); // USD value of a position
const toUsd = (i, quoteAmount, price) => (i.quote === 'USD' ? quoteAmount : quoteAmount / price);
const pnlOf = (i, side, qty, entry, exit) => r2(toUsd(i, (side === 'long' ? exit - entry : entry - exit) * qty, exit));
const feeOf = (i, qty) => r2((qty / i.cs) * FEE_PER_LOT);
const exitPrice = (i, side) => (side === 'long' ? bid(i) : ask(i)); // longs close on the bid, shorts on the ask

const accountOf = (userId) => db.prepare('SELECT account_id FROM users WHERE id = ?').get(userId)?.account_id;
const positionsOf = (userId) => db.prepare('SELECT * FROM positions WHERE user_id = ? ORDER BY opened_at').all(userId);
const reserve = (o) => notional(instruments.get(o.inst_id), o.quantity, o.price || o.stop_price) / o.leverage;

// Margin locked by open positions and by resting orders.
const lockedMargin = (userId, exceptOrderId = null) =>
  positionsOf(userId).reduce((s, p) => s + p.margin, 0) +
  db.prepare("SELECT * FROM orders WHERE user_id = ? AND status = 'open' AND type != 'market' AND id IS NOT ?").all(userId, exceptOrderId).reduce((s, o) => s + reserve(o), 0);
export const freeMargin = (userId, exceptOrderId = null) =>
  r2(db.prepare('SELECT balance FROM users WHERE id = ?').get(userId).balance - lockedMargin(userId, exceptOrderId));

// ---- response shapes (identical to the former demo data) ----
export const pairView = (i) => {
  const change = r2(((i.mid - i.openPrice) / i.openPrice) * 100);
  return { ...pairs.find((p) => p.pairId === i.id), markPrice: i.mid, marketPrice: i.mid, lastPrice: i.mid, indexPrice: i.mid, underlyingPrice: i.mid,
    change, priceChange: change, changePrice: +(i.mid - i.openPrice).toFixed(i.dec), high: +(i.mid * 1.006).toFixed(i.dec), low: +(i.mid * 0.994).toFixed(i.dec),
    spread: i.spreadPips, maxLeverage: i.maxLeverage, leverage: i.maxLeverage, max: i.maxLeverage, minAmount: i.minLot * i.cs, minQuantity: i.minLot * i.cs,
    initialMargin: +(100 / i.maxLeverage).toFixed(2), maintenanceMargin: +(100 / i.maxLeverage / 2).toFixed(2), status: i.status };
};
export const pairList = () => [...instruments.values()].map(pairView);

export const positionView = (p) => {
  const i = instruments.get(p.inst_id), mark = exitPrice(i, p.side), pnl = pnlOf(i, p.side, p.qty, p.entry, mark);
  return { _id: p.id, pairId: i.id, pairName: i.symbol, tickerRoot: i.symbol, pairData: pairView(i), tradeMode: 'future', positionSide: p.side,
    positionFilled: p.qty, entryPrice: p.entry, liquidityPrice: +(p.entry * (1 + (p.side === 'long' ? -0.9 : 0.9) / p.leverage)).toFixed(i.dec),
    initialMargin: r2(p.margin), close_price: mark, pnl, pnl_percen: r2((pnl / p.margin) * 100), leverage: p.leverage, bracketOrders: [],
    takeprofit: p.take_profit, stoploss: p.stop_loss, accountId: accountOf(p.user_id), openedAt: p.opened_at };
};

export const orderView = (o) => {
  const i = instruments.get(o.inst_id);
  return { _id: o.id, pairId: i.id, pairName: i.symbol, pairData: pairView(i), baseCurrency: i.base, tradeMode: 'future', buyorsell: o.side, orderType: o.type,
    price: o.price, quantity: o.quantity, filledQuantity: o.filled_qty, exePrice: o.exe_price, stopPrice: o.stop_price, status: o.status,
    orderValue: r2(notional(i, o.quantity, o.price || o.stop_price || i.mid)), reduce_only: false, bracketOrders: [], takeprofit: o.take_profit, stoploss: o.stop_loss,
    fee: o.fee, pandl: 0, liquidateFee: 0, leverage: o.leverage, orderDate: o.created_at, createdAt: o.created_at };
};
const fillView = (f) => {
  const i = instruments.get(f.inst_id);
  return { _id: f.id, filledId: f.id, orderId: f.order_id, pairId: i.id, pairname: i.symbol, pairName: i.symbol, pairData: pairView(i), baseCurrency: i.base, tradeMode: 'future',
    side: f.side, orderType: f.order_type, price: f.price, orderQty: f.qty, filledQuantity: f.qty, notional: f.notional, fee: f.fee, isMaker: f.order_type === 'limit',
    liquidateFee: 0, created_at: f.created_at };
};
const tradeView = (t) => {
  const i = instruments.get(t.inst_id);
  return { _id: t.id, pairId: i.id, pairName: i.symbol, pairData: pairView(i), tradeMode: 'future', closing_direction: t.direction, entryPrice: t.entry, closePrice: t.close_price,
    quantity: t.qty, grossPandL: t.gross_pnl, closeFee: t.fee, afterBalance: t.after_balance, createdAt: t.created_at };
};
export const walletView = (userId) => {
  const u = db.prepare('SELECT account_id, balance FROM users WHERE id = ?').get(userId);
  const positions = positionsOf(userId), margin = positions.reduce((s, p) => s + p.margin, 0), locked = lockedMargin(userId);
  const unreal = positions.reduce((s, p) => s + positionView(p).pnl, 0);
  return { accountId: u.account_id, walletBalance: u.balance, availableBalance: r2(u.balance - locked), tradingBalance: u.balance,
    freezeBalance: r2(locked), unRealizedPnL: r2(unreal), totalMargin: r2(margin), currency: 'USD' };
};

// ---- list queries behind the REST endpoints and socket snapshots ----
const page = (data, total, p, limit) => ({ data, count: total, currentPage: p, nextPage: p * limit < total });
export const list = (userId, kind, pairId = 'all', p = 1, limit = 50) => {
  p = Math.max(+p || 1, 1); limit = Math.min(Math.max(+limit || 50, 1), 200);
  const table = { open: 'orders', stop: 'orders', history: 'orders', fills: 'fills', closed: 'trades' }[kind];
  const where = { open: "status = 'open' AND type IN ('market','limit')", stop: "status = 'open' AND type LIKE 'stop%'", history: "status != 'open'" }[kind] || '1 = 1';
  const args = [userId]; let cond = `user_id = ? AND ${where}`;
  if (pairId && pairId !== 'all') { cond += ' AND inst_id = ?'; args.push(pairId); }
  const total = db.prepare(`SELECT COUNT(*) n FROM ${table} WHERE ${cond}`).get(...args).n;
  const rows = db.prepare(`SELECT * FROM ${table} WHERE ${cond} ORDER BY created_at DESC LIMIT ? OFFSET ?`).all(...args, limit, (p - 1) * limit);
  const view = { open: orderView, stop: orderView, history: orderView, fills: fillView, closed: tradeView }[kind];
  return page(rows.map(view), total, p, limit);
};
export const openPositions = (userId, pairId = 'all') => {
  const rows = positionsOf(userId).filter((p) => pairId === 'all' || !pairId || p.inst_id === pairId);
  return page(rows.map(positionView), rows.length, 1, 1000);
};

// ---- socket pushes (rooms are named after the user id; clients join with CREATE_ROOM) ----
let io = null;
const emitUser = (userId, event, data) => io?.to(userId).emit(event, { accountId: accountOf(userId), data });
const pushPositions = (userId) => emitUser(userId, 'FuturesPositionOrder', openPositions(userId).data);
// After anything changed: refresh orders, positions, history and balance on the user's screens.
export const pushUser = (userId) => {
  pushPositions(userId);
  emitUser(userId, 'FuturesopenOrder', list(userId, 'open').data);
  emitUser(userId, 'Futurestoporder', list(userId, 'stop').data);
  emitUser(userId, 'FuturesorderHistory', list(userId, 'history').data);
  emitUser(userId, 'FuturefilledHistory', list(userId, 'fills').data);
  emitUser(userId, 'FutureClosedPositionHistory', list(userId, 'closed').data);
  io?.to(userId).emit('USER_BALANCE', walletView(userId));
};

// ---- orders ----
const fillOrder = (o, price) => tx(() => {
  const i = instruments.get(o.inst_id), side = o.side === 'buy' ? 'long' : 'short';
  const margin = notional(i, o.quantity, price) / o.leverage, fee = feeOf(i, o.quantity);
  if (freeMargin(o.user_id, o.id) < margin + fee) { // balance dropped since the order was placed
    db.prepare("UPDATE orders SET status = 'cancelled' WHERE id = ?").run(o.id);
    return false;
  }
  const pos = db.prepare('SELECT * FROM positions WHERE user_id = ? AND inst_id = ? AND side = ?').get(o.user_id, o.inst_id, side);
  if (pos) {
    const qty = pos.qty + o.quantity;
    db.prepare('UPDATE positions SET qty = ?, entry = ?, margin = ?, leverage = ?, take_profit = ?, stop_loss = ? WHERE id = ?')
      .run(qty, +((pos.entry * pos.qty + price * o.quantity) / qty).toFixed(i.dec), pos.margin + margin, o.leverage, o.take_profit || pos.take_profit, o.stop_loss || pos.stop_loss, pos.id);
  } else {
    db.prepare('INSERT INTO positions (id, user_id, inst_id, side, qty, entry, leverage, margin, take_profit, stop_loss, opened_at) VALUES (?,?,?,?,?,?,?,?,?,?,?)')
      .run(uid('pos'), o.user_id, o.inst_id, side, o.quantity, price, o.leverage, margin, o.take_profit, o.stop_loss, now());
  }
  post(o.user_id, 'fee', -fee, o.id, `Commission ${i.symbol}`);
  db.prepare("UPDATE orders SET status = 'completed', filled_qty = quantity, exe_price = ?, price = ?, fee = ?, filled_at = ? WHERE id = ?").run(price, o.price || price, fee, now(), o.id);
  db.prepare('INSERT INTO fills (id, order_id, user_id, inst_id, side, order_type, price, qty, notional, fee, created_at) VALUES (?,?,?,?,?,?,?,?,?,?,?)')
    .run(uid('fil'), o.id, o.user_id, o.inst_id, o.side, o.type, price, o.quantity, r2(notional(i, o.quantity, price)), fee, now());
  return true;
});

export const placeOrder = (user, p) => {
  if (user.status !== 'active') throw new ApiError('Your account is blocked. Contact support.');
  const i = findInstrument(p.pairId) || findInstrument(p.tickerRoot);
  if (!i) throw new ApiError('Instrument not found');
  if (i.status !== 'active') throw new ApiError(`${i.symbol} is currently disabled for trading`);
  const side = p.buyorsell, type = p.orderType || 'market', qty = +p.quantity, price = +p.price || 0, stop = +p.stopPrice || 0;
  if (!['buy', 'sell'].includes(side)) throw new ApiError('Order side must be buy or sell');
  if (!ORDER_TYPES.includes(type)) throw new ApiError(`Unsupported order type: ${type}`);
  if (!(qty > 0)) throw new ApiError('Enter a valid quantity', 400, { quantity: 'Quantity is required' });
  if (qty < i.minLot * i.cs) throw new ApiError(`Minimum order size is ${i.minLot * i.cs} ${i.base}`, 400, { quantity: 'Below minimum size' });
  if (qty > i.cs * 50) throw new ApiError(`Maximum order size is ${i.cs * 50} ${i.base}`, 400, { quantity: 'Above maximum size' });
  if (['limit', 'stop_limit'].includes(type) && !(price > 0)) throw new ApiError('Enter a limit price', 400, { price: 'Price is required' });
  if (type.startsWith('stop') && !(stop > 0)) throw new ApiError('Enter a stop price', 400, { stopPrice: 'Stop price is required' });
  const saved = db.prepare('SELECT leverage FROM leverage_pref WHERE user_id = ? AND inst_id = ?').get(user.id, i.id)?.leverage;
  const leverage = Math.round(+p.leverage || saved || 1);
  if (leverage < 1 || leverage > i.maxLeverage) throw new ApiError(`Leverage for ${i.symbol} must be between 1 and ${i.maxLeverage}`);

  const refPrice = type === 'market' ? (side === 'buy' ? ask(i) : bid(i)) : price || stop;
  const need = r2(notional(i, qty, refPrice) / leverage + feeOf(i, qty)), free = freeMargin(user.id);
  if (need > free) throw new ApiError(`Insufficient margin: ${need} USD required, ${free} USD available`, 400, { quantity: 'Insufficient margin' });

  const o = { id: uid('ord'), user_id: user.id, inst_id: i.id, side, type, price: type === 'market' ? 0 : price, stop_price: stop, quantity: qty, leverage,
    take_profit: +p.takeProfit?.stopPrice || 0, stop_loss: +p.stopLoss?.stopPrice || 0, created_at: now() };
  db.prepare(`INSERT INTO orders (id, user_id, inst_id, side, type, price, stop_price, quantity, status, leverage, take_profit, stop_loss, created_at)
    VALUES (?,?,?,?,?,?,?,?,'open',?,?,?,?)`).run(o.id, o.user_id, o.inst_id, o.side, o.type, o.price, o.stop_price, o.quantity, o.leverage, o.take_profit, o.stop_loss, o.created_at);
  // market orders fill now; a limit that already crosses the book fills as a taker
  const cross = type === 'market' || (type === 'limit' && (side === 'buy' ? ask(i) <= price : bid(i) >= price));
  if (cross) fillOrder(o, side === 'buy' ? ask(i) : bid(i));
  pushUser(user.id);
  return orderView(db.prepare('SELECT * FROM orders WHERE id = ?').get(o.id));
};

export const cancelOrder = (userId, orderId) => {
  const { changes } = db.prepare("UPDATE orders SET status = 'cancelled' WHERE id = ? AND user_id = ? AND status = 'open'").run(orderId, userId);
  if (!changes) throw new ApiError('Order not found or already processed');
  pushUser(userId);
};
export const cancelAllOrders = (userId) => {
  db.prepare("UPDATE orders SET status = 'cancelled' WHERE user_id = ? AND status = 'open'").run(userId);
  pushUser(userId);
};

// ---- positions ----
// Realises PnL on `qty` units of a position (all of it when omitted).
const closeAt = (pos, qty = pos.qty) => tx(() => {
  const i = instruments.get(pos.inst_id), px = exitPrice(i, pos.side), closeQty = Math.min(qty, pos.qty);
  const gross = pnlOf(i, pos.side, closeQty, pos.entry, px), fee = feeOf(i, closeQty);
  post(pos.user_id, 'pnl', gross, pos.id, `Closed ${i.symbol} ${pos.side}`);
  const after = post(pos.user_id, 'fee', -fee, pos.id, `Commission ${i.symbol}`);
  if (closeQty >= pos.qty - 1e-9) db.prepare('DELETE FROM positions WHERE id = ?').run(pos.id);
  else db.prepare('UPDATE positions SET qty = ?, margin = ? WHERE id = ?').run(pos.qty - closeQty, pos.margin * (1 - closeQty / pos.qty), pos.id);
  db.prepare('INSERT INTO trades (id, user_id, inst_id, direction, entry, close_price, qty, gross_pnl, fee, after_balance, created_at) VALUES (?,?,?,?,?,?,?,?,?,?,?)')
    .run(uid('trd'), pos.user_id, i.id, pos.side, pos.entry, px, closeQty, gross, fee, after, now());
  return { pnl: gross, fee, closePrice: px };
});

export const closePosition = (userId, p) => {
  const i = findInstrument(p.pairId) || findInstrument(p.tickerRoot);
  const pos = i && db.prepare('SELECT * FROM positions WHERE user_id = ? AND inst_id = ? AND side = ?').get(userId, i.id, p.positionSide);
  if (!pos) throw new ApiError('Position not found');
  const qty = +p.quantity || pos.qty;
  if (qty <= 0 || qty > pos.qty + 1e-9) throw new ApiError(`Quantity must be between 0 and ${pos.qty}`);
  const res = closeAt(pos, qty);
  pushUser(userId);
  return res;
};
export const closeAllPositions = (userId) => {
  positionsOf(userId).forEach((pos) => closeAt(pos));
  pushUser(userId);
};

// Sets take-profit / stop-loss prices on a position (0 clears them).
export const setBrackets = (userId, p) => {
  const i = findInstrument(p.pairId);
  const pos = i && db.prepare('SELECT * FROM positions WHERE user_id = ? AND inst_id = ? AND side = ?').get(userId, i.id, p.positionSide);
  if (!pos) throw new ApiError('Position not found');
  let { take_profit: tp, stop_loss: sl } = pos;
  for (const b of p.bracketOrders || []) { if (b.type === 'takeprofit') tp = +b.stopPrice || 0; if (b.type === 'stoploss') sl = +b.stopPrice || 0; }
  db.prepare('UPDATE positions SET take_profit = ?, stop_loss = ? WHERE id = ?').run(tp, sl, pos.id);
  pushUser(userId);
};

export const changeLeverage = (userId, p) => {
  const i = findInstrument(p.pairId);
  if (!i) throw new ApiError('Instrument not found');
  const lev = Math.round(+p.leverage);
  if (!(lev >= 1 && lev <= i.maxLeverage)) throw new ApiError(`Leverage for ${i.symbol} must be between 1 and ${i.maxLeverage}`);
  db.prepare('INSERT INTO leverage_pref (user_id, inst_id, leverage) VALUES (?,?,?) ON CONFLICT (user_id, inst_id) DO UPDATE SET leverage = excluded.leverage').run(userId, i.id, lev);
};

// ---- price feed ----
let ticks = 0;
const tick = () => {
  const touched = new Set();
  for (const i of instruments.values()) {
    // random walk with a weak pull back to the starting price so quotes stay realistic
    i.mid = +(i.mid * (1 + (Math.random() - 0.5) * 0.00015 + ((i.anchor - i.mid) / i.anchor) * 0.0005)).toFixed(i.dec);
    io?.emit('FututresPrice', { tickerRoot: i.symbol, markPrice: i.mid, marketPrice: i.mid, lastPrice: i.mid, change: pairView(i).change });
  }
  if (++ticks % 10 === 0) for (const i of instruments.values()) db.prepare('UPDATE instruments SET price = ? WHERE id = ?').run(i.mid, i.id);

  // resting orders
  for (const o of db.prepare("SELECT * FROM orders WHERE status = 'open' AND type != 'market'").all()) {
    const i = instruments.get(o.inst_id);
    if (i.status !== 'active') continue;
    const buy = o.side === 'buy';
    let type = o.type;
    if (type.startsWith('stop') && (buy ? ask(i) >= o.stop_price : bid(i) <= o.stop_price)) {
      if (type === 'stop_market') { fillOrder(o, buy ? ask(i) : bid(i)); touched.add(o.user_id); continue; }
      db.prepare("UPDATE orders SET type = 'limit' WHERE id = ?").run(o.id); // triggered stop-limit becomes a plain limit
      type = 'limit';
    }
    if (type === 'limit' && (buy ? ask(i) <= o.price : bid(i) >= o.price)) { fillOrder(o, buy ? Math.min(o.price, ask(i)) : Math.max(o.price, bid(i))); touched.add(o.user_id); }
  }
  // take-profit / stop-loss, then stop-out when equity falls below half of the used margin
  const byUser = new Map();
  for (const pos of db.prepare('SELECT * FROM positions').all()) byUser.set(pos.user_id, [...(byUser.get(pos.user_id) || []), pos]);
  for (const [userId, userPositions] of byUser) {
    for (const pos of userPositions) {
      const i = instruments.get(pos.inst_id), px = exitPrice(i, pos.side), long = pos.side === 'long';
      const hit = (pos.take_profit && (long ? px >= pos.take_profit : px <= pos.take_profit)) || (pos.stop_loss && (long ? px <= pos.stop_loss : px >= pos.stop_loss));
      if (hit) { closeAt(pos); touched.add(userId); }
    }
    const left = positionsOf(userId);
    const equity = db.prepare('SELECT balance FROM users WHERE id = ?').get(userId).balance + left.reduce((s, p) => s + positionView(p).pnl, 0);
    if (left.length && equity < left.reduce((s, p) => s + p.margin, 0) * 0.5) { left.forEach((p) => closeAt(p)); touched.add(userId); }
    if (touched.has(userId)) pushUser(userId); else if (left.length) pushPositions(userId); // live PnL every tick
  }
  touched.forEach((u) => { if (!byUser.has(u)) pushUser(u); });
};

export const start = (socketServer) => { io = socketServer; setInterval(tick, TICK_MS); };
