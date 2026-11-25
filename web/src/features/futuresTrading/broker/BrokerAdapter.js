/**
 * BrokerAdapter.js
 *
 * Production-grade TradingView Broker API adapter for Trevolt Futures.
 *
 * Architecture:
 *
 *   TradingView Chart (broker_factory)
 *       │
 *       ▼
 *   BrokerAdapter (this class)  ←──── BrokerStateManager (canonical Map state)
 *       │                                       ▲
 *       ├── orders()                            │ WebSocket updates (useBrokerAdapter hook)
 *       ├── positions()                         │
 *       ├── modifyOrder()  ──► apiWrappers ──► backend REST
 *       ├── cancelOrder()  ──► apiWrappers
 *       ├── closePosition() ─► apiWrappers
 *       └── editPositionBrackets() ─► apiWrappers
 *
 * TradingView Broker API Reference:
 *   https://www.tradingview.com/charting-library-docs/latest/trading_terminal/broker-api/
 *
 * Usage:
 *   const adapter = new BrokerAdapter({ host, stateManager, secretKey, onClosePosition, onToast });
 *
 * IMPORTANT — Optimistic UI pattern:
 *   1. Update TradingView host immediately (optimistic)
 *   2. Call backend API
 *   3. On failure → host.ordersFullUpdate() / host.positionsFullUpdate() (rollback)
 */

import { OrderStatus, OrderType, Side } from './BrokerStateManager';
import { cancelOrder, modifyOrder, updateBrackets, placeOrder as placeOrderApi, closePosition as closePositionApi, createPriceAlert as createPriceAlertApi } from './apiWrappers';

// Icon for the "Add Push Alert" context-menu action (see
// chartContextMenuActions below) — a round alarm-clock glyph, matching the
// native "Add alert" item's icon silhouette. `currentColor` so it inherits
// the menu's own text color/theme, same as the library's built-in icons.
// const ALARM_CLOCK_ICON_SVG = `<svg xmlns="http://www.w3.org/2000/svg" style="width:18px;height:18px" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="13" r="8"/><path d="M12 9v4l2 2"/><path d="M5 3 2 6"/><path d="m22 6-3-3"/></svg>`;
const ALARM_CLOCK_ICON_SVG = `
<svg xmlns="http://www.w3.org/2000/svg"
     width="20"
     height="20"
     viewBox="0 0 24 24"
     fill="none"
     stroke="currentColor"
     stroke-width="0.9"
     stroke-linecap="round"
     stroke-linejoin="round">

  <!-- Clock -->
  <circle cx="10.5" cy="13" r="6.2"/>
  <path d="M10.5 10.3v2.5l1.7 1.7"/>

  <!-- Alarm bells -->
  <path d="M5 3 2.8 5.2"/>
  <path d="M18.2 5.2 16 3"/>

  <!-- Plus -->
  <path d="M20 17v4"/>
  <path d="M18 19h4"/>

</svg>`;
// IndividualPosition = 3. Not re-exported by the charting library at runtime,
// so it's inlined here — this is what marks an Order as a bracket attached
// to a position (see _buildBracketOrder / _syncBracketOrders below).
const PARENT_TYPE_POSITION = 2;

// TradingView's `StopType` enum (broker-api.d.ts): StopLoss = 0, TrailingStop
// = 1, GuaranteedStop = 2 — used on a Stop order to label it correctly (e.g.
// in the Account Manager's Type column). There is no "TakeProfit" StopType;
// a take-profit bracket is just a plain Limit order.
const STOP_TYPE_STOP_LOSS = 0;

// ─── TP/SL validation helpers ──────────────────────────────────────────────────

/**
 * Validate that a TP price is on the correct side of the entry price.
 * Long:  TP must be > entry
 * Short: TP must be < entry
 */
function isTpValid(price, entryPrice, side) {
    if (!price || price <= 0) return false;
    return side === Side.BUY ? price > entryPrice : price < entryPrice;
}

/**
 * Validate that an SL price is on the correct side of the entry price.
 * Long:  SL must be < entry
 * Short: SL must be > entry
 */
function isSlValid(price, entryPrice, side) {
    if (!price || price <= 0) return false;
    return side === Side.BUY ? price < entryPrice : price > entryPrice;
}

// ─── Debounce utility ─────────────────────────────────────────────────────────

function devBrokerLog(...args) {
    if (typeof import.meta !== 'undefined' && import.meta.env?.DEV) {
    }
}

function debounce(fn, ms) {
    let timer = null;
    const debounced = (...args) => {
        clearTimeout(timer);
        timer = setTimeout(() => fn(...args), ms);
    };
    debounced.cancel = () => clearTimeout(timer);
    return debounced;
}

/** Strip MARK: prefix and uppercase — matches what TV passes to broker callbacks. */
function normBrokerSym(s) {
    return String(s ?? '').replace(/^MARK:/i, '').toUpperCase();
}

/**
 * Derive number of decimal places from an `InstrumentInfo.minTick` value.
 * e.g. 0.01 → 2,  0.001 → 3,  1 → 0,  0.1 → 1
 */
function decimalsFromMinTick(minTick) {
    if (!Number.isFinite(minTick) || minTick <= 0) return 2;
    let n = minTick;
    let d = 0;
    while (d < 12 && Math.floor(n) !== n) { n *= 10; d += 1; }
    return d;
}

// ─── BrokerAdapter ────────────────────────────────────────────────────────────

export class BrokerAdapter {
    /**
     * @param {object}               opts
     * @param {IBrokerConnectionAdapterHost} opts.host    - TradingView host object
     * @param {BrokerStateManager}   opts.stateManager    - canonical state store
     * @param {React.MutableRefObject<string>} opts.secretKeyRef
     * @param {React.MutableRefObject<string>} opts.accountIdRef
     * @param {React.MutableRefObject<string>} opts.currentSymbolRef
     * @param {(data: object) => void}         opts.onClosePosition  - triggers close-position modal
     * @param {(msg: string, type: 'success'|'error') => void} opts.onToast
     * @param {React.MutableRefObject<object>} [opts.chartRef] - ref to the TradingView widget instance, used lazily for custom order lines (see "Custom order lines" section)
     * @param {React.MutableRefObject<boolean>} [opts.oneClickTradeRef] - ref to the "1-Click Trade" toggle; when false, placeOrder() asks TradingView's own built-in order-confirmation dialog before submitting
     */
    constructor({ host, stateManager, secretKeyRef, accountIdRef, currentSymbolRef, onClosePosition, onToast, datafeedRef, pairIdRef, leverageRef, chartRef, oneClickTradeRef }) {
        this._host = host;
        this._state = stateManager;
        this._secretKeyRef = secretKeyRef;
        this._accountIdRef = accountIdRef;
        this._currentSymbolRef = currentSymbolRef;
        this._onClosePosition = onClosePosition;
        this._onToast = onToast ?? (() => { });
        this._datafeeRef = datafeedRef;
        this._pairIdRef = pairIdRef;
        this._leverageRef = leverageRef;
        this._chartRef = chartRef;
        this._oneClickTradeRef = oneClickTradeRef;

        // orderId → { line: IOrderLineAdapter|null, pendingOrder } — see the
        // "Custom order lines" section below.
        this._customOrderLines = new Map();
        // id of the custom order line currently being actively dragged, if
        // any — see _syncCustomOrderLine's guard against fighting a drag.
        this._draggingCustomOrderLineId = null;
        this._customDragClearTimer = null;

        // Per-order debounced modify (keyed by orderId) to survive rapid drags
        this._debouncedModify = new Map();

        // orderId → monotonic counter, incremented every time modifyOrder()
        // is called for that order. Two separate drags spaced further apart
        // than the 200ms debounce window each fire their own real API call —
        // the debounce only collapses drags WITHIN that window, so it does
        // not by itself prevent two genuinely separate requests from being
        // in flight at once. If their responses come back out of order (the
        // second drag's call finishing before the first drag's — ordinary
        // network/server timing variance, nothing malformed about either
        // request), the earlier one's LATE success response would otherwise
        // overwrite the already-correct, more recent price with a stale one
        // and show a confusing "modified" toast for an action the user has
        // already moved past. Each debounced call captures the counter
        // value at the moment it was scheduled; when its response arrives,
        // it's only applied if that value still matches the latest one —
        // otherwise a newer drag has since superseded it, so this stale
        // result is silently dropped instead of visibly reverting the line.
        this._modifyRequestSeq = new Map();

        // orderId → true while a modifyOrder API call is actually in flight.
        // Belt-and-braces on top of _modifyRequestSeq above: that map stops
        // a STALE response from being *applied*, but a second drag issued
        // while the first request is still in flight would otherwise still
        // fire its own, genuinely CONCURRENT second request — two real
        // network calls racing each other. Besides being wasteful, this is
        // also almost certainly what feeds TradingView's own native
        // order-confirmation notification (a vendored, closed-source part
        // of charting_library — not one of this app's own toast components,
        // both of which render top-right, not bottom-left like that one)
        // stale intermediate data, since that native UI reacts to the same
        // orderUpdate()/order-list calls this file makes and isn't
        // something this codebase can directly patch. Serializing requests
        // per order — never starting a new one while one is still
        // in flight, instead queuing the latest values to fire immediately
        // after — removes the race at its source instead of only cleaning
        // up its effect on this file's own state.
        this._modifyInFlight = new Map();
        // orderId → { qty, price, snap } queued while a request is in
        // flight; consumed (and cleared) the moment that request completes.
        this._modifyPending = new Map();

        // Per-position debounced bracket update
        this._debouncedBracket = new Map();

        // Symbol info cache  symbol → info (deduplicates resolveSymbol round-trips)
        this._symbolInfoCache = new Map();
        // formatter()/spreadFormatter() results, keyed per symbol — both are
        // pure functions of symbolInfo(), so once that's cached there's no
        // reason to rebuild the formatter closures on every call either.
        this._formatterCache = new Map();
        this._spreadFormatterCache = new Map();

        // Enable silent order placement (no-confirm mode) in TradingView.
        // This ensures drag-and-drop gestures on position TP/SL bracket lines and order lines
        // immediately invoke editPositionBrackets() / modifyOrder() without waiting for built-in dialogs.
        try {
            if (this._host?.silentOrdersPlacement) {
                const watchedVal = this._host.silentOrdersPlacement();
                if (watchedVal && typeof watchedVal.setValue === 'function') {
                    watchedVal.setValue(true);
                }
            }
        } catch (e) {
            console.warn('[BrokerAdapter] silentOrdersPlacement setup error:', e);
        }

        // Sync the native quick-order Buy/Sell buttons' visibility to
        // whatever the "1-Click Trade" toggle is currently set to. This is
        // the documented, live-toggle-capable API (host.sellBuyButtonsVisibility()
        // returns an IWatchedValue<boolean>) — it only works if the
        // `buy_sell_buttons` featureset was left enabled at widget
        // construction (see TradingViewChart.jsx), since TradingView's
        // internal implementation returns null from this method entirely
        // when that featureset is disabled.
        this.setBuySellButtonsVisible(this._oneClickTradeRef?.current !== false);

        /**
         * isDraggingBracket — true while the user has an active TP/SL drag gesture.
         *
         * Set to true the moment TV calls editPositionBrackets() (first mouse-move
         * after mousedown on a TP/SL handle). Cleared 600 ms after the debounced
         * backend call resolves. This window is read by useBrokerAdapter to suppress
         * Redux-driven positionsFullUpdate() calls that would otherwise cancel the
         * drag mid-gesture (symptom: TP label hides / stops tracking cursor).
         */
        this.isDraggingBracket = false;
        this._dragClearTimer = null;
        // See pushRealtimeQuote() — tracks whether we've already re-applied
        // the bidAsk spread-line overrides after the first real quote.
        this._bidAskOverrideReapplied = false;
        // See pushRealtimeQuote() — last-known {ask, bid, trade} snapshot,
        // reset whenever the symbol changes.
        this._lastQuote = {};
        this._lastQuoteSymbol = null;

        // Warm the symbolInfo/formatter caches immediately, for whatever
        // symbol is already loaded, rather than waiting for the chart to
        // ask for it on first use. See prewarmSymbolInfo() below for why.
        this.prewarmSymbolInfo(this._currentSymbolRef?.current);

        // Subscribe to state changes → push to TradingView host
        this._unsubState = stateManager.subscribe((type, payload) => {
            this._onStateChange(type, payload);
        });

        this.editPositionBrackets = this.editPositionBrackets.bind(this);
    }

