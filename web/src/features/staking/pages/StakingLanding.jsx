

/** PACKAGE IMPORT */

import React, { useEffect, useState } from "react";
// import Lottie from "lottie-react";
import { useSelector } from "react-redux";
import ReactDatatable from "react-data-table-component";
import { FaArrowRight, FaList } from "react-icons/fa";
import { RiLayoutGrid2Fill } from "react-icons/ri";
import Select from 'react-select'
import { FaSortDown } from "react-icons/fa";
import { FiSearch } from "react-icons/fi";
import { FaBoxOpen } from "react-icons/fa6";
import isEmpty from "is-empty";
import { FaAngleDown, FaAngleUp, FaSortUp } from "react-icons/fa6";


/** LOCAL FILES IMPORT */

import styles from "../styles/stakingLanding.module.css"
// import Header from "../Layout/Header";
// import Footer from "../Layout/Footer";
// import bannerJson from "../asset/json/stake.json";
// import StakeCard from "../card/StakeCard";
import Images from "../../../utils/Images";
import Button from "../../../components/Button/Button";
import { SearchInput } from "../../../components/Input/InputFields";
import StakeProfileCard from "../components/StakeProfileCard";
import TableNoData from "../../../components/TableNoData/TableNoData";
import RewardInstruction from "../modal/RewardInstruction";
import StakeProfileList from "../components/StakeProfileList";
// import StakeCardList from "../card/StakeCardList";
// import { momentFormat } from "../lib/dateTimeHelper";
// import { toCutOff } from "../lib/Calculationlib";
// import ParticipateCard from "../components/ParticipateCard";

/** ACTIONS */

// import { poolsDetails, stakingCurrency, stakingTranscationDetails, stakingUser } from "../actions/stakingAction";
// import { getCms } from "../actions/cmsAction";
// import { stakingPools, stakingCurrencies } from "../actions/stakingRedexAction";

/** CONFIG */

/** CODE START */

const stakingProfileData = [
    {
        img: Images.tp1,
        title: 'BNB',
        description: 'Earn flexible interest on ETH',
        days: 10,
        apy: 2,
        stakeEarned: '0.00000072727',
        stakeButton: 'Redeem',
        claimInterval: 2,
        minimumStake: '0.01 ETH',
        totalStaked: '4.231 ETH',
        stakers: 3,
    },
    {
        img: Images.tp2,
        title: 'BNB',
        description: 'Earn flexible interest on ETH',
        days: 10,
        apy: 2,
        stakeEarned: '0.00000072727',
        stakeButton: 'Subscribe',
        claimInterval: 2,
        minimumStake: '0.01 ETH',
        totalStaked: '4.231 ETH',
        stakers: 3,
    },
    {
        img: Images.tp3,
        title: 'BNB',
        description: 'Earn flexible interest on ETH',
        days: 10,
        apy: 2,
        stakeEarned: '0.00000072727',
        stakeButton: 'Redeem',
        claimInterval: 2,
        minimumStake: '0.01 ETH',
        totalStaked: '4.231 ETH',
        stakers: 3,
    },
    {
        img: Images.tp1,
        title: 'BNB',
        description: 'Earn flexible interest on ETH',
        days: 10,
        apy: 2,
        stakeEarned: '0.00000072727',
        stakeButton: 'Subscribe',
        claimInterval: 2,
        minimumStake: '0.01 ETH',
        totalStaked: '4.231 ETH',
        stakers: 3,
    },
]

