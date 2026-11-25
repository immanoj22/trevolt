/**
 * CustomDatafeed.js
 *
 * Production-ready TradingView Charting Library datafeed for Trevolt.
 *
 * Implements the full Datafeed API:
 *   onReady → resolveSymbol → getBars → subscribeBars → unsubscribeBars
 *
 * Real-time updates arrive via Socket.IO 'klineUpdate' events from the backend
 * (KlineWsHandler.js), which relays Binance kline WebSocket data.
 *
 * Usage:
 *   import { createDatafeed } from './CustomDatafeed';
 *   const datafeed = createDatafeed({ apiBase, socket, tradeType: 'futures' });
 */

import { formatDisplayPair } from '../../../lib/pairDisplay';

// ─── Constants ────────────────────────────────────────────────────────────────

const SUPPORTED_RESOLUTIONS = ['1', '5', '15', '30', '60', '240', '1D', '1W', '1M'];

const CONFIGURATION = {
    supported_resolutions: SUPPORTED_RESOLUTIONS,
    supports_search: true,
    supports_group_request: false,
    supports_marks: false,
    supports_timescale_marks: false,
    supports_time: true,
    exchanges: [
        { value: '', name: 'All Exchanges', desc: '' },
        { value: 'Trevolt', name: 'Trevolt', desc: 'Trevolt' },
    ],
    symbols_types: [
        { name: 'All types', value: '' },
        { name: 'Forex', value: 'forex' },
    ],
};

/**
 * Map TradingView resolution to Binance kline interval string.
 * Must match the backend resolutionToInterval() in KlineWsHandler.js.
 */
function resolutionToInterval(resolution) {
    const map = {
        '1': '1m',
        '5': '5m',
        '15': '15m',
        '30': '30m',
        '60': '1h',
        '240': '4h',
        '1D': '1d',
        '1W': '1w',
        '1M': '1M',
    };
    return map[resolution] || '1m';
}

/**
 * Build the stream key matching backend: `btcusdt@kline_1m`
 */
function streamKey(symbol, resolution) {
    return `${symbol.toLowerCase()}@kline_${resolutionToInterval(resolution)}`;
}

// ─── Factory ─────────────────────────────────────────────────────────────────

/**
 * @param {object} options
 * @param {string}          options.apiBase    - e.g. "http://localhost:5000/api/v1"
 * @param {Socket}          options.socket     - socket.io-client instance (already connected)
 * @param {'future'|'option'} [options.tradeType] - defaults to 'future'
 */
