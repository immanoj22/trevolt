
/** package import */

import React, { useEffect } from 'react';

/** local import */

import styles from '../styles/expiredFutureAndOptions.module.css';
import ExpiredTable from '../component/ExpiredTable';

/** code start */


const ExpiredFutureAndOptions = () => {

    useEffect(() => {
        window.scrollTo({
            top: 0,
            behavior: "smooth",
        });
    }, []);


    return (
        <main className={`${styles.expiredLanding} container`}>
            <div className={styles.dashboardCards}>
                <ExpiredTable />
            </div>
        </main>
    )
}

export default ExpiredFutureAndOptions
