/** PACKAGE IMPORT */

import React, { useEffect, useState } from "react";
import Select from "react-select";

/** LOCAL FILES IMPORT */

import styles from "../styles/copyingTrade.module.css";
import Button from "../../../components/Button/Button";
import Images from "../../../utils/Images";
import { useLocation, useNavigate } from "react-router-dom";
import {
  InputWithCurrencyAndLabel,
  PrimaryInput,
} from "../../../components/Input/InputFields";
import CopytradingPairModal from "../modal/CopyTradingPairsModal";
import RiskManagementModal from "../modal/RiskManagementModal";
import isEmpty from "is-empty";
import { useDispatch, useSelector } from "react-redux";
import {
  getAllStrategy,
  requestCopier,
} from "../../../actions/copyTradeAction";
import { showToastMessage } from "../../../lib/toast";
import {
  requestCopierValidation,
  validateRiskManagement,
} from "../../../pages/Validation/copyTradeValidations";
import { allStrategies } from "../../../redux/copytradeAction";

/** CODE START */

const initialValue = {
  investType: "fixed", // amount || percen
  investPercen: 0,
  maxAllowAmount: "",
  takeProfit: "",
  stopLoss: "",
  leverage: "",
  tradePairs: [],
  strategyId: "",
};

const CopyingTrade = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const location = useLocation();
  const { data } = location.state;
  const { futurePairData } = useSelector((state) => state.future);
  const { userdetails } = useSelector((state) => state.user);
  const [selectedTab, setSelectedTab] = useState("fixed");
  const [tradingPairsIsOpen, setTradingPairsIsOpen] = useState(false);
  const [traderPairsData, setTraderPairsData] = useState(null);
  const [riskManageIsOpen, setRiskManageIsOpen] = useState(false);
  const [riskManageData, setRiskManageData] = useState({
    maxAllowAmount: "",
    takeProfit: "",
    stopLoss: "",
    leverage: "",
  });
  const [formValue, setFormValue] = useState(initialValue);
  const [selectedPairs, setSelectedPairs] = useState([]);
  const [terms1, setTerms1] = useState(false);
  const [terms2, setTerms2] = useState(false);
  const [investPercen, setInvestPercentage] = useState(0);
  const [error, setError] = useState({});

  const handleBack = () => {
    navigate(-1);
  };

  const traderPairsDetails = (data) => {
    setTradingPairsIsOpen(false);
    if (!data) return;
    setFormValue((prev) => ({
      ...prev,
      tradePairs: data,
    }));
    if (Array.isArray(traderPairsData) && Array.isArray(futurePairData)) {
      const pairsList = traderPairsData
        .map((value) => {
          const pairdetails = futurePairData.find((el) => el._id === value);
          if (!pairdetails) return null;

          return {
            pair: `${pairdetails.baseCurrency} / USDT`,
            label: pairdetails.tickerRoot,
            value,
            status: pairdetails.status,
            fullObj: pairdetails,
          };
        })
        .filter(Boolean);
      const selected = pairsList.filter((item) => data.includes(item.value));
      setSelectedPairs(selected);
    }
  };

  /** Risk Management modal is fully controlled from here (single source of truth) —
   *  every keystroke updates riskManageData directly, so closing/reopening the modal
   *  never loses or resets in-progress values. */
  const handleRiskFieldChange = (name, value) => {
    setRiskManageData((prev) => ({
      ...prev,
      [name]: value,
    }));
    setError((prev) => ({ ...prev, [name]: "" }));
  };

  const handleConfirmRisk = () => {
    const riskValidation = validateRiskManagement(riskManageData);
    if (!riskValidation.status) {
      setError((prev) => ({ ...prev, ...riskValidation.errors }));
      return; // keep the modal open when validation fails
    }
    setError((prev) => ({
      ...prev,
      stopLoss: "",
      takeProfit: "",
      maxAllowAmount: "",
      leverage: "",
      riskManagement: "",
    }));
    setRiskManageIsOpen(false);
  };

  const handleCloseRiskModal = () => {
    // Just hide the modal — riskManageData/errors are untouched so reopening
    // shows exactly what was there before.
    setRiskManageIsOpen(false);
  };

  const handleRequestCopier = async () => {
    try {
      if (userdetails?.kycStatus !== "approved") {
        showToastMessage(
          "You are not eligible for trade before approval of KYC Information",
          "error",
        );
        return;
      }
      const payload = {
        investType: selectedTab,
        investPercen: investPercen,
        maxAllowAmount: riskManageData?.maxAllowAmount,
        takeProfit: riskManageData?.takeProfit,
        stopLoss: riskManageData?.stopLoss,
        leverage: riskManageData?.leverage,
        tradePairs: selectedPairs,
        strategyId: data._id,
      };

      const Valid = await requestCopierValidation(payload);

      let newErrors = {};

      if (!terms1 || !terms2) {
        newErrors.terms = "Please agree to the Terms and Conditions.";
      }

      if (!Valid.status) {
        newErrors = { ...newErrors, ...Valid.errors };
      }
      if (Object.keys(newErrors).length > 0) {
        setError((prev) => ({
          ...prev,
          ...newErrors,
        }));
        return;
      }
      const result = await requestCopier(payload, userdetails.secretKey);
      if (result.data.success) {
        navigate("/copy-trade");
        showToastMessage(result?.data?.message, "success");

        const allStrategy = await getAllStrategy();
        if (allStrategy.data.success) {
          dispatch(allStrategies({ allStrategies: allStrategy.data.result }));
        }
      } else {
        !isEmpty(result?.data?.errors) && setError(result?.data?.errors);
        showToastMessage(result.data?.message, "error");
      }
    } catch (error) {
      console.log("requestCopier_err", error);
    }
  };

  useEffect(() => {
    if (!isEmpty(data)) {
      setTraderPairsData(data.tradePairs);
    }
  }, [data]);

  useEffect(() => {
    setError({});
  }, [tradingPairsIsOpen]);

  useEffect(() => {
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }, []);

  return (
    <>
      <main className={styles.subLanding}>
        <section className={styles.copyingTrade}>
          <div className="custom-container container">
            <div className={styles.copyingTradeContainer}>
              <div className={styles.copyingBackBtn}>
                <h5 className={styles.pageTitle}>Copy Traders Setup</h5>
                <Button
                  // isLoading={false}
                  loadingText="Redirecting..."
                  btnText="Back"
                  onClick={handleBack}
                  className="backBtn"
                  selectedValue={null}
                />
              </div>
              <div className={styles.labelHeader}>
                <p>Copy trading pairs</p>
                <Button
                  // isLoading={false}
                  loadingText="Redirecting..."
                  btnText="Select Pairs"
                  onClick={() => setTradingPairsIsOpen(true)}
                  className="cardSuccessBtnSm"
                  selectedValue={null}
                />
              </div>

              <CopytradingPairModal
                show={tradingPairsIsOpen}
                traderPairsData={traderPairsData}
                handleClose={(e) => traderPairsDetails(e)}
              />
              <div className={styles.selectedpairs}>
                {isEmpty(formValue.tradePairs) ? (
                  <p>No pair selected</p>
                ) : (
                  selectedPairs.map((item) => {
                    return (
                      <div className="d-flex align-items-center gap-2">
                        <p className={styles.selectedPairsBorder}>
                          {" "}
                          {item.pair}
                        </p>
                      </div>
                    );
                  })
                )}
              </div>
              <span className={styles.redClr}>{error?.tradePairs}</span>

              <div className={styles.copyingTabs}>
                <button
                  aria-label="fixedAmount"
                  className={`${selectedTab == "fixed" ? styles.active : ""}`}
                  onClick={() => setSelectedTab("fixed")}
                >
                  Fixed
                </button>
                <button
                  aria-label="percentage"
                  className={`${selectedTab == "flexible" ? styles.active : ""}`}
                  onClick={() => setSelectedTab("flexible")}
                >
                  Flexible
                </button>
              </div>
              {selectedTab == "fixed" ? (
                <div className={`${styles.fixedAmountField} mt-3`}>
                  <InputWithCurrencyAndLabel
                    id={"limitAmount"}
                    name={"stopPrice"}
                    onChange={(name, value) => {
                      setInvestPercentage(value);
                      setError({});
                    }}
                    placeholder={""}
                    type={"number"}
                    // value={barketOrders?.takeProfit?.stopPrice}
                    disabled={false}
                    key={"limitAmount"}
                    readOnly={false}
                    currency={"In Percentage"}
                    error={null}
                    className={"InputTextStartCurrencyAndLabel"}
                  />
                </div>
              ) : (
                <></>
              )}
              <span className={styles.redClr}>{error?.investPercen}</span>
              <div className={styles.labelHeader}>
                <p>Risk Management</p>
                <Button
                  // isLoading={false}
                  loadingText="Redirecting..."
                  btnText="Manage Risk"
                  onClick={() => setRiskManageIsOpen(true)}
                  className="cardSuccessBtnSm"
                  selectedValue={null}
                />
              </div>
              <span className={styles.redClr}>{error?.riskManagement}</span>
              <RiskManagementModal
                show={riskManageIsOpen}
                value={riskManageData}
                errors={error}
                onChange={handleRiskFieldChange}
                onConfirm={handleConfirmRisk}
                onClose={handleCloseRiskModal}
              />
              <div className="custom-checkInput__container4 mt-4">
                <label className="custom-checkInput__label4">
                  <input
                    type="checkbox"
                    onChange={(e) => {
                      (setTerms1(e.target.checked), setError({}));
                    }}
                    checked={terms1}
                  />
                  <span className="custom-checkInput__checkmark4"></span>
                </label>
                <p className="custom-checkInput__content4" onClick={() => set}>
                  I agree to the terms and conditions of Copy Trading
                </p>
              </div>
              <div className="custom-checkInput__container4 mt-4 mb-3">
                <label className="custom-checkInput__label4">
                  <input
                    type="checkbox"
                    onChange={(e) => {
                      (setTerms2(e.target.checked), setError({}));
                    }}
                    checked={terms2}
                  />
                  <span className="custom-checkInput__checkmark4"></span>
                </label>

                <p className="custom-checkInput__content4">
                  I agree to share the profit of % with the Master Trader
                </p>
              </div>
              <span className={styles.redClr}>{error?.terms}</span>
              <div className={styles.copyBtn}>
                <Button
                  // isLoading={false}
                  loadingText="Redirecting..."
                  btnText="Copy"
                  onClick={() => handleRequestCopier()}
                  className="primaryBtn"
                  selectedValue={null}
                />
              </div>
            </div>
          </div>
        </section>
      </main>
    </>
  );
};

export default CopyingTrade;
