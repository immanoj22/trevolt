/** package import */

import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import ReactDatatable from "react-data-table-component";
import isEmpty from "is-empty";
import Countdown, { zeroPad } from "react-countdown";
import { useDispatch } from "react-redux";

/** local import */

// import styles from './styles/myProfile.module.css'
import styles from "../styles/affiliateRewardHub.module.css";
import Images from "../../../utils/Images";
import { useGlobalContext } from "../../../context/GlobalProvider";

import { showToastMessage } from "../../../lib/toast";
import { useSelector } from "react-redux";
import Button from "../../../components/Button/Button";
import TableNoData from "../../../components/TableNoData/TableNoData";

/** Actions */
import {
  affiliateCommissionDetails,
  claimRewardCommission,
  getAffiliateDetails,
} from "../../../actions/affliateAction";

/** Config */
import config from "../../../config/env";
import TooltipComponent from "../../../components/UiComponents/tooltipComponent";
import Loader from "../../../components/Loader/Loader";

const typeEnum = {
  deposit: "Deposit",
  withdraw: "Withdraw",
  internaltransfer: "Internal Transfer",
  trade: "Trade",
  referral: "Referral",
  welcomeBonus: "WelcomeBonus",
  claim: "Claim",
  futures: "Trade",
  option: "Trade",
};
const testTargetTime = Date.now() + (1 * 60 * 60 + 20 * 60 + 55) * 1000;

