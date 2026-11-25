import React, { useEffect, useState } from 'react';
import styles from "../styles/affiliateDashboard.module.css";
import Images from '../../../utils/Images';
import Button from '../../../components/Button/Button';
import QRCode from "react-qr-code";
import { useNavigate } from 'react-router-dom';
import { affiliateSummaryDetails } from '../../../actions/affliateAction';
import { useDispatch, useSelector } from "react-redux";
import { isEmpty } from 'lodash';
import config from '../../../config/env';
import { showToastMessage } from '../../../lib/toast';
import { useGlobalContext } from '../../../context/GlobalProvider';

const cardBgArr = [
  "#4A6FCD",
  "#2AA04D",
  "#8450E7",
  "#004C82",
  "#BE6321",
  "#6265FF",
  "#008186",
  "#542114"
];

const overviewCardData = [
  {
    id: 1,
    src: Images.affiliateDashboardIcon5,
    title: "Total Users",
    // content: "You get rewarded once they start using our service.",
    content: "Represents the total number of users who have registered or signed up on your platform.",
    count: 0,
    key: 'totalUsers'
  },
  {
    id: 1,
    src: Images.affiliateDashboardIcon6,
    title: "Total Clicks",
    // content: "You get rewarded once they start using our service.",
    content: "Shows how many times users have clicked on your affiliate links.",
    count: 0,
    key: 'totalClicks'
  },
  {
    id: 1,
    src: Images.activeUserIcon,
    title: "Active Users",
    // content: "You get rewarded once they start using our service.",
    content: "Indicates the number of users who are currently active.",
    count: 0,
    key: 'activeUsers'
  },
  // {
  //     id: 1,
  //     src: Images.affiliateDashboardIcon1,
  //     title: "Deposit",
  //     content: "You get rewarded once they start using our service.",
  //     count: 36785,
  // },
  {
    id: 1,
    src: Images.affiliateDashboardIcon2,
    title: "Active Traders",
    // content: "You get rewarded once they start using our service.",
    content: "Counts users who are actively performing trading activities on your platform.",
    count: 0,
    key: 'activeTraders'
  },
  {
    id: 1,
    src: Images.affiliateDashboardIcon3,
    title: "Volume",
    // content: "You get rewarded once they start using our service.",
    content: "Represents the total trading volume generated.",
    count: 0,
    key: 'totalVolume'
  },
  {
    id: 1,
    src: Images.affiliateDashboardIcon4,
    title: "Total Commission",
    // content: "You get rewarded once they start using our service.",
    content: "Shows the total earnings/commission you’ve made from referrals or affiliate activity.",
    count: 0,
    key: 'totalCommission'
  },
  {
    id: 1,
    src: Images.affiliateDashboardIcon7,
    title: "Kyc Completed Users",
    // content: "You get rewarded once they start using our service.",
    content: "Number of users who have successfully completed their KYC verification.",
    count: 0,
    key: 'approvedKycUsers'
  },
  // {
  //     id: 1,
  //     src: Images.affiliateDashboardIcon8,
  //     title: "Kyc Approved Users",
  //     content: "You get rewarded once they start using our service.",
  //     count: 36785,
  // },
]

