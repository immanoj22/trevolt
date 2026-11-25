/** PACKAGE IMPORT */

import React, { useEffect, useState } from 'react'
import { useSelector } from "react-redux";

/** LOCAL FILES IMPORT */
import styles from "./styles/pnlAnalyticsOverview.module.css";

/** LOCAL FILES IMPORT */
import "react-datepicker/dist/react-datepicker.css";
import 'react-calendar-heatmap/dist/styles.css';

/** Actions */
import { InputComponent, } from '../../components/Input/InputFields';
import Select from "react-select"
import CalendarHeatmap from 'react-calendar-heatmap';
import ReactDatatable from "react-data-table-component";
import TableNoData from '../../components/TableNoData/TableNoData';
import Button from '../../components/Button/Button';
import DatePicker from 'react-datepicker';
import { useNavigate } from 'react-router-dom';
import { futureClosedOrderHistory, getPNLChartOverview, getPNLOverview } from '../../actions/futureActions';
import { generateYearDateRange, getPastyear, momentFormat } from '../../lib/dateTimeHelper';
import { formatDisplayPair } from '../../lib/pairDisplay';
import { isString } from 'lodash';
import isEmpty from 'is-empty';
import CalendarHeatmapChart from './components/CalendarHeatmap';

/**CONTEXT */
import { useGlobalContext } from '../../context/GlobalProvider';

