import moment from 'moment'

/**
 * Maps a live position record (as returned by /future/positionOrders, with the
 * extended pairData projection) into the contract shape expected by the
 * options-strategy-builder payoff engine (payoffMath.js / StrategyPayoffPanel).
 */
export function mapPositionToContract(position) {
    const pairData = position?.pairData || {};
    const isOption = (position?.tradeMode || pairData?.tradeMode) === 'option';
    const qty = parseFloat(position?.positionFilled) || 0;
    const entryPrice = parseFloat(position?.entryPrice) || 0;

    return {
        id: position?._id,
        kind: isOption ? 'option' : 'futures',
        checked: true,
        buyOrSell: position?.positionSide === 'long',
        qty,
        entryPrice,
        markPriceAtAdd: parseFloat(pairData?.last) || 0,
        // Live fields (not part of the original hypothetical-strategy-builder contract
        // shape) - only meaningful when this contract was mapped from a real position.
        pnl: parseFloat(position?.pnl) || 0,
        markPrice: parseFloat(position?.close_price ?? pairData?.last) || 0,
        expiryLabel: getExpiryLabel(position),
        strike: {
            value: pairData?.strikePrice,
            label: pairData?.strikePrice,
        },
        posType: {
            value: pairData?.optionType === 'PUT' ? 'P' : 'C',
            label: pairData?.optionType,
        },
        expiryDate: pairData?.expiryDate,
        markIV: pairData?.markIV,
        greeks: {
            delta: pairData?.delta,
            gamma: pairData?.gamma,
            theta: pairData?.theta,
            vega: pairData?.vega,
        },
        symbol: pairData?.tickerRoot || position?.pairName,
    };
}

/**
 * Position-level Delta exposure.
 * Options: per-contract delta (Black-Scholes, computed server-side) x qty x side.
 * Futures/perpetual: the backend never computes greeks for linear instruments
 * (FuturePairSchema's pre-save hook only runs Black-Scholes when tradeMode ===
 * 'option'), so pairData.delta stays at its schema default of 0 forever. A
 * linear position's delta is definitionally 1 per unit of underlying, so we
 * derive it here instead of trusting the always-zero snapshot field.
 */
export function getPositionDelta(position) {
    const pairData = position?.pairData || {};
    const qty = parseFloat(position?.positionFilled) || 0;
    const sign = position?.positionSide === 'long' ? 1 : -1;
    const isOption = (position?.tradeMode || pairData?.tradeMode) === 'option';
    if (isOption) {
        return (parseFloat(pairData?.delta) || 0) * qty * sign;
    }
    return qty * sign;
}

export function getExpiryLabel(position) {
    const pairData = position?.pairData || {};
    if ((position?.tradeMode || pairData?.tradeMode) !== 'option') return 'Perpetual';
    if (pairData?.expiryDate) {
        const d = new Date(pairData.expiryDate);
        if (!Number.isNaN(d.getTime())) {
            return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' });
        }
    }
    if (pairData?.expiryDateStr) {
        // tickerRoot-style date segments look like "15Jul26" - reformat to "15 Jul"
        // to match the day+month tab style, dropping the trailing year.
        const match = /^(\d{1,2})([A-Za-z]{3})\d{0,4}$/.exec(pairData.expiryDateStr);
        return match ? `${match[1]} ${match[2]}` : pairData.expiryDateStr;
    }
    return 'Expiry';
}

// Full "10th Jul 2026" date for the Group-by-Expiry table, which has room for
// it - as opposed to getExpiryLabel's compact "10 Jul" used on tab buttons.
export function getExpiryFullLabel(position) {
    const pairData = position?.pairData || {};
    if ((position?.tradeMode || pairData?.tradeMode) !== 'option') return 'Perpetual';
    if (pairData?.expiryDate) {
        const m = moment(pairData.expiryDate);
        if (m.isValid()) return m.format('Do MMM YYYY');
    }
    return getExpiryLabel(position);
}

export function getExpirySortValue(position) {
    const pairData = position?.pairData || {};
    if ((position?.tradeMode || pairData?.tradeMode) !== 'option') return -1; // Perpetual first
    const t = pairData?.expiryDate ? new Date(pairData.expiryDate).getTime() : NaN;
    return Number.isFinite(t) ? t : Number.MAX_SAFE_INTEGER;
}

// Notional in quote currency (USD) - qty times the same live mark price the
// Mark Price column already uses, so the two stay consistent with each other.
export function getPositionNotionalUsd(position) {
    const pairData = position?.pairData || {};
    const qty = parseFloat(position?.positionFilled) || 0;
    const price = parseFloat(position?.close_price ?? pairData?.last) || 0;
    return qty * price;
}

export function getUnderlying(position) {
    return position?.underlying || position?.pairData?.baseCurrency || position?.pairName;
}
