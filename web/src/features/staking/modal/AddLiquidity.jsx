/** PACKAGE IMPORT */

import { Modal } from "react-bootstrap";
import { IoClose } from "react-icons/io5";
import { useState } from "react";
import Select from 'react-select'

/** LOCAL FILES IMPORT */

import styles from '../styles/modal.module.css';
import Button from "../../../components/Button/Button";
import { InputFileComponent, InputTextareaComponent, PrimaryInput, PrimaryTextarea } from "../../../components/Input/InputFields";


/** CODE START */

const AddLiquidity = ({ show, handleClose, liquidityData }) => {
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
                <Modal.Header className={styles.modalPrimaryHeader}>
                    
                    <button
                        aria-label="closeIcon"
                        className={styles.modalCloseButton}
                        onClick={handleClose}
                    >
                        <IoClose />
                    </button>
                </Modal.Header>
                <Modal.Body className={styles.modalPrimaryBody}>
                    <div className={styles.modalPrimaryBodyContainer}>
                        <h4 className={`${styles.modalHeaderTitle} `}>Redeem Your Earn Subscription</h4>
                        <div className={`${styles.modalFormContainer} mt-4`}>
                            <p className={styles.modalLabel}>After redemption, funds return to your Trevolt spot account and the Earn product is removed from the page.</p>
                        </div>
                        
                        <div className="mt-5 flexEnd">
                            <Button
                                isLoading={false}
                                loadingText="Redirecting..."
                                btnText="Cancel"
                                onClick={() => handleClose()}
                                className="cardBtnRectangleSm"
                                selectedValue={null}
                            />
                            <Button
                                isLoading={false}
                                loadingText="Redirecting..."
                                btnText="You have already participated"
                                // onClick={closingPositionOrder}
                                className="cardSuccessBtnSm"
                                selectedValue={null}
                            />
                        </div>
                    </div>

                </Modal.Body>
            </Modal>
        </div>
    )
}

export default AddLiquidity