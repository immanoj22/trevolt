/** PACKAGE IMPORT */

import React, { useEffect, useRef, useState } from "react";
import { Modal } from "react-bootstrap";
import { IoClose } from "react-icons/io5";
import "react-phone-input-2/lib/style.css";

/** LOCAL FILES IMPORT */

import styles from "../styles/modal.module.css"
import Button from "../../../components/Button/Button";
import { InputComponent } from "../../../components/Input/InputFields";
/** ACTIONS */


const ChangeDisplayName = (props) => {

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
                    <h4 className={`${styles.modalHeaderTitle} `}>Update Display Name</h4>
                </Modal.Header>
                <Modal.Body className={styles.modalPrimaryBody}>
                    <InputComponent label={"First Name"} type="text" id="firstName" />
                    <InputComponent label={"Last Name"} id="lastName" />
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

export default ChangeDisplayName;
