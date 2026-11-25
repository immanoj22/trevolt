import React, { useState } from 'react';
import styles from '../styles/institutionalDashboard.module.css';
import Images from '../../../utils/Images';
import ReactDatatable from "react-data-table-component";
import TableNoData from '../../../components/TableNoData/TableNoData';
import Button from '../../../components/Button/Button';
import { FaPlus } from "react-icons/fa6";
import { useNavigate } from 'react-router-dom';

const Asset = (props) => {

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
            name: 'Main Balance',
            selector: row => row.mainBalance,
            align: "center",
            // width: "150px",
        },
        {
            name: 'Future Balance',
            selector: row => row.futureBalance,
            align: "center",
            // width: "150px",
        },
    ];


    const data = [
        {
            id: 1,
            coin: 'xxxx',
            mainBalance: 0,
            futureBalance: 0,
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

export default Asset;