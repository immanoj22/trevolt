import { useEffect, useRef } from "react";
import { useSelector, useDispatch } from 'react-redux';

import { isEmpty } from "../../Utilities/helerfunction";
import { openOrdersAsposition } from "../../Utilities/calculation";
import { futureSelector, UnderlyingStress, useLazyStressPointsQuery, UserRiskAndMarginDetails } from "../../Slices/future";
import { walletSelector } from "../../Slices/wallet";

const usePortfolioHook = () => {
    const { wallet } = useSelector(walletSelector)
    const { futurePairData, underlyingStress, positionDetails, openOrderDetails, riskAndMarginDetails } = useSelector(futureSelector)
    const { userId, marginMode, accountId } = useSelector((state: any) => state.auth.userData);
    const [fetchStressPoints] = useLazyStressPointsQuery();

    const underlyingStressRef = useRef(underlyingStress)
    const futurePairDataRef = useRef(futurePairData)
    const riskAndMarginDetailsRef = useRef(riskAndMarginDetails)

    useEffect(() => {
        underlyingStressRef.current = underlyingStress
    }, [underlyingStress])

    useEffect(() => {
        futurePairDataRef.current = futurePairData
    }, [futurePairData])

    useEffect(() => {
        underlyingStressRef.current = underlyingStress
    }, [underlyingStress])

    useEffect(() => {
        riskAndMarginDetailsRef.current = riskAndMarginDetails
    }, [riskAndMarginDetails])

    const dispatch = useDispatch();

    const getStressPoints = async (underlying: any) => {
        try {
            let response = await fetchStressPoints(underlying).unwrap();
            if (response.success) {
                let stressDetails = { ...underlyingStressRef.current }
                stressDetails[`${underlying}`] = response.result
                dispatch(UnderlyingStress(stressDetails))
            }
            return response.success ? response.result : []
        } catch (err) {
            console.log(err, "getStressPoints__err")
        }
    }

    const computeOrderIncrementalMargin = async (orderData: any, pairData: any) => {
        try {
            let openToPosition = openOrdersAsposition(openOrderDetails)
            const originalPositions = [...positionDetails, ...openToPosition];
            const newPositions = [...originalPositions, orderToPosition(orderData, pairData)];

            const currentInitial = wallet.freezeBalance

            const newMargins = await computePortfolioMargins(newPositions, marginMode, wallet.unRealizedPnL, true);
            const newInitial: any = newMargins.initialMargin;
            const incremental = Math.max(0, newInitial - currentInitial);
            console.log(incremental, newInitial, currentInitial, "computeOrderIncrementalMargin")
            // return { requiredMargin: incremental, initialMargin: currentInitial, unRealizedPnL: wallet.unRealizedPnL };
            return incremental
        } catch (err) {
            console.log(err, "computeOrderIncrementalMargin___err")
        }
    }

    const orderToPosition = (orderData: any, pairData: any) => {
        try {
            let orderValue: any = orderData.price * orderData.quantity
            let positionOrder = {
                "underlying": pairData.baseCurrency,
                'entryPrice': (parseFloat(orderValue) / parseFloat(orderData.quantity)),
                'positionSide': orderData.buyorsell == 'buy' ? 'long' : 'short',
                'positionFilled': orderData.quantity,
                "tradeMode": orderData.tradeMode,
                "orderValue": orderValue,
                'userId': userId,
                "accountId": accountId,
                'pairId': pairData._id,
                'pairName': pairData.tickerRoot,
                'pnl': 0
            }
            return positionOrder
        } catch (err) {
            console.log(err, "orderToOpenPosition__err")
        }
    }

    const computePortfolioMargins = async (positions: any, marginMode: any, unRealizedPnL: any, isNew = false) => {
        if (marginMode !== 'portfolio') {
            // throw new Error('Account not in portfolio mode');
            return { status: false, statusCode: 400, message: "Account not in portfolio mode" }
        }

        // Group positions by underlying (portfolioing is done per underlying)
        const groups = groupPositionsByUnderlying(positions);

        let totalRiskMargin = 0;
        let totalFloor = 0;
        console.log(groups, "groupPositionsByUnderlying")
        for (const underlying of Object.keys(groups)) {
            const positions = groups[underlying];
            const pairData = getPairDataForUnderlying(underlying)
            const { riskMargin, floor } = await computeMarginsForUnderlying(underlying, positions, pairData);
            totalRiskMargin += riskMargin;
            totalFloor += floor;
            if (!isNew) {
                let unRealizedPnL = positions.reduce((val: any, curr: any) => {
                    val = parseFloat(curr.pnl) + parseFloat(val)
                    return val
                }, 0)
                const initialMargin = Math.max(riskMargin, floor) - unRealizedPnL;
                const maintenanceMargin = Math.max(0, (0.80 * (initialMargin + unRealizedPnL)) - unRealizedPnL);
                let riskAndMarginDetails = { ...riskAndMarginDetailsRef.current }
                riskAndMarginDetails[`${underlying}`] = {
                    maintenanceMargin: maintenanceMargin,
                    initialMargin: initialMargin
                }
                dispatch(UserRiskAndMarginDetails(riskAndMarginDetails))
            }
        }

        const initialMargin = Math.max(totalRiskMargin, totalFloor) - unRealizedPnL;
        const maintenanceMargin = Math.max(0, (0.80 * (initialMargin + unRealizedPnL)) - unRealizedPnL);
        console.log(maintenanceMargin, maintenanceMargin, totalRiskMargin, totalFloor, "computePortfolioMargins")
        return {
            riskMargin: totalRiskMargin,
            marginFloor: totalFloor,
            initialMargin: Math.max(0, initialMargin),
            maintenanceMargin
        };
    }

    const groupPositionsByUnderlying = (positions: any[]) => {
        return positions.reduce((acc: any, pos: any) => {
            acc[pos.underlying] = acc[pos.underlying] || [];
            acc[pos.underlying].push(pos);
            return acc;
        }, {});
    }

    const computeMarginsForUnderlying = async (underlying: any, positions: any, pairData: any) => {
        // if (!SUPPORTED_UNDERLYINGS.includes(underlying)) {
        //     // If not supported, these positions shouldn't exist in portfolio account.
        //     // In real flow, disallow or handle with isolated margin.
        //     throw new Error(`${underlying} not supported for portfolio margin`);
        // }

        // 1) Risk Margin via scenario simulation
        console.log(underlying, positions, pairData, "computeMarginsForUnderlying")
        const riskMargin = await computeRiskMargin(underlying, positions, pairData);
        console.log(riskMargin, "computeRiskMargin")
        // 2) Margin Floor
        const floor = computeMarginFloor(positions, pairData);
        console.log(floor, "computeMarginFloor")

        return { riskMargin, floor };
    }

    const computeRiskMargin = async (underlying: any, positions: any, pairData: any) => {
        // get spot price / DTEs etc from market data
        // const spotPrice = await getMarkPriceForUnderlying(underlying);// So it was a currect market price of the underlying asstes
        const spotPrice = pairData.last
        // approximate smallest days to expiry among options for IV stress formula
        const dteDays = estimateDteDays(positions);

        const scenarios = await generateScenariosForUnderlying(spotPrice, underlying, dteDays);

        let worstLoss = 0; // worst (max negative PNL)
        for (const scenario of scenarios) {
            console.log(positions, "positionValueUnderScenario", scenarios)
            const portfolioValue = positions.reduce((acc: any, pos: any) => {
                console.log(pos, 'positionValueUnderScenario_map')
                return acc + positionValueUnderScenario(pos, scenario);
            }, 0);
            // if portfolioValue is negative -> loss, store magnitude
            const loss = Math.max(0, -portfolioValue);
            if (loss > worstLoss) worstLoss = loss;
        }

        // riskMargin is worstLoss (may include add-ons / caps per contract)
        return worstLoss;
    }

    const getMarkPriceForUnderlying = (underlying: any) => {
        try {
            let pairData = futurePairData.find((val: any) => { val.baseCurrency == underlying })
            return pairData?.last ?? 0
        } catch (err) {
            console.log(err, "getMarkPriceForUnderlying___err")
            return 0
        }
    }

    const getPairDataForUnderlying = (underlying: any) => {
        try {
            console.log(futurePairDataRef.current, underlying, "getPairDataForUnderlying")
            let pairData = futurePairDataRef.current.find((val: any) => (val.baseCurrency == underlying))
            return pairData ?? {}
        } catch (err) {
            console.log(err, "getMarkPriceForUnderlying___err")
            return 0
        }
    }

    const estimateDteDays = (positions: any) => {// estimate minmum days count .In how many calendar days the positions will expiry 
        // find smallest days-to-expiry among option positions, or fallback to 30 days
        let minDays = 30;
        for (const p of positions) {
            if (p.tradeMode === 'option') {
                const diffMs = new Date(p.optionDetails.expiry).getTime() - Date.now();
                const days = Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
                minDays = Math.min(minDays, days);
            }
        }
        return minDays;
    }

    const positionValueUnderScenario = (position: any, scenario: any) => {
        // scenario: { underlyingPrice: Number, iv: Number }
        if (position.tradeMode === 'future' || position.tradeMode === 'perpetual') {
            // future MTM = (underlyingPrice - entryPrice) * size * contractMultiplier
            // convert to USD notional as needed
            const pnl = (scenario.underlyingPrice - position.entryPrice) * position.positionFilled;
            return position.positionSide === 'long' ? pnl : -pnl; // sign depends on side
        }

        if (position.tradeMode === 'option') {
            // Same linear scenario-PNL approach as future/perpetual above, using the
            // option's intrinsic value at the scenario underlying price in place of
            // the scenario price itself (entryPrice here is the premium paid/received).
            const strike = position.optionDetails?.strikePrice;
            const optionType = position.optionDetails?.optionType;
            const intrinsic = optionType === 'CALL'
                ? Math.max(0, scenario.underlyingPrice - strike)
                : Math.max(0, strike - scenario.underlyingPrice);
            const pnl = (intrinsic - position.entryPrice) * position.positionFilled;
            return position.positionSide === 'long' ? pnl : -pnl;
        }

        throw new Error('Unsupported position type');
    }

    const generateScenariosForUnderlying = async (currentPrice: any, underlying: any, dte: any) => {
        let pricePcts = underlyingStressRef.current[underlying];
        if (isEmpty(pricePcts)) {
            pricePcts = await getStressPoints(underlying)
        }
        const scenarios = [];

        // example IV stress generator (use exchange formula!)
        const ivUp = getIvStressUp(dte);
        const ivDown = getIvStressDown(dte);
        const ivMoves = [-ivDown, 0, ivUp];

        for (const p of pricePcts) {
            for (const ivChange of ivMoves) {
                console.log(ivChange, "generateScenariosForUnderlying")
                scenarios.push({
                    underlyingPrice: currentPrice * (1 + p),
                    iv: Math.max(0.0001, /* spotIV */ 0.5 + ivChange) // placeholder
                });
            }
        }
        return scenarios;
    }

    const getIvStressUp = (dteDays: any) => {
        // use exchange IV up formula: e.g. 45% * (30/DTE)^0.30
        if (dteDays <= 0) return 0.45;
        return 0.45 * Math.pow(30 / dteDays, 0.30);
    }
    const getIvStressDown = (dteDays: any) => {
        if (dteDays <= 0) return 0.30;
        return 0.30 * Math.pow(30 / dteDays, 0.30);
    }

    const computeMarginFloor = (positions: any, pairData: any) => {
        // Typical floor: sum of required margins per position with caps/slopes as exchange rules
        // We'll implement a simplified conservative floor:
        let floor = 0;
        for (const pos of positions) {
            if (pos.tradeMode === 'future' || pos.tradeMode === 'perpetual') {
                // e.g., require base % of notional (placeholder: 1% cap 2% for BTC)
                const basePct = pairData.basePct / 100; // replace with real numbers
                console.log(pairData, "pairData.basePct", Math.abs(pos.orderValue) * basePct)
                floor += Math.abs(pos.orderValue) * basePct;
            } else if (pos.tradeMode === 'option') {
                // For short options include premium + base notional; for long options only small requirement
                if (pos.positionSide === 'short') {
                    const premium = pos.optionDetails.premium * pos.positionFilled;
                    const baseNotional = Math.abs(pos.optionDetails.strike * pos.positionFilled);
                    // simplified: short option floor = max(premium + 0.2 * baseNotional, premium)
                    floor += Math.max(premium + 0.2 * baseNotional, premium);
                } else {
                    // long option: maybe small margin (premium paid already)
                    floor += 0; // often long options require no extra floor beyond premium
                }
            }
        }
        // // apply caps if required (placeholder)
        // const cap = underlying === 'BTC' ? 0.02 : 0.05;
        console.log(positions, "computeMarginFloor")
        return Math.min(floor, getTotalNotional(positions));
    }

    const getTotalNotional = (positions: any) => {
        return positions.reduce((s: any, p: any) => s + Math.abs(p.orderValue || 0), 0);
    }

    return { computePortfolioMargins, computeOrderIncrementalMargin }
}

export default usePortfolioHook;