import React, { useEffect, useRef, useState } from "react";

import Countdown, { zeroPad } from "react-countdown";

/** LOCAL FILES IMPORT */

import styles from "../styles/authInnerPage.module.css";
import { InputComponent, InputWithCurrencyAndLabel } from "../../../components/Input/InputFields";
import Button from "../../../components/Button/Button";
import { useSelector } from "react-redux";
import { feeManagment } from "../../../calculation/calculationlib";
import { fiatWithdrawRequestHooks, getWithdrawCodeHooks } from "../../../actions/walletAction";
import { showToastMessage } from "../../../lib/toast";
import { useNavigate } from "react-router-dom";
import isEmpty from "is-empty";
import Select from 'react-select'
import { useGlobalContext } from "../../../context/GlobalProvider";
import { futureAccountAvailableMargin } from "../../../actions/futureActions";

const bankOption = [
  {
    label: 'SBI',
    value: 'DCR',
  },
  {
    label: 'Other Banks',
    value: 'NEFT',
  }
]


export default function WithdrawForm(props) {
  const { show, handleClose, bankData, currencyData, setCurrentStep, expiryTimeStatus, expiryTime, pay_mode } = props;

  const { convertValue, convertSecValue, convertTo } = useGlobalContext();
  const { assetdetail } = useSelector((state) => state.wallet);
  const { userdetails, subAccountList } = useSelector((state) => state.user);
  const [balance, setBalance] = useState(0);
  const [amount, setAmount] = useState("");
  const [currencyDet, setCurrencyDet] = useState({});
  const [finalAmount, setFinalAmount] = useState(0);
  const [otp, setOtp] = useState('');
  const [errors, setErrors] = useState({})
  const [accountId, setAccountId] = useState("");
  const [subOptions, setsubOptions] = useState([]);
  const [isResubmit, setIsResubmit] = useState(false);
  const [expireIn, setExpireIn] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [currencyIn, setCurrencyIn] = useState('INR');
  const [accountBal, setAccountBal] = useState(0)
  const [paymentMethod, setPaymentMethod] = useState("");
  const [accountNo, setAccountNo] = useState("");

  let regex = /^[0-9]+$/;
  let navigate = useNavigate();

  useEffect(() => {
    let selectedcurrency = assetdetail.find((el) => el.currencySymbol == currencyData?.currencySymbol);
    // setBalance(selectedcurrency?.balance);
    setCurrencyDet(selectedcurrency);
  }, [currencyData, assetdetail]);


  useEffect(() => {
    if (expiryTimeStatus) {
      setExpireIn(expiryTime);
      localStorage.setItem("withdrawOtpExpiryTime", expiryTime);
    } else {
      setExpireIn(0)
      setIsResubmit(false)
    }
  }, [expiryTimeStatus]);

  const handleChange = async (value) => {
    let Balance = currencyIn == 'INR' ? convertTo(balance, 'USD', currencyIn) : balance
    if (Balance >= value) {
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
      localStorage.setItem("withdrawOtpExpiryTime", 0);
      setIsResubmit(true)
    } else {
      return <span className="">
        {zeroPad(minutes)}m : {zeroPad(seconds)}s
      </span>
    }
  }

  const sendOtp = async () => {
    try {
      let resp = await getWithdrawCodeHooks(accountId, userdetails?.secretKey);
      let result = resp?.data;
      if (result?.status == "google") {
        showToastMessage(result?.message, "success")
      } else {
        if (!result?.success) {
          showToastMessage(result?.message, "error")
        } else {
          setExpireIn(Date.now() + 5 * (60000))
          // localStorage.setItem("withdrawOtpExpiryTime", Date.now() + 5 * (60000));
          // handleExpiresIn(Date.now() + 5 * (60000))
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
      let reqData = {
        accountId: accountId,
        amount: amount,
        currencyId: currencyData?._id,
        bankId: bankData?._id,
        otp: otp,
        pay_mode: pay_mode,
        accountNo: accountNo,
        paymentMethod: paymentMethod
      }
      let resp = await fiatWithdrawRequestHooks(reqData, userdetails?.secretKey);
      let result = resp?.data;
      if (result?.success) {
        localStorage.setItem("withdrawOtpExpiryTime", 0);
        setIsLoading(false)
        showToastMessage(result?.message, "success");
        navigate("/dashboard")
      } else if (!result?.success) {
        setIsLoading(false)
        setErrors(result?.errors)
        !isEmpty(result.message) && showToastMessage(result.message, "error")
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
    // setExpireIn(0)
    // setIsResubmit(false)
    if (!isEmpty(subAccountList)) {
      let mainAccount = subAccountList.find((val) => (val.isPrimary == true))
      if (!isEmpty(mainAccount)) {
        setAccountId(mainAccount.accountId)
        // setBalance(convertValue(mainAccount?.balance ?? 0))
        setAccountBal(mainAccount.availableBalance)
        setBalance(mainAccount?.balance ?? 0)
      }
      let option = subAccountList.reduce((Options = [], val) => {
        let obj = {
          label: val.accountName,
          value: val.accountId,
          balance: val.balance,
          availableBalance: val.availableBalance,
        }
        Options.push(obj)
        return Options
      }, [])
      setsubOptions(option)
    }
  }, [subAccountList]);



  // useEffect(() => {
  //     async function fetchData() {
  //         if (!isEmpty(accountId)) {
  //             console.log("subOptions__Det", accountId);
  //             let reqData = { accountId: accountId };
  //             const { status, data } = await futureAccountAvailableMargin(reqData, userdetails?.secretKey);
  //             // console.log("futureAccountAvailableMargin_resp", data, status)
  //             if (status) {
  //                 setAccountBal(data?.availableBalance)
  //             }
  //         }
  //     }
  //     fetchData()
  // }, [accountId])

  return (
    <div>
      <div className={styles.cardHeader}>
        <h5 className={styles.pageTitle}>Withdraw</h5>
        <Button
          isLoading={false}
          loadingText="Redirecting..."
          btnText="Back"
          onClick={() => setCurrentStep(1)}
          className="backBtn"
          selectedValue={null}
        />
      </div>
      <div className={styles.withdrawModelContent}>
        <div className={`${styles.bankCardsContainer} mt-5`}>
          <div className={`${styles.cardBorder} h-100`}>
            <div className={`${styles.inputWrapper} react-select__width mb-3`}>
              <label htmlFor="">Account</label>
              <Select
                placeholder="Select"
                classNamePrefix="react-select__eighth"
                options={subOptions}
                value={subOptions.find((el) => el.value === accountId)}
                onChange={(e) => {
                  setAccountId(e.value)
                  // setBalance(convertValue(e?.balance ?? 0))
                  setBalance(e?.balance ?? 0)
                  setAccountBal(e?.availableBalance ?? 0)
                }}
              />
              {errors?.accountId && <p className={`text-danger mt-2`}>{errors?.accountId}</p>}
            </div>

            {/* Default / selected bank note */}
            {pay_mode === 'BANK' && !isEmpty(bankData) && (
              <div className={styles.bankNoteWrapper}>
                <p className={styles.bankNoteText}>
                  You are withdrawing to: <span>{bankData?.bankName}</span>
                  {bankData?.accountNo ? `  •••• ${bankData.accountNo.slice(-4)}` : ""}
                </p>
              </div>
            )}

            {pay_mode === 'SBI' && !isEmpty(accountNo) && !isEmpty(paymentMethod) && (
              <div className={styles.bankNoteWrapper}>
                <p className={styles.bankNoteText}>
                  You are withdrawing to: <span>{bankOption.find(b => b.value === paymentMethod)?.label}</span>
                  {` •••• ${accountNo.slice(-4)}`}
                </p>
              </div>
            )}

            {pay_mode === 'BANK' && isEmpty(bankData) && (
              <div className={styles.bankNoteWrapper}>
                <p className={`${styles.bankNoteText} text-danger`}>
                  No default bank selected. Please select a bank account before withdrawing.
                </p>
              </div>
            )}


            {pay_mode == 'SBI' &&
              <>
                <div className={styles.inputWrapper}>
                  <label htmlFor="">Account No</label>
                  <InputWithCurrencyAndLabel
                    type="text"
                    // currency={currencyData?.currencySymbol}
                    id="accountNo"
                    value={accountNo}
                    placeholder={`Enter Account No to withdraw`}
                    onChange={(e, value) => {
                      let numbers = /^[A-Z0-9]+$/;
                      if (!numbers.test(value) && value !== "") {
                        return false
                      }
                      // handleChange(value)
                      setAccountNo(value)
                      setErrors({ ...errors, ...{ accountNo: "" } })
                    }}
                    error={errors?.amount} />
                </div>
                <div className={`${styles.inputWrapper} react-select__width mb-3`}>
                  <label htmlFor="">Select Bank</label>
                  <Select
                    placeholder="Select"
                    classNamePrefix="react-select__eighth"
                    options={bankOption}
                    value={bankOption.find((el) => el.value === paymentMethod)}
                    onChange={(e) => {
                      setPaymentMethod(e.value)
                    }}
                  />
                  {errors?.accountId && <p className={`text-danger mt-2`}>{errors?.paymentMethod}</p>}
                </div>
              </>

            }
            <div className={styles.inputWrapper}>
              <label htmlFor="">Amount</label>
              <InputWithCurrencyAndLabel
                type="text"
                currency={currencyData?.currencySymbol}
                id="amount"
                value={amount}
                placeholder={`Enter your amount (min: ${currencyData?.minWithdraw}, max: ${currencyData?.maxWithdraw})`}
                onChange={(e, value) => {
                  let numbers = /^[+]?([0-9]+(?:[\.][0-9]*)?|\.[0-9]+)$/;
                  if (!numbers.test(value) && value !== "") {
                    return false
                  }
                  handleChange(value)
                  setErrors({ ...errors, ...{ amount: "" } })
                }}
                error={errors?.amount}
                className={"InputTextStartCurrencyAndLabel"}
                />
            </div>
            {}
            <div className={styles.walletBalancetext}>
              <div className="d-flex justify-content-center gap-2">Account balance :
                <div className="d-flex gap-2 align-items-end">
                  <p className="fs18">{convertValue(parseFloat(accountBal))}</p>
                  <p className="fs16">{convertSecValue(parseFloat(accountBal))}</p>
                </div>
              </div>
            </div>
            <div className="d-flex gap-2">
              <div className={styles.inputWrapper}>
                <h2 className={`${styles.feeText} fs14`}>Withdraw Amount With Fee <span>{finalAmount}</span></h2>
                {/* <InputWithCurrencyAndLabel currency={currencyData?.currencySymbol} value={finalAmount} /> */}
              </div>
            </div>
            <div className={`w-100 py-3 d-flex gap-2 ${errors.otp ? 'align-items-center' : 'align-items-end'}`}>
              <InputComponent type="text" label={"OTP"} className="inputComponent2" error={errors?.otp}
                value={otp}
                placeholder={"Enter the OTP"}
                onChange={(e) => {
                  if (regex.test(e?.target?.value) || e?.target?.value == "") {
                    setOtp(e?.target?.value)
                    setErrors({ ...errors, ...{ otp: "" } })
                  }
                }} />


              <div className="w-50 mt-2">
                {
                  (expireIn !== 0 && userdetails.tfaType === "email") ?

                    <div className={styles.countdown}>
                      <Countdown
                        date={expireIn}
                        renderer={renderer}
                      /> </div> :
                    <Button btnText={isResubmit ? "Resend OTP" : "Get OTP"}
                      className={"successFillRectangleBtn"}
                      disabled={(balance >= 0 && (pay_mode != 'BANK' || userdetails?.bankAccounts?.length) > 0 && expireIn == 0) ? false : true}
                      onClick={() => sendOtp()} />

                }
              </div>


              {/* <div className="w-25">
                            </div> */}
            </div>
            <div className="py-3">
              {
                pay_mode != 'BANK' || userdetails?.bankAccounts?.length > 0 ?
                  isLoading ?
                    <Button
                      isLoading={isLoading}
                      className={"successFillRectangleBtn"}
                    />
                    : <Button
                      btnText={"Withdraw"}
                      className={"successFillRectangleBtn"}
                      disabled={balance >= 0 ? false : true}
                      onClick={() => withdraw()}
                    /> :
                  <Button
                    btnText={"Add Bank Account"}
                    className={"successFillRectangleBtn"}
                    onClick={() => {
                      navigate("/my-profile", { state: { scrollToBottom: true } })
                    }}
                  />
              }

            </div>
          </div>
          <div className={`${styles.tipsCard} min-h-50`}>
            <div>
              <h3 className="fs18">
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
        </div>

      </div>
    </div>
  );
}