/** package import */

import React, { useEffect, useState } from "react";
import { TbCopy } from "react-icons/tb";
import { AiFillExclamationCircle } from "react-icons/ai";
import { Link, useNavigate } from 'react-router-dom';
import { MdOutlineEdit } from "react-icons/md";

/** local import */
import { FaCircleCheck } from "react-icons/fa6";
import { IoCloseCircleSharp } from "react-icons/io5";
import styles from '../styles/profileCard.module.css'
// import styles from '.././styles/authInnerPage.module.css'
import Button from '../../../components/Button/Button'
import { useGlobalContext } from '../../../context/GlobalProvider';
import Images from '../../../utils/Images';
import { useSelector } from 'react-redux';
import { showToastMessage } from '../../../lib/toast';
import config from '../../../config/env';
import { maskEmail } from '../../../lib/Common';

/** code start */

const ProfileCard = () => {

  const [userdata, setUserData] = useState({});
  const { userdetails } = useSelector((state) => state.user);

  const navigate = useNavigate()

  const { theme } = useGlobalContext()

  const handleProfileNavigate = () => {
    navigate('/my-profile', { state: userdetails })
  }


  useEffect(() => {
    setUserData(userdetails)
  }, [userdetails]);


  const handleCopy = (secret, message) => {
    showToastMessage(message, "success")
    navigator.clipboard.writeText(secret)
  }

  const truncateString = (str, startChars = 5, endChars = 6) => {
    if (str?.length <= startChars + endChars) return str;
    return `${str?.slice(0, startChars)}...${str?.slice(-endChars)}`;
  }


  return (
    <div className={styles.card}>
      <div className={styles.cardLeft}>
        <div className="position-relative">
          <div className={styles.profileImageContainer}>
            <img src={userdetails?.profileImage ? userdetails?.profileImage : theme == 'dark' ? Images.darkDefaultProfile : Images.lightDefaultProfile} alt="profile" />
          </div>

          <div className='profileEdit_icon'>
            <button className="btn" title="Edit profile details" onClick={handleProfileNavigate}>
              <MdOutlineEdit size={11} />
            </button>
            {/* <input type="file" name="myfile" /> */}
          </div>

          {/* <div className={`profileEdit_icon ${styles['tooltip-wrapper']}`}>
                        <button className="btn" onClick={handleProfileNavigate}>
                            <MdOutlineEdit size={11} />
                        </button>
                        <span className={styles['tooltip-text']}>Edit profile details</span>
                    </div> */}


        </div>

        <div className={styles.rytContent}>
          <div className={styles.profileDataContainer}>
            <p className={styles.userName}>
              {userdetails?.firstName} {userdetails?.lastName}
            </p>
            <p className={styles.label}>
              {userdetails?.role}
            </p>
          </div>
          <div className={styles.profileDataContainer}>
            <p className={styles.label}>
              User ID
            </p>
            <div className={styles.value}>
              <span>{truncateString(userdetails?.userGreenId)}</span>
              <button aria-label="copyIcon" className={styles.borderLessButton} onClick={() => handleCopy(userdetails?.userGreenId, 'The user id has been copied!')}>
                <TbCopy />
              </button>
            </div>
          </div>
          <div className={styles.profileDataContainer}>
            <p className={styles.label}>
              Email ID
            </p>
            <div className={styles.value}>
              <span>{maskEmail(userdetails?.email)}</span>
              {/* <button className={styles.borderLessButton}>
                            <TbCopy />
                        </button> */}
            </div>
          </div>
          {config.ENV == 'live' ?
            <div className={styles.profileDataContainer}>
              <p className={styles.label}>
                Identity Verification
              </p>
              {
                (userdetails?.kycStatus == "approved") ?
                  <>
                    <div className={`${styles.value} ${styles.Verify}`}>
                      <>
                        <span>Verified</span>
                        <span className='ms-1'><FaCircleCheck /></span>
                      </>
                    </div>
                  </>
                  :
                  (userdetails?.kycStatus == "rejected") ?
                    <>
                      <div className={`${styles.value} ${styles.reject}`}>
                        <Link to='/verification'>
                          <span>Rejected</span>
                          <span className='ms-1'><IoCloseCircleSharp size={15} /></span>
                        </Link>
                      </div>
                    </>
                    :
                    <>
                      <div className={`${styles.value} ${styles.unVerify}`}>
                        <Link to='/verification'>
                          <span>Unverified</span>
                          <span className='ms-1'><AiFillExclamationCircle /></span>
                        </Link>
                      </div>
                    </>
              }
            </div>
            :
            ""}
          <div className={styles.profileDataContainer}>
            <p className={styles.label}>
              User Name
            </p>
            <div className={styles.value}>
              <span>{userdetails?.userName}</span>
              <button aria-label="copyIcon" className={styles.borderLessButton} onClick={() => handleCopy(userdetails?.userName, 'The user name has been copied!')}>
                <TbCopy />
              </button>
            </div>
          </div>
          <div className={styles.profileDataContainer}>
            <p className={styles.label}>
              Referral Code
            </p>
            <div className={styles.value}>
              <span>{userdetails?.referralCode}</span>
              <button aria-label="copyIcon" className={styles.borderLessButton} onClick={() => handleCopy(userdetails?.referralCode, 'The referral code has been copied!')}>
                <TbCopy />
              </button>
            </div>
          </div>
        </div>
      </div>
      {/* <div className={`${styles.right} mt-4`}>
                <Button
                    isLoading={false}
                    loadingText="Redirecting..."
                    btnText="My Profile"
                    onClick={handleProfileNavigate}
                    className="cardBtn"
                    selectedValue={null}
                />
            </div> */}
    </div>
  )
}

export default ProfileCard