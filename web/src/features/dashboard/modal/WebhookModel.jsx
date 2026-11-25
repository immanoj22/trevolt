import React, { useEffect, useState } from "react";

/** LOCAL FILES IMPORT */
import styles from "../styles/modal.module.css"

import { IoClose } from "react-icons/io5";
/** PACKAGE IMPORT */
import { Modal, Form } from "react-bootstrap";
import Button from "../../../components/Button/Button";
import { InputComponent, InputTextareaComponent } from "../../../components/Input/InputFields";
/** LOCAL FILES IMPORT */
import { FaCheckCircle } from "react-icons/fa";
import { showToastMessage } from "../../../lib/toast";

const tradingViewMessage = `{
    "symbol":"{{ticker}}",
    "side":"{{strategy.order.action}}",
    "qty":{{strategy.order.contracts}},
    "price":"{{close}}"
    "trigger_time":"{{timenow}}"
  }`;

export default function WebhookModel({ show,webhookUrl, handleClose }) {


    const [copied, setCopied] = useState(false);

    const copyToClipboard = (text) => {
        navigator.clipboard.writeText(text);
        setCopied(true);
        showToastMessage("Webhook url copied successfully", 'success')
        setTimeout(() => setCopied(false), 1500);
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
                <button
                    aria-label="closeIcon"
                    className={styles.modalCloseButton}
                    onClick={handleClose}
                >
                    <IoClose />
                </button>
                <Modal.Body className={styles.modalPrimaryBody}>
                    <div className="text-center mb-3">
                        <div
                            className="bg-success rounded-circle d-inline-flex align-items-center justify-content-center"
                            style={{ width: 60, height: 60 }}
                        >
                            <FaCheckCircle size={55} />
                        </div>
                    </div>

                    <h4 className={`${styles.modalHeaderTitle} text-center mb-3`}>
                        Webhook Created Successfully
                    </h4>

                    <p className={`${styles.modalSubHeader} text-center mb-4`}>
                        Run your Webhook with the following steps:
                    </p>

                    <ul className={`${styles.modalSubHeader} mb-4 fs14`}>
                        <li>- Select your strategy on TradingView</li>
                        <li>- Open the strategy settings and enter your desired quantity per order</li>
                        <li>- Create an alert for your strategy and paste the following text into the message window</li>
                    </ul>

                    <div className="mb-4">
                        <InputTextareaComponent label={"Trading View Message"} value={tradingViewMessage} />
                    </div>

                    <div className="mb-3">
                        <InputComponent label={"Webhook URL"} value={webhookUrl}/>
                    </div>

                    <div className={`${styles.emailNotesPart} mb-3`}>
                        <p className="fs14">
                            This webhook URL will not be available once you leave this page.
                            Don’t share it with anyone.
                        </p>
                    </div>
                    <Button btnText={"Copy Webhook URL"} className="successFillRectangleBtn" onClick={() => copyToClipboard(webhookUrl)} />
                </Modal.Body>
            </Modal>
        </div>
    );
}
