/**
 * useBrokerAdapter.js
 *
 * Wires BrokerStateManager, BrokerAdapter, REST + Socket.IO for TradingView broker_factory.
 *
 * Lifecycle fixes (remediation):
 * - Single BrokerStateManager instance via lazy ref init; no orphan `new BrokerStateManager()`.
 * - mountedRef guards async REST + delayed broker load after unmount.
 * - positionDetailsRef / walletRef for fresh data inside stable loadInitialData (valid deps).
 * - Redux positions always sync into state manager even before adapter exists; refresh when ready.
 * - brokerLoadTimerRef cleared on unmount and when broker_factory runs again.
 */

import { useEffect, useRef, useCallback } from 'react';
import { useSelector } from 'react-redux';

import { BrokerStateManager } from './BrokerStateManager';
import { BrokerAdapter } from './BrokerAdapter';
import { fetchOpenOrders, normalizeOrder, normalizePosition, fetchStopOrderBrackets, buildBracketMapFromStopOrders } from './apiWrappers';

const BROKER_LOAD_DELAY_MS = 300;
const SYMBOL_RELOAD_DEBOUNCE_MS = 200;

/** 'FuturesorderBook' arrives JSON-stringified in some call sites, plain object in others. */
function safeParseQuotePayload(raw) {
    if (raw && typeof raw === 'object') return raw;
    try { return JSON.parse(raw); } catch { return null; }
}

