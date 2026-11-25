/**
 * BrokerStateManager.js
 *
 * Canonical in-memory store for all broker state (orders, positions).
 * Uses Maps for O(1) lookups by ID.
 * Provides a pub/sub system so the BrokerAdapter can push TradingView
 * host notifications whenever state changes.
 *
 * This class is intentionally framework-agnostic (no React imports)
 * so it can be used in tests and re-used across chart instances.
 */

// ─── Order status constants (mirrors TradingView's OrderStatus enum) ──────────
export const OrderStatus = Object.freeze({
    CANCELED:             1,
    INACTIVE:             3,
    PENDING:              4,
    FILLED:               2,
    WORKING:              6,
});

// ─── Order type constants ──────────────────────────────────────────────────────
export const OrderType = Object.freeze({
    LIMIT:      1,
    MARKET:     2,
    STOP:       3,
    STOP_LIMIT: 4,
});

// ─── Side constants ───────────────────────────────────────────────────────────
export const Side = Object.freeze({ BUY: 1, SELL: -1 });

// ─── BrokerStateManager ───────────────────────────────────────────────────────

// Default protective window for a locally-dragged value. See the "pin"
// mechanism below for why this exists.
const PIN_TTL_MS = 6000;

export class BrokerStateManager {
    constructor() {
        /** @type {Map<string, TVOrder>} */
        this._orders = new Map();
        /** @type {Map<string, TVPosition>} */
        this._positions = new Map();
        /** @type {Set<Function>} */
        this._listeners = new Set();

        // Deduplication: track last-seen event IDs to drop duplicate WS frames.
        // _seenPositionEvents maps positionId → last structural signature seen
        // (qty/avgPrice/TP/SL, deliberately excluding PnL — see upsertPosition()).
        this._seenOrderEvents    = new Set();
        this._seenPositionEvents = new Map();

        // True only while an initial snapshot is being loaded into state — see
        // beginHydration()/endHydration() and the guard in upsertOrder().
        this._hydrating = false;

        // ── Drag/edit "pins" ──────────────────────────────────────────────
        //
        // Root cause of "TP/SL (and limit-order-price) drag works, DB/toast/
        // history are correct, but the CHART line snaps back to the old
        // price": the backend fires one shared refresh (positions + open
        // orders + stop orders together) on *every* future-related event for
        // an account — not only the drag you just made. If any other event
        // for the same account/pair (a fill, a conditional-order check,
        // another order matching) happens to be queried right before your
        // own write lands, or its socket frame is simply delivered out of
        // order, it carries the OLD price/TP/SL — a value that is not
        // `undefined`, just stale. setOrders()/setPositions() used to trust
        // any concrete, non-undefined value unconditionally, so that stale
        // snapshot would silently overwrite the value you just dragged to,
        // even though the backend commit for YOUR edit was already correct.
        //
        // Fix: whenever the user (via BrokerAdapter) locally edits an
        // order's price/qty or a position's TP/SL, we "pin" those exact
        // fields for a short window (PIN_TTL_MS). Any full/partial snapshot
        // that arrives while the pin is active gets those specific fields
        // re-applied on top, so a stale concurrent push can't roll back a
        // gesture the user just completed. The pin auto-expires so that,
        // once things have settled, the server is trusted again as normal.
        //
        // id → { patch, expiresAt }
        this._orderPins    = new Map();
        this._positionPins = new Map();
        // id → expiresAt — order was locally cancelled; suppress it from
        // resurrecting via a stale full-snapshot push until the backend
        // catches up (or the pin expires).
        this._orderRemovalPins = new Map();
        // `${positionId}:${kind}` → expiresAt — a position's takeProfit or
        // stopLoss was just explicitly cancelled by the user. Without this,
        // the self-heal logic in setPositions() below (and the equivalent
        // merge in upsertPosition()) can't tell "this snapshot just hasn't
        // caught up yet" apart from "this bracket was genuinely removed",
        // and would keep restoring the stale price forever — which is what
        // made a successfully-cancelled TP/SL line stay stuck on the chart.
        this._positionBracketRemovalPins = new Map();
    }

    // ── Pin helpers ───────────────────────────────────────────────────────

