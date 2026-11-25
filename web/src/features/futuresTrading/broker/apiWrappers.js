/**
 * apiWrappers.js
 *
 * Non-invasive wrappers around the existing futureActions.js API calls.
 * Responsibilities:
 *   - Normalize backend response shapes into TradingView Broker API format
 *   - Centralise all error handling
 *   - Never modify the underlying backend action files
 *
 * TradingView Order format:
 *   { id, symbol, type, side, qty, filledQty, price, avgPrice,
 *     limitPrice, stopPrice, status, currency, isEditable, isCancelable }
 *
 * TradingView Position format:
 *   { id, symbol, qty, side, avgPrice, profit, currency,
 *     takeProfit?, stopLoss? }
 */

import {
    futureOpenOrders,
    futureCancelOrder,
    futureUpdateOrders,
    futureUpdateBracketOrders,
    futureClosePosition,
    futureOrderPlacing,
    futureStopOrders,
    RemoveBracketOrders,
    futureCreatePriceAlert,
} from '../../../actions/futureActions';
import { OrderStatus, OrderType, Side } from './BrokerStateManager';

// ─── Normalisers ──────────────────────────────────────────────────────────────

const safeFloat = (v, d = 0) => {
    const n = parseFloat(v);
    return Number.isFinite(n) ? n : d;
};

const normSym = (s) => String(s || '').replace(/^MARK:/i, '').toUpperCase();

/** @param {string|undefined} s */
function mapOrderStatus(s) {
    const u = String(s || '').toLowerCase();
    if (['cancelled', 'canceled', 'rejected'].includes(u)) return OrderStatus.CANCELED;
    if (['filled', 'completed'].includes(u)) return OrderStatus.FILLED;
    if (['pending', 'open', 'new', 'working', 'partially_filled', 'partially filled'].includes(u)) {
        return OrderStatus.WORKING;
    }
    return OrderStatus.WORKING;
}

/** @param {object} rec */
function mapOrderType(rec) {
    const t = String(rec.orderType || rec.type || 'limit').toLowerCase();
    if (t === 'market') return OrderType.MARKET;
    if (t === 'stop' || t === 'stop_market') return OrderType.STOP;
    if (t === 'stop_limit' || t === 'stop-limit') return OrderType.STOP_LIMIT;
    return OrderType.LIMIT;
}

/**
 * Convert a backend order record → TradingView Order object.
 * @param {object} rec - raw backend order record
 * @returns {TVOrder}
 */
export function normalizeOrder(rec) {
    const limitPx = safeFloat(rec.limitPrice ?? rec.price);
    const stopPx = rec.stopPrice != null && rec.stopPrice !== '' ? safeFloat(rec.stopPrice) : 0;
    const status = mapOrderStatus(rec.status);
    const type = mapOrderType(rec);
    const displayPrice =
        (type === OrderType.STOP || type === OrderType.STOP_LIMIT) && stopPx
            ? stopPx
            : (limitPx || stopPx || 0);

    return {
        id: String(rec._id),
        symbol: normSym(rec.pairName || rec.symbol || ''),
        type,
        side: rec.buyorsell === 'buy' ? Side.BUY : Side.SELL,
        qty: safeFloat(rec.quantity),
        filledQty: safeFloat(rec.filledQuantity, 0),
        price: displayPrice,
        avgPrice: displayPrice,
        limitPrice: limitPx,
        stopPrice: stopPx,
        profit: 0,
        commission: 0,
        status,
        currency: 'USD',
        isEditable: status === OrderStatus.WORKING,
        isCancelable: status === OrderStatus.WORKING,
        isWorking: status === OrderStatus.WORKING,
        _raw: rec,
    };
}

/**
 * Pull a usable trigger price out of a bracket reference, which can arrive
 * in either shape depending on the caller:
 *   - a plain number (already-resolved price)
 *   - the raw bracket-order sub-document the backend's position aggregation
 *     attaches (`{ _id, stopPrice, price, orderType, trigger_type, type }`)
 */
function extractBracketPrice(bracket) {
    if (bracket == null) return 0;
    if (typeof bracket === 'number') return bracket;
    if (typeof bracket === 'object') return safeFloat(bracket.stopPrice ?? bracket.price, 0);
    return safeFloat(bracket, 0);
}

/** Pull the bracket sub-document's own `_id` (its real backend order id), if present. */
function extractBracketOrderId(bracket) {
    if (bracket && typeof bracket === 'object' && bracket._id !== undefined) {
        return String(bracket._id);
    }
    return undefined;
}

/**
 * Convert a backend position record → TradingView Position object.
 * @param {object} rec - raw backend position record
 * @param {number} [profitOverride] - optional profit (e.g. wallet tick); otherwise uses rec.pnl*
 */
