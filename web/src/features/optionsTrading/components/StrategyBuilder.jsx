import React, { useState } from 'react'
import styles from "../styles/strategyBuilder.module.css"
import { MdDelete, MdKeyboardArrowDown, MdAdd, MdRemove, MdClose, MdCheck } from 'react-icons/md'
import { FiRefreshCw } from 'react-icons/fi'
import { useSelector } from 'react-redux'
import Button from '../../../components/Button/Button'
import { useStrategyBuilder } from '../context/StrategyBuilderContext'
import ContractRow from './strategyBuilder/ContractRow'
import StrategyPayoffPanel from './strategyBuilder/StrategyPayoffPanel'
import { useAvailableMargin } from './strategyBuilder/useAvailableMargin'
import { computeOrderMargin } from './strategyBuilder/payoffMath'
import { placeStrategyOrders } from './strategyBuilder/placeOrders'
import { showToastMessage } from '../../../lib/toast'

export default function StrategyBuilder() {
    const { contracts, addContract, removeContract, toggleField, updateField, clearAll, multiplier, setMultiplier } = useStrategyBuilder();
    const { underlyingData } = useSelector((state) => state.option);
    const { userdetails } = useSelector((state) => state.user);
    const { isAuthStatus, balanceLabel } = useAvailableMargin();

    const [addMenuOpen, setAddMenuOpen] = useState(false);
    const [isPlacingOrder, setIsPlacingOrder] = useState(false);

    const selectedCount = contracts.filter((c) => c.checked).length;
    const currentPrice = underlyingData?.marketPrice ?? "-";
    const baseCurrency = underlyingData?.baseCurrency || underlyingData?.symbol || "EURUSD";
    const pairSymbol = `${baseCurrency}USD`;
    const orderMargin = computeOrderMargin(contracts, multiplier);

    const addFuturesContract = (buyOrSell) => {
        const priceNow = parseFloat(underlyingData?.marketPrice) || 0;
        addContract({
            kind: 'futures',
            buyOrSell,
            symbol: pairSymbol,
            multiplier: "200x",
            entryPrice: priceNow,
            markPriceAtAdd: priceNow,
        });
        setAddMenuOpen(false);
    };

    const handlePlaceOrder = async () => {
        setIsPlacingOrder(true);
        try {
            const { results, skipped } = await placeStrategyOrders(contracts, userdetails?.secretKey, multiplier);

            const successCount = results.filter((r) => r.response.success).length;
            const failCount = results.length - successCount;

            if (successCount > 0) {
                showToastMessage(`${successCount} leg${successCount > 1 ? 's' : ''} placed successfully`, 'success');
            }
            if (failCount > 0) {
                const firstError = results.find((r) => !r.response.success)?.response?.message;
                showToastMessage(firstError || `${failCount} leg${failCount > 1 ? 's' : ''} failed to place`, 'error');
            }
            if (skipped > 0) {
                showToastMessage(`${skipped} futures leg${skipped > 1 ? 's' : ''} skipped - not supported yet`, 'error');
            }
        } finally {
            setIsPlacingOrder(false);
        }
    };

    return (
        <section className={styles.strategyBuilder}>
            <div className={styles.topHeader}>
                <h3>Strategy Builder</h3>
                <div className={styles.addFuturesWrapper}>
                    <button className={styles.addFuturesBtn} onClick={() => setAddMenuOpen((p) => !p)}>
                        Add {baseCurrency} Futures <MdKeyboardArrowDown />
                    </button>
                    {addMenuOpen && (
                        <div className={styles.addFuturesMenu}>
                            <div className={styles.addFuturesMenuHeader}>
                                <h4>Add Futures Contract</h4>
                                <button aria-label="close" onClick={() => setAddMenuOpen(false)}>
                                    <MdClose />
                                </button>
                            </div>
                            <div className={styles.addFuturesRow}>
                                <span>{pairSymbol}</span>
                                <span>{currentPrice}</span>
                                <div className={styles.addFuturesActions}>
                                    <button aria-label="buy" className={styles.buyBadge} onClick={() => addFuturesContract(true)}>B</button>
                                    <button aria-label="sell" className={styles.sellBadge} onClick={() => addFuturesContract(false)}>S</button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {contracts.length === 0 ? (
                <div className={styles.emptyState}>
                    <div className={styles.emptyGraphic}>
                        <div className={styles.emptyCol}>
                            <span className={styles.emptyColLabel}>CALLS</span>
                            <div className={styles.emptyRowActive}>
                                <span className={styles.emptyCheckBadge}><MdCheck /></span>
                            </div>
                            <div></div>
                            <div></div>
                            <div></div>
                            <div></div>
                        </div>
                        <div className={styles.emptyStrikesCol}>STRIKES</div>
                        <div className={styles.emptyCol}>
                            <span className={styles.emptyColLabel}>PUTS</span>
                            <div></div>
                            <div className={`${styles.emptyRowActive} ${styles.puts}`}>
                                <span className={styles.emptyCheckBadge}><MdCheck /></span>
                            </div>
                            <div></div>
                            <div></div>
                            <div></div>
                        </div>
                    </div>
                    <h4>+ Add Contracts from Options Chain</h4>
                    <p>Selected contracts will show up here</p>

                    <div className={styles.emptyFooter}>
                        {/* <a href="#" onClick={(e) => e.preventDefault()}>Learn more about basket orders</a> */}
                        {isAuthStatus && <p>Available Margin <span>{balanceLabel}</span></p>}
                    </div>
                </div>
            ) : (
                <>
                    <div className={styles.sbHeader}>
                        <div className="custom-checkInput__container">
                            <label className="custom-checkInput__label">
                                <input type="checkbox" checked={selectedCount === contracts.length && contracts.length > 0} readOnly />
                                <span className="custom-checkInput__checkmark"></span>
                            </label>
                        </div>
                        <span className={styles.selectedCountText}>{selectedCount} / {contracts.length} Selected</span>

                        <div className={styles.multiplierControl}>
                            <span>Multiplier</span>
                            <button aria-label="decrease" onClick={() => setMultiplier((m) => Math.max(1, m - 1))}>
                                <MdRemove />
                            </button>
                            <span className={styles.multiplierValue}>{multiplier}</span>
                            <button aria-label="increase" onClick={() => setMultiplier((m) => m + 1)}>
                                <MdAdd />
                            </button>
                        </div>
                        <button aria-label="deleteAll" className={styles.deleteAllBtn} onClick={clearAll}>
                            <MdDelete />
                        </button>
                    </div>

                    <div className={styles.scrollableBody}>
                        <div className={styles.contractsList}>
                            {contracts.map((c) => (
                                <ContractRow key={c.id} contract={c} onToggleField={toggleField} onRemove={removeContract} onUpdateField={updateField} currentPrice={currentPrice} strategyMultiplier={multiplier} />
                            ))}
                        </div>

                        <StrategyPayoffPanel
                            contracts={contracts}
                            currentPrice={currentPrice}
                            baseCurrency={baseCurrency}
                            multiplier={multiplier}
                        />
                    </div>

                    <div className={styles.footer}>
                        {selectedCount === 0 && (
                            <p className={styles.validationBanner}>
                                Strategy Builder requires at least 1 contract selected
                            </p>
                        )}
                        <div className={styles.footerRow}>
                            <span>
                                Order Margin <FiRefreshCw />
                            </span>
                            <span>${selectedCount > 0 ? orderMargin.toFixed(2) : ""}</span>
                        </div>
                        {isAuthStatus && (
                            <div className={styles.footerRow}>
                                <span>Available Margin</span>
                                <span>{balanceLabel}</span>
                            </div>
                        )}
                        <Button
                            btnText={isAuthStatus ? `Place Order (${selectedCount})` : "Login"}
                            className={"successFillRectangleBtn"}
                            disabled={isAuthStatus && selectedCount === 0}
                            isLoading={isPlacingOrder}
                            loadingText="Placing..."
                            onClick={isAuthStatus ? handlePlaceOrder : undefined}
                        />
                    </div>
                </>
            )}
        </section>
    )
}
