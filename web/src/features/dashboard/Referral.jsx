/** PACKAGE IMPORT */

import React, { useEffect, useState } from "react";
// import { CopyToClipboard } from "react-copy-to-clipboard";
import { MdContentCopy } from "react-icons/md";
import ReactDatatable from "react-data-table-component";
import { FaCopy } from "react-icons/fa";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { getMonth, getYear } from "date-fns";

/** LOCAL FILES IMPORT */

import styles from "./styles/authInnerPage.module.css";
import TableNoData from "../../components/TableNoData/TableNoData";
import Button from "../../components/Button/Button";
import Images from "../../utils/Images";
import { useRef } from "react";
import { useSelector } from "react-redux";
import config from "../../config/env";
import { showToastMessage } from "../../lib/toast";
import {
  getRefferalDetailsHooks,
  getRefferalTranscationsHooks,
} from "../../actions/userAction";
import { SearchInput } from "../../components/Input/InputFields";
import { toCutOff } from "../../calculation/calculationlib";
import { useGlobalContext } from "../../context/GlobalProvider";

/** ACTIONS */

/** CONFIG */

/** CODE START */

const years = ["2020", "2021", "2022", "2023", "2024", "2025"];
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

const Referral = (props) => {
  const { userdetails } = useSelector((state) => state.user);
  const { convertValue, convertSecValue } = useGlobalContext();

  const [page, setPage] = useState("");
  const [limit, setLimit] = useState("");
  const [search, setSearch] = useState("");
  const [perPage, setPerPage] = useState(10);
  const [totalCount, setTotalCount] = useState(0);

  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const startDateRef = useRef(null);
  const endDateRef = useRef(null);
  const [referralId, setRefferalId] = useState("");
  const [refferalData, setRefferalData] = useState([]);
  const [refferaltransdata, setRefferalTransData] = useState([]);

  const columns = [
    {
      name: "S.no",
      align: "left",
      width: "200px",
      selector: (record, ind) => {
        const offset = (page - 1) * perPage;
        return <p>{ind + 1}</p>;
      },
    },
    {
      name: "Date",
      align: "left",
      width: "200px",
      selector: (record) => {
        return (
          <p className="fs15">{new Date(record?.createdAt).toDateString()}</p>
        );
      },
    },
    {
      name: "Type",
      align: "right",
      // width: "300px",
      selector: (record) => {
        return <p className="fs15">{record?.transferType?.toUpperCase()}</p>;
      },
    },
    {
      name: "Referral Username",
      align: "right",
      // width: "300px",
      selector: (record) => {
        return <p className="fs15">{record?.childUserName}</p>;
      },
    },
    // {
    //     name: 'Currency',
    //     align: "left",
    //     // width: "130px",
    //     selector: (record) => {
    //         return (
    //             <p>{record?.currencySymbol}</p>
    //         );
    //     }
    // },

    {
      name: "Your Commission",
      align: "left",
      width: "300px",
      selector: (record) => {
        return (
          <h3 className="fs15 mt-3">
            {convertValue(record?.amount)}
            <span className="fs13 mx-2">{convertSecValue(record?.amount)}</span>
          </h3>
        );
      },
    },
  ];

  const fetchRefferalData = async () => {
    try {
      const resp = await getRefferalDetailsHooks({}, userdetails.secretKey);
      let result = resp?.data;
      if (result?.result?.data?.length > 0) {
        setRefferalData(result?.result?.data[0]);
      }
    } catch (e) {
      console.log("fetchRefferalData__Err", e);
    }
  };

  const fetchRefTransactionData = async (data) => {
    try {
      const resp = await getRefferalTranscationsHooks(
        data,
        userdetails.secretKey,
      );
      let result = resp?.data;
      if (result?.result?.data?.length > 0) {
        setRefferalTransData(result?.result?.data);
        setTotalCount(result?.result?.count); // its really wrong venkatesh
      } else {
        setRefferalTransData(result?.result?.data);
      }
      // console.log("fetchRefTransactionData", resp, result)
    } catch (e) {
      console.log("fetchRefferalData__Err", e);
    }
  };

  const handleReferralCopy = () => {
    showToastMessage("The referral link has been copied!", "success");
    navigator.clipboard
      .writeText(referralId)
      .then(() => {
      })
      .catch((err) => {
      });
  };

  const handleSearch = (e) => {
    try {
      const { name, value } = e.target;
      let reqData = {
        // limit: limit,
        page: page,
        startDate: startDate != null ? new Date(startDate).getTime() : 0,
        endDate: endDate != null ? new Date(endDate).getTime() : 0,
        search: value,
      };
      setSearch(value);
      fetchRefTransactionData(reqData);
    } catch (e) {
      console.log("handleSearch__Err", e);
    }
  };

  const resetRefferal = () => {
    try {
      setStartDate(0);
      setEndDate(0);
      setPage(1);
      setSearch("");
      fetchRefTransactionData({ page: 1 });
    } catch (e) {
      console.log("resetRefferal__Err", e);
    }
  };

  useEffect(() => {
    if (Object.values(userdetails)?.length > 0) {
      setRefferalId(
        `${config.FRONT_URL}/register/${userdetails?.referralCode}`,
      );
      fetchRefferalData();
      fetchRefTransactionData();
    }
  }, [userdetails]);

  useEffect(() => {
    if (totalCount > 0) {
      setPerPage(totalCount < 10 ? totalCount : 10); // limit default to 10
    }
  }, [totalCount]);

  useEffect(() => {
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }, []);

  return (
    <div>
      <h5 className={styles.pageTitle}>Refer Your Friends & get Rewarded</h5>
      {/* <h5 className={`${styles.pageDescription} mt-3`}>
        Invite your friends to trade on Trevolt using your referral code and earn
        a share of their trading fees for a lifetime! The more they trade, the
        more you earn.
      </h5> */}
      <h5 className={`${styles.pageDescription} mt-3`}>
        Invite your friends to Trevolt and earn rewards when they make their
        first deposit.
      </h5>

      <div className={`${styles.referralLinkContainer} mt-5`}>
        <img
          src={Images.referralBanner}
          alt="Refferral_Banner"
          className={styles.referralLeftImage}
        />

        <div className={styles.referralCardBorder}>
          <p className={`${styles.rowListInfo} `}>Referral Link</p>
          <div className={styles.referraLinkWrapper + " mt-3"}>
            <p className={styles.referralLinkWrapperId}>{referralId}</p>
            <Button
              isLoading={false}
              loadingText="Redirecting..."
              btnText={<FaCopy />}
              onClick={handleReferralCopy}
              className="textBtn"
              selectedValue={null}
            />
          </div>

          <div className="mt-3">
            <Button
              isLoading={false}
              loadingText="Redirecting..."
              btnText={"Invite Now"}
              onClick={handleReferralCopy}
              className="cardSuccessBtn"
              selectedValue={null}
            />
          </div>
        </div>
      </div>
      <div className={` mt-5`}>
        <h5 className={`${styles.cardBorderTitle}`}>My Earnings Dashboard</h5>
        <div className={`${styles.referralCountGrid} margin-top__xl`}>
          {/* <div className={`${styles.referralCountCard} ${styles.unqualified}`}>
                        <div className={styles.referralCountCardBorderTop}>
                            <img src={Images.unqualified} alt="unqualify" className={styles.referralCountCardIcons} />
                            <p className={`${styles.referralCountCardTitle}`}>UnQualified referrals</p>
                        </div>
                        <p className={`${styles.referralCountCardValues} `}>{refferalData?.refferUnQualifiedCount}</p>
                    </div> */}
          <div className={`${styles.referralCountCard} ${styles.qualified}`}>
            <div className={styles.referralCountCardBorderTop}>
              <img
                src={Images.qualified}
                alt="qualified"
                className={styles.referralCountCardIcons}
              />
              <p className={`${styles.referralCountCardTitle}`}>
                Qualified referrals
              </p>
            </div>
            <p className={`${styles.referralCountCardValues} `}>
              {refferalData?.refferQualifiedCount}
            </p>
          </div>
          <div
            className={`${styles.referralCountCard} ${styles.referralCount}`}
          >
            <div className={styles.referralCountCardBorderTop}>
              <img
                src={Images.referralImage}
                alt="referralImage"
                className={styles.referralCountCardIcons}
              />
              <p className={`${styles.referralCountCardTitle}`}>
                Referral Count
              </p>
            </div>
            <p className={`${styles.referralCountCardValues} `}>
              {refferalData?.refferCount}
            </p>
          </div>
          <div className={`${styles.referralCountCard} ${styles.totalRewards}`}>
            <div className={styles.referralCountCardBorderTop}>
              <img
                src={Images.totalRewards}
                alt="totalRewards"
                className={styles.referralCountCardIcons}
              />
              <p className={`${styles.referralCountCardTitle}`}>
                Total Rewards
              </p>
            </div>
            <p className={`${styles.referralCountCardValues} `}>
              {convertValue(refferalData?.amount)}
              <span className="fs15 mx-2">
                {convertSecValue(refferalData?.amount)}
              </span>
            </p>
          </div>
        </div>
      </div>
      <div className="mt-5">
        <h5 className={`${styles.cardBorderTitle}`}>Referral History</h5>
        <div className="margin-top__xl">
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
                    search: search,
                  };
                  fetchRefTransactionData(reqData);
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
                    <select
                      className="decorated"
                      value={getYear(date)}
                      onChange={({ target: { value } }) => changeYear(value)}
                    >
                      {years.map((option) => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ))}
                    </select>

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
                    search: search,
                  };
                  fetchRefTransactionData(reqData);
                  // setEndDateTime(new Date(date).getTime())
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
                    <select
                      className="decorated"
                      value={getYear(date)}
                      onChange={({ target: { value } }) => changeYear(value)}
                    >
                      {years.map((option) => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ))}
                    </select>

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
            <div className={`d-flex gap-3`}>
              <SearchInput
                type={"text"}
                error={null}
                disabled={false}
                placeholder={"Search"}
                value={search}
                name={"tableSearch"}
                className={"defaultSearch"}
                readOnly={false}
                showSearchIcon={true}
                onChange={(e) => handleSearch(e)}
              />
            </div>
            <div className={`d-flex gap-3`}>
              <Button
                isLoading={false}
                loadingText="Redirecting..."
                btnText={"Reset"}
                onClick={() => resetRefferal()}
                className="cardSuccessBtn"
                selectedValue={null}
              />
            </div>
          </div>
          <div className="custom-table__secondary mt-4">
            <ReactDatatable
              columns={columns}
              data={refferaltransdata}
              pagination
              paginationServer
              paginationPerPage={10}
              paginationTotalRows={totalCount}
              paginationRowsPerPageOptions={[5, 10, 15, 20, 50, 100]}
              // customStyles={customStyles}
              onChangePage={(page) => {
                let data = { startDate, endDate, page, search };
                fetchRefTransactionData(data);
              }}
              className="dataTableComponent"
              // sortIcon={<BiSort style={{ marginLeft: "0.5rem", color: "#000" }} />}
              noDataComponent={<TableNoData />}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Referral;
