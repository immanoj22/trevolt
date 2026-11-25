import React, { useState, useRef } from "react";
import Button from "../../../components/Button/Button";
import Images from "../../../utils/Images";
import Webcam from "react-webcam";
import { checkFaceLiveness } from "../../../actions/userAction";
import { useSelector } from "react-redux";
import { showToastMessage } from "../../../lib/toast";

function SelfieCapture(props) {
  const { userdetails } = useSelector((state) => state.user);

  const { handleGetAdditionalFeatures } = props;
  // console.log("props active", active);
  const webcamRef = useRef(null);
  const [capturedImage, setCapturedImage] = useState(null);
  const [isChecking, setIsChecking] = useState(false);

  const capturePhoto = () => {
    // console.log('capture called')
    const img = webcamRef.current.getScreenshot();
    setCapturedImage(img);
  };

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

  const uploadImage = async () => {
    if (!capturedImage) return;

    setIsChecking(true);

    try {
      // 1) convert base64 to a File
      const selfieFile = base64ToFile(capturedImage);

      const faceLivenessData = {
        image: selfieFile, // matches backend
        kycType: "individual",
        type: "pan",
      };

      const result = await checkFaceLiveness(faceLivenessData, userdetails.secretKey);

      if (result.data.success) {
        // const { gender: { value }, liveness, liveness_score } = result.data.result.data;
        // console.log("Face Liveness Result:", value, liveness, liveness_score);
        // setActive(active + 1)
        handleGetAdditionalFeatures();
      } else {
        showToastMessage(result?.data?.message, "error");
      }
    } catch (error) {
    } finally {
      setIsChecking(false);
    }
  };

  const handleCaptured = (imgBase64) => {
  };

  return (
    <>
      {!isChecking ? (
        <div className="capture_selfie">
          <div className="">
            <p className="sub-title-txt text-center">Please stay still</p>

            {!capturedImage ? (
              <div className="d-flex">
                <Webcam
                  audio={false}
                  ref={webcamRef}
                  screenshotFormat="image/jpeg"
                  videoConstraints={{ facingMode: "user" }} // user - front camera  environment - back camera
                  className="cameraPic_src"
                />
              </div>
            ) : (
              <img
                src={capturedImage}
                alt="Captured"
                className="cameraPic_src"
              />
            )}
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
        <div className="checking_selfie">
          <p className="sub-title-txt text-center">Verifying</p>

          <div className="selfie_skeleton_loading">
            <img
              src={capturedImage}
              alt="success"
              className="panCard_avatarSrc"
            />
            <div className="loader_section">
              <div className="spinner-loader"></div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default SelfieCapture;