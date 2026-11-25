
/** PACKAGE IMPORT */

import React, { useEffect, useRef, useState } from 'react';
import { Modal } from "react-bootstrap";
import { IoClose } from "react-icons/io5";
import Select from 'react-select'
import isEmpty from 'is-empty';
import { useDispatch, useSelector } from "react-redux";

/** LOCAL FILES IMPORT */

import styles from "../styles/modal.module.css";
import Button from '../../../components/Button/Button';
import { InputComponent, InputWithSelectOption, PrimaryInput } from '../../../components/Input/InputFields';
import { showToastMessage } from '../../../lib/toast';

/** ACTIONS */
import { futureClosePosition } from '../../../actions/futureActions';
import { LotToquantity, quantityToLot } from '../../../lib/calculation';

/** CODE START */

const initialState = {
    price: 0,
    quantity: 0,
    percentage: 0,
    typeTIF: ""
}
const CloseOrderByChart = ({ show, handleClose, record, onConfirm, isLoading: externalLoading }) => {
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
            // Delegate to the parent-supplied onConfirm handler.
            // TradingViewChart.handleClosePositionConfirm makes the REST call and
            // shows success/error toasts, so we don't duplicate that logic here.
            if (!onConfirm) return;

            const data = {
                pairId: record?.pairId,
                positionSide: record?.positionSide,
                quantity: record?.quantity ?? record?.positionFilled,
                price: record?.price ?? record?.close_price,
                typeTIF: record?.typeTIF || '',
                onConfirmed: () => {
                    onClose();
                    record?.onConfirmed?.();
                },
            };

            await onConfirm(data);
            // onClose is called inside onConfirmed callback above on success;
            // on failure the parent toast fires and modal stays open.
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
                // VENKATESH
                const base = parseFloat(record?.positionFilled);
                let percentage = (parseFloat(quantity) / base) * 100;
                percentage = isNaN(percentage) || !isFinite(percentage) ? 0 : percentage;
                percentage = parseFloat(percentage.toFixed(2));
                // VENKATESH
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

    // console.log("formData_det", formData, errors, isLoading)

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
                        {/* <div className={styles.modalTabs}>
                            <button
                                aria-label='market'
                                className={`${currentType == 'market' ? styles.active : ''}`}
                                onClick={() => setCurrentType('market')}>Market</button>
                            <button
                                aria-label='limit'
                                className={`${currentType == 'limit' ? styles.active : ''}`}
                                onClick={() => setCurrentType('limit')}>Limit</button>
                        </div> */}

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
                                isLoading={externalLoading ?? isLoading}
                                loadingText="Loading..."
                                btnText="Confirm"
                                onClick={closingPositionOrder}
                                className="cardSuccessBtnSm"
                                selectedValue={null}
                            />
                        </div>
                    </div>
                </Modal.Body>
            </Modal>
        </div>
    );
};

export default CloseOrderByChart;
