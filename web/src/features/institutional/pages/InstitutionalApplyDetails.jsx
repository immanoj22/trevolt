/** PACKAGE IMPORT */

import React, { useEffect, useState } from "react";
import { useSelector } from "react-redux";

/** LOCAL FILES IMPORT */

import styles from "../styles/institutionalApplyDetails.module.css";
import Button from "../../../components/Button/Button";
import Images from '../../../utils/Images';
import { useGlobalContext } from '../../../context/GlobalProvider';
import { useNavigate } from "react-router-dom";
import { InputComponent, InputFileComponent, InputTextareaComponent } from "../../../components/Input/InputFields";

/** Validation */
import { validateInstitutionalForm } from "../../../pages/Validation/institutionalValidation";
/*Actions* */
import { becomeAnInstitutional } from "../../../actions/institutionAction";
import { showToastMessage } from "../../../lib/toast";
/** CODE START */

const initialState = {
    companyName: "",
    companyLogo: "",
    companyWebsite: "",

    contactPersonName: "",
    contactPersonEmail: "",
    contactPersonMobile: "",
    contactPersonTelegram: "",
    contactPersonWhatsapp: "",

    monthlyTurnover: "",
    businessType: "",
    businessModel: "",
    businessWhatsapp: "",
    registrationNumber: "",
    registrationAddress: "",

    serviceRequest: "",
    description: ""
}
const InstitutionalApplyDetails = () => {
    const { userdetails } = useSelector((state) => state.user);

    const { theme } = useGlobalContext();
    const navigate = useNavigate();

    const [activeDetails, setActiveDetails] = useState(1);
    const [formValue, setFormValue] = useState(initialState);
    const [error, setError] = useState({});

    const Options = [
        { value: 'greenex', label: 'Trevolt' },
        { value: 'greenex', label: 'Trevolt' },
    ];

    const onChangeHandler = (event) => {
        try {
            const { name, value } = event.target
            const numbers = /^[+]?([0-9]+(?:\.[0-9]*)?|\.[0-9]+)$/;
            // validate numeric fields
            if (['companyMobile', 'businessWhatsapp', 'contactPersonWhatsapp', 'monthlyTurnover', 'registrationNumber'].includes(name) && (value !== "" && !numbers.test(value))) {
                return false;
            }

            setFormValue(prev => ({ ...prev, [name]: value }));
            setError(prev => ({ ...prev, [name]: '' }));
        } catch (e) {
        }
    };

    const handleActiveDetails = async (val) => {
        const scrollToTop = () =>
            window.scrollTo({ top: 0, behavior: "smooth" });
        const { status, errors } = await validateInstitutionalForm(activeDetails, formValue)
        if (!status && val === "next" && activeDetails < 4) {
            scrollToTop();
            setActiveDetails(activeDetails + 1);
        } else if (val === "prev" && activeDetails > 1) {
            scrollToTop();
            setActiveDetails(activeDetails - 1);
        }
        setError(errors)
    };

    const applyBecomeAnInstitutional = async () => {
        try {
            const { status, message, errors } = await becomeAnInstitutional(formValue, userdetails?.secretKey);
            showToastMessage(message, status ? 'success' : 'error')
            setError(errors)
            if (status) {
                navigate("/institutional")
            }
        } catch (e) {
            console.log("applyBecomeAnInstitutional_err", e);
        }
    }

    return (
        <section className={styles.institutionalDetails}>
            <div className="custom-container container">
                <div className={styles.contentSection}>
                    <div className="d-flex align-items-center justify-content-between gap-3">
                        <h4 className={`${styles.title}`}>
                            {
                                activeDetails === 1 ?
                                    "Institution Details" :
                                    activeDetails === 2 ?
                                        " Contact Details" :
                                        activeDetails === 3 ?
                                            "Business Details" :
                                            "Service Request"
                            }
                        </h4>
                        <Button
                            isLoading={false}
                            loadingText="Redirecting..."
                            btnText={"Back"}
                            className="backBtn"
                            onClick={(e) => handleActiveDetails('prev')}
                        />
                    </div>
                    <div className={`row align-items-center`}>
                        <div className='col-lg-5 mb-3'>
                            {
                                activeDetails === 1 ?
                                    <div className={styles.applyDetails}>
                                        <div className="mt-4">
                                            <div className="">
                                                <InputComponent className={'institutionForm'} label={"Company Name"} type="text" placeholder={"Enter Your Company Name"}
                                                    value={formValue?.companyName}
                                                    name={'companyName'}
                                                    onChange={(e) => onChangeHandler(e)}
                                                    error={error?.companyName}
                                                />
                                            </div>
                                            {/* <div className="mt-4">
                                                <InputComponent className={'institutionForm'} label={"User ID"} type="text" placeholder={"Enter User ID"}
                                                    value={formValue?.userId}
                                                    name={'userId'}
                                                    onChange={(e) => onChangeHandler(e)}
                                                    error={error?.userId}
                                                />
                                            </div> */}
                                            {/* <div className="mt-4">
                                                <p className={styles.formLabel + " mb-2"}>
                                                    KYC Type
                                                </p>
                                                <div className={`institutionForm`}>
                                                    <Select
                                                        isSearchable={false}
                                                        placeholder="Select Type"
                                                        classNamePrefix="react-select__secondary"
                                                        options={
                                                            Options
                                                        }
                                                    />
                                                </div>
                                            </div> */}
                                            <div className="mt-4">
                                                <InputComponent className={'institutionForm'} label={"Institution Website"} type="text" placeholder={"Enter Institution Website"}
                                                    value={formValue?.companyWebsite}
                                                    name={'companyWebsite'}
                                                    onChange={(e) => onChangeHandler(e)}
                                                    error={error?.companyWebsite}
                                                />
                                            </div>

                                            <div className="mt-4">
                                                <InputComponent className={'institutionForm'} label={"Upload your cloud URL"} type="text" placeholder={"Enter Company Logo URL"}
                                                    value={formValue?.companyLogo}
                                                    name={'companyLogo'}
                                                    onChange={(e) => onChangeHandler(e)}
                                                    error={error?.companyLogo}
                                                />
                                            </div>

                                            {/* <div className="mt-4 ">
                                                <InputFileComponent label={"Upload your file"} type="file" className="institutional_UploadBtn" />
                                            </div>

                                            <div className={styles.uploadImg + " mt-2"}>
                                                <img src={Images.userProfile} className={" img-fluid"} alt="Trevolt" />
                                            </div> */}
                                        </div>
                                    </div>
                                    : activeDetails === 2 ?
                                        <div className={styles.applyDetails}>
                                            <div className="mt-4">
                                                <div className="">
                                                    <InputComponent className={'institutionForm'} label={"Contact Person"} type="text" placeholder={"Enter Contact Person"}
                                                        value={formValue?.contactPersonName}
                                                        name={'contactPersonName'}
                                                        onChange={(e) => onChangeHandler(e)}
                                                        error={error?.contactPersonName}
                                                    />
                                                </div>
                                                <div className="mt-4">
                                                    <InputComponent className={'institutionForm'} label={"Email"} type="email" placeholder={"Enter Email"}
                                                        value={formValue?.contactPersonEmail}
                                                        name={'contactPersonEmail'}
                                                        onChange={(e) => onChangeHandler(e)}
                                                        error={error?.contactPersonEmail}
                                                    />
                                                </div>

                                                <div className="mt-4">
                                                    <InputComponent className={'institutionForm'} label={"Phone"} type="text" placeholder={"Enter Phone"}
                                                        value={formValue?.contactPersonMobile}
                                                        name={'contactPersonMobile'}
                                                        onChange={(e) => onChangeHandler(e)}
                                                        error={error?.contactPersonMobile}
                                                    />
                                                </div>

                                                <div className="mt-4">
                                                    <InputComponent className={'institutionForm'} label={"Telegram"} type="text" placeholder={"Enter Telegram"}
                                                        value={formValue?.contactPersonTelegram}
                                                        name={'contactPersonTelegram'}
                                                        onChange={(e) => onChangeHandler(e)}
                                                        error={error?.contactPersonTelegram}
                                                    />
                                                </div>

                                                <div className="mt-4">
                                                    <InputComponent className={'institutionForm'} label={"WhatsApp"} type="text" placeholder={"Enter WhatsApp"}
                                                        value={formValue?.contactPersonWhatsapp}
                                                        name={'contactPersonWhatsapp'}
                                                        onChange={(e) => onChangeHandler(e)}
                                                        error={error?.contactPersonWhatsapp}
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                        : activeDetails === 3 ?
                                            <div className={styles.applyDetails}>
                                                <div className="mt-4">
                                                    <div className="">
                                                        <InputComponent className={'institutionForm'} label={"Monthly Derivatives Turnover (USD)"} type="text" placeholder={"Enter Turnover"}
                                                            value={formValue?.monthlyTurnover}
                                                            name={'monthlyTurnover'}
                                                            onChange={(e) => onChangeHandler(e)}
                                                            error={error?.monthlyTurnover}
                                                        />
                                                    </div>
                                                    <div className="mt-4">
                                                        <InputComponent className={'institutionForm'} label={"Business Type"} type="text" placeholder={"Enter Business Type"}
                                                            value={formValue?.businessType}
                                                            name={'businessType'}
                                                            onChange={(e) => onChangeHandler(e)}
                                                            error={error?.businessType}
                                                        />
                                                    </div>

                                                    <div className="mt-4">
                                                        <InputComponent className={'institutionForm'} label={"Registration Number"} type="text" placeholder={"Enter Registration Number"}
                                                            value={formValue?.registrationNumber}
                                                            name={'registrationNumber'}
                                                            onChange={(e) => onChangeHandler(e)}
                                                            error={error?.registrationNumber}
                                                        />
                                                    </div>

                                                    <div className="mt-4">
                                                        <InputComponent className={'institutionForm'} label={"Registration Address"} type="text" placeholder={"Registration Address"}
                                                            value={formValue?.registrationAddress}
                                                            name={'registrationAddress'}
                                                            onChange={(e) => onChangeHandler(e)}
                                                            error={error?.registrationAddress}
                                                        />
                                                    </div>

                                                    <div className="mt-4">
                                                        <InputComponent className={'institutionForm'} label={"WhatsApp"} type="text" placeholder={"Enter WhatsApp"}
                                                            value={formValue?.businessWhatsapp}
                                                            name={'businessWhatsapp'}
                                                            onChange={(e) => onChangeHandler(e)}
                                                            error={error?.businessWhatsapp}
                                                        />
                                                    </div>
                                                </div>
                                            </div> :
                                            <div className={styles.applyDetails}>
                                                <div className="mt-4">
                                                    <div className="">
                                                        <InputComponent className={'institutionForm'} label={"Service Request"} type="text" placeholder={"Service Request"}
                                                            value={formValue?.serviceRequest}
                                                            name={'serviceRequest'}
                                                            onChange={(e) => onChangeHandler(e)}
                                                            error={error?.serviceRequest}
                                                        />
                                                    </div>
                                                    <div className="mt-4">
                                                        <InputTextareaComponent className={'institutionForm'} label={"Description"} type="email" placeholder={"Enter Description"} rows={7}
                                                            value={formValue?.description}
                                                            name={'description'}
                                                            onChange={(e) => onChangeHandler(e)}
                                                            error={error?.description}
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                            }

                            <div className={`${styles.bannerButtons} mt-4 mt-xl-5 justify-content-center justify-content-lg-start`}>
                                <Button
                                    isLoading={false}
                                    loadingText="Redirecting..."
                                    btnText={activeDetails === 4 ? "Apply" : "Next"}
                                    className="primaryBtn"
                                    onClick={() => {
                                        activeDetails === 4 ?
                                            applyBecomeAnInstitutional() : handleActiveDetails('next')
                                    }}
                                />
                            </div>

                        </div>
                        <div className='col-lg-7'>
                            <div className={styles.applyDetailsImage}>
                                <img src={theme == 'dark' ? Images.applyDetailsImg : Images.applyDetailsImg} className={" img-fluid"} alt="Trevolt" />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    )
}

export default InstitutionalApplyDetails
