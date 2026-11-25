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

const RewardInstruction = ({ show, handleClose, traderData }) => {
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
                        <h4 className={`${styles.modalHeaderTitle} `}>How the Trevolt VIP Fee Program Works</h4>
                        <div className={`${styles.modalFormContainer} mt-4`}>
                            <p className={styles.modalLabel}>1. Complete KYC verification and deposit USD to your Trevolt spot account.</p>
                            <p className={styles.modalLabel}>2. Trade spot or derivatives on Trevolt to build your 30-day trading volume.</p>
                            <p className={styles.modalLabel}>3. Your VIP tier is reviewed daily from 30-day volume and total asset balance.</p>
                            <p className={styles.modalLabel}>4. Higher VIP tiers unlock lower maker and taker fees and priority support.</p>
                            <p className={styles.modalLabel}>5. Fee discounts apply automatically to eligible orders; see the Fees page for the full schedule.</p>
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

export default RewardInstruction