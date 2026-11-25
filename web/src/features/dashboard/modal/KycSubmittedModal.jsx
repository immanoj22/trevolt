/** PACKAGE IMPORT */

import React, { useEffect, useRef, useState } from "react";
import { Modal } from "react-bootstrap";
// import { useSelector } from "react-redux";
import { IoClose } from "react-icons/io5";
import Lottie from "lottie-react";
import verified from "../../../assets/json/verified.json";

/** LOCAL FILES IMPORT */

import styles from "../styles/modal.module.css"

/** ACTIONS */


const KycSubmittedModal = (props) => {

    const { show, handleClose } = props;

    return (
        <div>
            <Modal
                centered
                size="md"
                backdrop="static"
                show={show}
                onHide={handleClose}
                className={styles.modalPrimary + " kycSubmit_modal"}
            >

                <button
                    aria-label="closeIcon"
                    className={styles.modalCloseButton}
                    onClick={handleClose}
                >
                    <IoClose />
                </button>

                <Modal.Body className={styles.modalPrimaryBody}>
                    <div className={"documentSubmitted"}>
                        <Lottie animationData={verified} loop={true} className="verified_src" />
                        <h4 className="mt-4 text-center mb-2 title-txt">KYC Verification - Submitted</h4>
                        <p className="text-center sub-title-txt">Your KYC documents have been submitted successfully for verification.</p>
                    </div>
                </Modal.Body>
            </Modal>
        </div >
    );
};

export default KycSubmittedModal;