/** package import */

import React, { useState } from 'react';
import ReactDatatable from "react-data-table-component";
import Accordion from 'react-bootstrap/Accordion';
import { FaAngleDown, FaAngleUp } from "react-icons/fa6";
import { HiSpeakerphone } from "react-icons/hi";
import Marquee from "react-fast-marquee";
import { Link, useNavigate } from 'react-router-dom';
import isEmpty from 'is-empty';

/** local import */

import Button from '../../components/Button/Button';
import styles from './landing.module.css';
import Images from '../../utils/Images';
import TableNoData from '../../components/TableNoData/TableNoData';
import LatestNews from '../../components/Cards/LatestNews/LatestNews';
import bannerVideo from '../../assets/videos/candlestick.mp4'
import { useEffect } from 'react';
import { GetLocalStorageItem } from '../../lib/storage';
import { AccessToken, IsAuth } from '../../redux/action';
import { useDispatch, useSelector } from 'react-redux';
import { useGlobalContext } from '../../context/GlobalProvider';
import { MetaTags } from '../../meta/metaTags';
import { ExperienceCard } from '../../components/Cards/Experience/ExperienceCard';
import { getCms } from '../../actions/cmsAction';
import config from '../../config/env';
import { cmsCardData, cmsData } from '../../lib/cmsCommon';
import CalculatorModal from '../../features/futuresTrading/modal/CalculatorModal';


/** code start */

// SECURITY FIX (VAPT: "Token Storage Security" — Points 44/49/70): removed
// unused `getToken = GetLocalStorageItem({ key: "accessToken" })` — the raw
// JWT is no longer persisted to localStorage, and this value was only ever
// referenced inside an already-commented-out effect below.


const experienceData = [
    {
        img: Images.ec1,
        title: "Powerful Features for Traders",
        description: "Trade with leverage across equities, F&O, and more. Access 100+ indicators with TradingView & ChartIQ integration."
    },
    {
        img: Images.ec2,
        title: "User-Friendly Experience",
        description: "Trade with leverage across equities, F&O, and more. Access 100+ indicators with TradingView & ChartIQ integration."
    },
    {
        img: Images.ec3,
        title: "Powerful Features for Traders",
        description: "Trade with leverage across equities, F&O, and more. Access 100+ indicators with TradingView & ChartIQ integration."
    },
    {
        img: Images.ec4,
        title: "Powerful Features for Traders",
        description: "Trade with leverage across equities, F&O, and more. Access 100+ indicators with TradingView & ChartIQ integration."
    },
]

const tradingData = [
    {
        title: 'Futures Trading',
        description:
            'Futures trading is the act of buying and selling futures. These are financial contracts in which two parties – one buyer and one seller agree to exchange an underlying market for a fixed price at a future date...',
        // image: ec1,
    },
    {
        title: 'Options Trading',
        description:
            'Options trading may seem overwhelming at first, but it’s easy to understand if you know a few key points. Investor portfolios are usually constructed with several asset classes...',
        // image: ec2,
    },
    {
        title: 'Algo Trading',
        description:
            'In algo trading, mathematical models and predefined rules are used to analyze market data, identify trading opportunities, and automatically generate buy or sell orders...',
        // image: ec3,
    },
    {
        title: 'Exchange Calculator',
        description:
            'Calculates how much of one asset you’ll receive after a trade or swap real-time conversion rate. Sometimes includes fees, slippage, or gas costs.',
        // image: ec4,
    },
];

const latestNewsData = [

    {
        image: Images.ln1,
        title: "Saylor hints Strategy is buying BTC",
    },
    {
        image: Images.ln2,
        title: "Ethereum's Pectra upgrade set",
    },
    {
        image: Images.ln3,
        title: "SEC drops suit against Helium",
    },
    {
        image: Images.ln4,
        title: "XRP ETF to be launched in US today",
    },
]

const youtubeVideoList = [
    {
        id: 1,
        title: "Trading for Beginners – Start Making Profits Today!",
        videoLink: "https://youtu.be/C-Lso4v0Rew?si=XchWzxHFHKxMjRz2"
    },
    {
        id: 2,
        title: "Digital Assets Trading 101",
        videoLink: "https://youtu.be/C-Lso4v0Rew?si=XchWzxHFHKxMjRz2"
    },
    {
        id: 3,
        title: "Smart Trading Strategies",
        videoLink: "https://youtu.be/C-Lso4v0Rew?si=XchWzxHFHKxMjRz2"
    },
    {
        id: 4,
        title: "Mastering the Trade Markets",
        videoLink: "https://youtu.be/C-Lso4v0Rew?si=XchWzxHFHKxMjRz2"
    },
]