    // ── "1-Click Trade" — native Buy/Sell quick-order buttons ─────────────────

    /**
     * Show/hide the chart's native quick-order Buy/Sell buttons at runtime,
     * with no widget rebuild.
     *
     * TradingView Charting Library reference:
     * https://www.tradingview.com/charting-library-docs/latest/api/interfaces/Charting_Library.IBrokerConnectionAdapterHost#sellbuybuttonsvisibility
     *
     * `host.sellBuyButtonsVisibility()` returns an `IWatchedValue<boolean>`
     * whose `.setValue()` toggles the buttons live — this is the officially
     * supported runtime mechanism. The one requirement (confirmed against
     * the bundled charting_library runtime) is that the `buy_sell_buttons`
     * featureset must be left ENABLED at widget construction; if it's in
     * `disabled_features` at construction time, this method returns `null`
     * permanently and there is no live way to turn the buttons back on
     * short of rebuilding the widget — which is exactly the flash/rebuild
     * this method exists to avoid. See TradingViewChart.jsx's widgetOptions.
     *
     * @param {boolean} visible
     * @returns {boolean} true if the live toggle was applied, false if the
     *   host doesn't support it (caller should fall back to a widget rebuild).
     */
    setBuySellButtonsVisible(visible) {
        try {
            const watched = this._host?.sellBuyButtonsVisibility?.();
            if (watched && typeof watched.setValue === 'function') {
                watched.setValue(!!visible);
                return true;
            }
        } catch (e) {
            console.warn('[BrokerAdapter] setBuySellButtonsVisible error:', e);
        }
        return false;
    }

    /**
     * Push a live bid/ask/last-trade update to the chart via
     * `host.realtimeUpdate(symbol, data)`.
     *
     * TradingView Charting Library reference:
     * https://www.tradingview.com/charting-library-docs/latest/api/interfaces/Charting_Library.IBrokerConnectionAdapterHost#realtimeupdate
     *
     * This is the broker-side trading quotes feed — separate from, and in
     * addition to, the Datafeed's own Quotes API (`getQuotes`/`subscribeQuotes`
     * in CustomDatafeed.js, which feeds the Buy/Sell buttons' Legend
     * display). For a broker-connected chart (this one — see
     * `isBrokerCapable` in TradingViewChart.jsx), the main-series bid/ask
     * spread lines (`mainSeriesProperties.bidAsk.*`) and other broker-aware
     * price displays (Order Ticket, DOM widget) read from *this* feed, so
     * without calling it those elements stay static/hidden even once the
     * Datafeed Quotes API is working correctly.
     *
     * @param {{ bid?: number, ask?: number, trade?: number }} patch
     */
    pushRealtimeQuote(patch) {
        try {
            const symbol = this._currentSymbolRef?.current;
            if (!symbol || typeof this._host?.realtimeUpdate !== 'function') return;

            // Merge into a persistent last-known snapshot instead of only
            // forwarding whatever field this particular call happens to
            // carry. `ask` and `bid` now arrive from two DIFFERENT events on
            // two different schedules (live market price vs. last executed
            // trade — see useBrokerAdapter.js), so a naive per-call forward
            // sends TradingView a partial quote (ask-only, then later
            // bid-only) every single time. Always sending the merged,
            // complete set keeps every realtimeUpdate() call self-consistent.
            if (this._lastQuoteSymbol !== symbol) {
                // Different symbol than last time — don't leak a previous
                // pair's price into a freshly-loaded one.
                this._lastQuoteSymbol = symbol;
                this._lastQuote = {};
            }
            this._lastQuote = this._lastQuote || {};
            if (Number.isFinite(patch?.bid)) this._lastQuote.bid = patch.bid;
            if (Number.isFinite(patch?.ask)) this._lastQuote.ask = patch.ask;
            if (Number.isFinite(patch?.trade)) this._lastQuote.trade = patch.trade;

            // Cross-fallback — same pattern as CustomDatafeed.js's
            // _effectiveAskBid(): resolve `ask`/`bid` from whichever price
            // IS known, instead of leaving one permanently undefined if its
            // own specific source (e.g. the live market-price tick) never
            // arrives while the other (e.g. last trade) keeps working fine.
            // Without this, one side can be missing indefinitely even
            // though a perfectly good reference price (the other side, or
            // the last trade) has been sitting right there the whole time —
            // which is exactly what left only one of the two spread lines
            // (and one of the two Buy/Sell prices) showing.
            const { bid: rawBid, ask: rawAsk, trade: rawTrade } = this._lastQuote;
            const ask = Number.isFinite(rawAsk) ? rawAsk : (Number.isFinite(rawBid) ? rawBid : rawTrade);
            const bid = Number.isFinite(rawBid) ? rawBid : (Number.isFinite(rawAsk) ? rawAsk : rawTrade);

            const data = {};
            if (Number.isFinite(ask)) data.ask = ask;
            if (Number.isFinite(bid)) data.bid = bid;
            if (Number.isFinite(rawTrade)) data.trade = rawTrade;
            if (Number.isFinite(data.ask) && Number.isFinite(data.bid)) {
                data.spread = data.ask - data.bid;
            }
            if (Object.keys(data).length === 0) return;

            this._host.realtimeUpdate(symbol, data);

            // The chart's internal bid/ask "custom source" (the thing that
            // actually draws the mainSeriesProperties.bidAsk lines) is
            // created lazily, on the first realtimeUpdate() call for the
            // main series — confirmed against the bundled charting_library
            // runtime, which only exposes the "Show Bid/Ask Lines" menu
            // action once `model().model().hasCustomSource("bidask")` is
            // true. TradingViewChart.jsx sets
            // `mainSeriesProperties.bidAsk.visible: true` at chart-ready,
            // which is *before* this source exists yet (no quotes have
            // arrived at that point) — so the very first time real quote
            // data flows, re-apply that override (plus the axis bid/ask
            // price tag) so it actually attaches to something instead of
            // silently doing nothing.
            //
            // NOTE: `scalesProperties.showBidAskLabels` re-included —
            // without it the line draws with no price tag on the axis at
            // all (confirmed against actual rendering); the bidAsk line
            // does not carry its own axis label by default.
            if (!this._bidAskOverrideReapplied) {
                this._bidAskOverrideReapplied = true;
                try {
                    this._chartRef?.current?.applyOverrides?.({
                        'mainSeriesProperties.bidAsk.visible': true,
                        'mainSeriesProperties.bidAsk.lineWidth': 1,
                        'mainSeriesProperties.bidAsk.bidLineColor': '#2EBD85',
                        'mainSeriesProperties.bidAsk.askLineColor': '#F6465D',
                        'scalesProperties.showBidAskLabels': true,
                    });
                } catch (e) {
                    console.warn('[BrokerAdapter] bidAsk re-apply error:', e);
                }
            }
        } catch (e) {
            console.warn('[BrokerAdapter] pushRealtimeQuote error:', e);
        }
    }

    // ── Static config flags ───────────────────────────────────────────────────

