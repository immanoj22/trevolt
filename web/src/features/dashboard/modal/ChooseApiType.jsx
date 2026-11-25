/** PACKAGE IMPORT */

import React, { useEffect, useRef, useState } from "react";
import { Modal } from "react-bootstrap";
import { IoClose } from "react-icons/io5";
import PhoneInput from "react-phone-input-2";
import "react-phone-input-2/lib/style.css";
import { useSelector } from 'react-redux';



/** LOCAL FILES IMPORT */

import styles from "../styles/modal.module.css"
import styled from "../../../pages/Auth/auth.module.css"
import Button from "../../../components/Button/Button";
import { InputComponent } from "../../../components/Input/InputFields";
import { validateChangeEmail } from "../../../pages/Validation/userValidation";
import { requestEmailChangeHooks } from "../../../actions/userAction";
import { showToastMessage } from "../../../lib/toast";
import Images from "../../../utils/Images";
import CreateApiModal from "./CreateApiModal";

/** ACTIONS */


const ChooseApiType = (props) => {



  const [requestedEmail, setRequestedEmail] = useState("");
  const [checkValue, setcheckValue] = useState(false);
  const [errors, setErrors] = useState({});
  const [btndis, setBtnDis] = useState(false);
  const [showCreateApiModal, setShowCreateApiModal] = useState(false);

  const handleShowCreateApi = (data = {}) => {
    setShowCreateApiModal(!showCreateApiModal);
    props.setNewApikey(data)
  }


  const close = () => {
    setErrors({}); setRequestedEmail(""); setcheckValue(false);
    props.handleClose();
  }

  return (
    <div>
      <CreateApiModal
        show={showCreateApiModal}
        handleClose={handleShowCreateApi}
      />
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
          <h4 className={`${styles.modalHeaderTitle} `}>Choose API Key type</h4>
        </Modal.Header>
        <Modal.Body className={styles.modalPrimaryBody}>
          <div className={`${styles.emailNotePart} mt-4`}>
            <div className="d-flex align-items-start gap-4">
              <div>
                <img src={Images.affiliateDashboardIcon1} alt="Key_image" className={styles.apiKeyImg} />
              </div>
              <div>
                <p className={styles.formInputLg}>System generated</p>
                <p className={`${styles.formLabel} mt-2`}>
                  works using HMAC symmetric encryption. An API Key and Secret Key will be Provided to you. Please keep these keys secure and treat it like your password. do not share the keys with any third parties.
                </p>
              </div>
            </div>
          </div>
        </Modal.Body>
        <Modal.Footer className={`${styles.modalPrimaryFooter}`}>
          <div className={`${styles.modalFooterActions}`}>
            <Button
              isLoading={false}
              loadingText="Loading..."
              btnText="Next"
              disabled={btndis}
              onClick={() => { setShowCreateApiModal(true); props.handleClose() }}
              className="cardSuccessBtnSm"
              selectedValue={null}
            />
          </div>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default ChooseApiType;