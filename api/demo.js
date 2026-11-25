// Fictional demo data for dashboard / trading tables.
import { pairs } from './data.js';
const P = (r) => pairs.find((p) => p.tickerRoot === r);
const ago = (m) => new Date(Date.now() - m * 60000).toISOString();
const list = (data) => ({ data, count: data.length, currentPage: 1, nextPage: false });

export const positions = list([
  { _id: 'pos1', pairId: P('EURUSD').pairId, pairName: 'EURUSD', tickerRoot: 'EURUSD', pairData: P('EURUSD'), tradeMode: 'future', positionSide: 'long',
    positionFilled: 50000, entryPrice: 1.0832, liquidityPrice: 1.0778, initialMargin: 541.6, close_price: 1.08652, pnl: 161.0, pnl_percen: 29.7,
    leverage: 100, bracketOrders: [], takeprofit: 0, stoploss: 0, accountId: 'ACC1001' },
  { _id: 'pos2', pairId: P('XAUUSD').pairId, pairName: 'XAUUSD', tickerRoot: 'XAUUSD', pairData: P('XAUUSD'), tradeMode: 'future', positionSide: 'short',
    positionFilled: 30, entryPrice: 2698.1, liquidityPrice: 2746.9, initialMargin: 1618.9, close_price: 2685.42, pnl: 380.4, pnl_percen: 23.5,
    leverage: 50, bracketOrders: [], takeprofit: 0, stoploss: 0, accountId: 'ACC1001' },
]);
const ord = (i, root, side, type, price, qty, filled, status, mins) => ({
  _id: `o${i}`, pairId: P(root).pairId, pairName: root, pairData: P(root), baseCurrency: P(root).baseCurrency, tradeMode: 'future',
  buyorsell: side, orderType: type, price, quantity: qty * P(root).contractSize, filledQuantity: filled * P(root).contractSize, exePrice: price, stopPrice: 0, status,
  orderValue: +(P(root).baseCurrency === 'USD' ? qty * P(root).contractSize : price * qty * P(root).contractSize).toFixed(2), reduce_only: false, bracketOrders: [], takeprofit: 0, stoploss: 0, fee: +(qty * 3.5).toFixed(2),
  pandl: +(((i % 3) - 0.8) * 120).toFixed(2), liquidateFee: 0, orderDate: ago(mins), createdAt: ago(mins) });
export const openOrders = list([
  ord(1, 'EURUSD', 'buy', 'limit', 1.0815, 0.5, 0, 'open', 25), ord(2, 'GBPUSD', 'sell', 'limit', 1.3005, 0.3, 0, 'open', 80), ord(3, 'USDJPY', 'buy', 'limit', 150.45, 0.4, 0, 'open', 140) ]);
export const stopOrders = list([ { ...ord(4, 'EURUSD', 'sell', 'stop_limit', 1.0778, 0.5, 0, 'open', 200), stopPrice: 1.0785 } ]);
export const orderHistory = list([
  ord(5, 'EURUSD', 'buy', 'market', 1.0832, 0.5, 0.5, 'completed', 600), ord(6, 'XAUUSD', 'sell', 'market', 2698.1, 0.3, 0.3, 'completed', 900),
  ord(7, 'GBPUSD', 'buy', 'limit', 1.2864, 0.8, 0.8, 'completed', 1500), ord(8, 'GBPUSD', 'sell', 'limit', 1.2921, 0.8, 0.8, 'completed', 1300),
  ord(9, 'AUDUSD', 'buy', 'limit', 0.6520, 1.0, 0, 'cancelled', 2000), ord(10, 'USDCHF', 'buy', 'market', 0.8851, 0.5, 0.5, 'completed', 2600) ]);
export const fills = list(orderHistory.data.filter((o) => o.status === 'completed').map((o, i) => ({
  _id: `f${i}`, filledId: `F${1000 + i}`, orderId: o._id, pairId: o.pairId, pairname: o.pairName, pairName: o.pairName, pairData: o.pairData, baseCurrency: o.baseCurrency,
  tradeMode: 'future', side: o.buyorsell, orderType: o.orderType, price: o.price, orderQty: o.quantity, filledQuantity: o.filledQuantity,
  notional: o.orderValue, fee: o.fee, isMaker: i % 2 === 0, liquidateFee: 0, created_at: o.createdAt })));
