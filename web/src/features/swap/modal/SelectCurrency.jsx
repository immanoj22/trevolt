/** PACKAGE IMPORT */

import { Modal } from "react-bootstrap";
import { IoClose } from "react-icons/io5";
import { useState } from "react";
import Select from 'react-select'

/** LOCAL FILES IMPORT */

import styles from '../styles/modal.module.css';
import Button from "../../../components/Button/Button";
import { InputFileComponent, InputTextareaComponent, PrimaryInput, PrimaryTextarea, SearchInput } from "../../../components/Input/InputFields";
import Images from "../../../utils/Images";


/** CODE START */

const SelectCurrency = ({ show, handleClose, liquidityData }) => {
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
                        <h4 className={`${styles.modalHeaderTitle} `}>Select Currency</h4>
                        <div className={`${styles.modalFormContainer} mt-4`}>
                            <SearchInput
                                type={"text"}
                                error={null}
                                // onChange={handleSearch}
                                disabled={false}
                                placeholder={"Search"}
                                value={""}
                                name={"tableSearch"}
                                className={"thirdSearch"}
                                readOnly={false}
                                showSearchIcon={true}
                            />
                            <div className={`${styles.selectCurrency} mt-3`}>
                                <div className="d-flex align-items-center gap-3">
                                    <img src={Images.img} alt="img" className={styles.currencyImage} />
                                    <div>
                                        <p className={styles.labelValue}>BNB (BSC)</p>
                                        <p className={styles.label}>USD</p>
                                    </div>
                                </div>
                                <div className="d-flex align-items-center gap-3 mt-3">
                                    <img src={Images.img} alt="img" className={styles.currencyImage} />
                                    <div>
                                        <p className={styles.labelValue}>EUR (EUR)</p>
                                        <p className={styles.label}>EUR</p>
                                    </div>
                                </div>
                                <div className="d-flex align-items-center gap-3 mt-3">
                                    <img src={Images.img} alt="img" className={styles.currencyImage} />
                                    <div>
                                        <p className={styles.labelValue}>GBP (GBP)</p>
                                        <p className={styles.label}>GBP</p>
                                    </div>
                                </div>
                                <div className="d-flex align-items-center gap-3 mt-3">
                                    <img src={Images.img} alt="img" className={styles.currencyImage} />
                                    <div>
                                        <p className={styles.labelValue}>XAU (XAU)</p>
                                        <p className={styles.label}>XAU</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                </Modal.Body>
            </Modal>
        </div>
    )
}

export default SelectCurrency