/** PACKAGE IMPORT */

import { Modal } from "react-bootstrap";
import { IoClose } from "react-icons/io5";
import { useState } from "react";
import Select from 'react-select'

/** LOCAL FILES IMPORT */

import styles from '../styles/modal.module.css';
import Button from "../../../components/Button/Button";
import { InputFileComponent, InputTextareaComponent, InputWithCurrencyAndLabel, PrimaryInput, PrimaryTextarea } from "../../../components/Input/InputFields";
import { IoMdInformationCircle } from "react-icons/io";


/** CODE START */

const ClaimDetails = ({ show, handleClose, claimDetailsData }) => {
    return (
        <div>
            <Modal
                centered
                size="lg"
                backdrop="static"
                show={show}
                onHide={handleClose}
                className={styles.modalPrimary}
            >
                <Modal.Header className={styles.modalPrimaryHeader}>
                    <h4 className={`${styles.modalHeaderTitle} `}>Claim BNB</h4>
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
                        <div className="row">
                            <div className={`col-12 col-lg-7 pe-3 ${styles.columnRightBorder}`}>
                                <div>
                                    <div className="row">
                                        <div className={`col-12 col-lg-7`}>
                                            <label className={`${styles.modalLabel}`}>Type</label>
                                            <div className={`${styles.valueShowContainerHighlight} mt-2`}>
                                                Locked
                                            </div>
                                        </div>
                                        <div className="col-12 col-sm-5 mt-3 mt-sm-0">
                                            <label className={`${styles.modalLabel}`}>Duration (Days)</label>

                                            <div className={`${styles.valueShowContainerHighlight} mt-2`}>
                                                10 Days
                                            </div>
                                        </div>
                                    </div>

                                    <div className="row mt-4">
                                        <div className="col-6">
                                            <label className={`${styles.formLabel}`}>Reward Token Balance</label>
                                        </div>
                                        <div className="col-6 d-flex justify-content-end">
                                            <p className={`text-end  ${styles.formValueXs}`}>
                                                1000000.123004574 BNB
                                            </p>
                                        </div>
                                    </div>
                                    <div className="row mt-3">
                                        <div className="col-6">
                                            <label className={`${styles.formLabel}`}>
                                                Stake amount
                                            </label>
                                        </div>
                                        {/* <div className="col-6 d-flex justify-content-end">
                                                        <p className="mdl_green_p">Max</p>
                                                      </div> */}
                                    </div>
                                    <div className={`${styles.fixedAmountField} mt-3`}>
                                        <InputWithCurrencyAndLabel
                                            id={'limitAmount'}
                                            name={'stopPrice'}
                                            // onChange={(name, value) => {
                                            //     onChangeHandler('takeProfit', name, value)
                                            // }}
                                            placeholder={'0.291'}
                                            type={'number'}
                                            // value={2}
                                            disabled={false}
                                            key={'limitAmount'}
                                            readOnly={false}
                                            currency={"ETH"}
                                            error={null}
                                            className={"InputTextSecondaryCurrencyAndLabel"} />
                                    </div>
                                </div>
                                <label className={`${styles.formLabel} mt-3`}>
                                    Locked amount limitation
                                </label>
                                <div className="d-flex flex-wrap align-items-center gap-3 mt-2">
                                    <p>
                                        <span className={`${styles.modalLabel}`}>Minimum :{" "}</span>
                                        <span className={styles.formValueHighlight}>
                                            0.01 ETH
                                        </span>
                                    </p>
                                    <p>
                                        <span className={`${styles.modalLabel}`}>Maximum :{" "}</span>
                                        <span className={styles.formValueHighlight}>
                                            2 ETH
                                        </span>
                                    </p>
                                </div>
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
                                        I have read and I agree to the <span>Earn Terms</span>
                                    </p>
                                </div>
                                <div className="d-flex align-items-center justify-content-center mt-4">
                                    <Button
                                        isLoading={false}
                                        // loadingText="Redirecting..."
                                        btnText="Cancel"
                                        // onClick={handleViewNavigate}
                                        className="darkFillRectangleBtn"
                                    // selectedValue={currentResult}
                                    />
                                </div>
                            </div>

                            <div className="col-12 col-lg-5 ps-3 mt-5 mt-lg-0">
                                <div>
                                    <h6 className=" fw-bold">Summary</h6>
                                    <div className="pb-3">
                                        <div className="row mt-3 mx-auto">
                                            <div className="col-5 px-0">
                                                <p className={`${styles.formLabel}`}>Subscription Date</p>
                                            </div>
                                            <div className="col-7 pe-0">
                                                <p className={`text-end  ${styles.formValueXs}`}>
                                                    Wed, 04 Jun 2025 06:14:25 GMT
                                                </p>
                                            </div>
                                        </div>
                                        <div className="row mt-3 mx-auto">
                                            <div className="col-5 px-0">
                                                <p className={`${styles.formLabel}`}>Next Claim Date</p>
                                            </div>
                                            <div className="col-7 pe-0">
                                                <p className={`text-end  ${styles.formValueXs}`}>
                                                    Fri, 06 Jun 2025 06:14:25 GMT
                                                </p>
                                            </div>
                                        </div>
                                        <div className="row mt-3 mx-auto">
                                            <div className="col-5 px-0">
                                                <p className={`${styles.formLabel}`}>Reward Token</p>
                                            </div>
                                            <div className="col-7 pe-0">
                                                <p className={`text-end  ${styles.formValueXs}`}>
                                                    BNB
                                                </p>
                                            </div>
                                        </div>
                                        <div className="row mt-3 mx-auto">
                                            <div className="col-5 px-0">
                                                <p className={`${styles.formLabel}`}>Claim Period</p>
                                            </div>
                                            <div className="col-7 pe-0">
                                                <p className={`text-end  ${styles.formValueXs}`}>
                                                    2 Days
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                    <hr />
                                    <div className="pt-2">
                                        <div className="row mx-auto">
                                            <div className="col-5 px-0">
                                                <p className={`${styles.formLabel}`}>Est.APY</p>
                                            </div>
                                            <div className="col-7 pe-0 d-flex justify-content-end">
                                                <p className={`text-end  ${styles.formValueXs}`}>1   %</p>
                                            </div>
                                        </div>
                                        <div className="row mt-3 mx-auto">
                                            <div className="col-5 px-0">
                                                <p className={`${styles.formLabel}`}>Est.Interest</p>
                                            </div>
                                            <div className="col-7 pe-0 d-flex justify-content-end">
                                                <p className={`text-end  ${styles.formValueXs}`} style={{ wordBreak: "break-all" }}>
                                                    0 BNB
                                                </p>
                                            </div>
                                        </div>
                                        <div className={`d-flex align-items-start gap-2 mt-3 ${styles.highlightCard}`}>
                                            <IoMdInformationCircle fill="#22b87b" style={{ minWidth: "15px" }} />
                                            <p className="">
                                                The APY is adjusted daily based on the on-chain staking
                                                rewards, and the specific APY is subject to change.
                                            </p>
                                        </div>
                                        <div className="mt-4">
                                            <Button
                                                isLoading={false}
                                                // loadingText="Redirecting..."
                                                btnText="Confirm"
                                                // onClick={handleCopyNavigate}
                                                className="successFillRectangleBtn"
                                            // selectedValue={currentResult}
                                            />
                                        </div>
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

export default ClaimDetails