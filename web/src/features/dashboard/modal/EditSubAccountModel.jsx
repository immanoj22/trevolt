import React, { useEffect, useState } from 'react';
import { Modal } from "react-bootstrap";
import { IoClose } from "react-icons/io5";
import { useSelector } from "react-redux";
import styles from "../styles/modal.module.css";
import Button from '../../../components/Button/Button';
import { InputComponent } from '../../../components/Input/InputFields';
import { IoIosArrowBack, IoIosArrowForward } from 'react-icons/io';
import { ChangeMarginModelContent } from '../../futuresTrading/modal/ChangeMarginModel';

/**ACTIONS */
import { createSubAccount, updateSubAccount } from '../../../actions/subAccountAction';

/**LIB */
import isEmpty from 'is-empty';
import { showToastMessage } from '../../../lib/toast';



const initialState = {
    name: "",
    marginMode: "cross",
    accountId: ""
}

const EditSubAccountModel = ({ show, handleClose, records, type }) => {
    const [tabCount, setTabCount] = useState(0);
    const { userdetails } = useSelector((state) => state.user);
    const [formData, setFormData] = useState(initialState);
    const [isLoading, setisLoading] = useState(false);
    const [errors, setErrors] = useState({});

    const marginMode =  { 'isolated' : "Isolated", "portfolio" : "Portfolio", "cross" : "Cross" };

    

    const onChangeHandler = (event) => {
        const { name, value } = event.target
        const textNum = /^[A-Za-z]{0,30}$/
        if (['name'].includes(name) && (value !== "" && !textNum.test(value))) {
            return false;
        }

        setFormData((prev) => ({ ...prev, [name]: value }))
    }

    const onSubmit = async () => {
        if (type === 'edit' && formData.name == records.accountName) {
            onClose()
            return
        }
        else if (type === 'add' && isEmpty(formData.name)) {
            setErrors({ name: "Name is required" })
            return
        }
        setisLoading(true)
        const { status, message, error } = type === 'edit' ? await updateSubAccount(formData, userdetails?.secretKey) : await createSubAccount(formData, userdetails?.secretKey)
        if (status) {
            showToastMessage(message, 'success')
            setisLoading(false)
            onClose()
            return
        }
        setisLoading(false)
        setErrors(error)
        !isEmpty(message) && showToastMessage(message, 'error')
    }

    const onClose = () => {
        try {
            setFormData(initialState)
            setErrors({})
            setisLoading(false)
            handleClose()
            setTabCount(0)
        } catch (err) {
            console.log(err, "Onclose")
        }
    }

    useEffect(() => {
        if (!isEmpty(records) && type === 'edit') {
            setFormData({
                ...records, ...{
                    name: records.accountName,
                    marginMode: records.marginMode,
                    accountId: records.accountId
                }
            })
        }
    }, [records])

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
                    <h4 className={`${styles.modalHeaderTitle} `}>{tabCount == 0 ? `${type === 'edit' ? "Edit" : "Add"} Sub Account` : "Change Margin Mode"}</h4>
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
                    {
                        tabCount == 0 &&
                        <div>
                            <div>
                                <InputComponent
                                    label={"Sub Account Name"}
                                    id="name"
                                    name={"name"}
                                    placeholder="Enter sub account name"
                                    value={formData.name}
                                    error={errors?.name}
                                    onChange={onChangeHandler}
                                />
                            </div>
                            <div className='d-flex gap-2 justify-content-between my-2'>
                                <p className={styles.modalLabel}>
                                    Margin Mode
                                    <button onClick={() => (setTabCount(1))} className={styles.changeBtn}>
                                        Change
                                        <IoIosArrowForward />
                                    </button>
                                </p>
                                <p className={styles.modalLabelWhite}>{marginMode[formData.marginMode]}</p>

                            </div>
                            {/* <div className='d-flex gap-2 justify-content-between'>
                                    <label className={styles.modalLabel} htmlFor="loginSubAccount">
                                        Login with Sub Account email
                                    </label>
                                    <div className="custom-toggle__secondaryXs">
                                        <label className="switch">
                                            <input
                                                type="checkbox"
                                                id='loginSubAccount'
                                            />
                                            <span className="slider round"></span>
                                        </label>
                                    </div>
                                </div> */}
                            <div className='mt-3'>
                                <Button
                                    isLoading={isLoading}
                                    loadingText="Loading..."
                                    btnText={type == 'add' ? "Confirm" : "Update"}
                                    className='successFillRectangleBtn'
                                    staticClass='fs16'
                                    onClick={() => onSubmit()}
                                />
                            </div>
                        </div>
                    }
                    {
                        tabCount == 1 &&
                        <div>
                            <p className={`${styles.modalLabel} mb-3`}>
                                <button onClick={() => (setTabCount(0))} className={`${styles.changeBtn} fs16 mb-1`}>
                                    <IoIosArrowBack />
                                    Back
                                </button>
                            </p>
                            <ChangeMarginModelContent
                                changeOption={false}
                                type={type}
                                handleClose={onClose}
                                marginMode={formData?.marginMode}
                                setMarginMode={(marginMode) => {
                                    setFormData({ ...formData, ...{ marginMode: marginMode } })
                                    setTabCount(0)
                                }}
                                accountId={formData?.accountId}
                            />
                        </div>
                    }
                </div>
            </Modal.Body>
        </Modal>
    );


}

export default EditSubAccountModel;