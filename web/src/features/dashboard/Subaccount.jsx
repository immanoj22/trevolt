
/** package import */

import React, { useEffect } from 'react'

/** local import */

import ProfileCard from './components/ProfileCard'
import WalletDetails from './components/WalletDetails'
import styles from './styles/authInnerPage.module.css'
import AccountTable from './components/AccountTable'

/** code start */


const SubAccount = () => {

    useEffect(() => {
        window.scrollTo({
            top: 0,
            behavior: "smooth",
        });
    }, []);


    return (
        <div className={styles.dashboardCards}>
            {/* <ProfileCard /> */}
            <AccountTable />
        </div>
    )
}

export default SubAccount
