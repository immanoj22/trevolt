import React, { useEffect, useState } from 'react';
import styles from '../styles/institutionalDashboard.module.css';
import Images from '../../../utils/Images';
import ReactDatatable from "react-data-table-component";
import TableNoData from '../../../components/TableNoData/TableNoData';
import Button from '../../../components/Button/Button';
import { FaPlus } from "react-icons/fa6";
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux'
import isEmpty from 'is-empty';
import Swal from 'sweetalert2';

import { deactivateSubuser, getSubAccdetails } from '../../../actions/institutionAction';
import { useGlobalContext } from '../../../context/GlobalProvider';
import { showToastMessage } from '../../../lib/toast';
// import EditSubAccount from '../modal/EditSubAccountModel';
// import EditSubAccountModel from '../modal/EditSubAccountModel';
const SubAccount = () => {

    const navigate = useNavigate();
    const { userdetails } = useSelector((state) => state?.user);
    const { theme } = useGlobalContext()

    const [subUsers, setSubUsers] = useState([]);
    const [pagination, setPagination] = useState({ page: 1, limit: 10 });
    const [count, setCount] = useState(0);
    const [nextPage, setnextPage] = useState(true);


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
            },

        },
        {
            name: 'User ID',
            selector: row => row._id,
            align: "center",
            // width: "150px",
        },
        {
            name: 'User Name',
            selector: row => row.userName,
            align: "center",
            // width: "150px",
        },
        {
            name: 'Email',
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
                                    checked={record.status === 'verified' ? true : false}
                                    onChange={(e) => {
                                        // if (!e.target.checked) {
                                        deactivateUser(record, e.target.checked)

                                        // }
                                    }}
                                />
                                <span className="slider round"></span>
                            </label>
                        </div>
                    </>
                );
            }
        },

        // {
        //     name: 'Action',
        //     // selector: row => row.gains,
        //     align: "center",
        //     // width: "130px",
        //     selector: (record) => {
        //         return (
        //             <>
        //                 <Button
        //                     isLoading={false}
        //                     loadingText="Redirecting..."
        //                     btnText="Remove"
        //                     className="themeTransparent_btn"
        //                 />
        //             </>
        //         );
        //     }
        // },


    ];


    const fetchSubUsers = async (reqData) => {
        try {
            reqData['institutionalid'] = userdetails?.institutionalid
            const { result, status } = await getSubAccdetails(reqData);
            if (status) {

                setSubUsers(result.data);
                setCount(result.count);
            }
        } catch (e) {
            console.log("fetchSubUsers_err", e);
        }
    }

    const deactivateUser = async (record, sts) => {
        try {
            const confirmBtnColor = "#2563EB"; // Same for dark and light
            const cancelBtnColor = theme === "dark" ? "#2A2C2F" : "#eaecef";

            const payload = {
                userId: record._id,
                status: sts ? "verified" : "unverified",
            };

            const actionText = sts ? "activate" : "deactivate";

            // confirm only when deactivating
            if (!sts) {
                const { isConfirmed } = await Swal.fire({
                    title: `Are you sure you want to ${actionText} the user?`,
                    icon: "warning",
                    showCancelButton: true,
                    confirmButtonText: "OK",
                    confirmButtonColor: confirmBtnColor,
                    cancelButtonColor: cancelBtnColor,
                    didOpen: () => {
                        const confirmBtn = Swal.getConfirmButton();
                        const cancelBtn = Swal.getCancelButton();

                        if (confirmBtn) confirmBtn.setAttribute("data-click-effect", "none");
                        if (cancelBtn) cancelBtn.setAttribute("data-click-effect", "none");
                    }
                });

                if (!isConfirmed) return;
            }

            // perform action
            const { status, message } = await deactivateSubuser(
                payload,
                userdetails.secretKey
            );
            showToastMessage(message, status ? "success" : "error");

            // refresh list
            fetchSubUsers({
                page: pagination.page,
                limit: pagination.limit,
            });
        } catch (e) {
        }
    };


    const loadMore = async (page) => {
        try {
            let payload = { page: page, limit: pagination.limit, search: "" }
            fetchSubUsers(payload)
            setPagination({ ...pagination, ...{ page: page } })

        } catch (err) {
            console.log(err, "LoadMore___err");
        }
    };

    // const handlePerRowsChange = async (newPerPage, page) => {
    //     try {
    //         console.log("handlePerRowsChange_data", { newPerPage, page });
    //         let payload = { page: page, limit: newPerPage, search: search }
    //         fetchUserList(payload);
    //         setPagination({ ...pagination, ...{ page: page, limit: newPerPage } })
    //     } catch (e) {
    //         console.log("handlePerRowsChange_err", e);
    //     }
    // };

    useEffect(() => {
        if (!isEmpty(userdetails)) {
            const payload = {
                page: 1,
                limit: pagination.limit,
            }
            fetchSubUsers(payload)
        }
    }, [userdetails]);


    return (
        <div className={styles.InstitutionalSubAccount}>

            <div className={""}>
                <div className='d-flex align-items-center justify-content-between gap-3 flex-wrap'>
                    <div>
                        <h5 className={styles.pageTitle}>
                            Sub Account
                        </h5>
                        <p className={styles.subTitle + " mt-3"}>
                            Each sub-account maintains its own wallet, trades, and PnL.
                        </p>
                    </div>
                    <Button
                        isLoading={false}
                        loadingText="Redirecting..."
                        btnText="Add Sub Account"
                        className="primaryBtn"
                        onClick={() => navigate("/institutional/add-sub-account")}
                        reactIconElement={<FaPlus size={17} className='me-1' />}
                    />
                </div>

                <div className="custom-table__secondary subAccount_table mt-4">
                    <ReactDatatable
                        columns={assetColumns}
                        data={subUsers}
                        pagination
                        paginationServer
                        paginationDefaultPage={pagination.page}
                        paginationRowsPerPageOptions={[5, 10, 15, 20, 50, 100]}
                        paginationTotalRows={count}
                        // customStyles={customStyles}
                        className="dataTableComponent"
                        // sortIcon={<BiSort style={{ marginLeft: "0.5rem", color: "#000" }} />}
                        noDataComponent={<TableNoData />}
                        onChangeRowsPerPage={loadMore}
                        onChangePage={loadMore}
                    />
                </div>
            </div>
        </div>
    )
}

export default SubAccount;