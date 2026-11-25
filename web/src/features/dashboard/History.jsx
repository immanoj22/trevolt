/** PACKAGE IMPORT */

import React, { useEffect, useRef, useState } from 'react'
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { getMonth, getYear } from "date-fns";
import ReactDatatable from "react-data-table-component";
import Select from 'react-select'

/** LOCAL FILES IMPORT */
import styles from "./styles/authInnerPage.module.css"
import TableNoData from '../../components/TableNoData/TableNoData';
import Button from "../../components/Button/Button";
import { getPassbookHistoryHooks } from '../../actions/userAction';
import { useSelector } from 'react-redux';
import TransactionTable from './components/TransactionTable';
import { momentFormat } from '../../lib/dateTimeHelper';
import { useGlobalContext } from '../../context/GlobalProvider';
import { capitalizeFirst, formatValue } from '../../lib/Common';
import { futureOrderHistory } from '../../actions/futureActions';
import OrderHistory from '../futuresTrading/components/OrderHistory';
import OrderHistoryTable from './components/OrderHistory';
import FilledHistoryTable from './components/FilledOrdersHistory';
import { useNavigate } from 'react-router-dom';

/** CODE START */

const History = () => {

    const { convertValue, convertSecValue } = useGlobalContext();

    const columns = [
        {
            name: 'S.no',
            align: "left",
            width: "100px",
            selector: (record, index) => {
                const offset = (page - 1) * perPage;
                return (
                    <p className="fs15">{offset + index + 1}</p>
                );
            }
        },
        {
            name: 'Date / Time',
            align: "right",
            width: "200px",
            selector: (record) => {
                return (
                    <div className={"w-100"}>
                        <p className='fs15'>{momentFormat(record?.updatedAt)}</p>
                    </div>
                );
            }
        },
        {
            name: 'Type',
            align: "right",
            // width: "150px",
            selector: (record) => {
                return (
                    <p className="fs15">{capitalizeFirst(record?.type)}</p>
                );
            }
        },
        {
            name: 'Transfer Type',
            align: "right",
            // width: "150px",
            selector: (record) => {
                return (
                    <p className="fs15">{capitalizeFirst(record?.transferType)}</p>
                );
            }
        },
        {
            name: 'Before Transaction',
            align: "right",
            // width: "160px",
            selector: (record) => {
                return (
                    // <p>{toCutOff(convertValue(record?.beforeBalance ?? 0), record?.pip)}</p>
                    <div className={"fs15"}>
                        <p>{convertValue(record?.beforeBalance ?? 0, record?.pip)}</p>
                        <p className="fs13 mt-2 ms-1">
                            <span>{convertSecValue(record?.beforeBalance ?? 0, record?.pip)}</span>
                        </p>
                    </div>
                );
            }
        },
        {
            name: 'After Transaction',
            align: "right",
            // width: "180px",
            selector: (record) => {
                return (
                    // <p>{toCutOff(convertValue(record?.afterBalance ?? 0), record?.pip)}</p>
                    <div className={"fs15"}>
                        <p>{convertValue(record?.afterBalance ?? 0, record?.pip)}</p>
                        <p className="fs13 mt-2 ms-1">
                            <span>{convertSecValue(record?.afterBalance ?? 0, record?.pip)}</span>
                        </p>
                    </div>

                );
            }
        },
        {
            name: 'Amount',
            align: "right",
            // width: "150px",
            selector: (record) => {
                return (
                    // <p>{toCutOff(convertValue(record?.amount ?? 0), record?.pip)} {record?.currencyId?.currencySymbol}</p>
                    <div className={"fs15"}>
                        {/* {} */}
                        <p>{convertValue(record?.amount ?? 0, record?.pip)}</p>
                        <p className="fs13 mt-2 ms-1">
                            <span>{convertSecValue(record?.amount ?? 0, record?.pip)}</span>
                        </p>
                    </div>

                );
            }
        },

    ];

    const [startDate, setStartDate] = useState(null);
    const [endDate, setEndDate] = useState(null);
    const [startDateTime, setStartDateTime] = useState("");
    const [endDateTime, setEndDateTime] = useState("");
    const startDateRef = useRef(null);
    const endDateRef = useRef(null);
    const [activeTab, setActiveTab] = useState(1)
    const [pagination, setPagination] = useState({ page: 1, limit: 10 });

    const [page, setPage] = useState(1);
    const [limit, setLimit] = useState(10);
    const [totalCount, setTotalCount] = useState(0);
    const [selectedType, setSelectedType] = useState({ value: 'all', label: 'All' });
    const [transferType, setTransferType] = useState({ value: 'all', label: 'All' });
    const [resetKey, setResetKey] = useState(0);


    const currentYear = getYear(new Date());
    const years = Array.from({ length: currentYear - 1950 + 1 }, (_, i) => (1950 + i).toString()).reverse();
    const months = [
        "January",
        "February",
        "March",
        "April",
        "May",
        "June",
        "July",
        "August",
        "September",
        "October",
        "November",
        "December",
    ];

    const typeOptions = [
        { value: 'all', label: 'All' },
        { value: 'credit', label: 'Credit' },
        { value: 'debit', label: 'Debit' },
    ];

    const transfertypeOptions = [
        { value: 'all', label: 'All' },
        { value: 'deposit', label: 'Deposit' },
        { value: 'withdraw', label: 'Withdraw' },
        { value: "internaltransfer", label: "Internal Transfer" },
        { value: "futurestrade", label: "Futures Trade" },
        { value: 'welcomeBonus', label: 'Welcome Bonus' },
        { value: "affiliateCommission", label: 'Affiliate Commission' },
        { value: 'optiontrade', label: 'Option Trade' },
    ];

    const navigate = useNavigate()
    const { userdetails } = useSelector((state) => state.user);
    const [passbookHistory, setPassbookHistory] = useState([]);
    const [ordersHistory, setOrdersHistory] = useState([]);
    const [perPage, setPerPage] = useState(10);

    const { assetdetail } = useSelector((state) => state.wallet);


    useEffect(() => {
        if (Object.values(userdetails)?.length > 0) {
            setResetKey((prev) => prev + 1)
            let data = {
                startDate: startDateTime,
                endDate: endDateTime,
                page: 1
            }
            getDataByDate(data)
        }
        // getOrderHistry()
        // getFilledHisty()
    }, [selectedType, transferType, userdetails])

    // const getOrderHistry = async () => {
    //     try {
    //         // let Page = pagination.page + 1;
    //         // setPagination({ ...pagination, ...{ page: Page } })

    //         let reqData = {
    //             page: page,
    //             limit: limit,
    //         };
    //         const result = await futureOrderHistory("all", reqData, userdetails.secretKey, "all")
    //         if (result.status) {
    //             setOrdersHistory(result.record)
    //         }
    //         console.log("ressss", result)
    //     } catch (error) {
    //         console.log("getOrderHistry_err", error)
    //     }
    // }

    const getDataByDate = async (data) => {
        try {
            let reqData = {
                page: data?.page,
                limit: limit,
                startDate: data?.startDate != undefined ? data?.startDate : "",
                endDate: data?.endDate != undefined ? data?.endDate : "",
                data: data,
                selectedType: selectedType?.value,
                transferType: transferType?.value,
                accountId: userdetails.accountId
            }
            setPage(data?.page)
            const formData = new FormData();
            formData.append("page", data?.page);
            formData.append("limit", limit);
            formData.append("startDate", data?.startDate != undefined ? data?.startDate : "");
            formData.append("endDate", data?.endDate != undefined ? data?.endDate : "");
            formData.append("selectedType", selectedType?.value);
            formData.append("transferType", transferType?.value);
            formData.append("accountId", userdetails.accountId);
            let resp = await getPassbookHistoryHooks(formData, userdetails.secretKey);
            let result = resp?.data;
            if (result?.result?.data?.length > 0) {
                setPassbookHistory(result?.result?.data)
                setTotalCount(result?.result?.count)
            } else {
                setPassbookHistory([])
            }
        } catch (error) {
            console.log("getDataByDate_err", error);
        }
    }

    // useEffect(() => {
    //     console.log("assetdetail", assetdetail)
    //     let filter = assetdetail.map((el) => ({ label: el?.label, value: el?.currencyId }));
    //     setCoinOption(filter)
    // }, [assetdetail]);

    useEffect(() => {
        window.scrollTo({
            top: 0,
            behavior: "smooth",
        });
    }, [passbookHistory]);

    useEffect(() => {
        if (totalCount > 0) {
            setPerPage(totalCount < 10 ? totalCount : 10); // limit default to 10
        }
    }, [totalCount]);

    const resetPassbook = () => {
        try {
            // let reqData = { startDate: 0, endDate: 0, page: page, selectedType: 'all', 'transferType': 'all' };
            // getDataByDate(reqData)
            setStartDate(0)
            setEndDate(0)
            setPage(1)
            setSelectedType({ value: 'all', label: 'All' })
            setTransferType({ value: 'all', label: 'All' })
            setStartDateTime(0)
            setEndDateTime(0)
        } catch (e) {
            console.log("resetPassbook__Err", e)
        }
    }

    // console.log("totalCount_Det", perPage)

    const Export = () => {
        // ✅ FIX: previously only startDate/endDate were forwarded to the Export
        // page, so the currently-applied Type/Transfer Type filters silently
        // dropped out of the export request — the backend's shared
        // getPassbookHistories hook only applies those filters when present, so
        // the export query ended up broader than what was actually shown on
        // screen (e.g. 75 exported rows vs. 69 displayed).
        navigate('/export', {
            state: {
                type: 'history',
                filterBy: {
                    startDate: startDate ? startDate : "",
                    endDate: endDate ? endDate : "",
                    selectedType: selectedType?.value,
                    transferType: transferType?.value,
                }
            }
        })
    }


    return (
        <>
            <div className={'history_tabs'}>
                                <button
                    onClick={() => setActiveTab(1)}
                    className={`${activeTab == 1 && 'active'} tabs_btn`}
                >
                    Recent Transactions
                </button>
                <button
                    onClick={() => setActiveTab(2)}
                    className={`${activeTab == 2 && 'active'} tabs_btn`}
                >
                    History
                </button>
                <button
                    onClick={() => setActiveTab(3)}
                    className={`${activeTab == 3 && 'active'} tabs_btn`}
                >
                    Orders History

                </button>

                <button
                    onClick={() => setActiveTab(4)}
                    className={`${activeTab == 4 && 'active'} tabs_btn`}
                >
                    Fills
                </button>
            </div>

            {
                activeTab == 1 ?
                    <TransactionTable />:
                    activeTab == 2 ?
                        <>
                             <>
                        <div className='mt-4'>
                            {/* <h5 className={styles.pageTitle}>History</h5> */}

                            <div className={styles.innerPageHeader}>
                                <h5 className={styles.pageTitle}>History</h5>
                                <div className={`d-flex gap-3 align-items-center`}>
                                    {/* <Select
                        isSearchable={false}
                        placeholder="Filter"
                        classNamePrefix="react-select__ten"
                        options={typeOptions}
                        onChange={(e) => fetchHistoryData(e?.value)}
                    /> */}
                                    {/* <SearchInput
                        type={"text"}
                        error={null}
                        // onChange={(e) => fetchHistoryData(e?.target?.value)}
                        disabled={false}
                        placeholder={"Search"}
                        value={search}
                        name={"tableSearch"}
                        className={"defaultSearch"}
                        readOnly={false}
                        showSearchIcon={true}
                    /> */}
                                </div>
                            </div>

                            <div className="margin-top__xl">
                                <div className={`${styles.datepickerWrapper} `}>
                                    <div className="custom-datepicker__primary">
                                        <label htmlFor='datepicker2' className="calender-icon">
                                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" className="css-16vuvx8"><path fillRule="evenodd" clip-rule="evenodd" d="M10 4H7v2H4v3.5h16V6h-3V4h-3v2h-4V4zm10 8H4v7h16v-7z" fill="currentColor"></path></svg>
                                        </label>

                                        <DatePicker
                                            id='datepicker2'
                                            ref={startDateRef}
                                            placeholderText="Start Date"
                                            selected={startDate}
                                            maxDate={new Date()}
                                            onKeyDown={(e) => {
                                                e.preventDefault()
                                            }}
                                            onChange={(date) => {
                                                setStartDate(date)
                                                if (date && endDate && date > endDate) {
                                                    setEndDate(null);
                                                }
                                                let reqData = { startDate: new Date(date).getTime(), endDate: endDate != null ? new Date(endDate).getTime() : 0, page: 1, selectedType: selectedType?.value, 'transferType': transferType?.value };
                                                setStartDateTime(new Date(date).getTime())
                                                setResetKey((prev) => prev + 1)
                                                getDataByDate(reqData)
                                            }}
                                            renderCustomHeader={({
                                                date,
                                                changeYear,
                                                changeMonth,
                                                decreaseMonth,
                                                increaseMonth,
                                                prevMonthButtonDisabled,
                                                nextMonthButtonDisabled,
                                            }) => (
                                                <div className="custom-datepicker__primary-header">
                                                    <button
                                                        aria-label='lessthanIcon'
                                                        onClick={decreaseMonth}
                                                        disabled={prevMonthButtonDisabled}
                                                        className="btn-dateHandle"
                                                    >
                                                        {"<"}
                                                    </button>
                                                    <Select
                                                        isSearchable={false}
                                                        value={{ label: getYear(date).toString(), value: getYear(date) }}
                                                        onChange={(selected) => changeYear(selected.value)}
                                                        options={years.map((option) => ({ label: option, value: Number(option) }))}
                                                        classNamePrefix="react-select__calendarYear"
                                                        styles={{
                                                            control: (base) => ({ ...base, width: "120px" }),
                                                            menuList: (base) => ({ ...base, maxHeight: "200px", overflowY: "auto" }),
                                                        }}
                                                    />

                                                    <select
                                                        value={months[getMonth(date)]}
                                                        onChange={({ target: { value } }) =>
                                                            changeMonth(months.indexOf(value))
                                                        }
                                                    >
                                                        {months.map((option) => (
                                                            <option key={option} value={option}>
                                                                {option}
                                                            </option>
                                                        ))}
                                                    </select>

                                                    <button
                                                        aria-label='greaterthanIcon'
                                                        onClick={increaseMonth}
                                                        disabled={nextMonthButtonDisabled}
                                                        className="btn-dateHandle"
                                                    >
                                                        {">"}
                                                    </button>
                                                </div>
                                            )}
                                        />
                                    </div>
                                    <div className="custom-datepicker__primary">
                                        {" "}
                                        <label htmlFor='datepicker1' className="calender-icon">
                                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" className="css-16vuvx8"><path fillRule="evenodd" clip-rule="evenodd" d="M10 4H7v2H4v3.5h16V6h-3V4h-3v2h-4V4zm10 8H4v7h16v-7z" fill="currentColor"></path></svg>
                                        </label>
                                        <DatePicker
                                            id='datepicker1'
                                            minDate={startDate}
                                            maxDate={new Date()}
                                            ref={endDateRef}
                                            placeholderText="End Date"
                                            selected={endDate}
                                            onKeyDown={(e) => {
                                                e.preventDefault()
                                            }}
                                            onChange={(date) => {
                                                date.setHours(23)
                                                date.setMinutes(59)
                                                date.setSeconds(59)
                                                setEndDate(date)
                                                // if (date && endDate && date > endDate) {
                                                // setStartDate(null);
                                                // }
                                                let reqData = { startDate: startDate != null ? new Date(startDate).getTime() : 0, endDate: new Date(date).getTime(), page: 1, selectedType: selectedType?.value, 'transferType': transferType?.value }
                                                setResetKey((prev) => prev + 1)
                                                getDataByDate(reqData)
                                                setEndDateTime(new Date(date).getTime())
                                            }}
                                            renderCustomHeader={({
                                                date,
                                                changeYear,
                                                changeMonth,
                                                decreaseMonth,
                                                increaseMonth,
                                                prevMonthButtonDisabled,
                                                nextMonthButtonDisabled,
                                            }) => (
                                                <div className="custom-datepicker__primary-header">
                                                    <button
                                                        aria-label='lessthanIcon'
                                                        onClick={decreaseMonth}
                                                        disabled={prevMonthButtonDisabled}
                                                        className="btn-dateHandle"
                                                    >
                                                        {"<"}
                                                    </button>
                                                    <Select
                                                        isSearchable={false}
                                                        value={{ label: getYear(date).toString(), value: getYear(date) }}
                                                        onChange={(selected) => changeYear(selected.value)}
                                                        options={years.map((option) => ({ label: option, value: Number(option) }))}
                                                        classNamePrefix="react-select__calendarYear"
                                                        styles={{
                                                            control: (base) => ({ ...base, width: "120px" }),
                                                            menuList: (base) => ({ ...base, maxHeight: "200px", overflowY: "auto" }),
                                                        }}
                                                    />

                                                    <select
                                                        value={months[getMonth(date)]}
                                                        onChange={({ target: { value } }) =>
                                                            changeMonth(months.indexOf(value))
                                                        }
                                                    >
                                                        {months.map((option) => (
                                                            <option key={option} value={option}>
                                                                {option}
                                                            </option>
                                                        ))}
                                                    </select>

                                                    <button
                                                        aria-label='greaterthanIcon'
                                                        onClick={increaseMonth}
                                                        disabled={nextMonthButtonDisabled}
                                                        className="btn-dateHandle"
                                                    >
                                                        {">"}
                                                    </button>
                                                </div>
                                            )}
                                        />

                                    </div>
                                    <div className={`react-select__width-sm`}>
                                        <Select
                                            isSearchable={false}
                                            placeholder="Type"
                                            classNamePrefix="react-select__primary"
                                            options={typeOptions}
                                            onChange={(e) => setSelectedType({ value: e?.value, label: e?.label })}
                                            value={{ value: selectedType?.value, label: selectedType?.label }}
                                        />
                                    </div>
                                    <div className={`react-select__width-sm`}>
                                        <Select
                                            isSearchable={false}
                                            placeholder="TransferType"
                                            classNamePrefix="react-select__primary"
                                            options={transfertypeOptions}
                                            onChange={(e) => {
                                                setTransferType({ value: e?.value, label: e?.label })}}
                                            value={{ value: transferType?.value, label: transferType?.label }}
                                        />
                                    </div>
                                    <div className="mt-0 d-flex gap-3" >
                                        <Button
                                            isLoading={false}
                                            loadingText="Redirecting..."
                                            btnText={"Reset"}
                                            onClick={() => resetPassbook()}
                                            className="cardSuccessBtn_rect"
                                            selectedValue={null}
                                        />
                                        <Button
                                            isLoading={false}
                                            loadingText="Redirecting..."
                                            btnText={"Export"}
                                            onClick={() => Export()}
                                            className="cardSuccessBtn_rect"
                                            selectedValue={null}
                                        />
                                    </div>

                                    <div>
                                        {/* <button
                                            className="linear_button"
                                            onClick={() => { Export() }}
                                        >
                                            Export
                                        </button> */}
                                    </div>

                                </div>

                                <div className="custom-table__secondary mt-4">
                                    <ReactDatatable
                                        key={resetKey}
                                        columns={columns}
                                        data={passbookHistory}
                                        pagination
                                        paginationServer
                                        paginationPerPage={perPage}
                                        paginationTotalRows={totalCount}

                                        onChangePage={(page) => {
                                            let data = {
                                                startDate: startDateTime,
                                                endDate: endDateTime,
                                                page: page
                                            }
                                            getDataByDate(data)
                                        }}
                                        className="dataTableComponent"
                                        // sortIcon={<BiSort style={{ marginLeft: "0.5rem", color: "#000" }} />}
                                        noDataComponent={<TableNoData />}
                                    />
                                </div>
                            </div>
                        </div>
                    </> 
                        </> :
                        activeTab == 3 ?
                            <>
                                <OrderHistoryTable />
                            </> :
                            <>
                                <FilledHistoryTable />
                            </>

            }



        </>
    )
}

export default History