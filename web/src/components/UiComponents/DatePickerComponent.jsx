import React, { useEffect, useRef, useState } from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { getMonth, getYear } from "date-fns";
import { range } from "lodash";
import { IoIosArrowBack, IoIosArrowForward } from "react-icons/io";
import Select from "react-select";

export const DatePickerComponent = (props) => {
    const dateRef = useRef(null);
    const [startDate, setStartDate] = useState("");

    const years = range(1950, getYear(new Date()) + 1, 1).reverse();

    const months = [
        "January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December"
    ];

    const yearOptions = years.map(y => ({ label: y.toString(), value: y }));
    const monthOptions = months.map((m, i) => ({ label: m, value: i }));

    useEffect(() => {
        setStartDate("");
    }, [props?.type]);

    return (
        <div className="custom-datepicker__primary withfull">
            <label htmlFor="datePicker">
                <div className="calender-icon">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" className="css-16vuvx8">
                        <path fillRule="evenodd" clipRule="evenodd" d="M10 4H7v2H4v3.5h16V6h-3V4h-3v2h-4V4zm10 8H4v7h16v-7z" fill="currentColor"></path>
                    </svg>
                </div>
            </label>

            <DatePicker
                id="datePicker"
                minDate={props?.minDate}
                maxDate={props?.maxDate}
                ref={dateRef}
                editable={false}
                placeholderText={props.placeholder}
                selected={startDate}
                dateFormat="dd/MM/yyyy"
                className={props.className}
                onChange={(date) => {
                    setStartDate(date);
                    props.selectData(date, "");
                }}
                onChangeRaw={(e) => e.preventDefault()}
                onPaste={(e) => e.preventDefault()}
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
                            aria-label="lessthanIcon"
                            onClick={decreaseMonth}
                            disabled={prevMonthButtonDisabled}
                            className="btn-dateHandle"
                        >
                            <IoIosArrowBack />
                        </button>

                        <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                            <Select
                                isSearchable={false}
                                value={{ label: getYear(date).toString(), value: getYear(date) }}
                                onChange={(selected) => changeYear(selected.value)}
                                options={yearOptions}
                                classNamePrefix="react-select__sixth"
                                styles={{
                                    control: (base) => ({
                                        ...base,
                                        width: "70px",
                                        padding: "0 5px"
                                    }),
                                    menuList: (base) => ({
                                        ...base,
                                        maxHeight: "200px",
                                        overflowY: "auto",
                                    }),
                                }}

                            />

                            <Select
                                isSearchable={false}
                                value={{ label: months[getMonth(date)], value: getMonth(date) }}
                                onChange={(selected) => changeMonth(selected.value)}
                                options={monthOptions}
                                classNamePrefix="react-select__sixth"
                                styles={{
                                    control: (base) => ({
                                        ...base,
                                        width: "100px",
                                        padding: "0 5px"
                                    }),
                                    menuList: (base) => ({
                                        ...base,
                                        maxHeight: "200px",
                                        overflowY: "auto",
                                    }),
                                }}
                            />
                        </div>

                        <button
                            aria-label="greaterthanIcon"
                            onClick={increaseMonth}
                            disabled={nextMonthButtonDisabled}
                            className="btn-dateHandle"
                        >
                            <IoIosArrowForward />
                        </button>
                    </div>
                )}
            />
        </div>
    );
};

// import React, { useEffect, useRef, useState } from "react";
// import DatePicker from "react-datepicker";
// import "react-datepicker/dist/react-datepicker.css";
// import { getMonth, getYear, } from "date-fns";
// // import range from "lodash/range";
// import { range } from "lodash";
// import { IoIosArrowBack, IoIosArrowForward } from "react-icons/io";

// export const DatePickerComponent = (props) => {

//     const dateRef = useRef(null);
//     const [dateOpen, setDateOpen] = useState(false);
//     const [startDate, setStartDate] = useState("");

//     const handleDateClick = () => {
//         if (!dateOpen) {
//             dateRef.current.input.click();
//             setDateOpen(true);
//         } else {
//             setDateOpen(false);
//         }
//     };
//     const years = range(1950, getYear(new Date()) + 1, 1);
//     const months = [
//         "January",
//         "February",
//         "March",
//         "April",
//         "May",
//         "June",
//         "July",
//         "August",
//         "September",
//         "October",
//         "November",
//         "December",
//     ];

//     const handleChangeRaw = (date) => {

//         let inputValue = date.currentTarget.value.replace(/\D/g, ''); // Remove any non-digit characters

