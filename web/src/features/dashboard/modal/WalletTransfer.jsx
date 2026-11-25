/** PACKAGE IMPORT */

import React, { useEffect, useRef, useState } from "react";
import { Modal } from "react-bootstrap";
import { IoClose } from "react-icons/io5";
import Select from 'react-select'
import { TbTransferVertical } from "react-icons/tb";


/** LOCAL FILES IMPORT */

import styles from "../styles/modal.module.css"
import { InputWithCurrencyAndLabel, PrimaryInput } from "../../../components/Input/InputFields";
import Button from "../../../components/Button/Button";
import { object } from "yup";
import { walletTransferHooks } from "../../../actions/walletAction";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { validateWalletTransfer } from "../../../pages/Validation/userValidation";


/** ACTIONS */
import { showToastMessage } from "../../../lib/toast";
import { toCutOff } from "../../../calculation/calculationlib";


const WalletTransfer = (props) => {

    let numregex = /^[0-9]+$/;
    let dotnumregex = /^\d*\.?\d*$/;
    let navigate = useNavigate();
    const { userdetails } = useSelector((state) => state.user);

    const walletOpt = [
        { "value": "Main", "label": "Main" },
        { "value": "Futures", "label": "Futures" },
        { "value": "Options", "label": "Options" }
    ]

    const { show, handleClose, bankData, currencyData, assetTableData } = props;

    const [amount, setAmount] = useState("");
    const [errors, setErrors] = useState({});
    const [formValue, setFormValue] = useState([
        { value: "", label: "", balance: 0, pip: 0, symbol: "INR" },
        { value: "", label: "", balance: 0, symbol: "INR", pip: 0 }
    ]);


    useEffect(() => {
        if (assetTableData?.length > 0) {
            let mainBalance = assetTableData[0].balance;
            let futuresBalance = assetTableData[0].futuresBalance;
            setFormValue([
                { value: "Main", label: "Main", balance: mainBalance, symbol: assetTableData[0]._id, pip: assetTableData[0].pip },
                { value: "Futures", label: "Futures", balance: futuresBalance, symbol: assetTableData[0]._id, pip: assetTableData[0].pip }
            ]);
            setAmount(mainBalance)
        }
    }, [assetTableData])

    const handleChange = (e, type) => {
        let mainBalance = assetTableData[0].balance;
        let optionBalance = assetTableData[0].optionBalance;
        let futuresBalance = assetTableData[0].futuresBalance;
        let balance = e.value == "Main" ? mainBalance : e.value == "Options" ? optionBalance : e.value == "Futures" ? futuresBalance : 0
        if (type == "from") {
            if (e.value != formValue[1].value) {
                setFormValue([{ value: e?.value, label: e?.label, balance: balance, symbol: assetTableData[0]._id, pip: assetTableData[0].pip }, { value: formValue[1].value, label: formValue[1].label, balance: formValue[1].balance, symbol: assetTableData[0]._id, pip: assetTableData[0].pip }])
            }

        }
        if (type == "to") {
            if (e.value != formValue[0].value) {
                setFormValue([{ value: formValue[0].value, label: formValue[0].label, balance: formValue[0].balance, symbol: assetTableData[0]._id, pip: assetTableData[0].pip }, { value: e?.value, label: e?.label, balance: balance, symbol: assetTableData[0]._id, pip: assetTableData[0].pip }])
            }

        }
    }


    const onSwap = () => {
        setFormValue([{ value: formValue[1].value, label: formValue[1].label, balance: formValue[1].balance, symbol: assetTableData[0]._id, pip: assetTableData[0].pip }, { value: formValue[0].value, label: formValue[0].label, balance: formValue[0].balance, symbol: assetTableData[0]._id, pip: assetTableData[0].pip }])
        setAmount((formValue[1].balance))
    }


    const close = () => {
        // setFormValue([{ value: "", label: "", balance: 0, symbol: "INR", pip: 0 }, { value: "", label: "", balance: 0, symbol: "INR", pip: 0 }]);
        // handleClose();
        // setErrors({});
        // setAmount("");
        let mainBalance = assetTableData[0].balance;
            let futuresBalance = assetTableData[0].futuresBalance;
            setFormValue([
                { value: "Main", label: "Main", balance: mainBalance, symbol: assetTableData[0]._id, pip: assetTableData[0].pip },
                { value: "Futures", label: "Futures", balance: futuresBalance, symbol: assetTableData[0]._id, pip: assetTableData[0].pip }
            ]);
            setAmount(mainBalance);
            setErrors({});
            handleClose();
    }

    const onMax = () => {
        let max = formValue[0].balance
        setAmount(max)
    }

    const onSubmit = async () => {
        try {
            let reqData = {
                symbol: formValue[0].symbol,
                amount: amount,
                transferFrom: formValue[0].value == "Main" ? "balance" : formValue[0].value == "Options" ? "optionBalance" : formValue[0].value == "Futures" ? "futuresBalance" : "",
                transferTo: formValue[1].value == "Main" ? "balance" : formValue[1].value == "Options" ? "optionBalance" : formValue[1].value == "Futures" ? "futuresBalance" : "",
            }
            const { status, errors } = await validateWalletTransfer(reqData);
            if (status) {
                setErrors(errors);
            } else {
                if (formValue[0].balance >= amount && formValue[0].balance != 0) {
                    const resp = await walletTransferHooks(reqData, userdetails?.secretKey);
                    if (resp?.data?.success) {
                        showToastMessage(resp?.data?.message, 'success');
                        close();
                    }
                } else {
                    if (formValue[0].balance == 0) {
                        setErrors({ "amount": "Enter an amount greater than zero" })
                    } else {
                        setErrors({ "amount": "Insufficient balance" })
                    }
                }

            }
        } catch (e) {
            console.log("onSubmit__Err", e)
        }
    };

    return (
        <div>
            <Modal
                centered
                size="md"
                backdrop="static"
                show={show}
                onHide={() => close()}
                className={styles.modalPrimary}
            >
                <button
                    aria-label="closeIcon"
                    className={styles.modalCloseButton}
                    onClick={() => close()}
                >
                    <IoClose />
                </button>
                <Modal.Header className={styles.modalPrimaryHeader}>
                    <h4 className={`${styles.modalHeaderTitle} `}>Wallet Transfer</h4>
                </Modal.Header>
                <Modal.Body className={styles.modalPrimaryBody}>
                    <div className={styles.withdrawModelContent}>
                        {}
                        <div className={styles.themeTextHighlight}>Balance : <span className="ms-1">{formValue[0]?.balance ? toCutOff(formValue[0]?.balance, formValue[0].pip) : 0} {formValue[0]?.symbol}</span></div>
                        <div className={`${styles.modalFormContainer} mt-3`}>
                            <label className={styles.modalLabel}> Transfer Amount <span className="text-danger ms-1">*</span> </label>
                            <div className={styles.flexAdjust}>
                                <PrimaryInput
                                    type="text"
                                    id="amount"
                                    name={"amount"}
                                    placeholder="0.01"
                                    value={amount}
                                    className={'primaryInputW100'}
                                    error={errors?.amount}
                                    onChange={(e) => { if (dotnumregex.test(e?.target?.value) || e?.target?.value == "") {  if (Number(formValue[0]?.balance) >= Number(e?.target?.value)) { setAmount(e.target.value) } } }}
                                />
                                {/* <div className={styles.boxHightLightvalue}>Max</div> */}
                                <Button
                                    isLoading={false}
                                    loadingText="Redirecting..."
                                    btnText="Max"
                                    onClick={() => onMax()}
                                    className="cardSuccessBtnInputAlign"
                                    selectedValue={null}
                                />
                            </div>
                        </div>

                        <div className={`${styles.modalFormContainer} mt-3`}>
                            <label className={styles.modalLabel}> From</label>
                            <div>
                                <Select
                                    // menuIsOpen
                                    isSearchable={false}
                                    placeholder="Pairs"
                                    classNamePrefix="react-select__ninth"
                                    options={walletOpt}
                                    value={formValue[0]}
                                    onChange={(e) => {
                                        handleChange(e, "from")
                                    }}
                                />
                                <p className={`text-danger mt-2`}>{errors.transferFrom}</p>
                            </div>
                        </div>


                        <button aria-label="swap" className={`${styles.iconWithCircleContainer} mt-4`} >
                            <TbTransferVertical onClick={() => { onSwap() }} />
                        </button>

                        <div className={`${styles.modalFormContainer} mt-3`}>
                            <label className={styles.modalLabel}> To</label>
                            <div>
                                <Select
                                    isSearchable={false}
                                    placeholder="Pairs"
                                    classNamePrefix="react-select__ninth"
                                    options={walletOpt}
                                    value={formValue[1]}
                                    onChange={(e) => {
                                        handleChange(e, "to")
                                    }}
                                />
                                <p className={`text-danger mt-2`}>{errors.transferTo}</p>
                            </div>
                        </div>

                        <div className="mt-5 flexEnd">
                            <Button
                                isLoading={false}
                                loadingText="Redirecting..."
                                btnText="Cancel"
                                onClick={() => handleClose()}
                                className="cardBtnRectangleSm"
                                selectedValue={null}
                            />
                            <Button
                                isLoading={false}
                                loadingText="Redirecting..."
                                btnText="Transfer"
                                onClick={() => onSubmit()}
                                className="cardSuccessBtnSm"
                                selectedValue={null}
                            />
                        </div>
                    </div>
                </Modal.Body>
            </Modal>
        </div>
    );
};

export default WalletTransfer;
