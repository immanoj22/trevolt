/** PACKAGE IMPORT */

import React, { useState, useEffect, useContext } from 'react'
import { FaPlus, FaMinus, FaCalculator, FaPercent, FaRegCreditCard } from "react-icons/fa6";
import { IoIosArrowDown, IoIosArrowUp } from "react-icons/io";
import { useSelector } from "react-redux";
import { useParams, useNavigate } from "react-router-dom";
import isEmpty from "is-empty"

/** LOCAL FILES IMPORT */

import styles from "../styles/tradeActionCard.module.css"
import { InputWithCurrencyAndLabel, InputWithSelectAndLabel, InputWithSelectOption } from '../../../components/Input/InputFields';
import Button from '../../../components/Button/Button';
import SocketContext from '../../../context/socketContext';

/** REDUX */
import { futureAvailableMargin, futureChangeLeverage, futureOrderPlacing, futureOrderBook } from '../../../actions/futureActions';
import { showToastMessage } from '../../../lib/toast';
import { formatDisplayPair } from '../../../lib/pairDisplay';
import { MdDelete, MdModeEdit } from 'react-icons/md';
import CustomDropdown from '../../../components/UiComponents/DropDownComponent';
import TooltipComponent from '../../../components/UiComponents/tooltipComponent';
import CalculatorModal from '../modal/CalculatorModal';
import { BiSolidDollarCircle } from 'react-icons/bi';
import LeverageModal from '../modal/leverageModal';
import CustomRangeSlider from '../../../components/UiComponents/CustomRangeSlider';
import { RiArrowDownSLine, RiArrowUpSLine } from 'react-icons/ri';
import OrderPlaceModel from '../modal/OrderPlaceModel';
import { LotToquantity, QuantityToVolume, VolumeToquantity, quantityToLot } from '../../../lib/calculation';
import usePortfolioHook from '../../../hooks/usePortfolioHook';
import config from '../../../config/env';
import { formatValue } from '../../../lib/Common';
import { GoQuestion } from "react-icons/go";
import MarkersModel from '../modal/markersModal';
import { toCutOff } from '../../../calculation/calculationlib';
import { calculateLeverageValue } from '../../../lib/tradeSafety';

/** CODE START */
const quantityPercentage = [25, 50, 75, 100]

