import React, { useState, useEffect, useContext } from "react";
import { useDispatch, useSelector } from "react-redux";

/** LOCAL FILES IMPORT */
import styles from '../styles/callPutTable.module.css';
import { colorKeys, lossColorKeys, profitColorKeys } from '../../../utils/tableDatas';
import { UpdateGreeks } from "../constants";

/** Context */
import SocketContext from "../../../context/socketContext";

import { FutureTicker, FutureTradePair } from "../../../redux/futureAction";
import { OptionTradePair, OptionTicker } from "../../../redux/optionAction";

const OptionCard = ({ opt, ind, colIndex }) => {

    const socketContext = useContext(SocketContext);
    const dispatch = useDispatch();
    const [option, setOption] = useState(opt);

    const formatValue = (ind, value) => {
        if (value === undefined || value === null || value === '') return '';

        const rawValue = Number(value);
        if (!Number.isFinite(rawValue)) return '0';

        let num = parseFloat(value.toString().replace(/[^0-9.-]/g, ''));
        if (isNaN(num)) return '0';

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

        // Qty columns (Bid Qty / Ask Qty) must be checked before the
        // price-keyword check below — "bidQty"/"askQty" both contain the
        // substrings "bid"/"ask", so they were being matched as prices
        // first and rendered as "$ 0.00" instead of as a plain quantity.
        // They also need more than 2 decimal places: option order
        // quantities are fractions of the base asset (e.g. 0.001 BTC) and
        // get displayed as "0.00" once rounded to 2dp. Use the contract's
        // own base-asset decimal precision (same field the order book
        // already uses for this), falling back to 3dp — enough to show a
        // typical minimum crypto order size — if it isn't set.
        if (ind.toLowerCase().includes('qty')) {
            const qtyDecimals = Number.isFinite(Number(option?.baseDecimal)) && Number(option?.baseDecimal) > 0
                ? Number(option.baseDecimal)
                : 3;
            return `${sign}${formattedNum.toFixed(qtyDecimals)}${suffix}`;
        }

        if (ind.toLowerCase().includes('price') || ind.toLowerCase().includes('mark') || ind.toLowerCase().includes('bid') || ind.toLowerCase().includes('ask') || ind.toLowerCase().includes('volume')) {
            return `$ ${sign}${formattedNum.toFixed(2)}${suffix}`;
        }

        if (ind.toLowerCase().includes('change') || ind.toLowerCase().includes('iv') || ind.toLowerCase().includes('percentage')) {
            return `${sign}${formattedNum.toFixed(2)}%`;
        }

        if (ind.toLowerCase().includes('oi')) {
            return `${sign}${formattedNum.toFixed(2)}${suffix}`;
        }

        return `${sign}${formattedNum.toFixed(2)}`;
    };

    const getColorClass = (key, value) => {
        // console.log('getColorClass',
        //     profitColorKeys.includes(key),
        //     lossColorKeys.includes(key)
        // );
        if (profitColorKeys.includes(key)) {
            return styles.greenText;
        }
        if (lossColorKeys.includes(key)) {
            return styles.redText;
        }
        return "";
    };
    // const getColorClass = (key, value) => {
    //     if (!colorKeys.includes(key) || !value) return '';

    //     const num = parseFloat(value.replace(/[^0-9.-]/g, ''));
    //     if (isNaN(num)) return '';

    //     if (num > 0) return styles.greenText;
    //     if (num < 0) return styles.redText;
    //     return '';
    // };

    useEffect(() => {
        // const updatedOption = UpdateGreeks(opt);
        setOption(opt);
    }, [opt])

    // useEffect(() => {
    //     if (!socketContext?.socket) return;

    //     const handler = (result) => {
    //         if (result._id !== option._id) return;

    //         const updatedOption = UpdateGreeks(result);

    //         setOption(updatedOption);

    //         dispatch(OptionTradePair({ tradePair: updatedOption }));
    //         dispatch(OptionTicker({ tikerData: updatedOption }));
    //         dispatch(FutureTradePair({ tradePair: updatedOption }));
    //         dispatch(FutureTicker({ tikerData: updatedOption }));
    //     };

    //     socketContext.socket.on("OptionPriceUpdate", handler);

    //     return () => {
    //         socketContext.socket.off("OptionPriceUpdate", handler);
    //     };
    // }, [socketContext.socket, dispatch]);


    return (
        <>
            <td ind={colIndex} className={styles.doubleValue}>
                <div className={`${styles.primaryValue} ${getColorClass(ind, option[ind]?.primary)}`}>
                    {formatValue(ind, option[ind])}
                </div>
                <div className={styles.secondaryValue}>
                    {formatValue(ind, option[ind])}
                </div>
            </td>
        </>
    )
}

export default OptionCard;