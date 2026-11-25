/** PACKAGE IMPORT */

import React, { useState } from "react";
import { IoClose } from "react-icons/io5";
import { GoShareAndroid } from "react-icons/go";
import { FaPlus, FaMinus } from "react-icons/fa6";

/** LOCAL FILES IMPORT */

import styles from '../styles/tradeTable.module.css'
import Button from "../../../components/Button/Button";
import NoData from "../../../components/NoData/NoData";


/** CODE START */

const OrderHistory = () => {

    const [selectedTab, setSelectedTab] = useState('all')

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
    return (
        <div>


            <div className={styles.headerTabs}>
                <button
                    aria-label="all"
                    className={`${styles.headerTabsButton} ${selectedTab == 'all' ? styles.active : ""}`}
                    onClick={() => setSelectedTab('all')}>
                    All
                </button>
                <button
                    aria-label="currentContract"
                    className={`${styles.headerTabsButton} ${selectedTab == 'currentContract' ? styles.active : ""}`}
                    onClick={() => setSelectedTab('currentContract')}>
                    Current Contract
                </button>
                <button
                    aria-label="options"
                    className={`${styles.headerTabsButton} ${selectedTab == 'options' ? styles.active : ""}`}
                    onClick={() => setSelectedTab('options')}>
                    Options
                </button>
                <button
                    aria-label="futures"
                    className={`${styles.headerTabsButton} ${selectedTab == 'futures' ? styles.active : ""}`}
                    onClick={() => setSelectedTab('futures')}>
                    Futures
                </button>
            </div>

            <div>
                <div className={styles.tableSection}>
                    <div className="sticky-table ">
                        <table className="table">
                            <thead>
                                <tr>
                                    <th className="text-start table-col__sticky-start ">
                                        <div className="table-flexStart ">
                                            <div className="custom-checkInput__container">
                                                <label className="custom-checkInput__label">
                                                    <input
                                                        type="checkbox"
                                                    />
                                                    <span className="custom-checkInput__checkmark"></span>
                                                </label>
                                            </div> <span>Symbol</span>
                                        </div>
                                    </th>
                                    <th className="text-end ">Size</th>
                                    <th className="text-end ">Notional</th>
                                    <th className="text-end">Entry Price</th>
                                    <th className="text-end ">TP / SL</th>
                                    <th className="text-end">Index Price</th>
                                    <th className="text-end">Mark Price</th>
                                    <th className="text-end">Est. Liq. Price</th>
                                    <th className="text-end">Margin</th>
                                    <th className="text-end">Auto Top-up</th>
                                    <th className="text-end">UPNL</th>
                                    <th className="text-end">Cashflows</th>
                                    <th className="text-end">Gross P/L</th>
                                    <th className="text-center table-col__sticky-end table-width__120" >Action</th>
                                </tr>
                            </thead>
                            <tbody>

                                {tableData.length > 0 ?
                                    tableData.map((record) => (

                                        <tr>
                                            <td className="text-start  table-col__sticky-start ">

                                                <div className="table-flexStart ">
                                                    <div className="custom-checkInput__container">
                                                        <label className="custom-checkInput__label">
                                                            <input
                                                                type="checkbox"
                                                            />
                                                            <span className="custom-checkInput__checkmark"></span>
                                                        </label>
                                                    </div> <span>EURUSD</span>
                                                </div>
                                            </td>
                                            <td className="text-end ">

                                                {/*  dynamic class - 'table-value__profit' || 'table-value__loss' */}

                                                <p className={`table-value__profit`}>
                                                    +0.10 Lot
                                                </p>
                                            </td>
                                            <td className="text-end ">
                                                <p>231.44 <span className="table-value__light">USD</span></p>
                                            </td>
                                            <td className="text-end ">
                                                <p>118857.3</p>
                                            </td>
                                            <td className="text-end ">
                                                <div className="table-flexEnd">
                                                    <Button
                                                        isLoading={false}
                                                        loadingText=""
                                                        btnText="Add"
                                                        onClick={() => {}}
                                                        className="badgeBtnXs"
                                                        selectedValue={null}
                                                        reactIconElement={<FaPlus />}
                                                    />
                                                </div>
                                            </td>
                                            <td className="text-end ">
                                                116251.7

                                            </td>
                                            <td className="text-end ">
                                                116281.5
                                            </td>
                                            <td className="text-end ">

                                                {/*  dynamic class - 'table-value__profit' || 'table-value__loss' */}

                                                <p className={`table-value__loss`}>54668.5</p>
                                                <p className="table-value__loss">-52.99%</p>

                                            </td>
                                            <td className="text-end ">
                                                <p>231.44 <span className="table-value__light">USD</span></p>
                                            </td>
                                            <td className="text-end ">
                                                <div className="custom-toggle__secondaryXs">
                                                    <label className="switch">
                                                        <input
                                                            type="checkbox"
                                                        />
                                                        <span className="slider round"></span>
                                                    </label>
                                                </div>
                                            </td>
                                            <td className="text-end ">

                                                {/*  dynamic class - 'table-value__profit' || 'table-value__loss' */}

                                                <p className={`table-value__loss`}>-4.89 USD</p>
                                                <p className="table-value__loss">-3.77%</p>
                                            </td>
                                            <td className="text-end ">
                                                <p>-0.86 <span className="table-value__light">USD</span></p>
                                            </td>
                                            <td className="text-end table-flexEnd">

                                                <button aria-label="value" className='borderLessButton table-flexEnd'>

                                                    {/*  dynamic class - 'table-value__profit' || 'table-value__loss' */}

                                                    <p className={`table-value__loss`}>-4.89 USD</p>
                                                    <span>
                                                        <GoShareAndroid />
                                                    </span>

                                                </button>

                                            </td>

                                            <td className="table-col__sticky-end table-width__120">
                                                <div className={`table-flexCenter`}>

                                                    <Button
                                                        isLoading={false}
                                                        loadingText=""
                                                        btnText=""
                                                        onClick={() => {}}
                                                        className="dangerOuterlineButtonXs"
                                                        selectedValue={null}
                                                        reactIconElement={<IoClose />}
                                                    />
                                                </div>
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
                        <NoData content={"No Order History"} />
                    </div> : <></>}



                </div>

                {tableData.length > 5 ?
                    <div className={styles.loadMoreContainer}>
                        <Button
                            isLoading={false}
                            loadingText="Loading..."
                            btnText="Load More"
                            onClick={() => {}}
                            className="cardBtnRectangleXs"
                            selectedValue={null}
                        />
                    </div> : <></>}

            </div>
        </div>
    )
}

export default OrderHistory