import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import cors from 'cors';
import http from 'http';
import { Server } from 'socket.io';
import CryptoJS from 'crypto-js';
import { pairs, user as baseUser, wallet, conversion } from './data.js';
import { underlyings, chain } from './options.js';
import { pages } from './cms.js';
import { blogs, courses } from './blogdata.js';
import { positions, openOrders, stopOrders, orderHistory, fills, closed, userExtra, assets, pnlChart, pnlSummary, transactions, referral, referralTx, apiKeys, subAccounts, strategies } from './demo.js';
const user = { ...baseUser, ...userExtra };

const KEY = process.env.SECRET || 'demo';
const PORT = 5000;
const enc = (o) => CryptoJS.AES.encrypt(JSON.stringify(o), KEY).toString();
const ok = (result = { data: [], count: 0 }, message = 'OK') =>
  ({ success: true, status: true, statusCode: 200, message, result });

const b64 = (o) => Buffer.from(JSON.stringify(o)).toString('base64url');
const DEMO_JWT = `${b64({ alg: 'HS256', typ: 'JWT' })}.${b64({ userId: 'user1', accountId: 'ACC1001', iat: 1700000000, exp: 4102444800 })}.demo-signature`;
const sorted = (f) => [...pairs].sort(f).map((p) => ({ ...p, price: p.marketPrice, totalTrades: p.change, change_percentage: p.change, tradeMode: 'future' }));
const ann = [
  { _id: 'an1', title: 'Welcome to Trevolt Exchange', description: 'Complete KYC verification and enable 2FA to unlock deposits, withdrawals and full trading limits.', createdAt: new Date().toISOString() },
  { _id: 'an2', title: 'New instruments: USDCHF, XAGUSD, USOIL and US30', description: 'USDCHF, XAGUSD, USOIL and US30 CFDs are now available to trade, with margin and settlement in USD.', createdAt: new Date().toISOString() },
  { _id: 'an3', title: 'Market hours and rollover', description: 'Forex markets trade 24/5. Swap / rollover is applied daily at 22:00 UTC; spreads may widen around the rollover window.', createdAt: new Date().toISOString() },
  { _id: 'an4', title: 'Client funds update (demo)', description: 'Client funds are held in segregated accounts, separate from company funds. Demo figures only.', createdAt: new Date().toISOString() },
  { _id: 'an5', title: 'VIP fee tiers now available', description: 'Verified traders can reach lower maker and taker fees based on 30-day volume. See the Fees page.', createdAt: new Date().toISOString() } ];
const notifs = [
  { _id: 'n1', title: 'KYC verification approved', description: 'Your identity verification is complete. Deposit and withdrawal limits have been raised.', isRead: false, createdAt: new Date(Date.now() - 36e5).toISOString() },
  { _id: 'n2', title: 'Deposit credited', description: 'Your USD deposit has been confirmed and credited to your trading account.', isRead: false, createdAt: new Date(Date.now() - 72e5).toISOString() },
  { _id: 'n3', title: 'Withdrawal address whitelisted', description: 'A new address was added to your withdrawal whitelist. If this was not you, contact support immediately.', isRead: true, createdAt: new Date(Date.now() - 864e5).toISOString() } ];
const currencies = [['USD', 'US Dollar', 2], ['EUR', 'Euro', 2], ['GBP', 'British Pound', 2], ['XAU', 'Gold', 3], ['INR', 'Indian Rupee', 2]]
  .map(([s, n, pip]) => ({ _id: s, currencySymbol: s, currencyName: n, name: n, symbol: s, image: '', pip, status: 'active', currencyType: s === 'XAU' ? 'metal' : 'fiat' }));