const values = [
    { date: "2025-01-06", status: "Profit", amount: "$10" },
    { date: "2025-02-05", status: "Loss", amount: "$10" },
    { date: "2025-03-03", status: "Profit", amount: "$10" },
    { date: "2025-04-01", status: "Loss", amount: "$10" },
    { date: "2025-05-07", status: "Profit", amount: "$10" },
    { date: "2025-06-09", status: "Loss", amount: "$10" },
];
const PnlAnalyticsOverview = () => {
    const navigate = useNavigate();

    const { convertValue, convertSecValue } = useGlobalContext()
    const { userdetails } = useSelector((state) => state.user);
    const { futurePairData } = useSelector((state) => state.future);
    const [pagination, setPagination] = useState({ page: 1, limit: 10 });
    const [resetKey, setResetKey] = useState(0);
    const [count, setCount] = useState(0);
    const [orderHistory, setorderHistory] = useState([]);
    const [yearList, setYearList] = useState([]);
    const [selectedYear, setSelectedYear] = useState('');
    const [DateRange, setDateRange] = useState({
        startDate: null,
        endDate: null
    });
    const [startDate, setStartDate] = useState(null);
    const [endDate, setEndDate] = useState(null);
    const [ChartValue, setChartValue] = useState([]);
    const [cardDetails, setCardDetails] = useState({});
    const columns = [
        {
            name: "S.NO",
            selector: (row, i) => i + 1,
            sortable: true,
            width: "80px",
        },
        {
            name: "Symbol",
            selector: (row) => formatDisplayPair(row.pairName),
            //     {
            //     return (
            //         <p>{row.pairName}</p>
            //     )
            // },
            sortable: true,
        },
        {
            name: "Date/Time",
            width: "200px",
            selector: (row) => momentFormat(row?.createdAt),
            // selector: (row) => {
            //     return (
            //         <p>{momentFormat(row?.createdAt)}</p>
            //     )
            // },
            sortable: true,
        },
        {
            name: "Entry price",
            width: "250px",
            selector: (row) => parseFloat(row.entryPrice).toFixed(row.quoteDecimal),
            //     {
            //     return (
            //         <p>{row.entryPrice}</p>
            //     )
            // },
            sortable: true,
        },
        {
            name: "Closed price",
            selector: (row) => parseFloat(row.closePrice).toFixed(row.quoteDecimal),
            //     {
            //     return (
            //         <p>{row.closePrice}</p>
            //     )
            // },
        },
        {
            name: "Qty",
            selector: (row) => parseFloat(row.quantity).toFixed(row.baseDecimal),
            //      {
            //     return (
            //         <p>{row.quantity}</p>
            //     )
            // },
            sortable: true,
        },
        // {
        //     name: "Net realised Pnl",
        //     selector: (row) => row.netRealisedPnl,
        // },
        {
            name: "Net realised Pnl",
            width: "200px",
            selector: (row) => row.grossPandL,
            cell: (row) => (
                <>
                    <p className='d-flex gap-2 align-items-center'>
                        <span
                            className={`fs16 ${row.grossPandL > 0 ? "value-profit" : "value-lose"}`}
                        >
                            {convertValue(row.grossPandL, row.quoteDecimal)}
                        </span>
                        <span
                            className={`fs14 ${row.grossPandL > 0 ? "value-profit" : "value-lose"}`}
                        >
                            {convertSecValue(row.grossPandL, row.quoteDecimal)}
                        </span>
                    </p>

                </>
            )
        },
    ];
    const handleBack = () => {
        navigate(-1)
    }

    const fetchCloseOrderHistory = async (pairId, reqData, tradeMode) => {
        try {
            let { record, status, count } = await futureClosedOrderHistory(pairId, reqData, userdetails.secretKey, tradeMode);
            if (status) {
                setorderHistory(record);
                setCount(count);
            } else {
                setorderHistory([]);
            }
        } catch (err) {
            console.log(err, "fetchCloseOrderHistory__err");
        }
    }

    const loadMore = async (page) => {
        try {
            setPagination({ ...pagination, ...{ page: page } })
            // let reqData = {
            //     page: Page,
            //     limit: pagination.limit,
            //     startDate: startDate,
            //     endDate: endDate
            // };
            // let formData = new FormData();
            // formData.append("page", Page);
            // formData.append("limit", pagination.limit);
            // formData.append("startDate", startDate);
            // formData.append("endDate", endDate);
            // let formData = createFormData(page, pagination.limit, startDate, endDate);
            let reqData = {
                page: page,
                limit: pagination.limit,
                startDate: startDate,
                endDate: endDate
            };
            fetchCloseOrderHistory("all", reqData, "all");
        } catch (err) {
            console.log(err, "LoadMore___err");
        }
    };

    const onFilterHandler = (data) => {

        // if (isString(data)) {
        //     setLast(data);
        // }

        setStartDate(data.startDate)
        setEndDate(data.endDate)
        if (data?.hasOwnProperty('startDate') && data?.startDate === 0) {
            setStartDate(null)
        }
        setPagination((prev) => ({ ...prev, page: 1 }))
        setResetKey((prev) => prev + 1)
        let reqData = {
            page: 1,
            limit: pagination.limit,
            startDate: data.startDate,
            endDate: data.endDate
        };
        fetchCloseOrderHistory('all', reqData, 'all');
    }

    const fetchClanderPNLOverview = async () => {
        try {
            if (userdetails.secretKey) {
                let { result, status } = await getPNLChartOverview(DateRange, userdetails.secretKey);
                setChartValue(result)
            }
        } catch (err) {
            console.log(err, "fetchClanderPNLOverview__err")
        }
    }

    const fetchPNLOverview = async () => {
        try {
            if (userdetails.secretKey) {
                let { result, status } = await getPNLOverview(userdetails.secretKey);
                setCardDetails(result)
            }
        } catch (err) {
            console.log(err, "fetchPNLOverview__err")
        }
    }

    const Export = () => {
        navigate('/export', {
            state: {
                type: 'closedhistory',
                filterBy: {
                    startDate: startDate ? startDate : "",
                    endDate: endDate ? endDate : "",
                }
            }
        })
    }

    useEffect(() => {
        let yearList = getPastyear(4)
        setYearList(yearList)
        const currentDate = new Date();
        const currentYear = currentDate.getFullYear();
        setSelectedYear(currentYear)
        const dateRage = generateYearDateRange(currentYear)

        setDateRange({ startDate: dateRage.startDate, endDate: dateRage.endDate })
    }, [])

    useEffect(() => {
        let reqData = {
            page: pagination.page,
            limit: pagination.limit,
            startDate: DateRange?.startDate,
            endDate: DateRange?.endDate
        };
        fetchCloseOrderHistory('all', reqData, 'all');
        fetchClanderPNLOverview()
        fetchPNLOverview()
    }, [userdetails, DateRange])

    //     useEffect(() => {
    //     fetchCloseOrderHistory({
    //         page: 1,
    //         limit: pagination.limit,
    //         startDate: startDate,
    //         endDate: endDate
    //     });
    //     fetchClanderPNLOverview()
    //     fetchPNLOverview()
    // }, [userdetails, DateRange])

    function createFormData(page, limit, startDate, endDate) {
        let formData = new FormData();
        formData.append("page", page);
        formData.append("limit", limit);
        formData.append("startDate", new Date(new Date(startDate).setHours(0, 0, 0, 0)));
        formData.append("endDate", new Date(new Date(endDate).setHours(23, 59, 59, 59)));
        formData.append("pairId", "all");
        formData.append("tradeMode", "all");
        return formData;
    }
    return (
        <div>
            <div className={styles.pageHeader}>
                <h5 className={styles.pageTitle}>PNL Overview</h5>
                <div className='d-flex gap-2'>
                    <Button
                        isLoading={false}
                        loadingText="Redirecting..."
                        btnText="Back"
                        onClick={handleBack}
                        className="backBtn"
                        selectedValue={null}
                    />
                </div>
            </div>
            <div className={styles.bodyContent}>
                <div className={styles.pnlCardWrapper}>
                    <div className={styles.cardPart}>
                        <h3>Realised P&L</h3>
                        <div
                            className={`d-flex gap-3 align-items-center ${cardDetails?.pnl > 0 ? 'value-profit' : 'value-lose'}`}
                        >
                            <p className='fs20'>
                                {convertValue(cardDetails?.pnl)}
                            </p>
                            <p className='fs17'>
                                {convertSecValue(cardDetails?.pnl)}
                            </p>
                        </div>
                    </div>
                    <div className={styles.cardPart}>
                        <h3>Charges & Taxes</h3>
                        <div
                            className={`d-flex gap-3 align-items-center`}
                        >
                            <p className='fs20'>
                                {convertValue(cardDetails?.fee)}
                            </p>
                            <p className='fs17'>
                                {convertSecValue(cardDetails?.fee)}
                            </p>
                        </div>
                    </div>
                </div>
                <div className={styles.chartContainer}>
                    <div className={styles.chartHeaderPart}>
                        <div className={styles.filterPart}>
                            {
                                yearList && yearList.length > 0 ? yearList.map((val) => {
                                    return (
                                        <div
                                            onClick={() => {
                                                setSelectedYear(val)
                                                const { startDate, endDate } = generateYearDateRange(val)
                                                setDateRange({ startDate: startDate, endDate: endDate })
                                            }}
                                        >
                                            <input
                                                type="radio"
                                                name="calenderFilter"
                                                id={val}
                                                checked={val == selectedYear ? true : false}
                                            />
                                            <label htmlFor="lastYear">{val}</label>
                                        </div>
                                    )
                                }) : ""
                            }
                            {/* <div>
                                <input type="radio" name="calenderFilter" id="lastYear" />
                                <label htmlFor="lastYear">Last Year</label>
                            </div>
                            <div>
                                <input type="radio" defaultChecked name="calenderFilter" id="thisYear" />
                                <label htmlFor="thisYear">This Year</label>
                            </div>
                            <div>
                                <input type="radio" name="calenderFilter" id="6month" />
                                <label htmlFor="6month">6 Month</label>
                            </div>
                            <div>
                                <input type="radio" name="calenderFilter" id="3month" />
                                <label htmlFor="3month">3 Month</label>
                            </div>
                            <div>
                                <input type="radio" name="calenderFilter" id="1month" />
                                <label htmlFor="1month">1 Month</label>
                            </div> */}
                        </div>
                        <div className={styles.chartLegendPart}>
                            <p>Profit <span></span> </p>
                            <p>Loss <span></span> </p>
                        </div>
                    </div>
                    <div className={styles.chartWrapper}>
                        {/* <CalendarHeatmap
                            startDate={DateRange.startDate}
                            endDate={DateRange.endDate}
                            values={ChartValue}
                            classForValue={(value) => {
                                if (!value) return "emptyBox";
                                if (value.status === "Profit") return "profitBox";
                                if (value.status === "Loss") return "loseBox";
                                return "emptyBox";
                            }}
                            showWeekdayLabels={true}
                            weekdayLabels={["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]}
                            gutterSize={2}
                            titleForValue={(obj) => {
                                if (!obj) return "No data";
                                return `Date: ${obj.date}\nStatus: ${obj.status}\nAmount: ₹${obj.amount}`;
                            }}
                        /> */}
                        <CalendarHeatmapChart
                            chartValue={ChartValue}
                            startDate={DateRange.startDate}
                            endDate={DateRange.endDate}
                        />
                    </div>
                    <div className={styles.tableContainer}>
                        <div className={styles.tableHeaderPart}>
                            <h2>PNL Records</h2>
                            <div className='d-flex flex-wrap gap-2 align-items-center'>
                                <div className="customDataPicker">
                                    <DatePicker
                                        selectsRange={true}
                                        startDate={isEmpty(startDate) ? "" : new Date(startDate)}
                                        endDate={isEmpty(endDate) ? "" : new Date(endDate)}
                                        onChange={(update) => {
                                            const [start, end] = update;
                                            onFilterHandler({ startDate: new Date(start).getTime(), endDate: isEmpty(end) ? "" : new Date(end).getTime() })
                                        }}
                                        isClearable={true}
                                        maxDate={new Date().getTime()}
                                        placeholderText='Filter Records'
                                    />
                                </div>
                                <Button
                                    className='cardLightBtn'
                                    btnText={"Export"}
                                    staticClass='rounded-2'
                                    onClick={() => {
                                        Export()
                                    }}
                                />
                            </div>
                        </div>
                        <div className="custom-table__secondary">
                            <ReactDatatable
                                key={resetKey}
                                columns={columns}
                                data={orderHistory}
                                pagination
                                paginationServer
                                paginationPerPage={pagination.limit}
                                paginationTotalRows={count}
                                paginationRowsPerPageOptions={[5, 10, 15, 20]}
                                noDataComponent={<TableNoData />}
                                onChangePage={(e) => {
                                    loadMore(e)
                                }}
                            />
                        </div>
                    </div>
                </div>

            </div>
        </div>
    )
}

export default PnlAnalyticsOverview