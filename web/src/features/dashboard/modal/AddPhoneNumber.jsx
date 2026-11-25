/** PACKAGE IMPORT */

import React, { useEffect, useRef, useState } from "react";
import { Modal } from "react-bootstrap";
import { useSelector } from "react-redux";
import { IoClose } from "react-icons/io5";
import PhoneInput from "react-phone-input-2";
import "react-phone-input-2/lib/style.css";
import OtpInput from 'react-otp-input';

/** LOCAL FILES IMPORT */

import styles from "../styles/modal.module.css"
import Button from "../../../components/Button/Button";
import { confirmMobileNumberUpdateHooks, mobileVerificationCodeHooks, verifyMobileVerificationHooks } from "../../../actions/userAction";
import { showToastMessage } from "../../../lib/toast";
// import { newMobileOtp, updateMobileNumber, updateUserEmail } from "../actions/userAction";


/** ACTIONS */


const AddPhoneNumber = (props) => {

  const { userdetails } = useSelector((state) => state.user);

  const [error, setError] = useState({});
  const [email, setEmail] = useState("");
  const [countryCode, setCountryCode] = useState("91");
  const [mobileNumber, setMobileNumber] = useState("");
  const [otp, setOtp] = useState("");
  const [isOtpSend, setisOtpSend] = useState(false);
  const [isLoading, setisLoading] = useState(false);
  const [isSubmitLoading, setisSubmitLoading] = useState(false);

  const { type = '' } = props

  let regex = /^[0-9]+$/;

  const close = () => {
    setError({}); setEmail("")
    props.handleClose();
  }

  const handlePhoneNumber = (value, country) => {
    const { dialCode } = country;
    let newPhoneNo = value;

    setMobileNumber(newPhoneNo.slice(dialCode.length));
    setCountryCode(dialCode);
    if (error?.mobileNumber) {
      setError((prev) => ({ ...prev, mobileNumber: "" }));
    }
  }

  const getNewOtp = async () => {
    if (!mobileNumber) {
      setError({ mobileNumber: "Please enter your new mobile number" });
      return;
    }
    try {
      setisLoading(true)
      const getData = await mobileVerificationCodeHooks({
        mobileNumber: mobileNumber,
        countryCode: countryCode
      }, userdetails.secretKey);
      // SECURITY FIX: removed console.log of sensitive client-side data (secretKey/password/OTP)
      if (getData.success) {
        setisLoading(false)
        setisOtpSend(true)
        showToastMessage(getData.message, 'success');
      } else {
        setisLoading(false)
        setError(getData.errors)
        getData?.message && showToastMessage(getData.message, 'error');
      }
    } catch (e) {
      console.log("getNewOtp_err", e);
    }
  }

  const updateMobile = async () => {
    // BUG FIX: Submit called verifyMobileVerificationHooks unconditionally,
    // with no client-side check first — clicking it with nothing entered
    // (no mobile number, no OTP requested/typed) silently fired the API
    // call with empty fields and showed no error at all. Validate the same
    // fields getNewOtp() already validates before requesting an OTP, so a
    // blank submit is caught immediately and consistently either way.
    if (!mobileNumber) {
      setError({ mobileNumber: "Please enter your new mobile number" });
      return;
    }
    if (!otp) {
      setError({ otp: "Please enter the OTP" });
      return;
    }
    try {
      setisSubmitLoading(true)
      const getData = await verifyMobileVerificationHooks({
        mobileNumber: mobileNumber,
        countryCode: countryCode,
        otp: otp
      }, userdetails.secretKey);
      if (getData.success) {
        setisSubmitLoading(false)
        if (type == 'mobile-verification') {
          showToastMessage("Mobile number verified successfully", 'success');
        } else {
          showToastMessage(getData.message, 'success');
        }

        close();
        props?.handleNumberVerified();
      } else {
        setisSubmitLoading(false)
        setisOtpSend(false)
        setError(getData.errors)
        if (getData?.message) {
          showToastMessage(getData.message, 'error');
          if (getData.message.includes("Mobile number verified successfully")) {
            close();
            props?.handleNumberVerified();
          }
        }

      }
    } catch (e) {
      console.log("updateMobile__Err", e);
    }
  }

  return (
    <div>
      <Modal
        centered
        size="md"
        backdrop="static"
        show={props.show}
        // show={true}
        onHide={close}
        className={styles.modalPrimary}
      >
        <button
          aria-label="closeIcon"
          className={styles.modalCloseButton}
          onClick={close}
        >
          <IoClose />
        </button>
        <Modal.Header className={styles.modalPrimaryHeader}>
          <h4 className={`${styles.modalHeaderTitle} `}>{props.type == "email" ?
            "Change Email" : type == 'mobile-verification' ?
              "Verify Phone Number" :
              "Change Phone Number"
          }
          </h4>
        </Modal.Header>
        <Modal.Body className={styles.modalPrimaryBody}>
          <div className="">
            <div className="">
              <p className={`${styles.formLabel}`}>{props.type == "email" ? "New Email" : "New Phone Number"}</p>

              <div className={`${styles.phoneInputContainer} phoneInputContainer mt-2`}>
                <PhoneInput
                  countryCodeEditable={false}
                  placeholder="Enter Phone Number"
                  country={"in"}
                  onChange={handlePhoneNumber}
                />
                <Button
                  disabled={isOtpSend}
                  isLoading={isLoading}
                  loadingText="Loading..."
                  btnText="Get OTP"
                  onClick={() => getNewOtp()}
                  className="cardSuccessBtnXs"
                  selectedValue={null}
                />
              </div>

              <p className="text-danger mt-2">
                {error?.mobileNumber}
              </p>
            </div>

            {/* <div className="col-12">
                            <p className="text_gray_sm">Enter Otp</p>
                            <div className="input-group ">
                                <input
                                    type="number"
                                    className="modal_input w-100 px-0"
                                    placeholder="Enter Otp"
                                    aria-label="Recipient's username"
                                    aria-describedby="basic-addon2"

                                />

                            </div>
                            <span className="text-danger f-12 d-block text-left mt-2">
                                {error?.otp}
                            </span>
                        </div> */}
            <div className="mt-4">
              <p className={`${styles.formLabel}`}>Enter OTP</p>

              <div className={`${styles.otpInputWrapper} otpInputWrapper mt-2`}>
                <OtpInput
                  shouldAutoFocus={true}
                  value={otp ? (otp == "" || regex.test(otp)) ? otp : (otp == "" || regex.test(otp)) ? otp : "" : ""}
                  onChange={(e) => {
                    setOtp(e);
                    if (error?.otp) {
                      setError((prev) => ({ ...prev, otp: "" }));
                    }
                  }}
                  numInputs={6}
                  renderInput={(props) => <input {...props} />}
                />

              </div>

              <p className="text-danger mt-2">
                {error?.otp}
              </p>
            </div>

          </div>
        </Modal.Body>

        <Modal.Footer className={`${styles.modalPrimaryFooter}`}>
          <div className={`${styles.modalFooterActions}`}>
            <Button
              // disabled = {}
              isLoading={isSubmitLoading}
              loadingText="Loading..."
              btnText="Submit"
              onClick={() => updateMobile()}
              className="cardSuccessBtnSm"
              selectedValue={null}
            />
          </div>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default AddPhoneNumber;