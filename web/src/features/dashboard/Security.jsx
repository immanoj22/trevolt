/** PACKAGE IMPORT */

import { useEffect, useState } from 'react'
import Select from 'react-select'
// import React, { useEffect, useState } from 'react'
import { GiConfirmed } from 'react-icons/gi'
import { IoIosCloseCircleOutline } from 'react-icons/io'
import { IoWarningOutline } from 'react-icons/io5'
import { PiSealWarningFill } from 'react-icons/pi'
import { Link, useNavigate } from 'react-router-dom'
import { FaCheckCircle } from "react-icons/fa";
import { CgDanger } from "react-icons/cg";
import { FaCopy } from 'react-icons/fa6'
import QRCode from "react-qr-code";
import { FaEye } from "react-icons/fa";
import { FaEyeSlash } from "react-icons/fa";
import OtpInput from 'react-otp-input';
import { AiFillInfoCircle } from "react-icons/ai";
import { MdEmail } from "react-icons/md";
import { FaPhoneAlt } from "react-icons/fa";
import { FaArrowRightFromBracket } from "react-icons/fa6";

/** LOCAL FILES IMPORT */

import styles from "./styles/authInnerPage.module.css"
import Button from '../../components/Button/Button'
import { useDispatch, useSelector } from 'react-redux'
import { disable2FAHooks, enable2FAHooks, generate2faHooks, updateTwoFactorMethodHooks } from '../../actions/userAction'
import isEmpty from 'is-empty'
import { validate2FA } from '../../pages/Validation/userValidation'
import { showToastMessage } from '../../lib/toast'


/** CODE START */

