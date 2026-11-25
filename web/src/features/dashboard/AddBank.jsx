/** package import */

import React, { useEffect, useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'


/** local import */

import styles from './styles/authInnerPage.module.css'
import Button from '../../components/Button/Button'
import { validateBankAccount } from '../../pages/Validation/walletValidation'


/** LOCAL FILES IMPORT */
import styled from "../../pages/Auth/auth.module.css";
import { addBankAccountHooks } from '../../actions/walletAction'
import { getUserDetailsHooks } from '../../actions/userAction'
import { showToastMessage } from '../../lib/toast'
import { useSelector, useDispatch } from 'react-redux'
import { UserDetails } from '../../redux/action'
/** code start */

const AddBank = () => {

    const { userdetails } = useSelector((state) => state.user);
    const dispatch = useDispatch();
    const initialValue = {
        "holderName": '',
        "bankName": '',
        "accountNo": '',
        "bankcode": '',
        "country": '',
        "bankAddress": '',
        "city": '',
        'secretKey': userdetails?.secretKey
    };

    let alpharegex = /^[A-Za-z\s]+$/;
    let numregex = /^[0-9]+$/;

    const location = useLocation();
    let pathName = location?.state?.navigatepath;

    const [formValue, setFormValue] = useState(initialValue);
    const [errors, setErrors] = useState({});
    const { bankName, accountNo, holderName, bankcode, country, city, bankAddress } = formValue;
    const navigate = useNavigate()

    const handleBack = () => {
        navigate(-1)
    }

    // Was missing entirely — after a successful add, the code below only
    // toasted + navigated away, leaving Redux's `userdetails.bankAccounts`
    // stale until the next full login/refresh. This re-pulls the user's
    // profile (same call GlobalProvider.jsx makes on login) and updates
    // Redux, so the new bank account is already present in `userdetails`
    // by the time the previous screen (My Profile / Withdraw) re-renders.
    const refreshUserDetails = async () => {
        try {
            const resp = await getUserDetailsHooks();
            const result = resp?.data;
            if (result?.success) {
                dispatch(UserDetails({ userdetails: result?.result?.data }));
            }
        } catch (e) {
            console.log("refreshUserDetails__Err", e);
        }
    }


    const handleChange = (e) => {
        try {
            const { id, value } = e?.target;
            setFormValue({ ...formValue, ...{ [id]: value } })
        } catch (e) {
            console.log("handleChange__Err", e);
        }
    }


    const AddBankDetails = async () => {
        try {
            // e.preventDefault()
            const { status, errors } = await validateBankAccount(formValue);
            if (status) {
                setErrors(errors);
            } else {
                const resp = await addBankAccountHooks(formValue, userdetails?.secretKey);
                if (resp?.data?.success) {
                    setErrors({});
                    showToastMessage(resp?.data?.message, 'success');
                    await refreshUserDetails();
                    if (pathName == "/withdraw") {
                        navigate(-1)
                    } else {
                        navigate(pathName)
                    }

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

    useEffect(() => {
        window.scrollTo({
            top: 0,
            behavior: "smooth",
        });
    }, []);

    return (
        <div>
            <h5 className={styles.pageTitle}>Bank Details</h5>
            <div className={styles.cardHeader}>
                <p className={styles.cardTitleSm}>Add Bank</p>

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
                                    Account Holder Name
                                </p>
                                <input type="text" className={`${styles.singleFormInputBg}`} placeholder='Enter Account Holder Name' id="holderName" value={holderName} onChange={(e) => { if (alpharegex.test(e?.target?.value) || e?.target?.value == "") { handleChange(e) } }} />
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
                                <input type="text" className={`${styles.singleFormInputBg}`} placeholder='Enter Account Number' id="accountNo" value={accountNo} onChange={(e) => { if (numregex.test(e?.target?.value) || e?.target?.value == "") { handleChange(e) } }} />
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


            <div className={`mt-5 d-flex align-items-center justify-content-end`}>
                <Button
                    isLoading={false}
                    loadingText="Loading..."
                    btnText="Save"
                    onClick={() => { AddBankDetails() }}
                    className="cardSuccessBtn"
                    selectedValue={null}
                />
            </div>
        </div>
    )
}

export default AddBank