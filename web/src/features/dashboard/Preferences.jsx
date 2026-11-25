import React, { useEffect, useState } from 'react';
import styles from "./styles/authInnerPage.module.css";
import { useSelector } from 'react-redux';
import { getSubAccount, updatePreferences } from '../../actions/subAccountAction';
import { showToastMessage } from '../../lib/toast';

export default function Preferences() {
    const { userdetails } = useSelector((state) => state.user)
    const [confirmMsg, setConfirmMsg] = useState({})
    const [emailNotify, setEmailNotify] = useState({})
    const [pushNotify, setPushNotify] = useState({})


    const handleCheckBox = async (e, type) => {
        try {
            const { name, checked } = e.target;

            const payload = {
                accountId: userdetails?.accountId,
                notifyType: type,
                messageType: e.target.name,
                checked: e.target.checked
            }
            const result = await updatePreferences(payload, userdetails?.secretKey)
            if (result.status) {
                if (type == "push") {
                    setPushNotify(prev => ({
                        ...prev,
                        [name]: checked,
                    }));
                }
                if (type == "email") {
                    setEmailNotify(prev => ({
                        ...prev,
                        [name]: checked,
                    }));
                }
                if (type == "confirm") {
                    setPushNotify(prev => ({
                        ...prev,
                        [name]: checked,
                    }));
                }
                showToastMessage(result.message, 'success')
            }
        } catch (error) {
            console.log("handleCheckBox", error)
        }
    }

    useEffect(() => {
        setConfirmMsg(userdetails?.confirmMsg)
        setEmailNotify(userdetails?.emailNotify)
        setPushNotify(userdetails?.pushNotify)
    }, [userdetails])

    return (
        <div className={styles.preferencesPage}>
            <div className='mb-4'>
                <h5 className={styles.pageTitle}>Preferences</h5>
            </div>
            <div className='px-3 py-3'>
                <div className={styles.preferenceCard}>
                    <div className={styles.headingPart}>
                        <h3>Push Notifications</h3>
                        <p>We send push notifications on certain events. You can choose to disable some or all of them.
                        </p>
                    </div>
                    <div className={styles.bodyPart}>
                        <ul>
                            <li>
                                <div className="custom-checkInput__container mt-1">
                                    <label className="custom-checkInput__label">
                                        <input
                                            type="checkbox"
                                            name="isLiquidation"
                                            checked={pushNotify?.isLiquidation || false}

                                            onChange={(e) => handleCheckBox(e, "push")}
                                        />
                                        <span className="custom-checkInput__checkmark"></span>
                                    </label>
                                </div>
                                <div>
                                    <label htmlFor="">Liquidation</label>
                                </div>
                            </li>
                            <li>
                                <div className="custom-checkInput__container mt-1">
                                    <label className="custom-checkInput__label">
                                        <input
                                            type="checkbox"
                                            name="isorderFill"
                                            checked={pushNotify?.isorderFill || false}
                                            onChange={(e) => handleCheckBox(e, "push")}
                                        />
                                        <span className="custom-checkInput__checkmark"></span>
                                    </label>
                                </div>
                                <div>
                                    <label htmlFor="">Order Fill</label>
                                </div>
                            </li>
                            <li>
                                <div className="custom-checkInput__container mt-1">
                                    <label className="custom-checkInput__label">
                                        <input
                                            type="checkbox"
                                            name='isstopOrderTrigger'
                                            checked={pushNotify?.isstopOrderTrigger || false}
                                            onChange={(e) => handleCheckBox(e, "push")}
                                        />
                                        <span className="custom-checkInput__checkmark"></span>
                                    </label>
                                </div>
                                <div>
                                    <label htmlFor="">Stop Order Trigger</label>
                                </div>
                            </li>
                        </ul>
                    </div>
                </div>
                <hr className={styles.deviderTag} />
                <div className={styles.preferenceCard}>
                    <div className={styles.headingPart}>
                        <h3>Email Alerts</h3>
                        <p>
                            We send emails on certain events. You can choose to disable some or all of them.
                        </p>
                    </div>
                    <div className={styles.bodyPart}>
                        <ul>
                            <li>
                                <div className="custom-checkInput__container mt-1">
                                    <label className="custom-checkInput__label">
                                        <input
                                            type="checkbox"
                                            name="isLiquidation"
                                            checked={emailNotify?.isLiquidation || false}
                                            onChange={(e) => handleCheckBox(e, "email")}
                                        />
                                        <span className="custom-checkInput__checkmark"></span>
                                    </label>
                                </div>
                                <div>
                                    <label htmlFor="">Liquidation</label>
                                </div>
                            </li>
                            <li>
                                <div className="custom-checkInput__container mt-1">
                                    <label className="custom-checkInput__label">
                                        <input
                                            type="checkbox"
                                            name="isorderFill"
                                            checked={emailNotify?.isorderFill || false}
                                            onChange={(e) => handleCheckBox(e, "email")}
                                        />
                                        <span className="custom-checkInput__checkmark"></span>
                                    </label>
                                </div>
                                <div>
                                    <label htmlFor="">Order Fill</label>
                                </div>
                            </li>
                            <li>
                                <div className="custom-checkInput__container mt-1">
                                    <label className="custom-checkInput__label">
                                        <input
                                            type="checkbox"
                                            name='isstopOrderTrigger'
                                            checked={emailNotify?.isstopOrderTrigger || false}
                                            onChange={(e) => handleCheckBox(e, "email")}
                                        />
                                        <span className="custom-checkInput__checkmark"></span>
                                    </label>
                                </div>
                                <div>
                                    <label htmlFor="">Stop Order Trigger</label>
                                </div>
                            </li>
                            <li>
                                <div className="custom-checkInput__container mt-1">
                                    <label className="custom-checkInput__label">
                                        <input
                                            type="checkbox"
                                            name="isorderCancel"
                                            checked={emailNotify?.isorderCancel || false}
                                            onChange={(e) => handleCheckBox(e, "email")}
                                        />
                                        <span className="custom-checkInput__checkmark"></span>
                                    </label>
                                </div>
                                <div>
                                    <label htmlFor="">Order Cancel</label>
                                </div>
                            </li>
                        </ul>
                    </div>
                </div>
                {/* <hr className={styles.deviderTag} />
                <div className={styles.preferenceCard}>
                    <div className={styles.headingPart}>
                        <h3>Confirmation Messages</h3>
                        <p>
                            We recommend that you enable confirmation before execution of certain actions on Trevolt.
                        </p>
                    </div>
                    <div className={styles.bodyPart}>
                        <ul>
                            <li>
                                <div className="custom-checkInput__container mt-1">
                                    <label className="custom-checkInput__label">
                                        <input
                                            type="checkbox"
                                            name="isLimitOrder"
                                            checked={confirmMsg?.isLimitOrder || false}
                                            onChange={(e) => handleCheckBox(e, "confirm")}
                                        />
                                        <span className="custom-checkInput__checkmark"></span>
                                    </label>
                                </div>
                                <div>
                                    <label htmlFor="">Limit Order</label>
                                </div>
                            </li>
                            <li>
                                <div className="custom-checkInput__container mt-1">
                                    <label className="custom-checkInput__label">
                                        <input
                                            type="checkbox"
                                            name="isMarketOrder"
                                            checked={confirmMsg?.isMarketOrder || false}
                                            onChange={(e) => handleCheckBox(e, "confirm")}
                                        />
                                        <span className="custom-checkInput__checkmark"></span>
                                    </label>
                                </div>
                                <div>
                                    <label htmlFor="">Market Order</label>
                                </div>
                            </li>
                            <li>
                                <div className="custom-checkInput__container mt-1">
                                    <label className="custom-checkInput__label">
                                        <input
                                            type="checkbox"
                                            name='isStopMarket'
                                            checked={confirmMsg?.isStopMarket || false}
                                            onChange={(e) => handleCheckBox(e, "confirm")}
                                        />
                                        <span className="custom-checkInput__checkmark"></span>
                                    </label>
                                </div>
                                <div>
                                    <label htmlFor="">Stop Market Order</label>
                                </div>
                            </li>
                            <li>
                                <div className="custom-checkInput__container mt-1">
                                    <label className="custom-checkInput__label">
                                        <input
                                            type="checkbox"
                                            name="isStopLimit"
                                            checked={confirmMsg?.isStopLimit || false}
                                            onChange={(e) => handleCheckBox(e, "confirm")}
                                        />
                                        <span className="custom-checkInput__checkmark"></span>
                                    </label>
                                </div>
                                <div>
                                    <label htmlFor="">Stop Limit Order</label>
                                </div>
                            </li>
                            <li>
                                <div className="custom-checkInput__container mt-1">
                                    <label className="custom-checkInput__label">
                                        <input
                                            type="checkbox"
                                            name="isTrailing"
                                            checked={confirmMsg?.isTrailing || false}
                                            onChange={(e) => handleCheckBox(e, "confirm")}
                                        />
                                        <span className="custom-checkInput__checkmark"></span>
                                    </label>
                                </div>
                                <div>
                                    <label htmlFor="">Trailing Stop Order</label>
                                </div>
                            </li>
                            <li>
                                <div className="custom-checkInput__container mt-1">
                                    <label className="custom-checkInput__label">
                                        <input
                                            type="checkbox"
                                            name='isTakeLimit'
                                            checked={confirmMsg?.isTakeLimit || false}
                                            onChange={(e) => handleCheckBox(e, "confirm")}
                                        />
                                        <span className="custom-checkInput__checkmark"></span>
                                    </label>
                                </div>
                                <div>
                                    <label htmlFor="">Take Profit Limit Order</label>
                                </div>
                            </li>
                            <li>
                                <div className="custom-checkInput__container mt-1">
                                    <label className="custom-checkInput__label">
                                        <input
                                            type="checkbox"
                                            name='isShowMobile'
                                            checked={confirmMsg?.isShowMobile || false}
                                            onChange={(e) => handleCheckBox(e, "confirm")}
                                        />
                                        <span className="custom-checkInput__checkmark"></span>
                                    </label>
                                </div>
                                <div>
                                    <label htmlFor="">Always show on mobile</label>
                                    <p>On mobile devices, all confirmation messages are enabled by default to protect against fat finger risks.</p>
                                </div>
                            </li>

                        </ul>
                    </div>
                </div> */}
            </div>
        </div>
    )
}

