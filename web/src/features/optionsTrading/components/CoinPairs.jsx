

/** PACKAGE IMPORT */

import React, { useState } from 'react'
import { IoIosStar } from "react-icons/io";

/** LOCAL FILES IMPORT */

import styles from "../styles/coinPairs.module.css"
import { SearchInput } from '../../../components/Input/InputFields'
import NoData from '../../../components/NoData/NoData'

/** CODE START */

const CoinPairs = () => {


    const [searchValue, setSearchValue] = useState('')
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
        { id: 1 },
        { id: 1 },
        { id: 1 },
        { id: 1 },
        { id: 1 },
        { id: 1 },
    ])
    const [selectTab, setSelectTab] = useState('watchlist')

    const handleSearch = (e) => {
    }


    return (
        <div>
            <div className={styles.header}>
                <div className={styles.headerTop}>
                    <SearchInput
                        type={"text"}
                        error={null}
                        onChange={handleSearch}
                        disabled={false}
                        placeholder={"Search"}
                        value={searchValue}
                        name={"tableSearch"}
                        className={"defaultSearch"}
                        readOnly={false}
                        showSearchIcon={true}
                    />
                </div>

                <div className={styles.headerTabs}>
                    <button
                        aria-label='watchList'
                        className={`${selectTab == 'watchlist' ? styles.active : ""}`}
                        onClick={() => setSelectTab('watchlist')}>Watchlist</button>
                    <button
                        aria-label='futures'
                        className={`${selectTab == 'futures' ? styles.active : ""}`}
                        onClick={() => setSelectTab('futures')}>Futures</button>
                    <button
                        aria-label='trackers'
                        className={`${selectTab == 'trackers' ? styles.active : ""}`}
                        onClick={() => setSelectTab('trackers')}>Trackers</button>
                </div>
            </div>

            <div className={styles.body}>
                <div className={styles.tableSection}>
                    <div className="sticky-table__ht-sm">
                        <table className="table">
                            <thead>
                                <tr>
                                    <th className="text-start">Name</th>
                                    <th className="text-end ">Last Price</th>
                                    <th className="text-end">24 Chg.</th>
                                    <th className="text-end ">24h Vol.</th>
                                </tr>
                            </thead>
                            <tbody>

                                {tableData.length > 0 ?
                                    tableData.map((record) => (

                                        <tr>
                                            <td className="text-start ">
                                                <div className='table-flexStart'>
                                                    {/* dynamic class for active - styles.active : "" */}
                                                    <button data-click-effect="none" aria-label='starIcon' className={`${styles.markFavorite}`} >
                                                        <IoIosStar />
                                                    </button>
                                                    <div>
                                                        <div className='table-flexStart'>EURUSD <span className='table-badge__xs'>100</span></div>
                                                        {/* <p className='table-value__light-xs '>CARDANO Perpetual</p> */}
                                                    </div>
                                                </div>

                                            </td>
                                            <td className="text-end ">
                                                <p className={`table-value__profit`}>$118479.9</p>
                                            </td>
                                            <td className="text-end ">

                                                {/*  dynamic class - 'table-value__profit' || 'table-value__loss' */}

                                                <p className={`table-value__profit`}>54668.5</p>
                                            </td>
                                            <td className="text-end ">
                                                <p>118857.3</p>
                                            </td>
                                        </tr>
                                    ))
                                    :
                                    <></>
                                }
                            </tbody>
                        </table>
                    </div>

                    {!tableData.length ? <div className={styles.noDataContainer}>
                        <NoData content={"Watchlist is Empty"} />
                    </div> : <></>}



                </div>

            </div>
        </div>
    )
}

export default CoinPairs
