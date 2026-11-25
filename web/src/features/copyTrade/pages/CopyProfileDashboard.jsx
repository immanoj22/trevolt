/** PACKAGE IMPORT */

import React, { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import Select from "react-select";
import { FiEdit2 } from "react-icons/fi";
import ReactDatatable from "react-data-table-component";
import { useSearchParams } from "react-router-dom";

/** LOCAL FILES IMPORT */

import styles from "../styles/copyProfileDashboard.module.css";
import Button from "../../../components/Button/Button";
import Images from "../../../utils/Images";
import { useGlobalContext } from "../../../context/GlobalProvider";
import EditPairsModal from "../modal/EditPairsModal";
import {
  InputWithCurrencyAndLabel,
  PrimaryInput,
  PrimaryTextarea,
  SearchInput,
} from "../../../components/Input/InputFields";
import TableNoData from "../../../components/TableNoData/TableNoData";
import DatePicker from "react-datepicker";
import ROIcard from "../modal/ROIcard";
import VolumeAllocation from "../modal/VolumeAllocation";
import {
  editCopier,
  editStrategy,
  getAllStrategy,
  getCommissionHistories,
  getCopierDetail,
  getCopierStats,
  getCopytradeAssets,
  getFollowersDetail,
  getMyStrategy,
  getOpenOrders,
  getOrderHistoriess,
  getPerformanceDetail,
  getProfitandLossCharts,
  getReturnOfInvestmentCharts,
  getStrategyDetail,
  getTradeHistories,
  getVolumeBreakDowns,
  inactiveStardegy,
  UpdateCopiedStrategy,
  updateCopier,
  updateStrategy,
} from "../../../actions/copyTradeAction";
import { useDispatch, useSelector } from "react-redux";
import { isElement, isEmpty } from "lodash";
import config from "../../../config/env";
import Position from "./Trade/Position";
import OpenOrders from "./Trade/OpenOrders";
import StopOrders from "./Trade/StopOrders";
import Fills from "./Trade/Fills";
import CloseOrderHistory from "./Trade/CloseOrder";
import OrderHistory from "./Trade/OrderHistory";
import { showToastMessage } from "../../../lib/toast";
import {
  EditCopierValidation,
  EditTraderValidation,
} from "../../../pages/Validation/copyTradeValidations";
import { momentFormat } from "../../../lib/dateTimeHelper";
import { allStrategies, myStrategies } from "../../../redux/copytradeAction";
import { truncateString } from "../../../lib/Common";
import { formatDisplayPair } from "../../../lib/pairDisplay";

/** CODE START */
const options = [
  { value: "7d", label: "Last 7D" },
  { value: "10d", label: "Last 10D" },
  { value: "1m", label: "Last 1M" },
  { value: "1y", label: "Last 1Y" },
];

const initialValue = {
  _id: "",
  investType: "fixed", // amount || percen
  investPercen: 0,
  maxAllowAmount: "",
  takeProfit: "",
  stopLoss: "",
  leverage: "",
  tradePairs: [],
  strategyId: "",
};

const CopyProfileDashboard = () => {
  const { userdetails } = useSelector((state) => state.user);
  const { futurePairData } = useSelector((state) => state.future);
  const { myStrategy } = useSelector((state) => state.copytrade);
  const formData = new FormData();

  const navigate = useNavigate();
  const { state } = useLocation();
  const location = useLocation();
  const dispatch = useDispatch();
  const { theme } = useGlobalContext();

  const [searchParams] = useSearchParams();
  const strategyId = searchParams.get("id");
  const isAdminView = searchParams.get("adminView") === "true";

  // ComiisionHistory########
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalRows, setTotalRows] = useState(0);
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [coinFilter, setCoinFilter] = useState("");
  const [searchFilter, setSearchFilter] = useState("");
  const coinOptions = [
    { value: "USDT", label: formatDisplayPair("USDT") },
    { value: "BTC", label: "BTC" },
  ];

  const [isMaster, setIsMaster] = useState(false);
  const [selectedTabs, setSelectedTabs] = useState("insights");
  const [chartSelected, setChartSelected] = useState("roi");
  const [openEditPairsModal, setOpenEditPairsModal] = useState(false);
  const [editPairsData, setEditPairsData] = useState(null);
  const [editPairsDataoptions, setEditPairsDataoptions] = useState(null);
  const [viewAccess, setViewAccess] = useState("followers");
  const fileInputRef = useRef(null);
  const [orderTabs, setOrderTabs] = useState("openOrders");
  const [updateProfile, setUpdateProfile] = useState(null); // preview-only blob: URL for <img src>
  // BUG FIX: only the preview blob: URL (a string, not real file data) was
  // ever kept — the actual selected File was discarded in handleFileChange,
  // so submitting a new trader profile image could never have worked. This
  // holds the real File for submission; `updateProfile` above stays exactly
  // as it was, used only for the live preview.
  const [updateProfileFile, setUpdateProfileFile] = useState(null);
  const [isMasterTrader, setIsMasterTrader] = useState(false);
  const [profileData, setProfileData] = useState({});
  const [type, setType] = useState("");
  const [openOrders, setOpenOrders] = useState([]);
  const [performance, setPerformance] = useState({});
  // Tracks the Performance card's own time-range Select — kept separate from `type`
  // (trader/copier), which the value prop was previously (incorrectly) compared
  // against, so the dropdown never showed the actually selected range.
  const [performanceFilterType, setPerformanceFilterType] = useState("1y");
  const [copierStats, setCopierStats] = useState({});
  const [commisionHistory, setCommisionHistory] = useState([]);
  const [copierDetail, setCopierDetails] = useState([]);
  const [searchFollower, setSearchFollower] = useState("");
  const [isCopier, setIscopier] = useState(false);

  const [formValue, setFormValue] = useState(initialValue);
  const [selectedPairs, setSelectedPairs] = useState([]);

  const [error, setError] = useState({});

  let commisioncolumns = [
    {
      name: "S.No",
      selector: (row, index) => index + 1,
      sortable: true,
      center: true,
      width: "80px",
    },
    {
      key: "createdAt",
      name: "Date",
      width: 130,
      className: "w_130 text-center",
      align: "center",
      sortable: false,
      cell: (record) => {
        return (
          <p className="text-center">
            {record.createdAt ? momentFormat(record.createdAt) : "-"}
          </p>
        );
      },
    },
    {
      key: "type",
      name: "Email",
      className: "w_130  text-center",
      align: "center",
      width: 130,
      sortable: false,
      cell: (record) => {
        return (
          <p className="text-center">{record.email ? record.email : "-"}</p>
        );
      },
    },
    {
      key: "balance",
      name: "Coin",
      className: "w_130 ",
      align: "center",
      width: 130,
      sortable: false,
      cell: (record) => {
        return <p className="text-center">{record.currecnySymbol}</p>;
      },
    },
    {
      key: "spotBalance",
      name: "Fee",
      className: "w_130 text-center",
      align: "center",
      width: 130,
      sortable: false,
      cell: (record) => {
        return (
          <p className="text-center">
            {record.fees && !isEmpty(record.fees) ? record.fees : 0}
          </p>
        );
      },
    },
  ];

  let copierscolumns = [
    {
      name: "S.No",
      selector: (row, index) => index + 1,
      sortable: true,
      center: true,
      width: "80px",
    },
    {
      key: "c",
      name: "Email",
      width: 80,
      className: "w_130 text-center",
      align: "center",
      sortable: false,
      cell: (record) => {
        return (
          <p className="text-center">{record.email ? record.email : "-"}</p>
        );
      },
    },
    {
      key: "totalPnl",
      name: "Total PnL",
      width: 80,
      className: "w_130 text-center",
      align: "center",
      sortable: false,
      cell: (record) => {
        return <p className="text-center">{record.ProfitData.totalPnl}</p>;
      },
    },
    {
      key: "totalRoi",
      name: "Total ROI",
      width: 80,
      className: "w_130 text-center",
      align: "center",
      sortable: false,
      cell: (record) => {
        return <p className="text-center">{record.ProfitData.totalRoi}</p>;
      },
    },
  ];

  const strategyAge = (createdDate) => {
    try {
      let diffTime = Math.abs(
        new Date(createdDate).getTime() - new Date().getTime(),
      );
      let days = diffTime / (24 * 60 * 60 * 1000);
      let hours = (days % 1) * 24;
      let minutes = (hours % 1) * 60;
      let secs = (minutes % 1) * 60;
      [days, hours, minutes, secs] = [
        Math.floor(days),
        Math.floor(hours),
        Math.floor(minutes),
        Math.floor(secs),
      ];
      // console.log(days + 'days', hours + 'h', minutes + 'm', secs + 's');
      let age = 0;
      if (days == 0 && hours == 0) {
        age = "now";
      } else if (days == 0 && hours == 1) {
        age = `${hours} hour ago`;
      } else if (days == 1) {
        age = `${days} day ${hours} hours ago`;
      } else {
        age =
          days == 0 ? `${hours} hours ago` : `${days} days ${hours} hours ago`;
      }
      return age;
    } catch (e) {
      console.log("strategyAge_err", e);
    }
  };

  const isOlderThan7Days = (createdDate) => {
    try {
      let diffTime = Math.abs(
        new Date().getTime() - new Date(createdDate).getTime(),
      );
      let days = diffTime / (24 * 60 * 60 * 1000); // convert ms → days
      return days > 7; // true if more than 7 days, false otherwise
    } catch (e) {
      return false;
    }
  };

  const handleBack = () => {
    sessionStorage.removeItem("copyProfileState");
    navigate(-1);
  };

  const handleButtonClick = () => {
    fileInputRef.current.click();
  };

  const handleFileChange = (event) => {
 // Access selected file
    const file = event.target.files[0];
    setUpdateProfile(URL.createObjectURL(file));
    setUpdateProfileFile(file);
  };

  const editPairsDetails = (data) => {
    if (data) {
      setEditPairsData(data);
      setOpenEditPairsModal(true);
    } else {
      setEditPairsData(null);
      setOpenEditPairsModal(false);
    }
    setOpenEditPairsModal(false);
    if (!data) return;
    // setFormValue(prev => ({
    //     ...prev,
    //     tradePairs: data
    // }));
    if (Array.isArray(editPairsDataoptions) && Array.isArray(futurePairData)) {
      const pairsList = editPairsDataoptions
        .map((value) => {
          const pairdetails = futurePairData.find((el) => el._id === value);
          if (!pairdetails) return null;

          return {
            pair: `${pairdetails.baseCurrency} / ${formatDisplayPair("USDT")}`,
            label: pairdetails.tickerRoot,
            value,
            status: pairdetails.status,
            fullObj: pairdetails,
          };
        })
        .filter(Boolean);
      const selected = pairsList.filter((item) => data.includes(item.value));
      setFormValue((prev) => ({
        ...prev,
        tradePairs: selected,
      }));
      setSelectedPairs(selected);
    }
  };

  const getCopierDetails = async () => {
    try {
      const result = await getCopierDetail(
        { strategyId: state.data._id || strategyId },
        userdetails.secretKey,
      );
      const data = result.data.result;
      if (result.data.success) {
        setProfileData(result.data.result);

        setFormValue({
          _id: data._id,
          investType: data.investType || "fixed",
          investPercen: data.investPercen ?? 0,
          maxAllowAmount: data.maxAllowAmount ?? "",
          takeProfit: data.takeProfit ?? "",
          stopLoss: data.stopLoss ?? "",
          leverage: data.leverage ?? 1,
          // tradePairs: data.tradePairs || [],
          strategyId: data.strategyId || "",
        });

        const pairsList = data.tradePairs
          .map((value) => {
            const pairdetails = futurePairData.find((el) => el._id === value);
            if (!pairdetails) return null;

            return {
              pair: `${pairdetails.baseCurrency} / ${formatDisplayPair("USDT")}`,
              label: pairdetails.tickerRoot,
              value,
              status: pairdetails.status,
              fullObj: pairdetails,
            };
          })
          .filter(Boolean);
        const selected = pairsList.filter((item) =>
          data.tradePairs.includes(item.value),
        );

        setFormValue((prev) => ({
          ...prev,
          tradePairs: selected,
        }));

        setSelectedPairs(selected);


        setEditPairsDataoptions(result.data.result.strategyTradePairs);
      }
    } catch (error) {
      console.log("getCopierDetails_err", error);
    }
  };

  const getPerfomanceDetails = async (time = "") => {
    try {
      setPerformance({});
      const payload = {
        // strategyId: state.data._id,
        time: time == "" ? "1Y" : time,
        type: type,
        id: userdetails?.userId,
      };

      if (isEmpty(state?.data)) {
        payload["strategyId"] = strategyId;
      } else {
        payload["strategyId"] = state.data._id;
      }
      if (type == "copier") {
        payload["id"] = isEmpty(userdetails.userId) ? "" : userdetails.userId;
      }
      const result = await getPerformanceDetail(payload, userdetails.secretKey);
      if (result.data.success) {
        setPerformance(result.data.result);
      }
    } catch (e) {
      console.log("getRoi_err", e);
    }
  };

  // const getTradeHistory = async () => {
  //     try {
  //         const payload = {
  //             strategyId: state.data._id,
  //             type: type,
  //             userId: userdetails.userId,
  //             pairId: "all",
  //             accountId: userdetails.accountId
  //         }
  //         const result = await getTradeHistories(payload, userdetails.secretKey)
  //         console.log("sssccdcdsssss 2 1getTradeHistory", result)
  //     } catch (error) {
  //         console.log("getCopierDetails_err", error)
  //     }
  // }

  // const getOrderHistory = async () => {
  //     try {
  //         const payload = {
  //             strategyId: state.data._id,
  //             type: type,
  //             userId: userdetails.userId,
  //             pairId: "all",
  //             accountId: userdetails.accountId
  //         }
  //         const result = await getOrderHistoriess(payload, userdetails.secretKey)
  //         console.log("sssccdcdsssss 2", result)
  //     } catch (error) {
  //         console.log("getCopierDetails_err", error)
  //     }
  // }

  const getCommisionHistory = async (page = 1, limit = 10, filters = {}) => {
    try {
      const payload = {
        startDate: filters.startDate
          ? new Date(filters.startDate).getTime().toString()
          : "",
        endDate: filters.endDate
          ? new Date(filters.endDate).getTime().toString()
          : "",
        search: filters.search || "",
        coin: filters.coin || "",
        page,
        limit,
      };
      const result = await getCommissionHistories(
        payload,
        userdetails.secretKey,
      );
      if (result.data.success) {
        setCommisionHistory(result.data.result);
        setTotalRows(result.data.count);
      }
    } catch (error) {
      console.log("getCopierDetails_err", error);
    }
  };

  const getCurrentFilters = () => ({
    startDate,
    endDate,
    search: searchFilter,
    coin: coinFilter,
  });

  const handlePagination = (page) => {
    setCurrentPage(page);
    getCommisionHistory(page, pageSize, getCurrentFilters());
  };

  const handleRowsPerPageChange = (newLimit, page) => {
    setPageSize(newLimit);
    getCommisionHistory(page, newLimit, getCurrentFilters());
  };

  const getCopiersAssets = async () => {
    try {
      const payload = {
        stradegyId: state.data._id || strategyId,
      };
      const result = await getCopytradeAssets(payload);
    } catch (error) {
      console.log("getCopytradeAssets_err", error);
    }
  };

  // console.log("commmisiisisis", commisionHistory)
  const getfollowers = async (search = "") => {
    try {
      const payload = {
        strategyId: state.data._id || strategyId,
        search: search,
      };
      const result = await getFollowersDetail(payload, userdetails.secretKey);

      if (result.data.success) {
        setCopierDetails(result.data.result);
      }
    } catch (error) {
      console.log("getCopierDetails_err", error);
    }
  };

  const getStradegyDetails = async () => {
    try {
      setProfileData({});
      let payload;
      if (isEmpty(state?.data)) {
        payload = {
          strategyId: strategyId,
        };
      } else {
        payload = {
          strategyId: state.data._id,
        };
      }
      const result = await getStrategyDetail(payload);
      if (result.data.success) {
        setProfileData(result.data.result);
        let respData = result.data.result;
        setFormValue({
          _id: respData._id,
          name: respData.name,
          description: respData.description,
          showHistory: respData.showHistory,
          minFixedInvesPercen: respData.minFixedInvesPercen,
          profileImage: respData.profileImage,
          linkedInUrl: respData.linkedInUrl,
          twitterUrl: respData.twitterUrl,
          telegramUrl: respData.telegramUrl,
          copyTradeFee: respData.copyTradeFee,
          binanceUrl: respData.binanceUrl,
          bybitUrl: respData.bybitUrl,
          coinbaseUrl: respData.coinbaseUrl,
          maxFollower: respData.maxFollower,
        });

        let data = result.data.result;

        const pairsList = data.tradePairs
          .map((value) => {
            const pairdetails = futurePairData.find((el) => el._id === value);
            if (!pairdetails) return null;

            return {
              pair: `${pairdetails.baseCurrency} / ${formatDisplayPair("USDT")}`,
              label: pairdetails.tickerRoot,
              value,
              status: pairdetails.status,
              fullObj: pairdetails,
            };
          })
          .filter(Boolean);
        const selected = pairsList.filter((item) =>
          data.tradePairs.includes(item.value),
        );

        const getPairList = futurePairData.map((val) => {
          return val._id;
          //  {
          // label: val.tickerRoot,
          // value:
          // val._id
          // }
        });

        setFormValue((prev) => ({
          ...prev,
          tradePairs: selected,
        }));

        setSelectedPairs(selected);


        setEditPairsDataoptions(getPairList);
      }
    } catch (error) {
      console.log("getCopierDetails_err", error);
    }
  };

  const getOpenOrder = async () => {
    try {
      const payload = {
        strategyId: state.data._id,
        type: type,
        userId: userdetails.userId,
        pairId: "all",
        accountId: userdetails.accountId,
      };
      const result = await getOpenOrders(payload, userdetails.secretKey);
      if (result.data.success) {
        setOpenOrders(result.data.result);
      }
    } catch (error) {
      console.log("getOpenOrder_err", error);
    }
  };

  const getCopyTrdersDetail = async () => {
    try {
      let id;
      if (isEmpty(state?.data)) {
        id = strategyId;
      } else {
        id = state.data._id;
      }
      const result = await getCopierStats(id.toString());
      if (result.data.success) {
        setCopierStats(result.data.result);
      }
    } catch (error) {
      console.log("getReturnOfInvestment_err", error);
    }
  };

  const updateConfigurations = async () => {
    try {
      if (type == "copier") {
        const valid = EditCopierValidation(formValue);
        if (valid.status) {
          const result = await editCopier(formValue, userdetails.secretKey);
          if (result.data.success) {
            showToastMessage(result.data.message, "success");
          } else if (!isEmpty(result.data.errors)) {
            setError(result.data.errors);
          }
        } else {
          setError(valid.errors);
        }
      } else if (type == "trader") {
        const valid = EditTraderValidation(formValue);
        if (valid.status) {
          Object.keys(formValue).forEach((key) => {
            if (key === "tradePairs") {
              formData.append(
                "tradePairs",
                JSON.stringify(formValue.tradePairs),
              );
            } else {
              formData.append(key, formValue[key]);
            }
          });
          // formData.append("data", formValue)
          // BUG FIX: was appended as "file" (a field the backend never
          // reads — it expects "profileImage") AND as `updateProfile`,
          // which is only the preview blob: URL string, not real file
          // data (the actual File was never kept in state — see
          // updateProfileFile above). Only append when a new image was
          // actually selected; otherwise the existing image is left
          // untouched on the backend, same as before.
          if (updateProfileFile) {
            formData.append("profileImage", updateProfileFile);
          }
          const result = await editStrategy(formData, userdetails.secretKey);
          if (result.data.success) {
            showToastMessage(result.data.message, "success");
          }
        } else {
          setError(valid.errors);
        }
      }

      // if (result.data.success) {
      //     setCopierStats(result.data.result)
      // }
    } catch (error) {
      console.log("getReturnOfInvestment_err", error);
    }
  };

  const getAllStrategyRedux = async () => {
    try {
      const allStrategy = await getAllStrategy();
      if (allStrategy.data.success) {
        dispatch(allStrategies({ allStrategies: allStrategy.data.result }));
      }
    } catch (error) {
      console.log("getAllStrategyRedux___err", error);
    }
  };

  const getMyStrategyRedux = async () => {
    try {
      const mySStrategy = await getMyStrategy();
      if (mySStrategy.data.success) {
        dispatch(myStrategies({ myStrategies: mySStrategy.data.result }));
      }
      return true;
    } catch (error) {
      console.log("getAllStrategyRedux___err", error);
      return true;
    }
  };

  const handleUnfollow = async () => {
    try {
      const payload = {
        // _id: copierDetail[0].copiedId,
        _id: copierDetail.find(
          (val) =>
            val.copierUserId == userdetails.userId &&
            val.copierAccountId == userdetails.accountId,
        ).copiedId,
        status: "inactive",
      };
      const check7days = isOlderThan7Days(
        copierDetail.find(
          (val) =>
            val.copierUserId == userdetails.userId &&
            val.copierAccountId == userdetails.accountId,
        ).createdAt,
      );

      if (!check7days) {
        showToastMessage(
          "You may unfollow after 7 days of copying this strategy.",
          "error",
        );
        return "";
      }

      const result = await updateCopier(payload, userdetails.secretKey);

      if (result.data.success) {
        showToastMessage(result.data.message, "success");
        navigate("/copy-trade");
        getAllStrategyRedux();
      }
    } catch (error) {
      console.log("handleUnfollow_err", error);
    }
  };

  const handleInactive = async () => {
    try {
      const payload = {
        id: state.data._id || strategyId,
        status: "inactive",
      };
      const result = await inactiveStardegy(payload, userdetails.secretKey);
      if (result.data.success) {
        await getMyStrategyRedux();
        showToastMessage(result.data.message, "success");
        navigate("/copy-trade");
      }
    } catch (error) {
      console.log("handleUnfollow_err", error);
    }
  };

  const onChangeHandler = (name, value) => {
    try {
      setError({});
      const regex = /^[0-9]+$/;

      if (regex.test(value) || value === "") {
        setFormValue((prev) => ({
          ...prev,
          [name]: value,
        }));
      }
      if (
        [
          "name",
          "description",
          "showHistory",
          "minFixedInvesPercen",
          "profileImage",
          "linkedInUrl",
          "twitterUrl",
          "telegramUrl",
          "copyTradeFee",
          "binanceUrl",
          "bybitUrl",
          "coinbaseUrl",
        ].includes(name)
      ) {
        setFormValue((prev) => ({
          ...prev,
          [name]: value,
        }));
      }
    } catch (error) {
    }
  };

  useEffect(() => {
    if (!isEmpty(userdetails)) {
      getCommisionHistory(1, 10);
      getfollowers(searchFollower);
      // getOrderHistory()
      // getTradeHistory()
      // getOpenOrder()
      getCopiersAssets();

      if (!isEmpty(type)) {
        getPerfomanceDetails();
      }

      if (type == "copier") {
        getCopierDetails();
      } else if (type == "trader") {
        getCopyTrdersDetail();
        getStradegyDetails();
      }
    }

    if (type == "trader" && isEmpty(userdetails)) {
      getCopyTrdersDetail();
      getStradegyDetails();

      getPerfomanceDetails();
    }
  }, [userdetails, type, state, strategyId]);

  useEffect(() => {
    // isMasterTrader must reflect ownership of the strategy CURRENTLY being
    // viewed (profileData), not whether the logged-in user happens to own
    // some strategy of their own (myStrategy) — otherwise every master
    // trader sees the owner-only Configuration/Commission History/Copy
    // Traders History tabs on every profile they browse, not just their own.
    if (
      !isEmpty(userdetails) &&
      !isEmpty(profileData) &&
      type === "trader" &&
      userdetails.userId == profileData.userId
    ) {
      setIsMasterTrader(true);
    } else {
      setIsMasterTrader(false); // ← reset when viewing other traders
    }
  }, [state, userdetails, profileData, type]);

  useEffect(() => {
    if (
      !isEmpty(myStrategy) &&
      ["approved", "requested"].includes(myStrategy?.status)
    ) {
      setIsMaster(true);
    } else {
      setIsMaster(false);
    }
  }, [myStrategy]);

  useEffect(() => {
    setType(location.pathname.split("/")[1]);
  }, [location]);

  useEffect(() => {
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }, []);

  useEffect(() => {
    setSearchFollower("");
    getfollowers(searchFollower);
  }, [selectedTabs]);

  useEffect(() => {
    const isCopied =
      Array.isArray(profileData.copiersId) &&
      profileData.copiersId.some(
        (c) =>
          c.userId.toString() === userdetails?.userId &&
          c.accountId == userdetails?.accountId &&
          c.status == "active",
      );
    setIscopier(isCopied);
  }, [userdetails, profileData]);

  const handleSearchFollowers = (val) => {
    setSearchFollower(val);
    getfollowers(val);
  };

  let tableConfig = {
    page_size: 10,
    length_menu: [10, 20, 50],
    button: {
      excel: false,
      print: false,
    },
    show_pagination: true,
    show_info: true,
    show_length_menu: false,
    show_filter: false,
  };

  return (
    <>
      <main className={styles.profilePage}>
        <section className={`${styles.profileDashboard}`}>
          <div className="custom-container container my-5">
            {!isAdminView && (
              <div className={styles.profileBackBtn}>
                <Button
                  // isLoading={false}
                  loadingText="Redirecting..."
                  btnText="Back"
                  onClick={handleBack}
                  className="backBtn"
                  selectedValue={null}
                />
              </div>
            )}
            <div className={styles.profileContainer}>
              <div className={styles.profileLeft}>
                <div className={styles.profileImage}>
                  {type == "copier" ? (
                    <img
                      src={
                        userdetails && userdetails?.profileImage
                          ? userdetails?.profileImage
                          : theme == "dark"
                            ? Images.darkDefaultProfile
                            : Images.lightDefaultProfile
                      }
                      alt="Profile"
                    />
                  ) : (
                    <img
                      src={
                        profileData && profileData?.profileImage
                          ? profileData?.profileImage
                          : theme == "dark"
                            ? Images.darkDefaultProfile
                            : Images.lightDefaultProfile
                      }
                      alt="Profile"
                    />
                  )}
                </div>
                <div className={styles.profileDataContainer}>
                  <p className={styles.userName}>
                    {type == "copier"
                      ? userdetails.firstName + " " + userdetails.lastName
                      : truncateString(profileData?.name, 60)}
                  </p>
                  <p className={styles.label}>
                    Registered {strategyAge(profileData.createdAt)}
                  </p>
                  <p>
                    {/* <span className={styles.labelValue}>{type != "copier" ? profileData.totalRoi : profileData.roi}</span> */}
                    {/* <span className={styles.labelValue}>{profileData.roi} </span> */}

                    {/* <span className={styles.labelValue}>{Number(profileData.roi).toFixed(6)} </span> */}

                    {(() => {
                      const roiValue =
                        type === "copier"
                          ? Number(performance?.returnOfInvestment ?? 0) // ✅ copier's actual ROI from perf API
                          : Number(profileData.roi ?? 0); // ✅ trader unchanged
                      return (
                        <span
                          className={`${styles.labelValue} ${
                            roiValue > 0
                              ? styles.profit
                              : roiValue < 0
                              ? styles.loss
                              : ""
                          }`}
                        >
                          {roiValue.toFixed(2)}%
                        </span>
                      );
                    })()}

                    <span className={styles.label}> - ROI</span>
                  </p>
                </div>
              </div>
              <div className={`d-flex align-items-center gap-3 mt-0 mt-md-3`}>
                {!isAdminView && isMasterTrader && userdetails.userId == profileData.userId && (
                  <div className={`${styles.profileRight}`}>
                    <p className={`${styles.labelValue} ${styles.innerGreen}`}>
                      You are now master trader
                    </p>
                  </div>
                )}

                {!isAdminView && isMasterTrader && userdetails.userId == profileData.userId && (
                  <div className={`${styles.chartInnerGreenBtn}`}>
                    <button
                      className={`${styles.labelValue}  ${styles.innerGreen}`}
                      onClick={handleInactive}
                    >
                      In Active
                    </button>
                  </div>
                )}
                {isCopier &&
                  !isMaster &&
                  !isMasterTrader &&
                  type != "copier" &&
                  !isEmpty(userdetails) && (
                    <div className={`${styles.chartInnerGreenBtn}`}>
                      <button
                        className={`${styles.labelValue} ${styles.innerGreen}`}
                        onClick={handleUnfollow}
                      >
                        Unfollow
                      </button>
                    </div>
                  )}
              </div>
            </div>
            <div className={`${styles.labelDescription} mt-5`}>
              <p className={styles.cardTitle}>Description</p>
              <p className={`${styles.label} mt-1`}>
                {truncateString(state?.data?.description, 60) ||
                  truncateString(myStrategy?.description, 60)}
              </p>
            </div>
            <div className={`${styles.profileTabs} mt-5`}>
              <button
                aria-label="insights"
                className={`${selectedTabs == "insights" ? styles.active : ""}`}
                onClick={() => {
                  setSelectedTabs("insights");
                  setChartSelected("roi");
                }}
              >
                Insights
              </button>
              {isMasterTrader || type == "copier" ? (
                <button
                  aria-label="configuration"
                  className={`${selectedTabs == "configuration" ? styles.active : ""}`}
                  onClick={() => setSelectedTabs("configuration")}
                >
                  Configuration
                </button>
              ) : (
                <></>
              )}
              {type == "copier" && (
                <button
                  aria-label="orders"
                  className={`${selectedTabs == "orders" ? styles.active : ""}`}
                  onClick={() => {
                    setSelectedTabs("orders");
                    setOrderTabs("openOrders");
                  }}
                >
                  Orders
                </button>
              )}
              {type == "trader" && isMasterTrader && (
                <button
                  aria-label="commisionHistory"
                  className={`${selectedTabs == "commisionHistory" ? styles.active : ""}`}
                  onClick={() => setSelectedTabs("commisionHistory")}
                >
                  Commission History
                </button>
              )}
              {type == "trader" && isMasterTrader && (
                <button
                  aria-label="copyTraders"
                  className={`${selectedTabs == "copyTraders" ? styles.active : ""}`}
                  onClick={() => setSelectedTabs("copyTraders")}
                >
                  Copy Traders History
                </button>
              )}
            </div>

            {selectedTabs == "insights" && (
              <div className={`${styles.labelContainers} mt-4`}>
                <p className={styles.cardTitle}>Trading data</p>
                {type == "trader" ? (
                  <div className={`${styles.valueContainers} mt-3`}>
                    <div className={`${styles.valueContainersOne}`}>
                      <p className={`${styles.labelValue}`}>
                        {strategyAge(profileData?.createdAt)}
                      </p>
                      <p className={`${styles.label}`}>Trade Start Date</p>
                    </div>
                    <div className={`${styles.valueContainersOne}`}>
                      <p className={`${styles.labelValue}`}>
                        {profileData?.totalCopier}
                      </p>
                      <p className={`${styles.label}`}>Followers</p>
                    </div>
                    <div className={`${styles.valueContainersOne}`}>
                      <p className={`${styles.labelValue}`}>
                        {profileData?.totalPandL} {formatDisplayPair("USDT")}
                      </p>
                      <p className={`${styles.label}`}>Total Pnl</p>
                    </div>
                    <div className={`${styles.valueContainersOne}`}>
                      <p className={`${styles.labelValue}`}>
                        {profileData?.totalAUM} {formatDisplayPair("USDT")}
                      </p>
                      <p className={`${styles.label}`}>Total AUM</p>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className={`${styles.valueContainers} mt-3`}>
                      <div className={`${styles.valueContainersOne}`}>
                        <p className={`${styles.labelValue}`}>
                          {!isEmpty(
                            parseFloat(profileData?.totalPandL).toFixed(2),
                          )
                            ? parseFloat(profileData?.totalPandL).toFixed(2)
                            : 0}{" "}
                          {formatDisplayPair("USDT")}
                        </p>
                        <p className={`${styles.label}`}>Total Pnl</p>
                      </div>
                      <div className={`${styles.valueContainersOne}`}>
                        <p className={`${styles.labelValue}`}>
                          {!isEmpty(
                            parseFloat(profileData?.totalAUM).toFixed(2),
                          )
                            ? parseFloat(profileData?.totalAUM).toFixed(2)
                            : 0}{" "}
                          {formatDisplayPair("USDT")}
                        </p>
                        <p className={`${styles.label}`}>Invested Amount</p>
                      </div>
                    </div>
                  </>
                )}
                <div className={`${styles.wholeChartContainer} mt-5`}>
                  <div className={`${styles.chartContainer}`}>
                    <ROIcard
                      strategyId={
                        state?.data?._id ? state?.data?._id : strategyId
                      }
                      type={type}
                      userId={userdetails.userId}
                    />
                  </div>
                  <div className={`${styles.chartContainer}`}>
                    <div className={styles.labelHeader}>
                      <div className={`${styles.containerFlex}`}>
                        <div>
                          <p className={styles.cardTitle}>Performance</p>
                        </div>
                        <div className={`react-select__width-sm`}>
                          <Select
                            // menuIsOpen
                            isSearchable={false}
                            placeholder="Select"
                            classNamePrefix="react-select__primary"
                            options={options}
                            // options={"Last 7D"
                            //     (userdetails && userdetails?.mobileNumber === "" || userdetails?.mobileNumber === 0) ?
                            //         authOptions.filter((el) => el.value != "mobile") : authOptions
                            // }
                            onChange={(e) => {
                              setPerformanceFilterType(e.value);
                              getPerfomanceDetails(e.value.toUpperCase());
                            }}
                            value={
                              !isEmpty(performanceFilterType)
                                ? options.find(
                                    (val) => val.value == performanceFilterType,
                                  )
                                : ""
                            }
                          />
                        </div>
                      </div>
                    </div>
                    <div className={`${styles.borderBottom}`}></div>
                    <div className={styles.labelBody}>
                      <div className={`${styles.chartInnerContainer}`}>
                        <div className={`${styles.containerFlex}`}>
                          <div>
                            {/* <p className={`${styles.labelValue}`}>{performance?.returnOfInvestment ?? 0}</p> */}

                            <p className={styles.labelValue}>
                              {Number(performance?.returnOfInvestment ?? 0) ===
                                0
                                ? 0
                                : Number(
                                  performance?.returnOfInvestment,
                                ).toFixed(6)}
                            </p>
                            <p className={`${styles.label} mt-2`}>ROI</p>
                          </div>
                          <div>
                            {/* <p className={`${styles.labelValue}`}>{!isEmpty(performance?.totalPandL) ? performance?.totalPandL : 0}</p> */}

                            <p className={styles.labelValue}>
                              {Number(performance?.totalPandL ?? 0) === 0
                                ? 0
                                : Number(performance?.totalPandL).toFixed(6)}
                            </p>

                            <p className={`${styles.label} mt-2 text-end`}>
                              Total profit
                            </p>
                          </div>
                        </div>
                      </div>
                      {/* <div className={`${styles.containerFlex} mt-3`}>
                                                <p className={`${styles.label}`}> Win Rate </p>
                                                <p className={`${styles.labelValue}`}>{performance?.winningPercentage} %</p>
                                            </div>
                                            <div className={`${styles.containerFlex} mt-3`}>
                                                <p className={`${styles.label}`}> Loss Rate </p>
                                                <p className={`${styles.labelValue}`}>{performance?.losingPercentage} %</p>
                                            </div> */}

                      <div className={`${styles.containerFlex} mt-3`}>
                        <p className={styles.label}>Win Rate</p>
                        <p className={styles.labelValue}>
                          {Number(performance?.winningPercentage ?? 0).toFixed(
                            2,
                          )}{" "}
                          %
                        </p>
                      </div>

                      <div className={`${styles.containerFlex} mt-3`}>
                        <p className={styles.label}>Loss Rate</p>
                        <p className={styles.labelValue}>
                          {Number(performance?.losingPercentage ?? 0).toFixed(
                            2,
                          )}{" "}
                          %
                        </p>
                      </div>

                      <div className={`${styles.containerFlex} mt-3`}>
                        <p className={`${styles.label}`}> Total Followers </p>
                        <p className={`${styles.labelValue}`}>
                          {type === "trader"
                            ? performance?.totalFollowers || 0
                            : "-"}
                        </p>
                      </div>
                      <div className={`${styles.containerFlex} mt-3`}>
                        <p className={`${styles.label}`}> Followers PnL's </p>
                        {/* <p className={`${styles.labelValue}`}>{!isEmpty(performance?.followerPandL) ? performance?.followerPandL : 0}</p> */}
                        <p className={`${styles.labelValue}`}>
                          {type === "trader"
                            ? (copierStats?.copiersTotalPnl ?? 0) + " " + formatDisplayPair("USDT")
                            : "-"}{" "}
                        </p>
                      </div>
                      <div className="mt-4">
                        <div class={`${styles.progressContainer}`}>
                          {(() => {
                            const profitCount =
                              Number(performance?.profitCount) || 0;
                            const losingCount =
                              Number(performance?.losingCount) || 0;
                            const totalTrades = profitCount + losingCount;
                            if (totalTrades <= 0) return null;
                            const greenPercentage =
                              (profitCount / totalTrades) * 100;
                            const orangePercentage =
                              (losingCount / totalTrades) * 100;
                            return (
                              <>
                                <div
                                  class={styles.greenBar}
                                  style={{ width: `${greenPercentage}%` }}
                                ></div>
                                <div
                                  class={styles.orangeBar}
                                  style={{ width: `${orangePercentage}%` }}
                                ></div>
                              </>
                            );
                          })()}
                        </div>
                      </div>
                      <div className={`${styles.containerFlex} mt-3`}>
                        <p>
                          {" "}
                          <span className={`${styles.labelValue}`}>
                            Profitable trade :
                          </span>{" "}
                          <span className={`${styles.labelValue}`}>
                            {performance?.profitCount}
                          </span>{" "}
                        </p>
                        <p>
                          {" "}
                          <span className={`${styles.labelValue}`}>
                            Losing trade :
                          </span>{" "}
                          <span className={`${styles.labelValue}`}>
                            {performance?.losingCount}
                          </span>{" "}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className={`${styles.chartContainer}`}>
                    <div>
                      <VolumeAllocation
                        strategyId={
                          state?.data?._id ? state?.data?._id : strategyId
                        }
                        type={type}
                        userId={userdetails.userId}
                      />
                    </div>
                  </div>
                  {type == "trader" && (
                    <div className={`${styles.chartContainer}`}>
                      <div className={styles.labelHeader}>
                        <div className={`${styles.containerFlex}`}>
                          <p className={styles.cardTitle}>Copy Traders</p>
                          <div className={`${styles.chartInnerContainer} p-2`}>
                            <span>
                              {copierStats.curCopier +
                                "/" +
                                copierStats.totalCopier}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className={`${styles.borderBottom}`}></div>
                      <div className={styles.labelBody}>
                        <div className={`${styles.containerFlex}`}>
                          <p className={`${styles.label}`}>Profit and Loss</p>
                          <p className={`${styles.labelValue}`}>
                            {copierStats.copiersTotalPnl} {formatDisplayPair("USDT")}
                          </p>
                        </div>
                        <div className={`${styles.containerFlex} mt-3`}>
                          <p className={`${styles.label}`}> Profit </p>
                          <p className={`${styles.labelValue}`}>
                            {copierStats.copiersProfitcount}
                          </p>
                        </div>
                        <div className={`${styles.containerFlex} mt-3`}>
                          <p className={`${styles.label}`}> Loss </p>
                          <p className={`${styles.labelValue}`}>
                            {copierStats.copierslossingcount}
                          </p>
                        </div>

                        {/* <div className={`${styles.containerFlex} mt-3`}>
                                                <p className={`${styles.label}`}> Winning Percentage </p>
                                                <p className={`${styles.labelValue}`}>{copierStats.copiersWinPercen}%</p>
                                            </div>
                                            <div className={`${styles.containerFlex} mt-3`}>
                                                <p className={`${styles.label}`}> Losing Percentage </p>
                                                <p className={`${styles.labelValue}`}>{copierStats.copierslossPercen} %</p>
                                            </div> */}

                        <div className={`${styles.containerFlex} mt-3`}>
                          <p className={styles.label}>Winning Percentage</p>
                          <p className={styles.labelValue}>
                            {Number(copierStats?.copiersWinPercen ?? 0).toFixed(
                              2,
                            )}
                            %
                          </p>
                        </div>

                        <div className={`${styles.containerFlex} mt-3`}>
                          <p className={styles.label}>Losing Percentage</p>
                          <p className={styles.labelValue}>
                            {Number(
                              copierStats?.copierslossPercen ?? 0,
                            ).toFixed(2)}
                            %
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
            {selectedTabs == "configuration" &&
              type == "trader" &&
              isMasterTrader ? (
              <div className={styles.labelContainers}>
                <div className={styles.containerMaxWidth}>
                  <div className={styles.containerFlex}>
                    <p>Copy trading pairs</p>
                    <Button
                      // isLoading={false}
                      loadingText="Redirecting..."
                      btnText="Edit Pairs"
                      onClick={() => setOpenEditPairsModal(true)}
                      className="cardSuccessBtnSm"
                      selectedValue={null}
                    />
                  </div>
                  <EditPairsModal
                    show={openEditPairsModal}
                    editPairsData={editPairsDataoptions}
                    handleClose={(e) => editPairsDetails(e)}
                  />
                  <div
                    className={`${styles.chartContainer} ${styles.labelHeader} d-flex align-items-center gap-2 mt-3`}
                  >
                    {/* <span className={`${styles.chartInnerContainer} ${styles.label}`}>USDT / BUSD</span> */}

                    {isEmpty(formValue.tradePairs) ? (
                      <p>No pair selected</p>
                    ) : (
                      selectedPairs.map((item) => {
                        return (
                          <div className="">
                            {/* <p className={styles.selectedPairsBorder}> {item.pair}</p> */}
                            <Button
                              // isLoading={false}
                              loadingText="Redirecting..."
                              btnText={item.pair}
                              onClick={() => setOpenEditPairsModal(true)}
                              className="cardSuccessBtnSm"
                              selectedValue={null}
                            />
                          </div>
                        );
                      })
                    )}
                  </div>
                  <div className={`${styles.profileFormContainer} mt-5`}>
                    <p className={styles.cardTitle}>Profile Image</p>
                    <div className={styles.profileImageWrapper}>
                      <div className={`${styles.profileImage} mt-3`}>
                        {updateProfile ? (
                          <img src={updateProfile} alt="Profile" />
                        ) : formValue?.profileImage ? (
                          <img
                            src={formValue?.profileImage}
                            alt="Profile"
                          />
                        ) : (
                          <img
                            src={
                              theme == "dark"
                                ? Images.darkDefaultProfile
                                : Images.lightDefaultProfile
                            }
                            alt="Profile"
                          />
                        )}
                      </div>
                      <div className={styles.imagePosition}>
                        <input
                          ref={fileInputRef}
                          className="d-none"
                          type="file"
                          onChange={handleFileChange}
                        />
                        <button
                          aria-label="editIcon"
                          type="button"
                          className={styles.imageUploadBtn}
                          onClick={handleButtonClick}
                        >
                          <FiEdit2
                            color={theme == "dark" ? "black" : "white"}
                          // color="black"
                          />
                        </button>
                      </div>
                    </div>
                    <p className={`${styles.cardTitle} my-4`}>View Access</p>
                    <div
                      className={`${styles.chartContainer} ${styles.labelHeader}`}
                    >
                      <div className={`${styles.profileTabs} mt-0`}>
                        <button
                          aria-label="masterTrader"
                          className={`${formValue.showHistory == "only_trader" ? styles.active : ""}`}
                          onClick={() =>
                            onChangeHandler("showHistory", "only_trader")
                          }
                        >
                          Master Trader
                        </button>
                        <button
                          aria-label="followers"
                          className={`${formValue.showHistory == "only_copier" ? styles.active : ""}`}
                          onClick={() =>
                            onChangeHandler("showHistory", "only_copier")
                          }
                        >
                          Followers
                        </button>
                      </div>
                    </div>
                    <p className={`${styles.cardTitle} my-4`}>
                      Minimum Invest Percentage
                    </p>
                    <div className={`${styles.fixedAmountField} mt-3`}>
                      <InputWithCurrencyAndLabel
                        id={"limitAmount"}
                        name={"minFixedInvesPercen"}
                        onChange={(name, value) => {
                          onChangeHandler("minFixedInvesPercen", value);
                        }}
                        placeholder={"2"}
                        type={"number"}
                        value={formValue.minFixedInvesPercen}
                        disabled={false}
                        key={"limitAmount"}
                        readOnly={false}
                        currency={formatDisplayPair("USDT")}
                        error={null}
                        className={"InputTextSecondaryCurrencyAndLabel"}
                      />
                    </div>
                    <span className={`${styles.redClr} mt-1`}>
                      {error.minFixedInvesPercen}
                    </span>
                    {/* <p className={`${styles.cardTitle} my-4`}>Minimum Invest (%)</p>
                                        <div className={`${styles.fixedAmountField} mt-3`}>
                                            <InputWithCurrencyAndLabel
                                                id={'limitAmount'}
                                                name={'stopPrice'}
                                                onChange={(name, value) => {
                                                    onChangeHandler('takeProfit', name, value)
                                                }}
                                                placeholder={'5'}
                                                type={'number'}
                                                // value={2}
                                                value={formValue.minFixedInvesPercen}
                                                disabled={false}
                                                key={'limitAmount'}
                                                readOnly={false}
                                                currency={"(%)"}
                                                error={null}
                                                className={"InputTextSecondaryCurrencyAndLabel"} />
                                        </div> */}
                    <p className={`${styles.cardTitle} my-4`}>
                      Copy trade fee (%)
                    </p>
                    <div className={`${styles.modalFormContainer}`}>
                      <PrimaryInput
                        type="text"
                        id="quantity"
                        name={"copyTradeFee"}
                        placeholder="0.001"
                        // value={formData.quantity}
                        value={formValue.copyTradeFee}
                        onChange={(e) =>
                          onChangeHandler("copyTradeFee", e.target.value)
                        }
                        error={null}
                        className={"primaryInputBgFour"}
                      />
                    </div>
                    <span className={`${styles.redClr} mt-1`}>
                      {error.copyTradeFee}
                    </span>
                    <p className={`${styles.cardTitle} my-4`}>LinkedIn</p>
                    <div className={`${styles.modalFormContainer}`}>
                      <PrimaryInput
                        type="text"
                        id="quantity"
                        name={"quantity"}
                        placeholder="https://www.linkedin.com/login"
                        // value={formData.quantity}
                        value={formValue.linkedInUrl}
                        onChange={(e) =>
                          onChangeHandler("linkedInUrl", e.target.value)
                        }
                        error={null}
                        className={"primaryInputBgFour"}
                      />
                    </div>
                    <span className={`${styles.redClr} mt-1`}>
                      {error.linkedInUrl}
                    </span>
                    <p className={`${styles.cardTitle} my-4`}>Twitter</p>
                    <div className={`${styles.modalFormContainer}`}>
                      <PrimaryInput
                        type="text"
                        id="quantity"
                        name={"quantity"}
                        placeholder="https://www.linkedin.com/login"
                        // value={formData.quantity}
                        // onChange={onChangeHandler}
                        value={formValue.twitterUrl}
                        onChange={(e) =>
                          onChangeHandler("twitterUrl", e.target.value)
                        }
                        error={null}
                        className={"primaryInputBgFour"}
                      />
                    </div>
                    <span className={`${styles.redClr} mt-1`}>
                      {error.twitterUrl}
                    </span>
                    <p className={`${styles.cardTitle} my-4`}>Telegram</p>
                    <div className={`${styles.modalFormContainer}`}>
                      <PrimaryInput
                        type="text"
                        id="quantity"
                        name={"quantity"}
                        placeholder="https://www.linkedin.com/login"
                        // value={formData.quantity}
                        // onChange={onChangeHandler}
                        value={formValue.telegramUrl}
                        onChange={(e) =>
                          onChangeHandler("telegramUrl", e.target.value)
                        }
                        error={null}
                        className={"primaryInputBgFour"}
                      />
                    </div>
                    <span className={`${styles.redClr} mt-1`}>
                      {error.telegramUrl}
                    </span>
                    <p className={`${styles.cardTitle} my-4`}>Binance</p>
                    <div className={`${styles.modalFormContainer}`}>
                      <PrimaryInput
                        type="text"
                        id="quantity"
                        name={"quantity"}
                        placeholder="https://www.linkedin.com/login"
                        // value={formData.quantity}
                        // onChange={onChangeHandler}
                        value={formValue.binanceUrl}
                        onChange={(e) =>
                          onChangeHandler("binanceUrl", e.target.value)
                        }
                        error={null}
                        className={"primaryInputBgFour"}
                      />
                    </div>
                    <span className={`${styles.redClr} mt-1`}>
                      {error.binanceUrl}
                    </span>
                    <p className={`${styles.cardTitle} my-4`}>Coinbase</p>
                    <div className={`${styles.modalFormContainer}`}>
                      <PrimaryInput
                        type="text"
                        id="quantity"
                        name={"quantity"}
                        placeholder="https://www.linkedin.com/login"
                        // value={formData.quantity}
                        // onChange={onChangeHandler}
                        value={formValue.coinbaseUrl}
                        onChange={(e) =>
                          onChangeHandler("coinbaseUrl", e.target.value)
                        }
                        error={null}
                        className={"primaryInputBgFour"}
                      />
                    </div>
                    <span className={`${styles.redClr} mt-1`}>
                      {error.coinbaseUrl}
                    </span>
                    <p className={`${styles.cardTitle} my-4`}>Bybit</p>
                    <div className={`${styles.modalFormContainer}`}>
                      <PrimaryInput
                        type="text"
                        id="quantity"
                        name={"quantity"}
                        placeholder="https://www.linkedin.com/login"
                        // value={formData.quantity}
                        // onChange={onChangeHandler}
                        value={formValue.bybitUrl}
                        onChange={(e) =>
                          onChangeHandler("bybitUrl", e.target.value)
                        }
                        error={null}
                        className={"primaryInputBgFour"}
                      />
                    </div>
                    <span className={`${styles.redClr} mt-1`}>
                      {error.bybitUrl}
                    </span>
                    <p className={`${styles.cardTitle} my-4`}>Description</p>
                    <div className={`${styles.modalFormContainer} mb-3`}>
                      <PrimaryTextarea
                        placeholder={"Trevolt exchange is a trading platform"}
                        rows={5}
                        className={"thirdTextarea"}
                        // onChange={() => console.log('changes')}
                        value={formValue.linkedInUrl}
                        onChange={(e) =>
                          onChangeHandler("description", e.target.value)
                        }
                        // value={''}
                        name={"description"}
                        error={null}
                        id={"description"}
                      />
                    </div>
                    <span className={`${styles.redClr} mt-1`}>
                      {error.description}
                    </span>
                    <Button
                      // isLoading={false}
                      loadingText="Redirecting..."
                      btnText="Update"
                      onClick={() => updateConfigurations()}
                      className="cardSuccessBtnSm"
                    // selectedValue={null}
                    />
                  </div>
                </div>
              </div>
            ) : selectedTabs == "configuration" && type == "copier" ? (
              <>
                <div className={styles.copyingTradeContainer}>
                  <div className={styles.containerFlex}>
                    <p>Copy trading pairs</p>
                    <Button
                      // isLoading={false}
                      loadingText="Redirecting..."
                      btnText="Edit Pairs"
                      onClick={() => setOpenEditPairsModal(true)}
                      className="cardSuccessBtnSm"
                      selectedValue={null}
                    />
                  </div>
                  <EditPairsModal
                    show={openEditPairsModal}
                    editPairsData={editPairsDataoptions}
                    handleClose={(e) => editPairsDetails(e)}
                  />

                  <div
                    className={`${styles.selectedpairs} d-flex flex-wrap align-items-center gap-3`}
                  >
                    {isEmpty(formValue.tradePairs) ? (
                      <p>No pair selected</p>
                    ) : (
                      selectedPairs.map((item) => {
                        return (
                          <div>
                            {/* <p className={styles.selectedPairsBorder}>
                                                         {item.pair}
                                                         </p> */}
                            <Button
                              // isLoading={false}
                              loadingText="Redirecting..."
                              btnText={item.pair}
                              onClick={() => setOpenEditPairsModal(true)}
                              className="cardSuccessBtnSm"
                              selectedValue={null}
                            />
                          </div>
                        );
                      })
                    )}
                  </div>
                  <span className={`${styles.redClr} mt-1`}>
                    {error.tradePairs}
                  </span>

                  {/* <div className={styles.copyingTabs}>
                                        <button aria-label="fixedAmount" className={`${selectedTab == 'fixed' ? styles.active : ''}`} onClick={() => setSelectedTab('fixed')}>Fixed</button>
                                        <button aria-label="percentage" className={`${selectedTab == 'flexible' ? styles.active : ''}`} onClick={() => setSelectedTab('flexible')}>Flexible</button>
                                    </div> */}

                  {profileData.investType == "fixed" ? (
                    <>
                      <p>Invest Percentage</p>

                      <div className={`${styles.fixedAmountField} mt-3`}>
                        <InputWithCurrencyAndLabel
                          id={"limitAmount"}
                          name={"stopPrice"}
                          onChange={(name, value) => {
                            onChangeHandler("investPercen", value);
                            setError({});
                          }}
                          placeholder={""}
                          type={"number"}
                          value={formValue.investPercen}
                          disabled={false}
                          key={"limitAmount"}
                          readOnly={false}
                          currency={"In Percentage"}
                          error={null}
                          className={"InputTextStartCurrencyAndLabel"}
                        />
                      </div>
                    </>
                  ) : (
                    <></>
                  )}

                  <span className={`${styles.redClr} mt-1`}>
                    {error.investPercen}
                  </span>

                  <div className={styles.modalPrimaryBodyContainer}>
                    <div className={`${styles.labelContainer}`}>
                      <label className={`${styles.modalLabel} my-2`}>
                        {" "}
                        Stop loss (1-90){" "}
                      </label>
                      <InputWithCurrencyAndLabel
                        id={"limitAmount"}
                        name={"stopPrice"}
                        onChange={(name, value) => {
                          onChangeHandler("stopLoss", value);
                        }}
                        placeholder={"Stop loss (1-90)"}
                        type={"number"}
                        value={formValue.stopLoss}
                        disabled={false}
                        key={"limitAmount"}
                        readOnly={false}
                        currency={"%"}
                        error={null}
                        className={"InputTextStartCurrencyAndLabel"}
                      />
                    </div>
                    <span className={`${styles.redClr} mt-1`}>
                      {error.stopLoss}
                    </span>
                    <div className={`${styles.labelContainer} mt-3`}>
                      <label className={`${styles.modalLabel} mb-2`}>
                        {" "}
                        Take profit (1-90){" "}
                      </label>
                      <InputWithCurrencyAndLabel
                        id={"limitAmount"}
                        name={"stopPrice"}
                        onChange={(name, value) => {
                          onChangeHandler("takeProfit", value);
                        }}
                        placeholder={"Take profit (1-90)"}
                        type={"number"}
                        value={formValue.takeProfit}
                        disabled={false}
                        key={"limitAmount"}
                        readOnly={false}
                        currency={"%"}
                        error={null}
                        className={"InputTextStartCurrencyAndLabel"}
                      />
                    </div>
                    <span className={`${styles.redClr} mt-1`}>
                      {error.takeProfit}
                    </span>

                    <div className={`${styles.labelContainer} my-3`}>
                      <label className={`${styles.modalLabel} mb-2`}>
                        {" "}
                        Maximum follow amount{" "}
                      </label>
                      <InputWithCurrencyAndLabel
                        id={"limitAmount"}
                        name={"stopPrice"}
                        onChange={(name, value) => {
                          onChangeHandler("maxAllowAmount", value);
                        }}
                        placeholder={"500"}
                        type={"number"}
                        value={formValue?.maxAllowAmount}
                        disabled={false}
                        key={"limitAmount"}
                        readOnly={false}
                        currency={formatDisplayPair("USDT")}
                        error={null}
                        className={"InputTextStartCurrencyAndLabel"}
                      />
                    </div>

                    <span className={`${styles.redClr} mt-1`}>
                      {error.maxAllowAmount}
                    </span>

                    <div className={`${styles.labelContainer} my-3`}>
                      <label className={`${styles.modalLabel} mb-2`}>
                        {" "}
                        Leverage (1-100){" "}
                      </label>
                      <InputWithCurrencyAndLabel
                        id={"leverage"}
                        name={"leverage"}
                        onChange={(name, value) => {
                          onChangeHandler("leverage", value.replace(/[^0-9]/g, ""));
                        }}
                        placeholder={"Leverage (1-100)"}
                        type={"number"}
                        value={formValue?.leverage}
                        disabled={false}
                        key={"leverage"}
                        readOnly={false}
                        currency={"x"}
                        error={null}
                        className={"InputTextStartCurrencyAndLabel"}
                      />
                    </div>

                    <span className={`${styles.redClr} mt-1`}>
                      {error.leverage}
                    </span>

                    <Button
                      isLoading={false}
                      loadingText="Redirecting..."
                      btnText="Update"
                      onClick={() => updateConfigurations()}
                      className="cardSuccessBtnSm"
                    // selectedValue={null}
                    />
                  </div>
                </div>
              </>
            ) : (
              <></>
            )}
            {selectedTabs == "orders" && (
              <div className={styles.labelContainers}>
                <div
                  className={`${styles.chartContainer} ${styles.labelHeader} my-4`}
                >
                  <div className={`${styles.profileTabs} mt-0`}>
                    <button
                      className={`${orderTabs == "position" ? styles.active : ""}`}
                      onClick={() => setOrderTabs("position")}
                    >
                      Position
                    </button>
                    <button
                      className={`${orderTabs == "openOrders" ? styles.active : ""}`}
                      onClick={() => setOrderTabs("openOrders")}
                    >
                      Open Orders
                    </button>
                    <button
                      className={`${orderTabs == "stopOrders" ? styles.active : ""}`}
                      onClick={() => setOrderTabs("stopOrders")}
                    >
                      Stop Orders
                    </button>
                    <button
                      className={`${orderTabs == "fills" ? styles.active : ""}`}
                      onClick={() => setOrderTabs("fills")}
                    >
                      Fills
                    </button>
                    <button
                      className={`${orderTabs == "closeHistory" ? styles.active : ""}`}
                      onClick={() => setOrderTabs("closeHistory")}
                    >
                      Close History
                    </button>
                    <button
                      className={`${orderTabs == "orderHistory" ? styles.active : ""}`}
                      onClick={() => setOrderTabs("orderHistory")}
                    >
                      Order History
                    </button>
                  </div>
                  {orderTabs == "position" && (
                    <div className="custom-table__secondary mt-3">
                      <Position data={profileData} />
                    </div>
                  )}
                  {orderTabs == "openOrders" && (
                    <div className="custom-table__secondary mt-3">
                      <OpenOrders data={profileData} />
                    </div>
                  )}
                  {orderTabs == "stopOrders" && (
                    <div className="custom-table__secondary mt-3">
                      <StopOrders data={profileData} />
                    </div>
                  )}
                  {orderTabs == "fills" && (
                    <div className="custom-table__secondary mt-3">
                      <Fills data={profileData} />
                    </div>
                  )}
                  {orderTabs == "closeHistory" && (
                    <div className="custom-table__secondary mt-3">
                      <CloseOrderHistory data={profileData} />
                    </div>
                  )}
                  {orderTabs == "orderHistory" && (
                    <div className="custom-table__secondary mt-3">
                      <OrderHistory data={profileData} />
                    </div>
                  )}
                </div>
              </div>
            )}
            {selectedTabs == "commisionHistory" && (
              <div className={styles.labelContainers}>
                <div
                  className={`${styles.chartContainer} ${styles.labelHeader} mt-4`}
                >
                  <div className={styles.containerFlex}>
                    <div className={styles.calanderSection}>
                      <div className="custom-datepicker__primary">
                        <label htmlfor="datepicker1" className="calender-icon">
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 24 24"
                            fill="none"
                            class="css-16vuvx8"
                          >
                            <path
                              fillRule="evenodd"
                              clip-rule="evenodd"
                              d="M10 4H7v2H4v3.5h16V6h-3V4h-3v2h-4V4zm10 8H4v7h16v-7z"
                              fill="currentColor"
                            ></path>
                          </svg>
                        </label>

                        <DatePicker
                          id="datepicker1"
                          maxDate={new Date()}
                          placeholderText="Start Date"
                          selected={startDate}
                          onKeyDown={(e) => e.preventDefault()}
                          onChange={(date) => {
                            setStartDate(date);
                            if (date && endDate && date > endDate)
                              setEndDate(null);
                            getCommisionHistory(1, pageSize, {
                              ...getCurrentFilters(),
                              startDate: date,
                            });
                          }}
                        />
                      </div>
                      <div className="custom-datepicker__primary">
                        {" "}
                        <label htmlFor="datePicker2" className="calender-icon">
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 24 24"
                            fill="none"
                            class="css-16vuvx8"
                          >
                            <path
                              fillRule="evenodd"
                              clip-rule="evenodd"
                              d="M10 4H7v2H4v3.5h16V6h-3V4h-3v2h-4V4zm10 8H4v7h16v-7z"
                              fill="currentColor"
                            ></path>
                          </svg>
                        </label>
                        <DatePicker
                          id="datePicker2"
                          minDate={startDate}
                          maxDate={new Date()}
                          placeholderText="End Date"
                          selected={endDate}
                          onKeyDown={(e) => e.preventDefault()}
                          onChange={(date) => {
                            setEndDate(date);
                            getCommisionHistory(1, pageSize, {
                              ...getCurrentFilters(),
                              endDate: date,
                            });
                          }}
                        />
                      </div>
                    </div>
                    <div className={`${styles.calanderSection} mt-2 mt-lg-0`}>
                      <div className={`react-select__width-sm`}>
                        {/* <Select
                                                    isSearchable={false}
                                                    placeholder="Type"
                                                    classNamePrefix="react-select__primary"
                                                // options={
                                                //     typeOptions
                                                // }
                                                // onChange={(e) => fetchHistoryData({ type: e?.value })}
                                                // onChange={(e) => { updateType({ type: e.value }) }}
                                                // value={
                                                //     !isEmpty(type)
                                                //         ? authOptions.find(
                                                //             (val) => val.value == type
                                                //         )
                                                //         : ""
                                                // }
                                                /> */}

                        {/* <Select
                                                    isSearchable={false}
                                                    placeholder="Coin"
                                                    classNamePrefix="react-select__primary"
                                                    options={coinOptions}
                                                    isClearable
                                                    onChange={(e) => {
                                                        const val = e?.value || '';
                                                        setCoinFilter(val);
                                                        getCommisionHistory(1, pageSize, {
                                                            ...getCurrentFilters(),
                                                            coin: val
                                                        });
                                                    }}
                                                /> */}
                      </div>
                      <SearchInput
                        type={"text"}
                        error={null}
                        onChange={(e) => {
                          setSearchFilter(e.target.value);
                          getCommisionHistory(1, pageSize, {
                            ...getCurrentFilters(),
                            search: e.target.value,
                          });
                        }}
                        disabled={false}
                        placeholder={"Search"}
                        value={searchFilter}
                        name={"tableSearch"}
                        className={"secondarySearch"}
                        readOnly={false}
                        showSearchIcon={true}
                      />
                    </div>
                  </div>
                  <div className="custom-table__secondary mt-3">
                    {/* <ReactDatatable
                                            columns={commisioncolumns}
                                            data={commisionHistory}
                                            pagination
                                            paginationPerPage={10}
                                            paginationRowsPerPageOptions={[5, 10, 15, 20, 50, 100]}
                                            // customStyles={customStyles}
                                            className="dataTableComponent"
                                            // sortIcon={<BiSort style={{ marginLeft: "0.5rem", color: "#000" }} />}
                                            noDataComponent={<TableNoData />}
                                        /> */}

                    <ReactDatatable
                      config={tableConfig}
                      columns={commisioncolumns}
                      data={commisionHistory}
                      pagination
                      paginationServer
                      paginationPerPage={pageSize}
                      paginationTotalRows={totalRows}
                      paginationRowsPerPageOptions={[5, 10, 15, 20, 50, 100]}
                      onChangePage={handlePagination}
                      onChangeRowsPerPage={handleRowsPerPageChange}
                      className="dataTableComponent"
                      noDataComponent={<TableNoData />}
                    />
                  </div>
                </div>
              </div>
            )}
            {selectedTabs == "copyTraders" && (
              <div className={styles.labelContainers}>
                <div
                  className={`${styles.chartContainer} ${styles.labelHeader} my-4`}
                >
                  <div>
                    <SearchInput
                      type={"text"}
                      error={null}
                      onChange={(e) => handleSearchFollowers(e.target.value)}
                      disabled={false}
                      placeholder={"Search"}
                      value={searchFollower}
                      name={"tableSearch"}
                      className={"secondarySearch"}
                      readOnly={false}
                      showSearchIcon={true}
                    />
                  </div>
                  <div className="custom-table__secondary mt-3">
                    <ReactDatatable
                      columns={copierscolumns}
                      data={copierDetail}
                      pagination
                      paginationPerPage={10}
                      paginationRowsPerPageOptions={[5, 10, 15, 20, 50, 100]}
                      // customStyles={customStyles}
                      className="dataTableComponent"
                      // sortIcon={<BiSort style={{ marginLeft: "0.5rem", color: "#000" }} />}
                      noDataComponent={<TableNoData />}
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        </section>
      </main>
    </>
  );
};

export default CopyProfileDashboard;
