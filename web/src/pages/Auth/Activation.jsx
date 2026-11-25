/** PACKAGE IMPORT */

import React, { useEffect, useState } from "react";
import { useLocation, Link, useNavigate } from "react-router-dom";

/** LOCAL FILES IMPORT */
import styled from "./auth.module.css"

import { FaEye } from "react-icons/fa";
import { FaEyeSlash } from "react-icons/fa";

import { OtpVerification } from "./modal/OtpVerification";
import Button from "../../components/Button/Button";
import { InputComponent, PasswordInput } from "../../components/Input/InputFields";
import { accountVerificationHooks } from "../../actions/userAction";
import { showToastMessage } from "../../lib/toast";

/** ACTIONS */


/** CONFIG */

/** CODE START */

const Activation = (props) => {
    const location = useLocation();
    const navigate = useNavigate();
    const htmlTagPattern = /<[^>]*>/; // Matches any HTML tag
    const [currentLocation, setCurrentLocation] = useState(location.pathname);
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loginHistory, setLoginHistory] = useState({});
    const [error, setError] = useState({});
    const [isLoading, setIsLoading] = useState(false);
    const [sendotp, setSendotp] = useState(false);
    const [loginType, setLoginType] = useState("email");
    const [mobileNumber, setMobileNumber] = useState("");

        
    useEffect(() => {
        getData()
    }, []);


    const getData = async () => {
        try {
            let pathName = location.pathname;
            let userId = pathName.split('/')[2];
            if (userId != undefined) {
                const resp = await accountVerificationHooks(userId);
                    if (resp?.data?.success) {
                        showToastMessage(resp?.data?.message, 'success')
                        navigate("/login");
                    } else if (!resp?.data?.success) {
                        showToastMessage(resp?.data?.message, 'error');
                        navigate("/login");
                    }
            }
        } catch (e) {
            console.log("getData_err", e)
        }
    }

    const login = async (e) => {
        e.preventDefault()
        setError({});
        setIsLoading(true);
        setSendotp(true);
    };


    return (
        <div className={styled.authContainer}>
            <>
                <div className={styled.authFormContainer}>
                    <p className={`${styled.pageName} mt-3`}>
                        Login
                    </p>
                    <form onSubmit={(e) => { login(e) }} className="mt-4">
                        <InputComponent label={"Email Address"} type="email" placeholder={"Enter Your Mail Address"} />
                        <PasswordInput label={"Password"} placeholder={"Enter Your Password"} />

                        {/* <div className={`${styled.flexEndContainer} mt-2`}>
                            <Link to="/forgot" className={`${styled.pageNavLinks}`}>
                                Forgot Password ?
                            </Link>
                        </div> */}
                        <div className={`mt-4`}>
                            <Button btnText="Login"
                                type="submit"
                                className="successFillRectangleBtn"
                                onClick={(e) => {
                                    login(e);
                                }} />
                            {/* <p className={`${styled.notes} mt-3`}>
                                (Trevolt app works best on Google Chrome. If you are using Safari browser then please enable <span>Pop-up Windows</span>. Open Safari browser, click on <span>Safari</span><FaArrowRight className="mx-1" />
                                <span>Settings</span><FaArrowRight className="mx-1" /><span>Websites</span><FaArrowRight className="mx-1" /><span>Pop-up Windows</span><FaArrowRight className="mx-1" /> click on <span>Allow</span>)
                            </p> */}
                        </div>

                        <div className={`${styled.flexCenterContainer} mt-3`}>
                            <span className="me-2">
                                New User ?
                            </span>
                            <Link to="/register" className={`${styled.pageNavLinks}`}>Register Here</Link>
                        </div>
                    </form>

                </div>
            </>

            {sendotp && <OtpVerification
                show={sendotp}
                handleClose={() => setSendotp(false)}
                location={currentLocation}
                data={{ email, password, loginHistory, mobileNumber }}
                resendOtp={login}
                type={loginType}
            />}
        </div>
    );
};

export default Activation;