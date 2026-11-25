/** package import */

import React, { useEffect, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";

/** local import */

// import styles from './styles/myProfile.module.css'
import styles from "../styles/affiliateProfile.module.css";
import Images from "../../../utils/Images";
import { useGlobalContext } from "../../../context/GlobalProvider";

// import { confirmEmailChangeHooks, logoutHooks, sendEmailVerificationLinkHooks, updateUserSettingsHooks } from '../../actions/userAction'
import { showToastMessage } from "../../../lib/toast";
import isEmpty from "is-empty";
import { useSelector } from "react-redux";
// import { imageValidation } from '../../pages/Validation/userValidation'
import config from "../../../config/env";
import BankDetails from "../../dashboard/components/BankDetails";
import Button from "../../../components/Button/Button";
import AffiliateChangeDisplayName from "../modal/AffiliateChangeDisplayName";
import AffiliateChangePassword from "../modal/AffiliateChangePassword";
import AffiliateChangeEmailNumber from "../modal/AffiliateChangeEmailNumber";
import AffiliateChangeEmail from "../modal/AffiliateChangeEmail";
// import { RemoveItemLocalStorageItem } from '../../lib/storage'

/** code start */

const AffiliateMyProfile = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { userId } = useParams();
  const { theme } = useGlobalContext();
  const [changeDisplayNameModel, setChangeDisplayNameModel] = useState(false);
  const [changePasswordModel, setChangePasswordModel] = useState(false);
  const [changePhoneModel, setChangePhoneModel] = useState(false);
  const [changeEmailModel, setChangeEmailModel] = useState(false);
  // const
  const [file, setFile] = useState({});
  const [error, setError] = useState("");
  const { userdetails } = useSelector((state) => state.user);
  const [btndis, setBtnDis] = useState(false);

  const {
    firstName,
    lastName,
    email,
    referralCode,
    countryCode,
    mobileNumber,
    profileImage,
  } = userdetails;
  const handleBack = () => {
    navigate(-1);
  };

  const displayNameModelToggle = () => {
    setChangeDisplayNameModel(!changeDisplayNameModel);
  };

  const passwordModelToggle = () => {
    setChangePasswordModel(!changePasswordModel);
  };

  const phoneModelToggle = () => {
    setChangePhoneModel(!changePhoneModel);
  };

  const emailModelToggle = () => {
    setChangeEmailModel(!changeEmailModel);
  };

  // useEffect(() => {
  //     let pathname = location.pathname;
  //     if (pathname == '/verify-old-email/' + userId) {
  //         verifyOldEmail();
  //     } else if (pathname == '/verify-new-email/' + userId) {
  //         verifyNewEmail();
  //     }
  //     window.scrollTo({
  //         top: 0,
  //         behavior: "smooth",
  //     });
  // }, []);

  // const verifyOldEmail = async () => {
  //     try {
  //         let pathname = location.pathname;
  //         let userId = pathname.split('/')[2];
  //         if (!isEmpty(userId)) {
  //             console.log("verifyNewEmail_userId", userId);
  //             const resp = await sendEmailVerificationLinkHooks({ token: userId });
  //             let verficationMain = resp?.data;
  //             console.log("verficationMain", verficationMain)
  //             if (verficationMain.success) {
  //                 showToastMessage(verficationMain.message, 'success');
  //             } else {
  //                 showToastMessage(verficationMain.message, 'error')
  //             }
  //         }

  //     } catch (e) {
  //         console.log("verifyNewEmail_err", e);
  //     }
  // }

  // const verifyNewEmail = async () => {
  //     try {
  //         if (!isEmpty(userId)) {
  //             console.log("verifyNewEmail_userId", userId);
  //             const resp = await confirmEmailChangeHooks({ token: userId });
  //             let verficationMain = resp?.data;
  //             if (verficationMain.success) {
  //                 showToastMessage(verficationMain.message, 'success');
  //                 navigate("/");
  //                 RemoveItemLocalStorageItem("accessToken");
  //                 logoutHooks()
  //             } else {
  //                 showToastMessage(verficationMain.message, 'error')
  //             }
  //         }
  //     } catch (e) {
  //         console.log("verifyNewEmail_err", e);
  //     }
  // }

  const profileUpdate = async (e) => {
    // try {
    //     const { id } = e?.target;
    //     if (id == "profileInput") {
    //         const { status, errors } = await imageValidation(e?.target?.files[0]);
    //         if (status) {
    //             setError(errors)
    //         } else {
    // SECURITY FIX: removed console.log of sensitive client-side data (secretKey/password/OTP)
    //             const formData = new FormData();
    //             formData.append("attachment", e.target?.files[0]);
    //             formData.append("type", "profile");
    //             setBtnDis(true)
    //             const resp = await updateUserSettingsHooks(formData, userdetails?.secretKey);
    //             console.log("resp_myprofile", resp);
    //             if (resp?.data?.success) {
    //                 setBtnDis(false)
    //                 setFile(e?.target?.files[0]);
    //                 showToastMessage(resp?.data?.message, "success");
    //                 setError("")
    //             } else if (!resp?.data?.success) {
    //                 setBtnDis(false)
    //                 if (resp?.data?.message) {
    //                     setError(resp?.data?.error)
    //                     showToastMessage(resp?.data?.message, "error")
    //                 }
    //             }
    //         }
    //     }
    // } catch (e) {
    // }
  };

  const handleCopy = (secret) => {
    showToastMessage("The referral code has been copied!", "success");
    navigator.clipboard.writeText(secret);
  };

  return (
    <div>
      <div className={styles.cardHeader}>
        <h5 className={styles.pageTitle}>Profile Settings</h5>
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
            <img
              src={
                profileImage
                  ? profileImage
                  : !isEmpty(file)
                    ? URL.createObjectURL(file)
                    : theme == "dark"
                      ? Images.darkDefaultProfile
                      : Images.lightDefaultProfile
              }
              alt="profile"
            />
            <div className={styles.profileFileInput}>
              <input
                type="file"
                id="profileInput"
                onChange={(e) => profileUpdate(e)}
              />
            </div>
          </div>
          {error && <p className={`text-danger mt-2`}>{error}</p>}
          <label htmlFor="profileInput" className={styles.profileInputLabel}>
            Change
          </label>
        </div>
        <div className={styles.cardBodyContent}>
          <div className={styles.cardSingleContainer}>
            <div className={styles.cardSingleContainerLeft}>
              <p className={styles.cardContainerLabel}>Display Name</p>
              <p className={styles.cardContainerValue}>BGUSER-E79TX5FK</p>
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
              <p className={styles.cardContainerLabel}>User ID</p>
              <p className={styles.cardContainerValue}>
                {userdetails?.userGreenId}
              </p>
            </div>
            <div className={styles.cardSingleContainerRight}>
              <Button
                isLoading={false}
                loadingText="Redirecting..."
                btnText="Copy"
                onClick={handleCopy}
                className="cardBtn"
                selectedValue={null}
              />
            </div>
          </div>
          <div className={styles.cardSingleContainer}>
            <div className={styles.cardSingleContainerLeft}>
              <p className={styles.cardContainerLabel}>Email Address</p>
              <p className={styles.cardContainerValue}>support@trevolt.example</p>
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
                Registered mobile number
              </p>
              <p className={styles.cardContainerValue}>9874563210</p>
            </div>
            <div className={styles.cardSingleContainerRight}>
              <Button
                isLoading={false}
                loadingText="Redirecting..."
                btnText="Change"
                onClick={phoneModelToggle}
                className="cardBtn"
                selectedValue={null}
              />
            </div>
          </div>
        </div>
      </div>
      <div>
        {/* models components */}
        <AffiliateChangeDisplayName
          show={changeDisplayNameModel}
          handleClose={() => displayNameModelToggle()}
          userdata={{ firstName: firstName, lastName: lastName }}
          secretKey={userdetails?.secretKey}
        />
        <AffiliateChangePassword
          show={changePasswordModel}
          userdetails={userdetails}
          handleClose={() => passwordModelToggle()}
        />
        <AffiliateChangeEmailNumber
          show={changePhoneModel}
          handleClose={() => phoneModelToggle()}
        />
        <AffiliateChangeEmail
          show={changeEmailModel}
          handleClose={() => emailModelToggle()}
          secretKey={userdetails.secretKey}
        />
      </div>
    </div>
  );
};

export default AffiliateMyProfile;