    static get configFlags() {
        return {
            supportPositions: true,
            supportPositionBrackets: true,   // enables TP/SL drag creation
            supportModifyPositionBrackets: true, // enables dragging existing TP/SL
            supportModifyBracketOrders: true,   // allows editing existing TP/SL
            supportClosePosition: true,
            supportCloseIndividualPosition: false,
            supportPartialClosePosition: true,
            supportOrderBrackets: false,   // see getSymbolSpecificTradingOptions() below for why
            supportStopLoss: true,
            supportMarketOrders: true,
            supportLimitOrders: true,
            supportPLUpdate: true,
            supportExecutions: false,
            supportOrdersHistory: false,
            showNotificationsLog: false,
            supportModifyOrderPrice: true,
            // Quantity should only ever be set once, in the order-entry form,
            // not editable afterwards via TradingView's own order-line hover
            // interaction — only price (via drag) should be adjustable on an
            // already-placed order. This is unrelated to, and doesn't affect,
            // the app's own quantity field in the order-entry form itself.
            supportEditAmount: false,
            supportReversePosition: false,
            supportDemoLiveSwitcher: false,
            supportModifyBrackets: true,
            // supportModifyBracketOrders: true,   // allows editing existing TP/SL
            // showQuantityInsteadOfLots: true,
            showQuantityInsteadOfAmount: true,
            // FIX: was `true`. This flag switches TradingView into a
            // multi-target-exit interaction mode, where its own drag/change
            // detection compares the `exitLevels` array (not the plain
            // takeProfit/stopLoss fields) — see bundle: `exitLevels:
            // supportMultipleExitLevels ? position.exitLevels : void 0` and
            // the position-equality check `!config.supportMultipleExitLevels
            // || exitLevelsEqual(...)`. We never populate `exitLevels`
            // (positions() always returns `[]`) and editPositionBrackets()
            // only ever updates the plain takeProfit/stopLoss fields — so with
            // this flag on, TV can partially engage a TP/SL drag (hiding the
            // "+TP" quick-add tab) but can never complete it, since the
            // exitLevels array it's actually watching never changes. This is
            // the most likely cause of "TP label vanishes, nothing is
            // created." We only support a single TP + single SL per
            // position, so this should be false to match that.
            supportMultipleExitLevels: false,
        };
    }

    // ── Connection ────────────────────────────────────────────────────────────

    connectionStatus() {
        return 1; // 1 = connected
    }

    // ── Context menu ──────────────────────────────────────────────────────────

    /**
     * Appends a custom "Add Push Alert at <price>" action to the chart's
     * native "+" quick-order context menu, alongside (not replacing)
     * TradingView's own default items — including its own "Add alert on
     * <symbol> at <price>" item, which is left untouched. That native item
     * is UI-only in this charting_library edition (no IAlertsAdapter-style
     * interface exists to hook persistence/notifications into it — checked
     * charting_library.d.ts, there's nothing), so it's not able to actually
     * notify anyone. This adds a second, clearly-labelled item that is
     * backed by a real endpoint (createPriceAlert → POST /future/price_alert)
     * and a real notification pipeline (triggerPriceAlerts in
     * futureController.js, checked on every live price tick).
     */
    async chartContextMenuActions(context, options) {
        const nativeActions = await this._host.defaultContextMenuActions(context, options);

        const price = context?.value;
        const pairId = this._pairIdRef?.current;
        if (!Number.isFinite(price) || !pairId) {
            // No valid price under the cursor, or no active pair resolved
            // yet — just show the native menu rather than a broken action.
            return nativeActions;
        }

        const label = context?.formattedValue || String(price);
        const alertAction = {
            text: `Add Push Alert at ${label}`,
            tooltip: 'Get a notification when the price crosses this level',
            // Per ActionDescription docs, `icon` is a raw SVG string (not a
            // URL/path). TradingView's own icon for its native "Add alert"
            // item is a bundled binary asset, not extractable as plain text
            // from the minified library — this uses a standard alarm-clock
            // glyph instead, same round-icon silhouette, `currentColor`
            // stroke so it inherits the menu's own text color/theme exactly
            // like the native icons do.
            icon: ALARM_CLOCK_ICON_SVG,
            action: async () => {
                try {
                    const { status, message } = await createPriceAlertApi(
                        { pairId, targetPrice: price },
                        this._secretKeyRef?.current,
                    );
                    this._onToast(
                        message || (status ? 'Alert created' : 'Failed to create alert'),
                        status ? 'success' : 'error',
                    );
                } catch (e) {
                    console.warn('[BrokerAdapter] createPriceAlert action error:', e);
                    this._onToast('Failed to create alert', 'error');
                }
            },
        };

        // Insert right after the native "Add alert on ... at ..." item so
        // the two alert-related actions sit together, instead of tacking
        // ours onto the very bottom of the menu after Buy/Sell/Draw
        // Horizontal Line. Falls back to appending at the end if that
        // native item's text ever changes or isn't present for some
        // reason — never silently drops our action.
        const nativeAlertIndex = nativeActions.findIndex(
            (a) => typeof a?.text === 'string' && a.text.toLowerCase().startsWith('add alert'),
        );

        if (nativeAlertIndex === -1) {
            return [...nativeActions, { text: '-', separator: true }, alertAction];
        }

        const result = [...nativeActions];
        result.splice(nativeAlertIndex + 1, 0, alertAction);
        return result;
    }

    // ── Tradability ───────────────────────────────────────────────────────────

    async isTradable(symbol) {
        return { tradable: true };
    }


    /**
     * Per-symbol bracket/trading option overrides.
     * Without this, TV may not enable the position bracket drag handles.
     * Mirrors the pattern used in the broker-sample.
     */
    async getSymbolSpecificTradingOptions(_symbol) {
        // return {
        //     supportPositionBrackets: true,
        //     supportModifyPositionBrackets: true,
        //     supportOrderBrackets: false,
        //     supportModifyBrackets: true,
        //     supportAddBracketsToExistingOrder: true,
        //     supportStopLoss: true,
        // };

        return {
            supportPositionBrackets: true,   // ✅ enables TP/SL on positions
            supportModifyPositionBrackets: true,   // ✅ enables drag on existing TP/SL
            // Pending/unfilled orders (plain limit or stop orders) should NOT
            // show TP/SL quick-add pills on their own line — that's what was
            // turning a clean "Sell Limit @ 573.60" line into a cluttered
            // "TP | SL | 0.010 Sell Limit | X" box. This is a separate flag
            // family from the supportPositionBrackets ones above (which
            // govern TP/SL dragging on an actual open POSITION, and are left
            // untouched here) — supportOrderBrackets specifically governs
            // brackets on an order that hasn't filled yet, which isn't a
            // feature this app's order-entry flow needs (TP/SL for an order
            // is instead handled by the "Bracket Order" toggle in the order
            // form itself, a completely separate mechanism from this flag).
            supportOrderBrackets: false,
            supportModifyOrderBrackets: false,
            supportModifyBrackets: true,   // ✅ keep
            supportAddBracketsToExistingOrder: true,   // ✅ keep
            supportStopLoss: true,   // ✅ keep
            supportTrailingStop: false,
            supportGuaranteedStop: false,
        };
    }


    /**
     * Resolve a position by the id TradingView passes us.
     * TV often passes position.id === symbol (matching the broker-sample pattern where
     * positionId = order.symbol).  Our positions use `pairId` as their id.
     * We try id lookup first, then fall back to a unique symbol match.
     *
     * @param {string} positionId
     * @returns {object|null}
     */
    _resolvePosition(positionId) {
        const key = String(positionId ?? '');

        // Direct id match
        const byId = this._state.getPosition(key);
        if (byId) return byId;

        // Fallback: match by normalised symbol (works when TV passes symbol as positionId)
        const want = normBrokerSym(key);
        const matches = this._state.getPositions().filter(
            (p) => normBrokerSym(p.symbol) === want
        );
        if (matches.length === 1) return matches[0];

        if (matches.length > 1) {
            devBrokerLog(
                '_resolvePosition: multiple positions for symbol — use pairId as position id',
                want
            );
        }
        return null;
    }


    // ── Account ───────────────────────────────────────────────────────────────

    async accountsMetainfo() {
        const id = this._accountIdRef.current || 'default';
        return [{ id, name: 'Futures Account' }];
    }

    currentAccount() {
        // console.log(this._accountIdRef.current, "this._accountIdRef.current")
        return this._accountIdRef.current || 'default';
    }

    accountManagerInfo() {
        return {
            accountTitle: 'Futures',

            // summary must be a defined array — never undefined
            summary: [],

            // ── Orders tab ────────────────────────────────────────────────────
            // Rules (from broker-sample/columns.ts + AccountManagerColumnBase):
            //  • Every column MUST have a unique `id: string`  ← crash if missing
            //  • `formatter` string must match a StandardFormatterName exactly
            //  • `dataFields` length and order must match each formatter's contract
            //    (see StandardFormattersDependenciesMapping in broker-api.d.ts)
            //  • Symbol formatter: ['brokerSymbolProp', 'symbolProp', 'messageProp'] (3)
            //  • Type formatter:   ['typeProp', 'parentIdProp', 'stopTypeProp']     (3)
            orderColumns: [
                {
                    id: 'symbol',
                    label: 'Symbol',
                    formatter: 'symbol',
                    // 3-field 'withMessage' variant — matches broker-sample columns.ts
                    dataFields: ['symbol', 'symbol', 'message'],
                },
                {
                    id: 'side',
                    label: 'Side',
                    alignment: 'left',
                    formatter: 'side',
                    dataFields: ['side'],
                },
                {
                    id: 'type',
                    label: 'Type',
                    alignment: 'left',
                    formatter: 'type',
                    dataFields: ['type', 'parentId', 'stopType'],
                },
                {
                    id: 'limitPrice',
                    label: 'Limit Price',
                    alignment: 'right',
                    formatter: 'formatPrice',
                    dataFields: ['limitPrice'],
                },
                {
                    id: 'stopPrice',
                    label: 'Stop Price',
                    alignment: 'right',
                    formatter: 'formatPrice',
                    dataFields: ['stopPrice'],
                },
                {
                    id: 'qty',
                    label: 'Qty',
                    alignment: 'right',
                    formatter: 'formatQuantity',
                    dataFields: ['qty'],
                },
                {
                    id: 'status',
                    label: 'Status',
                    alignment: 'left',
                    formatter: 'status',
                    dataFields: ['status'],
                },
            ],

            // ── Positions tab ─────────────────────────────────────────────────
            positionColumns: [
                {
                    id: 'symbol',
                    label: 'Symbol',
                    formatter: 'symbol',
                    dataFields: ['symbol', 'symbol', 'message'],
                },
                {
                    id: 'side',
                    label: 'Side',
                    alignment: 'left',
                    formatter: 'side',
                    dataFields: ['side'],
                },
                {
                    id: 'avgPrice',
                    label: 'Entry Price',
                    alignment: 'right',
                    formatter: 'formatPrice',
                    dataFields: ['avgPrice'],
                },
                {
                    id: 'qty',
                    label: 'Qty',
                    alignment: 'right',
                    formatter: 'formatQuantity',
                    dataFields: ['qty'],
                },
                {
                    id: 'pl',
                    label: 'PnL',
                    alignment: 'right',
                    // StandardFormatterName.Profit expects [profitProperty]
                    formatter: 'profit',
                    dataFields: ['profit'],
                },
                {
                    id: 'takeProfit',
                    label: 'Take Profit',
                    alignment: 'right',
                    formatter: 'formatPrice',
                    dataFields: ['takeProfit'],
                },
                {
                    id: 'stopLoss',
                    label: 'Stop Loss',
                    alignment: 'right',
                    formatter: 'formatPrice',
                    dataFields: ['stopLoss'],
                },
            ],

            // pages must be a defined array — never undefined
            pages: [],
        };
    }

