import React from 'react'
import styles from "../../styles/strategyBuilder.module.css"
import PnLChart from '../../../../components/Charts/PnLChart'

export default function PnLChartTab({
    currentPrice,
    curve,
    expiryCurve,
    targetPrice,
    targetPnl,
    projectedPct,
}) {
    const hasTargetPnl = Number.isFinite(targetPnl);
    const isProfit = hasTargetPnl && targetPnl >= 0;
    return (
        <div className={styles.baTab1}>
            <div className={styles.chartHeaderRow}>
                <div>
                    <span className={styles.legendDot} data-type="expiry"></span>On Expiry Date
                </div>
                <div className={styles.currentPriceBadge}>Current Price {currentPrice}</div>
                <div>
                    <span className={styles.legendDot} data-type="target"></span>On Target Date
                </div>
            </div>
            <div className={styles.chartWrapper}>
                <PnLChart series={curve} expirySeries={expiryCurve} currentPrice={parseFloat(currentPrice)} targetPrice={targetPrice} targetPnl={targetPnl} />
            </div>

            {hasTargetPnl && (
                <div className={`${styles.projectedBanner} ${isProfit ? styles.projectedProfit : styles.projectedLoss}`}>
                    Projected {isProfit ? 'Profit' : 'Loss'}: {targetPnl.toFixed(2)} ({Number.isFinite(projectedPct) ? projectedPct.toFixed(0) : 0}%)
                </div>
            )}
        </div>
    )
}
