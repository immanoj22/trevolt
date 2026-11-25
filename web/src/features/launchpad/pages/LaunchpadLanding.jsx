

/** PACKAGE IMPORT */

import React, { useEffect, useState } from "react";
import { FaArrowRight, FaList } from "react-icons/fa";
import Swal from "sweetalert2";
import { useNavigate } from "react-router-dom";

/** LOCAL FILES IMPORT */

import styles from "../styles/launchpadLanding.module.css"
import Images from "../../../utils/Images";
import Button from "../../../components/Button/Button";
import { useGlobalContext } from "../../../context/GlobalProvider";
import KYHModal from "../modal/KYHModal";
import InstructionToParticipate from "../modal/InstructionToParticipate";
import { MetaTags } from "../../../meta/metaTags";

/** CODE START */

const rewardData = [
    {
        title: 'How Trevolt Reviews and Lists New Assets on the Exchange',
        description: 'Every listing application goes through KYB checks, a security review and a market-quality assessment by the Trevolt listings team. Approved assets trade against USDT on our central limit order book with market-maker support.',
    },
    {
        title: 'How Listed Projects Reach Verified Traders Worldwide',
        description: 'Once listed, an asset is available to KYC-verified Trevolt customers on web and mobile, with deposits and withdrawals handled through custodial wallets, backed by 24/7 support.',
    },
    {
        title: 'Our Listing Standards: Security, Transparency and Compliance',
        description: 'Projects must complete due diligence, disclose team and contract information, and meet our custody and security requirements before an asset is enabled for deposits and trading.',
    },
    {
        title: 'Delisting and Monitoring Policy',
        description: 'Listed assets are monitored continuously for liquidity, volatility and security incidents. Assets that no longer meet our standards may be placed under monitoring or delisted with advance notice.',
    },
]

const assetData = [
    {
        img: Images.ai1,
        title: 'Bitcoin',
        description: 'USDT',
    },
    {
        img: Images.ai1,
        title: 'Ethereum',
        description: 'USDT',
    },
    {
        img: Images.ai1,
        title: 'Solana',
        description: 'USDT',
    },
    {
        img: Images.ai1,
        title: 'Dogecoin',
        description: 'USDT',
    },
    {
        img: Images.ai1,
        title: 'Solana',
        description: 'USDT',
    },
    {
        img: Images.ai1,
        title: 'Bitcoin',
        description: 'USDT',
    },
    {
        img: Images.ai1,
        title: 'Ethereum',
        description: 'USDT',
    },
    {
        img: Images.ai1,
        title: 'Dogecoin',
        description: 'USDT',
    },
]

const completedData = [
    {
        img: Images.launchpadRA,
        title: 'AA',
        description: 'Listing application reviewed by the Trevolt listings team. Trading opens against USDT on the central limit order book once KYB, security and custody checks are complete.',
        price: 'Listed against USDT',
        start: 'Sat Apr 12 2025 01:59:48 GMT+0530 (India Standard Time)',
        end: 'Wed Apr 23 2025 15:46:28 GMT+0530 (India Standard Time)',
        url: '/launchpadDetails/rubby',
    },
    {
        img: Images.launchpadRA,
        title: 'AB',
        description: 'Listing application reviewed by the Trevolt listings team. Trading opens against USDT on the central limit order book once KYB, security and custody checks are complete.',
        price: 'Listed against USDT',
        start: 'Sat Apr 12 2025 01:59:48 GMT+0530 (India Standard Time)',
        end: 'Wed Apr 23 2025 15:46:28 GMT+0530 (India Standard Time)',
        url: '/launchpadDetails/sapphire',
    },
    {
        img: Images.launchpadRA,
        title: 'AC',
        description: 'Listing application reviewed by the Trevolt listings team. Trading opens against USDT on the central limit order book once KYB, security and custody checks are complete.',
        price: 'Listed against USDT',
        start: 'Sat Apr 12 2025 01:59:48 GMT+0530 (India Standard Time)',
        end: 'Wed Apr 23 2025 15:46:28 GMT+0530 (India Standard Time)',
        url: '/launchPadDetail/rubby/Test',
    }
]