const TradeActionCard = ({ handleShowBracketOrder, formData, setFormData, initialState }) => {
    // console.log(formData, "TradeActionCard_fromData")
    const { tikerRoot } = useParams()
    const navigate = useNavigate();
    const socketContext = useContext(SocketContext);

    const userData = useSelector((state) => state.user);
    const { userdetails, isAuthStatus, wallet } = userData;
    const { futureTicker, futureTradePair, makerFee, takerFee } = useSelector((state) => state.future);
    // console.log(makerFee, takerFee, "makerFee, takerFee")
    const { computeOrderIncrementalMargin } = usePortfolioHook();

    const [orderTypeSelectOpen, setOrderTypeSelectOpen] = useState(false)
    const [balPrecen, setBalPrecen] = useState('0')
    const [errors, setErrors] = useState({})
    const [calculatorModalOpen, setCalculatorModalOpen] = useState(false);
    const [leverageDropdownOpen, setLeverageDropdownOpen] = useState(false);
    const [leverage, setLeverage] = useState(1);
    const [orderPlaceModel, setOrderPlaceModel] = useState(false)
    const [isLoading, setIsLoading] = useState(false)
    const [quantityIn, setQuantityIn] = useState('lot')
    const [lotQuantity, setlotQuantity] = useState('')
    const [isEdit, setIsEdit] = useState(false)
    // Best Bid (buy tab) / Best Offer (sell tab) — quick-fill reference shown
    // above the Price field. { bid, offer } are just the top-of-book prices;
    // sourced the same way OrderBook.jsx gets its data (REST snapshot +
    // 'FuturesorderBook' socket updates) without touching that component.
    const [bestPrices, setBestPrices] = useState({ bid: null, offer: null })
    const [cardDetails, setCardDetails] = useState({
        orderCost: 0,
        orderValue: 0,
        margin: 0,
        fees: 0,
    })
    const [showMarkerModal, setShowMarkerModal] = useState(false)

    useEffect(() => {
        // console.log("tikerRoot_Det", tikerRoot);
        if (tikerRoot) {
            setlotQuantity('')
        }
    }, [tikerRoot])

    // Chart click → autofill the Price field with the exact clicked price.
    // Broadcast from TradingViewChart.jsx (a sibling component, not a
    // parent/child of this one) via the same window CustomEvent pattern
    // this codebase already uses for 'chartResize' — no prop-drilling
    // changes needed anywhere else.
    useEffect(() => {
        const handleChartPriceClick = (e) => {
            const rawPrice = e?.detail?.price;
            const price = Number(rawPrice);
            if (!Number.isFinite(price)) return;
            const decimals = futureTradePair?.quoteDecimal ?? 2;
            setFormData(prev => ({ ...prev, price: price.toFixed(decimals) }));
        };
        window.addEventListener('chartPriceClick', handleChartPriceClick);
        return () => window.removeEventListener('chartPriceClick', handleChartPriceClick);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [futureTradePair?.quoteDecimal]);

    // Best Bid/Offer — initial snapshot via the same futureOrderBook REST
    // call OrderBook.jsx already uses, just asking for a single top-of-book
    // row instead of the full depth list.
    useEffect(() => {
        if (isEmpty(futureTradePair?._id)) return;
        let cancelled = false;
        (async () => {
            try {
                const { status, result } = await futureOrderBook(futureTradePair._id, {
                    limit: 1,
                    buyLoading: false,
                    sellLoading: false,
                });
                if (!cancelled && status && result) {
                    setBestPrices({
                        bid: result.buyOrder?.[0]?._id ?? null,
                        offer: result.sellOrder?.[0]?._id ?? null,
                    });
                }
            } catch (err) {
                console.log('bestPrices fetch err', err);
            }
        })();
        return () => { cancelled = true; };
    }, [futureTradePair?._id]);

    // Best Bid/Offer — live updates via the exact same 'FuturesorderBook'
    // socket event OrderBook.jsx subscribes to, so this stays in sync with
    // the real order book without polling or touching that component.
    useEffect(() => {
        if (!socketContext?.socket) return;
        const handleFuturesOrderBookForBestPrice = (raw) => {
            try {
                const result = JSON.parse(raw);
                const tikerRootStored = localStorage.getItem('futurespair');
                if (result.tickerRoot !== tikerRootStored) return;
                setBestPrices({
                    bid: result.buyOrder?.[0]?._id ?? null,
                    offer: result.sellOrder?.[0]?._id ?? null,
                });
            } catch (err) {
                console.log('handleFuturesOrderBookForBestPrice err', err);
            }
        };
        socketContext.socket.on('FuturesorderBook', handleFuturesOrderBookForBestPrice);
        return () => socketContext.socket.off('FuturesorderBook', handleFuturesOrderBookForBestPrice);
    }, [socketContext]);

    // Fills the Price field with the current best bid (buy tab) / best
    // offer (sell tab) — the click handler for the new quick-fill row.
    const handleBestPriceClick = () => {
        const value = formData?.buyorsell === 'sell' ? bestPrices.offer : bestPrices.bid;
        if (value === null || value === undefined || isNaN(Number(value))) return;
        const decimals = futureTradePair?.quoteDecimal ?? 2;
        setFormData(prev => ({ ...prev, price: Number(value).toFixed(decimals) }));
    };

    const handleOrderListSelect = (value) => {
        setErrors({})
        setBalPrecen('0');
        setlotQuantity('')
        setFormData(prev => ({
            ...prev, ...{
                quantity: "",
                orderCost: 0,
                orderValue: 0,
                margin: 0,
                fees: 0,
                orderType: value,
                makeronly: value === 'makeronly' ? true : false,
                isTrailingOrder: value === 'trailingStop' ? true : false,
            }
        }));
        setCardDetails({
            orderCost: 0,
            orderValue: 0,
            margin: 0,
            fees: 0,
        })
        setOrderTypeSelectOpen(false);
    };

    const getOrderTypeLabel = (type) => {
        switch (type) {
            case 'makerOnly':
                return 'Maker Only';
            case 'stop_limit':
                return 'Stop Limit';
            case 'stop_market':
                return 'Stop Market';
            case 'trailingStop':
                return 'Trailing Stop';
            case 'take_profit_limit':
                return 'Take Profit Limit';
            case 'take_profit':
                return 'Take Profit Market';
            case 'makeronly':
                return 'Maker Only';
            default:
                return 'Stop Limit';
        }
    };

    const calculateOrderValue = async (quantity, price) => {
        const orderValueRaw = quantity * price;
        const orderValue = isNaN(orderValueRaw) ? 0 : orderValueRaw;

        const orderCostRaw = userdetails.marginMode == 'portfolio' ?
            await computeOrderIncrementalMargin({
                price: price,
                quantity: quantity,
                tradeMode: 'future',
                buyorsell: formData.buyorsell
            }, futureTradePair) :
            (quantity * price) / (leverage ? leverage : 1);

        let EffectiveLeverage = 0
        if (userdetails.marginMode == 'portfolio') {
            // console.log(orderValueRaw, orderCostRaw, "calculateOrderValue")
            EffectiveLeverage = parseFloat(orderValueRaw) / parseFloat(orderCostRaw)
            EffectiveLeverage = isNaN(EffectiveLeverage) || !isFinite(EffectiveLeverage) ? 0 : parseFloat(EffectiveLeverage).toFixed(2)
            setLeverage(EffectiveLeverage)
        }
        const orderCost = isNaN(orderCostRaw) || !isFinite(orderCostRaw) ? 0 : orderCostRaw;

        // let fees = (orderValueRaw * futureTradePair.takerFee / 100) * 2

        let fees = (orderValueRaw * takerFee / 100) * 2
        fees = fees * 1.18
        let margin = parseFloat(orderCostRaw) + parseFloat(fees)
        // console.log("calculateOrderValue", orderValueRaw, orderCost, fees, leverage);
        fees = isNaN(fees) || !isFinite(fees) ? 0 : fees
        margin = isNaN(margin) || !isFinite(margin) ? 0 : parseFloat(margin)

        let updatedForm = { orderValue, orderCost, fees, margin };
        setCardDetails(updatedForm);
    };

    const handleBalanceprecn = (percentage) => {
        try {
            // console.log(percentage, "handleBalanceprecn", leverage);

            const price = ['market', 'trailingStop', 'stop_market', 'take_profit'].includes(formData.orderType)
                // formData.orderType === "market" || formData.orderType === "stop"
                ? futureTicker.marketPrice
                : parseFloat(formData.price);

            if (!price || !isFinite(price)) {
                // console.warn("Invalid price", price);
                return;
            }

            let investBalance = (wallet?.availableBalance * (Number(percentage) / 100)) || 0;
            investBalance = Number(investBalance); //parseFloat(investBalance.toFixed(futureTradePair.quoteDecimal));

            if (percentage === 100) {
                // const feePercent = 2 * parseFloat(futureTradePair.takerFee);

                const feePercent = 2 * parseFloat(takerFee);

                const orderValue = investBalance * leverage;
                let fee = orderValue * (feePercent / 100);
                fee = fee * 1.18
                if (!isFinite(fee)) fee = 0;
                // console.log(orderValue, fee, investBalance, "before fee adjustment");
                investBalance -= fee;
                // console.log(orderValue, fee, investBalance, "after fee adjustment");
            }

            let quantity = (investBalance / price) * leverage || 0;

            quantity = toCutOff(Number(quantity), futureTradePair.baseDecimal); //parseFloat(quantity.toFixed(futureTradePair.baseDecimal));
            // console.log(quantity, "quantity_calculate")
            let lotQuantity = quantity
            if (quantityIn == 'lot') {
                lotQuantity = quantityToLot(lotQuantity, futureTradePair.minAmount, futureTradePair.baseDecimal)
            } else if (quantityIn == futureTradePair.quoteCurrency) {
                lotQuantity = QuantityToVolume(lotQuantity, price, futureTradePair.baseDecimal)
            }
            // console.log(lotQuantity, "lotQuantity")
            setlotQuantity(lotQuantity)
            calculateOrderValue(quantity, price);
            setBalPrecen(percentage);
            setFormData(prev => ({ ...prev, ['quantity']: quantity }));
        } catch (err) {
        }
    };

    const onChangeHandler = async (name, value) => {
        try {
            const numbers = /^[+]?([0-9]+(?:\.[0-9]*)?|\.[0-9]+)$/;
            // console.log(name, value, "onChangeHandler__quantity")
            if (['price', 'quantity', 'stopPrice', 'orderType'].includes(name)) {
                if (value !== "" && !numbers.test(value)) return false;
            }
            // handle price
            if (name === 'price' || name == 'stopPrice') {
                const price = ['market', 'stop_market', 'take_profit', 'trailingStop'].includes(formData.orderType)
                    ? futureTicker.marketPrice
                    : parseFloat(value);
                calculateOrderValue(formData.quantity, price);
            }

            if (name === 'quantity') {
                const price = ['market', 'trailingStop', 'stop_market', 'take_profit'].includes(formData.orderType)
                    ? futureTicker.marketPrice
                    : parseFloat(formData.price);
                setBalPrecen('0');
                let quantity = value
                if (quantityIn == 'lot') {
                    const decimal = /^[+]?[0-9]+$/
                    if (value !== "" && !decimal.test(value)) return false;
                    let maxLot = quantityToLot(futureTradePair.maxAmount, futureTradePair.minAmount, futureTradePair.baseDecimal)
                    let minLot = quantityToLot(futureTradePair.minAmount, futureTradePair.minAmount, futureTradePair.baseDecimal)
                    if (parseFloat(value) < parseFloat(minLot) || parseFloat(value) > parseFloat(maxLot)) {
                        return false
                    }
                    quantity = LotToquantity(value, futureTradePair.minAmount, futureTradePair.baseDecimal)
                } else if (quantityIn == futureTradePair.quoteCurrency) {
                    quantity = VolumeToquantity(value, price, futureTradePair.baseDecimal)
                }
                setlotQuantity(value)
                calculateOrderValue(quantity, price);
                setErrors(prev => ({ ...prev, [name]: '' }));
                setFormData(prev => ({ ...prev, ['quantity']: quantity }));
                return;
            }

            if (name === 'stopPrice' && formData.orderType === 'trailingStop') {
                setFormData(prev => ({ ...prev, trailPrice: value }));
            }

            setFormData(prev => ({ ...prev, [name]: value }));
            setErrors(prev => ({ ...prev, [name]: '' }));
        } catch (e) {
        }
    };

    const onSelectHandler = (value) => {
        try {
            setFormData({ ...formData, ...{ trailType: value, trailTypePrice: futureTicker.marketPrice } })
            setErrors({ ...errors, ...{ trailType: '' } })
        } catch (e) {
            console.log("onSelectHandler_err", e);
        }
    }

    const setInitalData = () => {
        try {
            // BUG FIX: this used to prefer futureTicker.marketPrice over
            // futureTradePair.marketPrice. futureTicker lives in a separate
            // Redux slice, re-synced to the newly selected pair by a
            // *different* effect elsewhere (FuturesTrading.jsx), which can
            // commit after this effect runs when a pair switch doesn't go
            // through CoinPairs' click handler (direct URL nav, favorites,
            // chart symbol search, etc.) — so futureTicker briefly still
            // held the *previous* pair's price, and since futureTicker
            // isn't a dependency here, the stale price never self-corrected.
            // futureTradePair itself is always internally consistent the
            // instant it changes (its own marketPrice can't lag behind
            // itself), so it's used as the primary source now; futureTicker
            // is only a fallback for the rare case futureTradePair lacks one.
            const price = futureTradePair?.marketPrice ?? futureTicker?.marketPrice;
            setFormData({
                ...formData, ...{
                    price,
                    pairId: futureTradePair._id,
                    trailTypePrice: price,
                }
            })
        } catch (err) {
            console.log(err, 'SetInitalData___err')
        }
    }

    const removeBracketOrders = () => {
        try {
            setFormData({
                ...formData,
                isTake: false,
                isStop: false,
                takeProfit: { stopPrice: "", price: "", orderType: "bracket_tp_market" },
                stopLoss: { stopPrice: "", price: "", orderType: "bracket_sl_market" }
            })
        } catch (err) {
            console.log(err, "removeBracketOrders___err")
        }
    }

    const orderPlacing = async () => {
        try {
            setIsLoading(true)

            formData['orderType'] = {
                makeronly: "limit",
                trailingStop: "stop_market",
            }[formData.orderType] || formData.orderType;

            const data = await futureOrderPlacing({
                ...formData,
                pairId: futureTradePair._id,
                // Belt-and-suspenders: the leverage input already blocks
                // anything below 1, but clamp here too so the submitted
                // order can never carry an invalid leverage regardless of
                // how the state got set.
                leverage: Math.max(Math.round(Number(leverage)) || 1, 1)
            }, userdetails?.secretKey);
            setIsLoading(false)
            if (data.status) {
                setOrderPlaceModel(false)
                // Fund-insufficient case is already toasted once via the
                // FuturesInsuranceFundInsufficient socket event (see
                // HelperRoutes.js) — showing it again here would duplicate it.
                if (!data.result?.fundInsufficient) {
                    showToastMessage(data.message, 'success');
                }
                setlotQuantity('')
                setBalPrecen('0')
                setFormData({
                    ...initialState, ...{
                        isTrailingOrder: formData.isTrailingOrder,
                        makeronly: formData.makeronly,
                        buyorsell: formData.buyorsell,
                        orderType: formData.orderType === 'limit' ? formData.orderType : formData.makeronly ? 'makeronly' : formData.isTrailingOrder ? 'trailingStop' : formData.orderType,
                        price: formData.price,
                        takeProfit: { stopPrice: "", price: "", orderType: "bracket_tp_market" },
                        stopLoss: { stopPrice: "", price: "", orderType: "bracket_sl_market" }
                    }
                })
                setCardDetails({ orderCost: 0, orderValue: 0, margin: 0, fees: 0 })
            } else {
                setFormData({
                    ...formData, ...{
                        orderType: formData.orderType === 'limit' ? formData.orderType : formData.makeronly ? 'makeronly' : formData.isTrailingOrder ? 'trailingStop' : formData.orderType,
                    }
                })
                setOrderPlaceModel(!isEmpty(data.message) ? true : false)
                setErrors(data.error);
                !isEmpty(data.message) && showToastMessage(data.message, 'error')
            }
        } catch (e) {
            console.log("orderPlacing_err", e);
        }
    }

    const changeLeverage = async (value) => {
        try {
            if (value < 1) return false;
            const payload = { leverage: value, pairId: futureTradePair._id }
            const data = await futureChangeLeverage(payload, userdetails?.secretKey);
            showToastMessage(data.message, data.status ? 'success' : 'error');
            setLeverageDropdownOpen(!leverageDropdownOpen)
        } catch (e) {
            console.log("orderPlacing_err", e);
        }
    }

    const handleLeverageButtonClick = (percent) => {
        const calculatedValue = calculateLeverageValue(percent, futureTradePair?.max_leverage ?? 100, 1);
        // The slider's tick-mark labels are rounded for display (roundLabels
        // prop below) — round the value a click actually sets to match,
        // otherwise clicking a mark labeled e.g. "3x" would silently set the
        // unrounded 2.5x instead.
        setLeverage(Math.round(calculatedValue))
    };

    const handleLeverageSliderChange = (e) => {
        const rawValue = Number(e.target.value);
        // Whole numbers only — the slider itself is stepped by 1 (sliderStep
        // prop below), Math.round is belt-and-suspenders against any
        // fractional value still slipping through.
        const clampedValue = Math.max(Math.round(rawValue), 1);
        setLeverage(clampedValue)
    };

    useEffect(() => {
        setInitalData()
    }, [formData.orderType, tikerRoot, futureTradePair])

    useEffect(() => {
        if (userData?.leverage) {
            // Whole numbers only — a leverage value saved to the account
            // before this restriction existed could still be a decimal
            // (e.g. 2.5x); round it on load so the initial slider position/
            // display is never fractional.
            setLeverage(Math.round(userData?.leverage) || 1)
        }
    }, [userData?.leverage])

    useEffect(() => {
        if (!isEmpty(formData.quantity)) {
            let lotQty = formData.quantity
            const price = ['market', 'trailingStop'].includes(formData.orderType)
                ? futureTicker.marketPrice :
                ['stop_market', 'take_profit'].includes(formData.orderType) ?
                    formData.stopPrice
                    : parseFloat(formData.price);
            if (quantityIn == 'lot') {
                lotQty = quantityToLot(lotQty, futureTradePair.minAmount, futureTradePair.baseDecimal)
            } else if (quantityIn == futureTradePair.quoteCurrency) {
                lotQty = QuantityToVolume(lotQty, price, futureTradePair.quoteDecimal)
            }
            setlotQuantity(lotQty)
        }
    }, [quantityIn])

    // Previously there was a useEffect here, keyed on [futureTicker], that
    // recalculated and overwrote the visible `lotQuantity` input on every
    // single live price tick whenever the order type was market/trailingStop
    // and the quantity unit was set to the quote currency (e.g. USDT). Since
    // `futureTicker` updates continuously, this silently rewrote the number
    // the user had just typed as soon as the field lost focus — the
    // "quantity keeps fluctuating on its own" issue. The actual order
    // quantity (`formData.quantity`) and the live estimated order value are
    // both computed independently elsewhere and are unaffected by removing
    // this — only the redundant, disruptive re-display of the input itself
    // has been removed.

    // useEffect(() => {
    //     if (['market', 'trailingStop'].includes(formData.orderType) && !isEdit) {
    //         let lotQty = formData.quantity
    //         if (quantityIn == futureTradePair.quoteCurrency) {
    //             lotQty = QuantityToVolume(lotQty, futureTicker.marketPrice, futureTradePair.quoteDecimal)
    //             setlotQuantity(lotQty)
    //         }
    //     }
    // }, [futureTicker])

    const handleMarkerOnly = (e) => {
        e.stopPropagation()
        setShowMarkerModal(true)
    }

    // console.log("futureTradePair_Det", wallet?.availableBalance, quantityIn, futureTradePair.minAmount, lotQuantity)

    return (
        <div className={styles.container}>
            <OrderPlaceModel
                isLoading={isLoading}
                orderPlacing={orderPlacing}
                formData={{ ...formData, ...cardDetails }}
                show={orderPlaceModel}
                handleClose={() => { setOrderPlaceModel(false) }}
            />
            <CalculatorModal show={calculatorModalOpen} handleClose={() => setCalculatorModalOpen(false)} />
            <MarkersModel show={showMarkerModal} handleClose={() => setShowMarkerModal(false)} />
            <div className={`${styles.body} `}>

                {
                    (isAuthStatus && userdetails.marginMode !== 'portfolio') &&
                    <div className={styles.leverageFormContainer}>
                        <div
                            onClick={() => {
                                if (leverageDropdownOpen) {
                                    setLeverage(Math.round(userData?.leverage) || 1)
                                }
                                setLeverageDropdownOpen(!leverageDropdownOpen)
                            }}
                            className={styles.leverageHeader}
                        >
                            <p className="fs13">
                                Leverage <span className={styles.leverageValText}>{leverage}x</span>
                            </p>
                            <span>
                                {leverageDropdownOpen ? <RiArrowUpSLine size={22} /> : <RiArrowDownSLine size={22} />}
                            </span>
                        </div>
                        {
                            leverageDropdownOpen &&
                            <div className={styles.leverageDropdownOpen}>
                                <div className={`${styles.controlInputContainer} mt-2`}>
                                    <button
                                        aria-label='minusIcon'
                                        disabled={leverage <= 1}
                                        onClick={() => {
                                            let value = leverage - 1
                                            if (value < 1) return false
                                            setLeverage(value)
                                        }}
                                    >
                                        <FaMinus />
                                    </button>
                                    <input
                                        type="text"
                                        placeholder={leverage}
                                        value={leverage}
                                        onChange={(e) => {
                                            let value = e.target.value
                                            // Whole numbers only — no decimal point allowed (matches
                                            // the slider's step={1} above; leverage must be an integer).
                                            const wholeNumbers = /^[0-9]+$/;
                                            // BUG FIX: an empty input used to be let through as
                                            // leverage="" — letting the user clear leverage entirely
                                            // (and submit an order with it, since nothing else
                                            // clamped it back). Minimum leverage is 1, so clear
                                            // straight to 1 instead of leaving it blank.
                                            if (value === '') {
                                                setLeverage(1)
                                                return;
                                            }
                                            // BUG FIX: `futureTradePair` can briefly be
                                            // undefined/null (e.g. pair data still loading) —
                                            // reading `.max_leverage` off it then threw inside
                                            // this handler, silently swallowing every keystroke
                                            // (setLeverage was never reached), making the input
                                            // appear completely uneditable.
                                            const maxLeverage = futureTradePair?.max_leverage ?? 100;
                                            if (value > maxLeverage || value < 1) return false;
                                            if (!wholeNumbers.test(value)) return false;
                                            setLeverage(value)
                                        }}
                                    />
                                    <button
                                        aria-label='plusIcon'
                                        disabled={leverage >= futureTradePair.max_leverage}
                                        onClick={() => {
                                            let value = leverage + 1
                                            if (value > futureTradePair.max_leverage) return false
                                            setLeverage(value)
                                        }}
                                    >
                                        <FaPlus />
                                    </button>
                                </div>
                                <div className=''>
                                    <CustomRangeSlider
                                        max={isEmpty(futureTradePair?.max_leverage) ? 100 : futureTradePair?.max_leverage}
                                        percentages={[0, 25, 50, 75, 100]}
                                        startingValue={Number(leverage)}
                                        handleButtonClick={handleLeverageButtonClick}
                                        handleSliderChange={handleLeverageSliderChange}
                                        roundLabels
                                        sliderStep={1}
                                    />
                                    <Button
                                        btnText={`Set to ${leverage}x`}
                                        staticClass='fs13'
                                        className='successFillRectangleBtnXs'
                                        onClick={() => { changeLeverage(leverage) }}
                                    />
                                </div>
                            </div>
                        }
                    </div>
                }

                <div className={`${styles.tabContainer} mt-3`}>
                    <button
                        aria-label='limit'
                        className={formData?.orderType === 'limit' ? styles.active : ""}
                        onClick={() => {
                            setFormData({ ...formData, ...{ buyorsell: formData.buyorsell, orderType: 'limit' } })
                            setOrderTypeSelectOpen(false);
                        }}
                    >
                        Limit
                    </button>
                    <button
                        aria-label='market'
                        className={formData?.orderType === 'market' ? styles.active : ""}
                        onClick={() => {
                            setFormData({ ...formData, ...{ buyorsell: formData.buyorsell, orderType: 'market' } })
                            setOrderTypeSelectOpen(false);
                        }}
                    >
                        Market
                    </button>
                    <div className={styles.selectButton} style={{ display: 'flex' }}>
                        <CustomDropdown
                            defaultShow={orderTypeSelectOpen}
                            toggleElement={
                                <div
                                    // BUG FIX: this was a nested <button>, but
                                    // CustomDropdown's <Dropdown.Toggle> (in
                                    // DropDownComponent.jsx) already renders
                                    // as a <button> itself — button-inside
                                    // -button is invalid HTML and is exactly
                                    // what React's "validateDOMNesting"
                                    // warning was flagging. Every other
                                    // CustomDropdown usage across the app
                                    // (MarketSummary.jsx, HeaderMenus.jsx,
                                    // HeaderRight.jsx, TableAndChart.jsx,
                                    // Fees.jsx, options TradeActionCard.jsx)
                                    // already correctly passes a <div> here —
                                    // this was the one outlier. Changing the
                                    // tag doesn't change behavior at all:
                                    // the onClick below still fires exactly
                                    // the same way, and the outer
                                    // Dropdown.Toggle still provides the
                                    // actual toggle/keyboard/focus semantics,
                                    // same as it does for every other
                                    // CustomDropdown in the app.
                                    className={[
                                        styles.selectButton,
                                        formData?.orderType !== 'limit' && formData?.orderType !== 'market' ? styles.active : ""
                                    ].join(' ')}
                                    onClick={() => {
                                        if (formData?.orderType === 'limit' || formData?.orderType === 'market') {
                                            setFormData({ ...formData, ...{ orderType: 'stop_limit' } })
                                        }
                                        setOrderTypeSelectOpen((prev) => !prev);
                                    }}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter' || e.key === ' ') {
                                            e.preventDefault();
                                            if (formData?.orderType === 'limit' || formData?.orderType === 'market') {
                                                setFormData({ ...formData, ...{ orderType: 'stop_limit' } })
                                            }
                                            setOrderTypeSelectOpen((prev) => !prev);
                                        }
                                    }}
                                >
                                    {getOrderTypeLabel(formData?.orderType)}
                                    {formData.orderType === 'makeronly' && <GoQuestion onClick={(e) => handleMarkerOnly(e)} size={16} style={{ marginLeft: 5, color: 'var(--color-green-03)' }} />}
                                </div>
                            }
                            menuItems={
                                <ul className={styles.selectButtonOptions}>
                                    {[
                                        { key: 'makeronly', label: 'Maker Only' },
                                        { key: 'trailingStop', label: 'Trailing Stop' },
                                        { key: 'stop_limit', label: 'Stop Limit' },
                                        { key: 'stop_market', label: 'Stop Market' },
                                        { key: 'take_profit', label: 'Take Profit Market' },
                                        { key: 'take_profit_limit', label: 'Take Profit Limit' },
                                    ].map(({ key, label }) => (
                                        <li
                                            key={key}
                                            className={formData?.orderType === key ? styles.active : ''}
                                            onClick={() => { handleOrderListSelect(key); }}
                                        >
                                            {label}
                                        </li>
                                    ))}
                                </ul>
                            }
                        />
                    </div>
                </div>

                <div className={`${styles.formContainer} mt-3`}>
                    {
                        !['makeronly', 'market', 'stop_market', 'take_profit', 'trailingStop'].includes(formData?.orderType) ?
                            <div className={`${styles.formContainer} mt-2`}>
                                <InputWithCurrencyAndLabel
                                    id={'limitAmount'}
                                    name={'price'}
                                    onChange={onChangeHandler}
                                    placeholder={0}
                                    type={'text'}
                                    value={formData.price}
                                    disabled={false}
                                    key={'limitAmount'}
                                    readOnly={false}
                                    label={'Price'}
                                    currency={formatDisplayPair(futureTradePair?.quoteCurrency)}
                                    error={errors?.price}
                                    className={"InputWithCurrencyAndLabel"}
                                    renderInsideTopRight={(() => {
                                        const isSell = formData?.buyorsell === 'sell';
                                        const bestValue = isSell ? bestPrices.offer : bestPrices.bid;
                                        if (bestValue === null || bestValue === undefined || isNaN(Number(bestValue))) return null;
                                        const decimals = futureTradePair?.quoteDecimal ?? 2;
                                        return (
                                            <div
                                                onClick={handleBestPriceClick}
                                                role="button"
                                                tabIndex={0}
                                                style={{
                                                    display: 'flex',
                                                    justifyContent: 'space-between',
                                                    alignItems: 'center',
                                                    width: '100%',
                                                    cursor: 'pointer',
                                                    fontSize: '12px',
                                                }}
                                            >
                                                {/* <span style={{ color: '#8B5CF6' }}>{isSell ? 'Best Offer' : 'Best Bid'}</span> */}
                                                {/* <span style={{ color: 'var(--color-text-03)' }}>
                                                    {Number(bestValue).toFixed(decimals)} {futureTradePair?.quoteCurrency}
                                                </span> */}
                                            </div>
                                        );
                                    })()}
                                />
                            </div>
                            :
                            <></>
                    }

                    <div className={`${styles.formContainer} mt-2`}>
                        <InputWithSelectOption
                            labelText={"Quantity"}
                            id={'limitQuantity'}
                            name={'quantity'}
                            onChange={onChangeHandler}
                            placeholder={'0'}
                            type={'text'}
                            value={lotQuantity}
                            disabled={false}
                            key={'limitQuantity'}
                            readOnly={false}
                            label={`1 Lot = ${futureTradePair.minAmount} ${futureTradePair.baseCurrency}`}
                            currency={futureTradePair?.baseCurrency}
                            error={errors?.quantity}
                            className={"InputWithCurrencyAndLabel"}
                            selectOption={[
                                { label: futureTradePair?.baseCurrency, value: futureTradePair?.baseCurrency },
                                { label: "Lot", value: "lot" },
                                { label: formatDisplayPair(futureTradePair?.quoteCurrency), value: futureTradePair?.quoteCurrency },
                            ]}
                            selectedValue={quantityIn}
                            onSelect={(value) => { setQuantityIn(value) }}
                            onFocus={(value) => { setIsEdit(value) }}
                        />
                    </div>

                    {
                        formData?.orderType == "makeronly" ?
                            <div className={`${styles.formContainer} mt-2`}>
                                <InputWithCurrencyAndLabel
                                    id={'limitAmount'}
                                    name={'price'}
                                    onChange={onChangeHandler}
                                    placeholder={0}
                                    type={'text'}
                                    value={formData.price}
                                    disabled={false}
                                    key={'limitAmount'}
                                    readOnly={false}
                                    label={'Price'}
                                    currency={formatDisplayPair(futureTradePair?.quoteCurrency)}
                                    error={errors?.price}
                                    className={"InputWithCurrencyAndLabel"} staticClass='p-2' />
                            </div>
                            : formData?.orderType !== 'limit' && formData?.orderType !== "market" ?
                                <div className={`${styles.formContainer} mt-2`}>
                                    <InputWithSelectAndLabel
                                        id={'limitAmount'}
                                        name={'stopPrice'}
                                        placeholder={0}
                                        type={'text'}
                                        value={formData.stopPrice}
                                        disabled={false}
                                        key={'limitAmount'}
                                        readOnly={false}
                                        label={formData?.orderType == 'trailingStop' ? 'Trail Amount' : 'Stop Price'}
                                        selectedValue={formData?.trailType}
                                        currency={formatDisplayPair(futureTradePair?.quoteCurrency)}
                                        className={"InputWithCurrencyAndLabel"}
                                        onChange={onChangeHandler}
                                        onSelect={onSelectHandler}
                                        error={formData?.orderType == 'trailingStop' ? errors?.trailPrice : errors?.stopPrice}
                                    />
                                </div>
                                :
                                <></>
                    }
                </div>

                {userdetails.marginMode != 'portfolio' ?
                    <div className={`${styles.percentageContainer} mt-2`}>
                        {quantityPercentage.map((percent) => (
                            <Button
                                key={percent}
                                isLoading={false}
                                loadingText="Redirecting..."
                                btnText={`${percent}%`}
                                onClick={() => { handleBalanceprecn(percent); setBalPrecen(percent) }}
                                className="darkOutlineButton"
                                selectedValue={percent}
                                isActive={percent == balPrecen}
                            />
                        ))}
                    </div>
                    : ""}

                {
                    ['limit', 'market', 'makeronly'].includes(formData?.orderType) &&
                    <div className='mt-2'>
                        {
                            isEmpty(formData?.takeProfit?.stopPrice) ?
                                <div className='flexBetween'>
                                    <p className={styles.labelWhite}>
                                        <TooltipComponent text={"Bracket order: Take profit/ stop loss order pair, enables a trader to set take profit and stop loss levels with their orders. Please note that a bracket order will always close the entire position."} triggerType='click'>
                                            Bracket Order
                                        </TooltipComponent>
                                    </p>
                                    <Button
                                        isLoading={false}
                                        loadingText=""
                                        btnText="Add"
                                        onClick={handleShowBracketOrder}
                                        className="cardSuccessBtnXxs"
                                        selectedValue={null}
                                        reactIconElement={<FaPlus />}
                                        staticClass='rounded-1 gap-1'
                                    />
                                </div>
                                :
                                <div className={`${styles.editBracketPart}`}>
                                    <div className={styles.headerPart}>
                                        <h3>Bracket Order</h3>
                                        <div className=''>
                                            <button onClick={handleShowBracketOrder}>
                                                <MdModeEdit />
                                            </button>
                                            <button
                                                onClick={() => { removeBracketOrders() }}
                                            >
                                                <MdDelete />
                                            </button>
                                        </div>
                                    </div>
                                    <div className={styles.bracketBodyPart}>
                                        <ul>
                                            <li>
                                                <h3>TP(USD) :</h3>
                                                <p>{formData?.takeProfit?.stopPrice} / {formData?.takeProfit?.orderType === 'bracket_tp_market' ? " -" : formData?.takeProfit?.price}</p>
                                            </li>
                                            <li>
                                                <h3>SL(USD) :</h3>
                                                <p>{formData?.stopLoss?.stopPrice} / {formData?.stopLoss?.orderType === 'bracket_sl_market' ? " -" : formData?.stopLoss?.price}</p>
                                            </li>
                                        </ul>
                                    </div>
                                </div>
                        }
                    </div>
                }

                {
                    userdetails.marginMode == 'portfolio' &&
                    <div className={`${styles.leverageFormContainer} mt-3`}>
                        <div className={`${styles.leverageDropdownOpen} py-2`}>
                            <div className='w-100 d-flex gap-2 justify-content-between'>
                                <h3 className='fs13'>Effective Leverage</h3>
                                <span className='fs12'>{leverage}x</span>
                            </div>
                            <div className=''>
                                <CustomRangeSlider
                                    max={200}
                                    percentages={[0, 25, 50, 75, 100]}
                                    startingValue={Number(leverage)}
                                    disabled={true}
                                    disabledPointer={true}
                                    roundLabels
                                    sliderStep={1}
                                />
                            </div>
                        </div>
                    </div>
                }

                <div className={`${styles.actionContainer} mt-2`}>
                    <Button
                        isLoading={false}
                        loadingText="Loading..."
                        btnText={isAuthStatus ? formData.buyorsell === 'buy' ? "Buy" : "Sell" : "Login"}
                        onClick={() => {
                            if (isAuthStatus) {
                                if (userdetails?.kycStatus !== 'approved' && config.ENV != 'demo') {
                                    showToastMessage("Please complete your KYC", 'error')
                                    return
                                }
                                setOrderPlaceModel(true)
                            } else {
                                navigate("/login")
                            }
                        }}
                        className={formData.buyorsell === 'buy' ? "successFillRectangleBtnXs" : "dangerFillRectangleBtnXs"}
                        selectedValue={null}
                        isActive={null}
                    />
                </div>

                <div className="custom-checkInput__container mt-2">
                    <label className="custom-checkInput__label">
                        <input
                            type="checkbox"
                            checked={formData?.reduce_only}
                            onChange={(e) => { setFormData({ ...formData, ...{ reduce_only: e.target.checked } }) }}
                        />
                        <span className="custom-checkInput__checkmark"></span>
                    </label>
                    <TooltipComponent text={"A reduce-only order can only reduce your position and never increase it. You can use reduce-only flag to create take-profit and stop-loss orders."} triggerType='click'>
                        <p className="custom-checkInput__content">
                            Reduce Only
                        </p>
                    </TooltipComponent>
                    {formData?.orderType == "limit" && <>
                        <label className="custom-checkInput__label">
                            <input
                                type="checkbox"
                                checked={formData?.makeronly}
                                onChange={(e) => { setFormData({ ...formData, ...{ makeronly: e.target.checked } }) }}
                            />
                            <span className="custom-checkInput__checkmark"></span>
                        </label>
                        <p className="custom-checkInput__content">
                            Maker Only
                        </p>
                    </>}
                </div>

                <div className={`${styles.labelHeader} mt-2`}>
                    <p className={styles.label}>Available</p>
                    <p className={styles.labelHighlight}>
                        {wallet?.availableBalance?.toFixed(futureTradePair?.quoteDecimal)} <span>{formatDisplayPair(futureTradePair?.quoteCurrency)}</span>
                    </p>
                </div>

                <div className={`${styles.detailsContainer} mt-3`}>
                    {/* <div className={styles.detailsList}>
                        <p className={styles.label}>Fees</p>
                        <p className={styles.value}>{formatValue(cardDetails?.fees ?? 0, futureTradePair.quoteDecimal)} {formatDisplayPair(futureTradePair?.quoteCurrency)}</p>
                    </div>
                    <div className={`${styles.detailsList} mt-2`}>
                        <p className={styles.label}>Order Cost</p>
                        <p className={styles.value}>{formatValue(cardDetails?.orderCost ?? 0, futureTradePair.quoteDecimal)} {formatDisplayPair(futureTradePair?.quoteCurrency)}</p>
                    </div> */}
                    <div className={`${styles.detailsList} mt-2`}>
                        <p className={styles.label}>Total</p>
                        <p className={styles.value}>{formatValue(cardDetails?.orderValue ?? 0, futureTradePair.quoteDecimal)} {formatDisplayPair(futureTradePair?.quoteCurrency)}</p>
                    </div>
                    <div className={`${styles.detailsList} mt-2`}>
                        <p className={styles.label}>Margin required</p>
                        <p className={styles.value}>{formatValue(cardDetails?.margin ?? 0, futureTradePair.quoteDecimal)} {formatDisplayPair(futureTradePair?.quoteCurrency)}</p>
                    </div>
                </div>

                <div className='d-flex gap-2 justify-content-end mt-2'>
                    <TooltipComponent triggerType='click' text={
                        <div className={styles.feesTooltipPart}>
                            <ul>
                                <li className='d-flex justify-content-start gap-2'>
                                    <div><BiSolidDollarCircle size={20} /></div>
                                    <div>
                                        <h3 className='fs15 text-start mb-1'>Your fees for the selected contract</h3>
                                        <div className='d-flex gap-2'>
                                            {/* <p className='fs12 text-start'>Marker:{futureTradePair.makerFee}%</p>
                                            <p className='fs12 text-start'>Taker:{futureTradePair.takerFee}%</p> */}

                                            <p className='fs12 text-start'>Marker:{makerFee}%</p>
                                            <p className='fs12 text-start'>Taker:{takerFee}%</p>
                                        </div>
                                    </div>
                                </li>
                            </ul>
                        </div>
                    }>
                        <button className={`${styles.calculatorBtn} d-flex gap-2 align-items-center`}>
                            <FaPercent />
                            <span>Fees</span>
                        </button>
                    </TooltipComponent>
                    {
                        userdetails.marginMode == 'isolated' ?
                            <button className={`${styles.calculatorBtn} d-flex gap-2 align-items-center`} onClick={() => setCalculatorModalOpen(true)}>
                                <FaCalculator />
                                <span>Calculator</span>
                            </button>
                            : ""
                    }
                </div>
            </div>
        </div>
    )
}

export default TradeActionCard