export const closed = list([
  { _id: 'c1', pairId: P('GBPUSD').pairId, pairName: 'GBPUSD', pairData: P('GBPUSD'), tradeMode: 'future', closing_direction: 'long', entryPrice: 1.2864, closePrice: 1.2921,
    quantity: 0.8 * 100000, grossPandL: 456.0, closeFee: 2.8, afterBalance: 24120.4, createdAt: ago(1300) },
  { _id: 'c2', pairId: P('USDJPY').pairId, pairName: 'USDJPY', pairData: P('USDJPY'), tradeMode: 'future', closing_direction: 'short', entryPrice: 151.88, closePrice: 151.22,
    quantity: 0.6 * 100000, grossPandL: 261.9, closeFee: 2.1, afterBalance: 23804.4, createdAt: ago(4300) },
  { _id: 'c3', pairId: P('USDCAD').pairId, pairName: 'USDCAD', pairData: P('USDCAD'), tradeMode: 'future', closing_direction: 'long', entryPrice: 1.384, closePrice: 1.3811,
    quantity: 1.0 * 100000, grossPandL: -210.0, closeFee: 3.5, afterBalance: 23753.6, createdAt: ago(7200) } ]);

export const userExtra = {
  accountName: 'Main Account', userGreenId: 'GX-204819', userName: 'alexmorgan', referralCode: 'ALEX2024', tfaStatus: true, tfaType: 'google', mobileNumber: '9000000000',
  kycPanCardStatus: 'approved', kycLiveNessStatus: 'approved', kycAadharStatus: 'approved', kycfinancialStatus: 'approved', kycMobileStatus: 'approved',
  externalKycStatus: 'approved', hideBalance: false, google: { enabled: true }, role: 'user', language: 'en', convertCurrency: 'USDT',
  profileImage: '', loginHistory: [ { ipAddress: '203.0.113.24', createdAt: ago(30), browser: 'Chrome', os: 'Linux', regionName: 'Mumbai', status: 'success' },
                                      { ipAddress: '203.0.113.24', createdAt: ago(1500), browser: 'Chrome', os: 'Linux', regionName: 'Mumbai', status: 'success' } ],
  bankAccounts: [ { _id: 'b1', bankName: 'Demo National Bank', accountNo: 'XXXXXXXX4821', ifscCode: 'DEMO0001234', holderName: 'Alex Morgan', status: 'approved' } ],
};
export const assets = list([
  { _id: 'USD', balance: 8420.5, futuresBalance: 15230.25, optionBalance: 1200.0, pip: 2 },
  { _id: 'EUR', balance: 4200, futuresBalance: 0, optionBalance: 0, pip: 2 },
  { _id: 'GBP', balance: 2850, futuresBalance: 0, optionBalance: 0, pip: 2 },
  { _id: 'XAU', balance: 3.25, futuresBalance: 0, optionBalance: 0, pip: 3 },
  { _id: 'INR', balance: 52000, futuresBalance: 0, optionBalance: 0, pip: 2 } ]);

// ---- PnL analytics, transactions, referral, misc ----
const DAY = 86400000;
const days = Array.from({ length: 30 }, (_, i) => Date.now() - (29 - i) * DAY);
let eq = 21000; const rnd = (n) => { let x = n; return () => (x = (x * 9301 + 49297) % 233280) / 233280; };
const r1 = rnd(3);
export const pnlChart = { series: [
  { name: 'Equity', data: days.map((t) => { eq += (r1() - 0.38) * 420; return [t, +eq.toFixed(2)]; }) },
  { name: 'Realized PnL', data: days.map((t, i) => [t, +(i * 38 + (r1() - 0.5) * 90).toFixed(2)]) } ] };
