/** PACKAGE IMPORT */
import { useEffect, useRef, useState, useContext } from 'react';
import { useDispatch, useSelector } from "react-redux";
import { MdOutlineFilterList } from 'react-icons/md';
import { IoIosStar } from "react-icons/io";
import { Overlay } from "react-overlays";
import { MdCheck } from "react-icons/md";
import { useNavigate, useParams } from "react-router-dom";




/** LOCAL FILES IMPORT */

import { TableHead, TableBody, middleTableBody, middleTableHead, colorKeys } from '../../../utils/tableDatas';
import styles from '../styles/callPutTable.module.css';
import TooltipWrapper from '../../../hooks/tooltipWrapper';
import Button from '../../../components/Button/Button';
import OptionCard from './OptionCard';
import { useStrategyBuilder } from '../context/StrategyBuilderContext';
import { formatExpiryNumeric } from './strategyBuilder/contractLabel';
import { futureAddFavouritePair } from '../../../actions/futureActions';
import { showToastMessage } from '../../../lib/toast';

/** Context */
import isEmpty from 'is-empty';

/** CODE START */

function CallPutTable({ containerHeight, checkHead, headCheck, isStrategyBuilderEnable }) {

    const navigate = useNavigate();
    const dispatch = useDispatch();
    const { underlyingSymbol, tikerRoot } = useParams()

    const { optionContractData, underlyingData } = useSelector((state) => state.option)

    const { positionDetails, userdetails } = useSelector((state) => state.user);
    const { contracts, addContract, removeContract, toggleField } = useStrategyBuilder();

    const table1Ref = useRef(null);
    const table2Ref = useRef(null);
    const table3Ref = useRef(null);
    const targetRefs = useRef({});


    const [openFilterModal, setOpenFilterModal] = useState(true);
    // const [headCheck, setHeadCheck] = useState([]);
    const [selectedRow, setSelectedRow] = useState([0]);
    const [selectedRowRight, setSelectedRowRight] = useState([]);
    const [hoveredRowIndex, setHoveredRowIndex] = useState(null);
    const [tooltipData, setTooltipData] = useState(null);
    const [showRight, setShowRight] = useState(false);
    const [showLeft, setShowLeft] = useState(false);
    const [strikeData, setStrikeData] = useState(optionContractData.strikePrice)
    const [callpair, setCallpair] = useState(optionContractData.callpair)
    const [putpair, setPutpair] = useState(optionContractData.putpair)
    const [lastPrice, setLastPrice] = useState(null);

    const [currentIndex, setCurrentIndex] = useState(0);



    const handleScroll1 = (e) => {
        if (table2Ref.current) table2Ref.current.scrollTop = e.target.scrollTop;
        if (table3Ref.current) table3Ref.current.scrollTop = e.target.scrollTop;
    };

    const handleScroll2 = (e) => {
        if (table1Ref.current) table1Ref.current.scrollTop = e.target.scrollTop;
        if (table3Ref.current) table3Ref.current.scrollTop = e.target.scrollTop;
    };

    const handleScroll = (scrolledRef, otherRef) => {
        if (scrolledRef.current && otherRef.current) {
            const scrollLeft = scrolledRef.current.scrollLeft;
            const maxScroll = scrolledRef.current.scrollWidth - scrolledRef.current.clientWidth;
            const mirroredScroll = maxScroll - scrollLeft;
            otherRef.current.scrollLeft = mirroredScroll;
        }
    };

    const selectTradedPair = (data) => {
        // dispatch(OptionTradePair({ selectedOptionData: data }));
        localStorage.setItem("optionspair", data.tickerRoot)
        navigate(`/options/${data.baseCurrency}/${data.tickerRoot}`, { replace: true });
    }
    const handleRowClickLeft = (data, rowID) => {
        setSelectedRow(prev => prev.includes(rowID) ? [] : [rowID]);
        setSelectedRowRight([]);
        selectTradedPair(data);
    };

    const handleRowClickRight = (data, rowID) => {
        setSelectedRowRight(prev => prev.includes(rowID) ? [] : [rowID]);
        setSelectedRow([]);
        selectTradedPair(data);
    };

    const formatValue = (key, value) => {
        if (value === undefined || value === null || value === '') return '';

        let num = parseFloat(value.toString().replace(/[^0-9.-]/g, ''));
        if (isNaN(num)) return value;

        const absNum = Math.abs(num);
        const isNegative = num < 0;

        const getSuffix = (n) => {
            if (n >= 1e9) return [n / 1e9, 'B'];
            if (n >= 1e6) return [n / 1e6, 'M'];
            if (n >= 1e3) return [n / 1e3, 'K'];
            return [n, ''];
        };

        const [formattedNum, suffix] = getSuffix(absNum);
        const sign = isNegative ? '-' : '';

        if (key.toLowerCase().includes('price') || key.toLowerCase().includes('mark') || key.toLowerCase().includes('bid') || key.toLowerCase().includes('ask') || key.toLowerCase().includes('volume')) {
            return `$ ${sign}${formattedNum.toFixed(2)}${suffix}`;
        }

        if (key.toLowerCase().includes('change') || key.toLowerCase().includes('iv') || key.toLowerCase().includes('percentage')) {
            return `${sign}${formattedNum.toFixed(2)}%`;
        }

        if (key.toLowerCase().includes('oi') || key.toLowerCase().includes('qty')) {
            return `${sign}${formattedNum.toFixed(2)}${suffix}`;
        }

        return `${sign}${formattedNum.toFixed(2)}`;
    };

    const strikeCellRefs = useRef({});
    const [tooltipY, setTooltipY] = useState(0);
    const [strikeX, setStrikeX] = useState(0);

    const handleRowHover = (index, e) => {
        const strikeCell = strikeCellRefs.current[index];
        const rowRect = e.currentTarget.getBoundingClientRect();

        if (strikeCell) {
            const strikeRect = strikeCell.getBoundingClientRect();
            setStrikeX(strikeRect.left + strikeRect.width / 2);
        }

        setHoveredRowIndex(index);
        setTooltipY(rowRect.top + rowRect.height / 2);
    };
    const handleRowLeave = () => {
        // setHoveredRowIndex(null);
    };

    const handleMouseEnter = (e, rowIndex, side) => {
        handleRowHover(rowIndex, e);
        if (isStrategyBuilderEnable) {
            setShowRight(side.toLowerCase() === 'put');
            setShowLeft(side.toLowerCase() === 'call');
        } else {
            setShowRight(false);
            setShowLeft(false);
        }
    }

    const handleMouseLeave = () => {
        setShowRight(false);
        setShowLeft(false);
    }

    const findFilledRow = (pair, posValue) => {
        if (!isStrategyBuilderEnable) return [];
        return contracts
            .filter((c) => c.kind === 'option' && c.posType.value === posValue)
            .map((c) => ({
                id: pair?.findIndex((b) => `${b.strikePrice}` === c.strike.value),
                type: c.buyOrSell ? 'buy' : 'sell',
            }))
            .filter((item) => item.id !== -1);
    };

    const callFilledRow = findFilledRow(callpair, 'C');
    const putFilledRow = findFilledRow(putpair, 'P');

    const currentPutSelection = putFilledRow.find(item => item.id === hoveredRowIndex);
    const currentCallSelection = callFilledRow.find(item => item.id === hoveredRowIndex);

    const selectOption = (pair, index, type, posLabel) => {
        const body = pair?.[index];
        if (!body) return;

        const strikeLabel = `${body.strikePrice}`;
        const [, rawExpiryDateStr] = body.tickerRoot.split('-');
        const expiryDateStr = formatExpiryNumeric(rawExpiryDateStr);
        const existing = contracts.find(
            (c) => c.kind === 'option' && c.posType.value === posLabel && c.strike.label === strikeLabel
        );

        if (existing) {
            const existingType = existing.buyOrSell ? 'buy' : 'sell';
            if (existingType === type) {
                removeContract(existing.id);
            } else {
                toggleField(existing.id, 'buyOrSell');
            }
            return;
        }

        // Strategy/payoff analytics use the Mark Price as the reference premium
        // (industry standard - Deribit, Delta Exchange, etc.), not live bid/ask.
        const markPrice = parseFloat(body.marketPrice);
        const entryPrice = markPrice;

        addContract({
            kind: 'option',
            pairId: body._id,
            tickerRoot: body.tickerRoot,
            buyOrSell: type === 'buy',
            posType: { label: posLabel, value: posLabel },
            strike: { label: strikeLabel, value: strikeLabel },
            expiry: { label: expiryDateStr, value: expiryDateStr },
            multiplier: "1x",
            entryPrice: Number.isFinite(entryPrice) ? entryPrice : 0,
            markPriceAtAdd: Number.isFinite(markPrice) ? markPrice : 0,
            markIV: body.markIV,
            expiryDate: body.expiryDate,
            greeks: {
                delta: body.delta,
                gamma: body.gamma,
                theta: body.theta,
                vega: body.vega,
            },
            orderbook: {
                bidQty: body.bidQty,
                bidPrice: body.bid,
                askPrice: body.ask,
                askQty: body.askQty,
            },
        });
    };

    const handlePutSelect = (index, type) => selectOption(putpair, index, type, 'P');

    const handleCallSelect = (index, type) => selectOption(callpair, index, type, 'C');

    // Same addFavouritePair API Futures already uses - it's generic (looks the pair up
    // in the shared FuturePairTable by _id, stores {pairId, pairName}), so option
    // contracts favourite/un-favourite through it exactly the same way.
    const handleAddFavourite = async (item) => {
        if (!item?._id) return;
        const { status, message } = await futureAddFavouritePair({ pairId: item._id, pairName: item.tickerRoot }, userdetails?.secretKey);
        showToastMessage(message, status ? 'success' : 'error');
    };

    const isFavourite = (item) => userdetails?.futureFav?.some((f) => f.pairName === item?.tickerRoot);

    const findBetweenArray = async (arr, value) => {
        // console.log("findBetweenArray_calling",arr[0].strikePrice, value);
        try {
            for (let i = 0; i < arr.length - 1; i++) {
                if (value > arr[i].strikePrice && value < arr[i + 1].strikePrice) {
                    setCurrentIndex(i + 1)
                    return i + 1;
                }
            }
            return false;
        } catch (error) {
            console.log("find between catch error", error);
        }
        // not in between any values
    }


    useEffect(() => {
        const table1Element = table1Ref.current;
        const table2Element = table2Ref.current;
        const onScroll1 = () => handleScroll(table1Ref, table2Ref);
        const onScroll2 = () => handleScroll(table2Ref, table1Ref);

        if (table1Element) table1Element.addEventListener('scroll', onScroll1);
        if (table2Element) table2Element.addEventListener('scroll', onScroll2);

        return () => {
            if (table1Element) table1Element.removeEventListener('scroll', onScroll1);
            if (table2Element) table2Element.removeEventListener('scroll', onScroll2);
        };
    }, []);

    useEffect(() => {
        const rightTable = table2Ref.current;
        const leftTable = table1Ref.current;

        const fixInitialScroll = () => {
            if (leftTable && rightTable) {
                const maxScroll = leftTable.scrollWidth - leftTable.clientWidth;
                rightTable.scrollLeft = maxScroll;
            }
        };

        const timer = setTimeout(() => {
            requestAnimationFrame(fixInitialScroll);
        }, 100);

        return () => clearTimeout(timer);
    }, []);

    useEffect(() => {
        if (isEmpty(optionContractData)) return;
        const sanitizePair = (items = []) => items.filter((item) => item && Number.isFinite(Number(item?.strikePrice)) && Number(item.strikePrice) > 0);
        setStrikeData((optionContractData?.strikePrice || []).filter((item) => item && Number.isFinite(Number(item?.strikePrice)) && Number(item.strikePrice) > 0))
        setCallpair(sanitizePair(optionContractData?.callpair))
        setPutpair(sanitizePair(optionContractData?.putpair))
    }, [optionContractData])

    useEffect(() => {
        if (strikeData && underlyingData) {
            findBetweenArray(strikeData, underlyingData.marketPrice)
        }
    }, [strikeData, underlyingData])

    useEffect(() => {
        if (tikerRoot && callpair && putpair) {
            const [, , , type] = tikerRoot.split('-')
            if (type == 'C') {
                let selectedIndex = callpair.findIndex((val) => (val.tickerRoot == tikerRoot))
                setSelectedRow([selectedIndex])
                setSelectedRowRight([])
            }
            if (type == 'P') {
                let selectedIndex = putpair.findIndex((val) => (val.tickerRoot == tikerRoot))
                setSelectedRowRight([selectedIndex])
                setSelectedRow([])
            }
        }
    }, [callpair, putpair, tikerRoot])


    // console.log(strikeData, "strikeData___strikeData")
    return (
        <>

            <div className={styles.chartContainer} style={{ height: `${containerHeight - 150}px` }}>

                {/* Left Table */}
                <div
                    className={styles.leftTable}
                    ref={table1Ref}
                    onScroll={handleScroll1} >
                    <table className={styles.insideLeftTable} >
                        <thead>
                            <tr>
                                {TableHead.filter(h => headCheck.includes(h.name)).map((head, index) => (
                                    <th key={index}>
                                        <div className={styles.theadValues}>
                                            <p className={styles.heads}>{head.name}</p>
                                            {head?.subHeading &&
                                                <p className={styles.subHeads}>{head.subHeading == 'key' ? underlyingSymbol : head?.subHeading}</p>}
                                        </div>
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        {/*call section */}
                        <tbody>
                            {callpair && callpair?.map((body, rowIndex) => {
                                // console.log("callpair__body1", body);
                                let positionData = positionDetails?.find((val) => (val.pairName == body.tickerRoot))
                                return (
                                    <tr style={rowIndex <= currentIndex ? { background: 'var(--table-bg)' } : {}}
                                        key={rowIndex}
                                        onMouseEnter={(e) => {
                                            if (isStrategyBuilderEnable) {
                                                handleMouseEnter(e, rowIndex, 'call')
                                            }
                                        }}
                                        onMouseLeave={handleRowLeave}
                                        className={` ${hoveredRowIndex === rowIndex ? styles.hoverTable : ''}
                                     ${selectedRow.includes(rowIndex) ? styles.selectedRow : ''} 
                                     ${rowIndex === currentIndex ? styles.selectedIndex : ''}
                                      ${callFilledRow.find(item => item.id === rowIndex) ?
                                                `${styles.callFilledRow} ${callFilledRow.find(item => item.id === rowIndex).type === 'buy'
                                                    ? styles.buy
                                                    : styles.sell
                                                }` : ''}`}
                                        onClick={() => handleRowClickLeft(body, rowIndex)}
                                    >
                                        {body && [...TableHead].filter(h => headCheck.includes(h.name)).map((head, colIndex) => {
                                            const key = head.key;
                                            // console.log(body, "callpair__body")
                                            return (
                                                <OptionCard key={`call-${rowIndex}-${colIndex}`} opt={{ ...body, pos: positionData?.positionFilled ?? 0 }} ind={key} colIndex={colIndex} />
                                                // <td key={colIndex} className={styles.doubleValue}>
                                                //     <div className={`${styles.primaryValue} ${getColorClass(key, body[key]?.primary)}`}>
                                                //         {formatValue(key, body[key]?.primary)}
                                                //     </div>
                                                //     <div className={styles.secondaryValue}>
                                                //         {formatValue(key, body[key]?.secondary)}
                                                //     </div>
                                                // </td>
                                            );
                                        })}

                                    </tr>
                                )
                            })}
                        </tbody>
                    </table>
                </div>

                {/* Center Table */}
                <div className={styles.centerTable} ref={table3Ref} >
                    <table className={styles.insideCenterTable} >
                        <thead>
                            <tr>
                                <th>Strike</th>

                            </tr>
                        </thead>
                        <tbody>

                            {strikeData?.map((body, rowIndex) => {
                                const isLeftSelected = selectedRow.includes(rowIndex);
                                const isRightSelected = selectedRowRight.includes(rowIndex);
                                const centerBorderClass = isLeftSelected
                                    ? styles.centerBorderRight
                                    : isRightSelected
                                        ? styles.centerBorderLeft
                                        : '';

                                return (
                                    <tr
                                        ref={el => (targetRefs.current[rowIndex] = el)}
                                        onMouseEnter={() => {
                                            if (isStrategyBuilderEnable) {
                                                setHoveredRowIndex(rowIndex);
                                                setShowRight(true);
                                                setShowLeft(true);
                                            } else {
                                                setShowRight(false);
                                                setShowLeft(false);
                                            }
                                        }}
                                        key={rowIndex}
                                        // onMouseEnter={(e) => handleRowHover(rowIndex, e)}
                                        // onMouseLeave={handleRowLeave}
                                        className={`${hoveredRowIndex === rowIndex ? styles.hoverTable : ''} 
                                            ${isLeftSelected || isRightSelected ? styles.selectedRow : ''}`}

                                    >

                                        <td className={`${centerBorderClass} ${rowIndex === currentIndex ? styles.selectedIndex : ''
                                            }`}
                                        >
                                            <div className={styles.centerTableRowWrapper}>

                                                {/* Strike and Star buttons */}

                                                < div className={styles.centerTableValues} >
                                                    <button
                                                        className={`${styles.favButton} ${isFavourite(callpair?.[rowIndex]) ? styles.active : ''}`}
                                                        onClick={() => handleAddFavourite(callpair?.[rowIndex])}
                                                    >
                                                        <IoIosStar />
                                                    </button>
                                                    <span className={styles.strikeValues}>{Number.isFinite(Number(body?.strikePrice)) && Number(body.strikePrice) > 0 ? parseFloat(body.strikePrice).toFixed(callpair?.[rowIndex]?.strikeDecimal ?? 2) : '0.00'}</span>
                                                    <button
                                                        className={`${styles.favButton} ${isFavourite(putpair?.[rowIndex]) ? styles.active : ''}`}
                                                        onClick={() => handleAddFavourite(putpair?.[rowIndex])}
                                                    >
                                                        <IoIosStar />
                                                    </button>
                                                </div>

                                            </div>
                                        </td>

                                    </tr >
                                );
                            })}
                        </tbody >
                    </table >
                </div >

                {/* Right Table */}
                <div className={styles.rightTable} ref={table2Ref} onScroll={handleScroll2} >
                    <table className={styles.insideRightTable} >

                        <thead>
                            <tr>
                                {TableHead.filter(h => headCheck.includes(h.name)).map((head, index) => (
                                    <th key={index}>
                                        <div className={styles.theadValues}>
                                            <p className={styles.heads}>{head.name}</p>
                                            {head?.subHeading &&
                                                <p className={styles.subHeads}>{head.subHeading == 'key' ? underlyingSymbol : head?.subHeading}</p>}
                                        </div>
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {/*PUT section */}
                            {putpair && putpair?.map((body, rowIndex) => {
                                let positionData = positionDetails?.find((val) => (val.pairName == body.tickerRoot))
                                return (
                                    <tr style={rowIndex > currentIndex ? { backgroundColor: 'var(--table-bg)' } : {}}
                                        key={rowIndex}
                                        onMouseEnter={(e) => {
                                            if (isStrategyBuilderEnable) {
                                                handleMouseEnter(e, rowIndex, 'put')
                                            }
                                        }}
                                        onMouseLeave={handleRowLeave}
                                        className={`${styles.rightTableTr} ${hoveredRowIndex === rowIndex ? styles.hoverTable : ''} 
                                    ${rowIndex === currentIndex ? styles.selectedIndex : ''
                                            }
                                    ${selectedRowRight.includes(rowIndex) ? styles.selectedRow : ''} ${putFilledRow.find(item => item.id === rowIndex) ? `${styles.putFilledRow} ${putFilledRow.find(item => item.id === rowIndex).type === 'buy'
                                                ? styles.buy
                                                : styles.sell
                                                }` : ''}`}
                                        onClick={() => handleRowClickRight(body, rowIndex)}
                                    >


                                        {body && TableHead.filter(h => headCheck.includes(h.name)).map((head, colIndex) => {
                                            const key = head.key;
                                            return (
                                                <OptionCard key={`put-${rowIndex}-${colIndex}`} opt={{ ...body, pos: positionData?.positionFilled ?? 0 }} ind={key} colIndex={colIndex} />
                                                // <td key={colIndex} className={styles.doubleValue}>

                                                //     <div className={`${styles.primaryValue} ${getColorClass(key, body[key]?.primary)}`}>
                                                //         {formatValue(key, body[key]?.primary)}
                                                //     </div>
                                                //     <div className={styles.secondaryValue}>
                                                //         {formatValue(key, body[key]?.secondary)}
                                                //     </div>
                                                // </td>
                                            );
                                        })}


                                    </tr>
                                )
                            })}
                        </tbody>
                    </table>
                </div>
            </div>



            {/* Right Tooltip */}
            <Overlay
                show={showRight}
                target={() => targetRefs.current[hoveredRowIndex]}
                placement="right"
                container={document.body}
                rootClose
                onHide={() => setShowRight(false)}
            >
                {({ props, ref }) => (
                    <div
                        ref={ref}
                        {...props}
                        style={{
                            ...props.style,
                            zIndex: 1,
                            position: 'absolute'
                        }}
                        className={styles.overlayButtonContainer}
                    >

                        <Button
                            isLoading={false}
                            loadingText="Loading..."
                            btnText={currentPutSelection?.type !== 'buy' ? "Buy" : ""}
                            onClick={() => handlePutSelect(hoveredRowIndex, 'buy')}
                            className="successFillRectangleBtnXxs"
                            selectedValue={null}
                            isActive={null}
                            reactIconElement={currentPutSelection?.type === 'buy' ? <MdCheck fontSize={18} /> : null}
                        />
                        <Button
                            isLoading={false}
                            loadingText="Loading..."
                            btnText={currentPutSelection?.type !== 'sell' ? "Sell" : ""}
                            onClick={() => handlePutSelect(hoveredRowIndex, 'sell')}
                            className="dangerFillRectangleBtnXxs"
                            selectedValue={null}
                            isActive={null}
                            reactIconElement={currentPutSelection?.type === 'sell' ? <MdCheck fontSize={18} /> : null}
                        />
                    </div>
                )}
            </Overlay>



            {/* Left Tooltip */}
            <Overlay
                show={showLeft}
                target={() => targetRefs.current[hoveredRowIndex]}
                placement="left"
                container={document.body}
                rootClose
                onHide={() => setShowLeft(false)}
            >
                {({ props, ref }) => (
                    <div
                        ref={ref}
                        {...props}
                        style={{
                            ...props.style,
                            zIndex: 1,
                            position: 'absolute'
                        }}
                        className={styles.overlayButtonContainer}
                    >

                        <Button
                            isLoading={false}
                            loadingText="Loading..."
                            btnText={currentCallSelection?.type !== 'buy' ? "Buy" : ""}
                            onClick={() => handleCallSelect(hoveredRowIndex, 'buy')}
                            className="successFillRectangleBtnXxs"
                            selectedValue={null}
                            isActive={null}
                            reactIconElement={currentCallSelection?.type === 'buy' ? <MdCheck fontSize={18} /> : null}
                        />
                        <Button
                            isLoading={false}
                            loadingText="Loading..."
                            btnText={currentCallSelection?.type !== 'sell' ? "Sell" : ""}
                            onClick={() => handleCallSelect(hoveredRowIndex, 'sell')}
                            className="dangerFillRectangleBtnXxs"
                            selectedValue={null}
                            isActive={null}
                            reactIconElement={currentCallSelection?.type === 'sell' ? <MdCheck fontSize={18} /> : null}
                        />

                    </div>
                )}
            </Overlay>
        </>
    );
}

export default CallPutTable;