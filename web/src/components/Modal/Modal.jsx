import { Modal } from "react-bootstrap";
import styles from "./modal.module.css";

export const ModelOverView = ({ show, handleClose, HeaderComponent, BodyComponent }) => {
    return (
        <div>
            <Modal
                centered
                size="md"
                backdrop="static"
                show={show}
                onHide={handleClose}
                className={styles.modelOverView}
            >
                <Modal.Header className={styles.modelOverViewHeader}>
                    {
                        HeaderComponent &&
                        <HeaderComponent />
                    }
                </Modal.Header>
                <Modal.Body className={styles.modelOverViewBody}>
                    {
                        BodyComponent &&
                        <BodyComponent />
                    }
                </Modal.Body>
            </Modal>
        </div>
    );
};