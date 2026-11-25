/** PACKAGE IMPORT */

import React, { useState, useRef, useEffect, useContext } from "react";
import { IoClose } from "react-icons/io5";
import { GoShareAndroid } from "react-icons/go";
import { FaPlus, FaMinus } from "react-icons/fa6";
import { useDispatch, useSelector } from "react-redux";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import isEmpty from "is-empty";
import { FaPen } from "react-icons/fa";
import { FaRegTrashCan } from "react-icons/fa6";
import Swal from "sweetalert2";

/** LOCAL FILES IMPORT */

import styles from "../../styles/tradeTable.module.css";
import Button from "../../../../components/Button/Button";
import NoData from "../../../../components/NoData/NoData";

import ProfitLossModal from "../../../futuresTrading/modal/ProfitLossModal";
import GrossPLModel from "../../../futuresTrading/modal/grossPLModel";
import CloseOrder from "../../modal/CloseOrder";
import { MdShare, MdModeEdit } from "react-icons/md";

/** Context */
import SocketContext from "../../../../context/socketContext";
import { useGlobalContext } from "../../../../context/GlobalProvider";
import { showToastMessage } from "../../../../lib/toast";

/** CODE START */

/** Actions */
import { futureCancelBracketOrders } from "../../../../actions/futureActions";

/** REDUX */
import {
  FuturePairData,
  FuturePairsList,
  FutureTicker,
} from "../../../../redux/futureAction";
import { PiSigmaThin } from "react-icons/pi";
import { IoIosArrowForward } from "react-icons/io";
import TooltipComponent from "../../../../components/UiComponents/tooltipComponent";
import { formatValue } from "../../../../lib/Common";
import { formatDisplayPair } from "../../../../lib/pairDisplay";
import { getfuturePositionOrders } from "../../../../actions/copyTradeAction";

const sideEnum = {
  long: "Long",
  short: "Short",
};

