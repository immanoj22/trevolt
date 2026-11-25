import React, { useEffect, useRef, useState, useContext } from "react";
import { useDispatch, useSelector } from "react-redux";
import styles from "../styles/authInnerPage.module.css";
import Button from "../../../components/Button/Button";
import { FaChevronDown, FaChevronUp } from "react-icons/fa";
import { capitalize } from "lodash";
import { FuturePairsList } from "../../../redux/futureAction";
import { isEmpty } from "../../../lib/isEmpty";
import { futureClosePosition } from "../../../actions/futureActions";
import { showToastMessage } from "../../../lib/toast";
import { getPorfitCalculation } from "../../../lib/calculation";
import { formatDisplayPair } from "../../../lib/pairDisplay";
import { Link } from "react-router-dom";
import { InputWithCurrencyAndLabel } from "../../../components/Input/InputFields";
import { IoClose } from "react-icons/io5";
import GrossPLModel from "../../futuresTrading/modal/grossPLModel";

const initialState = {
  price: 0,
  quantity: 0,
  percentage: 100,
  typeTIF: "",
  expectedProfit: 0,
  takeProfit: {
    stopPrice: "-",
    price: "-",
  },
  stopLoss: {
    stopPrice: "-",
    price: "-",
  },
};
const PositionDetails = ({ record, tradeMode, openRowId, setOpenRowId }) => {
  const dispatch = useDispatch();
  const { userdetails, positionDetails } = useSelector((state) => state.user);
  const { futurePairsList, futureTicker } = useSelector(
    (state) => state.future,
  );

  const [formData, setFormData] = useState(initialState);
  const [errors, setErrors] = useState(0);
  const [currentMarginType, setCurrentMarginType] = useState("minimum");
  const [currentTradeType, setCurrentTradeType] = useState("market");
  const [showMarginEdit, setShowMarginEdit] = useState(false);
  const [showGrossModal, setShowGrossModal] = useState(false);
  const [pnlCard, setPnlCard] = useState({});

  const manageCloseOrder = (data) => {
    try {
      const isExist = futurePairsList.some((el) => el === data);
      const updateOrder = isExist
        ? futurePairsList.filter((el) => el !== data)
        : [...futurePairsList, data];
      dispatch(
        FuturePairsList({
          pairsList: updateOrder,
          closeType: "",
        }),
      );
    } catch (e) {
      console.log("manageCancelOrder_err", e);
    }
  };
  const closingPositionOrder = async (record) => {
    try {
      const error = {};
      if (currentTradeType === "limit" && isEmpty(formData.price)) {
        error.price = "Price is required";
      }
      if (isEmpty(formData.quantity)) {
        error.quantity = "Quantity is required";
      }
      if (Object.keys(error).length > 0) {
        setErrors(error);
        return;
      }

      const data = {
        pairId: record?.pairId,
        positionSide: record?.positionSide,
        quantity: formData?.quantity,
        orderType: currentTradeType,
        price: formData?.price,
        typeTIF: formData?.typeTIF,
      };
      let { status, message, errors } = await futureClosePosition(
        data,
        userdetails.secretKey,
      );
      if (status) {
        !isEmpty(message) && showToastMessage(message, "success");
        // handleClose()
      } else if (!status) {
        !isEmpty(message) && showToastMessage(message, "error");
        setErrors(errors);
      }
    } catch (err) {
      console.log(err, "CancelOrder___err");
    }
  };

  const handleStandardPositionView = (record) => {
    setOpenRowId((prev) => (prev === record._id ? null : record._id));

    changePercentage(100, record);
  };

  const changePercentage = (percentage, record) => {
    try {
      let quantity =
        parseFloat(record?.positionFilled) * (parseFloat(percentage) / 100);
      quantity = isNaN(quantity) ? 0 : quantity;
      //  setFormData({ ...formData, ...{ quantity: quantity, percentage: percentage, expectedProfit: profit } })
      // quantity = parseFloat(quantity)
      const { profit } = getPorfitCalculation(
        record?.entryPrice,
        record?.close_price,
        quantity,
        record.positionSide,
      );
      const takeProfit = record.bracketOrders.find(
        (el) => el.type === "takeprofit",
      );
      const stopLoss = record.bracketOrders.find(
        (el) => el.type === "stoploss",
      );

      setFormData({
        ...formData,
        ...{
          price: record?.close_price,
          quantity: quantity,
          percentage: percentage,
          expectedProfit: profit,
          takeProfit: {
            stopPrice: takeProfit?.stopPrice ?? 0,
            price: takeProfit?.price ?? 0,
          },
          stopLoss: {
            stopPrice: stopLoss?.stopPrice ?? 0,
            price: stopLoss?.price ?? 0,
          },
        },
      });
    } catch (err) {
      console.log(err, "ChangePercentage__Err");
    }
  };
  const changeExpectedLoss = (
    entryPrice,
    closePrice,
    quantity,
    positionSide,
  ) => {
    const { profit } = getPorfitCalculation(
      entryPrice,
      closePrice,
      quantity,
      positionSide,
    );
    setFormData({
      ...formData,
      ...{ expectedProfit: profit, price: closePrice },
    });
  };

  useEffect(() => {
    if (currentTradeType == "market") {
      let quantity =
        parseFloat(record?.positionFilled) *
        (parseFloat(formData.percentage) / 100);
      quantity = isNaN(quantity) ? 0 : quantity;
      const { profit } = getPorfitCalculation(
        record.entryPrice,
        record.close_price,
        quantity,
        record.positionSide,
      );
      setFormData({
        ...formData,
        ...{ expectedProfit: profit, price: record.close_price },
      });
    }
  }, [record]);
  return (
    <>
      <GrossPLModel
        show={showGrossModal}
        record={pnlCard}
        handleClose={() => setShowGrossModal(false)}
      />
      <tr
        key={record._id}
        onClick={() => handleStandardPositionView(record)}
        className=""
      >
        <>
          {/* <td className="text-start">
                            {record._id === openRowId ? (
                                    <FaChevronUp fontSize={10} />
                                ) : (
                                    <FaChevronDown fontSize={10} />
                            )}
                        </td> */}
          <td
            // className=""
            className={`${openRowId != null && "sticky-none"} table-col__sticky-start`}
          >
            <div className="d-flex align-items-center gap-4">
              {record._id === openRowId ? (
                <FaChevronUp fontSize={10} />
              ) : (
                <FaChevronDown fontSize={10} />
              )}
              <div className="custom-checkInput__container">
                <label className="custom-checkInput__label">
                  <input
                    type="checkbox"
                    checked={futurePairsList.some((el) => el === record.pairId)}
                    onChange={() => {
                      manageCloseOrder(record.pairId);
                    }}
                  />
                  <span className="custom-checkInput__checkmark"></span>
                </label>
              </div>
            </div>
          </td>
          <td className="text-start">{capitalize(record.tradeMode)}</td>
          <td className="text-start">
            <div className="table-flexStart">
              {tradeMode === "options" && (
                <div
                  className={
                    record.symbolType == "buy"
                      ? "table-buy__indicator"
                      : "table-sell__indicator"
                  }
                >
                  {" "}
                  <span>{record.symbolType == "buy" ? "B" : "S"} </span>
                </div>
              )}
              <p>{formatDisplayPair(record.pairName)}</p>
            </div>
          </td>
          <td className="">
            <div className="table-flexColEnd">
              <p>
                {record?.orderValue}
                <span className="table-value__light ms-1">
                  {record?.pairData?.quoteCurrency}
                </span>
              </p>
              <p className="table-value__light-xs">
                <span className="table-value__profit">
                  {record?.positionFilled}
                </span>{" "}
                size
              </p>
            </div>
          </td>
          <td className="">
            <p>
              {record?.entryPrice} {record?.pairData?.quoteCurrency}
            </p>
          </td>
          <td className="">
            <div className="table-flexColEnd">
              <p>
                {record?.close_price} {record?.pairData?.quoteCurrency}
              </p>
              {/* <p className='table-value__light-xs'> 0</p> */}
            </div>
          </td>
          <td className="">
            <div className="table-flexColEnd">
              {/* dynamic class for positive and negative - table-value__profit , table-value__loss */}
              <p
                className={
                  record.pnl > 0 ? `table-value__profit` : "table-value__loss"
                }
              >
                {record?.pnl?.toFixed(record?.pairData?.quoteDecimal)}{" "}
                <span className="ms-1">{record?.pairData?.quoteCurrency}</span>
              </p>
              <p className="table-value__light-xs table-value__loss">
                {" "}
                {record?.pnl_percen?.toFixed(2)} <span className="ms-1">%</span>
              </p>
            </div>
          </td>
          <td className="">
            <p>
              <span className="table-value__light">
                TP ({record?.pairData?.quoteCurrency}) :
              </span>{" "}
              {isEmpty(record?.takeprofit?.stopPrice)
                ? "--"
                : record?.takeprofit?.stopPrice}
            </p>
            <p>
              <span className="table-value__light">
                SL ({record?.pairData?.quoteCurrency}) :
              </span>{" "}
              {isEmpty(record?.stoploss?.stopPrice)
                ? "--"
                : record?.stoploss?.stopPrice}
            </p>
          </td>{" "}
          <td
            // className="table-col__sticky-end table-width__120"
            className={`${openRowId != null && "sticky-none"} table-col__sticky-end table-width__120`}
          >
            {/* {index === currentPatientDetails ? (
                                                        <FaChevronUp />
                                                    ) : (
                                                        <FaChevronDown />
                                                    )} */}

            <div className={`table-flexCenter`}>
              <Button
                isLoading={false}
                loadingText=""
                btnText=""
                onClick={() => {
                }}
                className="dangerOuterlineButtonXs"
                selectedValue={null}
                reactIconElement={<IoClose />}
              />
            </div>
          </td>
        </>
      </tr>

      {record._id === openRowId ? (
        <tr className={`tableContainterDetails`}>
          <td colSpan={10} className="text-center">
            <div className={styles.tableDetailsGrid}>
              <div className={styles.tdGridOne}>
                <div className={styles.gridOneContainer}>
                  <div className={styles.gridOneLeft}>
                    <p className={""}>
                      <span className={`me-2 table-value__light`}>UPNL</span>
                      <span
                        className={`me-2 ${record?.pnl > 0 ? "table-value__profit" : "table-value__loss"}`}
                      >
                        {record?.pnl?.toFixed(record?.pairData?.quoteDecimal)}{" "}
                        {record?.pairData?.quoteCurrency}
                      </span>
                      <span>{`(${record?.pnl_percen?.toFixed(2)})`}%</span>
                    </p>
                  </div>
                  {/* <div className={styles.gridOneCenter}>
                                            <p className={''}><span className='me-2 table-value__light'>Realized Cashflows</span><span className='me-2'>{record?.pnlPercentage?.toFixed(2)}</span><span className='me-2 table-value__light'>USD</span></p>
                                        </div> */}
                  <div className={styles.gridOneRight}>
                    <Link
                      className="cardSuccessBtnXs"
                      to="/futures"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Trade
                    </Link>
                    {/* <Button
                                                isLoading={false}
                                                loadingText="Redirecting..."
                                                btnText="Trade"
                                                onClick={() => {}}
                                                className="cardSuccessBtnXs"
                                                selectedValue={null}
                                            /> */}
                    <Button
                      isLoading={false}
                      loadingText="Redirecting..."
                      btnText="Share Position"
                      onClick={() => {
                        setPnlCard(record);
                        setShowGrossModal(true);
                      }}
                      className="cardSuccessBtnXs"
                      selectedValue={null}
                    />
                  </div>
                </div>
              </div>
              {/**Close position card */}
              <div className={styles.tdGridTwo}>
                <div className={styles.tdGridTwoContainer}>
                  <div className={`${styles.tableDropdownTabs} mb-3`}>
                    <button
                      aria-label="market"
                      className={`${currentTradeType == "market" ? styles.active : ""} `}
                      onClick={() => setCurrentTradeType("market")}
                    >
                      Market
                    </button>
                    <button
                      aria-label="limit"
                      className={`${currentTradeType == "limit" ? styles.active : ""} `}
                      onClick={() => setCurrentTradeType("limit")}
                    >
                      Limit
                    </button>
                  </div>

                  <div className={`${styles.tdGridTwoContainerBody} mt - 4`}>
                    {currentTradeType === "limit" && (
                      <div className="table-flexColStart ">
                        <InputWithCurrencyAndLabel
                          id={"limitAmount"}
                          name={"price"}
                          onChange={(name, value) => {
                            changeExpectedLoss(
                              record?.entryPrice,
                              value,
                              formData?.quantity,
                              record.positionSide,
                            );
                          }}
                          placeholder={"Price"}
                          type={"number"}
                          value={formData?.price}
                          disabled={false}
                          key={"limitAmount"}
                          readOnly={false}
                          currency={record?.pairData?.quoteCurrency}
                          error={null}
                          className={"InputTextStartCurrencyAndLabel"}
                        />
                        <span>{errors?.price}</span>
                      </div>
                    )}
                    <div className="table-flexColStart ">
                      <p className="table-value__light">Quantity</p>
                      <div className={"dualBtn-input"}>
                        <div className="dualBtn-input__left">
                          <button
                            aria-label="percentage"
                            className={
                              formData.percentage == 50 ? "active" : ""
                            }
                            onClick={() => {
                              changePercentage(50, record);
                            }}
                          >
                            50%
                          </button>
                          <button
                            aria-label="percentage"
                            className={
                              formData.percentage == 100 ? "active" : ""
                            }
                            onClick={() => {
                              changePercentage(100, record);
                            }}
                          >
                            100%
                          </button>
                        </div>

                        <div className="dualBtn-input__right">
                          <input
                            type="text"
                            value={formData?.quantity}
                            onChange={(e) => {
                              setFormData({
                                ...formData,
                                ...{ quantity: e.target.value },
                              });
                            }}
                          />
                        </div>
                      </div>
                      <span>{errors?.quantity}</span>
                    </div>
                    <div className={`${styles.tdGridTwoFooter} mt-5`}>
                      <div>
                        <p className="table-value__light">
                          Expected{" "}
                          {formData.expectedProfit > 0 ? "Profit" : "Loss"}
                        </p>

                        {/* dynamic class - table-value__profit , table-value__loss */}

                        <p
                          className={`mt-2 text-start ${formData.expectedProfit > 0 ? "table-value__profit" : "table-value__loss"}`}
                        >
                          {formData.expectedProfit.toFixed(
                            record?.pairData?.quoteDecimal,
                          )}{" "}
                          {record?.pairData?.quoteCurrency}
                        </p>
                      </div>

                      <Button
                        isLoading={false}
                        loadingText="Redirecting..."
                        btnText="Close Position"
                        className="successOutLineRectangleBtn"
                        selectedValue={null}
                        onClick={() => closingPositionOrder(record)}
                      />
                    </div>
                  </div>
                </div>
              </div>
              {/**Margin details card */}
              <div className={styles.tdGridThree}>
                <div className={styles.tdGridThreeContainer}>
                  <div className="table-flexStart">
                    <p>Margin</p>
                    <div className="table-badge__xs mx-2">
                      {userdetails?.tradeMode}
                    </div>

                    {/* {showMarginEdit ?
                                                <>
                                                    <Button
                                                        isLoading={false}
                                                        loadingText=""
                                                        btnText=""
                                                        onClick={() => { handleCloseMarginEdit() }}
                                                        className="successOuterlineButtonXs"
                                                        selectedValue={null}
                                                        reactIconElement={<IoMdCheckmark />}
                                                    />
                                                    <Button
                                                        isLoading={false}
                                                        loadingText=""
                                                        btnText=""
                                                        onClick={() => { handleCloseMarginEdit() }}
                                                        className="dangerOuterlineButtonXs"
                                                        selectedValue={null}
                                                        reactIconElement={<IoClose />}
                                                    />
                                                </>
                                                : <Button
                                                    isLoading={false}
                                                    loadingText="Redirecting..."
                                                    btnText="Edit"
                                                    onClick={() => handleShowMarginEdit()}
                                                    className="cardSuccessBtnXxs"
                                                    selectedValue={null}
                                                />
                                            } */}
                  </div>

                  <div className={`${styles.tdGridThreeBody} mt - 4`}>
                    {/* <div className='table-flexColStart'>
                                               <p className='table-value__light'>Auto top-up</p>
                                                 <div className="custom-toggle__secondaryXs">
                                                    <label className="switch">
                                                        <input
                                                            type="checkbox"
                                                        />
                                                     <span className="slider round"></span>
                                                    </label>
                                                  </div>
                                        </div> */}
                    <div className="table-flexColStart mt-4">
                      <p className="table-value__light">
                        Est. Liquidation Price
                      </p>
                      <p>
                        {record?.liquidityPrice}{" "}
                        <span className="ms-2 table-value__light">
                          {record?.pairData?.quoteCurrency}
                        </span>
                      </p>
                    </div>
                    {/* <div className='table-flexColStart mt-4'>
                                                <p className='table-value__light'>Assigned Margin</p>
                                                <p>{record?.initialMargin} <span className='ms-2 table-value__light'>USD</span></p>
                                            </div> */}

                    {showMarginEdit ? (
                      <div className="table-flexColStart mt-4">
                        <p className="table-value__light">Assigned Margin</p>
                        <div className={"dualBtn-input"}>
                          <div className="dualBtn-input__left">
                            <button
                              aria-label="min"
                              className={
                                currentMarginType == "minimum" ? "active" : ""
                              }
                              onClick={() => setCurrentMarginType("minimum")}
                            >
                              Min
                            </button>
                            <button
                              aria-label="max"
                              className={
                                currentMarginType == "maximum" ? "active" : ""
                              }
                              onClick={() => setCurrentMarginType("maximum")}
                            >
                              Max
                            </button>
                          </div>

                          <div className="dualBtn-input__right">
                            <input type="text" value="1.31" />
                          </div>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="table-flexColStart mt-4">
                          <p className="table-value__light">Assigned Margin</p>
                          <p>
                            {record?.initialMargin}{" "}
                            <span className="ms-2 table-value__light">
                              {record?.pairData?.quoteCurrency}
                            </span>
                          </p>
                        </div>
                        {/* <div className='table-flexColStart mt-4'>
                                                    <p className='table-value__light'>Effective Lev.</p>
                                                    <p>101.14x</p>
                                                </div> */}
                      </>
                    )}
                  </div>
                </div>
              </div>
              {/**TP/SL details card */}
              <div className={styles.tdGridFour}>
                <div className="table-flexStart">
                  <p className={``}>TP / SL</p>
                </div>

                <div className={`${styles.tdGridThreeBody} mt - 4`}>
                  <div className="table-flexColStart">
                    <p className="table-value__light">TP Trigger</p>
                    <p>{record?.takeprofit?.stopPrice ?? "-"}</p>
                  </div>

                  <div className="table-flexColStart">
                    <p className="table-value__light">TP Limit</p>
                    <p>{record?.takeprofit?.price ?? "-"}</p>
                  </div>

                  <div className="table-flexColStart">
                    <p className="table-value__light">SL Trigger</p>
                    <p>{record?.stoploss?.stopPrice ?? "-"}</p>
                  </div>

                  <div className="table-flexColStart">
                    <p className="table-value__light">SL Limit</p>
                    <p>{record?.stoploss?.price ?? "-"}</p>
                  </div>
                </div>
              </div>
            </div>
          </td>
        </tr>
      ) : null}
    </>
  );
};

export default PositionDetails;