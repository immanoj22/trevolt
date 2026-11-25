// Ported from web-frontend's src/lib/pairDisplay.js - same display-only USDT -> USD
// mapping for trading-pair symbols/labels shown to the user.
//
// The platform's internal/Binance quote currency stays USDT everywhere - pair
// identification, order placement, price fetching, socket subscriptions, chart
// (webview) URLs, AsyncStorage/MMKV keys, redux state, etc. all keep using
// "BNBUSDT" / "ETHUSDT" unchanged. These helpers ONLY reformat text rendered to
// a human (a label, table cell, dropdown option, modal header).
//
// Do NOT use these on any value sent back to an API, used as a socket-message
// filter key, a redux/state key, an AsyncStorage/MMKV key, or a chart/webview URL
// segment - only on rendered text.

/**
 * "BNBUSDT" -> "BNBUSD"
 * Only rewrites a trailing "USDT" (case-insensitive) - anything else (a plain
 * "USD"/"USDC" pair, an option contract code, etc.) passes through unchanged,
 * so this is safe to apply broadly to any pair/currency label.
 */
export const formatDisplayPair = (symbol: any): any => {
     if (!symbol || typeof symbol !== "string") return symbol;
    return symbol.replace(/USDT$/i, "USD");
};

/**
 * "BNBUSD" -> "BNBUSDT"
 * Inverse of formatDisplayPair - only needed where user/admin input carrying a
 * USD-labelled value has to be converted back to the internal USDT-suffixed
 * symbol before it's used for lookup/matching. A symbol that's already
 * USDT-suffixed (or doesn't end in USD at all) passes through unchanged, so
 * this is safe to call defensively.
 */
export const getInternalPair = (symbol: any): any => {
    if (!symbol || typeof symbol !== "string") return symbol;
    if (/USDT$/i.test(symbol)) return symbol;
    return symbol.replace(/USD$/i, "USDT");
};