    // ── Orders ────────────────────────────────────────────────────────────────

    /**
     * TradingView calls this to fetch the current orders list.
     * We return from in-memory state — no API call needed here.
     */
    async orders() {
        return this._state.getOrders().filter((o) => !this._isCustomLimitOrder(o));
    }

    async ordersHistory() {
        return [];
    }

    async executions() {
        return [];
    }

    // ── Positions ─────────────────────────────────────────────────────────────

    /**
     * TradingView calls this to fetch the current positions list.
     */
    async positions() {
        return this._state.getPositions();
    }

    // ── Place order ───────────────────────────────────────────────────────────

    /**
     * Called when the user places a brand-new order from the chart
     * (the "order_panel" Buy/Sell ticket, or drag-to-create on an empty area
     * of the chart). Delegates to the same backend endpoint the existing
     * TradeActionCard order form uses (futureOrderPlacing) — all quantity /
     * price / leverage validation stays server-side, nothing is duplicated
     * here. On success the order appears via the existing Socket.IO
     * (FuturesopenOrder / FuturesOrderUpdate) sync already wired in
     * useBrokerAdapter, so no extra optimistic order object is required here.
     *
     * TradingView expects this to either resolve with { orderId } on success
     * or throw/reject on failure so it can surface the error in the ticket.
     */
    async placeOrder(order) {
        devBrokerLog('placeOrder', order);

        // "1-Click Trade" toggle (chart header button) — OFF means show
        // TradingView's own built-in order-confirmation dialog first. This
        // defaults to enabled (no dialog), which is exactly how order
        // placement already worked before this toggle existed — so nothing
        // changes for anyone who doesn't touch the new control.
        const oneClickEnabled = this._oneClickTradeRef?.current !== false;
        if (!oneClickEnabled && typeof this._host?.showOrderDialog === 'function') {
            let confirmed = true;
            try {
                confirmed = await this._host.showOrderDialog(order);
            } catch (err) {
                console.warn('[BrokerAdapter] showOrderDialog threw — proceeding rather than blocking the trade', err);
                confirmed = true;
            }
            if (!confirmed) {
                // User cancelled in the dialog — no error toast, they made a
                // deliberate choice, not a failure.
                throw new Error('Order cancelled by user');
            }
        }

        const pairId = this._pairIdRef?.current;
        const leverage = this._leverageRef?.current;

        const { status, message, orderId } = await placeOrderApi(
            order,
            { pairId, leverage },
            this._secretKeyRef.current,
        );

        if (status) {
            this._onToast(message || 'Order placed', 'success');
            // Nudge a refresh in case the WS event arrives slightly later than
            // TradingView's own post-placeOrder UI update.
            setTimeout(() => this.refresh(), 500);
            return { orderId: orderId || String(Date.now()) };
        }

        this._onToast(message || 'Order placement failed', 'error');
        throw new Error(message || 'Order placement failed');
    }

    // ── Modify order ──────────────────────────────────────────────────────────

    /**
     * Called when the user drags an order line to a new price,
     * or drags the quantity handle.
     *
     * Pattern:
     *   1. Validate → reject clearly invalid changes immediately
     *   2. Optimistic update → tell TradingView the new price now
     *   3. Debounced API call → avoids flooding on rapid drags
     *   4. On failure → host.ordersFullUpdate() to snap back
     */
    async modifyOrder(order) {
        const orderId = order.id;
        const existing = this._state.getOrder(orderId);
        if (!existing) return;

        // A position's TP/SL is rendered as a bracket Order (parentId-linked —
        // see _syncBracketOrders). If TradingView routes a drag on that line
        // through modifyOrder() (rather than editPositionBrackets(), which it
        // may also do once the bracket is a real tracked order line), detect
        // it here and commit through the same validated bracket-update path
        // instead of treating it as a plain order price change.
        if (existing.parentType === PARENT_TYPE_POSITION) {
            return this._modifyBracketOrder(existing, order);
        }

        const newPrice = order.limitPrice ?? order.stopPrice ?? order.price;
        const newQty = order.qty;

        // Validation guards
        if (!newPrice || newPrice <= 0) {
            this._host.ordersFullUpdate();
            return;
        }
        if (existing.price === newPrice && existing.qty === newQty) return; // no change

        // 1. Optimistic UI update
        this._host.orderUpdate({
            ...existing,
            price: newPrice,
            limitPrice: newPrice,
            qty: newQty,
        });

        // Pin the dragged price/qty on the shared state. Without this, a
        // concurrent 'FuturesopenOrder' full-snapshot push (fired by ANY
        // future event on this account/pair — not just this drag — see
        // FuturesuserSocket on the backend) that happens to be queried or
        // delivered before our own modifyOrder() commit lands would carry
        // the OLD price/qty and silently overwrite the line back to it,
        // even though the DB/toast/history are already correct. The pin
        // keeps the chart line honest for a short window until things settle.
        this._state.pinOrderPatch(orderId, { price: newPrice, limitPrice: newPrice, qty: newQty });

        // Stamp this request as the latest one for this order — see the
        // _modifyRequestSeq comment in the constructor.
        const requestSeq = (this._modifyRequestSeq.get(orderId) || 0) + 1;
        this._modifyRequestSeq.set(orderId, requestSeq);

        // 2. Debounced backend call (200ms — absorbs rapid drags)
        if (!this._debouncedModify.has(orderId)) {
            const runModify = async (id, qty, price, snap, seq) => {
                this._modifyInFlight.set(id, true);
                try {
                    const { status, message } = await modifyOrder(
                        { orderId: id, qty, price },
                        this._secretKeyRef.current,
                    );
                    // A newer drag has been issued since this specific request
                    // was sent — its own response (or an already-completed
                    // commit) is the one that should win. Applying this stale
                    // result now, success or failure, would only fight or
                    // confusingly re-narrate an action the user has already
                    // moved past.
                    if (this._modifyRequestSeq.get(id) !== seq) {
                    } else if (status) {
                        // Commit: update state so future WS events diff correctly
                        this._state.upsertOrder({ ...snap, price, limitPrice: price, qty });
                        this._onToast(message || 'Order updated', 'success');
                    } else {
                        // Rollback — release the pin first so ordersFullUpdate()
                        // can actually restore the true (pre-drag) server value
                        // instead of the pin re-applying our failed edit on top.
                        this._state.clearOrderPin(id);
                        this._host.ordersFullUpdate();
                        this._onToast(message || 'Modify failed', 'error');
                    }
                } finally {
                    this._modifyInFlight.set(id, false);
                    // A further drag arrived while this request was in
                    // flight — rather than let it have fired its own
                    // concurrent request (the actual source of responses,
                    // and whatever downstream UI reacts to them, racing
                    // each other), it was queued instead. Run it now, for
                    // the latest values only — this order's very next
                    // request, guaranteed to start only after this one has
                    // fully finished.
                    const pending = this._modifyPending.get(id);
                    if (pending) {
                        this._modifyPending.delete(id);
                        runModify(id, pending.qty, pending.price, pending.snap, this._modifyRequestSeq.get(id));
                    }
                }
            };

            this._debouncedModify.set(orderId, debounce((id, qty, price, snap, seq) => {
                if (this._modifyInFlight.get(id)) {
                    // Don't start a second, genuinely concurrent request —
                    // queue these values; runModify's own finally block
                    // above fires them the instant the in-flight one settles.
                    this._modifyPending.set(id, { qty, price, snap });
                    return;
                }
                runModify(id, qty, price, snap, seq);
            }, 200));
        }

        this._debouncedModify.get(orderId)(orderId, newQty, newPrice, existing, requestSeq);
    }

    /**
     * Handles a drag on an EXISTING bracket line when TradingView routes it
     * through modifyOrder() instead of editPositionBrackets(). Reuses the
     * exact same validated commit path (price-side validation, optimistic
     * update, pin, debounce, backend call) so behavior is identical either
     * way TV chooses to fire this.
     */
    async _modifyBracketOrder(bracketOrder, order) {
        const positionId = bracketOrder.parentId;
        const kind = bracketOrder._bracketKind || (bracketOrder.type === OrderType.LIMIT ? 'tp' : 'sl');
        const newPrice = order.limitPrice ?? order.stopPrice ?? order.price;
        if (!newPrice || newPrice <= 0) {
            this._host.ordersFullUpdate();
            return;
        }
        const brackets = kind === 'tp' ? { takeProfit: newPrice } : { stopLoss: newPrice };
        return this.editPositionBrackets(positionId, brackets);
    }

    // ── Cancel order ──────────────────────────────────────────────────────────

    async cancelOrder(orderId) {
        const existing = this._state.getOrder(orderId);
        if (!existing) return;

        // Cancelling a position's TP/SL bracket line goes through the
        // dedicated bracket-cancel endpoint, not the regular order cancel.
        if (existing.parentType === PARENT_TYPE_POSITION) {
            return this._cancelBracketOrder(existing);
        }

        // Optimistic: mark as canceled immediately. Merge with the full
        // existing order (symbol, side, qty, etc.) rather than sending just
        // {id, status} — TradingView's internal notification builder reads
        // fields like `symbol` off this payload and throws if they're
        // missing (same root cause as the earlier orderRemoved crash).
        this._host.orderUpdate({ ...existing, status: OrderStatus.CANCELED });

        // Pin the removal so a concurrent 'FuturesopenOrder' snapshot that
        // was queried/delivered before the cancel actually committed on the
        // backend can't re-insert the order and make the just-clicked X
        // appear to do nothing on the chart / open-orders line.
        this._state.pinOrderRemoval(orderId);

        const { status, message } = await cancelOrder(orderId, this._secretKeyRef.current);
        if (status) {
            this._state.removeOrder(orderId);
            this._onToast(message || 'Order cancelled', 'success');
        } else {
            // Rollback — release the removal pin first so ordersFullUpdate()
            // can bring the order back (cancel actually failed server-side).
            this._state.clearOrderRemovalPin(orderId);
            this._host.ordersFullUpdate();
            this._onToast(message || 'Cancel failed', 'error');
        }
    }

