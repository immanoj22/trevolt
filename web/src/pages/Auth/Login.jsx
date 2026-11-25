/** PACKAGE IMPORT */

import React, { useState, useRef } from "react";
import { useLocation, Link, useNavigate, useSearchParams } from "react-router-dom";

/** LOCAL FILES IMPORT */
import styles from "./auth.module.css"
import { ImQrcode } from "react-icons/im";

import { OtpVerification } from "./modal/OtpVerification";
import Button from "../../components/Button/Button";
import { InputComponent, PasswordInput } from "../../components/Input/InputFields";
import { validateUserLogin } from "../Validation/userValidation";
import { loginHooks, signInWithApple, signupWithGoogle } from "../../actions/userAction";
import browser from "browser-detect";
import axios from "axios";
import { useEffect } from "react";
import { showToastMessage } from "../../lib/toast";
import { useGlobalContext } from "../../context/GlobalProvider";

import { jwtDecode } from 'jwt-decode'
import { createSocketUser } from "../../config/socketConnectivity";
import { RestoreModel } from "./modal/RestoreModel";
import { FcGoogle } from "react-icons/fc";
import { FaApple } from "react-icons/fa";

import { signInWithGoogle } from "../../hooks/firebase";
import { LoginQrModel } from "./modal/loginQrModel";
import config from "../../config/env";


import AppleLogin from 'react-apple-login';
import { isEmpty } from "../../lib/isEmpty";
import RecaptchaV2 from "../../components/Recaptcha/RecaptchaV2";
/** ACTIONS */


/** CONFIG */

/** CODE START */