const routes = {
  'GET /blog/getBlogs': (req) => { const l = +req.query.limit || 10, p = +req.query.page || 1, q = (req.query.search || '').toLowerCase();
    const all = blogs.filter((b) => !q || b.title.toLowerCase().includes(q)); return ok({ count: all.length, existingBlog: all.slice((p - 1) * l, p * l) }); },
  'GET /blog/getBlog/:id': (req) => ok(blogs.find((b) => b.slug === req.params.id) || blogs[0]),
  'GET /learn/getCourses': (req) => { const l = +req.query.limit || 10, p = +req.query.page || 1;
    return ok({ count: courses.length, existingCourse: courses.slice((p - 1) * l, p * l) }); },
  'GET /learn/getCourse/:id': (req) => ok(courses.find((c) => c._id === req.params.id) || courses[0]),
  'GET /cms/getPage': (req) => ok(pages[req.query.pageName] || { SECTION: [] }),
  'GET /trending/trendingTradePairs': () => ok({ data: sorted((a, b) => b.change - a.change).slice(0, 4) }),
  'GET /trending/popularTradePairs': () => ok({ data: sorted((a, b) => b.volume - a.volume).slice(0, 4) }),
  'GET /trending/twentyFourHoursTradePairs': () => ok({ data: sorted((a, b) => b.turnover - a.turnover) }),
  'GET /currency/get_currency_details': () => ok({ data: currencies }),
  'GET /announcement/announcementListForUser': () => ok(ann),
  'POST /user/register_device_token': () => ok({}),
  'POST /user/login': () => ok({ isLogged: true, token: DEMO_JWT, status: 'success' }, 'Login successful'),
  'POST /user/login_verification': () => ok({ isLogged: true, token: DEMO_JWT }, 'Login successful'),
  'POST /copy/getAllStrategy': () => ok(strategies),
  'GET /copy/mystrategyDetails': () => ok([]),
  'POST /future/pandl_analysis_chart': () => ok(pnlChart),
  'POST /future/pandl_analysis_summary': () => ok(pnlSummary),
  'POST /user/get_transaction_history': () => ok(transactions),
  'POST /user/get_passbook_history': () => ok(transactions),
  'GET /user/get_user_refferal_details': () => ok(referral),
  'GET /user/get_refferal_transaction_history': () => ok(referralTx),
  'GET /key/get_keys': () => ok(apiKeys),
  'GET /subaccount/sub_account': () => ok(subAccounts),
  'GET /future/positionOrders/:id/:id2': () => ok(positions),
  'GET /future/openOrder/:id/:id2': () => ok(openOrders),
  'GET /future/stopOrders/:id/:id2': () => ok(stopOrders),
  'GET /future/orderHistory/:id/:id2': () => ok(orderHistory),
  'GET /future/filledHistory/:id/:id2': () => ok(fills),
  'GET /future/closedOrders/:id/:id2': () => ok(closed),
  'GET /wallet/get_user_wallet': () => ok(assets),
  'GET /subaccount/chart_settings': () => ok(null),
  'GET /future/orderBook/:id': (req) => ok(book(pairs.find((p) => p.pairId === req.params.id)?.tickerRoot)),
  'GET /user/get_user_details': () => ok({ data: user }),
  'GET /future/get_pair_details': () => ok({ data: pairs }),
  'POST /future/availableMargin': () => ok(wallet),
  'GET /currency/price_conversion_list': () => ok({ data: conversion }),
  'GET /option/get_underlying_asset': () => ok(underlyings),
  'GET /option/get_option_details': (req) => ok({ data: [chain(req.query.underlyingAsset, req.query.expiryDateStr)] }),
  'GET /notification/getAllNotifications': () => ok({ data: notifs, count: notifs.length, unread: 2 }),
};

const seed = (n) => { let x = n; return () => (x = (x * 9301 + 49297) % 233280) / 233280; };
const priceOf = (sym) => (pairs.find((p) => p.tickerRoot === sym) || pairs[0]).markPrice;
const dec = (sym) => (pairs.find((p) => p.tickerRoot === sym) || pairs[0]).quoteDecimal;
const book = (sym) => {
  const pr = pairs.find((p) => p.tickerRoot === sym) || pairs[0], mid = pr.markPrice, d = pr.quoteDecimal, step = +(pr.pipSize / 2).toFixed(d), r = seed(7);
  const side = (dir) => Array.from({ length: 14 }, (_, i) => {
    const price = +(mid + dir * (step * (i + 1) + pr.pipSize * pr.spread / 2)).toFixed(d), q = Math.round((r() * 8 + 0.2) * pr.contractSize * 0.1);
    return { price, quantity: q, amount: q, size: q, total: +(price * q).toFixed(2) };
  });
  return { buyOrder: side(-1), sellOrder: side(1).reverse(), buyOrderCount: 14, sellOrderCount: 14 };
};
const trades = (sym) => { const mid = priceOf(sym), r = seed(11), d = dec(sym);
  return Array.from({ length: 20 }, (_, i) => ({ price: +(mid * (1 + (r() - 0.5) * 0.00012)).toFixed(d), quantity: Math.round((r() * 3 + 0.05) * (pairs.find((p) => p.tickerRoot === sym) || pairs[0]).contractSize * 0.1),
    Type: r() > 0.5 ? 'buy' : 'sell', createdAt: new Date(Date.now() - i * 4000).toISOString() })); };

