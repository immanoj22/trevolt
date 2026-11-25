/** PACKAGE IMPORT */

import React, { useEffect, useState } from "react";
import Select from 'react-select'
import { IoCheckmarkDoneSharp } from "react-icons/io5";

/** LOCAL FILES IMPORT */

import styles from "../styles/notificationPage.module.css";
import Button from "../../../components/Button/Button";
import NotificationCard from "../../../pages/Notification/NotificationCard";
import Images from "../../../utils/Images";
import { useGlobalContext } from "../../../context/GlobalProvider";
import Loader from "../../../components/Loader/Loader";
import { getNotifications, UpdateNotification } from "../../../actions/userAction";
import { useSelector } from "react-redux";
import NoData from "../../../components/NoData/NoData";

/** CODE START */

const notificationList = [
    {
        id: 1,
        headingText: 'Delisting',
        duration: '6 days ago',
        detailsText: 'we will be performing scheduled maintenance this sunday 5th october at 1:30PM IST'
    },
    {
        id: 2,
        headingText: 'Delisting Two',
        duration: '6 days ago',
        detailsText: 'we will be performing scheduled maintenance this sunday 5th october at 1:30PM IST'
    },
    {
        id: 3,
        headingText: 'Delisting Three',
        duration: '6 days ago',
        detailsText: 'we will be performing scheduled maintenance this sunday 5th october at 1:30PM IST',
        link: '/knowmore'
    },
]

let globalcount = 0

