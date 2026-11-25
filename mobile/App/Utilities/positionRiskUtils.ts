// Ported from web-frontend's src/features/dashboard/components/RiskView/positionToContract.js
// Kept as plain functions (no RN dependency) - the mobile Positions redux state
// (state.future.positionDetails) carries the same shape as web's, since both hit the
// same backend UserPositionOrders projection.
import moment from "moment";

import { StrategyLeg } from "./strategyPayoffMath";

export function getUnderlying(position: any): string {
    return position?.underlying || position?.pairData?.baseCurrency || position?.pairName;
}

export function getExpiryLabel(position: any): string {
    const pairData = position?.pairData || {};
    if ((position?.tradeMode || pairData?.tradeMode) !== "option") return "Perpetual";
    if (pairData?.expiryDate) {
        const d = new Date(pairData.expiryDate);
        if (!Number.isNaN(d.getTime())) {
            return d.toLocaleDateString("en-GB", { day: "2-digit", month: "short" });
        }
    }
    if (pairData?.expiryDateStr) {
        // tickerRoot-style date segments look like "15Jul26" - reformat to "15 Jul"
        const match = /^(\d{1,2})([A-Za-z]{3})\d{0,4}$/.exec(pairData.expiryDateStr);
        return match ? `${match[1]} ${match[2]}` : pairData.expiryDateStr;
    }
    return "Expiry";
}

// Full "10th Jul 2026" date for a Group-by-Expiry-style table, which has room for it -
// as opposed to getExpiryLabel's compact "10 Jul" used on tab chips.
export function getExpiryFullLabel(position: any): string {
    const pairData = position?.pairData || {};
    if ((position?.tradeMode || pairData?.tradeMode) !== "option") return "Perpetual";
    if (pairData?.expiryDate) {
        const m = moment(pairData.expiryDate);
        if (m.isValid()) return m.format("Do MMM YYYY");
    }
    return getExpiryLabel(position);
}

export function getExpirySortValue(position: any): number {
    const pairData = position?.pairData || {};
    if ((position?.tradeMode || pairData?.tradeMode) !== "option") return -1; // Perpetual first
    const t = pairData?.expiryDate ? new Date(pairData.expiryDate).getTime() : NaN;
    return Number.isFinite(t) ? t : Number.MAX_SAFE_INTEGER;
}

// Position-level Delta exposure.
// Options: per-contract delta (Black-Scholes, computed server-side) x qty x side.
// Futures/perpetual: the backend never computes greeks for linear instruments, so
// pairData.delta stays at its schema default of 0 forever. A linear position's delta
// is definitionally 1 per unit of underlying, so we derive it here instead of trusting
// the always-zero snapshot field (same fix applied on web).
export function getPositionDelta(position: any): number {
    const pairData = position?.pairData || {};
    const qty = parseFloat(position?.positionFilled) || 0;
    const sign = position?.positionSide === "long" ? 1 : -1;
    const isOption = (position?.tradeMode || pairData?.tradeMode) === "option";
    if (isOption) {
        return (parseFloat(pairData?.delta) || 0) * qty * sign;
    }
    return qty * sign;
}

// Notional in quote currency (USD) - qty times the same live mark price the Mark
// Price column already uses, so the two stay consistent with each other.
export function getPositionNotionalUsd(position: any): number {
    const pairData = position?.pairData || {};
    const qty = parseFloat(position?.positionFilled) || 0;
    const price = parseFloat(position?.close_price ?? pairData?.last) || 0;
    return qty * price;
}

// Live mark price - close_price is kept fresh by the existing socket handler
// (ArrangePositionOrder in HelperComponent.tsx) on every price tick; pairData.last is
// the fallback snapshot for a position that hasn't ticked yet.
export function getPositionMarkPrice(position: any): number {
    const pairData = position?.pairData || {};
    return parseFloat(position?.close_price ?? pairData?.last) || 0;
}

/**
 * Maps a live position record into the contract shape the payoff engine
 * (strategyPayoffMath.ts / Analyze.tsx) expects - mirrors web's mapPositionToContract.
 */
export function mapPositionToContract(position: any): StrategyLeg {
    const pairData = position?.pairData || {};
    const isOption = (position?.tradeMode || pairData?.tradeMode) === "option";
    const qty = parseFloat(position?.positionFilled) || 0;
    const entryPrice = parseFloat(position?.entryPrice) || 0;

    return {
        id: position?.pairId ?? position?._id,
        kind: isOption ? "option" : "futures",
        checked: true,
        buyOrSell: position?.positionSide === "long",
        qty,
        entryPrice,
        markIV: pairData?.markIV,
        expiryDate: pairData?.expiryDate,
        strike: {
            value: pairData?.strikePrice,
            label: pairData?.strikePrice,
        },
        posType: {
            value: pairData?.optionType === "PUT" ? "P" : "C",
            label: pairData?.optionType,
        },
        expiry: { label: getExpiryLabel(position), value: getExpiryLabel(position) },
        // Live fields, not part of the original hypothetical Strategy Builder leg shape -
        // only meaningful when mapped from a real position.
        pnl: parseFloat(position?.pnl) || 0,
        markPrice: getPositionMarkPrice(position),
        symbol: pairData?.tickerRoot || position?.pairName,
    };
}
