import React, { useState } from 'react';
import styles from '../styles/institutionalDashboard.module.css';
import Images from '../../../utils/Images';
import ReactDatatable from "react-data-table-component";
import TableNoData from '../../../components/TableNoData/TableNoData';
import Button from '../../../components/Button/Button';
import { FaPlus } from "react-icons/fa6";
import { useNavigate } from 'react-router-dom';

const LoginHistory = (props) => {

    const navigate = useNavigate();

    const Columns = [
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
        <div className="custom-table__secondary subAccount_table mt-4">
            <ReactDatatable
                columns={Columns}
                data={data}
                pagination
                paginationPerPage={10}
                paginationRowsPerPageOptions={[5, 10, 15, 20, 50, 100]}
                className="dataTableComponent"
                noDataComponent={<TableNoData />}
            />
        </div>
    )
}

export default LoginHistory;