import React, { useState, useEffect } from 'react'
import styles from "../styles/faq.module.css";
import Button from '../../../components/Button/Button';
import { Link, useLocation, useNavigate } from 'react-router-dom';

import Accordion from 'react-bootstrap/Accordion';
import { getCms } from '../../../actions/cmsAction';
import { cmsData } from '../../../lib/cmsCommon';

export default function FaqPage({ }) {

    // const location = useLocation();
    // const { faq } = location.state || {};
    const [defaultActiveKey, setDefaultActiveKey] = useState(0);
    const [data, setData] = useState([]);

    useEffect(() => {
        window.scrollTo({
            top: 0,
            behavoir: "smooth"
        })
        fetchCms();
    }, [])

    const fetchCms = async (data) => {

        let reqData = {
            pageName: 'Home'
        }

        try {
            const result = await getCms(reqData);
            // console.log('resultresult', result)
            if (result?.status) {
                setData({ CARD: cmsData(result?.data, "home-faq", "CARD") });
            }
        } catch (error) {
            console.log('error cms', error);
        }
    }

    // console.log('statestate', faq);

    return (
        <div className={styles.learnPage}>
            <div className={styles.headerPart + " mb-0 pt-4 pt-lg-5 pb-4 justify-content-center"}>
                <h1 className={`${styles.bannerTitleXl} text-center`}>Frequently Asked Questions</h1>
            </div>

            <div className={`${styles.faqRight} custom-accordion`}>

                {
                    data?.CARD?.length > 0 ?
                        <>
                            <Accordion defaultActiveKey={defaultActiveKey} className='mt-4'>
                                {
                                    data?.CARD
                                        ?.filter(item =>
                                            item?.title?.trim() !== ""
                                        )
                                        .map((item, index) => {
                                            return (
                                                <>
                                                    <Accordion.Item eventKey={index}>
                                                        {
                                                            item?.title &&
                                                            <Accordion.Header>
                                                                {item?.title}

                                                            </Accordion.Header>
                                                        }
                                                        {/* {
                                                item?.description && */}
                                                        <Accordion.Body>
                                                            {item?.description ? item?.description : <p className='text-center'>No Data Found</p>}
                                                        </Accordion.Body>
                                                        {/* } */}

                                                    </Accordion.Item>
                                                </>
                                            )
                                        })
                                }
                            </Accordion>
                        </>
                        :
                        <div className='my-5 py-5 text-center'>No Data Found</div>
                }

            </div>
        </div >
    )
}
