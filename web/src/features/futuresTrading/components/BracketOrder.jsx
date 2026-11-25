
/** PACKAGE IMPORT */

import { Modal } from "react-bootstrap";
import { IoClose } from "react-icons/io5";
import Select from "react-select";
import { useState, useEffect } from "react";
import { IoIosArrowBack } from "react-icons/io";
import { useDispatch, useSelector } from "react-redux";

/** LOCAL FILES IMPORT */

import styles from "../styles/bracketOrder.module.css";
import { InputWithCurrencyAndLabel, InputWithSelectAndLabel } from "../../../components/Input/InputFields";
import Button from "../../../components/Button/Button";
import isEmpty from "is-empty";

/** CODE START */
const BracketOrder = (props) => {
    const { handleClose, handleChange, formData } = props
    const { futureTicker, futureTradePair } = useSelector((state) => state.future);

    const triggerOption = [
        { value: 'Mark', label: 'Mark (123645)' },
        { value: 'Index', label: 'Index (123645)' },
    ];

    const [barketOrders, setBraketOrders] = useState({})
    const [errors, setErrors] = useState({})
    const [tabOne, setTabOne] = useState("Market");
    const [tabTwo, setTabTwo] = useState("Market");
    const [gainPrecn, setGainPercen] = useState('0')
    const [lossPrecn, setLossPercen] = useState('0')
    const [exitPandL, setExitPandL] = useState(0)
    const [stopPandL, setStopPandL] = useState(0)

    const onChangeHandler = (field, name, value) => {
        const numberRegex = /^[+]?([0-9]+(?:[\.][0-9]*)?|\.[0-9]+)$/;

        // Validation
        if (['stopPrice', 'price'].includes(name) && !numberRegex.test(value) && value !== '') {
            return false;
        }

        let barket = { ...barketOrders }
        barket[field][name] = value
        if (!isNaN(value)) {
            calculatePercentage(value, field == 'takeProfit' ? 'isTake' : 'isStop')
        }
        setBraketOrders(barket)
        calculatePandL(barket)
    }

    const checkTpandSl = (type, value, buyorsell) => {
        try {
            if (buyorsell == 'buy' && value < futureTicker.marketPrice && type == 'isTake') {
                setErrors({ ...errors, ...{ 'takeProfitPrice': 'Take profit price must be greater than market price' } })
            }
            else if (buyorsell == 'sell' && value > futureTicker.marketPrice && type == 'isTake') {
                setErrors({ ...errors, ...{ 'takeProfitPrice': 'Take profit price must be less than market price' } })
            } else if (type == 'isTake') {
                delete errors?.takeProfitPrice
                setErrors(errors)
            }

            if (buyorsell == 'buy' && value > futureTicker.marketPrice && type == 'isStop') {
                setErrors({ ...errors, ...{ 'stopLossPrice': 'Stop Loss price must be less than market price' } })
            }
            else if (buyorsell == 'sell' && value < futureTicker.marketPrice && type == 'isStop') {
                setErrors({ ...errors, ...{ 'stopLossPrice': 'Stop Loss price must be greater than market price' } })
            } else if (type == 'isStop') {
                delete errors?.stopLossPrice
                setErrors(errors)
            }


        } catch (err) {
            console.log(err, 'CheckTpandSl')
        }
    }

    const setGainAndLoss = (type, value, buyorsell = 'buy', call = 'edit') => {
        try {
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
                // onChangeHandler(name, 'stopPrice', '');
                return false;
            }

            let marketPrice = parseFloat(futureTicker.marketPrice);
            if (buyorsell == 'sell') {
                marketPrice = isTake ? formData?.price < marketPrice ? formData?.price : marketPrice : formData?.price > marketPrice ? formData?.price : marketPrice
            } else if (buyorsell == 'buy') {
                marketPrice = isTake ? formData?.price > marketPrice ? formData?.price : marketPrice : formData?.price < marketPrice ? formData?.price : marketPrice
            }

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
                setGainPercen(value);
                checkTpandSl('isTake', stopPrice, formData?.buyorsell);
            } else {
                setLossPercen(value);
                checkTpandSl('isStop', stopPrice, formData?.buyorsell);
            }

            if (call == 'initial') {
                return stopPrice
            } else {
                let barket = { ...barketOrders }
                barket[name]['stopPrice'] = isNaN(stopPrice) ? '' : stopPrice
                setBraketOrders(barket)
                // onChangeHandler(name, 'stopPrice', isNaN(stopPrice) ? '' : stopPrice);
            }

        } catch (err) {
        }
    };


    const calculatePercentage = (stopPrice, type) => {
        try {
            const buyorsell = formData.buyorsell
            const isTake = type === 'isTake';
            const isStop = type === 'isStop';
            let marketPrice = parseFloat(futureTicker.marketPrice);
            if (buyorsell == 'sell') {
                marketPrice = isTake ? formData?.price < marketPrice ? formData?.price : marketPrice : formData?.price > marketPrice ? formData?.price : marketPrice
            } else if (buyorsell == 'buy') {
                marketPrice = isTake ? formData?.price > marketPrice ? formData?.price : marketPrice : formData?.price < marketPrice ? formData?.price : marketPrice
            }

            let percentage = 0;
            if (buyorsell === 'buy') {
                percentage = ((parseFloat(stopPrice) - parseFloat(marketPrice)) / parseFloat(marketPrice)) * 100;
            } else if (buyorsell === 'sell') {
                percentage = ((parseFloat(marketPrice) - parseFloat(stopPrice)) / parseFloat(marketPrice)) * 100;
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

        if (isEmpty(barketOrders?.takeProfit?.stopPrice)) {
            error.takeProfit.stopPrice = 'Stop price is required';
        }
        if (isEmpty(barketOrders?.takeProfit?.price) && tabOne === 'Limit') {
            error.takeProfit.price = 'Price is required';
        }
        if (isEmpty(barketOrders?.takeProfit?.orderType)) {
            error.takeProfit.orderType = 'Order type is required';
        }

        if (isEmpty(barketOrders?.stopLoss?.stopPrice)) {
            error.stopLoss.stopPrice = 'Stop price is required';
        }
        if (isEmpty(barketOrders?.stopLoss?.price) && tabTwo === 'Limit') {
            error.stopLoss.price = 'Price is required';
        }
        if (isEmpty(barketOrders?.stopLoss?.orderType)) {
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
        handleChange(barketOrders)
    };
    const getPorfitCalculation = (entryPrice, closePrice, quantity, positionSide) => {
        try {
            let profit = 0
            if (positionSide == 'buy') {
                profit = (parseFloat(closePrice) - parseFloat(entryPrice)) * quantity
            } else {
                profit = (parseFloat(entryPrice) - parseFloat(closePrice)) * quantity
            }
            return profit
        } catch (err) {
            console.log("getPorfitCalculation_err", err)
            return 0
        }
    }

    const calculatePandL = (order) => {
        const error = {
            takeProfit: {},
            stopLoss: {}
        };
        let stop, exit = 0
        if (tabOne.toLowerCase() == 'market') {
            exit = getPorfitCalculation(formData.price, isEmpty(order.takeProfit.stopPrice) ? 0 : order.takeProfit.stopPrice, formData.quantity, formData.buyorsell)
        } else if (tabOne.toLowerCase() == 'limit') {
            exit = getPorfitCalculation(formData.price, isEmpty(order.takeProfit.price) ? 0 : order.takeProfit.price, formData.quantity, formData.buyorsell)
        }

        if (tabTwo.toLowerCase() == 'market') {
            stop = getPorfitCalculation(formData.price, isEmpty(order.stopLoss.stopPrice) ? 0 : order.stopLoss.stopPrice, formData.quantity, formData.buyorsell)
        } else if (tabTwo.toLowerCase() == 'limit') {
            stop = getPorfitCalculation(formData.price, isEmpty(order.stopLoss.price) ? 0 : order.stopLoss.price, formData.quantity, formData.buyorsell)
        }


        if (isEmpty(order.takeProfit.stopPrice)) {
            error.takeProfit.stopPrice = 'Trigger price is required'
        } else if ((formData.buyorsell == 'buy' && parseFloat(formData.price) >= parseFloat(order.takeProfit.stopPrice))) {
            error.takeProfit.stopPrice = 'Trigger price must be greater than entry price'
        } else if ((formData.buyorsell == 'sell' && parseFloat(formData.price) <= parseFloat(order.takeProfit.stopPrice))) {
            error.takeProfit.stopPrice = 'Trigger price must be lesser than entry price'
        }


        if (isEmpty(order.stopLoss.stopPrice)) {
            error.stopLoss.stopPrice = 'Trigger price is required'
        } else if ((formData.buyorsell == 'buy' && parseFloat(formData.price) <= parseFloat(order.stopLoss.stopPrice))) {
            error.stopLoss.stopPrice = 'Trigger price must be lesser than entry price'
        } else if ((formData.buyorsell == 'sell' && parseFloat(formData.price) >= parseFloat(order.stopLoss.stopPrice))) {
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
        setStopPandL(isNaN(stop) ? 0 : stop === 0 ? 0 : stop.toFixed(futureTradePair?.quoteDecimal))
        setExitPandL(isNaN(exit) ? 0 : exit === 0 ? 0 : exit.toFixed(futureTradePair?.quoteDecimal))
    }

    useEffect(() => {
        if (isEmpty(formData)) return
        let barketOrders = JSON.stringify(formData)
        barketOrders = JSON.parse(barketOrders)
        if (isEmpty(barketOrders.takeProfit.stopPrice)) {
            let stopPrice = setGainAndLoss('isTake', 0.25, formData.buyorsell, 'initial')
            barketOrders.takeProfit.stopPrice = parseFloat(stopPrice)
        }
        if (isEmpty(barketOrders.stopLoss.stopPrice)) {
            let stopPrice = setGainAndLoss('isStop', 0.25, formData.buyorsell, 'initial')
            barketOrders.stopLoss.stopPrice = parseFloat(stopPrice)
        }
        calculatePandL(barketOrders)
        setBraketOrders(barketOrders)
    }, [formData]);


    return (
        <>
            {/* <div className={styles.header}>
                <button
                    className={`borderLessButton`}
                    onClick={handleClose}>

                    <IoIosArrowBack />
                </button>
                <p className={styles.title}>
                    Bracket Order
                </p>
            </div> */}

            <div className={styles.featureModalContent}>
                <div className="flexBetween my-2">
                    <h3 className={styles.modelLabelText}>Entry Price</h3>
                    <p className={styles.modelLabelValue}>{formData?.price}</p>
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

                    </div>
                    <div className={styles.percentagePart}>
                        <ul className="d-flex">
                            <li>
                                <button aria-label="percentage" onClick={() => setGainAndLoss('isTake', 0.25, formData.buyorsell)}>0.25%</button>
                            </li>
                            <li>
                                <button aria-label="percentage" onClick={() => setGainAndLoss('isTake', 0.5, formData.buyorsell)} >0.5%</button>
                            </li>
                            <li>
                                <button aria-label="percentage" onClick={() => setGainAndLoss('isTake', 1, formData.buyorsell)}>1%</button>
                            </li>
                            <li>
                                <button aria-label="percentage" onClick={() => setGainAndLoss('isTake', 2, formData.buyorsell)} >2%</button>
                            </li>
                        </ul>
                        <div className={styles.percentageInput}>
                            <input
                                type="text"
                                value={gainPrecn}
                                onChange={(e) => {
                                    setGainAndLoss('isTake', e.target.value, formData.buyorsell)
                                }} />
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

                            </div>
                            <div className={styles.percentagePart}>
                                <ul className="d-flex">
                                    <li>
                                        <button aria-label="percentage" onClick={() => setGainAndLoss('isStop', 0.25, formData.buyorsell)}>0.25%</button>
                                    </li>
                                    <li>
                                        <button aria-label="percentage" onClick={() => setGainAndLoss('isStop', 0.5, formData.buyorsell)}>0.5%</button>
                                    </li>
                                    <li>
                                        <button aria-label="percentage" onClick={() => setGainAndLoss('isStop', 1, formData.buyorsell)}>1%</button>
                                    </li>
                                    <li>
                                        <button aria-label="percentage" onClick={() => setGainAndLoss('isStop', 2, formData.buyorsell)}> 2%</button>
                                    </li>
                                </ul>
                                <div className={styles.percentageInput}>
                                    <input type="text" value={lossPrecn}
                                        onChange={(e) => {
                                            setGainAndLoss('isStop', e.target.value, formData.buyorsell)
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
                                    currency={futureTradePair?.quoteCurrency}
                                    error={null}
                                    className={"InputWithCurrencyAndLabel"} />
                            </div>
                        </div>
                    }
                </div>
                <div className={`${styles.btnWrapper} mt-4 w-100 d-flex gap-3 justify-content-between`}>
                    <div className="w-50">
                        <div className="d-flex gap-2 justify-content-between">
                            <p className={styles.modelLabelValue}>Exit PnL</p>
                            <p className={styles.modelLabelValue}><span className="value-profit px-2">{exitPandL}</span>{futureTradePair?.quoteCurrency}</p>
                        </div>
                        <div className="d-flex gap-2 justify-content-between">
                            <p className={styles.modelLabelValue}>Stop PnL</p>
                            <p className={styles.modelLabelValue}><span className="value-lose px-2">{stopPandL}</span>{futureTradePair?.quoteCurrency}</p>
                        </div>
                    </div>
                    <div className="w-50">
                        <Button btnText={"Confirm"}
                            disabled={Object.values(errors).length > 0 ? true : false}
                            className="successFillRectangleBtnXs" onClick={() => { onConfirm() }} />
                    </div>
                </div>
            </div>
        </>
    )
}
export default BracketOrder;