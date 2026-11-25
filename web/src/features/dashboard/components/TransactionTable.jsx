/** PACKAGE IMPORT */

import React, { useRef, useState } from "react";
import { FaBoxOpen } from "react-icons/fa6";
import { FiSearch } from "react-icons/fi";
import ReactDatatable from "react-data-table-component";
import { useSelector } from "react-redux";
import DatePicker from "react-datepicker";
import Select from "react-select";
import { getMonth, getYear } from "date-fns";

/** LOCAL FILES IMPORT */

import styles from ".././styles/authInnerPage.module.css";
import TableNoData from "../../../components/TableNoData/TableNoData";
import { getTranscationHistoryHooks } from "../../../actions/userAction";
import { useEffect } from "react";
import { toCutOff } from "../../../calculation/calculationlib";
import Button from "../../../components/Button/Button";
import { useGlobalContext } from "../../../context/GlobalProvider";
import { useNavigate } from "react-router-dom";
import { capitalize } from "../../../lib/Common";
import { momentFormat } from "../../../lib/dateTimeHelper";
/** Config */

/** ACTIONS */

/** CODE START */

const TransactionTable = (props) => {
  const navigate = useNavigate();
  const { convertValue, convertSecValue } = useGlobalContext();
  const typeOptions = [
    { value: "all", label: "All" },
    { value: "credit", label: "Credit" },
    { value: "debit", label: "Debit" },
  ];

  const transfertypeOptions = [
    { value: "all", label: "All" },
    { value: "deposit", label: "Deposit" },
    { value: "withdraw", label: "Withdraw" },
    { value: "internaltransfer", label: "Internal Transfer" },
    // { value: "futurestrade", label: "Futures Trade" },
    // { value: 'welcomeBonus', label: 'Welcome Bonus' },
    // { value: "affiliateCommission", label: 'Affiliate Commission' },
    // { value: 'optiontrade', label: 'Option Trade' },
    // { value: 'launchpad_purchase', label: "Launchpad Purchase" },
    // { value: 'staking', label: "Staking" },
    // { value: "Refferal", label: "Refferal" },
  ];
  const [transactionTableData, setTransactionTableData] = useState([]);

  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [startDateTime, setStartDateTime] = useState("");
  const [endDateTime, setEndDateTime] = useState("");
  const [startDateOpen, setStartDateOpen] = useState(false);
  const startDateRef = useRef(null);
  const endDateRef = useRef(null);

  // humb
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [totalCount, setTotalCount] = useState(0);
  const [selectedType, setSelectedType] = useState({
    value: "all",
    label: "All",
  });
  const [transferType, setTransferType] = useState({
    value: "all",
    label: "All",
  });
  const [selectedCoin, setSelectedCoin] = useState("");
  const [perPage, setPerPage] = useState(10);

  const years = Array.from({ length: getYear(new Date()) - 1950 + 1 }, (_, i) => (1950 + i).toString()).reverse();
  const months = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];

  const columns = [
    {
      name: "S.no",
      align: "left",
      width: "100px",
      selector: (record, index) => {
        return <p className="fs15">{(page - 1) * 10 + (index + 1)}</p>;
      },
    },
    {
      name: "Date",
      align: "right",
      width: "300px",
      selector: (record) => {
        return (
          <>
            <p className="fs15">
              {momentFormat(record?.updatedAt)}{" "}
            </p>
          </>
        );
      },
    },
    {
      name: "Type",
      align: "right",
      width: "250px",
      selector: (record) => {
        return (
          <>
            <p className="fs15">{capitalize(record?.transferType)}</p>
          </>
        );
      },
    },
    // {
    //     name: 'Currency',
    //     align: "right",
    //     width: "200px",
    //     selector: (record) => {
    //         return (
    //             <>
    //                 <p>{record?.currencyId?.currencySymbol}</p>
    //             </>
    //         );
    //     }
    // },
    {
      name: "Request Amount",
      align: "right",
      width: "300px",
      selector: (record) => {
        return (
          <div className={"fs15"}>
            {/* <p>{Number(record?.finalAmount) != 0 ? toCutOff(convertValue(record?.finalAmount), record?.currencyId?.pip) : 0}</p> */}
            <p>
              {/* {
        Number(record?.finalAmount) != 0 ?
            convertValue(record?.finalAmount, record?.currencyId?.pip) :
            0
    } */}
              {convertValue(
                record?.transactionAmount ?? 0,
                record?.currencyId?.pip,
              )}
            </p>
            <p className="fs12 mt-2 ms-1">
              <span>
                {convertSecValue(
                  record?.transactionAmount ?? 0,
                  record?.currencyId?.pip,
                )}
              </span>
            </p>
          </div>
        );
      },
    },
    {
      name: "Transfer Amount",
      align: "right",
      width: "250px",
      selector: (record) => {
        return (
          <div className={"fs15"}>
            {/* <p>{Number(record?.finalAmount) != 0 ? toCutOff(convertValue(record?.finalAmount), record?.currencyId?.pip) : 0}</p> */}
            <p>
              {/* {
                                Number(record?.finalAmount) != 0 ?
                                    convertValue(record?.finalAmount, record?.currencyId?.pip) :
                                    0
                            } */}
              {convertValue(record?.finalAmount ?? 0, record?.currencyId?.pip)}
            </p>
            <p className="fs12 mt-2 ms-1">
              <span>
                {convertSecValue(
                  record?.finalAmount ?? 0,
                  record?.currencyId?.pip,
                )}
              </span>
            </p>
          </div>
        );
      },
    },
    {
      name: "Status",
      align: "right",
      width: "200px",
      selector: (record) => {
        return (
          <>
            <p className="fs15">{capitalize(record?.status)}</p>
          </>
        );
      },
    },
  ];

  const { userdetails } = useSelector((state) => state.user);
  const [search, setSearch] = useState("");

  useEffect(() => {
    if (Object.values(userdetails)?.length > 0) {
      let data = {
        startDate: startDateTime,
        endDate: endDateTime,
        page: page,
      };
      getDataByDate(data);
    }
  }, [transferType, userdetails]);

  const getDataByDate = async (data) => {
    try {
      let reqData = {
        page: data?.page,
        limit: limit,
        startDate: data?.startDate != undefined ? data?.startDate : "",
        endDate: data?.endDate != undefined ? data?.endDate : "",
        data: data,
        transferType: transferType?.value,
        accountId: userdetails.accountId,
      };
      setPage(data?.page);
      const formData = new FormData();
      formData.append("page", data?.page);
      formData.append("limit", limit);
      formData.append(
        "startDate",
        data?.startDate != undefined ? data?.startDate : "",
      );
      formData.append(
        "endDate",
        data?.endDate != undefined ? data?.endDate : "",
      );
      formData.append("transferType", transferType?.value);
      // formData.append("limit", limit);
      let resp = await getTranscationHistoryHooks(
        formData,
        userdetails.secretKey,
      );
      let result = resp?.data;
      if (result?.result?.data?.length > 0) {
        setTransactionTableData(result?.result?.data);
        setTotalCount(result?.result?.count);
      } else {
        setTransactionTableData([]);
      }
    } catch (error) {
      console.log("getDataByDate_err", error);
    }
  };

  useEffect(() => {
    if (totalCount > 0) {
      setPerPage(totalCount < 10 ? totalCount : 10); // limit default to 10
    }
  }, [totalCount]);

  const resetTransaction = () => {
    try {
      // let reqData = { startDate: 0, endDate: 0, page: page, selectedType: 'all', 'transferType': 'all' };
      // console.log("reset_Tra reqData-->", reqData)
      // getDataByDate(reqData)
      setStartDate(0);
      setEndDate(0);
      setStartDateTime(0);
      setEndDateTime(0);
      setPage(1);
      setSelectedType({ value: "all", label: "All" });
      setTransferType({ value: "all", label: "All" });
    } catch (e) {
      console.log("resetTransaction__Err", e);
    }
  };

  const Export = () => {
    navigate("/export", {
      state: {
        type: "recenttransaction",
        filterBy: {
          startDate: startDate ? startDate : "",
          endDate: endDate ? endDate : "",
        },
      },
    });
  };

  return (
    <>
      <div className={`${styles.cardHeader}`}>
        <h5 className={`${styles.pageTitle}`}>Recent Transactions</h5>
      </div>
      <div className="mt-4">
        <div className={`${styles.datepickerWrapper} `}>
          <div className="custom-datepicker__primary">
            <label htmlFor="datePicker1" className="calender-icon">
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
              id="datePicker1"
              ref={startDateRef}
              placeholderText="Start Date"
              selected={startDate}
              maxDate={new Date()}
              onKeyDown={(e) => {
                e.preventDefault();
              }}
              onChange={(date) => {
                setStartDate(date);
                if (date && endDate && date > endDate) {
                  setEndDate(null);
                }
                let reqData = {
                  startDate: new Date(date).getTime(),
                  endDate: endDate != null ? new Date(endDate).getTime() : 0,
                  page: page,
                };
                setStartDateTime(new Date(date).getTime());
                getDataByDate(reqData);
              }}
              renderCustomHeader={({
                date,
                changeYear,
                changeMonth,
                decreaseMonth,
                increaseMonth,
                prevMonthButtonDisabled,
                nextMonthButtonDisabled,
              }) => (
                <div className="custom-datepicker__primary-header">
                  <button
                    aria-label="lessthanIcon"
                    onClick={decreaseMonth}
                    disabled={prevMonthButtonDisabled}
                    className="btn-dateHandle"
                  >
                    {"<"}
                  </button>
                  <Select
                    isSearchable={false}
                    value={{ label: getYear(date).toString(), value: getYear(date) }}
                    onChange={(selected) => changeYear(selected.value)}
                    options={years.map((option) => ({ label: option, value: Number(option) }))}
                    classNamePrefix="react-select__calendarYear"
                    styles={{
                      control: (base) => ({ ...base, width: "120px" }),
                      menuList: (base) => ({ ...base, maxHeight: "200px", overflowY: "auto" }),
                    }}
                  />

                  <select
                    value={months[getMonth(date)]}
                    onChange={({ target: { value } }) =>
                      changeMonth(months.indexOf(value))
                    }
                  >
                    {months.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>

                  <button
                    aria-label="greaterthanIcon"
                    onClick={increaseMonth}
                    disabled={nextMonthButtonDisabled}
                    className="btn-dateHandle"
                  >
                    {">"}
                  </button>
                </div>
              )}
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
              ref={endDateRef}
              placeholderText="End Date"
              selected={endDate}
              onKeyDown={(e) => {
                e.preventDefault();
              }}
              onChange={(date) => {
                date.setHours(23);
                date.setMinutes(59);
                date.setSeconds(59);
                setEndDate(date);
                // if (date && endDate && date > endDate) {
                // setStartDate(null);
                // }
                let reqData = {
                  startDate:
                    startDate != null ? new Date(startDate).getTime() : 0,
                  endDate: new Date(date).getTime(),
                  page: page,
                };
                getDataByDate(reqData);
                setEndDateTime(new Date(date).getTime());
              }}
              renderCustomHeader={({
                date,
                changeYear,
                changeMonth,
                decreaseMonth,
                increaseMonth,
                prevMonthButtonDisabled,
                nextMonthButtonDisabled,
              }) => (
                <div className="custom-datepicker__primary-header">
                  <button
                    aria-label="lessthanIcon"
                    onClick={decreaseMonth}
                    disabled={prevMonthButtonDisabled}
                    className="btn-dateHandle"
                  >
                    {"<"}
                  </button>
                  <Select
                    isSearchable={false}
                    value={{ label: getYear(date).toString(), value: getYear(date) }}
                    onChange={(selected) => changeYear(selected.value)}
                    options={years.map((option) => ({ label: option, value: Number(option) }))}
                    classNamePrefix="react-select__calendarYear"
                    styles={{
                      control: (base) => ({ ...base, width: "120px" }),
                      menuList: (base) => ({ ...base, maxHeight: "200px", overflowY: "auto" }),
                    }}
                  />

                  <select
                    value={months[getMonth(date)]}
                    onChange={({ target: { value } }) =>
                      changeMonth(months.indexOf(value))
                    }
                  >
                    {months.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>

                  <button
                    aria-label="greaterthanIcon"
                    onClick={increaseMonth}
                    disabled={nextMonthButtonDisabled}
                    className="btn-dateHandle"
                  >
                    {">"}
                  </button>
                </div>
              )}
            />
          </div>
          <div className={`react-select__width-sm`}>
            <Select
              isSearchable={false}
              placeholder="InternalTransfer"
              classNamePrefix="react-select__primary"
              options={transfertypeOptions}
              onChange={(e) =>
                setTransferType({ value: e?.value, label: e?.label })
              }
              value={{ value: transferType?.value, label: transferType?.label }}
            />
          </div>
          <div className={`react-select__width-sm d-flex gap-3`}>
            <Button
              isLoading={false}
              loadingText="Redirecting..."
              btnText={"Reset"}
              onClick={() => resetTransaction()}
              className="cardSuccessBtn_rect"
              selectedValue={null}
            />
            <Button
              isLoading={false}
              loadingText="Redirecting..."
              btnText={"Export"}
              onClick={() => Export()}
              className="cardSuccessBtn_rect"
              selectedValue={null}
            />
          </div>

          <div>
            {/* <button
                            className="linear_button"
                        onClick={() => { Export() }}
                        >
                            Export
                        </button> */}
          </div>
        </div>
      </div>
      <div className="custom-table__secondary mt-4">
        {/* columns={columns}
                    data={transactionTableData}
                    pagination
                    paginationPerPage={perPage}
                    paginationTotalRows={totalCount}
                    paginationRowsPerPageOptions={[5, 10, 15, 20, 50, 100]}
                    // customStyles={customStyles}
                    className="dataTableComponent"
                    // sortIcon={<BiSort style={{ marginLeft: "0.5rem", color: "#000" }} />}
                    noDataComponent={<TableNoData />}
                    onChangePage={(page, totalRows) => {
                    }}
                    onChangeRowsPerPage={(page, totalRows) => {
                    }} */}
        <ReactDatatable
          columns={columns}
          data={transactionTableData}
          pagination
          paginationServer // 🔥 IMPORTANT
          paginationTotalRows={totalCount}
          paginationPerPage={perPage}
          paginationRowsPerPageOptions={[5, 10, 15, 20, 50, 100]}
          className="dataTableComponent"
          onChangePage={(page) => {
            let data = {
              startDate: startDateTime,
              endDate: endDateTime,
              page: page,
            };
            getDataByDate(data);
            // setCurrentPage(page);
            // fetchTransactions(page, perPage);
          }}
          noDataComponent={<TableNoData />}
        />
      </div>
    </>
  );
};

export default TransactionTable;
