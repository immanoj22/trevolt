/** package import */
import React, { useState, useEffect } from 'react'

/** local import */
import styles from './staticPage.module.css';
import Button from '../../components/Button/Button';
import { useGlobalContext } from '../../context/GlobalProvider';

const DeleteAccountPage = () => {
    const { handleLogout } = useGlobalContext();
    return (
        <div className={`${styles.deleteAccountPage}`}>
            <div className={styles.containerPart}>
                <h3>Are you sure you want to delete your account?</h3>
                <Button
                    btnText={"Delete Account"}
                    onClick={() => {
                        handleLogout()
                    }}
                />
            </div>
        </div>
    )
}

export default DeleteAccountPage
