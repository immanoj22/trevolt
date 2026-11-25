import React from 'react'
import { FaChevronDown, FaChevronUp } from 'react-icons/fa'
import { getExpiryLabel, getPositionDelta, getPositionNotionalUsd } from './positionToContract'
import { formatDisplayPair } from '../../../../lib/pairDisplay'

const fmt = (val, digits = 2) => (Number.isFinite(parseFloat(val)) ? parseFloat(val).toFixed(digits) : '0.00')

export default function RiskViewTable({ positions, aggregate, expandedRow, setExpandedRow, onClosePosition, selectedIds = [], onToggleRow, onToggleAll, notionalUnit = 'base', onNotionalUnitChange }) {
    const baseCurrency = positions[0]?.underlying || positions[0]?.pairData?.baseCurrency || '';
    const notionalOf = (record) => (notionalUnit === 'usd' ? getPositionNotionalUsd(record) : parseFloat(record.positionFilled) || 0);
    if (!positions?.length) {
        return (
            <div className="mt-4 text-center table-value__light-xs py-4">
                No positions in this expiry
            </div>
        )
    }

    return (
        <div className={'mt-4 tableContainer table-responsive'}>
            <table className='table'>
                <thead>
                    <tr>
                        {/* <th className="table-width__40"></th> */}
                        <th className="table-width__60">
                            <div className="custom-checkInput__container">
                                <label className="custom-checkInput__label">
                                    <input
                                        type="checkbox"
                                        checked={positions.length > 0 && positions.every((p) => selectedIds.includes(p._id))}
                                        onChange={() => onToggleAll?.()}
                                    />
                                    <span className="custom-checkInput__checkmark"></span>
                                </label>
                            </div>
                        </th>
                        <th className="table-width__220 text-start">Contract</th>
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
                        <th className="table-width__140">Entry Price</th>
                        <th className="table-width__200">Mark Price</th>
                        <th className="table-width__140">UPNL</th>
                        <th className="table-width__140">Delta</th>
                        <th className="table-width__140">Theta</th>
                        <th className="table-width__140">Gamma</th>
                        <th className="table-width__140">Vega</th>
                    </tr>
                </thead>
                <tbody>
                    {positions.map((record) => {
                        const pairData = record.pairData || {};
                        const qty = parseFloat(record.positionFilled) || 0;
                        const sign = record.positionSide === 'long' ? 1 : -1;
                        const upnl = parseFloat(record.pnl) || 0;
                        const isExpanded = record._id === expandedRow;
                        return (
                            <React.Fragment key={record._id}>
                                <tr 
                                // onClick={() => setExpandedRow(isExpanded ? null : record._id)}
                                >
                                    {/* <td className="text-start">
                                        {isExpanded ? <FaChevronUp fontSize={10} /> : <FaChevronDown fontSize={10} />}
                                    </td> */}
                                    <td>
                                        <div className="custom-checkInput__container">
                                            <label className="custom-checkInput__label">
                                                <input
                                                    type="checkbox"
                                                    checked={selectedIds.includes(record._id)}
                                                    onChange={(e) => { e.stopPropagation(); onToggleRow?.(record._id); }}
                                                />
                                                <span className="custom-checkInput__checkmark"></span>
                                            </label>
                                        </div>
                                    </td>
                                    <td className="text-start">
                                        <div className='table-flexStart'>
                                            <div className={record.positionSide === 'long' ? 'table-buy__indicator' : 'table-sell__indicator'}>
                                                <span>{record.positionSide === 'long' ? 'B' : 'S'}</span>
                                            </div>
                                            <p>{formatDisplayPair(pairData.tickerRoot || record.pairName)}</p>
                                        </div>
                                    </td>
                                    <td>
                                        <div className='table-flexColEnd'>
                                            <p>{fmt(notionalOf(record), notionalUnit === 'usd' ? 2 : 3)}<span className='table-value__light ms-1'>{notionalUnit === 'usd' ? 'USD' : (record.underlying || pairData.baseCurrency)}</span></p>
                                            <p className='table-value__light-xs'>
                                                <span className={sign > 0 ? 'table-value__profit' : 'table-value__loss'}>{sign > 0 ? '+' : '-'}{fmt(qty, 3)}</span> lot
                                            </p>
                                        </div>
                                    </td>
                                    <td>{fmt(record.entryPrice)}</td>
                                    <td>
                                        <div className='table-flexColEnd'>
                                            <p>{fmt(record.close_price ?? pairData.last)}</p>
                                            {pairData.markIV ? <p className='table-value__light-xs'>{fmt(pairData.markIV * (pairData.markIV > 3 ? 1 : 100), 1)}%</p> : null}
                                        </div>
                                    </td>
                                    <td>
                                        <div className='table-flexColEnd'>
                                            <p className={upnl >= 0 ? 'table-value__profit' : 'table-value__loss'}>
                                                {fmt(upnl)} <span className='ms-1'>USD</span>
                                            </p>
                                        </div>
                                    </td>
                                    <td><p>{fmt(getPositionDelta(record), 4)}</p></td>
                                    <td><p>{fmt(pairData.theta, 4)}</p></td>
                                    <td><p>{fmt(pairData.gamma, 5)}</p></td>
                                    <td><p>{fmt(pairData.vega, 4)}</p></td>
                                </tr>

                                {isExpanded && (
                                    <tr className='tableContainterDetails riskViewRowActive'>
                                        <td colSpan={11} className="text-start">
                                            <div className='d-flex gap-4 flex-wrap py-2'>
                                                <span>Expiry: {getExpiryLabel(record)}</span>
                                                {pairData.strikePrice ? <span>Strike: {pairData.strikePrice}</span> : null}
                                                {pairData.optionType ? <span>Type: {pairData.optionType}</span> : null}
                                                <button
                                                    className='dangerOuterlineButton px-3 py-1'
                                                    onClick={(e) => { e.stopPropagation(); onClosePosition(record); }}
                                                >
                                                    Close Position
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </React.Fragment>
                        );
                    })}

                    {positions.length > 0 && (
                        <tr className='tableContainterDetails riskViewRowActive'>
                            <td></td>
                            <td className='text-start'><p>Σ All Positions</p></td>
                            <td className='text-end'><p>{fmt(notionalUnit === 'usd' ? aggregate.notionalUsd : aggregate.notionalBase, notionalUnit === 'usd' ? 2 : 3)} <span className='table-value__light-xs'>{notionalUnit === 'usd' ? 'USD' : baseCurrency}</span></p></td>
                            <td></td>
                            <td></td>
                            <td>
                                <p className={aggregate.upnl >= 0 ? 'table-value__profit' : 'table-value__loss'}>
                                    {fmt(aggregate.upnl)} <span className='ms-1'>USD</span>
                                </p>
                            </td>
                            <td><p>{fmt(aggregate.delta, 4)}</p></td>
                            <td><p>{fmt(aggregate.theta, 4)}</p></td>
                            <td><p>{fmt(aggregate.gamma, 5)}</p></td>
                            <td><p>{fmt(aggregate.vega, 4)}</p></td>
                        </tr>
                    )}
                </tbody>
            </table>
        </div>
    )
}
