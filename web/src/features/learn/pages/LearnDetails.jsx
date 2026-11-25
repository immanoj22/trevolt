import React, { useState, useEffect } from 'react'
import styles from "../styles/learnPage.module.css";
import Button from '../../../components/Button/Button';
import { getCms } from '../../../actions/cmsAction';
import { useLocation, useNavigate } from 'react-router-dom';
import { getSubCourse } from '../../../actions/LearnAndBlogActions';

export default function LearnDetails() {
    const location = useLocation();
    const { id } = location.state || ''
    const [showAllContent, setShowAllContent] = useState(false);
    const [data, setData] = useState();
    const [selectData, setSelectData] = useState();

    const navigate = useNavigate();

    useEffect(() => {
        fetchSubCourse();
    }, [])

    useEffect(() => {
        window.scrollTo({
            top: 0,
            behavior: "smooth",
        });
    }, []);

    const fetchSubCourse = async () => {

        try {
            const result = await getSubCourse(id);
            // console.log('resultresult', result);

            const courseData = {
                title: result?.data?.courseName,
                description: result?.data?.courseDescription,
                url: result?.data?.courseLink,
            }

            if (result?.status) {
                setData(result?.data);
                // setSelectData(result?.data?.SUBCOURSE?.[0])
                setSelectData(courseData)
            }
        } catch (error) {
            console.log('error', error);
        }
    }

    const handleToggle = () => {
        setShowAllContent(!showAllContent)
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        })
    }

    const handleSelected = (value) => {
        setSelectData(value);
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        })
    }

    // console.log('selectData', selectData)

    return (
        <div className={styles.learnPage}>
            <div className={styles.headerPart + ' gap-3'}>
                {
                    data?.courseName &&
                    <h2>
                        {data?.courseName}
                    </h2>
                }
                <Button className='backBtn' btnText={"Back"} onClick={() => navigate('/learn')} />
            </div>
            <div className={styles.liveVideoPart}>
                <div className={styles.videoPart}>
                    {
                        selectData?.url &&
                        <iframe
                            src={selectData?.url}
                            title="YouTube video player"
                            frameborder="0"
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                            referrerpolicy="strict-origin-when-cross-origin"
                            allowfullscreen
                        >

                        </iframe>
                    }
                </div>
                <div className={styles.liveVideoContent}>
                    {
                        selectData?.title &&
                        <h3>
                            {selectData?.title}
                        </h3>
                    }

                    {
                        selectData?.description &&
                        <p>
                            {
                                showAllContent ?
                                    <span>{selectData?.description}</span>
                                    :
                                    <span>
                                        {selectData?.description?.split(' ').slice(0, 120).join(' ')}
                                        {selectData?.description?.split(' ').length > 120 && '....'}
                                    </span>
                            }
                        </p>
                    }
                    {
                        selectData?.description?.split(' ').length > 120 &&
                        <>

                            <button
                                onClick={handleToggle}
                                className={styles.readMoreBtn}>
                                Read {!showAllContent ? "More" : "Less"}
                            </button>
                        </>
                    }

                </div>
            </div>
            {
                data?.SUBCOURSE?.length > 0 &&
                <div className='mt-5'>
                    <h4 className={styles.fw700 + " mb-0"}>
                        Sub Courses
                    </h4>
                    <div className={styles.cardWrapper + ' row mt-4'}>
                        {
                            data && data?.SUBCOURSE?.map((item, index) => (
                                <div className={"col-12 col-sm-6 col-lg-4 col-xl-4 col-xxl-3 mb-3"} key={index}>
                                    <div
                                        className={`${styles.videoCard} ${selectData?.id === item?.id && styles.videoCardActive} `}
                                        onClick={() => handleSelected(item)}
                                    >
                                        <div className={styles.cardImgPart}>
                                            {
                                                item?.url &&
                                                <iframe
                                                    src={item?.url}
                                                    title="YouTube video player"
                                                    // frameborder="0"
                                                    // allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                                                    allow="accelerometer; gyroscope; picture-in-picture"
                                                    referrerpolicy="strict-origin-when-cross-origin"
                                                    // allowfullscreen
                                                    // mute
                                                    style={{
                                                        pointerEvents: "none",
                                                    }}
                                                >

                                                </iframe>
                                            }
                                        </div>
                                        <div className={styles.cardContentPart}>
                                            {
                                                item?.title &&
                                                <h3 title={item?.title}>
                                                    {item?.title}
                                                </h3>
                                            }

                                            {
                                                item?.description &&
                                                <p>
                                                    {item?.description}
                                                </p>
                                            }

                                        </div>
                                    </div>
                                </div>
                            ))
                        }
                    </div>
                </div>
            }
        </div >
    )
}