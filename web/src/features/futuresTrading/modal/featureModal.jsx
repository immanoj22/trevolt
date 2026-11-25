import { Modal } from "react-bootstrap";
import { IoClose } from "react-icons/io5";
import styles from "../styles/modal.module.css";
import Select from "react-select";
import { InputWithCurrencyAndLabel } from "../../../components/Input/InputFields";
import { useState } from "react";
import Button from "../../../components/Button/Button";

const FeatureModal = (props) => {
    const { show, handleClose } = props

    const triggerOption = [
        { value: 'Mark', label: 'Mark (123645)' },
        { value: 'Index', label: 'Index (123645)' },
    ];




    const [tabOne, setTabOne] = useState("Market");
    const [tabTwo, setTabTwo] = useState("Market");

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
                    <h4 className={`${styles.modalHeaderTitle} `}>Add Bracket Order: EURUSD</h4>
                    <button
                        aria-label="closeIcon"
                        className={styles.modalCloseButton}
                        onClick={handleClose}
                    >
                        <IoClose />
                    </button>
                </Modal.Header>
                <Modal.Body className={styles.modalPrimaryBody}>
                    <div className={styles.featureModalContent}>
                        <div className="d-flex justify-content-between align-items-center my-2">
                            <h3 className={styles.modelLabelText}>Entry Price</h3>
                            <p className={styles.modelLabelValue}>1</p>
                        </div>
                        <div className="d-flex justify-content-between align-items-center my-2">
                            <h3 className={styles.modelLabelText}>Trigger Index</h3>
                            <div>
                                <Select
                                    // menuIsOpen
                                    isSearchable={false}
                                    placeholder="Select"
                                    classNamePrefix="react-select__fourth"
                                    options={triggerOption}
                                    defaultInputValue={triggerOption[0]}
                                />
                            </div>
                        </div>
                        <div className="my-3">
                            <div className="d-flex justify-content-between align-items-center my-4">
                                <h3 className={styles.modelLabelText}>Entry Price</h3>
                                <div className={styles.tabBtnWrapper}>
                                    <button aria-label="market" className={tabOne == "Market" && styles.isActive} onClick={() => setTabOne("Market")}>Market</button>
                                    <button aria-label="limit" className={tabOne == "Limit" && styles.isActive} onClick={() => setTabOne("Limit")}>Limit</button>
                                </div>
                            </div>
                            <div>
                                <label className={styles.modelLabelText}>Trigger Price</label>
                                <div className={`${styles.formContainer} mt-2`}>
                                    <InputWithCurrencyAndLabel
                                        id={'limitAmount'}
                                        name={'limitAmount'}
                                        onChange={""}
                                        placeholder={''}
                                        type={'number'}
                                        value={""}
                                        disabled={false}
                                        key={'limitAmount'}
                                        readOnly={false}
                                        currency={'USD'}
                                        error={null}
                                        className={"InputWithCurrencyAndLabel"} />
                                </div>
                            </div>
                            <div className={styles.percentagePart}>
                                <ul className="d-flex">
                                    <li>
                                        <button aria-label="percentage">0.25%</button>
                                    </li>
                                    <li>
                                        <button aria-label="percentage" >0.5%</button>
                                    </li>
                                    <li>
                                        <button aria-label="percentage">0.1%</button>
                                    </li>
                                    <li>
                                        <button aria-label="percentage">0.2%</button>
                                    </li>
                                </ul>
                                <div className={styles.percentageInput}>
                                    <input type="number" />
                                    <span>%</span>
                                </div>
                            </div>
                            {
                                tabOne == "Limit" &&
                                <div>
                                    <label className={styles.modelLabelText}>Limit Price</label>
                                    <div className={`${styles.formContainer} mt-2`}>
                                        <InputWithCurrencyAndLabel
                                            id={'limitAmount'}
                                            name={'limitAmount'}
                                            onChange={""}
                                            placeholder={''}
                                            type={'number'}
                                            value={""}
                                            disabled={false}
                                            key={'limitAmount'}
                                            readOnly={false}
                                            currency={'USD'}
                                            error={null}
                                            className={"InputWithCurrencyAndLabel"} />
                                    </div>
                                </div>
                            }
                        </div>
                        <div className="my-3">
                            <div className="d-flex justify-content-between align-items-center my-4">
                                <h3 className={styles.modelLabelText}>Stop Loss</h3>
                                <div className={styles.tabBtnWrapper}>
                                    <button aria-label="market" className={tabTwo == "Market" && styles.isActive} onClick={() => setTabTwo("Market")}>Market</button>
                                    <button aria-label="limit" className={tabTwo == "Limit" && styles.isActive} onClick={() => setTabTwo("Limit")}>Limit</button>
                                    <button aria-label="trail" className={tabTwo == "Trail" && styles.isActive} onClick={() => setTabTwo("Trail")}>Trail</button>
                                </div>
                            </div>
                            {
                                tabTwo !== "Trail" &&
                                <>
                                    <div>
                                        <label className={styles.modelLabelText}>Trigger Price</label>
                                        <div className={`${styles.formContainer} mt-2`}>
                                            <InputWithCurrencyAndLabel
                                                id={'limitAmount'}
                                                name={'limitAmount'}
                                                onChange={""}
                                                placeholder={''}
                                                type={'number'}
                                                value={""}
                                                disabled={false}
                                                key={'limitAmount'}
                                                readOnly={false}
                                                label={''}
                                                currency={'USD'}
                                                error={null}
                                                className={"InputWithCurrencyAndLabel"} />
                                        </div>
                                    </div>
                                    <div className={styles.percentagePart}>
                                        <ul className="d-flex">
                                            <li>
                                                <button aria-label="percentage">0.25%</button>
                                            </li>
                                            <li>
                                                <button aria-label="percentage">0.25%</button>
                                            </li>
                                            <li>
                                                <button aria-label="percentage">0.25%</button>
                                            </li>
                                            <li>
                                                <button aria-label="percentage">0.25%</button>
                                            </li>
                                        </ul>
                                        <div className={styles.percentageInput}>
                                            <input type="number" />
                                            <span>%</span>
                                        </div>
                                    </div>
                                </>
                            }
                            {
                                tabTwo == "Limit" &&
                                <div>
                                    <label className={styles.modelLabelText}>Limit Price</label>
                                    <div className={`${styles.formContainer} mt-2`}>
                                        <InputWithCurrencyAndLabel
                                            id={'limitAmount'}
                                            name={'limitAmount'}
                                            onChange={""}
                                            placeholder={''}
                                            type={'number'}
                                            value={""}
                                            disabled={false}
                                            key={'limitAmount'}
                                            readOnly={false}
                                            currency={'USD'}
                                            error={null}
                                            className={"InputWithCurrencyAndLabel"} />
                                    </div>
                                </div>
                            }
                            {
                                tabTwo == "Trail" &&
                                <div>
                                    <label className={styles.modelLabelText}>Trail Amount</label>
                                    <div className={`${styles.formContainer} mt-2`}>
                                        <InputWithCurrencyAndLabel
                                            id={'limitAmount'}
                                            name={'limitAmount'}
                                            onChange={""}
                                            placeholder={''}
                                            type={'number'}
                                            value={""}
                                            disabled={false}
                                            key={'limitAmount'}
                                            readOnly={false}
                                            currency={'USD'}
                                            error={null}
                                            className={"InputWithCurrencyAndLabel"} />
                                    </div>
                                </div>
                            }
                        </div>
                        <div className={`${styles.btnWrapper} mt-4 w-100 d-flex gap-3 justify-content-between`}>
                            <div className="w-50">
                                <div className="d-flex gap-5 justify-content-between">
                                    <p className={styles.modelLabelValue}>Exit PNL</p>
                                    <p className={styles.modelLabelValue}><span className="value-profit px-2">0.11</span>USD</p>
                                </div>
                                <div className="d-flex gap-5 justify-content-between">
                                    <p className={styles.modelLabelValue}>Stop PNL</p>
                                    <p className={styles.modelLabelValue}>-</p>
                                </div>
                            </div>
                            <div className="w-50">
                                <Button btnText={"Confirm"} className="successFillRectangleBtnXs" />
                            </div>
                        </div>
                    </div>
                </Modal.Body>
            </Modal>
        </div>
    );
};
const FeatureModalContent = () => {



    return

}
export default FeatureModal;
