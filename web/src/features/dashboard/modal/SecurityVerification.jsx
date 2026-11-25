/** PACKAGE IMPORT */

import React, { useEffect, useRef, useState } from "react";
import { Modal } from "react-bootstrap";
import { IoClose } from "react-icons/io5";
import OtpInput from 'react-otp-input';
import { useSelector } from "react-redux";

/** LOCAL FILES IMPORT */

import styles from "../styles/modal.module.css"
import Button from "../../../components/Button/Button";

/** ACTIONS */


/** CONFIG */


/** CODE START */

const SecurityVerification = (props) => {
    const { location, data, show } = props
    const { userdetails } = useSelector((state) => state.user);

    const [error, setError] = useState({});
    const [otp, setOtp] = useState("");
    const [isResubmit, setIsResubmit] = useState(false);
    const [expireIn, setExpireIn] = useState(Date.now() + 60000);
    const [isLoading, setIsLoading] = useState(false);

    const close = () => {
        setError({}); setOtp("");
        setIsResubmit(false);
        props.handleClose();
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
                    <h4 className={`${styles.modalHeaderTitle} `}>Security Verification</h4>
                </Modal.Header>
                <Modal.Body className={styles.modalPrimaryBody}>
                    <form onSubmit={(e) => { e.preventDefault() }}>
                        <div className="">
                            <div className="">
                                <p className={`${styles.formLabel}`}>Email verification code</p>

                                <div className={`${styles.otpInputWrapper} d-flex gap-1 flex-wrap flex-lg-nowrap otpInputWrapper mt-2`}>
                                    <OtpInput
                                        shouldAutoFocus={true}
                                        value={otp}
                                        onChange={(e) => { setOtp(e) }}
                                        numInputs={6}
                                        // renderSeparator={<span>-</span>}
                                        renderInput={(props) => <input {...props} />}
                                    />
                                    <Button
                                        isLoading={false}
                                        loadingText="Loading..."
                                        btnText={isLoading ? "Loading..." : "Send Code"}
                                        className="cardSuccessBtnSm"
                                        onClick={() => { }}
                                        selectedValue={null}
                                    />
                                </div>
                                <span className="text-danger f-12 d-block text-left mt-2">
                                    {error?.mobileNumber}
                                    {error?.errors}
                                    {error?.otp}
                                </span>
                            </div>
                            <div className="">
                                <p className={`${styles.formLabel}`}>2FA code</p>
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
                                <span className="text-danger f-12 d-block text-left mt-2">
                                    {error?.mobileNumber}
                                    {error?.errors}
                                    {error?.otp}
                                </span>
                            </div>
                        </div>
                    </form>

                </Modal.Body>
                <Modal.Footer className={`${styles.modalPrimaryFooter}`}>
                    <div className={`${styles.modalFooterActions}`}>
                        <Button
                            isLoading={false}
                            loadingText="Loading..."
                            btnText={isLoading ? "Loading..." : "Cancel"}
                            className="darkFillSquareBtn"
                            onClick={() => { }}
                            selectedValue={null}
                        />
                        <Button
                            isLoading={false}
                            loadingText="Loading..."
                            btnText={isLoading ? "Loading..." : "Submit"}
                            onClick={() => { }}
                            className="cardSuccessBtnSm"
                            selectedValue={null}
                        />
                    </div>
                </Modal.Footer>
            </Modal>
        </div>
    );
};

export default SecurityVerification;
