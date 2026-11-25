/** PACKAGE IMPORT */

import React, { useEffect, useState } from "react";

/** LOCAL FILES IMPORT */

import styles from "../styles/algoTradingLanding.module.css";
import Button from "../../../components/Button/Button";
import Images from "../../../utils/Images";
import { MetaTags } from "../../../meta/metaTags";
import { getCms } from "../../../actions/cmsAction";
import { cmsData } from "../../../lib/cmsCommon";
import ComingSoon from "../../../components/ComingSoon/ComingSoon";
import featureFlags from "../../../config/featureFlags";

/** CODE START */

// const algoTradeData = [
//     {
//         img: Images.algoTrade1,
//         title: 'Speed & Efficiency',
//         desc: 'Execute thousands of trades per second with minimal latency',
//     },
//     {
//         img: Images.algoTrade2,
//         title: '24/7 Market Monitoring',
//         desc: 'Let your strategies run round-the-clock—no sleep, no missed opportunities.',
//     },
//     {
//         img: Images.algoTrade3,
//         title: 'Backtested Strategies',
//         desc: 'Use historical data to fine-tune your algorithms before going live..',
//     },
//     {
//         img: Images.algoTrade4,
//         title: 'Emotion-Free Decisions',
//         desc: 'Avoid panic selling or greedy buys. Algos follow logic, not feelings.',
//     }
// ]

// const keyFeatureData = [
//     {
//         img: Images.keyFeature1,
//         title: 'Advanced Charting & Analytics',
//     },
//     {
//         img: Images.keyFeature2,
//         title: 'Paper Trading Mode',
//     },
//     {
//         img: Images.keyFeature3,
//         title: 'Real-Time Data Feeds',
//     },
//     {
//         img: Images.keyFeature4,
//         title: ' Custom API Access',
//     }
// ]

// const worksData = [
//     {
//         img: Images.works1,
//         title: 'Design Your Strategy',
//         desc: 'Choose from prebuilt strategies or create your own with logic blocks or code.',
//     },
//     {
//         img: Images.works2,
//         title: 'Backtest with Historical Data',
//         desc: 'Simulate performance against past market conditions.',
//     },
//     {
//         img: Images.works3,
//         title: 'Go Live or Paper Trade',
//         desc: 'Test your strategy in a live or simulated environment.',
//     },
//     {
//         img: Images.works4,
//         title: 'Monitor & Optimize',
//         desc: 'Get real-time analytics and tweak strategies anytime.',
//     }
// ]