export function normalizePosition(rec, symbol) {
    // BUG FIX: this used to read `rec.takeProfit` / `rec.stopLoss` (camelCase
    // plain numbers), which never exist on the record the backend actually
    // sends. `UserPositionOrders()` (futureHooks.js) joins each position to
    // its bracket orders via `$lookup` + `$filter` + `$arrayElemAt` and
    // attaches the result as **lowercase** `rec.takeprofit` / `rec.stoploss`
    // — each an OBJECT (`{ stopPrice, price, orderType, ... }`), not a bare
    // number. Reading the wrong (nonexistent) key meant `tp`/`sl` were
    // always 0, so `positions()` never returned a takeProfit/stopLoss for
    // any position — the bracket order was correctly created and visible in
    // the Stop Orders tab (a separate query), but the chart's own
    // positionUpdate()/positionsFullUpdate() payload never carried a price
    // for TV to draw the TP/SL line at, so the marking never appeared.
    const tp = extractBracketPrice(rec?.takeprofit ?? rec?.takeProfit);
    const sl = extractBracketPrice(rec?.stoploss ?? rec?.stopLoss);
    const tpOrderId = extractBracketOrderId(rec?.takeprofit ?? rec?.takeProfit);
    const slOrderId = extractBracketOrderId(rec?.stoploss ?? rec?.stopLoss);
    // const profitSrc =
    //     profitOverride !== undefined && profitOverride !== null
    //         ? profitOverride
    //         : (rec.pnl ?? rec.unRealizedPnL ?? rec.unrealizedPnl ?? 0);
    // console.log(`${symbol}_${rec.positionSide}`, "`${symbol}_${rec.positionSide}`")
    const pos = {
        id: `${rec.pairName}_${rec.positionSide}`,
        symbol: normSym(rec.pairName || ''),
        qty: Math.abs(safeFloat(rec.positionFilled)),
        side: rec.positionSide === 'long' ? Side.BUY : Side.SELL,
        avgPrice: safeFloat(rec.entryPrice),
        price: safeFloat(rec.entryPrice),
        profit: safeFloat(rec.pnl),
        currency: 'USD',
        _raw: rec,
        exitLevels: []
    };
    if (tp > 0) { pos.takeProfit = tp; if (tpOrderId) pos.takeProfitOrderId = tpOrderId; }
    if (sl > 0) { pos.stopLoss = sl; if (slOrderId) pos.stopLossOrderId = slOrderId; }
    // console.log(pos, "normalizePosition")
    return pos;
}


// ─── API calls ────────────────────────────────────────────────────────────────

/**
 * Fetch all open orders for a symbol.
 * Returns [] on error — never throws.
 */
export async function fetchOpenOrders({ pairId = 'all', secretKey, tradeMode = 'future' }) {
    try {
        const { status, record } = await futureOpenOrders(pairId, { page: 1, limit: 100 }, secretKey, tradeMode);
        if (!status || !Array.isArray(record)) return [];
        return record.map(normalizeOrder);
    } catch (e) {
        return [];
    }
}

const BRACKET_TP_TYPES = ['bracket_tp_market', 'bracket_tp_limit'];
const BRACKET_SL_TYPES = ['bracket_sl_market', 'bracket_sl_limit'];

/**
 * Build a `positionId → { takeProfit?, stopLoss? }` lookup from a raw list
 * of stop/conditional orders (the same records the Stop Orders tab renders).
 *
 * This exists as an INDEPENDENT source of truth for a position's TP/SL,
 * separate from whatever `UserPositionOrders()` attaches via its own
 * bracket-order `$lookup` (consumed by normalizePosition() above). The Stop
 * Orders query is a simple, direct match on the orders collection with no
 * join to get wrong — reconciling against it means the chart's TP/SL line
 * can never drift from what the DB/history actually shows, regardless of
 * any lag or bug in the position-side join.
 */
export function buildBracketMapFromStopOrders(stopOrders = []) {
    const map = new Map();
    for (const o of stopOrders) {
        if (o?.status !== 'conditional') continue;
        const isTp = BRACKET_TP_TYPES.includes(o?.orderType);
        const isSl = BRACKET_SL_TYPES.includes(o?.orderType);
        if (!isTp && !isSl) continue;

        // A bracket order's own `buyorsell` is the side that CLOSES the
        // position, i.e. the opposite of the position's own side — a 'sell'
        // bracket belongs to a long position, a 'buy' bracket to a short
        // one. This mirrors the same convention normalizePosition()/
        // updateBrackets() already use elsewhere, and produces the exact
        // same `${pairName}_${positionSide}` id format normalizePosition()
        // assigns to positions, so lookups below are a direct key match.
        const positionSide = o?.buyorsell === 'sell' ? 'long' : 'short';
        const key = `${normSym(o?.pairName || '')}_${positionSide}`;
        const price = safeFloat(o?.stopPrice, 0);
        if (price <= 0) continue;

        const entry = map.get(key) || {};
        const orderId = o?._id !== undefined ? String(o._id) : undefined;
        if (isTp) { entry.takeProfit = price; entry.takeProfitOrderId = orderId; }
        if (isSl) { entry.stopLoss = price; entry.stopLossOrderId = orderId; }
        map.set(key, entry);
    }
    return map;
}

