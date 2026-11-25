import { useEffect, useRef, useState } from "react"
import { useSelector, useDispatch } from 'react-redux';
import { isEmpty } from "../lib/isEmpty";
import { fetchStressPoints } from "../actions/futureActions";
import { UnderlyingStress } from "../redux/futureAction";
import { openOrdersAsposition } from "../lib/calculation";
import { UserRiskAndMarginDetails } from "../redux/action";

const usePortfolioHook = () => {

    const { futurePairData, underlyingStress } = useSelector((state) => state.future);
    const { positionDetails, wallet, userdetails, openOrderDetails, riskAndMarginDetails } = useSelector((state) => state.user)

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

    const getStressPoints = async (underlying) => {
        try {
            let { result, status } = await fetchStressPoints(underlying)
            if (status) {
                let stressDetails = { ...underlyingStressRef.current }
                stressDetails[`${underlying}`] = result
                dispatch(UnderlyingStress({ underlyingStress: stressDetails }))
            }
            return status ? result : []
        } catch (err) {
            console.log(err, "getStressPoints__err")
        }
    }

    const computeOrderIncrementalMargin = async (orderData, pairData) => {
        try {
            let openToPosition = openOrdersAsposition(openOrderDetails)
            const originalPositions = [...positionDetails, ...openToPosition];
            const newPositions = [...originalPositions, orderToPosition(orderData, pairData)];

            const currentInitial = wallet.freezeBalance

            const newMargins = await computePortfolioMargins(newPositions, userdetails.marginMode, wallet.unRealizedPnL, true);
            const newInitial = newMargins.initialMargin;
            const incremental = Math.max(0, newInitial - currentInitial);
            // return { requiredMargin: incremental, initialMargin: currentInitial, unRealizedPnL: wallet.unRealizedPnL };
            return incremental
        } catch (err) {
            console.log(err, "computeOrderIncrementalMargin___err")
        }
    }

    const orderToPosition = (orderData, pairData) => {
        try {
            let orderValue = orderData.price * orderData.quantity
            let positionOrder = {
                "underlying": pairData.baseCurrency,
                'entryPrice': (parseFloat(orderValue) / parseFloat(orderData.quantity)),
                'positionSide': orderData.buyorsell == 'buy' ? 'long' : 'short',
                'positionFilled': orderData.quantity,
                "tradeMode": orderData.tradeMode,
                "orderValue": orderValue,
                'userId': userdetails.userId,
                "accountId": userdetails.accountId,
                'pairId': pairData._id,
                'pairName': pairData.tickerRoot,
                'pnl': 0
            }
            return positionOrder
        } catch (err) {
            console.log(err, "orderToOpenPosition__err")
        }
    }

    const computePortfolioMargins = async (positions, marginMode, unRealizedPnL, isNew = false) => {
        if (marginMode !== 'portfolio') {
            // throw new Error('Account not in portfolio mode');
            return { status: false, statusCode: 400, message: "Account not in portfolio mode" }
        }

        // Group positions by underlying (portfolioing is done per underlying)
        const groups = groupPositionsByUnderlying(positions);

        let totalRiskMargin = 0;
        let totalFloor = 0;
        for (const underlying of Object.keys(groups)) {
            const positions = groups[underlying];
            const pairData = getPairDataForUnderlying(underlying)
            const { riskMargin, floor } = await computeMarginsForUnderlying(underlying, positions, pairData);
            totalRiskMargin += riskMargin;
            totalFloor += floor;
            if (!isNew) {
                let unRealizedPnL = positions.reduce((val, curr) => {
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
                dispatch(UserRiskAndMarginDetails({ riskAndMarginDetails: riskAndMarginDetails }))
            }
        }

        const initialMargin = Math.max(totalRiskMargin, totalFloor) - unRealizedPnL;
        const maintenanceMargin = Math.max(0, (0.80 * (initialMargin + unRealizedPnL)) - unRealizedPnL);
        return {
            riskMargin: totalRiskMargin,
            marginFloor: totalFloor,
            initialMargin: Math.max(0, initialMargin),
            maintenanceMargin
        };
    }


    const groupPositionsByUnderlying = (positions) => {
        return positions.reduce((acc, pos) => {
            acc[pos.underlying] = acc[pos.underlying] || [];
            acc[pos.underlying].push(pos);
            return acc;
        }, {});
    }


    const computeMarginsForUnderlying = async (underlying, positions, pairData) => {
        // if (!SUPPORTED_UNDERLYINGS.includes(underlying)) {
        //     // If not supported, these positions shouldn't exist in portfolio account.
        //     // In real flow, disallow or handle with isolated margin.
        //     throw new Error(`${underlying} not supported for portfolio margin`);
        // }

        // 1) Risk Margin via scenario simulation
        const riskMargin = await computeRiskMargin(underlying, positions, pairData);
        // 2) Margin Floor
        const floor = computeMarginFloor(positions, pairData);

        return { riskMargin, floor };
    }


    const computeRiskMargin = async (underlying, positions, pairData) => {
        // get spot price / DTEs etc from market data
        // const spotPrice = await getMarkPriceForUnderlying(underlying);// So it was a currect market price of the underlying asstes
        const spotPrice = pairData.last
        // approximate smallest days to expiry among options for IV stress formula
        const dteDays = estimateDteDays(positions);

        const scenarios = await generateScenariosForUnderlying(spotPrice, underlying, dteDays);

        let worstLoss = 0; // worst (max negative P&L)
        for (const scenario of scenarios) {
            const portfolioValue = positions.reduce((acc, pos) => {
                return acc + positionValueUnderScenario(pos, scenario);
            }, 0);
            // if portfolioValue is negative -> loss, store magnitude
            const loss = Math.max(0, -portfolioValue);
            if (loss > worstLoss) worstLoss = loss;
        }

        // riskMargin is worstLoss (may include add-ons / caps per contract)
        return worstLoss;
    }


    const getMarkPriceForUnderlying = (underlying) => {
        try {
            let pairData = futurePairData.find((val) => { val.baseCurrency == underlying })
            return pairData?.last ?? 0
        } catch (err) {
            console.log(err, "getMarkPriceForUnderlying___err")
            return 0
        }
    }

    const getPairDataForUnderlying = (underlying) => {
        try {
            let pairData = futurePairDataRef.current.find((val) => (val.baseCurrency == underlying))
            return pairData ?? {}
        } catch (err) {
            console.log(err, "getMarkPriceForUnderlying___err")
            return 0
        }
    }

    const estimateDteDays = (positions) => {// estimate minmum days count .In how many calendar days the positions will expiry 
        // find smallest days-to-expiry among option positions, or fallback to 30 days
        let minDays = 30;
        for (const p of positions) {
            if (p.tradeMode === 'option') {
                const diffMs = new Date(p.optionDetails.expiry) - Date.now();
                const days = Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
                minDays = Math.min(minDays, days);
            }
        }
        return minDays;
    }

    const positionValueUnderScenario = (position, scenario) => {
        // scenario: { underlyingPrice: Number, iv: Number }
        if (position.tradeMode === 'future' || position.tradeMode === 'perpetual') {
            // future MTM = (underlyingPrice - entryPrice) * size * contractMultiplier
            // convert to USD notional as needed
            const pnl = (scenario.underlyingPrice - position.entryPrice) * position.positionFilled;
            return position.positionSide === 'long' ? pnl : -pnl; // sign depends on side
        }

        if (position.tradeMode === 'option') {
            // compute option theoretical price under scenario
            const price = optionPriceModel(position.optionDetails, scenario.underlyingPrice, scenario.iv);
            // long option: value = price * contracts; short: negative
            return position.positionSide === 'long' ? price * position.positionFilled : -price * position.positionFilled;
        }

        throw new Error('Unsupported position type');
    }

    const generateScenariosForUnderlying = async (currentPrice, underlying, dte) => {
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
                scenarios.push({
                    underlyingPrice: currentPrice * (1 + p),
                    iv: Math.max(0.0001, /* spotIV */ 0.5 + ivChange) // placeholder
                });
            }
        }
        return scenarios;
    }

    const getIvStressUp = (dteDays) => {
        // use exchange IV up formula: e.g. 45% * (30/DTE)^0.30
        if (dteDays <= 0) return 0.45;
        return 0.45 * Math.pow(30 / dteDays, 0.30);
    }
    const getIvStressDown = (dteDays) => {
        if (dteDays <= 0) return 0.30;
        return 0.30 * Math.pow(30 / dteDays, 0.30);
    }

    const computeMarginFloor = (positions, pairData) => {
        // Typical floor: sum of required margins per position with caps/slopes as exchange rules
        // We'll implement a simplified conservative floor:
        let floor = 0;
        for (const pos of positions) {
            if (pos.tradeMode === 'future' || pos.tradeMode === 'perpetual') {
                // e.g., require base % of notional (placeholder: 1% cap 2% for BTC)
                const basePct = pairData.basePct / 100; // replace with real numbers
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
        return Math.min(floor, getTotalNotional(positions));
    }

    const getTotalNotional = (positions) => {
        return positions.reduce((s, p) => s + Math.abs(p.orderValue || 0), 0);
    }

    return { computePortfolioMargins, computeOrderIncrementalMargin }
}


export default usePortfolioHook