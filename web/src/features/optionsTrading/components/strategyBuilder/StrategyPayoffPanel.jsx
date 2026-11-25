import React, { useEffect, useMemo, useState } from 'react'
import moment from 'moment'
import styles from "../../styles/strategyBuilder.module.css"
import { MdKeyboardArrowDown, MdKeyboardArrowUp } from 'react-icons/md'
import PnLChartTab from './PnLChartTab'
import TargetsPanel from './TargetsPanel'
import PnLTableTab from './PnLTableTab'
import GreeksTableTab from './GreeksTableTab'
import { buildPayoffCurve, computePayoffStats, totalPayoffAtPrice, computeOrderMargin } from './payoffMath'

const TABS = [
    { id: 2, label: "PNL Table" },
    { id: 3, label: "Greeks Table" },
]

const MAX_HORIZON_DAYS = 7;

// `positions` (the raw records the contracts were mapped from - see
// positionToContract.js) and `onCloseSelected` are optional: the plain
// Strategy Builder flow deals in hypothetical contracts with nothing real to
// close, while the Risk View flow passes both so this panel's own
// selection/Close-All can reuse the same close-position action Risk View
// already has, instead of re-implementing it here.
export default function StrategyPayoffPanel({ contracts, currentPrice, baseCurrency, multiplier, positions, onCloseSelected }) {
    const [expanded, setExpanded] = useState(true);
    const [activeTab, setActiveTab] = useState(2);
    const [dateValue, setDateValue] = useState(0);
    const [selectedIds, setSelectedIds] = useState(() => new Set(contracts.filter((c) => c.checked !== false).map((c) => c.id)));
    // Resync when the caller's contracts change which ids exist/are checked (e.g. the
    // plain Strategy Builder flow toggles `checked` in ContractRow, outside this panel) -
    // keyed on id+checked rather than array identity so this doesn't fight this panel's
    // own checkbox clicks on every re-render.
    const contractsKey = contracts.map((c) => `${c.id}:${c.checked}`).join(',');
    useEffect(() => {
        setSelectedIds(new Set(contracts.filter((c) => c.checked !== false).map((c) => c.id)));
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [contractsKey]);

    const hasLivePositions = Boolean(positions?.length);

    // The panel's own checkbox selection (independent of whatever `checked`
    // the caller's contracts came in with) drives every stat/chart/table below -
    // unchecking a leg here previews the payoff without it, same as unchecking
    // it in the main contracts list would.
    const activeContracts = useMemo(
        () => contracts.map((c) => ({ ...c, checked: selectedIds.has(c.id) })),
        [contracts, selectedIds]
    );

    const toggleContract = (id) => {
        setSelectedIds((prev) => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id); else next.add(id);
            return next;
        });
    };

    const toggleAllContracts = () => {
        setSelectedIds((prev) => (
            prev.size === contracts.length ? new Set() : new Set(contracts.map((c) => c.id))
        ));
    };

    const centerPrice = parseFloat(currentPrice) || 0;
    const daysAhead = (Number(dateValue) / 100) * MAX_HORIZON_DAYS;
    const targetDate = moment().add(daysAhead, 'days');

    // Two curves, matching the "On Expiry Date" (red) vs "On Target Date" (blue)
    // legend: the target-date curve reflects remaining time value via Black-Scholes,
    // the expiry curve is the classic kinked intrinsic-value-only payoff diagram.
    const curve = useMemo(
        () => buildPayoffCurve(activeContracts, centerPrice, multiplier, 80, 0.5, daysAhead),
        [activeContracts, centerPrice, multiplier, daysAhead]
    );
    const expiryCurve = useMemo(
        () => buildPayoffCurve(activeContracts, centerPrice, multiplier, 80, 0.5, 0, true),
        [activeContracts, centerPrice, multiplier]
    );
    const payoff = useMemo(
        () => computePayoffStats(activeContracts, centerPrice, multiplier),
        [activeContracts, centerPrice, multiplier]
    );

    const lowPrice = curve.length ? curve[0].x : centerPrice;
    const highPrice = curve.length ? curve[curve.length - 1].x : centerPrice;

    const [targetPrice, setTargetPrice] = useState(centerPrice);
    useEffect(() => {
        if (targetPrice === 0 && centerPrice !== 0) setTargetPrice(centerPrice);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [centerPrice]);
    const effectiveTargetPrice = curve.length ? targetPrice : centerPrice;
    // With nothing checked there's no curve/margin to speak of - a flat "Projected
    // Profit: 0.00 (0%)" banner would be actively misleading, so treat it as
    // "nothing selected" rather than "zero P&L".
    const hasSelection = selectedIds.size > 0;
    const hasPrice = centerPrice > 0;
    const targetPnl = hasSelection && hasPrice ? totalPayoffAtPrice(activeContracts, effectiveTargetPrice, multiplier, daysAhead) : NaN;
    const margin = hasSelection && hasPrice ? computeOrderMargin(activeContracts, multiplier) : 0;
    const projectedPct = margin ? (targetPnl / margin) * 100 : 0;
    const currentUpnlTotal = activeContracts.filter((c) => c.checked).reduce((sum, c) => sum + (parseFloat(c.pnl) || 0), 0);

    return (
        <div className={styles.payoffSection}>
            <button className={styles.payoffHeader} onClick={() => setExpanded((p) => !p)}>
                <h3>Strategy PayOff ({selectedIds.size} / {contracts.length} Selected)</h3>
                {expanded ? <MdKeyboardArrowUp /> : <MdKeyboardArrowDown />}
            </button>

            {expanded && (
                <>
                    <div className={styles.statsRow}>
                        <div>
                            <p>Max Profit</p>
                            <h4 className="value-profit">{payoff.maxProfit}</h4>
                        </div>
                        <div>
                            <p>Max Loss</p>
                            <h4 className="value-lose">{payoff.maxLoss}</h4>
                        </div>
                        <div>
                            <p>Reward / Risk</p>
                            <h4>{payoff.rewardRisk}</h4>
                        </div>
                        <div>
                            <p>Breakeven</p>
                            <h4>{payoff.breakeven}</h4>
                        </div>
                    </div>

                    {!hasSelection && (
                        <p className={styles.validationBanner}>
                            Select at least one contract below to preview its payoff
                        </p>
                    )}
                    {hasSelection && !hasPrice && (
                        <p className={styles.validationBanner}>
                            Waiting for a live price for {baseCurrency}...
                        </p>
                    )}

                    <PnLChartTab
                        currentPrice={currentPrice}
                        curve={curve}
                        expiryCurve={expiryCurve}
                        targetPrice={effectiveTargetPrice}
                        targetPnl={targetPnl}
                        projectedPct={projectedPct}
                    />

                    <TargetsPanel
                        priceMin={lowPrice}
                        priceMax={highPrice}
                        targetPrice={effectiveTargetPrice}
                        onPriceChange={(e) => setTargetPrice(parseFloat(e.target.value))}
                        onPriceReset={() => setTargetPrice(centerPrice)}
                        targetPriceLabel={`${baseCurrency} Target Price`}
                        dateValue={dateValue}
                        onDateChange={(e) => setDateValue(e.target.value)}
                        onDateReset={() => setDateValue(0)}
                        targetDateLabel={targetDate.format('DD MMM YYYY, hh:mmA')}
                        daysToExpiry={Math.round(daysAhead)}
                    />

                    <div className={styles.baTabHeader}>
                        <ul>
                            {TABS.map((tab) => (
                                <li key={tab.id}>
                                    <button
                                        aria-label={tab.label}
                                        onClick={() => setActiveTab(tab.id)}
                                        className={styles[activeTab === tab.id ? "isActive" : ""]}
                                    >
                                        {tab.label}
                                    </button>
                                </li>
                            ))}
                        </ul>
                    </div>

                    <div className={styles.baTabBody}>
                        {activeTab === 2 && (
                            <PnLTableTab
                                contracts={activeContracts}
                                targetPrice={effectiveTargetPrice}
                                multiplier={multiplier}
                                daysAhead={daysAhead}
                                selectedIds={selectedIds}
                                onToggleContract={toggleContract}
                                onToggleAll={toggleAllContracts}
                                hasLivePositions={hasLivePositions}
                                onCloseSelected={hasLivePositions ? () => {
                                    const selectedPositions = positions.filter((p) => selectedIds.has(p._id));
                                    onCloseSelected?.(selectedPositions);
                                } : undefined}
                            />
                        )}
                        {activeTab === 3 && <GreeksTableTab contracts={activeContracts} />}
                    </div>

                    {hasLivePositions && (
                        <div className={styles.footer}>
                            <div className={styles.footerRow}>
                                <span>Total Target PNL</span>
                                <span className={Number.isFinite(targetPnl) ? (targetPnl >= 0 ? 'table-value__profit' : 'table-value__loss') : ''}>{Number.isFinite(targetPnl) ? targetPnl.toFixed(2) : '-'} USD</span>
                            </div>
                            <div className={styles.footerRow}>
                                <span>Total Current UPNL</span>
                                <span className={currentUpnlTotal >= 0 ? 'table-value__profit' : 'table-value__loss'}>{currentUpnlTotal.toFixed(2)} USD</span>
                            </div>
                        </div>
                    )}
                </>
            )}
        </div>
    )
}
