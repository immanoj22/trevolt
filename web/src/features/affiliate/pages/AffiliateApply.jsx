import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import styles from "../styles/affiliateApply.module.css";
import Images from "../../../utils/Images";
import {
  InputComponent,
  InputTextareaComponent,
} from "../../../components/Input/InputFields";
import Select from "react-select";
import Button from "../../../components/Button/Button";
import { useNavigate } from "react-router-dom";
import { showToastMessage } from "../../../lib/toast";

/** Validation */
import { validateAffiliateForm } from "../../../pages/Validation/affliateValidation";

/** Actions */
import { affiliateRegister } from "../../../actions/affliateAction";
import AllCountriesList from "../../../json/countryList";

const options = [
  { label: "option1", value: "option1" },
  { label: "option2", value: "option2" },
  { label: "option3", value: "option3" },
];

const initialState = {
  placeOfResidence: "",
  fullName: "",
  contactInformation: "",
  referralCode: "",
  channelDetails: "",
  promotionIdeas: "",
  followersCount: "",
  tradingExperience: "",

  youtube: "",
  telegram: "",
  discord: "",
  instagram: "",
  twitch: "",
  facebook: "",
  x: "",
};

export default function AffiliateApply() {
  const { userdetails, affliateDetails } = useSelector((state) => state.user);
  const dispatch = useDispatch();

  const navigate = useNavigate();
  const navigateHandle = (url) => {
    navigate(url);
  };
  const onSubmitHandle = (getItem) => {
  };
  const [error, setError] = useState({});
  const [formValue, setFormValue] = useState(initialState);

  const onChangeHandler = (event) => {
    try {
      const { name, value } = event.target;
      //   console.log("onChangeHandler : ", { name, value });

      const numbers = /^[0-9]+$/;
      const textNum = /^[A-Za-z0-9]{0,8}$/;
      // validate numeric fields
      if (
        ["tradingExperience", "followersCount", "contactInformation"].includes(
          name,
        ) &&
        value !== "" &&
        !numbers.test(value)
      ) {
        return false;
      }
      // if (['referralCode'].includes(name) && (value !== "" && !textNum.test(value))) {
      //     return false;
      // }

      setFormValue((prev) => ({
        ...prev,
        [name]: name === "referralCode" ? value.toUpperCase() : value,
      }));
      setError((prev) => ({ ...prev, [name]: "" }));
    } catch (e) {
    }
  };


  const applyBecomeAnAffliate = async () => {
    try {
      // Hide the validation for doesnt need to check all socialmedia link.
      
      const isValid = await validateAffiliateForm(formValue);
      if (isValid.status) {
        showToastMessage("Please fill in all required fields correctly.","error");
        setError(isValid.errors)
        return
      }

      const { status, message, errors } = await affiliateRegister(
        formValue,
        userdetails?.secretKey,
        dispatch,
      );
      showToastMessage(message, status ? "success" : "error");
      setError(errors);
      if (status) {
        navigate("/affiliate");
      }
    } catch (e) {
      console.log("applyBecomeAnInstitutional_err", e);
    }
  };

  return (
    <div className={styles.affiliateApplyPage}>
      <div className="container custom-container">
        <div className={styles.affiliateApply}>
          <div className={styles.headerPart}>
            <div className="d-flex align-items-center justify-content-between">
              <h2>Become a Green X Affiliate</h2>
              <Button
                className="backBtn"
                btnText={"Back"}
                onClick={() => navigateHandle("/affiliate")}
              />
            </div>
            <p className="mt-2">
              Turn your influence into income with a rewarding affiliate
              network.
            </p>
          </div>
          <div className={styles.formContainer}>
            <div className="row">
              <div className="col-lg-6 mb-4">
                <div className={styles.socialMediaLinksPart}>
                  <h3 className={styles.inputHeading}>Your Social Channels</h3>
                  <div className={styles.inputWrapper + " mt-3"}>
                    <div className={styles.linkIcons}>
                      <img src={Images.affiliateYoutubeIcon} alt="Youtube" />
                    </div>
                    <InputComponent
                      staticClass=""
                      staticClassInput=""
                      placeholder={"Youtube channel link"}
                      value={formValue?.youtube}
                      name={"youtube"}
                      onChange={(e) => onChangeHandler(e)}
                      error={error?.youtube}
                    />
                  </div>
                  <div className={styles.inputWrapper + " mt-3"}>
                    <div className={styles.linkIcons}>
                      <img src={Images.affiliateTwitterIcon} alt="Twitter" />
                    </div>
                    <InputComponent
                      staticClass=""
                      staticClassInput=""
                      placeholder={"X Profile link"}
                      value={formValue?.x}
                      name={"x"}
                      onChange={(e) => onChangeHandler(e)}
                      error={error?.x}
                    />
                  </div>
                  <div className={styles.inputWrapper + " mt-3"}>
                    <div className={styles.linkIcons}>
                      <img src={Images.affiliateTelegramIcon} alt="Telegram" />
                    </div>
                    <InputComponent
                      staticClass=""
                      staticClassInput=""
                      placeholder={"Telegram group link"}
                      value={formValue?.telegram}
                      name={"telegram"}
                      onChange={(e) => onChangeHandler(e)}
                      error={error?.telegram}
                    />
                  </div>
                  <div className={styles.inputWrapper + " mt-3"}>
                    <div className={styles.linkIcons}>
                      <img src={Images.affiliateDiscordIcon} alt="Discord" />
                    </div>
                    <InputComponent
                      staticClass=""
                      staticClassInput=""
                      placeholder={"Discord group link"}
                      value={formValue?.discord}
                      name={"discord"}
                      onChange={(e) => onChangeHandler(e)}
                      error={error?.discord}
                    />
                  </div>
                  <div className={styles.inputWrapper + " mt-3"}>
                    <div className={styles.linkIcons}>
                      <img src={Images.affiliateInstaIcon} alt="instagram" />
                    </div>
                    <InputComponent
                      staticClass=""
                      staticClassInput=""
                      placeholder={"Instagram profile link"}
                      value={formValue?.instagram}
                      name={"instagram"}
                      onChange={(e) => onChangeHandler(e)}
                      error={error?.instagram}
                    />
                  </div>
                  <div className={styles.inputWrapper + " mt-3"}>
                    <div className={styles.linkIcons}>
                      <img src={Images.affiliateTwitchIcon} alt="Twitch" />
                    </div>
                    <InputComponent
                      staticClass=""
                      staticClassInput=""
                      placeholder={"Twitch profile link"}
                      value={formValue?.twitch}
                      name={"twitch"}
                      onChange={(e) => onChangeHandler(e)}
                      error={error?.twitch}
                    />
                  </div>
                  <div className={styles.inputWrapper + " mt-3"}>
                    <div className={styles.linkIcons}>
                      <img src={Images.affiliateFacebookIcon} alt="Facebook" />
                    </div>
                    <InputComponent
                      staticClass=""
                      staticClassInput=""
                      placeholder={"Facebook profile link"}
                      value={formValue?.facebook}
                      name={"facebook"}
                      onChange={(e) => onChangeHandler(e)}
                      error={error?.facebook}
                    />
                  </div>
                </div>
                {/* <div className='mt-4'>
                                    <label className={`${styles.inputHeading}`} htmlFor="">
                                        Place of Residence
                                    </label>
                                    <div className={`react-select__width mt-2`}>
                                        <Select
                                            placeholder="Select Countries"
                                            classNamePrefix="react-select__eighth"
                                            options={AllCountriesList.map(item => ({ value: item.code, label: item.name }))}
                                            onChange={(e) => {
                                                setFormValue({ ...formValue, ...{ placeOfResidence: e.label } })
                                                setError({ ...error, ...{ placeOfResidence: "" } })
                                            }}
                                            menuPosition='fixed'
                                            menuPlacement='auto'
                                        />
                                        <p className={`text-danger mt-2`}>
                                            {error?.placeOfResidence}
                                        </p>
                                    </div>
                                </div> */}
              </div>
              <div className="col-lg-6">
                <div className="">
                  <h3 className={`${styles.inputHeading}`} htmlFor="">
                    Your contact information
                  </h3>
                  {/* <div className='mt-3'> */}
                  <InputComponent
                    staticClass="mt-3"
                    staticClassInput=""
                    placeholder={"Your Name"}
                    value={formValue?.fullName}
                    name={"fullName"}
                    onChange={(e) => {
                      onChangeHandler(e);
                    }}
                    error={error?.fullName}
                  />
                  {/* </div> */}
                  <InputComponent
                    staticClass="mt-3"
                    staticClassInput=""
                    placeholder={"Contact information"}
                    value={formValue?.contactInformation}
                    name={"contactInformation"}
                    onChange={(e) => {
                      onChangeHandler(e);
                    }}
                    error={error?.contactInformation}
                  />
                </div>
                <div className="mt-3">
                  <InputComponent
                    label="Referral Code"
                    staticClass=""
                    placeholder={"Enter referral code"}
                    value={formValue?.referralCode}
                    name={"referralCode"}
                    onChange={(e) => onChangeHandler(e)}
                    error={error?.referralCode}
                  />
                </div>
                <div className="mt-4">
                  <label className={`${styles.inputHeading}`} htmlFor="">
                    Other Information
                  </label>
                  <div className="mt-0">
                    <InputTextareaComponent
                      label={"Channel Details"}
                      placeholder={"Enter channel details"}
                      value={formValue?.channelDetails}
                      name={"channelDetails"}
                      onChange={(e) => onChangeHandler(e)}
                      error={error?.channelDetails}
                      rows={3}
                    />
                  </div>
                  <div>
                    <InputTextareaComponent
                      label={"Promotion Ideas"}
                      value={formValue?.promotionIdeas}
                      placeholder={"Enter promotion ideas"}
                      name={"promotionIdeas"}
                      onChange={(e) => onChangeHandler(e)}
                      error={error?.promotionIdeas}
                      rows={3}
                    />
                  </div>
                  <div className="">
                    <InputComponent
                      type="number"
                      label={"Followers Count"}
                      placeholder={"Enter followers count"}
                      value={formValue?.followersCount}
                      name={"followersCount"}
                      onChange={(e) => onChangeHandler(e)}
                      error={error?.followersCount}
                    />
                  </div>
                  <div className="">
                    <InputComponent
                      type="number"
                      label={"Trading Experience(in years)"}
                      placeholder={"Enter trading experience"}
                      value={formValue?.tradingExperience}
                      name={"tradingExperience"}
                      onChange={(e) => onChangeHandler(e)}
                      error={error?.tradingExperience}
                    />
                  </div>
                  {/* <div className='my-4 d-flex align-items-center gap-2'>
                            <div className="custom-checkInput__container">
                                <label className="custom-checkInput__label">
                                    <input
                                        type="checkbox"
                                        id='agreeId'
                                    />
                                    <span className="custom-checkInput__checkmark"></span>
                                </label>
                            </div>
                            <label className={`${styles.labelText}`} htmlFor="agreeId">
                                I have read & agree to the Trevolt agreement
                            </label>
                        </div> */}
                </div>
              </div>
              <div className="affiliate_applyBtn d-flex align-items-center justify-content-end mt-4">
                <Button
                  btnText={"Apply"}
                  className="successFillRectangleBtn"
                  isLoading={false}
                  loadingText="Redirecting..."
                  onClick={applyBecomeAnAffliate}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
