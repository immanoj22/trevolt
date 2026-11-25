import React from 'react';
import styles from '../styles/institutionalDashboard.module.css';
import Images from '../../../utils/Images';
import ReactDatatable from "react-data-table-component";
import TableNoData from '../../../components/TableNoData/TableNoData';
import Button from '../../../components/Button/Button';
import { FaPlus } from "react-icons/fa6";
import { useNavigate } from 'react-router-dom';

const RiskManagement = () => {

    const navigate = useNavigate();

    const assetColumns = [
        {
            name: 'S.No',
            // selector: row => row.symbol,
            align: "left",
            width: "100px",
            selector: (record, index) => {
                return (
                    <>
                        <p>{index + 1}</p>
                    </>

                );
            }
        },
        {
            name: 'Sub Account',
            selector: row => row.subAccount,
            align: "center",
            // width: "150px",
        },
        {
            name: 'Max Position Size',
            selector: row => row.size,
            align: "center",
            // width: "150px",
        },
        {
            name: 'Main ID',
            selector: row => row.email,
            align: "center",
            // width: "150px",
        },
        {
            name: 'Active Status',
            // selector: row => row.gains,
            align: "center",
            // width: "130px",
            selector: (record) => {
                return (
                    <>
                        <div className="custom-toggle__primary active_statusToggle notificationToggle">
                            <label className="switch">
                                <input
                                    type="checkbox"
                                />
                                <span className="slider round"></span>
                            </label>
                        </div>
                    </>
                );
            }
        },

        {
            name: 'Action',
            // selector: row => row.gains,
            align: "center",
            // width: "130px",
            selector: (record) => {
                return (
                    <>
                        <Button
                            isLoading={false}
                            loadingText="Redirecting..."
                            btnText="Remove"
                            className="themeTransparent_btn"
                        />
                    </>
                );
            }
        },
    ];

    const data = [
        {
            id: 1,
            subAccount: '785694',
            size: 30,
            email: "xxx@gmail.com"
        }
    ];

    return (
        <div className={styles.InstitutionalSubAccount}>

            <div className={""}>
                <div className='d-flex align-items-center justify-content-between gap-3 flex-wrap'>
                    <div>
                        <h5 className={styles.pageTitle}>
                            Risk Management
                        </h5>
                        <p className={styles.subTitle + " mt-3"}>
                            Enforce operational safety across traders and accounts
                        </p>
                    </div>
                </div>

                <div className="custom-table__secondary subAccount_table mt-4">
                    <ReactDatatable
                        columns={assetColumns}
                        data={data}
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
        </div>
    )
}

export default RiskManagement;