    /** Cancel a position's TP or SL bracket line (dedicated endpoint, distinct id space from regular orders). */
    async _cancelBracketOrder(bracketOrder) {
        const orderId = bracketOrder.id;
        const realOrderId = bracketOrder._realOrderId;
        const positionId = bracketOrder.parentId;
        const kind = bracketOrder._bracketKind === 'tp' ? 'takeProfit' : 'stopLoss';

        // Optimistic: hide the bracket line immediately. Send the full
        // order (not just {id, status}) — see cancelOrder() above for why.
        this._host.orderUpdate({ ...bracketOrder, status: OrderStatus.CANCELED });
        this._state.pinOrderRemoval(orderId);

        // Prevent the position's own takeProfit/stopLoss field from
        // resurrecting this line the instant the next position snapshot
        // arrives — this is what was making a successfully-cancelled
        // bracket "stick" on the chart even though the backend/history were
        // already correct. See BrokerStateManager's pin docs for why a
        // plain merge/self-heal can't tell "cancelled" apart from "just
        // hasn't caught up yet" on its own.
        if (positionId) {
            this._state.pinPositionBracketRemoval(positionId, kind);
            this._state.clearPositionPinField(positionId, kind);
        }

        // No real backend id confirmed yet (brand-new bracket dragged into
        // existence moments ago) — nothing to cancel server-side, just drop
        // it locally.
        if (!realOrderId) {
            this._state.removeOrder(orderId);
            return;
        }

        // NOTE: a bracket TP/SL is its own order document (status
        // 'conditional') in the same orders collection as regular orders —
        // NOT a field on some other parent order. The dedicated
        // remove-bracket endpoint expects a *different* kind of id (the main
        // position's entry order, which holds an embedded bracketOrders
        // list) and clears TP+SL together, which isn't what a single
        // TP/SL-line "X" click means. Cancelling this order by its own real
        // id through the same generic single-order endpoint used above is
        // both correct (only this side is touched) and simpler.
        const { status, message } = await cancelOrder(realOrderId, this._secretKeyRef.current);
        if (status) {
            this._state.removeOrder(orderId);
            this._onToast(message || 'Bracket order cancelled', 'success');
            // Nudge the position right away so the chart line and the
            // TP/SL column reflect the cancellation immediately, rather
            // than waiting for the next periodic socket refresh — matches
            // how the drag-to-set flow already updates optimistically.
            if (positionId) {
                const pos = this._state.getPosition(positionId);
                if (pos) this._state.upsertPosition({ ...pos });
            }
        } else {
            // Rollback — the bracket is still live server-side, so release
            // both removal pins first so ordersFullUpdate()/the next
            // position snapshot can bring the real line back.
            this._state.clearOrderRemovalPin(orderId);
            if (positionId) this._state.clearPositionBracketRemovalPin(positionId, kind);
            this._host.ordersFullUpdate();
            this._onToast(message || 'Cancel failed', 'error');
        }
    }

    /**
     * Bulk cancel (called when user clicks "CXL All" in Depth of Market).
     * Mirrors broker-sample: just iterate and call cancelOrder for each.
     */
    async cancelOrders(_symbol, _side, ordersIds) {
        await Promise.all((ordersIds || []).map((id) => this.cancelOrder(id)));
    }

    // ── Close position ────────────────────────────────────────────────────────

    /**
     * Called when the user clicks "Close Position" on the chart. Executes
     * immediately — no confirmation dialog — with an optimistic update and a
     * toast, exactly like cancelOrder()/_cancelBracketOrder() above and like
     * how other exchanges handle a one-click chart close.
     *
     * IMPORTANT: this resolves as soon as the optimistic update is applied,
     * *without* waiting on the backend round trip. TradingView's own broker-
     * connection layer tracks how long the promise it gets back from this
     * method takes, and — independently of whether the close itself
     * eventually succeeds — was logging its own internal
     * "Position closing timeout" once the (encrypted, sometimes multi-second)
     * network call ran long. The actual close/backend call/toast/rollback
     * still all happen exactly as before, just via _performClosePosition()
     * running in the background instead of being awaited here.
     */
    async closePosition(positionId, amount) {
        try {
            const position = this._resolvePosition(positionId);
            if (!position) {
                // Previously just a console.warn with no user-facing feedback —
                // if TradingView ever passes an id/symbol this can't match, the
                // click would silently do nothing (no toast, position stays put)
                // and look like a hang rather than a clear failure.
                this._onToast('No open position found to close', 'error');
                return;
            }

            const closeQty = amount !== undefined ? Number(amount) : Number(position.qty);
            const isFullClose = !(closeQty < Number(position.qty));

            // Optimistic: go through the state manager (not a direct host call)
            // so this is treated as a genuine position close — qty=0 makes
            // upsertPosition() remove the position AND fire 'positionRemoved',
            // which _onStateChange already wires to _removeBracketOrders() to
            // clear the TP/SL lines too. Skipping the state manager here was
            // why a closed position's bracket lines could survive on the chart:
            // TV was told qty=0 directly, but our own canonical state still
            // held the position (and its brackets), ready to be redrawn on the
            // next refresh.
            this._state.upsertPosition({
                ...position,
                qty: isFullClose ? 0 : Number(position.qty) - closeQty,
            });

            // Fire-and-forget: don't make TradingView's promise wait on the
            // network round trip (see doc comment above). Errors are handled
            // entirely inside _performClosePosition itself, via toast.
            this._performClosePosition(position, closeQty).catch((err) => {
                this._onToast('Failed to close position', 'error');
                this._host.positionsFullUpdate();
            });
        } catch (err) {
            // Guarantee a toast even on a totally unexpected failure — a
            // silent throw here previously meant the click could appear to
            // just hang with no feedback at all.
            this._onToast('Failed to close position', 'error');
            this._host.positionsFullUpdate();
        }
    }

    /** The actual backend call + result handling, run in the background — see closePosition() doc comment. */
    async _performClosePosition(position, closeQty) {
        const { status, message } = await closePositionApi({ position, amount: closeQty }, this._secretKeyRef.current);
        if (status) {
            this._onToast(message || 'Position closed', 'success');
        } else {
            // Rollback — the position is still live server-side, bring the
            // real position (and its real brackets) back.
            this._onToast(message || 'Failed to close position', 'error');
            this._host.positionsFullUpdate();
        }
    }

    // ── TP/SL brackets ────────────────────────────────────────────────────────