const Login = () => {

  const location = useLocation();
  const navigate = useNavigate();
  const htmlTagPattern = /<[^>]*>/; // Matches any HTML tag
  const [currentLocation, setCurrentLocation] = useState(location.pathname);
  // const [email, setEmail] = useState("");
  // const [password, setPassword] = useState("");
  const [loginHistory, setLoginHistory] = useState({});
  const [error, setError] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [sendotp, setSendotp] = useState(false);
  const [restoreToggle, setRestoreToggle] = useState(false);
  const [loginQrToggle, setLoginQrToggle] = useState(false);
  const [loginType, setLoginType] = useState("email");
  const [mobileNumber, setMobileNumber] = useState("");
  const [challengeId, setChallengeId] = useState("");

  const [params] = useSearchParams();
  const code = params.get("code");
  // venkatesh

  const initialValue = {
    "email": '',
    "password": ''
  }
  const [formValue, setFormValue] = useState(initialValue);

  const { email, password } = formValue;

  const [errors, setErrors] = useState({});
  const [btndis, setBtnDis] = useState(false);

  /**
   * The backend deliberately returns the *same* generic message under
   * both `errors.email` and `errors.password` for invalid credentials
   * (see backend/Modules/User/Hooks/authHooks.js) — intentional (VAPT
   * Point 3, username enumeration prevention: the response must not
   * reveal whether the email or the password was wrong). Product wants
   * this shown once, always under the password field, regardless of
   * which field the user edits afterward. Kept as its own state (rather
   * than derived from errors.email === errors.password) so editing one
   * field doesn't desync it from the other and make it jump between
   * fields — it's simply cleared, uniformly, on any edit.
   */
  const [credentialsError, setCredentialsError] = useState('');

  // SECURITY FIX (VAPT: "Credential Stuffing Protection", Point 16):
  // switched from invisible reCAPTCHA v3 to a visible v2 checkbox widget
  // (see components/Recaptcha/RecaptchaV2.jsx). Token now lives in state,
  // set by the widget's onChange callback, instead of being pulled
  // on-demand via an async getCaptchaToken() call.
  const [captchaToken, setCaptchaToken] = useState('');
  const [captchaError, setCaptchaError] = useState('');
  const captchaRef = useRef(null);

  const { theme, handleLogin } = useGlobalContext();

  // venkatesh

  // useEffect(() => {
  //   getGeoInfo();
  // }, []);

  // const getGeoInfo = async () => {
  //   try {
  //     const result = browser();
  //     const history = await axios.get("https://ipapi.co/json/");
  //     // console.log("history.response.data", history);
  //     setLoginHistory({
  //       countryName: history.data.country_name,
  //       countryCode: history.data.country_calling_code,
  //       ipaddress: history.data.ip,
  //       regionName: history.data.region,
  //       browserName: result.name,
  //       isMobile: result.mobile,
  //       os: result.os,
  //     });
  //   } catch (e) {
  //     console.log("getGeoInfo_err", e);
  //   }
  // };


  const handleChange = (e) => {
    try {
      const { id, value } = e?.target;
      setFormValue({ ...formValue, ...{ [id]: value } });
      // BUG FIX: field validation errors (e.g. "Email is required") never
      // cleared while the user typed - they stayed on screen until the
      // next full submit, even after the user fixed the input. Clear just
      // this field's own error as it changes.
      if (errors?.[id]) {
        setErrors((prev) => ({ ...prev, [id]: "" }));
      }
      if (credentialsError) setCredentialsError('');
    } catch (e) {
      console.log("handleChange__Err", e);
    }
  }


  const SignIn = async () => {
    try {
      // e.preventDefault()
      const { status, errors } = await validateUserLogin(formValue);
      if (status) {
        setErrors(errors);
        setCredentialsError('');
      } else {
        // SECURITY FIX (VAPT: "Credential Stuffing Protection", Point 16) —
        // reCAPTCHA v2: the token comes from the checkbox widget's state
        // (set by its onChange callback), not fetched on demand like v3.
        // TEMP: disabled 2026-09-02 for API-doc/feature testing — flip
        // TEMP_DISABLE_RECAPTCHA back to false to re-enable this check.
        const TEMP_DISABLE_RECAPTCHA = false;
        if (!TEMP_DISABLE_RECAPTCHA && !captchaToken) {
          setCaptchaError('Please verify that you are not a robot.');
          return;
        }
        setCaptchaError('');
        setBtnDis(true);
        const resp = await loginHooks({ ...formValue, platform: "web", captchaToken });
        let result = resp?.data;
        if (result?.success) {
          const { isLogged = false, token = '', challengeId = '', mobileNumber = '' } = result?.result
          if (isLogged) {
            setErrors({});
            setBtnDis(false);
            // SECURITY FIX (VAPT: "Token Storage Security" — Points 44/49/70):
            // the JWT is no longer kept as the app's Authorization header or
            // persisted anywhere — the backend already set it as an httpOnly
            // cookie (Modules/User/Hooks/authHooks.js -> setAuthCookie), which
            // axios now sends automatically (withCredentials: true). It is
            // decoded here only transiently, in memory, to read the userId
            // needed for the socket room join — the decoded value/token are
            // never written to localStorage.
            const decoded = jwtDecode(token);
            localStorage.setItem("code", decoded.showWelcomeCard)
            createSocketUser(decoded?.userId);
            await handleLogin();
            showToastMessage(result?.message, 'success');
          } else {
            setTimeout(() => {
              setIsLoading(true);
              setSendotp(true);
              setErrors({});
              showToastMessage(result?.message, 'success');
              setLoginType(result?.status);
              setBtnDis(false);
            }, 100)
            setMobileNumber(mobileNumber)
            setChallengeId(challengeId)
          }
        } else if (!result?.success) {
          const resultErrors = result.errors || {};
          const isGenericCredentialsError =
            !!resultErrors.email &&
            !!resultErrors.password &&
            !resultErrors.passwordNotSet &&
            resultErrors.email === resultErrors.password;
          if (isGenericCredentialsError) {
            setErrors({});
            setCredentialsError(resultErrors.email);
          } else {
            setErrors(resultErrors);
            setCredentialsError('');
          }
          setBtnDis(false);
          // reCAPTCHA v2 tokens are single-use — reset the widget so the
          // user has to re-check the box before their next attempt.
          captchaRef.current?.reset();
          setCaptchaToken('');
          if (result?.message) {
            showToastMessage(result?.message, 'error')
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
          referenceCode: "",
          filter: 'web',
          platform: "web"
        }
        const { success, status, message, result, error } = await signupWithGoogle(payload);
        if (success) {
          if (result?.isLogged) {
            setErrors({});
            // SECURITY FIX (VAPT: "Token Storage Security" — Points 44/49/70):
            // no Authorization header/localStorage write; decode is
            // in-memory/transient only, used solely for the socket userId.
            const decoded = jwtDecode(result?.token);
            createSocketUser(decoded?.userId);
            await handleLogin();
            showToastMessage(message, 'success');
          } else {
            setTimeout(() => {
              setIsLoading(true);
              setSendotp(true);
              setErrors({});
              showToastMessage(message, 'success');
              setLoginType(status);
              setBtnDis(false);
            }, 100)
            setFormValue({ ...formValue, email: data.email })
            setMobileNumber(result?.mobileNumber)
            setChallengeId(result?.challengeId)
          }
        } else {
          if (error) {
            setErrors(error)
          }
          if (message) {
            showToastMessage(message, 'error')
          }
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
          response_mode: "form_post",
        });
      // window.location.href = appleAuthUrl
      window.open(appleAuthUrl, '_blank');
    } catch (e) {
      console.log("continueWithApple_err", e);
    }
  }

  const signInApple = async (code, email = '') => {
    try {
      const { success, message, result, status } = await signInWithApple({
        code,
        filter: "web",
        platform: "web"
      });
      if (success) {
        if (result?.isLogged) {
          setErrors({});
          // SECURITY FIX (VAPT: "Token Storage Security" — Points 44/49/70):
          // no Authorization header/localStorage write for the token itself;
          // decode is in-memory/transient only (socket userId + welcome-card
          // flag, neither of which is a credential).
          const decoded = jwtDecode(result?.token);
          localStorage.setItem("code", decoded.showWelcomeCard)
          createSocketUser(decoded?.userId);
          await handleLogin();
          showToastMessage(message, 'success');
        } else {
          setTimeout(() => {
            setIsLoading(true);
            setSendotp(true);
            setErrors({});
            showToastMessage(message, 'success');
            setLoginType(status);
            setBtnDis(false);
          }, 100)
          setFormValue({ ...formValue, email: isEmpty(email) ? result?.email : email })
          setMobileNumber(result?.mobileNumber)
          setChallengeId(result?.challengeId)
        }
      } else {
        if (error) {
          setErrors(error)
        }
        if (message) {
          showToastMessage(message, 'error')
        }
      }
    } catch (e) {
      console.log("signInApple_err", e);
    }
  }

  // useEffect(() => {
  //   console.log("Code for apple", code)
  //   if (code) {
  //     signInApple(code)
  //   }
  // }, []);

  const handleAppleLoginSuccess = (response) => {
    // The 'response' object will contain the authorization code, identity token, etc.
    const { authorization, user, state } = response;
    let email = user?.email;
    // Fallback: decode id_token if user object wasn't sent (2nd+ login)
    if (!email && authorization?.id_token) {
      const decoded = jwtDecode(authorization.id_token);
      email = decoded?.email;
    }
    signInApple(authorization.code, email)
    // Send this code to your backend for verification
    // ...
  };

  const handleAppleLoginFailure = (error) => {
  };

  return (
    <div className={styles.authContainer}>
      <>
        <div className={styles.authFormContainer}>
          <p className={`${styles.pageName} mt-0`}>
            Login
          </p>
          <form onSubmit={(e) => { SignIn(e) }} className="mt-4">
            <InputComponent label={"Email Address"} type="email" placeholder={"Enter Your Mail Address"} id="email" value={email} onChange={(e) => handleChange(e)} error={errors?.email} />
            <div className="mt-3">
              <PasswordInput label={"Password"} placeholder={"Enter Your Password"} id="password" value={password} onChange={(e) => handleChange(e)} error={errors?.passwordNotSet ? undefined : errors?.password} />
              {errors?.passwordNotSet && (
                <p className="text-danger mt-2">
                  Password is not set. Log in directly using your Google / Apple account or{" "}
                  <Link to="/forgot" className={styles.pageNavLinks}>click here to set password</Link>.
                </p>
              )}
              {credentialsError && (
                <p className="text-danger mt-2">
                  {credentialsError}
                </p>
              )}
            </div>
            <div className={`${styles.flexEndContainer} mt-2`}>
              <Link to="/forgot" className={`${styles.pageNavLinks}`}>
                Forgot Password ?
              </Link>
            </div>
            {/* SECURITY FIX (VAPT: "Credential Stuffing Protection", Point 16):
                visible reCAPTCHA v2 checkbox — see RecaptchaV2 for why v2
                instead of the earlier invisible v3, and why this has zero
                effect on the native mobile apps sharing this backend. */}
            <div className="mt-3 w-100">
              <RecaptchaV2
                ref={captchaRef}
                fullWidth
                scale={0.7}
                onChange={(token) => { setCaptchaToken(token || ''); if (token) setCaptchaError(''); }}
              />
              {captchaError && (
                <p className="text-danger mt-2 text-center">{captchaError}</p>
              )}
            </div>
            <div className={`mt-4`}>

              <Button btnText="Login"
                type="submit"
                className="successFillRectangleBtn"
                disabled={btndis}
                onClick={(e) => {
                  SignIn()
                }} />
              {/* <Button btnText="Login with QR"
                type="button"
                className="invertFillRectangleBtnXs2"
                disabled={btndis}
                staticClass="mt-3 w-100 gap-2"
                reactIconElement={<ImQrcode size={18} />}
                onClick={(e) => {
                  setLoginQrToggle(true);
                }} /> */}

              <Button btnText="Continue With Google "
                type="submit"
                className="invertFillRectangleBtnXs2"
                disabled={btndis}
                reactIconElement={<FcGoogle size={30} />}
                staticClass="w-100 gap-2 mt-3"
                onClick={(e) => {
                  continueWithGoogle()
                }} />
              {/* {<div className={`${styles.appleBorder} p-0 mt-3`}>
                <AppleLogin
                  clientId={config.APPLECONFIG.APPLE_CLIENT_ID}
                  redirectURI={`${config.FRONT_URL}/login`}
                  usePopup={true}
                  scope="name email"
                  designProp={{ color: theme === 'light' ? "white" : "black" }}
                  responseMode="query"
                  responseType="code id_token"
                  callback={handleAppleLoginSuccess}
                  onFailure={handleAppleLoginFailure}
                />
              </div>} */}
              {<div className="p-0 mt-3">
                <AppleLogin
                  clientId={config.APPLECONFIG.APPLE_CLIENT_ID}
                  redirectURI={`${config.FRONT_URL}/login`}
                  usePopup={true}
                  scope="name email"
                  designProp={{ color: theme === 'light' ? "white" : "black" }}
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
              </div>}

              {/* 
              <Button btnText="Continue With Apple "
                type="submit"
                className="invertFillRectangleBtnXs2"
                disabled={btndis}
                reactIconElement={<FaApple size={30} />}
                staticClass="w-100 gap-2 mt-3"
              // onClick={(e) => {
              //   continueWithApple()
              // }} 
              /> */}
            </div>

            <div className={`${styles.flexCenterContainer} mt-3`}>
              <span className={`${styles.bottomInfoTxt} me-2`}>
                New User ?
              </span>
              <Link to="/register" className={`${styles.pageNavLinks}`}>Register Here</Link>
            </div>
          </form>
        </div>
      </>

      {sendotp &&
        <OtpVerification
          show={sendotp}
          handleClose={() => setSendotp(false)}
          location={currentLocation}
          data={{ email, password, mobileNumber, challengeId }}
          // resendOtp={}
          type={loginType}
          setRestoreToggle={setRestoreToggle}
        />
      }
      {restoreToggle && <RestoreModel
        show={restoreToggle}
        handleClose={() => setRestoreToggle(false)}
        location={currentLocation}
        data={{ email, password, mobileNumber, challengeId }}
        type={loginType}
        filter="login"
      />}
      {
        loginQrToggle && <LoginQrModel
          show={loginQrToggle}
          handleClose={() => setLoginQrToggle(false)}
        />
      }

    </div>
  );
};

export default Login;