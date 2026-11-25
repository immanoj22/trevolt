// package import 

import React, { useState } from 'react'
import { IoMdHeart, IoMdHeartEmpty } from "react-icons/io";
import { FaRegUser } from "react-icons/fa6";
import { Link, useNavigate } from "react-router-dom";
import { AiOutlineCalculator } from "react-icons/ai";
import { GiTwoCoins } from "react-icons/gi";

// local import 

// import styles from '../styles/stakeProfileCard.module.css'
import styles from '../styles/stakingLanding.module.css'
import Images from '../../../utils/Images'
import Button from '../../../components/Button/Button';
import { FaAngleDown, FaAngleUp, FaCubes, FaPeopleArrows } from 'react-icons/fa';
import Unstake from '../modal/Unstake';

const StakeProfileCard = React.memo(({ key, item }) => {

    const { img, title, description, days, apy, stakeEarned, stakeButton, claimInterval, minimumStake, totalStaked, stakers } = item
    const [activeHeart, setActiveHeart] = useState(false);
    const [showStakeDetails, setShowStakeDetails] = useState(false);
    let navigate = useNavigate()
    const [showUnstake, setShowUnstake] = useState(false);
    const [unstakeData, setUnstakeData] = useState(null);

    const handleUnstakeDetails = (data) => {
        if(data) {
            setUnstakeData(data);
            setShowUnstake(true);
        } else {
            setUnstakeData(null);
            setShowUnstake(false);
        }
    }

    return (
        <>
        <Unstake
            show={showUnstake}
            unstakeData={unstakeData}
            handleClose={() => handleUnstakeDetails()}
        />
        <div className={styles.card} key={key}>
            <div className={`${styles.cardHead} ${styles.cardPaddingContainer}`}>
                <div className={styles.profileDetails}>
                    <div className={styles.cardContent}>
                        <h5 className={styles.title}>
                            Earn {title}
                        </h5>

                        <p className={styles.description}>
                            {description}
                        </p>
                    </div>
                </div>
                <img src={img} alt={key} className={styles.image} />
            </div>
            <div className={styles.cardBottom}></div>
            <div className={styles.cardPaddingContainer}>
                <div className={styles.cardPoints}>
                    <p className={styles.label}>Locked Days</p>
                    <p className={styles.labelValues}>{days} days</p>
                </div>
                <div className={styles.cardPoints}>
                    <p className={styles.label}>
                        <AiOutlineCalculator fontSize={16} className={`me-2 mb-1 ${styles.stakeLabelIcons}`} />
                        APY
                    </p>
                    <p className={styles.labelValues}>{apy} %</p>
                </div>
                <div className={styles.earnedStakePoints}>
                    <p className={`${styles.label}`}>
                        <GiTwoCoins className="me-2 mb-1 stake_gray_svg" fontSize={19} />
                        STAKE EARNED
                    </p>
                    <p className='my-1'>{stakeEarned}</p>
                    <p className={styles.label}>{title}</p>
                </div>
                <div className={styles.cardButtons}>
                    <Button
                        isLoading={false}
                        // loadingText="Redirecting..."
                        btnText={stakeButton}
                        onClick={() => setShowUnstake(true)}
                        className="successFillRectangleBtn"
                    // selectedValue={currentResult}
                    />
                </div>
            </div>
            <div className={styles.cardBottom}></div>
            <div className={`${styles.cardDetailsContainer} ${styles.cardPaddingContainer}`}>
                <button aria-label='angles' className={`${styles.borderLessButton}`}

                    onClick={() => setShowStakeDetails(!showStakeDetails)}>
                    {showStakeDetails ?
                        <>Hide <FaAngleUp className="ms-2" /></>
                        : <>Details <FaAngleDown className="ms-2" /></>
                    }
                </button>
            </div>
            {showStakeDetails &&
                <div className={`${styles.cardPaddingContainerTwo}`}>
                    <div className={`${styles.cardPoints} mb-2`}>
                        <p className={styles.label}>
                            <GiTwoCoins className="me-2 mb-1 stake_gray_svg" fontSize={19} />
                            Claim Interval
                        </p>
                        <p className={styles.labelValues}>{claimInterval} days</p>
                    </div>
                    <div className={`${styles.cardPoints} mb-2`}>
                        <p className={styles.label}>
                            <GiTwoCoins className="me-2 mb-1 stake_gray_svg" fontSize={19} />    
                            Minimum stake
                        </p>
                        <p className={styles.labelValues}>{minimumStake}</p>
                    </div>
                    <div className={`${styles.cardPoints} mb-2`}>
                        <p className={styles.label}>
                            <FaPeopleArrows className={`mb-1 me-2  ${styles.stakeLabelIcons}`} fontSize={19} />
                            Total staked
                        </p>
                        <p className={styles.labelValues}>{totalStaked}</p>
                    </div>
                    <div className={`${styles.cardPoints} mb-2`}>
                        <p className={styles.label}>
                            <FaCubes className={`mb-1 me-2  ${styles.stakeLabelIcons}`} fontSize={19} />
                            Stakers
                        </p>
                        <p className={styles.labelValues}>{stakers}</p>
                    </div>
                </div>
            }
        </div>
        </>
    )
})

export default StakeProfileCard