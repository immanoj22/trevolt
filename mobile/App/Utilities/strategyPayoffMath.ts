// Ported from web-frontend's src/features/optionsTrading/components/strategyBuilder/payoffMath.js
// Kept as plain functions (no RN/UI dependency) so the same math is provable/testable
// identically to the web version.

export interface StrategyLeg {
    id: number;
    checked?: boolean;
    kind?: 'option' | 'futures';
    buyOrSell?: boolean;
    qty?: any;
    entryPrice?: any;
    markIV?: any;
    expiryDate?: any;
    strike?: { label: string; value: string };
    posType?: { label: string; value: 'P' | 'C' };
    [key: string]: any;
}

const RISK_FREE_RATE = 0.05;
const DEFAULT_VOLATILITY = 0.65;
const DAYS_IN_YEAR = 365;

function normalCdf(x: number): number {
    if (!Number.isFinite(x)) return x > 0 ? 1 : 0;

    const b1 = 0.31938153;
    const b2 = -0.356563782;
    const b3 = 1.781477937;
    const b4 = -1.821255978;
    const b5 = 1.330274429;
    const p = 0.2316419;
    const c = 0.3989423;

    const absX = Math.abs(x);
    const t = 1 / (1 + p * absX);
    const value = 1 - c * Math.exp(-(absX * absX) / 2) * t * (t * (t * (t * (t * b5 + b4) + b3) + b2) + b1);

    if (x >= 0) {
        return value;
    }
    return 1 - value;
}

function intrinsicValue(type: 'P' | 'C' | undefined, price: number, strike: number): number {
    return type === 'C' ? Math.max(price - strike, 0) : Math.max(strike - price, 0);
}

function normalizeVolatility(value: any): number {
    const parsed = parseFloat(value);
    if (!Number.isFinite(parsed) || parsed <= 0) return DEFAULT_VOLATILITY;
    return parsed > 3 ? parsed / 100 : parsed;
}

function getYearsToExpiry(contract: StrategyLeg, targetDaysAhead: number = 0): number {
    if (contract.expiryDate) {
        const expiryMs = new Date(contract.expiryDate).getTime();
        if (Number.isFinite(expiryMs)) {
            const remainingDays = Math.max(0, (expiryMs - Date.now()) / (24 * 60 * 60 * 1000) - targetDaysAhead);
            return remainingDays / DAYS_IN_YEAR;
        }
    }
    const expiryLabel = contract.expiry?.value || contract.expiry?.label;
    if (/^\d{6}$/.test(`${expiryLabel}`)) {
        const label = `${expiryLabel}`;
        const day = Number(label.slice(0, 2));
        const month = Number(label.slice(2, 4)) - 1;
        const year = 2000 + Number(label.slice(4, 6));
        const expiryMs = new Date(year, month, day, 23, 59, 59).getTime();
        if (Number.isFinite(expiryMs)) {
            const remainingDays = Math.max(0, (expiryMs - Date.now()) / (24 * 60 * 60 * 1000) - targetDaysAhead);
            return remainingDays / DAYS_IN_YEAR;
        }
    }
    return Math.max(0, targetDaysAhead) / DAYS_IN_YEAR;
}

function normalPdf(x: number): number {
    return Math.exp(-(x * x) / 2) / Math.sqrt(2 * Math.PI);
}

function blackScholesPrice(price: number, strike: number, years: number, rate: number, volatility: number, type: 'P' | 'C' | undefined): number {
    if (
        !Number.isFinite(price) ||
        !Number.isFinite(strike) ||
        !Number.isFinite(years) ||
        !Number.isFinite(volatility) ||
        price <= 0 ||
        strike <= 0 ||
        years <= 0 ||
        volatility <= 0
    ) {
        return intrinsicValue(type, Number.isFinite(price) ? price : 0, Number.isFinite(strike) ? strike : 0);
    }

    const sqrtT = Math.sqrt(years);
    const d1 = (Math.log(price / strike) + (rate + (volatility * volatility) / 2) * years) / (volatility * sqrtT);
    const d2 = d1 - volatility * sqrtT;

    if (type === 'C') {
        return price * normalCdf(d1) - strike * Math.exp(-rate * years) * normalCdf(d2);
    }
    return strike * Math.exp(-rate * years) * normalCdf(-d2) - price * normalCdf(-d1);
}

export interface Greeks {
    delta: number;
    gamma: number;
    theta: number;
    vega: number;
}

