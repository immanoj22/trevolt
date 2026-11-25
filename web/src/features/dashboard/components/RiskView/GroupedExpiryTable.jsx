import React from 'react'
import { getPositionDelta, getPositionNotionalUsd, getExpiryFullLabel } from './positionToContract'

const fmt = (val, digits = 2) => (Number.isFinite(parseFloat(val)) ? parseFloat(val).toFixed(digits) : '0.00')

function aggregateOf(positions) {
    return positions.reduce((acc, p) => {
        const qty = parseFloat(p.positionFilled) || 0;
        const sign = p.positionSide === 'long' ? 1 : -1;
        const pairData = p.pairData || {};
        acc.notionalBase += qty;
        acc.notionalUsd += getPositionNotionalUsd(p);
        acc.upnl += parseFloat(p.pnl) || 0;
        acc.delta += getPositionDelta(p);
        acc.theta += (parseFloat(pairData.theta) || 0) * qty * sign;
        acc.gamma += (parseFloat(pairData.gamma) || 0) * qty * sign;
        acc.vega += (parseFloat(pairData.vega) || 0) * qty * sign;
        return acc;
    }, { notionalBase: 0, notionalUsd: 0, upnl: 0, delta: 0, theta: 0, gamma: 0, vega: 0 });
}

export default function GroupedExpiryTable({ underlying, groups, onSelectExpiry, selectedExpiry, notionalUnit = 'base', onNotionalUnitChange }) {
    const allPositions = groups.flatMap((g) => g.positions);
    const totalAggregate = aggregateOf(allPositions);
    const baseCurrency = allPositions[0]?.underlying || allPositions[0]?.pairData?.baseCurrency || underlying;
    const unitLabel = notionalUnit === 'usd' ? 'USD' : baseCurrency;
    const notionalOf = (agg) => (notionalUnit === 'usd' ? agg.notionalUsd : agg.notionalBase);

    return (
        <div className={'mt-4 tableContainer table-responsive'}>
            <table className='table'>
                <thead>
                    <tr>
                        <th className="table-width__220 text-start">Expiry Dates</th>
                        <th className="table-width__180 text-end">
                            Notional
                            <select
                                aria-label="notionalUnit"
                                value={notionalUnit}
                                onClick={(e) => e.stopPropagation()}
                                onChange={(e) => onNotionalUnitChange?.(e.target.value)}
                                className="ms-1"
                                style={{ background: 'var(--color-bg10)', color: 'var(--color-text-02)', border: 'none', borderRadius: 3, fontSize: 'var(--fs11)', padding: '2px 4px' }}
                            >
                                <option value="base">{baseCurrency}</option>
                                <option value="usd">USD</option>
                            </select>
                        </th>
                        <th className="table-width__140">UPNL</th>
                        <th className="table-width__140">Delta</th>
                        <th className="table-width__140">Theta</th>
                        <th className="table-width__140">Gamma</th>
                        <th className="table-width__140">Vega</th>
                    </tr>
                </thead>
                <tbody>
                    {groups.map(({ label, positions }) => {
                        const agg = aggregateOf(positions);
                        const isActive = selectedExpiry === label;
                        return (
                            <tr
                                key={label}
                                className={isActive ? 'riskViewRowActive' : ''}
                                onClick={() => onSelectExpiry?.(label)}
                                style={{ cursor: 'pointer' }}
                            >
                                <td className="text-start"><p>{getExpiryFullLabel(positions[0])}</p></td>
                                <td className="text-end"><p>{fmt(notionalOf(agg), notionalUnit === 'usd' ? 2 : 3)} <span className='table-value__light-xs'>{unitLabel}</span></p></td>
                                <td className="text-end">
                                    <p className={agg.upnl >= 0 ? 'table-value__profit' : 'table-value__loss'}>{fmt(agg.upnl)} <span className='ms-1'>USD</span></p>
                                </td>
                                <td className="text-end"><p>{fmt(agg.delta, 4)}</p></td>
                                <td className="text-end"><p>{fmt(agg.theta, 4)}</p></td>
                                <td className="text-end"><p>{fmt(agg.gamma, 5)}</p></td>
                                <td className="text-end"><p>{fmt(agg.vega, 4)}</p></td>
                            </tr>
                        );
                    })}
                    <tr className='tableContainterDetails riskViewRowActive'>
                        <td className="text-start"><p>Σ All Positions</p></td>
                        <td className="text-end"><p>{fmt(notionalOf(totalAggregate), notionalUnit === 'usd' ? 2 : 3)} <span className='table-value__light-xs'>{unitLabel}</span></p></td>
                        <td className="text-end">
                            <p className={totalAggregate.upnl >= 0 ? 'table-value__profit' : 'table-value__loss'}>{fmt(totalAggregate.upnl)} <span className='ms-1'>USD</span></p>
                        </td>
                        <td className="text-end"><p>{fmt(totalAggregate.delta, 4)}</p></td>
                        <td className="text-end"><p>{fmt(totalAggregate.theta, 4)}</p></td>
                        <td className="text-end"><p>{fmt(totalAggregate.gamma, 5)}</p></td>
                        <td className="text-end"><p>{fmt(totalAggregate.vega, 4)}</p></td>
                    </tr>
                </tbody>
            </table>
        </div>
    )
}