const LaunchpadLanding = () => {

    const { theme, isAuth } = useGlobalContext()
    const navigate = useNavigate();
    const [selectAssetTabs, setSelectAssetTabs] = useState('active');
    const [showKYH, setShowKYH] = useState(false);
    const [kyhData, setKyhData] = useState(null);
    const [showParticipate, setShowParticipate] = useState(false);
    const [participateData, setParticipateData] = useState(null);
    const [isExpanded, setIsExpanded] = useState(false);

    useEffect(() => {
        window.scrollTo({
            top: 0,
            behavior: "smooth",
        });
    }, []);

    const toggleExpanded = () => {
        setIsExpanded(!isExpanded);
    }

    const textLimit = 50;

    const participantsModal = () => {

        // if (item == true) {
        Swal.fire({
            title: "Are you a project representative ?",
            icon: "info",
            showCancelButton: true,
            cancelButtonText: "No",
            confirmButtonText: "Yes",
            confirmButtonColor: '#2563EB',
            cancelButtonColor: theme == 'dark' ? '#282B2D' : '#F5F7FA',
            didOpen: () => {
                const confirmBtn = Swal.getConfirmButton();
                const cancelBtn = Swal.getCancelButton();

                if (confirmBtn) confirmBtn.setAttribute("data-click-effect", "none");
                if (cancelBtn) cancelBtn.setAttribute("data-click-effect", "none");
            }

        }).then((result) => {

            if (result.isConfirmed) {
                setShowKYH(true)
            } else {
                setShowParticipate(true)
            }
        });
        // } else {
        //   setUnstakeShow(true)
        // }

    }

    const KHYdetailsHandle = (data) => {
        if (data) {
            setKyhData(data);
            setShowKYH(true);
        } else {
            setKyhData(null);
            setShowKYH(false);
        }
    }

    const participateDetailsHandle = (data) => {
        if (data) {
            setParticipateData(data);
            setShowParticipate(true);
        } else {
            setParticipateData(data);
            setShowParticipate(false);
        }
    }

    return (
        <>
            <MetaTags />
            <KYHModal
                show={showKYH}
                kyhData={kyhData}
                handleClose={() => KHYdetailsHandle()}
            />
            <InstructionToParticipate
                show={showParticipate}
                participateData={participateData}
                handleClose={() => participateDetailsHandle()}

            />
            <main className={styles.landing}>
                {/* Banner section  */}
                <section className={styles.launchpadLanding}>
                    <div className="custom-container container">
                        <div className={`${styles.bannerRow} row align-items-center`}>
                            <div className="col-lg-5">
                                <div className={styles.bannerLeft}>
                                    <h1 className={`${styles.bannerTitleXl} text-center text-lg-start`}>
                                        List Your Asset on Trevolt Exchange!
                                    </h1>
                                    <p className={`${styles.bannerDescription} text-center text-lg-start`}>
                                        Submit your listing application, complete KYB verification and reach KYC-verified traders on a secure, custodial exchange with deep order-book liquidity and dedicated support.
                                    </p>
                                    <div className={`${styles.bannerButtons} justify-content-center justify-content-lg-start`}>
                                        <Button
                                            isLoading={false}
                                            loadingText="Redirecting..."
                                            btnText="Apply for Listing"
                                            onClick={() => navigate('/request-token-types')}
                                            className="primaryBtn"
                                        // selectedValue={currentResult}
                                        />
                                    </div>
                                </div>
                            </div>
                            <div className="col-lg-7 mt-5 mt-lg-0">
                                <div className={styles.bannerRight}>
                                    <img src={Images.launchpadBanner} alt="Listings Banner" />
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Reward section  */}
                <section className={styles.rewardLandingBG}>
                    <div className="container custom-container">
                        <div className={styles.rewardCard}>
                            <div className={styles.rewardHead}>
                                <h5>Trevolt VIP Program - Lower Trading Fees for Verified Traders</h5>
                                <p className="mt-3">
                                    <span className={styles.rewardLabelTitle}>VIP 5 Trader - </span>
                                    <span className={styles.rewardLabelDesc}>KYC-verified accounts with 30-day trading volume above $1,000,000 USD or asset balance above $100,000 USD qualify for the highest VIP fee tier.</span>
                                </p>
                                <p className="mt-3">
                                    <span className={styles.rewardLabelTitle}>VIP 1 Trader - </span>
                                    <span className={styles.rewardLabelDesc}>KYC-verified accounts with 30-day trading volume above $50,000 USD qualify for reduced maker and taker fees.</span>
                                </p>
                                <div className={styles.participateBtn}>
                                    <button
                                        aria-label="arrowRight"
                                        onClick={participantsModal}
                                    >
                                        <FaArrowRight />
                                    </button>
                                </div>
                            </div>
                        </div>
                        <h4 className={`${styles.landingHead} mt-5`}>News About Trevolt Token Listings</h4>
                        <p className={`${styles.rewardLabelDesc} mt-3`}>Trevolt Listings is the exchange's process for adding new digital assets to the platform. Projects apply, pass KYB and security due diligence, and, once approved, are listed on the Trevolt central limit order book with cold-storage custody, market surveillance and 24/7 customer support for traders.</p>
                        <div className={`${styles.wholeRewardContainer} mt-4`}>
                            {rewardData.map((item, index) => (
                                <div className={`${styles.rewardContainer}`}>
                                    <div key={index}>
                                        <p className={`${styles.labelValue}`}>{item.title}</p>
                                        <p className={`${styles.label} my-4`}>{isExpanded ? item.description : item.description.substring(0, textLimit) + (item.description.length > textLimit ? '...' : '')}</p>
                                        <Button
                                            // isLoading={false}
                                            loadingText="Redirecting..."
                                            btnText={isExpanded ? 'Read less' : 'Read more'}
                                            onClick={toggleExpanded}
                                            className="cardSuccessBtnSm"
                                            selectedValue={null}
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>
                {/* Launchpad Related Assets  */}
                <section className={`${styles.relatedAssets} py-5`}>
                    <div className="container custom-container">
                        <div>
                            <h4 className={styles.landingHead}>Recently Listed Assets.</h4>
                            <p className={`${styles.rewardLabelDesc} mt-3`}>Assets recently reviewed and listed on Trevolt are shown below. Each listing is custodied by Trevolt and tradable against USDT by verified accounts.</p>
                        </div>
                        <div className={styles.wholeAssetsContainer}>
                            {assetData.map((item, index) => (
                                <div className={`${styles.assetsContainer}`}>
                                    <div className={`${styles.assetsFlex}`}>
                                        <img src={item.img} alt={item.description} className={`${styles.launchAssets}`} />
                                        <div>
                                            <p className={styles.labelValue}>{item.title}</p>
                                            <p className={styles.label}>{item.description}</p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>
                {/* Launchpad related assets two  */}
                <section className={`${styles.relatedAssetsTwoBG} py-5`}>
                    <div className="container custom-container">
                        <div className="text-center">
                            <h4 className={styles.landingHead}>Recently Listed Assets.</h4>
                            <p className={`${styles.rewardLabelDesc} mt-3`}>
                                Use the filters below to easily navigate the platform and identify projects that match your investment timelines and interests. - Active: Assets that are currently live and accepting investments. - Completed: Assets that have concluded their fundraising and are no longer accepting investments. - Upcoming: Assets that are scheduled to launch in the future and will begin accepting investments at a later date.
                            </p>
                        </div>
                        <div className={`${styles.assetsTabs} mt-5`}>
                            <button aria-label="active" className={`${selectAssetTabs == 'active' ? styles.active : ''}`} onClick={() => setSelectAssetTabs('active')}>Active</button>
                            <button aria-label="completed" className={`${selectAssetTabs == 'completed' ? styles.active : ''}`} onClick={() => setSelectAssetTabs('completed')}>Completed</button>
                            <button aria-label="upcoming" className={`${selectAssetTabs == 'upcoming' ? styles.active : ''}`} onClick={() => setSelectAssetTabs('upcoming')}>Upcoming</button>
                        </div>
                        {/* {selectAssetTabs == 'active' &&
                            <div className="mt-5">
                                <NoData content={"No Data Available"} />
                            </div>
                        } */}
                        {/* {selectAssetTabs == 'completed' && */}
                        <div className="row mt-5 align-items-center">
                            <div className="col-12 mb-4">
                                {completedData.map((item, index) => (
                                    <div key={index} className={`${styles.completedCards} mt-3`}>
                                        <div className="row align-items-center">
                                            <div className="col-12 col-sm-4 col-xl-2 col-xxl-3 d-flex justify-content-center align-items-center">
                                                <div className=''>
                                                    <img src={item.img} alt="completed" className={styles.completeCardImgWraper} />
                                                </div>
                                            </div>
                                            <div className="col-12 col-sm-8 col-xl-8 col-xxl-7 tk_card_cnt_col mt-5 mt-sm-0 d-flex align-items-center">
                                                <div>
                                                    <h5 className={styles.labelValue}>{item.title}</h5>
                                                    <p className={`${styles.label} mt-3`}>
                                                        {item.description}
                                                    </p>
                                                    <div className="row mt-4 mx-auto">
                                                        <div className="col-6 mb-2 ps-0">
                                                            <p className={styles.labelValue}>Price</p>
                                                        </div>
                                                        <div className="col-6 mb-2">
                                                            <p className={styles.label}>{item.price}</p>
                                                        </div>
                                                        <div className="col-6 mb-2 ps-0">
                                                            <p className={styles.labelValue}>Start</p>
                                                        </div>
                                                        <div className="col-6 mb-2">
                                                            <p className={styles.label}>{item.start}</p>
                                                        </div>
                                                        <div className="col-6 mb-2 ps-0">
                                                            <p className={styles.labelValue}>End</p>
                                                        </div>
                                                        <div className="col-6 mb-2">
                                                            <p className={styles.label}>{item.end}</p>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="col-12 col-xl-2 col-xxl-2 d-flex align-items-center justify-content-center mt-4 mt-md-5 mt-lg-0">
                                                <Button
                                                    // isLoading={false}
                                                    loadingText="Redirecting..."
                                                    btnText="Details"
                                                    onClick={() => navigate(item.url)}
                                                    className="cardSuccessBtnSm"
                                                    selectedValue={null}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                ))}

                            </div>
                        </div>
                        {/* } */}
                    </div>
                </section>
            </main>
        </>
    );
};

export default LaunchpadLanding;
