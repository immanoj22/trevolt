import React from 'react'
import styles from './latestNews.module.css'
import Button from '../../Button/Button'
import config from '../../../config/env'
const LatestNews = React.memo(({ item }) => {

    const IMG_URL = "http://localhost:2002";

    const { title, Image } = item

    const handleReadMore = (getItem) => {
    }
    return (
        <div className={styles.card}>
            {
                Image &&
                <img src={`${config.IMG_URL}/${Image}`} alt="post" className={styles.cardImage} />
            }
            <div className={styles.cardBody}>
                {
                    title &&
                    <p className={styles.title}>{title}</p>
                }
                <div className='mt-1'>
                    <Button
                        isLoading={false}
                        loadingText="Redirecting..."
                        btnText="Read More"
                        onClick={handleReadMore}
                        className="underlineBtn"
                        selectedValue={item}
                    />
                </div>
                <p className={`${styles.label} mt-2 mt-xxl-3`}>Trevolt</p>
            </div>
        </div>
    )
})

export default LatestNews
