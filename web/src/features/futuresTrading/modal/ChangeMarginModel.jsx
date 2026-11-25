import React, { useEffect, useRef, useState } from 'react';
import { Modal } from "react-bootstrap";
import { IoClose } from "react-icons/io5";
import styles from "../styles/modal.module.css";
import Button from '../../../components/Button/Button';
import { useDispatch, useSelector } from "react-redux";
import { IoIosArrowBack, IoIosArrowForward } from 'react-icons/io';
import { MdOutlineCheck } from 'react-icons/md';
import { FaCheckCircle } from 'react-icons/fa';
import isEmpty from 'is-empty';
import { ChangeMarginMode, switchAccount } from '../../../actions/subAccountAction';
import { showToastMessage } from '../../../lib/toast';

/** Actions */

/** Redux */
const titleObj = {
    page1: "Change Margin Mode",
    page2: "Change Account",

}
const ChangeMarginModel = ({ show, handleClose, changeOption, marginMode, accountId }) => {
    const [dynamicTitle, setDynamicTitle] = useState(titleObj.page1);

    const chageTitleHandle = (value) => {
        setDynamicTitle(titleObj[value]);
    }

    const onClose = () => {
        setDynamicTitle(titleObj.page1);
        handleClose()
    }

    return (
        <div>
            <Modal
                centered
                size="md"
                backdrop="static"
                show={show}
                onHide={handleClose}
                className={styles.modalPrimary}
            >
                <Modal.Header className={styles.modalPrimaryHeader}>
                    <div className={styles.calcModalTabs}>
                        <h4 className={`${styles.modalHeaderTitle} `}>{dynamicTitle}</h4>
                    </div>
                    <button
                        aria-label='closeIcon'
                        className={styles.modalCloseButton}
                        onClick={handleClose}
                    >
                        <IoClose />
                    </button>
                </Modal.Header>
                <Modal.Body className={`${styles.modalPrimaryBody} pt-0`}>
                    <div className={styles.modalPrimaryBodyContainer}>
                        <ChangeMarginModelContent
                            changeOption={changeOption}
                            chageTitleHandle={chageTitleHandle}
                            type={'edit'}
                            marginMode={marginMode}
                            accountId={accountId}
                            handleClose={onClose}
                        />
                    </div>
                </Modal.Body>
            </Modal>
        </div>
    );
};

