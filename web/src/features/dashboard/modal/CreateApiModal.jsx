/** PACKAGE IMPORT */

import React, { useState } from "react";
import { Modal } from "react-bootstrap";
import { IoClose } from "react-icons/io5";
import { useSelector, useDispatch } from 'react-redux';
import isEmpty from "is-empty";
/** LOCAL FILES IMPORT */

import styles from "../styles/modal.module.css"
import Button from "../../../components/Button/Button";

/** Actions */
import { createApikey, getApikeys } from "../../../actions/apikeyAction";
import { ApiKeyList } from "../../../redux/apikeyAction";
import { showToastMessage } from "../../../lib/toast";
import { InputComponent } from "../../../components/Input/InputFields";
import OtpInput from 'react-otp-input';
import Countdown, { zeroPad } from "react-countdown";
import { validateresendLoginCode } from "../../../pages/Validation/userValidation";
import { resendCodeHooks, resendLoginCodeHooks } from "../../../actions/userAction";


const initialState = {
    otp: 0,
    name: "",
}

const CreateApiModal = (props) => {
    const [expireIn, setExpireIn] = useState(Date.now() + 5 * (60000));

    const { show, handleClose } = props
    const { userdetails } = useSelector((state) => state.user);
    const dispatch = useDispatch();

    // Was missing — a newly created key was only ever patched into
    // APImanagementNew.jsx's own local `apiKeyDetails` state (via the
    // `close(result)` -> handleClose -> setNewApikey chain below). Redux's
    // `state.apikey.apiKeyList` — the actual source of truth, normally
    // populated once at login by HelperRoutes.js's fetchApiKeyLists — never
    // learned about the new key, so any later re-sync from Redux (tab
    // revisit, remount, etc.) would silently drop it again. Re-fetching and
    // re-dispatching here keeps Redux itself up to date, the same way
    // fetchApiKeyLists does at login.
    const refreshApiKeyList = async () => {
        try {
            const { result, status } = await getApikeys(userdetails?.secretKey);
            if (status) {
                dispatch(ApiKeyList({ apikeys: result?.data }));
            }
        } catch (e) {
            console.log("refreshApiKeyList__Err", e);
        }
    }

    const [errors, setErrors] = useState({});
    const [formValue, setFormValue] = useState(initialState);
    const [isResubmit, setIsResubmit] = useState(false);
    const [isShow, setIsShow] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    const close = (data = {}) => {
        setIsShow(false)
        setIsResubmit(false);
        setIsLoading(false)
        setFormValue(initialState)
        handleClose(data)
    }


    const renderer = ({ days, hours, minutes, seconds, completed }) => {
        if (completed) {
            setIsResubmit(true)
            setIsLoading(true)
        } else {
            return <span className="">
                {zeroPad(minutes)}m : {zeroPad(seconds)}s
            </span>
        }
    }

    const onChangeHandler = (event) => {
        try {
            const { name, value } = event.target
            const numbers = /^[+]?([0-9]+(?:\.[0-9]*)?|\.[0-9]+)$/;
            const textNum = /^[A-Za-z0-9]{0,8}$/
            // validate numeric fields
            if (['tradingExperience', 'followersCount'].includes(name) && (value !== "" && !numbers.test(value))) {
                return false;
            } if (['referralCode'].includes(name) && (value !== "" && !textNum.test(value))) {
                return false;
            }

            setFormValue(prev => ({ ...prev, [name]: value }));
            setErrors(prev => ({ ...prev, [name]: '' }));
        } catch (e) {
        }
    };


    const createKey = async () => {
        try {
            setIsLoading(false)
            const { status, message, result, error } = await createApikey(formValue, userdetails?.secretKey);

            if (status) {
                showToastMessage(message, status ? "success" : "error")
                if (message === "Api-Key created successfully") {
                    await refreshApiKeyList();
                    close(result);
                    return
                }
                setIsShow(true);
                setIsLoading(false);
                setExpireIn(Date.now() + 5 * (60000));
            } else {
                !isEmpty(message) && showToastMessage(message, status ? "success" : "error")
                setErrors(error);
                setIsLoading(false)
            }
        } catch (e) {
            console.log("createKey_err", e);
            setIsLoading(false)
        }
    }

    const resendCode = async () => {
        try {
            setIsResubmit(true);
            const resp = await resendCodeHooks(userdetails.secretKey);
            let result = resp?.data;
            if (result?.success) {
                setExpireIn(Date.now() + 5 * (60000))
                showToastMessage(result?.message, 'success');
                setIsResubmit(false);
                setIsLoading(false)
            }
            setIsResubmit(false);
        } catch (e) {
            console.log("resendOtp__Err", e);
        }
    }


    return (
        <div>
            <Modal
                centered
                size="md"
                backdrop="static"
                show={show}
                onHide={() => close()}
                className={styles.modalPrimary}
            >
                <button
                    aria-label="closeIcon"
                    className={styles.modalCloseButton}
                    onClick={() => close()}
                >
                    <IoClose />
                </button>
                <Modal.Header className={styles.modalPrimaryHeader}>
                    <h4 className={`${styles.modalHeaderTitle} `}>Create API</h4>
                </Modal.Header>
                <Modal.Body className={styles.modalPrimaryBody}>
                    <div className="">
                        <p className={`${styles.formLabel}`}>Label API Key to proceed</p>
                        <div className="mt-2">
                            <InputComponent staticClass='' staticClassInput='' placeholder={"Enter the apikey name"}
                                value={formValue.name}
                                name={'name'}
                                onChange={(e) => onChangeHandler(e)}
                                error={errors?.name}
                            />
                        </div>
                    </div>

                    {
                        isShow &&
                        <div className={`${styles.otpInputWrapper} otpInputWrapper mt-4`}>
                            <p className={`${styles.formLabel} mb-2`}>{
                                (userdetails.tfaType === "email" || "mobile") ? "Enter OTP" : "Enter 2FA Code"
                            }</p>
                            <div className="d-flex align-items-center">
                                <OtpInput
                                    shouldAutoFocus={true}
                                    value={formValue?.otp}
                                    onChange={(e) => {
                                        setErrors(prev => ({ ...prev, otp: '' }));
                                        setFormValue(prev => ({ ...prev, otp: e }))
                                    }}
                                    numInputs={6}
                                    renderInput={(props) => (
                                        <input
                                            {...props}
                                            onKeyDown={(e) => {
                                                // if (e.key === "Enter") {
                                                //     e.preventDefault();
                                                //     verifyLogin(); // call your submit fn
                                                // }
                                            }}
                                        />
                                    )}
                                />

                                {
                                    userdetails.tfaType === "email" &&
                                    <div>
                                        {
                                            isResubmit ?
                                                <Button btnText={"Resend OTP"} className="cardSuccessBtnSm"
                                                    onClick={() => {
                                                        resendCode()
                                                    }}
                                                />
                                                :
                                                <div className={`${styles.countdownInstruct}`}>
                                                    {
                                                        <div className={styles.countdown}>
                                                            <Countdown
                                                                date={expireIn}
                                                                renderer={renderer}
                                                            />
                                                        </div>
                                                    }
                                                </div>
                                        }
                                    </div>
                                }
                            </div>
                            <p className={`text-danger mt-2`}> {errors?.otp} </p>

                        </div>
                    }
                </Modal.Body>
                <Modal.Footer className={`${styles.modalPrimaryFooter}`}>
                    <div className={`${styles.modalFooterActions}`}>
                        <Button
                            isLoading={false}
                            loadingText="Loading..."
                            btnText="Cancel"
                            onClick={() => close()}
                            className="cardSuccessBtnSm"
                            selectedValue={null}
                        />
                        <Button
                            // isLoading={isLoading}
                            loadingText="Loading..."
                            btnText="Next"
                            onClick={() => createKey()}
                            className="cardSuccessBtnSm"
                            selectedValue={null}
                            disabled={isLoading}
                        />
                    </div>
                </Modal.Footer>
            </Modal>
        </div>
    );
};

export default CreateApiModal;