    _isPinExpired(expiresAt) {
        return !expiresAt || Date.now() > expiresAt;
    }

    /** Pin specific fields on an order so incoming snapshots can't stomp them for a short window. */
    pinOrderPatch(id, patch, ttlMs = PIN_TTL_MS) {
        const key = String(id);
        this._orderPins.set(key, { patch: { ...patch }, expiresAt: Date.now() + ttlMs });
        // Re-apply immediately to whatever is currently in the map (if present).
        const cur = this._orders.get(key);
        if (cur) this._orders.set(key, { ...cur, ...patch });
    }

    clearOrderPin(id) {
        this._orderPins.delete(String(id));
    }

    /** Mark an order as locally cancelled so a stale snapshot can't resurrect it. */
    pinOrderRemoval(id, ttlMs = PIN_TTL_MS) {
        this._orderRemovalPins.set(String(id), Date.now() + ttlMs);
    }

    clearOrderRemovalPin(id) {
        this._orderRemovalPins.delete(String(id));
    }

    /** Pin specific bracket (takeProfit/stopLoss) fields on a position. */
    pinPositionPatch(id, patch, ttlMs = PIN_TTL_MS) {
        const key = String(id);
        this._positionPins.set(key, { patch: { ...patch }, expiresAt: Date.now() + ttlMs });
        const cur = this._positions.get(key);
        if (cur) this._positions.set(key, { ...cur, ...patch });
    }

    clearPositionPin(id) {
        this._positionPins.delete(String(id));
    }

    /** Remove just one bracket field (takeProfit or stopLoss) from an in-flight drag pin, if any, without disturbing the other side's pin. */
    clearPositionPinField(id, kind) {
        const key = String(id);
        const pin = this._positionPins.get(key);
        if (!pin || !(kind in pin.patch)) return;
        const patch = { ...pin.patch };
        delete patch[kind];
        if (Object.keys(patch).length === 0) {
            this._positionPins.delete(key);
        } else {
            this._positionPins.set(key, { patch, expiresAt: pin.expiresAt });
        }
    }

    /** Mark a position's takeProfit/stopLoss as explicitly, locally cancelled — see constructor doc. */
    pinPositionBracketRemoval(positionId, kind, ttlMs = PIN_TTL_MS) {
        this._positionBracketRemovalPins.set(`${positionId}:${kind}`, Date.now() + ttlMs);
    }

    clearPositionBracketRemovalPin(positionId, kind) {
        this._positionBracketRemovalPins.delete(`${positionId}:${kind}`);
    }

    _isPositionBracketRemovalPinned(positionId, kind) {
        const key = `${positionId}:${kind}`;
        const expiresAt = this._positionBracketRemovalPins.get(key);
        if (expiresAt === undefined) return false;
        if (this._isPinExpired(expiresAt)) { this._positionBracketRemovalPins.delete(key); return false; }
        return true;
    }

    /** Strip a just-cancelled bracket field back out of a position record, if its removal pin is active. */
    _applyBracketRemovalPins(positionId, pos) {
        if (this._isPositionBracketRemovalPinned(positionId, 'takeProfit')) {
            delete pos.takeProfit;
            delete pos.takeProfitOrderId;
        }
        if (this._isPositionBracketRemovalPinned(positionId, 'stopLoss')) {
            delete pos.stopLoss;
            delete pos.stopLossOrderId;
        }
        return pos;
    }

    /** Return the active (non-expired) patch for an order pin, or null. Lazily prunes expired entries. */
    _activeOrderPin(key) {
        const pin = this._orderPins.get(key);
        if (!pin) return null;
        if (this._isPinExpired(pin.expiresAt)) { this._orderPins.delete(key); return null; }
        return pin.patch;
    }

    _activePositionPin(key) {
        const pin = this._positionPins.get(key);
        if (!pin) return null;
        if (this._isPinExpired(pin.expiresAt)) { this._positionPins.delete(key); return null; }
        return pin.patch;
    }

    _isOrderRemovalPinned(key) {
        const expiresAt = this._orderRemovalPins.get(key);
        if (expiresAt === undefined) return false;
        if (this._isPinExpired(expiresAt)) { this._orderRemovalPins.delete(key); return false; }
        return true;
    }

