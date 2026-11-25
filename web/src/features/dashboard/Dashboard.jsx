
/** package import */

import React, { useEffect, useState } from 'react'

/** local import */

import ProfileCard from './components/ProfileCard'
import WalletDetails from './components/WalletDetails'
import styles from './styles/authInnerPage.module.css'
import WalletTransfer from './modal/WalletTransfer'
import Loader from '../../components/Loader/Loader'
import PageLoader from '../../components/Loader/PageLoader'
import WelcomeModel from '../../components/Modal/WelcomeModel'

/** code start */


const Dashboard = () => {
    const [show, setShow] = useState(false)
    useEffect(() => {
        window.scrollTo({
            top: 0,
            behavior: "smooth",
        });
        setShow([null, 'false', false].includes(localStorage.getItem('code')) ? false : Boolean(localStorage.getItem('code')))
    }, []);


    const handleClose = () => {
        setShow(false)
        localStorage.removeItem('code')
    }

    return (
        <>
            <div className={styles.dashboardCards}>
                <WelcomeModel show={show} handleClose={handleClose} />
                <ProfileCard />
                <WalletDetails />
            </div>
        </>
    )
}

export default Dashboard
