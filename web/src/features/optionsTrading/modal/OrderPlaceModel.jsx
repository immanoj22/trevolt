import React, { useEffect, useState, useMemo } from 'react';
import { Modal } from "react-bootstrap";
import { IoClose } from "react-icons/io5";
import { useParams } from "react-router-dom";
import { useSelector } from "react-redux";
import isEmpty from 'is-empty';

import styles from "../../futuresTrading/styles/modal.module.css";
import Button from '../../../components/Button/Button';
import { capitalize } from '../../../lib/Common';
import { SoundEffect } from '../../../hooks/useClickSound';

const ORDER_TYPE_LABELS = {
    market: "Market",
    limit: "Limit",
    makeronly: "Maker Only",
    stop_limit: "Stop Limit",
    stop_market: "Stop Market",
    trailingStop: "Trailing Stop",
    take_profit_limit: "Take Profit Limit",
    take_profit: "Take Profit Market",
};

const orderPriceEnum = {
    "market": "Mark",
    "last": "Last",
    "index": "Index",
}

const LIMIT_TYPES = ["limit", "market", "makeronly"];
const CONDITIONAL_TYPES = ["stop_limit", "stop_market", "take_profit_limit", "take_profit", "trailingStop"];
const STOP_TYPES = ["stop_limit", "stop_market", "trailingStop"];
const EXIT_TYPES = ["take_profit_limit", "take_profit"]
const getOrderTypeLabel = (type) => ORDER_TYPE_LABELS[type] || "Limit";

const calcLiquidationPrice = (side, price, leverage, margin) => {
    try {
        price = parseFloat(price) || 0;
        leverage = parseFloat(leverage) || 1;
        margin = parseFloat(margin) || 0;
        let liqPrice = 0;

        if (side === "long") {
            liqPrice = (price * leverage) / (leverage + 1 - (margin / 100) * leverage);
            if (liqPrice > price) {
                liqPrice = price - (price * (margin / 100)) / leverage;
            }
        } else if (side === "short") {
            liqPrice = (price * leverage) / (leverage - 1 + (margin / 100) * leverage);
            if (liqPrice < price) {
                liqPrice = price + (price * (margin / 100)) / leverage;
            }
        }
        return liqPrice.toFixed(2);
    } catch {
        return 0;
    }
};

