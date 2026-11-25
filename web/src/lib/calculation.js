import { toCutOff } from "../calculation/calculationlib"

export const getPorfitCalculation = (entryPrice, closePrice, quantity, positionSide) => {
    try {
        // console.log("getPorfitCalculation_trade_pos", { entryPrice, closePrice, quantity, positionSide })
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

export const quantityToLot = (value, lotSize, decimal = 0) => {
    try {
        let lot = parseFloat(value) / parseFloat(lotSize)
        lot = isNaN(lot) || !isFinite(lot) ? 0 : toCutOff(parseFloat(lot), 0)
        return lot
    } catch (err) {
        console.log(err, "quantityToLot___err")
        return value
    }
}

export const LotToquantity = (value, lotSize, decimal) => {
    try {
        let quantity = parseFloat(value) * parseFloat(lotSize)
        quantity = isNaN(quantity) || !isFinite(quantity) ? 0 : parseFloat(quantity).toFixed(decimal)
        return quantity
    } catch (err) {
        console.log(err, "quantityToLot___err")
        return value
    }
}


export const VolumeToquantity = (value, price, decimal) => {
    try {
        let quantity = parseFloat(value) / parseFloat(price)
        quantity = isNaN(quantity) || !isFinite(quantity) ? 0 : toCutOff(quantity, decimal)
        return quantity
    } catch (err) {
        console.log(err, "quantityToLot___err")
        return value
    }
}

export const QuantityToVolume = (value, price, decimal) => {
    try {
        let quantity = parseFloat(value) * parseFloat(price)
        quantity = isNaN(quantity) || !isFinite(quantity) ? 0 : toCutOff(quantity, decimal)
        return quantity
    } catch (err) {
        console.log(err, "quantityToLot___err")
        return value
    }
}

export const openOrdersAsposition = (openData) => {
    try {
        let data = []
        if (openData.length > 0) {
            openData.map((val) => {
                data.push(
                    {
                        'underlying': val.baseCurrency,
                        'entryPrice': val.price,
                        "positionSide": val.positionSide,
                        "positionFilled": val.quantity,
                        "tradeMode": val.tradeMode,
                        "orderValue": val.orderValue,
                        'pnl': 0
                    }
                )
            })
        }
        return data;
    } catch (error) {
        console.log("Internal OpenOrders catch error", error);
        return [];
    }
}