const Notification = () => {

    const [notificationTabs, setNotificationTabs] = useState('allNotification')
    const { userdetails } = useSelector((state) => state.user)

    const { theme } = useGlobalContext();

    const [page, setPage] = useState(1)
    const [limit, setLimit] = useState(10)
    const [data, setData] = useState([])

    const [loading, setLoading] = useState(false);
    const [hasMore, setHasMore] = useState(true);
    const [count, setCount] = useState(null);
    const [showReads, setShowRead] = useState(false);
    const [unreadCount, setUnreadCount] = useState(0);



    // const [show, setShow] = useState(true);

    const handleShowRead = async (e) => {
        setShowRead(e.target.checked)
        getNotification(1, e.target.checked, true)
    }

    const getNotification = async (page, showRead = false, fromShowread = false) => {
        try {
            setLoading(true)
            const payload = {
                // secretKey: userdetails?.secretKey,
                page: page,
                limit: limit,
                showRead: showRead,
            }
            const result = await getNotifications(payload)
            if (result?.status) {
                setLoading(false)
                if (fromShowread) {
                    setData(result?.result?.data)
                } else {
                    setData(item => [...item, ...result?.result?.data])
                }
                setCount(result?.result?.count)
                globalcount = result?.result?.count
                setUnreadCount(result?.result?.unreadcount)
                setPage(page)
            }
            setLoading(false)
        } catch (error) {
            setLoading(false)
            console.log("getNotifications_err", error)
        }
    }

    // ✅ FIX: clicking a notification further down the list (e.g. the 50th) used
    // to call getNotification(1, ..., true), which REPLACES the whole `data` array
    // with just page 1's results — discarding everything loaded via infinite
    // scroll and visually snapping the user back to the top of the list ("redirect
    // to the 1st message"). This instead patches only the clicked notification's
    // read state in place, leaving the rest of the loaded list untouched.
    const markOneAsRead = (notificationId) => {
        setData((prev) => prev.map((item) => (
            item?._id === notificationId ? { ...item, isRead: true } : item
        )))
        setUnreadCount((prev) => (prev > 0 ? prev - 1 : 0))
    }

    useEffect(() => {
        getNotification(page)
    }, [])

    useEffect(() => {
        window.scrollTo({
            top: 0,
            behavior: "smooth",
        });
    }, []);

    //---Scroll to fetch ------>

    const handleMarkAllRead = async () => {
        try {
            if (unreadCount != 0) {
                const payload = {
                    id: "all",
                    accountId: userdetails?.accountId
                }
                const result = await UpdateNotification(payload, userdetails?.secretKey)
                if (result.status) {
                    getNotification(1, showReads, true)
                }
            }
        } catch (error) {
            console.log("handleMarkAllRead_err", error)
        }
    }

    useEffect(() => {
        if (count >= data.length) {
            setHasMore(true)
        } else {
            setHasMore(false)
        }

        const handleScroll = () => {
            // if (
            //     window.innerHeight + document.documentElement.scrollTop + 100 >=
            //     document.documentElement.scrollHeight
            // ) {
            if (globalcount > data?.length && !loading) {
                // setPage((prev) => prev + 1);
                getNotification(page + 1, showReads)
            }
            // }
        };

        window.addEventListener("scroll", handleScroll);
        return () => window.removeEventListener("scroll", handleScroll);
    }, [hasMore, loading]);

    return (
        <>
            <main className={styles.notificationPage}>
                <section className={`${styles.notificationDashboard}`}>
                    <div className="custom-container container my-5">
                        <div className={styles.notificationContainer}>
                            <div className={styles.notificationSidebar}>
                                <h5 className={styles.pageTitle}>Notifications</h5>
                                <div className={`${styles.sideTabsWrapper} px-0 px-lg-4 mt-4 mb-5 mt-lg-5 mb-lg-0 pb-3 pb-md-0 `}>
                                    <div
                                        className={` ${styles.sidebarTabs} ${notificationTabs == 'allNotification' ? styles.active : ''} gap-4 gap-lg-0`}
                                        onClick={() => setNotificationTabs('allNotification')}
                                    >
                                        <p className="d-flex align-items-center gap-2 gap-lg-3">
                                            <img src={Images.allNotification} alt="All Notifications" className={`${theme == 'light' ? styles.filterTheme : styles.sidebarImg}`} />
                                            <span className={styles.sidebarTitel} >All Notifications</span>
                                        </p>
                                        {
                                            unreadCount > 0 &&
                                            <span className={`${styles.notificationCount} ${styles.notificationCount}`}>{unreadCount}</span>
                                        }
                                    </div>
                                    {/* <div
                                        className={` ${styles.sidebarTabs} ${notificationTabs == 'deltaNews' ? styles.active : ''} mt-0 mt-lg-4 gap-4 gap-lg-0`}
                                        onClick={() => setNotificationTabs('deltaNews')}
                                    >
                                        <p className="d-flex align-items-center gap-2 gap-lg-3">
                                            <img src={Images.deltaNews} alt="Delta News" className={`${theme == 'light' ? styles.filterTheme : styles.sidebarImg}`} />
                                            <span className={styles.sidebarTitel}>Trevolt News</span>
                                        </p>
                                        <span className={`${styles.notificationCount} ${styles.notificationCount}`}>6</span>
                                    </div>
                                    <div
                                        className={` ${styles.sidebarTabs} ${notificationTabs == 'update' ? styles.active : ''} mt-0 mt-lg-4 gap-4 gap-lg-0`}
                                        onClick={() => setNotificationTabs('update')}
                                    >
                                        <p className="d-flex align-items-center gap-2 gap-lg-3">
                                            <img src={Images.settings} alt="Settings" className={`${theme == 'light' ? styles.filterTheme : styles.sidebarImg}`} />
                                            <span className={styles.sidebarTitel}>System Updates</span>
                                        </p>
                                        <span className={`${styles.notificationCount} ${styles.notificationCount}`}>3</span>
                                    </div> */}
                                </div>
                            </div>
                            <div className={styles.notificationList}>
                                <div className="d-flex align-items-center justify-content-between flex-wrap">
                                    <div className="custom-toggle__primary notificationToggle d-flex align-items-center gap-2">
                                        <span className={`${styles.sidebarTitel}`} >Show Unread</span>
                                        <label className="switch">
                                            <input
                                                onChange={(e) => handleShowRead(e)}
                                                type="checkbox"
                                            />
                                            <span className="slider round"></span>
                                        </label>
                                    </div>
                                    <div>
                                        <button className={`${styles.allMark} d-flex align-items-center gap-1`}>
                                            <IoCheckmarkDoneSharp fontSize={15} />
                                            <span className={styles.sidebarTitel} onClick={() => handleMarkAllRead()}>Mark all as read</span>
                                        </button>
                                    </div>
                                </div>
                                <div className={`${styles.notificationScrollWrapper} mt-5`}>

                                    {notificationTabs == 'allNotification' &&
                                        <div className={`${styles.listBody}`}>
                                            {
                                                data.map((item, index) => (
                                                    <NotificationCard key={item?._id ?? index} HeadingText={item.title} DetailsText={item.description} ImageName={item.imgName} link={item.link} read={item?.isRead} notificationData={item} getNotification={getNotification} markOneAsRead={markOneAsRead} showReads={showReads} />
                                                ))
                                            }
                                            {
                                                data?.length == 0 && <NoData content="Notification Empty" />
                                            }
                                        </div>}

                                    {notificationTabs == 'deltaNews' &&
                                        <div className={`${styles.listBody}`}>
                                            {
                                                notificationList.map((item, index) => (
                                                    <NotificationCard key={item?.id ?? index} HeadingText={item.headingText} DetailsText={item.detailsText} Duration={item.duration} link={item.link} notificationData={item} />
                                                ))
                                            }
                                            {
                                                notificationList.length == 0 && <NoData content="Notification Empty" />
                                            }
                                        </div>
                                    }

                                    {notificationTabs == 'update' &&
                                        <div className={`${styles.listBody}`}>
                                            {
                                                notificationList.map((item, index) => (
                                                    <NotificationCard key={item?.id ?? index} HeadingText={item.headingText} DetailsText={item.detailsText} Duration={item.duration} link={item.link} notificationData={item} />
                                                ))
                                            }
                                            {
                                                notificationList.length == 0 && <NoData content="Notification Empty" />
                                            }
                                        </div>
                                    }
                                    <div style={{ padding: "30px" }}>
                                        {count > data?.length && <Loader />}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>
            </main>
        </>
    )
}

export default Notification