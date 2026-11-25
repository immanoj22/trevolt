import React, { useEffect, useState } from 'react';
import styles from '../styles/institutionalDashboard.module.css';
import Images from '../../../utils/Images';
import ReactDatatable from "react-data-table-component";
import TableNoData from '../../../components/TableNoData/TableNoData';
import { institutionOverView } from '../../../actions/institutionAction';
import { useSelector } from 'react-redux'
import isEmpty from 'is-empty';
const InstitutionalDashboard = () => {
    const { userdetails } = useSelector((state) => state?.user);

    const [overView, setOverView] = useState({});

    const assetColumns = [
        {
            name: 'Coin',
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
            name: 'Client Name',
            selector: row => row.clientName,
            align: "center",
            // width: "150px",
        },
        {
            name: 'Client Trading Volume',
            selector: row => row.tradingValue,
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
                        <p className={`${record?.status === "active" ? "active" : "inActive"} table-activeStatus`}> {record?.status}</p >

                    </>
                );
            }
        },


    ];

    const fetchInstitutionOverview = async () => {
        try {
            const { status, result } = await institutionOverView({ institutionalid: userdetails?.institutionalid }, userdetails.secretKey);
            if (status) {
                setOverView(result.data)
            }
        } catch (e) {
            console.log("fetchInstitutionOverview_err", e);
        }
    }
    const data = [
        {
            id: 1,
            clientName: 'xxx',
            tradingValue: 123,
            status: 'active'
        },
    ];

    useEffect(() => {
        if (!isEmpty(userdetails)) {
            fetchInstitutionOverview()
        }
    }, [userdetails])
    return (
        <div className={styles.InstitutionalDashboard}>
            <div className={""}>
                <h5 className={styles.pageTitle}>
                    Trading Volume Overview
                </h5>
                <div className={styles.dashboardOverview + " mt-4"}>
                    <div className={styles.div1}>
                        <div className={styles.graphCard}>
                            <div className={styles.graphCardTop}>
                                <img src={Images.circleLogo} alt="logo" className={styles.graphCardLogo} />
                                <p className={styles.textXs}>
                                Total Users
                                </p>
                                <p className={styles.textMd}>
                                    112325871
                                </p>
                            </div>

                            {/* <div>
                                <p className={styles.textLiteSm}>+8250% <span className={styles.textLiteXs}>All time</span></p>
                            </div> */}

                        </div>
                    </div>

                    <div className={styles.card}>
                        <div className={styles.cardTop}>
                            <div className={styles.iconWrapper}>
                                <img src={Images.emptyUser} alt='Empty User' className={styles.cardIcons} />
                            </div>
                            <p className={styles.cardTitle}>Future Trading Volume</p>
                        </div>
                        <h5 className={styles.value}>
                            {overView?.futureTradeVolume ?? 0}
                        </h5>
                    </div>

                    <div className={styles.card}>
                        <div className={styles.cardTop}>
                            <div className={styles.iconWrapper}>
                                <img src={Images.emptyUser} alt='Empty User' className={styles.cardIcons} />
                            </div>
                            <p className={styles.cardTitle}>Option Trading Volume</p>
                        </div>
                        <h5 className={styles.value}>
                            {overView?.optionTradeVolume ?? 0}
                        </h5>
                    </div>

                </div>
            </div>
            <div className={"mt-5"}>
                <h5 className={styles.pageTitle}>
                    Top Clients by trading volume
                </h5>
                <div className={styles.dashboardOverview + " mt-4"}>

                    <div className={styles.card}>
                        <div className={styles.cardTop}>
                            <div className={styles.iconWrapper}>
                                <img src={Images.emptyUser} alt='Empty User' className={styles.cardIcons} />
                            </div>
                            <p className={styles.cardTitle}>Active User</p>
                        </div>
                        <h5 className={styles.value}>
                            {overView?.userCount ?? 0}
                        </h5>
                    </div>

                    <div className={styles.card}>
                        <div className={styles.cardTop}>
                            <div className={styles.iconWrapper}>
                                <img src={Images.emptyUser} alt='Empty User' className={styles.cardIcons} />
                            </div>
                            <p className={styles.cardTitle}>Trader</p>
                        </div>
                        <h5 className={styles.value}>
                            {overView?.traderCount ?? 0}
                        </h5>
                    </div>

                </div>
                <div className="custom-table__secondary mt-4">
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

export default InstitutionalDashboard;