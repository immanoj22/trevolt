/** PACKAGE IMPORT */

import React, { useEffect, useState } from "react";
import { useLocation, Link, useParams, useNavigate } from "react-router-dom";
import { FaEye } from "react-icons/fa";
import { FaEyeSlash } from "react-icons/fa";

/** LOCAL FILES IMPORT */

import styled from "./auth.module.css"
import Button from "../../components/Button/Button";
import { OtpVerification } from "./modal/OtpVerification";
import { InputComponent } from "../../components/Input/InputFields";
import { validateForgotEmail, validateResetPassword } from "../Validation/userValidation";
import { forgotPasswordHooks, resetPasswordHooks } from "../../actions/userAction";
import { showToastMessage } from "../../lib/toast";
import { RestoreModel } from "./modal/RestoreModel";
import PasswordRequirementsInfo from "../../components/UiComponents/PasswordRequirementsInfo";

/** ACTIONS */


/** CONFIG */



/** CODE START */


const ForgotPassword = (props) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { authToken } = useParams();
  const [currentLocation, setCurrentLocation] = useState(location.pathname);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState({});
  const [sendotp, setSendotp] = useState(false);
  const [passwordView, setPasswordView] = useState(false);
  const [confirmPasswordView, setConfirmPasswordView] = useState(false);
  const [passwordType, setPasswordType] = useState('password');
  const [confirmPasswordType, setConfirmPasswordType] = useState('password');
  const [loginType, setLoginType] = useState("email");
  const [restoreToggle, setRestoreToggle] = useState(false);
  const [mobileNumber, setMobileNumber] = useState("");
  const [method, setMethod] = useState("normal"); // Normally initial stage tfaType through password reset the user.
  const handlePasswordView = () => {
    setPasswordView(!passwordView)
  }
  const handleConfirmPasswordView = () => {
    setConfirmPasswordView(!confirmPasswordView)
  }


  const ResetPassword = async () => {
    try {
      let reqData = {
        email: email,
        otp: location?.state?.otp,
        password: password,
        confirmPassword: confirmPassword,
        method: method
      };
      const { status, errors } = await validateResetPassword(reqData);
      if (status) {
        setError(errors);
      } else {
        let resp = await resetPasswordHooks(reqData);
        let result = resp?.data;
        if (result?.success) {
          setError({});
          showToastMessage(resp?.data?.message, 'success');
          navigate("/login")
        } else if (!result?.result?.success) {
          if (result?.result?.errors) {
            showToastMessage(result?.result?.errors?.otp, "error")
          } else if (result.message) {
            showToastMessage(result.message, "error")
          }
        }
      }
    } catch (e) {
      console.log('ResetPassword__Err', e)
    }
  }

  const forgotLinkExpire = async () => {

  }

  useEffect(() => {
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
    forgotLinkExpire()
  }, []);

  const login = async (e) => {
    e.preventDefault()
    setError({});
    setIsLoading(true);
    setSendotp(true);
  };


  const onSubmit = async () => {
    try {
      let reqData = { email: email }
      const { status, errors } = await validateForgotEmail(reqData);
      if (status) {
        setError(errors)
      } else {
        let resp = await forgotPasswordHooks(reqData);
        let result = resp?.data;
        if (result?.success) {
          showToastMessage(result?.message, 'success');
          setSendotp(true)
          setLoginType(result?.status)
          setMobileNumber(result?.result)
        } else if (!result?.success) {
          if (result?.message) {
            showToastMessage(result?.message, 'error')
          }
        }
      }

    } catch (e) {
      console.log("onSubmit__Err", e)
    }
  }

  return (
    <>
      <div className={styled.authContainer}>
        <div className={styled.authFormContainer}>
          <p className={`${styled.pageName} mt-0`}>
            Forgot Password
          </p>
          <div className="mt-4">
            {
              location.pathname == `/reset-password` ?
                <>
                  <div className={styled.singleFormContainer}>
                    <div className={`${styled.formLabel} d-flex justify-content-between align-items-center`}>
                      <span>Password</span>
                      <PasswordRequirementsInfo />
                    </div>
                    <div className={`${styled.formPasswordInput} mt-2`}>
                      <input
                        type={passwordView ? "text" : "password"}
                        placeholder="Enter your password"
                        onChange={(e) => { setPassword(e.target.value) }}
                      />

                      <button
                        aria-label="passwordView"
                        className="border-0 outline-0 bg-transparent"
                        onClick={() => handlePasswordView()}
                      >
                        {passwordView ? <FaEye /> : <FaEyeSlash />}
                      </button>
                    </div>
                    {error?.password && <p className={`text-danger mt-2`}>
                      {error?.password}
                    </p>}
                  </div>

                  <div className={`${styled.singleFormContainer} mt-2`}>
                    <div className={`${styled.formLabel} d-flex justify-content-between align-items-center`}>
                      <span>Confirm Password</span>
                      <PasswordRequirementsInfo />
                    </div>
                    <div className={`${styled.formPasswordInput} mt-2`}>
                      <input
                        type={confirmPasswordView ? "text" : "password"}
                        placeholder="Confirm your password"
                        onChange={(e) => { setConfirmPassword(e.target.value) }}
                      />
                      <button
                        aria-label="confirmPassword"
                        className="border-0 outline-0 bg-transparent"
                        onClick={() => handleConfirmPasswordView()}
                      >
                        {confirmPasswordView ? <FaEye /> : <FaEyeSlash />}
                      </button>
                    </div>
                    <p className={`text-danger mt-2`}>
                      {error?.confirmPassword}
                    </p>
                  </div>

                  <div className={`${styled.flexEndContainer} mt-2`}>
                    <Link to="/forgot" className={`${styled.pageNavLinks}`}>
                      Back
                    </Link>
                  </div>

                  <div className="mt-4">
                    <Button className="successFillRectangleBtn" onClick={() => { ResetPassword() }}>
                      Reset Password
                    </Button>
                  </div>
                </> :
                <>
                  <InputComponent label={"Email Address"} type="email" placeholder={"Enter Your Mail Address"} id="email" value={email} onChange={(e) => setEmail(e?.target?.value)} error={error?.email} />
                  <div className={`${styled.flexEndContainer} mt-2`}>
                    <Link to="/login" className={`${styled.pageNavLinks}`}>
                      Back to Login
                    </Link>
                  </div>
                  <div className="mt-4">
                    <Button
                      className="successFillRectangleBtn"
                      onClick={() => { onSubmit() }}>
                      Submit
                    </Button>
                  </div>
                </>
            }
            {sendotp && <OtpVerification
              show={sendotp}
              handleClose={() => setSendotp(false)}
              data={{ email, mobileNumber }}
              location={currentLocation}
              resendOtp={onSubmit}
              type={loginType}
              // setRestoreToggle={setRestoreToggle}
              setRestoreToggle={false}
            />}
            {/* {<RestoreModel // As of now dont need the tryanother way, only through email
              show={restoreToggle}
              handleClose={() => setRestoreToggle(false)}
              location={currentLocation}
              data={{ email, password }}
              type={loginType}
              filter="forgot"
              setMethod={(data) => setMethod(data)}

            />} */}
          </div>
        </div>
      </div>
    </>
  );
};

export default ForgotPassword;