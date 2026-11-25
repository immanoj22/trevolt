import React, { useEffect, useState } from 'react';
import styles from "../styles/affiliateLanding.module.css";
import Button from '../../../components/Button/Button';
import Images from '../../../utils/Images';
import {
  VerticalTimeline,
  VerticalTimelineElement,
} from 'react-vertical-timeline-component';
import 'react-vertical-timeline-component/style.min.css';
import { useNavigate } from 'react-router-dom';
import { MetaTags } from '../../../meta/metaTags';
import { useSelector } from "react-redux";
import isEmpty from 'is-empty';
import { showToastMessage } from '../../../lib/toast';
import { getCms } from '../../../actions/cmsAction';
import config from '../../../config/env';
import { cmsCardData, cmsData } from '../../../lib/cmsCommon';
import ComingSoon from '../../../components/ComingSoon/ComingSoon';
import featureFlags from '../../../config/featureFlags';

const featureCardList = [
  {
    id: 101,
    src: Images.affiliateIcon1,
    title: "Round-the-Clock Expert Assistance",
    content: "Our team is always here for you—day or night. Get personalized support whenever you need it, ensuring your success never hits pause."
  },
  {
    id: 102,
    src: Images.affiliateIcon2,
    title: "Real-Time Performance Analytics",
    content: "Stay ahead with live tracking of your traffic, conversions, and commissions. Access detailed insights to optimize your affiliate strategy on the go."
  },
  {
    id: 103,
    src: Images.affiliateIcon3,
    title: "Grow with Tiered Affiliates",
    content: "Boost your earnings by building your own network of sub-affiliates. Earn a commission not just from your referrals—but theirs too."
  },
  {
    id: 104,
    src: Images.affiliateIcon4,
    title: "Instant Messaging",
    content: "Stay connected with instant in-platform messaging. Collaborate, ask questions, and share updates—all in real time."
  },
];

