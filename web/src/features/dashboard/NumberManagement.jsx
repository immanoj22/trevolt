/** PACKAGE IMPORT */

import React, { useEffect, useState } from 'react'
import { useLocation, Link, NavLink, useNavigate } from "react-router-dom";
import { IoMail } from 'react-icons/io5'
import { FiEdit } from "react-icons/fi";
import Swal from 'sweetalert2';
import { FaPhone } from "react-icons/fa6";
import { useSelector } from 'react-redux'
import { FaPlus } from "react-icons/fa";

/** LOCAL FILES IMPORT */

// import AddPhonenumber from '../modal/AddPhonenumber';
// import OtpVerification from '../modal/Otpverification';
// import Changemailnumber from '../modal/Changemailnumber';
import styles from "./styles/authInnerPage.module.css"
import { useGlobalContext } from '../../context/GlobalProvider';
import ChangeEmailNumber from './modal/ChangeEmailNumber';
import OtpVerification from './modal/OtpVerification';

/** ACTIONS */
import { mobileVerificationCodeHooks, panKycVerfifactionStatusChecking, sendOldMobileOtpHooks } from '../../actions/userAction';
import { showToastMessage } from '../../lib/toast';
import Button from '../../components/Button/Button';
import AddPhoneNumber from './modal/AddPhoneNumber';
import KycVerificationModal from './modal/KycVerificationModal';
import KycSubmittedModal from './modal/KycSubmittedModal';
import { popularTradePairs, trendingTradePairs, twentyFourHoursTradePairs } from '../../actions/currencyAction';
import { maskMobile } from '../../lib/Common';

