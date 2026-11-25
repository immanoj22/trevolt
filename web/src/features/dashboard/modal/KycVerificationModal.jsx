/** PACKAGE IMPORT */

import React, { useEffect, useRef, useState } from "react";
import { Modal } from "react-bootstrap";
// import { useSelector } from "react-redux";
import { IoClose } from "react-icons/io5";
import Form from 'react-bootstrap/Form';
import { GrFormPreviousLink } from "react-icons/gr";
import PhoneInput from "react-phone-input-2";
import "react-phone-input-2/lib/style.css";
import OtpInput from 'react-otp-input';
import Select from 'react-select'
import Lottie from "lottie-react";
import faceCapture from "../../../assets/json/face_capture.json";
import docScanning from "../../../assets/json/doc_scanning.json";
import verified from "../../../assets/json/verified.json";
import loader from "../../../assets/json/loader.json";


/** LOCAL FILES IMPORT */

import styles from "../styles/modal.module.css"
import Button from "../../../components/Button/Button";
import Images from "../../../utils/Images";
import { InputComponent } from "../../../components/Input/InputFields";
import PancardCapture from "../components/PancardCapture";
import VerifyPanDetails from "../components/VerifyPanDetails";
import SelfieCapture from "../components/SelfieCapture";
import DocAdditionalDetails from "../components/DocAdditionalDetails";
// import KycVerification from "../components/KycVerification";
import { useGlobalContext } from "../../../context/GlobalProvider";
import { useSelector } from "react-redux";
import { checkFaceLiveness, verificationPanCardHooks } from "../../../actions/userAction";
import { showToastMessage } from "../../../lib/toast";

/** ACTIONS */


