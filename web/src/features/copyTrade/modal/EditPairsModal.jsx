/** PACKAGE IMPORT  */

import { Modal } from "react-bootstrap";
import { IoClose } from "react-icons/io5";
import Select from "react-select";

/** LOCAL FILE IMPORT  */

import styles from "../styles/modal.module.css";
import Button from "../../../components/Button/Button";
import CustomRangeSlider from "../../../components/UiComponents/CustomRangeSlider";
import { useEffect, useState } from "react";
import {
  InputFileComponent,
  InputTextareaComponent,
  PrimaryInput,
  PrimaryTextarea,
} from "../../../components/Input/InputFields";
import { useSelector } from "react-redux";

/** CODE START */

const EditPairsModal = ({
  show,
  editPairsData,
  handleClose,
  editPairsDetails,
}) => {
  const { futurePairData } = useSelector((state) => state.future);
  const [selectCoin, setSelectCoin] = useState(null);
  const [formValue, setFormValue] = useState(null);
  const [pairs, setPairs] = useState([]);
  const [pairCollection, setPairCollections] = useState([]);

  const handleClickCoin = (e) => {
    const { value } = e.target;
    if (value === "all") {
      const allValues = pairCollection.map((i) => i.value);
      const isSelectingAll = selectCoin !== "all";
      setPairs(isSelectingAll ? allValues : []);
      setSelectCoin(isSelectingAll ? "all" : null);
      return;
    }
    setPairs((prev) =>
      prev.includes(value)
        ? prev.filter((item) => item !== value)
        : [...prev, value],
    );

    setSelectCoin(null);
  };

  useEffect(() => {
    if (Array.isArray(editPairsData) && Array.isArray(futurePairData)) {
      let pairsList = editPairsData.map((value) => {
        let pairdetails = futurePairData.find((el) => el._id === value);
        return {
          pair: `${pairdetails?.baseCurrency} / USDT`,
          label: pairdetails?.tickerRoot,
          value,
          status: pairdetails?.status,
        };
      });
      setPairCollections(pairsList);
    }
  }, [editPairsData]);
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
        <Modal.Header className={styles.modalPrimaryHeader}>
          <h4 className={`${styles.modalHeaderTitle} `}>
            Select copy trading pairs
          </h4>
          <button
            aria-label="closeIcon"
            className={styles.modalCloseButton}
            onClick={handleClose}
          >
            <IoClose />
          </button>
        </Modal.Header>
        <Modal.Body className={styles.modalPrimaryBody}>
          <div className={styles.modalPrimaryBodyContainer}>
            <div className={`${styles.modalFormContainer}`}>
              <div className={`${styles.modalButtons} ms-3`}>
                <button
                  aria-label="all"
                  value={"all"}
                  className={`${selectCoin == "all" ? styles.active : ""}`}
                  onClick={(e) => handleClickCoin(e)}
                >
                  All
                </button>
                {pairCollection.map((item) => {
                  return (
                    <button
                      aria-label={item.pair}
                      value={item.value}
                      className={`${pairs.includes(item.value) || selectCoin == "all" ? styles.active : ""}`}
                      onClick={(e) => handleClickCoin(e)}
                    >
                      {item.pair}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="mt-3 flexEnd">
              <Button
                isLoading={false}
                loadingText="Redirecting..."
                btnText="Cancel"
                onClick={() => handleClose([])}
                className="cardBtnRectangleSm"
                selectedValue={null}
              />
              <Button
                isLoading={false}
                loadingText="Redirecting..."
                btnText="Confirm"
                onClick={() => handleClose(pairs)}
                className="cardSuccessBtnSm"
                selectedValue={null}
              />
            </div>
          </div>
        </Modal.Body>
      </Modal>
    </div>
  );
};

export default EditPairsModal;