const NumberManagement = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { userdetails } = useSelector((state) => state.user);
    const { theme } = useGlobalContext()

    const [addnumber, setAddnumber] = useState(false);
    const [reason, setReason] = useState('');
    const [otpmodal, setOtpmodal] = useState(false);
    const [changemodal, setChangemodal] = useState(false);
    const [kycVerifyModal, setKycVerifymodal] = useState(false); // false
    const [kycSubmitModal, setKycSubmitmodal] = useState(false);
    const [panKycFirstStep, setPanKycFirstStep] = useState(false);
    const [isActiveModelNumber, setIsActiveModelNumber] = useState(0);
    const [pendingDocsText, setPendingDocsText] = useState('Pending Docs')
    const editMobileNumber = () => {
        Swal.fire({
            title: "Are You Sure You Want to Change Your Phone Number?",
            icon: "warning",
            showCancelButton: true,
            confirmButtonText: "Continue",
            confirmButtonColor: theme == 'dark' ? "#2563EB" : "#2563EB",
            cancelButtonColor: theme == 'dark' ? "#2A2C2F" : "#eaecef",


            didOpen: () => {
                const confirmBtn = Swal.getConfirmButton();
                const cancelBtn = Swal.getCancelButton();

                if (confirmBtn) confirmBtn.setAttribute("data-click-effect", "none");
                if (cancelBtn) cancelBtn.setAttribute("data-click-effect", "none");
            }
        }).then((result) => {

            if (result.isConfirmed) {
                setChangemodal(true)
            } else if (result.isDenied) {

            }
        });

    }

    const getMobileVerificatioCode = async () => {
        try {
            const payload = {
                mobileNumber: userdetails.mobileNumber,
                countryCode: userdetails.countryCode
            }
            const mobileVerify = await mobileVerificationCodeHooks(payload, userdetails?.secretKey);
            if (mobileVerify.success) {
                setReason('verify')
                setOtpmodal(true);
                showToastMessage(mobileVerify.message, 'success')
            } else {
                showToastMessage(mobileVerify.message, 'error')
            }
        } catch (e) {
            console.log("getOldOtp_err", e);
        }
    }


    const fetchKycStatus = async () => {
        try {

            const kycStatus = await panKycVerfifactionStatusChecking(userdetails?.secretKey);
            const { liveness_Status, panDetails_status, panImage_status, occupation } = kycStatus.data.result.data.panStatus

            if (kycStatus.data.success) {
                setPanKycFirstStep(kycStatus.data.result)
            } else {
                setPanKycFirstStep(kycStatus.data.result)
            }

            if (liveness_Status && panDetails_status && panImage_status && occupation) {
                setPendingDocsText("Verification Pending")

            } else {
                setPendingDocsText("Pending Docs")

            }

        } catch (e) {
            console.log("fetchKycStatus_err", e);
        }
    }

    useEffect(() => {
        fetchKycStatus();
    }, []);

    useEffect(() => {
        window.scrollTo({
            top: 0,
            behavior: "smooth",
        });
    }, []);

    const handleBack = () => {
        navigate(-1)
    }

    const handleNumberVerified = () => {
        Swal.fire({
            title: "Phone number verified successfully",
            icon: "success",
            showCancelButton: false,
            confirmButtonText: "Continue with ID verification",
            confirmButtonColor: theme == 'dark' ? "#2563EB" : "#2563EB",
            cancelButtonColor: theme == 'dark' ? "#2A2C2F" : "#eaecef",
            customClass: {
                confirmButton: 'number-verified-btn',
                popup: 'number-verified-popup',
                title: 'my-title'
            },
            didOpen: () => {
                const confirmBtn = Swal.getConfirmButton();
                // const cancelBtn = Swal.getCancelButton();

                if (confirmBtn) confirmBtn.setAttribute("data-click-effect", "none");
                // if (cancelBtn) cancelBtn.setAttribute("data-click-effect", "none");
            }
        }).then((result) => {

            if (result.isConfirmed) {
                handleOpenLocker()
            } else if (result.isDenied) {

            }
        });
    }

    // useEffect(() => {
    //     handleOpenLocker()
    // }, [])

    const handleOpenLocker = () => {
        // console.log('locker called');
        // setKycSubmitmodal(true)

        setKycVerifymodal(true)
    }

    const handleCloseVerification = () => {
        setKycVerifymodal(false)
        // setTimeout(() => {
        //     setKycSubmitmodal(true)
        // }, 1000);
    }

    const openPendingDocsFromPanCard = async () => {
        const { liveness_Status, panDetails_status, panImage_status, occupation } = panKycFirstStep.data.panStatus
        if (!panImage_status && !panDetails_status && !liveness_Status && !occupation) {
            setKycVerifymodal(true)
            setIsActiveModelNumber(2)
            setPendingDocsText("Pending Docs")
            fetchKycStatus();
        } else if (panImage_status && !panDetails_status && !liveness_Status && !occupation) {
            setKycVerifymodal(true)
            setIsActiveModelNumber(5)
            setPendingDocsText("Pending Docs")
            fetchKycStatus();
        } else if (panImage_status && panDetails_status && !liveness_Status && !occupation) {
            setKycVerifymodal(true)
            setIsActiveModelNumber(6)
            setPendingDocsText("Pending Docs")
            fetchKycStatus();
        } else if (panImage_status && panDetails_status && liveness_Status && !occupation) {

            setKycVerifymodal(true)
            setIsActiveModelNumber(7)
            setPendingDocsText("Pending Docs")
            fetchKycStatus();
        } else if (panImage_status && panDetails_status && liveness_Status && occupation) {
            // setKycVerifymodal(true)
            // setIsActiveModelNumber(0)
            setPendingDocsText("Verification Pending")
            fetchKycStatus();
        }
        // if (kycStatus.data.success) {
        //     setPanKycFirstStep(kycStatus.data.result)
        // } else {
        //     setPanKycFirstStep(kycStatus.data.result)
        // }
        // setKycVerifymodal(true)

    };




    return (
        <>

            {/* start of modal  */}
            {/* Used to verify the a mobile number already added */}
            <OtpVerification
                show={otpmodal}
                handleClose={() => setOtpmodal(false)}
                location={location.pathname}
                newOtpModel={() => { setChangemodal(true) }}
                type="mobile"
                data={
                    {
                        // +${userdetails?.countryCode} 
                        mobileNumber: `${userdetails?.mobileNumber}`,
                        reason: reason
                    }
                }
            />
            {/* Used to chnage the new mobile number */}
            <ChangeEmailNumber
                type={"number"}
                show={changemodal}
                handleClose={() => setChangemodal(false)}
            />

            {
                kycVerifyModal &&
                <KycVerificationModal
                    show={kycVerifyModal}
                    handleClose={() => handleCloseVerification(false)}
                    handleShowKycSubmitted={() => setKycSubmitmodal(true)}
                    panValues={panKycFirstStep}
                    isActiveModelNumber={isActiveModelNumber}

                />
            }

            {
                kycSubmitModal &&
                <KycSubmittedModal
                    show={kycSubmitModal}
                    handleClose={() => setKycSubmitmodal(false)}
                />
            }



            {/* end of modal */}

            <div className='d-flex justify-content-between'>
                <h5 className={styles.pageTitle}>Security</h5>
                <Button
                    isLoading={false}
                    loadingText="Redirecting..."
                    btnText="Back"
                    onClick={handleBack}
                    className="backBtn"
                    selectedValue={null}
                />
            </div>
            <div div className={`${styles.cardBorder} margin-top__xl`}>
                <div className={`${styles.cardBorderInfo}`}>
                    <div className='d-flex gap-4'>
                        <FaPhone fontSize={18} className='mt-1' />
                        {userdetails && userdetails?.mobileNumber === "" || userdetails?.mobileNumber === 0 ?
                            <div>
                                <p className={`${styles.rowListTitle}`}>Add mobile number</p>
                            </div>
                            :
                            <div>
                                {/* Was showing the full mobile number in plain
                                    text — now masked with the same maskMobile()
                                    helper (and "*******" + last-3-digits
                                    convention) already used on My Profile and
                                    in Restore Access, country code still shown. */}
                                <p className={`${styles.rowListTitle}`}>+{userdetails?.countryCode} {maskMobile(userdetails?.mobileNumber)}</p>
                                <p className={`${styles.rowListInfo}`}>Added: {userdetails && new Date(userdetails?.updatedAt).toDateString()}</p>
                            </div>
                        }

                    </div>
                    {userdetails && userdetails?.mobileNumber === "" || userdetails?.mobileNumber === 0 ?
                        /*If mobile number is not added initially*/
                        <Button
                            onClick={() => {
                                setAddnumber(true)
                            }}
                            reactIconElement={<FaPlus />}
                            btnText={"Add"}
                            className='cardSuccessBtn'
                            staticClass='gap-2'
                        />
                        :
                        userdetails.mobileStatus !== "verified" ?
                            /* If mobile number is added initially, But is not verified yet*/
                            <Button
                                isLoading={false}
                                loadingText="Loading..."
                                btnText="Verify Number"
                                onClick={() => getMobileVerificatioCode()}
                                className="cardSuccessBtnXs"
                                selectedValue={null}
                            />
                            :
                            <>
                                {/* If mobile number is added already, And user want to change new number */}
                                <Button
                                    onClick={editMobileNumber}
                                    reactIconElement={<FiEdit />}
                                    btnText={"Edit"}
                                    className='cardSuccessBtn'
                                    staticClass='gap-2'
                                />
                            </>
                    }
                </div>
            </div>

            <div className={`${styles.highlightCard} margin-top__xl`}>
                <p className={styles.rowListTitle}>Note :</p>
                <p className={`${styles.highlightDesc} mt-2`}>Withdrawal will be temporarily disabled for 24 hours after any change in your password, mobile number, or email.</p>
            </div>


            {/* Used to added a mobile number */}
            <AddPhoneNumber
                show={addnumber}
                type={"mobile-verification"}
                handleClose={() => setAddnumber(false)}
                // handleClose={() => handleCloseMobileNumber()}
                // handleNumberVerified={handleNumberVerified}
            />


        </>
    )
}
export default NumberManagement