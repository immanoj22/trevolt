import React, { useState } from 'react';
import styles from '../styles/institutionalDashboard.module.css';
import Images from '../../../utils/Images';
import ReactDatatable from "react-data-table-component";
import TableNoData from '../../../components/TableNoData/TableNoData';
import Button from '../../../components/Button/Button';
import { FaPlus } from "react-icons/fa6";
import { useNavigate } from 'react-router-dom';

const PassbookHistory = (props) => {

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
            name: 'coin',
            selector: row => row.coin,
            align: "center",
            // width: "150px",
        },

        {
            name: 'amount',
            selector: row => row.amount,
            align: "center",
            // width: "150px",
        },
        {
            name: 'Before Balance',
            selector: row => row.beforeBalance,
            align: "center",
            // width: "150px",
        },
        {
            name: 'afterBalance',
            selector: row => row.afterBalance,
            align: "center",
            // width: "150px",
        },
    ];


    const data = [
        {
            id: 1,
            coin: "xxx",
            amount: 0,
            beforeBalance: 0,
            afterBalance: 0
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

export default PassbookHistory;