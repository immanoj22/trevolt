import React from 'react'
import styles from './notification.module.css';
import Images from '../../utils/Images';
import Button from '../../components/Button/Button';
import { useNavigate } from 'react-router-dom';
import { UpdateNotification } from '../../actions/userAction';
import { useSelector } from 'react-redux';
import { timeAgo } from '../../lib/Common';

function NotificationCard({ ImageName, HeadingText, DetailsText, link, Duration, read, notificationData, getNotification, markOneAsRead, showReads }) {
    let navigate = useNavigate()
    const { userdetails } = useSelector((state) => state.user)

    const handleNavigation = async () => {
        if (!read) {
            const payload = {
                id: notificationData._id,
                accountId: userdetails?.accountId
            }
            const result = await UpdateNotification(payload, userdetails?.secretKey)

            if (result.status) {
                // ✅ FIX: update this one notification's read state in place instead of
                // re-fetching page 1 and replacing the whole list — see markOneAsRead
                // in Notification.jsx for why the old getNotification(1,...,true) call
                // caused the list to jump back to the top on every click.
                if (markOneAsRead) {
                    markOneAsRead(notificationData._id)
                } else if (getNotification) {
                    getNotification(1, showReads || false, true)
                }
            }
        }
    }
    return (
        <div className={styles.notificationPart} onClick={() => handleNavigation()}>
            {ImageName && <div className={styles.imgPart}>
                <img className="themeFilterIcon" src={Images[ImageName]} />
            </div>}
            <div className={styles.contentPart}>
                <div className='d-flex align-items-center gap-2'>
                    <h3>{HeadingText}</h3>
                    <p className='mb-1'>{Duration && Duration}</p>
                </div>
                <p className='mb-2'>{DetailsText}</p>
                <div className='w-100 d-flex gap-2 justify-content-between mt-3'>
                    {link && <Button
                        className='cardSuccessBtnXs'
                        btnText={"Know More"}
                    // onClick={() => navigateHandle("/affiliate")} 
                    />}
                    <p className={styles.dateText}>{timeAgo(notificationData?.createdAt)}</p>
                </div>
            </div>
            <div>
                <span className={read ? "" : styles.bageTag}></span>
            </div>
        </div>
    )
}

export default NotificationCard