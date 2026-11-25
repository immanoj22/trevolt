import React from 'react'
import styles from './loader.module.css'

const Loader = ({ loaderColor = "var(--color-green-01)" }) => {
    return (
        <div style={{ "--loaderColor": loaderColor }} className={styles.loaderContainer}>
            <span className={styles.loader}></span>
        </div>

    )
}

export default Loader