export const ChangeMarginModelContent = ({ changeOption = false, marginMode, accountId, handleClose, chageTitleHandle, type, setMarginMode }) => {
    const { userdetails, subAccountList } = useSelector((state) => state.user);
    const marginData = [
        {
            type: "isolated",
            name: "Isolated",
            trade: [
                "All instruments / pairs",
            ],
            points: [
                "Flexible leverage",
            ],
        },
        {
            type: "portfolio",
            name: "Portfolio",
            trade: [
                "Options",
                "Futures for underlyings with Options",
            ],
            points: [
                "PnL offset - Open positions profits can support losses and new orders",
                "Risk offset",
            ],
        },
        {
            type: "cross",
            name: "Cross",
            trade: [
                "All instruments / pairs",
            ],
            points: [
                "PnL offset - Open positions profits can support losses and new orders",
            ],
        },
    ];
    // Portfolio margin mode isn't fully implemented yet — temporarily hide
    // it from the list of choices a user can switch TO. `marginData`
    // itself is left fully intact (not filtered) so nothing here changes
    // for the — currently theoretical — case of an account that's already
    // on 'portfolio' mode: the `marginData.findIndex(...)` match on mount
    // below, and every `marginData[selectedMode]` read further down, keep
    // resolving exactly as before instead of hitting a missing/-1 index.
    // Every OTHER place in the app that branches on
    // `userdetails.marginMode == 'portfolio'` (Position.jsx, OpenOrders.jsx,
    // TradeActionCard.jsx, TradeTabs.jsx) is keyed off the account's real
    // margin mode, not this list, so none of that is affected either.
    const visibleMarginData = marginData.filter((item) => item.type !== 'portfolio');
    const [selectedMode, setSelectedMode] = useState(0);
    const [selectedAccountId, setSelectedselectedAccountId] = useState('');
    const [tabCount, setTabCount] = useState(0);
    const [isLoading, setIsLoading] = useState(false)

    const accountChangeHandle = (value = 0) => {
        setTabCount(value)
    }

    const changeTradeMode = async (marginMode) => {
        try {
            let { status, message } = await ChangeMarginMode({ marginMode, accountId: accountId }, userdetails.secretKey);
            showToastMessage(message, status ? 'success' : 'error')
            handleClose()
        } catch (e) {
            console.log("changeTradeMode_err", e);
        }
    }

    const onAccountChange = async () => {
        try {
            if (userdetails.accountId == selectedAccountId) {
                return true
            }
            setIsLoading(true)
            let { status, message, error } = await switchAccount({ accountId: selectedAccountId }, userdetails?.secretKey)
            if (status) {
                showToastMessage(message, 'success')
                setIsLoading(false)
                handleClose()
                window.location.reload();
                return
            }
            setIsLoading(false)
            setErrors(error)
            !isEmpty(message) && showToastMessage(message, 'error')
        } catch (err) {
            console.log(err, "onSubmit")
        }
    }

    useEffect(() => {
        setTabCount(0)
        if (!isEmpty(marginMode)) {
            let index = marginData.findIndex((val) => (val.type == marginMode))
            setSelectedMode(index)
        }
    }, [marginMode])

    useEffect(() => {
        if (!isEmpty(userdetails)) {
            setSelectedselectedAccountId(userdetails.accountId)
        }
    }, [userdetails])

    useEffect(() => {
        if (chageTitleHandle) {
            if (tabCount == 0) {
                chageTitleHandle("page1");
            }
            if (tabCount == 1) {
                chageTitleHandle("page2");
            }
        }
    }, [tabCount])

    return (
        <div className={styles.changeMarginModelContent}>
            <div className={styles.modal}>
                {
                    changeOption &&
                    <div className="d-flex justify-content-between my-3">
                        <p className="w-100 fs15 d-flex justify-content-between">
                            {
                                tabCount == 0 &&
                                <div className="w-100 fs15 d-flex justify-content-between">
                                    <div className="d-flex gap-2">
                                        Account in use
                                        <button onClick={() => { accountChangeHandle(1) }} className={`${styles.changeBtn} d-flex align-items-center gap-1`}>
                                            Change <IoIosArrowForward />
                                        </button>
                                    </div>
                                    <div className="d-flex gap-2 justify-content-between">
                                        <p>
                                            {userdetails?.accountName}
                                        </p>
                                    </div>
                                </div>
                            }
                            {/* {
                                tabCount == 1 &&
                                <>
                                    <button onClick={() => { accountChangeHandle(0) }} className={`${styles.changeBtn} d-flex align-items-center gap-1`}>
                                        <IoIosArrowBack />
                                    </button>
                                    Change Account
                                </>
                            } */}
                        </p>
                    </div>
                }
                {
                    tabCount == 0 &&
                    <div>
                        <div className="d-flex gap-2 mb-4">
                            {visibleMarginData.map((item) => {
                                const index = marginData.findIndex((m) => m.type === item.type);
                                return (
                                    <button
                                        key={item.type}
                                        className={`${styles.modeBtn} ${selectedMode === index ? styles.active : ""}`}
                                        onClick={() => setSelectedMode(index)}
                                    >
                                        {item.name}
                                    </button>
                                );
                            })}
                        </div>

                        <div className={styles.infoPart}>
                            <div className="mb-3">
                                <h4>You can trade</h4>
                                {marginData[selectedMode].trade.map((t, i) => (
                                    <p key={i}><MdOutlineCheck size={18} /> {t}</p>
                                ))}
                            </div>
                            <div className="mb-3">
                                <h4>Salient points</h4>
                                {marginData[selectedMode].points.map((p, i) => (
                                    <p key={i}><MdOutlineCheck size={18} /> {p}</p>
                                ))}
                            </div>
                        </div>

                        {marginData[selectedMode].type == marginMode ?
                            <Button
                                className="successFillRectangleBtn"
                                btnText={`Continue with ${marginData[selectedMode].name} Margin`}
                                staticClass="fs15"
                                onClick={() => {
                                    if (type == 'edit') {
                                        handleClose()
                                    } else {
                                        setMarginMode(marginData[selectedMode].type)
                                    }

                                }}
                            /> :
                            <Button
                                className="successFillRectangleBtn"
                                btnText={`Switch to ${marginData[selectedMode].name} Margin`}
                                staticClass="fs15"
                                onClick={() => {
                                    if (type == 'edit') {
                                        changeTradeMode(marginData[selectedMode].type)
                                    } else if (type == 'add') {
                                        setMarginMode(marginData[selectedMode].type)
                                    }
                                }}
                            />
                        }
                    </div>
                }
                {
                    tabCount == 1 &&
                    <div>
                        <div className={styles.infoPart}>
                            <ul className={styles.changeAccountPart}>
                                {subAccountList?.length > 0 ? subAccountList?.map((acc, index) => {
                                    let isSelected = acc.accountId == selectedAccountId ? true : false
                                    return (
                                        <li key={index} className="d-block w-100">
                                            <label
                                                className={`${styles.accountCard} py-2 w-100`}
                                                htmlFor={`listItem-${index}`}
                                            >
                                                {acc.accountName}
                                                <input
                                                    type="radio"
                                                    className="d-none"
                                                    name="accountList"
                                                    id={`listItem-${index}`}
                                                    defaultChecked={isSelected}
                                                    onChange={() => {
                                                        setSelectedselectedAccountId(acc.accountId)
                                                    }}
                                                />
                                                <div className="d-flex justify-content-between">
                                                    <h4>{acc.type}</h4>
                                                    <span className={styles.successIcon}>
                                                        <FaCheckCircle />
                                                    </span>
                                                </div>
                                                <div className="d-flex justify-content-between">
                                                    <h4>User Id</h4>
                                                    <span>{acc.accountId}</span>
                                                </div>
                                                <div className="d-flex justify-content-between">
                                                    <h4>Balance</h4>
                                                    <span>{acc.balance}</span>
                                                </div>
                                            </label>
                                        </li>
                                    )
                                }) : ""}
                            </ul>
                        </div>
                        <div className='d-flex gap-2'>
                            <Button className="darkFillRectangleBtn"
                                btnText={`Back`}
                                staticClass="fs15"
                                onClick={() => { accountChangeHandle(0) }} >
                            </Button>
                            <Button
                                isLoading={isLoading}
                                loadingText="Loading..."
                                className="successFillRectangleBtn"
                                btnText={`Ok`}
                                staticClass="fs15"
                                onClick={() => {
                                    onAccountChange()
                                }}
                            />
                        </div>
                    </div>
                }
            </div>
        </div>
    );
};
export default ChangeMarginModel;