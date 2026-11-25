/** PACKAGE IMPORT */
import React, { useEffect, useState, useContext, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useParams, useNavigate } from "react-router-dom";
import isEmpty from "is-empty";

/**LOCAL FILES IMPORT */

import styled from "../styles/recentTrades.module.css"
import NoData from "../../../components/NoData/NoData";


/** Context */
import SocketContext from "../../../context/socketContext";
/**ACTIONS */
import { futureRecentTrade } from "../../../actions/futureActions";
import { formatValue } from "../../../lib/Common";
import { IoIosCloseCircleOutline } from "react-icons/io";


/** CODE START */

const RecentTrades = ({ onClose }) => {
    const { futurePairData, futureTicker, futureTradePair } = useSelector((state) => state.future);
    const socketContext = useContext(SocketContext);

    // const socketContext = useContext(SocketContext);
    // const { futuresPair, futuresTicker } = useSelector((state) => (state.futures))
    const [recentTrade, setRecentTrade] = useState([])
    const [recentTradeHeight, setRecentTradeHeight] = useState()
    const [openOrder, setOpenOrder] = useState([]);
    const [selectedTab, setSelectedTab] = useState('currentContract')

    const FutureId = useRef(futureTradePair?._id);


    const observedDiv = useRef(null);

    const fetchRecenTrade = async () => {
        try {
            if (!isEmpty(FutureId.current)) {
                let { status, result } = await futureRecentTrade(FutureId.current)
                if (status) {
                    setRecentTrade(result)
                } else {
                    setRecentTrade([])
                }
            }

        } catch (err) {
            console.log(err, 'fetchRecenTrade__err')
        }
    }

    // const z = (n) => {
    //     return ('0' + n).slice(-2);
    // }

    useEffect(() => {
        if (!observedDiv.current) {
            return;
        }
        const resizeObserver = new ResizeObserver(() => {
            if (observedDiv.current.offsetHeight) {
                setRecentTradeHeight(observedDiv.current.offsetHeight);
            }
        });
        resizeObserver.observe(observedDiv.current);
        return function cleanup() {
            resizeObserver.disconnect();
        };
    }, [observedDiv.current]);

    useEffect(() => {
        if (!isEmpty(futureTradePair) && FutureId.current != futureTradePair._id) {
            FutureId.current = futureTradePair._id
        }
    }, [futureTradePair])

    useEffect(() => {
        fetchRecenTrade()
    }, [FutureId.current])


    useEffect(() => {
        socketContext.socket.on('FuturesrecentTrade', (result) => {
            // result = JSON.parse(result)
            let tikerRoot = localStorage.getItem('futurespair')
            if (result.tickerRoot == tikerRoot) {
                setRecentTrade((prevRecord) => {
                    // return [...result.data, ...prevRecord].slice(0, 30)
                    return [...result.data].slice(0, 30)
                })
            }
        })
    }, [socketContext])


    // console.log('recenttradeheight', recentTradeHeight)

    return (
        <div className={`${styled.container} ${styled.orderBookContainer}`} ref={observedDiv}>
            {onClose && <IoIosCloseCircleOutline onClick={onClose} className={styled.containerClosebtn} />}
            <div className={`${styled.header} d-flex justify-content-between`} data-panel-drag-handle="true">
                <div className={styled.title}>Recent Trades</div>
            </div>

            <div className={styled.body}>
                <div className={`${styled.bodyHeader} row mx-auto`}>
                    <div className="col-4 px-0">
                        <p className={styled.bodyHeaderTitle}>Price</p>
                    </div>
                    <div className="col-5 ps-0 pe-4">
                        <p className={`${styled.bodyHeaderTitle} text-end`}>Amount</p>
                    </div>
                    <div className="col-3 px-0">
                        <p className={`${styled.bodyHeaderTitle} text-end`}>Time</p>
                    </div>

                </div>
                <div className={styled.bodyContainer} style={{ height: `${recentTradeHeight - 80}px` }} >

                    {/* 80px calculation ==> header height : 45px ; bodyHeader:30px; extra 5px for padding bottom */}

                    {recentTrade.length > 0 ? recentTrade.map((val, index) => {
                        let dataTime = new Date(val?.createdAt);
                        let time = (dataTime.getUTCHours()) + ':' + (dataTime.getUTCMinutes()) + ':' + (dataTime.getUTCSeconds());
                        return (
                            <div key={index} className={`${styled.pairsRow} row mx-auto`}>
                                <div className="col-4 px-0">
                                    <p className={` ${styled.pairText} text-start ${val.Type === "buy"
                                        ? styled.high
                                        : styled.low
                                        }`}>{isNaN(val?.price) ? 0 : (val?.price)?.toFixed(futureTradePair?.quoteDecimal)}</p>
                                </div>
                                <div className="col-5 ps-0 pe-4">
                                    <p
                                        className={`${styled.pairText} text-end `}
                                    >
                                        {isNaN(val?.filledQuantity) || !isFinite(val?.filledQuantity) ? 0 : formatValue(val?.filledQuantity ?? 0, futureTradePair?.baseDecimal)}
                                    </p>
                                </div>{" "}
                                <div className="col-3 px-0">
                                    <p className={`text-end ${styled.pairText}`}>{time}</p>
                                </div>
                            </div>
                        )
                    }) : <NoData content="No Data" />}
                </div>
            </div>
        </div>
    );
};

export default RecentTrades;