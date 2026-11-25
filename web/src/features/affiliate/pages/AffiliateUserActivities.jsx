/** PACKAGE IMPORT */

import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import ReactDatatable from "react-data-table-component";

/** LOCAL FILES IMPORT */

import styles from "../styles/affiliateUserActivities.module.css";

import Button from "../../../components/Button/Button";
import TableNoData from "../../../components/TableNoData/TableNoData";
import Images from "../../../utils/Images";

/** CODE START */

const AffiliateUserActivities = () => {
  const navigate = useNavigate();
  const tableScrollRef = useRef(null);

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
      name: "S.No",
      selector: (row) => row.id,
      align: "left",
      // width: "200px",
      // selector: (record) => {
      //     return (
      //         <p>1</p>
      //     );
      // }
    },
    {
      name: "loginDevice",
      selector: (row) => row.loginDevice,
      align: "left",
      // width: "150px",
      // selector: (record) => {
      //     return (
      //         <p>Chrome 10 104.0.0.0 (Mac OS X)</p>
      //     );
      // }
    },
    {
      name: "loginTime",
      selector: (row) => row.loginTime,
      align: "right",
      // width: "450px",
      // selector: (record) => {
      //     return (
      //         <p className=''>
      //             2025-07-21  03:03:56
      //         </p>
      //     );
      // }
    },
    {
      name: "loginLocation",
      selector: (row) => row.loginLocation,
      align: "left",
      // width: "200px",
      // selector: (record) => {
      //     return (
      //         <p>Unknow</p>
      //     );
      // }
    },
    {
      name: "IP Address",
      selector: (row) => row.ipAddress,
      align: "left",
      // width: "150px",
      // selector: (record) => {
      //     return (
      //         <p>100.0210.02121</p>
      //     );
      // }
    },
    {
      name: "Time",
      selector: (row) => row.Time,
      align: "left",
      // width: "150px",
      // selector: (record) => {
      //     return (
      //         <div className='d-flex align-items-center gap-2'>
      //             <span className={styles.isOnline}></span>
      //             <p>Online</p>
      //         </div>
      //     );
      // }
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
        <h5 className={styles.pageTitle}>Account Activities</h5>
      </div>
      <section className={` margin-top__xl`}>
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
  );
};

export default AffiliateUserActivities;
