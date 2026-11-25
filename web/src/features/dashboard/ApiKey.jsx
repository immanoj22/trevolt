/** PACKAGE IMPORT */
import React, { useRef, useState } from 'react'

/** LOCAL FILES IMPORT */
import styles from "./styles/authInnerPage.module.css"


/** LOCAL FILES IMPORT */
import { useEffect } from 'react';
import Button from '../../components/Button/Button';
import { AiOutlineInfoCircle } from 'react-icons/ai';
import { InputComponent, MultipleCheckboxSelect, PrimaryInput } from '../../components/Input/InputFields';
import Select from 'react-select';
import { IoClose } from 'react-icons/io5';
import { MdModeEdit } from 'react-icons/md';
import EditApiKey from './modal/EditApiKey';
import SecurityVerification from './modal/SecurityVerification';

/** CODE START */
const options = [
    { label: "105.5,106.51.150.4", value: "105.5,106.51.150.4" },
    { label: "106.5,106.51.150.5", value: "106.5,106.51.150.5" },
    { label: "107.5,106.51.150.6", value: "107.5,106.51.150.6" },
];

const ApiKeys = () => {

    const [editModelOpen, setEditModelOpen] = useState(false);
    const [securityOpen, setSecurityOpen] = useState(false);

    useEffect(() => {
        window.scrollTo({
            top: 0,
            behavior: "smooth",
        });
    }, []);


    return (
        <div>
            <div className={styles.cardHeader}>
                <h5 className={styles.pageTitle}>Create a new API key</h5>
            </div>
            <div className={`${styles.cardMaxWidthLg} mt-4`}>
                <div className={styles.cardBorder}>
                    <div className={`${styles.cardBorder} ${styles.createWebCardInfo} mb-4`}>
                        <div className='d-flex align-items-center gap-1'>
                            <AiOutlineInfoCircle />
                            <h3>2FA is mandatory to create Webhooks</h3>
                        </div>
                        <Button className='cardSuccessBtnSm' btnText={"Setup 2FA"} />
                    </div>
                    <div className={styles.webHookFormContainer}>
                        <div className={`${styles.singleFormWrapperSm} mb-4`}>
                            <label className={styles.singleFormLabel}>
                                Account Name
                            </label>
                            <div className={styles.webHookSelect}>
                                <Select
                                    isSearchable={false}
                                    placeholder="Select Account Name"
                                    classNamePrefix="react-select__eighth"
                                    options={[
                                        { label: "Main", value: "Main" }
                                    ]}
                                    menuPosition='fixed'
                                />
                            </div>
                        </div>
                        <div className={`${styles.singleFormWrapperSm} mb-4`}>
                            <label className={styles.singleFormLabel}>
                                API Key Name
                            </label>
                            <PrimaryInput className='primaryInputBgThree' placeholder={"Enter API Key Name"} />
                        </div>
                        <div className={`${styles.singleFormWrapperSm} mb-4`}>
                            <label className={styles.singleFormLabel}>
                                Whitelisted IP
                            </label>
                            <PrimaryInput className='primaryInputBgThree' placeholder={"Enter Whitelisted IP"} />
                        </div>


                        <div className={`${styles.singleFormWrapperSm} mb-4`}>
                            <label className={styles.singleFormLabel}>
                                IP’s to whitelist
                            </label>
                            <div className={styles.webHookSelect}>
                                <MultipleCheckboxSelect options={options} />
                                {/* <Select
                                    isSearchable={false}
                                    placeholder="Select Source "
                                    classNamePrefix="react-select__eighth"
                                    options={[
                                        { label: "Trading View", value: "tradingView" }
                                    ]}
                                    menuPosition='fixed'
                                /> */}
                            </div>
                        </div>

                        <div className='d-flex flex-wrap flex-md-nowrap align-items-center gap-3'>
                            <div className={`${styles.checkboxCard} ${styles.cardBorder} w-100  d-flex gap-2 rounded-2 p-3`}>
                                <div className="custom-checkInput__container2 p-2">
                                    <label className="custom-checkInput__label mt-1">
                                        <input
                                            type="checkbox"
                                            id="readDataPermisstions"
                                        />
                                        <span className="custom-checkInput__checkmark"></span>
                                    </label>
                                </div>
                                <div>
                                    <label htmlFor="readDataPermisstions" className={`mb-1`}>Read Data</label>
                                    <label htmlFor="readDataPermisstions">All API keys have read permissions</label>
                                </div>
                            </div>
                            <div className={`${styles.checkboxCard} ${styles.cardBorder} w-100  d-flex gap-2 rounded-2 p-3`}>
                                <div className="custom-checkInput__container2 p-2">
                                    <label className="custom-checkInput__label mt-1">
                                        <input
                                            type="checkbox"
                                            id="tradingPermisstions"
                                        />
                                        <span className="custom-checkInput__checkmark"></span>
                                    </label>
                                </div>
                                <div>
                                    <label htmlFor="tradingPermisstions" className={`mb-1`}>Trading</label>
                                    <label htmlFor="tradingPermisstions">Select this to give trading permissions</label>
                                </div>
                            </div>
                        </div>


                        <div className={`${styles.cardBorder} ${styles.webhookNotes}`}>
                            <div>
                                <AiOutlineInfoCircle />
                            </div>
                            <div>
                                <p>Trevolt does not bear liability for any losses incurred through signal trading. Please be aware that trade executions may experience delays or be skipped entirely due to reliance on signals from third-party platforms.</p>
                            </div>
                        </div>
                        <div className='mt-4 d-flex justify-content-center align-items-center'>
                            <Button onClick={() => setSecurityOpen(true)} btnText={"Create Webhook"} className='cardSuccessBtnSm' />
                        </div>
                    </div>
                </div>
            </div>
            <div className={styles.tableWrapper}>
                <>
                    <div className={`${styles.cardHeader} mt - 4`}>

                    </div>

                    <div className={'mt-4 tableContainer table-responsive'}>
                        <div>
                            <h3 className={`${styles.tableHeading} mb-2`}>Your API keys</h3>
                        </div>
                        <table className='table'>
                            <thead>
                                <tr>
                                    <th className="table-width__220 text-start">Account Name</th>
                                    <th className="table-width__120">API Key Name</th>
                                    <th className="table-width__140">API key</th>
                                    <th className="table-width__140">Permisstions</th>
                                    <th className="table-width__200">Whitelisted IP</th>
                                    <th className="table-width__140">Created On</th>
                                    <th className="table-width__140 text-center">Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                <>
                                    <tr>
                                        <>
                                            <td className="text-start">
                                                main
                                            </td>
                                            <td className="text-end">
                                                test
                                            </td>
                                            <td className="text-end">
                                                kwv9lN
                                            </td>
                                            <td className="text-end">
                                                Read Data
                                            </td>
                                            <td className="text-end">
                                                -
                                            </td>
                                            <td className="text-end">
                                                -
                                            </td>
                                            <td className="">
                                                <div className={`table-flexCenter`}>
                                                    <Button
                                                        isLoading={false}
                                                        loadingText=""
                                                        btnText=""
                                                        className="successFillRectangleBtnXxs"
                                                        selectedValue={null}
                                                        onClick={() => setEditModelOpen(true)}
                                                        reactIconElement={<MdModeEdit />}
                                                    />
                                                    <Button
                                                        isLoading={false}
                                                        loadingText=""
                                                        btnText=""
                                                        className="dangerOuterlineButtonXs"
                                                        selectedValue={null}
                                                        reactIconElement={<IoClose />}
                                                    />
                                                </div>
                                            </td>
                                        </>
                                    </tr>
                                </>
                            </tbody>
                        </table>
                    </div>
                </>

            </div>
            <EditApiKey show={editModelOpen} handleClose={() => setEditModelOpen(false)} />
            <SecurityVerification show={securityOpen} handleClose={() => setSecurityOpen(false)} />
        </div>
    )
}

export default ApiKeys
