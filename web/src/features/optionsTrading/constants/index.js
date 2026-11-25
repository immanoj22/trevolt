import { blackScholes } from "./blackScholes";
import { calculateGreeks } from "./greeks";



export const UpdateGreeks = (option) => {
    try {
        const T = (new Date(option.expiryDate) - new Date()) / (365 * 24 * 60 * 60 * 1000);
        const r = 0.05;
        const sigma = option.markIV;
        if (T <= 0) {
            // if (option.optionType === "CALL") {
            //     option.lastPrice = Math.max(0, option.underlyingPrice - option.strikePrice);
            // } else {
            //     option.lastPrice = Math.max(0, option.strikePrice - option.underlyingPrice);
            // }
            option.delta = 0;
            option.gamma = 0;
            option.theta = 0;
            option.vega = 0;
            return option;
        }
        // console.log("option.underlyingPrice, option.strikePrice, T, r, sigma, option.optionType",option);

        // option.lastPrice = blackScholes(option.underlyingPrice, option.strikePrice, T, r, sigma, option.optionType);
        const greeks = calculateGreeks(option.underlyingPrice, option.strikePrice, T, r, sigma, option.optionType);
        option.delta = greeks.delta;
        option.gamma = greeks.gamma;
        option.theta = greeks.theta;
        option.vega = greeks.vega;
        return option;
    }
    catch (e) {
        console.log(e.message);
        return option;
    }
}


export const findBetweenArray = (arr, inde_price) => {
    if (!Array.isArray(arr) || arr.length === 0 || typeof inde_price === 'undefined' || inde_price === null) {
        return 0;
    }

    const price = Number(inde_price);
    if (!Number.isFinite(price)) {
        return 0;
    }

    const validStrikes = arr
        .map((item, index) => ({
            index,
            strikePrice: Number(item?.strikePrice)
        }))
        .filter((item) => Number.isFinite(item.strikePrice));

    if (!validStrikes.length) {
        return 0;
    }

    let nearestIndex = 0;
    let minDiff = Number.MAX_SAFE_INTEGER;

    validStrikes.forEach(({ index, strikePrice }) => {
        const diff = Math.abs(strikePrice - price);
        if (diff < minDiff) {
            minDiff = diff;
            nearestIndex = index;
        }
    });

    return nearestIndex;
}