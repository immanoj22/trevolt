/** PACKAGE IMPORT */
import React, { useRef, useState } from 'react'
import { useSelector } from 'react-redux';
import { useLocation, Link, useNavigate } from "react-router-dom";
import Countdown, { zeroPad } from "react-countdown";
import OtpInput from 'react-otp-input';

import { Modal, Form } from "react-bootstrap";
// import { Copy } from "lucide-react";

/** LOCAL FILES IMPORT */
import styles from "./styles/authInnerPage.module.css"


/** LOCAL FILES IMPORT */
import { useEffect } from 'react';
import Button from '../../components/Button/Button';
import { AiOutlineInfoCircle } from 'react-icons/ai';
import { InputComponent, InputTextareaComponent, PrimaryInput } from '../../components/Input/InputFields';
import Select from 'react-select';
import ComingSoon from '../../components/ComingSoon/ComingSoon';
import featureFlags from '../../config/featureFlags';
import { createWebHook, getWebhookOTP } from '../../actions/algoAction';
import { showToastMessage } from '../../lib/toast';
import { resendLoginCodeHooks } from '../../actions/userAction';
import { validateresendLoginCode } from '../../pages/Validation/userValidation';
import isEmpty from 'is-empty';
import WebhookModel from './modal/WebhookModel';
import Images from '../../utils/Images';

/** CODE START */

const tradingViewMessage = `{
    "symbol":"{{ticker}}",
    "side":"{{strategy.order.action}}",
    "qty":{{strategy.order.contracts}},
    "price":"{{close}}"
    "trigger_time":"{{timenow}}"
  }`;
const initialState = {
    name: "",
    source: "",
    accountId: "",
    otp: ""
}

