import React, { useEffect, useState } from 'react'
import style from './staticPage.module.css';
import { getCms } from '../../actions/cmsAction';
import DOMPurify from 'dompurify';

const PrivacyPolicy = () => {
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
            pageName: 'Privacy Policy'
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
        <div className={style.policies + " privacy_policy"}>
            <div className='py-4 container'>
                {
                    data?.content !== '' ?
                        // <div dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(data?.content) }}>
                        <div
                            dangerouslySetInnerHTML={{
                                __html: DOMPurify.sanitize(data?.content, {
                                    ADD_TAGS: ['style'],
                                    ADD_ATTR: ['type'],
                                }),
                            }}
                        />

                        // </div>
            :
            <div className='my-5 py-5 text-center'>
                No Data Found
            </div>
                }
            {/* <div className=''>

                <h1>Privacy Policy</h1>
                <p> <b>Effective Date:</b> 07/10/2025</p>

                <p>
                    Trevolt Technologies Ltd (“<b>Trevolt</b>”, “<b>we</b>”, “<b>us</b>”, or “<b>our</b>”) operates the <b>Trevolt</b> mobile application (“<b>App</b>”) and website <a href="/www.trevolt.example" target='_blank' className={style.linkGreenClr}> www.trevolt.example. </a> This Privacy Policy explains how we collect, use, and protect your personal information when you use our App or related services.
                </p>

                <p>By downloading or using this App, you agree to this Privacy Policy. If you do not agree, please do not install or use the App. </p>
                <div className={style.listWrapper}>
                    <ol start={"1"}>
                        <li>
                            <h3>Company Information</h3>
                            <ul>
                                <li><b>Company Name:</b> Trevolt Technologies Ltd</li>
                                <li><b>CIN / Registration No.:</b> U55101DL2013PTC246874</li>
                                <li><b>PAN:</b> AAFCK0557N</li>
                                <li><b>GST:</b> 09AAFCK0557N1Z4</li>
                                <li><b>Head Office:</b> Provided on request</li>
                                <li><b>Website:</b> <a href="www.trevolt.example" target='_blank' style={{ color: '#2563EB' }} > www.trevolt.example </a></li>
                                <li><b>Email:</b> support@trevolt.example</li>
                            </ul>
                        </li>
                        <li>
                            <h3>Information We Collect</h3>
                            <p>We collect and process the following types of information when you use our App: </p>
                            <ol>
                                <li>
                                    <h3>Personal Information</h3>
                                    <ul>
                                        <li>Full name, date of birth, and contact details</li>
                                        <li>Address and nationality</li>
                                        <li>Identity documents (PAN, Aadhaar, or Passport)</li>
                                        <li>Bank details (for deposits, withdrawals, or verification)</li>
                                        <li>Trading account information and activity data</li>
                                    </ul>
                                </li>
                                <li>
                                    <h3>KYC Verification Data</h3>
                                    <p>
                                        To comply with legal and regulatory requirements, we use <a href="/Digio.in" target='_blank' className={style.linkGreenClr}> Digio.in </a> — a third-party KYC and digital signing service.
                                    </p>
                                    <p>
                                        When you complete KYC in our App, your identity documents are securely transmitted to Digio for verification via API.
                                    </p>
                                    <p>
                                        For more details on how Digio processes your information, please review their privacy policy:
                                    </p>
                                    <p>
                                        👉 <a href="https://www.digio.in/privacy-policy" target='_blank'> https://www.digio.in/privacy-policy </a>
                                    </p>
                                </li>
                                <li>
                                    <h3>Automatically Collected Information</h3>
                                    <ul>
                                        <li>Device and app information (model, OS, IP address)</li>
                                        <li>Usage logs, crash reports, analytics data</li>
                                        <li>Cookies and session identifiers (if applicable in webview or browser-based components)</li>
                                    </ul>
                                </li>
                            </ol>

                        </li>
                        <li>
                            <h3>How We Use Your Data</h3>
                            <p>We use your personal data for the following purposes:</p>
                            <ul>
                                <li>To register your account and verify your identity </li>
                                <li>To complete mandatory KYC and AML (Anti-Money Laundering) checks</li>
                                <li>To process deposits, withdrawals, and trades </li>
                                <li>To provide customer support and service updates</li>
                                <li>To maintain regulatory compliance and prevent fraud </li>
                                <li>To send notifications or marketing communications (only with consent)</li>
                                <li>To improve App performance and user experience </li>
                            </ul>
                            <p>We <b>do not</b> sell or rent your personal data.</p>
                        </li>
                        <li>
                            <h3>Data Sharing</h3>
                            <p>Your information may be shared only with: </p>
                            <ul>
                                <li><b>Digio Technologies Pvt. Ltd.</b> – for KYC and eSign verification</li>
                                <li><b>Payment gateways, banks, or financial partners</b> – to process transactions</li>
                                <li><b>Regulatory bodies</b> – when required under applicable Indian laws</li>
                                <li><b>Service providers</b> – for hosting, analytics, and customer support</li>
                            </ul>
                            <p>All partners and vendors are contractually obligated to protect your information and use it only for the intended purpose.</p>
                        </li>
                        <li>
                            <h3>Data Security</h3>
                            <p>We use industry-standard security measures, including:</p>
                            <ul>
                                <li>SSL/TLS encryption</li>
                                <li>Secure cloud storage</li>
                                <li>Access controls and periodic audits</li>
                                <li>Encrypted APIs for KYC and payment processes</li>
                            </ul>
                            <p>Despite our best efforts, no system is completely secure. You share information at your own risk, though we take every possible step to protect it.</p>
                        </li>
                        <li>
                            <h3>Data Retention</h3>
                            <p>We retain your personal data only for as long as necessary to:</p>
                            <ul>
                                <li>Provide services and comply with regulatory obligations</li>
                                <li>Resolve disputes and enforce agreements</li>
                            </ul>
                            <p>After the retention period, your data will be securely deleted or anonymized.</p>
                        </li>
                        <li>
                            <h3>Your Rights</h3>
                            <p>You can:</p>
                            <ul>
                                <li>Access and update your personal information</li>
                                <li>Withdraw consent for data processing (where applicable)</li>
                                <li>Request deletion of your data (subject to legal limits)</li>
                            </ul>
                            <p>For any privacy-related request, please email <b>info@trevolt.example</b>.</p>
                        </li>
                        <li>
                            <h3>Third-Party Links</h3>
                            <p>The App may contain links to third-party websites or services (e.g., Digio). We are not responsible for their privacy practices. Please read their privacy policies before providing information.</p>
                        </li>
                        <li>
                            <h3>Children’s Privacy</h3>
                            <p>Our App is intended for users aged 18 years and above. We do not knowingly collect data from minors. If we learn that a child has shared personal data, we will delete it immediately.</p>
                        </li>
                        <li>
                            <h3>Updates to This Policy</h3>
                            <p>We may update this Privacy Policy periodically. Any changes will be posted here and reflected in the “Effective Date.” Continued use of the App after changes means you accept the updated policy.</p>
                        </li>
                    </ol>
                </div>
            </div> */}
        </div>
        </div >
    )
}

export default PrivacyPolicy
