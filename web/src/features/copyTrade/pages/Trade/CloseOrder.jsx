/** PACKAGE IMPORT */

import React, { useState, useRef, useEffect, useContext } from "react";
import { useSelector } from "react-redux";
import isEmpty from "is-empty";

/** LOCAL FILES IMPORT */

import styles from "../../styles/tradeTable.module.css";
import Button from "../../../../components/Button/Button";
import NoData from "../../../../components/NoData/NoData";

/** Context */
import SocketContext from "../../../../context/socketContext";
import { useGlobalContext } from "../../../../context/GlobalProvider";

/** Actions */
import { MdShare } from "react-icons/md";

import { getCloseOrders } from "../../../../actions/copyTradeAction";
import GrossPLModel from "../../../futuresTrading/modal/grossPLModel";
import { momentFormat } from "../../../../lib/dateTimeHelper";
import { UpdateTab } from "../../../../actions/userAction";
import { formatValue } from "../../../../lib/Common";
import { formatDisplayPair } from "../../../../lib/pairDisplay";
import { useLocation } from "react-router-dom";

/** CODE START */

const directionEnum = {
  long: "Long",
  short: "Short",
};
const CloseOrderHistory = ({ data }) => {
  const socketContext = useContext(SocketContext);
  const location = useLocation();

  // const { convertValue } = usePriceConversion("USDT", 'INR')
  const { convertValue, convertSecValue } = useGlobalContext();

  const { userdetails } = useSelector((state) => state.user);
  const { futureTradePair, futurePairData } = useSelector(
    (state) => state.future,
  );
  const FutureId = useRef(futureTradePair?._id);

  const [type, setType] = useState("");
  const [orderHistory, setorderHistory] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 10 });
  const [count, setCount] = useState(0);
  const [nextPage, setnextPage] = useState(true);
  const [selectedTab, setSelectedTab] = useState("currentContract");
  const [showGrossModal, setShowGrossModal] = useState(false);
  const [pnlCard, setPnlCard] = useState({});
  const [tradeMode, setTradeMode] = useState("all");

  const fetchCloseOrderHistory = async (orderHistory, reqData) => {
    try {
      if (!isEmpty(FutureId.current)) {
        const payload = {
          strategyId: data.strategyId,
          type: "copier",
          userId: data.copierId,
          pairId: "all",
          accountId: userdetails.accountId,
          page: reqData.page,
          limit: reqData.limit,
        };

        let result = await getCloseOrders(
          FutureId.current,
          payload,
          userdetails.secretKey,
          tradeMode,
        );
        // console.log(result, "fetchOrderHistory_getOpenOrders");
        if (result.data.success) {
          setorderHistory([...orderHistory, ...result.data.result?.data]);
          setCount(result.data.result?.count || 0);
          setnextPage(result.data.result?.nextPage || 0);
        } else {
          setorderHistory([]);
        }
      }
    } catch (err) {
      console.log(err, "fetchCloseOrderHistory__err");
    }
  };

  const loadMore = async () => {
    try {
      let Page = pagination.page + 1;
      setPagination({ ...pagination, ...{ page: Page } });
      let reqData = {
        page: Page,
        limit: pagination.limit,
      };
      fetchCloseOrderHistory(orderHistory, reqData);
    } catch (err) {
      console.log(err, "LoadMore___err");
    }
  };

  const getPorfitCalculation = (
    entryPrice,
    closePrice,
    quantity,
    positionSide,
  ) => {
    try {
      // console.log("getPorfitCalculation_trade_pos", { entryPrice, closePrice, quantity, positionSide })
      let profit = 0;
      let percentage = 0;
      if (positionSide == "short") {
        profit = (parseFloat(entryPrice) - parseFloat(closePrice)) * quantity;
        percentage = parseFloat(entryPrice)
          ? ((parseFloat(entryPrice) - parseFloat(closePrice)) / entryPrice) * 100
          : 0;
      } else {
        profit = (parseFloat(closePrice) - parseFloat(entryPrice)) * quantity;
        percentage = parseFloat(entryPrice)
          ? ((parseFloat(closePrice) - parseFloat(entryPrice)) / entryPrice) * 100
          : 0;
      }
      return { profit: profit, percentage: percentage };
    } catch (err) {
      console.log("getPorfitCalculation_err", err);
      return { profit: 0, percentage: 0 };
    }
  };

  const ApplyFilters = (tradeMode = "all", pairId = "all", data) => {
    try {
      if (!isEmpty(data) && data?.length > 0) {
        let filterData = [...data];
        if (!isEmpty(tradeMode) && tradeMode != "all") {
          filterData = filterData.filter((val) => {
            return val.tradeMode == tradeMode;
          });
        }
        if (!isEmpty(pairId) && pairId != "all") {
          filterData = filterData.filter((val) => {
            return val.pairId == pairId;
          });
        }
        let count = filterData.length;
        const start_index = 0;
        const end_index = pagination.page * pagination.limit;
        setCount(count);
        filterData.slice(start_index, end_index);
        setorderHistory(filterData);
        if (count > filterData.length) {
          setnextPage(true);
        } else {
          setnextPage(false);
        }
      } else {
        setorderHistory([]);
        setCount(0);
        setnextPage(false);
      }
    } catch (err) {
      console.log(err, "applyFilters__err");
    }
  };

  const updateCurrentTab = async (pairId, tradeMode, selectedTab) => {
    try {
      const payload = {
        pairId: pairId,
        tradeMode: tradeMode,
        filterType: selectedTab,
      };
      const result = await UpdateTab(payload, userdetails?.secretKey);
    } catch (error) {
      console.log("updateCurrentTab_err", error);
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

  useEffect(() => {
    fetchCloseOrderHistory([], {
      page: 1,
      limit: pagination.limit,
    });
  }, [FutureId.current, tradeMode]);

  useEffect(() => {
    if (userdetails) {
      setSelectedTab(userdetails?.filterType);
      FutureId.current = userdetails?.pairId;
      setTradeMode(userdetails?.tradeMode);
    }
  }, [userdetails]);

  useEffect(() => {
  }, [selectedTab]);
  useEffect(() => {
    setType(location.pathname.split("/")[1]);
  }, [location]);

  useEffect(() => {
    socketContext.socket.on("copyFutureClosedPositionHistory", (result) => {
      ApplyFilters(tradeMode, FutureId.current, result.data);
      // setorderHistory(result.data);
      // setCount(result.count);
      // setnextPage(result.nextPage);
    });
  }, [socketContext]);

  return (
    <div>
      <GrossPLModel
        show={showGrossModal}
        record={pnlCard}
        handleClose={() => setShowGrossModal(false)}
      />

      <div className={styles.headerTabs}>
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
                        {/* <label className="custom-checkInput__label">
                                                    <input
                                                        type="checkbox"
                                                    />
                                                    <span className="custom-checkInput__checkmark"></span>
                                                </label> */}
                      </div>{" "}
                      <span>Symbol</span>
                    </div>
                  </th>
                  <th className="text-end ">Date/Time</th>
                  {/* <th className="text-end ">Pair</th> */}
                  <th className="text-end">Direction</th>
                  <th className="text-end ">Entry price</th>
                  <th className="text-end">Closed price</th>
                  <th className="text-end">Close quantity</th>
                  <th className="text-end">Gross P/L</th>
                  {/* <th className="text-end">Close fee</th> */}
                  <th className="text-end">Balance</th>
                  <th className="text-center table-col__sticky-end table-width__120">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody>
                {orderHistory.length > 0 ? (
                  orderHistory.map((record) => {
                    let futureTradePair = futurePairData?.find(
                      (val) => val?._id.toString() == record?.pairId.toString(),
                    );
                    return (
                      <tr>
                        <td className="text-start  table-col__sticky-start ">
                          <div className="table-flexStart ">
                            <div className="custom-checkInput__container">
                              {/* <label className="custom-checkInput__label">
                                                            <input
                                                                type="checkbox"
                                                            />
                                                            <span className="custom-checkInput__checkmark"></span>
                                                        </label> */}
                            </div>{" "}
                            <span>{formatDisplayPair(record?.pairName)}</span>
                          </div>
                        </td>
                        <td className="text-end ">
                          <p>{momentFormat(record?.createdAt)}</p>
                        </td>
                        {/* <td className="text-end ">
                                                    <p> {formatDisplayPair(record?.pairName)} </p>
                                                </td> */}
                        <td className="text-end ">
                          <p
                            className={`${record?.closing_direction === "long" ? "value-profit" : "value-lose"}`}
                          >
                            {directionEnum[record?.closing_direction]}
                          </p>
                          {/* <p>{record?.closing_direction}</p> */}
                        </td>
                        <td className="text-end ">
                          <p>
                            {isNaN(record?.entryPrice)
                              ? 0
                              : formatValue(
                                  parseFloat(record?.entryPrice),
                                  futureTradePair?.quoteDecimal,
                                )}{" "}
                            {futureTradePair?.quoteCurrency}{" "}
                          </p>
                        </td>
                        <td className="text-end ">
                          <p>
                            {" "}
                            {isNaN(record?.closePrice)
                              ? 0
                              : formatValue(
                                  parseFloat(record?.closePrice),
                                  futureTradePair?.quoteDecimal,
                                )}{" "}
                            {futureTradePair?.quoteCurrency}
                          </p>
                        </td>
                        <td className="text-end ">
                          <p>
                            {" "}
                            {isNaN(record?.quantity)
                              ? 0
                              : formatValue(
                                  parseFloat(record?.quantity),
                                  futureTradePair?.baseDecimal,
                                )}{" "}
                            {futureTradePair?.baseCurrency}
                          </p>
                        </td>
                        <td className="text-end">
                          <p
                            className={`${record?.grossPandL > 0 ? "value-profit" : "value-lose"}`}
                          >
                            {convertValue(
                              record?.grossPandL ?? 0,
                              futureTradePair?.quoteDecimal,
                            )}
                            {/* {isNaN(record?.grossPandL)
                                                        ? 0
                                                        : parseFloat(record?.grossPandL)?.toFixed(futureTradePair?.quoteDecimal)
                                                    } */}{" "}
                            {/* {futureTradePair?.quoteCurrency} */}
                          </p>
                          {/* {} */}
                          <p
                            className={`${record?.grossPandL > 0 ? "value-profit" : "value-lose"}`}
                          >
                            {/* <span className='inrTag'>₹</span> */}
                            <span>
                              {/* {isNaN(record?.grossPandL)
                                                        ? 0
                                                        : convertValue(parseFloat(record?.grossPandL), futureTradePair?.quoteDecimal)
                                                    }{" "} */}
                              {convertSecValue(
                                record?.grossPandL ?? 0,
                                futureTradePair?.quoteDecimal,
                              )}
                            </span>
                          </p>
                        </td>
                        {/* <td className="text-end ">
                                                <p>{isNaN(record?.closeFee)
                                                    ? 0
                                                    : `${parseFloat(record?.closeFee)?.toFixed(
                                                        2
                                                    )}`}{" "}
                                                    {futureTradePair?.quoteCurrency} </p>
                                            </td> */}
                        <td className="text-end ">
                          <p>
                            {/* {isNaN(record?.afterBalance)
                                                        ? 0
                                                        : convertValue(parseFloat(record?.afterBalance))?.toFixed(
                                                            futureTradePair?.quoteDecimal
                                                        )} */}
                            {convertValue(
                              record?.afterBalance ?? 0,
                              futureTradePair?.quoteDecimal,
                            )}{" "}
                            {/* {futureTradePair?.profitCurrency} */}
                          </p>
                          <p>
                            <span>
                              {convertSecValue(
                                record?.afterBalance ?? 0,
                                futureTradePair?.quoteDecimal,
                              )}
                            </span>
                          </p>
                        </td>
                        <td className="">
                          <div className="d-flex justify-content-center">
                            <Button
                              isLoading={false}
                              loadingText=""
                              btnText=""
                              onClick={() => {
                                // Derived from the same grossPandL shown as the
                                // money amount, so the % always agrees with it —
                                // getPorfitCalculation's raw price-delta % was
                                // unrelated to grossPandL and could show a
                                // nonzero % next to a PnL that rounds to 0.
                                const notional =
                                  parseFloat(record.entryPrice) *
                                  parseFloat(record.quantity);
                                const percentage = notional
                                  ? (parseFloat(record.grossPandL) / notional) * 100
                                  : 0;
                                setPnlCard({
                                  ...record,
                                  pnl: record.grossPandL,
                                  close_price: record.closePrice,
                                  positionSide: record.closing_direction,
                                  pnl_percen: percentage,
                                });
                                setShowGrossModal(true);
                              }}
                              className="badgeBtnXs"
                              selectedValue={null}
                              reactIconElement={<MdShare />}
                            />
                          </div>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <></>
                )}
              </tbody>
            </table>
          </div>

          {!orderHistory.length ? (
            <div className={styles.noDataContainer}>
              <NoData content={"No Order History"} />
            </div>
          ) : (
            <></>
          )}
        </div>

        {orderHistory?.length > 0 &&
        count != orderHistory?.length &&
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
  );
};

export default CloseOrderHistory;