// Per-contract Black-Scholes greeks (not position-level - not multiplied by qty/side).
// Mirrors the same formulas web-frontend's option pricing engine uses server-side,
// so mobile can compute a live estimate client-side instead of only showing whatever
// snapshot the backend last sent.
function calculateGreeks(price: number, strike: number, years: number, rate: number, volatility: number, type: 'P' | 'C' | undefined): Greeks {
    if (
        !Number.isFinite(price) || !Number.isFinite(strike) || !Number.isFinite(years) ||
        !Number.isFinite(volatility) || price <= 0 || strike <= 0 || years <= 0 || volatility <= 0
    ) {
        // No time value left (or bad inputs): intrinsic-only position, so only Delta is
        // meaningful (0 or ±1 depending on moneyness), the rest have no more decay/convexity.
        const isCall = type === 'C';
        const inTheMoney = isCall ? price > strike : price < strike;
        return { delta: inTheMoney ? (isCall ? 1 : -1) : 0, gamma: 0, theta: 0, vega: 0 };
    }

    const sqrtT = Math.sqrt(years);
    const d1 = (Math.log(price / strike) + (rate + (volatility * volatility) / 2) * years) / (volatility * sqrtT);
    const d2 = d1 - volatility * sqrtT;
    const pdf = normalPdf(d1);

    const gamma = pdf / (price * volatility * sqrtT);
    const vega = (price * pdf * sqrtT) / 100; // per 1% vol move

    if (type === 'C') {
        const delta = normalCdf(d1);
        const theta = (
            -(price * pdf * volatility) / (2 * sqrtT)
            - rate * strike * Math.exp(-rate * years) * normalCdf(d2)
        ) / DAYS_IN_YEAR; // per day
        return { delta, gamma, theta, vega };
    }

    const delta = normalCdf(d1) - 1;
    const theta = (
        -(price * pdf * volatility) / (2 * sqrtT)
        + rate * strike * Math.exp(-rate * years) * normalCdf(-d2)
    ) / DAYS_IN_YEAR;
    return { delta, gamma, theta, vega };
}

// Per-contract greeks at a given price/date - "-" fields for futures (a linear
// instrument has no gamma/theta/vega; its delta is definitionally 1 per unit,
// applied with position sign/qty by the caller, same convention as web's
// getPositionDelta in positionToContract.js).
export function contractGreeksAtPrice(contract: StrategyLeg, price: number, targetDaysAhead: number = 0): Greeks {
    if (contract.kind === 'futures') {
        return { delta: 1, gamma: 0, theta: 0, vega: 0 };
    }
    const strike = parseFloat(contract.strike?.value as any) || 0;
    const yearsToExpiry = getYearsToExpiry(contract, targetDaysAhead);
    return calculateGreeks(price, strike, yearsToExpiry, RISK_FREE_RATE, normalizeVolatility(contract.markIV), contract.posType?.value);
}

// Position-level greeks (per-contract greeks x qty x side) - what the Greeks Table
// actually shows per row, since a single option's Black-Scholes delta on its own
// says nothing about your exposure until scaled by how much you hold and which side.
export function positionGreeksAtPrice(contract: StrategyLeg, price: number, targetDaysAhead: number = 0): Greeks {
    const qty = parseFloat(contract.qty) || 0;
    const sign = contract.buyOrSell ? 1 : -1;
    const g = contractGreeksAtPrice(contract, price, targetDaysAhead);
    return {
        delta: g.delta * qty * sign,
        gamma: g.gamma * qty * sign,
        theta: g.theta * qty * sign,
        vega: g.vega * qty * sign,
    };
}

// Theoretical price of a single contract leg at a given underlying price/date -
// atExpiry=true skips Black-Scholes entirely and uses pure intrinsic value (the
// classic kinked "on expiry date" payoff), independent of the target-date slider.
export function contractEstimatedPriceAtTarget(contract: StrategyLeg, price: number, targetDaysAhead: number = 0, atExpiry: boolean = false): number {
    if (contract.kind === 'futures') {
        return price;
    }
    const strike = parseFloat(contract.strike?.value as any) || 0;
    if (atExpiry) {
        return intrinsicValue(contract.posType?.value, price, strike);
    }
    const yearsToExpiry = getYearsToExpiry(contract, targetDaysAhead);
    return yearsToExpiry > 0
        ? blackScholesPrice(price, strike, yearsToExpiry, RISK_FREE_RATE, normalizeVolatility(contract.markIV), contract.posType?.value)
        : intrinsicValue(contract.posType?.value, price, strike);
}

export function contractPayoffAtPrice(contract: StrategyLeg, price: number, targetDaysAhead: number = 0, atExpiry: boolean = false): number {
    const qty = parseFloat(contract.qty) || 0;
    const sign = contract.buyOrSell ? 1 : -1;
    const entry = parseFloat(contract.entryPrice) || 0;
    const estimatedPrice = contractEstimatedPriceAtTarget(contract, price, targetDaysAhead, atExpiry);

    return sign * (estimatedPrice - entry) * qty;
}

