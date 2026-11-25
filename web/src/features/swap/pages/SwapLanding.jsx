

/** PACKAGE IMPORT */

import React, { useEffect, useState } from "react";
// import Lottie from "lottie-react";
import { useSelector } from "react-redux";
import ReactDatatable from "react-data-table-component";
import { FaArrowRight, FaList } from "react-icons/fa";
import { RiLayoutGrid2Fill } from "react-icons/ri";
import Select from 'react-select'
import { FaSortDown } from "react-icons/fa";
import { FiSearch } from "react-icons/fi";
import { FaBoxOpen } from "react-icons/fa6";
import isEmpty from "is-empty";
import { FaAngleDown, FaAngleUp, FaSortUp } from "react-icons/fa6";
import { TfiExchangeVertical } from "react-icons/tfi";



/** LOCAL FILES IMPORT */

import styles from "../styles/swapLanding.module.css"
import Images from "../../../utils/Images";
import Button from "../../../components/Button/Button";
import { SearchInput } from "../../../components/Input/InputFields";
import TableNoData from "../../../components/TableNoData/TableNoData";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import { useGlobalContext } from "../../../context/GlobalProvider";
import NoData from "../../../components/NoData/NoData";
import SelectCurrency from "../modal/SelectCurrency";

/** CODE START */


const SwapLanding = () => {

    const [showCurrency, setShowCurrency] = useState(false);
    const [currencyData, setCurrencyData] = useState(null);

    const currencyDetailsHandle = (data) => {
        if(data) {
            setShowCurrency(true);
            setCurrencyData(data);
        } else {
            setCurrencyData(null);
            setShowCurrency(false);
        }
    }

    useEffect(() => {
        window.scrollTo({
            top: 0,
            behavior: "smooth",
        });
    }, []);

    return (
        <>
            <SelectCurrency 
                show={showCurrency}
                currencyData={currencyData}
                handleClose={() => currencyDetailsHandle()}
            />
            <main className={styles.landing}>
                <section className={styles.launchpadLanding}>
                    <div className="custom-container container">
                        <div className="row justify-content-center my-5">
                            <div className="col-lg-6 col-xxl-5 pe-xl-4 position-relative">
                                <div className={`${styles.converstionCard}`}>
                                    <div className={`${styles.converstionCardSection}`}>
                                        <div>
                                            <p className={styles.label}>From</p>
                                            <div 
                                                className={`${styles.selectCurrency} d-flex align-items-center gap-2 mt-3`}
                                                onClick={() => setShowCurrency(true)}
                                            >
                                                <img src={Images.img} alt="img" className={styles.ccImage} />
                                                <p className={styles.labelValue}>
                                                    BNB
                                                </p>
                                                <p>
                                                    <FaAngleDown className="pb-1" />
                                                </p>
                                            </div>
                                        </div>
                                        <div>
                                            <div className="d-flex align-items-center gap-3 mb-3">
                                                <p className={styles.label}>Main balance</p>
                                                <p className={styles.labelValue}>9999980 BNB</p>
                                            </div>
                                            <p className={`${styles.labelValue} text-end`}>0.03507378</p>
                                        </div>
                                    </div>
                                </div>
                                <div className={`${styles.ccCardSwapBtn} ${styles.ccExchangeCard}`}>
                                    <TfiExchangeVertical fontSize={25} className={styles.exchangeIcon} />
                                </div>
                                <div className={`${styles.converstionCard} mt-3 mt-lg-4`}>
                                    <div className={`${styles.converstionCardSection}`}>
                                        <div>
                                            <p className={styles.label}>To</p>
                                            <div 
                                                className={`${styles.selectCurrency} d-flex align-items-center gap-2 mt-3`}
                                                onClick={() => setShowCurrency(true)}    
                                            >
                                                <img src={Images.img} alt="img" className={styles.ccImage} />
                                                <p className={styles.labelValue}>EUR </p>
                                                <p>
                                                    <FaAngleDown className="pb-1"/>
                                                </p>
                                            </div>
                                        </div>
                                        <div>
                                            <div className="d-flex align-items-center gap-3 mb-3">
                                                <p className={styles.label}>Main balance</p>
                                                <p className={styles.labelValue}>9999980 EUR</p>
                                            </div>
                                            <p className={`${styles.labelValue} text-end`}>0.00672299</p>
                                        </div>
                                    </div>
                                </div>
                                <div className="mt-4">
                                    <Button
                                        isLoading={false}
                                        // loadingText="Redirecting..."
                                        btnText="Swap"
                                        // onClick={handleCopyNavigate}
                                        className="successFillRectangleBtn"
                                    // selectedValue={currentResult}
                                    />
                                </div>
                            </div>
                            <div className="col-lg-6 col-xxl-5 ps-xl-4 mt-4 mt-lg-0">
                                <div className={styles.converstionCard}>
                                    <p className={styles.labelValue}>Note</p>
                                    <div>
                                        <ul className="mt-2">
                                            <li className={styles.label}>1. Swap is executed instantly from your Trevolt spot account.</li>
                                            <li className={styles.label}>2. Minimum swap limit 0.03506257 (EUR).</li>
                                            <li className={styles.label}>3. Maximum swap limit 328.3602 (EUR).</li>
                                            <li className={styles.label}>4. A conversion spread applies when exchanging currencies.</li>
                                            <li className={styles.label}>5. It varies with market conditions and is shown before confirmation.</li>
                                            <li className={styles.label}>6. The conversion fee of 0.00017139 (EUR) is charged and deducted.</li>
                                            <li className={styles.label}>7. It may take some time for the funds to reflect in your account. Please check the convert history for updates.</li>
                                        </ul>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="my-5">
                            <h5 className={styles.pageTitle}>Convert History</h5>
                            <div className="custom-table__secondary mt-3">
                                <ReactDatatable
                                    // columns={columns}
                                    // data={tableData}
                                    pagination
                                    paginationPerPage={10}
                                    paginationRowsPerPageOptions={[5, 10, 15, 20, 50, 100]}
                                    // customStyles={customStyles}
                                    className="dataTableComponent"
                                    // sortIcon={<BiSort style={{ marginLeft: "0.5rem", color: "#000" }} />}
                                    noDataComponent={<TableNoData />}
                                />
                            </div>
                        </div>
                    </div>
                </section>
            </main>
        </>
    );
};

export default SwapLanding;
