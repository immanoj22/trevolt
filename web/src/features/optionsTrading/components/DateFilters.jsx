/** PACKAGE IMPORT */

import React, { useEffect, useState } from 'react'
import { useDispatch, useSelector } from "react-redux";
import { useNavigate, useParams } from "react-router-dom";

/** LOCAL FILES IMPORT */

import styles from "../styles/tableAndChart.module.css"

/** REDUX */
import { getOptionDetails } from '../../../actions/OptionTradeAction';
import { isEmpty } from 'lodash';

/** CODE START */

const DateFilters = ({
    enableFilterScrollControl,
    expireDate,
    scrollRef,
    categoryScroll,
    className,
}) => {
    const [activeIndex, setActiveIndex] = useState(null);
    const navigate = useNavigate();
    const dispatch = useDispatch();
    const { underlyingSymbol, tikerRoot } = useParams()


    const setContractDatas = async (contract) => {
        const { data } = await getOptionDetails({ underlyingAsset: underlyingSymbol, expiryDateStr: contract }, dispatch);
        const pair = data?.[0]?.callpair?.[0]?.tickerRoot || data?.[0]?.putpair?.[0]?.tickerRoot;
        if (pair) {
            navigate(`/options/${underlyingSymbol}/${pair}`, { replace: true });
        }
        return data;
    }

    useEffect(() => {
        if (isEmpty(tikerRoot)) return;
        const [, expiryDateStr] = tikerRoot.split('-')
        setActiveIndex(expiryDateStr)
    }, [tikerRoot])
    return (
        <>
            <div className={className}
                ref={scrollRef}>
                {expireDate?.length > 0 && expireDate?.map((item, i) => (
                    /** for dynamic active class - styles.active */
                    <button
                        key={item?._id || item?.expiryDateStr || i}
                        className={item.expiryDateStr == activeIndex ? styles.active : ""}
                        onClick={() => {
                            setContractDatas(item.expiryDateStr);
                            setActiveIndex(item.expiryDateStr);
                        }}
                        // onClick={()=>handleSelect("jhasdhgashjd")}
                        aria-label='time'
                    >

                        {item.expiryDateStr}
                    </button>
                ))}
            </div>
        </>
    )
}

export default DateFilters
