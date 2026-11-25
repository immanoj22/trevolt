
/** package import */

import React, { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'


/** local import */

import styles from './styles/authInnerPage.module.css'
import Button from '../../components/Button/Button'
import { validateBankAccount } from '../../pages/Validation/walletValidation'


/** LOCAL FILES IMPORT */
import styled from "../../pages/Auth/auth.module.css";
import { addBankAccountHooks, updateBankAccountHooks } from '../../actions/walletAction'
import { showToastMessage } from '../../lib/toast'
import { useSelector } from 'react-redux'
/** code start */

const EditBank = () => {

    const location = useLocation();
    let alpharegex = /^[A-Za-z\s]+$/;
    let numregex = /^[0-9]+$/;
    const { userdetails } = useSelector((state) => state.user);
    const initialValue = {
        "holderName": '',
        "bankName": '',
        "accountNo": '',
        "bankcode": '',
        "country": '',
        "bankAddress": '',
        "city": ''
    };


    const [formValue, setFormValue] = useState(initialValue);
    const [errors, setErrors] = useState({});
    const { bankName, accountNo, holderName, bankcode, country, city, bankAddress } = formValue;
    const navigate = useNavigate();


    useEffect(() => {
        let bankData = location?.state;
        setFormValue({ ...formValue, ...bankData })
    }, [location]);

    const handleBack = () => {
        navigate(-1)
    }


    const handleChange = (e) => {
        try {
            const { id, value } = e?.target;
            setFormValue({ ...formValue, ...{ [id]: value } })
        } catch (e) {
            console.log("handleChange__Err", e);
        }
    }


    const EditBankDetails = async () => {
        try {
            // e.preventDefault()
            const { status, errors } = await validateBankAccount(formValue);
            if (status) {
                setErrors(errors);
            } else {
                const resp = await updateBankAccountHooks(formValue, userdetails?.secretKey);
                if (resp?.data?.success) {
                    setErrors({});
                    showToastMessage(resp?.data?.message, 'success');
                    navigate("/my-profile")
                } else if (!resp?.data?.success) {
                    setErrors(resp.data.errors);
                    if (resp?.data?.message) {
                        showToastMessage(resp?.data?.message, 'error')
                    }
                }
            }
        } catch (e) {
            console.log("AddBankDetails__Err", e);
        }
    }




    return (
        <div>
            <h5 className={styles.pageTitle}>Bank Details</h5>
            <div className={styles.cardHeader}>
                <p className={styles.cardTitleSm}>Edit Bank</p>

                <Button
                    isLoading={false}
                    loadingText="Redirecting..."
                    btnText="Back"
                    onClick={handleBack}
                    className="backBtn"
                    selectedValue={null}
                />
            </div>

            <div className={`${styles.cardBorder} mt-4`}>

                <div className='row'>
                    <div className='col-lg-6 pe-lg-5'>
                        <div>
                            <div className={styles.singleFormWrapperSm}>
                                <p className={styles.singleFormLabel}>
                                    Holder Name
                                </p>
                                <input type="text" className={`${styles.singleFormInputBg}`} placeholder='Enter Holder Name' id="holderName" value={holderName} onChange={(e) => { if (alpharegex.test(e?.target?.value) || e?.target?.value == "") { handleChange(e) } }} />
                                {errors?.holderName && <p className={`${styled.formError} mt-2`}>{errors?.holderName}</p>}
                            </div>
                            <div className={`${styles.singleFormWrapperSm} mt-4`}>
                                <p className={styles.singleFormLabel}>
                                    Bank Name
                                </p>
                                <input type="text" className={`${styles.singleFormInputBg}`} placeholder='Enter Bank Name' id="bankName" value={bankName} onChange={(e) => { if (alpharegex.test(e?.target?.value) || e?.target?.value == "") { handleChange(e) } }} />
                                {errors?.bankName && <p className={`${styled.formError} mt-2`}>{errors?.bankName}</p>}
                            </div>
                            <div className={`${styles.singleFormWrapperSm} mt-4`}>
                                <p className={styles.singleFormLabel}>
                                    Account Number
                                </p>
                                <input type="text" className={`${styles.singleFormInputBg}`} placeholder='Enter Account Number' id="accountNo" value={accountNo} readOnly={true} onChange={(e) => { if (numregex.test(e?.target?.value) || e?.target?.value == "") { handleChange(e) } }} />
                                {errors?.accountNo && <p className={`${styled.formError} mt-2`}>{errors?.accountNo}</p>}
                            </div>
                            <div className={`${styles.singleFormWrapperSm} mt-4`}>
                                <p className={styles.singleFormLabel}>
                                    IFSC
                                </p>
                                <input type="text" className={`${styles.singleFormInputBg}`} placeholder='Enter Code' id="bankcode" value={bankcode} onChange={(e) => handleChange(e)} />
                                {errors?.bankcode && <p className={`text-danger mt-2`}>{errors?.bankcode}</p>}
                            </div>
                        </div>
                    </div>
                    <div className='col-lg-6 ps-lg-5 mt-4 mt-lg-0'>
                        <div>
                            <div className={styles.singleFormWrapperSm}>
                                <p className={styles.singleFormLabel}>
                                    Bank Country
                                </p>
                                <input type="text" className={`${styles.singleFormInputBg}`} placeholder='Enter Bank Country' id="country" value={country} onChange={(e) => { if (alpharegex.test(e?.target?.value) || e?.target?.value == "") { handleChange(e) } }} />
                                {errors?.country && <p className={`${styled.formError} mt-2`}>{errors?.country}</p>}
                            </div>
                            <div className={`${styles.singleFormWrapperSm} mt-4`}>
                                <p className={styles.singleFormLabel}>
                                    Bank Address
                                </p>
                                <input type="text" className={`${styles.singleFormInputBg}`} placeholder='Enter Bank Address' id="bankAddress" value={bankAddress} onChange={(e) => handleChange(e)} />
                                {errors?.bankAddress && <p className={`text-danger mt-2`}>{errors?.bankAddress}</p>}
                            </div>
                            <div className={`${styles.singleFormWrapperSm} mt-4`}>
                                <p className={styles.singleFormLabel}>
                                    Bank City
                                </p>
                                <input type="text" className={`${styles.singleFormInputBg}`} placeholder='Enter Bank City' id="city" value={city} onChange={(e) => { if (alpharegex.test(e?.target?.value) || e?.target?.value == "") { handleChange(e) } }} />
                                {errors?.city && <p className={`${styled.formError} mt-2`}>{errors?.city}</p>}
                            </div>
                        </div>
                    </div>
                </div>


            </div>


            <div className={`mt-4 d-flex align-items-center justify-content-end`}>
                <Button
                    isLoading={false}
                    loadingText="Loading..."
                    btnText="Update"
                    onClick={() => { EditBankDetails() }}
                    className="cardSuccessBtn"
                    selectedValue={null}
                />

            </div>
        </div>
    )
}

export default EditBank
