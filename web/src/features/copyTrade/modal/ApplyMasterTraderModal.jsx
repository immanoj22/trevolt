/** PACKAGE IMPORT */

import { Modal } from "react-bootstrap";
import { IoClose } from "react-icons/io5";
import { useEffect, useRef, useState } from "react";
import Select from "react-select";
import { useSelector } from "react-redux";

/** LOCAL FILES IMPORT */

import styles from "../styles/modal.module.css";
import Button from "../../../components/Button/Button";
import {
  InputFileComponent,
  InputTextareaComponent,
  PrimaryInput,
  PrimaryTextarea,
} from "../../../components/Input/InputFields";
import isEmpty from "is-empty";
import { becomeAMasterTrader } from "../../../actions/copyTradeAction";
import { showToastMessage } from "../../../lib/toast";
import { becomeAtraderValidation } from "../../../pages/Validation/copyTradeValidations";

/** CODE START */

const initialValue = {
  name: "",
  tradePairs: [],
  description: "",
  showHistory: "only_trader",
  minFixedInvesPercen: "",
  profileImage: "",
  linkedInUrl: "",
  twitterUrl: "",
  telegramUrl: "",
  copyTradeFee: "",
  binanceUrl: "",
  bybitUrl: "",
  coinbaseUrl: "",
  maxFollower: 0,
};

