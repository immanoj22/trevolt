/** package import */

import React, { useEffect, useState } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'

/** local import */

// import styles from './styles/myProfile.module.css'
import styles from './styles/authInnerPage.module.css'
import Images from '../../utils/Images'
import Button from '../../components/Button/Button'
import BankDetails from './components/BankDetails'
import { useGlobalContext } from '../../context/GlobalProvider'
import ChangeDisplayName from './modal/ChangeDisplayName'
import ChangeEmailNumber from './modal/ChangeEmailNumber'
import ChangePassword from './modal/ChangePassword'
import ChangeEmail from './modal/ChangeEmail'
import { confirmEmailChangeHooks, logoutHooks, sendEmailVerificationLinkHooks, updateUserSettingsHooks } from '../../actions/userAction'
import { showToastMessage } from '../../lib/toast'
import isEmpty from 'is-empty'
import { useSelector } from 'react-redux'
import { imageValidation } from '../../pages/Validation/userValidation'
// import styled from "../../pages/Auth/auth.module.css"
import config from '../../config/env'
import { RemoveItemLocalStorageItem } from '../../lib/storage'
import AddPhoneNumber from './modal/AddPhoneNumber'
import { maskEmail, maskMobile } from '../../lib/Common'

/** code start */

const MyProfile = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const { userId } = useParams();
    const { theme } = useGlobalContext();
    const [changeDisplayNameModel, setChangeDisplayNameModel] = useState(false);
    const [changeDisplayfirstlastModel, setChangeDisplayfirstlastModel] = useState(false);
    const [changePasswordModel, setChangePasswordModel] = useState(false);
    const [changePhoneModel, setChangePhoneModel] = useState(false);
    const [changeEmailModel, setChangeEmailModel] = useState(false);
    const [changeName, setChangeName] = useState("");
    // const 
    const [file, setFile] = useState({});
    const [error, setError] = useState("")
    const { userdetails } = useSelector((state) => state.user);
    const [btndis, setBtnDis] = useState(false);

    const { firstName, lastName, userName, email, referralCode, countryCode, mobileNumber, profileImage } = userdetails;

    const handleBack = () => {
        navigate(-1)
    }

    const displayNameModelToggle = () => {
        setChangeDisplayNameModel(!changeDisplayNameModel);
        setChangeName("userName")
    }

    const displayfirlasNameModelToggle = () => {
        setChangeDisplayfirstlastModel(!changeDisplayfirstlastModel);
        setChangeName("firlast")
    }

    const passwordModelToggle = () => {
        setChangePasswordModel(!changePasswordModel);
    }

    const phoneModelToggle = () => {
        setChangePhoneModel(!changePhoneModel);
    }

    const emailModelToggle = () => {
        setChangeEmailModel(!changeEmailModel);
    }

    useEffect(() => {
        let pathname = location.pathname;
        if (pathname == '/verify-old-email/' + userId) {
            verifyOldEmail();
        } else if (pathname == '/verify-new-email/' + userId) {
            verifyNewEmail();
        }
        window.scrollTo({
            top: 0,
            behavior: "smooth",
        });
    }, []);

    useEffect(() => {
        if (location.state?.scrollToBottom) {
            window.scrollTo({
                top: document.body.scrollHeight,
                behavior: "smooth",
            });
        }
    }, [location]);


    const verifyOldEmail = async () => {
        try {
            let pathname = location.pathname;
            let userId = pathname.split('/')[2];
            if (!isEmpty(userId)) {
                const resp = await sendEmailVerificationLinkHooks({ token: userId });
                let verficationMain = resp?.data;
                if (verficationMain.success) {
                    showToastMessage(verficationMain.message, 'success');
                } else {
                    showToastMessage(verficationMain.message, 'error')
                }
            }

        } catch (e) {
            console.log("verifyNewEmail_err", e);
        }
    }


    const verifyNewEmail = async () => {
        try {
            if (!isEmpty(userId)) {
                const resp = await confirmEmailChangeHooks({ token: userId });
                let verficationMain = resp?.data;
                if (verficationMain.success) {
                    showToastMessage(verficationMain.message, 'success');
                    navigate("/");
                    // SECURITY FIX (VAPT: Points 44/49/70): raw JWT is no
                    // longer stored under "accessToken"; clear the
                    // non-sensitive session flag instead (this call was
                    // previously passing a bare string instead of
                    // { key: "accessToken" } so it was already a no-op —
                    // fixed to actually clear session state on email change).
                    RemoveItemLocalStorageItem({ key: "isLoggedIn" });
                    logoutHooks()
                } else {
                    showToastMessage(verficationMain.message, 'error')
                }
            }
        } catch (e) {
            console.log("verifyNewEmail_err", e);
        }
    }

    const profileUpdate = async (e) => {
        try {
            const { id } = e?.target;
            if (id == "profileInput") {
                const { status, errors } = await imageValidation(e?.target?.files[0]);
                if (status) {
                    setError(errors)
                } else {
                    // SECURITY FIX: removed console.log of sensitive client-side data (secretKey/password/OTP)
                    const formData = new FormData();
                    formData.append("attachment", e.target?.files[0]);
                    formData.append("type", "profile");
                    formData.append("profilestatus", "add");
                    setBtnDis(true)
                    const resp = await updateUserSettingsHooks(formData, userdetails?.secretKey);
                    if (resp?.data?.success) {
                        setBtnDis(false)
                        setFile(e?.target?.files[0]);
                        showToastMessage(resp?.data?.message, "success");
                        setError("")
                    } else if (!resp?.data?.success) {
                        setBtnDis(false)
                        if (resp?.data?.message) {
                            setError(resp?.data?.error)
                            showToastMessage(resp?.data?.message, "error")
                        }
                    }
                }

            }
        } catch (e) {
            console.log("profileUpdate__Err", e)
        }
    };

    const removeProfile = async () => {
        try {
            const formData = new FormData();
            formData.append("type", "profile");
            formData.append("profilestatus", "remove");
            const resp = await updateUserSettingsHooks(formData, userdetails?.secretKey);
            if (resp?.data?.success) {
                setBtnDis(false)
                setFile("");
                showToastMessage(resp?.data?.message, "success");
                setError("")
            } else if (!resp?.data?.success) {
                setBtnDis(false)
                if (resp?.data?.message) {
                    setError(resp?.data?.error)
                    showToastMessage(resp?.data?.message, "error")
                }
            }
        } catch (e) {
            console.log("removeProfile__Err", e)
        }
    }

    const handleCopy = (secret) => {
        showToastMessage("The referral code has been copied!", "success")
        navigator.clipboard.writeText(secret)
    }

    return (
        <div>
            <h5 className={styles.pageTitle}>Profile Settings</h5>
            <div className={styles.cardHeader}>
                <p className={styles.cardTitleSm}>Personal Info</p>
                <Button
                    isLoading={false}
                    loadingText="Redirecting..."
                    btnText="Back"
                    onClick={handleBack}
                    className="backBtn"
                    selectedValue={null}
                />
            </div>

            <div className={styles.cardBody}>
                <div className={styles.cardBodyHeader}>
                    <div className={styles.cardProfileWrapper}>
                        <img src={profileImage ? profileImage : !isEmpty(file) ? URL.createObjectURL(file) : theme == 'dark' ? Images.darkDefaultProfile : Images.lightDefaultProfile} alt="profile" />
                        <div className={styles.profileFileInput}>
                            <input type="file" id='profileInput' onChange={(e) => profileUpdate(e)} />
                        </div>
                    </div>
                    {error && <p className={`text-danger mt-2`}>{error}</p>}
                    <div className='d-flex gap-2 flex-wrap justify-content-center'>
                        <label htmlFor="profileInput" className={styles.profileInputLabel}>
                            Change
                        </label>
                        {!isEmpty(profileImage) && <label className={styles.profileInputLabel} onClick={() => removeProfile()}>
                            Remove
                        </label>}
                    </div>
                </div>

                <div className={styles.cardBodyContent}>
                    <div className={styles.cardSingleContainer}>
                        <div className={styles.cardSingleContainerLeft}>
                            <p className={styles.cardContainerLabel}>
                                User ID
                            </p>
                            <p className={styles.cardContainerValue}>
                                {userdetails?.userGreenId}
                            </p>
                        </div>
                        {/* <div className={styles.cardSingleContainerRight}>
                            <Button
                                isLoading={false}
                                loadingText="Redirecting..."
                                btnText="Copy"
                                onClick={handleBack}
                                className="cardBtn"
                                selectedValue={null}
                            />
                        </div> */}
                    </div>

                    <div className={styles.cardSingleContainer}>
                        <div className={styles.cardSingleContainerLeft}>
                            <p className={styles.cardContainerLabel}>
                                Display Name
                            </p>
                            <p className={styles.cardContainerValue}>
                                {`${userName}`}
                            </p>
                        </div>
                        <div className={styles.cardSingleContainerRight}>
                            <Button
                                isLoading={false}
                                loadingText="Redirecting..."
                                btnText="Change"
                                onClick={displayNameModelToggle}
                                className="cardBtn"
                                selectedValue={null}
                            />
                        </div>
                    </div>
                    <div className={styles.cardSingleContainer}>
                        <div className={styles.cardSingleContainerLeft}>
                            <p className={styles.cardContainerLabel}>
                                First Name - Last Name
                            </p>
                            <p className={styles.cardContainerValue}>
                                {`${firstName}-${lastName}`}
                            </p>
                        </div>
                        <div className={styles.cardSingleContainerRight}>
                            <Button
                                isLoading={false}
                                loadingText="Redirecting..."
                                btnText="Change"
                                onClick={displayfirlasNameModelToggle}
                                className="cardBtn"
                                selectedValue={null}
                            />
                        </div>
                    </div>
                    <div className={styles.cardSingleContainer}>
                        <div className={styles.cardSingleContainerLeft}>
                            <p className={styles.cardContainerLabel}>
                                Email Address
                            </p>
                            <p className={styles.cardContainerValue}>
                                {/* Was showing the raw email in plain text — now
                                    masked with the same maskEmail() convention
                                    already used elsewhere in the app (OTP modals,
                                    Restore Access), e.g. "ram****an@gmail.com",
                                    instead of exposing the full address on a
                                    screen anyone glancing over could read. */}
                                {isEmpty(email) ? email : maskEmail(email)}
                            </p>
                        </div>
                        <div className={styles.cardSingleContainerRight}>
                            <Button
                                isLoading={false}
                                loadingText="Redirecting..."
                                btnText="Change"
                                onClick={emailModelToggle}
                                className="cardBtn"
                                selectedValue={null}
                            />
                        </div>
                    </div>


                    <div className={styles.cardSingleContainer}>
                        <div className={styles.cardSingleContainerLeft}>
                            <p className={styles.cardContainerLabel}>
                                Login password
                            </p>
                            <p className={styles.cardContainerValue}>
                                *************
                            </p>
                        </div>
                        <div className={styles.cardSingleContainerRight}>
                            <Button
                                isLoading={false}
                                loadingText="Redirecting..."
                                btnText="Change"
                                onClick={passwordModelToggle}
                                className="cardBtn"
                                selectedValue={null}
                            />
                        </div>
                    </div>
                    <div className={styles.cardSingleContainer}>
                        <div className={styles.cardSingleContainerLeft}>
                            <p className={styles.cardContainerLabel}>
                                Referral Code
                            </p>
                            <p className={styles.cardContainerValue}>
                                {referralCode}
                            </p>
                        </div>
                        <div className={styles.cardSingleContainerRight}>
                            <Button
                                isLoading={false}
                                loadingText="Redirecting..."
                                btnText="Copy"
                                onClick={() => handleCopy(userdetails?.referralCode)}
                                className="cardBtn"
                                selectedValue={null}
                            />
                        </div>
                    </div>
                    <div className={styles.cardSingleContainer}>
                        <div className={styles.cardSingleContainerLeft}>
                            <p className={styles.cardContainerLabel}>
                                Registered mobile number
                            </p>
                            <p className={styles.cardContainerValue}>
                                {/* Was showing the full mobile number in plain
                                    text — now masked with the same
                                    "*******" + last-3-digits convention
                                    already used for mobile in
                                    pages/Auth/modal/RestoreModel.jsx (country
                                    code stays visible, same as before). */}
                                {isEmpty(mobileNumber) || mobileNumber == 0 ? "xx xxxxx-xxxxx" : `+${countryCode} ${maskMobile(mobileNumber)}`}
                            </p>
                        </div>
                        <div className={styles.cardSingleContainerRight}>
                            <Button
                                isLoading={false}
                                loadingText="Redirecting..."
                                btnText={isEmpty(mobileNumber) || mobileNumber == 0 ? "Add" : "Change"}
                                onClick={() => {
                                    isEmpty(mobileNumber) || mobileNumber == 0 ?
                                        phoneModelToggle() :
                                        navigate("/number-management")
                                }}
                                className={isEmpty(mobileNumber) || mobileNumber == 0 ? "cardSuccessBtn" : "cardBtn"}
                                selectedValue={null}
                            />
                        </div>
                    </div>

                </div>
            </div>
            {config.ENV != 'live' ? '' :
                <div className='mt-4'>
                    <BankDetails
                        bankDetails={userdetails?.bankAccounts}
                        pathName={location.pathname}
                        selectedBankData={(data) => {
                        }}
                    />
                </div>
            }
            <div>
                {/* models components */}
                <ChangeDisplayName
                    changeName={changeName}
                    show={changeDisplayNameModel || changeDisplayfirstlastModel}
                    handleClose={() => changeName == "userName" ? displayNameModelToggle() : displayfirlasNameModelToggle()}
                    userdata={{ firstName: firstName, lastName: lastName, userName: userName }}
                    secretKey={userdetails?.secretKey}
                />
                <ChangePassword
                    show={changePasswordModel}
                    userdetails={userdetails}
                    handleClose={() => passwordModelToggle()}
                />
                <AddPhoneNumber
                    show={changePhoneModel}
                    type={"number"}
                    handleClose={() => phoneModelToggle()}
                // handleNumberVerified={handleNumberVerified}
                />
                {/* <ChangeEmailNumber
                    type={"number"}
                    show={changePhoneModel}
                    handleClose={() => phoneModelToggle()}
                /> */}
                <ChangeEmail
                    show={changeEmailModel}
                    handleClose={() => emailModelToggle()}
                    secretKey={userdetails.secretKey}
                />
            </div>
        </div>
    )
}

export default MyProfile