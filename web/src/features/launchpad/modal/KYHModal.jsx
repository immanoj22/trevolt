/** PACKAGE IMPORT */

import { Modal } from "react-bootstrap";
import { IoClose } from "react-icons/io5";

/** LOCAL FILES IMPORT */

import styles from '../styles/modal.module.css';
import Button from "../../../components/Button/Button";
import { InputFileComponent, InputTextareaComponent, PrimaryInput, PrimaryTextarea } from "../../../components/Input/InputFields";


/** CODE START */

const KYHModal = ({ show, handleClose, kyhData }) => {
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
                    <h4 className={`${styles.modalHeaderTitle} `}>KYH</h4>
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
                        <div className={`${styles.modalFormContainer}`}>
                            <label className={styles.modalLabel}> Name </label>
                            <PrimaryInput
                                type="text"
                                id="quantity"
                                name={"quantity"}
                                placeholder="Enter Your Name"
                                // value={formData.quantity}
                                // onChange={onChangeHandler}
                                error={null}
                                className={'primaryInputBgTwo'}
                            />
                        </div>
                        <div className={`${styles.modalFormContainer} mt-3`}>
                            <label className={styles.modalLabel}> Designation </label>
                            <PrimaryInput
                                type="text"
                                id="quantity"
                                name={"quantity"}
                                placeholder="Enter Your Designation"
                                // value={formData.quantity}
                                // onChange={onChangeHandler}
                                error={null}
                                className={'primaryInputBgTwo'}
                            />
                        </div>
                        <div className={`${styles.modalFormContainer} mt-3`}>
                            <label className={styles.modalLabel}> Place of work </label>
                            <PrimaryInput
                                type="text"
                                id="quantity"
                                name={"quantity"}
                                placeholder="Place of work"
                                // value={formData.quantity}
                                // onChange={onChangeHandler}
                                error={null}
                                className={'primaryInputBgTwo'}
                            />
                        </div>
                        <div className={`${styles.modalFormContainer} mt-3`}>
                            <label className={styles.modalLabel}> Professional profile link (e.g., LinkedIn) </label>
                            <PrimaryInput
                                type="text"
                                id="quantity"
                                name={"quantity"}
                                placeholder="Professional profile link"
                                // value={formData.quantity}
                                // onChange={onChangeHandler}
                                error={null}
                                className={'primaryInputBgTwo'}
                            />
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
                                btnText="Submit"
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

export default KYHModal