    // ── Orders ────────────────────────────────────────────────────────────────

    /** Replace the entire order list (called on initial load & full refresh) */
    setOrders(orderList = []) {
        const next = new Map();
        // Preserve bracket-order entries (the position's TP/SL lines, linked
        // via parentId — see BrokerAdapter._syncBracketOrders). They are kept
        // in sync from position updates, not from this regular open-orders
        // snapshot, whose orderList never contains them (bracket orders use
        // status 'conditional', excluded from the open/pending orders query).
        // Without this, every 'FuturesopenOrder' refresh — which happens on
        // nearly every future event for the account — would wipe the just-
        // synced bracket lines back out of state.
        for (const [key, existing] of this._orders) {
            if (existing?.parentId !== undefined) next.set(key, existing);
        }
        for (const o of orderList) {
            const key = String(o.id);
            // A locally-cancelled order shouldn't reappear just because a
            // concurrent/late snapshot was queried before the cancel landed.
            if (this._isOrderRemovalPinned(key)) continue;
            const pin = this._activeOrderPin(key);
            next.set(key, pin ? { ...o, ...pin } : o);
        }
        this._orders = next;
        this._emit('ordersChanged', [...this._orders.values()]);
    }

    /**
     * Hydration window — wraps loading an initial snapshot into state.
     *
     * Root cause of "every visit to the chart re-announces old orders":
     * TradingView's own order-lifecycle notification (the vendored bottom-left
     * toast, e.g. "Take Profit order placed on BNBUSDT") fires off
     * host.orderUpdate(). That is the *delta* channel, and it's correct for a
     * live socket push — but hydration went through the exact same path
     * (loadInitialData -> setOrders/setPositions -> _syncBracketOrders ->
     * upsertOrder -> 'orderUpdated' -> host.orderUpdate), so every pre-existing
     * order got announced as if it had just been placed. _seenOrderEvents can't
     * help: it's per-instance, so a brand-new document (the mobile app builds a
     * fresh WebView on every navigation to the chart, and a desktop hard-refresh
     * does the same) always starts with an empty set.
     *
     * TradingView's API already separates the two cases - host.ordersFullUpdate()
     * is the "here is current state" bulk channel and does NOT announce. So while
     * hydrating we suppress the per-order delta emission and let the single
     * 'ordersChanged' emitted here drive one ordersFullUpdate() instead. Orders
     * are still fully merged into state meanwhile, and every dedupe key is still
     * recorded, so the first genuine live change after this still announces
     * normally.
     */
    beginHydration() {
        this._hydrating = true;
    }

    endHydration() {
        if (!this._hydrating) return;
        this._hydrating = false;
        this._emit('ordersChanged', [...this._orders.values()]);
    }

    /**
     * Upsert a single order (called from WebSocket update).
     * Returns true if the state actually changed.
     */
    upsertOrder(order) {
        const key = String(order.id);
        if (this._isOrderRemovalPinned(key)) return false;
        const prev = this._orders.get(key);

        // Deduplication — include filledQty so partial fills are not collapsed.
        // This only gates whether we *notify* TradingView again (which is what
        // drives its order-lifecycle toast); we still merge and store the
        // latest fields below regardless, so quiet metadata updates (like a
        // bracket order's real backend id arriving) are never lost.
        const dedupeKey = `${key}:${order.status}:${order.price}:${order.qty}:${order.filledQty ?? ''}`;
        const alreadyNotified = this._seenOrderEvents.has(dedupeKey);
        if (!alreadyNotified) {
            this._seenOrderEvents.add(dedupeKey);
            if (this._seenOrderEvents.size > 500) {
                // Prevent unbounded growth
                const [first] = this._seenOrderEvents;
                this._seenOrderEvents.delete(first);
            }
        }

        // Merge — don't overwrite with undefined fields
        let merged = prev ? { ...prev, ...order } : { ...order };
        const pin = this._activeOrderPin(key);
        if (pin) merged = { ...merged, ...pin };
        this._orders.set(key, merged);

        if (alreadyNotified) return false;
        // Hydration: state is up to date (merged above) and the dedupe key is
        // recorded, but stay off the delta channel — endHydration() reports the
        // whole snapshot at once via ordersFullUpdate(), which doesn't announce.
        // See beginHydration()'s doc.
        if (this._hydrating) return false;
        this._emit('orderUpdated', merged);
        return true;
    }