    /**
     * Called when:
     *   - User drags an existing TP/SL line
     *   - User CREATES a TP/SL by dragging in empty space (when supportPositionBrackets=true)
     *
     * `brackets` = { takeProfit?: number, stopLoss?: number }
     *
     * TP/SL validation logic:
     *   Long  position: TP > entry, SL < entry
     *   Short position: TP < entry, SL > entry
     */
    /**
     * @param {string} positionId
     * @param {{ takeProfit?: number, stopLoss?: number }} brackets
     * @param {object} [_customFields] optional TradingView custom dialog fields
     */
    async editPositionBrackets(positionId, brackets, _customFields) {
        devBrokerLog('editPositionBrackets detail', positionId, brackets, _customFields);

        // ── Drag-start: mark drag active so Redux effect skips positionsFullUpdate ──
        // This is the single most important guard: without it, live PnL ticks trigger
        // positionsFullUpdate() which TradingView treats as a full position-line
        // redraw — cancelling the TP/SL drag gesture mid-flight and hiding the label.
        this.isDraggingBracket = true;
        if (this._dragClearTimer) clearTimeout(this._dragClearTimer);

        const position = this._resolvePosition(positionId);
        if (!position) {
            this.isDraggingBracket = false;
            return;
        }

        const entry = position.avgPrice;
        const side = position.side;

        // Sanitize raw values from TradingView — filter out NaN / non-numeric prices
        const rawTp = brackets.takeProfit !== undefined ? Number(brackets.takeProfit) : undefined;
        const rawSl = brackets.stopLoss !== undefined ? Number(brackets.stopLoss) : undefined;

        const tp = (rawTp !== undefined && !isNaN(rawTp) && rawTp > 0) ? rawTp : undefined;
        const sl = (rawSl !== undefined && !isNaN(rawSl) && rawSl > 0) ? rawSl : undefined;

        // If neither TP nor SL is a valid number, ignore silently
        if (tp === undefined && sl === undefined) {
            this.isDraggingBracket = false;
            return;
        }

        // A fresh, explicit add/drag always overrides a previous cancel's
        // removal pin (see BrokerStateManager) — otherwise re-adding a
        // bracket moments after cancelling it wouldn't show up until that
        // pin naturally expired.
        if (tp !== undefined) this._state.clearPositionBracketRemovalPin(positionId, 'takeProfit');
        if (sl !== undefined) this._state.clearPositionBracketRemovalPin(positionId, 'stopLoss');

        // Validate prices — on invalid, snap back and clear drag flag immediately
        if (tp !== undefined && !isTpValid(tp, entry, side)) {
            this._onToast(
                side === Side.BUY
                    ? 'Take Profit must be above entry price for a long position'
                    : 'Take Profit must be below entry price for a short position',
                'error',
            );
            this._host.positionsFullUpdate();
            this.isDraggingBracket = false;
            return;
        }

        if (sl !== undefined && !isSlValid(sl, entry, side)) {
            this._onToast(
                side === Side.BUY
                    ? 'Stop Loss must be below entry price for a long position'
                    : 'Stop Loss must be above entry price for a short position',
                'error',
            );
            this._host.positionsFullUpdate();
            this.isDraggingBracket = false;
            return;
        }

        // Optimistic update: push the new brackets to TV immediately so the label
        // shows the dragged-to price without waiting for the backend round-trip.
        const effectiveBrackets = {
            ...(tp !== undefined && { takeProfit: tp }),
            ...(sl !== undefined && { stopLoss: sl }),
        };
        const updatedPos = {
            ...position,
            ...effectiveBrackets,
        };
        this._host.positionUpdate(updatedPos);

        // Pin the dragged TP/SL values. This is the actual fix for "chart
        // still shows the old TP/SL line after releasing the drag": the
        // backend fires ONE shared refresh (position + open orders + stop
        // orders together) on every future event for this account/pair —
        // not only this drag. Any other concurrent event for the same user
        // that gets queried/delivered before our own updateBrackets() write
        // lands carries the OLD takeProfit/stopLoss (a real, non-undefined
        // value — just stale), which used to silently overwrite what we
        // just dragged to on the very next Redux/socket tick. The pin keeps
        // the chart's bracket line honest for a short window until things
        // settle, without touching any other flow.
        this._state.pinPositionPatch(positionId, effectiveBrackets);

        // Also pin the underlying bracket ORDER lines (the actual thing that
        // draws/moves on the chart — see _syncBracketOrders doc above) so a
        // concurrent stale orders/positions snapshot can't revert those either.
        if (tp !== undefined) {
            this._state.pinOrderPatch(
                this._bracketOrderId(positionId, 'tp'),
                { limitPrice: tp, price: tp },
            );
        }
        if (sl !== undefined) {
            this._state.pinOrderPatch(
                this._bracketOrderId(positionId, 'sl'),
                { stopPrice: sl, price: sl },
            );
        }

        // Also update local state immediately so the signature guard in
        // useBrokerAdapter sees the new bracket values on the next Redux tick —
        // preventing a stale-bracket Redux update from changing the signature and
        // re-triggering positionsFullUpdate while the drag is still in progress.
        // This also drives _syncBracketOrders (via _onStateChange) to create/
        // move the actual bracket Order line on the chart.
        this._state.upsertPosition(updatedPos);

        // Debounced backend call (300ms) — absorbs rapid drag mouse-moves
        if (!this._debouncedBracket.has(positionId)) {
            this._debouncedBracket.set(positionId, debounce(async (pid, bkts, snap) => {
                try {
                    const { status, message } = await updateBrackets(
                        { position: snap, brackets: bkts, pairId: this._pairIdRef?.current },
                        this._secretKeyRef.current,
                    );
                    if (status) {
                        // Commit to state so next WS diff is correct
                        this._state.upsertPosition({ ...snap, ...bkts });
                        this._host.positionsFullUpdate();
                        this._host.ordersFullUpdate();
                        this._onToast(message || 'TP/SL updated', 'success');
                    } else {
                        // Rollback — release the pins first, then restore the
                        // true pre-drag position (this re-syncs the bracket
                        // Order line(s) back to their real values too, not
                        // just the position labels).
                        this._state.clearPositionPin(pid);
                        this._state.clearOrderPin(this._bracketOrderId(pid, 'tp'));
                        this._state.clearOrderPin(this._bracketOrderId(pid, 'sl'));
                        this._state.upsertPosition(snap);
                        this._host.positionsFullUpdate();
                        this._host.ordersFullUpdate();
                        this._onToast(message || 'TP/SL update failed', 'error');
                    }
                } finally {
                    this._dragClearTimer = setTimeout(() => {
                        this.isDraggingBracket = false;
                        this._dragClearTimer = null;
                    }, 600);
                }
            }, 300));
        }

        this._debouncedBracket.get(positionId)(positionId, effectiveBrackets, position);
    }

    // ── Symbol info & formatters ──────────────────────────────────────────────

    /**
     * TradingView calls this to get price scale / formatting for order prices.
     * CRITICAL: must return a valid object or TradingView logs "formatter not received".
     *
     * NOTE: our CustomDatafeed's resolveSymbol() only returns price-related
     * fields (pricescale, minmov, minTick, etc.) — it has no concept of
     * quantity precision. TradingView's trading panel (_createTradedSymbol →
     * _resubscribeQtySuggester → getQty) requires a `qty: { min, max, step,
     * default }` object on this result, and throws a TypeError reading
     * `.default` off `undefined` if it's missing. So we always guarantee a
     * `qty` object here — using the datafeed's own value if it ever provides
     * one, otherwise this safe default.
     */
    /**
     * Fire-and-forget warm-up for symbolInfo() (and, transitively, the
     * datafeed's own resolveSymbol cache). Called once at construction for
     * whatever symbol is already loaded, and again from TradingViewChart.jsx
     * whenever the symbol changes.
     *
     * Why this matters: TradingView's native quick-order context menu (the
     * "+" button on the price scale, per TradingView's Trading Terminal
     * docs on the price-scale context menu) is built by
     * `host.defaultContextMenuActions()`, which — confirmed against the
     * bundled charting_library runtime — awaits `isTradable()` and
     * `getSymbolSpecificTradingOptions()` sequentially, then
     * `Promise.all([qtySuggester.getQty(), realtimeProvider.symbolInfo(), ...])`
     * before it can render a single menu item. Those internal calls are
     * outside our code and not configurable via any documented override,
     * but they all ultimately depend on the SAME symbol resolution our own
     * `symbolInfo()` performs. If that happens to be the first-ever call
     * for this symbol (a cold `_symbolInfoCache` miss → a real
     * `datafeed.resolveSymbol()` round-trip), the menu waits on it. Once
     * warmed here — well before the user ever clicks "+" — that whole path
     * resolves from cache instead, which is the only part of this delay we
     * can actually influence.
     */
    prewarmSymbolInfo(symbol) {
        if (!symbol) return;
        this.symbolInfo(symbol).catch(() => { /* symbolInfo() already has its own fallback path */ });
    }

    async symbolInfo(symbol) {
        if (!symbol) {
            // Guard against callers passing an incomplete order/symbol — avoid
            // crashing TradingView's internal notification pipeline; nothing
            // upstream should normally hit this now that orderRemoved carries
            // the full order, but this keeps symbolInfo() safe regardless.
            const pairId = this._pairIdRef?.current;
            symbol = (typeof pairId === 'string' && pairId) || 'UNKNOWN';
        }
        const key = symbol.toUpperCase();
        if (this._symbolInfoCache.has(key)) return this._symbolInfoCache.get(key);
        const datafeed = this._datafeeRef?.current ?? this._datafeeRef;
        const DEFAULT_QTY = { min: 0.001, max: 1_000_000, step: 0.001, default: 0.01 };

        const buildInfo = (info = {}) => {
            const pricescale = info.pricescale || 100;
            const minmov = info.minmov || 1;
            const minTick = info.minTick || (minmov / pricescale);
            const pipSize = info.pipSize || minTick;
            const pipValue = info.pipValue || 1;
            return {
                name: symbol,
                ticker: key,
                description: symbol,
                type: 'forex',
                session: '24x7',
                exchange: '',
                timezone: 'Etc/UTC',
                pricescale,
                minmov,
                minTick,
                pipSize,
                pipValue,
                format: 'price',
                brokerSymbol: key,
                currency: 'USD',
                qty: info?.qty ?? DEFAULT_QTY,
                ...info,
            };
        };

        const promise = await new Promise((resolve) => {
            if (datafeed?.resolveSymbol) {
                datafeed.resolveSymbol(
                    symbol,
                    (info) => {
                        const result = buildInfo(info);
                        this._symbolInfoCache.set(key, result); // ✅ replace Promise with resolved value
                        resolve(result);
                    },
                    (err) => {
                        const info = buildInfo({});
                        this._symbolInfoCache.set(key, info);
                        resolve(info);
                    }
                );
            } else {
                // Default safe fallback — always resolves
                const info = buildInfo({});
                this._symbolInfoCache.set(key, info);
                resolve(info);
            }
        });
        return promise;
    }

    async formatter(symbol) {
        const key = String(symbol || '').toUpperCase();
        if (this._formatterCache.has(key)) return this._formatterCache.get(key);

        const info = await this.symbolInfo(symbol);
        const pricescale = info?.pricescale || 100;
        const decimals = Math.max(0, Math.round(Math.log10(pricescale)));
        const result = {
            format: (price, signPositive) => {
                if (price == null || !Number.isFinite(price)) return 'n/a';
                const fmt = price.toFixed(decimals);
                return signPositive && price > 0 ? '+' + fmt : fmt;
            },
            parse: (str) => parseFloat(str),
            formatChange: (change) => {
                if (!Number.isFinite(change)) return 'n/a';
                return (change >= 0 ? '+' : '') + change.toFixed(decimals);
            },
        };
        this._formatterCache.set(key, result);
        return result;
    }

    async quantityFormatter() {
        return {
            format: (qty) => {
                if (qty == null || !Number.isFinite(qty)) return '0';
                return parseFloat(qty).toFixed(3);
            },
            parse: (str) => parseFloat(str),
        };
    }

    async spreadFormatter(symbol) {
        const key = String(symbol || '').toUpperCase();
        if (this._spreadFormatterCache.has(key)) return this._spreadFormatterCache.get(key);

        const info = await this.symbolInfo(symbol);
        const pricescale = info?.pricescale || 100;
        const decimals = Math.max(0, Math.round(Math.log10(pricescale)));

        const result = {
            format: (price) => {
                if (price === null || price === undefined || isNaN(price)) return "n/a";
                return parseFloat(price).toFixed(decimals);
            },
            parse: (str) => parseFloat(str),
        };
        this._spreadFormatterCache.set(key, result);
        return result;
    }

    // ── Equity subscription (called when Order Ticket opens/closes) ───────────

    /**
     * Optional — called when user opens the Order Ticket.
     * TV expects this to push equity updates via host.equityUpdate().
     * We currently have no real equity concept, so this is a no-op stub
     * that satisfies the IBrokerTerminal interface.
     */
    subscribeEquity() {
        // No-op: we don't push equity updates.
        // If you add balance/equity tracking, call this._host.equityUpdate(equity) here.
        return true
    }

