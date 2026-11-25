// package import

import React, { useEffect, useState } from "react";
import { IoMdHeart, IoMdHeartEmpty } from "react-icons/io";
import { FaRegUser } from "react-icons/fa6";
import { Link, useLocation, useNavigate } from "react-router-dom";

// local import

import styles from "../styles/traderProfileCard.module.css";
import Images from "../../../utils/Images";
import Button from "../../../components/Button/Button";

import config from "../../../config/env";
import isEmpty from "is-empty";
import { useDispatch, useSelector } from "react-redux";
import { addAndRemoveFav } from "../../../actions/copyTradeAction";
import { getUserDetailsHooks } from "../../../actions/userAction";
import { showToastMessage } from "../../../lib/toast";
import { UserDetails } from "../../../redux/action";
import { truncateString } from "../../../lib/Common";

const TraderProfileCard = React.memo(({ key, item, mastertrader }) => {
  const { img, title, description, profileCount, pnl, roi, aum, traderspnl } =
    item;
  const [activeHeart, setActiveHeart] = useState(false);

  const dispatch = useDispatch();
  const { userdetails } = useSelector((state) => state.user);
  const { allStrategy, myStrategy } = useSelector((state) => state.copytrade);

  const location = useLocation();
  // const { type } = props
  const [isMaster, setIsMaster] = useState(false);
  const [hasFav, setHasFav] = useState(false);
  const [isCopier, setIscopier] = useState(false);
  const [isFav, setIsFav] = useState(false);
  const [type, setType] = useState(false);

  let navigate = useNavigate();

  const handleCopyNavigate = () => {
    if (userdetails?.kycStatus !== "approved") {
      showToastMessage(
        "You are not eligible for trade before approval of KYC Information",
        "error",
      );
      return;
    }
    navigate(`/copyingTrade?id=${item._id}`, { state: { data: item } }); // Arun changes
    // navigate("/copyingTrade")
  };

  const handleCardClick = () => {
    navigate(`/trader/profile?id=${item._id}`, { state: { data: item } });
  };

  const handleViewNavigate = () => {
    navigate(`/trader/profile?id=${item._id}`, { state: { data: item } });
  };

  const addAndRemoveFavs = async (data) => {
    try {
      const payload = {
        strategyId: data._id,
      };
      const result = await addAndRemoveFav(payload, userdetails.secretKey);
      if (result.data.result.status) {
        const userDetail = await getUserDetailsHooks();
        dispatch(UserDetails({ userdetails: userDetail.data.result.data }));
        showToastMessage(result.data.message, "success");
      }
    } catch (error) {
      console.log("addAndRemoveFavs_err", error);
    }
  };

  useEffect(() => {
    // const filteredVal = allStrategy.map((item) => {

    const isFavorite =
      userdetails?.favStradegies?.some(
        (fav) => fav.strategyId === item._id,
      ) || false;
    const isCopied =
      Array.isArray(item.copiersId) &&
      item.copiersId.some(
        (c) =>
          c.userId.toString() === userdetails?.userId &&
          c.accountId == userdetails?.accountId &&
          c.status == "active",
      );
    setIscopier(isCopied);
    setIsFav(isFavorite);
    // return {
    //     ...item,
    //     isFavorite,
    //     isCopied
    // };
    // });

    // setStradegies(filteredVal);
    // console.log('currentThemeRedux', filteredVal)
  }, [userdetails]);

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

  const UpdateViewuser = async (strategyId) => {
    try {
      if (!isEmpty(getUser)) {
        let { status, message } = await setViewers(strategyId);
        if (status) {
          navigate(`/copy/profile/trader/${strategyId}`);
        }
      } else {
        navigate(`/copy/profile/trader/${strategyId}`);
      }
    } catch (err) {
      console.log(err, "UpdateViewuser__err");
    }
  };

  // const handleFav = (trader) => {
  //     addAndRemoveFav(trader)
  //     setHasFav(!hasFav)
  // };

  const handleHeart = (item) => {
    addAndRemoveFavs(item);
    setHasFav(!hasFav);
  };

  const handleOnClickFollowing = () => {};
  const handleClickLogin = () => {
    navigate("/login");
  };

  const handleView = (type) => {
    if (type == "copier") {
      navigate(`/copier/profile?id=${item._id}`, { state: { data: item } });
    }
    if (type == "trader") {
      navigate(`/trader/profile?id=${item._id}`, { state: { data: item } });
    }
  };

  useEffect(() => {
    if (location.pathname == "/copy-trade") {
      setType("landingPage");
    } else {
      setType("copierDashboard");
    }
    setType(
      location.pathname == "/copy-trade" ? "landingPage" : "copierDashboard",
    );
  }, [location]);

  return (
    <div className={styles.card} key={key}>
      <div className={styles.cardHead}>
        <div className={styles.profileDetails} onClick={handleCardClick}>
          {/* // Arun changes */}
          <img
            src={item?.profileImage}
            alt={"title"}
            className={styles.image}
          />
          {/* <img src={img} alt={title} className={styles.image} /> */}
          <div className={styles.cardContent}>
            <h5 className={styles.title}>
              {/* {title} */}
              {truncateString(item.name, 20)}
            </h5>

            <p className={styles.description}>
              {truncateString(description, 25)}
            </p>
            <div className={styles.profile}>
              <FaRegUser fontSize={13} className={styles.userProfile} />
              <p className={`${styles.followList} m-0`}>{item?.curCopier}</p>
              {/* <p className={`${styles.followList} m-0`}>{profileCount}</p> */}
            </div>
          </div>
        </div>
        {!isEmpty(userdetails) ? (
          <button
            aria-label="heartIcon"
            className={`${styles.heartBtn}`}
            onClick={() => handleHeart(item)}
          >
            {" "}
            {isFav ? (
              <IoMdHeart fontSize={20} />
            ) : (
              <IoMdHeartEmpty fontSize={20} />
            )}{" "}
          </button>
        ) : (
          <></>
        )}
      </div>
      {/* <div className={styles.cardBody} onClick={handleCardClick}> */}
      {/* <div> */}
      {/* <p className={styles.label}>Total Pnl</p> */}
      {/* dynamic class for positive and negative - profit , loss */}
      {/* Arun Changes  */}
      {/* <p className={`${styles.labelValues} ${styles.profit}`}>{!isEmpty(item?.stradegyDetails) ? item?.stradegyDetails[0]?.totalPnl : 0}</p> */}
      {/* <p className={styles.label}>ROI -{isEmpty(item?.stradegyDetails) ? item?.stradegyDetails[0]?.totalRoi : 0} </p> */}

      {/* <p>
                        <span className={styles.labelValue}>
                            {Number(item?.stradegyDetails?.[0]?.totalRoi ?? 0).toFixed(6)}
                        </span>
                        <span className={styles.label}> - ROI</span>
                    </p> */}

      {/* <p className={`${styles.labelValues} ${styles.profit}`}>{pnl}</p>
                    <p className=' mt-2'><span className={`${styles.label}`}>ROI - </span> <span className={styles.labelValues}>{roi}</span> </p> */}
      {/* </div> */}
      {/* <img src={Images.tradersChart} alt="TradersChart" className={styles.chartImage} /> */}
      {/* </div> */}

      <div className={styles.cardBody} onClick={handleCardClick}>
        <div>
          <p className={styles.label}>Total Pnl</p>

          <p
            className={`${styles.labelValues} ${
              Number(item?.stradegyDetails?.[0]?.totalPnl ?? 0) > 0
                ? styles.profit
                : Number(item?.stradegyDetails?.[0]?.totalPnl ?? 0) < 0
                ? styles.loss
                : ""
            }`}
          >
            {Number(item?.stradegyDetails?.[0]?.totalPnl ?? 0).toFixed(6)}
          </p>

          {/* ✅ FIX: was isEmpty (inverted) + hardcoded "-" + no toFixed */}
          <p>
            <span
              className={`${styles.labelValue} ${
                Number(item?.stradegyDetails?.[0]?.totalRoi ?? 0) > 0
                  ? styles.profit
                  : Number(item?.stradegyDetails?.[0]?.totalRoi ?? 0) < 0
                  ? styles.loss
                  : ""
              }`}
            >
              {Number(item?.stradegyDetails?.[0]?.totalRoi ?? 0).toFixed(6)}
            </span>
            <span className={styles.label}> - ROI</span>
          </p>
        </div>
        {(() => {
          const totalPnl = Number(
            item?.stradegyDetails?.[0]?.totalPnl ?? 0,
          );
          if (totalPnl === 0) return null;
          return (
            <svg
              width="184"
              height="40"
              viewBox="0 0 184 40"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className={styles.chartImage}
            >
              <path
                d="M0.302734 37.7612L14.1465 34.8133L18.8598 21.5544H29.4636L32.1145 11.7339H46.842L49.493 7.80537H78.9479L88.0789 1.91162H93.9699L95.7372 15.661L98.9773 21.5544H106.046L110.465 11.7339H121.363L124.014 7.80537H144.338L149.64 21.5544H154.353H172.32C173.007 25.974 176.267 34.8133 183.808 34.8133"
                style={{
                  stroke: totalPnl > 0
                    ? "var(--color-green-01)"
                    : "var(--color-red-02)",
                }}
                strokeWidth="3"
              />
            </svg>
          );
        })()}
      </div>

      <div className={styles.cardPoints} onClick={handleCardClick}>
        <div>
          <p className={styles.label}>AUM</p>
          <p className={`${styles.labelValues} mt-1`}>
            {!isEmpty(item?.copierDetails)
              ? item?.copierDetails[0].totalAUM?.toFixed(2)
              : 0}{" "}
            USD
          </p>
        </div>
        <div className="tradersPnl">
          <p className={styles.label}>Copy Trader's Pnl</p>
          <p className={`${styles.labelValues} ${styles.textEnd} mt-1`}>
            {!isEmpty(item.copierDetails)
              ? (item?.copyTraderPnlDetails?.[0]?.copyTraderPnl ?? 0).toFixed(2)
              : (0).toFixed(2)}{" "}
            USD
          </p>
        </div>
      </div>

      {type == "landingPage" && (
        <div className={styles.cardButtons}>
          {!isCopier && !isEmpty(userdetails) ? (
            <>
              <Button
                isLoading={false}
                // loadingText="Redirecting..."
                disabled={isMaster}
                btnText="Copy"
                onClick={handleCopyNavigate}
                className="successFillRectangleBtn"
                // selectedValue={currentResult}
              />
              <Button
                isLoading={false}
                // loadingText="Redirecting..."
                // disabled={mastertrader}
                btnText="View"
                onClick={handleViewNavigate}
                className="darkFillRectangleBtn"
                // selectedValue={currentResult}
              />
            </>
          ) : !isEmpty(userdetails) ? (
            <>
              <Button
                isLoading={false}
                btnText="Following"
                disabled={isMaster}
                onClick={handleOnClickFollowing}
                className="darkFillRectangleBtn"
              />
            </>
          ) : (
            <>
              <Button
                isLoading={false}
                btnText="Login"
                disabled={isMaster}
                onClick={handleClickLogin}
                className="darkFillRectangleBtn"
              />
            </>
          )}
        </div>
      )}

      {type == "copierDashboard" && (
        <div className={styles.cardButtons}>
          <>
            <Button
              isLoading={false}
              // loadingText="Redirecting..."
              btnText="View Trader"
              disabled={mastertrader}
              onClick={() => handleView("trader")}
              className="successFillRectangleBtn"
              // selectedValue={currentResult}
            />
            <Button
              isLoading={false}
              // loadingText="Redirecting..."
              btnText="View Copier"
              // disabled={mastertrader}
              onClick={() => handleView("copier")}
              className="darkFillRectangleBtn"
              // selectedValue={currentResult}
            />
          </>
        </div>
      )}
    </div>
  );
});

export default TraderProfileCard;
