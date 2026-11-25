import React, { useEffect, useState } from 'react';
import { Modal } from "react-bootstrap";
import { IoClose, IoSwapVertical } from "react-icons/io5";
import styles from "../styles/modal.module.css";
import Button from '../../../components/Button/Button';
import { InputComponent, InputWithCurrencyAndLabel } from '../../../components/Input/InputFields';
import { IoIosArrowBack, IoIosArrowForward } from 'react-icons/io';
import Select from 'react-select';
import { useSelector } from "react-redux";
import isEmpty from 'is-empty';
import { showToastMessage } from '../../../lib/toast';
import { walletTransferHooks } from '../../../actions/walletAction';
import { useGlobalContext } from '../../../context/GlobalProvider';

/** Actions */

const initialState = {
    amount: "",
    transferTo: "",
    transferFrom: "",
    symbol: "INR"
}
const TransferFundModel = ({ show, handleClose }) => {
    const { convertValue, convertTo } = useGlobalContext();


    const [source, setSource] = useState(null);
    const [destination, setDestination] = useState(null);
    const [isSwap, setIsSwap] = useState(null);
    const [sourceOption, setSourceOption] = useState([])
    const [DestinyOption, setDestinyOption] = useState([])
    const [SubOption, setSubOption] = useState([])
    const [formData, setFormData] = useState(initialState)
    const [errors, setErrors] = useState({})
    const [isLoading, setisLoading] = useState(false);
    const [isMax, setIsMax] = useState(false);
    const { userdetails, subAccountList } = useSelector((state) => state.user);

    const handleSwap = () => {
        try {
            setSource(destination);
            setDestination(source);
            setFormData({
                ...formData,
                transferFrom: destination.value,
                transferTo: source.value
            })
            setIsSwap(!isSwap);
        } catch (err) {
            console.log('handleSwap__err', err)
        }

    };

    const onChangeHandler = (name, value) => {
        try {
            // const { name, value } = event.target
            const numbers = /^[+]?([0-9]+(?:\.[0-9]*)?|\.[0-9]+)$/;
            if (['amount'].includes(name)) {
                setIsMax(false)
                if (value !== "" && !numbers.test(value)) return false;
            }
            setFormData((prev) => ({ ...prev, [name]: value }))
            delete errors?.amount
        } catch (err) {
            console.log(err, "onChangeHandler___err")
        }
    }

    const onClose = () => {
        try {
            setFormData(initialState)
            setErrors({})
            // BUG FIX: was reset to {} instead of null — react-select then
            // treats {} as "a value IS selected" (an object with no
            // label/value), rendering the field blank instead of showing
            // the placeholder text on the next time this modal is opened.
            setDestination(null)
            setSource(null)
            setSourceOption([])
            setDestinyOption([])
            setIsSwap(null)
            setisLoading(false)
            handleClose()
        } catch (err) {
            console.log(err, "onClose___err")
        }
    }


    const onSubmit = async () => {
        try {
            setisLoading(true)
            let amount = formData.amount
            if (isMax) {
                amount = convertTo(source?.availableBalance, "USD", "INR")
            }
            const { status, message, error } = await walletTransferHooks({ ...formData, amount: amount }, userdetails?.secretKey)
            if (status) {
                showToastMessage(message, 'success')
                onClose()
                return
            }
            setisLoading(false)
            setErrors(error)
            !isEmpty(message) && showToastMessage(message, 'error')
        } catch (err) {
            setisLoading(false)
            console.log(err, "onSubmit__err")
        }
    }

    useEffect(() => {
        if (!isEmpty(subAccountList)) {
            let option = subAccountList?.reduce((Options = [], val) => {
                let obj = {
                    label: val.accountName,
                    value: val.accountId,
                    balance: val.balance,
                    availableBalance: val.availableBalance
                }
                Options.push(obj)
                return Options
            }, [])
            setSubOption(option)
            setSourceOption(option)
            setSource(option[0])
            setDestinyOption(option.filter((val) => { return val?.value != option[0]?.value }))
            setFormData({ ...formData, transferFrom: option[0].value })
        }

    }, [subAccountList, show])

    return (
        <Modal
            centered
            size="md"
            backdrop="static"
            show={show}
            onHide={onClose}
            className={styles.modalPrimary}
        >
            <Modal.Header className={styles.modalPrimaryHeader}>
                <div className={styles.calcModalTabs}>
                    <h4 className={`${styles.modalHeaderTitle} `}>Transfer Funds between subaccounts </h4>
                </div>
                <button
                    aria-label='closeIcon'
                    className={styles.modalCloseButton}
                    onClick={onClose}
                >
                    <IoClose />
                </button>
            </Modal.Header>
            <Modal.Body className={`${styles.modalPrimaryBody} pt-0`}>
                <div className={styles.modalPrimaryBodyContainer}>
                    <div>
                        <div className="d-flex flex-column gap-2">
                            <div className="react-select__width">
                                <label className={styles.modalLabel}>Source Account</label>
                                <Select
                                    classNamePrefix="react-select__eighth"
                                    placeholder="Select source account"
                                    options={sourceOption}
                                    value={source}
                                    onChange={(selected) => {
                                        setSource(selected)
                                        setFormData({ ...formData, transferFrom: selected.value })
                                        let DestinyOption = [...SubOption].filter((val) => {
                                            return selected.value != val.value
                                        })
                                        setDestinyOption(DestinyOption)
                                        delete errors?.transferFrom
                                    }}
                                />
                                {errors && <p className={`text-danger mt-2`}>{errors.transferFrom}</p>}
                            </div>

                            <button
                                type="button"
                                className={`${styles.swapBtn} ${isSwap ? styles.isActive : ""}`}
                                onClick={handleSwap}
                            >
                                <IoSwapVertical />
                            </button>

                            <div className="react-select__width">
                                <label className={styles.modalLabel}>Destination Account</label>
                                <Select
                                    classNamePrefix="react-select__eighth"
                                    placeholder="Select destination account"
                                    options={DestinyOption}
                                    value={destination}
                                    onChange={(selected) => {
                                        setDestination(selected)
                                        setFormData({
                                            ...formData,
                                            transferTo: selected.value
                                        })
                                        let sourceOption = [...SubOption].filter((val) => {
                                            return selected.value != val.value
                                        })
                                        setSourceOption(sourceOption)
                                        delete errors?.transferTo
                                    }}
                                />
                                {errors && <p className={`text-danger mt-2`}>{errors.transferTo}</p>}
                            </div>
                        </div>
                        {/* <div className='d-flex flex-column gap-2'>
                                <div className={`react-select__width `}>
                                    <label className={`${styles.modalLabel}`} htmlFor="">Source Account</label>
                                    <Select
                                        classNamePrefix="react-select__eighth"
                                        options={optionList1}
                                        onChange={() => { }}
                                    />
                                </div>
                                <button className={styles.swapBtn}>
                                    <IoSwapVertical />
                                </button>
                                <div className={`react-select__width `}>
                                    <label className={`${styles.modalLabel}`} htmlFor="">Destination Account</label>
                                    <Select
                                        classNamePrefix="react-select__eighth"
                                        options={optionList2}
                                        onChange={() => { }}
                                    />
                                </div>
                            </div> */}

                        <hr className={`${styles.deviderText} my-5`} />
                        <div className='w-100'>
                            <div className={`${styles.modalLabel} d-flex align-items-center gap-2 justify-content-between mb-3`}>
                                <label htmlFor="">Amount</label>
                                <div className='d-flex align-items-center gap-2'>
                                    <label htmlFor="">Avail. Balance {
                                        convertValue(source?.availableBalance)
                                    }</label>
                                    <span>
                                        <Button
                                            // BUG FIX: this shared the submit button's `isLoading` state,
                                            // so clicking "Transfer Now" showed both buttons as
                                            // "Loading..." simultaneously. "Max" only sets local form
                                            // state synchronously — it never has anything to load.
                                            isLoading={false}
                                            loadingText="Loading..."
                                            btnText={"Max"}
                                            className='successFillRectangleBtnsm'
                                            staticClass='fs16'
                                            onClick={() => {
                                                setIsMax(true)
                                                let amount = convertTo(source?.availableBalance, "USD", "INR")
                                                setFormData((prev) => ({ ...prev, ['amount']: parseFloat(amount).toFixed(2) }))
                                                delete errors?.amount
                                            }}
                                        />
                                    </span>


                                </div>
                            </div>
                            <InputWithCurrencyAndLabel
                                staticClass='w-100'
                                currency={"INR"}
                                // label={"$80 = $0.94"}
                                placeholder="Enter amount"
                                value={formData.amount}
                                // value={isEmpty(formData.amount) ? "" : parseFloat(formData?.amount)?.toFixed(2)}
                                name='amount'
                                id='amount'
                                error={errors?.amount}
                                onChange={onChangeHandler}
                            />
                        </div>
                        <div className='mt-3'>
                            <Button
                                isLoading={isLoading}
                                loadingText="Loading..."
                                btnText={"Transfer Now"}
                                className='successFillRectangleBtn'
                                staticClass='fs16'
                                onClick={() => onSubmit()}
                            />
                        </div>
                    </div>
                </div>
            </Modal.Body>
        </Modal>
    );


}

export default TransferFundModel;