/** PACKAGE IMPORT */

import React, { useState, useEffect } from 'react'
import { CiLocationArrow1 } from "react-icons/ci";
import isEmpty from 'is-empty';
import { useSelector } from "react-redux";

/** LOCAL FILES IMPORT */

import styles from "./styles/pnlAnalytics.module.css";
import Button from '../../components/Button/Button'


/** LOCAL FILES IMPORT */

import RealizedPnlChat from './components/RealizedPnl';
import VolumnTradeChat from './components/VolumnTradeChat';
import FeePaidChat from './components/FeePaidChat';
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { useGlobalContext } from '../../context/GlobalProvider';
import TradingEquityChat from './components/TradingEquityChat';

/** Actions */
import { futurePandLChart, futurePandLSummary } from '../../actions/futureActions';
import { useNavigate } from 'react-router-dom';
import NoData from '../../components/NoData/NoData';
import { isString } from 'lodash';

/** CODE START */

const PnlAnalytics = () => {
    const navigate = useNavigate();

    const { userdetails } = useSelector((state) => state.user);
    const { showCurrency, secondaryCurrency } = useSelector((state) => state.wallet);
    const { convertValue } = useGlobalContext();
    const [dateRange, setDateRange] = useState([null, null]);

    const [startDate, endDate] = dateRange;
    const [filterData, setFilterData] = useState({
        range: "30d", startDate: null, endDate: null
    });
    const [chartData, setChartData] = useState({});
    const [barChart, setBarChart] = useState({});
    const [summaryDetails, setSummaryDetails] = useState({});
    const [lastSet, setLast] = useState('')
    const [isAllEmpty, setIsAllEmpty] = useState(false)

    const [isEmptyfeeChart, setIsEmptyfeeChart] = useState(false)
    const [isEmptyProfitChart, setIsEmptyProfitChart] = useState(false)
    const [isEmptyVolumeChart, setIsEmptyVolumeChart] = useState(false)

    useEffect(() => {
    }, [chartData])


    const onFilterHandler = (data, isCustom = false) => {

        if (isString(data)) {
            setLast(data);
        }

        setFilterData(prevFilterData => {
            if (isCustom) {
                return { ...prevFilterData, startDate: data.startDate, endDate: data.endDate, range: null };
            } else {
                return { ...prevFilterData, range: data, startDate: null, endDate: null };
            }
        });

        if (data?.hasOwnProperty('startDate') && data?.startDate === 0) {
            setFilterData(prevFilterData => ({
                ...prevFilterData,
                range: lastSet,
                startDate: null,
                endDate: null
            }));
        }
    }

    const getChartData = async () => {
        try {
            const { result, status, message } = await futurePandLChart(filterData, userdetails.secretKey);
            if (status) {
                const isAllEmpty = result?.series?.every(item => item.data.length === 0);
                setIsAllEmpty(isAllEmpty)
                setChartData(result)
            }
        } catch (e) {
            console.log("getChartData_err", e);
        }
    }

    const getPandLSummary = async () => {
        try {
            const { result, status, message } = await futurePandLSummary(filterData, userdetails.secretKey);
            if (status) {
                setSummaryDetails(result?.summary)
                setBarChart(result?.charts)
                const chartCheck = checkChartsEmpty(result?.charts)
                setIsEmptyfeeChart(chartCheck?.feeChart)
                setIsEmptyProfitChart(chartCheck?.profitChart)
                setIsEmptyVolumeChart(chartCheck?.volumeChart)
            }
        } catch (e) {
            console.log("getChartData_err", e);
        }
    }

    const checkChartsEmpty = (obj) => {
        const result = {};
        for (const [key, value] of Object.entries(obj)) {
            const hasCategories = Array.isArray(value.categories) && value.categories.length > 0;
            const hasSeriesData =
                Array.isArray(value.series) &&
                value.series.some(s => Array.isArray(s.data) && s.data.length > 0);

            result[key] = !(hasCategories || hasSeriesData);
        }
        return result;
    };

    useEffect(() => {
        if (!isEmpty(userdetails)) {
            getChartData()
            getPandLSummary()
        }
    }, [userdetails, filterData, showCurrency, secondaryCurrency]);


    return (
        <div>
            <div className={styles.innerPageHeader}>
                <h5 className={styles.pageTitle}>PNL Analytics</h5>
                <Button onClick={() => navigate("/pnl-overview")} btnText={"PNL Overview"} className='cardLightBtn' staticClass='rounded-2' />
            </div>
            <div className={styles.content}>
                <div className={styles.graphFilter + " mt-4"}>
                    <div className='d-flex gap-2 flex-wrap'>
                        <button aria-label='filterBtn' className={`${styles.filterBtn} ${filterData.range === '7d' && styles.active}`} onClick={() => { onFilterHandler('7d') }} >
                            Last 7 days
                        </button>
                        <button aria-label='filterBtn' className={`${styles.filterBtn} ${filterData.range === '30d' && styles.active}`} onClick={() => { onFilterHandler('30d') }}>
                            Last 30 days
                        </button>
                        <div className="customDataPicker">

                            <DatePicker
                                selectsRange={true}
                                startDate={isEmpty(filterData.startDate) ? "" : new Date(filterData.startDate)}
                                endDate={isEmpty(filterData.endDate) ? "" : new Date(filterData.endDate)}
                                onChange={(update) => {
                                    const [start, end] = update;
                                    onFilterHandler({ startDate: new Date(start).getTime(), endDate: isEmpty(end) ? "" : new Date(end).getTime() }, true)
                                }}
                                isClearable={true}
                                maxDate={new Date().getTime()}
                                placeholderText='Customize'
                            />
                        </div>
                    </div>
                </div>
                <div className={styles.graphSection}>
                    <div className={styles.headSection}>
                        <div className={styles.graphTitle}>
                            Trading Equity
                        </div>
                    </div>
                    <div className={styles.tradingGraph}>
                        {
                            !isAllEmpty
                                ?
                                <TradingEquityChat chartData={chartData} range={filterData.range} />
                                :
                                <div className={styles.chartNoData}>
                                    <NoData />
                                </div>

                        }
                    </div>
                    <div className={styles.chatContent}>
                        <ul>
                            <li className='mb-2'><CiLocationArrow1 className='me-2' size={12} />The chart will show data only for periods when there has been transactional activity in your account.</li>
                            <li className='mb-2'><CiLocationArrow1 className='me-2' size={12} />The chart updates once every 6 hours.</li>
                            <li><CiLocationArrow1 className='me-2' size={12} />Referral income is not included in Trading Equity Chart.</li>
                        </ul>
                    </div>
                </div>

                <div className='mt-4'>

                    <div className={`${styles.winLossValues} mt-4 d-flex align-items-center gap-3 gap-lg-5 flex-wrap`}>
                        <div className={styles.labelValue}>
                            <span className={styles.title + " position-relative"}>Total Realized PNL</span>
                            <span className={styles.value}>
                                {convertValue(summaryDetails?.totalPnL ?? 0, 3)}
                            </span>
                        </div>
                        <div className={styles.labelValue}>
                            <span className={styles.title + " position-relative"}>Win Rate</span>
                            <span className={styles.value}>{summaryDetails?.winingPercentage?.toFixed(2) ?? 0} %</span>
                        </div>
                        <div className={styles.labelValue}>
                            <span className={styles.title + " position-relative"}>Average Win</span>
                            <span className={styles.value}>
                                {convertValue(summaryDetails?.profit ?? 0, 3)}
                            </span>
                        </div>
                        <div className={styles.labelValue}>
                            <span className={styles.title + " position-relative"}>Average Loss</span>
                            <span className={styles.value}>
                                {convertValue(summaryDetails?.loss ?? 0, 3)}
                            </span>
                        </div>
                        <div className={styles.labelValue}>
                            <span className={styles.title + " position-relative"}># Trades</span>
                            <span className={styles.value}>{summaryDetails?.count ?? 0}</span>
                        </div>

                    </div>
                    <div className='row'>
                        <div className='col-lg-6'>
                            <div className={styles.columnChatSec}>
                                <div className={styles.headSection}>
                                    <div className={styles.title}>
                                        Realized PNL
                                        <span className={styles.value + " ms-2"}>
                                            {convertValue(summaryDetails?.totalPnL ?? 0, 3)}
                                        </span>
                                    </div>
                                </div>
                                <div className={styles.tradingGraph} >
                                    {!isEmptyProfitChart ?
                                        <RealizedPnlChat barChart={barChart?.profitChart} range={filterData.range} />
                                        :
                                        <div className={styles.chartNoData}>
                                            <NoData />
                                        </div>
                                    }
                                </div>

                            </div>
                        </div>
                        <div className='col-lg-6'>
                            <div className={styles.columnChatSec}>
                                <div className={styles.headSection}>
                                    <div className={styles.title}>
                                        Volume Traded
                                        <span className={styles.value + " ms-2"}>
                                            {convertValue(summaryDetails?.volume ?? 0, 3)}
                                        </span>
                                    </div>
                                </div>
                                <div className={styles.tradingGraph}>


                                    {!isEmptyVolumeChart ?
                                        <VolumnTradeChat barChart={barChart?.volumeChart} range={filterData.range} />
                                        :
                                        <div className={styles.chartNoData}>
                                            <NoData />
                                        </div>}
                                </div>

                            </div>
                        </div>
                        <div className='col-lg-6'>
                            <div className={styles.columnChatSec}>
                                <div className={styles.headSection}>
                                    <div className={styles.title}>
                                        Fees Paid
                                        <span className={styles.value + " ms-2"}>
                                            {convertValue(summaryDetails?.fee ?? 0, 3)}
                                        </span>
                                    </div>
                                </div>
                                <div className={styles.tradingGraph}>

                                    {!isEmptyfeeChart ?
                                        <FeePaidChat barChart={barChart?.feeChart} range={filterData.range} />
                                        :
                                        <div className={styles.chartNoData}>
                                            <NoData />
                                        </div>}
                                </div>

                            </div>
                        </div>
                    </div>
                    <div className={styles.chatContent + " mt-4"}>
                        <ul>
                            <li className='mb-2'><CiLocationArrow1 className='me-2' size={12} />Due to the complexity of financial data, there might be nuances and delay. Data displayed above is for reference only.</li>
                            <li className='mb-2'><CiLocationArrow1 className='me-2' size={12} />The filter customization enables you to access data spanning a maximum of 93 days at once, and it can retrieve information going back up to 4 months. Historical data can be downloaded from <a href='' className='downloadHereBtn'>Here.</a></li>
                            <li><CiLocationArrow1 className='me-2' size={12} />Positions opened and closed at the same price are not considered as trades.</li>
                        </ul>
                    </div>
                </div>

            </div>
        </div >
    )
}

export default PnlAnalytics