const AffiliateRewardHub = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { theme, convertValue, convertSecValue } = useGlobalContext();

  const [tableData, setTableData] = useState([{ id: 1 }]);
  const [count, setCount] = useState(0);
  const [targetTime, setTargetTime] = useState(null);
  const [isCompleted, setIsCompleted] = useState(false);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    search: "",
  });
  const { userdetails, affiliateDetails } = useSelector((state) => state.user);

  const renderer = ({ days, hours, minutes, seconds, completed }) => {
    if (completed) {
      setIsCompleted(true);
    } else {
      // console.log("THERENSDERRR", { days, hours, minutes, seconds, completed });
      return (
        <div className={styles.timeRenderText}>
          <p>
            <span>{zeroPad(days)}</span>
            <span>d</span>
          </p>
          <p>
            <span>{zeroPad(hours)}</span>
            <span>h</span>
          </p>
          <p>
            <span>{zeroPad(minutes)}</span>
            <span>m</span>
          </p>
          <p>
            <span>{zeroPad(seconds)}</span>
            <span>s</span>
          </p>
          {/* {zeroPad(hours)}h:{zeroPad(minutes)}m:{zeroPad(seconds)}s */}
        </div>
      );
      // return <h3>
      //     {zeroPad(days)}D: {zeroPad(hours)}h:{zeroPad(minutes)}m:{zeroPad(seconds)}s
      // </h3>
    }
  };

  const handleBack = () => {
    navigate(-1);
  };

  const filterArray = [
    { value: "1W", text: "1 Week", lable: "1 W", id: "weekFilter" },
    { value: "1M", text: "1 Month", lable: "1 M", id: "1monthFilter" },
    { value: "3M", text: "3 Month", lable: "3 M", id: "3monthFilter" },
    { value: "6M", text: "6 Month", lable: "6 M", id: "6monthFilter" },
    { value: "1Y", text: "1 Year", lable: "1 Y", id: "1YearFilter" },
  ];
  const columns = [
    {
      name: "S.No",
      selector: (row, index) => index + 1,
      // align: "left",
      width: "150px",
    },
    // {
    //   name: "Transaction Number",
    //   selector: (row) => row.transactionNumber,
    //   align: "left",
    //   width: "150px",
    // },
    // {
    //   name: "Transaction Amount",
    //   selector: (row) => row.transactionAmount,
    //   align: "right",
    // },
    // {
    //   name: "Transaction Amount",
    //   selector: (row) => row.fee,
    //   align: "right",
    // },
    {
      // name: "Transaction Amount",
      name: "Amount",
      // selector: row => row.commission,
      // align: "right",
      selector: (record) => {
        return (
          <h3 className="fs15 mt-0">
            {convertValue(record?.fee)}
            <span className="fs13 mx-2">{convertSecValue(record?.fee)}</span>
          </h3>
        );
      },
    },
    {
      name: "Transfer Type",
      // selector: (row) => typeEnum[row.transferType]
      selector: (row) =>
        typeEnum[row?.transferType] ||
        (row?.transferType ? row.transferType.toUpperCase() : "N/A"),
      // align: "right",
    },
    {
      name: "Commission",
      // selector: row => row.commission,
      // align: "right",
      selector: (record) => {
        return (
          <h3 className="fs15 mt-0">
            {convertValue(record?.commission)}
            <span className="fs13 mx-2">
              {convertSecValue(record?.commission)}
            </span>
          </h3>
        );
      },
    },
    // {
    //   name: "Commission",
    //   align: "right",
    //   selector: (row) => {
    //     console.log(
    //       "record?.commission : ",
    //       row,
    //       row?.commission,
    //       convertSecValue(row?.commission),
    //       convertValue(row?.commission),
    //     );
    //     return (
    //       <h3 className="fs15 mt-0">
    //         {convertValue(row?.commission)}
    //         <span className="fs13 mx-2">
    //           {convertSecValue(row?.commission)}
    //         </span>
    //       </h3>
    //     );
    //   },
    // },
    // {
    //   name: "Commission",
    //   align: "right",
    //   selector: (row) => row.commission,
    //   cell: (row) => (
    //     <h3 className="fs15 mt-0">
    //       {convertValue(row?.commission)}
    //       <span className="fs13 mx-2">{convertSecValue(row?.commission)}</span>
    //     </h3>
    //   ),
    // },
    {
      name: "Date",
      selector: (row) => new Date(row.createdAt).toDateString(),
      // align: "left",
    },
    {
      name: "Claimed Date",
      selector: (row) => row.status === "claimed" && row.claimedAt ? new Date(row.claimedAt).toDateString() : "-",
      // align: "left",
    },
  ];

  const getCommissionDetails = async (reqData) => {
    try {
      const { status, result } = await affiliateCommissionDetails(
        reqData,
        userdetails?.secretKey,
      );
      if (status) {
        setTableData(result.data);
      }
      setCount(result.count);
    } catch (e) {
      console.log("getCommissionDetails_err", e);
    }
  };

  const getAffiliate = async (range) => {
    try {
      await getAffiliateDetails(dispatch, range);
    } catch (e) {
      console.log("getCommissionDetails_err", e);
    }
  };

  useEffect(() => {

    if (affiliateDetails.range) {
      const selectedFilter = filterArray.find(
        (f) => f.value === affiliateDetails.range,
      );
      document.getElementById(selectedFilter.id).checked = true;
    } else {
      document.getElementById("weekFilter").checked = true;
    }
  }, []);

  const claim = async () => {
    try {
      const { status, message } = await claimRewardCommission(
        userdetails?.secretKey,
      );
      showToastMessage(message, status ? "success" : "error");
      if (status) {
        getAffiliate("1W");
        getCommissionDetails(pagination);
      }
    } catch (e) {
      console.log("claim_err", e);
    }
  };

  const handlePageChange = (page) => {
    try {
      let payload = { page: page, limit: pagination.limit };
      getCommissionDetails(payload);
      setPagination({ ...pagination, ...{ page: page } });
    } catch (e) {
      console.log("handlePageChange_err", e);
    }
  };

  const handlePerRowsChange = async (newPerPage, page) => {
    try {
      let payload = { page: page, limit: newPerPage };
      getCommissionDetails(payload);
      setPagination({ ...pagination, ...{ page: page, limit: newPerPage } });
    } catch (e) {
      console.log("handlePerRowsChange_err", e);
    }
  };

  // const Coundown = () => {
  //     // Handle the null/undefined or 0 case properly
  //     const hasValidTargetTime =
  //         targetTime !== null && targetTime !== 0 && !isNaN(targetTime);
  //         console.log("affiliateDetails_data_hub Data", targetTime, hasValidTargetTime);

  //     return (
  //         <>           {
  //             affiliateDetails?.lastClaimDate === null ?
  //                 <Button btnText={"Claim Rewards"} className='cardSuccessBtn'
  //                     disabled={affiliateDetails.totalCommission === 0 || isCompleted}
  //                     onClick={claim}
  //                 /> :
  //                 <div className={styles.timerCard}>
  //                     {

  //                         hasValidTargetTime ?
  //                             <Countdown date={targetTime} renderer={renderer} /> :
  //                             <Loader />
  //                     }
  //                 </div>
  //         }
  //         </>
  //     )
  // }

  // console.log("affiliateDetails_data_hub Data", affiliateDetails);
  useEffect(() => {
    if (!isEmpty(userdetails)) {
      getCommissionDetails(pagination);
    }
  }, [userdetails]);

  useEffect(() => {
    if (!isEmpty(affiliateDetails.lastClaimDate)) {
      const futureDate = new Date(
        new Date(affiliateDetails.lastClaimDate).getTime() +
        affiliateDetails.rewardGenerated * 24 * 60 * 60 * 1000,
      ).getTime();
      setTargetTime(futureDate);

      // setIsCompleted(false)
      if (futureDate <= Date.now()) {
        setIsCompleted(true);
      } else {
        setIsCompleted(false);
      }
    }
  }, [affiliateDetails]);

  return (
    <div>
      <div className={styles.cardHeader}>
        <h5 className={styles.pageTitle}>Reward Hub</h5>
      </div>
      <div className={`${styles.cardPart}`}>
        <div className={styles.filterPart}>
          <ul className="d-flex flex-wrap gap-2">
            {filterArray.map((el) => (
              <li>
                <TooltipComponent highlight={false} text={el.text}>
                  <label
                    htmlFor={el.id}
                    onClick={() => {
                      getAffiliate(el.value);
                    }}
                  >
                    <span>{el.lable}</span>
                    <input
                      type="radio"
                      name="filterInput"
                      id={el.id}
                      defaultChecked={el.value === affiliateDetails.range}
                    />
                  </label>
                </TooltipComponent>
              </li>
            ))}
          </ul>
        </div>
      </div>
      <div className={styles.cardBody}>
        <div className={styles.nextPayoutWrapper}>
          <div
            className={`${styles.cardBodyHeader} ${styles.totalCardPattenPart}`}
          >
            {}
            <div className={`d-flex gap-3 align-items-center flex-wrap`}>
              <img
                className={styles.cardProfileImg}
                src={
                  userdetails && userdetails?.profileImage
                    ? userdetails?.profileImage
                    : theme == "dark"
                      ? Images.darkDefaultProfile
                      : Images.lightDefaultProfile
                }
                alt="profile"
              />
              <div className={styles.profileFileInput}>
                <h3 className="fs15 text-gray4">Total Earning</h3>
                <div className="mt-4">
                  <h4 className="fs25">
                    {convertValue(
                      // parseFloat(affiliateDetails.totalCommission) +
                      // parseFloat(affiliateDetails.claimAmount),
                      parseFloat(affiliateDetails.claimed) +
                      parseFloat(affiliateDetails.toClaim),
                    )}
                  </h4>
                  <h4 className="fs19 mt-2 text-yellow">
                    {}
                    {convertSecValue(
                      // parseFloat(affiliateDetails.totalCommission) +
                      //   parseFloat(affiliateDetails.claimAmount),
                      parseFloat(affiliateDetails.claimed) +
                      parseFloat(affiliateDetails.toClaim),
                    )}
                  </h4>
                </div>
              </div>
            </div>
            <div className={styles.rewardIcon}>
              <img src={Images.rewardIcon} alt="rewardIcon" />
            </div>
          </div>
          <div
            className={`${styles.cardBodyHeader} ${styles.earningCardPattenPart}`}
          >
            <h3 className="fs30">Next Payout</h3>
            <p className="fs14 mt-2">Come back now and claim bonus!</p>
            {affiliateDetails?.lastClaimDate === null || isCompleted ? (
              <Button
                btnText={"Claim Rewards"}
                className="cardLightBtn"
                disabled={
                  affiliateDetails.totalCommission === 0 ||
                  (affiliateDetails?.lastClaimDate === null && isCompleted)
                }
                // disabled={affiliateDetails.totalCommission === 0 || isCompleted}
                onClick={claim}
                staticClass="mt-2"
              />
            ) : (
              <div className={styles.timerCard}>
                {/* {
                                          testTargetTime && (testTargetTime !== null || testTargetTime != 0) ?
                                              <Countdown date={testTargetTime} renderer={renderer} /> :
                                              <Loader />
                                      } */}
                {targetTime && (targetTime !== null || targetTime != 0) ? (
                  <Countdown date={targetTime} renderer={renderer} />
                ) : (
                  <Loader loaderColor="#fff" />
                )}
              </div>
            )}
          </div>
          <div
            className={`${styles.cardBodyHeader} ${styles.timerCardPattenPart}`}
          >
            <div className={styles.cardWrapper}>
              <div className={`${styles.cardPart} ${styles.todayCardPart}`}>
                <div className="d-flex flex-wrap align-items-center justify-content-between gap-2">
                  <div className="d-flex gap-2 align-items-center">
                    <img
                      src={Images.earningIcon}
                      alt="icon"
                      className={styles.cardIcon}
                    />
                    <h3 className={styles.cardTitleText}>Earning</h3>
                  </div>
                  <div className={styles.filterPart}>
                    {/* <ul className="d-flex flex-wrap gap-2">
                        {filterArray.map((el) => (
                          <li>
                            <TooltipComponent highlight={false} text={el.text}>
                              <label
                                htmlFor={el.id}
                                onClick={() => {
                                  getAffiliate(el.value);
                                }}
                              >
                                <span>{el.lable}</span>
                                <input
                                  type="radio"
                                  name="filterInput"
                                  id={el.id}
                                />
                              </label>
                            </TooltipComponent>
                          </li>
                        ))}
                      </ul> */}
                  </div>
                </div>
                <h4 className={styles.cardCountText}>
                  <p>
                    {/* {convertValue(parseFloat(affiliateDetails["todayReward"]))} */}
                    {convertValue(parseFloat(affiliateDetails.claimed))}
                  </p>
                  <span className="fs15 mx-2">
                    {convertSecValue(
                      // parseFloat(affiliateDetails["todayReward"]),
                      parseFloat(affiliateDetails.claimed),
                    )}
                  </span>
                </h4>
              </div>
            </div>
          </div>
          <div
            className={`${styles.cardBodyHeader} ${styles.pendingCardPattenPart}`}
          >
            <div className={`${styles.cardPart}`}>
              <div className="d-flex align-items-center justify-content-between gap-2">
                <div className="d-flex gap-2 align-items-center">
                  <img
                    src={Images.timerIcon}
                    alt="icon"
                    className={styles.cardIcon}
                  />
                  <h3 className={styles.cardTitleText}>Pending Claims</h3>
                </div>
              </div>
              <h4 className={styles.cardCountText}>
                <p>
                  {convertValue(
                    // parseFloat(affiliateDetails["totalCommission"]),
                    parseFloat(affiliateDetails.toClaim),
                  )}
                </p>
                <span className="fs15 mx-2">
                  {convertSecValue(
                    // parseFloat(affiliateDetails["totalCommission"]),
                    parseFloat(affiliateDetails.toClaim),
                  )}
                </span>
              </h4>
            </div>
          </div>
        </div>
      </div>
      {/* <div className={styles.cardBody}>
                  <div className={styles.cardBodyHeader}>
                      <div className={styles.cardProfileWrapper}>
                          <img src={
                              userdetails && userdetails?.profileImage ?
                                  userdetails?.profileImage :
                                  theme == 'dark' ? Images.darkDefaultProfile : Images.lightDefaultProfile}

                              alt="profile" />
                          <div className={styles.profileFileInput}>
                              <h3 className='fs23 mb-2'>Total Earning</h3>
                              <p className='fs15 mb-4'>
                                  {convertValue((parseFloat(affiliateDetails.totalCommission) + parseFloat(affiliateDetails.claimAmount)))}
                                  <span className='fs13 mx-2'>
                                      {convertSecValue((parseFloat(affiliateDetails.totalCommission) + parseFloat(affiliateDetails.claimAmount)))}
                                  </span>
                              </p>
                          </div>
                      </div>
                      <div className={styles.overviewCardWrapper}>
                          <div className={styles.cardWrapper}>
                              <div className={`${styles.cardPart} ${styles.todayCardPart}`}>
                                  <div className='d-flex flex-wrap align-items-center justify-content-between gap-2'>
                                      <div className='d-flex gap-2 align-items-center'>
                                          <img src={Images.affiliateDashboardIcon5} alt="icon" className={styles.cardIcon} />
                                          <h3 className={styles.cardTitleText} >Earning</h3>
                                      </div>
                                      <div className={styles.filterPart}>
                                          <ul className='d-flex flex-wrap gap-2'>
                                              {
                                                  filterArray.map((el) => (
                                                      <li>
                                                          <TooltipComponent highlight={false} text={el.text}>
                                                              <label htmlFor={el.id} onClick={() => { getAffiliate(el.value) }}>
                                                                  <span>{el.lable}</span>
                                                                  <input type="radio" name="filterInput" id={el.id} />
                                                              </label>
                                                          </TooltipComponent>
                                                      </li>
                                                  ))
                                              }

                                          </ul>

                                      </div>
                                  </div>
                                  <h4 className={styles.cardCountText}>

                                      {convertValue(parseFloat(affiliateDetails["todayReward"]))}
                                      <span className='fs15 mx-2'>
                                          {convertSecValue(parseFloat(affiliateDetails["todayReward"]))}
                                      </span>
                                  </h4>
                              </div>
                          </div>
                          <div className={styles.rewardIcon}>
                              <img src={Images.rewardIcon} alt='rewardIcon' />
                          </div>
                      </div>

                  </div>

                  <div className={styles.nextPayoutWrapper}>
                      <div className={`${styles.cardBodyHeader} ${styles.nextPayoutPart}`}>
                          <div className={`${styles.nextPayoutContainer}`}>
                              <div className={`d-flex gap-3 justify-content-between ${styles.labelBlack}`}>
                                  <h3 className='fs20'>Next Payout</h3>

                                  {
                                      (affiliateDetails?.lastClaimDate === null || isCompleted) ?
                                          <Button btnText={"Claim Rewards"} className='cardSuccessBtn'
                                              disabled={affiliateDetails.totalCommission === 0 || isCompleted}
                                              onClick={claim}
                                          /> :
                                          <div className={styles.timerCard}>
                                              {
                                                  targetTime && (targetTime !== null || targetTime != 0) ?
                                                      <Countdown date={targetTime} renderer={renderer} /> :
                                                      <Loader />
                                              }
                                          </div>
                                  }
                              </div>
                          </div>
                      </div>
                      <div className={`${styles.cardBodyHeader} ${styles.pendingCardPart}  p-0`}>
                          <div className={`${styles.cardPart}`}>
                              <div className='d-flex align-items-center justify-content-between gap-2'>
                                  <div className='d-flex gap-2 align-items-center'>
                                      <img src={Images.affiliateDashboardIcon6} alt="icon" className={styles.cardIcon} />
                                      <h3 className={styles.cardTitleText} >Pending Claims</h3>
                                  </div>
                              </div>
                              <h4 className={styles.cardCountText}>
                                
                                  {convertValue(parseFloat(affiliateDetails["totalCommission"]))}
                                      <span className='fs15 mx-2'>
                                          {convertSecValue(parseFloat(affiliateDetails["totalCommission"]))}
                                      </span>
                              </h4>
                          </div>
                      </div>
                  </div>
              </div> */}
      <section className={` margin-top__xl`}>
        <h3 className="fs17 mb-4">Reward History</h3>
        <div className="custom-table__secondary">
          <ReactDatatable
            columns={columns}
            data={tableData}
            pagination
            paginationServer
            paginationDefaultPage={pagination.page}
            paginationTotalRows={count}
            onChangeRowsPerPage={handlePerRowsChange}
            onChangePage={handlePageChange}
            paginationRowsPerPageOptions={[5, 10, 15, 20]} // Page options
            noDataComponent={<TableNoData />}
          />
        </div>
      </section>
      {/* <div> */}
      {/* models components */}
      {/* <AffiliateChangeDisplayName show={changeDisplayNameModel} handleClose={() => displayNameModelToggle()} userdata={{ firstName: firstName, lastName: lastName }} secretKey={userdetails?.secretKey} />
              </div> */}
    </div>
  );
};

export default AffiliateRewardHub;
