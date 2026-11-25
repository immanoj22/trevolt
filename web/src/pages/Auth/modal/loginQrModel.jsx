/** PACKAGE IMPORT */

import React, { useEffect, useState, useContext } from "react";
import isEmpty from "is-empty";
import { jwtDecode } from 'jwt-decode'

/** LOCAL FILES IMPORT */
import styles from "./modal.module.css"
import QRCode from "react-qr-code";
import { SlOptionsVertical } from "react-icons/sl";
import { CiSettings } from "react-icons/ci";


import { Modal } from "react-bootstrap";
import { IoClose } from "react-icons/io5";
import { useNavigate } from "react-router-dom";
import { exchangeQR, generateQR } from "../../../actions/userAction";
import SocketContext from "../../../context/socketContext";
import { createSocketUser } from "../../../config/socketConnectivity";
import { useGlobalContext } from "../../../context/GlobalProvider";
import { showToastMessage } from "../../../lib/toast";

export const LoginQrModel = (props) => {
    const navigate = useNavigate();
    const socketContext = useContext(SocketContext);
    const { handleLogin } = useGlobalContext();

    const { show, handleClose } = props;

    const [formData, setFormData] = useState({ token: "" });
    const [intervalId, setIntervalId] = useState(null);


    const getQR = async (isRefresh = false) => {
        try {
            const { success, message, result } = await generateQR();
            if (success) {
                setFormData(result)
                socketContext.socket.emit('qr:register', { token: result.token });
            }
            // show toast only for refresh event
            if (isRefresh) {
            }
        } catch (e) {
            console.log("getQR_err", e);
        }
    }

    useEffect(() => {
        if (show) {
            getQR();
            const id = setInterval(() => {
                getQR(true);
            }, 120 * 1000);

            setIntervalId(id);
        }

        return () => {
            // Cleanup when modal closes
            if (intervalId) clearInterval(intervalId);
        };
    }, [show]);

    useEffect(() => {
        // socketContext.socket.on("qr:registered", (result) => {

        // });



        socketContext.socket.on('qr:verified', async (data) => {
            if (intervalId) {
                clearInterval(intervalId);    // stop auto-refresh
                setIntervalId(null);
            }
            const { success, message, result } = await exchangeQR({ token: data?.token })

            if (success) {
                if (message == "Login successfully") {
                    // SECURITY FIX (VAPT: "Token Storage Security" — Points
                    // 44/49/70): no Authorization header/localStorage write
                    // for the token — backend already set the httpOnly
                    // cookie for this session. Decode is in-memory/transient.
                    const decoded = jwtDecode(result);
                    localStorage.setItem("code", decoded.showWelcomeCard)
                    createSocketUser(decoded?.userId);
                    await handleLogin();
                    showToastMessage(message, 'success');
                }
            } else {
                showToastMessage(message, 'error');
            }
        });

    }, []);


    return (
        <div>
            <Modal
                centered
                size="lg"
                backdrop="static"
                show={props.show}
                onHide={close}
                className={`${styles.modalPrimary} ${styles.qrCodeModel}`}
            >
                <button
                    aria-label="closeIcon"
                    className={styles.modalCloseButton}
                    onClick={handleClose}
                >
                    <IoClose />
                </button>
                <Modal.Header className={styles.modalPrimaryHeader}>
                    <h4 className={`${styles.modalHeaderTitle} `}>QR with Login</h4>
                </Modal.Header>
                <Modal.Body className={styles.modalPrimaryBody}>
                    <div className={styles.qrCodeWrapperModel}>
                        <div className="d-flex flex-wrap align-items-start gap-2">
                            <div className={styles.stepLevelContainer}>
                                <ul>
                                    <li>Open Trevolt App on your phone</li>
                                    <li>On Android, tap Menu <SlOptionsVertical size={25} />. On iPhone, tap Settings <CiSettings size={30} /> </li>
                                    <li>Tap Link devices, then Link device</li>
                                    <li>Scan the qr code to confirm</li>

                                </ul>
                            </div>
                            {
                                !isEmpty(formData?.token) &&
                                <div className={`${styles.qrCodeWrapper} mt-3 mt-lg-0`}>
                                    <QRCode
                                        size={300}
                                        style={{ height: "auto", maxWidth: "100%", width: "100%" }}
                                        value={formData?.token}
                                        // value="d0e04ec3dd310b66db1e07f337f64af7fc5d136d810c6ddd392047c5d1f5"
                                        viewBox={`0 0 300 300`}
                                    />
                                </div>
                            }

                        </div>
                    </div>
                </Modal.Body>
            </Modal>
        </div>
    );
};