import { useEffect, useState } from "react";
import { Modal, Badge } from "react-bootstrap";
import { CiWifiOff } from "react-icons/ci";
import { CiWifiOn } from "react-icons/ci";
import Button from "../Button/Button";
import styles from "./modal.module.css";
import { IoClose } from "react-icons/io5";

const NetworkStatus = () => {
    const [showModal, setShowModal] = useState(false);
    const [message, setMessage] = useState("");
    const [status, setStatus] = useState(false);

    useEffect(() => {
        if (!navigator.onLine) {
            setMessage("You are currently offline. Please check your internet connection.");
            setShowModal(true);
            setStatus(true);
        }

        const handleOnline = () => {
            setMessage("You are back online.");
            setShowModal(true);
            setStatus(true);

            setTimeout(() => {
                setShowModal(false);
                setStatus(false);
            }, 3000)
        };

        const handleOffline = () => {
            setMessage("You are offline. Please check your internet connection.");
            setShowModal(true);
            setStatus(false);
        };

        window.addEventListener("online", handleOnline);
        window.addEventListener("offline", handleOffline);

        return () => {
            window.removeEventListener("online", handleOnline);
            window.removeEventListener("offline", handleOffline);
        };
    }, []);

    const handleClose = () => setShowModal(false);

    return (
        <>
            <Modal
                centered
                size="md"
                backdrop="static"
                show={showModal}
                onHide={handleClose}
                className={styles.modalPrimary}
            >

                <Modal.Header className={`${styles.modalPrimaryHeader} ${styles.networkModelHeader} justify-content-between`}>
                    <h4 className={`${styles.modalHeaderTitle} fs17`}>
                        Network Status
                    </h4>
                    <div className={`${styles.badgeTag} ${status ? styles.isOnline : styles.isOffline}`} >
                        <span className={`${styles.icon} d-flex ml-2`}>
                            {
                                status ?
                                    <CiWifiOn size={25} />
                                    :
                                    <CiWifiOff size={25} />
                            }
                        </span>
                        <span className="fs-6">
                            {status ? "Online" : "Offline"}
                        </span>
                    </div>

                </Modal.Header>
                <Modal.Body className={`${styles.modalPrimaryBody} pt-0 pb-3 px-3`}>
                    <h5 className={`${styles.labelWhite} text-center fs16`}>
                        {message}
                    </h5>
                    <div className="w-100 d-flex justify-content-end mt-4">
                        <Button className="cardSuccessBtn" staticClass="rounded-2" onClick={handleClose} btnText={"Close"} />
                    </div>
                </Modal.Body>
            </Modal>
            {/* <Modal
                show={showModal}
                onHide={handleClose}
                centered
                contentClassName="bg-dark text-white border-0"
            >
                <Modal.Header closeButton closeVariant="white border-0">
                    <Modal.Title className="border-0 w-100">
                        <div className="w-100 d-flex align-items-center justify-content-between mr-5">
                            <span className="mx-2">
                                Network Status
                            </span>
                            <Badge className="d-inline-flex gap-2 align-items-center rounded-2 px-2 py-1 " bg={`${!status ? "secondary" : "success"}`}>
                                <span className="fs-6">
                                    {status ? "Online" : "Offline"}
                                </span>
                                <span className="d-flex ml-2">
                                    {
                                        status ?
                                            <CiWifiOn size={25} />
                                            :
                                            <CiWifiOff size={25} />
                                    }
                                </span>
                            </Badge>
                        </div>
                    </Modal.Title>
                </Modal.Header>
                <Modal.Body className="border-0">
                    <h5 className="text-center">
                        {message}
                    </h5>
                </Modal.Body>
                <Modal.Footer className="border-0">
                    <Button variant="success" className="px-4" onClick={handleClose}>
                        Ok
                    </Button>
                </Modal.Footer>
            </Modal> */}
        </>
    );
};

export default NetworkStatus;