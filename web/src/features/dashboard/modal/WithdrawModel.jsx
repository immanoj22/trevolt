/** PACKAGE IMPORT */

import React, { useEffect, useRef, useState } from "react";
import { Modal } from "react-bootstrap";
import { IoClose } from "react-icons/io5";
import Countdown, { zeroPad } from "react-countdown";

/** LOCAL FILES IMPORT */

import styles from "../styles/modal.module.css"
import { InputComponent, InputWithCurrencyAndLabel } from "../../../components/Input/InputFields";
import Button from "../../../components/Button/Button";
import { useSelector } from "react-redux";
import { feeManagment } from "../../../calculation/calculationlib";
import { fiatWithdrawRequestHooks, getWithdrawCodeHooks } from "../../../actions/walletAction";
import { showToastMessage } from "../../../lib/toast";
import { useNavigate } from "react-router-dom";
import isEmpty from "is-empty";
import Select from 'react-select'
import BankDetails from "../components/BankDetails";


/** ACTIONS */


const WithdrawModel = (props) => {

    const { show, handleClose, bankData, currencyData } = props;

    const { assetdetail } = useSelector((state) => state.wallet);
    const { userdetails, subAccountList } = useSelector((state) => state.user);
    const [balance, setBalance] = useState(0);
    const [amount, setAmount] = useState(0);
    const [currencyDet, setCurrencyDet] = useState({});
    const [finalAmount, setFinalAmount] = useState(0);
    const [otp, setOtp] = useState(0);
    const [errors, setErrors] = useState({})
    const [accountId, setAccountId] = useState("");
    const [subOptions, setsubOptions] = useState([]);
    const [isResubmit, setIsResubmit] = useState(false);
    const [expireIn, setExpireIn] = useState(0);
    const [isLoading, setIsLoading] = useState(false);


    let regex = /^[0-9]+$/;
    let navigate = useNavigate();

    useEffect(() => {
        let selectedcurrency = assetdetail.find((el) => el.currencySymbol == currencyData?.currencySymbol);
        // setBalance(selectedcurrency?.balance);
        setCurrencyDet(selectedcurrency);
    }, [currencyData, assetdetail]);

    const handleChange = async (value) => {
        if (balance >= value) {
            setAmount(value);
            if (value != "") {
                const { totalFee } = await feeManagment(value, currencyData, true);
                const finalAmount = parseFloat(value) - parseFloat(totalFee);
                setFinalAmount(finalAmount);
            } else {
                setFinalAmount(0)
            }
        }
    }

    const renderer = ({ days, hours, minutes, seconds, completed }) => {
        if (completed) {
            setExpireIn(0)
            setIsResubmit(true)
        } else {
            return <span className="">
                {zeroPad(minutes)}m : {zeroPad(seconds)}s
            </span>
        }
    }

    const sendOtp = async () => {
        try {
            let resp = await getWithdrawCodeHooks(userdetails?.secretKey);
            let result = resp?.data;
            if (result?.status == "google") {
                showToastMessage(result?.message, "success")
            } else {
                if (!result?.success) {
                    showToastMessage(result?.message, "error")
                } else {
                    setExpireIn(Date.now() + 60000) //Date.now() + 5 * (60000)
                    showToastMessage(result?.message, "success")
                }
            }
        } catch (e) {
            console.log('sendOtp__Err', e)
        }
    }

    // console.log('currencyDetcurrencyDetcurrencyDet', currencyDet)

    const withdraw = async () => {
        try {
            setIsLoading(true)
            let reqData = { accountId: accountId, amount: amount, currencyId: currencyData?._id, bankId: bankData?._id, otp: otp }
            let resp = await fiatWithdrawRequestHooks(reqData, userdetails?.secretKey);
            let result = resp?.data;
            if (result?.success) {
                setIsLoading(false)
                showToastMessage(result?.message, "success");
                navigate("/dashboard")
            } else if (!result?.success) {
                setIsLoading(false)
                if (Object.values(result?.errors).length > 0) {
                    if (result?.errors?.otp) {
                        showToastMessage(result?.errors?.otp, "error")
                    } else {
                        setErrors(result?.errors)
                        // showToastMessage(result?.errors?.otp, "error")
                    }

                }
                if (result?.message) {
                    showToastMessage(result?.message, "error")
                }
            }
        } catch (e) {
            setIsLoading(false)
            console.log("withdraw__Err", e)
        }
    }
    const closeMod = () => {
        handleClose()
        setOtp(0)
        setAmount(0)
        setFinalAmount(0)
    }

    useEffect(() => {
        setExpireIn(0)
        setIsResubmit(false)
        if (!isEmpty(subAccountList)) {
            let mainAccount = subAccountList.find((val) => (val.isPrimary == true))
            if (!isEmpty(mainAccount)) {
                setAccountId(mainAccount.accountId)
                setBalance(mainAccount.balance)
            }
            let option = subAccountList.reduce((Options = [], val) => {
                let obj = {
                    label: val.accountName,
                    value: val.accountId,
                    balance: val.balance,
                }
                Options.push(obj)
                return Options
            }, [])
            setsubOptions(option)
        }
    }, [subAccountList])



    return (
        <div>
            <Modal
                centered
                size="md"
                backdrop="static"
                show={show}
                onHide={() => closeMod()}
                className={styles.modalPrimary}
            >
                <button
                    aria-label="closeIcon"
                    className={styles.modalCloseButton}
                    onClick={() => closeMod()}
                >
                    <IoClose />
                </button>
                <Modal.Header className={styles.modalPrimaryHeader}>
                    <h4 className={`${styles.modalHeaderTitle} `}>Withdraw</h4>
                </Modal.Header>
                <Modal.Body className={styles.modalPrimaryBody}>
                    <div className={styles.withdrawModelContent}>
                        <div className={`react-select__width mb-3`}>
                            <Select
                                placeholder="Select"
                                classNamePrefix="react-select__eighth"
                                options={subOptions}
                                value={subOptions.find((el) => el.value === accountId)}
                                onChange={(e) => {
                                    setAccountId(e.value)
                                    setBalance(e.balance)
                                }}
                            />
                            {errors?.accountId && <p className={`text-danger mt-2`}>{errors?.accountId}</p>}
                        </div>
                        <div className={styles.inputWrapper}>
                            <label htmlFor="">Amount</label>
                            <InputWithCurrencyAndLabel
                                type="text"
                                currency={currencyData?.currencySymbol}
                                id="amount"
                                value={amount}
                                placeholder={"0"}
                                onChange={(e, value) => {
                                    let numbers = /^[+]?([0-9]+(?:[\.][0-9]*)?|\.[0-9]+)$/;
                                    if (!numbers.test(value) && value !== "") {
                                        return false
                                    }
                                    handleChange(value)
                                }}
                                error={errors?.amount} />
                        </div>
                        <div className={styles.walletBalancetext}>
                            <p>Account balance : <span> {parseFloat(balance).toFixed(2)} {currencyData?.currencySymbol}</span></p>
                        </div>
                        <div className="d-flex gap-2">
                            <div className={styles.inputWrapper}>
                                <label htmlFor="">Withdraw Amount With Fee</label>
                                <InputWithCurrencyAndLabel currency={currencyData?.currencySymbol} value={finalAmount} />
                            </div>
                        </div>
                        <div className={`w-100 py-3 d-flex align-items-end gap-2`}>
                            <InputComponent type="text" label={"OTP"} className="inputComponent2" value={otp} placeholder={"0"} onChange={(e) => { if (regex.test(e?.target?.value) || e?.target?.value == "") { setOtp(e?.target?.value) } }} />
                            <div className="w-50">
                                {
                                    expireIn !== 0 ?
                                        <div className={styles.countdown}>
                                            <Countdown
                                                date={expireIn}
                                                renderer={renderer}
                                            /> </div> : 
                                        <Button btnText={isResubmit ? "Resend OTP" : "Get OTP"} className={"successFillRectangleBtn"} disabled={balance >= 0 ? false : true} onClick={() => sendOtp()} />

                                }
                            </div>
                            {/* <div className="w-25">
                            </div> */}
                        </div>
                        <div className="py-3">
                            {
                                userdetails?.bankAccounts?.length > 0 ?
                                    isLoading ?
                                        <Button isLoading={isLoading} className={"successFillRectangleBtn"} />
                                        : <Button btnText={"Withdraw"} className={"successFillRectangleBtn"} disabled={balance >= 0 ? false : true} onClick={() => withdraw()} /> :
                                    <Button btnText={"Add Bank Account"} className={"successFillRectangleBtn"}
                                        onClick={() => {
                                            navigate("/my-profile", { state: { scrollToBottom: true } })
                                        }}
                                    />
                            }

                        </div>
                        <div className={styles.noteContent}>
                            <h3>
                                Notes
                            </h3>
                            <ul>
                                <li>
                                    1. Maximum withdraw limit {currencyData?.maxWithdraw} {currencyData?.currencySymbol}
                                </li>
                                <li>
                                    2. Minimum withdraw limit {currencyData?.minWithdraw} {currencyData?.currencySymbol}
                                </li>
                                <li>
                                    3 .On submit of withdrawal check mail sent to registered email id for OTP
                                </li>
                                <li>
                                    4. Your withdrawal request placed will be in pending state and processed after admin's approval
                                </li>
                                <li>
                                    5. Withdrawal amount with Fee will be the total transaction amount. So please ensure the amount entered doesn't exceed the maximum limit.
                                </li>
                            </ul>
                        </div>
                    </div>
                </Modal.Body>
            </Modal>

        </div>
    );
};

export default WithdrawModel;
// {
//     "bankName" : "GoGooo",
//     "accountNo" : "535463546345",
//     "holderName" : "mani",
//     "bankcode" : "2031251",
//     "country" : "United States",
//     "city" : "Madurai",
//     "bankAddress" : "madurai",
//     "isPrimary" : false,
//     "_id" : ObjectId("68db5f29a8cb181d26854f83")
// }