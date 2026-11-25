// Fictional demo data for dashboard / trading tables.
const ago = (m) => new Date(Date.now() - m * 60000).toISOString();
const list = (data) => ({ data, count: data.length, currentPage: 1, nextPage: false });

export const userExtra = {
  accountName: 'Main Account', userGreenId: 'GX-204819', userName: 'alexmorgan', referralCode: 'ALEX2024', tfaStatus: true, tfaType: 'google', mobileNumber: '9000000000',
  kycPanCardStatus: 'approved', kycLiveNessStatus: 'approved', kycAadharStatus: 'approved', kycfinancialStatus: 'approved', kycMobileStatus: 'approved',
  externalKycStatus: 'approved', hideBalance: false, google: { enabled: true }, role: 'user', language: 'en', convertCurrency: 'USDT',
  profileImage: '', loginHistory: [ { ipAddress: '203.0.113.24', createdAt: ago(30), browser: 'Chrome', os: 'Linux', regionName: 'Mumbai', status: 'success' },
                                      { ipAddress: '203.0.113.24', createdAt: ago(1500), browser: 'Chrome', os: 'Linux', regionName: 'Mumbai', status: 'success' } ],
  bankAccounts: [ { _id: 'b1', bankName: 'Demo National Bank', accountNo: 'XXXXXXXX4821', ifscCode: 'DEMO0001234', holderName: 'Alex Morgan', status: 'approved' } ],
};
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
