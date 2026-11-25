/** PACKAGE IMPORT */

import React, { useState } from "react";
import { Modal } from "react-bootstrap";
import { IoClose } from "react-icons/io5";
import { Link, useNavigate } from "react-router-dom";
import "react-phone-input-2/lib/style.css";

/** LOCAL FILES IMPORT */

import styles from "../styles/affiliateModal.module.css";
import Button from "../../../components/Button/Button";
import { PasswordInput } from "../../../components/Input/InputFields";
import { useDispatch, useSelector } from "react-redux";

/** ACTIONS */
/** LOCAL FILES IMPORT */
import styled from "../../../pages/Auth/auth.module.css";
import { validatechangePassword } from "../../../pages/Validation/userValidation";
import { changePasswordHooks, loginHooks } from "../../../actions/userAction";
import { showToastMessage } from "../../../lib/toast";
import { AccessToken, IsAuth } from "../../../redux/action";
import { RemoveItemLocalStorageItem } from "../../../lib/storage";

const AffiliateChangePassword = (props) => {
  let dispatch = useDispatch();

  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errors, setErrors] = useState({});
  const [btndis, setBtnDis] = useState(false);

  let navigate = useNavigate();

  const close = () => {
    // BUG FIX: the modal stays mounted (only `show` toggles), so without
    // resetting this state here, reopening it kept showing the previous
    // attempt's validation errors and typed values.
    setOldPassword("");
    setNewPassword("");
    setConfirmPassword("");
    setErrors({});
    props.handleClose();
  };

  const onSubmit = async () => {
    try {
      // e.preventDefault()
      let reqData = {
        oldPassword: oldPassword,
        newPassword: newPassword,
        confirmPassword: confirmPassword,
        id: props?.userdetails?.userId,
      };
      // SECURITY FIX: removed console.log of sensitive client-side data (secretKey/password/OTP)
      const { status, errors } = await validatechangePassword(reqData);
      if (status) {
        setErrors(errors);
      } else {
        setBtnDis(true);
        const resp = await changePasswordHooks(
          reqData,
          props?.userdetails?.secretKey,
        );
        if (resp?.data?.success) {
          setBtnDis(false);
          setErrors({});
          showToastMessage(resp?.data?.message, "success");
          navigate("/login");
        } else if (!resp?.data?.success) {
          setBtnDis(false);
          setErrors(resp.data.errors);
          if (resp?.data?.message) {
            showToastMessage(resp?.data?.message, "error");
          }
        }
      }
    } catch (e) {
      console.log("Signup__Err", e);
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
          data-click-effect="none"
        >
          <IoClose />
        </button>
        <Modal.Header className={styles.modalPrimaryHeader}>
          <h4 className={`${styles.modalHeaderTitle} `}>Update Password</h4>
        </Modal.Header>
        <Modal.Body className={styles.modalPrimaryBody}>
          <PasswordInput
            label={"Old Password"}
            id="oldPassword"
            value={oldPassword}
            onChange={(e) => setOldPassword(e?.target?.value)}
            error={errors?.oldPassword}
          />
          <PasswordInput
            label={"Password"}
            id="newPassword"
            value={newPassword}
            onChange={(e) => setNewPassword(e?.target?.value)}
            error={errors?.newPassword}
            maxLength={16}
            showInfo
          />
          <PasswordInput
            label={"Confirm Password"}
            id="confirmPassword"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e?.target?.value)}
            error={errors?.confirmPassword}
            maxLength={16}
            showInfo
          />
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

export default AffiliateChangePassword;