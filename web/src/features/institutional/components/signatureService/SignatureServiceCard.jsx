import React from 'react'
import styles from './signatureService.module.css'

const SignatureServiceCard = React.memo(({ key, item }) => {

    const { title, description } = item

    return (
        <div className={styles.card} key={key}>
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

export default SignatureServiceCard