    removeOrder(id) {
        const key = String(id);
        this.clearOrderPin(key);
        this.clearOrderRemovalPin(key);
        if (!this._orders.has(key)) return false;
        // Snapshot the full order before deleting it — consumers of the
        // 'orderRemoved' event (see BrokerAdapter._onStateChange) need the
        // complete order (symbol, side, qty, etc.), not just the id, to
        // safely tell TradingView about the cancellation.
        const removedOrder = this._orders.get(key);
        this._orders.delete(key);
        this._emit('orderRemoved', { ...removedOrder, id: key });
        return true;
    }

    getOrder(id) { return this._orders.get(String(id)) ?? null; }

    getOrders() { return [...this._orders.values()]; }

    // ── Positions ─────────────────────────────────────────────────────────────

    setPositions(positionList = []) {
        // BUG FIX / defense-in-depth: this used to hard-`clear()` + rebuild,
        // so ANY Redux/socket-driven refresh whose incoming record didn't
        // carry takeProfit/stopLoss (e.g. normalizePosition() upstream not
        // reading the bracket-order join correctly, or that join simply
        // lagging one tick behind a just-confirmed bracket commit) would
        // silently ERASE a TP/SL we already had correctly recorded for that
        // same position — even though nothing about the bracket actually
        // changed. Since these refreshes fire very frequently (on almost
        // every PnL/position tick, per the live console traffic), a brief
        // upstream lag was enough to make a just-dragged TP/SL revert to
        // "not set" within about a second, which is what "chart still shows
        // entry price only" looks like from the outside. Preserve the
        // previously-known bracket for the same id when qty/avgPrice/side
        // are unchanged and the new record doesn't explicitly provide one.
        const next = new Map();
        for (const p of positionList) {
            const key = String(p.id);
            const prev = this._positions.get(key);
            const merged = { ...p };
            if (prev && prev.qty === p.qty && prev.avgPrice === p.avgPrice && prev.side === p.side) {
                if (merged.takeProfit === undefined && prev.takeProfit !== undefined) {
                    merged.takeProfit = prev.takeProfit;
                }
                if (merged.stopLoss === undefined && prev.stopLoss !== undefined) {
                    merged.stopLoss = prev.stopLoss;
                }
            }
            // Pin takes priority over both the incoming snapshot AND the
            // undefined-only self-heal above — this is what actually closes
            // the race: a snapshot queried/delivered slightly before our own
            // bracket write lands still carries a real (non-undefined), just
            // STALE, tp/sl, which the self-heal above can't catch.
            const pin = this._activePositionPin(key);
            const finalPos = pin ? { ...merged, ...pin } : merged;
            // An explicit user cancel always wins, even over an in-flight
            // drag pin for the other side of the bracket — see constructor
            // doc. (BrokerAdapter also proactively strips the cancelled
            // field out of the drag pin itself; this is the defense-in-
            // depth backstop.)
            this._applyBracketRemovalPins(key, finalPos);
            next.set(key, finalPos);
        }
        // Positions present before this snapshot but absent from it are gone —
        // closed by the user, or liquidated.
        //
        // ROOT CAUSE of "I closed the order, clicked Buy, and the previous
        // order's TP/SL came back" (and of TradingView re-toasting "Stop Loss
        // order placed" for it): this path dropped them from _positions but
        // never told anyone, and 'positionRemoved' is the ONLY thing that
        // cleans up a position's TP/SL bracket ORDERS (via
        // BrokerAdapter._removeBracketOrders). Nothing else can: setOrders()
        // deliberately preserves every parentId-bearing order across a snapshot
        // refresh (see its own comment — the open-orders query excludes
        // brackets, so a refresh would otherwise wipe the lines). So the
        // orphaned brackets sat in _orders for the life of the page, kept being
        // handed back by orders() on each ordersFullUpdate() — redrawing the
        // dead position's TP/SL lines — and got re-announced by TradingView as
        // freshly-placed orders on the next live snapshot. A fresh page (app
        // restart) looked correct precisely because _orders started empty.
        //
        // upsertPosition() already emits this for its own qty===0 case, and
        // closePosition() relies on that; the snapshot path just never did.
        const departed = [];
        for (const key of this._positions.keys()) {
            if (!next.has(key)) departed.push(key);
        }
        this._positions = next;
        for (const key of departed) {
            // Drop the structural signature too, so if this position later
            // returns it isn't mistaken for one we've already reported.
            this._seenPositionEvents.delete(key);
            this._emit('positionRemoved', key);
        }
        this._emit('positionsChanged', [...this._positions.values()]);
    }

