import React from 'react'
import styles from "../../styles/strategyBuilder.module.css"
import { MdClose } from 'react-icons/md'

export default function OrderbookGreeksPanel({ onClose, greeks, orderbook }) {
    return (
        <div className={styles.orderbookGreeksPanel}>
            <div className={styles.ogPanelHeader}>
                <h4>Orderbook</h4>
                <button aria-label="close" onClick={onClose}>
                    <MdClose />
                </button>
            </div>
            <div className={styles.ogTableHead}>
                <span>Size (Lots)</span>
                <span>Price</span>
                <span>Size (Lots)</span>
            </div>
            {[...Array(5)].map((_, idx) => (
                <div className={styles.ogTableRow} key={idx}>
                    <span>{idx === 0 ? (orderbook?.bidQty ?? "-") : "-"}</span>
                    <span className={styles.ogPriceCell}>
                        <em className="value-profit">{idx === 0 ? (orderbook?.bidPrice ?? "-") : "-"}</em>
                        <em className="value-lose">{idx === 0 ? (orderbook?.askPrice ?? "-") : "-"}</em>
                    </span>
                    <span>{idx === 0 ? (orderbook?.askQty ?? "-") : "-"}</span>
                </div>
            ))}

            <h4 className={styles.ogGreeksTitle}>Greeks</h4>
            <div className={styles.ogGreeksRow}>
                <div>
                    <p>Delta</p>
                    <h5>{greeks?.delta ?? "-"}</h5>
                </div>
                <div>
                    <p>Gamma</p>
                    <h5>{greeks?.gamma ?? "-"}</h5>
                </div>
                <div>
                    <p>Theta</p>
                    <h5>{greeks?.theta ?? "-"}</h5>
                </div>
                <div>
                    <p>Vega</p>
                    <h5>{greeks?.vega ?? "-"}</h5>
                </div>
            </div>
        </div>
    )
}
