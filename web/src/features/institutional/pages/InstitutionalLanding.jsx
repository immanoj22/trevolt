/** PACKAGE IMPORT */

import React, { useEffect, useState } from "react";
import { useSelector } from 'react-redux'
/** LOCAL FILES IMPORT */

import styles from "../styles/institutionalLanding.module.css";
import Button from "../../../components/Button/Button";
import bannerVideo from '../../../assets/videos/candlestick.mp4';
import Images from '../../../utils/Images';
import { useGlobalContext } from '../../../context/GlobalProvider';
import { useNavigate } from "react-router-dom";
import SignatureServiceCard from "../components/signatureService/SignatureServiceCard";
import { MetaTags } from "../../../meta/metaTags";
import { showToastMessage } from "../../../lib/toast";
import { getCms } from "../../../actions/cmsAction";
import { cmsCardData, cmsData } from "../../../lib/cmsCommon";
import ComingSoon from "../../../components/ComingSoon/ComingSoon";
import featureFlags from "../../../config/featureFlags";
/** CODE START */

const InstitutionalLanding = () => {
    const { userdetails } = useSelector((state) => state?.user);
    const { theme } = useGlobalContext();
    const navigate = useNavigate();
    const [data, setData] = useState([]);


    const signaqtureServiceData = [
        {
            title: "Fast API",
            description: "Ultra-fast API delivering low-latency performance with streamlined data flow."
        },
        {
            title: "Institutional Liquidity Engines",
            description: "Trade seamlessly with minimal slippage and maximize your returns."
        },
        {
            title: "Competitive commissions",
            description: "With our high-performance commission model, success is built in."
        },
        {
            title: "Fast API",
            description: "Ultra-fast API delivering low-latency performance with streamlined data flow."
        },
        {
            title: "Loans",
            description: "Ultra-fast API delivering low-latency performance with streamlined data flow."
        },
        {
            title: "Brokers",
            description: "Trade seamlessly with minimal slippage and maximize your returns."
        },
        {
            title: "Discount Fees",
            description: "With our high-performance commission model, success is built in."
        },
        {
            title: "Transaction",
            description: "Ultra-fast API delivering low-latency performance with streamlined data flow."
        }
    ]

    useEffect(() => {
        window.scrollTo({
            top: 0,
            behavior: "smooth",
        });
    }, []);

    useEffect(() => {
        fetchCms();
    }, [])


    const fetchCms = async (data) => {

        let reqData = {
            pageName: 'Institutional'
        }

        try {
            const result = await getCms(reqData);
            if (result?.status) {
                setData(result?.data);
            }
        } catch (error) {
            console.log('error cms', error);
        }
    }


    return (
        // Temporary: Institutional is only partially built — gated behind
        // featureFlags.showInstitutionalComingSoon for client review. Flip
        // that flag off once the feature is ready; everything below is
        // untouched and renders exactly as before when the flag is false.
        <ComingSoon
            active={featureFlags.showInstitutionalComingSoon}
            title="Coming Soon..."
            message="Our institutional offering is being finalized. Please check back soon."
        >
        <div className={styles.institutionLanding}>
            <MetaTags />
            <section className={styles.BannerSection}>
                <div className={styles.bannerSectionContainer}>

                    <img
                        src={Images.institutionBannerBg}
                        alt='institutionBannerBg'
                        className={styles.imgSectionFile} />

                </div>
                <div className={styles.bannerSectionContent}>
                    <div className="custom-container container">
                        <div className={`${styles.bannerRow} row align-items-center`}>
                            <div className='col-lg-6'>
                                <div className={styles.bannerLeft}>
                                    {
                                        data?.SECTION?.length > 0 &&
                                        <h1 className={`${styles.bannerTitleXl} text-center text-lg-start`}>
                                            {/* Enabling Institutional <br /> Success in the Digital <br /> Asset Revolution */}
                                            {/* Built for Professional Traders and Institutions */}
                                            {/* {data?.SECTION?.[0]?.sectionTitle} */}
                                            {cmsData(data, "institution-built-for-professionals", "sectionTitle")}
                                        </h1>
                                    }
                                    {
                                        data?.SECTION?.length > 0 &&
                                        <p className={`${styles.bannerDescription} text-center text-lg-start`}>
                                            {/* A Trading Institution Portal is a specialized online platform designed to cater to the needs of institutional traders, such as hedge funds, proprietary trading firms, asset managers, and high-net-worth clients. */}
                                            {/* Trevolt provides advanced APIs, automated risk management systems, and detailed analytics dashboards for funds, prop traders, and algorithmic developers.
                                            Our robust infrastructure, deep liquidity, and 24/7 account support make Trevolt the preferred derivatives partner for institutional investors. */}
                                            {/* {data?.SECTION?.[0]?.sectionDescription} */}
                                            {cmsData(data, "institution-built-for-professionals", "sectionDescription")}

                                        </p>
                                    }

                                    <div className={`${styles.bannerButtons} justify-content-center justify-content-lg-start`}>
                                        {
                                            userdetails && userdetails?.institutionalStatus === 'approved' ?
                                                <Button
                                                    isLoading={false}
                                                    loadingText="Redirecting..."
                                                    btnText="Dashboard"
                                                    className="darkFillBtn"
                                                    onClick={() => navigate("/institutional/dashboard")}
                                                /> :
                                                <Button
                                                    isLoading={false}
                                                    loadingText="Redirecting..."
                                                    btnText="Apply"
                                                    className="primaryBtn"
                                                    onClick={() => {
                                                        if (userdetails?.institutionalStatus === 'pending') {
                                                            showToastMessage('You have already applied. Please wait for admin approval', 'warning')
                                                            return
                                                        }
                                                        navigate("/institutional-apply")
                                                    }}
                                                />
                                        }

                                    </div>
                                </div>
                            </div>
                            <div className='offset-lg-1 col-lg-5 mt-lg-0'>
                                <div className={styles.bannerRight}>
                                    <img src={theme == 'dark' ? Images.institutionBannerImg : Images.institutionBannerImgLight} className={styles.bannerRightImage + " img-fluid"} alt="Trevolt" />
                                </div>
                            </div>
                        </div>

                    </div>
                </div>
            </section>
            <section className={styles.signatureService}>
                <img src={Images.currency7} alt="Currency7" className={`${styles.signatureImageOne} d-none d-md-block`} />
                <img src={Images.currency9} alt="currency9" className={`${styles.signatureImageTwo} d-none d-md-block`} />
                <div className={`container custom-container`}>
                    <div className={styles.sectionHeader}>
                        {
                            data?.SECTION?.length > 0 &&
                            <h5 className={styles.sectionTitle}>
                                {/* Signature Service */}
                                {/* {data?.SECTION?.[1]?.sectionTitle} */}
                                {cmsData(data, "institution-signature-service", "sectionTitle")}
                            </h5>
                        }{
                            data?.SECTION?.length > 0 &&

                            <p className={styles.sectionDescription}>
                                {/* Trevolt makes trading simple. Start your journey into the derivatives market with tools designed for ease, safety, and growth. */}
                                {/* {data?.SECTION?.[1]?.sectionDescription} */}
                                {cmsData(data, "institution-signature-service", "sectionDescription")}
                            </p>
                        }

                    </div>
                    <div className={styles.signatureServiceGrids}>
                        {/* signaqtureServiceData */}

                        {cmsCardData(data, "institution-signature-service", 1, "CARD")?.map((item, index) => (
                            <SignatureServiceCard item={item} key={index} />
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
            <section className={styles.signatureService + " pt-0 pt-lg-3 " + styles.cryptoTrading}>
                <img src={Images.currency7} alt="Currency7" className={`${styles.signatureImageOne} d-none d-md-block`} />
                <img src={Images.currency9} alt="Currency9" className={`${styles.signatureImageTwo} d-none d-md-block`} />
                <div className={`container custom-container`}>
                    <div className={styles.sectionHeader}>
                        {
                            data?.SECTION?.length > 0 &&

                            <h5 className={styles.sectionTitle}>
                                {/* Institutional-Grade Trading on a Trusted Global Platform */}
                                {/* {data?.SECTION?.[2]?.sectionTitle} */}
                                {cmsData(data, "institution-crypto-simplicity", "sectionTitle")}
                            </h5>
                        }
                        {
                            data?.SECTION?.[2]?.sectionDescription &&
                            <p className={styles.sectionDescription + " mt-4"}>
                                {/* Trevolt makes trading simple. Start your journey into the derivatives market with tools designed for ease, safety, and growth. */}
                                {/* {data?.SECTION?.[2]?.sectionDescription} */}
                                {cmsData(data, "institution-crypto-simplicity", "sectionDescription")}
                            </p>
                        }

                        <div className={styles.joinNowButtons + " " + styles.joinNowButtonsNew}>
                            <Button
                                isLoading={false}
                                loadingText="Redirecting..."
                                btnText="Join now"
                                className="darkFillBtn"
                            />
                        </div>
                    </div>
                    <div className="mt-4 pt-2 pt-lg-0 mt-lg-5">
                        <div className={styles.cryptoTradingImgSection}>
                            <img src={theme == 'dark' ? Images.cryptoTrading : Images.cryptoTradingLight} className={styles.imgSrc + " img-fluid"} alt="Trevolt" />
                            <div className={styles.cryptoTradingCard + " " + styles.cryptoTradingCardOne}>
                                {
                                    // data?.SECTION?.[2]?.CARD?.[0]?.title

                                    data?.SECTION?.length > 0 &&
                                    <h4 className={styles.cryptoTradingTitle}>

                                        {/* 300M+ */}
                                        {cmsCardData(data, "institution-crypto-simplicity", 0, "title")}
                                    </h4>
                                }
                                {
                                    data?.SECTION?.[2]?.CARD?.[0]?.description &&
                                    <p className={styles.cryptoTradingDesc}>
                                        {/* Users worldwide */}
                                        {/* {data?.SECTION?.[2]?.CARD?.[0]?.description} */}
                                        {cmsCardData(data, "institution-crypto-simplicity", 0, "description")}
                                    </p>
                                }

                            </div>
                            <div className={styles.cryptoTradingCard + " " + styles.cryptoTradingCardTwo}>
                                {
                                    data?.SECTION?.[2]?.CARD?.[1]?.title &&
                                    <h4 className={styles.cryptoTradingTitle}>
                                        {/* $37T+ */}
                                        {/* {data?.SECTION?.[2]?.CARD?.[1]?.title} */}
                                        {cmsCardData(data, "institution-crypto-simplicity", 1, "title")}
                                    </h4>
                                }
                                {
                                    data?.SECTION?.[2]?.CARD?.[1]?.description &&
                                    <p className={styles.cryptoTradingDesc}>
                                        {/* Total traded */}
                                        {/* {data?.SECTION?.[2]?.CARD?.[1]?.description} */}
                                        {cmsCardData(data, "institution-crypto-simplicity", 1, "description")}
                                    </p>
                                }
                            </div>
                            <div className={styles.cryptoTradingCard + " " + styles.cryptoTradingCardThree}>
                                {
                                    data?.SECTION?.[2]?.CARD?.[2]?.title &&
                                    <h4 className={styles.cryptoTradingTitle}>
                                        {/* $25B+ */}
                                        {/* {data?.SECTION?.[2]?.CARD?.[2]?.title} */}
                                        {cmsCardData(data, "institution-crypto-simplicity", 2, "title")}
                                    </h4>
                                }
                                {
                                    data?.SECTION?.[2]?.CARD?.[2]?.description &&
                                    <p className={styles.cryptoTradingDesc}>
                                        {/* Assets on platform */}
                                        {/* {data?.SECTION?.[2]?.CARD?.[2]?.description} */}
                                        {cmsCardData(data, "institution-crypto-simplicity", 2, "description")}
                                    </p>
                                }

                            </div>
                            <div className={styles.cryptoTradingCard + " " + styles.cryptoTradingCardFour}>
                                {
                                    data?.SECTION?.[2]?.CARD?.[3]?.title &&
                                    <h4 className={styles.cryptoTradingTitle}>
                                        {/* 900+ */}
                                        {/* {data?.SECTION?.[2]?.CARD?.[3]?.title} */}
                                        {cmsCardData(data, "institution-crypto-simplicity", 3, "title")}
                                    </h4>
                                }
                                {
                                    data?.SECTION?.[2]?.CARD?.[3]?.description &&
                                    <p className={styles.cryptoTradingDesc}>
                                        {/* Trading instruments */}
                                        {/* {data?.SECTION?.[2]?.CARD?.[3]?.description} */}
                                        {cmsCardData(data, "institution-crypto-simplicity", 3, "description")}
                                    </p>
                                }

                            </div>
                        </div>
                    </div>

                </div>
            </section>
        </div>
        </ComingSoon>

    )
}

export default InstitutionalLanding