const ApplyMasterTraderModal = ({ show, handleClose }) => {
  const { futurePairData } = useSelector((state) => state.future);
  const [formValue, setFormValue] = useState(initialValue);
  const [pairList, setPairs] = useState([]);
  const [error, setError] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const imageUploadRef = useRef(null);
  const [historySelect, setHistorySelect] = useState("");

  const handleUploadImage = () => {
    imageUploadRef.current.click();
  };

  const handleOnchange = (event) => {
    let inputRegex = /^[0-9A-Za-z\-\/\s]+$/;
    let paragraphRegex = /(.+?)(\r?\n\s*\r?\n|$)/gs;
    let numbersRegex = /^[+]?([0-9]+(?:[\.][0-9]*)?|\.[0-9]+)$/;

    const { value, name } = event.target;
    setError((prev) => ({ ...prev, [name]: undefined }));

    if (["name"].includes(name) && !inputRegex.test(value) && value !== "") {
      return false;
    }
    if (
      ["description"].includes(name) &&
      !paragraphRegex.test(value) &&
      value !== ""
    ) {
      return false;
    }

    if (
      ["minFixedInvesPercen", "copyTradeFee", "maxFollower"].includes(name) &&
      !numbersRegex.test(value) &&
      value !== ""
    ) {
      return false;
    }
    setFormValue({ ...formValue, ...{ [name]: value } });
  };

  const becameATrader = async () => {
    try {
      setIsLoading(true);
      const isValid = await becomeAtraderValidation(formValue);
      // const isValid = true
      if (isValid.status) {
        let formaData = new FormData();
        formaData.append("name", formValue.name);
        let tradePairs = [...formValue.tradePairs].filter((val) => {
          if (val.value != "*") {
            return val;
          }
        });

        // if (formValue.tradePairs.length > 2) {
        //     for (let i = 0; i < formValue.tradePairs.length; i++) {
        //         formaData.append('tradePairs', JSON.stringify(formValue.tradePairs[i]))
        //     }
        // } else {
        formaData.append("tradePairs", JSON.stringify(tradePairs));
        // }

        formaData.append("description", formValue.description);
        formaData.append("showHistory", formValue.showHistory);
        formaData.append("minFixedInvesPercen", formValue.minFixedInvesPercen);
        formaData.append("profileImage", formValue.profileImage);
        formaData.append("linkedInUrl", formValue.linkedInUrl);
        formaData.append("twitterUrl", formValue.twitterUrl);
        formaData.append("telegramUrl", formValue.telegramUrl);
        formaData.append("copyTradeFee", formValue.copyTradeFee);
        formaData.append("binanceUrl", formValue.binanceUrl);
        formaData.append("bybitUrl", formValue.bybitUrl);
        formaData.append("coinbaseUrl", formValue.coinbaseUrl);
        formaData.append("maxFollower", formValue.maxFollower);

        // return true

        // const { status, message, data, errors } = await becomeAMasterTrader(formaData);
        const result = await becomeAMasterTrader(formaData);

        setIsLoading(false);
        if (result?.data?.success) {
          setFormValue(initialValue);
          showToastMessage(result?.data?.message, "success");
          handleClose({ status: true });
        } else {
          setError(result?.data?.errors);
          !isEmpty(result?.data?.message) &&
            showToastMessage(result?.data?.message, "error");
        }
      } else {
        setError(isValid?.error);
      }
      setIsLoading(false);
    } catch (e) {
      setIsLoading(false);
      console.log("becameATrader_err", e);
    }
  };
  useEffect(() => {
    if (!isEmpty(futurePairData)) {
      const getPairList = futurePairData.map((val) => ({
        label: val.tickerRoot,
        value: val._id,
      }));
      setPairs([{ label: "All", value: "*" }, ...getPairList]);
    }
  }, [futurePairData]);

  return (
    <div>
      <Modal
        centered
        size="md"
        backdrop="static"
        show={show}
        onHide={() => handleClose({ status: false })}
        className={styles.modalPrimary}
      >
        <Modal.Header className={styles.modalPrimaryHeader}>
          <h4 className={`${styles.modalHeaderTitle} `}>
            Master Trader Details
          </h4>
          <button
            aria-label="closeIcon"
            className={styles.modalCloseButton}
            onClick={() => handleClose({ status: false })}
          >
            <IoClose />
          </button>
        </Modal.Header>
        <Modal.Body className={styles.modalPrimaryBody}>
          <div className={styles.modalPrimaryBodyContainer}>
            <div className={`${styles.modalFormContainer} mt-3`}>
              <label className={styles.modalLabel}>
                {" "}
                Name <span className="text-danger">*</span>{" "}
              </label>
              <PrimaryInput
                type="text"
                id="name"
                name={"name"}
                placeholder="Enter Your Name"
                value={formValue.name}
                onChange={handleOnchange}
                error={error?.name || null}
                className={"primaryInputBgTwo"}
              />
            </div>
            <div className={`${styles.modalFormContainer} mt-3`}>
              <label className={styles.modalLabel}>
                {" "}
                Select your pairs <span className="text-danger">*</span>{" "}
              </label>
              <div>
                <Select
                  isSearchable={false}
                  placeholder="Pairs"
                  classNamePrefix="react-select__ninth"
                  value={formValue.tradePairs}
                  onChange={(selected) => {
                    const hasSelectAll = selected?.some(
                      (opt) => opt.value === "*",
                    );

                    if (hasSelectAll) {
                      const allPairs = pairList.filter(
                        (opt) => opt.value !== "*",
                      );
                      setFormValue({ ...formValue, tradePairs: allPairs });
                    } else {
                      setFormValue({
                        ...formValue,
                        tradePairs: selected || [],
                      });
                    }
                  }}
                  options={pairList}
                  isMulti
                />
              </div>
              <p className={`text-danger mt-2`}>{error?.tradePairs}</p>
            </div>

            <div className="bt_input_section mt-3">
              <label className={`${styles.modalLabel} mb-2`}>
                Select show history <span className="text-danger">*</span>
              </label>
              <div
                className={`${styles.showHistoryBG} bt_tab_card d-flex mb-3 mt-2`}
              >
                <button
                  name="showHistory"
                  className={`${styles.tradeOption} ${formValue.showHistory == `only_trader` ? `${styles.active}` : ""}
                                    ${historySelect == "mastertrader" && styles.active}`}
                  onClick={() => {
                    setFormValue({
                      ...formValue,
                      ...{ showHistory: "only_trader" },
                    });
                    setHistorySelect("mastertrader");
                  }}
                >
                  Master Trader
                </button>
                <button
                  name="showHistory"
                  className={`${styles.tradeOption} ${formValue.showHistory == "only_copier" ? `${styles.active}` : ""}
                                    ${historySelect == "followers" && styles.active}`}
                  onClick={() => {
                    setFormValue({
                      ...formValue,
                      ...{ showHistory: "only_copier" },
                    });
                    setHistorySelect("followers");
                  }}
                >
                  Followers
                </button>
              </div>
              {formValue?.showHistory == "only_copier" && (
                <p className="bt_error fs14">
                  Note: Your trade history will be displayed to the Copiers
                </p>
              )}
              {formValue?.showHistory == "only_trader" && (
                <p className="bt_error fs14">
                  Note: Your trade history will be displayed to the Traders
                </p>
              )}
              <p className={`text-danger mt-2`}>{error?.showHistory}</p>
            </div>

            <div className={`${styles.modalFormContainerr} mt-3 upload_prof`}>
              <label className={styles.modalLabel}>
                {" "}
                Upload profile photo <span className="text-danger">*</span>{" "}
              </label>
              <InputFileComponent
                error={error?.profileImage || null}
                label={null}
                className={"mt-0"}
                onChange={(e) => {
                  const file = e.target.files[0];
                  if (file && file.type.startsWith("image/")) {
                    setFormValue({ ...formValue, profileImage: file });
                  } else {
                    alert("Please upload a valid image file.");
                    e.target.value = "";
                  }
                }}
              />
            </div>

            {/* <p className={`text-danger mt-2`}>{error?.profileImage}</p> */}

            {/* <div className={`${styles.modalFormContainer} mt-3`}>
                            <label className={styles.modalLabel}> Minimum Invest (USD) </label>
                            <PrimaryInput
                                type="text"
                                id="quantity"
                                name={"quantity"}
                                placeholder="Enter your minInvest"
                                // value={formData.quantity}
                                // onChange={onChangeHandler}
                                error={null}
                                className={'primaryInputBgTwo'}
                            />
                        </div> */}

            <div className={`${styles.modalFormContainer} mt-3`}>
              <label className={styles.modalLabel}>
                {" "}
                Minimum Fixed Invest (%) <span className="text-danger">*</span>{" "}
              </label>
              <PrimaryInput
                type="text"
                id="minFixedInvesPercen"
                name={"minFixedInvesPercen"}
                placeholder="Enter your minimum invest percentage"
                value={formValue.minFixedInvesPercen}
                onChange={handleOnchange}
                error={error?.minFixedInvesPercen || null}
                className={"primaryInputBgTwo"}
              />
            </div>
            <div className={`${styles.modalFormContainer} mt-3`}>
              <label className={styles.modalLabel}>
                {" "}
                Copy trade fee (%) <span className="text-danger">*</span>{" "}
              </label>
              <PrimaryInput
                type="text"
                id="copyTradeFee"
                name={"copyTradeFee"}
                placeholder="Enter your copy trade fee"
                value={formValue.copyTradeFee}
                onChange={handleOnchange}
                error={error?.copyTradeFee || null}
                className={"primaryInputBgTwo"}
              />
            </div>

            <div className={`${styles.modalFormContainer} mt-3`}>
              <label className={styles.modalLabel}>
                {" "}
                Maximum Followers <span className="text-danger">*</span>{" "}
              </label>
              <PrimaryInput
                type="text"
                id="maxFollower"
                name={"maxFollower"}
                placeholder="Enter your copy trade fee"
                value={formValue.maxFollower}
                onChange={handleOnchange}
                error={error?.maxFollower || null}
                className={"primaryInputBgTwo"}
              />
            </div>

            <div className={`${styles.modalFormContainer} mt-3`}>
              <label className={styles.modalLabel}>
                {" "}
                LinkedIn <span className="text-danger">*</span>{" "}
              </label>
              <PrimaryInput
                type="text"
                id="linkedInUrl"
                name={"linkedInUrl"}
                placeholder="Enter your linkedin URL"
                value={formValue.linkedInUrl}
                onChange={handleOnchange}
                error={error?.linkedInUrl || null}
                className={"primaryInputBgTwo"}
              />
            </div>
            <div className={`${styles.modalFormContainer} mt-3`}>
              <label className={styles.modalLabel}>
                {" "}
                Twitter <span className="text-danger">*</span>{" "}
              </label>
              <PrimaryInput
                type="text"
                id="twitterUrl"
                name={"twitterUrl"}
                placeholder="Enter your twitter URL"
                value={formValue.twitterUrl}
                onChange={handleOnchange}
                error={error?.twitterUrl || null}
                className={"primaryInputBgTwo"}
              />
            </div>
            <div className={`${styles.modalFormContainer} mt-3`}>
              <label className={styles.modalLabel}>
                {" "}
                Telegram <span className="text-danger">*</span>{" "}
              </label>
              <PrimaryInput
                type="text"
                id="telegramUrl"
                name={"telegramUrl"}
                placeholder="Enter your telegram URL"
                value={formValue.telegramUrl}
                onChange={handleOnchange}
                error={error?.telegramUrl || null}
                className={"primaryInputBgTwo"}
              />
            </div>
            <div className={`${styles.modalFormContainer} mt-3`}>
              <label className={styles.modalLabel}>
                {" "}
                Binance <span className="text-danger">*</span>{" "}
              </label>
              <PrimaryInput
                type="text"
                id="binanceUrl"
                name={"binanceUrl"}
                placeholder="Enter your binance URL"
                value={formValue.binanceUrl}
                onChange={handleOnchange}
                error={error?.binanceUrl || null}
                className={"primaryInputBgTwo"}
              />
            </div>
            <div className={`${styles.modalFormContainer} mt-3`}>
              <label className={styles.modalLabel}>
                {" "}
                Coinbase <span className="text-danger">*</span>{" "}
              </label>
              <PrimaryInput
                type="text"
                id="coinbaseUrl"
                name={"coinbaseUrl"}
                placeholder="Enter your coinbase URL"
                value={formValue.coinbaseUrl}
                onChange={handleOnchange}
                error={error?.coinbaseUrl || null}
                className={"primaryInputBgTwo"}
              />
            </div>
            <div className={`${styles.modalFormContainer} mt-3`}>
              <label className={styles.modalLabel}>
                {" "}
                Bybit <span className="text-danger">*</span>{" "}
              </label>
              <PrimaryInput
                type="text"
                id="bybitUrl"
                name={"bybitUrl"}
                placeholder="Enter your bybit URL"
                value={formValue.bybitUrl}
                onChange={handleOnchange}
                error={error?.bybitUrl || null}
                className={"primaryInputBgTwo"}
              />
            </div>
            <div className={`${styles.modalFormContainer} mt-3`}>
              <label className={styles.modalLabel}>
                {" "}
                Description <span className="text-danger">*</span>{" "}
              </label>
              <PrimaryTextarea
                placeholder={"Enter Your Email"}
                rows={5}
                className={"secondaryTextarea"}
                onChange={handleOnchange}
                value={formValue.description}
                name={"description"}
                error={error?.description || null}
                id={"description"}
              />
            </div>

            <div className="mt-5 flexEnd">
              <Button
                isLoading={false}
                loadingText="Redirecting..."
                btnText="Cancel"
                onClick={() => handleClose({ status: false })}
                className="cardBtnRectangleSm"
                selectedValue={null}
              />
              <Button
                isLoading={false}
                loadingText="Redirecting..."
                btnText="Confirm"
                onClick={becameATrader}
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

export default ApplyMasterTraderModal;