    unsubscribeEquity() {
        // No-op: matching subscribeEquity stub.
    }

    // ── Position TP/SL → real bracket Order lines ──────────────────────────
    //
    // ROOT CAUSE of "drag TP/SL, DB/toast/history update correctly, but the
    // chart line itself never moves": TradingView's Position object has NO
    // takeProfit/stopLoss rendering support on its own (confirmed against
    // TradingView's own charting_library/broker-api.d.ts PositionBase type
    // and its official broker-sample reference implementation). Calling
    // host.positionUpdate() with takeProfit/stopLoss stuffed onto the
    // position only feeds the Account Manager labels/PnL — it does NOT draw
    // or move the connected line on the chart.
    //
    // The chart's bracket line is actually a separate Order object, linked
    // to the position via `parentId` (= position.id) and `parentType`
    // (= ParentType.Position), included in the SAME array returned by
    // orders(). TradingView finds it by that parentId and draws/drags it as
    // the position's TP or SL line — exactly like the official broker-sample
    // does in editPositionBrackets() → _updatePositionsBracket() →
    // _updateOrder(bracket).
    //
    // These helpers keep that bracket Order in sync every time a position's
    // takeProfit/stopLoss changes, from ANY source (drag, the Stop-Orders
    // socket reconciliation, initial page load) — wired once via
    // _onStateChange below, so every path gets it for free.

    /** Stable id for a position's TP/SL bracket line before we know the real backend order id. */
    _bracketOrderId(positionId, kind) {
        return `${positionId}::bracket::${kind}`;
    }

    /**
     * Build the TradingView Order object for one side (tp/sl) of a position's bracket.
     * Uses the real backend bracket-order id when we know it (from the position's
     * own aggregation join or the Stop Orders reconciliation) so drag/cancel on
     * this line can act on the backend directly; falls back to a stable synthetic
     * id otherwise (e.g. the instant after a brand-new bracket is dragged into
     * existence, before the backend has confirmed and hand back its real id).
     */
    _buildBracketOrder(position, kind, price) {
        const isTp = kind === 'tp';
        const realId = isTp ? position.takeProfitOrderId : position.stopLossOrderId;
        return {
            // Always the stable synthetic id — see doc comment above. Never
            // swapped for the real backend id, so TradingView keeps treating
            // this as the same order line for its whole life (no spurious
            // "cancelled" + "placed" notification pair when the backend
            // confirms and hands back its own id).
            id: this._bracketOrderId(position.id, kind),
            _realOrderId: realId || null,
            symbol: position.symbol,
            type: isTp ? OrderType.LIMIT : OrderType.STOP,
            side: position.side === Side.BUY ? Side.SELL : Side.BUY, // opposite side closes the position
            qty: position.qty,
            status: OrderStatus.WORKING,
            parentId: position.id,
            parentType: PARENT_TYPE_POSITION,
            limitPrice: isTp ? price : undefined,
            stopPrice: isTp ? undefined : price,
            stopType: isTp ? undefined : STOP_TYPE_STOP_LOSS,
            price,
            currency: position.currency || 'USDT',
            isEditable: true,
            isCancelable: true,
            _bracketKind: kind,
        };
    }

    /**
     * Create/update the bracket Order line(s) for whichever of TP/SL this
     * position currently has, and remove the ones it doesn't (bracket was
     * cleared/cancelled). Safe to call on every position change — cheap,
     * idempotent, and this is the ONLY thing that actually draws/moves the
     * TP/SL line on the chart.
     */
    _syncBracketOrders(position) {
        if (!position) return;
        const tpSyntheticId = this._bracketOrderId(position.id, 'tp');
        const slSyntheticId = this._bracketOrderId(position.id, 'sl');

        if (position.takeProfit) {
            // Same id every time (see _buildBracketOrder) — this is now a
            // plain update, not a remove+recreate, so TradingView shows the
            // line moving without re-firing a "placed" notification.
            this._state.upsertOrder(this._buildBracketOrder(position, 'tp', position.takeProfit));
        } else if (this._state.getOrder(tpSyntheticId)) {
            this._state.removeOrder(tpSyntheticId);
        }

        if (position.stopLoss) {
            this._state.upsertOrder(this._buildBracketOrder(position, 'sl', position.stopLoss));
        } else if (this._state.getOrder(slSyntheticId)) {
            this._state.removeOrder(slSyntheticId);
        }
    }

    /** Remove both bracket lines when a position is fully closed. */
    _removeBracketOrders(positionId) {
        const tpId = this._bracketOrderId(positionId, 'tp');
        const slId = this._bracketOrderId(positionId, 'sl');
        if (this._state.getOrder(tpId)) this._state.removeOrder(tpId);
        if (this._state.getOrder(slId)) this._state.removeOrder(slId);
    }

    // ── Custom order lines (plain limit orders) ────────────────────────────────
    //
    // TradingView's built-in broker order-line rendering for a LIMIT order is
    // a fixed template ("0.010 Sell Limit" + a separate price tag) with no
    // documented way to change the label text — see BrokerOrderOverrides in
    // charting_library.d.ts, which only exposes colors (handled separately via
    // trading_customization in TradingViewChart.jsx for every OTHER order
    // type). To get a clean "sell @ 574.18" line with just a quantity badge
    // and an X, we draw these ourselves with chart.createOrderLine() instead
    // of letting TradingView auto-draw them, and keep them out of
    // orders()/host.orderUpdate() entirely (see _isCustomLimitOrder and its
    // use in orders() and _onStateChange above) so TV never also tries to
    // draw its own line for the same order.
    //
    // Everything about the order's actual lifecycle — placing, dragging to
    // reprice (debounce + pin + single toast), cancelling, backend/history/
    // socket sync — is untouched: these lines just call straight into the
    // existing modifyOrder()/cancelOrder() methods, the same ones every other
    // order type already uses.

    /** Bracket TP/SL lines keep their existing native rendering — this is scoped to plain, unfilled limit orders only. */
    _isCustomLimitOrder(order) {
        return !!order && order.type === OrderType.LIMIT && order.parentType !== PARENT_TYPE_POSITION;
    }

    _getChart() {
        try {
            return this._chartRef?.current?.activeChart?.() ?? null;
        } catch {
            return null;
        }
    }

    _formatPriceSync(symbol, price) {
        const num = Number(price);
        if (!Number.isFinite(num)) return String(price ?? '');
        const info = this._symbolInfoCache.get(String(symbol || '').toUpperCase());
        const pricescale = info?.pricescale || 100;
        const decimals = Math.max(0, Math.round(Math.log10(pricescale)));
        return num.toFixed(decimals);
    }

    _formatQtySync(qty) {
        const n = parseFloat(qty);
        return Number.isFinite(n) ? n.toFixed(3) : '0';
    }

    _formatCustomOrderLineText(order) {
        const sideWord = order.side === Side.BUY ? 'buy' : 'sell';
        const price = order.limitPrice ?? order.price;
        return `${sideWord} @ ${this._formatPriceSync(order.symbol, price)}`;
    }

    /** Push the latest price/qty/side/status onto an already-created line. */
    _applyCustomOrderLineFields(line, order) {
        const isBuy = order.side === Side.BUY;
        const color = isBuy ? '#2EBD85' : '#F6465D'; // app's own green/red accent colors (--color-green-03 / --color-red-01)
        const font = 'bold 12px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
        const price = order.limitPrice ?? order.price;
        try {
            line
                .setPrice(price)
                .setText(this._formatCustomOrderLineText(order))
                .setQuantity(this._formatQtySync(order.qty))
                .setEditable(order.isEditable !== false)
                .setCancellable(order.isCancelable !== false)
                .setLineColor(color)
                .setLineWidth(2)
                // Solid color background + white bold text for both the main
                // label and the quantity badge, for clear contrast against
                // candles of the same color behind the line.
                .setBodyBackgroundColor(color)
                .setBodyBorderColor(color)
                .setBodyTextColor('#FFFFFF')
                .setBodyFont(font)
                .setQuantityBackgroundColor(color)
                .setQuantityTextColor('#FFFFFF')
                .setQuantityFont(font)
                .setCancelButtonBackgroundColor(color)
                .setCancelButtonIconColor('#FFFFFF');
        } catch (err) {
            console.warn('[BrokerAdapter] failed to update custom order line', err);
        }
    }

