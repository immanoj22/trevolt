import { useEffect, useState } from "react"
import { useSelector } from 'react-redux';
import { walletSelector } from "../../Slices/wallet";
import { isEmpty, toCutOff } from "../../Utilities/helerfunction";

const usePriceConversion = (base = 'USDT', quote = 'INR') => {
    const { pricedetails } = useSelector(walletSelector)
    const [conversionRate, setConversionRate] = useState<any>({});
    useEffect(() => {
        try {
            if (!isEmpty(pricedetails)) {
                let conversionRate = pricedetails.find((val: any) => (val.pair == `${base}${quote}`))
                if (!isEmpty(conversionRate)) {
                    setConversionRate(conversionRate)
                } else {
                    conversionRate = pricedetails.find((val: any) => (val.pair == `${quote}${base}`))
                    conversionRate.price = 1 / conversionRate.price
                    setConversionRate(conversionRate)
                }
            }

        } catch (error) {
            console.error("Error writing to localStorage:", error);
        }
    }, [pricedetails, base, quote])

    const convertValue = (value: any) => {
        try {
            let amount = parseFloat(value)
            if (!isEmpty(conversionRate)) {
                amount = parseFloat(value) * conversionRate.price
            }
            return amount
        } catch (err) {
            console.log('convertValue__err', err)
            return value
        }
    }

    const ChangeConversionRate = (base = 'USD', quote = 'INR') => {
        try {
            if (!isEmpty(pricedetails)) {
                let conversionRate = pricedetails.find((val: any) => (val.pair == `${base}${quote}`))
                if (!isEmpty(conversionRate)) {
                    setConversionRate(conversionRate)
                } else {
                    conversionRate = pricedetails.find((val: any) => (val.pair == `${quote}${base}`))
                    conversionRate.price = 1 / conversionRate.price
                    setConversionRate(conversionRate)
                }
            }
        } catch (err) {
            console.log('convertValue__err', err)
        }
    }

    return { convertValue, conversionRate, ChangeConversionRate }
}

export default usePriceConversion;

export const getPorfitCalculation = (entryPrice: any, closePrice: any, quantity: any, positionSide: any) => {
    try {
        let profit = 0
        let percentage = 0
        if (positionSide == 'short') {
            profit = (parseFloat(entryPrice) - parseFloat(closePrice)) * quantity
            percentage = (parseFloat(entryPrice) - parseFloat(closePrice)) / entryPrice
        } else {
            profit = (parseFloat(closePrice) - parseFloat(entryPrice)) * quantity
            percentage = (parseFloat(closePrice) - parseFloat(entryPrice)) / entryPrice
        }
        return { profit: profit, percentage: percentage }
    } catch (err) {
        console.log("getPorfitCalculation_err", err)
        return { profit: 0, percentage: 0 }
    }
}

export const quantityToLot = (value: any, lotSize: any, decimal = 0) => {
    try {
        let lot: any = parseFloat(value) / parseFloat(lotSize)
        // Was `.toFixed(0)` (rounds to nearest, can round UP) - web's equivalent
        // uses toCutOff (truncates via Math.floor, never rounds up). Rounding up
        // here could show/submit a lot count backed by more quantity than
        // actually available - matching web's truncation avoids that.
        lot = isNaN(lot) || !isFinite(lot) ? 0 : toCutOff(lot, 0)
        return lot
    } catch (err) {
        console.log(err, "quantityToLot___err")
        return value
    }
}

export const LotToquantity = (value: any, lotSize: any, decimal: any) => {
    try {
        let quantity: any = parseFloat(value) * parseFloat(lotSize)
        quantity = isNaN(quantity) || !isFinite(quantity) ? 0 : parseFloat(quantity).toFixed(decimal)
        return quantity
    } catch (err) {
        console.log(err, "quantityToLot___err")
        return value
    }
}


export const QuantityToVolume = (value: any, price: any, decimal: any) => {
    try {
        let quantity: any = parseFloat(value) * parseFloat(price)
        quantity = isNaN(quantity) || !isFinite(quantity) ? 0 : toCutOff(quantity, decimal)
        return quantity
    } catch (err) {
        console.log(err, "quantityToLot___err")
        return value
    }
}

export const VolumeToquantity = (value: any, price: any, decimal: any) => {
    try {
        let quantity = parseFloat(value) / parseFloat(price);
        quantity = isNaN(quantity) || !isFinite(quantity) ? 0 : toCutOff(quantity, decimal)
        return quantity
    } catch (err) {
        console.log(err, "quantityToLot___err")
        return value
    }
}

export const calcLiquidationPrice = (side: any, price: any, leverage: any, margin: any) => {
    try {
        console.log(side, price, leverage, margin, "calcLiquidationPrice")
        price = parseFloat(price) || 0;
        leverage = parseFloat(leverage) || 1;
        margin = parseFloat(margin) || 0;
        let liqPrice: any = 0;

        if (side === "long") {
            liqPrice = (price * leverage) / (leverage + 1 - (margin / 100) * leverage);
            if (liqPrice > price) {
                liqPrice = price - (price * (margin / 100)) / leverage;
            }
        } else if (side === "short") {
            liqPrice = (price * leverage) / (leverage - 1 + (margin / 100) * leverage);
            if (liqPrice < price) {
                liqPrice = price + (price * (margin / 100)) / leverage;
            }
        }
        return liqPrice.toFixed(2);
    } catch {
        return 0;
    }
};