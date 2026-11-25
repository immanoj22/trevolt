/** package import */

import React, { useEffect, useState } from 'react'
import Form from 'react-bootstrap/Form';
import QRCode from "react-qr-code";
import isEmpty from 'is-empty';
import { useDispatch, useSelector } from "react-redux";
import Swal from 'sweetalert2';

/** local import */

import styles from '../styles/apiManagementCard.module.css'
import Button from '../../../components/Button/Button'
import Images from '../../../utils/Images'
import { InputWithCurrencyAndLabel } from '../../../components/Input/InputFields';
import { FaRegCopy } from 'react-icons/fa6';
import { HiMiniEye, HiMiniEyeSlash } from 'react-icons/hi2';
import { HideSecret, ApiKeyList } from '../../../redux/apikeyAction';
import { IoClose } from 'react-icons/io5';
import { deleteApiKey, editApiKey, getApikeys } from '../../../actions/apikeyAction';
import { showToastMessage } from '../../../lib/toast';
import { resendCodeHooks, resendLoginCodeHooks } from '../../../actions/userAction';
import { validateresendLoginCode } from '../../../pages/Validation/userValidation';
import Countdown, { zeroPad } from "react-countdown";
import OtpInput from 'react-otp-input';
import { useGlobalContext } from '../../../context/GlobalProvider';

/** code start */

