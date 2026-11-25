/** package import */
import React, { useState, useEffect, useLayoutEffect } from 'react'
import { NavLink } from 'react-bootstrap';


/** local import */
import styles from './staticPage.module.css';
import Images from '../../utils/Images';
import { useGlobalContext } from '../../context/GlobalProvider';
import { getCms } from '../../actions/cmsAction';
import config from '../../config/env';
import { cmsCardData, cmsData } from '../../lib/cmsCommon';

const AboutUs = () => {
    const { theme } = useGlobalContext()

    const [data, setData] = useState();

    useEffect(() => {
        fetchCms();
    }, [])

    useEffect(() => {
        window.scrollTo({
            top: 0,
            behavior: "smooth",
        });
    }, []);

    const fetchCms = async (data) => {

        let reqData = {
            pageName: 'About us'
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

    // console.log('dataaaa', data)

    return (
        <div className={`${styles.aboutusLanding}`}>
            <section className={styles.aboutusBanner}>
                <div className='custom-container container'>
                    <div className={styles.aboutusBannerContent}>
                        <div className='text-center'>
                            {
                                data?.SECTION?.[0]?.sectionTitle &&
                                <h1 className={`${styles.aboutusTitle}`}>
                                    {/* About Trevolt */}
                                    {/* {data?.SECTION?.[0]?.sectionTitle} */}
                                    {
                                        cmsData(data, "about-trading-vision", "sectionTitle")
                                    }
                                    <img src={Images.aboutusPositionImage} alt="Star" className={`${styles.aboutusStar} d-none d-lg-block`} />
                                </h1>
                            }
                            {
                                data?.SECTION?.[0]?.sectionDescription &&

                                <p className={`${styles.aboutusDescription}`}>

                                    {/* We’re not just building a trading platform — we’re shaping the future of derivatives trading in India. 
                                    At Trevolt, innovation meets compliance to deliver a secure, transparent, and lightning-fast trading experience for every trader — from beginners to professionals.
                                    Our mission is to empower Indian traders with global-grade trading tools, seamless execution, and unmatched reliability. */}
                                    {/* {data?.SECTION?.[0]?.sectionDescription} */}
                                    {cmsData(data, "about-trading-vision", "sectionDescription")}
                                </p>
                            }

                        </div>
                    </div>
                    <div className={`${styles.aboutusBannerImage} mt-4`}>
                        {
                            cmsData(data, "about-trading-vision", "CARD")?.map((item, index) => {
                                return (
                                    <>
                                        <img src={config.IMG_URL + item?.Image} alt="AboutUsOne" className={`${styles.aboutusImageOne}`} />
                                        {/* <img src={Images.aboutusBannerImage2} alt="AboutUsTwo" className={styles.aboutusImageTwo} />
                                        <img src={Images.aboutusBannerImage3} alt="AboutUsThree" className={`${styles.aboutusImageOne}`} />
                                        <img src={Images.aboutusBannerImage4} alt="AboutUsFour" className={styles.aboutusImageTwo} /> */}
                                    </>
                                )
                            })
                        }

                    </div>
                </div>
            </section>
            <section className={styles.aboutusIdeaSection}>
                <div className={`container custom-container mt-5`}>
                    <div className={`${styles.ideaRow} row align-items-center `}>

                        {/* <div className='col-12 col-md-6'>
                            <div className={`${styles.ideaLeft}`}>

                                <h3 className={`${styles.ideaSectionTitle}`}>

                                    Empowering the Next Generation of Traders
                                </h3>



                                <p className={`${styles.ideaSectionDescription}`}>

                                    We believe great ideas deserve great execution.
                                    Our platform is designed to turn trading concepts into actionable results — backed by real-time insights, multi-chart analytics, and institutional-grade infrastructure.

                                </p>

                            </div>
                        </div> */}
                        <div className='col-12 col-md-12'>


                            <div className={`${styles.ideaRight} ms-3 mt-5 mt-md-0 position-relative`}>

                                {
                                    data?.SECTION?.[1]?.sectionTitle &&
                                    <h3 className={`${styles.ideaSectionTitle} + text-center `}>

                                        {/* Empowering the Next Generation of Traders */}
                                        {cmsData(data, "about-trader-empowerment", "sectionTitle")}
                                    </h3>
                                }

                                <div className={`${styles.aboutusArrow} me-3`}>
                                    {/* <NavLink to='#' > */}
                                    <img src={Images.aboutusArrow} alt="Arrow" className={`${theme == 'light' && styles.arrowImgFilter}`} />
                                    {/* </NavLink> */}
                                </div>

                                {/* <p className={`${styles.ideaSectionDescription} mt-4 mt-md-5`}>
                                    From strategy to settlement, Trevolt ensures that your trades are executed efficiently, securely, and with precision.
                                    <span>
                                        “We don’t follow trends.
                                        We build the technology that defines them.”
                                    </span>
                                </p> */}
                                {
                                    data?.SECTION?.[1]?.sectionDescription &&
                                    <p className={`${styles.ideaSectionDescription} text-center`}>

                                        {/* We believe great ideas deserve great execution.
                                        Our platform is designed to turn trading concepts into actionable results — backed by real-time insights, multi-chart analytics, and institutional-grade infrastructure. */}
                                        {/* {data?.SECTION?.[1]?.sectionDescription} */}
                                        {cmsData(data, "about-trader-empowerment", "sectionDescription")}
                                    </p>
                                }

                            </div>


                        </div>
                    </div>
                </div>
            </section>
            <section className={`${styles.aboutusIdeaSection}`}>
                <div className={`custom-container container`}>
                    <div className={`${styles.traderRow} row align-items-start`}>
                        <div className='col-12 col-md-5'>
                            <div className={styles.traderLeft}>

                                {data?.SECTION?.[2]?.CARD?.length > 0 &&
                                    // data?.SECTION?.[2]?.CARD?.[0]?.Image
                                    <img src={config.IMG_URL + cmsCardData(data, "about-simplify-platform", 0, "Image")} alt="Video" className={`img-fluid rounded-4`} />
                                }
                                {/* data?.SECTION?.[1]?.CARD?.length  */}
                                {data?.SECTION?.[2]?.CARD?.length > 0 &&
                                    <div className={styles.traderVideoHead}>
                                        <p className='text-center'>
                                            <span className={styles.traderVideoTitle}>
                                                {/* Dinesh Kirola */}
                                                {/* {data?.SECTION?.[2]?.CARD?.[0]?.title} */}
                                                {cmsCardData(data, "about-simplify-platform", 0, "title")}
                                            </span><br />
                                            <span className={styles.traderVideoDesc}>
                                                {/* Founder & CEO */}
                                                {cmsCardData(data, "about-simplify-platform", 0, "subtitle")}
                                                {/* {data?.SECTION?.[2]?.CARD?.[0]?.subtitle} */}
                                            </span>
                                        </p>
                                    </div>
                                }
                            </div>
                        </div>
                        <div className='col-12 col-md-7'>
                            <div className={`${styles.traderRight} ms-3 mt-5 mt-md-0`}>
                                {
                                    data?.SECTION?.[2]?.sectionTitle &&
                                    <h3 className={`${styles.ideaSectionTitle}`}>

                                        {/* Built to Simplify Complex Trading */}
                                        {/* {data?.SECTION?.[2]?.sectionTitle} */}
                                        {cmsData(data, "about-simplify-platform", "sectionTitle")}

                                    </h3>
                                }

                                {
                                    data?.SECTION?.[2]?.sectionSubTitle &&

                                    <p className={`${styles.ideaSectionDescription}`}>
                                        {/* Trading shouldn’t be complicated — and that’s why Trevolt exists.
                                        Our products are built to simplify derivatives trading through intuitive interfaces, AI-assisted analytics, and low-latency architecture designed for high-frequency markets. */}
                                        {/* {data?.SECTION?.[2]?.sectionSubTitle} */}
                                        {cmsData(data, "about-simplify-platform", "sectionSubTitle")}

                                    </p>
                                }
                                {
                                    data?.SECTION?.[2]?.sectionDescription &&

                                    <div className={styles.traderDescriptionItalic}>

                                        <p className={`${styles.ideaSectionDescriptionTwo} ms-2`}>

                                            {/* “Every line of code we write is for traders — <br />
                                            so they can focus on strategy, not struggle with systems.” */}
                                            {/* {data?.SECTION?.[2]?.sectionDescription} */}
                                            {cmsData(data, "about-simplify-platform", "sectionDescription")}
                                        </p>
                                    </div>
                                }

                                <img src={Images.aboutusPositionImageTwo} alt="StarTwo" className={`${styles.aboutusStarTwo} d-none d-lg-block`} />
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            <section className={`${styles.aboutusIdeaSection}`}>
                <div className={`custom-container container`}>
                    <div className={`${styles.helpSection}`}>
                        {
                            data?.SECTION?.[3]?.sectionTitle &&
                            <h3 className={`${styles.ideaSectionTitle}`}>
                                {/* How We Help You Trade Smarter Expert-Led Team */}
                                {/* {data?.SECTION?.[3]?.sectionTitle} */}
                                {cmsData(data, "about-trader-smarterteam", "sectionTitle")}
                            </h3>
                        }
                    </div>
                    <div className={`${styles.helpMapSection} mt-5`}>
                        {
                            cmsData(data, "about-trader-smarterteam", "CARD")?.map((card, index) => {
                                const helpIcons = [Images.aboutusHelpOne, Images.aboutusHelpTwo, Images.aboutusHelpThree];
                                const bgClass = index % 2 === 0 ? styles.helpBackground : styles.helpBackgroundTwo;
                                const iconSrc = card?.Image ? config.IMG_URL + card?.Image : helpIcons[index % helpIcons.length];

                                return (
                                    <div className={bgClass} key={index}>
                                        <div className={styles.helpTeams}>
                                            <img src={iconSrc} alt={card?.title || "ProfessionalTeam"} className={`${theme == 'dark' ? styles.helpCardImage : styles.helpCardFilterImage}`} />
                                            {
                                                card?.title &&
                                                <h5 className={`${styles.helpCardTitle} mt-4`}>
                                                    {card?.title}
                                                </h5>
                                            }
                                            {
                                                card?.description &&
                                                <p className={`${styles.helpCardDesc} text-center mt-2`}>
                                                    {card?.description}
                                                </p>
                                            }
                                        </div>
                                    </div>
                                )
                            })
                        }
                    </div>
                </div>
            </section>
        </div>
    )
}

export default AboutUs
