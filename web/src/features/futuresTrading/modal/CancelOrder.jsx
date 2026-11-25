import React, { useEffect, useRef, useState } from 'react';
import { Modal } from "react-bootstrap";
import { IoClose } from "react-icons/io5";
import styles from "../styles/modal.module.css";
import Button from '../../../components/Button/Button';
import { useDispatch, useSelector } from "react-redux";
import { showToastMessage } from '../../../lib/toast';

/** Actions */
import { futureCancelAllOrder } from '../../../actions/futureActions';

/** Redux */
import { FutureCancelOrders } from '../../../redux/futureAction';

const CancelOrder = ({ show, handleClose }) => {
    const dispatch = useDispatch()
    // const { futureCancelOrdersList } = useSelector((state) => state.future);
    const { userdetails } = useSelector((state) => state.user);

    const [isOpen, setIsOpen] = useState(false);
    const [isStop, setIsStop] = useState(false);

    const cancelAllOrders = async () => {
        try {
            const payload = {
                orderId: "all",
                isOpen,
                isStop
            }
            const { status, message } = await futureCancelAllOrder(payload, userdetails.secretKey);
            showToastMessage(message, status ? 'success' : 'error')
            if (status) {
                dispatch(FutureCancelOrders({
                    cancelOrdersList: [],
                    cancelType: ''
                }))
                handleClose()
            }
        } catch (e) {
            console.log("cancelAllOrders_err", e);
        }
    }

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
                    <h4 className={`${styles.modalHeaderTitle} `}>Cancel all orders</h4>
                    <button
                        aria-label='closeIcon'
                        className={styles.modalCloseButton}
                        onClick={handleClose}
                    >
                        <IoClose />
                    </button>
                </Modal.Header>
                <Modal.Body className={styles.modalPrimaryBody}>
                    <div className={styles.modalPrimaryBodyContainer}>
                        <p>All open orders of the selected types will be cancelled</p>
                        <div className='mt-4 flexStart'>
                            <div className="custom-checkInput__container">
                                <label className="custom-checkInput__label">
                                    <input
                                        type="checkbox"
                                        checked={isOpen}
                                        onChange={(e) => setIsOpen(e.target.checked)}
                                    />
                                    <span className="custom-checkInput__checkmark"></span>
                                </label>
                                <p className="custom-checkInput__content">
                                    Limit orders
                                </p>
                            </div>
                            <div className="custom-checkInput__container ms-4 ">
                                <label className="custom-checkInput__label">
                                    <input
                                        type="checkbox"
                                        checked={isStop}
                                        onChange={(e) => setIsStop(e.target.checked)}
                                    />
                                    <span className="custom-checkInput__checkmark"></span>
                                </label>
                                <p className="custom-checkInput__content">
                                    Stop orders
                                </p>
                            </div>


                        </div>
                        <div className='mt-5 flexEnd'>
                            <Button
                                isLoading={false}
                                loadingText="Redirecting..."
                                btnText="Confirm"
                                disabled={!isOpen && !isStop}
                                onClick={() => cancelAllOrders()}
                                className="cardSuccessBtnSm"
                                selectedValue={null}
                            />
                        </div>
                    </div>
                </Modal.Body>
            </Modal>
        </div>
    );
};



export default CancelOrder;
