import React, { useMemo, useRef, useState } from 'react'
import Form from 'react-bootstrap/Form'
import Select from 'react-select'
import Swal from 'sweetalert2'
import { useSelector } from 'react-redux'

import Button from '../../../../components/Button/Button'
import NoData from '../../../../components/NoData/NoData'
import SideModel from '../../../../components/Modal/SideModel'
import StrategyPayoffPanel from '../../../optionsTrading/components/strategyBuilder/StrategyPayoffPanel'
import { futureClosePosition } from '../../../../actions/futureActions'
import { showToastMessage } from '../../../../lib/toast'
import { useGlobalContext } from '../../../../context/GlobalProvider'

import RiskViewTable from './RiskViewTable'
import GroupedExpiryTable from './GroupedExpiryTable'
import { mapPositionToContract, getExpiryLabel, getExpirySortValue, getUnderlying, getPositionDelta, getPositionNotionalUsd } from './positionToContract'

import styles from '../../styles/authInnerPage.module.css'

const fmt = (val, digits = 2) => (Number.isFinite(parseFloat(val)) ? parseFloat(val).toFixed(digits) : '0.00')

const tradeModeOption = [
    { value: 'all', label: 'All' },
    { value: 'future', label: 'Future' },
    { value: 'option', label: 'Option' },
]

