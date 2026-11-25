
/** PACKAGE IMPORT */

import React, { useEffect, useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { MdKeyboardArrowRight } from "react-icons/md";

/** LOCAL FILES IMPORT */

import styles from "../styles/emeraldTemplate2.module.css"
import Images from "../../../utils/Images";
import Button from "../../../components/Button/Button";


/** CODE START */

const EmeraldTemplate2 = () => {

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
                        <div className={styles.profileBackBtn}>
                            <div className={styles.menuUi} >
                                <div className={`${styles.headerSingleMenusLinks}`}>
                                    <NavLink to='/'
                                        className={({ isActive }) => isActive ? `${styles.staticLinks} ${styles.active}` : `${styles.staticLinks}`}
                                    >
                                        Home Page
                                    </NavLink>
                                </div>
                                <MdKeyboardArrowRight />
                                <div className={`${styles.headerSingleMenusLinks}`}>
                                    <NavLink to='/launchpad'
                                        className={({ isActive }) => isActive ? `${styles.staticLinks} ${styles.active}` : `${styles.staticLinks}`}
                                    >
                                        Listings
                                    </NavLink>
                                </div>
                                <MdKeyboardArrowRight />
                                <div className={`${styles.headerSingleMenusLinks}`}>
                                    <NavLink to='/launchPadDetail/rubby/Test'
                                        className={({ isActive }) => isActive ? `${styles.staticLinks} ${styles.active}` : `${styles.staticLinks}`}
                                    >
                                        Test
                                    </NavLink>
                                </div>
                            </div>
                            <Button
                                // isLoading={false}
                                loadingText="Redirecting..."
                                btnText="Back"
                                onClick={() => navigate(-1)}
                                className="backBtn"
                                selectedValue={null}
                            />
                        </div>
                        <h5 className={`${styles.pageTitle} mt-5 mb-3`}>Test</h5>
                        <div className="row ">
                            <div className="col-12 col-sm-4 col-xl-3 d-flex align-items-center">
                                <div className={styles.templateImgWraper}>
                                    <img src={Images.img} alt="Test_image" />
                                </div>
                            </div>
                            <div className="col-12 col-sm-8 col-xl-9 d-flex align-items-center  mt-4 mt-sm-0 ps-xxl-4">
                                <div>
                                    <p className={styles.labelValue}>
                                        Test
                                    </p>
                                    <p className={`${styles.label} mt-3`}>
                                        Listing application reviewed by the Trevolt listings team. Trading opens against USDT on the central limit order book once KYB, security and custody checks are complete.
                                    </p>
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
                                    <div className="mt-4">
                                        <Button
                                            // isLoading={false}
                                            loadingText="Redirecting..."
                                            btnText="Claimed"
                                            // onClick={() => setOpenEditPairsModal(true)}
                                            className="cardSuccessBtnSm"
                                            selectedValue={null}
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className={`${styles.rubbyCard} my-5`}>
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
                                Timeline
                            </h5>
                            <div className="d-flex align-items-center gap-4 mt-4">
                                <div>
                                    <img src={Images.tick} alt="Tick" className={`${styles.tickImg} img-fluid`} />
                                </div>
                                <div>
                                    <p className={styles.labelValue}>Sale Period</p>
                                    <p className={styles.label}>Mon, 09 Dec 2024 06:30:00 GMT - Mon, 09 Dec 2024 07:00:00 GMT</p>
                                </div>
                            </div>
                            <div className="d-flex align-items-center gap-4 mt-4">
                                <div>
                                    <img src={Images.tick} alt="Tick" className={`${styles.tickImg} img-fluid`} />
                                </div>
                                <div>
                                    <p className={styles.labelValue}>Status</p>
                                    <p className={styles.label}>Sale has been finalized.</p>
                                </div>
                            </div>
                            <div className="d-flex align-items-center gap-4 mt-4">
                                <div>
                                    <img src={Images.tick} alt="Tick" className={`${styles.tickImg} img-fluid`} />
                                </div>
                                <div>
                                    <p className={styles.labelValue}>Sale Finalize</p>
                                    <p className={styles.label}>Finalize</p>
                                </div>
                            </div>
                            <div className="d-flex align-items-center gap-4 mt-4">
                                <div>
                                    <img src={Images.tick} alt="Tick" className={`${styles.tickImg} img-fluid`} />
                                </div>
                                <div>
                                    <p className={styles.labelValue}>Sale Completion Status</p>
                                    <p className={styles.label}>failure</p>
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
                        <div className="my-5">
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

export default EmeraldTemplate2