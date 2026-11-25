import React, { useEffect, useState } from 'react';
import { Modal } from "react-bootstrap";
import { IoClose } from "react-icons/io5";
import styles from "../styles/modal.module.css";
import Button from '../../../components/Button/Button';
import { useDispatch, useSelector } from "react-redux";
import { showToastMessage } from '../../../lib/toast';
import isEmpty from 'is-empty';
import { switchAccount } from '../../../actions/subAccountAction';
import { FaCheckCircle } from 'react-icons/fa';

/** Actions */

/** Redux */

const SwitchModal = ({ show, handleClose }) => {
    const { userdetails, subAccountList } = useSelector((state) => state.user);
    const [accountId, setAccountId] = useState('')
    const [isLoading, setIsLoading] = useState(false)
    const [errors, setErrors] = useState({});

    const onClose = () => {
        try {
            setAccountId('')
            setIsLoading(false)
            handleClose()
        } catch (err) {
            console.log(err, "onClose__err")
        }
    }
    const onSubmit = async () => {
        try {
            if (userdetails.accountId == accountId) {
                onClose()
                return true
            }
            setIsLoading(true)
            let { status, message, error } = await switchAccount({ accountId: accountId }, userdetails?.secretKey)
            if (status) {
                showToastMessage(message, 'success')
                setIsLoading(false)
                onClose()
                window.location.reload();
                return
            }
            setIsLoading(false)
            setErrors(error)
            !isEmpty(message) && showToastMessage(message, 'error')
        } catch (err) {
            console.log(err, "onSubmit")
        }
    }
    useEffect(() => {
        if (!isEmpty(userdetails.accountId)) {
            setAccountId(userdetails.accountId)
        }
    }, [userdetails])
    return (
        <Modal
            centered
            size="md"
            backdrop="static"
            show={show}
            onHide={onClose}
            className={styles.modalPrimary}
        >
            <Modal.Header className={styles.modalPrimaryHeader}>
                <div className={styles.calcModalTabs}>
                    <h4 className={`${styles.modalHeaderTitle} `}>Switch Sub Accounts</h4>
                </div>
                <button
                    aria-label='closeIcon'
                    className={styles.modalCloseButton}
                    onClick={onClose}
                >
                    <IoClose />
                </button>
            </Modal.Header>
            <Modal.Body className={`${styles.modalPrimaryBody} pt-0`}>
                <div className={styles.modalPrimaryBodyContainer}>
                    <div className={styles.switchAccountModelContent}>
                        {/* <div>
                                <h3 className={`${styles.modalHeaderTitle} fs16 mb-2`}>Main Account</h3>
                            </div> */}
                        <ul className={styles.switchAccountListPart}>

                            {
                                subAccountList?.length > 0 ? subAccountList?.map((item, index) => {
                                    // console.log(item.accountId, item.accountName, item, "Switch Sub Accounts")
                                    return (
                                        <li key={item.accountId} className={styles.subAccountList}>
                                            <label htmlFor={`radioBtn-${index}`}>
                                                {item.accountName}
                                                <input
                                                    type="radio"
                                                    name="accountList"
                                                    id={`radioBtn-${index}`}
                                                    onChange={() => {
                                                        setAccountId(item.accountId)
                                                    }}
                                                    checked={accountId == item.accountId ? true : false}
                                                />

                                                {
                                                    userdetails?.accountId == item.accountId &&
                                                    <p className={styles.selectedText}>Selected</p>
                                                }
                                                <p className={styles.checkIcon}>
                                                    <FaCheckCircle />
                                                </p>
                                            </label>
                                        </li>
                                    )
                                }) : ""
                            }
                        </ul>
                        <div className='d-flex justify-content-end mt-3'>
                            <Button
                                isLoading={isLoading}
                                loadingText="Loading..."
                                btnText={"Confirm"}
                                disabled={isEmpty(accountId)}
                                onClick={() => {
                                    onSubmit()
                                }}
                                className='cardSuccessBtnSm'
                            />
                        </div>
                    </div>
                </div>
            </Modal.Body>
        </Modal>
    );
};

export default SwitchModal;