const TradingBot = () => {
    const navigate = useNavigate();

    const { apiKeyList, hideSecret } = useSelector((state) => state.apikey);
    const { userdetails, subAccountList } = useSelector((state) => state.user);

    const [isShow, setIsShow] = useState(false)
    const [show, setShow] = useState(false)
    const [formData, setFormData] = useState(initialState)
    const [isResubmit, setIsResubmit] = useState(false);
    const [expireIn, setExpireIn] = useState(Date.now() + 5 * (60000));
    const [errors, setErrors] = useState({})
    const [subOptions, setsubOptions] = useState([]);
    const [webhookUrl, setWebhookUrl] = useState("");

    const validation = async () => {
        let error = {}

        if (isShow) {
            if (isEmpty(formData.otp)) {
                error['otp'] = 'OTP is required'
            }
        }
        if (isEmpty(formData.name)) {
            error['name'] = 'Name is required'
        } if (isEmpty(formData.name)) {
            error['source'] = 'Source is required'
        } if (isEmpty(formData.name)) {
            error['accountId'] = 'Account is required'
        }

        setErrors(error)
        return Object.keys(error).length > 0 ? true : false
    }

    const resendCode = async () => {
        try {
            setIsResubmit(true);
            const resp = await resendCodeHooks(userdetails.secretKey);
            let result = resp?.data;
            if (result?.success) {
                setExpireIn(Date.now() + 5 * (60000))
                showToastMessage(result?.message, 'success');
                setIsResubmit(false);
            }
            setIsResubmit(false);
        } catch (e) {
            console.log("resendOtp__Err", e);
        }
    }


    const getCode = async () => {
        try {
            const isValid = await validation()
            if (isValid) { return }

            const { status, message } = await getWebhookOTP(userdetails?.secretKey);
            if (status) {
                setIsShow(true)
            }
            showToastMessage(message, status ? 'success' : 'error')
        } catch (e) {
            console.log("getCode_err", e);
        }
    }

    const createAlgo = async () => {
        try {
            const isValid = await validation()
            if (isValid) { return }

            const { status, message, result, error } = await createWebHook(formData, userdetails?.secretKey);
            if (status) {
                setWebhookUrl(result?.data)
                setShow(true)
                showToastMessage(message, status ? 'success' : 'error')
            } else {
                !isEmpty(message) && showToastMessage(message, status ? 'success' : 'error')
                setErrors(error)
            }
        } catch (e) {
            console.log("getCode_err", e);
        }
    }

    const renderer = ({ days, hours, minutes, seconds, completed }) => {
        if (completed) {
            setIsResubmit(true)
        } else {
            return <span className="">
                {zeroPad(minutes)}m : {zeroPad(seconds)}s
            </span>
        }
    }

    useEffect(() => {
        window.scrollTo({
            top: 0,
            behavior: "smooth",
        });
    }, []);


    useEffect(() => {

        if (!isEmpty(subAccountList)) {
            let mainAccount = subAccountList.find((val) => (val.isPrimary == true))
            if (!isEmpty(mainAccount)) {
                // setAccountId(mainAccount.accountId)
            }
            let option = subAccountList.reduce((Options = [], val) => {
                let obj = {
                    label: val.accountName,
                    value: val._id,
                }
                Options.push(obj)
                return Options
            }, [])
            setsubOptions(option)
        }
    }, [subAccountList])

    return (
        // Temporary: Algo Trading (this "Trading Bot" / webhook page, linked
        // from the header's "Algo" nav item) is being hidden behind a
        // "Coming Soon" page for both the live and demo user panels —
        // gated behind featureFlags.showAlgoTradingComingSoon, same flag
        // used for the separate /algo-trading landing page. Flip that flag
        // off once the feature is ready; everything below is untouched and
        // renders exactly as before when the flag is false.
        <ComingSoon
            active={featureFlags.showAlgoTradingComingSoon}
            title="Coming Soon..."
            message="Algo Trading is being finalized. Please check back soon."
        >
        <div>
            <WebhookModel show={show} webhookUrl={webhookUrl} handleClose={() => setShow(false)} />
            {
                userdetails && userdetails?.algoWebHook ?
                    <div className={styles.tradingBotPage}>
                        <div className={styles.headerPart}>
                            <h2>Webhook Created <br /> Successfully</h2>
                            <div className={styles.imgPart}>
                                <img src={Images.webhookIcon} alt="webhookIcon" />
                            </div>
                        </div>
                        <div className={styles.bodyPart}>
                            <ul className={styles.stepByStepPart}>
                                <li>
                                    <span>1</span>
                                    <p>
                                        Select your strategy on TradingView.
                                    </p>
                                </li>
                                <li>
                                    <span>2</span>
                                    <p>Open the strategy settings and enter your desired
                                        pre-order quantity.</p>
                                </li>
                                <li>
                                    <span>3</span>
                                    <p>Create an alert for your strategy and paste the given text
                                        into the message box.</p>
                                </li>
                            </ul>
                            <div>
                                <InputTextareaComponent label={"Trading View Message"} value={tradingViewMessage} disabled rows={8} />
                            </div>
                        </div>
                    </div>
                    :
                    <>
                        <div className={styles.cardHeader}>
                            <h5 className={styles.pageTitle}>Create Webhook</h5>
                        </div>
                        <div className={`${styles.cardMaxWidthLg} mt-4`}>
                            <div className={styles.cardBorder}>
                                {/* {
                                    apiKeyList.length === 0 ?
                                        <div className={`${styles.cardBorder} ${styles.createWebCardInfo} mb-4`}>
                                            <div className='d-flex align-items-center gap-1'>
                                                <AiOutlineInfoCircle />
                                                <h3>Api-key is mandatory to create Webhooks</h3>
                                            </div>
                                            <Button className='cardSuccessBtnSm' btnText={"Create Apikey"} onClick={() => navigate("/api-management")} />
                                        </div> :
                                        !userdetails.tfaStatus ?
                                            <div className={`${styles.cardBorder} ${styles.createWebCardInfo} mb-4`}>
                                                <div className='d-flex align-items-center gap-1'>
                                                    <AiOutlineInfoCircle />
                                                    <h3>2FA is mandatory to create Webhooks</h3>
                                                </div>
                                                <Button className='cardSuccessBtnSm' btnText={"Setup 2FA"} onClick={() => navigate("/security")} />
                                            </div> : <></>
                                } */}

                                <div className={styles.webHookFormContainer}>
                                    <div className={`${styles.singleFormWrapperSm} mb-4`}>
                                        <label className={styles.singleFormLabel}>
                                            Webhook Name
                                        </label>
                                        <PrimaryInput className='primaryInputBgThree' placeholder={"Enter Webhook Name"} error={errors?.name}
                                            value={formData?.name}
                                            onChange={(e) => {
                                                setFormData((prev) => ({ ...prev, name: e.target.value }))
                                            }}
                                        />
                                    </div>

                                    <div className={`${styles.singleFormWrapperSm} mb-4`}>
                                        <label className={styles.singleFormLabel}>
                                            Account Name
                                        </label>
                                        <div className={styles.webHookSelect}>
                                            <Select
                                                isSearchable={false}
                                                placeholder="Select Account Name"
                                                classNamePrefix="react-select__eighth"
                                                options={subOptions}
                                                menuPosition='fixed'
                                                onChange={(e) => {
                                                    setFormData((prev) => ({ ...prev, accountId: e.value }))
                                                }}
                                                value={subOptions.find((e) => e.value === formData.accountId)}
                                            />
                                        </div>
                                        <p className={`text-danger mt-2`}> {errors?.accountId} </p>
                                    </div>

                                    <div className={`${styles.singleFormWrapperSm} mb-4`}>
                                        <label className={styles.singleFormLabel}>
                                            Source
                                        </label>
                                        <div className={styles.webHookSelect}>
                                            <Select
                                                isSearchable={false}
                                                placeholder="Select Source "
                                                classNamePrefix="react-select__eighth"
                                                options={[
                                                    { label: "Trading View", value: "tradingView" }
                                                ]}
                                                menuPosition='fixed'
                                                onChange={(e) => {
                                                    setFormData((prev) => ({ ...prev, source: e.value }))
                                                }}
                                                value={[
                                                    { label: "Trading View", value: "tradingView" }
                                                ].find((e) => e.value === formData.source)}
                                            />
                                        </div>
                                        <p className={`text-danger mt-2`}> {errors?.source} </p>
                                    </div>


                                    <div className={`${styles.cardBorder} ${styles.webhookNotes}`}>
                                        <div>
                                            <AiOutlineInfoCircle />
                                        </div>
                                        <div>
                                            <p>Trevolt does not bear liability for any losses incurred through signal trading. Please be aware that trade executions may experience delays or be skipped entirely due to reliance on signals from third-party platforms.</p>
                                        </div>
                                    </div>

                                    <div className={`${styles.webHookOtpContainer} mt-4 d-flex justify-content-center align-items-center`}>
                                        {
                                            isShow ?
                                                <div className={`${styles.otpInputWrapper} otpInputWrapper mt-4`}>
                                                    <p className={`${styles.formLabel} mb-2`}>{
                                                        (userdetails.tfaType === "email" || "mobile") ? "Enter OTP" : "Enter 2FA Code"
                                                    }</p>
                                                    <div className="d-flex align-items-center">
                                                        <OtpInput
                                                            shouldAutoFocus={true}
                                                            value={formData?.otp}
                                                            onChange={(e) => {
                                                                setErrors(prev => ({ ...prev, otp: '' }));
                                                                setFormData(prev => ({ ...prev, otp: e }))
                                                            }}
                                                            numInputs={6}
                                                            renderInput={(props) => (
                                                                <input
                                                                    {...props}
                                                                    onKeyDown={(e) => {
                                                                        // if (e.key === "Enter") {
                                                                        //     e.preventDefault();
                                                                        //     verifyLogin(); // call your submit fn
                                                                        // }
                                                                    }}
                                                                />
                                                            )}
                                                        />

                                                        {
                                                            userdetails.tfaType === "email" &&
                                                            <div>
                                                                {
                                                                    isResubmit ?
                                                                        <Button btnText={"Resend OTP"} className="cardSuccessBtnSm"
                                                                            onClick={() => {
                                                                                resendCode()
                                                                            }}
                                                                        />
                                                                        :
                                                                        <div className={`${styles.countdownInstruct}`}>
                                                                            {
                                                                                <div className={styles.countdown}>
                                                                                    <Countdown
                                                                                        date={expireIn}
                                                                                        renderer={renderer}
                                                                                    />
                                                                                </div>
                                                                            }
                                                                        </div>
                                                                }
                                                            </div>
                                                        }
                                                    </div>
                                                    <p className={`text-danger mt-2`}> {errors?.otp} </p>
                                                    {/* <Button btnText={"Create Webhook"} className='cardSuccessBtnSm' onClick={createAlgo} disabled={(apiKeyList.length === 0 || !userdetails.tfaStatus)} /> */}
                                                    <Button btnText={"Create Webhook"} className='cardSuccessBtnSm' onClick={createAlgo} disabled={!userdetails.tfaStatus} />
                                                </div>
                                                :
                                                <Button btnText={"Create Webhook"} className='cardSuccessBtnSm' onClick={getCode} disabled={!userdetails.tfaStatus} />
                                        }
                                    </div>

                                </div>
                            </div>
                        </div>
                    </>
            }

        </div>
        </ComingSoon>
    )
}

export default TradingBot