//         if (inputValue.length >= 2) {
//             inputValue = inputValue.slice(0, 2) + '/' + inputValue.slice(2);
//         } if (inputValue.length >= 5) {
//             inputValue = inputValue.slice(0, 5) + '/' + inputValue.slice(5, 9);
//         }

//         // Update the input field with the formatted value
//         date.currentTarget.value = inputValue;

//         const datePattern = /^(0[1-9]|1[0-9]|2[0-9]|3[01])\/(0[1-9]|1[0-2])\/\d{4}$/; // Pattern: DD/MM/YYYY
//         const maxDate = new Date();

//         if (datePattern?.test(inputValue)) {
//             console.log(inputValue)
//             const [day, month, year] = inputValue?.split("/");
//             const newRaw = new Date(`${year}-${month}-${day}T00:00:00`); // Ensure the format is YYYY-MM-DD


//             if (!isNaN(newRaw) && newRaw <= maxDate) {
//                 setStartDate(newRaw);
//                 props.selectData(newRaw, "");
//                 // console.log("newRawnewRaw1", newRaw, newRaw <= maxDate)
//             } else if (newRaw > maxDate) {
//                 setStartDate(newRaw)
//                 props.selectData(newRaw, "Date exceeds the maximum allowed date.");
//                 // console.log("newRawnewRaw11", newRaw, newRaw <= maxDate)
//             } else {
//                 // console.log("newRawnewRaw111", newRaw, newRaw <= maxDate)
//                 setStartDate(newRaw)
//                 props.selectData(newRaw, "Invalid date.");
//             }
//         } else {
//             setStartDate("")
//             props.selectData(startDate, "Invalid date format. Please enter date as DD/MM/YYYY.");
//         }
//     };

//     useEffect(() => {
//         setStartDate("")
//     }, [props?.type])
//     return (
//         <div className="custom-datepicker__primary withfull">
//             <label htmlFor="datePicker">
//                 <div className="calender-icon">
//                     <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" class="css-16vuvx8"><path fillRule="evenodd" clip-rule="evenodd" d="M10 4H7v2H4v3.5h16V6h-3V4h-3v2h-4V4zm10 8H4v7h16v-7z" fill="currentColor"></path></svg>
//                 </div>
//             </label>

//             <DatePicker
//                 id="datePicker"
//                 minDate={props?.minDate}
//                 maxDate={props?.maxDate}
//                 ref={dateRef}
//                 editable={false}
//                 placeholderText={props.placeholder}
//                 selected={startDate}
//                 dateFormat="dd/MM/yyyy"
//                 className={props.className}
//                 onChange={(date) => {
//                     setStartDate(date);
//                     props.selectData(date, "");
//                 }}
//                 // onChangeRaw={(e) => {
//                 //     if (e.currentTarget.value != undefined) {
//                 //         handleChangeRaw(e)
//                 //     }
//                 // }}
//                 onChangeRaw={(e) => e.preventDefault()} // 🚫 Block typing
//                 onPaste={(e) => e.preventDefault()}
//                 renderCustomHeader={({
//                     date,
//                     changeYear,
//                     changeMonth,
//                     decreaseMonth,
//                     increaseMonth,
//                     prevMonthButtonDisabled,
//                     nextMonthButtonDisabled,
//                 }) => (
//                     <div className="custom-datepicker__primary-header">
//                         <button
//                             aria-label="lessthanIcon"
//                             onClick={decreaseMonth}
//                             disabled={prevMonthButtonDisabled}
//                             className="btn-dateHandle"
//                         >
//                             <IoIosArrowBack />
//                         </button>
//                         <div className="decorated">
//                             <select
//                                 value={getYear(date)}
//                                 onChange={({ target: { value } }) => changeYear(value)}
//                             >
//                                 <div className="dateOption">
//                                     {years.map((option) => (
//                                         <option key={option} value={option}>
//                                             {option}
//                                         </option>
//                                     ))}
//                                 </div>
//                             </select>
//                         </div>

//                         <select
//                             value={months[getMonth(date)]}
//                             onChange={({ target: { value } }) =>
//                                 changeMonth(months.indexOf(value))
//                             }
//                         >
//                             {months.map((option) => (
//                                 <option key={option} value={option}>
//                                     {option}
//                                 </option>
//                             ))}
//                         </select>

//                         <button
//                             aria-label="greaterthanIcon"
//                             onClick={increaseMonth}
//                             disabled={nextMonthButtonDisabled}
//                             className="btn-dateHandle"
//                         >
//                             <IoIosArrowForward />
//                         </button>
//                     </div>
//                 )}
//             />
//         </div>
//     );
// };