/**
 * Fetch the current bracket map directly (used on initial load and whenever
 * we want to reconcile positions against the authoritative Stop Orders
 * list). Returns an empty Map on any error — never throws.
 */
export async function fetchStopOrderBrackets({ secretKey, tradeMode = 'future' }) {
    try {
        const { status, record } = await futureStopOrders('all', { page: 1, limit: 200 }, secretKey, tradeMode);
        if (!status || !Array.isArray(record)) return new Map();
        return buildBracketMapFromStopOrders(record);
    } catch (e) {
        return new Map();
    }
}

/**
 * Cancel an order.
 * Returns { status: boolean, message: string }.
 */
export async function cancelOrder(orderId, secretKey) {
    try {
        const res = await futureCancelOrder(orderId, secretKey);
        return { status: !!res.status, message: res.message || '' };
    } catch (e) {
        return { status: false, message: String(e) };
    }
}

/**
 * Cancel a single TP or SL bracket order by its own backend order id.
 * Bracket orders live in the same orders collection but are removed through
 * a dedicated endpoint (not the regular cancel-order one) — used when the
 * user drags a bracket line off / clicks its cancel on the chart.
 * Returns { status: boolean, message: string }.
 */
export async function cancelBracketOrder(orderId, secretKey) {
    try {
        const res = await RemoveBracketOrders(orderId, secretKey);
        return { status: !!res.status, message: res.message || '' };
    } catch (e) {
        return { status: false, message: String(e) };
    }
}

/**
 * Modify an order's price and/or quantity.
 * Returns { status: boolean, message: string }.
 */
export async function modifyOrder({ orderId, qty, price }, secretKey) {
    try {
        const res = await futureUpdateOrders({ orderId, quantity: qty, price }, secretKey);
        return { status: !!res.status, message: res.message || '' };
    } catch (e) {
        return { status: false, message: String(e) };
    }
}

/**
 * Update TP/SL brackets for a position.
 * `brackets` = { takeProfit?, stopLoss? }
 * Returns { status: boolean, message: string }.
 */
export async function updateBrackets({ position, brackets }, secretKey) {
    try {
        const raw = position._raw || {};

        const tpPrice = brackets.takeProfit !== undefined
            ? brackets.takeProfit
            : extractBracketPrice(raw.takeprofit ?? raw.takeProfit);
        const slPrice = brackets.stopLoss !== undefined
            ? brackets.stopLoss
            : extractBracketPrice(raw.stoploss ?? raw.stopLoss);

        // BUG FIX: `bracketOrders` was being sent as a bare array of two
        // numbers `[takeProfit, stopLoss]`. The backend controller
        // (modifyBracketOrders in futureController.js) iterates this array
        // expecting each entry to be an OBJECT — `{ type, orderType,
        // stopPrice, price }` — and branches on `bracketOrders[i].type ===
        // 'takeprofit' | 'stoploss'`. A plain number has no `.type`
        // property, so neither branch ever matched — the loop silently did
        // nothing: no bracket order was ever created or updated in the DB.
        // The handler still reached `i === bracketOrders.length - 1` and
        // returned `{ status: true, message: 'Bracket orders updated
        // successfully' }` regardless — a false-positive success response.
        // This is why the toast said "success" but the TP/SL line snapped
        // back (the next full position sync just re-applied the unchanged
        // DB value) and the Stop Orders tab stayed empty (no order document
        // was ever inserted). Sending proper objects — the same shape
        // placeOrder() above already uses for order-ticket TP/SL fields —
        // lets the backend's per-type branch actually run.
        const bracketOrders = [];
        if (tpPrice > 0) {
            bracketOrders.push({
                type: 'takeprofit',
                orderType: 'bracket_tp_market',
                stopPrice: tpPrice,
                price: 0,
            });
        }
        if (slPrice > 0) {
            bracketOrders.push({
                type: 'stoploss',
                orderType: 'bracket_sl_market',
                stopPrice: slPrice,
                price: 0,
            });
        }

        if (bracketOrders.length === 0) {
            return { status: false, message: 'No TP/SL price to update' };
        }

        const payload = {
            bracketOrders,
            // BUG FIX: was `pairId: position.id`, which is the synthetic
            // composite id we invent for TradingView (e.g. "BNBUSDT_long"),
            // not the real backend pair id. The backend needs the actual
            // MongoDB pairId, which is only available on the raw record.
            pairId: raw.pairId || position.id,
            entryPrice: position.avgPrice,
            positionSide: raw.positionSide || (position.side === Side.BUY ? 'long' : 'short'),
            positionFilled: position.qty,
        };
        const res = await futureUpdateBracketOrders(payload, secretKey);
        return { status: !!res.status, message: res.message || '' };
    } catch (e) {
        return { status: false, message: String(e) };
    }
}

