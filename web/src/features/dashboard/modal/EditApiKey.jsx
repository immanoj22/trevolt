/** PACKAGE IMPORT */

import React, { useEffect, useRef, useState } from "react";
import { Modal } from "react-bootstrap";
import { IoClose } from "react-icons/io5";
import "react-phone-input-2/lib/style.css";

/** LOCAL FILES IMPORT */

import styles from "../styles/modal.module.css"
import Button from "../../../components/Button/Button";
import { MultipleCheckboxSelect, PrimaryInput } from "../../../components/Input/InputFields";


/** ACTIONS */

const options = [
    { label: "105.5,106.51.150.4", value: "105.5,106.51.150.4" },
    { label: "106.5,106.51.150.5", value: "106.5,106.51.150.5" },
    { label: "107.5,106.51.150.6", value: "107.5,106.51.150.6" },
];
const EditApiKey = (props) => {
    const { show, handleClose } = props
    return (
        <div>
            <Modal
                centered
                size="md"
                backdrop="static"
                show={show}
                onHide={handleClose}
                className={styles.modalPrimary}
            >
                <button
                    aria-label="closeIcon"
                    className={styles.modalCloseButton}
                    onClick={handleClose}
                >
                    <IoClose />
                </button>
                <Modal.Header className={styles.modalPrimaryHeader}>
                    <h4 className={`${styles.modalHeaderTitle} `}>Update Whitelisted IP Address</h4>
                </Modal.Header>
                <Modal.Body className={styles.modalPrimaryBody}>
                    <div className={`${styles.cardBorder} p-3 text-center mb-4`}>
                        <label className={`${styles.singleFormLabel}`}>
                            API Key Name <b>Trevolt_key</b>
                        </label>
                    </div>
                    <div className={`${styles.singleFormWrapperSm} mb-4`}>
                        <label className={styles.singleFormLabel}>
                            Whitelisted IP
                        </label>
                        <PrimaryInput className='primaryInputBgThree' placeholder={"Enter Whitelisted IP"} />
                    </div>


                    <div className={`${styles.singleFormWrapperSm} mb-4`}>
                        <label className={styles.singleFormLabel}>
                            IP’s to whitelist
                        </label>
                        <div className={styles.webHookSelect}>
                            <MultipleCheckboxSelect options={options} />
                        </div>
                    </div>
                    <div>
                        <p className={styles.notesText}>To enhance security, our API allows you to whitelist specific IP addresses. Only requests coming from the whitelisted IPs will be able to access your API key. Make sure to update it whenever your IP changes.</p>
                    </div>
                </Modal.Body>

                <Modal.Footer className={`${styles.modalPrimaryFooter}`}>
                    <div className={`${styles.modalFooterActions}`}>
                        <Button
                            isLoading={false}
                            loadingText="Loading..."
                            btnText="Update IP Address"
                            onClick={() => handleClose()}
                            className="cardSuccessBtnSm"
                            selectedValue={null}
                        />
                    </div>
                </Modal.Footer>
            </Modal>
        </div>
    );
};

export default EditApiKey;
