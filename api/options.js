// Fictional options chain: underlyings -> expiries -> strikes with call/put contracts.
import { pairs } from './data.js';
const MON = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const DAY = 86400000;
const fmt = (d) => `${String(d.getUTCDate()).padStart(2, '0')}${MON[d.getUTCMonth()]}${String(d.getUTCFullYear()).slice(2)}`;
const expiries = [2, 9, 30].map((n) => { const d = new Date(Date.now() + n * DAY); d.setUTCHours(8, 0, 0, 0); return { date: d, str: fmt(d) }; });
const norm = (x) => 0.5 * (1 + Math.tanh(0.7978845608 * (x + 0.044715 * x ** 3)));
const bs = (S, K, T, iv, call) => { const sd = iv * Math.sqrt(T), d1 = (Math.log(S / K) + 0.5 * iv * iv * T) / sd, d2 = d1 - sd;
  const c = S * norm(d1) - K * norm(d2); return { price: Math.max(call ? c : c - S + K, S * 0.00004), delta: call ? norm(d1) : norm(d1) - 1, d1, sd }; };
const rnd = (n) => { let x = n; return () => (x = (x * 9301 + 49297) % 233280) / 233280; };

const CFG = { EURUSD: { step: 0.005, dec: 4, iv: 0.08 }, GBPUSD: { step: 0.005, dec: 4, iv: 0.09 }, XAUUSD: { step: 25, dec: 2, iv: 0.15 } };
export const underlyings = ['EURUSD', 'GBPUSD', 'XAUUSD'].map((sym, i) => {
  const p = pairs.find((q) => q.tickerRoot === sym);
  return { _id: `und${i}`, symbol: sym, underlyingAsset: sym, status: 'active', marketPrice: p.marketPrice, markPrice: p.marketPrice, indexPrice: p.marketPrice,
    change: p.change, baseCurrency: p.baseCurrency, quoteCurrency: 'USD', image: '',
    options: expiries.map((e) => ({ _id: e.str, expiryDateStr: e.str, expiryDate: e.date.toISOString() })) };
});

export const chain = (sym, expStr) => {
  const u = underlyings.find((x) => x.symbol === sym) || underlyings[0];
  const e = expiries.find((x) => x.str === expStr) || expiries[0];
  const C = CFG[u.symbol], S = u.marketPrice, step = C.step, atm = Math.round(S / step) * step, pd = C.dec;
  const T = Math.max((e.date - Date.now()) / (365 * DAY), 0.003), r = rnd(sym.length * 31 + e.str.length);
  const strikes = Array.from({ length: 15 }, (_, k) => +(atm + (k - 7) * step).toFixed(pd));
  const M = { EURUSD: 100000, GBPUSD: 100000, XAUUSD: 100 }[sym] || 1;
  const S2 = (x) => +(x * M).toFixed(2);
  const mk = (K, call) => { const iv = C.iv + Math.abs(Math.log(K / S)) * 0.5, o = bs(S, K, T, iv, call);
    const m0 = o.price, sp0 = m0 * 0.02 + 0.05 / M, gamma = +(Math.exp(-0.5 * o.d1 ** 2) / (S * o.sd * 2.5066)).toFixed(6), mid = S2(m0);
    return { _id: `${sym}${e.str}${K}${call ? 'C' : 'P'}`, pairId: `${sym}${e.str}${K}${call ? 'C' : 'P'}`, tickerRoot: `${sym}-${e.str}-${K.toFixed(pd)}-${call ? 'C' : 'P'}`, optionType: call ? 'call' : 'put',
      status: 'active', strikePrice: K, expiryDate: e.date.toISOString(), underlyingPrice: S, underlyingAsset: sym, baseCurrency: u.baseCurrency, quoteCurrency: 'USD', baseDecimal: 2, quoteDecimal: 2, strikeDecimal: pd,
      marketPrice: mid, markPrice: mid, markIV: +(iv * 100).toFixed(2), last: S2(m0 * (1 + (r() - 0.5) * 0.03)), lastPrice: mid, open: S2(m0 * 0.97),
      high: S2(m0 * 1.08), low: S2(m0 * 0.9), bid: S2(Math.max(m0 - sp0 / 2, 0.01 / M)), ask: S2(m0 + sp0 / 2), bidQty: +(r() * 3 + 0.1).toFixed(2), askQty: +(r() * 3 + 0.1).toFixed(2),
      volume: Math.round(r() * 900 + 40), openInterest: Math.round(r() * 5000 + 300), oiChangePct: +((r() - 0.4) * 9).toFixed(2), percent24Change: +((r() - 0.45) * 14).toFixed(2),
      delta: +o.delta.toFixed(3), gamma, theta: S2(-m0 * 0.012), vega: S2(S * o.sd * 0.004), minAmount: 0.01, maxAmount: 50, tickSize: 0.01, lotSize: 1, tradeMode: 'option', totalTrades: 0 }; };
  return { strikePrice: strikes.map((K) => ({ strikePrice: K })), callpair: strikes.map((K) => mk(K, true)), putpair: strikes.map((K) => mk(K, false)) };
};
