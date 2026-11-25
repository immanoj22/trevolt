
/** package import */

import React, { useEffect } from 'react'

/** local import */

import ProfileCard from './components/ProfileCard'
import WalletDetails from './components/WalletDetails'
import styles from './styles/authInnerPage.module.css'
import MyAssetTable from './components/MyAssetTable'
import TransactionTable from './components/TransactionTable'

/** code start */


const Wallet = () => {

    useEffect(() => {
        window.scrollTo({
            top: 0,
            behavior: "smooth",
        });
    }, []);


    return (
        <div className={styles.dashboardCards}>
            <ProfileCard />
            <WalletDetails />
            <MyAssetTable />
            <TransactionTable />
        </div>
    )
}

export default Wallet
