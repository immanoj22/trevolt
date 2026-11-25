import { useEffect, useState } from "react";
import { Modal } from "react-bootstrap";
import styles from "./modal.module.css";
import { IoClose } from "react-icons/io5";
import Images from "../../utils/Images";

const BonusModel = ({ show }) => {
    const [showModal, setShowModal] = useState(show);
    const handleClose = () => setShowModal(false);
    return (
        <>
            <Modal
                centered
                size="md"
                backdrop="static"
                show={showModal}
                onHide={handleClose}
                className={`${styles.modalPrimary} ${styles.cardTemplateModel} ${styles.bonusModel}`}
            >
                <Modal.Body className={`${styles.cardModelBody} ${styles.bonusCardBody}`}>
                    <botton className={styles.closeBtn}>
                        <IoClose />
                    </botton>
                    <h3 className={styles.titleText}>
                        Welcome Trading Bonus
                    </h3>
                    <p className={styles.descriptionText}>
                        Join my free webinar and learn how to start trading smartly. Get free account setup with Trevolt.
                    </p>
                    <div className={styles.bonusDetailPart}>
                        <img className={styles.bonusIcon} src={Images.bonusImg} alt="bonusImg" />
                        <div className={styles.profileDetails}>
                            <img src={Images.tp3} alt="bonusImg" />
                            <div>
                                <h4>{"Halini"}</h4>
                                <p>Hi, welcome</p>
                            </div>
                        </div>
                        <div className={styles.bonusAmtDetails}>
                            <h2>$ 25,0000</h2>
                            <p>
                                <b>Bonus: </b>
                                Exclusive Trader Welcome Bonus
                            </p>
                        </div>
                    </div>
                </Modal.Body>
            </Modal>
        </>
    );
};

export default BonusModel;