/** PACKAGE IMPORT */

import React, { useEffect, useRef, useState } from 'react'
import { FaCloudUploadAlt, FaCopy } from "react-icons/fa";
import QRCode from "react-qr-code";

/** LOCAL FILES IMPORT */

import styles from "./styles/authInnerPage.module.css"
import Button from '../../components/Button/Button'
import Images from '../../utils/Images'
import { useNavigate } from 'react-router-dom';
import AddUPI from './modal/AddUPI';
import { useSelector } from 'react-redux';
import { getCurrencyDetailsHooks } from '../../actions/currencyAction';
import config from '../../config/env';
import { fiatDepositRequestHooks } from '../../actions/walletAction';
import { imageValidation, validatefiatDeposit } from '../../pages/Validation/userValidation';
import Select from 'react-select'

/** CODE START */


/** LOCAL FILES IMPORT */
import styled from "../../pages/Auth/auth.module.css";
import { showToastMessage } from '../../lib/toast';
import { useGlobalContext } from '../../context/GlobalProvider';
import isEmpty from 'is-empty';


const Deposit = () => {

    const { userdetails, subAccountList } = useSelector((state) => state.user);
    const { theme } = useGlobalContext()
    const inputRef = useRef(null)
    const navigate = useNavigate()

    const [currentStep, setCurrentStep] = useState(1)
    const [selectedType, setSelectedType] = useState('BANK')
    const [currencyType, setCurrencyType] = useState(null)
    const [showUPIAddModal, setShowUPIAddModal] = useState(false);
    const [openQrCode, setOpenQrCode] = useState(false);
    const [upiLink, setUPILink] = useState('');

    const [currencyData, setCurrencyData] = useState({});
    const [isLoading, setIsLoading] = useState(false);

    // console.log('currencyData', currencyData)

    const [transactionNumber, setTransactionNumber] = useState("");
    const [amount, setAmount] = useState("");
    const [file, setFile] = useState("");
    // SECURITY/PERF FIX: holds the object URL for the upload preview thumbnail.
    // Previously URL.createObjectURL(file) was called directly in JSX, which
    // ran on every re-render (not just when `file` changed) — creating a new
    // blob URL on every keystroke/state change anywhere on the page, flooding
    // the Network tab and leaking memory since the old URLs were never
    // revoked. See the useEffect below, which creates this once per file and
    // cleans up the previous one.
    const [filePreviewUrl, setFilePreviewUrl] = useState(null);
    const [accountId, setAccountId] = useState("");
    const [errors, setErrors] = useState({});
    const [subOptions, setsubOptions] = useState([]);

    const isSubmittingRef = useRef(false);

    let numregex = /^[0-9]+$/;
    const handleShowAddUPI = () => {
        setShowUPIAddModal(true)
    }
    const handleCloseAddUPI = () => {
        setShowUPIAddModal(false)
    }

    const handleFileOnChange = async (e) => {
        const uploadFiles = e.target.files[0]
        if (uploadFiles) {
            let validate = await imageValidation(uploadFiles);
            if (validate?.status) {
                setErrors({ ...errors, ...{ 'file': validate?.errors } })
            } else {
                setFile(uploadFiles)
                setErrors((prev) => ({ ...prev, file: undefined }))
            }
        }
    }

    const handleFileUpload = () => {
        inputRef.current.click()
    }


    useEffect(() => {
        async function fetchData() {
            if (Object.values(userdetails)?.length > 0) {
                // SECURITY FIX: removed console.log of sensitive client-side data (secretKey/password/OTP)
                let resp = await getCurrencyDetailsHooks(userdetails.secretKey);
                let result = resp?.data;
                // console.log("getCurrencyDetailsHooks", result, result?.result?.data?.length);
                // console.log('result?.result?.data',result?.result?.data[0])
                if (result?.result?.data?.length > 0) {
                    setCurrencyData(result?.result?.data[0])
                } else {
                    setCurrencyData({})
                }
            }
        }
        fetchData();
    }, [userdetails]);


    const imgValid = async () => {
        try {
            if (file != "") {
                const { status, errors } = await imageValidation(file);
                if (status) {
                    return { success: status, error: { file: errors } }
                } else {
                    return { success: false, error: {} }
                }
            } else {
                return { success: true, error: { "file": "Image is required" } }
            }
        } catch (e) {
            console.log("imgValid__Err", e)
        }
    }


    const onSubmit = async () => {
        if (isSubmittingRef.current) return false
        isSubmittingRef.current = true;
        try {
            setIsLoading(true)
            let reqData = {
                accountId: accountId,
                amount: amount,
                currencyId: currencyData?._id,
                transactionNumber: transactionNumber,
                pay_mode: selectedType,
                upi_channel: 'INTENT'
            };
            const { status, errors } = await validatefiatDeposit(reqData);
            if (status) {
                setIsLoading(false)
                isSubmittingRef.current = false;
                setErrors({ ...errors, ...errors })
                return;
            }
            if (selectedType == 'BANK') {
                const { success, error } = await imgValid();
                if (success) {
                    isSubmittingRef.current = false;
                    setIsLoading(false)
                    setErrors({ ...errors, ...error })
                    return false
                }
            }



            // Plain object now, not FormData — internal_fiat_deposit was
            // migrated off multipart/form-data onto the app's normal
            // encrypted-JSON request pipeline (see fiatDepositRequestHooks
            // in actions/walletAction.js for why: raw multipart file bytes
            // could contain a null character and were being blocked by a
            // Cloudflare WAF managed rule). `attachment` is passed through
            // as the raw File — fiatDepositRequestHooks converts it to a
            // base64 envelope internally, so nothing else here changes.
            const depositPayload = {
                accountId: accountId,
                amount: amount,
                currencyId: currencyData?._id,
                transactionNumber: transactionNumber,
                attachment: file,
                pay_mode: selectedType,
                upi_channel: 'INTENT'
            };
            setErrors({})
            console.log("depositPayload_______", depositPayload)
            const resp = await fiatDepositRequestHooks(depositPayload, userdetails?.secretKey);
            let result = resp?.data;
            if (result?.success) {
                showToastMessage(result?.message, "success")
                setIsLoading(false)
                isSubmittingRef.current = false;
                if (selectedType == 'UPI') {
                    setUPILink(result?.result?.intentURL)
                    setOpenQrCode(true)
                    // window.open(result?.result?.intentURL);
                } else if (selectedType == 'CARD') {
                    window.open(result?.result?.paymentLink);
                } else {
                    navigate("/dashboard")
                }
            } else if (!result?.success) {
                if (result?.message) {
                    showToastMessage(result?.message, "error")
                }
                setIsLoading(false)
                isSubmittingRef.current = false;
            }
        } catch (e) {
            setIsLoading(false)
            console.log("onSubmit__Err", e);
        } finally {
            setIsLoading(false);
            isSubmittingRef.current = false; // 🔓 unlock
        }
    }



    useEffect(() => {
        window.scrollTo({
            top: 0,
            behavior: "smooth",
        });
    }, []);

    useEffect(() => {
        if (!isEmpty(userdetails) && userdetails?.kycStatus != "approved") {
            showToastMessage("Please complete your KYC verification to continue using deposits", "error")
            navigate('/verification')
            // return false
        }
    }, [userdetails])

    // FIX: create the preview blob URL only when `file` actually changes, and
    // revoke the previous one so it doesn't leak. Runs once per file
    // selection instead of once per render.
    useEffect(() => {
        if (!file) {
            setFilePreviewUrl(null);
            return;
        }
        const url = URL.createObjectURL(file);
        setFilePreviewUrl(url);
        return () => URL.revokeObjectURL(url);
    }, [file])

    useEffect(() => {
        if (!isEmpty(subAccountList)) {
            let mainAccount = subAccountList.find((val) => (val.isPrimary == true))
            if (!isEmpty(mainAccount)) {
                setAccountId(mainAccount.accountId)
            }
            let option = subAccountList.reduce((Options = [], val) => {
                let obj = {
                    label: val.accountName,
                    value: val.accountId,
                }
                Options.push(obj)
                return Options
            }, [])
            setsubOptions(option)

        }
    }, [subAccountList]);

    const handleReferralCopy = () => {
        showToastMessage("Account number has been copied!", "success")
        navigator.clipboard.writeText(userdetails.VANID)
            .then(() => {
            })
            .catch((err) => {
            })
    }


    return (

        <>

            {/* start of modal import */}

            <AddUPI
                show={showUPIAddModal}
                handleClose={handleCloseAddUPI}
            />

            {/* end of modal import */}

            <div >

                {currentStep == 1 ?
                    <div>
                        <div className='d-flex flex-wrap gap-2 align-items-center justify-content-between'>
                            <div>
                                <div className={styles.cardHeader}>
                                    <h5 className={styles.pageTitle}>Deposit</h5>
                                </div>
                                <div className={`${styles.singleFormWrapper} mt-4`}>
                                    <p className={styles.singleFormLabel}>
                                        Selected Payment Type
                                    </p>
                                    <div className={`${styles.paymentCardContainer}`}>
                                        <div
                                            className={`${styles.paymentTypeCard} ${selectedType == 'BANK' ? styles.active : ''}  `}
                                            onClick={() => setSelectedType('BANK')}
                                        >
                                            <img src={Images.bank} alt="bank" className='' />
                                            <p>Bank</p>
                                        </div>
                                        <div className={`${styles.paymentCardContainer}`}>
                                            <div
                                                className={`${styles.paymentTypeCard} ${selectedType == 'SBI' ? styles.active : ''}  `}
                                                onClick={() => setSelectedType('SBI')}
                                            >
                                                <img src={Images.sbi} alt="bank" className='' />
                                                <p>SBI</p>
                                            </div>
                                        </div>
                                        <div
                                            className={`${styles.paymentTypeCard} ${selectedType == 'UPI' ? styles.active : ''}  `}
                                            onClick={() => setSelectedType('UPI')}
                                        >
                                            <img src={Images.upi} alt="upi" className='' />
                                            <p>UPI</p>
                                        </div>
                                        {/* <div className={`${styles.paymentTypeCard} ${selectedType == 'CARD' ? styles.active : ''}  `} onClick={() => setSelectedType('CARD')}>
                                            <img src={Images.creditCard} alt="card" className='' />
                                            <p>CARD</p>
                                        </div> */}
                                    </div>
                                </div>
                                <div>
                                    {/* <div className={`${styles.singleFormWrapper} mt-4`}>
                                            <p className={styles.singleFormLabel}>
                                                Select Currency
                                            </p>
                                            <div className={`${styles.paymentCardContainer}`}>
                                                {
                                                    currencyList && currencyList?.length > 0 &&
                                                    currencyList?.map((val, ind) => (
                                                        <div
                                                            className={`${styles.paymentTypeCard}
                                             ${activetab === "" ? "" : activetab == ind ? styles.active : ''} `}
                                                        onClick={() => { setCurrencyData(val); setActiveTab(String(ind)) }}
                                                        >
                                                            <img src={val?.currencyImage ? val?.currencyImage : Images.flag} alt="inr" className='' />
                                                            <p>{val.currencySymbol}</p>
                                                        </div>
                                                    ))
                                                }


                                            </div>


                                        </div> */}
                                    <div className={`mt-5`}>
                                        <Button
                                            // disabled={activetab === "" || Number(activetab) < 0}
                                            isLoading={false}
                                            loadingText="Redirecting..."
                                            btnText="Continue"
                                            onClick={() => setCurrentStep(2)}
                                            className="cardSuccessBtn"
                                            selectedValue={null}
                                        />
                                    </div>

                                </div>
                            </div>
                            <div className={`${styles.tipsCardContainer} mt-4 mt-md-0`}>
                                <div className={`${styles.tipsCard}`}>
                                    <h5>Tips</h5>
                                    <div>
                                        <ul>
                                            <ul>
                                                <li>
                                                    1. Maximum deposit limit {currencyData?.maxDeposit} {currencyData?.currencySymbol}
                                                </li>
                                                <li>
                                                    2. Minimum deposit limit {currencyData?.minDeposit} {currencyData?.currencySymbol}
                                                </li>
                                                <li>
                                                    3. Your deposit request placed will be in pending state and processed after admin's approval
                                                </li>
                                                <li>
                                                    4. Deposit amount with Fee will be the total transaction amount. So please ensure the amount entered doesn't exceed the maximum limit.
                                                </li>
                                            </ul>
                                        </ul>
                                    </div>

                                </div>
                            </div>
                        </div>

                    </div>
                    :
                    currentStep == 2 ?
                        <>
                            <div className=''>
                                <div className={styles.cardHeader}>
                                    <h5 className={styles.pageTitle}>Deposit</h5>
                                    <Button
                                        isLoading={false}
                                        loadingText="Redirecting..."
                                        btnText="Back"
                                        onClick={() => setCurrentStep(1)}
                                        className="backBtn"
                                        selectedValue={null}
                                    />
                                </div>
                                <div className={`${styles.bankCardsContainer} mt-5`}>
                                    {selectedType == 'BANK' &&
                                        <div className={`${styles.cardBorder} h-100`}>

                                            <div className={styles.singleFormWrapperSm}>
                                                <p className={styles.singleFormLabel}>
                                                    Bank Details
                                                </p>
                                                <p className={`${styles.singleFormValue}`}>
                                                    {currencyData?.bankName}
                                                </p>
                                            </div>
                                            <div className={`${styles.singleFormWrapperSm} mt-4`}>
                                                <p className={styles.singleFormLabel}>
                                                    Account Number
                                                </p>
                                                <p className={`${styles.singleFormValue}`}>
                                                    {currencyData?.accountNo}
                                                </p>
                                            </div>
                                            <div className={`${styles.singleFormWrapperSm} mt-4`}>
                                                <p className={styles.singleFormLabel}>
                                                    IFSC 
                                                </p>
                                                <p className={`${styles.singleFormValue}`}>
                                                    {currencyData?.ifscCode}
                                                </p>
                                            </div>
                                            <div className={`${styles.singleFormWrapperSm} mt-4`}>
                                                <p className={styles.singleFormLabel}>
                                                    Bank Holder Name
                                                </p>
                                                <p className={`${styles.singleFormValue}`}>
                                                    {currencyData?.holderName}
                                                </p>
                                            </div>
                                        </div>
                                    }

                                    <div className={`${styles.cardBorder} h-100`}>
                                        <div className='row'>
                                            <div className={`col-lg-12`}>
                                                {selectedType == 'SBI' ? "" :
                                                    <div className={styles.singleFormWrapperSm}>


                                                        <div className={`react-select__width`}>
                                                            <p className={styles.singleFormLabel + " mb-2"}>
                                                                Select Account
                                                            </p>
                                                            <Select
                                                                placeholder="Select"
                                                                classNamePrefix="react-select__eighth"
                                                                options={subOptions}
                                                                value={subOptions.find((el) => el.value === accountId)}
                                                                onChange={(e) => {
                                                                    setAccountId(e.value)
                                                                }}
                                                            />
                                                        </div>
                                                        {errors?.accountId && <p className={`text-danger mt-2`}>{errors?.accountId}</p>}
                                                    </div>}
                                                {selectedType == 'SBI' &&
                                                    <>
                                                        <div className={styles.singleFormWrapperSm}>
                                                            <div className={`react-select__width`}>
                                                                <p className={`${styles.rowListInfo} `}>
                                                                    VAN Account Number
                                                                </p>
                                                                <div className={styles.referraLinkWrapper + " mt-3"}>
                                                                    <p className={styles.referralLinkWrapperId}>{userdetails?.VANID}</p>
                                                                    <Button
                                                                        isLoading={false}
                                                                        loadingText="Redirecting..."
                                                                        btnText={<FaCopy />}
                                                                        onClick={handleReferralCopy}
                                                                        className="textBtn"
                                                                        selectedValue={userdetails?.VANID}
                                                                    />
                                                                </div>
                                                            </div>
                                                            {/* {errors?.accountId && <p className={`text-danger mt-2`}>{errors?.accountId}</p>} */}
                                                        </div>
                                                        <div className={`${styles.tipsCard} min-h-50 mt-4`}>
                                                            <div>
                                                                <h3 className="fs18">
                                                                    Notes
                                                                </h3>
                                                                <ul>
                                                                    <li className='d-flex align-items-start gap-2'>
                                                                        <p>1. </p>
                                                                        <div>
                                                                            <p><b>Open your bank app or internet banking</b></p>
                                                                            <p>Works with any Indian bank — HDFC, ICICI, Axis, Kotak, and more.</p>
                                                                        </div>
                                                                    </li>
                                                                    <li className='d-flex align-items-start gap-2'>
                                                                        <p>2. </p>
                                                                        <div>
                                                                            <p><b>Add a new beneficiary</b></p>
                                                                            <p>Use your VAN as the account number. Bank name: State Bank of India (SBI). IFSC: confirm with support.</p>
                                                                        </div>
                                                                    </li>
                                                                    <li className='d-flex align-items-start gap-2'>
                                                                        <p>3. </p>
                                                                        <div>
                                                                            <p><b>Transfer the amount </b></p>
                                                                            <p>Send any amount via NEFT, RTGS, IMPS, or UPI.</p>
                                                                        </div>
                                                                    </li>
                                                                    <li className='d-flex align-items-start gap-2'>
                                                                        <p>4. </p>
                                                                        <div>
                                                                            <p><b>Amount reflects automatically</b></p>
                                                                            <p>Your wallet will be credited once the payment is confirmed. No manual action needed.</p>
                                                                        </div>
                                                                    </li>
                                                                </ul>
                                                            </div>
                                                        </div>
                                                    </>
                                                }
                                                {selectedType == 'BANK' &&
                                                    <div className={`${styles.singleFormWrapperSm} mt-4`}>
                                                        <p className={styles.singleFormLabel}>
                                                            Transaction Number
                                                        </p>
                                                        <input type="text" className={`${styles.singleFormInputBg}`} placeholder='Enter Your Transaction Number' value={transactionNumber} onChange={(e) => { if (numregex.test(e?.target?.value) || e?.target?.value == "") { setTransactionNumber(e?.target?.value) } }} />
                                                        {errors?.transactionNumber && <p className={`text-danger mt-2`}>{errors?.transactionNumber}</p>}
                                                    </div>
                                                }
                                                {selectedType == 'SBI' ? "" :
                                                    <div className={`${styles.singleFormWrapperSm} mt-4`}>
                                                        <p className={styles.singleFormLabel}>
                                                            Transaction Amount
                                                        </p>
                                                        <input type="text" className={`${styles.singleFormInputBg}`} placeholder={`Enter your amount (min: ${currencyData?.minDeposit}, max: ${currencyData?.maxDeposit})`} value={amount} onChange={(e) => { if (numregex.test(e?.target?.value) || e?.target?.value == "") { setAmount(e?.target?.value) } }} />
                                                        <label className={styles.inputInnerLabel}>INR</label>
                                                        {errors?.amount && <p className={`text-danger mt-2`}>{errors?.amount}</p>}
                                                        {}
                                                        {openQrCode &&
                                                            <div className='mt-3'>
                                                                <p className={styles.singleFormLabel}>
                                                                    Payment Scanner
                                                                </p>
                                                                <div className={`${styles.depositQrCodeContainer} mt-2 mb-3`}>
                                                                    <div className={`${styles.depositQrCodeWrapper}`}>
                                                                        <QRCode
                                                                            size={256}
                                                                            style={{ height: "auto", maxWidth: "100%", width: "100%" }}
                                                                            value={isEmpty(upiLink) ? '' : upiLink}
                                                                            viewBox={`0 0 256 256`}
                                                                        />
                                                                    </div>
                                                                </div>
                                                                <Button
                                                                    isLoading={false}
                                                                    loadingText="Redirecting..."
                                                                    onClick={() => {
                                                                        window.open(upiLink);
                                                                    }}
                                                                    btnText="Pay"
                                                                    className="cardSuccessBtnSm"
                                                                    selectedValue={null}
                                                                />
                                                            </div>
                                                        }
                                                    </div>}
                                                {selectedType == 'BANK' &&
                                                    <div className={`${styles.singleFormWrapperSm} mt-4`}>
                                                        <p className={styles.singleFormLabel}>
                                                            Bank transfer receipt/Proof of the transaction
                                                        </p>

                                                        <div className={styles.uploadFlex}>

                                                            <div className={styles.singleFormUploadContainerFlex}>


                                                                <button aria-label='upload' className="cardBtnTwo" onClick={handleFileUpload}>
                                                                    <FaCloudUploadAlt fontSize={20} />
                                                                    Upload
                                                                </button>

                                                                <input type="file" className='d-none' ref={inputRef} onChange={(e) => handleFileOnChange(e)} />
                                                            </div>

                                                            <div className={styles.fileUploadViewer}>
                                                                <img src={filePreviewUrl ? filePreviewUrl : theme == 'dark' ? Images.darkDefaultProfile : Images.lightDefaultProfile} alt='upload' />
                                                            </div>
                                                        </div>
                                                        {errors?.file && <p className={`text-danger mt-2`}>{errors?.file}</p>}
                                                        {/* {uploadedBankProof &&
                                                <div className='mt-3'>
                                                    Bank receipt.pdf
                                                </div>
                                            } */}
                                                    </div>
                                                }
                                            </div>
                                        </div>

                                    </div>
                                </div>

                                <div className={`mt-5 d-flex align-items-center justify-content-end`}>

                                    <Button
                                        isLoading={isLoading || isSubmittingRef.current}
                                        disabled={isLoading || isSubmittingRef.current}
                                        loadingText="Submitting..."
                                        btnText={isLoading || isSubmittingRef.current ? "Loading..." : "Confirm"}
                                        onClick={() => {
                                            !isLoading || !isSubmittingRef.current ?
                                                onSubmit() : ""
                                        }}
                                        // onClick={() => setOpenQrCode(true)}
                                        className="cardSuccessBtn"
                                        selectedValue={null}
                                    />
                                </div>

                            </div>
                        </>
                        :
                        <></>
                }
            </div>
        </>
    )
}

export default Deposit