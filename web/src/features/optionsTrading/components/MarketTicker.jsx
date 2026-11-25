/** PACKAGE IMPORT */

import React from 'react'
import Marquee from "react-fast-marquee";

/** LOCAL FILES IMPORT */

import styles from '../styles/marketTicker.module.css'

/** CODE START */

const MarketTicker = () => {
    return (
        <div className={styles.card}>
            <section className={`custom-marque__secondary position-relative`}>
                <Marquee
                    pauseOnHover={true}>
                    <div className="custom-marque__secondary-wrapper">

                        <div className='custom-marque__secondary-pairs'>
                            <span>EURUSD</span> <span className='high'>+0.23%</span>
                        </div>
                        <div className='custom-marque__secondary-pairs'>
                            <span>GBPUSD</span> <span className='high'>+0.23%</span>
                        </div>
                        <div className='custom-marque__secondary-pairs'>
                            <span>XAUUSD</span> <span className='low'>-0.59%</span>
                        </div>
                        <div className='custom-marque__secondary-pairs'>
                            <span>GBPUSD</span> <span className='high'>+0.23%</span>
                        </div>
                        <div className='custom-marque__secondary-pairs'>
                            <span>EURUSD</span> <span className='high'>+0.23%</span>
                        </div>
                        <div className='custom-marque__secondary-pairs'>
                            <span>GBPUSD</span> <span className='high'>+0.23%</span>
                        </div>
                        <div className='custom-marque__secondary-pairs'>
                            <span>XAUUSD</span> <span className='low'>-0.59%</span>
                        </div>
                        <div className='custom-marque__secondary-pairs'>
                            <span>GBPUSD</span> <span className='low'>+0.23%</span>
                        </div>
                        <div className='custom-marque__secondary-pairs'>
                            <span>EURUSD</span> <span className='high'>+0.23%</span>
                        </div>

                        <div className='custom-marque__secondary-pairs'>
                            <span>GBPUSD</span> <span className='high'>+0.23%</span>
                        </div>
                        <div className='custom-marque__secondary-pairs'>
                            <span>XAUUSD</span> <span className='low'>-0.59%</span>
                        </div>
                        <div className='custom-marque__secondary-pairs'>
                            <span>GBPUSD</span> <span className='low'>+0.23%</span>
                        </div>
                        <div className='custom-marque__secondary-pairs'>
                            <span>EURUSD</span> <span className='high'>+0.23%</span>
                        </div>
                        <div className='custom-marque__secondary-pairs'>
                            <span>GBPUSD</span> <span className='high'>+0.23%</span>
                        </div>
                        <div className='custom-marque__secondary-pairs'>
                            <span>XAUUSD</span> <span className='low'>-0.59%</span>
                        </div>
                        <div className='custom-marque__secondary-pairs'>
                            <span>GBPUSD</span> <span className='high'>+0.23%</span>
                        </div>
                        <div className='custom-marque__secondary-pairs'>
                            <span>EURUSD</span> <span className='low'>+0.23%</span>
                        </div>
                        <div className='custom-marque__secondary-pairs'>
                            <span>GBPUSD</span> <span className='high'>+0.23%</span>
                        </div>
                        <div className='custom-marque__secondary-pairs'>
                            <span>XAUUSD</span> <span className='low'>-0.59%</span>
                        </div>
                        <div className='custom-marque__secondary-pairs'>
                            <span>GBPUSD</span> <span className='high'>+0.23%</span>
                        </div>
                        <div className='custom-marque__secondary-pairs'>
                            <span>EURUSD</span> <span className='low'>+0.23%</span>
                        </div>
                    </div>
                </Marquee>
            </section >
        </div>
    )
}

export default MarketTicker
