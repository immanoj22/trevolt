
/** PACKAGE IMPORT */

import React, { useEffect, useRef, useState } from 'react'
import { GiConfirmed } from 'react-icons/gi'
import { IoIosCloseCircleOutline } from 'react-icons/io'
import { IoWarningOutline } from 'react-icons/io5'
import { PiSealWarningFill } from 'react-icons/pi'
import { FaBoxOpen } from 'react-icons/fa6'
import isEmpty from 'is-empty'
import { useNavigate } from 'react-router-dom'
import { FaArrowLeft } from "react-icons/fa6";
import ReactDatatable from "react-data-table-component";

/** LOCAL FILES IMPORT */

import styles from "./styles/authInnerPage.module.css"
import Button from '../../components/Button/Button'
import NoData from '../../components/NoData/NoData'
import TableNoData from '../../components/TableNoData/TableNoData'

/** CODE START */

const ManageActivity = () => {

    const navigate = useNavigate()
    const tableScrollRef = useRef(null)


    // const [tableData, setTableData] = useState(['1', '2', '3', '4', '5', '6', '7', '8', '9', '10'])
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

    ]);
    const columns = [
        {
            name: 'Date',
            // selector: row => row.symbol,
            align: "left",
            width: "200px",
            selector: (record) => {
                return (
                    <p>11-07-2025 14:48:38</p>
                );
            }
        },
        {
            name: 'Source',
            // selector: row => row.difference,
            align: "left",
            // width: "150px",
            selector: (record) => {
                return (
                    <p>Web/chrome</p>
                );
            }
        },
        {
            name: 'IP Address',
            // selector: row => row.gains,
            align: "right",
            width: "450px",
            selector: (record) => {
                return (
                    // dynamic class - buy & sell
                    <p className=''>2001:4490:4e85:decd:ef81:a7dd:68c5:8ffd
                    </p>
                );
            }
        },
        {
            name: 'Location',
            // selector: row => row.gains,
            align: "left",
            width: "200px",
            selector: (record) => {
                return (
                    <p>Tamil Nadu / INDIA</p>
                );
            }
        },
        {
            name: 'Status',
            // selector: row => row.gains,
            align: "left",
            width: "150px",
            selector: (record) => {
                return (
                    <p>Success</p>
                );
            }
        },

    ];
    const [totalcount, setTotalCount] = useState(0);
    const [page, setPage] = useState(1);
    const [limit, setLimit] = useState(10);
    const [records, setRecords] = useState([]);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        window.scrollTo({
            top: 0,
            behavior: "smooth",
        });
    }, []);

    return (
        <div>
            <div className={styles.innerPageHeader}>
                <h5 className={styles.pageTitle}>Account Activity Records</h5>
                <Button
                    isLoading={false}
                    loadingText="Redirecting..."
                    btnText="Back"
                    onClick={() => navigate(-1)}
                    className="invertFillRectangleBtnXs"
                    selectedValue={null}
                />
            </div>
            <section
                className={` margin-top__xl`}>
                <div className="custom-table__secondary">
                    <ReactDatatable
                        columns={columns}
                        data={tableData}
                        pagination
                        paginationPerPage={10}
                        paginationRowsPerPageOptions={[5, 10, 15, 20, 50, 100]}
                        // customStyles={customStyles}
                        className="dataTableComponent"
                        // sortIcon={<BiSort style={{ marginLeft: "0.5rem", color: "#000" }} />}
                        noDataComponent={<TableNoData />}
                    />
                </div>
            </section>
        </div>
    )
}
export default ManageActivity