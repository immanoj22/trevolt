import React from 'react'
import styles from "./staticPage.module.css";
import Images from '../../utils/Images';
import Button from '../../components/Button/Button';

export default function ShareLink() {
    const dynamicURL = Images.grossStatus;
    return (
        <div className={styles.shareLink}>
            {
                dynamicURL &&
                <img className={styles.shareImgContainer} src={dynamicURL} alt='grossStatus' />
            }
            <div className={`${styles.btnWrapper} d-flex gap-2`}>
                <Button btnText={"Trade Now"} className='successFillRectangleBtn' />
            </div>
        </div>
    )
}
