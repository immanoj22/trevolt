import React, { useState } from 'react'
import styles from "../../styles/strategyBuilder.module.css"
import Select from "react-select"
import { useSelector } from 'react-redux'
import { MdDelete } from 'react-icons/md'
import { formatExpiryNumeric, getContractLabel } from './contractLabel'
import OrderbookGreeksPanel from './OrderbookGreeksPanel'
import LeverageModal from '../../modal/leverageModal'
import { QTY_UNIT_OPTIONS, qtyToDisplay, displayToQtyBtc } from './qtyUnits'

const POS_OPTIONS = [
    { label: 'P', value: 'P' },
    { label: 'C', value: 'C' },
]

const QTY_UNIT_SELECT_OPTIONS = QTY_UNIT_OPTIONS.map((unit) => ({ label: unit, value: unit }))

const selectMenuPortalStyle = {
    menuPortal: (base) => ({ ...base, zIndex: 9999 }),
}

export default function ContractRow({ contract, onToggleField, onRemove, onUpdateField, currentPrice, strategyMultiplier = 1 }) {
    const { optionContractData, optionsData } = useSelector((state) => state.option);
    const [leverageModalOpen, setLeverageModalOpen] = useState(false);

    const strikeOptions = (optionContractData?.strikePrice || []).map((s) => ({
        label: `${s.strikePrice}`,
        value: `${s.strikePrice}`,
    }));

    const expiryOptions = (optionsData || []).map((e) => {
        const numeric = formatExpiryNumeric(e.expiryDateStr);
        return { label: numeric, value: numeric };
    });

    const currentLeverage = parseInt(contract.multiplier, 10) || 1;
    const showLimitHint = !contract.marketOrLimit && !contract.limitPrice;
    // Displayed/edited quantity includes the strategy Multiplier ("repeat this basket Nx"),
    // while the contract's stored `qty` always stays the base (multiplier=1) amount.
    const displayQty = qtyToDisplay(contract.qty, contract.qtyUnit, currentPrice) * strategyMultiplier;

    return (
        <div className={styles.contractRowWrapper}>
            <div className={styles.contractRow}>
                <div className={styles.contractRowLeftGroup}>
                    <div className="custom-checkInput__container">
                        <label className="custom-checkInput__label">
                            <input type="checkbox" checked={contract.checked} onChange={() => onToggleField(contract.id, "checked")} />
                            <span className="custom-checkInput__checkmark"></span>
                        </label>
                    </div>
                    <button
                        aria-label="buyOrSell"
                        onClick={() => onToggleField(contract.id, "buyOrSell")}
                        className={styles[contract.buyOrSell ? "buyBadge" : "sellBadge"]}
                    >
                        {contract.buyOrSell ? "B" : "S"}
                    </button>

                    {contract.kind === 'futures' ? (
                        <span className={styles.futuresSymbol}>{contract.symbol}</span>
                    ) : (
                        <>
                            <Select
                                isSearchable={false}
                                value={contract.posType}
                                options={POS_OPTIONS}
                                onChange={(option) => onUpdateField(contract.id, 'posType', option)}
                                classNamePrefix="react-select__strategy"
                                menuPortalTarget={document.body}
                                menuPosition="fixed"
                                styles={selectMenuPortalStyle}
                            />
                            <Select
                                isSearchable={false}
                                value={contract.strike}
                                options={strikeOptions.length ? strikeOptions : [contract.strike]}
                                onChange={(option) => onUpdateField(contract.id, 'strike', option)}
                                classNamePrefix="react-select__strategy"
                                menuPortalTarget={document.body}
                                menuPosition="fixed"
                                styles={selectMenuPortalStyle}
                            />
                            <Select
                                isSearchable={false}
                                value={contract.expiry}
                                options={expiryOptions.length ? expiryOptions : [contract.expiry]}
                                onChange={(option) => onUpdateField(contract.id, 'expiry', option)}
                                classNamePrefix="react-select__strategy"
                                menuPortalTarget={document.body}
                                menuPosition="fixed"
                                styles={selectMenuPortalStyle}
                            />
                        </>
                    )}

                    <button className={styles.multiplierBadge} onClick={() => setLeverageModalOpen(true)}>
                        {contract.multiplier}
                    </button>
                </div>

                <div className={styles.contractRowRightGroup}>
                    <div className={styles.marketAndLimitPart}>
                        <label onClick={() => onToggleField(contract.id, "marketOrLimit")}>
                            {contract.marketOrLimit ? "M" : "L"}
                        </label>
                        {contract.marketOrLimit ? (
                            <input type="text" readOnly value="Market Price" />
                        ) : (
                            <input
                                type="text"
                                inputMode="decimal"
                                value={contract.limitPrice}
                                placeholder="Limit Price"
                                onFocus={() => onUpdateField(contract.id, 'showOrderBook', true)}
                                onBlur={() => onUpdateField(contract.id, 'showOrderBook', false)}
                                onChange={(e) => onUpdateField(contract.id, 'limitPrice', e.target.value)}
                            />
                        )}
                    </div>

                    <div className={styles.qtyInputPart}>
                        <input
                            type="text"
                            inputMode="decimal"
                            value={Number.isFinite(displayQty) ? +displayQty.toFixed(6) : displayQty}
                            onChange={(e) => {
                                const enteredBaseQty = displayToQtyBtc(e.target.value, contract.qtyUnit, currentPrice) / (strategyMultiplier || 1);
                                onUpdateField(contract.id, 'qty', enteredBaseQty);
                            }}
                        />
                        <Select
                            isSearchable={false}
                            value={{ label: contract.qtyUnit, value: contract.qtyUnit }}
                            options={QTY_UNIT_SELECT_OPTIONS}
                            onChange={(option) => onUpdateField(contract.id, 'qtyUnit', option.value)}
                            classNamePrefix="react-select__strategy"
                            menuPortalTarget={document.body}
                            menuPosition="fixed"
                            styles={selectMenuPortalStyle}
                        />
                    </div>

                    <button aria-label="deleteIcon" className={styles.deleteBtn} onClick={() => onRemove(contract.id)}>
                        <MdDelete />
                    </button>
                </div>
            </div>

            {showLimitHint && <p className={styles.limitPriceHint}>Provide Limit Price</p>}

            {contract.showOrderBook && (
                <OrderbookGreeksPanel
                    greeks={contract.greeks}
                    orderbook={contract.orderbook}
                    onClose={() => onUpdateField(contract.id, 'showOrderBook', false)}
                />
            )}

            <LeverageModal
                show={leverageModalOpen}
                handleClose={() => setLeverageModalOpen(false)}
                titleText={getContractLabel(contract)}
                initialValue={currentLeverage}
                max={contract.kind === 'futures' ? 200 : 150}
                onConfirm={(value) => onUpdateField(contract.id, 'multiplier', `${value}x`)}
            />
        </div>
    )
}
