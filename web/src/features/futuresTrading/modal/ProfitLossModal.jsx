import { Modal } from "react-bootstrap";
import { IoClose } from "react-icons/io5";
import styles from "../styles/modal.module.css";
import Select from "react-select";
import { InputWithCurrencyAndLabel } from "../../../components/Input/InputFields";
import { useState, useEffect } from "react";
import Button from "../../../components/Button/Button";
import { useDispatch, useSelector } from "react-redux";
import { isEmpty } from "../../../lib/isEmpty"

/** ACTIONS */
import { futureUpdateBracketOrders } from "../../../actions/futureActions";
import { showToastMessage } from "../../../lib/toast";
import { formatDisplayPair } from "../../../lib/pairDisplay";

const initialState = {
    pairId: "",
    positionSide: 0,
    entryPrice: 0,
    positionFilled: 0,
    exitPandL: 0,
    stopPandL: 0,
    takeProfit: {
        type: "takeprofit",
        stopPrice: 0,
        orderType: "bracket_tp_market",
        price: 0
    },
    stopLoss: {
        type: "stoploss",
        stopPrice: 0,
        orderType: "bracket_sl_market",
        price: 0
    }
}

const ProfitLossModal = ({ show, handleClose, orderData, tabType }) => {
    // console.log("ProfitLossModal_props", orderData, tabType);

    const [tabOne, setTabOne] = useState("Market");
    const [tabTwo, setTabTwo] = useState("Market");

    const { futurePairData } = useSelector((state) => state.future);
    const { userdetails } = useSelector((state) => state.user);

    const [barketOrders, setBraketOrders] = useState(initialState)
    const [exitPandL, setExitPandL] = useState(0)
    const [stopPandL, setStopPandL] = useState(0)
    const [errors, setErrors] = useState({})
    const [gainPrecn, setGainPercen] = useState('0')
    const [lossPrecn, setLossPercen] = useState('0')
    const [futureTradePair, setfutureTradePair] = useState({})

    const changeBraketOrder = async () => {
        try {
            const payload = {
                bracketOrders: [barketOrders.takeProfit, barketOrders.stopLoss],
                pairId: barketOrders.pairId,
                entryPrice: barketOrders.entryPrice,
                positionSide: barketOrders.positionSide,
                positionFilled: barketOrders.positionFilled,
            }
            const { status, message, error } = await futureUpdateBracketOrders(payload, userdetails.secretKey);

            if (status) {
                showToastMessage(message, status ? 'success' : 'error')
                setExitPandL(0);
                setStopPandL(0);
                handleClose()
                return
            }
            !isEmpty(message) && showToastMessage(message, 'error')
            setErrors(error)

        } catch (e) {
            console.log("changeBraketOrder_err", e);
        }
    }

    const onChangeHandler = (field, name, value) => {
        const numberRegex = /^[+]?([0-9]+(?:[\.][0-9]*)?|\.[0-9]+)$/;
        if (['stopPrice', 'price'].includes(name) && !numberRegex.test(value) && value !== '') {
            return false;
        }
        // BUG FIX: this field had no upper bound at all — a Limit Price
        // like 10000000000000000000000000 was accepted, producing a
        // meaningless scientific-notation PNL. Cap the integer digit count
        // to 10 (up to 9,999,999,999), comfortably above any realistic
        // asset price while rejecting obviously-garbage input.
        if (['stopPrice', 'price'].includes(name)) {
            const integerDigits = value.split('.')[0].replace(/[^0-9]/g, '').length;
            if (integerDigits > 10) return false;
        }
        let barket = { ...barketOrders }
        barket[field][name] = value
        if (!isNaN(value)) {
            calculatePercentage(value, field == 'takeProfit' ? 'isTake' : 'isStop')
        }
        setBraketOrders(barket)
        calculatePandL(barket)
    }

    const checkTpandSl = (type, value, buyorsell = 'buy') => {
        try {
            if (buyorsell == 'buy' && value < futureTradePair.marketPrice && type == 'isTake') {
                setErrors({ ...errors, ...{ 'takeProfitPrice': 'Take profit price must be greater than market price' } })
            }
            else if (buyorsell == 'sell' && value > futureTradePair.marketPrice && type == 'isTake') {
                setErrors({ ...errors, ...{ 'takeProfitPrice': 'Take profit price must be less than market price' } })
            } else if (type == 'isTake') {
                delete errors.takeProfitPrice
                setErrors(errors)
            }

            if (buyorsell == 'buy' && value > futureTradePair.marketPrice && type == 'isStop') {
                setErrors({ ...errors, ...{ 'stopLossPrice': 'Stop Loss price must be less than market price' } })
            }
            else if (buyorsell == 'sell' && value < futureTradePair.marketPrice && type == 'isStop') {
                setErrors({ ...errors, ...{ 'stopLossPrice': 'Stop Loss price must be greater than market price' } })
            } else if (type == 'isStop') {
                delete errors.stopLossPrice
                setErrors(errors)
                // setErrors({ ...errors, ...{ 'stopLossPrice': '' } })
            }

        } catch (err) {
            console.log(err, 'CheckTpandSl')
        }
    }

    const setGainAndLoss = (type, value, call = 'edit', futureTradePair) => {
        try {
            const buyorsell = orderData.positionSide == 'short' ? 'sell' : 'buy'
            const isTake = type === 'isTake';
            const isStop = type === 'isStop';

            const numberRegex = /^[+]?([0-9]+(?:[\.][0-9]*)?|\.[0-9]+)$/;

            // Validation
            if ((parseFloat(value) < 0 || parseFloat(value) > 100 || !numberRegex.test(value)) && value !== '') {
                return false;
            }

            if (isStop && parseFloat(value) > 99) {
                return false;
            }

            const name = isTake ? 'takeProfit' : 'stopLoss';
            isTake ? setGainPercen(value) : setLossPercen(value);
            // Handle empty input
            if (value === '') {
                let barket = { ...barketOrders }
                barket[name]['stopPrice'] = value
                setBraketOrders(barket)
                checkTpandSl(isTake ? 'isTake' : 'isStop', value);
                // onChangeHandler(name, 'stopPrice', '');
                return false;
            }

            let marketPrice = parseFloat(futureTradePair.marketPrice);
            if (orderData.positionSide == 'short') {
                marketPrice = isTake ? orderData.entryPrice < marketPrice ? orderData.entryPrice : marketPrice : orderData.entryPrice > marketPrice ? orderData.entryPrice : marketPrice
            } else if (orderData.positionSide == 'long') {
                marketPrice = isTake ? orderData.entryPrice > marketPrice ? orderData.entryPrice : marketPrice : orderData.entryPrice < marketPrice ? orderData.entryPrice : marketPrice
            }
            marketPrice = parseFloat(marketPrice)
            const percent = parseFloat(value);
            let stopPrice = 0;

            if (buyorsell === 'buy') {
                stopPrice = isTake
                    ? marketPrice + (marketPrice * percent) / 100
                    : marketPrice - (marketPrice * percent) / 100;
            } else if (buyorsell === 'sell') {
                stopPrice = isTake
                    ? marketPrice - (marketPrice * percent) / 100
                    : marketPrice + (marketPrice * percent) / 100;
            }
            stopPrice = isNaN(stopPrice) || !isFinite(stopPrice) ? 0 : stopPrice.toFixed(futureTradePair.quoteDecimal)
            // Apply updates
            if (isTake) {
                // setGainPercen(value);
                checkTpandSl('isTake', stopPrice);
            } else {
                // setLossPercen(value);
                checkTpandSl('isStop', stopPrice);
            }
            if (call == 'initial') {
                return stopPrice
            } else {
                let barket = { ...barketOrders }
                barket[name]['stopPrice'] = isNaN(stopPrice) ? '' : stopPrice
                setBraketOrders(barket)
                calculatePandL(barket)
                // onChangeHandler(name, 'stopPrice', isNaN(stopPrice) ? '' : stopPrice);
            }
        } catch (err) {
        }
    };

    const calculatePercentage = (stopPrice, type) => {
        try {
            const buyorsell = orderData.positionSide == 'short' ? 'sell' : 'buy'
            const isTake = type === 'isTake';
            const isStop = type === 'isStop';
            if (stopPrice == '') {
                if (isTake) {
                    setGainPercen('');
                } else if (isStop) {
                    setLossPercen('');
                }
                return false
            }
            let marketPrice = parseFloat(futureTradePair.marketPrice);
            if (orderData.positionSide == 'short') {
                marketPrice = isTake ? orderData.entryPrice < marketPrice ? orderData.entryPrice : marketPrice : orderData.entryPrice > marketPrice ? orderData.entryPrice : marketPrice
            } else if (orderData.positionSide == 'long') {
                marketPrice = isTake ? orderData.entryPrice > marketPrice ? orderData.entryPrice : marketPrice : orderData.entryPrice < marketPrice ? orderData.entryPrice : marketPrice
            }

            let percentage = 0;
            if (buyorsell === 'buy') {
                percentage = ((stopPrice - marketPrice) / marketPrice) * 100;
            } else if (buyorsell === 'sell') {
                percentage = ((marketPrice - stopPrice) / marketPrice) * 100;
            }
            percentage = (percentage).toFixed(2)
            if (isTake) {
                setGainPercen(Math.abs(percentage));
            } else if (isStop) {
                setLossPercen(Math.abs(percentage));
            }
        } catch (err) {
            console.log('calculatePercentage__err', err)
        }
    }


    const onConfirm = () => {
        const error = {
            takeProfit: {},
            stopLoss: {}
        };

        if (isEmpty(barketOrders.takeProfit?.stopPrice)) {
            error.takeProfit.stopPrice = 'Stop price is required';
        }
        if (isEmpty(barketOrders.takeProfit?.price) && tabOne === 'Limit') {
            error.takeProfit.price = 'Price is required';
        }
        if (isEmpty(barketOrders.takeProfit?.orderType)) {
            error.takeProfit.orderType = 'Order type is required';
        }

        if (isEmpty(barketOrders.stopLoss?.stopPrice)) {
            error.stopLoss.stopPrice = 'Stop price is required';
        }
        if (isEmpty(barketOrders.stopLoss?.price) && tabTwo === 'Limit') {
            error.stopLoss.price = 'Price is required';
        }
        if (isEmpty(barketOrders.stopLoss?.orderType)) {
            error.stopLoss.orderType = 'Order type is required';
        }

        if (Object.keys(error.takeProfit).length === 0) {
            delete error.takeProfit;
        }
        if (Object.keys(error.stopLoss).length === 0) {
            delete error.stopLoss;
        }


        if (Object.keys(error).length > 0) {
            setErrors(error);
            return;
        }
        changeBraketOrder()
    };

    const getPorfitCalculation = (entryPrice, closePrice, quantity, positionSide) => {
        try {
            let profit = 0
            if (positionSide == 'short') {
                profit = (parseFloat(entryPrice) - parseFloat(closePrice)) * quantity
            } else {
                profit = (parseFloat(closePrice) - parseFloat(entryPrice)) * quantity
            }
            return profit
        } catch (err) {
            console.log("getPorfitCalculation_err", err)
            return 0
        }
    }

    const calculatePandL = (order) => {
        try {
            const error = {
                takeProfit: {},
                stopLoss: {}
            };
            let stop, exit = 0
            if (tabOne.toLowerCase() == 'market') {
                exit = getPorfitCalculation(order.entryPrice, isEmpty(order.takeProfit.stopPrice) ? 0 : order.takeProfit.stopPrice, order.positionFilled, order.positionSide)
            } else if (tabOne.toLowerCase() == 'limit') {
                exit = getPorfitCalculation(order.entryPrice, isEmpty(order.takeProfit.price) ? 0 : order.takeProfit.price, order.positionFilled, order.positionSide)
            }

            if (tabTwo.toLowerCase() == 'market') {
                stop = getPorfitCalculation(order.entryPrice, isEmpty(order.stopLoss.stopPrice) ? 0 : order.stopLoss.stopPrice, order.positionFilled, order.positionSide)
            } else if (tabTwo.toLowerCase() == 'limit') {
                stop = getPorfitCalculation(order.entryPrice, isEmpty(order.stopLoss.price) ? 0 : order.stopLoss.price, order.positionFilled, order.positionSide)
            }

            if (isEmpty(order.takeProfit.stopPrice)) {
                error.takeProfit.stopPrice = 'Trigger price is required'
            } else if ((order.positionSide == 'long' && parseFloat(order.entryPrice) >= parseFloat(order.takeProfit.stopPrice))) {
                error.takeProfit.stopPrice = 'Trigger price must be greater than entry price'
            } else if ((order.positionSide == 'short' && parseFloat(order.entryPrice) <= parseFloat(order.takeProfit.stopPrice))) {
                error.takeProfit.stopPrice = 'Trigger price must be lesser than entry price'
            }


            if (isEmpty(order.stopLoss.stopPrice)) {
                error.stopLoss.stopPrice = 'Trigger price is required'
            } else if ((order.positionSide == 'long' && parseFloat(order.entryPrice) <= parseFloat(order.stopLoss.stopPrice))) {
                error.stopLoss.stopPrice = 'Trigger price must be lesser than entry price'
            } else if ((order.positionSide == 'short' && parseFloat(order.entryPrice) >= parseFloat(order.stopLoss.stopPrice))) {
                error.stopLoss.stopPrice = 'Trigger price must be greater than entry price'
            }

            if (Object.keys(error.takeProfit).length === 0) {
                delete error.takeProfit;
            }
            if (Object.keys(error.stopLoss).length === 0) {
                delete error.stopLoss;
            }


            if (Object.keys(error).length > 0) {
                setErrors(error);
                return;
            }
            setErrors({});
            setStopPandL(isNaN(stop) ? 0 : stop === 0 ? 0 : stop.toFixed(futureTradePair?.quoteDecimal ?? 2))
            setExitPandL(isNaN(exit) ? 0 : exit === 0 ? 0 : exit.toFixed(futureTradePair?.quoteDecimal ?? 2))
        } catch (err) {
            console.log(err, "calculatePandL__err")
        }

    }


    // useEffect(() => {
    //     if (isEmpty(barketOrders)) return
    //     calculatePandL(barketOrders)
    // }, [barketOrders]);

    useEffect(() => {
        if (isEmpty(orderData)) return

        let futureTradePair = futurePairData.find((val) => (val._id == orderData.pairId))
        setfutureTradePair(futureTradePair)

        const bracketOrders = orderData?.bracketOrders || [];
        const takeProfit = bracketOrders.find((el) => el.type === "takeprofit");
        const stopLoss = bracketOrders.find((el) => el.type === "stoploss");
        if (!isEmpty(takeProfit)) {
            setTabOne(takeProfit?.orderType == "bracket_tp_market" ? "Market" : 'Limit')
        }
        if (!isEmpty(stopLoss)) {
            setTabTwo(stopLoss?.orderType == "bracket_sl_market" ? "Market" : 'Limit')
        }
        const updateData = {
            pairId: orderData.pairId,
            orderId: orderData._id,
            entryPrice: orderData.price ?? orderData.entryPrice,
            positionFilled: orderData.quantity,
            positionSide: orderData.positionSide,
            takeProfit: {
                type: "takeprofit",
                stopPrice: takeProfit?.stopPrice ?? 0,
                orderType: takeProfit?.orderType ?? "bracket_tp_market",
                price: takeProfit?.price ?? 0,
            },
            stopLoss: {
                type: "stoploss",
                stopPrice: stopLoss?.stopPrice ?? 0,
                orderType: stopLoss?.orderType ?? "bracket_sl_market",
                price: stopLoss?.price ?? 0,
            }
        }
        if (isEmpty(updateData.takeProfit.stopPrice)) {
            let stopPrice = setGainAndLoss('isTake', 0.25, 'initial', futureTradePair)
            updateData.takeProfit.stopPrice = stopPrice
        }
        if (isEmpty(updateData.stopLoss.stopPrice)) {
            let stopPrice = setGainAndLoss('isStop', 0.25, 'initial', futureTradePair)
            updateData.stopLoss.stopPrice = stopPrice
        }
        setBraketOrders((prev) => ({
            ...prev,
            ...updateData
        }));
        calculatePandL(updateData);
    }, [orderData, tabType])


    return (
        <div>
            <Modal
                centered
                size="md"
                backdrop="static"
                show={show}
                onHide={handleClose}
                className={styles.modalPrimary}
            >
                <Modal.Header className={styles.modalPrimaryHeader}>
                    <h4 className={`${styles.modalHeaderTitle} `}>Add Bracket Order: {formatDisplayPair(orderData?.pairName)}</h4>
                    <button
                        aria-label="closeIcon"
                        className={styles.modalCloseButton}
                        onClick={() => {
                            setExitPandL(0);
                            setStopPandL(0);
                            setfutureTradePair({})
                            handleClose()
                        }}
                    >
                        <IoClose />
                    </button>
                </Modal.Header>
                <Modal.Body className={styles.modalPrimaryBody}>
                    <div className={styles.featureModalContent}>
                        <div className="flexBetween my-2">
                            <h3 className={styles.modelLabelText}>Entry Price</h3>
                            <p className={styles.modelLabelValue}>{barketOrders?.entryPrice}</p>
                        </div>
                        {/* <div className="flexBetween my-2">
                    <h3 className={styles.modelLabelText}>Trigger Index</h3>
                    <div>
                        <Select
                            // menuIsOpen
                            isSearchable={false}
                            placeholder="Select"
                            classNamePrefix="react-select__fourth"
                            options={triggerOption}
                        />
                    </div>
                </div> */}
                        <div className="my-3">
                            <div className="d-flex justify-content-between align-items-center my-4">
                                <h3 className={styles.modelLabelText}>Take Profit</h3>
                                <div className={styles.tabBtnWrapper}>
                                    <button aria-label="market" className={tabOne == "Market" && styles.isActive} onClick={() => { setTabOne("Market"); onChangeHandler('takeProfit', 'orderType', 'bracket_tp_market') }}>Market</button>
                                    <button aria-label="limit" className={tabOne == "Limit" && styles.isActive} onClick={() => { setTabOne("Limit"); onChangeHandler('takeProfit', 'orderType', 'bracket_tp_limit') }} >Limit</button>
                                </div>
                            </div>
                            <div>
                                <label className={styles.modelLabelText}>Trigger Price</label>
                                <div className={`${styles.formContainer} mt-2`}>
                                    <InputWithCurrencyAndLabel
                                        id={'limitAmount'}
                                        name={'stopPrice'}
                                        onChange={(name, value) => {
                                            onChangeHandler('takeProfit', name, value)
                                        }}
                                        placeholder={''}
                                        type={'text'}
                                        value={barketOrders?.takeProfit?.stopPrice}
                                        disabled={false}
                                        key={'limitAmount'}
                                        readOnly={false}
                                        currency={futureTradePair?.quoteCurrency}
                                        error={errors?.takeProfit?.stopPrice}
                                        className={"InputWithCurrencyAndLabel"} />
                                </div>
                                {/* <span>{errors?.takeProfit?.stopPrice}</span> */}

                            </div>
                            <div className={styles.percentagePart}>
                                <ul className="d-flex">
                                    <li>
                                        <button aria-label="percentage" onClick={() => { setGainAndLoss('isTake', 0.25, 'edit', futureTradePair) }}>0.25%</button>
                                    </li>
                                    <li>
                                        <button aria-label="percentage" onClick={() => { setGainAndLoss('isTake', 0.5, 'edit', futureTradePair) }} >0.5%</button>
                                    </li>
                                    <li>
                                        <button aria-label="percentage" onClick={() => { setGainAndLoss('isTake', 1, 'edit', futureTradePair) }}>1%</button>
                                    </li>
                                    <li>
                                        <button aria-label="percentage" onClick={() => { setGainAndLoss('isTake', 2, 'edit', futureTradePair) }} >2%</button>
                                    </li>
                                </ul>
                                <div className={styles.percentageInput}>
                                    <input
                                        // type="Exit PnL 0.11 USD Stop PnLnumber"
                                        type='text'
                                        value={isNaN(gainPrecn) ? 0 : gainPrecn}
                                        onChange={(e) => {
                                            setGainAndLoss('isTake', e.target.value, 'edit', futureTradePair)
                                        }}
                                    />
                                    <span>%</span>
                                </div>
                            </div>
                            {
                                tabOne == "Limit" &&
                                <div>
                                    <label className={styles.modelLabelText}>Limit Price</label>
                                    <div className={`${styles.formContainer} mt-2`}>
                                        <InputWithCurrencyAndLabel
                                            id={'limitAmount'}
                                            name={'price'}
                                            onChange={(name, value) => {
                                                onChangeHandler('takeProfit', name, value)
                                            }}
                                            placeholder={''}
                                            type={'text'}
                                            value={barketOrders?.takeProfit?.price}
                                            disabled={false}
                                            key={'limitAmount'}
                                            readOnly={false}
                                            currency={futureTradePair?.quoteCurrency}
                                            error={errors?.takeProfit?.price}
                                            className={"InputWithCurrencyAndLabel"} />
                                    </div>
                                    {/* <span>{errors?.takeProfit?.price}</span> */}

                                </div>
                            }
                        </div>
                        <div className="my-3">
                            <div className="d-flex justify-content-between align-items-center my-4">
                                <h3 className={styles.modelLabelText}>Stop Loss</h3>
                                <div className={styles.tabBtnWrapper}>
                                    <button aria-label="market" className={tabTwo == "Market" && styles.isActive} onClick={() => { setTabTwo("Market"); onChangeHandler('stopLoss', 'orderType', 'bracket_sl_market') }}>Market</button>
                                    <button aria-label="limit" className={tabTwo == "Limit" && styles.isActive} onClick={() => { setTabTwo("Limit"); onChangeHandler('stopLoss', 'orderType', 'bracket_sl_limit') }}>Limit</button>
                                    {/* <button className={tabTwo == "Trail" && styles.isActive} onClick={() => setTabTwo("Trail")}>Trail</button> */}
                                </div>
                            </div>
                            {
                                tabTwo !== "Trail" &&
                                <>
                                    <div>
                                        <label className={styles.modelLabelText}>Trigger Price</label>
                                        <div className={`${styles.formContainer} mt-2`}>
                                            <InputWithCurrencyAndLabel
                                                id={'limitAmount'}
                                                name={'stopPrice'}
                                                onChange={(name, value) => {
                                                    onChangeHandler('stopLoss', name, value)
                                                }}
                                                placeholder={''}
                                                type={'text'}
                                                value={barketOrders?.stopLoss?.stopPrice}
                                                disabled={false}
                                                key={'limitAmount'}
                                                readOnly={false}
                                                label={''}
                                                currency={futureTradePair?.quoteCurrency}
                                                error={errors?.stopLoss?.stopPrice}
                                                className={"InputWithCurrencyAndLabel"} />
                                        </div>
                                        {/* <span>{errors?.stopLoss?.stopPrice}</span> */}

                                    </div>
                                    <div className={styles.percentagePart}>
                                        <ul className="d-flex">
                                            <li>
                                                <button aria-label="percentage" onClick={() => { setGainAndLoss('isStop', 0.25, 'edit', futureTradePair) }}>0.25%</button>
                                            </li>
                                            <li>
                                                <button aria-label="percentage" onClick={() => { setGainAndLoss('isStop', 0.5, 'edit', futureTradePair) }}>0.5%</button>
                                            </li>
                                            <li>
                                                <button aria-label="percentage" onClick={() => { setGainAndLoss('isStop', 1, 'edit', futureTradePair) }}>1%</button>
                                            </li>
                                            <li>
                                                <button aria-label="percentage" onClick={() => { setGainAndLoss('isStop', 2, 'edit', futureTradePair) }}> 2%</button>
                                            </li>
                                        </ul>
                                        <div className={styles.percentageInput}>
                                            <input
                                                type="text"
                                                value={lossPrecn}
                                                onChange={(e) => {
                                                    setGainAndLoss('isStop', e.target.value, 'edit', futureTradePair)
                                                }} />
                                            <span>%</span>
                                        </div>
                                    </div>
                                </>
                            }
                            {
                                tabTwo == "Limit" &&
                                <div>
                                    <label className={styles.modelLabelText}>Limit Price</label>
                                    <div className={`${styles.formContainer} mt-2`}>
                                        <InputWithCurrencyAndLabel
                                            id={'limitAmount'}
                                            name={'price'}
                                            onChange={(name, value) => {
                                                onChangeHandler('stopLoss', name, value)
                                            }}
                                            placeholder={''}
                                            type={'text'}
                                            value={barketOrders?.stopLoss?.price}
                                            disabled={false}
                                            key={'limitAmount'}
                                            readOnly={false}
                                            currency={futureTradePair?.quoteCurrency}
                                            error={errors?.takeProfit?.stopPrice}
                                            className={"InputWithCurrencyAndLabel"} />
                                    </div>
                                    {/* <span>{errors?.takeProfit?.stopPrice}</span> */}

                                </div>
                            }
                            {
                                tabTwo == "Trail" &&
                                <div>
                                    <label className={styles.modelLabelText}>Trail Amount</label>
                                    <div className={`${styles.formContainer} mt-2`}>
                                        <InputWithCurrencyAndLabel
                                            id={'limitAmount'}
                                            name={'limitAmount'}
                                            onChange={""}
                                            placeholder={''}
                                            type={'text'}
                                            value={""}
                                            disabled={false}
                                            key={'limitAmount'}
                                            readOnly={false}
                                            currency={'USD'}
                                            error={null}
                                            className={"InputWithCurrencyAndLabel"} />
                                    </div>
                                </div>
                            }
                        </div>
                        <div className={`${styles.btnWrapper} mt-4 w-100 d-flex gap-3 justify-content-between`}>
                            <div className="w-50">
                                <div className="d-flex gap-5 justify-content-between">
                                    <p className={styles.modelLabelValue}>Exit PNL</p>
                                    <p className={styles.modelLabelValue}><span className={`${parseFloat(exitPandL) < 0 ? "value-lose" : "value-profit"} px-2`}>{exitPandL}</span>USD</p>
                                </div>
                                <div className="d-flex gap-5 justify-content-between">
                                    <p className={styles.modelLabelValue}>Stop PNL</p>
                                    <p className={styles.modelLabelValue}><span className={`${parseFloat(stopPandL) < 0 ? "value-lose" : "value-profit"} px-2`}>{stopPandL}</span>USD</p>
                                </div>
                            </div>
                            {/* {} */}
                            <div className="w-50">
                                <Button
                                    btnText={"Confirm"}
                                    disabled={!isEmpty(errors) && Object.keys(errors).length > 0 ? true : false}
                                    className="successFillRectangleBtnXs"
                                    onClick={onConfirm}
                                />
                            </div>
                        </div>
                    </div>
                </Modal.Body>
            </Modal>
        </div>
    );
};
export default ProfitLossModal;
