import React, { useState } from 'react'
import styles from "../../styles/strategyBuilder.module.css"
import Button from '../../../../components/Button/Button'
import { getContractLabel } from './contractLabel'
import { contractPayoffAtPrice, contractEstimatedPriceAtTarget } from './payoffMath'

export default function PnLTableTab({
    contracts,
    targetPrice,
    multiplier = 1,
    daysAhead = 0,
    selectedIds,
    onToggleContract,
    onToggleAll,
    onCloseSelected,
    hasLivePositions = false,
}) {
    const [groupByExpiry, setGroupByExpiry] = useState(false);

    const selectedCount = contracts.filter((c) => selectedIds.has(c.id)).length;
    const allSelected = contracts.length > 0 && selectedCount === contracts.length;

    const renderRow = (c) => {
        const estimatedPrice = Number.isFinite(targetPrice) ? contractEstimatedPriceAtTarget(c, targetPrice, daysAhead) : null;
        const targetPnl = Number.isFinite(targetPrice) ? contractPayoffAtPrice(c, targetPrice, daysAhead) * multiplier : null;
        return (
            <tr key={c.id}>
                <td>
                    <div className={styles.pnlContractTd}>
                        <div className="custom-checkInput__container">
                            <label className="custom-checkInput__label">
                                <input type="checkbox" checked={selectedIds.has(c.id)} onChange={() => onToggleContract(c.id)} />
                                <span className="custom-checkInput__checkmark"></span>
                            </label>
                        </div>
                        <button className={styles[c.buyOrSell ? "buyLabel" : "sellLabel"]}>
                            {c.buyOrSell ? "B" : "S"}
                        </button>
                        <div>
                            <span>{getContractLabel(c)}</span>
                            {c.kind !== 'futures' && (
                                <p className={styles.pnlContractSubLabel}>{c.expiryLabel} | {Number.isFinite(c.qty) ? c.qty.toFixed(3) : '0.000'}</p>
                            )}
                        </div>
                    </div>
                </td>
                {hasLivePositions && (
                    <td>
                        <p className={c.pnl >= 0 ? 'table-value__profit' : 'table-value__loss'}>{Number.isFinite(c.pnl) ? c.pnl.toFixed(2) : '-'}</p>
                    </td>
                )}
                <td>
                    {targetPnl !== null ? (
                        <p className={targetPnl >= 0 ? 'table-value__profit' : 'table-value__loss'}>{targetPnl.toFixed(2)}</p>
                    ) : "-"}
                </td>
                <td>{estimatedPrice !== null ? estimatedPrice.toFixed(2) : "-"}</td>
                {hasLivePositions && <td>{Number.isFinite(c.markPrice) ? c.markPrice.toFixed(2) : "-"}</td>}
            </tr>
        );
    };

    const groups = groupByExpiry
        ? Array.from(new Set(contracts.map((c) => c.expiryLabel))).map((label) => ({
            label,
            items: contracts.filter((c) => c.expiryLabel === label),
        }))
        : null;

    return (
        <div className={styles.baTab2}>
            <div className={styles.pnlTableHeader}>
                <label className={styles.groupByExpiryToggle}>
                    Group By Expiry
                    <input type="checkbox" checked={groupByExpiry} onChange={(e) => setGroupByExpiry(e.target.checked)} />
                </label>
                {hasLivePositions && (
                    <Button
                        btnText={`Close ${selectedCount > 0 ? selectedCount : 'All'}`}
                        className="dangerOuterlineButton"
                        disabled={selectedCount === 0}
                        onClick={() => onCloseSelected?.()}
                    />
                )}
            </div>
            <table>
                <thead>
                    <tr>
                        <th>
                            <div className={styles.pnlContractTd}>
                                <div className="custom-checkInput__container">
                                    <label className="custom-checkInput__label">
                                        <input type="checkbox" checked={allSelected} onChange={() => onToggleAll?.()} />
                                        <span className="custom-checkInput__checkmark"></span>
                                    </label>
                                </div>
                                <span>Contracts ({selectedCount}/{contracts.length})</span>
                            </div>
                        </th>
                        {hasLivePositions && <th>UPNL</th>}
                        <th>Target PnL</th>
                        <th>Est. Price</th>
                        {hasLivePositions && <th>Mark Price</th>}
                    </tr>
                </thead>
                <tbody>
                    {groups
                        ? groups.map((group) => (
                            <React.Fragment key={group.label}>
                                <tr>
                                    <td colSpan={hasLivePositions ? 4 : 2} className={styles.expiryGroupHeader}>{group.label}</td>
                                </tr>
                                {group.items.map(renderRow)}
                            </React.Fragment>
                        ))
                        : contracts.map(renderRow)}
                </tbody>
            </table>
        </div>
    )
}