export default function AffiliateDashboard() {
  const navigate = useNavigate();
  const { convertValue, convertSecValue } = useGlobalContext();

  const { userdetails, affiliateDetails } = useSelector((state) => state.user);

  const [formData, setFormData] = useState({})

  const fetchAffiliateSummaryDetails = async () => {
    try {
      // SECURITY FIX: removed console.log of sensitive client-side data (secretKey/password/OTP)
      const { status, result } = await affiliateSummaryDetails(affiliateDetails.referralCode, userdetails?.secretKey);

      if (status) {
        setFormData(result)
      }
    } catch (e) {
      console.log("fetchaffiliateSummaryDetails_err", e);
    }
  }

  const handleReferralCopy = (message, data) => {
    showToastMessage(message, "success")
    navigator.clipboard.writeText(data)
      .then(() => {
      })
      .catch((err) => {
      })
  }

  useEffect(() => {

    // if (!isEmpty(affiliateDetails) && affiliateDetails.status === 'pending') {
    //     navigateHandle("/affiliate")
    // }

    if (!isEmpty(userdetails) && !isEmpty(affiliateDetails)) {
      fetchAffiliateSummaryDetails()
    }

  }, [userdetails, affiliateDetails])


  return (
    <div className={styles.affiliateDashboard}>
      <div>
        <div>
          <h2 className={styles.pageTitle}>
            Overview
          </h2>
        </div>
        <div className={styles.overviewCardWrapper}>
          {overviewCardData.map((item, index) => (
            <div key={index} className={styles.cardPart} style={{ backgroundColor: cardBgArr[index] }}>
              <img src={item.src} alt="icon" className={styles.cardIcon} />
              <div className='mt-3'>
                <h3 className={styles.cardTitleText} >{item.title}</h3>
                <p className={styles.cardContentText} >{item.content}</p>
              </div>
              <h4 className={styles.cardCountText}>{
                item.key === 'totalClicks' ? formData?.totalClicks ?? 0 :
                  item.key === 'totalCommission' ?
                    <>
                      {convertValue(formData?.summary?.totalCommission ?? 0)}
                      <span className='fs13 mx-2'>
                        {convertSecValue(formData?.summary?.totalCommission ?? 0)}
                      </span>
                    </>

                    :

                    !isEmpty(formData) ? formData.summary[item.key] : item.count
              }</h4>
            </div>
          ))}
        </div>
      </div>
      <div>
        {/* <h2 className={styles.pageTitle}>
                    Affiliate Rules
                </h2> */}
        <div className='mt-2'>
          <div className={styles.cardTemplate}>
            <h2 className={styles.labelHeadingText}>Notes :</h2>
            <p className={styles.valueText}>
              You’ll earn affiliate commissions whenever your referred users make <strong>Deposits</strong>, <strong>Withdrawals</strong>, and <strong>Trades</strong>.
            </p>
          </div>
        </div>
        <div className={styles.affiliateRuleWrapper}>

          <div className={styles.leftCardWrapper}>
            <div className={styles.cardTemplate}>
              <h2 className={styles.labelHeadingText}>{formData?.referralCode}</h2>
              <p className={styles.valueText}>Affiliate Code</p>
              <div className='mt-4'>
                <Button className='darkFillBtnXs' btnText={"Copy"}
                  onClick={() => {
                    handleReferralCopy('The referral code has been copied !', formData?.referralCode)
                  }}
                />
              </div>
            </div>
            <div className={styles.cardTemplate}>
              <h2 className={styles.labelHeadingText}>Share Via</h2>
              <p className={styles.valueText}>Social Media Link</p>
              <div className='mt-4 d-flex gap-3'>
                <a
                  href={formData?.youtube}
                  target='parent'
                  aria-label='youtube'
                  className={styles.socialMediaBtn}>
                  <img src={Images.affiliateYoutubeIcon} alt="Youtube" />
                </a>
                <a
                  href={formData?.x}
                  target='parent'
                  aria-label='twitter'
                  className={styles.socialMediaBtn}>
                  <img src={Images.affiliateTwitterIcon} alt="Twitter" />
                </a>
                <a
                  href={formData?.telegram}
                  target='parent'
                  aria-label='telegram'
                  className={styles.socialMediaBtn}>
                  <img src={Images.affiliateTelegramIcon} alt="Telegram" />
                </a>
                <a
                  href={formData?.discord}
                  target='parent'
                  aria-label='discord'
                  className={styles.socialMediaBtn}>
                  <img src={Images.affiliateDiscordIcon} alt="Discord" />
                </a>
                <a
                  href={formData?.instagram}
                  target='parent'
                  aria-label='instagram'
                  className={styles.socialMediaBtn}>
                  <img src={Images.affiliateInstaIcon} alt="instagram" />
                </a>
                <a
                  href={formData?.twitch}
                  target='parent'
                  aria-label='twitch'
                  className={styles.socialMediaBtn}>
                  <img src={Images.affiliateTwitchIcon} alt="Twitch" />
                </a>
                <a
                  href={formData?.facebook}
                  target='parent'
                  aria-label='facebook'
                  className={styles.socialMediaBtn}>
                  <img src={Images.affiliateFacebookIcon} alt="Facebook" />
                </a>
              </div>
            </div>
          </div>

          <div className={styles.rightCardWrapper}>
            <div className={styles.cardTemplate}>
              <div className='d-flex gap-2 align-items-center justify-content-between flex-wrap'>
                <div>
                  <h2 className={styles.labelHeadingText}>{`${config.FRONT_URL}/affiliate/${formData?.referralCode}`}</h2>
                  <p className={styles.valueText}>Affiliate Link</p>
                </div>
                <div className=''>
                  <Button className='darkFillBtnXs' btnText={"Copy"}
                    onClick={() => {
                      handleReferralCopy('The referral link has been copied !', `${config.FRONT_URL}/affiliate/${formData?.referralCode}`)
                    }}
                  />
                </div>
              </div>
              <hr className={styles.dividerLine} />
              <div>
                <p className={`${styles.valueText} fs16`}>
                  Click the image below to save , print or share your referral URL as a QR Code
                </p>
                <div className='d-flex align-items-center gap-2 justify-content-between flex-wrap'>
                  {/* <img className={styles.qrcodeImg} src={Images.qrcodeImg} alt="qrcode" /> */}
                  <div className={`${styles.qrCodeContainer}`}>
                    <div className={`${styles.qrCodeWrapper}`}>
                      {!isEmpty(formData) ?
                        <QRCode
                          size={256}
                          style={{ height: "auto", maxWidth: "100%", width: "100%" }}
                          value={`${config.FRONT_URL}/affiliate/${formData?.referralCode}`}
                          viewBox={`0 0 256 256`}
                        />
                        : ""}
                    </div>
                    {/* <div className={styles.qrCodeInfo}>Scan to get address</div> */}
                  </div>
                  <Button className='darkFillBtnXs' btnText={"Copy"}
                    onClick={() => {
                      handleReferralCopy('The referral link has been copied !', `${config.FRONT_URL}/affiliate/${formData?.referralCode}`)
                    }} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}