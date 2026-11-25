/** PACKAGE IMPORT */

import React, { useEffect, useRef, useState } from "react";
import { Modal } from "react-bootstrap";
import { IoClose } from "react-icons/io5";
import PhoneInput from "react-phone-input-2";
import "react-phone-input-2/lib/style.css";

/** LOCAL FILES IMPORT */

import styles from "../styles/affiliateModal.module.css";
import Button from "../../../components/Button/Button";
import { InputComponent } from "../../../components/Input/InputFields";
import { validateUserSettings } from "../../../pages/Validation/userValidation";
import { updateUserSettingsHooks } from "../../../actions/userAction";
import { showToastMessage } from "../../../lib/toast";
/** ACTIONS */

const AffiliateChangeDisplayName = (props) => {
  let alpharegex = /^[A-Za-z\s]+$/;

  const initialValue = {
    firstName: "",
    lastName: "",
  };


  const [formValue, setFormValue] = useState(initialValue);
  const [errors, setErrors] = useState({});

  const { firstName, lastName } = formValue;

  useEffect(() => {
    if (props?.userdata) {
      setFormValue({ ...formValue, ...props?.userdata });
    }
  }, [props]);
  const close = () => {
    props.handleClose();
  };

  const handleChange = (e) => {
    try {
      const { id, value } = e?.target;
      setFormValue({ ...formValue, ...{ [id]: value } });
    } catch (e) {
      console.log("handleChange__Err", e);
    }
  };

  const updateName = async (e) => {
    try {
      let reqData = { firstName: firstName, lastName: lastName };
      const { status, errors } = await validateUserSettings(reqData);
      if (status) {
        setErrors(errors);
      } else {
        const formData = new FormData();
        formData.append("firstName", firstName);
        formData.append("type", "name");
        formData.append("lastName", lastName);
        const resp = await updateUserSettingsHooks(formData, props?.secretKey);
        if (resp?.data?.success) {
          showToastMessage(resp?.data?.message, "success");
          close();
        } else if (!resp?.data?.success) {
          if (resp?.data?.message) {
            setErrors(resp?.data?.error);
            showToastMessage(resp?.data?.message, "error");
          }
        }
      }
    } catch (e) {
      console.log("updateName__Err", e);
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
          <h4 className={`${styles.modalHeaderTitle} `}>Update Display Name</h4>
        </Modal.Header>
        <Modal.Body className={styles.modalPrimaryBody}>
          <InputComponent
            label={"First Name"}
            type="text"
            id="firstName"
            value={firstName}
            onChange={(e) => {
              if (alpharegex.test(e?.target?.value) || e?.target?.value == "") {
                handleChange(e);
              }
            }}
            error={errors.firstName}
          />
          <InputComponent
            label={"Last Name"}
            id="lastName"
            value={lastName}
            onChange={(e) => {
              if (alpharegex.test(e?.target?.value) || e?.target?.value == "") {
                handleChange(e);
              }
            }}
            error={errors.lastName}
          />
        </Modal.Body>
        <Modal.Footer className={`${styles.modalPrimaryFooter}`}>
          <div className={`${styles.modalFooterActions}`}>
            <Button
              isLoading={false}
              loadingText="Loading..."
              btnText="Submit"
              onClick={() => updateName()}
              className="cardSuccessBtnSm"
              selectedValue={null}
            />
          </div>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default AffiliateChangeDisplayName;
