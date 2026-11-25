import React from 'react'
import styles from './experienceCard.module.css'
import Images from '../../../utils/Images'

export const ExperienceCard = React.memo(({ item, index }) => {

    const { img, title, description } = item

    // console.log('indexindex',index);
    
    return (
        <div className={styles.card} key={index}>
            <img src={Images[`ec${index + 1}`]} alt={title} className={styles.image} />

            <div className={styles.cardContent}>
                <h5 className={styles.title}>
                    {title}
                </h5>
                <p className={styles.description}>
                    {description}
                </p>
            </div>
        </div>
    )
})

