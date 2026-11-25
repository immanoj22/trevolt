import { useEffect, useState } from "react";
import { Modal } from "react-bootstrap";
import styles from "./modal.module.css";
import Button from "../Button/Button";
import { IoClose } from "react-icons/io5";
import { Link, useNavigate } from 'react-router-dom';

const WelcomeModel = ({ show, handleClose }) => {
    const navigate = useNavigate()
    return (
        <>
            <Modal
                centered
                size="md"
                backdrop="static"
                show={show}
                onHide={handleClose}
                className={`${styles.modalPrimary} ${styles.cardTemplateModel} ${styles.closeBtnBlack}`}
            >
                <Modal.Body className={`${styles.cardModelBody}`}>
                    <button className={styles.closeBtn} onClick={handleClose}>
                        <IoClose />
                    </button>
                    <h3 className={styles.titleText}>Your Trading Journey <br />Starts Here!</h3>
                    <p className={styles.descriptionText}>Stay ahead of market trends with instant trade alerts and analytics</p>
                    <div>
                        <Button btnText={"Continue"} className="cardLightBtn" onClick={() => {
                            localStorage.removeItem('code')
                            navigate("/futures")
                        }} />
                    </div>
                </Modal.Body>
            </Modal>
        </>
    );
};

export default WelcomeModel;