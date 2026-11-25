/** PACKAGE IMPORT */

import React, { useEffect, useRef, useState } from "react";
import { Modal } from "react-bootstrap";
import { IoClose } from "react-icons/io5";
import PhoneInput from "react-phone-input-2";
import "react-phone-input-2/lib/style.css";

/** LOCAL FILES IMPORT */

import styles from "../styles/modal.module.css";
import Button from "../../../components/Button/Button";
import { InputComponent } from "../../../components/Input/InputFields";
import { validateUserSettings } from "../../../pages/Validation/userValidation";
import styled from "../../../pages/Auth/auth.module.css";
import { updateUserSettingsHooks } from "../../../actions/userAction";
import { showToastMessage } from "../../../lib/toast";
import isEmpty from "is-empty";
import { useSelector } from "react-redux";
import Swal from "sweetalert2";
import { useGlobalContext } from "../../../context/GlobalProvider";
/** ACTIONS */

const ChangeDisplayName = (props) => {
  const { theme } = useGlobalContext();
  const { userdetails } = useSelector((state) => state.user);
  let alpharegex = /^[A-Za-z\s]+$/;
  const noSpaceRegex = /^\S+$/;

  const initialValue = {
    firstName: "",
    lastName: "",
    userName: "",
  };


  const [formValue, setFormValue] = useState(initialValue);
  const [errors, setErrors] = useState({});

  const { firstName, lastName, userName } = formValue;

  // useEffect(() => {
  //     // console.log("props?.userdataprops?.userdata", !isEmpty(props?.userdata), firstName === '', lastName === '')
  //     if (!isEmpty(props?.userdata) && isEmpty(firstName) && isEmpty(lastName)) {
  //         setFormValue({ ...formValue, ...{ firstName: props?.userdata?.firstName, lastName: props?.userdata?.lastName } })
  //     }
  // }, [props]);

  useEffect(() => {
    if (!isEmpty(props?.userdata)) {
      if (props?.changeName == "userName" && isEmpty(userName)) {
        setFormValue({
          ...formValue,
          ...{ userName: props?.userdata?.userName },
        });
      } else {
        setFormValue({
          ...formValue,
          ...{
            firstName: props?.userdata?.firstName,
            lastName: props?.userdata?.lastName,
          },
        });
      }
    }
  }, [props]);

  const close = () => {
    setFormValue({
      ...formValue,
      ...{ userName: props?.userdata?.userName },
    });
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
      let kycStatus = userdetails?.kycStatus;
      let externalKycStatus = userdetails?.externalKycStatus;
      if (
        kycStatus == "approved" &&
        externalKycStatus == "approved" &&
        props?.changeName != "userName"
      ) {
        Swal.fire({
          // Written as a single-line string (no embedded newlines/indentation)
          // so SweetAlert2 renders the text with consistent, natural word
          // wrapping instead of the raw source-code indentation baked into
          // a multi-line template literal.
          title: "Are you sure you want to change your first and last name? If you change it, you must resubmit your KYC. Your first name and last name must exactly match your Aadhaar card, and your PAN must be linked with Aadhaar.",
          icon: "warning",

          showCancelButton: true,
          confirmButtonText: "Continue",
          confirmButtonColor: theme == "dark" ? "#2563EB" : "#2563EB",
          cancelButtonColor: theme == "dark" ? "#101111" : "#eaecef",
          didOpen: () => {
            const confirmBtn = Swal.getConfirmButton();
            const cancelBtn = Swal.getCancelButton();

            if (confirmBtn)
              confirmBtn.setAttribute("data-click-effect", "none");
            if (cancelBtn) cancelBtn.setAttribute("data-click-effect", "none");
          },
        }).then(async (result) => {
          let reqData = {};
          if (result.isConfirmed) {
            reqData = {
              firstName: firstName,
              lastName: lastName,
              filter: props?.changeName,
            };
            await userUpdateSettingApi(reqData);
          } else if (result.isDenied) {
          }
        });
      } else {
        let reqData = {};
        if (props?.changeName == "userName") {
          reqData = { userName: userName, filter: props?.changeName };
        } else {
          reqData = {
            firstName: firstName,
            lastName: lastName,
            filter: props?.changeName,
          };
        }
        await userUpdateSettingApi(reqData);
      }
    } catch (e) {
      console.log("updateName__Err", e);
    }
  };

  const userUpdateSettingApi = async (reqData) => {
    try {
      const { status, errors } = await validateUserSettings(reqData);
      if (status) {
        setErrors(errors);
      } else {
        const formData = new FormData();
        formData.append("firstName", firstName);
        formData.append("lastName", lastName);
        formData.append("userName", userName);
        formData.append("type", "name");
        formData.append("filter", props?.changeName);
        const resp = await updateUserSettingsHooks(formData, props?.secretKey);
        if (resp?.data?.success) {
          showToastMessage(resp?.data?.message, "success");
          close();
        } else if (!resp?.data?.success) {
          if (resp?.data?.message) {
            if (resp?.data?.error) {
              setErrors(resp?.data?.error);
            }
            showToastMessage(resp?.data?.message, "error");
            close();
          }
        }
      }
    } catch (e) {
      console.log("userUpdateSettingApi__Err", e);
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
        <Modal.Header className={styles.modalPrimaryHeader}>
          <h4 className={`${styles.modalHeaderTitle} `}>
            {props?.changeName == "userName"
              ? "Update Display Name"
              : "Update First Name & Last Name"}
          </h4>
        </Modal.Header>
        {props?.changeName == "firlast" && (
          <Modal.Body className={styles.modalPrimaryBody}>
            <InputComponent
              label={"First Name"}
              type="text"
              id="firstName"
              value={firstName}
              onChange={(e) => {
                if (
                  alpharegex.test(e?.target?.value) ||
                  e?.target?.value == ""
                ) {
                  handleChange(e);
                }
              }}
              error={errors?.firstName}
            />
            <InputComponent
              label={"Last Name"}
              id="lastName"
              value={lastName}
              onChange={(e) => {
                if (
                  alpharegex.test(e?.target?.value) ||
                  e?.target?.value == ""
                ) {
                  handleChange(e);
                }
              }}
              error={errors?.lastName}
            />
          </Modal.Body>
        )}

        {props?.changeName == "userName" && (
          <Modal.Body className={styles.modalPrimaryBody}>
            <InputComponent
              label={"User Name"}
              type="text"
              id="userName"
              value={userName}
              onChange={(e) => {
                handleChange(e);
              }}
              error={errors?.userName}
            />
          </Modal.Body>
        )}
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

export default ChangeDisplayName;
