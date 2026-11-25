// package import 

import React, { useState } from 'react'
import { IoMdHeart, IoMdHeartEmpty } from "react-icons/io";
import { FaRegUser } from "react-icons/fa6";
import { Link, useNavigate } from "react-router-dom";
import { AiOutlineCalculator } from "react-icons/ai";
import { GiTwoCoins } from "react-icons/gi";
import { LiaLayerGroupSolid } from "react-icons/lia";
import Swal from 'sweetalert2';

// local import 

// import styles from '../styles/stakeProfileCard.module.css'
import styles from '../styles/stakingLanding.module.css'
import Images from '../../../utils/Images'
import Button from '../../../components/Button/Button';
import { FaAngleDown, FaAngleUp, FaCubes, FaPeopleArrows } from 'react-icons/fa';
import AddLiquidity from '../modal/AddLiquidity';
import Unstake from '../modal/Unstake';
import ClaimDetails from '../modal/ClaimDetails';
import { useGlobalContext } from '../../../context/GlobalProvider';


const StakeProfileList = React.memo(({ key, item }) => {

    const { theme, isAuth } = useGlobalContext()

    const { img, title, description, days, apy, stakeEarned, stakeButton, claimInterval, minimumStake, totalStaked, stakers } = item

    const [showStakeDetails, setShowStakeDetails] = useState(false);
    const [addLiquidityShow, setAddLiquidityShow] = useState(false);
    const [liquidityData, setLiquidityData] = useState(null);
    const [unstakeShow, setUnstakeShow] = useState(false);
    const [unstakeData, setUnstakeData] = useState(null);
    const [showClaimDetails, setShowClaimDetails] = useState(false);
    const [claimDetailsData, setClaimDetailsData] = useState(null);


    const liquidityDetailsHandle = (data) => {
        if (data) {
            setLiquidityData(data);
            setAddLiquidityShow(true);
        } else {
            setLiquidityData(null);
            setAddLiquidityShow(false);
        }
    };

    const unstakeDetailsHandle = (data) => {
        if (data) {
            setUnstakeData(data);
            setUnstakeShow(true);
        } else {
            setUnstakeData(null);
            setUnstakeShow(false);
        }
    }

    const claimDetailsHandle = (data) => {
        if (data) {
            setClaimDetailsData(data);
            setShowClaimDetails(true);
        } else {
            setClaimDetailsData(null);
            setShowClaimDetails(false);
        }
    }

    const unstakebtn = () => {

        // if (item == true) {
        Swal.fire({
            title: "After redemption, the Earn subscription is removed from the page.",
            icon: "info",
            showCancelButton: true,
            confirmButtonText: "OK",
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
                setUnstakeShow(true)
            } else if (result.isDenied) {

            }
        });
        // } else {
        //   setUnstakeShow(true)
        // }

    }

    return (
        <div>
            <AddLiquidity
                show={addLiquidityShow}
                liquidityData={liquidityData}
                handleClose={() => liquidityDetailsHandle()}
            />
            <Unstake
                show={unstakeShow}
                unstakeData={unstakeData}
                handleClose={() => unstakeDetailsHandle()}
            />
            <ClaimDetails
                show={showClaimDetails}
                claimDetailsData={claimDetailsData}
                handleClose={() => claimDetailsHandle()}
            />
            <div className={`${styles.stakeCardList}`}>
                <div className={`${styles.stakeCardListHeader}`}>
                    <div className={`${styles.cardListFlex}`}>
                        <div className={`${styles.cardImageFlex}`}>
                            <div className={styles.stakeCardImageContainer}>
                                <img src={img} alt={title} />
                            </div>
                            <div>
                                <p className={`${styles.stakeLabel}`}>Earn {title}</p>
                                <p className={`${styles.stakeValues}`}>{description}</p>
                            </div>
                        </div>
                        <div className='d-none d-sm-flex flex-column align-items-start justify-content-between'>
                            <div className='d-flex align-items-center'>
                                <AiOutlineCalculator fontSize={16} className={`me-2 mb-1 ${styles.stakeLabelIcons}`} />
                                <p className={`${styles.stakeLabel}`}>APY</p>
                            </div>
                            <p className={`${styles.stakeValues} mt-1`}>{apy} %</p>
                        </div>
                        <div className="d-none d-md-flex flex-column align-items-start">
                            <p className={`${styles.stakeLabel}`}>
                                <GiTwoCoins className={`me-2 mb-1 ${styles.stakeLabelIcons}`} fontSize={16} />
                                Minimum stake
                            </p>
                            <p className={`${styles.stakeValues} mt-1`}>
                                {minimumStake}
                            </p>
                        </div>
                        <div className="d-none d-lg-flex flex-column align-items-start">
                            <p className={`${styles.stakeLabel}`}><FaPeopleArrows className={`me-2 mb-1 ${styles.stakeLabelIcons}`} /> Total staked</p>
                            <p className={`${styles.stakeValues} mt-1`}>
                                {totalStaked}
                            </p>
                        </div>
                        <div className="d-none d-lg-flex flex-column">
                            <p className={`${styles.stakeLabel}`}><FaCubes className={`me-2 mb-1 ${styles.stakeLabelIcons}`} /> Locked Days</p>
                            <p className={`${styles.stakeValues} mt-1`}>{days} Days</p>
                        </div>
                        <button aria-label='angles' className={`${styles.borderLessButton}`}

                            onClick={() => setShowStakeDetails(!showStakeDetails)}
                        >
                            {showStakeDetails ?
                                <>Hide <FaAngleUp className="ms-2" /></>
                                : <>Details <FaAngleDown className="ms-2" /></>
                            }
                        </button>
                    </div>
                </div>
                {showStakeDetails &&
                    <div className={`${styles.stakeCardListBody} d-flex flex-wrap align-items-center justify-content-center justify-content-xl-between gap-4 gap-md-5`}>
                        <div className={`${styles.stakeCardListWrapper}`}>
                            <div className="row mx-auto">
                                <div className="col-6 px-0">
                                    <div className="row mx-auto"  >
                                        <div className="col-2 px-0">
                                            <GiTwoCoins className={`mb-2  ${styles.stakeLabelIcons}`} />
                                        </div>
                                        <div className="col-10 px-0">
                                            <p className={`${styles.stakeLabel}`}>Minimum subscription</p>
                                        </div>
                                    </div>
                                </div>
                                <div className="col-6 pe-0">
                                    <p className={`${styles.stakeValues} text-end`}>
                                        {minimumStake}
                                    </p>
                                </div>
                            </div>
                            <div className="row mx-auto mt-2">
                                <div className="col-6 px-0">
                                    <div className="row mx-auto"  >
                                        <div className="col-2 px-0">
                                            <FaPeopleArrows className={`mb-2  ${styles.stakeLabelIcons}`} fontSize={15} />
                                        </div>
                                        <div className="col-10 px-0">
                                            <p className={`${styles.stakeLabel}`}>Claim Interval</p>
                                        </div>
                                    </div>
                                </div>
                                <div className="col-6 pe-0">
                                    <p className={`${styles.stakeValues} text-end`}>
                                        {days} Days
                                    </p>
                                </div>
                            </div>
                            <div className="row mx-auto mt-2">
                                <div className="col-6 px-0">
                                    <div className="row mx-auto"  >
                                        <div className="col-2 px-0">
                                            <FaCubes className={`mb-2  ${styles.stakeLabelIcons}`} />
                                        </div>
                                        <div className="col-10 px-0">
                                            <p className={`${styles.stakeLabel}`}>Subscribers</p>
                                        </div>
                                    </div>
                                </div>
                                <div className="col-6 pe-0">
                                    <p className={`${styles.stakeValues} text-end`}>{stakers}</p>
                                </div>
                            </div>
                        </div>
                        <div className={`${styles.stakeCardListButtonWrapper}`}>
                            <div className="">
                                <p className={`${styles.stakeLabel}`}><GiTwoCoins className={`me-2 mb-1 ${styles.stakeLabelIcons}`} fontSize={19} />
                                    Interest <span>Earned</span></p>
                                <div className="d-flex flex-wrap align-items-center justify-content-between gap-4 mt-1">
                                    <div>
                                        <p className={`${styles.stakeValuesBold}`}>{stakeEarned}</p>
                                        <p className={`${styles.stakeLabel}`}>
                                            {title}
                                        </p>
                                    </div>
                                    {
                                        stakeEarned &&
                                        <button aria-label='claim' className={`${styles.primaryButtonSm}`}
                                            onClick={() => setShowClaimDetails(true)}
                                        > Claim </button>
                                    }

                                </div>
                            </div>
                        </div>
                        <div className={`${styles.stakeCardListButtonWrapper}`}>
                            <p className={`${styles.stakeLabel}`}>
                                Stake to enjoy more rewards & benefit!
                            </p>
                            <div className='mt-4'>
                                <button
                                    aria-label='unStake'
                                    className={`${styles.primaryButton} ${styles.unstake}`}
                                    onClick={
                                        // setUnstakeShow(true)
                                        unstakebtn
                                    }
                                >
                                    <LiaLayerGroupSolid className="" fill="#fff" fontSize={20} />
                                    UnStake
                                </button>
                            </div>
                        </div>
                    </div>
                }
            </div>
        </div>
    )
})

export default StakeProfileList