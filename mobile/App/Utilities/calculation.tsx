export const openOrdersAsposition = (openData: any) => {
    try {
        let data: any = []
        if (openData.length > 0) {
            openData.map((val: any) => {
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