import React from 'react'
import { useNavigate } from 'react-router-dom';
import { FaArrowLeft } from "react-icons/fa6";
import Images from '../../utils/Images';
import { useGlobalContext } from '../../context/GlobalProvider';
import styles from "./staticPage.module.css";
import Button from '../../components/Button/Button';

const PageNotFound = () => {

    const { theme } = useGlobalContext()

    const navigate = useNavigate()

    return (
        <>
            <div className={styles.pageNotFound}>
                <div className='row mx-auto align-items-center justify-content-center'>
                    <div className='col-md-6 px-5 px-md-0 '>
                        <div className={styles.pageNotFound_image}>
                            <img src={theme == 'dark' ? Images.pageNotFoundDark : Images.pageNotFoundLight} alt='Page Not Found' />
                        </div>
                    </div>
                    <div className='col-md-6 px-5 px-md-0 d-flex justify-content-center justify-content-md-start mt-4 mt-md-0'>
                        <div>
                            <p className={`${styles.pageNotFound_title}`}>
                                Oops
                            </p>
                            <p className={styles.pageNotFound_title}>
                                <span>nothing</span> here...
                            </p>

                            <p className={styles.pageNotFound_desc}>
                                The page you're looking for doesn't exist. Try checking the URL or go back to the homepage.
                            </p>
                            <Button reactIconElement={<FaArrowLeft />} onClick={() => navigate("/")} btnText={"Go Back"} staticClass='gap-2 mt-3' />
                        </div>
                    </div>
                </div>
            </div>
        </>
    )
}

export default PageNotFound