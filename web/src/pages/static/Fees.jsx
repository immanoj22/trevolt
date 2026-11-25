/** package import */
import React, { useState, useEffect, useLayoutEffect } from "react";
import { Col, NavLink, Row } from "react-bootstrap";
import { GoDotFill } from "react-icons/go";
import { MdOutlineKeyboardArrowRight } from "react-icons/md";

/** local import */
import styles from "./staticPage.module.css";
import Images from "../../utils/Images";
import { useGlobalContext } from "../../context/GlobalProvider";
import CustomDropdown from "../../components/UiComponents/DropDownComponent";
import { InputComponent } from "../../components/Input/InputFields";
import TooltipComponent from "../../components/UiComponents/tooltipComponent";
import { useSelector } from "react-redux";
import { useMemo } from "react";
import { isEmpty } from "../../lib/isEmpty";
import { formatDisplayPair } from "../../lib/pairDisplay";

const Fees = () => {
  const { theme } = useGlobalContext();
  const { feeSettingsList } = useSelector((state) => state.fee);
  const { futurePairData } = useSelector((state) => state.future);
  const { underlyingDetails } = useSelector((state) => state.option);
  const [activeFeesTab, setActiveFeesTab] = useState("trading");
  const [activeTradingTab, setActiveTradingTab] = useState("future");
  const [isTaker, setIsTaker] = useState(true);
  const [isExitTaker, setIsExitTaker] = useState(true);
  const [isScalperTaker, setIsScalperTaker] = useState(true);
  const [activeExampleTab, setActiveExampleTab] = useState("futures");

  // ── Trading Fee Calculator state ─────────────────────────────────────────
  const [futuresContract, setFuturesContract] = useState('');
  const [baseCurrency, setBaseCurrency] = useState('');
  const [futuresInputs, setFuturesInputs] = useState({
    entryPrice: '',
    exitPrice: '',
    qty: ''
  });
  const [optionContract, setOptionContract] = useState('');
  const [optionsInputs, setOptionsInputs] = useState({
    entryPremium: '',
    exitPremium: '',
    qty: ''
  });
  const [lotSize, setLotSize] = useState(0);

  const feeLookup = useMemo(() => {
    const find = (tradeMode, feeType, field) =>
      feeSettingsList?.find(v =>
        v.pairName === 'all' && v.tradeMode === tradeMode &&
        v.status === 'active' && v.feeType === feeType
      )?.[field];
    return {
      futureMakerFee: find('future', 'maker', 'feePercentage'),
      futureTakerFee: find('future', 'taker', 'feePercentage'),
      optionMakerFee: find('option', 'maker', 'notionalPercentage'),
      optionTakerFee: find('option', 'taker', 'notionalPercentage'),
      optionPremiumCap: find('option', 'taker', 'premiumPercentage'),
    };
  }, [feeSettingsList]);

  const GST_MULTIPLIER = 1.18;
  const LOT_SIZE = 0.001; // 1 lot = 0.001 BTC

  /** Format a number to `dec` decimal places; returns '—' for non-finite values */
  const fmtCalc = (n, dec = 2) => (Number.isFinite(n) ? n.toFixed(dec) : '—');

  /** Input change handlers */
  const onFuturesChange = (e) => {
    const { name, value } = e.target;
    setFuturesInputs((prev) => ({ ...prev, [name]: value }));
  };
  const onOptionsChange = (e) => {
    const { name, value } = e.target;
    setOptionsInputs((prev) => ({ ...prev, [name]: value }));
  };

  /**
   * Derive the live index price for the selected option contract from
   * futurePairData (falls back through common field names, then to 0).
   */
  const optionsIndexPrice = useMemo(() => {
    const pair = (futurePairData || []).find((p) =>
      String(p.tickerRoot || p.baseCurrency || '').toUpperCase().includes(optionContract.toUpperCase())
    );
    return parseFloat(pair?.index || pair?.marketPrice || pair?.last || 0) || 0;
  }, [futurePairData, optionContract]);

  /** Futures fee calculator — recomputes whenever inputs or fee rates change */
  const futuresResults = useMemo(() => {
    const qty = parseFloat(futuresInputs.qty);
    const entryPx = parseFloat(futuresInputs.entryPrice);
    const exitPx = parseFloat(futuresInputs.exitPrice);

    if (!qty || !entryPx || qty <= 0 || entryPx <= 0) return null;

    const entryNotional = qty * lotSize * entryPx;
    const hasExit = exitPx > 0;
    const exitNotional = hasExit ? qty * lotSize * exitPx : 0;

    const entryFeeRate = ((isTaker ? feeLookup.futureTakerFee : feeLookup.futureMakerFee) || 0) / 100;
    const exitFeeRate = ((isExitTaker ? feeLookup.futureTakerFee : feeLookup.futureMakerFee) || 0) / 100;

    const entryFee = entryNotional * entryFeeRate;
    const exitFee = exitNotional * exitFeeRate;
    const totalTradingFee = entryFee + exitFee;
    const totalFeeWithGST = totalTradingFee * GST_MULTIPLIER;

    const positionSize = qty * lotSize;
    const breakeven = positionSize > 0 ? totalFeeWithGST / positionSize : 0;
    const rawPnL = hasExit ? (exitPx - entryPx) * positionSize : null;
    const netPnL = rawPnL !== null ? rawPnL - totalFeeWithGST : null;

    return { entryNotional, exitNotional, totalTradingFee, totalFeeWithGST, breakeven, netPnL };
  }, [futuresInputs, isTaker, isExitTaker, feeLookup, GST_MULTIPLIER]);

  /** Options fee calculator — min(premiumCap%, notional × fee%) for each leg */
  const optionsResults = useMemo(() => {
    const qty = parseFloat(optionsInputs.qty);
    const entryPrem = parseFloat(optionsInputs.entryPremium);
    const exitPrem = parseFloat(optionsInputs.exitPremium);

    if (!qty || !entryPrem || qty <= 0 || entryPrem <= 0) return null;

    const indexPrice = optionsIndexPrice || 0;
    const notional = qty * lotSize * indexPrice;
    const premiumCap = ((feeLookup.optionPremiumCap || 0) / 100);
    const takerFeeRate = ((feeLookup.optionTakerFee || 0) / 100);
    const makerFeeRate = ((feeLookup.optionMakerFee || 0) / 100);

    // Entry leg — taker (buy)
    const entryCapAmt = premiumCap * qty * lotSize * entryPrem;
    const entryNotFee = notional * takerFeeRate;
    const entryFee = Math.min(entryCapAmt, entryNotFee);

    // Exit leg — maker (sell/close); only calculated when exitPremium is provided
    const hasExit = exitPrem > 0;
    const exitCapAmt = hasExit ? premiumCap * qty * lotSize * exitPrem : 0;
    const exitNotFee = notional * makerFeeRate;
    const exitFee = hasExit ? Math.min(exitCapAmt, exitNotFee) : 0;

    const totalTradingFee = entryFee + exitFee;
    const totalFeeWithGST = totalTradingFee * GST_MULTIPLIER;

    const positionSize = qty * lotSize;
    const breakeven = positionSize > 0 ? totalFeeWithGST / positionSize : 0;
    const rawPnL = hasExit ? (exitPrem - entryPrem) * positionSize : null;
    const netPnL = rawPnL !== null ? rawPnL - totalFeeWithGST : null;

    return { notional, indexPrice, totalTradingFee, totalFeeWithGST, breakeven, netPnL };
  }, [optionsInputs, optionsIndexPrice, feeLookup, GST_MULTIPLIER]);

  const feeExampleTabs = useMemo(() => {
    const {
      futureMakerFee = 0,
      optionTakerFee = 0,   // ← corrected from optionMakerFee
      optionPremiumCap = 0,
      optionMakerFee = 0
    } = feeLookup;

    // --- Futures ---
    const futuresNotional = 100000;
    const futuresFee = futuresNotional * (futureMakerFee / 100);
    const futuresTotalFee = futuresFee * GST_MULTIPLIER;

    // --- Options #1 (Taker, BUY 100 contracts) ---
    const opt1Contracts = 100;
    const opt1LotSize = 0.001;
    const opt1Premium = 300;
    const opt1IndexPrice = 100000;
    const opt1Notional = opt1Contracts * opt1LotSize * opt1IndexPrice;       // $10,000
    const opt1PremiumCapAmt = (optionPremiumCap / 100) * opt1Contracts * opt1LotSize * opt1Premium;
    const opt1TradingFee = opt1Notional * (optionTakerFee / 100);
    const opt1EffectiveFee = Math.min(opt1PremiumCapAmt, opt1TradingFee);
    const opt1TotalFee = opt1EffectiveFee * GST_MULTIPLIER;


    // --- Options #2 (Taker, BUY 100 contracts) ---

    const opt2Contracts = 500;
    const opt2LotSize = 0.001;
    const opt2Premium = 50;
    const opt2IndexPrice = 100000;
    const opt2Notional = opt2Contracts * opt2LotSize * opt2IndexPrice;       // $10,000
    const opt2PremiumCapAmt = (optionPremiumCap / 100) * opt2Contracts * opt2LotSize * opt2Premium;
    const opt2TradingFee = opt2Notional * (optionMakerFee / 100);
    const opt2EffectiveFee = Math.min(opt2PremiumCapAmt, opt2TradingFee);
    const opt2TotalFee = opt2EffectiveFee * GST_MULTIPLIER;

    const fmt = (n) => (Number.isFinite(n) ? n.toFixed(2) : '0.00');

    return [
      {
        id: "futures",
        label: "Futures",
        title: "Trade : BUY 1000 contracts of EURUSD as a Maker",
        content: (
          <>
            <div className={styles.feesExampleContentBlock}>
              <p className={styles.feesExampleLabel}>Current EURUSD Price</p>
              <h4>${futuresNotional.toLocaleString()}</h4>
            </div>

            <div className={styles.feesExampleContentBlock}>
              <p className={styles.feesExampleLabel}>Notional / Order Value</p>
              <h4>1000 × 0.001 × ${futuresNotional.toLocaleString()} = ${futuresNotional.toLocaleString()}</h4>
              <span>No. of contracts × Lot size × Price of EURUSD</span>
            </div>

            <div className={styles.feesExampleContentBlock}>
              <p className={styles.feesExampleLabel}>Trading Fees ({futureMakerFee}%)</p>
              <h4>${futuresNotional.toLocaleString()} × {futureMakerFee}% = ${fmt(futuresFee)}</h4>
            </div>

            <div className={styles.feesExampleContentBlock}>
              <p className={styles.feesExampleLabel}>Total Fees (inc. 18% GST)</p>
              <h4>${fmt(futuresFee)} × 1.18 = ${fmt(futuresTotalFee)}</h4>
            </div>
          </>
        ),
      },

      {
        id: "option1",
        label: "Options #1",
        title: "Trade : BUY 100 contracts of a EURUSD option as a Taker",
        content: (
          <>
            <div className={styles.feesExampleContentBlock}>
              <p className={styles.feesExampleLabel}>Option Premium</p>
              <h4>${opt1Premium}</h4>
            </div>

            <div className={styles.feesExampleContentBlock}>
              <p className={styles.feesExampleLabel}>Order Notional Size / Value</p>
              <h4>{opt1Contracts} × {opt1LotSize} × ${opt1IndexPrice.toLocaleString()} = ${opt1Notional.toLocaleString()}</h4>
              <span>No. of contracts × Lot size × Price of EURUSD</span>
            </div>

            <div className={styles.feesExampleContentBlock}>
              <p className={styles.feesExampleLabel}>{optionPremiumCap}% Premium Cap</p>
              <h4>
                {optionPremiumCap}% × {opt1Contracts} × {opt1LotSize} × ${opt1Premium} = ${fmt(opt1PremiumCapAmt)}
              </h4>
              <span>{optionPremiumCap}% × No. of contracts × Lot size × Premium</span>
            </div>

            <div className={styles.feesExampleContentBlock}>
              <p className={styles.feesExampleLabel}>Trading Fees ({optionTakerFee}%)</p>
              <h4>${opt1Notional.toLocaleString()} × {optionTakerFee}% = ${fmt(opt1TradingFee)}</h4>
            </div>

            <div className={styles.feesExampleContentBlock}>
              <p className={styles.feesExampleLabel}>
                Effective Trading Fees — Min(Trading Fee, {optionPremiumCap}% Premium Cap)
              </p>
              <h4>${fmt(opt1EffectiveFee)}</h4>
            </div>

            <div className={styles.feesExampleContentBlock}>
              <p className={styles.feesExampleLabel}>Total Fees (inc. 18% GST)</p>
              <h4>${fmt(opt1EffectiveFee)} × 1.18 = ${fmt(opt1TotalFee)}</h4>
            </div>
          </>
        ),
      },

      {
        id: "option2",
        label: "Options #2",
        title: "Trade : SELL 500 contracts of a EURUSD option as a Maker",
        content: (
          <>
            <div className={styles.feesExampleContentBlock}>
              <p className={styles.feesExampleLabel}>Option Premium</p>
              <h4>${opt2Premium}</h4>
            </div>

            <div className={styles.feesExampleContentBlock}>
              <p className={styles.feesExampleLabel}>
                Order Notional Size / Value
              </p>
              <h4>{opt2Contracts} × {opt2LotSize} × ${opt2IndexPrice.toLocaleString()} = ${opt2Notional.toLocaleString()}</h4>
              <span>No. of contracts x Lot size x Price of EURUSD</span>
            </div>

            <div className={styles.feesExampleContentBlock}>
              <p className={styles.feesExampleLabel}>{optionPremiumCap}% Premium Cap</p>
              <h4>{optionPremiumCap}% × {opt2Contracts} × {opt2LotSize} × ${opt2Premium} = ${fmt(opt2PremiumCapAmt)}</h4>
              <span>{optionPremiumCap}% x No of contracts x Lot size x Premium</span>
            </div>

            <div className={styles.feesExampleContentBlock}>
              <p className={styles.feesExampleLabel}>Trading Fees ({optionMakerFee}%)</p>
              <h4>${opt2Notional.toLocaleString()} × {optionMakerFee}% = ${fmt(opt2TradingFee)}</h4>
            </div>

            <div className={styles.feesExampleContentBlock}>
              <p className={styles.feesExampleLabel}>
                Effective Trading Fees — Min(Trading Fee, {optionPremiumCap}% Premium Cap)
              </p>
              <h4>${fmt(opt2EffectiveFee)}</h4>
            </div>

            <div className={styles.feesExampleContentBlock}>
              <p className={styles.feesExampleLabel}>Total Fees (inc. 18% GST)</p>
              <h4>${fmt(opt2EffectiveFee)} × 1.18 = ${fmt(opt2TotalFee)}</h4>
            </div>
          </>
        ),
      },
      // {
      //   id: "scalper",
      //   label: "Scalper Offer",
      //   title: "Trade : Buy & Sell 1000 Contracts of BTC-USD Perpetual as Maker",
      //   content: (
      //     <div className={styles.feesScalperGrid}>
      //       <div className={styles.feesExampleContentBlock}>
      //         <p className={styles.feesExampleLabel}>BTC Buy Price</p>
      //         <h4>$100000</h4>
      //       </div>

      //       <div className={styles.feesExampleContentBlock}>
      //         <p className={styles.feesExampleLabel}>
      //           Order Notional Size / Value
      //         </p>
      //         <h4>1000 x 0.001 x $100000 = $100000</h4>
      //         <span>No. of contracts x Lot size x Price of BTC</span>
      //       </div>

      //       <div className={styles.feesExampleContentBlock}>
      //         <p className={styles.feesExampleLabel}>Trading Fees (0.02%)</p>
      //         <h4>$100000 x 0.02% = $20</h4>
      //       </div>

      //       <div className={styles.feesExampleContentBlock}>
      //         <p className={styles.feesExampleLabel}>Total Fees (inc. 18% GST)</p>
      //         <h4>$20 x 1.18 = $23.6</h4>
      //       </div>

      //       <div className={styles.feesExampleContentBlock}>
      //         <p className={styles.feesExampleLabel}>BTC Sell Price</p>
      //         <h4>$100100</h4>
      //       </div>

      //       <div className={styles.feesExampleContentBlock}>
      //         <p className={styles.feesExampleLabel}>
      //           Order Notional Size / Value
      //         </p>
      //         <h4>1000 x 0.001 x $100100 = $100100</h4>
      //         <span>No. of contracts x Lot size x Price of BTC</span>
      //       </div>
      //     </div>
      //   ),
      // },
    ];
  }, [feeLookup, styles]);

  useEffect(() => {
    if (!isEmpty(futurePairData)) {
      setFuturesContract(futurePairData?.[0]?.tickerRoot)
      setLotSize(futurePairData?.[0]?.minAmount)
      setBaseCurrency(futurePairData?.[0]?.baseCurrency)
    }
  }, [futurePairData])

  useEffect(() => {
    if (!isEmpty(underlyingDetails)) {
      setOptionContract(underlyingDetails?.[0]?.symbol)
      setLotSize(underlyingDetails?.[0]?.minQuantity)
      // setBaseCurrency(futurePairData?.[0]?.baseCurrency)
    }
  }, [underlyingDetails])

  return (
    <div className={`${styles.feesLanding}`}>
      <section className={styles.feesBanner}>
        <div className="custom-container container mb-5">
    <img src={Images.fees}/>

          <div className={`${styles.feesTabs} mt-5`}>
            <button
              className={`${activeFeesTab == "trading" ? styles.active : ""}`}
              onClick={() => setActiveFeesTab("trading")}
            >
              Trading Fees
            </button>
            <button
              className={`${activeFeesTab == "liquidation" ? styles.active : ""}`}
              onClick={() => setActiveFeesTab("liquidation")}
            >
              Liquidation Fees
            </button>
            {/* <button
              className={`${activeFeesTab == "deposit" ? styles.active : ""}`}
              onClick={() => setActiveFeesTab("deposit")}
            >
              Deposit and Withdrawal Fees
            </button> */}
          </div>
          {activeFeesTab == "trading" && (
            <>
              <div className={`${styles.feesTableWrapper} mt-4`}>
                <table className={styles.feeTable}>
                  <thead>
                    <tr>
                      <th>Category</th>
                      <th>
                        <TooltipComponent text={"Taker fees apply when you remove liquidity by filling an existing order"} triggerType='click'>
                          <span className={styles.dashedText}>
                            Trading Fees (Taker)
                          </span>
                        </TooltipComponent>

                      </th>
                      <th>
                        <TooltipComponent text={"Maker fees apply when you add liquidity to the market by placing a new order that isn't immediately matched"} triggerType='click'>
                          <span className={styles.dashedText}>
                            Trading Fees (Maker)
                          </span>
                        </TooltipComponent>
                      </th>
                    </tr>
                  </thead>

                  <tbody>
                    <tr>
                      <td>Futures</td>
                      <td className={`${styles.valueText} ${styles.value}`}>
                        {feeLookup.futureTakerFee ?? 0}%
                      </td>
                      <td className={`${styles.valueText} ${styles.value}`}>
                        {feeLookup.futureMakerFee ?? 0}%
                      </td>
                    </tr>

                    <tr>
                      <td>Options</td>

                      <td className={styles.value}>
                        {/* <span className={styles.oldPrice}>0.03%</span> */}
                        <span className={styles.newPrice}>
                          {feeLookup.optionTakerFee ?? 0}%
                        </span>
                      </td>

                      <td className={styles.value}>
                        {/* <span className={styles.oldPrice}>0.03%</span> */}
                        <span className={styles.newPrice}>
                          {feeLookup.optionMakerFee ?? 0}%
                        </span>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* <div className={`${styles.feesTableWrapper} mt-4`}>
                <table className={styles.feeTable}>
                  <thead>
                    <tr>
                      <th>Category</th>
                      <th>
                        <TooltipComponent text={"Fee charged when you place a buy order on the spot market"} triggerType='click'>
                          <span className={styles.dashedText}>Buy Order</span>
                        </TooltipComponent>
                      </th>
                      <th>
                        <TooltipComponent text={"Fee charged when you place a sell order on the spot market"} triggerType='click'>
                          <span className={styles.dashedText}>Sell Order</span>
                        </TooltipComponent>
                      </th>
                    </tr>
                  </thead>

                  <tbody>
                    <tr>
                      <td>Spot</td>
                      <td className={`${styles.valueText} ${styles.value}`}>
                        0.05%
                      </td>
                      <td className={`${styles.valueText} ${styles.value}`}>
                        0.02%
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div> */}

              <div className="mt-4">
                <p className={styles.feesThemePara}>
                  <MdOutlineKeyboardArrowRight /> 18% GST is applicable on
                  trading fees
                </p>
                <p className={`${styles.feesThemePara} mt-3`}>
                  <MdOutlineKeyboardArrowRight /> Option Fee is capped at{" "}
                  {/* <span>10%</span>  */}
                  {feeLookup.optionPremiumCap ?? 0}% of Option Premium
                </p>
                <p className={`${styles.feesPara} mt-3`}>
                  <GoDotFill /> Fees is applicable on Notional / Order Value
                  (For e.g. For an option trade of notional ₹10,000, trading
                  fees will be ₹1)
                </p>
                <p className={`${styles.feesPara} mt-3`}>
                  <GoDotFill /> Settlement fee applies to all open contracts at
                  the time of settlement (Taker Fees will be charged)
                </p>
              </div>

              <div className="mt-5">
                <Row xs={1} sm={1} md={1} lg={2}>
                  <Col>
                    <div>
                      <p className={styles.feesLabelTitle}>
                        Trading fee calculator
                      </p>
                      <div className={`${styles.tradingCalculator} mt-3`}>
                        <div className={`${styles.tradingCalculatorPadding}`}>
                          <div className={`${styles.tradingCalculatorTabs}`}>
                            <button
                              className={`${activeTradingTab == "future" ? styles.active : ""}`}
                              onClick={() => setActiveTradingTab("future")}
                            >
                              Futures
                            </button>
                            <button
                              className={`${activeTradingTab == "option" ? styles.active : ""}`}
                              onClick={() => setActiveTradingTab("option")}
                            >
                              Options
                            </button>
                          </div>
                        </div>

                        {activeTradingTab == "future" ? (
                          <>
                            <div className={`${styles.tradingCalculatorPadding} py-0`}>
                              <div className="d-flex align-items-center justify-content-between mt-4 ">
                                <div>
                                  <p className={styles.feesLabel}>Contract</p>
                                </div>
                                <div className="d-flex justify-content-end">
                                  <div className={styles.dropdownSelect}>
                                    <CustomDropdown
                                      toggleElement={
                                        <div
                                          className={styles.deltaDropDownToogle}
                                        >
                                          <p>{formatDisplayPair(futuresContract)}</p>
                                        </div>
                                      }
                                      menuItems={
                                        <ul className={styles.deltaDropDownMenu}>
                                          {futurePairData.map((val) => (
                                            <li
                                              key={val.tickerRoot}
                                              onClick={() => {
                                                setFuturesContract(val.tickerRoot)
                                                setLotSize(val.minAmount)
                                                setBaseCurrency(val.baseCurrency)
                                              }}>
                                              {formatDisplayPair(val.tickerRoot)}
                                            </li>
                                          ))}
                                        </ul>
                                      }
                                    />
                                  </div>
                                </div>
                              </div>
                              <div className="d-flex align-items-center justify-content-between mt-4 ">
                                <p className={styles.feesLabel}>Entry Price</p>
                                <div>
                                  <div>
                                    <InputComponent
                                      staticClass=""
                                      staticClassInput={styles.feesInputs}
                                      placeholder={"0.00"}
                                      value={futuresInputs.entryPrice}
                                      name={"entryPrice"}
                                      onChange={onFuturesChange}
                                    />
                                  </div>
                                  <div className={styles.toggleWrapper}>
                                    <span
                                      className={
                                        !isTaker ? styles.activeText : ""
                                      }
                                    >
                                      Maker
                                    </span>

                                    <div
                                      className={styles.toggle}
                                      onClick={() => setIsTaker(!isTaker)}
                                    >
                                      <div
                                        className={`${styles.toggleCircle} ${isTaker
                                          ? styles.toggleRight
                                          : styles.toggleLeft
                                          }`}
                                      ></div>
                                    </div>

                                    <span
                                      className={isTaker ? styles.activeText : ""}
                                    >
                                      Taker
                                    </span>
                                  </div>
                                </div>
                              </div>
                              <div className="d-flex align-items-center justify-content-between mt-4 ">
                                <p className={styles.feesLabel}>Exit Price</p>
                                <div>
                                  <div>
                                    <InputComponent
                                      staticClass=""
                                      staticClassInput={styles.feesInputs}
                                      placeholder={"0.00"}
                                      value={futuresInputs.exitPrice}
                                      name={"exitPrice"}
                                      onChange={onFuturesChange}
                                    />
                                  </div>
                                  <div className={styles.toggleWrapper}>
                                    <span
                                      className={
                                        !isExitTaker ? styles.activeText : ""
                                      }
                                    >
                                      Maker
                                    </span>

                                    <div
                                      className={styles.toggle}
                                      onClick={() => setIsExitTaker(!isExitTaker)}
                                    >
                                      <div
                                        className={`${styles.toggleCircle} ${isExitTaker
                                          ? styles.toggleRight
                                          : styles.toggleLeft
                                          }`}
                                      ></div>
                                    </div>

                                    <span
                                      className={
                                        isExitTaker ? styles.activeText : ""
                                      }
                                    >
                                      Taker
                                    </span>
                                  </div>
                                </div>
                              </div>
                              <div className="d-flex align-items-center justify-content-between mt-4 ">
                                <div>
                                  <p className={styles.feesLabel}>Qty (# lots)</p>
                                  <p className={styles.feesLabel}>1 lot = {lotSize} {baseCurrency}</p>
                                </div>
                                <div>
                                  <div>
                                    <InputComponent
                                      staticClass=""
                                      staticClassInput={styles.feesInputs}
                                      placeholder={"0"}
                                      value={futuresInputs.qty}
                                      name={"qty"}
                                      onChange={onFuturesChange}
                                    />
                                  </div>
                                </div>
                              </div>
                            </div>
                            {/* <div className={`${styles.feesExampleCardHeader} d-flex align-items-center justify-content-between mt-4`}>
                              <div>
                                <TooltipComponent text={"Pay zero fees while closing the trade with Scalper Offer."} triggerType='click'>
                                  <p className={styles.feesLabel}>Scalper Offer</p>
                                </TooltipComponent>
                              </div>
                              <div>
                                <div className={`${styles.toggleWrapper} mt-0`}>
                                  <span
                                    className={
                                      !isScalperTaker ? styles.activeText : ""
                                    }
                                  >
                                    Inactive
                                  </span>

                                  <div
                                    className={styles.toggle}
                                    onClick={() =>
                                      setIsScalperTaker(!isScalperTaker)
                                    }
                                  >
                                    <div
                                      className={`${styles.toggleCircle} ${isScalperTaker
                                        ? styles.toggleRight
                                        : styles.toggleLeft
                                        }`}
                                    ></div>
                                  </div>

                                  <span
                                    className={
                                      isScalperTaker ? styles.activeText : ""
                                    }
                                  >
                                    Active
                                  </span>
                                </div>
                              </div>
                            </div> */}
                            <div className={`${styles.tradingCalculatorPadding} py-0`}>
                              <div className="d-flex align-items-center justify-content-between mt-4 ">
                                <div>
                                  <p className={styles.feesLabel}>Notional / Value</p>
                                </div>
                                <div>
                                  <p className={styles.feesLabelAmount}>
                                    {futuresResults ? `$${fmtCalc(futuresResults.entryNotional) + fmtCalc(futuresResults.exitNotional)}` : '—'}
                                  </p>
                                </div>
                              </div>
                              <div className="d-flex align-items-center justify-content-between mt-4 ">
                                <div>
                                  <p className={styles.feesLabel}>Trading Fees</p>
                                </div>
                                <div>
                                  <p className={styles.feesLabelAmount}>
                                    {futuresResults ? `$${fmtCalc(futuresResults.totalTradingFee, 4)}` : '—'}
                                  </p>
                                </div>
                              </div>
                              <div className="d-flex align-items-center justify-content-between mt-4 ">
                                <div>
                                  <p className={styles.feesLabel}>Total Fees (inc. 18% GST)</p>
                                </div>
                                <div>
                                  <p className={styles.feesLabelAmount}>
                                    {futuresResults ? `$${fmtCalc(futuresResults.totalFeeWithGST, 4)}` : '—'}
                                  </p>
                                </div>
                              </div>
                              <div className="d-flex align-items-center justify-content-between mt-4 ">
                                <div>
                                  <TooltipComponent text={"Min points move after which the net gains/losses are almost 0 after paying the fees and taxes for both the buy and sell transactions"} triggerType='click'>
                                    <p className={styles.feesLabel}>Points to breakeven</p>
                                  </TooltipComponent>
                                </div>
                                <div>
                                  <p className={styles.feesLabelAmount}>
                                    {futuresResults ? fmtCalc(futuresResults.totalFeeWithGST, 4) : '—'}
                                  </p>
                                </div>
                              </div>
                            </div>
                            <div className={`${styles.feesExampleCardHeaderr} d-flex align-items-center justify-content-between mt-4`}>
                              <div>
                                <p className={styles.feesLabel}>Net P&L</p>
                              </div>
                              <div>
                                <p className={`${futuresResults?.netPnL != null && futuresResults.netPnL >= 0 ? styles.colorGreen : ''} ${styles.feesLabelAmount}`}>
                                  {futuresResults?.netPnL != null
                                    ? `$${fmtCalc(futuresResults.netPnL, 4)}`
                                    : '—'}
                                </p>
                              </div>
                            </div>
                          </>
                        ) : (
                          <>
                            <div className={`${styles.tradingCalculatorPadding} py-0`}>
                              <div className="d-flex align-items-center justify-content-between mt-4 ">
                                <div>
                                  <p className={styles.feesLabel}>Contract</p>
                                </div>
                                <div className="d-flex justify-content-end gap-3">
                                  {
                                    underlyingDetails.map((val) => {
                                      return (
                                        <div className="custom-radioForm__secondary d-flex gap-2 mt-2">
                                          <input
                                            type="radio"
                                            name="optionContractRadio"
                                            id={`opt${val.symbol}`}
                                            checked={optionContract === val.symbol}
                                            onChange={() => setOptionContract(val.symbol)}
                                          />
                                          <label htmlFor={`opt${val.symbol}`}>{val.symbol} Options</label>
                                        </div>
                                      )
                                    })
                                  }

                                  {/* <div className="custom-radioForm__secondary d-flex gap-2 mt-2">
                                    <input
                                      type="radio"
                                      name="optionContractRadio"
                                      id="optBTC"
                                      checked={optionContract === 'BTC'}
                                      onChange={() => setOptionContract('BTC')}
                                    />
                                    <label htmlFor="optBTC">EURUSD Options</label>
                                  </div> */}
                                </div>
                              </div>
                              <div className="d-flex align-items-center justify-content-between mt-4 ">
                                <p className={styles.feesLabel}>Entry Premium</p>
                                <div>
                                  <div>
                                    <InputComponent
                                      staticClass=""
                                      staticClassInput={styles.feesInputs}
                                      placeholder={"0.00"}
                                      value={optionsInputs.entryPremium}
                                      name={"entryPremium"}
                                      onChange={onOptionsChange}
                                    />
                                  </div>
                                </div>
                              </div>
                              <div className="d-flex align-items-center justify-content-between mt-4 ">
                                <p className={styles.feesLabel}>Exit Premium</p>
                                <div>
                                  <div>
                                    <InputComponent
                                      staticClass=""
                                      staticClassInput={styles.feesInputs}
                                      placeholder={"0.00"}
                                      value={optionsInputs.exitPremium}
                                      name={"exitPremium"}
                                      onChange={onOptionsChange}
                                    />
                                  </div>
                                </div>
                              </div>
                              <div className={`d-flex align-items-center justify-content-between mt-4`}>
                                <div>
                                  <p className={styles.feesLabel}>Qty (# lots)</p>
                                  <p className={styles.feesLabel}>1 lot = {lotSize} {optionContract}</p>
                                </div>
                                <div>
                                  <div>
                                    <InputComponent
                                      staticClass=""
                                      staticClassInput={styles.feesInputs}
                                      placeholder={"0"}
                                      value={optionsInputs.qty}
                                      name={"qty"}
                                      onChange={onOptionsChange}
                                    />
                                  </div>
                                </div>
                              </div>
                            </div>
                            <div className={`${styles.feesExampleCardHeader} d-flex align-items-center justify-content-between mt-4`}>
                              <div>
                                <p className={styles.feesLabel}>Index Price of {optionContract}</p>
                              </div>
                              <div>
                                <p className={styles.feesLabelAmount}>
                                  {/* {optionsResults ? fmtCalc(optionsResults.indexPrice, 2) : '—'} */}
                                  {optionsIndexPrice ? fmtCalc(optionsIndexPrice, 2) : '—'}
                                </p>
                              </div>
                            </div>
                            <div className={`${styles.tradingCalculatorPadding} py-0`}>
                              <div className="d-flex align-items-center justify-content-between mt-4 ">
                                <div>
                                  <p className={styles.feesLabel}>Notional / Value</p>
                                </div>
                                <div>
                                  <p className={styles.feesLabelAmount}>
                                    {optionsResults ? `$${fmtCalc(optionsResults.notional + optionsResults.notional)}` : '—'}
                                  </p>
                                </div>
                              </div>
                              <div className="d-flex align-items-center justify-content-between mt-4 ">
                                <div>
                                  <p className={styles.feesLabel}>Trading Fees</p>
                                </div>
                                <div>
                                  <p className={styles.feesLabelAmount}>
                                    {optionsResults ? `$${fmtCalc(optionsResults.totalTradingFee, 4)}` : '—'}
                                  </p>
                                </div>
                              </div>
                              <div className="d-flex align-items-center justify-content-between mt-4 ">
                                <div>
                                  <p className={styles.feesLabel}>Total Fees (inc. 18% GST)</p>
                                </div>
                                <div>
                                  <p className={styles.feesLabelAmount}>
                                    {optionsResults ? `$${fmtCalc(optionsResults.totalFeeWithGST, 4)}` : '—'}
                                  </p>
                                </div>
                              </div>
                              <div className="d-flex align-items-center justify-content-between mt-4 ">
                                <div>
                                  <TooltipComponent text={"Min points move after which the net gains/losses are almost 0 after paying the fees and taxes for both the buy and sell transactions"} triggerType='click'>
                                    <p className={styles.feesLabel}>Points to breakeven</p>
                                  </TooltipComponent>
                                </div>
                                <div>
                                  <p className={styles.feesLabelAmount}>
                                    {optionsResults ? `$${fmtCalc(optionsResults.totalFeeWithGST, 4)}` : '—'}
                                  </p>
                                </div>
                              </div>
                            </div>
                            <div className={`${styles.feesExampleCardHeader} d-flex align-items-center justify-content-between mt-4`}>
                              <div>
                                <p className={styles.feesLabel}>Net P&L</p>
                              </div>
                              <div className={styles.feesLabelAmount}>
                                <p className={optionsResults?.netPnL != null && optionsResults.netPnL >= 0 ? styles.colorGreen : ''}>
                                  {optionsResults?.netPnL != null
                                    ? `$${fmtCalc(optionsResults.netPnL, 4)}`
                                    : '—'}
                                </p>
                              </div>
                            </div>
                          </>

                        )}
                      </div>
                    </div>
                  </Col>
                  <Col>
                    <div className="mt-4 mt-lg-0">
                      <p className={styles.feesLabelTitle}>
                        Fee calculation examples
                      </p>

                      <div className={styles.feesExampleWrapper}>
                        <div className={styles.feesExampleTabs}>
                          {feeExampleTabs.map((tab) => (
                            <button
                              key={tab.id}
                              className={`${styles.feesExampleTabBtn} ${activeExampleTab === tab.id
                                ? styles.feesExampleTabActive
                                : ""
                                }`}
                              onClick={() => setActiveExampleTab(tab.id)}
                            >
                              {tab.label}
                            </button>
                          ))}
                        </div>

                        <div className={styles.feesExampleCard}>
                          <div className={styles.feesExampleCardHeader}>
                            <h3>
                              {
                                feeExampleTabs.find(
                                  (item) => item.id === activeExampleTab,
                                )?.title
                              }
                            </h3>
                          </div>

                          <div className={styles.feesExampleCardBody}>
                            {
                              feeExampleTabs.find(
                                (item) => item.id === activeExampleTab,
                              )?.content
                            }
                          </div>
                        </div>
                      </div>
                    </div>
                  </Col>
                </Row>
              </div>
            </>
          )}

          {activeFeesTab == "liquidation" && (
            <>
              <div className={`mt-4`}>
                <h3>Margin Mode : Cross & Isolated </h3>
                <div className={`${styles.feesTableWrapper} mt-4`}>
                  <table className={styles.liquidationTable}>
                    <thead>
                      <tr>
                        <th>Category</th>

                        <th>
                          <TooltipComponent text={"Fee charged when you place a sell order on the spot market"} triggerType='click'>
                            <span className={styles.dashedText}>
                              Liquidation Fee Rate
                            </span>
                          </TooltipComponent>
                        </th>
                      </tr>
                    </thead>

                    <tbody>
                      {/* Futures */}
                      <tr>
                        <td className={styles.categoryTd}>
                          <div className={styles.tableCell}>
                            <div className={styles.sectionTitle}>Futures</div>
                            {feeSettingsList?.filter((val) => {
                              return (
                                val?.tradeMode == 'future' &&
                                val?.feeType == 'liquidation' &&
                                (val?.marginMode?.includes('cross') && val?.marginMode?.includes('isolated'))
                              )
                            }).map((val) => {
                              return (
                                <>
                                  {
                                    val?.leverageRule?.length > 0 ?
                                      <>
                                        <div className={styles.tableText}>{formatDisplayPair(val.pairName)?.toUpperCase()}</div>
                                        {val?.leverageRule.map((value) => {
                                          return (
                                            <div className={styles.tableRow}>
                                              - Max leverage {value.max}x
                                            </div>
                                          )
                                        })}

                                      </> :
                                      <div className={styles.tableRow}>{formatDisplayPair(val.pairName)?.toUpperCase()}</div>
                                  }

                                </>
                              )
                            })
                            }

                            {/* <div className={styles.tableRow}>BTC</div>

                          <div className={styles.tableRow}>ETH</div>

                          <div className={styles.tableText}>
                            All others with:
                          </div>

                          <div className={styles.tableRow}>
                            - Max leverage 100x
                          </div>

                          <div className={styles.tableRow}>
                            - Max leverage 50x
                          </div>

                          <div className={styles.tableRow}>
                            - Max leverage 20x
                          </div>

                          <div className={styles.tableRow}>
                            - Max leverage 10x
                          </div> */}
                          </div>
                        </td>

                        <td className={styles.rateTd}>
                          <div className={styles.tableCell}>
                            <div className={styles.emptySpace}></div>

                            {feeSettingsList?.filter((val) => {
                              return (
                                val?.tradeMode == 'future' &&
                                val?.feeType == 'liquidation' &&
                                (val?.marginMode?.includes('cross') && val?.marginMode?.includes('isolated'))
                              )
                            }).map((val) => {
                              return (
                                <>
                                  {
                                    val?.leverageRule?.length > 0 ?
                                      <>
                                        <div className={styles.tableText}></div>
                                        {val?.leverageRule.map((value) => {
                                          return (
                                            <div className={styles.tableRowCenter}>{value?.percent}%</div>
                                          )
                                        })}

                                      </> :
                                      <div className={styles.tableRowCenter}>{val?.feePercentage}%</div>
                                  }

                                </>
                              )
                            })
                            }

                            {/* <div className={styles.tableRowCenter}>0.05%</div>

                          <div className={styles.tableRowCenter}>0.10%</div>

                          <div className={styles.tableText}></div>

                          <div className={styles.tableRowCenter}>0.10%</div>

                          <div className={styles.tableRowCenter}>0.20%</div>

                          <div className={styles.tableRowCenter}>0.50%</div>

                          <div className={styles.tableRowCenter}>1.00%</div> */}
                          </div>
                        </td>
                      </tr>

                      {/* Options */}
                      <tr>
                        <td className={styles.categoryTd}>
                          <div className={styles.tableCell}>
                            <div className={styles.sectionTitle}>Options</div>
                            {feeSettingsList?.filter((val) => {
                              return (
                                val?.tradeMode == 'option' &&
                                val?.feeType == 'liquidation' &&
                                (val?.marginMode?.includes('cross') && val?.marginMode?.includes('isolated'))
                              )
                            }).map((val) => {
                              return (
                                <div className={styles.tableRow}>{formatDisplayPair(val.pairName)}</div>
                              )
                            })
                            }

                            {/* <div className={styles.tableRow}>BTC</div>

                          <div className={styles.tableRow}>ETH</div> */}
                          </div>
                        </td>

                        <td className={styles.rateTd}>
                          <div className={styles.tableCell}>
                            <div className={styles.emptySpace}></div>

                            {feeSettingsList?.filter((val) => {
                              return (
                                val?.tradeMode == 'option' &&
                                val?.feeType == 'liquidation' &&
                                val?.marginMode?.includes('cross') && val?.marginMode?.includes('isolated')
                              )
                            }).map((val) => {
                              return (
                                <div className={styles.tableRowCenter}>
                                  min ( {val.premiumPercentage}% x premium, {val.notionalPercentage}% x notional size )
                                </div>
                                // <div className={styles.tableRow}>{formatDisplayPair(val.pairName)}</div>
                              )
                            })
                            }

                            {/* <div className={styles.tableRowCenter}>
                            min ( 20% x premium, 0.05% x notional size )
                          </div>

                          <div className={styles.tableRowCenter}>
                            min ( 20% x premium, 0.10% x notional size )
                          </div> */}
                          </div>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>


              <div className={`mt-4`}>
                <h3>Margin Mode : Portfolio</h3>
                <div className={`${styles.feesTableWrapper} mt-4`}>
                  <table className={styles.liquidationTable}>
                    <thead>
                      <tr>
                        <th>Category</th>

                        <th>
                          <TooltipComponent text={"Fee charged when you place a sell order on the spot market"} triggerType='click'>
                            <span className={styles.dashedText}>
                              Liquidation Fee Rate
                            </span>
                          </TooltipComponent>
                        </th>
                      </tr>
                    </thead>

                    <tbody>
                      {/* Futures */}
                      <tr>
                        <td className={styles.categoryTd}>
                          <div className={styles.tableCell}>
                            <div className={styles.sectionTitle}>Futures</div>
                            {feeSettingsList?.filter((val) => {
                              return (
                                val?.tradeMode == 'future' &&
                                val?.feeType == 'liquidation' &&
                                val?.marginMode.includes('portfolio')
                              )
                            }).map((val) => {
                              return (
                                <>
                                  {
                                    val?.leverageRule?.length > 0 ?
                                      <>
                                        <div className={styles.tableText}>{formatDisplayPair(val.pairName)?.toUpperCase()}</div>
                                        {val?.leverageRule.map((value) => {
                                          return (
                                            <div className={styles.tableRow}>
                                              - Max leverage {value.max}x
                                            </div>
                                          )
                                        })}

                                      </> :
                                      <div className={styles.tableRow}>{formatDisplayPair(val.pairName)?.toUpperCase()}</div>
                                  }

                                </>
                              )
                            })
                            }

                            {/* <div className={styles.tableRow}>BTC</div>

                          <div className={styles.tableRow}>ETH</div>

                          <div className={styles.tableText}>
                            All others with:
                          </div>

                          <div className={styles.tableRow}>
                            - Max leverage 100x
                          </div>

                          <div className={styles.tableRow}>
                            - Max leverage 50x
                          </div>

                          <div className={styles.tableRow}>
                            - Max leverage 20x
                          </div>

                          <div className={styles.tableRow}>
                            - Max leverage 10x
                          </div> */}
                          </div>
                        </td>

                        <td className={styles.rateTd}>
                          <div className={styles.tableCell}>
                            <div className={styles.emptySpace}></div>

                            {feeSettingsList?.filter((val) => {
                              return (
                                val?.tradeMode == 'future' &&
                                val?.feeType == 'liquidation' &&
                                val?.marginMode.includes('portfolio')
                              )
                            }).map((val) => {
                              return (
                                <>
                                  {
                                    val?.leverageRule?.length > 0 ?
                                      <>
                                        <div className={styles.tableText}></div>
                                        {val?.leverageRule.map((value) => {
                                          return (
                                            <div className={styles.tableRowCenter}>{value?.percent}%</div>
                                          )
                                        })}

                                      </> :
                                      <div className={styles.tableRowCenter}>{val?.feePercentage}%</div>
                                  }

                                </>
                              )
                            })
                            }

                            {/* <div className={styles.tableRowCenter}>0.05%</div>

                          <div className={styles.tableRowCenter}>0.10%</div>

                          <div className={styles.tableText}></div>

                          <div className={styles.tableRowCenter}>0.10%</div>

                          <div className={styles.tableRowCenter}>0.20%</div>

                          <div className={styles.tableRowCenter}>0.50%</div>

                          <div className={styles.tableRowCenter}>1.00%</div> */}
                          </div>
                        </td>
                      </tr>

                      {/* Options */}
                      <tr>
                        <td className={styles.categoryTd}>
                          <div className={styles.tableCell}>
                            <div className={styles.sectionTitle}>Options</div>
                            {feeSettingsList?.filter((val) => {
                              return (
                                val?.tradeMode == 'option' &&
                                val?.feeType == 'liquidation' &&
                                val?.marginMode.includes('portfolio')
                              )
                            }).map((val) => {
                              return (
                                <div className={styles.tableRow}>{formatDisplayPair(val.pairName).toUpperCase()}</div>
                              )
                            })
                            }

                            {/* <div className={styles.tableRow}>BTC</div>

                          <div className={styles.tableRow}>ETH</div> */}
                          </div>
                        </td>

                        <td className={styles.rateTd}>
                          <div className={styles.tableCell}>
                            <div className={styles.emptySpace}></div>

                            {feeSettingsList?.filter((val) => {
                              return (
                                val?.tradeMode == 'option' &&
                                val?.feeType == 'liquidation' &&
                                val?.marginMode.includes('portfolio')
                              )
                            }).map((val) => {
                              return (
                                <div className={styles.tableRowCenter}>
                                  min ( {val.premiumPercentage}% x premium, {val.notionalPercentage}% x notional size )
                                </div>
                                // <div className={styles.tableRow}>{formatDisplayPair(val.pairName)}</div>
                              )
                            })
                            }

                            {/* <div className={styles.tableRowCenter}>
                            min ( 20% x premium, 0.05% x notional size )
                          </div>

                          <div className={styles.tableRowCenter}>
                            min ( 20% x premium, 0.10% x notional size )
                          </div> */}
                          </div>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="mt-4">
                <p className={styles.feesPara}>
                  Whenever a position goes in liquidation, a fee proportional to
                  the notional size is charged. Liquidation fee is computed as:
                  <span> liquidation fee rate x notional size.</span>
                </p>

                <h5 className={`${styles.feesThemePara} mt-3`}>
                  <MdOutlineKeyboardArrowRight />
                  18% GST is applicable on liquidation fees
                </h5>

                {/* <h5 className={`${styles.feesThemePara} mt-3`}>
                  <MdOutlineKeyboardArrowRight />
                  Fee rate shown above is for Isolated and Cross margin. For
                  Portfolio margin, refer to Portfolio liquidation page
                </h5> */}
              </div>
            </>
          )}

          {/* {activeFeesTab == "deposit" && (
            <>
              <div className={styles.depositFeeWrapper}>
                <div className={styles.depositFeeCard}>
                  <h2>0%</h2>
                  <p>Deposit fees</p>
                </div>

                <div className={styles.depositFeeCard}>
                  <h2>0%</h2>
                  <p>Withdrawal fees</p>
                </div>
              </div>

              <div className="mt-4">
                <p className={styles.colorGreen}>
                  <MdOutlineKeyboardArrowRight />
                  Above fees are charged by our payment processor and are
                  inclusive of 18% GST
                </p>
              </div>
            </>
          )} */}
        </div>
      </section>
    </div>
  );
};

export default Fees;
