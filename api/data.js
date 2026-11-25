// All data here is fictional demo data.
// [root, base, quote, price, change%, decimals, maxLeverage, contractSize, spreadPips, pipSize, minLot]
const mk = (root, base, quote, price, chg, dec, lev, cs, spread, pip, i) => ({
  _id: `pair${i}`, pairId: `pair${i}`, tickerRoot: root, pairName: root, status: 'active',
  baseCurrency: base, quoteCurrency: quote, firstCurrency: base, secondCurrency: quote,
  markPrice: price, marketPrice: price, lastPrice: price, indexPrice: price,
  change: chg, priceChange: chg, changePrice: +(price * chg / 100).toFixed(dec),
  high: +(price * 1.006).toFixed(dec), low: +(price * 0.994).toFixed(dec),
  volume: Math.round(48000 / (i + 1)), turnover: Math.round(5e9 / (i + 1)),
  fundingRate: 0, swapLong: -4.2, swapShort: 1.1, spread, pipSize: pip, contractSize: cs, tickSize: +(10 ** -dec).toFixed(dec), minQuantity: +(cs * 0.01).toFixed(2), maxLeverage: lev,
  leverage: lev, contractType: 'cfd', precision: dec, session: '24x5',
  minAmount: +(cs * 0.01).toFixed(2), maxAmount: cs * 50, baseDecimal: cs * 0.01 >= 1 ? 0 : 1, lotUnits: cs * 0.01, quoteDecimal: dec, feePrec: 2, takerFee: 0.005, makerFee: 0.002,
  maintenanceMargin: +(100 / lev / 2).toFixed(2), initialMargin: +(100 / lev).toFixed(2), max: lev, profitCurrency: 'USD', tradeMode: 'future', underlyingPrice: price,
});
export const pairs = [
  mk('EURUSD', 'EUR', 'USD', 1.08652, 0.21, 5, 100, 100000, 0.6, 0.0001, 0), mk('GBPUSD', 'GBP', 'USD', 1.29438, -0.14, 5, 100, 100000, 0.9, 0.0001, 1),
  mk('USDJPY', 'USD', 'JPY', 151.324, 0.38, 3, 100, 100000, 0.8, 0.01, 2), mk('AUDUSD', 'AUD', 'USD', 0.65824, -0.32, 5, 100, 100000, 0.9, 0.0001, 3),
  mk('USDCAD', 'USD', 'CAD', 1.38152, 0.09, 5, 100, 100000, 1.1, 0.0001, 4), mk('USDCHF', 'USD', 'CHF', 0.88417, -0.18, 5, 100, 100000, 1.0, 0.0001, 5),
  mk('XAUUSD', 'XAU', 'USD', 2685.42, 0.87, 2, 50, 100, 2.5, 0.1, 6), mk('XAGUSD', 'XAG', 'USD', 31.254, 1.42, 3, 50, 5000, 3.0, 0.01, 7),
  mk('USOIL', 'OIL', 'USD', 71.86, -1.05, 2, 20, 1000, 3.0, 0.01, 8), mk('US30', 'US30', 'USD', 43250.4, 0.46, 2, 20, 10, 2.0, 1, 9),
];
export const user = {
  _id: 'user1', userId: 'user1', accountId: 'ACC1001', secretKey: 'demo',
  firstName: 'Alex', lastName: 'Morgan', name: 'Alex Morgan', email: 'alex@demo.com',
  mobileNo: '9000000000', countryCode: '+91', kycStatus: 'approved', marginMode: 'cross',
  userType: 'user', status: 'active', emailStatus: 'verified', mobileStatus: 'verified',
  twoFAStatus: 'enabled', theme: 'dark', isDemo: true,
};
export const wallet = {
  accountId: 'ACC1001', walletBalance: 24850.75, availableBalance: 21320.4, tradingBalance: 24850.75,
  freezeBalance: 3530.35, unRealizedPnL: 0, totalMargin: 3530.35, currency: 'USD',
};
export const conversion = [
  { pair: 'EURUSD', price: 1.08652, currency: 'EUR' }, { pair: 'GBPUSD', price: 1.29438, currency: 'GBP' },
  { pair: 'XAUUSD', price: 2685.42, currency: 'XAU' }, { pair: 'USDUSD', price: 1, currency: 'USD' },
  { pair: 'USDINR', price: 84.2, currency: 'USD' }, { pair: 'USDTINR', price: 84.2, currency: 'USD' },
];