const Position = ({ data }) => {
  const dispatch = useDispatch();
  const location = useLocation();

  const socketContext = useContext(SocketContext);
  const { theme } = useGlobalContext();
  const { userdetails, wallet, positionDetails } = useSelector(
    (state) => state.user,
  );
  const { futureTradePair, futurePairData, futurePairsList, futureTicker } =
    useSelector((state) => state.future);

  const [type, setType] = useState("");
  const [showProfitLossModal, setShowProfitLossModal] = useState(false);
  const [positionOrder, setPositionOrder] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 10 });
  const [count, setCount] = useState(0);
  const [errors, setErrors] = useState(0);
  const [closeData, setCloseData] = useState({});
  const [selectOrder, setSelectOrder] = useState({});
  const [nextPage, setnextPage] = useState(true);
  const [selectedTab, setSelectedTab] = useState("all");
  const [showCloseOrders, setShowCloseOrders] = useState(false);
  const [showGrossModal, setShowGrossModal] = useState(false);
  const [pnlCard, setPnlCard] = useState({});
  const [tradeMode, setTradeMode] = useState("all");
  const futurePairsData = useRef(futurePairData);

  const FutureId = useRef("all");

  const handleShowCloseOrders = (data) => {
    setCloseData(data);
    setShowCloseOrders(true);
  };

  const handleHideCloseOrders = () => {
    setShowCloseOrders(false);
  };

  const handleShowProfitLossModal = (data) => {
    setSelectOrder({ ...data, ...{ quantity: data.positionFilled } });
    setShowProfitLossModal(true);
  };
  const handleHideProfitLossModal = () => {
    setShowProfitLossModal(false);
  };

  const removeBracketOrders = async (data) => {
    try {
      const confirmBtnColor = "#2563EB"; // Same for dark and light
      const cancelBtnColor = theme === "dark" ? "#2A2C2F" : "#eaecef";
      Swal.fire({
        title: "Are you sure you want to remove bracket orders of this order ?",
        icon: "warning",
        showCancelButton: true,
        confirmButtonText: "Confirm",
        confirmButtonColor: confirmBtnColor,
        cancelButtonColor: cancelBtnColor,
        didOpen: () => {
          const confirmBtn = Swal.getConfirmButton();
          const cancelBtn = Swal.getCancelButton();

          if (confirmBtn) confirmBtn.setAttribute("data-click-effect", "none");
          if (cancelBtn) cancelBtn.setAttribute("data-click-effect", "none");
        },
      }).then(async ({ isConfirmed }) => {
        if (!isConfirmed) return;
        const { status, message } = await futureCancelBracketOrders(
          data,
          userdetails.secretKey,
        );
        showToastMessage(message, status ? "success" : "error");
      });
    } catch (err) {
      console.log(err, "removeBracketOrders__err");
    }
  };

  const manageCloseOrder = (data) => {
    try {
      const isExist = futurePairsList.some((el) => el === data);
      const updateOrder = isExist
        ? futurePairsList.filter((el) => el !== data)
        : [...futurePairsList, data];
      dispatch(
        FuturePairsList({
          pairsList: updateOrder,
        }),
      );
    } catch (e) {
      console.log("manageCancelOrder_err", e);
    }
  };

  const getPorfitCalculation = (
    entryPrice,
    closePrice,
    quantity,
    positionSide,
  ) => {
    try {
      let profit = 0;
      let percentage = 0;
      if (positionSide == "short") {
        profit = (parseFloat(entryPrice) - parseFloat(closePrice)) * quantity;
        percentage =
          (parseFloat(entryPrice) - parseFloat(closePrice)) / entryPrice;
      } else {
        profit = (parseFloat(closePrice) - parseFloat(entryPrice)) * quantity;
        percentage =
          (parseFloat(closePrice) - parseFloat(entryPrice)) / entryPrice;
      }
      return { profit: profit, percentage: percentage };
    } catch (err) {
      console.log("getPorfitCalculation_err", err);
      return { profit: 0, percentage: 0 };
    }
  };

  const ArrangePositionOrder = (result) => {
    try {
      setPositionOrder((prev) =>
        prev.map((val) => {
          if (val.pairName != result.tickerRoot) return val;
          const { profit, percentage } = getPorfitCalculation(
            val?.entryPrice,
            result.marketPrice,
            val.positionFilled,
            val.positionSide,
          );
          return {
            ...val,
            close_price: result.marketPrice,
            pnl: profit,
            pnl_percen: percentage,
          };
        }),
      );
    } catch (err) {
      console.log(err, "ArrangePositionOrder__err");
    }
  };
  useEffect(() => {
    if (
      !isEmpty(futureTradePair) &&
      FutureId.current != futureTradePair._id &&
      FutureId.current !== "all"
    ) {
      FutureId.current = futureTradePair._id;
    }
  }, [futureTradePair]);

  const loadMore = async () => {
    try {
      let Page = pagination.page + 1;
      setPagination({ ...pagination, ...{ page: Page } });
      getPoaitionOrder(tradeMode, FutureId.current);
    } catch (err) {
      console.log(err, "LoadMore___err");
    }
  };

  const getPoaitionOrder = async (
    tradeModeParam = "all",
    pairIdParam = "all",
  ) => {
    try {
      const payload = {
        tradeMode: tradeModeParam,
        pairId: pairIdParam,
        traderId: data.traderId,
        traderAccountId: data.traderAccountId,
      };
      const result = await getfuturePositionOrders(
        payload,
        {},
        userdetails.secretKey,
      );
      if (result.status) {
        setPositionOrder(result.record);
        setCount(result.count || result.record?.length || 0);
        setnextPage(!!result.nextPage);
      } else {
        setPositionOrder([]);
        setCount(0);
        setnextPage(false);
      }
    } catch (error) {
      console.log("getPoaitionOrder_err", error);
    }
  };

  useEffect(() => {
    // if (!isEmpty(positionDetails) && positionDetails?.length > 0) {
    //     if (FutureId.current != 'all') {
    //         let findData = positionDetails.find((val) => (val.pairId == FutureId.current))
    //         if (!isEmpty(findData)) {
    //             setPositionOrder([findData]);
    //             setCount(1);
    //         } else {
    //             setPositionOrder([]);
    //             setCount(0);
    //         }
    //     } else {
    //         setPositionOrder(positionDetails);
    //         setCount(positionDetails.length);
    //     }
    // } else {
    //     setPositionOrder([]);
    //     setCount(0);
    // }

    getPoaitionOrder(tradeMode, FutureId.current);
  }, [tradeMode, FutureId.current]);

  useEffect(() => {
    setType(location.pathname.split("/")[1]);
  }, [location]);

  useEffect(() => {
    socketContext.socket.on("copyFuturesPositionOrder", (result) => {
      setPositionOrder(result.data);
    });

    socketContext.socket.on("FututresPrice", (result) => {
      let tempPairList = [...futurePairsData.current];
      let pairIndex = tempPairList.findIndex(
        (el) => el.tickerRoot == result.tickerRoot,
      );
      if (pairIndex != -1) {
        tempPairList[pairIndex] = { ...tempPairList[pairIndex], ...result };
        ArrangePositionOrder(result);
      }
      if (tempPairList.length > 0) {
        dispatch(FuturePairData({ pairData: tempPairList }));
        futurePairsData.current = tempPairList;
      }

      let futurespair = localStorage.getItem("futurespair");

      if (futurespair == result.tickerRoot) {
        // console.log("FututresPrice_socket_datas", result)
        dispatch(FutureTicker({ tikerData: result }));
      }
    });
  }, []);

  // console.log(positionDetails, "ApplyFilters__positionDetails")

  return (
    <>
      {/* modal import - start */}

      <ProfitLossModal
        show={showProfitLossModal}
        handleClose={handleHideProfitLossModal}
        orderData={selectOrder}
        tabType={"position"}
      />

      <GrossPLModel
        show={showGrossModal}
        record={pnlCard}
        handleClose={() => setShowGrossModal(false)}
      />

      <CloseOrder
        show={showCloseOrders}
        handleClose={handleHideCloseOrders}
        record={closeData}
        strategyData={data}
      />
      {/* modal import - end */}

      <div>
        <div className={styles.headerTabs}>
          
          <button className={styles.totalCard}>
            <span>
              <PiSigmaThin size={22} />
            </span>
            <span>Total UPNL</span>
            <span
              className={
                positionOrder.reduce(
                  (sum, record) => sum + (parseFloat(record?.pnl) || 0),
                  0,
                ) > 0
                  ? "value-profit"
                  : "value-lose"
              }
            >
              {positionOrder
                .reduce((sum, record) => sum + (parseFloat(record?.pnl) || 0), 0)
                .toFixed(2)}{" "}
              USD
            </span>
            <span>
              <IoIosArrowForward size={18} />
            </span>
          </button>
        </div>

        <div>
          <div className={styles.tableSection}>
            <div className="sticky-table ">
              <table className="table">
                <thead>
                  <tr>
                    <th className="text-start table-col__sticky-start ">
                      <div className="table-flexStart ">
                        <div className="custom-checkInput__container">
                          <label className="custom-checkInput__label">
                            {positionOrder.length > 0 && (
                              <input
                                type="checkbox"
                                checked={
                                  positionOrder.length > 0 &&
                                  futurePairsList.length ===
                                    positionOrder.length
                                }
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    const pairId = positionOrder.map(
                                      (el) => el.pairId,
                                    );
                                    dispatch(
                                      FuturePairsList({
                                        pairsList: pairId,
                                      }),
                                    );
                                  } else {
                                    dispatch(
                                      FuturePairsList({
                                        pairsList: [],
                                      }),
                                    );
                                  }
                                }}
                              />
                            )}
                            <span className="custom-checkInput__checkmark"></span>
                          </label>
                        </div>{" "}
                        <span>Symbol</span>
                      </div>
                    </th>
                    <th className="text-center ">Position Side</th>
                    <th className="text-center ">
                      <TooltipComponent text={"Notional"} triggerType="click">
                        Size
                      </TooltipComponent>
                    </th>
                    <th className="text-center ">Notional</th>
                    <th className="text-center">Entry Price</th>
                    <th className="text-center ">
                      <TooltipComponent
                        text={
                          "TP (take profit) and SL (stop loss) orders for this position"
                        }
                        triggerType="click"
                      >
                        TP / SL
                      </TooltipComponent>
                    </th>
                    {/* <th className="text-center">Index Price</th> */}
                    <th className="text-center">Mark Price</th>
                    <th className="text-center">
                      <TooltipComponent
                        text={
                          "Price/ percentage change at which your position will go into liquidation. Note that, it is not possible to compute liquidation prices of portfolio margined positions or cross margined position"
                        }
                        triggerType="click"
                      >
                        Est. Liq. Price
                      </TooltipComponent>
                    </th>
                    <th className="text-center">
                      <TooltipComponent
                        text={
                          "Margin allocated to a position. Available only for isolated margin mode"
                        }
                        triggerType="click"
                      >
                        Margin
                      </TooltipComponent>
                    </th>
                    {/* <th className="text-center">Auto Top-up</th> */}
                    <th className="text-center">
                      <TooltipComponent
                        text={
                          "Note: The cashflows that will take place if all your futures positions are closed at prevailing mark prices and your options positions are closed at the best bid or offer, whichever is applicable"
                        }
                        triggerType="click"
                      >
                        UPNL
                      </TooltipComponent>
                    </th>
                    {/* <th className="text-center">Share</th> */}
                    {/* <th className="text-center">Cashflows</th> */}
                    {/* <th className="text-center">Gross P/L</th> */}
                    <th className="text-center table-col__sticky-end table-width__120">
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {positionOrder.length > 0 ? (
                    positionOrder.map((record) => (
                      <tr>
                        <td className="text-start  table-col__sticky-start ">
                          <div className="table-flexStart ">
                            <div className="custom-checkInput__container">
                              <label className="custom-checkInput__label">
                                <input
                                  type="checkbox"
                                  checked={futurePairsList.some(
                                    (el) => el === record.pairId,
                                  )}
                                  onChange={() => {
                                    manageCloseOrder(record.pairId);
                                  }}
                                />
                                <span className="custom-checkInput__checkmark"></span>
                              </label>
                            </div>{" "}
                            <span>{formatDisplayPair(record?.pairName)}</span>
                          </div>
                        </td>
                        <td className="text-center ">
                          <p
                            className={`${record?.positionSide?.toString()?.trim()?.toLowerCase() === "long" ? "value-profit" : "value-lose"}`}
                          >
                            {sideEnum[record?.positionSide?.toString()?.trim()?.toLowerCase()]}
                          </p>
                        </td>

                        <td className="text-center ">
                          <p className={``}>
                            {formatValue(
                              parseFloat(record?.positionFilled),
                              record?.pairData?.baseDecimal,
                            )}
                          </p>
                        </td>
                        <td className="text-center ">
                          <p>
                            {formatValue(
                              parseFloat(
                                parseFloat(record?.positionFilled) *
                                  parseFloat(record?.entryPrice),
                              ),
                              record?.pairData?.quoteDecimal,
                            )}{" "}
                          </p>
                        </td>
                        <td className="text-center ">
                          <p>
                            {formatValue(
                              parseFloat(record?.entryPrice).toFixed(
                                record?.pairData?.quoteDecimal,
                              ),
                            )}
                          </p>
                        </td>
                        <td className="text-center ">
                          <div className="table-flexCenter">
                            {record?.bracketOrders.length > 0 ? (
                              <div className="tableTp-Sl-data d-flex align-items-center gap-2 flex-nowrap">
                                <div>
                                  <p>
                                    <span className="table-value__light">
                                      TP ({formatDisplayPair(record?.pairData?.quoteCurrency)}) :
                                    </span>{" "}
                                    {isEmpty(record?.takeprofit?.stopPrice)
                                      ? "--"
                                      : record?.takeprofit?.stopPrice}
                                  </p>
                                  <p>
                                    <span className="table-value__light">
                                      SL ({formatDisplayPair(record?.pairData?.quoteCurrency)}) :
                                    </span>{" "}
                                    {isEmpty(record?.stoploss?.stopPrice)
                                      ? "--"
                                      : record?.stoploss?.stopPrice}
                                  </p>
                                </div>
                                <div className="d-flex align-items-center gap-0">
                                  <button
                                    aria-label="penIcon"
                                    className="borderLessButton"
                                    onClick={() =>
                                      handleShowProfitLossModal(record)
                                    }
                                  >
                                    <FaPen />
                                  </button>
                                  <button
                                    aria-label="penIcon"
                                    className="borderLessButton"
                                    onClick={() => {
                                      removeBracketOrders({
                                        pairId: record.pairId,
                                        positionSide: record.positionSide,
                                      });
                                    }}
                                  >
                                    <FaRegTrashCan />
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <Button
                                isLoading={false}
                                loadingText=""
                                btnText={
                                  record?.bracketOrders.length > 0
                                    ? "Edit"
                                    : "Add"
                                }
                                onClick={() =>
                                  handleShowProfitLossModal(record)
                                }
                                className="badgeBtnXs"
                                selectedValue={null}
                                reactIconElement={
                                  record?.bracketOrders.length > 0 ? (
                                    <MdModeEdit />
                                  ) : (
                                    <FaPlus />
                                  )
                                }
                              />
                            )}
                          </div>
                        </td>

                        <td className="text-center ">
                          {formatValue(
                            record?.close_price,
                            record?.pairData?.quoteDecimal,
                          )}
                        </td>
                        <td className="text-center ">
                          <p className={`table-value__loss`}>
                            {userdetails.marginMode == "portfolio"
                              ? "--"
                              : formatValue(
                                  parseFloat(record?.liquidityPrice) ?? 0,
                                  record?.pairData?.quoteDecimal ?? 0,
                                )}
                          </p>
                        </td>
                        <td className="text-center ">
                          <p>
                            {userdetails.marginMode == "portfolio"
                              ? "--"
                              : (formatValue(
                                  parseFloat(record?.initialMargin),
                                  record?.pairData?.quoteDecimal,
                                ) ?? 0)}
                          </p>
                        </td>
                        <td className="text-center ">
                          <p
                            className={
                              record.pnl > 0
                                ? `table-value__profit`
                                : "table-value__loss"
                            }
                          >
                            {formatValue(
                              parseFloat(record?.pnl),
                              record?.pairData?.quoteDecimal,
                            )}{" "}
                          </p>
                        </td>
                        <td className="d-flex justify-content-center">
                          <div className="table-flexCenter">
                            <Button
                              isLoading={false}
                              loadingText=""
                              btnText=""
                              onClick={() => {
                                setPnlCard(record);
                                setShowGrossModal(true);
                              }}
                              className="badgeBtnXs"
                              selectedValue={null}
                              reactIconElement={<MdShare />}
                            />
                          </div>
                        </td>

                        <td className="table-col__sticky-end table-width__120">
                          <div className={`table-flexCenter`}>
                            <Button
                              isLoading={false}
                              loadingText=""
                              btnText=""
                              // onClick={() => { closingPositionOrder(record) }}
                              onClick={() => {
                                handleShowCloseOrders(record);
                              }}
                              className="dangerOuterlineButtonXs"
                              selectedValue={null}
                              reactIconElement={<IoClose />}
                            />
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <></>
                  )}
                </tbody>
              </table>
            </div>

            {!positionOrder.length ? (
              <div className={styles.noDataContainer}>
                <NoData content={"No Position"} />
              </div>
            ) : (
              <></>
            )}
          </div>

          {positionOrder?.length > 0 &&
          count != positionOrder?.length &&
          nextPage ? (
            <div className={styles.loadMoreContainer}>
              <Button
                isLoading={false}
                loadingText="Loading..."
                btnText="Load More"
                onClick={loadMore}
                className="cardBtnRectangleXs"
                selectedValue={null}
              />
            </div>
          ) : (
            <></>
          )}
        </div>
      </div>
    </>
  );
};

export default Position;
