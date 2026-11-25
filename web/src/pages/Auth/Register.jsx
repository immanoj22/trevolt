/** PACKAGE IMPORT */

import React, { useState, useEffect, useRef } from "react";
import { jwtDecode } from 'jwt-decode'
import {
  useLocation,
  Link,
  useNavigate,
  useParams,
} from "react-router-dom";
import { FaApple } from "react-icons/fa";

/** Components */
import Button from "../../components/Button/Button";
import { DatePickerComponent } from "../../components/UiComponents/DatePickerComponent";
import { InputComponent, InputWithCopy, PasswordInput } from "../../components/Input/InputFields";
import { OtpVerification } from "./modal/OtpVerification";

/** LOCAL FILES IMPORT */
import styles from "./auth.module.css";
import { useGlobalContext } from '../../context/GlobalProvider';
/** ACTIONS */
import { manageClicks } from "../../actions/affliateAction";
import { registrationHooks, signInWithApple, signupWithGoogle } from "../../actions/userAction";

/** Validation */
import { validateUserRegister } from "../Validation/userValidation";

/** CONFIG */
import config from "../../config/env";
/** Library */
import { showToastMessage } from "../../lib/toast";
import Images from '../../utils/Images';
import { signInWithGoogle } from "../../hooks/firebase";
import { FcGoogle } from "react-icons/fc";
import { createSocketUser } from "../../config/socketConnectivity";
import { LuMailWarning } from "react-icons/lu";

import AppleLogin from 'react-apple-login';
import isEmpty from "is-empty";
import RecaptchaV2 from "../../components/Recaptcha/RecaptchaV2";

/** CODE START */

