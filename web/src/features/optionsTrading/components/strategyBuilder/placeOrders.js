import { optionBasketOrderPlacing } from '../../../../actions/OptionTradeAction'

function buildLegPayload(contract, strategyMultiplier) {
    const basePrice = contract.marketOrLimit
        ? Number(contract.markPriceAtAdd)
        : Number(contract.limitPrice);

    return {
        pairId: contract.pairId,
        price: Number.isFinite(basePrice) ? basePrice : 0,
        // Strategy Multiplier = "repeat this whole basket N times" - scales every leg's quantity.
        quantity: (parseFloat(contract.qty) || 0) * strategyMultiplier,
        buyorsell: contract.buyOrSell ? 'buy' : 'sell',
        orderType: contract.marketOrLimit ? 'market' : 'limit',
        reduce_only: false,
        makeronly: false,
        isTrailingOrder: false,
        trailPrice: 0,
        trailTypePrice: 0,
        trailType: 'market',
        isTake: false,
        isStop: false,
        typeTIF: '',
        orderCost: 0,
        orderValue: 0,
        margin: 0,
        fees: 0,
        stopPrice: '',
        leverage: parseInt(contract.multiplier, 10) || 1,
        takeProfit: { stopPrice: '', price: '', orderType: 'bracket_tp_market' },
        stopLoss: { stopPrice: '', price: '', orderType: 'bracket_sl_market' },
    }
}

// Places the whole checked basket in ONE request against /option/basket_order_placing,
// which loops the legs server-side. Futures legs aren't supported yet (no pairId captured for them).
export async function placeStrategyOrders(contracts, secretKey, strategyMultiplier = 1) {
    const checked = contracts.filter((c) => c.checked);
    const optionLegs = checked.filter((c) => c.kind === 'option' && c.pairId);
    const skipped = checked.length - optionLegs.length;

    if (optionLegs.length === 0) {
        return { results: [], skipped };
    }

    const invalidResults = [];
    const validLegs = [];

    optionLegs.forEach((contract) => {
        const baseQty = parseFloat(contract.qty) || 0;
        const normalizedQty = baseQty * strategyMultiplier;
        const basePrice = contract.marketOrLimit
            ? Number(contract.markPriceAtAdd)
            : Number(contract.limitPrice);

        if (!Number.isFinite(normalizedQty) || normalizedQty <= 0) {
            invalidResults.push({
                contract,
                response: { success: false, message: 'Please enter a valid quantity greater than 0' },
            });
            return;
        }

        if (contract.marketOrLimit) {
            if (!Number.isFinite(basePrice) || basePrice <= 0) {
                invalidResults.push({
                    contract,
                    response: { success: false, message: 'Market price is not available for this contract' },
                });
                return;
            }
        } else if (!Number.isFinite(basePrice) || basePrice <= 0) {
            invalidResults.push({
                contract,
                response: { success: false, message: 'Please enter a valid limit price greater than 0' },
            });
            return;
        }

        validLegs.push(contract);
    });

    if (validLegs.length === 0) {
        return { results: invalidResults, skipped };
    }

    const orders = validLegs.map((c) => buildLegPayload(c, strategyMultiplier));
    const response = await optionBasketOrderPlacing({ orders }, secretKey);

    const results = [
        ...invalidResults,
        ...validLegs.map((contract, index) => ({
            contract,
            response: response.result?.[index] ?? { success: false, message: response.message || 'Order failed' },
        })),
    ];

    return { results, skipped };
}
