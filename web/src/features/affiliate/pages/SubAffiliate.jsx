/** PACKAGE IMPORT */

import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import ReactDatatable from "react-data-table-component";

/** LOCAL FILES IMPORT */

import styles from "../styles/subAffiliate.module.css";

import Button from "../../../components/Button/Button";
import NoData from "../../../components/NoData/NoData";
import TableNoData from "../../../components/TableNoData/TableNoData";
import Images from "../../../utils/Images";

/** CODE START */

const SubAffiliate = () => {
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
      name: "userID",
      selector: (row) => row.userID,
      align: "left",
      // width: "150px",
      // selector: (record) => {
      //     return (
      //         <p>785694</p>
      //     );
      // }
    },
    {
      name: "KYCStatus",
      selector: (row) => row.KYCStatus,
      align: "right",
      // width: "450px",
      // selector: (record) => {
      //     return (
      //         <p className=''>
      //             Completed
      //         </p>
      //     );
      // }
    },
    {
      name: "activeStatus",
      selector: (row) => row.activeStatus,
      align: "left",
      // width: "200px",
      // selector: (record) => {
      //     return (
      //         <p>Active</p>
      //     );
      // }
    },
    {
      name: "commission",
      selector: (row) => row.commission,
      align: "left",
      // width: "150px",
      // selector: (record) => {
      //     return (
      //         <p>0 INR</p>
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
        <h5 className={styles.pageTitle}>Sub Affiliate</h5>
        <div className="d-flex gap-2 align-items-center gap-2">
          <button
            data-click-effect="none"
            aria-label="filterIcon"
            className={styles.exportBtn}
          >
            <img src={Images.filterIcon} alt="filterIcon" />
          </button>
          <Button
            isLoading={false}
            loadingText="Redirecting..."
            btnText="Back"
            onClick={() => navigate(-1)}
            className="invertFillRectangleBtnXs"
            selectedValue={null}
          />
        </div>
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
export default SubAffiliate;