    /** Create (if needed) or update the custom line for one plain limit order. */
    _syncCustomOrderLine(order, _retryCount = 0) {
        const id = String(order.id);

        // Don't let a background socket/state resync fight an active drag —
        // without this, any 'orderUpdated'/'ordersChanged' arriving mid-drag
        // would call setPrice() with the old (pre-drag) price and snap the
        // line straight back. Mirrors the isDraggingBracket guard used for TP/SL.
        if (this._draggingCustomOrderLineId === id) return;

        if (order.status !== OrderStatus.WORKING) {
            // Filled/cancelled/inactive — nothing to show.
            this._removeCustomOrderLine(id);
            return;
        }

        const chart = this._getChart();
        if (!chart) {
            // BUG FIX: this used to just `return` here with a comment
            // claiming "the next 'ordersChanged' resync will retry" — true
            // only if something actually changes about this order later.
            // On a hard refresh, the initial order hydration (which is what
            // calls this, via _syncAllCustomOrderLines on the first
            // 'ordersChanged' event) can easily race ahead of the chart
            // widget's own slower async initialization — charting_library
            // is a large bundle with its own resolveSymbol/getBars/render
            // pipeline to get through. For a pre-existing order that just
            // sits there resting and unmodified, NOTHING ever fires another
            // 'ordersChanged' afterward to retry this — so a line that
            // failed to attach here on that first pass stayed permanently
            // missing from the chart for the rest of the session, even
            // though the Order Book and Open Orders table (populated from
            // a separate, chart-independent data path) correctly showed
            // the order the whole time. Retrying with backoff here, mirroring
            // the exact same pattern the createOrderLine().catch() block
            // below already uses for its own different failure case, closes
            // this gap the same way.
            if (_retryCount < 10) {
                setTimeout(() => {
                    const cur = this._state.getOrder(id);
                    if (cur && this._isCustomLimitOrder(cur) && !this._customOrderLines.has(id)) {
                        this._syncCustomOrderLine(cur, _retryCount + 1);
                    }
                }, 500 * (_retryCount + 1));
            } else {
            }
            return;
        }

        const existing = this._customOrderLines.get(id);
        if (existing) {
            if (existing.line) {
                this._applyCustomOrderLineFields(existing.line, order);
            } else {
                // Creation is still in flight — stash the freshest order so
                // the .then() below applies up-to-date fields once ready.
                existing.pendingOrder = order;
            }
            return;
        }

        // Reserve the slot immediately (createOrderLine() is async) so a
        // second sync arriving before creation resolves can't create a
        // duplicate line for the same order.
        const entry = { line: null, pendingOrder: order };
        this._customOrderLines.set(id, entry);

        chart.createOrderLine()
            .then((line) => {
                // The order may have been cancelled/removed while this was
                // in flight — don't attach a line for a slot that's gone or
                // was replaced.
                if (this._customOrderLines.get(id) !== entry) {
                    try { line.remove(); } catch { void 0; }
                    return;
                }
                entry.line = line;
                line
                    .onCancel(id, (lineId) => { this.cancelOrder(lineId); })
                    // IMPORTANT: onMove fires when a drag gesture actually
                    // completes ("the order line is moved" per TradingView's
                    // own docs) — onModify is a different, more generic
                    // callback that can fire without any real position
                    // change (e.g. from a plain click), which was the root
                    // cause of drags appearing to do nothing.
                    .onMove(id, (lineId) => {
                        const l = this._customOrderLines.get(lineId)?.line;
                        const cur = this._state.getOrder(lineId);
                        if (!l || !cur) return;

                        // Gesture is done — release the drag guard so normal
                        // syncing (and the toast/final price below) can land.
                        if (this._draggingCustomOrderLineId === lineId) this._draggingCustomOrderLineId = null;
                        if (this._customDragClearTimer) {
                            clearTimeout(this._customDragClearTimer);
                            this._customDragClearTimer = null;
                        }

                        // Immediate feedback while the backend call is in
                        // flight — our custom line doesn't get TradingView's
                        // own native "in progress" treatment for free like
                        // its built-in order lines do, so show it ourselves.
                        // _syncCustomOrderLine() (via the eventual
                        // 'orderUpdated'/rollback event) replaces this with
                        // the real confirmed price/text once modifyOrder()
                        // settles either way.
                        try { l.setText('Updating...'); } catch { void 0; }

                        // Reuses the exact same modifyOrder() path as every
                        // other order — debounce, pin, single toast, rollback.
                        this.modifyOrder({ id: lineId, limitPrice: l.getPrice(), price: l.getPrice(), qty: cur.qty });
                    })
                    .onMoving(id, (lineId) => {
                        // Live-update the label text while dragging — the
                        // line's own price tag already follows the cursor
                        // natively, but our price is also embedded in the
                        // text ("sell @ price"), so that needs updating too.
                        const l = this._customOrderLines.get(lineId)?.line;
                        const cur = this._state.getOrder(lineId);
                        if (!l || !cur) return;

                        // Logged only once per drag gesture (not on every
                        // fired event, which would flood the console) —
                        // confirms drag-in-progress events are reaching this
                        // custom line at all, independent of whether the
                        // gesture later completes via onMove.
                        if (this._draggingCustomOrderLineId !== lineId) {
                        }

                        this._draggingCustomOrderLineId = lineId;
                        if (this._customDragClearTimer) clearTimeout(this._customDragClearTimer);
                        // Safety net in case onMove never fires (e.g. the
                        // gesture ends outside a valid drop target) — don't
                        // let the guard block syncing forever.
                        this._customDragClearTimer = setTimeout(() => {
                            if (this._draggingCustomOrderLineId === lineId) this._draggingCustomOrderLineId = null;
                        }, 2000);

                        l.setText(this._formatCustomOrderLineText({ ...cur, limitPrice: l.getPrice(), price: l.getPrice() }));
                    });
                this._applyCustomOrderLineFields(line, entry.pendingOrder);
            })
            .catch((err) => {
                if (this._customOrderLines.get(id) === entry) this._customOrderLines.delete(id);

                // Transient — typically the chart's price series isn't fully
                // attached yet (right after a symbol switch, a full widget
                // rebuild, or a fast page load racing ahead of
                // onDataLoaded/refresh()). Retry with backoff rather than
                // leaving this order with no line at all. Only log if we've
                // genuinely exhausted retries — logging on every intermediate
                // attempt made a self-healing, expected race look like a real
                // recurring error.
                if (_retryCount < 6) {
                    setTimeout(() => {
                        const cur = this._state.getOrder(id);
                        if (cur && this._isCustomLimitOrder(cur) && !this._customOrderLines.has(id)) {
                            this._syncCustomOrderLine(cur, _retryCount + 1);
                        }
                    }, 500 * (_retryCount + 1));
                } else {
                    console.warn('[BrokerAdapter] createOrderLine failed after retries — giving up on this line', err);
                }
            });
    }

    _removeCustomOrderLine(id) {
        const key = String(id);
        const entry = this._customOrderLines.get(key);
        if (!entry) return;
        this._customOrderLines.delete(key);
        if (entry.line) {
            try { entry.line.remove(); } catch { void 0; }
        }
        if (this._draggingCustomOrderLineId === key) this._draggingCustomOrderLineId = null;
        // If creation was still in flight, the .then() callback above will
        // see the map entry is gone and clean up the line itself.
    }

    /** Full resync — called on every 'ordersChanged' bulk refresh. */
    _syncAllCustomOrderLines() {
        const known = new Set();
        for (const order of this._state.getOrders()) {
            if (!this._isCustomLimitOrder(order)) continue;
            known.add(String(order.id));
            this._syncCustomOrderLine(order);
        }
        for (const id of [...this._customOrderLines.keys()]) {
            if (!known.has(id)) this._removeCustomOrderLine(id);
        }
    }

    // ── State change → TradingView host notifications ─────────────────────────

    /**
     * Translates BrokerStateManager events into TradingView host API calls.
     * This is the bridge between in-memory state and the chart's vis ual layer.
     */
    _onStateChange(type, payload) {
        try {
            devBrokerLog('state', type, payload);
            switch (type) {
                case 'ordersChanged':
                    // Custom-rendered limit orders (see _syncCustomOrderLine
                    // doc) aren't reported to TradingView at all, so a bulk
                    // refresh needs its own resync pass in addition to the
                    // native ordersFullUpdate() for everything else.
                    this._syncAllCustomOrderLines();
                    this._host.ordersFullUpdate();
                    break;
                case 'orderUpdated':
                    if (this._isCustomLimitOrder(payload)) {
                        this._syncCustomOrderLine(payload);
                    } else {
                        this._host.orderUpdate(payload);
                    }
                    break;
                case 'orderRemoved': {
                    // payload is now the full last-known order object (see
                    // BrokerStateManager.removeOrder) — fall back to treating
                    // it as a bare id for safety if an older/other caller ever
                    // emits just a string here.
                    const removed = (payload && typeof payload === 'object')
                        ? payload
                        : { id: payload };
                    if (this._isCustomLimitOrder(removed)) {
                        this._removeCustomOrderLine(removed.id);
                    } else {
                        this._host.orderUpdate({ ...removed, status: OrderStatus.CANCELED });
                    }
                    break;
                }
                case 'positionsChanged':
                    // Keep every position's bracket ORDER line(s) in sync before
                    // telling TV to redraw — see _syncBracketOrders doc above.
                    this._state.getPositions().forEach((p) => this._syncBracketOrders(p));
                    this._host.positionsFullUpdate();
                    break;
                case 'positionUpdated':
                    this._syncBracketOrders(payload);
                    this._host.positionUpdate(payload);
                    break;
                case 'positionRemoved':
                    this._removeBracketOrders(payload);
                    // Push qty=0 → TV hides the position line
                    this._host.positionUpdate({ id: payload, qty: 0 });
                    break;
                case 'pnlUpdated':
                    this._host.plUpdate(payload.id, payload.profit);
                    break;
                case 'reset':
                    this._host.ordersFullUpdate();
                    this._host.positionsFullUpdate();
                    break;
                default:
                    break;
            }
        } catch {
            // Host methods can throw if the widget is being destroyed — swallow silently
        }
    }


    // ── Public helpers (called from the React hook) ───────────────────────────

    /**
     * Force TradingView to re-fetch orders and positions.
     * Call this after loading initial data into the state manager.
     */
    refresh() {
        try {
            this._host.ordersFullUpdate();
            this._host.positionsFullUpdate();
            // Retry custom order lines too — on a page load/refresh, order
            // data can land in state before the chart is actually ready to
            // draw on, and nothing else retries them afterward otherwise.
            this._syncAllCustomOrderLines();
        } catch { void 0; }
    }

    /**
     * Push a PnL update for a specific position.
     * Designed to be called on every price tick.
     */
    pushPnlUpdate(positionId, profit) {
        this._state.updatePositionPnl(positionId, profit);
    }

    // ── Cleanup ───────────────────────────────────────────────────────────────

    destroy() {
        // Cancel all pending debounced calls
        for (const fn of this._debouncedModify.values()) fn.cancel();
        for (const fn of this._debouncedBracket.values()) fn.cancel();
        this._debouncedModify.clear();
        this._debouncedBracket.clear();
        this._modifyRequestSeq.clear();
        this._modifyInFlight.clear();
        this._modifyPending.clear();

        // Clear drag-flag safety timer
        if (this._dragClearTimer) {
            clearTimeout(this._dragClearTimer);
            this._dragClearTimer = null;
        }
        this.isDraggingBracket = false;

        // Remove any custom-drawn order lines (see "Custom order lines" above)
        for (const id of [...this._customOrderLines.keys()]) {
            this._removeCustomOrderLine(id);
        }
        if (this._customDragClearTimer) {
            clearTimeout(this._customDragClearTimer);
            this._customDragClearTimer = null;
        }
        this._draggingCustomOrderLineId = null;

        if (this._unsubState) {
            this._unsubState();
            this._unsubState = null;
        }

        this._symbolInfoCache.clear();
        this._formatterCache.clear();
        this._spreadFormatterCache.clear();
    }
}