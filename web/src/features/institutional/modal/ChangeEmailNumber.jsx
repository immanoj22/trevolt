/** PACKAGE IMPORT */

import React, { useEffect, useRef, useState } from "react";
import { Modal } from "react-bootstrap";
import { useSelector } from "react-redux";
import { IoClose } from "react-icons/io5";
import PhoneInput from "react-phone-input-2";
import "react-phone-input-2/lib/style.css";
import OtpInput from 'react-otp-input';

/** LOCAL FILES IMPORT */

import styles from "../styles/modal.module.css"
import Button from "../../../components/Button/Button";
import { mobileVerificationCodeHooks, verifyMobileVerificationHooks } from "../../../actions/userAction";
import { showToastMessage } from "../../../lib/toast";
// import { newMobileOtp, updateMobileNumber, updateUserEmail } from "../actions/userAction";


/** ACTIONS */


const ChangeEmailNumber = (props) => {

    const close = () => {
        props.handleClose();
    }


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
                    <h4 className={`${styles.modalHeaderTitle} `}>{props.type == "email" ? "Change Email" : "Change Phone Number"}</h4>
                </Modal.Header>
                <Modal.Body className={styles.modalPrimaryBody}>
                    <div className="">
                        <div className="">
                            <p className={`${styles.formLabel}`}>{props.type == "email" ? "New Email" : "New Phone Number"}</p>

                            <div className={`${styles.phoneInputContainer} phoneInputContainer mt-2`}>
                                <PhoneInput
                                    countryCodeEditable={false}
                                    placeholder="Enter Phone Number"
                                    country={"in"}
                                />
                                <Button
                                    isLoading={false}
                                    loadingText="Loading..."
                                    btnText="Get OTP"
                                    className="cardSuccessBtnXs"
                                    selectedValue={null}
                                />
                            </div>
                        </div>

                        <div className="mt-4">
                            <p className={`${styles.formLabel}`}>Enter OTP</p>

                            <div className={`${styles.otpInputWrapper} otpInputWrapper mt-2`}>
                                <OtpInput
                                    shouldAutoFocus={true}
                                    // value={otp ? (otp == "" || regex.test(otp)) ? otp : (otp == "" || regex.test(otp)) ? otp : "" : ""}
                                    // onChange={(e) => { setOtp(e) }}
                                    numInputs={6}
                                    renderInput={(props) => <input {...props} />}
                                />

                            </div>
                        </div>

                    </div>
                </Modal.Body>

                <Modal.Footer className={`${styles.modalPrimaryFooter}`}>
                    <div className={`${styles.modalFooterActions}`}>
                        <Button
                            isLoading={false}
                            loadingText="Loading..."
                            btnText="Submit"
                            className="cardSuccessBtnSm"
                            selectedValue={null}
                        />
                    </div>
                </Modal.Footer>
            </Modal>
        </div>
    );
};

export default ChangeEmailNumber;