    upsertPosition(position) {
        const key = String(position.id);
        const prev = this._positions.get(key);

        if (position.qty === 0) {
            // Closed position → remove it
            this._positions.delete(key);
            this._seenPositionEvents.delete(key);
            this.clearPositionPin(key);
            this._emit('positionRemoved', key);
            return true;
        }

        const pin = this._activePositionPin(key);
        if (pin) position = { ...position, ...pin };

        const merged = prev ? { ...prev, ...position } : { ...position };
        // An explicit user cancel always wins — without this, a spread merge
        // can never clear takeProfit/stopLoss just because the incoming
        // update simply doesn't mention it (absent key vs. explicit value),
        // so a cancelled bracket would keep inheriting its old price from
        // `prev` forever. See constructor doc for _positionBracketRemovalPins.
        this._applyBracketRemovalPins(key, merged);

        const tp = merged.takeProfit ?? '';
        const sl = merged.stopLoss ?? '';
        // Structural signature deliberately EXCLUDES profit/PnL, which changes
        // on almost every live price tick. A previous version of this method
        // included PnL in the dedupe key, which meant the dedupe check below
        // could never actually match — so every PnL-only tick fired a full
        // 'positionUpdated' -> host.positionUpdate() call. TradingView treats
        // that as a position/bracket-line redraw, which silently cancels an
        // in-progress TP/SL drag gesture out from under the user's cursor
        // (reported symptom: TP label vanishes / stops tracking mid-drag).
        const structuralKey = `${key}:${merged.qty}:${merged.avgPrice}:${tp}:${sl}`;
        this._positions.set(key, merged);

        if (this._seenPositionEvents.get(key) === structuralKey) {
            // Nothing structural changed — this is a PnL-only tick. Route
            // through the existing lightweight path (host.plUpdate) instead,
            // which only updates the PnL label and never touches the
            // position/bracket lines, so it can't interrupt a drag.
            this._emit('pnlUpdated', { id: key, profit: merged.profit });
            return true;
        }

        this._seenPositionEvents.set(key, structuralKey);
        this._emit('positionUpdated', merged);
        return true;
    }

    getPosition(id) { return this._positions.get(String(id)) ?? null; }

    getPositions() { return [...this._positions.values()]; }

    /**
     * Update only the PnL field of a position without triggering a full position diff.
     * Called on every price tick to avoid flooding TradingView with position events.
     */
    updatePositionPnl(id, profit) {
        const key = String(id);
        const pos = this._positions.get(key);
        if (!pos || pos.profit === profit) return;
        pos.profit = profit;
        this._emit('pnlUpdated', { id: key, profit });
    }

    // ── Pub/sub ───────────────────────────────────────────────────────────────

    /**
     * Subscribe to state change events.
     * @param {(type: string, payload: any) => void} listener
     * @returns {() => void} unsubscribe function
     */
    subscribe(listener) {
        this._listeners.add(listener);
        return () => this._listeners.delete(listener);
    }

    _emit(type, payload) {
        for (const fn of this._listeners) {
            try { fn(type, payload); } catch { void 0; }
        }
    }

    /** Clear all state and reset dedup sets — call on symbol change */
    reset() {
        // Never leave a hydration window open across a reset (symbol change can
        // land mid-load), or every later live order update would stay silent.
        this._hydrating = false;
        this._orders.clear();
        this._positions.clear();
        this._seenOrderEvents.clear();
        this._seenPositionEvents.clear();
        this._orderPins.clear();
        this._positionPins.clear();
        this._orderRemovalPins.clear();
        this._positionBracketRemovalPins.clear();
        this._emit('reset', null);
    }

    destroy() {
        this._listeners.clear();
        this.reset();
    }
}