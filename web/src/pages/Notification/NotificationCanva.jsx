import React, { useContext, useEffect, useState } from 'react'
import { Offcanvas } from 'react-bootstrap'
import { IoMdClose } from 'react-icons/io'
import styles from './notification.module.css';
import { Link } from 'react-router-dom';
import NotificationCard from './NotificationCard';
import { IoClose } from 'react-icons/io5';
import { getNotifications } from '../../actions/userAction';
import { useSelector } from 'react-redux';
import Loader from '../../components/Loader/Loader';
import SocketContext from '../../context/socketContext';
import { UserDetails } from '../../redux/action';
import NoData from '../../components/NoData/NoData';
import isEmpty from 'is-empty';

function NotificationCanva({ NotificationShow, handleNotificationCanvaClose }) {

    const { userdetails } = useSelector((state) => state.user)
    const socketContext = useContext(SocketContext);

    const [page, setPage] = useState(1)
    const [limit, setLimit] = useState(10)
    const [data, setData] = useState([])
    const [showReads, setShowRead] = useState(false);

    // const [show, setShow] = useState(true);

    const handleShowRead = async (e) => {
        setShowRead(e.target.checked)
        getNotification(1, e.target.checked, true)

    }

    const getNotification = async (page, showRead = false) => {
        try {
            const payload = {
                // secretKey: userdetails?.secretKey,
                // query: {
                page: page,
                limit: limit,
                showRead: showRead
                // }
            }
            const result = await getNotifications(payload)
            if (result?.status) {
                setData(result?.result?.data)
            }
            // console.log("resultresult canva", result?.result?.data)
        } catch (error) {
            console.log("getNotifications_err", error)
        }
    }

    useEffect(() => {
        setShowRead(false)
        getNotification(1)
    }, [NotificationShow])

    useEffect(() => {
        socketContext.socket.on('USER_NOTIFICATIONUPDATE', (result) => {
            // getNotification(1)
            setData(result?.notificationData)
            // if (!isEmpty(result)) {
            //     dispatch(UserDetails({ userdetails: result }))
            // }
        });
    }, [socketContext])
    return (

        <Offcanvas
            show={NotificationShow}
            className={`${styles.notificationOffcanva}`}
            placement={'end'}
            onHide={handleNotificationCanvaClose}
        >
            <Offcanvas.Header className={`${styles.headSection}`}>
                <Offcanvas.Title className='w-100 d-flex gap-2 justify-content-between'>
                    <span className={`${styles.title}`}>Notification</span>
                    <button
                        aria-label="closeIcon"
                        className={styles.modalCloseButton}
                        onClick={handleNotificationCanvaClose}
                    >
                        <IoClose />
                    </button>
                </Offcanvas.Title>
                {/* <div className="custom-toggle__primary notificationToggle d-flex align-items-center gap-2">
                    <span className={`${styles.unreadTitle}`} >Show read</span>
                    <label className="switch">
                        <input
                            onChange={(e) => handleShowRead(e)}
                            type="checkbox"
                        />
                        <span className="slider round"></span>
                    </label>
                </div> */}
            </Offcanvas.Header>
            <Offcanvas.Body className={`${styles.canvaBody} position-relative`} >
                <div className='w-100 d-flex justify-content-end'>
                    {
                        // data.length !== 0 &&
                        <div className="custom-toggle__primary notificationToggle d-flex align-items-center gap-2 mb-3">
                            <span className={`${styles.unreadTitle}`}>Show Unread</span>
                            <label className="switch">
                                <input
                                    onChange={(e) => handleShowRead(e)}
                                    type="checkbox"
                                />
                                <span className="slider round"></span>
                            </label>
                        </div>
                    }
                </div>
                <div className={`${styles.bodyContent}`}>
                    {data &&
                        data.map((item, index) => (
                            <NotificationCard key={item._id} HeadingText={item.title} DetailsText={item.description} ImageName={item.imgName} link={item.link} read={item?.isRead} notificationData={item} getNotification={getNotification} showReads={showReads} />
                        ))
                    }
                    {
                        data?.length == 0 && <NoData content="No Notifications" />
                    }
                </div>

                <div className={`${styles.footer}`}>
                    <Link to='/notification' onClick={handleNotificationCanvaClose} >
                        View All
                    </Link>
                </div>

            </Offcanvas.Body>
        </Offcanvas >
    )
}

export default NotificationCanva