// src/lib/pairDisplay.js
//
// Display-only USDT -> USD mapping for trading-pair symbols shown to users.
//
// The platform's internal/Binance quote currency remains USDT everywhere —
// pair identification, order placement, price fetching, WebSocket
// subscriptions, TradingView chart symbols, database records, etc. all keep
// using "BNBUSDT" / "ETHUSDT" unchanged. This utility ONLY reformats the
// text shown to a human in a table, dropdown, chart title, or label.
//
// Do NOT use these on any value that gets sent back to an API, used as a
// Redux/React key, passed to a TradingView widget, or used to build a
// Binance REST/WebSocket symbol — only on rendered text.

/**
 * "BNBUSDT" -> "BNBUSD"
 * Only rewrites a trailing "USDT" (case-insensitive) — anything else
 * (a plain "USD" pair, an option contract code, etc.) passes through
 * unchanged, so this is safe to apply broadly to any pair/currency label.
 */
export const formatDisplayPair = (symbol) => {
    if (!symbol || typeof symbol !== 'string') return symbol;
    return symbol.replace(/USDT$/i, 'USD');
};

/**
 * "BNBUSD" -> "BNBUSDT"
 * Inverse of formatDisplayPair — only needed where a user/admin might type
 * or select a USD-labelled value that has to be converted back to the
 * internal USDT-suffixed symbol before it's used for lookup/matching.
 * A symbol that's already USDT-suffixed (or doesn't end in USD at all)
 * passes through unchanged, so this is safe to call defensively.
 */
export const getInternalPair = (symbol) => {
    if (!symbol || typeof symbol !== 'string') return symbol;
    if (/USDT$/i.test(symbol)) return symbol;
    return symbol.replace(/USD$/i, 'USDT');
};
