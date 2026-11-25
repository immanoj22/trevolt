import React from 'react'
import styles from "./loader.module.css";
import Loader from './Loader';
export default function PageLoader() {
    return (
        <div className={styles.pageLoader}>
            <Loader />
        </div>
    )
}
