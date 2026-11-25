export const LOT_SIZE_BTC = 0.001;

export const QTY_UNIT_OPTIONS = ['Lot', 'USD', 'BTC'];

// `qty` on a contract is always stored canonically in BTC - these convert
// to/from whichever unit the row's dropdown is currently showing.
export function qtyToDisplay(qtyBtc, unit, currentPrice) {
    const qty = parseFloat(qtyBtc) || 0;
    if (unit === 'Lot') return qty / LOT_SIZE_BTC;
    if (unit === 'USD') return qty * (parseFloat(currentPrice) || 0);
    return qty;
}

export function displayToQtyBtc(displayValue, unit, currentPrice) {
    const value = parseFloat(displayValue) || 0;
    if (unit === 'Lot') return value * LOT_SIZE_BTC;
    if (unit === 'USD') {
        const price = parseFloat(currentPrice) || 0;
        return price > 0 ? value / price : 0;
    }
    return value;
}
