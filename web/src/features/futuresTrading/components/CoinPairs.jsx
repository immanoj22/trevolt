

/** PACKAGE IMPORT */

import React, { useState, useEffect } from 'react'
import { IoIosStar, IoIosStarOutline } from "react-icons/io";
import { IoCloseSharp } from "react-icons/io5";

import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import isEmpty from 'is-empty';
/** LOCAL FILES IMPORT */

import styles from "../styles/coinPairs.module.css"
import { SearchInput } from '../../../components/Input/InputFields'
import NoData from '../../../components/NoData/NoData'
import { formatDisplayPair } from '../../../lib/pairDisplay'

/** REDUX */
import { FutureTicker, FutureTradePair } from '../../../redux/futureAction';
import { futureAddFavouritePair } from '../../../actions/futureActions';
import { showToastMessage } from '../../../lib/toast';
import { UpdateTab } from '../../../actions/userAction';

/** CODE START */

const CoinPairs = (props) => {
    const navigate = useNavigate();
    const dispatch = useDispatch();

    const { userdetails } = useSelector((state) => state.user);
    const { futurePairData } = useSelector((state) => state.future);

    const [selectTab, setSelectTab] = useState('futures')
    const [pairData, setPairData] = useState([]);
    const [pairSearch, setPairSearch] = useState("");



    const addFavourite = async (e, data) => {
        try {
            e.stopPropagation()
            const { status, message } = await futureAddFavouritePair({ pairId: data._id, pairName: data.tickerRoot }, userdetails.secretKey);
            showToastMessage(message, status ? 'success' : 'error')
        } catch (e) {
            console.log("addFavourite_err", e);
        }
    }

    const handlePairSearch = (e) => {
        try {
            const query = e.target.value;
            setPairSearch(query);
            let regx = new RegExp(query, "i");

            if (futurePairData && futurePairData.length > 0) {
                if (!isEmpty(query)) {
                    let FilterData = futurePairData.filter((val) => {
                        if (val?.tradeMode == "future") {
                            let pairName = val.baseCurrency + "/" + val.quoteCurrency
                            return pairName.match(regx);
                        }
                    });
                    setPairData(FilterData);
                } else {
                    let filterData = futurePairData.filter((el) => el.tradeMode == "future");
                    setPairData(filterData);
                }
            }
        } catch (err) {
            console.log(err, 'handlePairSearch__err')
        }
    };

    const handlePairChange = (val) => {
        try {
            let pair = val.tickerRoot;
            let pairDetail = futurePairData.find((el) => el.tickerRoot == val.tickerRoot);
            localStorage.setItem("futurespair", pair);
            dispatch(FutureTradePair({ tradePair: pairDetail }));
            dispatch(FutureTicker({ tikerData: pairDetail }));
            navigate("/futures/" + pair, { replace: true });
            props?.handleCoinPairs()
        } catch (err) {
            console.log(err, "handlePairChange__err");
        }
    };

    useEffect(() => {
        if (!isEmpty(futurePairData)) {
            // console.log("futurePairData", futurePairData)
            if (!isEmpty(pairSearch)) {
                let regx = new RegExp(pairSearch, "i");
                let FilterData = futurePairData.filter((val) => {
                    if (val?.tradeMode == "future") {
                        let pairName = val.baseCurrency + val.quoteCurrency;
                        return pairName.match(regx);
                    }
                });
                setPairData(FilterData);
            } else {
                let filterData = futurePairData.filter((el) => el.tradeMode == "future");
                setPairData(filterData);
            }
        }
    }, [futurePairData]);

    const favouritePairNames = (userdetails?.futureFav || []).map((el) => el.pairName);
    const displayData = selectTab === 'watchlist'
        ? pairData.filter((record) => favouritePairNames.includes(record.tickerRoot))
        : pairData;

    return (
        <div>
            <div className={styles.header}>
                {/* <div className={styles.headerTop}>
                    <SearchInput
                        type={"text"}
                        error={null}
                        onChange={handlePairSearch}
                        disabled={false}
                        placeholder={"Search"}
                        value={pairSearch}
                        name={"tableSearch"}
                        className={"defaultSearch"}
                        readOnly={false}
                        showSearchIcon={true}
                    />
                    <button className={styles.close_btn} onClick={() => { props?.handleCoinPairs() }}>
                        <IoCloseSharp />
                    </button>
                </div> */}

                <div className={`d-flex gap-2 align-item-end justify-content-between m-1 ${styles.headerTabs}`}>
                    <div >
                        <button
                            aria-label='futures'
                            className={`${selectTab == 'futures' ? styles.active : ""}`}
                            onClick={() => setSelectTab('futures')}>
                            Futures
                        </button>
                        <button
                            className={`${selectTab == 'watchlist' ? styles.active : ""}`}
                            onClick={() => setSelectTab('watchlist')}>
                            Watchlist
                        </button>
                        {/* <button
                        className={`${selectTab == 'trackers' ? styles.active : ""}`}
                        onClick={() => setSelectTab('trackers')}>Trackers</button> */}
                    </div>
                    <div className='d-flex gap-3'>
                        <SearchInput
                            type={"text"}
                            error={null}
                            onChange={handlePairSearch}
                            disabled={false}
                            placeholder={"Search"}
                            value={pairSearch}
                            name={"tableSearch"}
                            className={"defaultSearch"}
                            readOnly={false}
                            showSearchIcon={true}
                        />
                        <button className={`${styles.close_btn} m-0`} onClick={() => { props?.handleCoinPairs() }}>
                            <IoCloseSharp size={15} />
                        </button>
                    </div>
                </div>
            </div>

            <div className={styles.body}>
                <div className={styles.tableSection}>
                    <div className="sticky-table__ht-sm">
                        <table className="table">
                            <thead>
                                <tr>
                                    <th className="text-center">Name</th>
                                    <th className="text-center ">Last Price</th>
                                    <th className="text-center">24 Chg.</th>
                                    <th className="text-center ">24h Vol.</th>
                                </tr>
                            </thead>
                            <tbody>

                                {displayData.length > 0 ?
                                    displayData.map((record) => (

                                        <tr key={record._id} onClick={() => { handlePairChange(record) }}>
                                            <td className="text-center">
                                                <div className='table-flexStart'>
                                                    <button aria-label='star' data-click-effect="none" className={`${styles.markFavorite} ${userdetails?.futureFav?.some((el) => el.pairName === record.tickerRoot) ? styles.active : ''}`} onClick={(e) => { addFavourite(e, record) }}>
                                                        {userdetails && userdetails?.futureFav?.some((el) => el.pairName === record.tickerRoot) ?
                                                            <IoIosStar /> : <IoIosStarOutline />
                                                        }
                                                    </button>
                                                    <div>
                                                        <div className='table-flexStart'>{formatDisplayPair(record.tickerRoot)} <span className='table-badge__xs'>{record.marketPrice.toFixed(2)}</span></div>
                                                        {/* <p className='table-value__light-xs '>CARDANO Perpetual</p> */}
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="text-center ">
                                                <p className={record.last > 0 ? `table-value__profit` : 'table-value__loss'}>{record.last}</p>
                                            </td>
                                            <td className="text-center ">

                                                {/*  dynamic class - 'table-value__profit' || 'table-value__loss' */}

                                                <p className={record.change > 0 ? `table-value__profit` : 'table-value__loss'}>{record.change}</p>
                                            </td>
                                            <td className="text-center ">
                                                <p>{record.volume}</p>
                                            </td>
                                        </tr>
                                    ))
                                    :
                                    <>
                                    </>
                                }

                            </tbody>
                        </table>
                        {!displayData.length ? <div className={`py-5 ${styles.noDataContainer}`}>
                            <NoData content={"No Record Found!"} />
                        </div> : <></>}
                    </div>




                </div>

            </div>
        </div>
    )
}

export default CoinPairs