/**
 * Map a TradingView broker OrderType enum value to the backend's orderType string.
 * Mirrors mapOrderType() above (backend record → TV), just in the opposite direction.
 */
function mapOrderTypeToBackend(tvType) {
    switch (tvType) {
        case OrderType.MARKET: return 'market';
        case OrderType.STOP: return 'stop_market';
        case OrderType.STOP_LIMIT: return 'stop_limit';
        case OrderType.LIMIT:
        default: return 'limit';
    }
}

/**
 * Place a brand-new order from the chart (TradingView "order_panel" ticket /
 * drag-to-create bracket). Reuses the exact same backend endpoint and payload
 * shape as the existing, already-validated TradeActionCard order form — the
 * backend (OrderPlacing → Market/Limit/StopMarket/StopLimitOrderPlacing) does
 * all quantity/price/leverage validation, so no business rules are duplicated
 * here.
 *
 * @param {object} order - TradingView PreOrder
 *   { symbol, type, side, qty, limitPrice?, stopPrice?, takeProfit?, stopLoss? }
 * @param {{ pairId: string, leverage: number }} ctx
 * @param {string} secretKey
 * Returns { status: boolean, message: string, orderId?: string }.
 */
export async function placeOrder(order, { pairId, leverage }, secretKey) {
    try {
        if (!pairId) {
            return { status: false, message: 'No active trading pair — cannot place order' };
        }

        const orderType = mapOrderTypeToBackend(order.type);
        const payload = {
            pairId,
            buyorsell: order.side === Side.SELL ? 'sell' : 'buy',
            orderType,
            quantity: safeFloat(order.qty),
            price: safeFloat(order.limitPrice, 0),
            stopPrice: safeFloat(order.stopPrice, 0),
            leverage: safeFloat(leverage, 1),
            typeTIF: '',
        };

        // Optional TP/SL brackets attached at order-creation time (order ticket
        // "Take Profit" / "Stop Loss" fields) — same shape as the existing form's
        // formData.takeProfit / formData.stopLoss.
        if (order.takeProfit?.limitPrice) {
            payload.isTake = true;
            payload.takeProfit = {
                stopPrice: safeFloat(order.takeProfit.limitPrice),
                price: 0,
                orderType: 'bracket_tp_market',
            };
        }
        if (order.stopLoss?.stopPrice) {
            payload.isStop = true;
            payload.stopLoss = {
                stopPrice: safeFloat(order.stopLoss.stopPrice),
                price: 0,
                orderType: 'bracket_sl_market',
            };
        }

        const res = await futureOrderPlacing(payload, secretKey);
        return {
            status: !!res.status,
            message: res.message || '',
            orderId: res.result?._id ? String(res.result._id) : undefined,
        };
    } catch (e) {
        return { status: false, message: String(e?.message || e) };
    }
}

/**
 * Close a position (full or partial).
 * Returns { status: boolean, message: string }.
 */
export async function closePosition({ position, amount }, secretKey) {
    try {
        const raw = position._raw || {};
        const data = {
            // BUG FIX: was `pairId: position.id` (synthetic composite id like
            // "BNBUSDT_long"), which the backend can't resolve. Use the real
            // pairId from the raw record, same fix as updateBrackets above.
            pairId: raw.pairId || position.id,
            positionSide: raw.positionSide || (position.side === Side.BUY ? 'long' : 'short'),
            quantity: amount ?? position.qty,
            orderType: 'market',
            price: position.avgPrice,
            typeTIF: '',
        };
        const res = await futureClosePosition(data, secretKey);
        return { status: !!res.status, message: res.message || '' };
    } catch (e) {
        return { status: false, message: String(e) };
    }
}

/**
 * Create a server-side price alert for the given pair — backs the chart's
 * "+" quick-order context menu → "Add Alert (Push Notification)" custom
 * action (see BrokerAdapter.js chartContextMenuActions).
 * Returns { status: boolean, message: string }.
 */
export async function createPriceAlert({ pairId, targetPrice }, secretKey) {
    try {
        if (!pairId) {
            return { status: false, message: 'No active trading pair — cannot create alert' };
        }
        const res = await futureCreatePriceAlert({ pairId, targetPrice: safeFloat(targetPrice) }, secretKey);
        return { status: !!res.status, message: res.message || '' };
    } catch (e) {
        return { status: false, message: String(e?.message || e) };
    }
}