export default function AffiliateLanding() {
  const { isAuthStatus, affiliateDetails, userdetails } = useSelector((state) => state.user);
  // console.log("AffiliateLanding_data", affiliateDetails);
  const navigate = useNavigate();

  const [data, setData] = useState([]);

  useEffect(() => {
    fetchCms();
  }, [])


  const fetchCms = async (data) => {

    let reqData = {
      pageName: 'Affiliate'
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

  const navigateHandle = (url) => {
    navigate(url);
  }

  useEffect(() => {
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }, []);




  return (
    // Temporary: Affiliate is only partially built — gated behind
    // featureFlags.showAffiliateComingSoon for client review. Flip that
    // flag off once the feature is ready; everything below is untouched
    // and renders exactly as before when the flag is false.
    <ComingSoon
      active={featureFlags.showAffiliateComingSoon}
      title="Coming Soon..."
      message="Our affiliate program is being finalized. Please check back soon."
    >    <>
      <MetaTags />
      <main className={styles.affiliateLanding}>
        <section className={styles.affiliateBody}>
          <div className={styles.bannerSectionContainer}>
            <img
              src={Images.affiliateBannerBg}
              alt="backgroundImage"
              className={styles.imgSectionFile} />
          </div>
          <div className={`${styles.bannerContainer}`}>
            <div className={`container custom-container`}>
              <div className={`${styles.bannerRow} row align-items-center`}>
                <div className={` col-lg-6 mt-5 py-lg-4 `}>
                  <div className={styles.bannerLeft}>
                    {
                      data?.SECTION?.length > 0 &&
                      <h2 className={styles.bannerTitleXl}>

                        {/* Earn Big. Refer Smart. <br /> Join Our Affiliate <br /> Program Today! */}
                        {/* {data?.SECTION?.[0]?.sectionTitle} */}
                        {cmsData(data, 'greenex-affiliate-program', "sectionTitle")}
                      </h2>
                    }
                    {
                      data?.SECTION?.[0]?.sectionDescription &&
                      <p className={`mt-3 ${styles.bannerDescription}`}>

                        {/* Unlock lifetime earnings by simply sharing your referral link. Whether you're a content creator, trader, influencer, or marketer — earn passive income with every sign-up or transaction. */}
                        {/* {data?.SECTION?.[0]?.sectionDescription} */}
                        {cmsData(data, 'greenex-affiliate-program', "sectionDescription")}
                      </p>
                    }
                    <div className="d-flex align-items-center gap-3 mt-5 flex-wrap justify-content-center justify-content-lg-start">
                      {
                        isAuthStatus ?
                          <>
                            {
                              affiliateDetails && affiliateDetails?.status === 'approved' ? <Button btnText='Dashboard' className='darkFillBtn' onClick={() => { navigateHandle("/affiliate/dashboard") }} /> :
                                <Button btnText='Join the Affiliate Program' onClick={() => {
                                  if (userdetails?.kycStatus != 'approved' && config.ENV != 'demo') {
                                    showToastMessage('Please complete your KYC details', 'error')
                                    return
                                  } else if (affiliateDetails.status === 'pending' && config.ENV != 'demo') {
                                    showToastMessage('Please wait for admin approval', 'error')
                                    return
                                  }
                                  navigateHandle("/affiliate-apply")
                                }}
                                // disabled={affiliateDetails?.status === 'pending'}
                                />
                            }


                          </>
                          :
                          <Button btnText='Login' onClick={() => { navigateHandle("/login") }} />
                      }

                    </div>
                  </div>
                </div>
                <div className={`offset-lg-1 col-lg-5 mt-5 mt-lg-0`}>
                  <div className={styles.bannerRight}>
                    <img src={Images.affiliateBannerImg} alt='affiliate Banner' />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
        <section className={styles.experience}>
          <img src={Images.currency8} alt='currency8' className={`${styles.experienceImageOne} d-none d-md-block`} />
          <img src={Images.currency9} alt='currency9' className={`${styles.experienceImageTwo} d-none d-md-block`} />
          <div className={`container custom-container`}>
            <div className={styles.sectionHeader}>
              {
                data?.SECTION?.length > 0 &&
                <h1 className={styles.sectionTitle}>

                  {/* Experience Seamless Trading with Trevolt */}
                  {cmsData(data, 'affiliate-seamless-trading', "sectionTitle")}
                  {/* {data?.SECTION?.[1]?.sectionTitle} */}
                </h1>
              }

              {
                data?.SECTION?.length > 0 &&
                <p className={styles.sectionDescription}>

                  {/*Trevolt makes trading simple. Start your journey into the derivatives market with tools designed for ease, safety, and growth. */}
                  {cmsData(data, 'affiliate-seamless-trading', "sectionDescription")}
                  {/* {data?.SECTION?.[1]?.sectionDescription} */}
                </p>
              }

            </div>
            <div className={styles.timeLineWrapper}>
              <VerticalTimeline animate={false}>
                <VerticalTimelineElement
                  className={styles.workflowCard}
                  iconStyle={{ background: '#2563EB', scale: 0.2, border: "none", outline: "3px solid #fff", outlineOffset: "8px", zIndex: "10" }}
                  position='left'
                >
                  {
                    // cmsData(data, 'affiliate-seamless-trading', "sectionDescription"
                    data?.SECTION?.length > 0 &&
                    <h3 className={styles.workflowCardTitle}>

                      {/* Share your referral link */}
                      {/* {data?.SECTION?.[1]?.CARD?.[0]?.title} */}
                      {cmsCardData(data, 'affiliate-seamless-trading', 0, "title")}

                    </h3>
                  }

                  <ul className={styles.workflowCardText}>
                    {
                      data?.SECTION?.length > 0 &&
                      <span className={styles.li}>

                        {/* Send your referral link – let friends explore Trevolt and earn together! */}
                        {/* {data?.SECTION?.[1]?.CARD?.[0]?.description} */}
                        {cmsCardData(data, 'affiliate-seamless-trading', 0, "description")}
                      </span>
                    }
                  </ul>
                </VerticalTimelineElement>
                <VerticalTimelineElement
                  className={styles.workflowCard}
                  iconStyle={{ background: '#2563EB', scale: 0.2, border: "none", outline: "3px solid #fff", outlineOffset: "8px", zIndex: "10" }}
                  position='right'
                >
                  {
                    data?.SECTION?.length > 0 &&
                    <h3 className={styles.workflowCardTitle}>
                      {/* Your friends save 10% */}
                      {data?.SECTION?.[1]?.CARD?.[1]?.title}
                    </h3>
                  }
                  <ul className={styles.workflowCardText}>
                    {
                      data?.SECTION?.length > 0 &&
                      <span className={styles.li}>

                        {/* Referred users enjoy a 10% trading fee discount for their first 2 months */}
                        {/* {data?.SECTION?.[1]?.CARD?.[1]?.description} */}
                        {cmsCardData(data, 'affiliate-seamless-trading', 1, "description")}
                      </span>
                    }

                  </ul>
                </VerticalTimelineElement>
                <VerticalTimelineElement
                  className={styles.workflowCard}
                  iconStyle={{ background: '#2563EB', scale: 0.2, border: "none", outline: "3px solid #fff", outlineOffset: "8px", zIndex: "10" }}
                  position='left'
                >
                  {
                    data?.SECTION?.length > 0 &&
                    <h3 className={styles.workflowCardTitle}>
                      {/* You earn as they trade */}
                      {/* {data?.SECTION?.[1]?.CARD?.[2]?.title} */}
                      {cmsCardData(data, 'affiliate-seamless-trading', 2, "title")}
                    </h3>
                  }
                  <ul className={styles.workflowCardText}>
                    {
                      data?.SECTION?.length > 0 &&
                      <span className={styles.li}>
                        {/* Earn 10% of the trading fees generated by your referrals. */}
                        {/* {data?.SECTION?.[1]?.CARD?.[2]?.description} */}
                        {cmsCardData(data, 'affiliate-seamless-trading', 2, "description")}
                      </span>
                    }
                  </ul>
                </VerticalTimelineElement>
              </VerticalTimeline>

            </div>
          </div>
        </section>
        <section className={`${styles.experience} ${styles.features}`}>
          <img src={Images.currency4} alt='currency4' className={`${styles.experienceImageThree} d-none d-md-block`} />
          <img src={Images.currency8} alt='currency8' className={`${styles.experienceImageFour} d-none d-md-block`} />
          <div className={`container custom-container`}>
            <div className={styles.sectionHeader}>
              {
                data?.SECTION?.length > 0 &&
                <h5 className={styles.sectionTitle}>

                  {/* Our Features */}
                  {/* {data?.SECTION?.[2]?.sectionTitle} */}
                  {cmsData(data, "affiliate-features", "sectionTitle")}
                </h5>
              }
              {
                data?.SECTION?.length > 0 &&
                <p className={styles.sectionDescription}>

                  {/* Trevolt makes trading simple. Start your journey into the derivatives market with tools designed for ease, safety, and growth. */}
                  {/* {data?.SECTION?.[2]?.sectionDescription} */}
                  {cmsData(data, "affiliate-features", "sectionDescription")}
                </p>
              }

            </div>
            <div className={styles.featureCardList}>
              {
                cmsCardData(data, "affiliate-features", 2, "CARDS")?.length > 0 &&

                <ul>
                  {/* featureCardList */}
                  {
                    cmsCardData(data, "affiliate-features", 2, "CARDS")?.map((item, index) => (
                      <li key={index}>
                        <img src={Images[`affiliateIcon${index + 1}`]} alt={item.title} />
                        <h3>{item?.title}</h3>
                        <p>{item?.description}</p>
                      </li>
                    ))
                  }
                </ul>
              }
            </div>
          </div>
        </section>
        <section className={styles.startEarning}>
          <div className={`container custom-container`}>
            <div className={`${styles.startEarningContainer} row gap-4 justify-content-between align-items-center`}>
              <div className='col-lg-5'>
                {
                  // data?.SECTION?.[3]?.sectionTitle &&
                  <h2 className='mb-3'>
                    {/* Start Earning Today */}
                    {cmsData(data, "affiliate-earning-today", "sectionTitle")}
                    {/* {data?.SECTION?.[3]?.sectionTitle} */}
                  </h2>
                }
                {
                  data?.SECTION?.length > 0 &&
                  <p className='mb-5'>
                    {/* Start sharing your link—big rewards are just a few invites away! */}
                    {/* {data?.SECTION?.[3]?.sectionDescription} */}
                    {cmsData(data, "affiliate-earning-today", "sectionDescription")}
                  </p>
                }

                <Button className='cardLightBtnSimilar' btnText='Start Earning Today'
                  onClick={() => {
                    affiliateDetails && affiliateDetails?.status === 'approved' ? navigate("/affiliate/dashboard") :
                      window.scrollTo({
                        top: 0,
                        behavior: "smooth",
                      });

                  }}
                />
              </div>
              <div className='col-lg-2'>
                <img src={Images.startEarningIcon} alt="startEarningIcon" />
              </div>
            </div>
          </div>
        </section>
      </main >
    </>
    </ComingSoon>
  )
}