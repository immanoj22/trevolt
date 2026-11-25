import React, { useState } from 'react'
import { Link, NavLink } from 'react-router-dom'
import { FaArrowRight } from "react-icons/fa6";


import config from '../../config/env';
import styles from './footer.module.css'
import Images from '../../utils/Images'
import { useGlobalContext } from '../../context/GlobalProvider';
import { newSubscribe } from '../../actions/footerAction';
import { showToastMessage } from '../../lib/toast';
import { isDisposableEmailDomain } from '../../lib/emailValidation';

const EMAIL_REGEX = /^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.(com|net|org|co|in|io|gov|edu|info|biz)$/i;

const Footer = () => {

    const { theme } = useGlobalContext()
    const [subscriber, setSubscriber] = useState({ email: "" });
    const handleSubmit = async () => {
        const email = subscriber.email?.trim();
        if (!email) {
            showToastMessage("Email is required. Please fill in this field.", "error");
            return;
        }
        if (!EMAIL_REGEX.test(email)) {
            showToastMessage("Please enter a valid email address.", "error");
            return;
        }
        if (isDisposableEmailDomain(email)) {
            showToastMessage("Disposable or temporary email addresses are not allowed. Please use a valid email address.", "error");
            return;
        }
        const addSubscriber = await newSubscribe(subscriber);
        if (addSubscriber?.status) {
            showToastMessage(addSubscriber?.message || "Subscribed successfully", "success");
            setSubscriber({ "email": "" })
        } else {
            showToastMessage(addSubscriber?.message ? addSubscriber?.message : addSubscriber?.errors?.email || "Something went wrong", "error");
        }
    }

    const handleChange = (e) => {
        setSubscriber({ ...subscriber, "email": e.target.value });
    }

    return (
        <footer className={styles.footer}>
            <div className={styles.footerTop}>
                <div className='container custom-container'>
                    <div className={styles.footerTopWrapper}>
                        <div className={styles.footerLogoContainer}>
                            <Link to={"/"}>
                                <img src={theme == 'dark' ? Images.logo : Images.logoDark} alt="logo" className={styles.footerLogo} />
                            </Link>
                            <p className={styles.footerDesc}>
                              Trevolt is a modern derivatives trading platform, offering secure and seamless access to futures, options and perpetual contracts. 
                            </p>
                        </div>
                        <div className={styles.footerMenus}>
                            <p className={styles.footerMenusTitle}>
                                Company
                            </p>
                            <ul className={styles.footerMenusUl}>
                                <li>
                                    <NavLink to='/about-us'>About us</NavLink>
                                </li>
                                <li>
                                    <NavLink to='/terms-and-conditions'>Terms and Conditions</NavLink>
                                </li>
                                <li>
                                    <NavLink to='/privacy-policy'>Privacy & Cookies policy</NavLink>
                                </li>
                                <li>
                                    <NavLink to='/fees'>Fees</NavLink>
                                </li>
                                {/* <li>
                                    <NavLink to='/careers'>Careers</NavLink>
                                </li>
                                <li>
                                    <NavLink to='/contact-us'>Contact Us</NavLink>
                                </li> */}

                            </ul>
                        </div>
                        <div className={styles.footerMenus}>
                            <p className={styles.footerMenusTitle}>
                                Resources & Support
                            </p>
                            <ul className={styles.footerMenusUl}>
                                {/* <li>
                                    <NavLink to='/api-doc'>API Doc</NavLink>
                                </li> */}
                                {/* <li>
                                    <NavLink to='/rise-ticket'>Rise a Ticket</NavLink>
                                </li> */}
                                <li>
                                    <NavLink to={config.FRESHDESK}>Support Centre 24/7</NavLink>
                                </li>
                                {/* <li>
                                    <NavLink to='/user-guide'>User Guide</NavLink>
                                </li>
                                <li>
                                    <NavLink to='/referral'>Referral</NavLink>
                                </li> */}
                            </ul>
                        </div>
                        {/* <div className={styles.footerMenus}>
                            <p className={styles.footerMenusTitle}>
                                Institution
                            </p>
                            <ul className={styles.footerMenusUl}>
                             <li>
                                    <NavLink to='/login'>Login</NavLink>
                                </li> 
                                <li>
                                    <NavLink to='/institutional-apply'>Register</NavLink>
                                </li>

                            </ul>
                        </div> */}
                        <div className={styles.footerSubscribe}>
                            <p className={styles.footerMenusTitle}>
                                Subscribe us
                            </p>
                            <p className={styles.footerDesc}>
                               Subscribe to get the latest market insights, trading updates, and platform announcements straight to your inbox. 
                            </p>
                            <div className={styles.subscribeInput}>
                                <input type="text" placeholder='example@yourmail.com' value={subscriber.email} onChange={(e) => handleChange(e)} />
                                <button aria-label='ArrowRight' onClick={handleSubmit}>
                                    <FaArrowRight />
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className='container custom-container'>
                <div className={styles.footerBottom}>
                    <div className={styles.footerBottomLeft}>
                        <p className={styles.footerBoldText}>Join our community</p>
                        <div className={styles.footerSocialIconsContainer}>
                            {/* <a href="www.discord.com" target='_blank' className={styles.footerSocialLinks}>
                                <img src={Images.discord} alt="discord" className={`themeFilterIcon ${styles.footerSocialIcons}`} />
                            </a> */}
                            <a href="#" target='_blank' className={styles.footerSocialLinks}>
                                <img src={Images.youtube} alt="youtube" className={`themeFilterIcon ${styles.footerSocialIcons}`} />
                            </a>
                            <a href="#" target='_blank' className={styles.footerSocialLinks}>
                                <img src={Images.twitter} alt="twitter" className={`themeFilterIcon ${styles.footerSocialIcons}`} />
                            </a>
                            <a href="#" target='_blank' className={styles.footerSocialLinks}>
                                <img src={Images.instagram} alt="instagram" className={`themeFilterIcon ${styles.footerSocialIcons}`} />
                            </a>
                            <a href="https://www.facebook.com/profile.php?id=61585290755502" target='_blank' className={styles.footerSocialLinks}>
                                <img src={Images.facebook} alt="facebook" className={`themeFilterIcon ${styles.footerSocialIcons}`} />
                            </a>
                        </div>
                    </div>
                    <div className={styles.footerBottomRight}>
                        <p className={styles.footerCopyright}>
                            Copyright @ 2026. All Rights Reserved.
                        </p>
                        <p className={`${styles.footerCopyright} mt-1`}>
                            Charts Powered by
                            <a href="https://www.tradingview.com/" target="_blank">
                                Tradingview
                            </a>
                        </p>
                    </div>
                </div>
            </div>
        </footer>
    )
}

export default Footer