const Register = (props) => {
  const location = useLocation();
  const { code } = useParams();
  const navigate = useNavigate();
  const { theme, handleLogin } = useGlobalContext();

  let numbers = /^[+]?([0-9]+(?:[\.][0-9]*)?|\.[0-9]+)$/;
  const htmlTagPattern = /<[^>]*>/;
  const [currentLocation, setCurrentLocation] = useState(location.pathname);
  const [error, setError] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [verifyMobile, setVerifyMobile] = useState(false);
  const [otp, setOtp] = useState(0);
  const [isVerified, setIsVerified] = useState(false);
  const [sendotp, setSendotp] = useState(false);
  const [loginType, setLoginType] = useState("email");
  const [challengeId, setChallengeId] = useState("email");

  // venkatesh

  let alpharegex = /^[A-Za-z]+$/;

  const initialValue = {
    "firstName": '',
    "lastName": '',
    "email": '',
    "dob": '',
    "mobileNumber": '',
    "countryCode": '',
    "referenceCode": '',
    "password": '',
    "confirmPassword": '',
    "isCodeDisable": false,
    "checked": false
  }

  const [formValue, setFormValue] = useState(initialValue);
  const [errors, setErrors] = useState({});
  const [toched, setToched] = useState("");
  const [btndis, setBtnDis] = useState(false);

  // SECURITY FIX (VAPT: "Credential Stuffing Protection", Point 16):
  // reCAPTCHA v2 checkbox — token lives in state, set by the widget's
  // onChange callback (see components/Recaptcha/RecaptchaV2.jsx).
  const [captchaToken, setCaptchaToken] = useState('');
  const [captchaError, setCaptchaError] = useState('');
  const captchaRef = useRef(null);





  // venkatesh

  const handleChange = (e) => {
    try {
      const { id, value } = e?.target;
      setFormValue({ ...formValue, ...{ [id]: value } })
      setErrors({ ...errors, ...{ [id]: "" } })
    } catch (e) {
      console.log("handleChange__Err", e);
    }
  }

  const handlePhoneNumber = (value, country) => {
    const { dialCode } = country;
    let newPhoneNo = value;
    let formData = formValue;
    if (dialCode) {
      formData = { ...formValue, ...{ countryCode: dialCode, mobileNumber: newPhoneNo.slice(dialCode.length) } }
    } else if (value) {
      formData = { ...formValue, ...{ mobileNumber: value } }
    }
    setFormValue(formData)

  }

  const handleBlurPhone = (e) => {
    setToched({ ...toched, ...{ 'phoneNo': true, 'phoneCode': true } })
  }

  const Signup = async () => {
    try {
      // e.preventDefault()
      const { status, errors } = await validateUserRegister(formValue);
      if (status) {
        setErrors(errors);
      } else {
        // SECURITY FIX (VAPT: "Credential Stuffing Protection", Point 16):
        // reCAPTCHA v2 — token comes from the checkbox widget's state.
        // TEMP: disabled 2026-09-02 for API-doc/feature testing — flip
        // TEMP_DISABLE_RECAPTCHA back to false to re-enable this check.
        const TEMP_DISABLE_RECAPTCHA = false;
        if (!TEMP_DISABLE_RECAPTCHA && !captchaToken) {
          setCaptchaError('Please verify that you are not a robot.');
          return;
        }
        setCaptchaError('');
        setBtnDis(true);
        const resp = await registrationHooks({ ...formValue, platform: "web", captchaToken });
        if (resp?.data?.success) {
          setErrors({});
          showToastMessage(resp?.data?.message, 'success');
          navigate("/login");
          setBtnDis(false);
        } else if (!resp?.data?.success) {
          setErrors(resp.data.errors);
          setBtnDis(false);
          // reCAPTCHA v2 tokens are single-use — reset the widget so the
          // user has to re-check the box before their next attempt.
          captchaRef.current?.reset();
          setCaptchaToken('');
          if (resp?.data?.message) {
            showToastMessage(resp?.data?.message, 'error')
          }
        }
      }
    } catch (e) {
      console.log("Signup__Err", e);
    }
  }

  const continueWithGoogle = async () => {
    try {
      const { status, data, token } = await signInWithGoogle();
      if (status) {
        const payload = {
          idToken: token?.oauthIdToken,
          firstName: token?.firstName,
          lastName: token?.lastName,
          referenceCode: formValue?.referenceCode,
          filter: 'web',
          platform: "web"
        }
        const { success, status, message, result } = await signupWithGoogle(payload);
        if (success) {
          if (result?.isLogged) {
            // SECURITY FIX (VAPT: "Token Storage Security" — Points 44/49/70):
            // no Authorization header/localStorage write for the token — the
            // backend already set it as an httpOnly cookie. Decode is
            // in-memory/transient, used only for the socket userId.
            const decoded = jwtDecode(result?.token);
            createSocketUser(decoded?.userId);
            await handleLogin();
            showToastMessage(message, 'success');
          } else {
            setTimeout(() => {
              setSendotp(true);
              setErrors({});
              showToastMessage(message, 'success');
              setLoginType(status);
            }, 100)
            setFormValue({ ...formValue, email: data.email, mobileNumber: result?.mobileNumber })
            setChallengeId(result?.challengeId)
          }
        }
        else if (!success) {
          showToastMessage(message, 'error');
          navigate('/login')
        }
      }
    } catch (e) {
      console.log("continueWithGoogle_err", e);
    }
  }
  const continueWithApple = () => {
    try {
      const appleAuthUrl = `https://appleid.apple.com/auth/authorize?` +
        new URLSearchParams({
          response_type: "code",
          client_id: config.APPLECONFIG.APPLE_CLIENT_ID,
          redirect_uri: `${config.FRONT_URL}/login`,
          scope: "email name",
          response_mode: "query",
        });
      window.location.href = appleAuthUrl
    } catch (e) {
      console.log("continueWithApple_err", e);
    }
  }

  useEffect(() => {
    if (code != undefined && code != "" && code != null) {
      manageClicks(code)
      if (location?.pathname?.split("/").includes("affiliate")) {
        setFormValue({ ...formValue, ...{ isCodeDisable: true, "referenceCode": code } })
      } else {
        setFormValue({ ...formValue, ...{ referenceCode: code } });
      }
    }
  }, [code])

  const onPaste = () => {
    navigator.clipboard.readText().then(text => {
      setFormValue({ ...formValue, ...{ referenceCode: text } });
    });
  }


  const signInApple = async (appleCode, email) => {
    try {
      const { success, message, result, status } = await signInWithApple({
        code: appleCode,
        filter: "web",
        platform: "web"
      });
      if (success) {
        if (result?.isLogged) {
          // SECURITY FIX (VAPT: "Token Storage Security" — Points 44/49/70):
          // no Authorization header/localStorage write for the token itself.
          const decoded = jwtDecode(result?.token);
          createSocketUser(decoded?.userId);
          await handleLogin();
          showToastMessage(message, 'success');
        } else {
          setTimeout(() => {
            setSendotp(true);
            setErrors({});
            showToastMessage(message, 'success');
            setLoginType(status);
            // setBtnDis(false);
          }, 100)
          setFormValue({
            ...formValue,
            email: isEmpty(email) ? result?.email : email,
            mobileNumber: result?.mobileNumber
          })
          setChallengeId(result?.challengeId)
        }
      } else {
        showToastMessage(message, 'error');
      }
    } catch (e) {
      console.log("signInApple_err", e);
    }
  };

  const handleAppleLoginSuccess = (response) => {
    try {
      // The 'response' object will contain the authorization code, identity token, etc.
      const { authorization, user, state } = response;
 // This is the authorization code
      let email = user?.email;

      // Fallback: decode id_token if user object wasn't sent (2nd+ login)
      if (!email && authorization?.id_token) {
        const decoded = jwtDecode(authorization.id_token);
        email = decoded?.email;
      }
      signInApple(authorization.code, email)
    } catch (err) {
      console.log(err, "handleAppleLoginSuccess__err")
    }
    // Send this code to your backend for verification
    // ...
  };

  const handleAppleLoginFailure = (error) => {
  };


  const { firstName, lastName, dob, email, countryCode, mobileNumber, referenceCode, password, confirmPassword } = formValue;
  return (
    <>
      <div className={styles.authContainer}>
        <div className="row w-100 d-flex align-items-center justify-content-center">
          <div className="col-12 col-sm-10 col-md-8 col-lg-10 col-xl-9 col-xxl-8">
            <div className={`${styles.authFormContainer} ${styles.authFormMd} mt-3 w-100`}>
              <div className="row">
                <div className="d-none d-lg-flex col-lg-6 col-xl-6 d-flex align-items-center justify-content-center">
                  <div className={`${styles.imageSrc} p-4 p-lg-5`}>
                    <img src={theme == 'dark' ? Images.registerDark : Images.registerLight} className={"img-fluid"} alt="Trevolt" />

                  </div>
                </div>
                <div className="col-12 col-lg-6 col-xl-6">
                  <p className={`${styles.pageName} mt-0`}>
                    Register
                  </p>
                  <div className={styles.emailNotesPart}>
                    <LuMailWarning size={50} />
                    <p className="fs13">
                      Please verify your email to activate your account. Check your inbox or spam folder for the activation link.
                    </p>
                  </div>
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                    }}
                    className="mt-0">
                    <div className="row mt-3">
                      <div className="col-12 col-md-6 mb-2">
                        <InputComponent label={"First Name"} placeholder={"Enter your first name"} id="firstName" value={firstName} onChange={(e) => { if (alpharegex.test(e?.target?.value) || e?.target?.value == "") { handleChange(e) } }} error={errors?.firstName} />
                      </div>
                      <div className="col-12 col-md-6 mb-2">
                        <InputComponent label={"Last Name"} placeholder={"Enter your last name"} id="lastName" value={lastName} onChange={(e) => { if (alpharegex.test(e?.target?.value) || e?.target?.value == "") { handleChange(e) } }} error={errors?.lastName} />
                      </div>
                      <div className="col-12 col-md-6 mb-2">
                        <div className={`${styles.singleFormContainer} mt-2`}>
                          <label className={styles.formLabel}>DOB</label>
                          <div className="mt-2">
                            <DatePickerComponent
                              maxDate={new Date()}
                              placeholder="DD/MM/YYYY"
                              className="datePickerComponent registerDatePicker"
                              selectData={(e, errorMessage) => {
                                if (errorMessage == "" && typeof e == "object") {
                                  setFormValue({ ...formValue, ... { ['dob']: new Date(e).getTime() } })
                                  setError({ ...error, ...{ dob: "" } });
                                } else {
                                  setError({
                                    ...error,
                                    ...{ dob: errorMessage },
                                  });
                                }
                              }}
                            />
                          </div>
                          {errors?.dob && <p className={`text-danger mt-2`}>{errors?.dob}</p>}
                        </div>
                      </div>
                      <div className="col-12 col-md-6 mb-2">
                        <InputComponent label={"Email Address"} type="email" placeholder={"Enter your Email Address"} id="email" value={email} onChange={(e) => handleChange(e)} error={errors?.email} />
                      </div>

                      <div className="col-12 col-md-6 mb-2">
                        <PasswordInput label={"Password"} placeholder={"Enter Your Password"} id="password" value={password} onChange={(e) => handleChange(e)} error={errors?.password} showInfo />
                      </div>
                      <div className="col-12 col-md-6 mb-2">
                        <PasswordInput label={"Confirm Password"} placeholder={"Confirm your password"} id="confirmPassword" value={confirmPassword} onChange={(e) => handleChange(e)} error={errors?.confirmPassword} showInfo />
                      </div>

                      {/* <div className="col-12 col-md-6 mt-2 phone_sec">
                        <div className={`${styles.singleFormContainer}`}>
                          <label className={styles.formLabel}>Contact Number</label>
                          <div className={`${styles.flexAdjust} mt-2`}>
                            <div className={`${styles.phoneInputContainer} phoneInputContainer2`}>
                              <PhoneInput
                                countryCodeEditable={false}
                                placeholder="Enter phone number"
                                country={"in"}
                                onChange={handlePhoneNumber}
                                onBlur={handleBlurPhone}
                                // onChange={(value, event) => {
                                //   const { dialCode } = event;
                                //   let newPhoneNo = value;
                                //   console.log(
                                //     "PHONE INPUTS",
                                //     value,
                                //     event
                                //   );
                                //   checkMobile(
                                //     newPhoneNo.slice(dialCode.length)
                                //   );
                                //   setMobileNumber(
                                //     newPhoneNo.slice(dialCode.length)
                                //   );
                                //   setCountryCode(dialCode);
                                // }}
                                autoFormat={true}
                              />
                            </div>
                          </div>

                          {errors?.mobileNumber && <p className={`text-danger mt-2`}>
                            {errors?.mobileNumber}
                          </p>}
                        </div>
                      </div> */}


                      <div className="col-12 col-xl-12 mb-2">
                        <InputWithCopy label={"Referral Code (Optional)"} disabled={formValue.isCodeDisable} onPaste={onPaste}
                          placeholder="Enter or paste your referral code" id="referenceCode"
                          value={referenceCode} onChange={(e) => handleChange(e)} error={errors?.referenceCode} />
                      </div>
                      <div className="col-12 col-xl-12 mb-2">
                        <div className="d-flex gap-2 align-items-center">
                          <div className="custom-checkInput__container mt-0">
                            <label htmlFor="disclaimerId" className="custom-checkInput__label">
                              <input
                                type="checkbox"
                                id="disclaimerId"
                                checked={formValue?.checked}
                                onChange={(e) => {
                                  setErrors({ ...errors, ...{ checked: "" } })
                                  setFormValue({ ...formValue, ...{ checked: e.target.checked } })
                                }}
                              />
                              <span className="custom-checkInput__checkmark"></span>
                            </label>
                          </div>
                          <div>
                            <label className="fs13" htmlFor="disclaimerId">
                              I accept the
                              <Link className={`mx-1 ${styles.greenText}`} to={"/terms-and-conditions"}>Terms & Conditions</Link></label>
                          </div>

                        </div>
                        <p className={`text-danger mt-2`}>{errors?.checked}</p>
                      </div>
                      {/* SECURITY FIX (VAPT: "Credential Stuffing Protection",
                          Point 16): visible reCAPTCHA v2 checkbox, replacing
                          the earlier invisible v3 widget. Has no effect on
                          native mobile apps sharing this backend — see
                          RecaptchaV2.jsx and Middleware/Security/captcha.js. */}
                      <div className="mt-3 d-flex flex-column justify-content-center align-items-center w-100  ">
                        <RecaptchaV2
                          ref={captchaRef}
                          // fullWidth
                          scale={0.9}
                          onChange={(token) => { setCaptchaToken(token || ''); if (token) setCaptchaError(''); }}
                        />
                        {captchaError && (
                          <p className="text-danger text-center mt-2">{captchaError}</p>
                        )}
                      </div>
                      {captchaError && (
                        <p className="text-danger mt-2 text-center">{captchaError}</p>
                      )}
                      <div className={` mt-4`}>
                        <Button btnText="Signup"
                          type="submit"
                          className="successFillRectangleBtn"
                          disabled={btndis}
                          onClick={(e) => {
                            setIsLoading(true);
                            setError({});
                            Signup();
                          }} />

                        <Button
                          btnText="Continue With Google "
                          type="submit"
                          className="invertFillRectangleBtnXs2"
                          disabled={btndis}
                          reactIconElement={<FcGoogle size={30} />}
                          staticClass="w-100 gap-2 mt-3"
                          onClick={(e) => {
                            continueWithGoogle()
                          }} />
                        {/* {<div className={`${styles.appleBorder} registerAppleLogin p-0 mt-3`}>
                          <AppleLogin
                            clientId={config.APPLECONFIG.APPLE_CLIENT_ID}
                            redirectURI={`${config.FRONT_URL}/register`}
                            usePopup={true}
                            scope="name email"
                            designProp={{
                              color: theme === 'light' ? 'white' : 'black',

                            }}
                            responseMode="query"
                            responseType="code id_token"
                            // responseType="code"
                            callback={handleAppleLoginSuccess}
                            onFailure={handleAppleLoginFailure}
                          />
                        </div>} */}
                        {
                          <div className={`registerAppleLogin p-0 mt-3`}>
                            <AppleLogin
                              clientId={config.APPLECONFIG.APPLE_CLIENT_ID}
                              redirectURI={`${config.FRONT_URL}/register`}
                              usePopup={true}
                              scope="name email"
                              responseMode="query"
                              responseType="code id_token"
                              callback={handleAppleLoginSuccess}
                              onFailure={handleAppleLoginFailure}
                              render={({ onClick, disabled }) => (
                                <Button
                                  btnText="Sign in with Apple "
                                  type="submit"
                                  className="invertFillRectangleBtnXs2"
                                  disabled={disabled}
                                  reactIconElement={<FaApple size={30} />}
                                  staticClass="w-100 gap-2 mt-3"
                                  onClick={(e) => {
                                    onClick()
                                  }} />
                              )}
                            />
                          </div>
                        }
                        {/* 
                        <Button btnText="Continue With Apple "
                          type="submit"
                          className="invertFillRectangleBtnXs2"
                          disabled={btndis}
                          reactIconElement={<FaApple size={30} />}
                          staticClass="w-100 gap-2 mt-3"
                          onClick={(e) => {
                            continueWithApple()
                          }} /> */}

                        <div className={`${styles.flexCenterContainer} mt-3`}>
                          <span className={`${styles.bottomInfoTxt} me-2`}>
                            Already have an account ?{" "}
                            <Link to="/login" className={`${styles.pageNavLinks}`}>Login Here</Link>
                          </span>
                        </div>
                      </div>

                    </div>
                  </form>

                </div>
              </div>
            </div>
          </div>
        </div>
        {sendotp && <OtpVerification
          show={sendotp}
          handleClose={() => setSendotp(false)}
          location={currentLocation}
          data={{ email, password, mobileNumber, challengeId }}
          type={loginType}
          setRestoreToggle={false}
        />}


      </div>
    </>
    // </GoogleReCaptchaProvider>
  );
};

export default Register;