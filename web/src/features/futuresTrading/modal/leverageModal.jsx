import { Modal } from "react-bootstrap";
import { IoClose } from "react-icons/io5";
import styles from "../styles/modal.module.css";
import Button from "../../../components/Button/Button";
import CustomRangeSlider from "../../../components/UiComponents/CustomRangeSlider";
import { useState } from "react";

const LeverageModal = ({ show, handleClose, titleText }) => {
    const max = 100;
    const percentages = [0, 25, 50, 75, 100];

    const [startingValue, setStartingValue] = useState(50);
    const [selectedPercentage, setSelectedPercentage] = useState(null);

    const handleSliderChange = (e) => {
        const value = parseFloat(e.target.value);
        setStartingValue(value);
    };

    const handleButtonClick = (percentage) => {
        const value = (percentage / 100) * max;
        setStartingValue(value);
        setSelectedPercentage(((value / max) * 100).toString());
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
                            <button aria-label="minus">-</button>
                            <div>
                                <input type="number" defaultValue={100} />
                                <span>x</span>
                            </div>
                            <button aria-label="plus">+</button>
                        </div>
                        <div className={styles.leverageBodyPart}>
                            <CustomRangeSlider
                                max={max}
                                percentages={percentages}
                                startingValue={startingValue}
                                handleButtonClick={handleButtonClick}
                                handleSliderChange={handleSliderChange}
                                selectedPercentage={selectedPercentage}
                            />
                        </div>
                        <div className={styles.leverageBottomPart}>
                            <div>
                                <h2>
                                    Max position at <span>100</span>x
                                </h2>
                                <p>
                                    1,155,920,000.0 <span>USD</span>
                                </p>
                            </div>
                            <div>
                                <Button btnText={"Confirm"} className="successFillRectangleBtn" />
                            </div>
                        </div>
                    </div>
                </Modal.Body>
            </Modal>
        </div>
    );
};

export default LeverageModal;
