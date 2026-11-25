/** PACKAGE IMPORT */

import React, { useEffect } from 'react'
import Select from 'react-select'

/** LOCAL FILES IMPORT */

import styles from "./styles/authInnerPage.module.css"
import { useGlobalContext } from '../../context/GlobalProvider'
import { useDispatch, useSelector } from "react-redux";
import Button from '../../components/Button/Button';
import { showToastMessage } from '../../lib/toast';
import { validateUserSettings } from '../../pages/Validation/userValidation';
import { useState } from 'react';
import { updateUserSettingsHooks } from '../../actions/userAction';
import { formatDisplayPair } from '../../lib/pairDisplay';


/** CODE START */

const Settings = () => {

    const { toggleTheme, theme } = useGlobalContext()
    const [errors, setErrors] = useState({})

    const langOptions = [
        { value: 'english', label: 'english' },
        { value: 'hindi', label: 'hindi' },
    ];

    const currencyOptions = [
        { value: 'USD', label: 'USD' },
        { value: 'EUR', label: 'EUR' },
        { value: 'USDT', label: formatDisplayPair('USDT') },
    ];


    const { userdetails } = useSelector((state) => state.user);


    const [userTheme, setUserTheme] = useState("");
    const [language, setLanguage] = useState({});
    const [convertCurrency, setConvertCurrency] = useState({});
    const [btndis, setBtnDis] = useState(false);

    useEffect(() => {
        if (Object.values(userdetails)?.length > 0) {
            setConvertCurrency({ label: userdetails?.convertCurrency, value: userdetails?.convertCurrency });
            // setLanguage({ label: userdetails?.language, value: userdetails?.language });
            setUserTheme(userdetails?.userTheme)
        }
    }, [userdetails]);



    const onSubmit = async () => {
        try {
            // let reqData = { language: language, type: "setting", userTheme: userTheme, convertCurrency: convertCurrency };
                const formData = new FormData();
                // formData.append("language", language?.value);
                formData.append("type", "setting");
                formData.append("userTheme", userTheme);
                formData.append("convertCurrency", convertCurrency?.value);
                setBtnDis(true);
                const resp = await updateUserSettingsHooks(formData, userdetails?.secretKey);
                if (resp?.data?.success) {
                    showToastMessage(resp?.data?.message, "success");
                    setBtnDis(false);
                    close()
                } else if (!resp?.data?.success) {
                    if (resp?.data?.message) {
                        setErrors(resp?.data?.error)
                        showToastMessage(resp?.data?.message, "error");
                        setBtnDis(false);
                    }
                }
            // }
        } catch (e) {
            console.log("onSubmit__Err", e)
        }
    }


    const changeTheme = (checked) => {
        if (checked) {
            setUserTheme("dark")
        } else {
            setUserTheme("light");
        }
        toggleTheme()

    }
    useEffect(() => {
        window.scrollTo({
            top: 0,
            behavior: "smooth",
        });
    }, []);

    return (
        <div>

            <h5 className={styles.pageTitle}>Settings</h5>
            <div className={`${styles.cardMaxWidthMd} mt-4`}>
                {/* <div className={styles.singleFormWrapper}>
                    <p className={styles.singleFormLabel}>
                        Language
                    </p>
                    <div className={``}>
                        <Select
                            isSearchable={false}
                            placeholder="Select"
                            classNamePrefix="react-select__secondary"
                            options={
                                langOptions
                            }
                            value={language}
                            onChange={(e) => setLanguage({ label: e?.value, value: e?.value })}
                        />
                    </div>
                </div> */}
                {/* <div className={`${styles.singleFormWrapper} mt-4`}>
                    <p className={styles.singleFormLabel}>
                        Currency Conversation
                    </p>
                    <div className={``}>
                        <Select
                            isSearchable={false}
                            placeholder="Select"
                            classNamePrefix="react-select__secondary"
                            options={
                                currencyOptions
                            }
                            value={convertCurrency}
                            onChange={(e) => { setConvertCurrency({ label: e?.value?.toUpperCase(), value: e?.value?.toUpperCase() }) }}
                        />
                    </div>
                </div> */}
                <div className={`${styles.singleFormWrapper} mt-4`}>
                    <p className={styles.singleFormLabel}>
                        Choose Theme
                    </p>

                    {/* {} */}
                    <div className={styles.themeSelectorContainer}>

                        <p style={{ textTransform: "capitalize" }}>Dark Theme</p>
                        <div className="custom-toggle__primary">
                            <label className="switch">
                                <input
                                    type="checkbox"
                                    onChange={(e) => changeTheme(e?.target?.checked)}
                                    checked={userTheme === "dark"}
                                />
                                <span className="slider round"></span>
                            </label>
                        </div>
                    </div>
                </div>
                <div className="w-25 mt-5 d-flex">
                    <Button btnText={"Submit"} className={"cardSuccessBtn_rect"} disabled={btndis} onClick={() => onSubmit()} />
                </div>
            </div>
        </div>
    )
}

export default Settings