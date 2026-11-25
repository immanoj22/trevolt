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
import { validateRecovery, validateresendLoginCode, validateUserLoginVerification, validateUserRecovery } from "../../Validation/userValidation";
import { getRecoveryCode, getRecoveryOtpionHooks, getRecoveryUserOptions, loginVerificationHooks, resendLoginCodeHooks } from "../../../actions/userAction";
import { showToastMessage } from "../../../lib/toast";


import { jwtDecode } from 'jwt-decode'
import { createSocketUser } from "../../../config/socketConnectivity";
import isEmpty from "is-empty";
import { InputComponent } from "../../../components/Input/InputFields";

import PhoneInput from "react-phone-input-2";
import "react-phone-input-2/lib/style.css";
import { maskEmail } from "../../../lib/Common";

export const RestoreModel = (props) => {
    // console.log("propdata", props?.data)
    const navigate = useNavigate();
    let alpharegex = /^[A-Za-z]+$/;
    const { handleLogin } = useGlobalContext();

    const { show, data } = props;
    const { email, password, challengeId } = data;
    const [error, setError] = useState({});
    const [tabCount, setTabCount] = useState(1);

    const [otp, setOtp] = useState("");
    const [isResubmit, setIsResubmit] = useState(false);
    const [expireIn, setExpireIn] = useState(Date.now() + 60000);
    const [btndis, setBtnDis] = useState(false);

    const [formData, setFormData] = useState({
        firstName: "", lastName: "", type: ""
    })
    const [options, setOptions] = useState({ email: false, mobile: false });
    const [countryCode, setCountryCode] = useState("91");
    const [mobileNumber, setMobileNumber] = useState("");
    const [inpemail, setInpEmail] = useState("");

    let regex = /^[0-9]+$/;

    useEffect(() => {
        getOption()
    }, [props])

    const getOption = async () => {
        try {
            if (props?.data?.email) {
                let reqData = { email: props?.data?.email };
                let getData = await getRecoveryOtpionHooks(reqData);
                if (getData?.status) {
                    setOptions(getData?.result)
                }
            }
        } catch (e) {
            console.log("getOption__err", e)
        }
    }
    useEffect(() => {
        if (show) {
            setIsResubmit(false);
            setExpireIn(Date.now() + 5 * (60000))
        }
        setIsResubmit(false);
    }, [show])


    const close = () => {
        setError({}); setOtp("");
        setFormData({});
        setOptions({ email: false, mobile: false })
        setIsResubmit(false);
        setCountryCode("91");
        setMobileNumber("");
        setInpEmail("");
        setIsResubmit(false)
        setTabCount(1)
        props.handleClose();
        props?.setMethod("recovery") // we when open the forgot passwrod only call the props
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


    const handleChange = (e) => {
        try {
            const { id, value } = e?.target;
            setFormData({ ...formData, ...{ [id]: value } });
            setError({ ...error, ...{ [id]: '' } })
        } catch (e) {
            console.log("handleChange__Err", e);
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


    const getRecoverySettings = async () => {
        try {
            const isValid = await validateUserRecovery(formData);
            if (isValid.status) {
                setError(isValid.errors);
                return
            }
            const { status, message, error, result } = await getRecoveryUserOptions(formData);
            if (status) {
                // showToastMessage(message, 'success')
                setOptions(result.data);
                setTabCount(2)
            } else {
                setError(error);
                !isEmpty(message) && showToastMessage(message, 'error')
            }
        } catch (e) {
            console.log("getRecoverySettings_err", e);
        }
    }

    const fetchRecoveryCode = async () => {
        try {
            let validateData = {
                type: formData.type,
                challengeId: challengeId,
                mobileNumber: mobileNumber,
                useremail: inpemail
            }
            const isValid = await validateRecovery(validateData);
            if (isValid?.status) {
                setError({ ...error, ...isValid.errors });
                return
            }
            setError({})

            let reqData = {
                useremail: inpemail,
                countryCode: countryCode,
                mobileNumber: mobileNumber,
                type: formData.type,
                challengeId: challengeId
            }
            const getData = await getRecoveryCode(reqData);
            if (getData?.status) {
                showToastMessage(getData?.message, 'success')
                setTabCount(3)
            } else {
                setError(getData?.error);
                !isEmpty(getData?.message) && showToastMessage(getData?.message, 'error')
                if (getData?.message == 'This login session has expired. Please log in again.') {
                    close()
                }
            }
        } catch (e) {
            console.log("fetchRecoveryCode_err", e);
        }
    }

    const handlePhoneNumber = (value, country) => {
        const { dialCode } = country;
        let newPhoneNo = value;
        setMobileNumber(newPhoneNo.slice(dialCode.length));
        setCountryCode(dialCode);
    }

    const handleContinue = () => {
        // console.log('formData_Det', formData)
        if (formData.type === '') {
            setError({ ...error, ...{ type: "Choose any option" } });
            return
        } else {
            setTabCount(2);
            setError({})
        }
    }

    const verifyLogin = async () => {
        try {
            let reqData = {
                otp: otp,
                challengeId: challengeId,
                platform: 'web'
            }
            const { status, errors } = await validateUserLoginVerification(reqData);
            if (status) {
                setError(errors);
            } else {
                const resp = await loginVerificationHooks(reqData);
                let result = resp?.data;
                if (result?.success) {
                    if (!isEmpty(result?.result)) {
                        // SECURITY FIX (VAPT: "Token Storage Security" — Points
                        // 44/49/70): no Authorization header/localStorage write
                        // for the token — backend already set the httpOnly
                        // cookie. Decode is in-memory/transient only.
                        const decoded = jwtDecode(result?.result);
                        localStorage.setItem("code", decoded.showWelcomeCard)
                        createSocketUser(decoded?.userId);
                        await handleLogin();
                    }
                    setError({});
                    showToastMessage(result?.message, 'success');
                } else if (!result?.success) {
                    setError(result?.errors);
                    if (result?.message) {
                        showToastMessage(result?.message, 'error')
                    }
                    if (result?.message == 'This login session has expired. Please log in again.') {
                        close()
                    }
                    else if (result?.message == "Too many failed attempts. Please log in again.") {
                        close()
                    }
                }
            }
        } catch (e) {
            console.log("verifyLogin__Err", e)
        }
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
                    <h4 className={`${styles.modalHeaderTitle}`}>{props?.filter == "login" ? "Alternative Sign-In" : "Forgot Password"}</h4>
                </Modal.Header>
                <Modal.Body className={styles.modalPrimaryBody}>
                    {/* {
                        tabCount == 1 &&
                        <form onSubmit={(e) => { e.preventDefault() }}>
                            <div className={styles.twoFactorAuthPart}>
                                <InputComponent
                                    label={"First Name"}
                                    placeholder={"Enter your first name"}
                                    id="firstName"
                                    error={error?.firstName}
                                    value={formData?.firstName}
                                    onChange={(e) => {
                                        if (alpharegex.test(e?.target?.value) || e?.target?.value == "") { handleChange(e) }
                                    }}
                                />
                                <InputComponent
                                    label={"Last Name"}
                                    placeholder={"Enter your last name"}
                                    id="lastName"
                                    value={formData?.lastName}
                                    onChange={(e) => { if (alpharegex.test(e?.target?.value) || e?.target?.value == "") { handleChange(e) } }}
                                    error={error?.lastName} />

                            </div>
                        </form>
                    } */}
                    {
                        tabCount == 1 &&
                        <form onSubmit={(e) => { e.preventDefault() }}>
                            <div className={styles.twoFactorAuthPart}>
                                {options?.email && <label htmlFor="selectEmailId">
                                    <h3 className="text-center mb-2">Email</h3>
                                    <div>
                                        <input type="radio" name="selectRestoreOption" id="selectEmailId" onChange={() => { setFormData({ ...formData, ...{ type: "email" } }) }} />
                                    </div>
                                </label>}

                                {
                                    options?.mobile &&
                                    <label htmlFor="selectPhone">
                                        <h3 className="text-center mb-2">Mobile</h3>
                                        <div>
                                            <input type="radio" name="selectRestoreOption" id="selectPhone" onChange={() => { setFormData({ ...formData, ...{ type: "mobile" } }) }} />
                                        </div>
                                    </label>
                                }
                            </div>
                            <p className="text-danger mt-3">{error?.type}</p>
                        </form>
                    }
                    {
                        tabCount == 2 &&
                        <form onSubmit={(e) => { e.preventDefault() }}>
                            <div className={styles.twoFactorAuthPart}>
                                {
                                    formData?.type == "email" &&
                                    // <div className="col-12 col-md-6 mb-2">
                                    <InputComponent label={"Email Address"} type="email" placeholder={"Enter your Email Address"} id="email" value={inpemail} onChange={(e) => setInpEmail(e?.target?.value)} error={error?.email} />
                                    // </div>
                                }

                                {
                                    formData?.type == "mobile" &&
                                    <div className="">
                                        <div className={`${styles.phoneInputContainer} recoveryPhoneInp phoneInputContainer mt-2`}>
                                            <PhoneInput
                                                countryCodeEditable={false}
                                                placeholder="Enter Phone Number"
                                                country={"in"}
                                                onChange={handlePhoneNumber}
                                            />
                                        </div>
                                        <p className="text-danger mt-2">
                                            {error?.mobileNumber}
                                        </p>
                                    </div>
                                }
                            </div>
                        </form>
                    }
                    {
                        tabCount == 3 &&
                        <form onSubmit={(e) => { e.preventDefault() }}>
                            <div className="">
                                <div className="">
                                    <p className={`${styles.formLabel}`}>{formData?.type == "google" ? "Enter 2FA code" : "Enter OTP"}</p>
                                    <div className={`${styles.otpInputWrapper} otpInputWrapper mt-2`}>
                                        <OtpInput
                                            shouldAutoFocus={true}
                                            value={otp ? (otp == "" || regex.test(otp)) ? otp : (otp == "" || regex.test(otp)) ? otp : "" : ""}
                                            onChange={(e) => { setOtp(e) }}
                                            numInputs={6}
                                            renderInput={(props) => <input {...props} />}
                                        />

                                    </div>
                                    <div className={`${styles.countdownInstruct} mt-3`}>
                                        <p className="">
                                            We have sent a code to
                                            &nbsp;

                                            {
                                                formData.type == "email" ? maskEmail(inpemail) : `*******${mobileNumber?.slice(-3)}`
                                            }

                                        </p>
                                        &nbsp;
                                        {
                                            (formData.type == "email" && isResubmit == false) &&
                                            <div className={styles.countdown}>
                                                <Countdown
                                                    date={expireIn}
                                                    renderer={renderer}
                                                />
                                            </div>
                                        }

                                    </div>
                                    <span className="text-danger f-12 d-block text-left mt-2">
                                        {error?.mobile}
                                        {error?.otp}
                                    </span>
                                </div>
                                <div className="mt-4">
                                    {}

                                </div>
                            </div>
                        </form>
                    }
                </Modal.Body>
                <Modal.Footer className={`${styles.modalPrimaryFooter}`}>
                    <div className={`${styles.modalFooterActions}`}>
                        {
                            tabCount === 1 &&
                            <Button
                                isLoading={false}
                                loadingText="Loading..."
                                btnText="Continue"
                                disabled={btndis}
                                // getRecoverySettings() 
                                onClick={() => { handleContinue() }}
                                className="cardSuccessBtnSm"
                                selectedValue={null}
                            />
                        }
                        {
                            tabCount === 2 &&
                            <Button
                                isLoading={false}
                                loadingText="Loading..."
                                btnText="Submit"
                                disabled={btndis}
                                onClick={() => { fetchRecoveryCode() }}
                                className="cardSuccessBtnSm"
                                selectedValue={null}
                            />
                        }
                        {
                            tabCount == 3 ?
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
                                        onClick={() => { verifyLogin() }}
                                        className="cardSuccessBtnSm"
                                        selectedValue={null}
                                    /> : <></>
                        }
                    </div>
                </Modal.Footer>
            </Modal>
        </div>
    );
};