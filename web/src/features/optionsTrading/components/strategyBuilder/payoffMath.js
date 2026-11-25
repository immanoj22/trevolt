const RISK_FREE_RATE = 0.05;
const DEFAULT_VOLATILITY = 0.65;
const DAYS_IN_YEAR = 365;
const STRATEGY_PRECISION = 8;

export function sanitizeStrategyValue(value, digits = STRATEGY_PRECISION) {
    if (!Number.isFinite(value)) return 0;

    const numericValue = Number(value);
    if (Math.abs(numericValue) < Number.EPSILON) return 0;

    const rounded = Number(numericValue.toFixed(digits));
    return Math.abs(rounded) < Number.EPSILON ? 0 : rounded;
}

function normalCdf(x) {
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

    return x >= 0 ? value : 1 - value;
}

function intrinsicValue(type, price, strike) {
    return type === 'C' ? Math.max(price - strike, 0) : Math.max(strike - price, 0);
}

function normalizeVolatility(value) {
    const parsed = parseFloat(value);
    if (!Number.isFinite(parsed) || parsed <= 0) return DEFAULT_VOLATILITY;
    return parsed > 3 ? parsed / 100 : parsed;
}

function getYearsToExpiry(contract, targetDaysAhead = 0) {
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

function blackScholesPrice(price, strike, years, rate, volatility, type) {
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

// Theoretical price of a single contract leg at a given underlying price/date -
// the "what would this contract be worth" estimate, as opposed to the P&L it
// implies (see contractPayoffAtPrice below, which reuses this).
// atExpiry=true skips Black-Scholes entirely and uses pure intrinsic value -
// this is the "on expiry date" curve (the classic kinked payoff diagram),
// independent of whatever date the Target Date slider is on.
export function contractEstimatedPriceAtTarget(contract, price, targetDaysAhead = 0, atExpiry = false) {
    if (contract.kind === 'futures') {
        return sanitizeStrategyValue(price);
    }
    const strike = parseFloat(contract.strike?.value) || 0;
    if (atExpiry) {
        return sanitizeStrategyValue(intrinsicValue(contract.posType?.value, price, strike));
    }
    const yearsToExpiry = getYearsToExpiry(contract, targetDaysAhead);
    const estimatedValue = yearsToExpiry > 0
        ? blackScholesPrice(price, strike, yearsToExpiry, RISK_FREE_RATE, normalizeVolatility(contract.markIV), contract.posType?.value)
        : intrinsicValue(contract.posType?.value, price, strike);

    return sanitizeStrategyValue(estimatedValue);
}

// Per-lot payoff (in quote currency) for one contract leg at a given underlying price.
export function contractPayoffAtPrice(contract, price, targetDaysAhead = 0, atExpiry = false) {
    const qty = parseFloat(contract.qty) || 0;
    const sign = contract.buyOrSell ? 1 : -1;
    const entry = parseFloat(contract.entryPrice) || 0;
    const estimatedPrice = contractEstimatedPriceAtTarget(contract, price, targetDaysAhead, atExpiry);
    const payoff = sign * (estimatedPrice - entry) * qty;

    return sanitizeStrategyValue(payoff);
}

// Simplified order margin: total premium outlay across the selected legs.
// Not a real exchange margin calc (that needs SPAN/portfolio margin rules) -
// this is an honest "what you'd pay/receive in premium" estimate.
export function computeOrderMargin(contracts, multiplier = 1) {
    const margin = contracts
        .filter((c) => c.checked)
        .reduce((sum, c) => sum + Math.abs((parseFloat(c.entryPrice) || 0) * (parseFloat(c.qty) || 0)), 0) * multiplier;

    return sanitizeStrategyValue(margin);
}

export function totalPayoffAtPrice(contracts, price, multiplier = 1, targetDaysAhead = 0) {
    const total = contracts
        .filter((c) => c.checked)
        .reduce((sum, c) => sum + contractPayoffAtPrice(c, price, targetDaysAhead), 0) * multiplier;

    return sanitizeStrategyValue(total);
}

// Samples the combined payoff curve across a price range centered on the current price.
export function buildPayoffCurve(contracts, centerPrice, multiplier = 1, points = 120, spread = 0.5, targetDaysAhead = 0, atExpiry = false) {
    const active = contracts.filter((c) => c.checked);
    if (!centerPrice || active.length === 0) return [];

    const low = Math.max(0, centerPrice * (1 - spread));
    const high = centerPrice * (1 + spread);
    const step = (high - low) / (points - 1);

    const curve = [];
    for (let i = 0; i < points; i++) {
        const price = low + step * i;
        const y = active.reduce((sum, c) => sum + contractPayoffAtPrice(c, price, targetDaysAhead, atExpiry), 0) * multiplier;
        curve.push({ x: sanitizeStrategyValue(price), y: sanitizeStrategyValue(y) });
    }
    return curve;
}

// Max Profit/Max Loss/Reward-Risk/Breakeven are properties of the payoff diagram
// AT EXPIRY by industry convention - they must not drift as the user drags the
// Target Date slider, so this always builds its own at-expiry curve rather than
// taking whatever targetDaysAhead the caller happens to be showing on-screen.
export function computePayoffStats(contracts, centerPrice, multiplier = 1) {
    const active = contracts.filter((c) => c.checked);
    if (!centerPrice || active.length === 0) {
        return { maxProfit: "-", maxLoss: "-", rewardRisk: "-", breakeven: "-" };
    }

    const curve = buildPayoffCurve(contracts, centerPrice, multiplier, 120, 0.6, 0, true);
    const ys = curve.map((p) => p.y);

    let maxProfitVal = Math.max(...ys);
    let maxLossVal = Math.min(...ys);

    const edgeSpan = Math.max(1, Math.floor(curve.length * 0.03));
    const last = curve[curve.length - 1];
    const beforeLast = curve[curve.length - 1 - edgeSpan];
    const rightSlope = last.y - beforeLast.y;

    const unboundedProfit = rightSlope > 0.01 && maxProfitVal === last.y;
    const unboundedLoss = rightSlope < -0.01 && maxLossVal === last.y;

    const breakevens = [];
    for (let i = 1; i < curve.length; i++) {
        const prevY = curve[i - 1].y;
        const curY = curve[i].y;
        if ((prevY <= 0 && curY > 0) || (prevY >= 0 && curY < 0)) {
            const ratio = prevY === curY ? 0 : (0 - prevY) / (curY - prevY);
            const price = curve[i - 1].x + ratio * (curve[i].x - curve[i - 1].x);
            breakevens.push(price);
        }
    }

    const sanitizedMaxProfitVal = sanitizeStrategyValue(maxProfitVal);
    const sanitizedMaxLossVal = sanitizeStrategyValue(maxLossVal);
    const safeBreakevens = breakevens.map((b) => sanitizeStrategyValue(b));

    const maxProfit = unboundedProfit ? "Unlimited" : `${sanitizedMaxProfitVal.toFixed(2)} USD`;
    const maxLoss = unboundedLoss ? "Unlimited" : `${sanitizedMaxLossVal.toFixed(2)} USD`;

    let rewardRisk = "---";
    if (!unboundedProfit && !unboundedLoss && sanitizedMaxLossVal < 0) {
        rewardRisk = (sanitizedMaxProfitVal / Math.abs(sanitizedMaxLossVal)).toFixed(2);
    } else if (unboundedProfit) {
        rewardRisk = "Unlimited";
    }

    const breakeven = safeBreakevens.length
        ? safeBreakevens.map((b) => b.toFixed(2)).join(" / ")
        : "-";

    return { maxProfit, maxLoss, rewardRisk, breakeven };
}
