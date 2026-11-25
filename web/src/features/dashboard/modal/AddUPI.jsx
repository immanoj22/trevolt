/** PACKAGE IMPORT */

import React, { useEffect, useRef, useState } from "react";
import { Modal } from "react-bootstrap";
// import { useSelector } from "react-redux";
import { IoClose } from "react-icons/io5";
import PhoneInput from "react-phone-input-2";
import "react-phone-input-2/lib/style.css";
import OtpInput from "react-otp-input";

/** LOCAL FILES IMPORT */

import styles from "../styles/modal.module.css";
import Button from "../../../components/Button/Button";

/** ACTIONS */

const AddUPI = (props) => {
  const { show, handleClose } = props;

  return (
    <div>
      <Modal
        centered
        size="md"
        backdrop="static"
        show={show}
        onHide={handleClose}
        className={styles.modalPrimary}
      >
        <button
          aria-label="closeIcon"
          className={styles.modalCloseButton}
          onClick={handleClose}
        >
          <IoClose />
        </button>
        <Modal.Header className={styles.modalPrimaryHeader}>
          <h4 className={`${styles.modalHeaderTitle} `}>Add UPI</h4>
        </Modal.Header>
        <Modal.Body className={styles.modalPrimaryBody}>
          <div className="">
            <p className={`${styles.formLabel}`}>Enter UPI ID</p>
            <div className="mt-2">
              <input
                type="text"
                className={styles.formInput}
                placeholder="upi-01@icici"
              />
            </div>
          </div>
        </Modal.Body>

        <Modal.Footer className={`${styles.modalPrimaryFooter}`}>
          <div className={`${styles.modalFooterActions}`}>
            <Button
              isLoading={false}
              loadingText="Loading..."
              btnText="Add"
              onClick={() => handleClose()}
              className="cardSuccessBtnSm"
              selectedValue={null}
            />
          </div>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default AddUPI;
