
/** package import */

import React from 'react'

/** local import */

import styles from './staticLayout.module.css'
import Header from '../Header/Header'
import Footer from '../Footer/Footer'
import { Outlet } from 'react-router-dom'

/** code start */

const StaticLayout = () => {
    return (
        <div className={styles.layout}>
            <Header />

            <Outlet />

            <Footer />

        </div>
    )
}

export default StaticLayout
