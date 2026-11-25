import React from 'react'
import styles from "../../styles/strategyBuilder.module.css"
import { getContractLabel } from './contractLabel'

export default function GreeksTableTab({ contracts }) {
    return (
        <div className={styles.baTab2}>
            <table>
                <thead>
                    <tr>
                        <th>Contract</th>
                        <th>Side</th>
                        <th>Delta</th>
                        <th>Gamma</th>
                        <th>Theta</th>
                        <th>Vega</th>
                    </tr>
                </thead>
                <tbody>
                    {contracts.map((c) => (
                        <tr key={c.id}>
                            <td>
                                <div className={styles.pnlContractTd}>
                                    <button className={styles[c.buyOrSell ? "buyLabel" : "sellLabel"]}>
                                        {c.buyOrSell ? "B" : "S"}
                                    </button>
                                    <span>{getContractLabel(c)}</span>
                                </div>
                            </td>
                            <td>
                                <p className={c.buyOrSell ? 'table-value__profit' : 'table-value__loss'}>
                                    {c.buyOrSell ? 'Long' : 'Short'}
                                </p>
                            </td>
                            <td>{c.greeks?.delta ?? "-"}</td>
                            <td>{c.greeks?.gamma ?? "-"}</td>
                            <td>{c.greeks?.theta ?? "-"}</td>
                            <td>{c.greeks?.vega ?? "-"}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    )
}
