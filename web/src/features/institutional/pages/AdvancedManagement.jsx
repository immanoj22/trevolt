import React from 'react';
import styles from '../styles/institutionalDashboard.module.css';
import Images from '../../../utils/Images';
import ReactDatatable from "react-data-table-component";
import TableNoData from '../../../components/TableNoData/TableNoData';
import Button from '../../../components/Button/Button';
import { FaPlus } from "react-icons/fa6";
import { useNavigate } from 'react-router-dom';

const AdvancedManagement = () => {

    const navigate = useNavigate();

    const assetColumns = [
        {
            name: 'S.No',
            // selector: row => row.symbol,
            align: "left",
            // width: "100px",
            selector: (record, index) => {
                return (
                    <>
                        <p>{index + 1}</p>
                    </>

                );
            }
        },
        {
            name: 'name',
            selector: row => row.name,
            align: "center",
            // width: "150px",
        },

        {
            name: 'email',
            selector: row => row.email,
            align: "center",
            // width: "150px",
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
                            btnText="View"
                            className="themeTransparent_btn"
                            onClick={() => navigate('/institutional/user-details')}
                        />
                    </>
                );
            }
        },
    ];

    const data = [
        {
            id: 1,
            name: 'xxxx',
            email: "xxx@gmail.com"
        }
    ];

    return (
        <div className={styles.InstitutionalSubAccount}>

            <div className={""}>
                <div className='d-flex align-items-center justify-content-between gap-3 flex-wrap'>
                    <div>
                        <h5 className={styles.pageTitle}>
                            User Details
                        </h5>
                        {/* <p className={styles.subTitle + " mt-3"}>
                            Enforce operational safety across traders and accounts
                        </p> */}
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

export default AdvancedManagement;