const cats = days.map((t) => new Date(t).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' }));
const r2 = rnd(9);
export const pnlSummary = {
  summary: { totalPnL: 3862.4, winingPercentage: 64.3, profit: 5120.8, loss: 1258.4, count: 148, volume: 412500.0, fee: 206.3 },
  charts: {
    profitChart: { categories: cats, series: [{ name: 'Realized PnL', data: cats.map(() => +((r2() - 0.35) * 380).toFixed(2)) }] },
    volumeChart: { categories: cats, series: [{ name: 'Volume', data: cats.map(() => +(r2() * 24000 + 3000).toFixed(2)) }] },
    feeChart: { categories: cats, series: [{ name: 'Fee', data: cats.map(() => +(r2() * 14 + 2).toFixed(2)) }] },
  } };
export const transactions = list(['credit', 'debit', 'credit', 'credit', 'debit', 'credit', 'debit', 'credit'].map((t, i) => ({
  _id: `t${i}`, currencyId: ['USD', 'USD', 'EUR', 'INR', 'USD', 'GBP', 'USD', 'USD'][i], transferType: t, status: i === 4 ? 'pending' : 'completed',
  transactionAmount: [1500, 400, 500, 25000, 250, 300, 800, 3000][i], finalAmount: [1500, 400, 500, 25000, 250, 300, 800, 3000][i],
  updatedAt: new Date(Date.now() - i * 1.7 * DAY).toISOString(), createdAt: new Date(Date.now() - i * 1.7 * DAY).toISOString() })));
export const referral = list([{ refferUnQualifiedCount: 3, refferQualifiedCount: 9, refferCount: 12, amount: 342.5 }]);
export const referralTx = list(Array.from({ length: 6 }, (_, i) => ({ _id: `r${i}`, childUserName: `us***${i}@demo.com`, amount: +(8 + i * 5.3).toFixed(2), currencySymbol: 'USD',
  transferType: i % 2 ? 'Forex Trade' : 'Registration', createdAt: new Date(Date.now() - i * 2.4 * DAY).toISOString(), status: 'completed' })));
export const apiKeys = { data: [ { _id: 'k1', name: 'Trading Bot', apiKey: 'demo_live_7f3a9c21b04e', permissions: ['read', 'trade'], ipRestriction: '203.0.113.24',
  status: 'active', createdAt: new Date(Date.now() - 20 * DAY).toISOString() } ], count: 1 };
export const subAccounts = [ { _id: 's0', accountId: 'ACC1001', accountName: 'Main Account', marginMode: 'cross', isPrimary: true, email: 'alex@demo.com', status: 'active', balance: 24850.75 },
  { _id: 's1', accountId: 'ACC1002', accountName: 'Scalping', marginMode: 'cross', isPrimary: false, name: 'Scalping', email: 'scalp@demo.com', status: 'active', balance: 5200.0, createdAt: new Date(Date.now() - 40 * DAY).toISOString() },
                              { _id: 's2', accountId: 'ACC1003', accountName: 'Long term', marginMode: 'portfolio', isPrimary: false, name: 'Long term', email: 'hold@demo.com', status: 'active', balance: 12800.0, createdAt: new Date(Date.now() - 55 * DAY).toISOString() } ];

const strat = (i, name, desc, pnl, roi, cop) => ({ _id: `st${i}`, name, description: desc, userId: `trader${i}`, profileImage: '', status: 'active',
  curCopier: cop, copiersId: [], copier: [], copierDetails: [], copyTraderPnlDetails: [],
  stradegyDetails: [{ totalPnl: pnl, totalRoi: roi, winRate: 60 + i * 3, maxDrawdown: 4 + i }], createdAt: new Date(Date.now() - (30 + i * 9) * DAY).toISOString() });
export const strategies = [
  strat(1, 'Momentum Master', 'Trend-following on EURUSD and GBPUSD with tight risk limits.', 4820.5, 38.4, 214),
  strat(2, 'Steady Scalper', 'High-frequency scalping on liquid FX majors, small and consistent gains.', 2310.2, 21.7, 168),
  strat(3, 'Swing Sage', 'Multi-day swing trades on FX majors and gold using support and resistance.', 6105.9, 52.1, 342),
  strat(4, 'Alpha Hedge', 'Hedged positions across AUDUSD, USDCAD and USDCHF.', 1280.4, 12.9, 97),
  strat(5, 'Breakout Pro', 'Volatility breakout system with trailing stops.', 3550.0, 29.6, 156),
  strat(6, 'Calm Compounder', 'Low-leverage compounding strategy focused on drawdown control.', 940.8, 9.8, 71),
];
