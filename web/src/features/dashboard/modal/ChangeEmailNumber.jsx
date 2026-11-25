/** PACKAGE IMPORT */

import React, { useEffect, useRef, useState } from "react";
import { Modal } from "react-bootstrap";
import { useSelector } from "react-redux";
import { IoClose } from "react-icons/io5";
import PhoneInput from "react-phone-input-2";
import "react-phone-input-2/lib/style.css";
import OtpInput from "react-otp-input";

/** LOCAL FILES IMPORT */

import styles from "../styles/modal.module.css";
import Button from "../../../components/Button/Button";
import {
  confirmMobileNumberUpdateHooks,
  mobileVerificationCodeHooks,
  sendOldMobileOtpHooks,
  verifyMobileVerificationHooks,
  verifyOldMobileOtpCodeHooks,
} from "../../../actions/userAction";
import { showToastMessage } from "../../../lib/toast";

/** ACTIONS */

const ChangeEmailNumber = (props) => {
  const { userdetails } = useSelector((state) => state.user);

  const [error, setError] = useState({});
  const [email, setEmail] = useState("");
  const [countryCode, setCountryCode] = useState("");
  const [mobileNumber, setMobileNumber] = useState(0);
  const [otp, setOtp] = useState("");
  const [newOtp, setnewOtp] = useState("");
  const [changeNumberSteps, setChangeNumberSteps] = useState(1);
  let regex = /^[0-9]+$/;

  const close = () => {
    setError({});
    setEmail("");
    setCountryCode("");
    setMobileNumber("");
    setnewOtp("");
    setOtp("");
    setChangeNumberSteps(1);
    props.handleClose();
  };

  const handlePhoneNumber = (value, country) => {
    setError({});
    const { dialCode } = country;
    let newPhoneNo = value;
    setMobileNumber(newPhoneNo.slice(dialCode.length));
    setCountryCode(dialCode);
  };

  const getOldMobileOTP = async () => {
    try {
      if (!mobileNumber) {
        setError({ mobileNumber: "Please enter new mobile number" });
        return;
      }
      const getData = await sendOldMobileOtpHooks(
        {
          mobileNumber: mobileNumber,
          countryCode: countryCode,
        },
        userdetails.secretKey,
      );
      if (getData.success) {
        showToastMessage(getData.message, "success");
        setChangeNumberSteps("2");
        setError({});
      } else {
        setError(getData.errors);
        getData?.message && showToastMessage(getData.message, "error");
      }
    } catch (e) {
      console.log("getOldMobileOTP_err", e);
    }
  };

  const verifyOldMobileOtp = async () => {
    try {
      const getData = await verifyOldMobileOtpCodeHooks(
        {
          otp: otp,
        },
        userdetails.secretKey,
      );
      if (getData.success) {
        showToastMessage(getData.message, "success");
        setChangeNumberSteps(3);
        setError({});
      } else {
        setError(getData.errors);
        getData?.message && showToastMessage(getData.message, "error");
      }
    } catch (e) {
      console.log("verifyOldMobileOtp_err", e);
    }
  };
  const updateMobile = async () => {
    try {
      const getData = await confirmMobileNumberUpdateHooks(
        {
          otp: newOtp,
        },
        userdetails.secretKey,
      );
      if (getData.success) {
        showToastMessage(getData.message, "success");
        setChangeNumberSteps(4);
      } else {
        setError(getData.errors);
        getData?.message && showToastMessage(getData.message, "error");
      }
    } catch (e) {
      console.log("updateMobile__Err", e);
    }
  };

  const onConfirm = () => {
    try {
      close();
    } catch (err) {
      console.log(err, "onConfirm__err");
    }
  };

  return (
    <div>
      <Modal
        centered
        size="md"
        backdrop="static"
        show={props.show}
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

        {changeNumberSteps == 1 ? (
          <>
            <Modal.Header className={styles.modalPrimaryHeader}>
              <h4 className={`${styles.modalHeaderTitle} `}>
                {props.type == "email" ? "Update Email" : "Update Phone Number"}
              </h4>
            </Modal.Header>
            <Modal.Body className={styles.modalPrimaryBody}>
              <div className="">
                <div className="">
                  <p className={`${styles.formLabel}`}>
                    {props.type == "email" ? "New Email" : "New Phone Numbers"}
                  </p>

                  <div
                    className={`${styles.phoneInputContainer} phoneInputContainer mt-2`}
                  >
                    <PhoneInput
                      countryCodeEditable={false}
                      placeholder="Enter Phone Number"
                      country={"in"}
                      onChange={handlePhoneNumber}
                    />
                  </div>

                  <p className="text-danger mt-2">{error?.mobileNumber}</p>
                </div>

                <div className="mt-3">
                  <p className={`${styles.formLabel}`}>
                    {props.type == "email"
                      ? "Current Email"
                      : "Current Phone Number"}
                  </p>
                  <p className={`${styles.modalLabelWhite} p-2`}>
                    +{userdetails.countryCode}{" "}
                    {`xxxxx-xx${userdetails?.mobileNumber?.slice(-3)}`}
                  </p>
                </div>

                <div className={`${styles.tipsCard} min-h-50 mt-3`}>
                  <div>
                    <h3 className="fs18">Notes</h3>
                    <ul>
                      <li>
                        We'll send an OTP to your current number to verify it's
                        you.
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            </Modal.Body>

            <Modal.Footer className={`${styles.modalPrimaryFooter}`}>
              <div className={`${styles.modalFooterActions}`}>
                <Button
                  isLoading={false}
                  loadingText="Loading..."
                  btnText="Send OTP to current number"
                  onClick={() => getOldMobileOTP()}
                  className="cardSuccessBtnSm"
                  selectedValue={null}
                />
              </div>
            </Modal.Footer>
          </>
        ) : changeNumberSteps == 2 ? (
          <>
            <Modal.Header className={styles.modalPrimaryHeader}>
              <h4 className={`${styles.modalHeaderTitle} `}>
                {props.type == "email"
                  ? "Verify current Email"
                  : "Verify current number"}
              </h4>
            </Modal.Header>
            <Modal.Body className={styles.modalPrimaryBody}>
              <div className="">
                <div className="mt-3">
                  <p className={`${styles.formLabel}`}>
                    {props.type == "email"
                      ? "Verify current email"
                      : "Verify current number"}
                  </p>

                  <p className={`${styles.modalLabelWhite} p-2`}>
                    Code sent to{" "}
                    <b>
                      {" "}
                      +{userdetails.countryCode}{" "}
                      {`xxxxx-xx${userdetails?.mobileNumber?.slice(-3)}`}{" "}
                    </b>
                  </p>
                </div>

                <div className="mt-4">
                  <p className={`${styles.formLabel}`}>Enter OTP</p>

                  <div
                    className={`${styles.otpInputWrapper} otpInputWrapper mt-2`}
                  >
                    <OtpInput
                      shouldAutoFocus={true}
                      value={
                        otp
                          ? otp == "" || regex.test(otp)
                            ? otp
                            : otp == "" || regex.test(otp)
                              ? otp
                              : ""
                          : ""
                      }
                      onChange={(e) => {
                        setOtp(e);
                      }}
                      numInputs={6}
                      renderInput={(props) => <input {...props} />}
                    />
                  </div>

                  <p className="text-danger mt-2">{error?.otp}</p>
                </div>

                <div className={`${styles.tipsCard} min-h-50 mt-3`}>
                  <div>
                    <h3 className="fs18">Notes</h3>
                    <ul>
                      <li>
                        Once verified, we'll send an OTP to your new number.
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            </Modal.Body>

            <Modal.Footer className={`${styles.modalPrimaryFooter}`}>
              <div className={`${styles.modalFooterActions}`}>
                <Button
                  isLoading={false}
                  loadingText="Loading..."
                  btnText="Verify and send OTP to new number"
                  onClick={() => verifyOldMobileOtp()}
                  className="cardSuccessBtnSm"
                  selectedValue={null}
                />
              </div>
            </Modal.Footer>
          </>
        ) : changeNumberSteps === 3 ? (
          <>
            <Modal.Header className={styles.modalPrimaryHeader}>
              <h4 className={`${styles.modalHeaderTitle} `}>
                {props.type == "email"
                  ? "Verify new Email"
                  : "Verify new number"}
              </h4>
            </Modal.Header>
            <Modal.Body className={styles.modalPrimaryBody}>
              <div className="">
                <div className="mt-3">
                  <p className={`${styles.formLabel}`}>
                    {props.type == "email"
                      ? "Verify new email"
                      : "Verify new number"}
                  </p>

                  <p className={`${styles.modalLabelWhite} p-2`}>
                    Code sent to{" "}
                    <b>
                      +{countryCode} {`xxxxx-xx${mobileNumber?.slice(-3)}`}
                    </b>
                  </p>
                </div>

                <div className="mt-4">
                  <p className={`${styles.formLabel}`}>Enter OTP</p>

                  <div
                    className={`${styles.otpInputWrapper} otpInputWrapper mt-2`}
                  >
                    <OtpInput
                      shouldAutoFocus={true}
                      value={
                        newOtp
                          ? newOtp == "" || regex.test(newOtp)
                            ? newOtp
                            : newOtp == "" || regex.test(newOtp)
                              ? newOtp
                              : ""
                          : ""
                      }
                      onChange={(e) => {
                        setnewOtp(e);
                      }}
                      numInputs={6}
                      renderInput={(props) => <input {...props} />}
                    />
                  </div>

                  <p className="text-danger mt-2">{error?.otp}</p>
                </div>
              </div>
            </Modal.Body>

            <Modal.Footer className={`${styles.modalPrimaryFooter}`}>
              <div className={`${styles.modalFooterActions}`}>
                <Button
                  isLoading={false}
                  loadingText="Loading..."
                  btnText="Confirm"
                  onClick={() => updateMobile()}
                  className="cardSuccessBtnSm"
                  selectedValue={null}
                />
              </div>
            </Modal.Footer>
          </>
        ) : changeNumberSteps === 4 ? (
          <>
            <Modal.Header className={styles.modalPrimaryHeader}>
              <h4 className={`${styles.modalHeaderTitle} `}>
                {props.type == "email"
                  ? "Verify new Email"
                  : "Verify new number"}
              </h4>
            </Modal.Header>
            <Modal.Body className={styles.modalPrimaryBody}>
              <div className="">
                <div className={`${styles.tipsCard} min-h-50 mt-3`}>
                  <div>
                    <h3 className="fs18 text-center">Phone number updated</h3>
                    <ul>
                      <li className="text-center">
                        +{countryCode} {mobileNumber} is now your verified
                        number.
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            </Modal.Body>

            <Modal.Footer className={`${styles.modalPrimaryFooter}`}>
              <div className={`${styles.modalFooterActions}`}>
                <Button
                  isLoading={false}
                  loadingText="Loading..."
                  btnText="Confirm"
                  onClick={() => onConfirm()}
                  className="cardSuccessBtnSm"
                  selectedValue={null}
                />
              </div>
            </Modal.Footer>
          </>
        ) : (
          <></>
        )}
      </Modal>
    </div>
  );
};

export default ChangeEmailNumber;
