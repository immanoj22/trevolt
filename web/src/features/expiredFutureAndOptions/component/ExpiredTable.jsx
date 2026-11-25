/** PACKAGE IMPORT */

import React, { useState } from "react";
import { FaBoxOpen } from "react-icons/fa6";
import { FiSearch } from "react-icons/fi";
import ReactDatatable from "react-data-table-component";
import { useSelector } from "react-redux";
import { BsThreeDotsVertical } from "react-icons/bs";
import Select from "react-select";

/** LOCAL FILES IMPORT */

import styles from '../styles/expiredFutureAndOptions.module.css';
import TableNoData from "../../../components/TableNoData/TableNoData";
import { useEffect } from "react";
import Loader from "../../../components/Loader/Loader";
import Button from "../../../components/Button/Button";
import { toCutOff } from "../../../calculation/calculationlib";
import { getSubAccount } from "../../../actions/subAccountAction";
import isEmpty from "is-empty";
import { useGlobalContext } from "../../../context/GlobalProvider";
import { SearchInput } from "../../../components/Input/InputFields";
import Images from "../../../utils/Images";
/** Config */

/** ACTIONS */

/** CODE START */

const ExpiredTable = (props) => {
        const { theme } = useGlobalContext()
    const [type, setType] = useState("edit");
    const [searchQuery, setSearchQuery] = useState("");
    const [performanceFilterType, setPerformanceFilterType] = useState("All");

    const { convertValue, convertSecValue } = useGlobalContext();

    const options = [
        { value: "All", label: "All" },
        { value: "Futures", label: "Futures" },
        { value: "Straddle", label: "Straddle" },
        { value: "Call", label: "Call" },
        { value: "Put", label: "Put" },
    ];

    const assetColumns = [
        {
            name: (
                <div
                    style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        width: "100%",
                        gap: "10px",
                    }}
                >
                    <span>Ticker</span>

                    <div className="react-select__width-xs">
                        <Select
                            isSearchable={false}
                            placeholder="All"
                            classNamePrefix="react-select__primary"
                            options={options}
                            onChange={(e) => {
                                setPerformanceFilterType(e.value);
                            }}
                            value={
                                !isEmpty(performanceFilterType)
                                    ? options.find(
                                        (val) => val.value == performanceFilterType,
                                    )
                                    : ""
                            }
                        />
                    </div>
                </div>
            ),

            selector: (record) => (
                <p className="text-wrap">
                    {record.accountName}
                </p>
            ),

            align: "left",
            // width: "250px",
        },

        {
            name: "Contract Description",
            selector: (row) => row.accountId,
            align: "right",
        },

        {
            name: "Settlement Time",
            align: "right",
            selector: (record) => (
                <p className="text-capitalize">
                    {record.marginMode}
                </p>
            ),
        },

        {
            name: "Settlement Spot Price",
            align: "right",
            selector: (record) => (
                <p className="text-capitalize">
                    {record.marginMode}
                </p>
            ),
        },

        {
            name: "Settlement Price",
            align: "right",
            selector: (record) => (
                <p className="text-capitalize">
                    {record.marginMode}
                </p>
            ),
        },
    ];

    const { userdetails, subAccountList, wallet } = useSelector(
        (state) => state.user,
    );

    return (
        <>
            {/* modal import - end */}
            <div className={styles.subAccountCard}>
                <div className="d-flex gap-3 flex-wrap align-items-center justify-content-between">
                    <div>
                        <h3 className={`fs38 ${styles.whiteLabel}`}>
                            Settlement Prices
                        </h3>
                        <div className={`mt-4`}>
                            <SearchInput
                                type={"text"}
                                error={null}
                                // onChange={handleSearch}
                                disabled={false}
                                placeholder={"Search"}
                                value={searchQuery}
                                name={"tableSearch"}
                                className={"secondarySearch"}
                                readOnly={false}
                                showSearchIcon={true}
                            />
                        </div>
                    </div>
                    <div className={`${styles.headerRight}`}>
                        <img
                            src={theme == 'dark' ? Images.expiredFutureAndOption : Images. expiredFutureAndOptionLight}
                            alt="ExpiredFutureandOption"
                            className={styles.imgSectionFile}
                        />
                    </div>
                </div>

            </div>

            <div className="custom-table__secondary table_subAccount mt-4">
                <ReactDatatable
                    columns={assetColumns}
                    data={subAccountList}
                    // pagination
                    paginationPerPage={10}
                    paginationRowsPerPageOptions={[5, 10, 15, 20, 50, 100]}
                    // customStyles={customStyles}
                    className="dataTableComponent"
                    // sortIcon={<BiSort style={{ marginLeft: "0.5rem", color: "#000" }} />}
                    noDataComponent={<TableNoData />}
                />
            </div>
        </>
    );
};

export default ExpiredTable;