const KycVerificationModal = (props) => {
    const { userdetails } = useSelector((state) => state.user);

    const { show, handleClose, handleShowKycSubmitted, isActiveModelNumber } = props;
    const { theme } = useGlobalContext();

    const [active, setActive] = useState(isActiveModelNumber);  //1
    const [checkingPan, setCheckingPan] = useState(false);
    const [cameraAccess, setCameraAccess] = useState(false);
    const [isLoader, setIsLoader] = useState(false);


    const [selectedFile, setSelectedFile] = useState(null);
    const [uploading, setUploading] = useState(false);
    const [error, setError] = useState("");

    const [panNumber, setPanNumber] = useState("");
    const [fullName, setFullName] = useState("");
    const [dateOfBirth, setDateOfBirth] = useState("");

    useEffect(() => {
        if (cameraAccess || isLoader) {
            setActive(0)
        }
    }, [cameraAccess, isLoader])


    const handleCapturePicture = (number) => {
        setIsLoader(true)
        setTimeout(() => {
            setIsLoader(false)
            setActive(number + 1)
        }, 1500)
    }

    const handleBack = (number) => {
        if (number == 1) return
        if (active === 4) {
            return setActive(2)
        }
        setActive(number)
    }

    const handleUploadDoc = async (e) => {

        setActive(0)
        setCheckingPan(true);
        setSelectedFile(e.target.files[0]);
        setError("");


        const panCardData = {
            files: e.target.files[0],
            kycType: "individual",
            type: "pan",
        };

        try {
            const result = await verificationPanCardHooks(panCardData, userdetails.secretKey);
            if (result.data.success) {
                const { dob, name, pan, status } = result.data.result.data.verification_details;
                if (status == "VALID") {
                    setPanNumber(pan);
                    setFullName(name);
                    setDateOfBirth(dob);
                    setTimeout(() => {
                        setCheckingPan(false)
                        setActive(active + 2)
                    }, 1500)
                } else {
                    setCheckingPan(false)
                    setError("Invalid PAN details, please upload a valid PAN card image.");
                }
            } else {
                showToastMessage(result?.data?.message, 'error')
            }
        } catch (err) {
            setError("Upload failed, please try again");
        } finally {
            setUploading(false);
        }

    }

    const handleConfirmPicture = (dob, name, pan, status) => {
        if (status == "VALID") {

            setPanNumber(pan);
            setFullName(name);
            setDateOfBirth(dob);
            setTimeout(() => {
                setCheckingPan(false)
                setActive(active + 1)
            }, 1500)
        } else {
            setCheckingPan(false)
            setError("Invalid PAN details, please upload a valid PAN card image.");
        }


    }


    const handleProceedSelfie = () => {
        setIsLoader(true)
        setTimeout(() => {
            setIsLoader(false)
            setActive(active + 1)
        }, 1500)
    }

    const handleVerifiedPan = () => {
        setIsLoader(true)
        setActive(active + 1)
        setTimeout(() => {
            setIsLoader(false)
            setActive(active + 1)
        }, 1500)
    }

    const handleGetAdditionalFeatures = async () => {
        setIsLoader(true)
        setTimeout(() => {
            setIsLoader(false)
            setActive(active + 1)
        }, 1500)
    }

    const handleAdditionalDetails = () => {
        setIsLoader(true);
        setTimeout(() => {
            setIsLoader(false)
            handleClose();
            handleShowKycSubmitted();
        }, 1500)
    }


    return (
        <div>
            <Modal
                centered
                size="md"
                backdrop="static"
                show={show}
                onHide={handleClose}
                className={styles.modalPrimary + " kycVerify_modal"}
            >

                {
                    ((active === 3) || (active === 4) || (active === 5) || (active === 6) || (active === 7)) &&
                    <button
                        aria-label="closeIcon"
                        className={styles.modalCloseButton + " " + styles.modalBackButton}
                        onClick={() => handleBack(active - 1)}
                    >
                        <GrFormPreviousLink />
                    </button>
                }


                <button
                    aria-label="closeIcon"
                    className={styles.modalCloseButton}
                    onClick={handleClose}
                >
                    <IoClose />
                </button>

                {/* <Modal.Header className={styles.modalPrimaryHeader}>
                    <h4 className={`${styles.modalHeaderTitle} `}>Add UPI</h4>
                </Modal.Header> */}
                <Modal.Body className={styles.modalPrimaryBody + " kycVerify_modal_body"}>

                    {/* Pan card checking loader */}

                    {
                        checkingPan &&
                        <div className="checking_panCard">
                            <div className="skeleton_loading">
                                <img src={Images.panCardAvatar} alt="success" className="panCard_avatarSrc" />
                                <div className="loader_section">
                                    <div className="spinner_loader"></div>
                                    <span>Checking your PAN Card</span>
                                </div>
                            </div>
                        </div>
                    }

                    {/* Camera access permission*/}

                    {
                        cameraAccess &&
                        <div className="provide_camera_access">
                            <div className="">
                                <h4 className="mb-2 pb-1 title-txt">Provide camera access</h4>
                                <p className="sub-title-txt">
                                    Follow the below steps to give camera access and continue with the onboarding.
                                </p>
                            </div>
                            <div>
                                <img
                                    src={
                                        theme === 'dark' ?
                                            Images.darkCameraAccess :
                                            Images.lightCameraAccess
                                    }
                                    alt="success"
                                    className="camera_accessSrc"
                                />
                            </div>

                            <div className="btn_sec">
                                <Button
                                    isLoading={false}
                                    // loadingText="Loading..."
                                    btnText="Retry Permission"
                                    className="cardSuccessBtnSm"
                                // onClick={() => handleActive(active + 1)}
                                />
                            </div>
                        </div>
                    }


                    {/* loader */}

                    {
                        isLoader &&
                        <div className="modal_loader">
                            <Lottie animationData={loader} loop={true} className="loader_src" />
                        </div>

                    }



                    {
                        active === 1 ?
                            <div className={"documentVerified"}>
                                <Lottie animationData={verified} loop={true} className="verified_src" />
                                <h4 className="text-center mb-2 title-txt">Document verified successfully</h4>
                                <p className="text-center sub-title-txt">You will be redirected in few seconds.</p>
                            </div> :
                            active === 2 ?
                                <div className="pancard_verification">
                                    <div className="">
                                        <h4 className="mb-2 pb-1 title-txt">PAN Card front side Capture Tips</h4>
                                        <p className="sub-title-txt">Ensure a clear picture of PAN Card to get approved faster.</p>
                                    </div>
                                    <div>
                                        <Lottie animationData={docScanning} loop={true} className="scanning_src" />
                                    </div>

                                    <div className="btn_sec">

                                        {/* Remove handleSubmit from here */}
                                        <Button
                                            isLoading={uploading}
                                            btnText="Capture Photo"
                                            className="cardSuccessBtnSm"
                                            onClick={() => { handleCapturePicture(2) }}
                                        />

                                        <div className="customUpload_file mt-3">
                                            <button className="btn">Upload Document</button>

                                            {/* Make sure this updates selectedFile */}
                                            <input
                                                type="file"
                                                name="myfile"
                                                accept="image/*"
                                                onChange={handleUploadDoc}
                                            />
                                        </div>

                                        {error && <p className="error-text">{error}</p>}
                                    </div>
                                </div>

                                : active === 3 ?
                                    <PancardCapture
                                        active={active}
                                        // handleCapturePicture={handleCapturePicture}
                                        handleConfirmPicture={handleConfirmPicture}
                                        panNumber={panNumber}
                                        fullName={fullName}
                                        dateOfBirth={dateOfBirth}
                                    />
                                    : active === 4 ?
                                        <VerifyPanDetails
                                            handleVerifiedPan={handleVerifiedPan}
                                            panNumber={panNumber}
                                            fullName={fullName}
                                            dateOfBirth={dateOfBirth}
                                        />
                                        : active === 5 ?
                                            <div className="selfie_guidance">
                                                <div className="">
                                                    <h4 className="mb-2 pb-1 title-txt">Take a Selfie</h4>
                                                    <p className="sub-title-txt">
                                                        Please remove spectacles, hat and mask. A clearly visible face will get approved faster.
                                                    </p>
                                                </div>
                                                <div>
                                                    <Lottie animationData={faceCapture} loop={true} className="scanning_src" />
                                                </div>

                                                <div className="btn_sec">
                                                    <Button
                                                        isLoading={false}
                                                        // loadingText="Loading..."
                                                        btnText="Proceed to Capture"
                                                        className="cardSuccessBtnSm"
                                                        onClick={handleProceedSelfie}
                                                    />
                                                </div>
                                            </div>
                                            : active === 6 ?
                                                <SelfieCapture
                                                    handleGetAdditionalFeatures={handleGetAdditionalFeatures}
                                                />
                                                : active === 7 ?
                                                    <DocAdditionalDetails
                                                        handleAdditionalDetails={handleAdditionalDetails}
                                                    />
                                                    : <></>

                    }

                </Modal.Body>
            </Modal>
        </div >
    );
};

export default KycVerificationModal;