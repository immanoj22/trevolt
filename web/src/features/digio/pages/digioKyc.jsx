/** PACKAGE IMPORT */

import React, { useEffect, useState } from "react";

/** LOCAL FILES IMPORT */
// import styles from "./modal.module.css"
import styles from "../styles/digio.module.css"

import { Modal } from "react-bootstrap";
import { IoClose } from "react-icons/io5";
import Loader from "../../../components/Loader/Loader";

export const DigioKyc = ({ digioUrl, show, handleClose }) => {

  const close = () => {
    handleClose();
  }


  return (
    <div>
      <Modal
        centered
        size="md"
        backdrop="static"
        show={show}
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
          <h4 className={`${styles.modalHeaderTitle}`}>Verification</h4>
        </Modal.Header>
        <Modal.Body className={styles.modalPrimaryBody}>
          {
            !true ?
              <div className={styles.loaderPart}>
                <Loader />
              </div> :
              <div style={{ height: "80vh", width: "100%" }}>
                <iframe
                  src={'https://verification-test.cashfree.com/dgl?shortCode=z3gclno3cg3g'}
                  title="Digio KYC"
                  style={{
                    width: "100%",
                    height: "100%",
                    border: "none",
                  }}
                />
              </div>
          }
        </Modal.Body>
      </Modal>
    </div>
  );
};



// import { useState } from "react";

// const DigioKyc = ({ digioUrl }) => {
//   if (!digioUrl) return <p>No KYC session found.</p>;

//   return (
//     <div style={{ height: "100vh", width: "100%" }}>
//       <iframe
//         src={digioUrl}
//         title="Digio KYC"
//         style={{
//           width: "30%",
//           height: "30%",
//           border: "none",
//         }}
//       />
//     </div>
//   );
// }
// export default DigioKyc;