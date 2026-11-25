import React, { useState, useRef } from "react";
import Button from "../../../components/Button/Button";
import Images from "../../../utils/Images";
import Webcam from "react-webcam";
import { verificationPanCardHooks } from "../../../actions/userAction";
import { useSelector } from "react-redux";
import Tesseract from "tesseract.js";
import { showToastMessage } from "../../../lib/toast";

function PancardCapture(props) {
  const { active, handleCapturePicture, handleConfirmPicture, handleActive } =
    props;
  // console.log("props active", active);
  const { userdetails } = useSelector((state) => state.user);

  const webcamRef = useRef(null);
  const [capturedImage, setCapturedImage] = useState(null);
  const [isChecking, setIsChecking] = useState(false);

  const base64ToFile = (base64String, filename = "selfie.jpg") => {
    const arr = base64String.split(",");
    const mime = arr[0].match(/:(.*?);/)[1];
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);

    while (n--) {
      u8arr[n] = bstr.charCodeAt(n);
    }

    return new File([u8arr], filename, { type: mime });
  };

  const capturePhoto = () => {
    // console.log('capture called')
    const img = webcamRef.current.getScreenshot();
    setCapturedImage(img);
  };

  // const uploadImage = async () => {
  //     // const getData = await verificationPanCardHooks({}, userdetails.secretKey);
  //     handleCaptured(capturedImage);
  //     setIsChecking(true);

  //     setTimeout(() => {
  //         setIsChecking(false);
  //         handleConfirmPicture();
  //     }, 2000);

  //     // closeModal();
  // };

  const uploadImage = async () => {
    if (!capturedImage) return;

    setIsChecking(true);

    try {
      const selfieFile = base64ToFile(capturedImage);
      const panCardData = {
        files: selfieFile, // matches backend
        kycType: "individual",
        type: "pan",
      };
      const result = await verificationPanCardHooks(
        panCardData,
        userdetails.secretKey,
      );


      if (result.data.success) {
        const { dob, name, pan, status } =
          result.data.result.data.verification_details;
        return handleConfirmPicture(dob, name, pan, status);
      } else {
        showToastMessage(result?.data?.message, "error");
      }
    } catch (error) {
    }

    setIsChecking(false);
  };

  const handleCaptured = (imgBase64) => {
    // console.log("Captured Image:", imgBase64);

    // Convert to blob and upload
    fetch(imgBase64)
      .then((res) => res.blob())
      .then((blob) => {
        const formData = new FormData();
        formData.append("panImage", blob, "pan.jpg");

        // send to backend
        // axios.post("/upload-pan", formData)
      });
  };

  return (
    <>
      {!isChecking ? (
        <div className="capture_panCard">
          <div className="">
            <h4 className="mb-2 pb-1 title-txt">
              {!capturedImage
                ? "Capture front side of PAN Card"
                : "Check your PAN Card for side photo"}
            </h4>
            <p className="sub-title-txt">
              {!capturedImage
                ? "Make sure the lighting is good and letters are clearly visible."
                : "Make sure the lighting is good and letters of your PAN Card are clearly visible."}
            </p>

            <div className="scanning_photo">
              {!capturedImage ? (
                <Webcam
                  audio={false}
                  ref={webcamRef}
                  screenshotFormat="image/jpeg"
                  videoConstraints={{ facingMode: "environment" }} // user - front camera  environment - back camera
                  className="cameraPic_src"
                />
              ) : (
                <img
                  src={capturedImage}
                  alt="Captured"
                  className="cameraPic_src"
                />
              )}
            </div>
          </div>
          <div className="btn_sec">
            {!capturedImage ? (
              <Button
                isLoading={false}
                // loadingText="Loading..."
                btnText="Capture Photo"
                className="cardSuccessBtnSm"
                // onClick={() => handleCapturePicture()}
                onClick={capturePhoto}
              />
            ) : (
              <>
                <Button
                  isLoading={false}
                  // loadingText="Loading..."
                  btnText="Use This Photo"
                  className="cardSuccessBtnSm"
                  // onClick={() => handleCapturePicture()}
                  onClick={uploadImage}
                />
                <div className="mt-3">
                  <Button
                    isLoading={false}
                    // loadingText="Loading..."
                    btnText="Retake Photo"
                    className="greenOutlineBtn"
                    onClick={() => setCapturedImage(null)}
                  />
                </div>
              </>
            )}
          </div>
        </div>
      ) : (
        <div className="checking_panCard">
          <div className="skeleton_loading">
            <img
              src={Images.panCardAvatar}
              alt="success"
              className="panCard_avatarSrc"
            />
            <div className="loader_section">
              <div className="spinner_loader"></div>
              <span>Checking your PAN Card</span>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default PancardCapture;