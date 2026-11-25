/** PACKAGE IMPORT */

import React, { useEffect, useState } from "react";

/** LOCAL FILES IMPORT */

import styles from "../styles/institutionalApplyDetails.module.css";
import Button from "../../../components/Button/Button";
import Images from '../../../utils/Images';
import { useGlobalContext } from '../../../context/GlobalProvider';
import { useNavigate } from "react-router-dom";
import { InputComponent, InputTextareaComponent } from "../../../components/Input/InputFields";
import { useSelector } from 'react-redux'
import isEmpty from 'is-empty';
import { addSubUsers } from "../../../actions/institutionAction";
import { showToastMessage } from "../../../lib/toast";

/** CODE START */

const initialState = {
    firstName: "", lastName: "", email: "",
}
const AddSubAccount = () => {
    const { theme } = useGlobalContext();
    const navigate = useNavigate();
    const { userdetails } = useSelector((state) => state?.user);
    const [formData, setFormData] = useState(initialState)
    const [error, setError] = useState({})
    const handleActiveDetails = (val) => {
        navigate(-1)
    }

    const onChangeHandler = (event) => {
        try {
            const { name, value } = event.target
            // default update
          

            setFormData(prev => ({ ...prev, [name]: value }));
            setError(prev => ({ ...prev, [name]: '' }));
        } catch (e) {
            console.error("onChangeHandler_err", e);
        }
    };

    const addSubUser = async () => {
        try {
            const { status, message, error } = await addSubUsers(formData, userdetails.secretKey);
            if (status) {
                setFormData(initialState)
                showToastMessage(message, 'success')
                return
            }
            !isEmpty(message) && showToastMessage(message, 'error')
            setError(error)
        } catch (e) {
            console.log("addSubUser_err", e);
        }
    }

    return (
        <section className={styles.institutionalDetails + " pt-0"}>
            {/* <div className="custom-container container"> */}
            <div className={styles.contentSection + " pt-0"}>
                <div className="d-flex align-items-center justify-content-between gap-3">
                    <h4 className={`${styles.title}`}>
                        Add Sub-Account
                    </h4>
                    <Button
                        isLoading={false}
                        loadingText="Redirecting..."
                        btnText={"Back"}
                        className="backBtn"
                        onClick={(e) => handleActiveDetails()}
                    />
                </div>
                <div className={`row align-items-center`}>
                    <div className='col-lg-5 mb-3'>
                        <div className={styles.applyDetails}>
                            <div className="mt-4">
                                <div className="">
                                    <InputComponent className={'institutionForm'} label={"First Name"} type="text" placeholder={"Enter First Name"}
                                        name={'firstName'}
                                        value={formData?.firstName}
                                        error={error?.firstName}
                                        onChange={onChangeHandler}
                                    />
                                </div>
                                <div className="">
                                    <InputComponent className={'institutionForm'} label={"Last Name"} type="text" placeholder={"Enter Last Name"}
                                        name={'lastName'}
                                        value={formData?.lastName}
                                        error={error?.lastName}
                                        onChange={onChangeHandler}
                                    />
                                </div>
                                {/* <div className="mt-4">
                                    <InputComponent className={'institutionForm'} label={"User ID"} type="text" placeholder={"Enter User ID"}
                                        name={'lastName'}
                                        value={formData?.lastName}
                                        error={error?.lastName}
                                        onChange={onChangeHandler}
                                    />
                                </div> */}

                                <div className="mt-4">
                                    <InputComponent className={'institutionForm'} label={"Mail ID"} type="text" placeholder={"Enter Mail ID"}
                                        name={'email'}
                                        value={formData?.email}
                                        error={error?.email}
                                        onChange={onChangeHandler}
                                    />
                                </div>
                            </div>
                        </div>
                        <div className={`${styles.bannerButtons} mt-4 mt-xl-5 justify-content-center justify-content-lg-start`}>
                            <Button
                                isLoading={false}
                                loadingText="Redirecting..."
                                btnText={"Submit"}
                                className="primaryBtn"
                                onClick={addSubUser}
                            />
                        </div>

                    </div>
                    <div className='col-lg-6 offset-xl-1'>
                        <div className={styles.applyDetailsImage}>
                            <img src={Images.subAccount} className={" img-fluid"} alt="Trevolt" />
                        </div>
                    </div>
                </div>
            </div>
            {/* </div> */}
        </section>
    )
}

export default AddSubAccount
