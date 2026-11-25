
/** PACKAGE IMPORT */

import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

/** LOCAL FILES IMPORT */

import styles from "../styles/sapphireTemplate3.module.css"
import Images from "../../../utils/Images";
import Button from "../../../components/Button/Button";


/** CODE START */

const SapphireTemplate3 = () => {

    const navigate = useNavigate();

    useEffect(() => {
            window.scrollTo({
                top: 0,
                behavior: "smooth",
            });
        }, []);

    return (
        <>
            <main className={styles.rubbyPage}>
                <section className={styles.rubbyLanding}>
                    <div className="custom-container container">
                        <div className={`${styles.profileBackBtn} my-3`}>
                            <Button
                                // isLoading={false}
                                loadingText="Redirecting..."
                                btnText="Back"
                                onClick={() => navigate(-1)}
                                className="backBtn"
                                selectedValue={null}
                            />
                        </div>
                        <div className={styles.templateImgWraper}>
                            <img src={Images.img} alt="template" className={styles.imageFitContainer} />
                        </div>
                        <div className={`${styles.temp_profile} d-flex flex-column align-items-center`}>
                            <div className={`${styles.tempPf1ImgWrap}`}>
                                <img src={Images.ai1} alt="profile" className={styles.imageFitContainer} />
                            </div>
                            <div className={styles.marginLess}>
                                <h5 className={`${styles.labelValue} text-center`}>AA (aa)</h5>
                                <div className={`${styles.socialLinksHolder} d-flex align-items-center gap-2 my-2`}>
                                    <a href="#" target="_blank" className={styles.social} >
                                        <img src={Images.discord} alt="insta" className="img-fluid" />
                                    </a>
                                    <a href="#" target="_blank" className={styles.social}>
                                        <img src={Images.discord} alt="x" className="img-fluid" />
                                    </a>
                                    <a href="#" target="_blank" className={styles.social}>
                                        <img src={Images.discord} alt="youtube" className="img-fluid" />
                                    </a>
                                </div>
                            </div>
                        </div>
                        <div className="mt-5">
                            <h5 className="text-center">
                                Timeline Chart
                            </h5>
                        </div>
                        <div className={`${styles.rubbyCard} my-5`}>
                            <div className={styles.rubbyPaddingCard}>
                                <div className="d-flex align-items-center gap-4">
                                    <div className={styles.subImgWraper}>
                                        <img src={Images.ai1} alt="profile" className={styles.imageFitContainer} />
                                    </div>
                                    <h5 className={styles.pageTitle}>Listing Details</h5>
                                </div>
                            </div>
                            <div className={styles.borderBottom}></div>
                            <div className={styles.rubbyPaddingCard}>
                                <div className="row">
                                    <div className="col-12 col-sm-6 col-lg-3 d-flex justify-content-center">
                                        <div>
                                            <p className={`${styles.labelValue} text-center`}>Start Time</p>
                                            <p className={`${styles.label} mt-1 text-center`}>12-04-2025 01:59:48</p>
                                        </div>
                                    </div>
                                    <div className="col-12 col-sm-6 col-lg-3 d-flex justify-content-center mt-4 mt-sm-0">
                                        <div>
                                            <p className={`${styles.labelValue} text-center`}>End Time</p>
                                            <p className={`${styles.label} mt-1 text-center`}>23-04-2025 15:46:28</p>
                                        </div>
                                    </div>
                                    <div className="col-12 col-sm-6 col-lg-3 d-flex justify-content-center mt-4 mt-lg-0">
                                        <div>
                                            <p className={`${styles.labelValue} text-center`}>Softcap</p>
                                            <p className={`${styles.label} mt-1 text-center`}>5 BNB</p>
                                        </div>
                                    </div>
                                    <div className="col-12 col-sm-6 col-lg-3 d-flex justify-content-center mt-4 mt-lg-0">
                                        <div>
                                            <p className={`${styles.labelValue} text-center`}>HardCap</p>
                                            <p className={`${styles.label} mt-1 text-center`}>10 BNB</p>
                                        </div>
                                    </div>
                                </div>
                                <div className="row mt-4">
                                    <div className="col-12 col-sm-6 col-lg-3 d-flex justify-content-center">
                                        <div>
                                            <p className={`${styles.labelValue} text-center`}>Vesting Claim</p>
                                            <p className={`${styles.label} mt-1 text-center`}>DISABLE</p>
                                        </div>
                                    </div>
                                    <div className="col-12 col-sm-6 col-lg-3 d-flex justify-content-center mt-4 mt-sm-0">
                                        <div>
                                            <p className={`${styles.labelValue} text-center`}>Listing</p>
                                            <p className={`${styles.label} mt-1 text-center`}>auto</p>
                                        </div>
                                    </div>
                                    <div className="col-12 col-sm-6 col-lg-3 d-flex justify-content-center mt-4 mt-lg-0">
                                        <div>
                                            <p className={`${styles.labelValue} text-center`}>Listing price</p>
                                            <p className={`${styles.label} mt-1 text-center`}>10</p>
                                        </div>
                                    </div>
                                    <div className="col-12 col-sm-6 col-lg-3 d-flex justify-content-center mt-4 mt-lg-0">
                                        <div>
                                            <p className={`${styles.labelValue} text-center`}>Token Address</p>
                                            <p className={`${styles.label} mt-1 text-center`}>0x3182...A2f</p>
                                        </div>
                                    </div>
                                </div>
                                <div className="row mt-4">
                                    <div className="col-12 col-sm-6 col-lg-3 d-flex justify-content-center">
                                        <div>
                                            <p className={`${styles.labelValue} text-center`}>Access Type</p>
                                            <p className={`${styles.label} mt-1 text-center`}>Public</p>
                                        </div>
                                    </div>
                                    <div className="col-12 col-sm-6 col-lg-3 d-flex justify-content-center mt-4 mt-sm-0">
                                        <div>
                                            <p className={`${styles.labelValue} text-center`}>Status</p>
                                            <p className={`${styles.label} mt-1 text-center`}>Upcoming</p>
                                        </div>
                                    </div>
                                    <div className="col-12 col-sm-6 col-lg-3 d-flex justify-content-center mt-4 mt-lg-0">
                                        <div>
                                            <p className={`${styles.labelValue} text-center`}>Minimum Buy</p>
                                            <p className={`${styles.label} mt-1 text-center`}>1 BNB</p>
                                        </div>
                                    </div>
                                    <div className="col-12 col-sm-6 col-lg-3 d-flex justify-content-center mt-4 mt-lg-0">
                                        <div>
                                            <p className={`${styles.labelValue} text-center`}>Maximum Buy</p>
                                            <p className={`${styles.label} mt-1 text-center`}>10 BNB</p>
                                        </div>
                                    </div>
                                </div>
                                <div className="row mt-4">
                                    <div className="col-12 col-sm-6 col-lg-3 d-flex justify-content-center">
                                        <div>
                                            <p className={`${styles.labelValue} text-center`}>Your Purchased</p>
                                            <p className={`${styles.label} mt-1 text-center`}>2 BNB</p>
                                        </div>
                                    </div>
                                    <div className="col-12 col-sm-6 col-lg-3 d-flex justify-content-center mt-4 mt-sm-0">
                                        <div>
                                            <p className={`${styles.labelValue} text-center`}>Your Reward</p>
                                            <p className={`${styles.label} mt-1 text-center`}>20 aa</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="mt-5">
                            <h5 className={styles.pageTitle}>
                                Key Highlight :
                            </h5>
                            <div className={`${styles.rubbyCard} ${styles.rubbyPaddingCard} mt-4`}>
                                <div className="row">
                                    <div className="col-12 col-sm-6 col-lg-3 d-flex justify-content-center">
                                        <div>
                                            <p className={`${styles.labelValue} text-center`}>Max Supply</p>
                                            <p className={`${styles.label} mt-1 text-center`}>10 aa</p>
                                        </div>
                                    </div>
                                    <div className="col-12 col-sm-6 col-lg-3 d-flex justify-content-center mt-4 mt-sm-0">
                                        <div>
                                            <p className={`${styles.labelValue} text-center`}>Price (aa Subscription)</p>
                                            <p className={`${styles.label} mt-1 text-center`}>1 BNB = 10 aa</p>
                                        </div>
                                    </div>
                                    <div className="col-12 col-sm-6 col-lg-3 d-flex justify-content-center mt-4 mt-lg-0">
                                        <div>
                                            <p className={`${styles.labelValue} text-center`}>Listing Allocation (aa Sub.)</p>
                                            <p className={`${styles.label} mt-1 text-center`}>100 aa</p>
                                        </div>
                                    </div>
                                    <div className="col-12 col-sm-6 col-lg-3 d-flex justify-content-center mt-4 mt-lg-0">
                                        <div>
                                            <p className={`${styles.labelValue} text-center`}>Token</p>
                                            <p className={`${styles.label} mt-1 text-center`}>AA</p>
                                        </div>
                                    </div>
                                </div>
                                <div className="row mt-4">
                                    <div className="col-12 col-sm-6 col-lg-3 d-flex justify-content-center">
                                        <div>
                                            <p className={`${styles.labelValue} text-center`}>Token Vesting Period</p>
                                            <p className={`${styles.label} mt-1 text-center`}>No lockup</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="row">
                            <div className="col-12 col-lg-6 pe-xl-4">
                                <div className={`${styles.rubbyCard} ${styles.rubbyPaddingCard} mt-5`}>
                                    <h5 className={styles.labelValue}>TITLE 1</h5>
                                    <p className={`${styles.label} mt-3`}>
                                        Listing application reviewed by the Trevolt listings team. Trading opens against USDT on the central limit order book once KYB, security and custody checks are complete.
                                    </p>
                                    <div className="d-flex justify-content-center mt-4">
                                        <img src={Images.img} alt="Title-1" className="img-fluid" />
                                    </div>
                                </div>
                            </div>
                            <div className="col-12 col-lg-6 mt-5 mt-lg-0 ps-xl-4">
                               <div className={`${styles.rubbyCard} ${styles.rubbyPaddingCard} mt-5`}>
                                    <h5 className={styles.labelValue}>TITLE 2</h5>
                                    <p className={`${styles.label} mt-3`}>
                                        Listing application reviewed by the Trevolt listings team. Trading opens against USDT on the central limit order book once KYB, security and custody checks are complete.
                                    </p>
                                    <div className="d-flex justify-content-center mt-4">
                                        <img src={Images.img} alt="Title-2" className="img-fluid" />
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="mt-5">
                            <h5 className={styles.pageTitle}>Project Description : </h5>
                            <div className={`${styles.rubbyCard} ${styles.rubbyPaddingCard} mt-4`}>
                                <p className={styles.label}>
                                    Listing application reviewed by the Trevolt listings team. Trading opens against USDT on the central limit order book once KYB, security and custody checks are complete.
                                </p>
                            </div>
                        </div>
                        <div className="mt-5">
                            <h5 className={styles.pageTitle}>Terms and Conditions :</h5>
                            <div className={`${styles.rubbyCard} ${styles.rubbyPaddingCard} mt-4`}>
                                <p className={styles.label}>
                                    Listing application reviewed by the Trevolt listings team. Trading opens against USDT on the central limit order book once KYB, security and custody checks are complete.
                                </p>
                            </div>
                        </div>
                    </div>
                </section>
            </main>
        </>
    )
}

export default SapphireTemplate3