// Simplified order margin: total premium outlay across the selected legs.
// Not a real exchange margin calc (that needs SPAN/portfolio margin rules) -
// this is an honest "what you'd pay/receive in premium" estimate.
export function computeOrderMargin(contracts: StrategyLeg[], multiplier: number = 1): number {
    return contracts
        .filter((c) => c.checked)
        .reduce((sum, c) => sum + Math.abs((parseFloat(c.entryPrice) || 0) * (parseFloat(c.qty) || 0)), 0) * multiplier;
}

export function totalPayoffAtPrice(contracts: StrategyLeg[], price: number, multiplier: number = 1, targetDaysAhead: number = 0): number {
    return contracts
        .filter((c) => c.checked)
        .reduce((sum, c) => sum + contractPayoffAtPrice(c, price, targetDaysAhead), 0) * multiplier;
}

export interface PayoffPoint {
    x: number;
    y: number;
}

// Samples the combined payoff curve across a price range centered on the current price.
export function buildPayoffCurve(
    contracts: StrategyLeg[],
    centerPrice: number,
    multiplier: number = 1,
    points: number = 60,
    spread: number = 0.5,
    targetDaysAhead: number = 0,
    atExpiry: boolean = false
): PayoffPoint[] {
    const active = contracts.filter((c) => c.checked);
    if (!centerPrice || active.length === 0) return [];

    const low = Math.max(0, centerPrice * (1 - spread));
    const high = centerPrice * (1 + spread);
    const step = (high - low) / (points - 1);

    const curve: PayoffPoint[] = [];
    for (let i = 0; i < points; i++) {
        const price = low + step * i;
        const y = active.reduce((sum, c) => sum + contractPayoffAtPrice(c, price, targetDaysAhead, atExpiry), 0) * multiplier;
        curve.push({ x: price, y });
    }
    return curve;
}

export interface PayoffStats {
    maxProfit: string;
    maxLoss: string;
    rewardRisk: string;
    breakeven: string;
}

// Max Profit/Max Loss/Reward-Risk/Breakeven are properties of the payoff diagram AT
// EXPIRY by industry convention - they must not drift as the user drags the Target
// Date slider, so this always builds its own at-expiry curve regardless of whatever
// date the caller happens to be showing on-screen elsewhere.
export function computePayoffStats(contracts: StrategyLeg[], centerPrice: number, multiplier: number = 1): PayoffStats {
    const active = contracts.filter((c) => c.checked);
    if (!centerPrice || active.length === 0) {
        return { maxProfit: "-", maxLoss: "-", rewardRisk: "-", breakeven: "-" };
    }

    const curve = buildPayoffCurve(contracts, centerPrice, multiplier, 120, 0.6, 0, true);
    const ys = curve.map((p) => p.y);

    const maxProfitVal = Math.max(...ys);
    const maxLossVal = Math.min(...ys);

    const edgeSpan = Math.max(1, Math.floor(curve.length * 0.03));
    const last = curve[curve.length - 1];
    const beforeLast = curve[curve.length - 1 - edgeSpan];
    const rightSlope = last.y - beforeLast.y;

    const unboundedProfit = rightSlope > 0.01 && maxProfitVal === last.y;
    const unboundedLoss = rightSlope < -0.01 && maxLossVal === last.y;

    const breakevens: number[] = [];
    for (let i = 1; i < curve.length; i++) {
        const prevY = curve[i - 1].y;
        const curY = curve[i].y;
        if ((prevY <= 0 && curY > 0) || (prevY >= 0 && curY < 0)) {
            const ratio = prevY === curY ? 0 : (0 - prevY) / (curY - prevY);
            const price = curve[i - 1].x + ratio * (curve[i].x - curve[i - 1].x);
            breakevens.push(price);
        }
    }

    const maxProfit = unboundedProfit ? "Unlimited" : `${maxProfitVal.toFixed(2)} USD`;
    const maxLoss = unboundedLoss ? "Unlimited" : `${maxLossVal.toFixed(2)} USD`;

    let rewardRisk = "NA";
    if (unboundedProfit && unboundedLoss) {
        rewardRisk = "NA";
    } else if (!unboundedProfit && !unboundedLoss && maxLossVal < 0) {
        rewardRisk = (maxProfitVal / Math.abs(maxLossVal)).toFixed(2);
    } else if (unboundedProfit) {
        rewardRisk = "Unlimited";
    } else if (unboundedLoss) {
        rewardRisk = "0.00";
    }

    const breakeven = breakevens.length
        ? breakevens.map((b) => b.toFixed(2)).join(" / ")
        : "-";

     return { maxProfit, maxLoss, rewardRisk, breakeven };
}
