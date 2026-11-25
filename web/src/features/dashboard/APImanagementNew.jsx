import React, { useEffect, useState } from 'react'
import styles from "../dashboard/styles/apiManagementNew.module.css";
import Button from '../../components/Button/Button';
import ApiManagementCard from './components/ApiManagementCard';
import ChooseApiType from './modal/ChooseApiType';
import SecurityVerification from './modal/SecurityVerification';
import { useSelector } from 'react-redux';
import isEmpty from 'is-empty';


const apiCardDatas = [
    {
        title: 'Trevolt'
    },
    {
        title: 'Test_bot'
    }
]
export default function APIManagementNew() {

    const { apiKeyList } = useSelector((state) => state.apikey);
    const { userdetails } = useSelector((state) => state.user);


    const [showApiType, setShowApiType] = useState(false);

    const [showSecurityVerification, setShowSecurityVerfication] = useState(false);
    const [apiKeyDetails, setapiKeyDetails] = useState([]);

    const handleApiType = () => {
        setShowApiType(!showApiType)
    }

    const handleSecurityVerification = () => {
        setShowSecurityVerfication(!showSecurityVerification);
    }
    useEffect(() => {
        window.scrollTo(0, 0)
    }, [])

    useEffect(() => {
        // Was `setapiKeyDetails(apiKeyList)` — a blind overwrite. That's fine
        // right after this component mounts, but ApiManagementCard.jsx's
        // delete flow and CreateApiModal.jsx's create flow both now refresh
        // this same Redux apiKeyList (see those files) so the list stays in
        // sync after any add/delete. The problem: that refresh re-fetches
        // every key from the server, and the server never returns a
        // plaintext secretKey for a key that already exists — only the
        // create-response has it, once. A blind overwrite here was replacing
        // a still-open "isNew" card (the one showing its QR/secret key,
        // meant to be visible until the user navigates away) with the
        // secret-less server copy the moment *any* unrelated key was
        // created or deleted elsewhere — flipping its QR to the locked
        // placeholder mid-session, before the user had a chance to copy it.
        // Merging instead of overwriting preserves that reveal state for any
        // key still flagged isNew, while still correctly reflecting adds/
        // deletes (including clearing down to an empty list).
        setapiKeyDetails((prevDetails) => {
            const stillRevealing = new Map(
                (prevDetails || []).filter((k) => k?.isNew).map((k) => [k._id, k])
            );
            return apiKeyList.map((k) => stillRevealing.get(k._id) || k);
        });
    }, [apiKeyList])
    return (
        <>
            <ChooseApiType
                setNewApikey={(data = {}) => {
                    if (!isEmpty(data) && data?._id && data?.apiKey) {
                        // CreateApiModal.jsx now refreshes Redux's apiKeyList
                        // before calling back here, so `apiKeyList` may
                        // already include this same key (without the
                        // isNew flag) by the time this fires. Filter it out
                        // before prepending the isNew-flagged copy so the
                        // "reveal secret key once" card doesn't render twice.
                        setapiKeyDetails([{ ...data, isNew: true }, ...apiKeyList.filter((k) => k?._id !== data?._id)])
                    }

                }}
                show={showApiType}
                handleClose={handleApiType} />

            <SecurityVerification
                show={showSecurityVerification}
                handleClose={handleSecurityVerification}
            />
            <div className={styles.apiManagementNewPage}>
                <div className={styles.apiNotesPart}>
                    <div className={styles.pageHeaderPart}>
                        <div>
                            <h2 className={styles.pageTitleText}>API Management</h2>
                        </div>
                        <div className='d-flex flex-wrap gap-2'>
                            <Button
                                btnText={"Create API"}
                                className='cardSuccessBtnSm'
                                onClick={() => setShowApiType(true)}
                            />
                            {/* <Button 
                            btnText={"Create Tax Report API"} 
                            className='cardBtnRectangleSm'
                             /> */}
                            {/* <Button 
                            btnText={"Delete All API"} 
                            className='cardBtnRectangleSm' 
                            onClick={() => setShowSecurityVerfication(true)} /> */}
                        </div>
                    </div>
                </div>
                <div className={styles.apiNotesPart}>
                    <p className={styles.pageDesc}>1. Each account can create up to 5 API Keys.</p>
                    <p className={styles.pageDesc}>2. Do not disclose your API Keys, Secret Key(HMAC) or Private Key (Ed25519, RSA) to anyone to avoid asset losses. You should treat your API Key and your Secret Key (HMAC) or Private Key (Ed25519, RSA) like your passwords.</p>
                    <p className={styles.pageDesc}>3. It is recommended to restrict access to trusted IPs only to increase your account security.</p>
                    <p className={styles.pageDesc}>4. You will not be able to create an API Key if KYC is not completed.</p>
                </div>


                {apiKeyDetails.map((data, index) => (
                    <div key={index}>
                        <ApiManagementCard data={data} index={index} />
                    </div>
                ))}
            </div>
        </>
    )
}