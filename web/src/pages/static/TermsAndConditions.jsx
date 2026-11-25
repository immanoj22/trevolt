import React, { useEffect, useState } from 'react'
import style from './staticPage.module.css';
import { getCms } from '../../actions/cmsAction';
import DOMPurify from 'dompurify';

const TermsAndConditions = () => {

    const [data, setData] = useState([]);

    useEffect(() => {
        window.scrollTo({
            top: 0,
            behavior: "smooth",
        });
    }, []);

    useEffect(() => {
        fetchCms();
    }, [])


    const fetchCms = async (data) => {

        let reqData = {
            pageName: 'Terms and Conditions'
        }

        try {
            const result = await getCms(reqData);
            if (result?.status) {
                setData(result?.data);
            }
        } catch (error) {
            console.log('error cms', error);
        }
    }

    // console.log('dataaaaaa', data)

    return (
        <div className={style.policies}>
            <div className='py-4 container'>
                {
                    data?.content !== '' ?
                        <div dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(data?.content) }}>

                        </div>
                        :
                        <div className='my-5 py-5 text-center'>
                            No Data Found
                        </div>
                }

                {/* <div className=''>
                    <h1>Terms &amp; Conditions</h1>
                    <p><b>Last Updated:</b> 07/10/2025 </p>

                    <p>
                        These Terms & Conditions (“<b>Terms</b>”) govern your access to and use of the services provided by <b>Trevolt</b> (referred to as “Trevolt”, “we”, “us”, or “our”) via its website, mobile application, and other platforms (collectively, the “Platform”). By registering an account, accessing or using any part of the Platform, you agree to be bound by these Terms (as updated from time to time). If you do not agree, you must not use the Platform.
                    </p>
                    <div className={style.listWrapper}>
                        <ol start={"1"}>
                            <li>
                                <h3>
                                    Definitions & Interpretation
                                </h3>
                                <ol >
                                    <li> <b>“User”, “you”, “your”</b> means any person who uses, accesses or interacts with the Platform or avails the services offered on the Platform.</li>
                                    <li> <b>“Services”</b> means any service, product, trading function, or feature provided on or via the Platform (e.g., trading, deposit, withdrawal, analytics, API access).</li>
                                    <li> <b>“Account”</b> means your registered user account on the Platform.</li>
                                    <li> Capitalised terms not defined herein shall have the meaning given to them elsewhere in these Terms.</li>
                                </ol>
                            </li>


                            <li>
                                <h3>
                                    Eligibility & Registration
                                </h3>
                                <ol>
                                    <li> To use the Platform, you must be at least 18 years of age and legally capable of entering into contracts under applicable laws.</li>
                                    <li> You must register an account, provide accurate, current, and complete information, and maintain and promptly update such information.</li>
                                    <li> You agree to comply with any identity verification (KYC) procedures, as required by law or by Trevolt’s policies.</li>
                                    <li> You are responsible for all activities conducted via your Account. You shall immediately notify us of any unauthorized use or breach of security.</li>
                                </ol>
                            </li>

                            <li>
                                <h3>
                                    Account Security
                                </h3>

                                <ol>
                                    <li>You are responsible for maintaining the confidentiality of your login credentials (username, password, 2FA). You must not share them.</li>
                                    <li>Trevolt shall not be liable for losses arising from unauthorized access to your account, unless due to our gross negligence or willful misconduct.</li>
                                </ol>
                            </li>

                            <li>
                                <h3>
                                    Services, Trading, Deposits & Withdrawals
                                </h3>

                                <ol>
                                    <li> Trevolt may provide trading services (derivatives, futures, options, etc.), as per the business model. (Modify according to actual services.)</li>
                                    <li>All orders, trades, or transactions are subject to our rules, risk parameters, margin requirements, limits, and internal policies.</li>
                                    <li>You agree to abide by the Platform’s trading rules, including margin maintenance, liquidation, and other risk controls.</li>
                                    <li>Deposits and withdrawals shall be governed by Trevolt’s deposit/withdrawal policy (fees, timing, supported currencies). Trevolt reserves the right to reject or delay deposits/withdrawals for security, compliance or operational reasons.</li>
                                    <li>Trevolt may charge fees, commissions or other charges for use of Services. These are as per the Fee Schedule available on the Platform, and may be modified from time to time. </li>
                                </ol>
                            </li>

                            <li>
                                <h3>
                                    Prohibited Uses
                                </h3>
                                <p>
                                    You must not:
                                </p>
                                <ol>
                                    <li> Use the Platform for illegal, fraudulent, or unauthorized purposes; </li>
                                    <li> Attempt to manipulate markets, engage in wash trading, spoofing, or other market abuse; </li>
                                    <li> Interfere with or disrupt the Platform, servers, or networks connected to the Platform; </li>
                                    <li> Use bots, scripts, crawlers, or automated means to access, monitor or use any part of the Platform, unless expressly permitted (e.g. via APIs); </li>
                                    <li> Violate any applicable laws or regulations (domestic or international). </li>
                                </ol>
                            </li>

                            <li>
                                <h3>
                                    Intellectual Property & User Content
                                </h3>
                                <ol>
                                    <li> All intellectual property rights in the Platform, software, data, content, trademarks, and logos are owned by Trevolt or its licensors.</li>
                                    <li>By using the Platform, you grant Trevolt a limited license to use, reproduce, store, transmit, display, or process your content for operation of the Platform.</li>
                                    <li> You represent that any content you provide is lawful and does not infringe on third-party rights.</li>
                                </ol>
                            </li>

                            <li>
                                <h3>
                                    Risk Acknowledgment & Disclaimer
                                </h3>
                                <ol>
                                    <li> You acknowledge trading and using financial/ services is inherently risky. Prices can be volatile, and you may lose some or all funds.</li>
                                    <li> Trevolt provides the Platform “as is” and “as available” and makes no warranties, express or implied, regarding accuracy, reliability, security, or fitness for a particular purpose.</li>
                                    <li>To the maximum extent permitted by law, Trevolt disclaims liability for any losses, damages, costs, or expenses arising from your use of the Platform, whether direct or indirect.</li>
                                </ol>
                            </li>
                            <li>
                                <h3>
                                    Indemnity
                                </h3>
                                <p>
                                    You agree to indemnify, defend and hold harmless Trevolt, its officers, directors, employees, agents and affiliates from all losses, claims, liabilities, damages, costs or expenses (including legal fees) arising out of:
                                </p>
                                <ul>
                                    <li>Your breach of these Terms; </li>
                                    <li>Your negligent or willful misconduct;</li>
                                    <li>Claims by third parties in relation to your use of the Platform or Services. </li>
                                </ul>
                            </li>

                            <li>
                                <h3>
                                    Suspension, Termination & Account Closure
                                </h3>
                                <ol>
                                    <li> Trevolt may suspend, restrict, or terminate your access (in whole or in part) at any time, with or without notice, for violation of these Terms, legal/regulatory obligations, suspected fraud or security risk.</li>
                                    <li> Upon termination, your right to use the Platform ceases. We may cancel your open orders, liquidate positions, and restrict withdrawals (if required for compliance).</li>
                                    <li> Certain provisions (Intellectual Property, Risk, Indemnity, Governing Law, etc.) shall survive termination.</li>
                                </ol>
                            </li>

                            <li>
                                <h3>
                                    Modifications to Terms & Services
                                </h3>
                                <ol>
                                    <li> Trevolt reserves the right to modify or update these Terms, Services, features, or fees, at its discretion.</li>
                                    <li> We will provide notice of material changes (e.g., via email or platform notification). Your continued use after changes constitutes acceptance.</li>
                                </ol>
                            </li>


                            <li>
                                <h3>
                                    Privacy & Data Protection
                                </h3>
                                <p>
                                    Your use of the Platform is subject to Trevolt’s Privacy Policy, which outlines how your personal data is collected, used, and protected. (Link/privacy clause.)
                                </p>
                            </li>

                            <li>
                                <h3>
                                    Limitation of Liability
                                </h3>
                                <p>
                                    To the maximum extent permissible under applicable law, Trevolt’s total liability to you for all claims arising under these Terms shall not exceed the amount you have paid to Trevolt (if any) in the past 12 months or a predetermined cap, whichever lower.
                                </p>
                            </li>

                            <li>
                                <h3>
                                    Governing Law, Dispute Resolution & Arbitration
                                </h3>
                                <ol>
                                    <li> These Terms shall be governed by and construed in accordance with the laws of India, without giving effect to conflict-of-law principles.</li>
                                    <li>Any dispute, controversy or claim arising from or relating to these Terms shall be resolved by binding arbitration under the rules of a suitable Indian arbitration center (for example, Delhi International Arbitration Centre) with seat in New Delhi, India.</li>
                                    <li>You and Trevolt agree that the arbitration shall be conducted individually, and you may not bring class, collective, or representative claims.</li>
                                    <li> Judgment upon any award rendered by arbitrator may be entered in any court having jurisdiction.</li>
                                </ol>
                            </li>


                            <li>
                                <h3>
                                    Severability & Waiver
                                </h3>
                                <p>
                                    If any provision of these Terms is held invalid, illegal or unenforceable, the remaining provisions will remain in full force. A waiver of any breach shall not operate as waiver of any other breach.
                                </p>
                            </li>
                            <li>
                                <h3>
                                    Miscellaneous
                                </h3>
                                <ol>
                                    <li>  You may not assign these Terms, except that Trevolt may assign to a successor or affiliate.</li>
                                    <li> Headings are for convenience only and do not affect interpretation.</li>
                                    <li> These Terms, together with any documents expressly incorporated by reference (Fee Schedule, Privacy Policy, etc.), constitute the entire agreement between you and Trevolt regarding the subject matter. </li>
                                </ol>
                            </li>
                        </ol>
                    </div>


                </div> */}
            </div>
        </div>
    )
}

export default TermsAndConditions;