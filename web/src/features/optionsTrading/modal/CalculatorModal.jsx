import React, { useEffect, useRef, useState } from 'react';
import { Modal } from "react-bootstrap";
import { IoClose } from "react-icons/io5";
import styles from "../styles/modal.module.css";
import Button from '../../../components/Button/Button';
import { useDispatch, useSelector } from "react-redux";
import { showToastMessage } from '../../../lib/toast';
import isEmpty from "is-empty"

/** Actions */
import { futureCancelAllOrder } from '../../../actions/futureActions';

/** Redux */
import { FutureCancelOrders } from '../../../redux/futureAction';
import { InputRange, InputWithCurrencyAndLabel } from '../../../components/Input/InputFields';
import CustomRangeSlider from '../../../components/UiComponents/CustomRangeSlider';

const initialState = {
    positionSide: 'long',
    entryPrice: 0,
    exitPrice: 0,
    leverage: 1,
    quantity: 0,
    liquidityPrice: 0,
    PandL: 0,
    percentage: 0,
    roe: 0
}
const CalculatorModal = ({ show, handleClose }) => {
    const { wallet } = useSelector((state) => state.user);
    const { futureTradePair, makerFee, takerFee } = useSelector((state) => state.future);
    const [formData, setFormData] = useState(initialState);
    const [selectedTab, setSelectedTab] = useState('liquidation');
    const [liquidityPrice, setLiquidityPrice] = useState(0)
    const [PandL, setPandL] = useState(0)
    const [quantity, setQuantity] = useState(0)
    const [targetPrice, setTargetPrice] = useState(0)

    // console.log("qnnnnnnnn", quantity)
    const isolatedLiquidationPrice = (positionSide, price, leverage) => {
        try {
            if (!price || !leverage || !futureTradePair?.maintenanceMargin) return;

            let liquidationPrice = 0;
            price = parseFloat(price)
            leverage = parseFloat(leverage)
            let maintanceMargin = parseFloat(futureTradePair.maintenanceMargin)
            if (positionSide == 'long') {
                liquidationPrice = (price * leverage) / (leverage + 1 - ((maintanceMargin / 100) * leverage)) //Binance based calculation for low maintanceMargin
                if (parseFloat(liquidationPrice) > parseFloat(price)) {
                    liquidationPrice = parseFloat(price) - ((parseFloat(price) * (parseFloat(maintanceMargin) / 100)) / parseFloat(leverage)) //HUMB based calculation for high maintanceMargin
                }
            } else if (positionSide == 'short') {
                liquidationPrice = (price * leverage) / (leverage - 1 + ((maintanceMargin / 100) * leverage))//Binance based calculation for low maintanceMargin
                if (parseFloat(liquidationPrice) < parseFloat(price)) {
                    liquidationPrice = parseFloat(price) + ((parseFloat(price) * (parseFloat(maintanceMargin) / 100)) / parseFloat(leverage))//HUMB based calculation for high maintanceMargin
                }
            }

            setLiquidityPrice(liquidationPrice)
            // setFormData({ ...formData, ...{ liquidityPrice: liquidationPrice } })
            // return liquidationPrice;
        } catch (err) {
            console.log(err, "calculateLiquidityPrice___err")
        }

    }

    const getPorfitCalculation = (entryPrice, closePrice, quantity, positionSide) => {
        try {
            let profit = 0
            if (positionSide == 'short') {
                profit = (parseFloat(entryPrice) - parseFloat(closePrice)) * quantity
            } else {
                profit = (parseFloat(closePrice) - parseFloat(entryPrice)) * quantity
            }
            setPandL(profit)
            // setFormData({ ...formData, ...{ PandL: profit } })
            return profit
        } catch (err) {
            console.log("getPorfitCalculation_err", err)
            return 0
        }
    }

    const CalculateQuantity = (percentage, price, leverage) => {
        try {

            if (!price || !isFinite(price)) {
                return;
            }

            // Calculate balance to invest
            let investBalance = (wallet?.availableBalance * (Number(percentage) / 100)) || 0;
            investBalance = parseFloat(investBalance.toFixed(futureTradePair.quoteDecimal));

            // Adjust for fees when 100%
            if (percentage === 100) {
                // const feePercent = parseFloat(futureTradePair.makerFee) + parseFloat(futureTradePair.takerFee);

                const feePercent = parseFloat(makerFee) + parseFloat(takerFee);

                const orderValue = investBalance * leverage;
                let fee = orderValue * (feePercent / 100);

                if (!isFinite(fee)) fee = 0;

                investBalance -= fee;
            }

            let quantity = (investBalance / price) * leverage || 0;

            quantity = parseFloat(quantity.toFixed(futureTradePair.baseDecimal));
            setQuantity(quantity)
            // calculateOrderValue(quantity, price);
            // setBalPrecen(percentage);
        } catch (err) {
        }
    };

    const CalculateTargetPrice = (price, leverage, roe, positionSide) => {
        try {
            let targetPrice = 0
            if (positionSide == 'long') {
                targetPrice = price * (1 + (roe / (100 * leverage)))
            } else if (positionSide == 'short') {
                targetPrice = price * (1 - (roe / (100 * leverage)))
            }
            setTargetPrice((targetPrice).toFixed(futureTradePair.quoteDecimal))
        } catch (err) {
            console.log(err, "CalculateTargetPrice__err")
        }
    }

    const handleLeverageButtonClick = (percent) => {
        // console.log('percentvalue', (percent / 100) * futureTradePair.max_leverage)
        // const calculatedValue = (percent / 100) * futureTradePair.max_leverage;
        const calculatedValue = percent === 0 ? 1 : percent;
        setFormData({ ...formData, ...{ leverage: calculatedValue } })
        if (selectedTab == 'trade') {
            CalculateQuantity(formData.percentage, formData.entryPrice, calculatedValue)
        } else if (selectedTab == 'liquidation') {
            isolatedLiquidationPrice(formData?.positionSide, formData?.entryPrice, calculatedValue)
        } else if (selectedTab == 'target') {
            CalculateTargetPrice(formData.entryPrice, calculatedValue, formData.roe, formData.positionSide)
        }

    };

    const handleLeverageSliderChange = (e) => {
        const rawValue = Number(e.target.value);
        // console.log('rawvalue', rawValue)
        // const maxLeverage = isEmpty(futureTradePair?.max_leverage) ? 100 : futureTradePair?.max_leverage;
        // const progress = (rawValue / maxLeverage) * 100;
        const clampedValue = Math.max(rawValue, 1);
        setFormData({ ...formData, ...{ leverage: clampedValue } })
        if (selectedTab == 'trade') {
            CalculateQuantity(formData.percentage, formData.entryPrice, clampedValue)
        } else if (selectedTab == 'liquidation') {
            isolatedLiquidationPrice(formData?.positionSide, formData?.entryPrice, clampedValue)
        } else if (selectedTab == 'target') {
            CalculateTargetPrice(formData.entryPrice, clampedValue, formData.roe, formData.positionSide)
        }
    };

    useEffect(() => {
        if (selectedTab === 'liquidation' && futureTradePair?.maintenanceMargin) {
            isolatedLiquidationPrice(formData.positionSide, formData.entryPrice, formData.leverage)
        } else if (selectedTab === 'profit') {
            getPorfitCalculation(formData.entryPrice, formData.exitPrice, formData.quantity, formData.positionSide)
        } else if (selectedTab === 'target') {
            CalculateTargetPrice(formData.entryPrice, formData.leverage, formData.roe, formData.positionSide)
        }
    }, [selectedTab])

    useEffect(() => {
        setFormData(initialState)
    }, [selectedTab])
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
                    <div className={styles.calcModalTabs}>
                        <button aria-label='liquidation' className={`${selectedTab == 'liquidation' ? styles.active : ''}`} onClick={() => setSelectedTab('liquidation')}>Liquidation Price</button>
                        <button aria-label='profit' className={`${selectedTab == 'profit' ? styles.active : ''}`} onClick={() => setSelectedTab('profit')}>Profit / Loss</button>
                        <button aria-label='trade' className={`${selectedTab == 'trade' ? styles.active : ''}`} onClick={() => setSelectedTab('trade')}>Trade Size</button>
                        <button aria-label='target' className={`${selectedTab == 'target' ? styles.active : ''}`} onClick={() => setSelectedTab('target')}>Target Price</button>
                    </div>
                    <button
                        aria-label='closeIcon'
                        className={styles.modalCloseButton}
                        onClick={handleClose}
                    >
                        <IoClose />
                    </button>
                </Modal.Header>
                <Modal.Body className={`${styles.modalPrimaryBody} pt-0`}>
                    <div className={styles.modalPrimaryBodyContainer}>
                        {selectedTab == 'liquidation' &&
                            <div className=''>
                                {/* <div className='row align-items-center'>
                                    <div className='col-4'>
                                        <p className="custom-checkInput__content">
                                            Position:
                                        </p>
                                    </div>
                                    <div className='col-4'>
                                        <p className="custom-checkInput__content">
                                            -
                                        </p>
                                    </div>
                                </div> */}
                                <div className='row align-items-center mt-3'>
                                    <div className='col-4'>
                                        <p className="custom-checkInput__content">
                                            Avl. Margin::
                                        </p>
                                    </div>
                                    <div className='col-4'>
                                        <p className="custom-checkInput__content">{(wallet?.availableBalance)?.toFixed(2)}</p>
                                    </div>
                                </div>
                                <div className='row align-items-center mt-3'>
                                    <div className='col-4'>
                                        <p className="custom-checkInput__content">
                                            Trade:
                                        </p>
                                    </div>
                                    <div className='col-6'>
                                        <div className='row align-items-center'>
                                            <div className='col-2'>
                                                <p className="custom-checkInput__content"> Long </p>
                                            </div>
                                            <div className='col-3'>
                                                <div className="custom-toggle__primary">
                                                    <label className="switch">
                                                        <input
                                                            type="checkbox"
                                                            checked={formData.positionSide == 'short' ? true : false}
                                                            onChange={(e) => {
                                                                isolatedLiquidationPrice(
                                                                    e?.target?.checked ? 'short' : 'long',
                                                                    formData?.entryPrice,
                                                                    formData?.leverage)
                                                                setFormData({ ...formData, ...{ positionSide: e.target.checked ? 'short' : 'long' } })
                                                            }}
                                                        />
                                                        <span className="slider round"></span>
                                                    </label>
                                                </div>
                                            </div>
                                            <div className='col-2'>
                                                <p className="custom-checkInput__content">Short</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                {/* <div className='row align-items-center mt-3'>
                                    <div className='col-4'>
                                        <p className="custom-checkInput__content">Quantity:</p>
                                    </div>
                                    <div className='col-6'>
                                        <div className={`${styles.fixedAmountField}`}>
                                            <InputWithCurrencyAndLabel
                                                id={'limitAmount'}
                                                name={'stopPrice'}
                                                
                                                placeholder={'1'}
                                                type={'number'}
                                                // value={2}
                                                disabled={false}
                                                key={'limitAmount'}
                                                readOnly={false}
                                                currency={"Lot"}
                                                error={null}
                                                className={"InputTextThirdCurrencyAndLabel2"} />
                                        </div>
                                    </div>
                                </div> */}
                                {/* <div className='row align-items-center mt-2'>
                                    <div className='col-10 text-end'>
                                        <p className="custom-checkInput__content"> = 0.01 {"  "} Lot</p>
                                    </div>
                                </div> */}
                                <div className='row align-items-center mt-3'>
                                    <div className='col-4'>
                                        <p className="custom-checkInput__content">Entry Price:</p>
                                    </div>
                                    <div className='col-6'>
                                        <div className={`${styles.fixedAmountField}`}>
                                            <InputWithCurrencyAndLabel
                                                id={'limitAmount'}
                                                name={'stopPrice'}
                                                onChange={(name, value) => {
                                                    isolatedLiquidationPrice(
                                                        formData?.positionSide,
                                                        value,
                                                        formData?.leverage)
                                                    setFormData({ ...formData, ...{ entryPrice: value } })
                                                }}
                                                placeholder={'0'}
                                                type={'number'}
                                                value={formData?.entryPrice}
                                                disabled={false}
                                                key={'limitAmount'}
                                                readOnly={false}
                                                currency={futureTradePair.quoteCurrency}
                                                error={null}
                                                className={"InputTextThirdCurrencyAndLabel2"} />
                                        </div>
                                    </div>
                                </div>
                                <div className='row align-items-center mt-3'>
                                    <div className='col-4'>
                                        <p className="custom-checkInput__content">Leverage:</p>
                                    </div>
                                    <div className='col-6'>
                                        <div className={`${styles.fixedAmountField}`}>
                                            <InputWithCurrencyAndLabel
                                                id={'limitAmount'}
                                                name={'stopPrice'}
                                                onChange={(name, value) => {
                                                    isolatedLiquidationPrice(
                                                        formData?.positionSide,
                                                        formData?.entryPrice,
                                                        value)
                                                    setFormData({ ...formData, ...{ leverage: value } })
                                                }}
                                                placeholder={'1'}
                                                type={'number'}
                                                value={formData.leverage}
                                                disabled={false}
                                                key={'limitAmount'}
                                                readOnly={false}
                                                currency={`${formData.leverage} x`}
                                                error={null}
                                                className={"InputTextThirdCurrencyAndLabel2"} />
                                        </div>
                                    </div>
                                </div>
                                <div className='row align-items-center mt-2'>
                                    <div className='col-4'></div>
                                    <div className='col-6'>
                                        {/* <InputRange /> */}
                                        <CustomRangeSlider
                                            max={100}
                                            percentages={[0, 25, 50, 75, 100]}
                                            startingValue={formData.leverage}
                                            handleButtonClick={handleLeverageButtonClick}
                                            handleSliderChange={handleLeverageSliderChange}
                                        />
                                        {/* <input type="range" name="" id="" className='w-100' /> */}
                                    </div>
                                </div>
                                {/* <div className='row align-items-center mt-3'>
                                    <div className='col-4'>
                                        <p className="custom-checkInput__content">Resulting Position:</p>
                                    </div>
                                    <div className='col-4'>
                                        <p className="custom-checkInput__content">1</p>
                                    </div>
                                </div> */}
                                <div className='row align-items-center mt-3'>
                                    <div className='col-4'>
                                        <p className="custom-checkInput__content">Est. Liq. Price:</p>
                                    </div>
                                    <div className='col-4'>
                                        <p className="custom-checkInput__content">{(!isNaN(liquidityPrice) && isFinite(liquidityPrice)) ? parseFloat(liquidityPrice).toFixed(futureTradePair.quoteDecimal) : 0}</p>
                                    </div>
                                </div>
                            </div>
                        }
                        {selectedTab == 'profit' &&
                            <div className=''>
                                {/* <div className='row align-items-center'>
                                    <div className='col-4'>
                                        <p className="custom-checkInput__content">
                                            Position:
                                        </p>
                                    </div>
                                    <div className='col-4'>
                                        <p className="custom-checkInput__content">
                                            -
                                        </p>
                                    </div>
                                </div> */}
                                <div className='row align-items-center mt-3'>
                                    <div className='col-4'>
                                        <p className="custom-checkInput__content">
                                            Avl. Margin:
                                        </p>
                                    </div>
                                    <div className='col-4'>
                                        <p className="custom-checkInput__content">{(wallet?.availableBalance)?.toFixed(2)} USD</p>
                                    </div>
                                </div>
                                <div className='row align-items-center mt-3'>
                                    <div className='col-4'>
                                        <p className="custom-checkInput__content">
                                            Trade:
                                        </p>
                                    </div>
                                    <div className='col-6'>
                                        <div className='row align-items-center'>
                                            <div className='col-2'>
                                                <p className="custom-checkInput__content"> Long </p>
                                            </div>
                                            <div className='col-3'>
                                                <div className="custom-toggle__primary">
                                                    <label className="switch">
                                                        <input
                                                            type="checkbox"
                                                            // onChange={(e) => changeTheme(e?.target?.checked)}
                                                            // checked={userTheme === "dark"}
                                                            checked={formData.positionSide == 'short' ? true : false}
                                                            onChange={(e) => {
                                                                getPorfitCalculation(formData.entryPrice, formData.exitPrice, formData.quantity, e?.target?.checked ? 'short' : 'long')
                                                                setFormData({ ...formData, ...{ positionSide: e.target.checked ? 'short' : 'long' } })
                                                            }}
                                                        />
                                                        <span className="slider round"></span>
                                                    </label>
                                                </div>
                                            </div>
                                            <div className='col-2'>
                                                <p className="custom-checkInput__content">Short</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div className='row align-items-center mt-3'>
                                    <div className='col-4'>
                                        <p className="custom-checkInput__content">Quantity:</p>
                                    </div>
                                    <div className='col-6'>
                                        <div className={`${styles.fixedAmountField}`}>
                                            <InputWithCurrencyAndLabel
                                                id={'limitAmount'}
                                                name={'stopPrice'}
                                                onChange={(name, value) => {
                                                    getPorfitCalculation(formData.entryPrice, formData.exitPrice, value, formData.positionSide)
                                                    setFormData({ ...formData, ...{ quantity: value } })
                                                }}
                                                placeholder={'1'}
                                                type={'number'}
                                                value={formData.quantity}
                                                disabled={false}
                                                key={'limitAmount'}
                                                readOnly={false}
                                                currency={futureTradePair.baseCurrency}
                                                error={null}
                                                className={"InputTextThirdCurrencyAndLabel2"} />
                                        </div>
                                    </div>
                                </div>
                                {/* <div className='row align-items-center mt-2'>
                                    <div className='col-10 text-end'>
                                        <p className="custom-checkInput__content"> = 0.01 {"  "} Lot</p>
                                    </div>
                                </div> */}
                                <div className='row align-items-center mt-3'>
                                    <div className='col-4'>
                                        <p className="custom-checkInput__content">Entry Price:</p>
                                    </div>
                                    <div className='col-6'>
                                        <div className={`${styles.fixedAmountField}`}>
                                            <InputWithCurrencyAndLabel
                                                id={'limitAmount'}
                                                name={'stopPrice'}
                                                onChange={(name, value) => {
                                                    getPorfitCalculation(value, formData.exitPrice, formData.quantity, formData.positionSide)
                                                    setFormData({ ...formData, ...{ entryPrice: value } })
                                                }}
                                                placeholder={'1'}
                                                type={'number'}
                                                value={formData.entryPrice}
                                                disabled={false}
                                                key={'limitAmount'}
                                                readOnly={false}
                                                currency={futureTradePair.quoteCurrency}
                                                error={null}
                                                className={"InputTextThirdCurrencyAndLabel2"} />
                                        </div>
                                    </div>
                                </div>
                                <div className='row align-items-center mt-3'>
                                    <div className='col-4'>
                                        <p className="custom-checkInput__content">Exit Price:</p>
                                    </div>
                                    <div className='col-6'>
                                        <div className={`${styles.fixedAmountField}`}>
                                            <InputWithCurrencyAndLabel
                                                id={'limitAmount'}
                                                name={'stopPrice'}
                                                onChange={(name, value) => {
                                                    getPorfitCalculation(formData.entryPrice, value, formData.quantity, formData.positionSide)
                                                    setFormData({ ...formData, ...{ exitPrice: value } })
                                                }}
                                                placeholder={'1'}
                                                type={'number'}
                                                value={formData.exitPrice}
                                                disabled={false}
                                                key={'limitAmount'}
                                                readOnly={false}
                                                currency={futureTradePair.quoteCurrency}
                                                error={null}
                                                className={"InputTextThirdCurrencyAndLabel2"} />
                                        </div>
                                    </div>
                                </div>
                                {/* <div className='row align-items-center mt-3'>
                                    <div className='col-4'>
                                        <p className="custom-checkInput__content">Leverage:</p>
                                    </div>
                                    <div className='col-6'>
                                        <div className={`${styles.fixedAmountField}`}>
                                            <InputWithCurrencyAndLabel
                                                id={'limitAmount'}
                                                name={'stopPrice'}
                                                // onChange={(name, value) => {
                                                //     onChangeHandler('takeProfit', name, value)
                                                // }}
                                                placeholder={'1'}
                                                type={'number'}
                                                // value={2}
                                                disabled={false}
                                                key={'limitAmount'}
                                                readOnly={false}
                                                currency={"10x"}
                                                error={null}
                                                className={"InputTextThirdCurrencyAndLabel2"} />
                                        </div>
                                    </div>
                                </div> */}
                                {/* <div className='row mt-2'>
                                    <div className='col-4'></div>
                                    <div className='col-6'>
                                        <CustomRangeSlider />
                                        <input type="range" name="" id="" className='w-100' />
                                    </div>
                                </div> */}
                                {/* <div className='row align-items-center mt-3'>
                                    <div className='col-4'>
                                        <p className="custom-checkInput__content">Margin: </p>
                                    </div>
                                    <div className='col-4'>
                                        <p className="custom-checkInput__content">-</p>
                                    </div>
                                </div> */}
                                <div className='row align-items-center mt-3'>
                                    <div className='col-4'>
                                        <p className="custom-checkInput__content">Pnl:</p>
                                    </div>
                                    <div className='col-4'>
                                        <p className="custom-checkInput__content">{(!isNaN(PandL) && isFinite(PandL)) ? parseFloat(PandL).toFixed(futureTradePair.quoteDecimal) : 0}</p>
                                    </div>
                                </div>
                                {/* <div className='row align-items-center mt-3'>
                                    <div className='col-4'>
                                        <p className="custom-checkInput__content">ROE %:</p>
                                    </div>
                                    <div className='col-4'>
                                        <p className="custom-checkInput__content">-</p>
                                    </div>
                                </div> */}
                            </div>
                        }
                        {selectedTab == 'trade' &&
                            <div className=''>
                                {/* <div className='row align-items-center'>
                                    <div className='col-4'>
                                        <p className="custom-checkInput__content">
                                            Position:
                                        </p>
                                    </div>
                                    <div className='col-4'>
                                        <p className="custom-checkInput__content">
                                            -
                                        </p>
                                    </div>
                                </div> */}
                                <div className='row align-items-center mt-3'>
                                    <div className='col-4'>
                                        <p className="custom-checkInput__content">
                                            Avl. Margin:
                                        </p>
                                    </div>
                                    <div className='col-4'>
                                        <p className="custom-checkInput__content">{(wallet?.availableBalance)?.toFixed(2)} USD</p>
                                    </div>
                                </div>
                                <div className='row align-items-center mt-3'>
                                    <div className='col-4'>
                                        <p className="custom-checkInput__content">Entry Price:</p>
                                    </div>
                                    <div className='col-6'>
                                        <div className={`${styles.fixedAmountField}`}>
                                            <InputWithCurrencyAndLabel
                                                id={'limitAmount'}
                                                name={'entryPrice'}
                                                onChange={(name, value) => {
                                                    setFormData({ ...formData, ...{ entryPrice: value } })
                                                    CalculateQuantity(formData.percentage, value, formData.leverage)
                                                }}
                                                // placeholder={'1'}
                                                type={'number'}
                                                value={formData.entryPrice}
                                                disabled={false}
                                                key={'limitAmount'}
                                                readOnly={false}
                                                currency={futureTradePair.quoteCurrency}
                                                error={null}
                                                className={"InputTextThirdCurrencyAndLabel2"} />
                                        </div>
                                    </div>
                                </div>
                                <div className='row align-items-center mt-3'>
                                    <div className='col-4'>
                                        <p className="custom-checkInput__content">Margin:</p>
                                    </div>
                                    <div className='col-6'>
                                        <div className={`${styles.fixedAmountField}`}>
                                            <InputWithCurrencyAndLabel
                                                id={'limitAmount'}
                                                name={'stopPrice'}
                                                // onChange={(name, value) => {
                                                //     setFormData({ ...formData, ...{ percentage: value } })
                                                //     CalculateQuantity(value, formData.entryPrice, formData.leverage)
                                                // }}

                                                onChange={(name, value) => {
                                                    setFormData({ ...formData, ...{ percentage: value } })
                                                    const percent = (value / wallet?.availableBalance) * 100;  // 👈 convert back to %
                                                    CalculateQuantity(percent, formData.entryPrice, formData.leverage)
                                                }}

                                                // placeholder={'1'}
                                                type={'number'}
                                                value={formData.percentage}
                                                disabled={false}
                                                key={'limitAmount'}
                                                readOnly={false}
                                                currency={"USD"}
                                                error={null}
                                                className={"InputTextThirdCurrencyAndLabel2"} />
                                        </div>
                                    </div>
                                </div>
                                <div className='row mt-2'>
                                    <div className='col-4'></div>
                                    <div className='col-6'>
                                        {/* <CustomRangeSlider
                                            max={100}
                                            percentages={[0, 25, 50, 75, 100]}
                                            startingValue={formData.percentage}
                                            handleButtonClick={(percent) => {
                                                setFormData({ ...formData, ...{ percentage: percent } })
                                                CalculateQuantity(percent, formData.entryPrice, formData.leverage)
                                            }}
                                            handleSliderChange={(e) => {
                                                const rawValue = Number(e.target.value);
                                                const maxPercent = 100
                                                const percent = (rawValue / maxPercent) * 100;
                                                setFormData({ ...formData, ...{ percentage: percent } })
                                                CalculateQuantity(percent, formData.entryPrice, formData.leverage)
                                            }}
                                            labelSuffix="%"
                                        /> */}

                                        <CustomRangeSlider
                                            max={100}
                                            percentages={[0, 25, 50, 75, 100]}
                                            startingValue={(formData.percentage / wallet?.availableBalance) * 100}  // 👈 convert USD back to %
                                            handleButtonClick={(percent) => {
                                                const actualAmount = (wallet?.availableBalance * percent) / 100;
                                                setFormData({ ...formData, ...{ percentage: actualAmount } })
                                                CalculateQuantity(percent, formData.entryPrice, formData.leverage)
                                            }}
                                            handleSliderChange={(e) => {
                                                const percent = Number(e.target.value);
                                                const actualAmount = (wallet?.availableBalance * percent) / 100;
                                                setFormData({ ...formData, ...{ percentage: actualAmount } })
                                                CalculateQuantity(percent, formData.entryPrice, formData.leverage)
                                            }}
                                            labelSuffix="%"
                                        />
                                    </div>
                                </div>
                                <div className='row align-items-center mt-3'>
                                    <div className='col-4'>
                                        <p className="custom-checkInput__content">Leverage:</p>
                                    </div>
                                    <div className='col-6'>
                                        <div className={`${styles.fixedAmountField}`}>
                                            <InputWithCurrencyAndLabel
                                                id={'limitAmount'}
                                                name={'stopPrice'}
                                                onChange={(name, value) => {
                                                    setFormData({ ...formData, ...{ leverage: value } })
                                                    CalculateQuantity(formData.percentage, formData.entryPrice, value)
                                                }}
                                                placeholder={'1'}
                                                type={'number'}
                                                value={formData.leverage}
                                                disabled={false}
                                                key={'limitAmount'}
                                                readOnly={false}
                                                currency={"10x"}
                                                error={null}
                                                className={"InputTextThirdCurrencyAndLabel2"} />
                                        </div>
                                    </div>
                                </div>
                                <div className='row mt-2'>
                                    <div className='col-4'></div>
                                    <div className='col-6'>
                                        <CustomRangeSlider
                                            max={100}
                                            percentages={[0, 25, 50, 75, 100]}
                                            startingValue={formData.leverage}
                                            handleButtonClick={handleLeverageButtonClick}
                                            handleSliderChange={handleLeverageSliderChange}
                                        />
                                    </div>
                                </div>
                                <div className='row align-items-center mt-3'>
                                    <div className='col-4'>
                                        <p className="custom-checkInput__content">Trade Size: </p>
                                    </div>
                                    <div className='col-4'>
                                        <p className="custom-checkInput__content">{(!isNaN(quantity) && isFinite(quantity)) ? parseFloat(quantity).toFixed(futureTradePair.baseDecimal) : 0}</p>
                                    </div>
                                </div>
                            </div>
                        }
                        {selectedTab == 'target' &&
                            <div className=''>
                                {/* <div className='row align-items-center'>
                                    <div className='col-4'>
                                        <p className="custom-checkInput__content">
                                            Position:
                                        </p>
                                    </div>
                                    <div className='col-4'>
                                        <p className="custom-checkInput__content">
                                            -
                                        </p>
                                    </div>
                                </div> */}
                                <div className='row align-items-center mt-3'>
                                    <div className='col-4'>
                                        <p className="custom-checkInput__content">
                                            Avl. Margin:
                                        </p>
                                    </div>
                                    <div className='col-4'>
                                        <p className="custom-checkInput__content">{(wallet?.availableBalance)?.toFixed(2)}</p>
                                    </div>
                                </div>
                                <div className='row align-items-center mt-3'>
                                    <div className='col-4'>
                                        <p className="custom-checkInput__content">
                                            Trade:
                                        </p>
                                    </div>
                                    <div className='col-6'>
                                        <div className='row align-items-center'>
                                            <div className='col-2'>
                                                <p className="custom-checkInput__content"> Long </p>
                                            </div>
                                            <div className='col-3'>
                                                <div className="custom-toggle__primary">
                                                    <label className="switch">
                                                        <input
                                                            type="checkbox"
                                                            checked={formData.positionSide == 'short' ? true : false}
                                                            onChange={(e) => {
                                                                CalculateTargetPrice(formData.entryPrice, formData.leverage, formData.roe, e?.target?.checked ? 'short' : 'long')
                                                                setFormData({ ...formData, ...{ positionSide: e.target.checked ? 'short' : 'long' } })
                                                            }}
                                                        />
                                                        <span className="slider round"></span>
                                                    </label>
                                                </div>
                                            </div>
                                            <div className='col-2'>
                                                <p className="custom-checkInput__content">Short</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div className='row align-items-center mt-3'>
                                    <div className='col-4'>
                                        <p className="custom-checkInput__content">Leverage:</p>
                                    </div>
                                    <div className='col-6'>
                                        <div className={`${styles.fixedAmountField}`}>
                                            <InputWithCurrencyAndLabel
                                                id={'limitAmount'}
                                                name={'stopPrice'}
                                                onChange={(name, value) => {
                                                    setFormData({ ...formData, ...{ leverage: value } })
                                                    CalculateTargetPrice(formData.entryPrice, value, formData.roe, formData.positionSide)
                                                }}
                                                placeholder={'1'}
                                                type={'number'}
                                                value={formData.leverage}
                                                disabled={false}
                                                key={'limitAmount'}
                                                readOnly={false}
                                                currency={"10x"}
                                                error={null}
                                                className={"InputTextThirdCurrencyAndLabel2"} />
                                        </div>
                                    </div>
                                </div>
                                <div className='row mt-2'>
                                    <div className='col-4'></div>
                                    <div className='col-6'>
                                        <CustomRangeSlider
                                            max={100}
                                            percentages={[0, 25, 50, 75, 100]}
                                            startingValue={formData.leverage}
                                            handleButtonClick={handleLeverageButtonClick}
                                            handleSliderChange={handleLeverageSliderChange}
                                        />
                                        {/* <input type="range" name="" id="" className='w-100' /> */}
                                    </div>
                                </div>
                                <div className='row align-items-center mt-3'>
                                    <div className='col-4'>
                                        <p className="custom-checkInput__content">Entry Price:</p>
                                    </div>
                                    <div className='col-6'>
                                        <div className={`${styles.fixedAmountField}`}>
                                            <InputWithCurrencyAndLabel
                                                id={'limitAmount'}
                                                name={'stopPrice'}
                                                onChange={(name, value) => {
                                                    setFormData({ ...formData, ...{ entryPrice: value } })
                                                    CalculateTargetPrice(value, formData.leverage, formData.roe, formData.positionSide)
                                                }}
                                                placeholder={'1'}
                                                type={'number'}
                                                // value={2}
                                                disabled={false}
                                                key={'limitAmount'}
                                                readOnly={false}
                                                currency={"USD"}
                                                error={null}
                                                className={"InputTextThirdCurrencyAndLabel2"} />
                                        </div>
                                    </div>
                                </div>
                                <div className='row align-items-center mt-3'>
                                    <div className='col-4'>
                                        <p className="custom-checkInput__content">ROE %:</p>
                                    </div>
                                    <div className='col-6'>
                                        <div className={`${styles.fixedAmountField}`}>
                                            <InputWithCurrencyAndLabel
                                                id={'limitAmount'}
                                                name={'stopPrice'}
                                                onChange={(name, value) => {
                                                    setFormData({ ...formData, ...{ roe: value } })
                                                    CalculateTargetPrice(formData.entryPrice, formData.leverage, value, formData.positionSide)
                                                }}
                                                // placeholder={'1'}
                                                type={'number'}
                                                value={formData.roe}
                                                disabled={false}
                                                key={'limitAmount'}
                                                readOnly={false}
                                                // currency={"10x"}
                                                error={null}
                                                className={"InputTextThirdCurrencyAndLabel2"} />
                                        </div>
                                    </div>
                                </div>
                                <div className='row align-items-center mt-3'>
                                    <div className='col-4'>
                                        <p className="custom-checkInput__content">Trade Size: </p>
                                    </div>
                                    <div className='col-4'>
                                        <p className="custom-checkInput__content">{isNaN(targetPrice) ? 0 : targetPrice}</p>
                                    </div>
                                </div>
                            </div>
                        }
                        {/* <div className='mt-5 flexEnd'>
                            <Button
                                isLoading={false}
                                loadingText="Redirecting..."
                                btnText="Confirm"
                                disabled={!isOpen && !isStop}
                                onClick={() => cancelAllOrders()}
                                className="cardSuccessBtnSm"
                                selectedValue={null}
                            />
                        </div> */}
                    </div>
                </Modal.Body>
            </Modal>
        </div>
    );
};



export default CalculatorModal;