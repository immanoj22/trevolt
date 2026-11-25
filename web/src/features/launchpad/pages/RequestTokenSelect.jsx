

/** PACKAGE IMPORT */

import React, { useEffect, useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { MdKeyboardArrowRight } from "react-icons/md";


/** LOCAL FILES IMPORT */

import styles from "../styles/requestTokenSelect.module.css"
import Button from "../../../components/Button/Button";


/** CODE START */

const tokensData = [
    {
        title: 'Existing Tokens',
        description: 'For the Projects that are listed on other Exchanges we need to collect the Details about where they are listed and what was their Trading Volume for the Last 6 Months / 1 Year.',
        btnName: 'Existing Tokens',
        url: '/launchTokens/existing-token',
    },
    {
        title: 'New Tokens',
        description: 'For the Projects that are listed on other Exchanges we need to collect the Details about where they are listed and what was their Trading Volume for the Last 6 Months / 1 Year.',
        btnName: 'New Tokens',
        url: '/launchTokens/existing-token',
    },
    {
        title: 'New Tokens but already Minted',
        description: 'For the Projects that are listed on other Exchanges we need to collect the Details about where they are listed and what was their Trading Volume for the Last 6 Months / 1 Year.',
        btnName: 'New Tokens but already Minted',
        url: '/launchTokens/existing-token',
    },
]

const RequestTokenSelect = () => {

    const navigate = useNavigate();

    useEffect(() => {
            window.scrollTo({
                top: 0,
                behavior: "smooth",
            });
        }, []);

    return (
        <>
            <main className={styles.tokenPageLanding}>
                <section className={`${styles.tokenPage}`}>
                    <div className="custom-container container my-5">
                        <div className={styles.profileBackBtn}>
                            <div className={styles.menuUi} >
                                <div className={`${styles.headerSingleMenusLinks}`}>
                                    <NavLink to='/'
                                        className={({ isActive }) => isActive ? `${styles.staticLinks} ${styles.active}` : `${styles.staticLinks}`}
                                    >
                                        Home Page
                                    </NavLink>
                                </div> 
                                <MdKeyboardArrowRight />
                                <div className={`${styles.headerSingleMenusLinks}`}>
                                    <NavLink to='/launchpad'
                                        className={({ isActive }) => isActive ? `${styles.staticLinks} ${styles.active}` : `${styles.staticLinks}`}
                                    >
                                        Listings
                                    </NavLink>
                                </div>
                                <MdKeyboardArrowRight />
                                <div className={`${styles.headerSingleMenusLinks}`}>
                                    <NavLink to='/request-token-types'
                                        className={({ isActive }) => isActive ? `${styles.staticLinks} ${styles.active}` : `${styles.staticLinks}`}
                                    >
                                        Request token types
                                    </NavLink>
                                </div>
                            </div>
                            <Button
                                // isLoading={false}
                                loadingText="Redirecting..."
                                btnText="Back"
                                onClick={() => navigate(-1)}
                                className="backBtn"
                                selectedValue={null}
                            />
                        </div>
                        <div className={`${styles.tokenHeader} mt-3`}>
                            <p className={styles.tokenTitle}>Apply for Token Listing</p>
                            <p className={`${styles.tokenDesc} mt-2`}>Steps involved in listing a token on the Trevolt Exchange:</p>
                        </div>
                        {tokensData.map((item, index) => (
                            <div key={index} className={`${styles.tokensContainers} mt-4`}>
                                <div className={styles.tokensHead}>
                                    <div className={`${styles.leftTokensHead} mb-3 mb-lg-0`}>
                                        <h5 className={styles.tokenLabelValue}>{item.title}</h5>
                                        <p className={`${styles.tokenLabel} mt-3`}>{item.description}</p>
                                    </div>
                                    <Button
                                        // isLoading={false}
                                        loadingText="Redirecting..."
                                        btnText={item.btnName}
                                        onClick={() => navigate(item.url)}
                                        className="cardSuccessBtnSm"
                                        selectedValue={null}
                                    />
                                </div>
                            </div>
                        ))}
                    </div>
                </section>
            </main>
        </>
    );
};

export default RequestTokenSelect;
