import React, { useState } from "react";
import { Modal } from "react-bootstrap";
import styles from "../styles/modal.module.css";
import { IoClose } from "react-icons/io5";
import Images from "../../../utils/Images";

const MarkersModel = ({ show, handleClose }) => {
    const [selectedTab, setSelectedTab] = useState('Buy');
    return (
        <div>
            <Modal
                centered
                size="md"
                show={show}
                onHide={handleClose}
                className={styles.modalPrimary}
            >
                <Modal.Header className={`${styles.modalPrimaryHeader} ${styles.orderPlaceHeader}`}>
                    <div>
                        <h4 className={styles.modalHeaderTitle}>
                            Maker Only Order
                        </h4>
                    </div>
                    <button
                        aria-label='closeIcon'
                        className={styles.modalCloseButton}
                        onClick={handleClose}
                    >
                        <IoClose />
                    </button>
                </Modal.Header>
                <Modal.Body className={`${styles.modalPrimaryBody}  pt-0`}>
                    <div className={styles.markerModel}>
                        <div className={`${styles.markerModalBtn}`}>
                            <button onClick={() => setSelectedTab("Buy")}
                                aria-label='buy'
                                className={`${styles.tabCardLink}`}
                                style={{
                                    border: selectedTab === 'Buy' ? '1px solid var(--color-green-03)' : 'none'
                                }}
                            >
                                Buy Order
                            </button>
                            <button onClick={() => setSelectedTab("Sell")}
                                aria-label='sell'
                                className={`${styles.tabCardLink}`}
                                style={{
                                    border: selectedTab === 'Sell' ? '1px solid var(--color-green-03)' : 'none'
                                }}
                            >
                                Sell Order
                            </button>
                        </div>
                        <div className={`${styles.markeOnlyImg}`}>
                            <img src={Images.markerModal} />
                        </div>
                        <div style={{ gap: 5, display: 'flex', flexDirection: 'column', marginTop: 20 }}>
                            <p className="fs13" style={{ color: '#fff' }}>
                                Maker only order type executes as a maker order or gets cancelled.
                                Use this to pay maker fees for your order.
                            </p>
                            <p className="fs13" style={{ color: '#fff' }}>
                                Buy price of the order should be less than the best offer
                                or else the order will match immediately with an existing sell order and get cancelled.
                            </p>
                        </div>
                    </div>
                </Modal.Body>
            </Modal>
        </div>
    )
}

export default MarkersModel;