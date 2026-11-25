import React, { useState, useEffect } from "react";

import { useLocation } from "react-router-dom";
import Select from "react-select";
import { InputComponent } from "../../components/Input/InputFields";
import Button from "../../components/Button/Button";
import styles from "./styles/exportData.module.css"
import isEmpty from "is-empty";
import { getCsvDownloader, getExcelDownloader, getPdfDownloader } from "../../actions/userAction";
import { dateTimeFormat } from "../../lib/dateTimeHelper";

const fileOptionList = [
    { label: "PDF", value: "PDF" },
    { label: "Excel", value: "XLS" },
    { label: "CSV", value: "CSV" },
]

const ExportData = () => {
    const [type, setType] = useState('');
    const [filterBy, setFilterData] = useState({});
    const [error, setError] = useState({});

    const location = useLocation()

    const [tableOptions, setTableOptions] = useState(
        [
            { label: "History", value: "history" },
            { label: "Recent Transactions", value: "recenttransaction" },
            { label: "Orders History", value: "orderhistory" },
            { label: "Fills", value: "fills" },
            { label: "Closed History", value: "closedhistory" },
        ]
    )

    // yyyy-mm-dd, matches the format native <input type="date"> values/min/max use,
    // so string comparison ("2026-08-01" < "2026-08-04") is safe and timezone-free.
    const todayStr = new Date().toISOString().split('T')[0]
    const startDateStr = isEmpty(filterBy?.startDate) ? '' : new Date(filterBy.startDate).toISOString().split('T')[0]
    const endDateStr = isEmpty(filterBy?.endDate) ? '' : new Date(filterBy.endDate).toISOString().split('T')[0]

    const handleStartDate = (e) => {
        const value = e.target.value

        if (isEmpty(value)) {
            setFilterData((prev) => { const next = { ...prev }; delete next.startDate; return next })
            setError((prev) => ({ ...prev, startDate: "" }))
            return
        }

        // ✅ Start Date must not be a future date — `max` on the input below covers
        // the calendar picker, this covers manual typing (not reliably blocked by
        // the browser for out-of-range typed dates).
        if (value > todayStr) {
            setError((prev) => ({ ...prev, startDate: "Start Date cannot be a future date" }))
            return
        }

        setError((prev) => ({ ...prev, startDate: "" }))
        const startddate = new Date(value).getTime()
        // if the existing End Date now falls before the new Start Date, clear it
        // rather than leaving a stale, invalid range in place.
        const clearStaleEndDate = !isEmpty(endDateStr) && endDateStr < value
        setFilterData((prev) => {
            const next = { ...prev, startDate: startddate }
            if (clearStaleEndDate) delete next.endDate
            return next
        });
        if (clearStaleEndDate) {
            setError((prev) => ({ ...prev, endDate: "" }))
        }
    }

    const handleEndDate = (e) => {
        const value = e.target.value

        if (isEmpty(value)) {
            setFilterData((prev) => { const next = { ...prev }; delete next.endDate; return next })
            setError((prev) => ({ ...prev, endDate: "" }))
            return
        }

        // ✅ End Date range: min = Start Date (if set), max = today.
        if (value > todayStr) {
            setError((prev) => ({ ...prev, endDate: "End Date cannot be a future date" }))
            return
        }
        if (!isEmpty(startDateStr) && value < startDateStr) {
            setError((prev) => ({ ...prev, endDate: "End Date cannot be earlier than Start Date" }))
            return
        }

        setError((prev) => ({ ...prev, endDate: "" }))
        const enddate = new Date(value).getTime()
        setFilterData((prev) => ({
            ...prev,
            endDate: enddate,
        }));
    }

    const clearDates = () => {
        setFilterData((prev) => {
            const next = { ...prev }
            delete next.startDate
            delete next.endDate
            return next
        });
        setError((prev) => ({ ...prev, startDate: "", endDate: "" }))
    }

    const handleType = (e) => {
        setType(e?.value)
        setFilterData((prev) => ({
            ...prev,
            type: e?.value,
        }));
    }

    const handleDownload = async () => {
        try {
            let data

            if (isEmpty(type)) {
                setError({ ...error, type: "Please select a type" })
                return
            }
            if (isEmpty(filterBy?.fileType)) {
                setError({ ...error, fileType: "Please select a file type" })
                return
            }

            // ✅ FIX: `filterBy.type` (the field the backend actually reads to decide
            // which export — history/recenttransaction/orderhistory/etc — to build)
            // was only ever set as a side-effect of picking "Select Format", by
            // copying whatever the `type` state happened to be at that moment. This
            // page/route is reused across every export entry point in the app
            // (History, Recent Transactions, Orders History, Fills, PNL Analytics),
            // and doesn't remount between them — so if `filterBy.type` was ever set
            // on a previous visit and the effect that resyncs `type`/`filterBy` from
            // `location.state` raced with a user action, the request could go out
            // carrying a stale/mismatched `type` (e.g. requesting "history"'s
            // passbook-ledger export while the user is looking at "Recent
            // Transactions"). Building the payload here, always overriding with the
            // current `type` state (the single source of truth for this render),
            // guarantees the request can never disagree with what's on screen.
            const payload = { ...filterBy, type }
            if (payload?.fileType == "XLS") {
                data = getExcelDownloader(payload, type + "." + "XLS")
                return
            }
            if (payload?.fileType == "CSV") {
                data = getCsvDownloader(payload, type + "." + "CSV")
                return
            }
            if (payload?.fileType == "PDF") {
                data = await getPdfDownloader(payload, type + "." + "PDF")
                return
            }

        } catch (error) {
            console.log("handleDownload_err", error)
        }
    }

    useEffect(() => {
        window.scrollTo({
            top: 0,
            behavior: "smooth",
        });
    }, []);

    useEffect(() => {
        const currentType = location.state?.type;
        const filterBy = location.state?.filterBy;
        setType(currentType)
        setFilterData(filterBy)
    }, [location])


    return (
        <div className={`${styles.exportPage}`}>
            <div className={styles.headerPart}>
                <h3>
                    Export Data
                </h3>
                <p>
                    Export your data easily by selecting the table, file format, and date range.
                </p>
            </div>
            <div className={styles.bodyPart}>
                <div className="w-100 mt-1">
                    <label className="text-gray4">Select Export Table</label>
                    <div className="mt-2 w-100">
                        {!isEmpty(location?.state?.type) ? <InputComponent
                            type="text"
                            name="pairs"
                            value={type?.toUpperCase()}
                            disabled
                            readOnly
                        /> :
                            <>
                                <Select
                                    options={tableOptions}
                                    isSearchable={false}
                                    placeholder="Select"
                                    classNamePrefix="react-select__eighth"
                                    name="pairs"
                                    value={tableOptions.filter((item) => (item.value == type ? item : ""))[0]}
                                    onChange={(e) => {
                                        setError({ ...error, type: "" })
                                        handleType(e)
                                    }}
                                />
                                <span className="text-danger">{error?.type}</span>
                            </>
                        }
                    </div>
                </div>
                <div className="w-100 mt-3">
                    <label className="text-gray4">Select File Format</label>
                    <div className="mt-2 w-100">
                        <Select
                            options={fileOptionList}
                            isSearchable={false}
                            placeholder="Select"
                            classNamePrefix="react-select__eighth"
                            name="pairs"
                            value={fileOptionList.filter((item) => item.value == filterBy?.fileType)[0] || null}
                            onChange={(e) => {
                                setError({ ...error, fileType: "" })
                                setFilterData(prev => ({ ...prev, fileType: e.value, type: type }))
                            }
                            }
                        />
                        <span className="text-danger">{error?.fileType}</span>
                    </div>
                </div>
                <div className={styles.dateWrapper}>
                    <InputComponent
                        type="date"
                        label={"Start Date"}
                        onChange={(e) => handleStartDate(e)}
                        value={startDateStr}
                        max={todayStr}
                        error={error?.startDate}
                    />
                    <InputComponent
                        type="date"
                        label={"End Date"}
                        onChange={(e) => handleEndDate(e)}
                        value={endDateStr}
                        min={startDateStr || undefined}
                        max={todayStr}
                        error={error?.endDate}
                    />
                </div>
                <div className="d-flex justify-content-start gap-3">
                    <div className="min-w-25 mt-5">
                        <Button btnText={"Download"} className="successFillRectangleBtn" onClick={() => handleDownload()} />
                    </div>
                    <div className="min-w-25 mt-5">
                        <Button btnText={"Clear Date"} className="successFillRectangleBtn" onClick={() => clearDates()} />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ExportData;
