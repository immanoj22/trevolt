
/** PACKAGE IMPORT */

import React, { useEffect, useRef, useState } from 'react';
import { Modal } from "react-bootstrap";
import { IoClose } from "react-icons/io5";
import Select from 'react-select'
import isEmpty from 'is-empty';
import { useDispatch, useSelector } from "react-redux";

/** LOCAL FILES IMPORT */

import styles from "../../futuresTrading/styles/modal.module.css";
import Button from '../../../components/Button/Button';
import { InputComponent, InputWithSelectOption, PrimaryInput } from '../../../components/Input/InputFields';
import { showToastMessage } from '../../../lib/toast';

/** ACTIONS */
import { futureClosePosition } from '../../../actions/futureActions';
import { LotToquantity, quantityToLot } from '../../../lib/calculation';

/** CODE START */

/**
 * Copy Trading's own "Close order" modal — split out from
 * futuresTrading/modal/CloseOrder.jsx so a fix scoped to Copy Trading (sending
 * copierDetailsId, taken from the specific position row being closed, since a
 * copier can follow more than one strategy on the same pair — see
 * COPYTRADE_FIX_ROADMAP.md Step 1/2/3) never touches the shared Future Trading
 * component.
 */
const initialState = {
    price: 0,
    quantity: 0,
    percentage: 0,
    typeTIF: ""
}
const CloseOrder = ({ show, handleClose, record, strategyData }) => {
    const { futureTradePair } = useSelector((state) => state.future);
    const { userdetails } = useSelector((state) => state.user);

    const [currentType, setCurrentType] = useState('market')
    const [formData, setFormData] = useState(initialState)
    const [errors, setErrors] = useState({});
    const [isLoading, setIsLoading] = useState(false);
    const [quantityIn, setQuantityIn] = useState('lot');
    const [lotQuantity, setlotQuantity] = useState('');


    const tifOptions = [
        { value: "GTC", label: "GTC", },
        { value: "IOC", label: "IOC", },
        { value: "FOK", label: "FOK" },
        // { value: "GTD", label: "GTD" }
    ]

    const balbtn = [
        {
            value: 5
        },
        {
            value: 10
        },
        {
            value: 25,
        },
        {
            value: 50,
        },
        {
            value: 75,
        },
        {
            value: 100,
        }
    ]

    const closingPositionOrder = async () => {
        try {
            setIsLoading(true)
            const error = {}

            if (currentType === 'limit' && isEmpty(formData.price)) {
                error.price = 'Price is required';
            }
            if (isEmpty(formData.quantity)) {
                error.quantity = 'Quantity is required';
            } else if (Number(formData.quantity) == 0) {
                error.quantity = 'Quantity is required';
            }
            if (Object.keys(error).length > 0) {
                setIsLoading(false)
                setErrors(error);
                return;
            }

            const data = {
                pairId: record?.pairId,
                positionSide: record?.positionSide,
                quantity: formData?.quantity,
                orderType: currentType,
                price: formData?.price,
                typeTIF: formData?.typeTIF,
                // Prefer the specific position row's own traderId/traderAccountId over
                // the page-level strategyData, and always send copierDetailsId — the
                // page-level traderId/traderAccountId alone can't tell two strategies
                // on the same pair apart, but this position row's own identity can.
                traderId: record?.traderId ?? strategyData?.traderId ?? '',
                traderAccountId: record?.traderAccountId ?? strategyData?.traderAccountId ?? '',
                copierDetailsId: record?.copierDetailsId ?? '',
                isCopier: true
            }
            let closeRes = await futureClosePosition(data, userdetails.secretKey);
            setIsLoading(false)
            if (closeRes.status) {
                !isEmpty(closeRes.message) && showToastMessage(closeRes.message, 'success')
                onClose()
            } else if (!closeRes.status) {
                !isEmpty(closeRes.message) && showToastMessage(closeRes.message, 'error')
                setErrors(closeRes.errors)
            }
        } catch (err) {
            console.log(err, "closingPositionOrder__err");
        }
    };

    const changePercentage = (percentage) => {
        try {
            let quantity = parseFloat(record?.positionFilled) * (parseFloat(percentage) / 100)
            quantity = isNaN(quantity) || !isFinite(quantity) ? 0 : quantity
            quantity = parseFloat(quantity).toFixed(record?.pairData?.baseDecimal)
            if (parseFloat(quantity) < parseFloat(record?.pairData?.minAmount)) {
                setErrors({ ...errors, 'quantity': "Quantity must be greater than minimum quantity" })
            } else {
                delete errors.quantity
                setErrors(errors)
            }
            if (quantityIn == 'lot') {
                let lot = quantityToLot(quantity, record?.pairData?.minAmount, record?.pairData?.baseDecimal)
                setlotQuantity(lot)
            } else {
                setlotQuantity(quantity)
            }
            setFormData({ ...formData, ...{ quantity: quantity, percentage: percentage } })
        } catch (err) {
            console.log(err, 'ChangePercentage__Err')
        }
    }

    const onChangeHandler = (event) => {
        try {
            const { name, value } = event.target
            let numbers = /^[+]?([0-9]+(?:[\.][0-9]*)?|\.[0-9]+)$/;
            let error = {}
            if (['price', 'quantity'].includes(name) && !numbers.test(value) && value !== "") {
                return false
            }
            if (name === 'quantity') {
                let quantity = value
                if (quantityIn == 'lot') {
                    const decimal = /^[+]?[0-9]+$/
                    if (value !== "" && !decimal.test(value)) return false;
                    let maxLot = quantityToLot(record?.pairData?.maxAmount, record?.pairData?.minAmount, record?.pairData?.baseDecimal)
                    let minLot = quantityToLot(record?.pairData?.minAmount, record?.pairData?.minAmount, record?.pairData?.baseDecimal)
                    if (parseFloat(value) < parseFloat(minLot) || parseFloat(value) > parseFloat(maxLot)) {
                        return false
                    }
                    quantity = LotToquantity(value, record?.pairData?.minAmount, record?.pairData?.baseDecimal)
                }
                setlotQuantity(value)
                const base = parseFloat(record?.positionFilled);
                let percentage = (parseFloat(quantity) / base) * 100;
                percentage = isNaN(percentage) || !isFinite(percentage) ? 0 : percentage;
                percentage = parseFloat(percentage.toFixed(2));
                setFormData({ ...formData, ...{ [name]: quantity, percentage: percentage } })
                setErrors({ ...errors, ...{} })
                return false
            }
            setFormData({ ...formData, ...{ [name]: value } })
            setErrors({ ...errors, ...{} })
        } catch (e) {
            console.log("onChangeHandler_err", e);
        }
    }

    const onClose = () => {
        try {
            setCurrentType('market')
            setFormData(initialState)
            setErrors({})
            setIsLoading(false)
            setQuantityIn('lot')
            setlotQuantity('')
            handleClose()
        } catch (err) {
            console.log(err, "onClose___err")
        }
    }

    useEffect(() => {
        if (isEmpty(record)) return
        setFormData({
            ...formData,
            ...{
                quantity: record.positionFilled,
                price: record?.close_price,
                percentage: 100
            }
        })
        let lotQuantity = record.positionFilled
        if (quantityIn == 'lot') {
            lotQuantity = quantityToLot(lotQuantity, record?.pairData?.minAmount, record?.pairData?.baseDecimal)
        }
        setlotQuantity(lotQuantity)
    }, [record])

    useEffect(() => {
        if (!isEmpty(formData.quantity)) {
            let lotQuantity = formData.quantity
            if (quantityIn == 'lot') {
                lotQuantity = quantityToLot(lotQuantity, record?.pairData?.minAmount, record?.pairData?.baseDecimal)
            }
            setlotQuantity(lotQuantity)
        }
    }, [quantityIn])

    return (
        <div>
            <Modal
                centered
                size="md"
                backdrop="static"
                show={show}
                onHide={onClose}
                className={styles.modalPrimary}
            >
                <Modal.Header className={styles.modalPrimaryHeader}>
                    <h4 className={`${styles.modalHeaderTitle} `}>Close order</h4>
                    <button
                        aria-label='closeIcon'
                        className={styles.modalCloseButton}
                        onClick={onClose}
                    >
                        <IoClose />
                    </button>
                </Modal.Header>
                <Modal.Body className={styles.modalPrimaryBody}>
                    <div className={styles.modalPrimaryBodyContainer}>
                        <div className={styles.modalTabs}>
                            <button
                                aria-label='market'
                                className={`${currentType == 'market' ? styles.active : ''}`}
                                onClick={() => setCurrentType('market')}>Market</button>
                            <button
                                aria-label='limit'
                                className={`${currentType == 'limit' ? styles.active : ''}`}
                                onClick={() => setCurrentType('limit')}>Limit</button>
                        </div>

                        {currentType === 'market' ?
                            <div className={`mt-4`}>

                                <div className={`${styles.modalFormContainer} mt-3`}>
                                    <label className={styles.modalLabel}>Enter quantity</label>
                                    <InputWithSelectOption
                                        id={'limitQuantity'}
                                        name={'quantity'}
                                        onChange={(name, value) => {
                                            onChangeHandler({
                                                target: {
                                                    name: name,
                                                    value: value
                                                }
                                            })
                                        }}
                                        type={'text'}
                                        value={lotQuantity}
                                        disabled={false}
                                        key={'limitQuantity'}
                                        readOnly={false}
                                        label={`1 Lot = ${record?.pairData?.minAmount} ${record?.pairData?.baseCurrency}`}
                                        className={"InputWithCurrencyAndLabel"}
                                        selectOption={[
                                            {
                                                label: "LOT", value: 'lot'
                                            },
                                            {
                                                label: record?.pairData?.baseCurrency, value: record?.pairData?.baseCurrency
                                            },
                                        ]}
                                        selectedValue={quantityIn}
                                        onSelect={(value) => {
                                            setQuantityIn(value)
                                        }}
                                    />
                                    <span>{errors?.quantity}</span>
                                </div>
                                <div className={styles.modalFormContainer}>
                                    <label className={styles.modalLabel}>Select Percentage <span className={`${styles.themeHighlight} ms-1`}>{formData.percentage}%</span></label>
                                    <div className={styles.percentageContainer}>
                                        {balbtn.map((e) =>
                                            <button
                                                key={e.value}
                                                aria-label='percentage'
                                                className={`${e?.value === formData.percentage ? styles.active : ''}`}
                                                onClick={() => { changePercentage(e?.value) }}>
                                                {e?.value}
                                            </button>)
                                        }
                                    </div>
                                </div>

                                <div className='mt-5 flexEnd'>
                                    <Button
                                        isLoading={false}
                                        loadingText="Redirecting..."
                                        btnText="Cancel"
                                        onClick={() => onClose()}
                                        className="cardBtnRectangleSm"
                                        selectedValue={null}
                                    />
                                    <Button
                                        isLoading={isLoading}
                                        loadingText="Loading..."
                                        btnText="Confirm"
                                        onClick={closingPositionOrder}
                                        className="cardSuccessBtnSm"
                                        selectedValue={null}
                                    />
                                </div>
                            </div>
                            :
                            <div className={`mt-4`}>
                                <div className={styles.modalFormContainer}>
                                    <label className={styles.modalLabel}>Price</label>
                                    <PrimaryInput
                                        type="text"
                                        id="price"
                                        name={"price"}
                                        value={formData.price}
                                        onChange={onChangeHandler}
                                        error={null}
                                        className={'primaryInputBgTwo'} />
                                    <span>{errors?.price}</span>
                                </div>

                                <div className={`${styles.modalFormContainer} mt-3`}>
                                    <label className={styles.modalLabel}>Enter quantity</label>
                                    <InputWithSelectOption
                                        id={'limitQuantity'}
                                        name={'quantity'}
                                        onChange={(name, value) => {
                                            onChangeHandler({
                                                target: {
                                                    name: name,
                                                    value: value
                                                }
                                            })
                                        }}
                                        type={'text'}
                                        value={lotQuantity}
                                        disabled={false}
                                        key={'limitQuantity'}
                                        readOnly={false}
                                        label={`1 Lot = ${record?.pairData?.minAmount} ${record?.pairData?.baseCurrency}`}
                                        className={"InputWithCurrencyAndLabel"}
                                        selectOption={[
                                            {
                                                label: "LOT", value: 'lot'
                                            },
                                            {
                                                label: record?.pairData?.baseCurrency, value: record?.pairData?.baseCurrency
                                            },
                                        ]}
                                        selectedValue={quantityIn}
                                        onSelect={(value) => {
                                            setQuantityIn(value)
                                        }}
                                    />
                                    <span>{errors?.quantity}</span>
                                </div>
                                <div className={`${styles.modalFormContainer} mt-1`}>
                                    <label className={styles.modalLabel}>Select Percentage <span className={`${styles.themeHighlight} ms-1`}>{formData.percentage}%</span></label>
                                    <div className={styles.percentageContainer}>
                                        {balbtn.map((e) =>
                                            <button
                                                key={e.value}
                                                aria-label='percentage'
                                                className={`${e?.value === formData.percentage ? styles.active : ''}`}
                                                onClick={() => { changePercentage(e?.value) }}>
                                                {e?.value}
                                            </button>)
                                        }
                                    </div>
                                </div>

                                <div className='mt-5 flexEnd'>
                                    <Button
                                        isLoading={false}
                                        loadingText="Loading..."
                                        btnText="Cancel"
                                        onClick={() => onClose()}
                                        className="cardBtnRectangleSm"
                                        selectedValue={null}
                                    />
                                    <Button
                                        isLoading={isLoading}
                                        loadingText="Loading..."
                                        btnText="Confirm"
                                        onClick={(e) => { closingPositionOrder(e) }}
                                        className="cardSuccessBtnSm"
                                        selectedValue={null}
                                    />
                                </div>
                            </div>
                        }
                    </div>
                </Modal.Body>
            </Modal>
        </div>
    );
};

export default CloseOrder;