export function createDatafeed({ apiBase, socket, tradeType = 'future' }) {
    // Map of subscriptionUid → { symbol, resolution, handler }
    const subscriptions = new Map();
    // Symbol info cache  symbol → resolvedInfo
    const symbolCache = new Map();

    const state = {
        quotes: new Map(),        // symbol -> { lp, ask, bid }
        barSubscribers: new Map(),
        quoteSubscribers: new Map(),
    };

    // Global klineUpdate listener (single listener, dispatches to subscriptions)
    let klineListenerAttached = false;

    function _ensureKlineListener() {
        if (klineListenerAttached || !socket) return;
        klineListenerAttached = true;

        socket.on('klineUpdate', ({ key, bar }) => {
            for (const [, sub] of subscriptions) {
                const subKey = streamKey(sub.symbol, sub.resolution);
                if (subKey !== key) continue;

                const lastBar = sub.lastBar;

                if (lastBar && bar.time === lastBar.time) {
                    // Same candle — update in-place (high/low/close/volume only)
                    const updated = {
                        ...lastBar,
                        high: Math.max(lastBar.high, bar.high),
                        low: Math.min(lastBar.low, bar.low),
                        close: bar.close,
                        volume: bar.volume,
                    };
                    sub.lastBar = updated;
                    sub.onRealtimeCallback(updated);
                } else if (!lastBar || bar.time > lastBar.time) {
                    // New candle
                    sub.lastBar = { ...bar };
                    sub.onRealtimeCallback({ ...bar });
                }
                // bar.time < lastBar.time → stale data from reconnect, skip
            }
        });

        socket.on('disconnect', () => {
            // Socket.IO auto-reconnects; subscriptions are preserved on frontend.
            // Backend kline streams will be re-subscribed on reconnect.
        });

        socket.on('connect', () => {
            // Re-subscribe all active streams after reconnect
            for (const [, sub] of subscriptions) {
                socket.emit('subscribeKline', { symbol: sub.symbol, resolution: sub.resolution });
            }
        });
    }

    // ── Quotes (lp / ask / bid) ──────────────────────────────────────────────
    // Per TradingView's docs, `lp` (last price) is required, and `ask`/`bid`
    // are what the chart's native Buy/Sell buttons (Legend) actually display:
    // https://www.tradingview.com/charting-library-docs/latest/connecting_data/datafeed-api/required-methods#getquotes
    // "lp ... Required for the Order Ticket, Depth of Market, Buy/Sell
    //  buttons, and Details and Watchlist widgets."
    // "ask ... displayed in the Order Ticket and Buy/Sell buttons."
    // "bid ... displayed in the Order Ticket and Buy/Sell buttons."
    //
    // Both socket events below are the exact same real-time streams the rest
    // of the app already trusts for this pair's price (OrderBook.jsx /
    // TradeActionCard.jsx use 'FuturesorderBook' for best bid/ask;
    // RecentTrades.jsx uses 'FuturesrecentTrade' for the last traded price) —
    // reusing them here keeps the chart's buttons consistent with the order
    // book and recent trades panels instead of inventing a separate feed.
    let quoteListenersAttached = false;
    // Keep the exact function references so `destroy()` can remove only
    // *this* datafeed's listeners — `FuturesorderBook` / `FuturesrecentTrade`
    // are the same shared socket instance's events that OrderBook.jsx,
    // TradeActionCard.jsx, and RecentTrades.jsx also listen to, so an
    // unqualified `socket.off('FuturesorderBook')` (no handler arg) would
    // wipe out their listeners too, not just this one.
    let orderBookQuoteHandler = null;
    let recentTradeQuoteHandler = null;

    function _safeParse(raw) {
        if (raw && typeof raw === 'object') return raw;
        try { return JSON.parse(raw); } catch { return null; }
    }

    /**
     * Ask/bid with a same-value last-price fallback.
     *
     * Why this matters: TradingView's own quotesSnapshot() (used to build the
     * "+" quick-order context menu and Buy/Sell buttons) subscribes to our
     * quotes feed and waits for a callback where `ask || bid` is truthy —
     * confirmed straight from the bundled charting_library runtime — then
     * gives up after a hard 10-second timeout ("quotesSnapshot not
     * received"). Pushing `ask: 0, bid: 0` when we only know the last traded
     * price (no order-book tick yet) is falsy, so it never satisfies that
     * check and sits waiting the full 10s. Falling back to `lp` for
     * whichever side isn't known yet keeps the value genuinely truthy the
     * instant ANY price is known, while still using the real, distinct
     * ask/bid the moment an actual order-book tick arrives.
     */
    function _effectiveAskBid(next) {
        const ask = next.ask ?? next.bid ?? next.lp ?? 0;
        const bid = next.bid ?? next.ask ?? next.lp ?? 0;
        return { ask, bid };
    }

    /** Merge a partial quote update into state.quotes and notify subscribers. */
    function _pushQuote(symbol, patch) {
        if (!symbol) return;
        const key = String(symbol).toUpperCase();
        const prev = state.quotes.get(key) || {};
        const next = { ...prev, ...patch };
        state.quotes.set(key, next);
        const { ask, bid } = _effectiveAskBid(next);

        for (const [, sub] of state.quoteSubscribers) {
            if (!sub.symbols.some((s) => String(s).toUpperCase() === key)) continue;
            sub.callback([{
                s: 'ok',
                n: key,
                v: {
                    short_name: formatDisplayPair(key),
                    exchange: 'Custom',
                    lp: next.lp ?? 0,
                    ask,
                    bid,
                    ch: 0,
                    chp: 0,
                },
            }]);
        }
    }

    function _ensureQuoteListeners() {
        if (quoteListenersAttached || !socket) return;
        quoteListenersAttached = true;

        // Best bid/ask — same event OrderBook.jsx / TradeActionCard.jsx subscribe to.
        orderBookQuoteHandler = (raw) => {
            const result = _safeParse(raw);
            if (!result?.tickerRoot) return;
            const bid = Number(result.buyOrder?.[0]?._id);
            const ask = Number(result.sellOrder?.[0]?._id);
            const patch = {};
            if (Number.isFinite(bid)) patch.bid = bid;
            if (Number.isFinite(ask)) patch.ask = ask;
            if (Object.keys(patch).length) _pushQuote(result.tickerRoot, patch);
        };
        socket.on('FuturesorderBook', orderBookQuoteHandler);

        // Last traded price — same event RecentTrades.jsx subscribes to.
        recentTradeQuoteHandler = (raw) => {
            const result = _safeParse(raw);
            const lastTrade = result?.data?.[0];
            const lp = Number(lastTrade?.price);
            if (result?.tickerRoot && Number.isFinite(lp)) {
                _pushQuote(result.tickerRoot, { lp });
            }
        };
        socket.on('FuturesrecentTrade', recentTradeQuoteHandler);
    }

    // ── Datafeed API ─────────────────────────────────────────────────────────

    const datafeed = {

        /**
         * Called once when the chart is initialised.
         * Must call onReadyCallback with the configuration object.
         */
        onReady(onReadyCallback) {
            _ensureQuoteListeners();
            setTimeout(() => onReadyCallback(CONFIGURATION), 0);
        },

        /**
         * Called for symbol search (search bar in the chart header).
         */
        async searchSymbols(userInput, exchange, symbolType, onResultReadyCallback) {
            try {
                const url = new URL(`${apiBase}/chart/search`);
                url.searchParams.set('query', userInput || '');
                url.searchParams.set('type', symbolType || '');
                url.searchParams.set('exchange', exchange || '');
                url.searchParams.set('limit', '30');

                const res = await fetch(url.toString());
                const data = await res.json();
                const results = Array.isArray(data) ? data.map((item) => ({
                    ...item,
                    symbol: formatDisplayPair(item.symbol),
                    description: formatDisplayPair(item.description),
                })) : [];
                onResultReadyCallback(results);
            } catch (e) {
                onResultReadyCallback([]);
            }
        },

        /**
         * Called when the chart needs full symbol metadata.
         * CRITICAL: pricescale, session, timezone must be correct.
         */
        resolveSymbol(symbolName, onSymbolResolvedCallback, onResolveErrorCallback) {
            const cached = symbolCache.get(symbolName.toUpperCase());
            if (cached) {
                setTimeout(() => onSymbolResolvedCallback(cached), 0);
                return;
            }

            const url = new URL(`${apiBase}/chart/symbols`);
            url.searchParams.set('symbol', symbolName);

            fetch(url.toString())
                .then(r => r.json())
                .then(info => {
                    if (!info || info.s === 'error') {
                        // Fallback — never leave the chart in an infinite spinner
                        const fallback = _buildFallbackSymbol(symbolName);
                        symbolCache.set(symbolName.toUpperCase(), fallback);
                        onSymbolResolvedCallback(fallback);
                        return;
                    }

                    // Ensure mandatory trade fields are correct.
                    // `ticker` stays the real Binance-style symbol ("BNBUSDT")
                    // — getBars()/subscribeBars() below key off `.ticker`
                    // first, so history/live-update requests are unaffected.
                    // `name`/`description` are what the chart actually
                    // renders in its header, so those are display-mapped to
                    // "BNBUSD" here — cosmetic only, no data path uses them.
                    const symbolInfo = {
                        ...info,
                        name: formatDisplayPair(info.ticker || symbolName.toUpperCase()),
                        ticker: info.ticker || symbolName.toUpperCase(),
                        description: formatDisplayPair(info.description || symbolName),
                        type: 'forex',
                        session: '24x7',
                        timezone: 'Etc/UTC',
                        exchange: info.exchange || 'Trevolt',
                        listed_exchange: info.exchange || 'Trevolt',
                        has_intraday: true,
                        has_daily: true,
                        has_weekly_and_monthly: true,
                        supported_resolutions: SUPPORTED_RESOLUTIONS,
                        pricescale: info.pricescale || 100,
                        minmov: info.minmov || 1,
                        minmov2: 0,
                        volume_precision: 3,
                        format: 'price',
                        // Explicit modern field — avoids the library falling back to the
                        // deprecated has_no_volume default (and its console warning).
                        // We do supply volume in bars, so declare full OHLCV.
                        visible_plots_set: 'ohlcv',
                    };

                    symbolCache.set(symbolName.toUpperCase(), symbolInfo);
                    onSymbolResolvedCallback(symbolInfo);
                })
                .catch(err => {
                    const fallback = _buildFallbackSymbol(symbolName);
                    symbolCache.set(symbolName.toUpperCase(), fallback);
                    onSymbolResolvedCallback(fallback);
                });
        },

        /**
         * Called to fetch historical OHLCV bars.
         * `from` and `to` are Unix timestamps in seconds.
         *
         * IMPORTANT:
         *   - Return { noData: true } (not an error) when there is no older data.
         *   - TradingView will call this repeatedly paging backwards until noData.
         *   - Never call onHistoryCallback with an empty array without noData — it causes an infinite loop.
         */
        getBars(symbolInfo, resolution, periodParams, onHistoryCallback, onErrorCallback) {
            const { from, to, firstDataRequest } = periodParams;
            const symbol = (symbolInfo.ticker || symbolInfo.name || '').replace(/^MARK:/i, '');

            const url = new URL(`${apiBase}/chart/history`);
            url.searchParams.set('symbol', symbol);
            url.searchParams.set('resolution', resolution);
            url.searchParams.set('from', String(from));
            url.searchParams.set('to', String(to));

            fetch(url.toString())
                .then(r => r.json())
                .then(data => {
                    // s === 'no_data' means no candles for this period (not an error)
                    if (!data || data.s === 'no_data' || !data.t || data.t.length === 0) {
                        onHistoryCallback([], { noData: true, nextTime: data?.nextTime });
                        return;
                    }

                    if (data.s === 'error') {
                        onErrorCallback(data.errmsg || 'Datafeed error');
                        return;
                    }

                    // Build TradingView bar array
                    const bars = data.t.map((time, i) => ({
                        time: time * 1000, // TV expects milliseconds
                        open: parseFloat(data.o[i]),
                        high: parseFloat(data.h[i]),
                        low: parseFloat(data.l[i]),
                        close: parseFloat(data.c[i]),
                        volume: parseFloat(data.v[i]) || 0,
                    }));

                    // Deduplicate — guard against server sending overlapping candles
                    const unique = _dedupeBars(bars);

                    // Seed a fallback last-price the moment we know it, from
                    // the most recent historical bar — before any live
                    // order-book/trade tick has necessarily arrived yet. See
                    // _effectiveAskBid()/_pushQuote() for why this matters:
                    // without ANY cached price, quotesSnapshot() has nothing
                    // to fall back to and sits on its 10-second timeout
                    // regardless. Only seeds if we don't already have a live
                    // price for this symbol, and only from the initial
                    // (most-recent) request — never from a scroll-back
                    // history fetch, and never overwrites a fresher real tick.
                    if (firstDataRequest && unique.length) {
                        const key = symbol.toUpperCase();
                        if (!state.quotes.get(key)?.lp) {
                            _pushQuote(key, { lp: unique[unique.length - 1].close });
                        }
                    }

                    onHistoryCallback(unique, { noData: unique.length === 0 });
                })
                .catch(err => {
                    onErrorCallback(err.message || 'Network error');
                });
        },

        /**
         * Called when the chart starts watching a symbol for real-time updates.
         * subscriberUID is a unique string per chart/symbol/resolution combination.
         */
        subscribeBars(symbolInfo, resolution, onRealtimeCallback, subscriberUID, onResetCacheNeededCallback) {
            if (subscriptions.has(subscriberUID)) return; // prevent duplicate subscriptions

            const symbol = (symbolInfo.ticker || symbolInfo.name || '').replace(/^MARK:/i, '').toUpperCase();

            const sub = {
                symbol,
                resolution,
                onRealtimeCallback,
                onResetCacheNeededCallback,
                lastBar: null,
            };

            subscriptions.set(subscriberUID, sub);

            _ensureKlineListener();

            if (socket?.connected) {
                // socket.emit('subscribeKline', { symbol, resolution });
            }

        },

        /**
         * Called when the chart stops watching a symbol (symbol change, tab close, etc.)
         */
        unsubscribeBars(subscriberUID) {
            const sub = subscriptions.get(subscriberUID);
            if (!sub) return;

            subscriptions.delete(subscriberUID);

            // Only unsubscribe the backend stream if no other subscriber needs it
            const stillNeeded = [...subscriptions.values()].some(
                s => s.symbol === sub.symbol && s.resolution === sub.resolution
            );

            if (!stillNeeded && socket?.connected) {
                // socket.emit('unsubscribeKline', { symbol: sub.symbol, resolution: sub.resolution });
            }

        },

        getQuotes(symbols, onDataCallback) {
            const result = symbols.map(symbol => {
                const q = state.quotes.get(String(symbol).toUpperCase()) || {};
                const { ask, bid } = _effectiveAskBid(q);

                return {
                    s: "ok",
                    n: symbol,
                    v: {
                        short_name: formatDisplayPair(symbol),
                        exchange: "Custom",
                        lp: q?.lp ?? 0,     // LAST PRICE (MANDATORY)
                        ask,
                        bid,
                        ch: 0,
                        chp: 0,
                    }
                };
            });

            onDataCallback(result);
        },


        subscribeQuotes(symbols, fastSymbols, onRealtimeCallback, listenerGUID) {
            _ensureQuoteListeners();
            const allSymbols = [...symbols, ...fastSymbols];

            state.quoteSubscribers.set(listenerGUID, {
                symbols: allSymbols,
                callback: onRealtimeCallback,
            });

            // Push whatever we already have cached immediately, instead of
            // leaving the buttons at 0 until the next order-book/trade tick.
            // Using a real (non-zero) ask/bid here specifically — not just
            // "whatever we have" — matters a lot: this synchronous push is
            // what TradingView's quotesSnapshot() (which builds the "+"
            // quick-order context menu and Buy/Sell buttons) is waiting on.
            // Per the bundled charting_library runtime, quotesSnapshot only
            // resolves once it sees a callback where `ask || bid` is truthy,
            // and otherwise sits on a hard 10-second timeout. Pushing 0/0
            // here (falsy) when only a last price is known was exactly why
            // that menu took "more than 10 seconds" to open.
            const cached = allSymbols
                .map((symbol) => {
                    const q = state.quotes.get(String(symbol).toUpperCase());
                    if (!q) return null;
                    const { ask, bid } = _effectiveAskBid(q);
                    return {
                        s: 'ok',
                        n: symbol,
                        v: {
                            short_name: formatDisplayPair(symbol),
                            exchange: 'Custom',
                            lp: q.lp ?? 0,
                            ask,
                            bid,
                            ch: 0,
                            chp: 0,
                        },
                    };
                })
                .filter(Boolean);
            if (cached.length) onRealtimeCallback(cached);
        },

        unsubscribeQuotes(listenerGUID) {
            state.quoteSubscribers.delete(listenerGUID);
        },

        /**
         * Optional — called by the chart to sync server time and detect client drift.
         */
        getServerTime(callback) {
            fetch(`${apiBase}/chart/time`)
                .then(r => r.text())
                .then(t => {
                    const serverSec = parseInt(t, 10);
                    if (Number.isFinite(serverSec)) callback(serverSec);
                })
                .catch(() => { }); // non-critical
        },

        // ── Cleanup ────────────────────────────────────────────────────────
        destroy() {
            for (const [, sub] of subscriptions) {
                if (socket?.connected) {
                    socket.emit('unsubscribeKline', { symbol: sub.symbol, resolution: sub.resolution });
                }
            }
            subscriptions.clear();
            state.quoteSubscribers.clear();
            if (socket) {
                socket.off('klineUpdate');
                // Precise handler refs only — 'FuturesorderBook' /
                // 'FuturesrecentTrade' are shared socket events other
                // components (OrderBook.jsx, TradeActionCard.jsx,
                // RecentTrades.jsx) also listen to; an unqualified
                // socket.off(event) with no handler would remove theirs too.
                if (orderBookQuoteHandler) socket.off('FuturesorderBook', orderBookQuoteHandler);
                if (recentTradeQuoteHandler) socket.off('FuturesrecentTrade', recentTradeQuoteHandler);
            }
            klineListenerAttached = false;
            quoteListenersAttached = false;
            orderBookQuoteHandler = null;
            recentTradeQuoteHandler = null;
        },
    };

    return datafeed;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function _buildFallbackSymbol(symbolName) {
    const name = symbolName.toUpperCase().replace(/^MARK:/i, '');
    return {
        name: formatDisplayPair(name),
        ticker: name,
        description: formatDisplayPair(name),
        type: 'forex',
        session: '24x7',
        timezone: 'Etc/UTC',
        exchange: 'Trevolt',
        listed_exchange: 'Trevolt',
        has_intraday: true,
        has_daily: true,
        has_weekly_and_monthly: true,
        supported_resolutions: SUPPORTED_RESOLUTIONS,
        pricescale: 100,
        minmov: 1,
        minmov2: 0,
        volume_precision: 3,
        format: 'price',
    };
}

/**
 * Remove duplicate candles (same timestamp).
 * Keeps the last occurrence (most up-to-date close).
 */
function _dedupeBars(bars) {
    const seen = new Map();
    for (const bar of bars) {
        seen.set(bar.time, bar);
    }
    return [...seen.values()].sort((a, b) => a.time - b.time);
}