const StakingLanding = () => {
    //   const { pools } = useSelector((state) => state.staking);
    //   const { getUser } = useSelector((state) => state.user);
    const htmlTagPattern = /<[^>]*>/; // Matches any HTML tag

    const [tokenTabs, setTokenTabs] = useState(1);
    const [count, setCount] = useState(0);
    const [limit, setLimit] = useState(10);
    const [page, setPage] = useState(1);
    const [stakePage, setStakePage] = useState(1);
    const [totalCount, setTotalcount] = useState(0);
    const [records, setRecords] = useState([]);
    const [stakeView, setStakeView] = useState("Grid");
    const [stakeStatus, setStakeStatus] = useState("Finished");
    const [showFilterData, setShowFilterData] = useState(false);
    const [cmsData, setCmsData] = useState("");
    const [filterData, setFilterData] = useState({
        stakeOnly: false,
        sortData: "none",
        search: ""
    })
    const [showRewardInstruction, setShowRewardInstruction] = useState(false);
    const [rewardData, setRewardData] = useState(null);

    const rewardDetailsHandle = (data) => {
        if (data) {
            setRewardData(data);
            setShowRewardInstruction(true);
        } else {
            setRewardData(null);
            setShowRewardInstruction(false);
        }
    }

    const handleTokenTabs = (getId) => {
        setTokenTabs(getId);
    };

    let columns = [
        {
            key: "Currency",
            text: "Currency",
            width: 150,
            className: "text-start ",
            align: "start",
            sortable: false,
            cell: (record) => {
                return <p className="text-start">{record.currency.currencySymbol}</p>;
            },
        },
        {
            key: "Type",
            text: "Type",
            className: "text-end ",
            align: "end",
            width: 150,
            sortable: false,
            cell: (record) => {
                return <p>{record?.type?.toUpperCase()}</p>;
            },
        },
        {
            key: "Amount",
            text: "Amount",
            className: "text-end ",
            align: "end",
            width: 150,
            sortable: false,
            cell: (record) => {
                return <p>{toCutOff(record?.amount, record?.currency?.pip)}</p>;
            },
        },
        {
            key: "Date",
            text: "Date",
            className: "text-end ",
            width: 150,
            align: "end",
            sortable: false,
            cell: (record) => {
                return <p>{momentFormat(record?.createdAt)}</p>;
            },
        },
    ];

    let config = {
        page_size: 10,
        length_menu: [10, 20, 50],
        button: {
            excel: false,
            print: false,
        },
        show_pagination: true,
        show_info: false,
        show_length_menu: false,
        show_filter: false,
    };

    const getCmsData = async () => {
        try {
            const getData = await getCms({ page: "Staking" });
            if (getData.status) {
                setCmsData(getData.data.data)
            }
        } catch (e) {
            console.log("getCmsData_err", e);
        }
    }

    const getCurrency = async () => {
        try {
            const currency = await stakingCurrency();
            if (currency.status) {
                stakingCurrencies(currency.data);
            }
        } catch (e) {
            console.log("getCurrency_err", e);
        }
    };

    const handlePagination = async (index) => {
        setPage(index.page_number)
        setLimit(index.page_size)
        let reqData = { limit: index.page_size, page: index.page_number, filterData: filterData }
        fetchStakingTranscationList(reqData)
    }

    useEffect(() => {
        window.scrollTo({
            top: 0,
            behavior: "smooth",
        });
    }, []);

    return (
        <>
            <main className={styles.landing}>
                <section className={styles.stakingLanding}>
                    <div className="custom-container container">
                        <div className={`${styles.bannerRow} row align-items-center`}>
                            <div className="col-lg-5">
                                <div className={styles.bannerLeft}>
                                    <h1 className={`${styles.bannerTitleXl} text-center text-lg-start`}>
                                        Grow Your Balance with Trevolt Earn!
                                    </h1>
                                    <p className={`${styles.bannerDescription} text-center text-lg-start`}>
                                        Subscribe to flexible or locked Earn products on USD, EUR and gold (XAU), held in Trevolt's cold-storage custody with daily interest.
                                    </p>
                                </div>
                            </div>
                            <div className="col-lg-7 mt-5 mt-lg-0">
                                <div className={styles.bannerRight}>
                                    <img src={Images.stakingBanner} alt="Staking Banner" />
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
                                <h5 className={styles.rewardTitle}>Trevolt VIP Program - Lower Trading Fees for Verified Traders</h5>
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
                                        onClick={() => setShowRewardInstruction(true)}
                                    >
                                        <FaArrowRight />
                                    </button>
                                </div>
                                <RewardInstruction show={showRewardInstruction} rewardData={rewardData} handleClose={() => rewardDetailsHandle()} />
                            </div>
                        </div>
                        <h4 className={`${styles.landingHead} mt-5`}>Explore Trevolt Earn Products</h4>
                        <p className={`${styles.rewardLabelDesc} mt-2`}>Subscribe to flexible or locked Earn products on USD, EUR and gold (XAU), held in Trevolt's cold-storage custody with daily interest.</p>
                        <div className={styles.stakeControls}>
                            <div className={styles.stakeControlsLeft}>
                                <div className={styles.stakeControlsActions}>
                                    <button
                                        aria-label="layoutGrid"
                                        className={` ${stakeView === "Grid" ? styles.active : ""}`}
                                        onClick={() => setStakeView("Grid")}
                                    >
                                        <RiLayoutGrid2Fill fontSize={19} />
                                    </button>
                                    <button
                                        aria-label="list"
                                        className={`${stakeView === "List" ? styles.active : ""}`}
                                        onClick={() => setStakeView("List")}
                                    >
                                        <FaList />
                                    </button>
                                </div>

                                <div className={styles.stakeToggle}>
                                    <div className="custom-checkInput__container">
                                        <label className="custom-checkInput__label">
                                            <input type="checkbox"
                                                onChange={(e) => { setFilterData({ ...filterData, ...{ 'stakeOnly': e.target.checked } }) }}
                                            />
                                            <span className="custom-checkInput__checkmark"></span>
                                        </label>
                                        <p className="asset_checkbox_p">
                                            Staked Only
                                        </p>
                                    </div>
                                </div>
                            </div>
                            <div className={styles.stakeControlsRight}>
                                <div className={styles.stakeFilterContainer}>
                                    <label className={styles.stakeFilterLabel}>Sort By</label>
                                    <div className={`react-select__width-sm`}>
                                        <Select
                                            isSearchable={false}
                                            placeholder="All Position"
                                            classNamePrefix="react-select__primary"
                                        // options={positionOptions}
                                        />
                                    </div>
                                </div>
                                <div className={styles.stakeSearchContainer}>
                                    <label className={styles.stakeSearchLabel}>Search</label>
                                    <SearchInput
                                        type={"text"}
                                        error={null}
                                        // onChange={handleSearch}
                                        disabled={false}
                                        placeholder={"Search"}
                                        value={""}
                                        name={"tableSearch"}
                                        className={"secondarySearch"}
                                        readOnly={false}
                                        showSearchIcon={true}
                                    />
                                </div>
                            </div>
                        </div>
                        {stakeView === 'Grid' ? (
                            <div className={styles.stakeProfileGrids}>
                                {stakingProfileData.map((item, index) => (
                                    <div>
                                        <StakeProfileCard item={item} key={index} />
                                    </div>
                                ))}
                            </div>
                        ) :
                            (
                                <div className={`${styles.stakeCardSingleList}mt-4`}>
                                    {stakingProfileData.map((item, index) => (
                                        <div>
                                            <StakeProfileList item={item} key={index} />
                                        </div>
                                    ))}
                                </div>
                            )
                        }

                        <div className={styles.loadMore}>
                            <Button
                                isLoading={false}
                                // loadingText="Redirecting..."
                                btnText="Load More"
                                // onClick={handleStartTrading}
                                className="primaryBtn"
                            // selectedValue={currentResult}
                            />
                        </div>

                    </div>
                </section>
                <section className={`${styles.stakingHistoryBG} py-5`}>
                    <div className="container custom-container">
                        <div>
                            <h4 className={styles.landingHead}>Earn History</h4>
                        </div>
                        <div className="custom-table__secondary mt-3">
                            <ReactDatatable
                                // columns={columns}
                                // data={tableData}
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
                </section>
            </main>
        </>
    );
};

export default StakingLanding;