export default function RiskView({ positionDetails = [] }) {
    const { theme } = useGlobalContext()
    const { userdetails } = useSelector((state) => state.user)

    const [groupByExpiry, setGroupByExpiry] = useState(false)
    const [activeTabs, setActiveTabs] = useState({})           // { [underlying]: expiryLabel[] } - empty/missing means 'All'
    const [tradeModeByUnderlying, setTradeModeByUnderlying] = useState({}) // { [underlying]: 'all' | 'future' | 'option' }
    const [notionalUnitByUnderlying, setNotionalUnitByUnderlying] = useState({}) // { [underlying]: 'base' | 'usd' }
    const [expandedRow, setExpandedRow] = useState(null)
    const [selectedExpiryByUnderlying, setSelectedExpiryByUnderlying] = useState({})
    const [selectedByUnderlying, setSelectedByUnderlying] = useState({}) // { [underlying]: string[] of position ids }
    const [payoffPanel, setPayoffPanel] = useState(null)       // { underlying, positions, currentPrice }
    const expiryScrollRefs = useRef({})                        // { [underlying]: HTMLElement }

    const scrollExpiryTabs = (underlying, direction) => {
        const el = expiryScrollRefs.current[underlying]
        if (el) el.scrollBy({ left: direction * 100, behavior: 'smooth' })
    }

    const underlyingGroups = useMemo(() => {
        const groups = {}
        positionDetails.forEach((p) => {
            const underlying = getUnderlying(p)
            if (!underlying) return
            groups[underlying] = groups[underlying] || []
            groups[underlying].push(p)
        })
        return groups
    }, [positionDetails])

    const toggleRow = (underlying, id) => {
        setSelectedByUnderlying((prev) => {
            const current = prev[underlying] || []
            const next = current.includes(id) ? current.filter((x) => x !== id) : [...current, id]
            return { ...prev, [underlying]: next }
        })
    }

    const toggleAll = (underlying, ids) => {
        setSelectedByUnderlying((prev) => {
            const current = prev[underlying] || []
            const allSelected = ids.length > 0 && ids.every((id) => current.includes(id))
            return { ...prev, [underlying]: allSelected ? [] : ids }
        })
    }

    const closePosition = async (position) => {
        const data = {
            pairId: position.pairId,
            positionSide: position.positionSide,
            quantity: position.positionFilled,
            orderType: 'market',
            price: 0,
        }
        const { status, message } = await futureClosePosition(data, userdetails.secretKey)
        showToastMessage(message, status ? 'success' : 'error')
    }

    const confirmCloseGroup = (positions, label) => {
        if (!positions.length) return
        const confirmBtnColor = '#2563EB'
        const cancelBtnColor = theme === 'dark' ? '#2A2C2F' : '#eaecef'
        Swal.fire({
            title: `Are you sure you want to ${label.toLowerCase()}?`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'Continue',
            confirmButtonColor: confirmBtnColor,
            cancelButtonColor: cancelBtnColor,
        }).then(async ({ isConfirmed }) => {
            if (!isConfirmed) return
            for (const position of positions) {
                // eslint-disable-next-line no-await-in-loop
                await closePosition(position)
            }
        })
    }

    if (!positionDetails.length) {
        return (
            <div className='mt-4'>
                <div className={styles.noDataContainer}>
                    <NoData content={'No Position'} />
                </div>
            </div>
        )
    }

    return (
        <div className='mt-4'>
            <div className={styles.radioContainer}>
                <div className='custom-radioForm__primary'>
                    <Form.Check
                        inline
                        label="All Positions"
                        name="riskViewRadios"
                        type='radio'
                        id={'allPositions'}
                        checked={!groupByExpiry}
                        onChange={() => setGroupByExpiry(false)}
                    />
                </div>
                <div className='custom-radioForm__primary'>
                    <Form.Check
                        inline
                        label="Group by Expiry"
                        name="riskViewRadios"
                        type='radio'
                        id={'groupByExpiry'}
                        checked={groupByExpiry}
                        onChange={() => setGroupByExpiry(true)}
                    />
                </div>
            </div>

            {Object.entries(underlyingGroups).map(([underlying, positions]) => {
                // Prefer the live tick (kept fresh by ArrangePositionOrder on every price
                // update) over the stale pairData snapshot, so the underlying price next to
                // the card title moves the same way the Mark Price column does.
                const livePerp = positions.find((p) => p.tradeMode === 'future' && p.close_price != null)
                const indexPrice = parseFloat(livePerp?.close_price ?? positions[0]?.pairData?.last ?? positions[0]?.pairData?.underlyingPrice) || 0
                const activeExpiries = activeTabs[underlying] || []
                const tradeMode = tradeModeByUnderlying[underlying] || 'all'

                // Future/Option dropdown scopes this card only - applied before the expiry tabs.
                const modeFiltered = tradeMode === 'all' ? positions : positions.filter((p) => p.tradeMode === tradeMode)

                const expiries = Array.from(new Set(modeFiltered.map(getExpiryLabel))).sort((a, b) => {
                    const pa = modeFiltered.find((p) => getExpiryLabel(p) === a)
                    const pb = modeFiltered.find((p) => getExpiryLabel(p) === b)
                    return getExpirySortValue(pa) - getExpirySortValue(pb)
                })

                // Perpetual positions have no real expiry, so they only ever show under "All" -
                // don't give them their own clickable tab (matches the reference: an
                // all-perpetual underlying shows just "All", no extra tab).
                const tabExpiries = expiries.filter((label) => label !== 'Perpetual')

                const filtered = activeExpiries.length === 0
                    ? modeFiltered
                    : modeFiltered.filter((p) => activeExpiries.includes(getExpiryLabel(p)))

                const notionalUnit = notionalUnitByUnderlying[underlying] || 'base'

                const aggregate = filtered.reduce((acc, p) => {
                    const qty = parseFloat(p.positionFilled) || 0
                    const sign = p.positionSide === 'long' ? 1 : -1
                    const pairData = p.pairData || {}
                    acc.notionalBase += qty
                    acc.notionalUsd += getPositionNotionalUsd(p)
                    acc.upnl += parseFloat(p.pnl) || 0
                    acc.delta += getPositionDelta(p)
                    acc.theta += (parseFloat(pairData.theta) || 0) * qty * sign
                    acc.gamma += (parseFloat(pairData.gamma) || 0) * qty * sign
                    acc.vega += (parseFloat(pairData.vega) || 0) * qty * sign
                    return acc
                }, { notionalBase: 0, notionalUsd: 0, upnl: 0, delta: 0, theta: 0, gamma: 0, vega: 0 })

                const closeBtnLabel = activeExpiries.length === 0
                    ? 'Close All Positions'
                    : `Close ${filtered.length} Position${filtered.length > 1 ? 's' : ''}`

                const groupsByExpiry = expiries.map((label) => ({
                    label,
                    positions: modeFiltered.filter((p) => getExpiryLabel(p) === label),
                }))

                const selectedExpiry = selectedExpiryByUnderlying[underlying]
                const selectedIds = selectedByUnderlying[underlying] || []
                // Payoff/Close All only render in "All Positions" mode (Group by Expiry
                // has no header actions at all, per reference), so these only ever need
                // to reflect the non-grouped selection.
                const selectedPositions = filtered.filter((p) => selectedIds.includes(p._id))
                const payoffPositions = selectedPositions
                const isPayoffDisabled = selectedPositions.length === 0

                return (
                    <div className={`${styles.cardBorder} mt-4`} key={underlying}>
                        <p className={styles.riskViewTitle}>{underlying} <span>${fmt(indexPrice)}</span></p>

                        {!groupByExpiry && (
                            <div className={`${styles.riskViewCardHeader} mt-3`}>
                                <div className={`${styles.riskViewCardHeaderLeft} d-flex align-items-center gap-3`}>
                                    <div className={styles.expiryTabsWrap}>
                                        {tabExpiries.length > 4 && (
                                            <button
                                                type="button"
                                                aria-label="Scroll expiry tabs left"
                                                className={styles.expiryTabsArrow}
                                                onClick={() => scrollExpiryTabs(underlying, -1)}
                                            >
                                                {'<'}
                                            </button>
                                        )}
                                        <div
                                            className={styles.tableDropdownTabs}
                                            ref={(el) => { expiryScrollRefs.current[underlying] = el }}
                                        >
                                            {tabExpiries.map((label) => (
                                                <button
                                                    key={label}
                                                    aria-label={label}
                                                    className={activeExpiries.includes(label) ? styles.active : ''}
                                                    onClick={() => setActiveTabs((prev) => {
                                                        const current = prev[underlying] || []
                                                        const next = current.includes(label)
                                                            ? current.filter((l) => l !== label)
                                                            : [...current, label]
                                                        return { ...prev, [underlying]: next }
                                                    })}
                                                >
                                                    {label}
                                                </button>
                                            ))}
                                        </div>
                                        {tabExpiries.length > 4 && (
                                            <button
                                                type="button"
                                                aria-label="Scroll expiry tabs right"
                                                className={styles.expiryTabsArrow}
                                                onClick={() => scrollExpiryTabs(underlying, 1)}
                                            >
                                                {'>'}
                                            </button>
                                        )}
                                    </div>
                                    <div className={`react-select__width-sm ${styles.tradeModeSelectWrap}`} style={{ minWidth: 120 }}>
                                        <Select
                                            isSearchable={false}
                                            placeholder={'All'}
                                            classNamePrefix="react-select__primary"
                                            options={tradeModeOption}
                                            value={tradeModeOption.find((el) => el.value === tradeMode)}
                                            onChange={(e) => {
                                                setTradeModeByUnderlying((prev) => ({ ...prev, [underlying]: e.value }))
                                                setActiveTabs((prev) => ({ ...prev, [underlying]: [] }))
                                            }}
                                            menuPosition='fixed'
                                        />
                                    </div>
                                </div>

                                <div className={styles.riskViewCardHeaderRight}>
                                    {/* <Button
                                        isLoading={false}
                                        loadingText="Loading..."
                                        disabled={isPayoffDisabled}
                                        btnText={'Payoff'}
                                        onClick={() => setPayoffPanel({
                                            underlying,
                                            positions: payoffPositions,
                                            currentPrice: indexPrice,
                                        })}
                                        className="cardBtnRectangleSm"
                                        selectedValue={null}
                                    /> */}
                                    <Button
                                        isLoading={false}
                                        loadingText="Closing..."
                                        disabled={false}
                                        btnText={closeBtnLabel}
                                        onClick={() => confirmCloseGroup(filtered, closeBtnLabel)}
                                        className="dangerOuterlineButton"
                                        selectedValue={null}
                                    />
                                </div>
                            </div>
                        )}

                        {!groupByExpiry ? (
                            <RiskViewTable
                                positions={filtered}
                                aggregate={aggregate}
                                expandedRow={expandedRow}
                                setExpandedRow={setExpandedRow}
                                onClosePosition={closePosition}
                                selectedIds={selectedIds}
                                onToggleRow={(id) => toggleRow(underlying, id)}
                                onToggleAll={() => toggleAll(underlying, filtered.map((p) => p._id))}
                                notionalUnit={notionalUnit}
                                onNotionalUnitChange={(unit) => setNotionalUnitByUnderlying((prev) => ({ ...prev, [underlying]: unit }))}
                            />
                        ) : (
                            <GroupedExpiryTable
                                underlying={underlying}
                                groups={groupsByExpiry}
                                selectedExpiry={selectedExpiry}
                                onSelectExpiry={(label) => setSelectedExpiryByUnderlying((prev) => ({
                                    ...prev,
                                    [underlying]: prev[underlying] === label ? null : label,
                                }))}
                                notionalUnit={notionalUnit}
                                onNotionalUnitChange={(unit) => setNotionalUnitByUnderlying((prev) => ({ ...prev, [underlying]: unit }))}
                            />
                        )}
                    </div>
                )
            })}

            {payoffPanel && (
                <SideModel
                    show={!!payoffPanel}
                    title={`${payoffPanel.underlying} contracts Payoff`}
                    handleClose={() => setPayoffPanel(null)}
                >
                    <StrategyPayoffPanel
                        contracts={payoffPanel.positions.map(mapPositionToContract)}
                        currentPrice={payoffPanel.currentPrice}
                        baseCurrency={payoffPanel.underlying}
                        multiplier={1}
                        positions={payoffPanel.positions}
                        onCloseSelected={(selectedPositions) => confirmCloseGroup(
                            selectedPositions,
                            `Close ${selectedPositions.length} Position${selectedPositions.length > 1 ? 's' : ''}`
                        )}
                    />
                </SideModel>
            )}
        </div>
    )
}
