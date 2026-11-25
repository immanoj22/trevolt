/** PACKAGE IMPORT */

import React, { useEffect, useState } from "react";
import Select from "react-select";

/** LOCAL FILES IMPORT */

import styles from "../styles/CopierDashboard.module.css";
import Button from "../../../components/Button/Button";
import Images from "../../../utils/Images";
import { useNavigate } from "react-router-dom";
import {
  InputWithCurrencyAndLabel,
  PrimaryInput,
} from "../../../components/Input/InputFields";
import CopytradingPairModal from "../modal/CopyTradingPairsModal";
import RiskManagementModal from "../modal/RiskManagementModal";
import { useGlobalContext } from "../../../context/GlobalProvider";
import CopierProfileCard from "../components/CopierProfileCard";
import { FaEye, FaEyeSlash } from "react-icons/fa6";
import {
  addAndRemoveFav,
  getCopierDetails,
  getCopierTrades,
} from "../../../actions/copyTradeAction";
import { useSelector } from "react-redux";
import isEmpty from "is-empty";
import config from "../../../config/env";
import TraderProfileCard from "../components/TraderProfileCard";

/** CODE START */

const copierProfileData = [
  {
    img: Images.tp1,
    title: "Hariharan",
    description: "Registered 185 day(s) 1 hour(s) ago",
    profileCount: 3,
    traderspnl: "-",
    roi: "139353.31 %",
    aum: "70.00 USDT",
  },
];

