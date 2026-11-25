/** PACKAGE IMPORT */

import React, { useEffect, useRef, useState } from "react";
import { Modal } from "react-bootstrap";
import { IoClose } from "react-icons/io5";
import PhoneInput from "react-phone-input-2";
import "react-phone-input-2/lib/style.css";

/** LOCAL FILES IMPORT */

import styles from "../styles/modal.module.css";
import styled from "../../../pages/Auth/auth.module.css";
import Button from "../../../components/Button/Button";
import { InputComponent } from "../../../components/Input/InputFields";
import { validateChangeEmail } from "../../../pages/Validation/userValidation";
import { requestEmailChangeHooks } from "../../../actions/userAction";
import { showToastMessage } from "../../../lib/toast";

/** ACTIONS */

const ChangeEmail = (props) => {
  const [requestedEmail, setRequestedEmail] = useState("");
  const [checkValue, setcheckValue] = useState(false);
  const [errors, setErrors] = useState({});
  const [btndis, setBtnDis] = useState(false);

  const onSubmit = async () => {
    try {
      let reqData = { requestedEmail: requestedEmail, checkValue: checkValue };
      const { status, errors } = await validateChangeEmail(reqData);
      if (status) {
        setErrors(errors);
      } else {
        setBtnDis(true);
        const resp = await requestEmailChangeHooks(reqData, props.secretKey);
        let result = resp?.data;
        if (result?.success) {
          close();
          showToastMessage(result?.message, "success");
          setBtnDis(false);
        } else {
          if (resp?.data?.message) {
            showToastMessage(result?.message, "error");
          }
          setBtnDis(false);
        }
      }
    } catch (e) {
      console.log("onSubmit__Err", e);
    }
  };

  const close = () => {
    setErrors({});
    setRequestedEmail("");
    setcheckValue(false);
    props.handleClose();
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
        <Modal.Header className={styles.modalPrimaryHeader}>
          <h4 className={`${styles.modalHeaderTitle} `}>Update Email</h4>
        </Modal.Header>
        <Modal.Body className={styles.modalPrimaryBody}>
          <InputComponent
            label={"Enter Email Address"}
            type="email"
            id="requestedEmail"
            value={requestedEmail}
            onChange={(e) => setRequestedEmail(e?.target?.value)}
            error={errors?.requestedEmail}
          />
          <div className={`${styles.emailNotePart} mt-4`}>
            <ul>
              <li>
                1. You must Verify your new Email Address by clicking the
                Confirmation Link sent to your New Email. This Step is Mandatory
                to complete the Email Change Process.
              </li>
              <li>
                2. Your Email Address will not be updated until you have
                Confirmed the New Email Address. Ensure you check your New Email
                & Complete the Verification Promptly.
              </li>
              <li>
                3. If you no longer have access to your Current Email Address,
                please contact our Customer Support Team for Assistance.
                (Additional Verification may be required.)
              </li>
              <li>
                4. Ensure that the New Email Address you provide is Valid &
                Active. Incorrect or Invalid Email Addresses will not receive
                the Confirmation Link.
              </li>
              <li>
                5. If you do not receive the Confirmation Email, please check
                your Spam or Junk Folder. You can request to resend the
                Confirmation Email if necessary..
              </li>
              <li>
                6. For your Account's Security, ensure that the New Email
                Address is not shared with Unauthorized Individuals. The Email
                change process includes Verification Steps to protect your
                Account.
              </li>
              <li>
                7. Once you click the Confirmation Link & Follow the
                Instructions, your Email Address should be updated immediately.
                You will receive a Notification confirming the Update.
              </li>
              <li>
                8. If you did not receive the Confirmation Email, please request
                a Resend from this Screen.
              </li>
              <li>
                9. If you encounter any Issues or need further Assistance,
                please Contact our Customer Support Team.
              </li>
            </ul>
          </div>
          <div className={styles.teamAndConditionPart}>
            <div className="custom-checkInput__container2 p-2">
              <label className="custom-checkInput__label mt-1">
                <input
                  type="checkbox"
                  id="teamAndCondition"
                  onChange={(e) => {
                    setcheckValue(e.target.checked);
                  }}
                  checked={checkValue}
                />
                <span className="custom-checkInput__checkmark"></span>
              </label>
              <label
                htmlFor="teamAndCondition"
                className="custom-checkInput__content2"
              >
                By checking this box, all existing API Key(s) on your master
                account and sub-accounts will be subject to Default Security
                Controls
              </label>
            </div>
          </div>
          {errors?.checkValue && (
            <p className={`text-danger mt-2`}>{errors?.checkValue}</p>
          )}
        </Modal.Body>
        <Modal.Footer className={`${styles.modalPrimaryFooter}`}>
          <div className={`${styles.modalFooterActions}`}>
            <Button
              isLoading={false}
              loadingText="Loading..."
              btnText="Submit"
              disabled={btndis}
              onClick={() => onSubmit()}
              className="cardSuccessBtnSm"
              selectedValue={null}
            />
          </div>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default ChangeEmail;
