/** PACKAGE IMPORT */

import React, { useEffect, useState } from 'react'
import { IoMail } from 'react-icons/io5'
import { FiEdit } from "react-icons/fi";
import Swal from 'sweetalert2';


/** LOCAL FILES IMPORT */

import styles from "./styles/authInnerPage.module.css"
import { useGlobalContext } from '../../context/GlobalProvider';
import ChangeEmailNumber from './modal/ChangeEmailNumber';
import { useLocation, useNavigate } from 'react-router-dom';
import ChangeEmail from './modal/ChangeEmail';
import Button from '../../components/Button/Button';
import { maskEmail } from '../../lib/Common';


/** ACTIONS */

const EmailManagement = () => {
    const navigate = useNavigate();
    const [otpmodal, setOtpmodal] = useState(false)
    const [changemodal, setChangemodal] = useState(false)
    const [userdetails, setUserDetails] = useState({})

    const { theme } = useGlobalContext()

    const location = useLocation();

    useEffect(() => {
        let userdet = location?.state;
        setUserDetails(userdet);
    }, [location]);

    // SECURITY FIX: removed console.log of sensitive client-side data (secretKey/password/OTP)

    const editemail = () => {
        Swal.fire({
            title: "Are You Sure You Want to Change Your Email Address?",
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



    useEffect(() => {
        window.scrollTo({
            top: 0,
            behavior: "smooth",
        });
    }, []);

    const handleBack = () => {
        navigate(-1)
    }

    return (
        <>
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
            <div className={`${styles.cardBorder} margin-top__xl`}>
                <div className={`${styles.cardBorderInfo}`}>
                    <div className='d-flex align-items-center gap-4'>
                        <IoMail fontSize={22} />
                        <div>
                            <p className={`${styles.rowListTitle}`}>{maskEmail(userdetails?.email)}</p>
                            <p className={`${styles.rowListInfo + " mt-0"}`}>Added : {userdetails && new Date(userdetails?.updatedAt).toDateString()}</p>
                        </div>
                    </div>
                    <Button onClick={editemail} reactIconElement={<FiEdit />} btnText={"Edit"} className='cardSuccessBtn' staticClass='gap-2' />

                    {/* <button aria-label='editIcon' className={`borderLessButton `}>
                        <FiEdit fontSize={18} onClick={editemail} />
                    </button> */}
                </div>
            </div>
            <div className={`${styles.highlightCard} margin-top__xl`}>
                <p className={styles.rowListTitle}>Note :</p>
                <p className={`${styles.highlightDesc} mt-2`}>Withdrawal will be temporarily disabled for 24 hours after any change in your password, mobile number, or email.</p>

            </div>

            {/* <OtpVerification show={otpmodal} handleClose={() => setOtpmodal(false)} /> */}
            {/* <NewEmail
                show={changemodal}
                handleClose={() => { setChangemodal(false) }}
                data={getUser}
            /> */}
            <ChangeEmail type={"email"} show={changemodal} handleClose={() => setChangemodal(false)} secretKey={userdetails.secretKey} />
            {/* <ChangeEmailNumber type={"email"} show={changemodal} handleClose={() => setChangemodal(false)} /> */}
        </>
    )
}

export default EmailManagement