import moment from "moment";

// "15Jul26" -> "150726", matching web-frontend's formatExpiryNumeric so both
// platforms show/store the same expiry convention for a strategy leg.
export const formatExpiryNumeric = (expiryDateStr?: string) => {
    if (!expiryDateStr) return expiryDateStr;
    const parsed = moment(expiryDateStr, "DDMMMYY", true);
    return parsed.isValid() ? parsed.format("DDMMYY") : expiryDateStr;
};

// Builds a Strategy Builder leg payload (for dispatch(addStrategyContract(...))) from a
// raw options-chain contract item, the same field mapping web-frontend's CallPutTable
// uses: Mark Price as the entry/reference premium, greeks + top-of-book snapshot.
export function buildStrategyLegPayload(item: any, buyOrSell: boolean, qty: string = "0.001") {
    const posValue = item?.optionType === "CALL" ? "C" : "P";
    const [, rawExpiry] = (item?.tickerRoot ?? "").split("-");
    const expiryDateStr = formatExpiryNumeric(rawExpiry);
    const strikeLabel = `${item?.strikePrice}`;

    return {
        kind: 'option' as const,
        pairId: item?._id,
        tickerRoot: item?.tickerRoot,
        buyOrSell,
        posType: { label: posValue, value: posValue },
        strike: { label: strikeLabel, value: strikeLabel },
        expiry: { label: expiryDateStr, value: expiryDateStr },
        multiplier: "1x",
        qty,
        entryPrice: parseFloat(item?.marketPrice) || 0,
        markPriceAtAdd: parseFloat(item?.marketPrice) || 0,
        markIV: item?.markIV,
        expiryDate: item?.expiryDate,
        greeks: {
            delta: item?.delta,
            gamma: item?.gamma,
            theta: item?.theta,
            vega: item?.vega,
        },
        orderbook: {
            bidQty: item?.bidQty,
            bidPrice: item?.bid,
            askPrice: item?.ask,
            askQty: item?.askQty,
        },
    };
}
