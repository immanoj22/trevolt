import { Modal } from "react-bootstrap";
import { IoClose } from "react-icons/io5";
import styles from "../styles/modal.module.css";
import Button from "../../../components/Button/Button";
import CustomRangeSlider from "../../../components/UiComponents/CustomRangeSlider";
import { useEffect, useState } from "react";

const LeverageModal = ({ show, handleClose, titleText, initialValue = 1, max = 100, onConfirm }) => {
    const percentages = [0, 25, 50, 75, 100];

    const [leverageValue, setLeverageValue] = useState(initialValue);

    useEffect(() => {
        if (show) setLeverageValue(initialValue);
    }, [show, initialValue]);

    const clamp = (value) => Math.min(max, Math.max(1, value));

    const handleSliderChange = (e) => {
        setLeverageValue(clamp(parseFloat(e.target.value)));
    };

    const handleButtonClick = (percentage) => {
        setLeverageValue(clamp((percentage / 100) * max));
    };

    const handleConfirm = () => {
        onConfirm?.(Math.round(leverageValue));
        handleClose();
    };

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
                    <h4 className={`${styles.modalHeaderTitle} `}>{titleText}</h4>
                    <button
                        aria-label="closeIcon"
                        className={styles.modalCloseButton}
                        onClick={handleClose}
                    >
                        <IoClose />
                    </button>
                </Modal.Header>
                <Modal.Body className={styles.modalPrimaryBody}>
                    <div className={styles.leverageModalContent}>
                        <div className={styles.leverageInputWrapper}>
                            <button aria-label="minus" onClick={() => setLeverageValue((v) => clamp(v - 1))}>-</button>
                            <div>
                                <input
                                    type="text"
                                    inputMode="numeric"
                                    value={Math.round(leverageValue)}
                                    onChange={(e) => setLeverageValue(clamp(parseFloat(e.target.value) || 1))}
                                />
                                <span>x</span>
                            </div>
                            <button aria-label="plus" onClick={() => setLeverageValue((v) => clamp(v + 1))}>+</button>
                        </div>
                        <div className={styles.leverageBodyPart}>
                            <CustomRangeSlider
                                max={max}
                                percentages={percentages}
                                startingValue={leverageValue}
                                handleButtonClick={handleButtonClick}
                                handleSliderChange={handleSliderChange}
                            />
                        </div>
                        <div className={styles.leverageBottomPart}>
                            <div>
                                <h2>
                                    Max position at <span>{Math.round(leverageValue)}</span>x
                                </h2>
                            </div>
                            <div>
                                <Button btnText={"Confirm"} className="successFillRectangleBtn" onClick={handleConfirm} />
                            </div>
                        </div>
                    </div>
                </Modal.Body>
            </Modal>
        </div>
    );
};

export default LeverageModal;
