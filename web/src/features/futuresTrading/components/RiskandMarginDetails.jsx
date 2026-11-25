/** PACKAGE IMPORT */

import React, { useState, useRef, useEffect, useContext } from "react";
import { useDispatch, useSelector } from "react-redux";
import isEmpty from "is-empty";

/** LOCAL FILES IMPORT */

import styles from '../styles/tradeTable.module.css'
import Button from "../../../components/Button/Button";
import NoData from "../../../components/NoData/NoData";
import { PrimaryInput } from "../../../components/Input/InputFields";
import { useGlobalContext } from "../../../context/GlobalProvider";

/** CODE START */

/** REDUX */

const RiskandMarginDetails = () => {
    const { userdetails, riskAndMarginDetails, wallet } = useSelector((state) => state.user);
    const { convertValue, convertSecValue } = useGlobalContext()

    return (
        <div>
            <div>
                <div className={styles.tableSection}>
                    <div className="sticky-table riskandmargin-table">
                        <table className="table">
                            <thead>
                                <tr>
                                    <th className="text-start">Coin</th>
                                    <th className="text-start">Status</th>
                                    <th className="text-start">Blocked as margin</th>
                                    <th className="text-end">Initial Margin </th>
                                    <th className="text-end">Maintenance Margin</th>
                                    <th className="text-end">Theta</th>
                                    <th className="text-end">Vega</th>
                                    <th className="text-end">Gamma</th>
                                </tr>
                            </thead>
                            <tbody>

                                {!isEmpty(riskAndMarginDetails) ?
                                    Object.keys(riskAndMarginDetails).map((underlying) => {
                                        let val = riskAndMarginDetails[underlying]
                                        return (
                                            <tr>
                                                <td className="text-start">
                                                    <p>{underlying}</p>
                                                </td>
                                                <td className="text-start">
                                                    <p>--</p>
                                                </td>
                                                <td className="text-enstart">
                                                    <p>--</p>
                                                </td>
                                                <td className="text-end ">
                                                    <p>{convertValue(val.initialMargin)}</p>
                                                    <p>{convertSecValue(val.initialMargin)}</p>
                                                </td>
                                                <td className="text-end ">
                                                    <p>{convertValue(val.maintenanceMargin)}</p>
                                                    <p>{convertSecValue(val.maintenanceMargin)}</p>
                                                </td>
                                                <td className="text-end ">
                                                    <p>0</p>
                                                </td>
                                                <td className="text-end ">
                                                    <p>0</p>
                                                </td>
                                                <td className="text-end ">
                                                    <p>0</p>
                                                </td>
                                            </tr>
                                        )
                                    })
                                    :
                                    <></>
                                }

                            </tbody>
                            <tfoot className="table-footer">
                                <tr>
                                    <td className="text-start">Total</td>
                                    <td className="text-start">--</td>
                                    <td className="text-start">
                                        <p>
                                            {convertValue(wallet.freezeBalance)}
                                        </p>
                                        <p>
                                            {convertSecValue(wallet.freezeBalance)}
                                        </p>
                                    </td>
                                    <td className="text-end">
                                        <p>
                                            {convertValue(wallet.totalMargin)}
                                        </p>
                                        <p>
                                            {convertSecValue(wallet.totalMargin)}
                                        </p>
                                    </td>
                                    <td className="text-end">
                                        <p>
                                            {convertValue(wallet.totalMaintainMargin)}
                                        </p>
                                        <p>
                                            {convertSecValue(wallet.totalMaintainMargin)}
                                        </p>
                                    </td>
                                    <td className="text-end"></td>
                                    <td className="text-end"></td>
                                    <td className="text-end"></td>
                                </tr>
                            </tfoot>
                        </table>
                    </div>

                    {isEmpty(riskAndMarginDetails) ?
                        <div className={styles.noDataContainer}>
                            <NoData content={"No Risk and Margin Details"} />
                        </div> :
                        <></>
                    }
                </div>
            </div>
        </div>
    )
}

export default RiskandMarginDetails
