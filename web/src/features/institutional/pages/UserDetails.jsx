import React, { useState } from 'react';
import styles from '../styles/institutionalDashboard.module.css';
import Images from '../../../utils/Images';
import ReactDatatable from "react-data-table-component";
import TableNoData from '../../../components/TableNoData/TableNoData';
import Button from '../../../components/Button/Button';
import { FaPlus } from "react-icons/fa6";
import { useNavigate } from 'react-router-dom';
import FutureOrderHistory from '../components/FutureOrderHistory';
import PassbookHistory from '../components/PassbookHistory';
import Asset from '../components/Asset';
import OptionTrading from '../components/OptionTrading';
import LoginHistory from '../components/LoginHistory';

const UserDetails = () => {


    const [activeTabs, setActiveTabs] = useState(1);

    const tabsTitle = [
        {
            id: 1,
            title: "Future Order History"
        },
        {
            id: 2,
            title: "Passbook History"
        },
        {
            id: 3,
            title: "Asset"
        },
        {
            id: 4,
            title: "Option Trading"
        },
        {
            id: 5,
            title: "Login History"
        },
    ]



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


                <div className={styles.userTabs + " mt-4"}>
                    <div className={styles.headSection}>
                        {
                            tabsTitle.map((item, index) => {
                                return (
                                    <Button
                                        isLoading={false}
                                        loadingText="Redirecting..."
                                        btnText={item.title}
                                        className={item.id == activeTabs ? "headingBtnActive" : "headingBtn"}
                                        onClick={() => setActiveTabs(item.id)}
                                    />
                                )
                            })
                        }


                    </div>
                </div>

                {
                    activeTabs === 1 ?
                        <FutureOrderHistory />
                        : activeTabs === 2 ?
                            <PassbookHistory />
                            : activeTabs === 3 ?
                                <Asset />
                                : activeTabs === 4 ?
                                    <OptionTrading />
                                    : <LoginHistory />
                }
            </div>
        </div>
    )
}

export default UserDetails;