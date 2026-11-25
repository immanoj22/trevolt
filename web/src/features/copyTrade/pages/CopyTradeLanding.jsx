/** PACKAGE IMPORT */

import React, { useEffect, useState } from "react";
import Select from "react-select";
import { Container } from "react-bootstrap";

/** LOCAL FILES IMPORT */

import styles from "../styles/copyTradeLanding.module.css";
import Button from "../../../components/Button/Button";
import Images from "../../../utils/Images";
import TraderProfileCard from "../components/TraderProfileCard";
import { SearchInput } from "../../../components/Input/InputFields";
import NoData from "../../../components/NoData/NoData";
import ApplyMasterTraderModal from "../modal/ApplyMasterTraderModal";
import { useNavigate } from "react-router-dom";
import { MetaTags } from "../../../meta/metaTags";
import { useDispatch, useSelector } from "react-redux";
import isEmpty from "is-empty";
import { myStrategies } from "../../../redux/copytradeAction";
import { getMyStrategy } from "../../../actions/copyTradeAction";

/** CODE START */

const CopyTradeLanding = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const { userdetails } = useSelector((state) => state.user);
  const { allStrategy, myStrategy } = useSelector((state) => state.copytrade);

  const [selectedView, setSelectedView] = useState("public");
  const [traderDetailIsOpen, setTraderDetailIsOpen] = useState(false);
  const [tradeProfileData, setTaderProfileData] = useState([]);
  const [myStrdy, setMyStradegy] = useState({});
  const [isRequested, setIsRequested] = useState(false);
  const [isMasterTrader, setIsmasterTrader] = useState(false);
  const [favStrategies, setFavStrategies] = useState([]);
  const [isCopier, setIsCopier] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const handleMasterTrader = () => {
    navigate(`/trader/profile?id=${myStrategy._id}`, {
      state: { data: myStrategy },
    });
  };

  useEffect(() => {
    if (!isEmpty(allStrategy)) {
      setTaderProfileData(allStrategy);
    }
    if (!isEmpty(myStrategy)) {
      setMyStradegy(myStrategy);
      setIsRequested(myStrategy.status == "requested" ? true : false);
      setIsmasterTrader(
        myStrategy.status == "approved" && myStrategy.strategyStatus == "active"
          ? true
          : false,
      );
    } else {
      // The currently selected account has no strategy of its own (a user can
      // hold a separate strategy per sub-account) — clear master-trader state
      // instead of leaving it showing whatever a previously-viewed account had.
      setMyStradegy({});
      setIsRequested(false);
      setIsmasterTrader(false);
    }
  }, [allStrategy, myStrategy]);

  const traderDetailsHandle = async (data) => {
    if (data.status) {
      setTraderDetailIsOpen(false);
      const mySStrategy = await getMyStrategy();
      if (mySStrategy.data.success) {
        dispatch(myStrategies({ myStrategies: mySStrategy.data.result }));
      }
    } else {
      setTraderDetailIsOpen(false);
    }
  };

  const handleSearch = (e) => {
    const value = e.target.value;
    setSearchQuery(value);

    if (selectedView === "favorite") {
      const favSource = allStrategy.filter((item) =>
        userdetails?.favStradegies?.some(
          (fav) => fav.strategyId === item._id,
        ),
      );
      if (isEmpty(value)) {
        setFavStrategies(favSource);
      } else {
        setFavStrategies(
          favSource.filter(
            (item) =>
              item.name?.toLowerCase().includes(value.toLowerCase()) ||
              item.description?.toLowerCase().includes(value.toLowerCase()),
          ),
        );
      }
    } else {
      if (isEmpty(value)) {
        setTaderProfileData(allStrategy);
      } else {
        setTaderProfileData(
          allStrategy.filter(
            (item) =>
              item.name?.toLowerCase().includes(value.toLowerCase()) ||
              item.description?.toLowerCase().includes(value.toLowerCase()),
          ),
        );
      }
    }
  };

  useEffect(() => {
    const filteredVal = allStrategy
      .filter((item) =>
        userdetails?.favStradegies?.some(
          (fav) => fav.strategyId === item._id,
        ),
      )
      .map((item) => {
        const isFavorite = true;

        const isCopied =
          Array.isArray(item.copier) &&
          item.copier.some((c) => c.userId === userdetails?.userId);

        return {
          ...item,
          isFavorite,
          isCopied,
        };
      });

    const copied = allStrategy.map((item) => {
      const isCopied =
        Array.isArray(item.copier) &&
        item.copier.some((c) => c.userId === userdetails?.userId);

      return {
        ...item,
        isCopied,
      };
    });

    setIsCopier(isEmpty(copied) ? false : true);
    setFavStrategies(filteredVal);
  }, [allStrategy, userdetails]);

  useEffect(() => {
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }, []);

  const handleTabSwitch = (tab) => {
    setSelectedView(tab);
    setSearchQuery("");
    setTaderProfileData(allStrategy); // reset to full list
  };

  return (
    <>
      <MetaTags />
      <main className={styles.landing}>
        {/* Banner Section  */}
        <section className={styles.copyTradeLanding}>
          <div className={styles.bannerSectionContainer}>
            <img
              src={Images.copyTradeBgImage}
              alt="CopyTradeBgImage"
              className={styles.imgSectionFile}
            />
          </div>
          <div className={styles.bannerSectionContent}>
            <div className="custom-container container">
              <div className={`${styles.bannerRow} row align-items-center`}>
                <div className="col-lg-5 mt-5 py-lg-4">
                  <div className={styles.bannerLeft}>
                    <h1
                      className={`${styles.bannerTitleXl} text-center text-lg-start`}
                    >
                      A Smarter Way to Invest - Copy Trading Simplified
                    </h1>
                    <p
                      className={`${styles.bannerDescription} text-center text-lg-start`}
                    >
                      Algorithmic trading uses computer programs to execute
                      trades based on predefined rules. Whether you’re a
                      beginner or a seasoned trader, algos can analyze vast
                      amounts of market data in milliseconds, helping you make
                      smarter, faster, and more consistent trades.
                    </p>
                    <div
                      className={`${styles.bannerButtons} justify-content-center justify-content-lg-start`}
                    >
                      {!isRequested && !isMasterTrader ? (
                        <Button
                          isLoading={false}
                          loadingText="Redirecting..."
                          btnText="Become a Master Trader"
                          onClick={() =>
                            !isEmpty(userdetails)
                              ? setTraderDetailIsOpen(true)
                              : ""
                          }
                          className="primaryBtn"
                        />
                      ) : isRequested ? (
                        <Button
                          isLoading={false}
                          loadingText="Redirecting..."
                          btnText="Request Submitted"
                          disabled={true}
                          className="primaryBtn"
                        />
                      ) : isMasterTrader ? (
                        <Button
                          isLoading={false}
                          loadingText="Redirecting..."
                          btnText="You are a Master Trader"
                          onClick={handleMasterTrader}
                          // disabled={true}
                          className="primaryBtn"
                        />
                      ) : (
                        <></>
                      )}
                      <Button
                        isLoading={false}
                        loadingText="Redirecting..."
                        btnText="Copy trade dashboard"
                        onClick={() =>
                          !isEmpty(userdetails)
                            ? navigate("/copier-dashboard")
                            : ""
                        }
                        className="darkFillBtn"
                        disabled={isMasterTrader || isRequested || !isCopier}
                        // selectedValue={currentResult}
                      />
                    </div>
                  </div>
                </div>
                <div className="offset-lg-1 col-lg-6 mt-lg-0">
                  <div className={styles.bannerRight}>
                    <img
                      src={Images.copyTradeBanner}
                      alt="Copy"
                      className={styles.bannerRightImage}
                    />
                  </div>
                </div>
              </div>
              <ApplyMasterTraderModal
                show={traderDetailIsOpen}
                handleClose={(e) => traderDetailsHandle(e)}
              />
            </div>
          </div>
        </section>

        {/* Traders Profile  */}
        <section className={styles.tradeProfileBG}>
          <img
            src={Images.proTradersImage}
            alt="pro_Traders"
            className={`${styles.proTraders} d-none d-md-block`}
          />
          <div className="container custom-container">
            <div className={styles.sectionHeader}>
              <h5 className={styles.sectionTitle}>Pro Traders Profile</h5>
              <p className={styles.sectionDescription}>
        Trevolt makes trading simple. Start your journey into the derivatives market with tools designed for ease, safety, and growth. 
              </p>
            </div>
            <div className={styles.traderLeft}>
              <div className={`${styles.traderViewTabs} `}>
                {/* <button aria-label="public" className={`${selectedView == 'public' ? styles.active : ''}`} onClick={() => setSelectedView('public')}>Public Portfolios</button>
                                <button aria-label="favorite" className={`${selectedView == 'favorite' ? styles.active : ''}`} onClick={() => setSelectedView('favorite')}>My Favorites</button> */}

                <button
                  aria-label="public"
                  className={`${selectedView == "public" ? styles.active : ""}`}
                  onClick={() => handleTabSwitch("public")}
                >
                  Public Portfolios
                </button>
                <button
                  aria-label="favorite"
                  className={`${selectedView == "favorite" ? styles.active : ""}`}
                  onClick={() => handleTabSwitch("favorite")}
                >
                  My Favorites
                </button>
              </div>
              <div className={styles.traderFilter}>
                <div className={`react-select__width-sm`}>
                  {/* <Select
                                        isSearchable={false}
                                        placeholder="All Position"
                                        classNamePrefix="react-select__primary"
                                    // options={positionOptions}
                                    /> */}
                </div>
                <SearchInput
                  type={"text"}
                  error={null}
                  onChange={handleSearch}
                  disabled={false}
                  placeholder={"Search"}
                  value={searchQuery}
                  name={"tableSearch"}
                  className={"secondarySearch"}
                  readOnly={false}
                  showSearchIcon={true}
                />
              </div>
            </div>

            {selectedView == "public" ? (
              <>
                {!isEmpty(tradeProfileData) ? (
                  <div className={styles.tradeProfileGrids}>
                    {/* {tradeProfileData.map((item, index) => (
                                            item._id != myStrategy._id ?
                                                <TraderProfileCard item={item} key={index} type="landingPage" mastertrader={isMasterTrader} />
                                                :
                                                <></>
                                        ))} */}

                    {tradeProfileData.map((item, index) =>
                      item.userId != userdetails.userId ? (
                        <TraderProfileCard
                          item={item}
                          key={index}
                          type="landingPage"
                          mastertrader={isMasterTrader}
                        />
                      ) : (
                        <></>
                      ),
                    )}
                  </div>
                ) : (
                  <div className={styles.nodata}>
                    <NoData content={"No Data Available"} />
                  </div>
                )}
              </>
            ) : selectedView == "favorite" ? (
              <>
                {/* {!isEmpty(favStrategies) ? <div className={styles.tradeProfileGrids}>
                                            {favStrategies.map((item, index) => (
                                                item._id != myStrategy._id ?
                                                    <TraderProfileCard item={item} key={index} type="landingPage" mastertrader={isMasterTrader} />
                                                    :
                                                    <></>
                                            ))} */}

                {!isEmpty(favStrategies) ? (
                  <div className={styles.tradeProfileGrids}>
                    {favStrategies.map((item, index) =>
                      item.userId != userdetails.userId ? (
                        <TraderProfileCard
                          item={item}
                          key={index}
                          type="landingPage"
                          mastertrader={isMasterTrader}
                        />
                      ) : (
                        <></>
                      ),
                    )}
                  </div>
                ) : (
                  <div className={styles.nodata}>
                    <NoData content={"No Data Available"} />
                  </div>
                )}
              </>
            ) : (
              <></>
            )}

            {!isEmpty(tradeProfileData) && (
              <div className={styles.loadMore}>
                {/* <Button
                                isLoading={false}
                                // loadingText="Redirecting..."
                                btnText="Load More"
                                // onClick={handleStartTrading}
                                className="primaryBtn"
                            // selectedValue={currentResult}
                            /> */}
              </div>
            )}
          </div>
        </section>
      </main>
    </>
  );
};

export default CopyTradeLanding;
