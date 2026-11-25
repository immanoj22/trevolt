/** PACKAGE IMPORT */
import React, { useState } from 'react'
import { IoIosArrowBack, IoIosCloseCircleOutline } from "react-icons/io";
import { useSelector } from "react-redux";
import { useParams } from "react-router-dom";

/** LOCAL FILES IMPORT */
import styles from '../styles/tradeActionPanel.module.css'
import TradeActionCard from './TradeActionCard'
import BracketOrder from './BracketOrder';

/** CODE START */

const initialState = {
    pairId: "",
    price: "",
    quantity: "",
    buyorsell: "buy",
    reduce_only: false,
    makeronly: false,
    isTrailingOrder: false,
    trailPrice: 0,
    trailTypePrice: 0,
    trailType: "market",
    orderType: "limit",
    isTake: false,
    isStop: false,
    typeTIF: "",
    orderCost: 0,
    orderValue: 0,
    margin: 0,
    fees: 0,
    stopPrice: "",
    leverage: 1,
    takeProfit: {
        stopPrice: "",
        price: "",
        orderType: "bracket_tp_market"
    },
    stopLoss: {
        stopPrice: "",
        price: "",
        orderType: "bracket_sl_market"
    }
}

const TradeActionPanel = ({ onClose }) => {
    const { futureTicker, futureTradePair } = useSelector((state) => state.future);
    const { tikerRoot } = useParams();

    const [enableBracketOrder, setEnableBracketOrder] = useState(false);
    const [formData, setFormData] = useState(initialState);

    const handleShowBracketOrder = () => {
        setEnableBracketOrder(true);
    };

    const handleHideBracketOrder = () => {
        setEnableBracketOrder(false);
    };

    return (
        <>
            <div className={`${styles.container} ${styles.tradeActionContainer}`}>
                {onClose && <IoIosCloseCircleOutline onClick={onClose} className={styles.containerClosebtn} />}
                {enableBracketOrder ?
                    <div className={styles.bracketHeader} data-panel-drag-handle="true">
                        <button
                            aria-label='arrowBack'
                            className={'borderLessButton'}
                            onClick={handleHideBracketOrder}>
                            <IoIosArrowBack />
                        </button>
                        <p className={styles.title}>
                            Bracket Order
                        </p>
                    </div>
                    :
                    <div className={styles.header} data-panel-drag-handle="true">
                        <div className={styles.tabCard}>
                            <div className={styles.tabCardHeader}>
                                <button
                                    aria-label='buy'
                                    data-click-effect="none"
                                    className={`${styles.tabCardLink} ${formData.buyorsell == 'buy' ? styles.buy : ''}`}
                                    onClick={() => setFormData({ ...formData, buyorsell: 'buy' })}>
                                    Buy | Long
                                </button>
                                <button
                                    data-click-effect="none"
                                    aria-label='sell'
                                    className={`${styles.tabCardLink} ${formData.buyorsell == 'sell' ? styles.sell : ''}`}
                                    onClick={() => setFormData({ ...formData, buyorsell: 'sell' })}>
                                    Sell | Short
                                </button>
                            </div>
                        </div>
                    </div>
                }

                <div className={`${styles.tabCardBody} ${enableBracketOrder ? styles.bracketOrderBody : ''}`}>
                    {enableBracketOrder ?
                        <BracketOrder
                            handleClose={handleHideBracketOrder}
                            handleChange={(value) => {
                                setFormData({
                                    ...formData,
                                    takeProfit: value.takeProfit,
                                    stopLoss: value.stopLoss,
                                    isStop: true,
                                    isTake: true
                                });
                                handleHideBracketOrder();
                            }}
                            formData={formData}
                            errors=""
                            initialState={initialState}
                        />
                        :
                        <TradeActionCard
                            setEnableBracketOrder={setEnableBracketOrder}
                            handleShowBracketOrder={handleShowBracketOrder}
                            formData={formData}
                            setFormData={setFormData}
                            initialState={initialState}
                        />
                    }
                </div>
            </div>
        </>
    );
};

export default TradeActionPanel;