const Landing = () => {

    const currentResult = { id: "1", name: "hari" };

    const [showCalculatorModal, setShowCalculatorModal] = useState(false);
    const [currentVideoTitle, setCurrentVideoTitle] = useState("");
    const [activeVideo, setActiveVideo] = useState(null);
    const [currentVideoUrl, setCurrentVideoUrl] = useState("");
    const [defaultActiveKey, setDefaultActiveKey] = useState(0);

    const [data, setData] = useState([]);
    const { theme } = useGlobalContext();
    const navigate = useNavigate()
    const { futurePairData } = useSelector((state) => state.future);


    const [tableData, setTableData] = useState([
        { id: 1 },
        { id: 1 },
        { id: 1 },
        { id: 1 },
        { id: 1 },
        { id: 1 },
        { id: 1 },
        { id: 1 },
        { id: 1 },
        { id: 1 },

    ]);

    let dispatch = useDispatch();

    //     useEffect(() => {
    //     if (getToken) {
    //         dispatch(AccessToken({ accessToken: getToken }));
    //         dispatch(IsAuth({ isAuth: true }));
    //     }
    // }, [getToken]);

    const columns = [
        {
            name: 'Market Pair',
            align: "left",
            width: "200px",
            selector: (record) => {
                return (
                    <>
                        <p>{record.baseCurrency} / {record.quoteCurrency}</p>
                        {/* <div className='table-dualImage__container'>
                            <img src={Images.currency2} alt="currency-one" className='table-dualImages table-dualImage__one' />
                            <img src={Images.currency3} alt="currency-one" className='table-dualImages table-dualImage__two' />
                        </div> */}
                    </>
                );
            }
        },
        {
            name: 'Last Price',
            align: "left",
            width: "220px",
            selector: (record) => {
                return (
                    <p>{record.last}</p>
                );
            }
        },
        {
            name: 'Change (24h)',
            align: "left",
            width: "220px",
            selector: (record) => {
                return (

                    // dynamic class - buy & sell
                    <p className={record.change > 0 ? 'buy' : "sell"}>{record.change} ({record?.percent24Change}%)</p>
                );
            }
        },
        {
            name: 'Volume',
            align: "left",
            width: "200px",
            selector: (record) => {
                return (
                    <p>{record.volume}</p>
                );
            }
        },
        {
            name: 'Graph',
            align: "left",
            width: "200px",
            selector: (record) => {
                return (

                    // dynamic src - {Images.upArrow} & {Images.downArrow}
                    <img src={record.change > 0 ? Images.upArrow : Images.downArrow} className='table-arrow__image' />
                );
            }
        },
        {
            name: "Action",
            align: "left",
            width: "200px",
            selector: (record) => {
                return (
                    <Button
                        isLoading={false}
                        loadingText="Redirecting..."
                        btnText="Trade"
                        onClick={() => {
                            navigate("/futures/" + record.tickerRoot, { replace: true });
                        }}
                        className="textBtn"
                        selectedValue={currentResult}
                    />
                );
            }
        },

    ];



    const handleStartTrading = (filter) => {
        navigate(filter)
    };

    const handleTrading = () => {
        // navigate("/learn")
        navigate("/futures")
    }

    const handleVideoChange = (index) => {
        setActiveVideo(index);
        const url = data?.SECTION?.[4]?.CARD?.[index]?.URL || "";
        const title = data?.SECTION?.[4]?.CARD?.[index]?.title || "";
        setCurrentVideoUrl(url);
        setCurrentVideoTitle(title);
    };


    useEffect(() => {
        fetchCms();
    }, [])


    const fetchCms = async (data) => {

        let reqData = {
            pageName: 'Home'
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

    useEffect(() => {
        const cards = data?.SECTION?.[4]?.CARD;
        if (cards?.length > 0) {
            const lastCard = cards[cards.length - 1];
            setCurrentVideoUrl(lastCard?.URL || "");
            setCurrentVideoTitle(lastCard?.title || "");
            setActiveVideo(cards.length - 1);
        }
    }, [data]);


    const handleNavigateFaq = (data) => {
        navigate('/faq', {
            state: {
                faq: data
            }
        })
    }
    // console.log('dataaaa', data);

    // console.log('futurePairData', futurePairData)
    // data.section.find((el) => (el.identifier == "home")).value



    return (
        <main className={styles.landing}>
            <MetaTags />
            <CalculatorModal show={showCalculatorModal} handleClose={() => setShowCalculatorModal(false)} />
            <section className={styles.videoBannerSection}>
                <div className={styles.videoSectionContainer}>
                    <video autoPlay muted loop className={styles.videoSectionFile}>
                        <source src={bannerVideo} type="video/mp4" />
                    </video>
                </div>
                <div className={styles.videoSectionContent}>
                    <div className="custom-container container">
                        <div className={`${styles.bannerRow} row align-items-center`}>
                            <div className='col-lg-5 '>
                                <div className={styles.bannerLeft}>
                                    {
                                        data?.SECTION?.length > 0 &&
                                        <h1 className={`${styles.bannerTitleXl} text-center text-lg-start`}>
                                            {/* India's premier <br /> trade platform */}
                                            {cmsData(data, "home-crypto-derivatives", "sectionTitle")}
                                        </h1>
                                    }
                                    {
                                        data?.SECTION?.length > 0 &&

                                        <p className={`${styles.bannerDescription} text-center text-lg-start`}>

                                            {/* Join over 2 crore users at <span className={styles.green}>Trevolt</span> as we democratize access to Bitcoin and trade, empowering every <span className={styles.orange}>Indian</span> to thrive in the digital economy. <span className={styles.boldFw}>India’s First & Fastest-Growing Trade App</span> */}
                                            {cmsData(data, "home-derivatives", "sectionDescription")}
                                        </p>
                                    }

                                    <div className={`${styles.bannerButtons} justify-content-center justify-content-lg-start`}>
                                        <Button
                                            isLoading={false}
                                            loadingText="Redirecting..."
                                            btnText="Start Trading"
                                            onClick={() => handleStartTrading('/futures')}
                                            className="primaryBtn"
                                            selectedValue={currentResult}
                                        />
                                        {/* <Button
                                            isLoading={false}
                                            loadingText="Redirecting..."
                                            btnText="Create"
                                            onClick={handleTrading}
                                            className="darkFillBtn"
                                            selectedValue={currentResult}
                                        /> */}
                                    </div>
                                </div>
                            </div>

                            <div className='col-lg-7 mt-5 mt-lg-0'>
                                <div className={styles.bannerRight}>
                                    <img src={Images.bannerCoin1} alt='bannerCoin1' className={styles.bannerCoinOne} />
                                    <img src={Images.bannerCoin2} alt='bannerCoin2' className={styles.bannerCoinTwo} />
                                    <img src={theme == 'dark' ? Images.banner : Images.bannerLight} className={styles.bannerRightImage} alt="Trevolt" />
                                </div>

                            </div>
                        </div>

                    </div>
                </div>
            </section>
            <section className={`custom-marque position-relative`}>
                <Marquee
                    pauseOnHover={true}>
                    <div className="d-flex align-items-center custom-marquee__links gap-2">
                        {/* <Link >Announcement - 1</Link>
                        <Link>Announcement - 2</Link>
                        <Link>Announcement - 3</Link>
                        <Link>Announcement - 4</Link>
                        <Link>Announcement - 5</Link>
                        <Link>Announcement - 6</Link>
                        // <Link>Announcement - 7</Link> */}

                        {/* <Link className="me-marquee__a1" to={!isEmpty(getUser) ? '/dashboard' : ''} > {news[0]?.description}</Link> */}
                        {/* {
                            news.map((announcements) => {
                                return (
                                    < Link className="me-marquee__a1" to={!isEmpty(getUser) ? '/dashboard' : ''} > {announcements?.description.split(" ").slice(0, 2).join(" ")}...</Link>
                                )
                            })
                        } */}
                        {!isEmpty(futurePairData) && futurePairData.length > 0 &&
                            futurePairData?.map((val) => (
                                <div className='custom-marque__secondary-pairs'>
                                    <span>{val.tickerRoot}</span> <span className={val.change > 0 ? 'high' : 'low'}>{val.change > 0 ? "+" : ""}{val.change}%</span>
                                </div>
                            ))
                        }
                    </div>
                </Marquee>
            </section >

            <section className={styles.experience}>
                <img src={Images.currency4} alt='Currency4' className={`${styles.experienceImageOne} d-none d-md-block`} />
                <img src={Images.currency5} alt='Currency5' className={`${styles.experienceImageTwo} d-none d-md-block`} />
                <div className={`container custom-container`}>
                    <div className={styles.sectionHeader}>
                        {
                            data?.SECTION?.length > 0 &&

                            <h1 className={styles.sectionTitle}>

                                {/* Experience Seamless Trading with Trevolt */}
                                {cmsData(data, "home-seamless-trading", "sectionTitle")}
                            </h1>
                        }

                        {
                            data?.SECTION?.length > 0 &&
                            <p className={styles.sectionDescription}>
                                {/* Trevolt makes trading simple. Start your journey into the derivatives market with tools designed for ease, safety, and growth. */}
                                {/* {data?.SECTION?.[1]?.sectionDescription} */}
                                {cmsData(data, "home-seamless-trading", "sectionDescription")}
                            </p>
                        }
                    </div>
                    {data?.SECTION?.length > 0 && <div className={styles.experienceGrids}>
                        {/* {experienceData.map((item, index) => (
                            <ExperienceCard item={item} key={index} />
                        ))} */}
                        {/* {data?.SECTION?.[1]?.CARD?.map((item, index) => (
                            <ExperienceCard item={item} index={index} />
                        ))} */}
                        {cmsData(data, "home-seamless-trading", "CARD").map((item, index) => (
                            <ExperienceCard item={item} index={index} />
                        ))}
                    </div>}

                    <div className={styles.experienceButtons}>
                        <Button
                            isLoading={false}
                            loadingText="Redirecting..."
                            btnText="Get Started"
                            onClick={handleTrading}
                            className="outlineBtn"
                            selectedValue={currentResult}
                        />
                    </div>
                </div>
            </section>

            <section className={styles.appDetails}>
                <div className={`container custom-container`}>
                    <div className='row align-items-center'>
                        <div className='col-md-6'>
                            <div className={styles.appDetailsLeft}>
                                {
                                    data?.SECTION?.length > 0 &&
                                    <h5 className={`${styles.appDetailsTitle} text-center text-md-start`}>
                                        {/* Our <span className={styles.green}>Trevolt</span> Trading App */}
                                        {cmsData(data, "home-greenex-trading-app", "sectionTitle")}
                                    </h5>
                                }
                                {
                                    data?.SECTION?.length > 0 &&
                                    <p className={`${styles.appDetailsSubTitle} text-center text-md-start`}>
                                        {/* Trade from any place */}
                                        {/* {data?.SECTION?.[2]?.sectionSubTitle} */}
                                        {cmsData(data, "home-greenex-trading-app", "sectionSubTitle")}
                                    </p>
                                }
                                {
                                    data?.SECTION?.length > 0 &&
                                    <p className={`${styles.appDetailsDescription} text-center text-md-start`}>A fast, focused mobile trading experience with margin trading, advanced charts, an options chain and dependable order execution. Place orders, track positions and manage risk from anywhere.<b>Trevolt </b> is the go-to app. */}
                                        {/* {data?.SECTION?.[2]?.sectionDescription} */}
                                        {cmsData(data, "home-greenex-trading-app", "sectionDescription")}
                                    </p>
                                }
                                <div className={styles.appDetailsButtons}>
                                    <a href='#' target='_blank' aria-label='AppStore' className={styles.appStore}></a>
                                    <a href='#' target='_blank' aria-label='GooglePlay' className={styles.googlePlay}></a>
                                </div>
                            </div>
                        </div>

                        <div className='col-md-6 mt-5 mt-md-0'>
                            <div className={styles.appDetailsRight}>
                                <img src={Images.appDetails} alt='app-details' className='img-fluid' />
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            <section className={styles.experience}>
                <img src={Images.currency10} alt='currency10' className={`${styles.delightTradersImageOne} d-none d-md-block`} />
                <img src={Images.currency8} alt='currency8' className={`${styles.delightTradersImageTwo} d-none d-md-block`} />
                <div className={`container custom-container`}>
                    <div className={styles.sectionHeader}>
                        {
                            data?.SECTION?.length > 0 &&

                            <h5 className={styles.sectionTitle}>
                                {/* Designed To Delight Traders */}
                                {/* {data?.SECTION?.[3]?.sectionTitle} */}
                                {cmsData(data, "home-trader-first-experience", "sectionTitle")}
                            </h5>
                        }
                        {
                            data?.SECTION?.length > 0 &&
                            <p className={styles.sectionDescription}>
                                {/* Trevolt makes trading simple. Start your journey into the derivatives market with tools designed for ease, safety, and growth. */}
                                {/* {data?.SECTION?.[3]?.sectionDescription} */}
                                {cmsData(data, "home-trader-first-experience", "sectionDescription")}
                            </p>
                        }
                    </div>

                    <div className={styles.delightTraderCardXl}>
                        <img src={Images.currency} alt='currency' className={styles.animatedCurrency} />
                        <div className={styles.delightCardXlInner}>
                            {
                                data?.SECTION?.length > 0 &&
                                // data?.SECTION?.[3]?.CARD?.[0]?.title &&
                                <h5 className={styles.delightCardXlTitle}>
                                    {/* Start smaller */}
                                    {/* {cmsCardData(data,"affiliate-seamless-trading", 0, "title")} */}
                                    {data?.SECTION?.[3]?.CARD?.[0]?.title}
                                </h5>
                            }
                            {
                                data?.SECTION?.length > 0 &&

                                <p className={styles.delightCardXlDescription}>
                                    {/* Begin Your Trade Journey with Ease – With BTC contracts starting around ₹5,000 and ETH contracts near ₹2,500, you can trade in smaller lot sizes without a heavy upfront investment. It's simple, flexible, and perfect for getting started with confidence. */}
                                    {/* {data?.SECTION?.[3]?.CARD?.[0]?.description} */}
                                    {cmsCardData(data, "home-trader-first-experience", 0, "description")}
                                </p>
                            }
                            <div className={styles.delightTradersButton}>
                                <Button
                                    isLoading={false}
                                    loadingText="Redirecting..."
                                    btnText="Start Trading"
                                    onClick={() => handleStartTrading('/futures')}
                                    className="outlineFillBtn"
                                    selectedValue={currentResult}
                                />
                            </div>
                        </div>
                    </div>

                    <div className={styles.delightTradersGrid}>
                        <div className={styles.delightTradersCard}>
                            {
                                data?.SECTION?.length > 0 &&
                                <h5 className={styles.delightTradersCardTitle}>
                                    {/* Start smaller */}
                                    {cmsCardData(data, "home-trader-first-experience", 1, "title")}
                                    {/* {data?.SECTION?.[3]?.CARD?.[1]?.title} */}
                                </h5>
                            }
                            {
                                data?.SECTION?.length > 0 &&
                                <p className={styles.delightTradersCardDescription}>
                                    {/* Trade markets never closes, neither does Trevolt */}
                                    {/* {data?.SECTION?.[3]?.CARD?.[1]?.description} */}
                                    {cmsCardData(data, "home-trader-first-experience", 1, "description")}
                                </p>
                            }
                        </div>
                        <div className={styles.delightTradersCard}>
                            {
                                data?.SECTION?.length > 0 &&
                                <h5 className={styles.delightTradersCardTitle}>
                                    {/* Enjoy daily expiries */}
                                    {cmsCardData(data, "home-trader-first-experience", 2, "title")}
                                    {/* {data?.SECTION?.[3]?.CARD?.[2]?.title} */}
                                </h5>
                            }
                            {
                                data?.SECTION?.length > 0 &&
                                <p className={styles.delightTradersCardDescription}>

                                    {/* Daily, weekly and monthly expiries to give you more trading opportunities */}
                                    {/* {data?.SECTION?.[3]?.CARD?.[2]?.description} */}
                                    {cmsCardData(data, "home-trader-first-experience", 2, "description")}
                                </p>
                            }
                        </div>
                        <div className={styles.delightTradersCard}>
                            {
                                data?.SECTION?.length > 0 &&
                                <h5 className={styles.delightTradersCardTitle}>
                                    {/* Start smaller */}
                                    {/* {data?.SECTION?.[3]?.CARD?.[3]?.title} */}
                                    {cmsCardData(data, "home-trader-first-experience", 3, "title")}
                                </h5>
                            }
                            {
                                data?.SECTION?.length > 0 &&
                                <p className={styles.delightTradersCardDescription}>
                                    {/* Smart margining scheme to enable you to trade more with less capital */}
                                    {/* {data?.SECTION?.[3]?.CARD?.[3]?.description} */}
                                    {cmsCardData(data, "home-trader-first-experience", 3, "description")}
                                </p>
                            }
                        </div>
                    </div>


                </div>
            </section>

            {/* Market Overview  */}
            {/* <section className={styles.marketOpportunity}>
                <img src={Images.currency9} alt='currency9' className={`${styles.marketOpportunityImageOne} d-none d-md-block`} />
                <div className={`container custom-container`}>
                    <div className={styles.sectionHeader}>
                        <h5 className={styles.sectionTitle}>
                            Market Overview
                        </h5>
                        <p className={styles.sectionDescription}>
                            The current state of the crypto derivatives market
                        </p>
                    </div>

                    <div className={styles.marketOpportunityTable}>
                        <div className="custom-table__primary">
                            <ReactDatatable
                                columns={columns}
                                data={futurePairData}
                                pagination
                                paginationPerPage={10}
                                paginationRowsPerPageOptions={[5, 10, 15, 20, 50, 100]}
                                // customStyles={customStyles} 
                                className="dataTableComponent"
                                // sortIcon={<BiSort style={{ marginLeft: "0.5rem", color: "#000" }} />}
                                noDataComponent={<TableNoData />}
                            />
                        </div>
                    </div>

                </div>
            </section> */}


            {/* Trading for beginner feedback hide section  */}
            {/* <section className={styles.experience}>
                <div className={`container custom-container`}>
                    <div className={styles.sectionHeader}>
                        {
                            data?.SECTION?.[4]?.sectionTitle &&
                            <h5 className={styles.sectionTitle}>
                                {data?.SECTION?.[4]?.sectionTitle}
                               
                            </h5>
                        }
                        {
                            data?.SECTION?.[4]?.sectionDescription &&
                            <p className={styles.sectionDescription}>
                                {data?.SECTION?.[4]?.sectionDescription}
                            </p>
                        }
                    </div>

                     <div className={`${styles.videoPlaylistContainer} row`}>
                        <div className='col-lg-5 pe-lg-4'>
                            <div className={styles.videoPlaylistLeft}>
                                {data?.SECTION?.[4]?.CARD?.map((item, index) => (
                                    <div className={styles.videoSinglePlaylist}>
                                        <button aria-label='angles' className={styles.videoPlaylistHeader} onClick={() => handleVideoChange(index)}>
                                            <div className={styles.videoPlaylistHeaderLeft}>
                                                <img src={Images.youtubeFill} alt="youtube" className={styles.videoPlaylistIcon} />
                                                {
                                                    item?.title &&
                                                    <span className={styles.videoPlaylistTitle}>
                                                        {item?.title}
                                                    </span>
                                                }
                                            </div>
                                            {activeVideo == index ? <FaAngleUp /> : <FaAngleDown />}

                                        </button>
                                        {index === activeVideo && <div className={styles.videoPlaylistBody}>
                                            <div className={styles.videoPlaylistBodyTop}>
                                                {
                                                    item?.Image &&
                                                    <img src={`${config.IMG_URL}/${item?.Image}`} alt="thumbnail" className={styles.videoBodyThumbnail} />
                                                }
                                                <div className={styles.videoBodyContents}>
                                                    {
                                                        item?.title &&
                                                        <p className={styles.videoBodyTitle}>
                                                            {item?.title}
                                                        </p>
                                                    }
                                                    {
                                                        item?.subtitle &&
                                                        <p className={styles.videoBodyLabel}>
                                                            {item?.subtitle}
                                                        </p>
                                                    }
                                                </div>
                                            </div>
                                            <div className={styles.videoBodyBottom}>
                                                {
                                                    item?.description &&
                                                    <p className={styles.videoBodyDescription}>
                                                        {item?.description}
                                                    </p>
                                                }

                                            </div>
                                            <Link to={'/learn'}>
                                                <button aria-label='play' className={styles.watchNextBtn + ' w-100'}>
                                                    <img src={Images.play} alt='play' />
                                                    <span>Watch next video</span>
                                                </button>
                                            </Link>
                                        </div>}
                                    </div>
                                ))}

                            </div>
                        </div>
                        <div className='col-lg-7 mt-5 mt-lg-0' >
                            <div className={styles.videoPlaylistRight}>
                                <div className={styles.youtubeVideoContainerBg}>
                                    <div className={styles.youtubeVideoContainer}>
                                        <iframe
                                            width="100%"
                                            height="100%"
                                            src={currentVideoUrl ? currentVideoUrl : ""}
                                            frameborder="0"
                                            referrerpolicy="strict-origin-when-cross-origin"
                                            allowfullscreen
                                        >

                                        </iframe>

                                    </div>
                                </div>
                                {currentVideoTitle && (
                                    <p className={styles.youtubeVideoTitle}>
                                        {currentVideoTitle}
                                    </p>
                                )}
                                <div className={styles.youtubeVideButtons}>
                                    <Button
                                        isLoading={false}
                                        loadingText="Loading..."
                                        btnText="Get More Info"
                                        onClick={handleTrading}
                                        className="darkFillRectangleBtn"
                                        selectedValue={currentResult}
                                    />
                                    <Button
                                        isLoading={false}
                                        loadingText="Loading..."
                                        btnText="Start Trading Now"
                                        onClick={() => handleStartTrading('/futures')}
                                        className="primaryFillRectangleBtn"
                                        selectedValue={currentResult}
                                    />
                                </div>
                            </div>
                        </div>

                    </div> 

                </div>
            </section> */}



            {/* // REPLACE 5 to 4  */}
            <section className={styles.marketOpportunity}>
                <img src={Images.currency8} alt='currency8' className={`${styles.featureImageOne} d-none d-md-block`} />
                <div className={`container custom-container`}>
                    <div className={styles.sectionHeader}>
                        {
                            data?.SECTION?.length > 0 &&
                            <h5 className={styles.sectionTitle}>
                                {/* Our Trevolt Feature */}
                                {cmsData(data, "home-greenex-features", "sectionTitle")}
                                {/* {data?.SECTION?.[4]?.sectionTitle} */}
                            </h5>
                        }
                        {
                            data?.SECTION?.length > 0 &&
                            <p className={styles.sectionDescription}>
                                {/* Trevolt makes trading simple. Start your journey into the derivatives market with tools designed for ease, safety, and growth. */}
                                {/* {data?.SECTION?.[4]?.sectionDescription} */}
                                {cmsData(data, "home-greenex-features", "sectionDescription")}
                            </p>
                        }
                    </div>

                    <div className={styles.featureGrid}>
                        <div className={styles.gridOne}>
                            <div className={styles.featureCard}>
                                <div className={styles.featureTop}>
                                    {
                                        data?.SECTION?.length > 0 &&
                                        <h5 className={styles.featureCardTitle}>
                                            {/* Futures Trading */}
                                            {/* {data?.SECTION?.[4]?.CARD?.[0]?.title} */}
                                            {cmsCardData(data, "home-greenex-features", 0, "title")}
                                        </h5>
                                    }
                                    {
                                        data?.SECTION?.length > 0 &&
                                        <p className={styles.featureCardDescription}>
                                            {/* Futures trading is the act of buying and selling futures. These are financial contracts in which two parties – one buyer and one seller agree to exchange an underlying market for a fixed price at a future date. Futures give the buyer the obligation to buy the underlying market, and the seller the obligation to sell at or before the contract’s expiry. */}
                                            {/* {data?.SECTION?.[4]?.CARD?.[0]?.description} */}
                                            {cmsCardData(data, "home-greenex-features", 0, "description")}
                                        </p>
                                    }
                                </div>

                                <div className={styles.featureCardBottom}>
                                    <Button
                                        isLoading={false}
                                        loadingText="Loading..."
                                        btnText="Start Trading"
                                        onClick={() => handleStartTrading('/futures')}
                                        className="darkFillBtn"
                                        selectedValue={currentResult}
                                    />

                                    <img src={Images.featureOne} alt="feature" className={styles.featureCardImage} />
                                </div>
                            </div>
                        </div>
                        <div className={styles.gridThree}>
                            <div className={styles.featureCard}>
                                <div className={styles.featureTop}>
                                    {
                                        data?.SECTION?.length > 0 &&
                                        <h5 className={styles.featureCardTitle}>
                                            {/* Options Trading */}
                                            {/* {data?.SECTION?.[4]?.CARD?.[1]?.title} */}
                                            {cmsCardData(data, "home-greenex-features", 1, "title")}
                                        </h5>
                                    }
                                    {
                                        data?.SECTION?.length > 0 &&
                                        <p className={styles.featureCardDescription}>
                                            {/* Options trading may seem overwhelming at first, but it’s easy to understand if you know a few key points. Investor portfolios are usually constructed with several asset classes. These may be stocks, bonds, exchange-traded funds (ETFs), and mutual funds. Options are another asset class, and when used correctly, they offer many advantages that trading stocks and ETFs alone cannot. */}
                                            {/* {data?.SECTION?.[4]?.CARD?.[1]?.description} */}
                                            {cmsCardData(data, "home-greenex-features", 1, "description")}
                                        </p>
                                    }

                                </div>
                                <div className={styles.featureCardBottom}>
                                    <Button
                                        isLoading={false}
                                        loadingText="Loading..."
                                        btnText="Start Trading"
                                        onClick={() => handleStartTrading('/options')}
                                        className="darkFillBtn"
                                        selectedValue={currentResult}
                                    />

                                    <img src={Images.featureTwo} alt="feature" className={styles.featureCardImage} />
                                </div>
                            </div>
                        </div>
                        <div className={styles.gridFive}>
                            <div className={styles.featureCard}>
                                <div className={styles.featureTop}>
                                    {
                                        data?.SECTION?.length > 0 &&

                                        <h5 className={styles.featureCardTitle}>
                                            {/* Algo Trading */}
                                            {/* {data?.SECTION?.[4]?.CARD?.[2]?.title} */}
                                            {cmsCardData(data, "home-greenex-features", 2, "title")}
                                        </h5>
                                    }
                                    {
                                        data?.SECTION?.length > 0 &&
                                        <p className={styles.featureCardDescription}>

                                            {/* In algo trading, mathematical models and predefined rules are used to analyze market data, identify trading opportunities, and automatically generate buy or sell orders. These algorithms can be designed to consider various factors, including price movements, volume, timing, and other market indicators. */}
                                            {/* {data?.SECTION?.[4]?.CARD?.[2]?.description} */}
                                            {cmsCardData(data, "home-greenex-features", 2, "description")}
                                        </p>
                                    }

                                </div>
                                <div className={styles.featureCardBottom}>
                                    <Button
                                        isLoading={false}
                                        loadingText="Loading..."
                                        btnText="Algo Trading"
                                        // "/trading-bot" is inside <UserProtectedLayout />
                                        // (App.jsx), so a logged-out visitor clicking this
                                        // on the homepage was sent to login instead of any
                                        // Coming Soon page. "/algo-trading" is the public
                                        // route rendering AlgoTradingLanding, which already
                                        // wraps itself in <ComingSoon /> gated by
                                        // featureFlags.showAlgoTradingComingSoon.
                                        onClick={() => handleStartTrading('/algo-trading')}
                                        className="darkFillBtn"
                                        selectedValue={currentResult}
                                    />

                                    <img src={Images.featureThree} alt="feature" className={styles.featureCardImage} />
                                </div>
                            </div>
                        </div>
                        <div className={styles.gridSix}>
                            <div className={styles.featureCard}>
                                <div className={styles.featureTop}>
                                    {
                                        data?.SECTION?.length > 0 &&

                                        <h5 className={styles.featureCardTitle}>
                                            {/* Exchange Calculator */}
                                            {/* {data?.SECTION?.[4]?.CARD?.[3]?.title} */}
                                            {cmsCardData(data, "home-greenex-features", 3, "title")}
                                        </h5>
                                    }
                                    {
                                        data?.SECTION?.length > 0 &&
                                        <p className={styles.featureCardDescription}>
                                            {/* Calculates how much of one asset you'll receive after a trade or swap eal-time conversion rateAmount received after conversion
                                            Sometimes includes fees, slippage, or gas costs */}
                                            {/* {data?.SECTION?.[4]?.CARD?.[3]?.description} */}
                                            {cmsCardData(data, "home-greenex-features", 3, "description")}
                                        </p>
                                    }
                                </div>
                                <div className={styles.featureCardBottom}>
                                    <Button
                                        isLoading={false}
                                        loadingText="Loading..."
                                        btnText="Try Calculator"
                                        onClick={() => setShowCalculatorModal(true)}
                                        className="darkFillBtn"
                                        selectedValue={currentResult}
                                    />

                                    <img src={Images.featureFour} alt="feature" className={styles.featureCardImage} />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>


            {/* // REPLACE 6 to 5  */}
            <section className={styles.tradeAnyTime}>
                <div className={`container custom-container`}>
                    <div className='row align-items-center'>
                        <div className='col-md-5'>
                            <div className={styles.tradeAnyTimeLeft}>
                                {
                                    data?.SECTION?.length > 0 &&

                                    <h5 className={`${styles.bannerTitle} text-center text-md-start`}>

                                        {/* {data?.SECTION?.[5]?.sectionTitle} */}
                                        {cmsData(data, "home-24-trading-support", "sectionTitle")}
                                    </h5>
                                }

                                {
                                    data?.SECTION?.length > 0 &&

                                    <p className={`${styles.bannerDescription} text-center text-md-start`}>
                                        {/* {data?.SECTION?.[5]?.sectionDescription} */}
                                        {cmsData(data, "home-24-trading-support", "sectionDescription")}
                                    </p>
                                }

                                {/* <div className={`${styles.bannerButtons} justify-content-center justify-content-md-start`}>
                                    <Button
                                        isLoading={false}
                                        loadingText="Redirecting..."
                                        btnText="Join Now"
                                        onClick={handleTrading}
                                        className="outlineFillBtn"
                                        selectedValue={currentResult}
                                    />
                                </div> */}
                            </div>
                        </div>

                        <div className='col-md-5 mt-5 mt-md-0 d-flex align-items-center justify-content-center'>
                            <div className={styles.tradeAnyTimeRight}>
                                <img src={Images.tradeAnytime} alt='chart' className={styles.tradeAnyTimeImage} />
                            </div>
                        </div>
                    </div>
                </div>
            </section>
            {/*  Latest News cilent feedback hide section  */}
            {/* <section className={styles.marketOpportunity}>
                <img src={Images.currency9} alt='currency9' className={`${styles.latestNewsImageOne} d-none d-md-block`} />

                <div className={`container custom-container`}>
                    <div className={styles.sectionHeader}>
                        {
                            data?.SECTION?.[7]?.sectionTitle &&

                            <h5 className={styles.sectionTitle}>
                                {data?.SECTION?.[7]?.sectionTitle}
                            </h5>
                        }

                        {
                            data?.SECTION?.[7]?.sectionDescription &&
                            <p className={styles.sectionDescription}>
                                {data?.SECTION?.[7]?.sectionDescription}
                            </p>
                        }

                    </div>

                    <div className={styles.latestNewsGrid}>
                        {data?.SECTION?.[7]?.CARD?.map((item, index) => (
                            <div key={index}>
                                <LatestNews item={item} key={index} />
                            </div>

                        ))}
                    </div>

                </div>
            </section> */}
            {/* // REPLACE 8 to 6  */}
            <section className={styles.experience}>
                <img src={Images.currency5} alt='currency5' className={`${styles.faqImageOne} d-none d-md-block`} />
                <div className={`container custom-container`}>
                    <div className={styles.sectionHeader}>
                        {
                            data?.SECTION?.length > 0 &&

                            <h5 className={styles.sectionTitle}>
                                {/* Frequently Asked Questions */}
                                {/* {data?.SECTION?.[6]?.sectionTitle} */}
                                {/* {cmsData(data, "home-faq", "sectionTitle")} */}
                            </h5>
                        }
                    </div>

                    <div className='row align-items-center mt-4'>
                        <div className='col-md-6'>
                            <div className={styles.faqLeft}>
                                <img src={Images.question} alt="question" className={styles.faqLeftImage} />
                            </div>
                        </div>
                        <div className='col-md-6'>
                            <div className={`${styles.faqRight} custom-accordion`}>
                                {/* {} */}
                                <Accordion defaultActiveKey={defaultActiveKey}>

                                    {
                                        // data?.SECTION?.[6]?.CARD?.slice
                                        // cmsData(data, "home-faq", "card")?.slice(0, 3)
                                        cmsData(data, "home-faq", "CARD")?.slice(0, 3).map((item, index) => {
                                            return (
                                                <Accordion.Item eventKey={index}>
                                                    {
                                                        item?.title &&
                                                        <Accordion.Header>
                                                            {item?.title}

                                                        </Accordion.Header>
                                                    }
                                                    {
                                                        item?.description &&
                                                        <Accordion.Body>
                                                            {item?.description}
                                                        </Accordion.Body>
                                                    }

                                                </Accordion.Item>
                                            )
                                        })
                                    }



                                    {/* <Accordion.Item eventKey="0">

                                        <Accordion.Header>
                                            Is Trevolt Legal ?
                                        </Accordion.Header>

                                        <Accordion.Body>
                                            This is a demo platform created for portfolio purposes. Regulatory and compliance details would be provided by the operating entity.

                                        </Accordion.Body>

                                    </Accordion.Item>
                                    <Accordion.Item eventKey="1">

                                        <Accordion.Header>

                                          Do I need to hold any assets to trade on Trevolt? 

                                        </Accordion.Header>

                                        <Accordion.Body>
                                            Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do
                                            eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad
                                            minim veniam,
                                        </Accordion.Body>
                                    </Accordion.Item>
                                    <Accordion.Item eventKey="2">

                                        <Accordion.Header>
                                         Can I buy assets directly on Trevolt? 
                                        </Accordion.Header>


                                        <Accordion.Body>

                                            Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do
                                            eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad
                                            minim veniam,

                                        </Accordion.Body>
                                    </Accordion.Item> */}

                                </Accordion>
                                <div className='d-flex align-items-center justify-content-center'>
                                    {
                                        cmsData(data, "home-faq", "CARD")?.length > 3 &&
                                        // <Link to='/faq'>
                                        <Button
                                            isLoading={false}
                                            loadingText="Redirecting..."
                                            btnText="View All"
                                            onClick={() => handleNavigateFaq(cmsData(data, "home-faq", "CARD"))}
                                            className="primaryBtnXs"

                                        />
                                        // {/* <button>view all</button> */}
                                        // </Link>
                                    }
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>
        </main >
    );
};

export default Landing;