
/** package import */

import React, { useEffect, useState } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import Select from 'react-select'
import isEmpty from 'is-empty';
/** local import */

// import styles from './styles/myProfile.module.css'
// import styles from './styles/authInnerPage.module.css'
import styles from '../../dashboard/styles/authInnerPage.module.css';
import Images from '../../../utils/Images'
// import Button from '../../components/Button/Button'
import Button from '../../../components/Button/Button'
import { useGlobalContext } from '../../../context/GlobalProvider'
import ChangeDisplayName from '../modal/ChangeDisplayName'
import ChangeEmailNumber from '../modal/ChangeEmailNumber'
import ChangeEmail from '../modal/ChangeEmail'
import { InputComponent } from '../../../components/Input/InputFields';
import { useSelector } from 'react-redux'
import { updateInstitutional } from '../../../actions/institutionAction';
import { showToastMessage } from '../../../lib/toast';

/** code start */
const statusOption = [
    { 'label': 'Active', value: true },
    { 'label': 'In-Active', value: false },
]
const initialState = {
    depositFee: 0,
    withdrawalFee: 0,
    makerFee: 0,
    takerFee: 0,
    isKYC: false
}
const UserProfile = () => {
    const { userdetails, institutionalDetails } = useSelector((state) => state?.user);
    const location = useLocation();
    const navigate = useNavigate();
    const [formData, setFormData] = useState(initialState);
    const [error, setError] = useState({});


    const handleBack = () => {
        navigate(-1)
    }


    const onChangeHandler = (event) => {
        try {
            const { name, value } = event.target
            let numbers = /^[+]?([0-9]+(?:[\.][0-9]*)?|\.[0-9]+)$/;

            if (['depositFee', 'withdrawalFee', 'makerFee', 'takerFee'].includes(name) && !numbers.test(value) && value !== "") {
                return false
            }

            setFormData({ ...formData, ...{ [name]: value } })
            setError({ ...error, ...{ [name]: '' } })
        } catch (e) {
            console.log("onChangeHandler_err", e);
        }
    }

    const updateSettings = async () => {
        try {
            const { status, message, error } = await updateInstitutional(formData, userdetails.secretKey);
            if (status) {
                showToastMessage(message, 'success')
                return
            }
            setError(error);
            !isEmpty(message) && showToastMessage(message, 'error')

        } catch (e) {
            console.log('updateSettings_err', e);
        }
    }

    useEffect(() => {
        if (!isEmpty(institutionalDetails)) {
            setFormData(institutionalDetails.settings)
        }
    }, [institutionalDetails])

    return (
        <div>
            <h5 className={styles.pageTitle}>Settings</h5>
            <div className={styles.cardHeader}>
                <p className={styles.cardTitleSm}></p>
                <Button
                    isLoading={false}
                    loadingText="Redirecting..."
                    btnText="Back"
                    onClick={handleBack}
                    className="backBtn"
                    selectedValue={null}
                />
            </div>

            <div className={`${styles.cardBody} p-3`}>
                <div className={styles.twoInputWrapper}>
                    <InputComponent label={"Deposit Fee"}
                        placeholder={'Enter deposit fee'}
                        value={formData.depositFee}
                        error={error?.depositFee}
                        onChange={onChangeHandler}
                        name={'depositFee'}
                    />
                    <InputComponent label={"Withdraw Fee"}
                        placeholder={'Enter withdraw fee'}
                        value={formData.withdrawalFee}
                        error={error?.withdrawalFee}
                        onChange={onChangeHandler}
                        name={'withdrawalFee'}
                    />
                </div>
                <div className={styles.twoInputWrapper}>
                    <InputComponent label={"Maker Fee"}
                        placeholder={'Enter maker fee'}
                        value={formData.makerFee}
                        error={error?.makerFee}
                        onChange={onChangeHandler}
                        name={'makerFee'}
                    />
                    <InputComponent label={"Taker Fee"}
                        placeholder={'Enter taker fee'}
                        value={formData.takerFee}
                        error={error?.takerFee}
                        onChange={onChangeHandler}
                        name={'takerFee'}
                    />
                </div>
                <div className={`${styles.twoSelectWrapper} w-100 mt-3`}>
                    <div className='me-2'>
                        <label className={`${styles.selectOption_label} mb-2`}>Status</label>
                        <Select
                            isSearchable={false}
                            placeholder="Select"
                            classNamePrefix="react-select__ninth"
                            menuPosition='fixed'
                            options={statusOption}
                            value={statusOption.find((el) => el.value === formData.isKYC)}
                            onChange={(e) => { setFormData((prev) => ({ ...prev, isKYC: e.value })) }}
                        />
                    </div>
                </div>

                <div className={styles.btnWrapper}>
                    <Button
                        isLoading={false}
                        loadingText="Redirecting..."
                        btnText="Submit"
                        onClick={updateSettings}
                        className="cardSuccessBtn"
                        selectedValue={null}
                    />
                </div>
            </div>

        </div>
    )
}

export default UserProfile;