export function useBrokerAdapter({
    symbol,
    socket,
    secretKeyRef,
    accountIdRef,
    currentSymbolRef,
    pairIdRef,
    leverageRef,
    onClosePosition,
    onToast,
    datafeedRef,
    chartRef,
    oneClickTradeRef,
    // Guards the whole broker lifecycle (REST fetch, socket subscriptions, factory).
    // Defaults to true so existing Futures call-sites keep their exact behavior.
    // Pass `false` for chart contexts (e.g. Options) whose backend does not yet
    // support order/position/bracket management — prevents cross-module data
    // (Futures orders/positions) from leaking into that chart's order lines.
    enabled = true,
}) {
    const mountedRef = useRef(true);
    const loadingRef = useRef(false);
    const brokerLoadTimerRef = useRef(null);
    const symbolReloadTimerRef = useRef(null);

    const stateManagerRef = useRef(null);
    if (!stateManagerRef.current) {
        stateManagerRef.current = new BrokerStateManager();
    }

    const adapterRef = useRef(null);

    const { positionDetails, wallet } = useSelector((s) => s.user);
    const positionDetailsRef = useRef(positionDetails);
    const walletRef = useRef(wallet);

    const symbolRef = useRef(symbol);
    const onClosePositionRef = useRef(onClosePosition);
    const onToastRef = useRef(onToast);

    useEffect(() => { onClosePositionRef.current = onClosePosition; }, [onClosePosition]);
    useEffect(() => { onToastRef.current = onToast; }, [onToast]);
    useEffect(() => { symbolRef.current = symbol; }, [symbol]);

    useEffect(() => { positionDetailsRef.current = positionDetails; }, [positionDetails]);
    useEffect(() => { walletRef.current = wallet; }, [wallet]);

    /**
     * Reconcile any positions currently in state against a bracket map built
     * from the authoritative Stop Orders list (see buildBracketMapFromStopOrders
     * in apiWrappers.js). Only ADDS/CORRECTS takeProfit/stopLoss — never
     * removes them here, since an order actually being cancelled is handled
     * through the normal cancel-order flow, not through this reconciliation.
     * Called on initial load (page refresh) and on every Stop Orders socket
     * push, so the chart's TP/SL line self-heals independent of whatever the
     * position aggregation's own bracket join produced.
     */
    /**
     * BUG FIX: reconcileBracketsFromMap only matched against positions
     * already present in stateManagerRef.current at the moment it ran —
     * if the 'Futurestoporder' (bracket) socket push for a just-filled
     * order's TP/SL arrived even slightly before that position had been
     * registered via 'FuturesPositionOrder' (a real possibility: they're
     * two separate emits from the backend, not one atomic message), the
     * bracket data for that position was silently dropped with no retry —
     * it only ever got picked up later by loadInitialData() on a full page
     * reload, or if some later, unrelated 'Futurestoporder' push happened
     * to fire again after the position existed. That's exactly what
     * "opens as a plain order, then a few seconds later gets its TP/SL"
     * looks like from the outside.
     *
     * Fix: always remember the latest full bracket map here (not just use
     * it once), and re-apply it every time positions are (re)registered —
     * see the 'FuturesPositionOrder' handler and loadInitialData() below —
     * so whichever of the two events happens to arrive first, the other
     * one arriving afterward still completes the reconciliation
     * immediately instead of waiting for the next unrelated trigger.
     */
    const latestBracketMapRef = useRef(null);
    const reconcileBracketsFromMap = useCallback((bracketMap) => {
        if (bracketMap && bracketMap.size > 0) {
            latestBracketMapRef.current = bracketMap;
        }
        const map = latestBracketMapRef.current;
        if (!stateManagerRef.current || !map || map.size === 0) return;
        for (const pos of stateManagerRef.current.getPositions()) {
            const b = map.get(pos.id);
            if (!b) continue;
            const unchanged = pos.takeProfit === b.takeProfit
                && pos.stopLoss === b.stopLoss
                && pos.takeProfitOrderId === b.takeProfitOrderId
                && pos.stopLossOrderId === b.stopLossOrderId;
            if (unchanged) continue;
            stateManagerRef.current.upsertPosition({ ...pos, ...b });
        }
    }, []);

    const loadInitialData = useCallback(async () => {
        if (!enabled) return;
        if (!mountedRef.current) return;
        if (!secretKeyRef?.current || !stateManagerRef.current) return;
        if (loadingRef.current) return;
        loadingRef.current = true;
        // Everything below is a snapshot of state that already existed before
        // this chart instance loaded, so it must not go out on TradingView's
        // per-order delta channel — that's what made every pre-existing order
        // re-announce itself ("… order placed") on each fresh chart document.
        // See BrokerStateManager.beginHydration().
        stateManagerRef.current.beginHydration();
        try {
            const orders = await fetchOpenOrders({
                secretKey: secretKeyRef.current,
                tradeMode: 'future',
            });
            if (!mountedRef.current || !stateManagerRef.current) return;

            stateManagerRef.current.setOrders(orders);

            const positions = (positionDetailsRef.current || [])
                .filter((p) => p.positionFilled > 0)
                .map((p) => normalizePosition(p, currentSymbolRef.current));
            stateManagerRef.current.setPositions(positions);

            // Self-heal TP/SL against the authoritative Stop Orders list —
            // this is what makes a freshly-refreshed page correctly show the
            // real DB/history trigger price on the chart even if the
            // position record itself came back without one.
            const bracketMap = await fetchStopOrderBrackets({
                secretKey: secretKeyRef.current,
                tradeMode: 'future',
            });
            if (!mountedRef.current || !stateManagerRef.current) return;
            reconcileBracketsFromMap(bracketMap);

            adapterRef.current?.refresh?.();
        } catch (e) {
        } finally {
            loadingRef.current = false;
            // In `finally` because the guards above (unmounted / state manager
            // torn down) return from inside the try — the window must close on
            // every exit path, or live order updates would stay silent for the
            // rest of the session. endHydration() itself emits the one
            // 'ordersChanged' that reports the whole snapshot to TradingView.
            stateManagerRef.current?.endHydration?.();
        }
    }, [secretKeyRef, enabled, reconcileBracketsFromMap]);

    const brokerFactory = useCallback(
        (host) => {
            if (!enabled) return null;
            if (brokerLoadTimerRef.current) {
                clearTimeout(brokerLoadTimerRef.current);
                brokerLoadTimerRef.current = null;
            }

            adapterRef.current?.destroy?.();
            adapterRef.current = null;

            const sm = stateManagerRef.current;
            if (!sm) return null;

            adapterRef.current = new BrokerAdapter({
                host,
                stateManager: sm,
                secretKeyRef,
                accountIdRef,
                currentSymbolRef,
                pairIdRef,
                leverageRef,
                onClosePosition: onClosePositionRef.current,
                onToast: onToastRef.current,
                // BUG FIX: datafeedRef was accepted by this hook but never
                // forwarded to BrokerAdapter, so this._datafeeRef was always
                // undefined and symbolInfo() always fell back to generic
                // defaults (pricescale 100 / 2 decimals) instead of the
                // real per-instrument tick size — could misformat order/TP-SL
                // line prices for symbols with different precision.
                // Forwarded as the live ref object (not a dereferenced
                // snapshot) so it still resolves correctly even though the
                // real datafeed instance is only created a few lines into
                // initWidget() — after this factory closure was captured.
                datafeedRef: datafeedRef,
                chartRef,
                oneClickTradeRef,
            });

            // const proxied = new Proxy(adapterRef.current, {
            //     get(target, prop) {
            //         const val = target[prop];
            //         if (typeof val === 'function') {
            //             return function (...args) {
            //                 console.log(`%c[TV→Broker] ${String(prop)}`, 'color:#0f0;font-weight:bold', ...args);
            //                 try {
            //                     const result = val.apply(target, args);
            //                     if (result instanceof Promise) {
            //                         return result.then((data) => {
            //                             console.log(`%c[TV→Broker] success ${String(prop)}`, 'color:#0f0;font-weight:bold', JSON.stringify(data));
            //                             return data;
            //                         }).catch(err => {
            //                             console.error(`%c[TV→Broker]  ${String(prop)} THREW`, 'color:red', err);
            //                             throw err;
            //                         });
            //                     }
            //                     console.log(`%c[TV→Broker] success ${String(prop)}`, 'color:#0f0;font-weight:bold', JSON.stringify(result));
            //                     return result;
            //                 } catch (err) {
            //                     console.error(`%c[TV→Broker] ${String(prop)} THREW`, 'color:red', err);
            //                     throw err;
            //                 }
            //             };
            //         }
            //         return val;
            //     }
            // });
            // adapterRef.current = proxied

            brokerLoadTimerRef.current = setTimeout(() => {
                brokerLoadTimerRef.current = null;
                if (mountedRef.current) loadInitialData();
            }, BROKER_LOAD_DELAY_MS);

            return adapterRef.current;
        },
        [
            secretKeyRef,
            accountIdRef,
            currentSymbolRef,
            pairIdRef,
            leverageRef,
            onClosePosition,
            onToast,
            loadInitialData,
            datafeedRef,
            enabled,
            chartRef,
            oneClickTradeRef,
        ],
    );

    // Symbol change: reset broker state, then reload orders/positions from REST + refs
    useEffect(() => {
        if (!enabled || !symbol) return;

        if (symbolReloadTimerRef.current) {
            clearTimeout(symbolReloadTimerRef.current);
            symbolReloadTimerRef.current = null;
        }

        stateManagerRef.current?.reset?.();

        symbolReloadTimerRef.current = setTimeout(() => {
            symbolReloadTimerRef.current = null;
            if (mountedRef.current) loadInitialData();
        }, SYMBOL_RELOAD_DEBOUNCE_MS);

        return () => {
            if (symbolReloadTimerRef.current) {
                clearTimeout(symbolReloadTimerRef.current);
                symbolReloadTimerRef.current = null;
            }
        };
    }, [symbol, loadInitialData, enabled]);

    // Redux positions → state manager always (adapter may not exist yet on first paint)
    const lastPositionsSignatureRef = useRef('');
    useEffect(() => {
        if (!enabled || !mountedRef.current || !stateManagerRef.current) return;

        const positions = (positionDetails || [])
            .filter((p) => p.positionFilled > 0)
            .map((p) => normalizePosition(p));

        // setPositions() below unconditionally triggers a full chart-side rebuild
        // of every position/TP-SL line (positionsFullUpdate). positionDetails/wallet
        // update continuously from live PnL, which used to cause that rebuild ~every
        // second — redrawing the lines out from under an in-progress drag gesture
        // before mouseup could register, silently cancelling TP/SL drag-to-create.
        // Guard: only rebuild when something structural actually changed (qty,
        // price, side, or brackets) — PnL alone no longer triggers a redraw.
        const signature = positions
            .map((p) => `${p.id}:${p.qty}:${p.avgPrice}:${p.side}:${p.takeProfit ?? ''}:${p.stopLoss ?? ''}`)
            .sort()
            .join('|');
        if (signature === lastPositionsSignatureRef.current) return;
        lastPositionsSignatureRef.current = signature;

        stateManagerRef.current.setPositions(positions);
        // Same reasoning as the 'FuturesPositionOrder' handler above — a
        // position registered via this Redux-driven path can also arrive
        // either side of the 'Futurestoporder' bracket push, so re-apply
        // whatever bracket data is already cached right away.
        reconcileBracketsFromMap(null);
        adapterRef.current?.refresh?.();
    }, [positionDetails, wallet, enabled, reconcileBracketsFromMap]);

    // WebSocket: full open orders snapshot
    useEffect(() => {
        if (!enabled || !socket) return;

        const handleOpenOrders = ({ data }) => {
            if (!mountedRef.current || !stateManagerRef.current) return;
            // DEFENSE-IN-DEPTH: a guest/logged-out viewer must never have
            // order lines drawn on the chart. secretKeyRef.current is only
            // set once the user is authenticated, so bail out here even if
            // a backend event ever gets broadcast more widely than intended.
            if (!secretKeyRef?.current) return;
            const orders = (data || []).map((rec) => normalizeOrder(rec));
            stateManagerRef.current.setOrders(orders);
        };

        socket.on('FuturesopenOrder', handleOpenOrders);
        return () => socket.off('FuturesopenOrder', handleOpenOrders);
    }, [socket, enabled]);

    // WebSocket: order update
    useEffect(() => {
        if (!enabled || !socket) return;

        const handleOrderUpdate = ({ data }) => {
            if (!mountedRef.current || !stateManagerRef.current || !data) return;
            if (!secretKeyRef?.current) return;
            if (['completed', 'cancelled', 'filled'].includes(data.status)) {
                stateManagerRef.current.removeOrder(String(data._id));
            } else {
                stateManagerRef.current.upsertOrder(normalizeOrder(data));
            }
        };

        socket.on('FuturesOrderUpdate', handleOrderUpdate);
        return () => socket.off('FuturesOrderUpdate', handleOrderUpdate);
    }, [socket, enabled]);

    // WebSocket: position update
    //
    // BUG FIX: this used to listen for a 'FuturesPosition' event that the
    // backend never emits (verified against every Modules/**/*.js
    // socketEmitOne/socketEmit call — only 'FuturesPositionOrder' exists).
    // So this handler never fired at all, and a newly-filled order's
    // position only ever appeared once the slower Redux-mediated path
    // (positionDetails prop → the signature-diff effect above → refresh())
    // caught up, or the 500ms nudge in BrokerAdapter.placeOrder() ran —
    // which is exactly the "opens as a pending order, then a few seconds
    // later flips to a filled position" delay being reported.
    // 'FuturesPositionOrder' is the real backend event (same one
    // HelperRoutes.js listens to for Redux's positionDetails) and carries a
    // full snapshot in `data` — normalize/filter it exactly like the
    // Redux-driven effect above does, and replace wholesale via
    // setPositions, mirroring how the 'FuturesopenOrder' snapshot handler
    // below already works.
    useEffect(() => {
        if (!enabled || !socket) return;

        const handlePositionUpdate = ({ data }) => {
            if (!mountedRef.current || !stateManagerRef.current) return;
            if (!secretKeyRef?.current) return;
            const positions = (data || [])
                .filter((p) => p.positionFilled > 0)
                .map((p) => normalizePosition(p));
            stateManagerRef.current.setPositions(positions);
            // Immediately re-apply whatever bracket data we already have
            // cached (see reconcileBracketsFromMap doc above) in case the
            // 'Futurestoporder' push for this position's TP/SL already
            // arrived before this position did.
            reconcileBracketsFromMap(null);
            adapterRef.current?.refresh?.();
        };

        socket.on('FuturesPositionOrder', handlePositionUpdate);
        return () => socket.off('FuturesPositionOrder', handlePositionUpdate);
    }, [socket, enabled, reconcileBracketsFromMap]);

    // WebSocket: stop orders (bracket TP/SL) — same self-healing
    // reconciliation as loadInitialData(), but running continuously. The
    // backend already pushes this event ('Futurestoporder') after any
    // bracket create/update/cancel via FuturesuserSocket(), so this keeps
    // the chart's TP/SL line in sync with the DB in real time without
    // depending on the position aggregation's own bracket join.
    useEffect(() => {
        if (!enabled || !socket) return;

        const handleStopOrders = ({ data }) => {
            if (!mountedRef.current || !stateManagerRef.current || !Array.isArray(data)) return;
            if (!secretKeyRef?.current) return;
            reconcileBracketsFromMap(buildBracketMapFromStopOrders(data));
        };

        socket.on('Futurestoporder', handleStopOrders);
        return () => socket.off('Futurestoporder', handleStopOrders);
    }, [socket, enabled, reconcileBracketsFromMap]);

    // WebSocket: live bid/ask + last trade → the chart's own realtime
    // trading-quotes feed (host.realtimeUpdate via BrokerAdapter.pushRealtimeQuote).
    // This is what actually drives the main-series bid/ask spread lines and
    // other broker-aware price displays — distinct from the Datafeed's
    // Quotes API, which only feeds the Buy/Sell buttons' Legend display.
    // Reuses the same 'FuturesorderBook' / 'FuturesrecentTrade' events
    // OrderBook.jsx / TradeActionCard.jsx / RecentTrades.jsx already trust
    // for this pair's price, scoped to whichever symbol is currently loaded
    // on this chart instance.
    //
    // IMPORTANT — this platform runs matching in "user_to_platform" mode
    // (platform-supplied liquidity, no real counterparty order book), so
    // 'FuturesorderBook' always emits empty buyOrder/sellOrder arrays for
    // this app — there is no real bid/ask spread to show, ever, by design.
    // That's why the spread lines never appeared even after the earlier
    // fixes: the plumbing was correct, but the data source it depended on
    // (a real order book) fundamentally doesn't exist for this matching
    // mode. Fixed by having the backend (BinanceWs.js TickerListener)
    // compute a synthetic ask/bid band around market price, using the
    // pair's own configured `minSlippage` — the same slippage concept this
    // platform already applies elsewhere for order fill-eligibility — and
    // sending both in the SAME 'FututresPrice' tick, so the two lines are
    // always genuinely distinct, not mirrors of each other. The
    // FuturesorderBook path is left in place untouched below; it'll simply
    // take over automatically (same pushRealtimeQuote call, same fields) if
    // this platform is ever switched to a real order-book matching mode.
    useEffect(() => {
        if (!enabled || !socket) return;

        const isCurrentSymbol = (tickerRoot) =>
            String(tickerRoot || '').toUpperCase() === String(currentSymbolRef?.current || '').toUpperCase();

        const handleOrderBookQuote = (raw) => {
            if (!mountedRef.current || !adapterRef.current) return;
            const result = safeParseQuotePayload(raw);
            if (!result?.tickerRoot || !isCurrentSymbol(result.tickerRoot)) return;

            const bid = Number(result.buyOrder?.[0]?._id);
            const ask = Number(result.sellOrder?.[0]?._id);
            adapterRef.current.pushRealtimeQuote({
                ...(Number.isFinite(bid) ? { bid } : {}),
                ...(Number.isFinite(ask) ? { ask } : {}),
            });
        };
        socket.on('FuturesorderBook', handleOrderBookQuote);

        // Live market price + synthetic ask/bid band (same event
        // MarketSummary.jsx / CoinPairs.jsx already trust for "Last Price").
        // The ask/bid here are computed backend-side (BinanceWs.js
        // TickerListener) from market price ± the pair's own configured
        // minSlippage — the same slippage concept this platform already
        // uses for order fill-eligibility (see handleTradeEngine.js) —
        // rather than an arbitrary frontend-invented spread. Always two
        // genuinely distinct values, every tick, for platforms without a
        // real counterparty order book.
        const handleMarketPriceQuote = (result) => {
            if (!mountedRef.current || !adapterRef.current) return;
            if (!result?.tickerRoot || !isCurrentSymbol(result.tickerRoot)) return;
            const ask = Number(result.ask);
            const bid = Number(result.bid);
            adapterRef.current.pushRealtimeQuote({
                ...(Number.isFinite(ask) ? { ask } : {}),
                ...(Number.isFinite(bid) ? { bid } : {}),
            });
        };
        socket.on('FututresPrice', handleMarketPriceQuote);

        const handleRecentTradeQuote = (raw) => {
            if (!mountedRef.current || !adapterRef.current) return;
            const result = safeParseQuotePayload(raw);
            const trade = Number(result?.data?.[0]?.price);
            if (!result?.tickerRoot || !isCurrentSymbol(result.tickerRoot) || !Number.isFinite(trade)) return;
            adapterRef.current.pushRealtimeQuote({ trade });
        };
        socket.on('FuturesrecentTrade', handleRecentTradeQuote);

        return () => {
            socket.off('FuturesorderBook', handleOrderBookQuote);
            socket.off('FututresPrice', handleMarketPriceQuote);
            socket.off('FuturesrecentTrade', handleRecentTradeQuote);
        };
    }, [socket, enabled, currentSymbolRef]);

    // WebSocket: price alert fired (see BrokerAdapter.chartContextMenuActions
    // → "Add Push Alert at <price>", and futureController.triggerPriceAlerts
    // on the backend). Deliberately NOT scoped to currentSymbolRef — an
    // alert can be set on a different pair than whatever's currently on
    // screen, and the user should still be notified. The backend already
    // scopes delivery to this user via socketEmitOne(..., alert.userId), so
    // anything received here is guaranteed to be this user's own alert.
    useEffect(() => {
        if (!enabled || !socket) return;

        const handlePriceAlertTriggered = (payload) => {
            if (!mountedRef.current) return;
            const message = payload?.message
                || `${payload?.tickerRoot || 'Price'} alert triggered at ${payload?.price ?? payload?.targetPrice}`;
            onToastRef.current?.(message, 'success');
        };
        socket.on('FuturesPriceAlertTriggered', handlePriceAlertTriggered);

        return () => socket.off('FuturesPriceAlertTriggered', handlePriceAlertTriggered);
    }, [socket, enabled]);

    // Mount / unmount
    useEffect(() => {
        mountedRef.current = true;
        return () => {
            mountedRef.current = false;

            if (brokerLoadTimerRef.current) {
                clearTimeout(brokerLoadTimerRef.current);
                brokerLoadTimerRef.current = null;
            }
            if (symbolReloadTimerRef.current) {
                clearTimeout(symbolReloadTimerRef.current);
                symbolReloadTimerRef.current = null;
            }

            adapterRef.current?.destroy?.();
            adapterRef.current = null;

            stateManagerRef.current?.destroy?.();
            stateManagerRef.current = null;
        };
    }, []);

    return {
        brokerFactory,
        stateManager: stateManagerRef.current,
        adapterRef,
        loadInitialData,
    };
}