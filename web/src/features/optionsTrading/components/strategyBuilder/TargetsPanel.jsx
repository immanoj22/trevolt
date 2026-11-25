import React, { useState } from 'react'
import styles from "../../styles/strategyBuilder.module.css"
import { FaUndoAlt } from "react-icons/fa"
import { MdKeyboardArrowDown, MdKeyboardArrowUp } from 'react-icons/md'

export default function TargetsPanel({
    targetPriceLabel,
    targetPrice,
    priceMin,
    priceMax,
    onPriceChange,
    onPriceReset,
    dateValue,
    onDateChange,
    onDateReset,
    targetDateLabel,
    daysToExpiry,
}) {
    const [expanded, setExpanded] = useState(true);

    return (
        <div className={styles.targetsSection}>
            <button className={styles.targetsHeader} onClick={() => setExpanded((p) => !p)}>
                <span>Targets</span>
                {expanded ? <MdKeyboardArrowUp /> : <MdKeyboardArrowDown />}
            </button>

            {expanded && (
                <>
                    <div className={styles.chartControlBlock}>
                        <div className={styles.chartControlHeader}>
                            <div className={styles.chartControlLabel}>
                                <h4>{targetPriceLabel}</h4>
                                <button aria-label="resetPrice" onClick={onPriceReset}>
                                    <FaUndoAlt /> Reset
                                </button>
                            </div>
                            <div className={styles.chartControlValue}>{targetPrice ? targetPrice.toFixed(2) : "-"}</div>
                        </div>
                        <input
                            min={priceMin}
                            max={priceMax}
                            step="0.01"
                            className={styles.rangebarInput}
                            value={targetPrice}
                            type="range"
                            onChange={onPriceChange}
                            style={{ '--progress': `${(priceMax - priceMin) > 0 ? ((targetPrice - priceMin) / (priceMax - priceMin)) * 100 : 0}%` }}
                        />
                    </div>

                    <div className={styles.chartControlBlock}>
                        <div className={styles.chartControlHeader}>
                            <div className={styles.chartControlLabel}>
                                <h4>Target Date</h4>
                                <button aria-label="resetDate" onClick={onDateReset}>
                                    <FaUndoAlt /> Reset
                                </button>
                            </div>
                            <div className={styles.chartControlValue}>
                                <p>{targetDateLabel}</p>
                                <span>{daysToExpiry} days <em>ahead</em></span>
                            </div>
                        </div>
                        <input min={0} max={100} className={styles.rangebarInput} value={dateValue} type="range" onChange={onDateChange} style={{ '--progress': `${dateValue}%` }} />
                    </div>
                </>
            )}
        </div>
    )
}