const OrderPlaceModel = ({ show, handleClose, formData = {}, orderPlacing, isLoading }) => {
    const { tikerRoot } = useParams();
    const { optionTicker, optionTradePair } = useSelector((state) => state.option);
    const { leverage } = useSelector((state) => state.user);
    const [liquidityPrice, setLiquidityPrice] = useState(0);
    const [trigger_type, setTrigger_type] = useState("above");

    const side = formData?.buyorsell === "buy" ? "long" : "short";
    useEffect(() => {
        // console.log("Order_Place_useEffect", formData, "____>");

        if (!isEmpty(formData)) {
            if (CONDITIONAL_TYPES.includes(formData?.orderType)) {
                let trigger_type = "above"
                if (STOP_TYPES.includes(formData?.orderType)) {
                    let trigger_type = formData.buyorsell == "buy" ? "above" : "below"
                } else if (EXIT_TYPES.includes(formData?.orderType)) {
                    let trigger_type = formData.buyorsell == "buy" ? "below" : "above"
                }
                setTrigger_type(trigger_type)
            }
            setLiquidityPrice(
                calcLiquidationPrice(side, formData?.price, formData?.leverage, optionTradePair?.maintenanceMargin)
            );
        }
    }, [formData, side]);

    const premium = useMemo(() => {
        // console.log("Order_PlaceUseMemo", formData, "Order_PlaceUseMemo", optionTicker);

        const basePrice =
            formData?.orderType === "market" ? optionTicker?.last : formData?.price;
        return ((basePrice || 0) * (formData?.quantity || 0)).toFixed(2);
    }, [formData, optionTicker]);

    return (
        <Modal
            centered
            size="md"
            show={show}
            onHide={handleClose}
            className={`${styles.modalPrimary} ${styles.orderPlaceModelComponent}`}
        >
            <Modal.Header className={`${styles.modalPrimaryHeader} ${styles.orderPlaceHeader}`}>
                <div className={`${styles.calcModalTabs} w-100 justify-content-center`}>
                    <h4 className={styles.modalHeaderTitle}>
                        Confirm your {getOrderTypeLabel(formData?.orderType)} Order
                    </h4>
                </div>
                {/* <button
                    aria-label="closeIcon"
                    className={styles.modalCloseButton}
                    onClick={handleClose}
                >
                    <IoClose />
                </button> */}
            </Modal.Header>

            <Modal.Body className={`${styles.modalPrimaryBody}  pt-0`}>
                <div className={styles.modalPrimaryBodyContainer}>
                    <div className={styles.orderPlaceModel}>
                        {LIMIT_TYPES.includes(formData?.orderType) && (
                            <p className={`${styles.subtitle} mt-2`}>
                                <span
                                    className={
                                        formData?.buyorsell === "buy" ? styles.green : styles.red
                                    }
                                >
                                    {capitalize(formData?.buyorsell)}
                                </span>{" "}
                                {formData?.quantity} of {tikerRoot}{" "}
                                {formData?.buyorsell === "buy" ? "<=" : ">="} {formData?.price}
                            </p>
                        )}

                        {CONDITIONAL_TYPES.includes(formData?.orderType) && (
                            <p className={`${styles.subtitle} mb-2`}>
                                Trigger at {orderPriceEnum[formData.trailType]} Price @ {formData?.stopPrice} and {trigger_type}
                            </p>
                        )}

                        <div className={styles.details}>
                            {formData.buyorsell == 'sell' ?
                                <div>
                                    <h3>Premium</h3>
                                    <span>
                                        {premium} {optionTicker?.quoteCurrency}
                                    </span>
                                </div>
                                :
                                <></>}

                            {/* {formData?.orderType === "market" && ( */}
                            {LIMIT_TYPES.includes(formData?.orderType) && (
                                <>
                                    <div>
                                        <h3>Est. Margin Required</h3>
                                        <span>
                                            {formData?.margin} {optionTicker?.quoteCurrency}  {formData.buyorsell == 'sell' ? `@ ${leverage}x` : ""} {" "}
                                            {/* {leverage}x */}
                                        </span>
                                    </div>
                                    <div>
                                        <h3>Est. Trading Fee</h3>
                                        <span>
                                            {formData?.fees} {optionTicker?.quoteCurrency}
                                        </span>
                                    </div>
                                    <div>
                                        <h3>Est. Execution Price</h3>
                                        <span>
                                            {optionTicker?.marketPrice} {optionTicker?.quoteCurrency}
                                        </span>
                                    </div>
                                    <div>
                                        <h3>Est. Liquidation Price</h3>
                                        {formData.buyorsell == 'sell' ?
                                            <span>
                                                {liquidityPrice} {optionTicker?.quoteCurrency}
                                            </span> : <span> NA </span>
                                        }
                                    </div>
                                </>
                            )}

                            <div>
                                <h3>Pos. Size after Execution</h3>
                                <span>
                                    {formData?.buyorsell === "sell" && "-"}
                                    {formData?.quantity} Qty
                                </span>
                            </div>
                        </div>

                        <div className="d-flex py-3 gap-3 justify-content-between">
                            <Button
                                isLoading={isLoading}
                                loadingText="Loading..."
                                btnText="Place Order"
                                className="successFillRectangleBtn"
                                clickTone='orderPlace'
                                onClick={() => {
                                    orderPlacing();
                                    SoundEffect({ sound: "sound1" });
                                }}
                            />
                            <Button
                                btnText="Cancel"
                                className="successOutLineRectangleBtn"
                                onClick={handleClose}
                            />
                        </div>

                        <p className={styles.footerNote}>
                            NB: All orders must execute within the allowed trading band. The
                            part of your order that will breach the trading band on execution
                            will be changed to a limit order with price = max allowed price.
                        </p>
                    </div>
                </div>
            </Modal.Body>
        </Modal>
    );
};

export default OrderPlaceModel;
