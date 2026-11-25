/** PACKAGE IMPORT */

import React, { useEffect, useState } from "react";

/** LOCAL FILES IMPORT */
import styles from "./modal.module.css"

import { Modal } from "react-bootstrap";
import { IoClose } from "react-icons/io5";
import OtpInput from 'react-otp-input';
import Countdown, { zeroPad } from "react-countdown";
import Button from "../../../components/Button/Button";
import { useNavigate } from "react-router-dom";
import { useGlobalContext } from "../../../context/GlobalProvider";
import { validateresendLoginCode, validateUserLoginVerification } from "../../Validation/userValidation";
import { loginVerificationHooks, resendLoginCodeHooks, verifyForgotOtpHooks } from "../../../actions/userAction";
import { showToastMessage } from "../../../lib/toast";


import { jwtDecode } from 'jwt-decode'
import { createSocketUser } from "../../../config/socketConnectivity";
import isEmpty from "is-empty";
import { LuMailWarning } from "react-icons/lu";
import { maskEmail } from "../../../lib/Common";

export const OtpVerification = (props) => {
    const navigate = useNavigate();

    const { location, show, data, setRestoreToggle, handleClose } = props;
    const { email, password, loginHistory, challengeId } = data;
    const { handleLogin } = useGlobalContext();
    const [error, setError] = useState({});
    const [otp, setOtp] = useState("");
    const [isResubmit, setIsResubmit] = useState(false);
    const [expireIn, setExpireIn] = useState(Date.now() + 60000);
    const [btndis, setBtnDis] = useState(false);

    let regex = /^[0-9]+$/;

    useEffect(() => {
        if (show) {
            setIsResubmit(false);
            setExpireIn(Date.now() + 5 * (60000))
        }
        setIsResubmit(false);
    }, [show])


    const close = () => {
        setError({}); setOtp("");
        setIsResubmit(false);
        props.handleClose();
    }

    const renderer = ({ days, hours, minutes, seconds, completed }) => {
        if (completed) {
            setIsResubmit(true)
            setError({})
        } else {
            return <span className="">
                {zeroPad(minutes)}m : {zeroPad(seconds)}s
            </span>
        }
    }


    const validOldOtp = async () => {
        handleLogin();
    }

    const verifyLogin = async () => {
        try {
            let reqData = {
                // email: email,
                // password: password,
                otp: otp,
                challengeId: challengeId,
                platform: 'web'
            }
            const { status, errors } = await validateUserLoginVerification(reqData);
            if (status && setRestoreToggle !== false) {
                setError(errors);
            } else {
                setBtnDis(true);
                const resp = await loginVerificationHooks({ ...reqData, platform: "web" });
                let result = resp?.data;
                if (result?.success) {
                    // SECURITY FIX (VAPT: "Token Storage Security" — Points
                    // 44/49/70): no Authorization header/localStorage write
                    // for the token — backend already set the httpOnly
                    // cookie for this session. Decode is in-memory/transient
                    // only, used for the socket userId + welcome-card flag.
                    if (!isEmpty(result?.result)) {
                        const decoded = jwtDecode(result?.result);
                        localStorage.setItem("code", decoded.showWelcomeCard)
                        createSocketUser(decoded?.userId);
                    }
                    setError({});
                    await handleLogin();
                    showToastMessage(result?.message, 'success');
                    setBtnDis(false);
                } else if (!result?.success) {
                    setError(result?.errors);
                    if (result?.message) {
                        showToastMessage(result?.message, 'error')
                    }
                    setBtnDis(false);
                    if (result?.message == 'This login session has expired. Please log in again.') {
                        close()
                    } else if (result?.message == "Too many failed attempts. Please log in again.") {
                        close()
                    }
                }
            }
        } catch (e) {
            console.log("verifyLogin__Err", e)
        }
    }

    const resendForgotOtp = async () => {
        try {
            setBtnDis(true);
            if (props.resendOtp) {
                await props.resendOtp();
            }
            setIsResubmit(false);
            setExpireIn(Date.now() + 5 * (60000));
        } catch (e) {
            console.log("resendForgotOtp__Err", e);
        } finally {
            setBtnDis(false);
        }
    }

    const resendCode = async () => {
        try {
            let reqData = { challengeId: challengeId }
            const { status, errors } = await validateresendLoginCode(reqData);
            if (status) {
                setError(errors);
            } else {
                setBtnDis(true);
                const resp = await resendLoginCodeHooks(reqData);
                let result = resp?.data;
                if (result?.success) {
                    setError({});
                    showToastMessage(result?.message, 'success');
                    setIsResubmit(false);
                    setExpireIn(Date.now() + 5 * (60000));
                    setBtnDis(false);
                    // google2fa
                } else {
                    setError(result?.errors);
                    if (result?.message) {
                        showToastMessage(result?.message, 'error')
                    }
                    if (result?.message == 'This login session has expired. Please log in again.') {
                        close()
                    }
                }
                setBtnDis(false);
            }
        } catch (e) {
            console.log("resendOtp__Err", e);
        }
    }



    // SECURITY FIX: removed console.log of sensitive client-side data (secretKey/password/OTP)

    const forgotveriftyOTP = async () => {
        try {
            if (isEmpty(otp)) {
                setError({ otp: 'OTP is required' })
            } else if (otp?.length != 6) {
                setError({ otp: 'Enter a valid OTP' })
            } else {
                setBtnDis(true);
                // Read-only check — confirms the OTP is correct/not expired without
                // consuming it, so resetPassword's own verify+consume still works
                // when the new password is actually submitted on the next page.
                const resp = await verifyForgotOtpHooks({ email: props?.data?.email, otp: otp });
                const result = resp?.data;
                setBtnDis(false);
                if (result?.success) {
                    setError({});
                    navigate("/reset-password", { state: { otp: otp } });
                    close()
                } else {
                    setError(result?.errors || {});
                    result?.message && showToastMessage(result.message, 'error');
                }
            }
        } catch (e) {
            setBtnDis(false);
            console.log("forgotveriftyOTP__Err", e);
        }
    }

    const twoFactorRestoreHandle = () => {
        handleClose();
        setRestoreToggle(true);
    }



    return (
        <div>

            <Modal
                centered
                size="md"
                backdrop="static"
                show={props.show}
                onHide={close}
                className={styles.modalPrimary}
            >
                <button
                    aria-label="closeIcon"
                    className={styles.modalCloseButton}
                    onClick={close}
                >
                    <IoClose />
                </button>
                <Modal.Header className={styles.modalPrimaryHeader}>
                    {
                        props?.type == "google" ?
                            <h4 className={`${styles.modalHeaderTitle} `}>Enter the authentication code</h4>
                            :
                            <h4 className={`${styles.modalHeaderTitle} `}>OTP Verification for {props?.type}</h4>
                    }
                </Modal.Header>
                <Modal.Body className={styles.modalPrimaryBody}>
                    <form onSubmit={(e) => { e.preventDefault() }}>
                        <div className="">
                            <div className="">
                                <p className={`${styles.formLabel}`}>{props?.type == "google" ? "Enter 2FA code" : "Enter OTP"}</p>
                                <div className={`${styles.otpInputWrapper} otpInputWrapper mt-2`}>
                                    <OtpInput
                                        shouldAutoFocus={true}
                                        value={otp ? (otp == "" || regex.test(otp)) ? otp : (otp == "" || regex.test(otp)) ? otp : "" : ""}
                                        onChange={(e) => { setOtp(e) }}
                                        numInputs={6}
                                        renderInput={(props) => (
                                            <input
                                                {...props}
                                                onKeyDown={(e) => {
                                                    if (e.key === "Enter") {
                                                        e.preventDefault();
                                                        verifyLogin(); // call your submit fn
                                                    }
                                                }}
                                            />
                                        )}
                                    />

                                </div>
                                {}
                                <span className="text-danger f-12 d-block text-left mt-2">
                                    {error?.mobileNumber}
                                    {error?.errors}
                                    {error?.otp}
                                </span>

                                <div className={`${styles.countdownInstruct} mt-3`}>
                                    <p className={styles.modalLabelWhite}>
                                        {props.type == "google" ? "Enter the code from your Authenticator App" : "We have sent a code to"}&nbsp;

                                        {
                                            props.type == "google" ? "" : props.type == "email" ? maskEmail(props?.data?.email) :
                                                `*******${props?.data?.mobileNumber?.slice(-3)}`
                                        }

                                    </p>


                                    &nbsp;
                                    {
                                        (props.type == "email" && isResubmit == false) &&
                                        <div className={styles.countdown}>
                                            <Countdown
                                                date={expireIn}
                                                renderer={renderer}
                                            />
                                        </div>
                                    }

                                </div>

                            </div>
                            {
                                props.type == "email" &&
                                <div className={styles.emailNotesPart}>
                                    <LuMailWarning size={30} />
                                    <p className="fs13">Didn't receive the email code? Please check your spam folder and mark the email as "Not spam".</p>
                                </div>
                            }
                        </div>
                    </form>

                </Modal.Body>
                <Modal.Footer className={`${styles.modalPrimaryFooter} d-flex justify-content-between align-items-center`}>
                    {
                        setRestoreToggle !== false &&
                        <div className={`${styles.restoreNavText}`}>
                            {/* <span className="me-2">
                            Try another way Two-Factor
                        </span> */}
                            <p onClick={() => twoFactorRestoreHandle()} className={`${styles.pageNavLinks}`}>Try another way</p>
                        </div>
                    }

                    <div className={`${styles.modalFooterActions}`}>
                        {
                            (location == "/login" || location == "/register") ?
                                isResubmit ?
                                    <Button
                                        isLoading={false}
                                        loadingText="Loading..."
                                        btnText="Resend OTP"
                                        disabled={btndis}
                                        onClick={resendCode}
                                        className="cardSuccessBtnSm"
                                        selectedValue={null}
                                    />
                                    :
                                    <Button
                                        isLoading={false}
                                        loadingText="Loading..."
                                        btnText="Submit"
                                        disabled={btndis}
                                        onClick={verifyLogin}
                                        className="cardSuccessBtnSm"
                                        selectedValue={null}
                                    />
                                :
                                location == "/number-management" ?
                                    <Button
                                        isLoading={false}
                                        loadingText="Loading..."
                                        btnText="Submit"
                                        onClick={validOldOtp}
                                        className="cardSuccessBtnSm"
                                        selectedValue={null}
                                    />
                                    :
                                    location == "/forgot" && (
                                        isResubmit ?
                                            <Button
                                                isLoading={false}
                                                loadingText="Loading..."
                                                btnText="Resend OTP"
                                                disabled={btndis}
                                                onClick={resendForgotOtp}
                                                className="cardSuccessBtnSm"
                                                selectedValue={null}
                                            />
                                            :
                                            <Button
                                                isLoading={false}
                                                loadingText="Loading..."
                                                btnText="Submit"
                                                disabled={btndis}
                                                onClick={forgotveriftyOTP}
                                                className="cardSuccessBtnSm"
                                                selectedValue={null}
                                            />
                                    )
                        }

                    </div>
                </Modal.Footer>
            </Modal>
        </div>
    );
};