const app = express();
app.use(cors({ origin: true, credentials: true }));
app.use(express.json({ limit: '5mb' }));
app.use('/img', express.static(path.join(path.dirname(fileURLToPath(import.meta.url)), '../web/src/assets/image')));
const base = (req) => req.path.replace(/^\/api/, '');
app.get(/\/chart\/symbols$/, (req, res) => { const t = (req.query.symbol || 'EURUSD').toUpperCase();
  const pc = pairs.find((p) => p.tickerRoot === t), ps = 10 ** (pc ? pc.quoteDecimal : 5);
  res.json({ name: t, ticker: t, description: t, exchange: 'Trevolt', pricescale: ps, minmov: 1, session: '24x5', timezone: 'Etc/UTC', type: pc && /^(XAU|XAG|USOIL)/.test(t) ? 'commodity' : t === 'US30' ? 'index' : 'forex' }); });
app.get(/\/chart\/time$/, (req, res) => res.type('text').send(String(Math.floor(Date.now() / 1000))));
app.get(/\/chart\/history$/, (req, res) => {
  const sym = (req.query.symbol || 'EURUSD').toUpperCase(), D = dec(sym), rs = req.query.resolution;
  const resMin = rs === 'D' || rs === '1D' ? 1440 : rs === 'W' || rs === '1W' ? 10080 : parseInt(rs) || 5, stepS = resMin * 60, N = 400;
  const nowEnd = Math.floor(Date.now() / 1000 / stepS) * stepS;
  const r = seed(sym.length * 13 + 5); let p = priceOf(sym) * 0.985; const t = [], o = [], h = [], l = [], c = [], v = [];
  for (let i = N - 1; i >= 0; i--) { const open = p, drift = (priceOf(sym) - p) / (i + 8), close = open + drift + (r() - 0.5) * open * 0.0012;
    t.push(nowEnd - i * stepS); o.push(+open.toFixed(D)); c.push(+close.toFixed(D)); h.push(+(Math.max(open, close) * (1 + r() * 0.0004)).toFixed(D));
    l.push(+(Math.min(open, close) * (1 - r() * 0.0004)).toFixed(D)); v.push(+(r() * 40 + 5).toFixed(2)); p = close; }
  const from = +req.query.from || 0, to = +req.query.to || Infinity;
  const idx = t.map((x, i) => i).filter((i) => t[i] >= from && t[i] <= to);
  if (!idx.length) return res.json({ s: 'no_data' });
  const pick = (a) => idx.map((i) => a[i]);
  res.json({ s: 'ok', t: pick(t), o: pick(o), h: pick(h), l: pick(l), c: pick(c), v: pick(v) });
});
app.use((req, res) => {
  const key = `${req.method} ${req.path.replace(/^\/api/, '')}`;
  const dyn = Object.entries(routes).find(([k]) => {
    const [m, pat] = k.split(' '); if (m !== req.method) return false;
    const re = new RegExp('^' + pat.replace(/:[^/]+/g, '([^/]+)') + '$'); const mm = (req.path.replace(/^\/api/, '')).match(re);
    if (mm) req.params = { id: mm[1] }; return !!mm; });
  const body = dyn ? dyn[1](req) : ok();
  console.log(dyn ? 'HIT ' : 'MISS', key);
  res.json(enc(body));
});

const server = http.createServer(app);
const io = new Server(server, { cors: { origin: true, credentials: true } });
io.on('connection', (s) => console.log('socket connected', s.id));
setInterval(() => { for (const p of pairs) {
  io.emit('FuturesorderBook', JSON.stringify({ tickerRoot: p.tickerRoot, ...book(p.tickerRoot) }));
  io.emit('FuturesrecentTrade', { tickerRoot: p.tickerRoot, data: trades(p.tickerRoot) }); } }, 3000);

// live-looking price ticks
const state = pairs.map((p) => ({ ...p }));
setInterval(() => {
  for (const p of state) {
    p.markPrice = p.marketPrice = p.lastPrice = +(p.markPrice * (1 + (Math.random() - 0.5) * 0.00015)).toFixed(p.quoteDecimal);
    io.emit('FututresPrice', { tickerRoot: p.tickerRoot, markPrice: p.markPrice, marketPrice: p.marketPrice, lastPrice: p.lastPrice, change: p.change });
  }
}, 1500);

server.listen(PORT, () => console.log(`mock api on :${PORT}`));
