/** PACKAGE IMPORT  */

import { Modal } from "react-bootstrap";
import { IoClose } from "react-icons/io5";
import Select from "react-select";

/** LOCAL FILE IMPORT */

import styles from "../styles/modal.module.css";
import Button from "../../../components/Button/Button";
import CustomRangeSlider from "../../../components/UiComponents/CustomRangeSlider";
import { formatDisplayPair } from "../../../lib/pairDisplay";
import {
  InputFileComponent,
  InputTextareaComponent,
  InputWithCurrencyAndLabel,
  PrimaryInput,
  PrimaryTextarea,
} from "../../../components/Input/InputFields";

/** CODE START */

/**
 * Fully controlled by the parent (single source of truth): the parent owns the
 * Risk Management values/errors and this modal only renders them + forwards
 * change/confirm/close events. It never keeps its own copy of the form data,
 * so closing/reopening can never reset or lose in-progress values.
 */
const RiskManagementModal = ({
  show,
  value,
  errors,
  onChange,
  onConfirm,
  onClose,
}) => {
  const riskManagement = value || {};
  const fieldErrors = errors || {};

  return (
    <div>
      <Modal
        centered
        size="md"
        backdrop="static"
        show={show}
        onHide={onClose}
        className={styles.modalPrimary}
      >
        <Modal.Header className={styles.modalPrimaryHeader}>
          <h4 className={`${styles.modalHeaderTitle} `}>Risk Management</h4>
          <button
            aria-label="closeIcon"
            className={styles.modalCloseButton}
            onClick={onClose}
          >
            <IoClose />
          </button>
        </Modal.Header>
        <Modal.Body className={styles.modalPrimaryBody}>
          <div className={styles.modalPrimaryBodyContainer}>
            <div className={`${styles.labelContainer}`}>
              <label className={`${styles.modalLabel} mb-2`}>
                {" "}
                Stop loss (1-90){" "}
              </label>
              <InputWithCurrencyAndLabel
                id={"limitAmount"}
                name={"stopPrice"}
                onChange={(name, value) => {
                  onChange("stopLoss", value);
                }}
                placeholder={"Stop loss (1-90)"}
                type={"number"}
                value={riskManagement?.stopLoss}
                disabled={false}
                key={"limitAmount"}
                readOnly={false}
                currency={"%"}
                error={null}
                className={"InputTextStartCurrencyAndLabel"}
              />
            </div>
            {fieldErrors?.stopLoss && (
              <span className={styles.redClr}>{fieldErrors.stopLoss}</span>
            )}
            <div className={`${styles.labelContainer} mt-3`}>
              <label className={`${styles.modalLabel} mb-2`}>
                {" "}
                Take profit (1-90){" "}
              </label>
              <InputWithCurrencyAndLabel
                id={"limitAmount"}
                name={"stopPrice"}
                onChange={(name, value) => {
                  onChange("takeProfit", value);
                }}
                placeholder={"Take profit (1-90)"}
                type={"number"}
                value={riskManagement?.takeProfit}
                disabled={false}
                key={"limitAmount"}
                readOnly={false}
                currency={"%"}
                error={null}
                className={"InputTextStartCurrencyAndLabel"}
              />
            </div>
            {fieldErrors?.takeProfit && (
              <span className={styles.redClr}>{fieldErrors.takeProfit}</span>
            )}

            <div className={`${styles.labelContainer} mt-3`}>
              <label className={`${styles.modalLabel} mb-2`}>
                {" "}
                Maximum follow amount{" "}
              </label>
              <InputWithCurrencyAndLabel
                id={"limitAmount"}
                name={"stopPrice"}
                onChange={(name, value) => {
                  onChange("maxAllowAmount", value);
                }}
                placeholder={"500"}
                type={"number"}
                value={riskManagement?.maxAllowAmount}
                disabled={false}
                key={"limitAmount"}
                readOnly={false}
                currency={formatDisplayPair("USDT")}
                error={null}
                className={"InputTextStartCurrencyAndLabel"}
              />
            </div>

            {fieldErrors?.maxAllowAmount && (
              <span className={styles.redClr}>{fieldErrors.maxAllowAmount}</span>
            )}

            <div className={`${styles.labelContainer} mt-3`}>
              <label className={`${styles.modalLabel} mb-2`}>
                {" "}
                Leverage (1-100){" "}
              </label>
              <InputWithCurrencyAndLabel
                id={"leverage"}
                name={"leverage"}
                onChange={(name, value) => {
                  onChange("leverage", value.replace(/[^0-9]/g, ""));
                }}
                placeholder={"Leverage (1-100)"}
                type={"number"}
                value={riskManagement?.leverage}
                disabled={false}
                key={"leverage"}
                readOnly={false}
                currency={"x"}
                error={null}
                className={"InputTextStartCurrencyAndLabel"}
              />
            </div>
            {fieldErrors?.leverage && (
              <span className={styles.redClr}>{fieldErrors.leverage}</span>
            )}

            <div className="mt-3 flexEnd">
              <Button
                isLoading={false}
                loadingText="Redirecting..."
                btnText="Cancel"
                onClick={onClose}
                className="cardBtnRectangleSm"
                selectedValue={null}
              />
              <Button
                isLoading={false}
                loadingText="Redirecting..."
                btnText="Confirm"
                onClick={onConfirm}
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

export default RiskManagementModal;