const AlgoTradingLanding = () => {
  const [data, setData] = useState([]);

  useEffect(() => {
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }, []);

  useEffect(() => {
    fetchCms();
  }, []);

  const fetchCms = async (data) => {
    let reqData = {
      pageName: "Algo Trading",
    };

    try {
      const result = await getCms(reqData);
      if (result?.status) {
        setData(result?.data);
      }
    } catch (error) {
      console.log("error cms", error);
    }
  };

  return (
    // Temporary: Algo Trading is being hidden behind a "Coming Soon" page
    // for both the live and demo user panels — gated behind
    // featureFlags.showAlgoTradingComingSoon. Flip that flag off once the
    // feature is ready; everything below is untouched and renders exactly
    // as before when the flag is false.
    <ComingSoon
      active={featureFlags.showAlgoTradingComingSoon}
      title="Coming Soon..."
      message="Algo Trading is being finalized. Please check back soon."
    >
    <>
      <MetaTags />
      <main className={styles.landing}>
        {/* Banner Section  */}
        <section className={styles.algoTradeLanding}>
          <div className={styles.bannerSectionContainer}>
            <img
              src={Images.algoTradeBgImage}
              alt="AlgoTradeBgImage"
              className={styles.imgSectionFile}
            />
          </div>
          <div className={styles.bannerSectionContent}>
            <div className="custom-container container">
              <div className={`${styles.bannerRow} row align-items-center`}>
                <div className="col-lg-5">
                  <div className={styles.bannerLeft}>
                    {data?.SECTION?.[0]?.sectionTitle && (
                      <h1
                        className={`${styles.bannerTitleXl} text-center text-lg-start`}
                      >
                        {/* Revolutionize Your Trading with Algorithms */}
                        {/* {data?.SECTION?.[0]?.sectionTitle} */}
                        {cmsData(
                          data,
                          "algo-revolutionize-trading",
                          "sectionTitle",
                        )}
                      </h1>
                    )}
                    {data?.SECTION?.[0]?.sectionDescription && (
                      <p
                        className={`${styles.bannerDescription} text-center text-lg-start`}
                      >
                        {/* Algorithmic trading uses computer programs to execute trades based on predefined rules. Whether you’re a beginner or a seasoned trader, algos can analyze vast amounts of market data in milliseconds, helping you make smarter, faster, and more consistent trades. */}
                        {/* {data?.SECTION?.[0]?.sectionDescription} */}
                        {cmsData(
                          data,
                          "algo-revolutionize-trading",
                          "sectionDescription",
                        )}
                      </p>
                    )}

                    <div
                      className={`${styles.bannerButtons} justify-content-center justify-content-lg-start`}
                    >
                      <Button
                        isLoading={false}
                        loadingText="Redirecting..."
                        btnText="Learn more"
                        // onClick={() => setTraderDetailIsOpen(true)}
                        className="primaryBtn"
                        // selectedValue={currentResult}
                      />
                    </div>
                  </div>
                </div>
                <div className="offset-lg-1 col-lg-6 mt-lg-0">
                  <div className={styles.bannerRight}>
                    <img
                      src={Images.algoTradingBannerImage}
                      alt="algo_banner"
                      className={styles.bannerRightImage}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Why Choose Algo Trading  */}
        <section className={`${styles.algoTradeBG}`}>
          <img
            src={Images.proTradersImage}
            alt="Algo_Traders"
            className={`${styles.proTraders} d-none d-md-block`}
          />
          <img
            src={Images.currency9}
            alt="currency9"
            className={`${styles.proTradersTwo} d-none d-md-block`}
          />
          <img
            src={Images.currency9}
            alt="currency9"
            className={`${styles.proTradersThree} d-none d-md-block`}
          />
          <div className="container custom-container">
            <div className={styles.sectionHeader}>
              {data?.SECTION?.[1]?.sectionTitle && (
                <h5 className={styles.sectionTitle}>
                  {/* Why Choose Algorithmic Trading? */}
                  {/* {data?.SECTION?.[1]?.sectionTitle} */}
                  {cmsData(data, "algo-why-choose", "sectionTitle")}
                </h5>
              )}
              {data?.SECTION?.[1]?.sectionDescription && (
                <p className={styles.sectionDescription}>
                  {/* Trevolt makes trading simple. Start your journey into the derivatives market with tools designed for ease, safety, and growth. */}
                  {/* {data?.SECTION?.[1]?.sectionDescription} */}
                  {cmsData(data, "algo-why-choose", "sectionDescription")}
                </p>
              )}
            </div>
            <div className={styles.chooseAlgoGrids}>
              {/* algoTradeData */}
              {/* data?.SECTION?.[1]?.CARD?. */}
              {cmsData(data, "algo-why-choose", "CARD").map((item, index) => (
                <div className={styles.algoCard}>
                  <div className={styles.cardHead}>
                    <img
                      src={Images[`algoTrade${index + 1}`]}
                      alt={item.title}
                      className={styles.algoTradeImage}
                    />
                  </div>
                  <div className={styles.cardBody}>
                    <p className={styles.cardLabel}>{item?.title}</p>
                    <p className={`${styles.cardLabelValue} mt-2`}>
                      {item?.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
            <div className={styles.joinNowButtons}>
              <Button
                isLoading={false}
                loadingText="Redirecting..."
                btnText="Join now"
                className="outlineBtn"
              />
            </div>
          </div>
        </section>

        {/* how it works  */}
        <section className={styles.itWorksBG}>
          {/* <img src={Images.currencyGif} alt="CurrencyGif" /> */}
          <div className="container custom-container">
            <div className={styles.sectionHeader}>
              {data?.SECTION?.[2]?.sectionTitle && (
                <h5 className={styles.sectionTitle}>
                  {/* How It Works */}
                  {/* {data?.SECTION?.[2]?.sectionTitle} */}
                  {cmsData(data, "algo-crypto-simplicity", "sectionTitle")}
                </h5>
              )}
              {data?.SECTION?.[2]?.sectionDescription && (
                <p className={styles.sectionDescription}>
                  {/* Trevolt makes trading simple. Start your journey into the derivatives market with tools designed for ease, safety, and growth. */}
                  {/* {data?.SECTION?.[2]?.sectionDescription} */}
                  {cmsData(
                    data,
                    "algo-crypto-simplicity",
                    "sectionDescription",
                  )}
                </p>
              )}
            </div>
            <div className={styles.itWorksGrids}>
              {/* worksData */}

              {cmsData(data, "algo-crypto-simplicity", "CARD")?.map(
                (item, index) => (
                  <div className={styles.worksCard}>
                    <div className={styles.keyCardHead}>
                      <img
                        src={Images[`works${index + 1}`]}
                        alt={item.title}
                        className={styles.worksImage}
                      />
                    </div>
                    <div className={`${styles.keyCardBody} mt-4`}>
                      <p className={`${styles.cardLabel} text-center`}>
                        {item?.title}
                      </p>
                      <p
                        className={`${styles.cardLabelValue} text-center mt-2`}
                      >
                        {item?.description}
                      </p>
                    </div>
                  </div>
                ),
              )}
            </div>
          </div>
        </section>

        {/* Our Key Futures  */}
        <section className={styles.keyFeaturesBG}>
          <img
            src={Images.proTradersImage}
            alt="keyFutureOne"
            className={`${styles.keyFutureOne} d-none d-md-block`}
          />
          <img
            src={Images.currency9}
            alt="keyFutureTwo"
            className={`${styles.keyFutureTwo} d-none d-md-block`}
          />
          <div className="container custom-container">
            <div className={styles.sectionHeader}>
              {data?.SECTION?.[3]?.sectionTitle && (
                <h5 className={styles.sectionTitle}>
                  {/* Our Key Features */}
                  {/* {data?.SECTION?.[3]?.sectionTitle} */}
                  {cmsData(data, "algo-crypto-growth-tools", "sectionTitle")}
                </h5>
              )}
              {data?.SECTION?.[3]?.sectionDescription && (
                <p className={styles.sectionDescription}>
                  {/* Trevolt makes trading simple. Start your journey into the derivatives market with tools designed for ease, safety, and growth. */}
                  {/* {data?.SECTION?.[3]?.sectionDescription} */}
                  {cmsData(
                    data,
                    "algo-crypto-growth-tools",
                    "sectionDescription",
                  )}
                </p>
              )}
            </div>
            <div className={`${styles.keyFeatureGrids}`}>
              {/* keyFeatureData */}
              {cmsData(data, "algo-crypto-growth-tools", "CARD")?.map(
                (item, index) => (
                  <div className={styles.keyCard}>
                    <div className={styles.keyCardHead}>
                      <img
                        src={Images[`keyFeature${index + 1}`]}
                        alt={item.title}
                        className={styles.algoTradeImage}
                      />
                    </div>
                    <div className={`${styles.algoCardBody} mt-4`}>
                      <p className={`${styles.keyLabel} text-center`}>
                        {item?.title}
                      </p>
                    </div>
                  </div>
                ),
              )}
            </div>
          </div>
        </section>
      </main>
    </>
    </ComingSoon>
  );
};

export default AlgoTradingLanding;
