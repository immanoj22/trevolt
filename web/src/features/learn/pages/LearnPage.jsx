import React, { useState, useEffect } from 'react'
import styles from "../styles/learnPage.module.css";
import Button from '../../../components/Button/Button';
import { Link, useNavigate } from 'react-router-dom';
import { getCourse } from '../../../actions/LearnAndBlogActions';
export default function LearnPage() {
    const [data, setData] = useState([]);
    const [page, setPage] = useState(1);
    const [limit, setLimit] = useState(10);
    const [count, setCount] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        let reqData = { limit: limit, page: page, search: '' }
        fetchLearn(reqData);
    }, [])

    useEffect(() => {
        window.scrollTo({
            top: 0,
            behavior: "smooth",
        });
    }, []);

    const fetchLearn = async (reqData) => {


        try {
            const result = await getCourse(reqData);

            // console.log('resultttt', result)

            if (result?.status) {
                setCount(result?.data?.count)
                setData((prev) => [
                    ...(prev || []),
                    ...(result?.data?.existingCourse || [])
                ])
                setIsLoading(false)
            }
        } catch (error) {
            console.log('error learn', error);
            setIsLoading(false)
        }
    }

    const handleLoadMore = () => {
        setIsLoading(true)
        setTimeout(() => {
            let reqData = { limit: limit, page: page + 1, search: '' };
            setPage(page + 1)
            fetchLearn(reqData)
        }, 500);
    }

    // console.log('datadata', data);

    return (
        <div className={styles.learnPage}>
            <div className={styles.headerPart + " mb-0 pt-4 pt-lg-5 pb-4 justify-content-center"}>
                <h1 className={`fw-700 text-center`}>Courses</h1>
            </div>
            {
                data?.length > 0 ?

                    <div className={styles.cardWrapper + ' row mt-2'}>
                        {
                            data && data?.map((item, index) => (
                                <div className={"col-12 col-sm-6 col-lg-4 col-xl-4 col-xxl-3 mb-3"} key={index}>
                                    <Link to='/learn-details' state={{ id: item?._id }}>
                                        <div className={styles.videoCard}>
                                            <div className={styles.cardImgPart}>
                                                {
                                                    item?.courseLink &&
                                                    <iframe
                                                        src={item?.courseLink}
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
                                                    item?.courseName &&
                                                    <h3>
                                                        {item?.courseName}
                                                    </h3>
                                                }

                                                {
                                                    item?.courseDescription &&
                                                    <p>
                                                        {item?.courseDescription}
                                                    </p>
                                                }

                                            </div>
                                        </div>
                                    </Link>
                                </div>
                            ))
                        }
                    </div>
                    :
                    <div className='my-5 py-5 text-center'>Upcoming ...</div>
            }

            {
                (count > 10 && count !== data?.length) &&
                <div className='mt-4 d-flex align-items-center justify-content-center'>
                    <Button
                        isLoading={false}
                        // loadingText="Loading..."
                        btnText={isLoading ? "Loading ..." : "Load More"}
                        onClick={handleLoadMore}
                        className="primaryBtn"
                    // selectedValue={currentResult}
                    />
                </div>
            }
        </div >
    )
}
