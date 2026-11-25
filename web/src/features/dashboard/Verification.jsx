/** PACKAGE IMPORT */

import React, { useRef, useState } from 'react'
import Select from 'react-select'
import { MdOutlineFileUpload } from "react-icons/md";
import { IoMdClose } from "react-icons/io";
import { useSelector } from 'react-redux';


/** LOCAL FILES IMPORT */

import styles from "./styles/authInnerPage.module.css"
import Button from '../../components/Button/Button'
import { validateKycVerification } from '../../pages/Validation/userValidation';
import { createCashfreeRequest, internalVerificationHooks, verificationStatus } from '../../actions/userAction';
import { showToastMessage } from '../../lib/toast';


/** LOCAL FILES IMPORT */
import styled from "../../pages/Auth/auth.module.css"
import { useEffect } from 'react';


/** CODE START */
import { imageValidation } from '../../pages/Validation/userValidation';
import { object } from 'yup';
import { DigioKyc } from '../digio/pages/digioKyc';
import isEmpty from 'is-empty';
import VerificationCard from './components/VerificationCard';


const Verification = () => {

    const [currentVerifyStep, setCurrentVerifyStep] = useState(1)
    const [isFrontSideUploaded, setIsFrontSideUploaded] = useState(null)
    const [isBackSideUploaded, setIsBackSideUploaded] = useState(null);
    const [type, setType] = useState("");
    const [kycType, setKycType] = useState("");
    const [frontImage, setFrontImage] = useState(""); // Its default empty string because of validate through the typeof
    const [backImage, setBackImage] = useState(""); // Its default empty string because of validate through the typeof
    const [errors, setErrors] = useState({});
    const [disBtn, setDisBtn] = useState(false);
    const [show, setShow] = useState(false);


    const { userdetails } = useSelector((state) => state.user);
    const uploadFrontInputRef = useRef(null)
    const uploadBackInputRef = useRef(null)

    const Options = [
        { value: 'individual', label: 'Individual' },
        { value: 'entity', label: 'Entity' },
    ];
    const proofOptions = [
        { value: 'aadhaar', label: 'AadharCard' },
        { value: 'pan', label: 'PanCard' },
        { value: 'voterid', label: 'VoterID' },
        { value: 'passport', label: 'Passport' },
    ];

    const handleVerify = (step) => {
        setCurrentVerifyStep(step);
        if (step == 1) {
            setFrontImage("");
            setBackImage("");
            setType("");
            setKycType("")
        }
    }

    const handleFrontSideUpload = (item) => {
        uploadFrontInputRef.current.click();

    }
    const handleBackSideUpload = (item) => {
        uploadBackInputRef.current.click()
    }

    const handleFrontUploadChange = async (e) => {
        const uploadFiles = e.target.files[0];
        if (uploadFiles) {
            let validate = await imageValidation(uploadFiles);
            if (validate?.status) {
                setErrors({ ...errors, ...{ 'frontImage': validate?.errors } })
            } else {
                let arrofObj = errors;
                if (arrofObj.frontImage) {
                    delete arrofObj.frontImage;
                }
                setErrors({ ...arrofObj })
                setIsFrontSideUploaded(URL.createObjectURL(uploadFiles));
                setFrontImage(uploadFiles);
            }
        }
        e.target.value = "";
    }

    const handleBackUploadChange = async (e) => {
        const uploadFiles = e.target.files[0]
        if (uploadFiles) {
            let validate = await imageValidation(uploadFiles);
            if (validate?.status) {
                setErrors({ ...errors, ...{ 'backImage': validate?.errors } })
            } else {
                let arrofObj = errors;
                if (arrofObj.backImage) {
                    delete arrofObj.backImage;
                }
                setErrors({ ...arrofObj })
                setIsBackSideUploaded(URL.createObjectURL(uploadFiles));
                setBackImage(uploadFiles)
            }
        }
        e.target.value = '';
    }

    const handleFrontImageRemove = () => {
        setIsFrontSideUploaded(null);
        setFrontImage("")
    }
    const handleBackImageRemove = () => {
        setIsBackSideUploaded(null);
        setBackImage("")
    }



    const verifyValidataion = async () => {
        try {
            let validateData = { step: currentVerifyStep, type: type.value, kycType: kycType.value, frontImage: isFrontSideUploaded, backImage: isBackSideUploaded };
            const { status, errors } = await validateKycVerification(validateData);
            if (status) {
                setErrors(errors);
            } else {
                handleVerify(currentVerifyStep + 1)
            }

        } catch (e) {
            console.log("verifyValidataion__Err", e)
        }
    }



    const onSubmit = async () => {
        try {
            if ((typeof frontImage != "string") &&
                (typeof backImage != "string")) {
                const verificationData = {
                    type: type.value,
                    kycType: kycType.value,
                    countryCode: userdetails?.countryCode,
                    mobileNumber: userdetails?.mobileNumber,
                    attachments: [frontImage, backImage],
                };
                const resp = await internalVerificationHooks(verificationData, userdetails?.secretKey);
                if (resp?.data?.success) {
                    showToastMessage(resp?.data?.message, "success");
                    handleVerify(currentVerifyStep + 1)
                } else if (!resp?.data?.success) {
                    if (resp?.data?.message) {
                        showToastMessage(resp?.data?.message, "error")
                    }
                }
            } else {
                let errors = {}
                if ((typeof frontImage == "string")) {
                    errors['frontImage'] = 'Front image is required'
                }
                if ((typeof backImage == "string")) {
                    errors['backImage'] = 'Back image is required'
                }
                setErrors(errors)
            }
        } catch (e) {
            console.log("onSubmit__Err", e)
        }
    }



    const onChangeVerify = async (name, value) => {
        try {
            let validate = {}
            if (name == "type") {
                validate = { step: 1, "type": value.value, kycType: kycType.value };
            } else {
                validate = { step: 1, type: type.value, "kycType": value.value };
            }
            let { status, errors } = await validateKycVerification(validate);
            if (status) {
                if (Object.values(errors).length == 2) {
                    setErrors(errors);
                }

            } else {
                setErrors({});
            }
        } catch (e) {
            console.log("onChangeVerify__Err", e);
        }
    }

    useEffect(() => {
        window.scrollTo({
            top: 0,
            behavior: "smooth",
        });

    }, []);

    useEffect(() => {
        if (userdetails?.kycStatus) {
            let kycStatus = userdetails?.kycStatus;
            if ((kycStatus == "pending" || kycStatus == "rejected" || kycStatus == "success")) {
                handleVerify(3)
            }
        }

    }, [userdetails])
    return (
        <div>
            {(currentVerifyStep == 1 && (userdetails?.kycStatus == "rejected" || userdetails?.kycStatus == "notVerified")) ?
                <>
                    <div className={styles.cardHeader}>
                        <h5 className={styles.pageTitle}>Verification</h5>

                    </div>
                    {/* <div className={`${styles.cardMaxWidthMd} mt-4`}>
                        <div className={styles.singleFormWrapper}>
                            <p className={styles.singleFormLabel}>
                                KYC Type
                            </p>
                            <div className={``}>
                                <Select
                                    isSearchable={false}
                                    placeholder="Select Type"
                                    classNamePrefix="react-select__secondary"
                                    options={
                                        Options
                                    }
                                    value={kycType}
                                    onChange={(e) => { setKycType(e); onChangeVerify("kycType", e) }}

                                />
                            </div>
                            {errors?.kycType && <p className={`text-danger mt-2`}>{errors?.kycType}</p>}
                        </div>
                        <div className={`${styles.singleFormWrapper} mt-4`}>
                            <p className={styles.singleFormLabel}>
                                ID Type
                            </p>
                            <div className={``}>
                                <Select
                                    // menuIsOpen
                                    isSearchable={false}
                                    placeholder="Select ID Type"
                                    classNamePrefix="react-select__secondary"
                                    value={type}
                                    options={
                                        proofOptions
                                    }
                                    onChange={(e) => { setType(e); onChangeVerify("type", e) }}

                                />
                            </div>
                            {errors?.type && <p className={`text-danger mt-2`}>{errors?.type}</p>}
                        </div>
                        <div className={`mt-5`}>
                            <Button
                                isLoading={false}
                                loadingText="Redirecting..."
                                btnText="Continue"
                                onClick={() => verifyValidataion()}
                                className="cardSuccessBtn"
                                selectedValue={null}
                            />
                        </div>


                    </div> */}
                </>
                //  :
                // currentVerifyStep == 2 ?
                //     <>
                //         <div className={styles.cardHeader}>
                //             <h5 className={styles.pageTitle}>Verification</h5>
                //             <Button
                //                 isLoading={false}
                //                 loadingText="Redirecting..."
                //                 btnText="Back"
                //                 onClick={() => console.log('back')}
                //                 className="backBtn"
                //                 selectedValue={null}
                //             />
                //         </div>
                //         <div className={`${styles.cardMaxWidthMd} mt-4`}>

                //             <div className={styles.singleFormWrapper}>
                //                 <p className={styles.singleFormLabel}>
                //                     Enter 16 Digit Aadhar card no
                //                 </p>
                //                 <input type="text" className={styles.singleFormInput} placeholder='Enter your id number' />
                //             </div>

                //             <div className={`mt-5`}>
                //                 <Button
                //                     isLoading={false}
                //                     loadingText="Redirecting..."
                //                     btnText="Continue"
                //                     onClick={() => handleVerify(3)}
                //                     className="cardSuccessBtn"
                //                     selectedValue={null}
                //                 />
                //             </div>
                //         </div>
                //     </>
                :
                currentVerifyStep == 2 && (userdetails?.kycStatus == "rejected" || userdetails?.kycStatus == "notVerified") ?
                    <>
                        <div className={styles.cardHeader}>
                            <h5 className={styles.pageTitle}>Verification</h5>
                            <Button
                                isLoading={false}
                                loadingText="Redirecting..."
                                btnText="Back"
                                onClick={() => { handleVerify(currentVerifyStep - 1); setFrontImage(""); setBackImage(""); setIsFrontSideUploaded(null); setIsBackSideUploaded(null) }}
                                className="backBtn"
                                selectedValue={null}
                            />
                        </div>
                        <div className={`${styles.cardMaxWidthMd} mt-4`}>
                            <div className={styles.singleFormWrapper}>
                                <p className={styles.singleFormLabel}>
                                    Front side picture
                                </p>
                                <div
                                    className={styles.proofImageUploadContainer}
                                >
                                    {isFrontSideUploaded ?
                                        <div className={styles.proofUploadedContainer}>
                                            <div className={styles.proofUploadedTop}>
                                                <div className={styles.proofUploadedLeft}>
                                                    <img
                                                        src={isFrontSideUploaded}
                                                        alt="proof"
                                                        className={styles.proofUploadedImage} />
                                                    <div className={styles.proofUploadedDetails}>
                                                        <p className={styles.proofUploadedName}>{frontImage?.name}</p>
                                                        {/* <p className={styles.proofUploadedSize}>2.52 MB</p> */}
                                                    </div>
                                                </div>
                                                <button aria-label='closeIcon' className={styles.proofUploadedCancel} onClick={handleFrontImageRemove}>
                                                    <IoMdClose />
                                                </button>
                                                <p></p>
                                            </div>
                                            <div className='mt-4'>
                                                <Button
                                                    isLoading={false}
                                                    loadingText="Redirecting..."
                                                    btnText="Edit Image"
                                                    onClick={handleFrontSideUpload}
                                                    className="cardBtnRectangleXs"
                                                    selectedValue={null}
                                                />
                                            </div>
                                        </div>
                                        : <div className={styles.proofUploadedBefore} onClick={() => handleFrontSideUpload()}>
                                            <MdOutlineFileUpload fontSize={30} />
                                            <span>Upload</span>
                                        </div>}

                                    <input
                                        type="file"
                                        className={`d-none`}
                                        ref={uploadFrontInputRef}
                                        onChange={(e) => handleFrontUploadChange(e)} />
                                </div>
                                {errors?.frontImage && <p className={`${styled.formError} mt-2`}>{errors?.frontImage}</p>}
                            </div>
                            <div className={`${styles.singleFormWrapper} mt-4`}>
                                <p className={styles.singleFormLabel}>
                                    Back side picture
                                </p>
                                <div
                                    className={styles.proofImageUploadContainer}
                                >
                                    {isBackSideUploaded ?
                                        <div className={styles.proofUploadedContainer}>
                                            <div className={styles.proofUploadedTop}>
                                                <div className={styles.proofUploadedLeft}>
                                                    <img
                                                        src={isBackSideUploaded}
                                                        alt="proof"
                                                        className={styles.proofUploadedImage} />
                                                    <div className={styles.proofUploadedDetails}>
                                                        <p className={styles.proofUploadedName}>{backImage?.name}</p>
                                                        {/* <p className={styles.proofUploadedSize}>2.52 MB</p> */}
                                                    </div>
                                                </div>
                                                <button aria-label='closeIcon' className={styles.proofUploadedCancel} onClick={handleBackImageRemove}>
                                                    <IoMdClose />
                                                </button>
                                            </div>
                                            <div className='mt-4'>
                                                <Button
                                                    isLoading={false}
                                                    loadingText="Redirecting..."
                                                    btnText="Edit Image"
                                                    onClick={handleBackSideUpload}
                                                    className="cardBtnRectangleXs"
                                                    selectedValue={null}
                                                />
                                            </div>
                                        </div>
                                        : <div className={styles.proofUploadedBefore} onClick={() => handleBackSideUpload()}>
                                            <MdOutlineFileUpload fontSize={30} />
                                            <span>Upload</span>
                                        </div>}

                                    <input
                                        type="file"
                                        className={`d-none`}
                                        ref={uploadBackInputRef}
                                        onChange={(e) => handleBackUploadChange(e)} />
                                </div>
                                {errors?.backImage && <p className={`${styled.formError} mt-2`}>{errors?.backImage}</p>}
                            </div>

                            <div className={`mt-5`}>
                                <Button
                                    isLoading={false}
                                    loadingText="Redirecting..."
                                    btnText={["approved"].includes(userdetails?.kycAadharStatus) ?
                                        ["approved"].includes(userdetails?.kycPanCardStatus) ?
                                            ["approved"].includes(userdetails?.kycLiveNessStatus) ?
                                                (userdetails?.kycStatus == "approved" && userdetails?.externalKycStatus == "approved")
                                                    ? "Verified" :
                                                    "Verified" : "Liveness Verification" : "PAN Verification" : "Continue"}
                                    onClick={() => onSubmit()}
                                    className="cardSuccessBtn"
                                    selectedValue={null}
                                />
                            </div>
                        </div>x
                    </>
                    :
                    <>
                        <div className={styles.cardHeader}>
                            <h5 className={styles.pageTitle}>Verification</h5>
                            {/* <Button
                                isLoading={false}
                                loadingText="Redirecting..."
                                btnText="Back"
                                onClick={() => { handleVerify(2) }}
                                className="backBtn"
                                selectedValue={null}
                            /> */}
                        </div>

                    </>

            }
            <div className='row'>
                {/* <div className={`${styles.singleFormWrapper} col-md-6  mt-4`}>
                    <p className={styles.singleFormLabel}>
                        Document Is Under Review :
                    </p>
                    <div className={styles.cardMaxWidthLg}>
                        <div className={styles.singleFormView}>
                            <p>{userdetails?.kycStatus == "pending" ? "Your document is under review by the admin. Once approved, your dashboard will be created automatically." :
                                userdetails?.kycStatus == "rejected" ? userdetails?.reason :
                                    userdetails?.kycStatus == "approved" && "Your identity has been successfully verified. Your dashboard is now active and fully accessible."}</p>

                            <div className='flexBetween  mt-5'>
                                <div className={`${styles.statusView}`}>
                                    Status :<span className={userdetails?.kycStatus == "approved" ? `${styles.approved} ms-2` : (userdetails?.kycStatus == "pending" || userdetails?.kycStatus == "rejected") && `${styles.pending} ms-2`}>{userdetails?.kycStatus}</span>
                                </div>
                                {userdetails?.kycStatus == "rejected" && <Button
                                    isLoading={false}
                                    loadingText="Redirecting..."
                                    btnText="Resubmit"
                                    onClick={() => { handleVerify(1) }}
                                    className="cardSuccessBtn"
                                    selectedValue={null}
                                />}
                            </div>

                        </div>

                    </div>
                </div> */}

                <VerificationCard />
            </div>

        </div>
    )
}

export default Verification