const CopierDashboard = (props) => {
  const { userdetails } = useSelector((state) => state.user);
  const { allStrategy, myStrategy } = useSelector((state) => state.copytrade);

  const { theme } = useGlobalContext();
  const navigate = useNavigate();
  const [selectedSpotTabs, setSelectedSpotTabs] = useState("ongoing");
  const [viewPnlValue, setViewPnlValue] = useState(false);
  const [viewNetProfit, setViewNetProfit] = useState(false);

  const [records, setRecords] = useState([]);
  const [profileData, setProfileData] = useState({});
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  const getCopiedStradegies = async () => {
    const result = await getCopierTrades({
      page: 1,
      limit: 10,
    });
  };

  const addAndRemoveFavs = async (data) => {
    try {
      const payload = {
        strategyId: data._id,
      };
      const result = await addAndRemoveFav(payload);
      if (result.status) {
        userData();
        showToastMessage(result.message, "success");
      }
    } catch (error) {
      console.log("addAndRemoveFavs_err", error);
      // console.log("addAndRemoveFavs_err", error);
    }
  };

  // const fetchCopierDetails = async () => {
  //     try {
  //         // console.log('fetchCopierDetails', id, type, pairList, getUser)
  //         let { status, data } = await getCopierDetails({ strategyId: id }, userdetails.secretKey)
  //         console.log(status, data, 'fetchCopierDetails')
  //         if (status) {
  //             setProfileData(data)
  //         }
  //         setIsLoader(false)
  //     } catch (err) {
  //         console.log(err, 'fetchStrategyDetails__err')
  //     }
  // }

  const fetchCopierTraders = async () => {
    try {
      const result = await getCopierTrades(
        { skip: records?.length, limit: 10 },
        userdetails?.secretKey,
      );
      if (result.data.success) {
        setProfileData(result.data.result);
      } else {
        setIsLoading(false);
      }
    } catch (e) {
      console.log("fetchCopierTraders_err", e);
    }
  };

  useEffect(() => {
    fetchCopierTraders();
    if (!isEmpty(allStrategy)) {
      const filteredVal = allStrategy?.map((item) => {
        const isFavorite =
          userdetails?.favStradegies?.some(
            (fav) => fav.strategyId === item._id,
          ) || false;
        const isCopied =
          Array.isArray(item.copiersId) &&
          item.copiersId.some(
            (c) =>
              c.userId === userdetails?.userId &&
              c.accountId == userdetails?.accountId &&
              c.status == "active",
          );
        return {
          ...item,
          isFavorite,
          isCopied,
        };
      });
      setRecords(filteredVal);
    }
  }, [allStrategy, props]);

  useEffect(() => {
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }, []);

  return (
    <>
      <main className={styles.copierProfilePage}>
        <section className={`${styles.copierDashboard}`}>
          <div className="custom-container container my-5">
            <div className={styles.profileBackBtn}>
              <Button
                // isLoading={false}
                loadingText="Redirecting..."
                btnText="Back"
                onClick={() => navigate(-1)}
                className="backBtn"
                selectedValue={null}
              />
            </div>
            <div className={`${styles.labelDescription} mt-4`}>
              <p className={styles.cardTitle}>My Trading Dashboard</p>
              <p className={`${styles.label} mt-2`}>
                Explore detailed trader profiles, track performance, and copy
                top strategies in real time. Get expert trading insights for
                every trade you make.
              </p>
            </div>
            <div
              className={`${styles.profileContainer} ${styles.containerFlex} mt-4`}
            >
              <div className={styles.profileLeft}>
                <div className={styles.profileImage}>
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
                </div>
                <div className={styles.profileDataContainer}>
                  <p className={styles.userName}>
                    {userdetails?.firstName + " " + userdetails?.lastName}
                  </p>
                  <p>
                    <span className={styles.labelValue}>
                      <span
                        className={
                          profileData?.roi > 0
                            ? styles.profit
                            : profileData?.roi < 0
                            ? styles.loss
                            : ""
                        }
                      >
                        {profileData?.roi
                          ? profileData?.roi > 0
                            ? `+${profileData?.roi.toFixed(5)} %`
                            : `${profileData?.roi.toFixed(5)} %`
                          : 0}
                      </span>

                      {"  - "}ROI
                    </span>
                    {/* <span className={styles.label}> {profileData?.totalPandL}</span> */}
                  </p>
                </div>
              </div>
              <div className={`${styles.profileRight}`}>
                <div className={`${styles.chartInnerContainer}`}>
                  <p className={`${styles.labelValue} text-center`}>
                    {profileData?.totalPandL}
                  </p>
                  <p className={`${styles.label} text-center`}>Total PnL</p>
                </div>
              </div>
            </div>
            <div className={styles.copierProfileGrids}>
              {records.map((item, index) => {
                return item.isCopied ? (
                  <TraderProfileCard
                    item={item}
                    key={index}
                    type="copierDashboard"
                  />
                ) : null;
              })}
            </div>
            {/* <div className="row mt-5">
                            <div className="col-12 col-lg-7">
                                <p className={`${styles.cardTitle}`}>Futures Copy </p>
                                <div className={`${styles.spotTabs} mt-2`}>
                                    <button aria-label="ongoing" className={`${selectedSpotTabs == 'ongoing' ? styles.active : ''}`} onClick={() => setSelectedSpotTabs('ongoing')}>Ongoing (0)</button>
                                    <button aria-label="close" className={`${selectedSpotTabs == 'close' ? styles.active : ''}`} onClick={() => setSelectedSpotTabs('close')}>Close (0)</button>
                                </div>
                            </div>
                        </div> */}
            <div className="row mt-3">
              <div className="col-12">
                <p className={styles.label}>
                  Only display Closed Portfolios from the past 90 days.
                  Portfolios older than 90 days will no longer be listed here
                </p>
              </div>
            </div>
            <div className="row mt-3">
              <div className="col-12 col-lg-7">
                <div className="row">
                  <div className="col-12 col-sm-12 col-md-6 col-lg-6">
                    <p className={styles.cardTitle}>
                      Total Realized PnL (USDT){" "}
                      <span className={styles.cursorPointer}>
                        {viewPnlValue ? (
                          <FaEye onClick={() => setViewPnlValue(false)} />
                        ) : (
                          <FaEyeSlash onClick={() => setViewPnlValue(true)} />
                        )}{" "}
                      </span>{" "}
                    </p>
                    {viewPnlValue ? (
                      <p className={styles.label}>
                        {profileData?.totalPandL ?? 0}
                      </p>
                    ) : (
                      <p className={styles.label}> ******* </p>
                    )}
                  </div>
                  {/* <div className="col-12 col-sm-12 col-md-6 col-lg-6 mt-3 mt-md-0">
                    <p className={styles.cardTitle}>
                      Net Profit (USDT){" "}
                      <span className={styles.cursorPointer}>
                        {viewNetProfit ? (
                          <FaEye onClick={() => setViewNetProfit(false)} />
                        ) : (
                          <FaEyeSlash onClick={() => setViewNetProfit(true)} />
                        )}{" "}
                      </span>{" "}
                    </p>
                    {viewNetProfit ? (
                      <p className={styles.label}>
                        {profileData?.netProfit ?? 0}
                      </p>
                    ) : (
                      <p className={styles.label}> ******* </p>
                    )}
                  </div> */}
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
    </>
  );
};

export default CopierDashboard;