const initialState = {
    ipRestriction: false,
    derivativesAndfutures: false,
    option: false,
    ipList: [],
    name: "",
    otp: "",
    isNew: false
}
const ApiManagementCard = ({ data, index, }) => {
    // console.log("ApiManagementCard_data", data);
    const dispatch = useDispatch();
    const { hideSecret, apiKeyList } = useSelector((state) => state.apikey);
    const { userdetails } = useSelector((state) => state.user);
    const { theme } = useGlobalContext()

    const [openRestriction, setOpenRestriction] = useState(false);
    const [isEdit, setIsEdit] = useState(false);
    const [formValue, setFormValue] = useState(initialState);
    const [ip, setIp] = useState('')
    const [errors, setErrors] = useState({})
    const [isShow, setIsShow] = useState(false);
    const [expireIn, setExpireIn] = useState(Date.now() + 5 * (60000));
    const [isResubmit, setIsResubmit] = useState(false);


    const close = () => {
        setIsResubmit(false);
        setIsShow(false)
        setIsEdit(false)
        setFormValue((prev) => ({ ...initialState, apiKey: prev?.apiKey, secretKey: prev?.secretKey, keyId: prev?.keyId }))
    }



    const truncateString = (str, startChars = 10, endChars = 10) => {
        if (str?.length <= startChars + endChars) return str;
        return `${str?.slice(0, startChars)}...${str?.slice(-endChars)}`;
    }

    const hideSecretKey = () => {
        dispatch(HideSecret())
    }

    const editHandle = () => {
        setIsEdit(!isEdit)
        setOpenRestriction(true);
    }
    const openRestrictionss = () => {
        setOpenRestriction(!openRestriction)
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

    const updateCredits = async () => {
        try {
            const { message, error, status } = await editApiKey(formValue, userdetails?.secretKey);
            if (status) {
                showToastMessage(message, 'success');
                if (message === "Api key restrictions updated successfully") {
                    close();
                } else {
                    setIsEdit(false)
                    setExpireIn(Date.now() + 5 * (60000))
                    setIsShow(true);
                }
            } else {
                !isEmpty(message) && showToastMessage(message, 'error')
                setErrors(error)
            }
        } catch (e) {
            console.log("updateCredits_err", e);
            showToastMessage("Something went wrong", 'error');
        }
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

    const deletekey = (id) => { 
        Swal.fire({
            title: "Are you sure you want to delete this API Key?",
            icon: "warning",
            showCancelButton: true,
            confirmButtonText: "Continue",
            confirmButtonColor: theme == 'dark' ? "#2563EB" : "#2563EB",
            cancelButtonColor: theme == 'dark' ? "#2A2C2F" : "#eaecef",
            didOpen: () => {
                const confirmBtn = Swal.getConfirmButton();
                const cancelBtn = Swal.getCancelButton();

                if (confirmBtn) confirmBtn.setAttribute("data-click-effect", "none");
                if (cancelBtn) cancelBtn.setAttribute("data-click-effect", "none");
            }
        }).then(async (result) => {

            if (result.isConfirmed) {
                const { status, message, result, error } = await deleteApiKey(id, userdetails?.secretKey);
                showToastMessage(message, status ? 'success' : "error")
                // Was missing — a successful delete never removed the key
                // from anything (this card, the parent's local list, or
                // Redux's `apiKeyList`), so it stayed visible on screen
                // until a full page refresh re-fetched the list from the
                // server. Re-pulling the list into Redux here (same call
                // HelperRoutes.js's fetchApiKeyLists makes) removes it
                // immediately, the same way the create flow now refreshes
                // Redux too (see CreateApiModal.jsx).
                if (status) {
                    try {
                        const refreshed = await getApikeys(userdetails?.secretKey);
                        if (refreshed?.status) {
                            dispatch(ApiKeyList({ apikeys: refreshed?.result?.data }));
                        }
                    } catch (e) {
                        console.log("refreshApiKeyList__Err", e);
                    }
                }
            }
        });
    }

    useEffect(() => {
        if (!isEmpty(data)) {
            setOpenRestriction(data.isNew)
            setFormValue({
                ipRestriction: data?.ipRestriction ?? false,
                apiKey: data?.apiKey,
                derivativesAndfutures: data?.derivativesAndfutures,
                option: data?.option,
                ipList: data?.ipList,// ['192.168.0.20'],
                name: data?.name,
                secretKey: data?.secretKey,
                keyId: data?._id,
                withdraw: data?.withdraw,
                isNew: data.isNew
            })
        }
    }, [data])

    return (

        <>
            <div className={`${styles.card}`}>
                <div className={`${styles.cardHeaderPart} d-flex align-items-center  justify-content-between`}>
                    <div onClick={() => { openRestrictionss() }} className={`${styles.cardTitlePart} d-flex align-items-center gap-2`}>
                        <h5 className={styles.cardTitle}>{data?.name}</h5>
                    </div>
                    <div className={`${styles.headerOptionPart} d-flex align-items-center gap-3`}>
                        {(isEdit || isShow) ?
                            <>
                                <Button
                                    isLoading={false}
                                    loadingText="Redirecting..."
                                    btnText="Save"
                                    onClick={() => updateCredits()}
                                    className="cardSuccessBtnSm"
                                    selectedValue={null}
                                />
                                <Button
                                    isLoading={false}
                                    loadingText="Redirecting..."
                                    btnText="Cancel"
                                    onClick={() => editHandle()}
                                    className="cardSuccessBtnSm"
                                    selectedValue={null}
                                />
                            </>
                            : (!isEdit) &&
                            <>
                                <Button
                                    // isLoading={false}
                                    loadingText="Redirecting..."
                                    btnText="Edit restriction"
                                    onClick={(e) => { editHandle(e) }}
                                    className="cardSuccessBtnSm"
                                    selectedValue={null}
                                />
                                <Button
                                    // isLoading={false}
                                    loadingText="Redirecting..."
                                    btnText="Delete"
                                    onClick={() => { deletekey(data._id) }}
                                    className="cardSuccessBtnSm"
                                    selectedValue={null}
                                    disabled={(apiKeyList.length === 1 && userdetails.algoWebHook)}
                                />
                            </>

                        }
                    </div>
                </div>
                {openRestriction &&
                    <div className={`${styles.cardBodyPart}`}>
                        <div className='row align-items-start gap-5 mt-3'>
                            {formValue?.isNew ? <p className='secu_desc'>
                                *Note: API key generated! Please note the secret key in a safe place.
                                Write this down somewhere safe. This secret key will not be available once you leave this page. Don’t share this with anyone.
                            </p> : ""}
                            <div className='col-12 col-md-12 col-lg-2'>
                                {formValue?.isNew && formValue?.secretKey ?
                                    <QRCode
                                        size={256}
                                        style={{ height: "auto", maxWidth: "100%", width: "100%" }}
                                        value={formValue?.secretKey}
                                        viewBox={`0 0 256 256`}
                                        className={styles.qrCodeImg}
                                    /> :
                                    <img src={Images.qrLockImg} style={{ height: "auto", maxWidth: "100%", width: "100%" }} />
                                }
                            </div>
                            <div className='col-12 col-md-12 col-lg-9 mt-4 mt-lg-0'>
                                <div>
                                    <p className={styles.labelTitle}>API Key</p>
                                    <p className='d-flex align-items-center'>
                                        <span className={`${styles.labelValue} fs17`}>{truncateString(formValue?.apiKey)}</span>
                                        <button
                                            className={`mx-2 ${styles.copyBtn}`}
                                            onClick={() => {
                                                showToastMessage("The Api Key has been copied!", "success");
                                                navigator.clipboard
                                                    .writeText(formValue?.apiKey)
                                                    .then(() => {
                                                    })
                                                    .catch((err) => {
                                                    });
                                            }}
                                        >
                                            <FaRegCopy />
                                        </button>
                                    </p>
                                </div>
                                <div className='mt-4'>
                                    <p className={styles.labelTitle}>Secret Key</p>
                                    <p className={`${styles.labelValue} fs17`}>
                                        <span>
                                            {/* ************************* */}
                                            {!formValue?.isNew ? "*************************" : truncateString(formValue?.secretKey)}
                                        </span>
                                        {
                                            formValue?.isNew ? <button
                                                className={`mx-2 ${styles.copyBtn}`}
                                                onClick={() => {
                                                    showToastMessage("The Secret Key has been copied!", "success");
                                                    navigator.clipboard
                                                        .writeText(formValue?.secretKey)
                                                        .then(() => {
                                                            // SECURITY FIX: removed console.log of sensitive client-side data (secretKey/password/OTP)
                                                        })
                                                        .catch((err) => {
                                                        });
                                                }}
                                            >
                                                <FaRegCopy />
                                            </button> : ""
                                        }

                                        {/* <button className={`mx-2 ${styles.copyBtn}`} onClick={hideSecretKey}>
                                            {
                                                hideSecret ?
                                                    <HiMiniEyeSlash />
                                                    :
                                                    <HiMiniEye />
                                            }

                                        </button> */}
                                    </p>
                                </div>
                                <div className={`mt-4 ${styles.editContainer + " " + styles[isEdit ? "isEnabled" : "isDisabled"]}`}>
                                    <p className={styles.labelTitle}>API restrictions</p>
                                    <div className='row mt-2'>
                                        <div className='col-12 col-lg-6 col-xl-3'>
                                            <div className="custom-checkInput__container4 mt-4">
                                                <label className="custom-checkInput__label4">
                                                    <input
                                                        type="checkbox"
                                                        checked={true}

                                                    />
                                                    <span className="custom-checkInput__checkmark4"></span>
                                                </label>
                                                <p className={styles.labelTitle}>
                                                    Enable Reading
                                                </p>
                                            </div>
                                        </div>
                                        <div className='col-12 col-lg-6 col-xl-4'>
                                            <div className="custom-checkInput__container4 mt-4">
                                                <label className="custom-checkInput__label4">
                                                    <input
                                                        type="checkbox"
                                                        checked={formValue.derivativesAndfutures}
                                                        onChange={(e) => {
                                                            setFormValue((pervRecord) => {
                                                                return { ...pervRecord, 'derivativesAndfutures': e.target.checked }
                                                            })
                                                        }}
                                                    />
                                                    <span className="custom-checkInput__checkmark4"></span>
                                                </label>
                                                <p className={styles.labelTitle}>
                                                    Enable Future Trading
                                                </p>
                                            </div>
                                        </div>
                                        <div className='col-12 col-lg-6 col-xl-5'>
                                            <div className="custom-checkInput__container4 mt-4">
                                                <label className="custom-checkInput__label4">
                                                    <input
                                                        type="checkbox"
                                                        checked={formValue.option}
                                                        onChange={(e) => {
                                                            setFormValue((pervRecord) => {
                                                                return { ...pervRecord, 'option': e.target.checked }
                                                            })
                                                        }}
                                                    />
                                                    <span className="custom-checkInput__checkmark4"></span>
                                                </label>
                                                <p className={styles.labelTitle}>
                                                    Enable Option Trading
                                                </p>
                                            </div>
                                        </div>
                                        <div className='col-12 col-lg-6 col-xl-5'>
                                            <div className="custom-checkInput__container4 mt-4">
                                                <label className="custom-checkInput__label4">
                                                    <input
                                                        type="checkbox"
                                                        checked={formValue.withdraw}
                                                        onChange={(e) => {
                                                            setFormValue((pervRecord) => {
                                                                return { ...pervRecord, 'withdraw': e.target.checked }
                                                            })
                                                        }}
                                                    />
                                                    <span className="custom-checkInput__checkmark4"></span>
                                                </label>
                                                <p className={styles.labelTitle}>
                                                    Withdraw
                                                </p>
                                            </div>
                                        </div>

                                    </div>
                                </div>
                                <div className={`mt-4 ${styles.editContainer + " " + styles[isEdit ? "isEnabled" : "isDisabled"]}`}>
                                    <p className={styles.labelTitle}>IP access restrictions</p>
                                    <div className='custom-radioForm__secondary d-flex gap-2 mt-2'
                                        onClick={() => {

                                            setFormValue((pervRecord) => {
                                                return { ...pervRecord, 'ipRestriction': false, 'ipList': [] }
                                            })
                                        }}
                                    >
                                        <input type="radio" name="riskViewRadios" id="unrestrictedId"
                                            checked={'false' == formValue?.ipRestriction?.toString()} />
                                        <label htmlFor="unrestrictedId">Unrestricted (Less Secure)</label>
                                    </div>
                                    <div className='custom-radioForm__secondary d-flex gap-2 mt-2' onClick={() => {
                                        setFormValue((pervRecord) => {
                                            return { ...pervRecord, 'ipRestriction': true }
                                        })
                                    }}>
                                        <input type="radio" name="riskViewRadios" id="restrictId"
                                            checked={'true' == formValue?.ipRestriction?.toString()}
                                        />
                                        <label htmlFor="restrictId">
                                            Restrict access to trusted IPs only (Recommended)
                                        </label>
                                    </div>

                                    {
                                        formValue?.ipRestriction &&
                                        <div className='col-12 col-xl-10 col-xxl-8'>
                                            <div className={styles.apiListPart}>
                                                {formValue.ipList && formValue.ipList.length > 0 ? formValue.ipList.map((value, i) => {
                                                    return (
                                                        <div className={`${!formValue?.ipRestriction ? "opacity_80" : ""} ${styles.apiListCard}`}>
                                                            <p>{value}</p>
                                                            <button
                                                                disabled={!formValue?.ipRestriction}
                                                                onClick={() => {
                                                                    setFormValue((pervRecord) => {
                                                                        const updatedList = [...pervRecord.ipList]; // make a copy
                                                                        updatedList.splice(i, 1); // safely remove the item
                                                                        return { ...pervRecord, 'ipList': updatedList }
                                                                    })
                                                                }}>
                                                                <IoClose />
                                                            </button>
                                                        </div>
                                                    )
                                                }) : ""}
                                            </div>
                                        </div>
                                    }

                                    {formValue?.ipRestriction &&
                                        <>
                                            <div className={`${styles.fixedAmountField}  mt-3`}>
                                                <InputWithCurrencyAndLabel
                                                    id={'limitAmount'}
                                                    name={'stopPrice'}
                                                    onChange={(name, val) => {
                                                        setErrors({})
                                                        setIp(val)
                                                    }}
                                                    value={ip}
                                                    placeholder={'When entering more than one IP Address, please separate them with spaces'}
                                                    type={'text'}
                                                    disabled={false}
                                                    key={'limitAmount'}
                                                    readOnly={false}
                                                    currency={null}
                                                    // error={errors?.ip}
                                                    className={"InputTextStartCurrencyAndLabel"} />

                                                <Button btnText={"Confirm"} className='cardSuccessBtnSm' onClick={() => {
                                                    let IpRegx = /^(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/
                                                    let error = { ...errors }
                                                    let findIndex = formValue?.ipList?.findIndex((val) => (val == ip))
                                                    if (isEmpty(ip)) {
                                                        error['ip'] = 'Please enter trusted IP addresses.'
                                                        setErrors(error)
                                                        return false
                                                    }
                                                    if (!IpRegx.test(ip)) {
                                                        error['ip'] = 'Invalid IP address'
                                                        setErrors(error)
                                                        return false
                                                    }
                                                    if (findIndex != -1) {
                                                        error['ip'] = 'IP address already exists'
                                                        setErrors(error)
                                                        return false
                                                    }
                                                    setFormValue((prev) => ({
                                                        ...prev,
                                                        ipList: [...prev.ipList, ip], // adds ip to the existing list
                                                    }));
                                                    setErrors((pervRecord) => {
                                                        return { ...pervRecord, 'ip': '' }
                                                    })
                                                    setIp('')
                                                }} />
                                            </div>
                                            <p className={`text-danger mt-2`}> {errors?.ip} </p>
                                        </>
                                    }
                                </div>
                                {
                                    isShow &&
                                    <div className={`${styles.otpInputWrapper} otpInputWrapper mt-4`}>
                                        <p className={`${styles.formLabel} mb-2`}>
                                            {(userdetails.tfaType === "email" || "mobile") ? "Enter OTP" : "Enter 2FA Code"}
                                        </p>
                                        <div className="d-flex align-items-center">
                                            <OtpInput
                                                shouldAutoFocus={true}
                                                value={formValue?.otp}
                                                onChange={(e) => {
                                                    setErrors(prev => ({ ...prev, otp: '' }));
                                                    setFormValue(prev => ({ ...prev, otp: e }))
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
                                                userdetails?.tfaType === "email" &&
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

                                    </div>
                                }
                            </div>
                        </div>
                    </div>
                }
            </div>
        </>
    )
}

export default ApiManagementCard