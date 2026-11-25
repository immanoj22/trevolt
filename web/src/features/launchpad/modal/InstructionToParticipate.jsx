/** PACKAGE IMPORT */

import { Modal } from "react-bootstrap";
import { IoClose } from "react-icons/io5";

/** LOCAL FILES IMPORT */

import styles from '../styles/modal.module.css';
import Button from "../../../components/Button/Button";


/** CODE START */

const InstructionToParticipate = ({ show, handleClose, traderData }) => {
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
                            <div className="custom-checkInput__container4 mt-4">
                                <label className="custom-checkInput__label4">
                                    <input
                                        type="checkbox"
                                    // onChange={(e) => {
                                    //     setcheckValue(e.target.checked)
                                    // }}
                                    // checked={checkValue}
                                    />
                                    <span className="custom-checkInput__checkmark4"></span>
                                </label>
                                <p className="custom-checkInput__content4">
                                    I have read and I agree to the Terms and Conditions of this program
                                </p>
                            </div>
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
                                btnText="Deposit USDT Now"
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

export default InstructionToParticipate