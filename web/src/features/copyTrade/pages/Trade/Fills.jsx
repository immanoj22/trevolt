/** PACKAGE IMPORT */

import React, { useState, useRef, useEffect, useContext } from "react";
import { IoClose } from "react-icons/io5";
import { GoShareAndroid } from "react-icons/go";
import { FaPlus, FaMinus } from "react-icons/fa6";
import { useDispatch, useSelector } from "react-redux";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import isEmpty from "is-empty";
/** LOCAL FILES IMPORT */

import styles from "../../styles/tradeTable.module.css";
import Button from "../../../../components/Button/Button";
import NoData from "../../../../components/NoData/NoData";

/** Context */
import SocketContext from "../../../../context/socketContext";
import { useGlobalContext } from "../../../../context/GlobalProvider";

/** CODE START */

/** Actions */
import { momentFormat } from "../../../../lib/dateTimeHelper";
import { UpdateTab } from "../../../../actions/userAction";
import { formatValue, capitalizeFirst } from "../../../../lib/Common";
import { formatDisplayPair } from "../../../../lib/pairDisplay";
import { getTradeHistories } from "../../../../actions/copyTradeAction";

const sideEnum = {
  buy: "Buy",
  sell: "Sell",
};
const orderTypeEnum = {
  stop_limit: "Stop Limit",
  stop_market: "Stop Market",
  take_profit_limit: "Take Profit Limit",
  take_profit: "Take Profit Market",
  limit: "Limit",
  market: "Market",
  bracket_tp_market: "Bracket - TP",
  bracket_sl_market: "Bracket - SL",
  bracket_tp_limit: "Bracket - TP",
  bracket_sl_limit: "Bracket - SL",
};
const Fills = ({ data }) => {
  const socketContext = useContext(SocketContext);
  const location = useLocation();

  const { userdetails } = useSelector((state) => state.user);
  const { futureTradePair, futurePairData } = useSelector(
    (state) => state.future,
  );
  const FutureId = useRef("all");

  const [type, setType] = useState("");
  const [filledOrders, setFilledOrders] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 10 });
  const [count, setCount] = useState(0);
  const [nextPage, setnextPage] = useState(true);
  const [selectedTab, setSelectedTab] = useState("all");
  const [tradeMode, setTradeMode] = useState("all");

  const fetchFilledHistory = async (orderHistory, reqData) => {
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

        let result = await getTradeHistories(
          FutureId.current,
          payload,
          userdetails.secretKey,
          tradeMode,
        );
        if (result.data.success) {
          setFilledOrders([...orderHistory, ...result.data.result?.data]);
          setCount(result.data.result?.count || 0);
          setnextPage(result.data.result?.nextPage || 0);
        } else {
          setFilledOrders([]);
        }
      }
    } catch (err) {
      console.log(err, "fetchFilledHistory__err");
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
      fetchFilledHistory(orderHistory, reqData);
    } catch (err) {
      console.log(err, "LoadMore___err");
    }
  };

  const truncateString = (str, startChars = 5, endChars = 6) => {
    if (str?.length <= startChars + endChars) return str;
    return `${str?.slice(0, startChars)}...${str?.slice(-endChars)}`;
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
        setFilledOrders(filterData);
        if (count > filterData.length) {
          setnextPage(true);
        } else {
          setnextPage(false);
        }
      } else {
        setFilledOrders([]);
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

  // useEffect(() => {
  //     updateCurrentTab(FutureId.current, tradeMode)
  // }, [selectedTab])

  useEffect(() => {
    if (userdetails) {
      setSelectedTab(userdetails?.filterType);
      FutureId.current = userdetails?.pairId;
      setTradeMode(userdetails?.tradeMode);
    }
  }, [userdetails]);

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
    fetchFilledHistory([], {
      page: 1,
      limit: pagination.limit,
    });
  }, [FutureId.current, tradeMode]);

  useEffect(() => {
    setType(location.pathname.split("/")[1]);
  }, [location]);

  useEffect(() => {
    socketContext.socket.on("copytradeHistory", (result) => {
      ApplyFilters(tradeMode, FutureId.current, result.data);
      // setFilledOrders(result.data);
      // setCount(result.count);
      // setnextPage(result.nextPage);
    });
  }, [socketContext]);

  return (
    <div>
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
                      {/* <div className="custom-checkInput__container">
                                                <label className="custom-checkInput__label">
                                                    <input
                                                        type="checkbox"
                                                    />
                                                    <span className="custom-checkInput__checkmark"></span>
                                                </label>
                                            </div> */}
                      <span>Symbol</span>
                    </div>
                  </th>
                  <th className="text-center ">Fill Qty</th>
                  <th className="text-center ">Side</th>
                  <th className="text-center">Order Qty</th>
                  <th className="text-center ">Execution Price</th>
                  <th className="text-center">Notional</th>
                  {/* <th className="text-center">Size</th> */}
                  {/* <th className="text-center">Fill Type</th> */}
                  <th className="text-center">Order Type</th>
                  <th className="text-center">Role</th>
                  <th className="text-center">Order ID</th>
                  <th className="text-center">Fill ID</th>
                  <th className="text-center">Trading Fee (Inc. GST)</th>
                  <th className="text-center">Date/Time</th>
                  {/* <th className="text-center table-col__sticky-end table-width__120" >Action</th> */}
                </tr>
              </thead>
              <tbody>
                {filledOrders.length > 0 ? (
                  filledOrders.map((record) => {
                    let futureTradePair = futurePairData?.find(
                      (val) => val?._id.toString() == record?.pairId.toString(),
                    );
                    return (
                      <tr>
                        <td className="text-start  table-col__sticky-start ">
                          <div className="table-flexStart ">
                            {/* <div className="custom-checkInput__container">
                                                        <label className="custom-checkInput__label">
                                                            <input
                                                                type="checkbox"
                                                            />
                                                            <span className="custom-checkInput__checkmark"></span>
                                                        </label>
                                                    </div> */}
                            <span>{formatDisplayPair(record?.pairname)}</span>
                          </div>
                        </td>
                        <td className="text-center ">
                          {/*  dynamic class - 'table-value__profit' || 'table-value__loss' */}

                          <p className={`table-value__profit`}>
                            {formatValue(
                              parseFloat(record?.filledQuantity),
                              futureTradePair?.baseDecimal,
                            )}{" "}
                            {record?.baseCurrency}
                          </p>
                        </td>
                        <td className="text-center ">
                          <p
                            // style={{
                            //   color: `${record?.side === "buy" ? "#2EBD85" : "#f6465d"}`,
                            // }}
                          className={`${record?.side === "buy" ? "table-value__profit" : "table-value__loss"}`}
                          >
                            {sideEnum[record?.side]}
                          </p>
                        </td>
                        <td className="text-center ">
                          <p>
                            {formatValue(
                              parseFloat(record?.orderQty),
                              futureTradePair?.baseDecimal,
                            )}
                          </p>
                        </td>
                        <td className="text-center ">
                          <p>
                            {formatValue(
                              parseFloat(record?.price),
                              futureTradePair?.quoteDecimal,
                            )}
                          </p>
                        </td>
                        <td className="text-center ">
                          <p>
                            {formatValue(
                              parseFloat(record?.notional),
                              futureTradePair?.quoteDecimal,
                            )}
                          </p>
                        </td>
                        <td className="text-center ">
                          <p>{capitalizeFirst(record?.orderType)}</p>
                        </td>
                        <td className="text-center ">
                          <p>{record?.isMaker ? "Maker" : "Taker"}</p>
                        </td>
                        <td className="text-center ">
                          <p>{truncateString(record?.orderId)}</p>
                        </td>
                        <td className="text-center ">
                          <p>{truncateString(record?.filledId)}</p>
                        </td>
                        <td className="text-center ">
                          <p>
                            {formatValue(
                              parseFloat(record?.fee),
                              futureTradePair?.feePrec,
                            )}
                          </p>
                        </td>
                        <td className="text-center ">
                          <p>{momentFormat(record?.created_at)}</p>
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

          {!filledOrders.length ? (
            <div className={styles.noDataContainer}>
              <NoData content={"No Order History"} />
            </div>
          ) : (
            <></>
          )}
        </div>

        {filledOrders?.length > 0 &&
          count != filledOrders?.length &&
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

export default Fills;