const Security = (props) => {

    let regex = /^[0-9]+$/;
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const { userdetails } = useSelector((state) => state.user);

    const [type, setType] = useState('email')
    const [googleAuthVerify, setGoogleAuthVerify] = useState(false);
    const [secretData, setSecretData] = useState({});
    const [code, setCode] = useState("");
    const [checkValue, setcheckValue] = useState(false);
    const [errors, setErrors] = useState({})

    const authOptions = [
        { value: 'mobile', label: 'Mobile' },
        { value: 'email', label: 'Email' },
        { value: 'google2fa', label: 'Google' },
    ];


    const handleEmailManagement = () => {
        navigate('/email-management', { state: userdetails })
    }
    const handlePhoneManagement = () => {
        navigate('/number-management')
    }

    const handleCopy = (secret) => {
        showToastMessage("The secret code has been copied!", "success")
        navigator.clipboard.writeText(secret)
    }


    // venkatesh


    useEffect(() => {
        setType(userdetails?.tfaType);
        if (Object.values(userdetails)?.length > 0) {
            fetch2fa()
        }
    }, [userdetails]);



    const updateType = async (types) => {
        try {
            const resp = await updateTwoFactorMethodHooks(types, userdetails?.secretKey);
            let update = resp?.data;
            if (update.success) {
                setType(types);
                showToastMessage(update.message, 'success')
            } else {
                showToastMessage(update.message, 'error')
            }
        } catch (e) {
            console.log("updateType_err", e);
        }
    }

    const fetch2fa = async () => {
        try {
            const resp = await generate2faHooks(userdetails.secretKey);
            let result = resp?.data;
            if (result?.success) {
                setSecretData(result?.result?.data)
                if (result.result?.data?.enable) {
                    setGoogleAuthVerify(true)
                }
            }
        } catch (err) {
            console.log(err, 'fetch2fa__err')
        }
    }


    const enableTwoFa = async () => {
        try {
            let reqData = {
                "secret": secretData.secret,
                "uri": secretData.uri,
                "code": code,
                "checkValue": checkValue,
            }

            const { status, errors } = await validate2FA(reqData);
            if (!checkValue) {
                errors['checkValue'] = 'Check is required'
            }
            // SECURITY FIX: removed console.log of sensitive client-side data (secretKey/password/OTP)
            if (status) {
                setErrors(errors);
            } else {
                const resp = await enable2FAHooks(reqData, userdetails?.secretKey);
                let result = resp?.data;
                if (result?.success) {
                    showToastMessage(result?.message, 'success');
                    setSecretData(result?.result);
                    setGoogleAuthVerify(true);
                    setCode("");
                    setErrors({});
                    setcheckValue(false);
                } else if (!result?.success) {
                    setErrors(result?.errors);
                    if (result?.message) {
                        showToastMessage(result?.message, "error")
                    }
                }
            }
        } catch (e) {
            console.log("enableTwoFa__Err", e)
        }
    }


    const disableTwoFa = async () => {
        try {
            let reqData = {
                "secret": secretData.secret,
                "uri": secretData.uri,
                "code": code,
                "checkValue": checkValue
            }
            const { status, errors } = await validate2FA(reqData);
            if (status) {
                setErrors(errors);
            } else {
                const resp = await disable2FAHooks(reqData, userdetails?.secretKey);
                let result = resp?.data;
                if (result?.success) {
                    showToastMessage(result?.message, 'success');
                    // setSecretData(result?.result);
                    fetch2fa();
                    setErrors({});
                    setCode("");
                    setcheckValue(false);
                    setGoogleAuthVerify(false);
                } else if (!result?.success) {
                    setErrors(result?.errors);
                    if (result?.message) {
                        showToastMessage(result?.message, "error");
                    }
                }
            }
        } catch (e) {
            console.log("disableTwoFa__Err", e)
        }
    }

    useEffect(() => {
        window.scrollTo({
            top: 0,
            behavior: "smooth",
        });
    }, []);

    return (
        <div>
            <h5 className={styles.pageTitle}>Security</h5>
            <div className={`${styles.cardBorder} margin-top__xl`}>
                <div className={`${styles.cardBorderInfo}`}>
                    <h5 className={`${styles.cardBorderTitle}`}>Two-Factor Authentication (2FA)</h5>
                    <div className={`${styles.twoFAright}`}>
                        <p className={`${styles.label}`}>Choose Authentication</p>
                        <div className={`react-select__width-sm`}>
                            <Select
                                // menuIsOpen
                                isSearchable={false}
                                placeholder="Select"
                                classNamePrefix="react-select__primary"
                                options={
                                    authOptions
                                    // (userdetails && userdetails?.mobileNumber === "" || userdetails?.mobileNumber === 0) ?
                                    //     authOptions.filter((el) => el.value != "mobile") : authOptions
                                }
                                onChange={(e) => { updateType({ type: e.value }) }}
                                value={
                                    !isEmpty(type)
                                        ? authOptions.find(
                                            (val) => val.value == type
                                        )
                                        : ""
                                }
                            />
                        </div>
                    </div>
                </div>
                <div className={`${styles.highlightCard} margin-top__xl`}>
                    <div className={`${styles.highlightCardInfo}`}>
                        <AiFillInfoCircle fontSize={20} className={`${styles.infoIcon} `} />
                        <p className={`${styles.highlightInfo}`}>To increase your account security, it is recommended that you enable 2FA.</p>
                    </div>
                </div>
                <div className='mt-4'>
                    <div className={`${styles.rowList}`}>
                        <div className={`${styles.rowListLeft}`}>
                            <div className={`${styles.rowListIcon}`}>
                                <MdEmail fontSize={20} />
                            </div>
                            <div>
                                <p className={`${styles.rowListTitle}`}>
                                    Email
                                </p>
                                <p className={`${styles.rowListInfo}`}>Use your email to protect your account and transactions.</p>
                            </div>
                        </div>
                        <div className={`${styles.rowListRight}`}>
                            {
                                userdetails && userdetails.emailStatus == "verified" ?
                                    <div className={`${styles.securityStatus}  ${styles[type === "email" ? "onStatus" : "offStatus"]}`}> <GiConfirmed fontSize={15} className='me-2' />{type == 'email' ? 'On' : 'Off'} </div>
                                    :
                                    <div className={`${styles.securityStatus}`}><IoIosCloseCircleOutline fontSize={15} className='me-2' /></div>
                            }
                            <Button
                                isLoading={false}
                                loadingText="Redirecting..."
                                btnText="Manage"
                                onClick={handleEmailManagement}
                                className="cardBtn"
                                selectedValue={null}
                            />
                            {/* <Link to="/email-management" className={`${styles.secondaryButton}`}>Manage</Link> */}
                        </div>
                    </div>
                    <div className={`${styles.rowList} mt-4`}>
                        <div className={`${styles.rowListLeft}`}>
                            <div className={`${styles.rowListIcon}`}>
                                <FaPhoneAlt fontSize={15} />
                            </div>
                            <div className=''>
                                <p className={`${styles.rowListTitle}`}>
                                    Phone Number
                                </p>
                                <p className={`${styles.rowListInfo}`}>Use your phone number to protect your account and transactions.</p>

                            </div>

                        </div>
                        <div className={`${styles.rowListRight}`}>
                            {
                                userdetails && userdetails.mobileStatus == "verified" ?
                                    <div className={`${styles.securityStatus} ${styles[type === "mobile" ? "onStatus" : "offStatus"]}`}>
                                        <GiConfirmed fontSize={15} className='me-2' />
                                        {type === 'mobile' ? 'On' : 'Off'}
                                    </div>
                                    :
                                    <div className={`${styles.securityStatus}`}><IoIosCloseCircleOutline fontSize={15} className='me-2' /></div>
                            }
                            <Button
                                isLoading={false}
                                loadingText="Redirecting..."
                                btnText="Manage"
                                onClick={handlePhoneManagement}
                                className="cardBtn"
                                selectedValue={null}
                            />
                            {/* <Link to='/number-management' className={`${styles.secondaryButton}`}>Manage</Link> */}
                        </div>
                    </div>
                </div>


            </div>
            <div className={`${styles.cardBorder} margin-top__xl`}>
                <h5 className={`${styles.cardBorderTitle}`}>Authenticator :
                    <span className={`${styles.googleAuthStatus} ${googleAuthVerify ? styles.enabled : styles.disabled} ms-2`}>
                        {googleAuthVerify ?
                            <span >
                                <FaCheckCircle className='me-2' />
                                {/* Enabled */}
                            </span> :
                            <span >
                                <CgDanger className='me-2' />
                                {/* Disabled */}
                            </span>}
                    </span></h5>

                <div className={`${styles.googleAuthContainer} margin-top__xl`}>

                    <div className={`${styles.qrCodeContainer}`}>
                        <div className={`${styles.qrCodeWrapper}`}>
                            {}
                            {!isEmpty(secretData) ?
                                <QRCode
                                    size={256}
                                    style={{ height: "auto", maxWidth: "100%", width: "100%" }}
                                    value={secretData?.uri}
                                    viewBox={`0 0 256 256`}
                                /> : ""}

                        </div>
                        {/* <div className={styles.qrCodeInfo}>Scan to get address</div> */}


                    </div>

                    <div className=''>
                        <div className="">
                            <label className={styles.googleAuthLabel}>Your 32 Digit Security Code</label>

                            <div className={`${styles.addCopier} mt-2`}>

                                <div className={`${styles.secretCodeWrapper}`}>
                                    {secretData?.secret}
                                </div>
                                <button
                                    aria-label='copyIcon'
                                    type="button"
                                    className=""
                                    onClick={() => handleCopy(secretData?.secret)}
                                // onClick={() => handlePasswordView()}
                                >
                                    {/* <CopyToClipboard
                                        text={secretData?.secret}
                                        onCopy={() => showToastMessage("The secret code has been copied!", "success")}
                                    > */}
                                    <FaCopy className={styles.svgColor} />
                                    {/* </CopyToClipboard> */}
                                </button>
                            </div>
                        </div>
                        <div className="mt-4">
                            <label className={styles.googleAuthLabel}>Enter 6 Digit Google Authentication Code</label>

                            <div className={`${styles.otpInputWrapper} mt-2`}>
                                <OtpInput
                                    shouldAutoFocus={true}
                                    // value={code}
                                    value={code ? (code == "" || regex.test(code)) ? code : (code == "" || regex.test(code)) ? code : "" : ""}
                                    onChange={(e) => { setCode(e) }}
                                    numInputs={6}
                                    renderInput={(props) => <input {...props} />}
                                />
                            </div>
                            {/* SECURITY FIX: removed stray debug console.log firing on every render */}
                            <p className=" text-danger mt-2">{errors?.code}</p>
                        </div>
                        {
                            secretData?.enable !== true &&
                            <div className="custom-checkInput__container mt-4">
                                <label className="custom-checkInput__label">
                                    <input
                                        type="checkbox"
                                        onChange={(e) => {
                                            setcheckValue(e.target.checked)
                                            setErrors({ ...errors, ...{ checkValue: "" } })
                                        }}
                                        checked={checkValue}
                                    />
                                    <span className="custom-checkInput__checkmark"></span>
                                </label>
                                <p className="custom-checkInput__content">
                                    I Have Backed Up The Secret Code
                                </p>
                            </div>
                        }
                        <p className="text-danger mt-2">{errors?.checkValue}</p>
                        {secretData?.enable == true ?
                            <div className={`margin-top__xl`}>
                                <Button
                                    isLoading={false}
                                    loadingText="Redirecting..."
                                    btnText="Disable"
                                    onClick={() => disableTwoFa()}
                                    className="cardDangerBtn"
                                    selectedValue={null}
                                />
                            </div>
                            :
                            <div className={`margin-top__xl`}>
                                <Button
                                    isLoading={false}
                                    loadingText="Redirecting..."
                                    btnText="Enable"
                                    onClick={() => enableTwoFa()}
                                    className="cardSuccessBtn"
                                    selectedValue={null}
                                />
                            </div>
                        }
                    </div>
                </div>
            </div>
            <div className={`${styles.cardBorder} margin-top__xl`}>
                <h5 className={`${styles.cardBorderTitle}`}>Devices and Activities</h5>

                <div className='row mt-4'>

                    <div className='col-md-6 mb-3'>
                        <div className={`${styles.rowListLeft}`}>
                            <div className={`${styles.rowListIcon}`}>
                                <FaArrowRightFromBracket fontSize={16} />
                            </div>
                            <div>
                                <p className={`${styles.rowListTitle}`}>Account Activity</p>
                                <p className={`${styles.rowListInfo}`}>Last login: {`${new Date(userdetails?.loginHistory?.startTime).toLocaleString()}`} </p>
                                <p className={`${styles.rowListInfo}`}>{`${userdetails?.loginHistory?.browserName}-${userdetails?.loginHistory?.os} ${userdetails?.loginHistory?.ipAddress}`}</p>
                            </div>
                            <div>

                            </div>
                        </div>
                    </div>
                    {/* <div className='col-md-6 d-flex justify-content-end'>

                        <Button
                            isLoading={false}
                            loadingText="Redirecting..."
                            btnText="More"
                            onClick={() => navigate('/manage-activity')}
                            className="cardBtn"
                            selectedValue={null}
                        />
                    </div> */}
                </div>


            </div>
        </div >
    )
}

export default Security