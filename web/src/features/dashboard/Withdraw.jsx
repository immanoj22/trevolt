/** PACKAGE IMPORT */

import React, { useEffect, useRef, useState } from 'react'
import { FaCloudUploadAlt } from "react-icons/fa";
import isEmpty from 'is-empty';
/** LOCAL FILES IMPORT */

import styles from "./styles/authInnerPage.module.css"
import Button from '../../components/Button/Button'
import Images from '../../utils/Images'
import { useNavigate, useLocation } from 'react-router-dom';
import AddUPI from './modal/AddUPI';
import BankDetails from './components/BankDetails';
import WithdrawModel from './modal/WithdrawModel';

import styled from "../../pages/Auth/auth.module.css";
import { showToastMessage } from '../../lib/toast';
import config from '../../config/env';
import { useSelector } from 'react-redux';
import { getCurrencyDetailsHooks } from '../../actions/currencyAction';
import WithdrawForm from './components/WithdrawForm';

/** CODE START */

const Withdraw = () => {

    const { userdetails } = useSelector((state) => state.user);
    const inputRef = useRef(null)
    const navigate = useNavigate()

    const [currentStep, setCurrentStep] = useState(0)
    // const [selectedType, setSelectedType] = useState('BANK')

    const [selectedType, setSelectedType] = useState(
        () => localStorage.getItem("withdrawSelectedType") || 'BANK'
    )


    const [showUPIAddModal, setShowUPIAddModal] = useState(false)
    // const [showWithdrawModel, setShowWithdrawModel] = useState(false)
    const [currencyData, setCurrencyData] = useState({});
    const [selectedBankDetails, setSelectedBankDetails] = useState({});
    const [expiryTime, setExpiryTime] = useState(0);
    const [expiryTimeStatus, setExpiryTimeStatus] = useState(false);


    // const [currentStep, setCurrentStep] = useState(0)
    // const [selectedType, setSelectedType] = useState(
    //     () => localStorage.getItem("withdrawSelectedType") || 'BANK'
    // )


    const regex = /^\d+$/;
    useEffect(() => {
        if (!isEmpty(userdetails) && userdetails?.kycStatus != "approved") {
            showToastMessage("Please complete your KYC verification to continue using withdrawals", "error")
            navigate('/verification')
            // return false
        }
        async function fetchData() {
            if (Object.values(userdetails)?.length > 0) {
                // SECURITY FIX: removed console.log of sensitive client-side data (secretKey/password/OTP)
                let resp = await getCurrencyDetailsHooks(userdetails.secretKey);
                let result = resp?.data;
                if (result?.result?.data?.length > 0) {
                    setCurrencyData(result?.result?.data[0])
                    const primaryBank = userdetails?.bankAccounts?.find((bank) => bank.isPrimary) || userdetails?.bankAccounts?.[0];
                    setSelectedBankDetails(primaryBank);
                    // setSelectedBankDetails(userdetails?.bankAccounts[0])
                } else {
                    setCurrencyData({})
                }
            }
        }
        fetchData();
    }, [userdetails]);

    const handleShowAddUPI = () => {
        setShowUPIAddModal(true)
    }
    const handleCloseAddUPI = () => {
        setShowUPIAddModal(false)
    }

    useEffect(() => {
        window.scrollTo({
            top: 0,
            behavior: "smooth",
        });
    }, []);

    useEffect(() => {
        localStorage.setItem("withdrawSelectedType", selectedType);
    }, [selectedType]);

    useEffect(() => {
        const savedExpiry = localStorage.getItem("withdrawOtpExpiryTime");
        if (savedExpiry) {
            const expiry = parseInt(savedExpiry);
            if (expiry > Date.now()) {
                setExpiryTime(expiry);
                setExpiryTimeStatus(true)
                setCurrentStep(2)
            } else {
                setExpiryTimeStatus(false);
                setCurrentStep(1)
                localStorage.removeItem("withdrawOtpExpiryTime");
            }
        } else {
            setExpiryTimeStatus(false);
            setCurrentStep(1);
            localStorage.removeItem("withdrawOtpExpiryTime");
        }
    }, []);


    return (

        <>
            {/* start of modal import */}

            <AddUPI
                show={showUPIAddModal}
                handleClose={handleCloseAddUPI} />

            {/* <WithdrawModel
                show={true}
                handleClose={() => setShowWithdrawModel(false)}
                bankData={selectedBankDetails}
                currencyData={currencyData} /> */}


            {/* end of modal import */}
            <>
                {
                    currentStep == 1 &&
                    <div className='row'>
                        <div className='col-sm-6'>
                            <>
                                <div className={styles.cardHeader}>
                                    <h5 className={styles.pageTitle}>Withdraw</h5>
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
                                        <div
                                            className={`${styles.paymentTypeCard} ${selectedType == 'SBI' ? styles.active : ''}  `}
                                            onClick={() => setSelectedType('SBI')}
                                        >
                                            <img src={Images.sbi} alt="bank" className='' />
                                            <p>SBI</p>
                                        </div>
                                    </div>
                                </div>

                                {/* {selectedType == 'bank' && */}
                                <>
                                    <div className={`mt-5`}>
                                        <Button
                                            isLoading={false}
                                            loadingText="Redirecting..."
                                            btnText="Continue"
                                            onClick={() => {
                                                if (selectedType === 'BANK' && !(userdetails?.bankAccounts?.length > 0)) {
                                                    showToastMessage("Please add a bank account to continue", "error")
                                                    navigate("/my-profile", { state: { scrollToBottom: true } })
                                                    return
                                                }
                                                setCurrentStep(2)
                                            }}
                                            // onClick={() => setShowWithdrawModel(true)}
                                            className="cardSuccessBtn"
                                            selectedValue={null}
                                        // disabled={activetab === "" || Number(activetab) < 0}
                                        />
                                    </div>
                                </>
                                {/* } */}
                            </>
                        </div>
                        <div className='col-sm-6 py-5 d-flex align-items-center'>
                            <img src={Images.applyDetailsImg} alt="applyDetailsImg" />
                        </div>
                    </div>
                }

            </>
            {
                currentStep === 2 &&
                <WithdrawForm
                    bankData={selectedBankDetails}
                    currencyData={currencyData}
                    setCurrentStep={setCurrentStep}
                    expiryTime={expiryTime}
                    expiryTimeStatus={expiryTimeStatus}
                    pay_mode={selectedType}
                />
            }
        </>
    )
}

export default Withdraw