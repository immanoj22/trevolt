
/** PACKAGE IMPORT */

import React, { useEffect, useRef, useState } from "react";
import { Modal } from "react-bootstrap";
import { IoClose } from "react-icons/io5";
import { useLocation, Link, NavLink, useNavigate } from "react-router-dom";
import OtpInput from 'react-otp-input';
import Countdown, { zeroPad } from "react-countdown";
import { useSelector } from "react-redux";

/** LOCAL FILES IMPORT */

import styles from "../styles/modal.module.css"
import Button from "../../../components/Button/Button";
import { loginVerificationHooks, mobileVerificationCodeHooks, verifyMobileVerificationHooks, verifyOldMobileOtpCodeHooks } from "../../../actions/userAction";
import { showToastMessage } from "../../../lib/toast";
import { maskEmail } from "../../../lib/Common";

/** ACTIONS */


/** CONFIG */


/** CODE START */

const OtpVerification = (props) => {
    const { location, data, show } = props
    const { userdetails } = useSelector((state) => state.user);

    const [error, setError] = useState({});
    const [otp, setOtp] = useState("");
    const [isResubmit, setIsResubmit] = useState(false);
    const [expireIn, setExpireIn] = useState(Date.now() + 60000);
    const [isLoading, setIsLoading] = useState(false);

    // Extract redirect URL if present
    const params = new URLSearchParams(location.search);
    const redirect = params.get("redirect") || "/dashboard";

    const close = () => {
        setError({}); setOtp("");
        setIsResubmit(false);
        props.handleClose();
    }

    const renderer = ({ days, hours, minutes, seconds, completed }) => {
        // console.log(completed, 'renderer')
        if (completed) {
            // Render a completed state
            setIsResubmit(true)
            setError({})
        } else {
            return <span className="">
                {zeroPad(minutes)}m : {zeroPad(seconds)}s
            </span>
        }
    }

    const verifyNumber = async () => {
        try {
            if (otp == "") {
                setError({ otp: "OTP is required." });
                return false
            }
            setIsLoading(true)
            const verify = await verifyMobileVerificationHooks({
                mobileNumber: userdetails.mobileNumber,
                countryCode: userdetails.countryCode,
                otp: otp
            }, userdetails?.secretKey);
            if (verify.success) {
                setIsLoading(false)
                showToastMessage(verify.message, 'success')
                close()
            } else {
                setIsLoading(false)
                setError(verify.error)
                verify?.message && showToastMessage(verify.message, 'error')
            }
        } catch (e) {
            console.log("verifyNumber_err", e);
            setIsLoading(false)
        }
    }


    const verifyLogin = async () => {
        try {
            if (otp == "") {
                setError({ otp: props.type == "2fa" ? "Code is required" : "OTP is required" });
                return false
            }
            setIsLoading(true)
            const getData = await loginVerificationHooks({ email: data?.email, password: data?.password, otp });
            if (getData.status) {
                setIsLoading(false)
                showToastMessage(getData.message, 'success')
                // const badge = document.querySelector('.grecaptcha-badge');
                // if (badge) {
                //     badge.style.visibility = 'hidden';
                // }
                navigate(redirect);
            } else {
                if (getData?.error?.otp == "OTP is Expired") {
                    setIsResubmit(true)
                }
                setIsLoading(false)
                setError(getData.error)
                getData?.message && showToastMessage(getData.message, 'error')
            }
        } catch (e) {
            console.log("verifyLogin_err", e);
        }
    }

    const validOldOtp = async () => {
        try {
            setIsLoading(true)
            if (otp == "") {
                setError({ otp: "OTP is required." });
                setIsLoading(false)
                return false
            }
            const getData = await verifyOldMobileOtpCodeHooks({ otp: otp }, userdetails.secretKey);
            if (getData.success) {
                setIsLoading(false)
                showToastMessage(getData.message, 'success')
                props.newOtpModel();
                close();
            } else {
                setIsLoading(false)
                setError(getData.errors)
                getData?.message && showToastMessage(getData.message, 'error')
            }
        } catch (e) {
            setIsLoading(false)
            console.log("validOldOtp_err", e);
        }
    }


    useEffect(() => {
        if (show) {
            setIsResubmit(false);
            setExpireIn(Date.now() + (5 * 60000))
        }
        setIsResubmit(false);
    }, [show])



    return (
        <div>

            <Modal
                centered
                size="md"
                backdrop="static"
                show={props.show}
                // show={true}
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
                        props?.type?.toUpperCase() == "2FA" ?
                            <h4 className={`${styles.modalHeaderTitle} `}>Enter the authenticate code</h4>
                            :
                            <h4 className={`${styles.modalHeaderTitle} `}>OTP Verification for {props?.type}</h4>
                    }
                </Modal.Header>
                <Modal.Body className={styles.modalPrimaryBody}>
                    <form onSubmit={(e) => { e.preventDefault() }}>
                        <div className="">
                            <div className="">
                                <p className={`${styles.formLabel}`}>{props.type == "2fa" ? "Enter Code" : "Enter OTP"}</p>
                                <div className={`${styles.otpInputWrapper} otpInputWrapper mt-2`}>
                                    <OtpInput
                                        shouldAutoFocus={true}
                                        value={otp}
                                        onChange={(e) => { setOtp(e) }}
                                        numInputs={6}
                                        // renderSeparator={<span>-</span>}
                                        renderInput={(props) => <input {...props} />}
                                    />

                                </div>
                                <div className={`${styles.countdownInstruct} mt-3`}>
                                    <p className={styles.modalLabelWhite}>
                                        {props.type == "2fa" ? "Enter the code from your Authenticator App" : "We have sent a code to"}&nbsp;

                                        {
                                            props.type == "2fa" ? "" : props.type == "email" ? maskEmail(props?.data?.email) :
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
                                <span className="text-danger f-12 d-block text-left mt-2">
                                    {error?.mobileNumber}
                                    {error?.errors}
                                    {error?.otp}
                                </span>
                            </div>
                            <div className="mt-4">
                                {}

                            </div>
                        </div>
                    </form>

                </Modal.Body>
                <Modal.Footer className={`${styles.modalPrimaryFooter}`}>
                    <div className={`${styles.modalFooterActions}`}>
                        {
                            location == "/login" ?
                                isResubmit ?
                                    <Button
                                        isLoading={isLoading}
                                        loadingText="Loading..."
                                        btnText={isLoading ? "Loading..." : "Resend OTP"}
                                        onClick={() => {
                                            setOtp("");
                                            props.resendOtp();
                                            setIsResubmit(false);
                                            setExpireIn(Date.now() + 5 * 60000)
                                            setError({})
                                        }}
                                        className="cardSuccessBtnSm"
                                        selectedValue={null}
                                    />
                                    :
                                    <Button
                                        isLoading={isLoading}
                                        loadingText="Loading..."
                                        btnText={isLoading ? "Loading..." : "Submit"}
                                        onClick={() => { setError({}); verifyLogin() }}
                                        className="cardSuccessBtnSm"
                                        selectedValue={null}
                                    />
                                :
                                location == "/number-management" && props?.data?.reason === 'verify' ?
                                    <Button
                                        isLoading={isLoading}
                                        loadingText="Loading..."
                                        btnText="Verify"
                                        onClick={() => { setError({}); verifyNumber() }}
                                        className="cardSuccessBtnSm"
                                        selectedValue={null}
                                    /> :
                                    location == "/number-management" ? <Button
                                        isLoading={isLoading}
                                        loadingText="Loading..."
                                        btnText="Submit"
                                        onClick={() => { setError({}); validOldOtp() }}
                                        className="cardSuccessBtnSm"
                                        selectedValue={null}
                                    />
                                        :
                                        <Button
                                            isLoading={isLoading}
                                            loadingText="Loading..."
                                            btnText="Submit"
                                            onClick={() => { setError({}); verifyNumber() }}
                                            className="cardSuccessBtnSm"
                                            selectedValue={null}
                                        />
                        }

                    </div>
                </Modal.Footer>
            </Modal>
        </div>
    );
};

export default OtpVerification;
