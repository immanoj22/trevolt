/** PACKAGE IMPORT */

import React from 'react'
import Marquee from "react-fast-marquee";
import { useDispatch, useSelector } from "react-redux";

/** LOCAL FILES IMPORT */

import styles from '../styles/marketTicker.module.css'
import isEmpty from 'is-empty';

/** CODE START */

const MarketTicker = () => {
    const { futurePairData } = useSelector((state) => state.future);

    return (
        <div className={styles.card}>
            <section className={`custom-marque__secondary position-relative`}>
                <Marquee
                    pauseOnHover={true}>
                    <div className="custom-marque__secondary-wrapper">

                        {!isEmpty(futurePairData) && futurePairData.length > 0 &&
                            futurePairData.map((val) => (
                                <div className='custom-marque__secondary-pairs'>
                                    <span>{val.tickerRoot}</span> <span className={val.change > 0 ? 'high' : 'low'}>{val.change > 0 ? "+" : ""}{val.change}%</span>
                                </div>
                            ))
                        }
                    </div>
                </Marquee>
            </section >
        </div>
    )
}

export default MarketTicker
