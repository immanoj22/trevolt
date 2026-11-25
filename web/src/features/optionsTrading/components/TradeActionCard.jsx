

/** PACKAGE IMPORT */

import React, { useState, useEffect } from 'react'
import { FaPlus, FaMinus, FaCalculator, FaPercent, FaRegCreditCard } from "react-icons/fa6";
import { IoIosArrowDown, IoIosArrowUp } from "react-icons/io";
import { useSelector } from "react-redux";
import { useParams, useNavigate } from "react-router-dom";
import isEmpty from "is-empty"

/** LOCAL FILES IMPORT */

import styles from "../../futuresTrading/styles/tradeActionCard.module.css"
import { InputWithCurrencyAndLabel, InputWithSelectAndLabel, InputWithSelectOption } from '../../../components/Input/InputFields';
import Button from '../../../components/Button/Button';

/** REDUX */
import { futureChangeLeverage } from '../../../actions/futureActions';
import { optionChangeLeverage, optionOrderPlacing } from '../../../actions/OptionTradeAction';
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
import { calculateLeverageValue } from '../../../lib/tradeSafety';

/** CODE START */
const quantityPercentage = [25, 50, 75, 100]
const TradeActionCard = ({ handleShowBracketOrder, formData, setFormData, initialState }) => {
    const { tikerRoot } = useParams()
    const navigate = useNavigate();

    const userData = useSelector((state) => state.user);
    const { userdetails, isAuthStatus, wallet } = userData;
    const { optionTicker, optionTradePair, underlyingData, takerFee, makerFee, premiumCap } = useSelector((state) => state.option);


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
    const [cardDetails, setCardDetails] = useState({
        orderCost: 0,
        orderValue: 0,
        margin: 0,
        fees: 0,
    })

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

    const feeCalculation = (quantity, price) => {
        try {
            const notional = quantity * underlyingData.marketPrice;
            const premium = price * quantity
            let tradingFee = Math.min(
                (premiumCap / 100) * premium,
                (takerFee / 100) * notional
            );
            tradingFee = tradingFee * 2
            tradingFee = tradingFee * 1.18
            return tradingFee
        } catch (err) {
            console.log(err, "feeCalculation____err")
            return 0
        }
    }

    const calculateOrderValue = (quantity, price) => {

        let orderValueRaw = 0
        let orderCostRaw = 0
        if (formData.buyorsell == 'buy') {
            orderValueRaw = quantity * price;
            orderCostRaw = (quantity * price)
        } else {
            orderValueRaw = quantity * underlyingData.marketPrice;
            orderCostRaw = (quantity * price) / (leverage ? leverage : 1);
        }
        const orderValue = isNaN(orderValueRaw)
            ? 0
            : parseFloat(orderValueRaw).toFixed(optionTradePair.quoteDecimal);

        // const orderCostRaw = (quantity * price) / (leverage ? leverage : 1);
        const orderCost = isNaN(orderCostRaw) ? 0 : orderCostRaw.toFixed(optionTradePair.quoteDecimal);

        /** Calculate Fee */
        // let fees = (orderValueRaw * takerFee / 100) * 2
        let fees = feeCalculation(quantity, price)
        let margin = parseFloat(orderCostRaw) + parseFloat(fees)
        fees = isNaN(fees)
            ? 0 : parseFloat(fees).toFixed(optionTradePair.quoteDecimal)
        margin = isNaN(margin)
            ? 0 : parseFloat(margin).toFixed(optionTradePair.quoteDecimal)

        // const updatedForm = {
        //     ...formData,
        //     quantity,
        //     // orderValue,
        //     // orderCost,
        //     // fees,
        //     // margin
        // };
        const updatedForm = { orderValue, orderCost, fees, margin };
        setCardDetails(updatedForm);
        setFormData({
            ...formData,
            quantity,
        });
    };

    const handleBalanceprecn = (percentage) => {
        try {

            const price = formData.buyorsell == 'sell' ?
                underlyingData?.marketPrice :
                formData.orderType === "market" || formData.orderType === "stop"
                    ? optionTradePair.marketPrice
                    : parseFloat(formData.price);

            if (!price || !isFinite(price)) {
                return;
            }

            // Calculate balance to invest
            let investBalance = (wallet?.availableBalance * (Number(percentage) / 100)) || 0;
            investBalance = parseFloat(investBalance.toFixed(optionTradePair.quoteDecimal));

            // Adjust for fees when 100%
            if (percentage === 100) {
                const feePercent = parseFloat(makerFee) + parseFloat(takerFee);
                let orderValue = 0
                if (formData.buyorsell == 'buy') {
                    orderValue = investBalance;
                } else if (formData.buyorsell == 'sell') {
                    orderValue = investBalance * leverage;
                }

                let fee = Math.min(
                    (premiumCap / 100) * orderValue,
                    (takerFee / 100) * orderValue
                );
                // const orderValue = investBalance * leverage;
                // let fee = orderValue * (feePercent / 100);

                if (!isFinite(fee)) fee = 0;
                fee = fee * 1.18
                investBalance -= fee;
            }

            let quantity = 0

            if (formData.buyorsell == 'buy') {
                quantity = (investBalance / price)
            } else if (formData.buyorsell == 'sell') {
                quantity = (investBalance / price) * leverage || 0;
            }
            // let quantity = (investBalance / price) * leverage || 0;

            quantity = parseFloat(quantity.toFixed(optionTradePair.baseDecimal));
            let lotQuantity = quantity
            if (quantityIn == 'lot') {
                lotQuantity = quantityToLot(lotQuantity, optionTradePair.minAmount, optionTradePair.baseDecimal)
            } else if (quantityIn == optionTradePair.quoteCurrency) {
                lotQuantity = QuantityToVolume(lotQuantity, price, optionTradePair.baseDecimal)
            }
            setlotQuantity(lotQuantity)
            calculateOrderValue(quantity, price);
            setBalPrecen(percentage);
        } catch (err) {
        }
    };


    const onChangeHandler = (name, value) => {
        try {
            const numbers = /^[+]?([0-9]+(?:\.[0-9]*)?|\.[0-9]+)$/;
            // validate numeric fields
            if (['price', 'quantity', 'stopPrice', 'orderType'].includes(name)) {
                if (value !== "" && !numbers.test(value)) return false;
            }

            // handle price
            if (name === 'price') {
                const price = ['market', 'stop_market', 'take_profit'].includes(formData.orderType)
                    ? optionTradePair.marketPrice
                    : parseFloat(value);
                calculateOrderValue(formData.quantity, price);
            }

            // handle quantity
            if (name === 'quantity') {
                const price = ['market', 'trailingStop'].includes(formData.orderType)
                    ? optionTradePair.marketPrice : ['stop_market', 'take_profit'].includes(formData.orderType) ?
                        formData.stopPrice
                        : parseFloat(formData.price);
                setBalPrecen('0');
                let quantity = value
                if (quantityIn == 'lot') {
                    const decimal = /^[+]?[0-9]+$/
                    if (value !== "" && !decimal.test(value)) return false;
                    let maxLot = quantityToLot(optionTradePair.maxAmount, optionTradePair.minAmount, optionTradePair.baseDecimal)
                    let minLot = quantityToLot(optionTradePair.minAmount, optionTradePair.minAmount, optionTradePair.baseDecimal)
                    if (parseFloat(value) < parseFloat(minLot) || parseFloat(value) > parseFloat(maxLot)) {
                        return false
                    }
                    quantity = LotToquantity(value, optionTradePair.minAmount, optionTradePair.baseDecimal)
                } else if (quantityIn == optionTradePair.quoteCurrency) {
                    quantity = VolumeToquantity(value, price, optionTradePair.baseDecimal)
                }
                setlotQuantity(value)
                calculateOrderValue(quantity, price);
                setErrors(prev => ({ ...prev, [name]: '' }));
                return;
            }

            // handle trailing stop -> stopPrice maps to trailPrice
            if (name === 'stopPrice' && formData.orderType === 'trailingStop') {
                setFormData(prev => ({ ...prev, trailPrice: value }));
            }

            // default update
            setFormData(prev => ({ ...prev, [name]: value }));
            setErrors(prev => ({ ...prev, [name]: '' }));
        } catch (e) {
        }
    };

    const onSelectHandler = (value) => {
        try {
            setFormData({ ...formData, ...{ trailType: value, trailTypePrice: optionTradePair.marketPrice } })
            setErrors({ ...errors, ...{ trailType: '' } })
        } catch (e) {
            console.log("onSelectHandler_err", e);
        }
    }

    const setInitalData = () => {
        try {
            setFormData({
                ...formData, ...{
                    price: optionTradePair.marketPrice,
                    pairId: optionTradePair._id,
                    trailTypePrice: optionTradePair.marketPrice
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
                takeProfit: {
                    stopPrice: "",
                    price: "",
                    orderType: "bracket_tp_market"
                },
                stopLoss: {
                    stopPrice: "",
                    price: "",
                    orderType: "bracket_sl_market"
                }
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
            const data = await optionOrderPlacing(formData, userdetails?.secretKey);
            setIsLoading(false)
            if (data.status) {
                setOrderPlaceModel(false)
                showToastMessage(data.message, 'success');
                setlotQuantity('0')
                setBalPrecen('0')
                setFormData({
                    ...initialState, ...{
                        buyorsell: formData.buyorsell,
                        orderType: formData.orderType === 'limit' ? formData.orderType : formData.makeronly ? 'makeronly' : formData.isTrailingOrder ? 'trailingStop' : formData.orderType,
                        pairId: formData.pairId,
                        price: formData.price,
                        takeProfit: {
                            stopPrice: "",
                            price: "",
                            orderType: "bracket_tp_market"
                        },
                        stopLoss: {
                            stopPrice: "",
                            price: "",
                            orderType: "bracket_sl_market"
                        }
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
            setFormData({ ...formData, ...{ leverage: value } })
            const payload = { leverage: value, pairId: optionTradePair._id }
            const data = await futureChangeLeverage(payload, userdetails?.secretKey);
            showToastMessage(data.message, data.status ? 'success' : 'error');
            // setFormData({ ...formData, ...{ leverage: value } })
            setLeverageDropdownOpen(!leverageDropdownOpen)
        } catch (e) {
            console.log("orderPlacing_err", e);
        }
    }

    const handleLeverageButtonClick = (percent) => {
        const calculatedValue = calculateLeverageValue(percent, optionTradePair?.max_leverage ?? 100, 1);
        // The slider's tick-mark labels are rounded for display (roundLabels
        // prop below) — round the value a click actually sets to match,
        // otherwise clicking a mark labeled e.g. "3x" would silently set the
        // unrounded 2.5x instead.
        setLeverage(Math.round(calculatedValue))
    };

    const handleLeverageSliderChange = (e) => {

        const rawValue = Number(e.target.value);

        // const maxLeverage = isEmpty(optionTradePair?.max_leverage) ? 100 : optionTradePair?.max_leverage;
        // const progress = (rawValue / maxLeverage) * 100;
        // Whole numbers only — the slider is stepped by 1 (sliderStep prop
        // below), Math.round is belt-and-suspenders against any fractional
        // value still slipping through.
        const clampedValue = Math.max(Math.round(rawValue), 1);
        setLeverage(clampedValue) //clampedValue
    };

    useEffect(() => {
        setInitalData()
    }, [formData.orderType, tikerRoot])

    useEffect(() => {
        if (userData?.leverage && formData.buyorsell == 'sell') {
            // Whole numbers only — a leverage value saved before this
            // restriction existed could still be a decimal (e.g. 2.5x).
            const roundedLeverage = Math.round(userData?.leverage) || 1;
            setFormData({ ...formData, ...{ leverage: roundedLeverage } })
            setLeverage(roundedLeverage)
        }
    }, [userData?.leverage])


    useEffect(() => {
        if (!isEmpty(formData.quantity)) {
            let lotQuantity = formData.quantity
            const price = ['market', 'trailingStop'].includes(formData.orderType)
                ? optionTradePair.marketPrice :
                ['stop_market', 'take_profit'].includes(formData.orderType) ?
                    formData.stopPrice
                    : parseFloat(formData.price);
            if (quantityIn == 'lot') {
                lotQuantity = quantityToLot(lotQuantity, optionTradePair.minAmount, optionTradePair.baseDecimal)
            } else if (quantityIn == optionTradePair.quoteCurrency) {
                lotQuantity = QuantityToVolume(lotQuantity, price, optionTradePair.quoteDecimal)
            }
            setlotQuantity(lotQuantity)
        }
    }, [quantityIn])

    useEffect(() => {
        if (['market', 'trailingStop'].includes(formData.orderType) && !isEdit) {
            let lotQuantity = formData.quantity
            if (quantityIn == optionTradePair.quoteCurrency) {
                lotQuantity = QuantityToVolume(lotQuantity, optionTicker.marketPrice, optionTradePair.quoteDecimal)
                setlotQuantity(lotQuantity)
            }
        }
    }, [optionTicker])
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
            <div className={`${styles.body} `}>
                {
                    isAuthStatus && formData.buyorsell == 'sell' ?
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
                                    {
                                        leverageDropdownOpen ?
                                            <RiArrowUpSLine size={22} />
                                            :
                                            <RiArrowDownSLine size={22} />
                                    }
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
                                                if (value < 1) {
                                                    return false
                                                }
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
                                                // the slider's step={1} below; leverage must be an integer).
                                                const wholeNumbers = /^[0-9]+$/;
                                                // BUG FIX: an empty input used to be let through as
                                                // leverage="" — letting the user clear leverage
                                                // entirely. Minimum leverage is 1, so clear straight
                                                // to 1 instead of leaving it blank.
                                                if (value === '') {
                                                    setLeverage(1)
                                                    return;
                                                }
                                                // BUG FIX: `optionTradePair` can briefly be
                                                // undefined/null (e.g. pair data still loading) —
                                                // reading `.max_leverage` off it then threw inside
                                                // this handler, silently swallowing every keystroke,
                                                // making the input appear completely uneditable.
                                                const maxLeverage = optionTradePair?.max_leverage ?? 100;
                                                if (value > maxLeverage || value < 1) {
                                                    return false
                                                }
                                                if (!wholeNumbers.test(value)) return false;
                                                setLeverage(value)
                                            }}
                                        />
                                        <button
                                            aria-label='plusIcon'
                                            disabled={leverage >= optionTradePair.max_leverage}
                                            onClick={() => {
                                                let value = leverage + 1
                                                if (value > optionTradePair.max_leverage) {
                                                    return false
                                                }
                                                setLeverage(value)
                                            }}
                                        >
                                            <FaPlus />
                                        </button>
                                    </div>
                                    <div className=''>
                                        <CustomRangeSlider
                                            max={isEmpty(optionTradePair?.max_leverage) ? 100 : optionTradePair?.max_leverage}
                                            // max={20}
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
                                            onClick={() => {
                                                changeLeverage(leverage)
                                            }}
                                        />
                                    </div>
                                </div>
                            }

                        </div> : <></>
                }





                <div className={`${styles.tabContainer} mt-3`}>
                    <button
                        aria-label='limit'
                        className={formData?.orderType === 'limit' ? styles.active : ""}
                        onClick={() => {
                            setFormData({ ...initialState, ...{ buyorsell: formData.buyorsell, orderType: 'limit' } })
                            setOrderTypeSelectOpen(false);
                        }}
                    >
                        Limit
                    </button>

                    <button
                        aria-label='market'
                        className={formData?.orderType === 'market' ? styles.active : ""}
                        onClick={() => {
                            setFormData({ ...initialState, ...{ buyorsell: formData.buyorsell, orderType: 'market' } })
                            setOrderTypeSelectOpen(false);
                        }}
                    >
                        Market
                    </button>

                    <div className={styles.selectButton}>
                        <CustomDropdown
                            defaultShow={orderTypeSelectOpen}
                            toggleElement={<div
                                className={
                                    [
                                        styles.selectButton,
                                        formData?.orderType !== 'limit' && formData?.orderType !== 'market' ? styles.active : ""
                                    ].join(' ')
                                }
                                onClick={() => {
                                    if (formData?.orderType === 'limit' || formData?.orderType === 'market') {
                                        setFormData({ ...formData, ...{ orderType: 'stop_limit' } })
                                        // setOrderTypes('makerOnly');
                                    }
                                    setOrderTypeSelectOpen((prev) => !prev);
                                }}
                            >
                                {getOrderTypeLabel(formData?.orderType)}
                            </div>}
                            menuItems={
                                <ul className={styles.selectButtonOptions}>
                                    {[
                                        { key: 'stop_limit', label: 'Stop Limit' },
                                        { key: 'take_profit_limit', label: 'Take Profit Limit' },
                                    ].map(({ key, label }) => (
                                        <li
                                            key={key}
                                            className={formData?.orderType === key ? styles.active : ''}
                                            onClick={() => {
                                                handleOrderListSelect(key);
                                            }}
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
                            <>
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
                                        currency={formatDisplayPair(optionTradePair?.quoteCurrency)}
                                        error={errors?.price}
                                        className={"InputWithCurrencyAndLabel"}
                                    />
                                </div>
                            </>
                            :
                            <></>
                    }

                    <div className={`${styles.formContainer} mt-2`}>
                        {/* <InputWithCurrencyAndLabel
                            id={'limitQuantity'}
                            name={'quantity'}
                            onChange={onChangeHandler}
                            placeholder={'0'}
                            type={'text'}
                            value={formData.quantity}
                            disabled={false}
                            key={'limitQuantity'}
                            readOnly={false}
                            label={"Quantity"}
                            currency={optionTradePair?.baseCurrency}
                            error={errors?.quantity}
                            className={"InputWithCurrencyAndLabel"} /> */}
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
                            label={`1 Lot = ${optionTradePair?.minAmount} ${optionTradePair?.baseCurrency}`}
                            currency={optionTradePair?.baseCurrency}
                            error={errors?.quantity}
                            className={"InputWithCurrencyAndLabel"}
                            selectOption={[
                                {
                                    label: optionTradePair?.baseCurrency, value: optionTradePair?.baseCurrency
                                },
                                {
                                    label: "Lot", value: "lot"
                                },
                                {
                                    label: formatDisplayPair(optionTradePair?.quoteCurrency), value: optionTradePair?.quoteCurrency
                                },
                            ]}
                            selectedValue={quantityIn}
                            onSelect={(value) => {
                                setQuantityIn(value)
                            }}
                            onFocus={(value) => {
                                setIsEdit(value)
                            }}
                        />
                    </div>

                    {
                        formData?.orderType == "makeronly" ?
                            <>
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
                                        currency={formatDisplayPair(optionTradePair?.quoteCurrency)}
                                        error={errors?.price}
                                        className={"InputWithCurrencyAndLabel"} staticClass='p-2' />
                                </div>
                            </>
                            : formData?.orderType !== 'limit' && formData?.orderType !== "market" ?
                                <>
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
                                            currency={formatDisplayPair(optionTradePair?.quoteCurrency)}
                                            className={"InputWithCurrencyAndLabel"}
                                            onChange={onChangeHandler}
                                            onSelect={onSelectHandler}
                                            error={errors?.stopPrice}
                                        />
                                    </div>
                                </>
                                :
                                <></>
                    }
                </div>
                <div className={`${styles.percentageContainer} mt-2`}>
                    {quantityPercentage.map((percent) => (
                        <Button
                            key={`quantity-percent-${percent}`}
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

                {
                    ['limit', 'market', 'makeronly'].includes(formData?.orderType) &&
                    <div className='mt-2'>
                        {
                            isEmpty(formData?.takeProfit?.stopPrice) ?

                                <div className='flexBetween'>
                                    <p className={styles.labelWhite}>
                                        <TooltipComponent text={"Bracket order: a take profit/stop loss order pair that enables a trader to set take profit and stop loss levels with their orders. Please note that a bracket order will always close the entire position."} triggerType='click'>
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
                                                onClick={() => {
                                                    removeBracketOrders()
                                                }}
                                            >
                                                <MdDelete />
                                            </button>
                                        </div>
                                    </div>
                                    <div className={styles.bracketBodyPart}>
                                        <ul>
                                            <li>
                                                <h3>TP(USD) :</h3>
                                                <p> {formData?.takeProfit?.stopPrice} / {formData?.takeProfit?.orderType === 'bracket_tp_market' ? " -" : formData?.takeProfit?.price}</p>
                                            </li>
                                            <li>
                                                <h3>SL(USD) :</h3>
                                                <p> {formData?.stopLoss?.stopPrice} / {formData?.stopLoss?.orderType === 'bracket_sl_market' ? " -" : formData?.stopLoss?.price}</p>
                                            </li>
                                        </ul>
                                    </div>
                                </div>
                        }
                    </div>


                }

                <div className={`${styles.actionContainer} mt-2`}>
                    <Button
                        isLoading={false}
                        loadingText="Loading..."
                        btnText={isAuthStatus ? formData.buyorsell === 'buy' ? "Buy" : "Sell" : "Login"}
                        onClick={() => {
                            if (isAuthStatus) {
                                if (userdetails?.kycStatus !== 'approved') {
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

                    <TooltipComponent text={"A reduce-only order can only reduce your position and never increase it. You can use the reduce-only flag to create take-profit and stop-loss orders."} triggerType='click'>
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
                    </>
                    }
                </div>

                <div className={`${styles.labelHeader} mt-2`}>
                    <p className={styles.label}>
                        Available
                    </p>
                    <p className={styles.labelHighlight}>
                        {wallet?.availableBalance?.toFixed(optionTradePair?.quoteDecimal)} <span>{formatDisplayPair(optionTradePair?.quoteCurrency)}</span>
                    </p>
                </div>
                <div className={`${styles.detailsContainer} mt-3`}>
                    <div className={styles.detailsList}>
                        <p className={styles.label}>Fees</p>
                        <p className={styles.value}>{cardDetails.fees} {formatDisplayPair(optionTradePair?.quoteCurrency)}</p>
                    </div>
                    <div className={`${styles.detailsList} mt-2`}>
                        <p className={styles.label}>Order Cost</p>
                        <p className={styles.value}>{cardDetails.orderCost} {formatDisplayPair(optionTradePair?.quoteCurrency)}</p>
                    </div>
                    <div className={`${styles.detailsList} mt-2`}>
                        <p className={styles.label}>Total</p>
                        <p className={styles.value}>{cardDetails.orderValue} {formatDisplayPair(optionTradePair?.quoteCurrency)}</p>
                    </div>
                    <div className={`${styles.detailsList} mt-2`}>
                        <p className={styles.label}>Margin required</p>
                        <p className={styles.value}>{cardDetails.margin} {formatDisplayPair(optionTradePair?.quoteCurrency)}</p>
                    </div>
                </div>
                <div className='d-flex gap-2 justify-content-end mt-2'>
                    <TooltipComponent triggerType='click' text={
                        <div className={styles.feesTooltipPart}>
                            <ul>
                                <li className='d-flex justify-content-start gap-2' >
                                    <div>
                                        <BiSolidDollarCircle size={20} />
                                    </div>
                                    <div>
                                        <h3 className='fs15 text-start mb-1'>Your fees for the selected contract</h3>
                                        <div className='d-flex gap-2'>
                                            <p className='fs12 text-start'>Marker:{makerFee}%</p>
                                            <p className='fs12 text-start'>Taker:{takerFee}%</p>
                                        </div>
                                        <p className='fs12 text-start'>Trading fee will be capped at {premiumCap}% of premium</p>
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
                    {/* {
                        userdetails.marginMode == 'isolated' ?
                            <button className={`${styles.calculatorBtn} d-flex gap-2 align-items-center`} onClick={() => setCalculatorModalOpen(true)}>
                                <FaCalculator />
                                <span>Calculator</span>
                            </button> :
                            ""
                    } */}
                </div>
            </div>
        </div >
    )
}

export default TradeActionCard
