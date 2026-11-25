

/** PACKAGE IMPORT */

import React, { useEffect, useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { MdKeyboardArrowRight } from "react-icons/md";
import PhoneInput from "react-phone-input-2";
import Select from 'react-select'


/** LOCAL FILES IMPORT */

import styles from "../styles/existingToken.module.css"
import Button from "../../../components/Button/Button";
import { PrimaryInput, PrimaryTextarea, SearchInput } from "../../../components/Input/InputFields";


/** CODE START */

const ExistingToken = () => {

    const navigate = useNavigate();

    useEffect(() => {
        window.scrollTo({
            top: 0,
            behavior: "smooth",
        });
    }, []);

    return (
        <>
            <main className={styles.existingTokenPageLanding}>
                <section className={`${styles.existingPage}`}>
                    <div className={`custom-container container my-5`}>
                        <div className={styles.profileBackBtn}>
                            <div className={styles.menuUi} >
                                <div className={`${styles.headerSingleMenusLinks}`}>
                                    <NavLink to='/'
                                        className={({ isActive }) => isActive ? `${styles.staticLinks} ${styles.active}` : `${styles.staticLinks}`}
                                    >
                                        Home Page
                                    </NavLink>
                                </div>
                                <MdKeyboardArrowRight />
                                <div className={`${styles.headerSingleMenusLinks}`}>
                                    <NavLink to='/launchpad'
                                        className={({ isActive }) => isActive ? `${styles.staticLinks} ${styles.active}` : `${styles.staticLinks}`}
                                    >
                                        Listings
                                    </NavLink>
                                </div>
                                <MdKeyboardArrowRight />
                                <div className={`${styles.headerSingleMenusLinks}`}>
                                    <NavLink to='/request-token-types'
                                        className={({ isActive }) => isActive ? `${styles.staticLinks} ${styles.active}` : `${styles.staticLinks}`}
                                    >
                                        Request token types
                                    </NavLink>
                                </div>
                                <MdKeyboardArrowRight />
                                <div className={`${styles.headerSingleMenusLinks}`}>
                                    <NavLink to='/launchTokens/existing-token'
                                        className={({ isActive }) => isActive ? `${styles.staticLinks} ${styles.active}` : `${styles.staticLinks}`}
                                    >
                                        Existing Tokens
                                    </NavLink>
                                </div>
                            </div>
                            <Button
                                // isLoading={false}
                                loadingText="Redirecting..."
                                btnText="Back"
                                onClick={() => navigate(-1)}
                                className="backBtn"
                                selectedValue={null}
                            />
                        </div>
                        <div className={`${styles.existingHeader} mt-3`}>
                            <p className={styles.existingTitle}>Existing Tokens</p>
                            <p className={`${styles.existingDesc} mt-2`}>For the projects that are listed on other exchanges we need to collect the details about where they are listed and what was their trading volume for the last 6 months / 1 year.</p>
                        </div>
                        <p className={`${styles.existingLabelTitle} mt-5`}>Project Information :</p>
                        <div className={`${styles.formContainer} ${styles.containerWidth}`}>
                            <p className={`${styles.formTitle} my-3`}>Project Name : </p>
                            <div className={`${styles.modalFormContainer}`}>
                                <PrimaryInput
                                    type="text"
                                    id="quantity"
                                    name={"quantity"}
                                    placeholder="Project Name"
                                    // value={formData.quantity}
                                    // onChange={onChangeHandler}
                                    error={null}
                                    className={'primaryInputBgFour'}
                                />
                            </div>
                            <p className={`${styles.formTitle} my-3`}>Project Website : </p>
                            <div className={`${styles.modalFormContainer}`}>
                                <PrimaryInput
                                    type="text"
                                    id="quantity"
                                    name={"quantity"}
                                    placeholder="Project Website"
                                    // value={formData.quantity}
                                    // onChange={onChangeHandler}
                                    error={null}
                                    className={'primaryInputBgFour'}
                                />
                            </div>
                            <p className={`${styles.formTitle} my-3`}>WhitePaper Link : </p>
                            <div className={`${styles.modalFormContainer}`}>
                                <PrimaryInput
                                    type="text"
                                    id="quantity"
                                    name={"quantity"}
                                    placeholder="WhitePaper Link"
                                    // value={formData.quantity}
                                    // onChange={onChangeHandler}
                                    error={null}
                                    className={'primaryInputBgFour'}
                                />
                            </div>
                            <p className={`${styles.formTitle} my-3`}>Brief Description of the Project :</p>
                            <div className={`${styles.modalFormContainer}`}>
                                <PrimaryTextarea
                                    placeholder={"Description"}
                                    rows={5}
                                    className={'thirdTextarea'}
                                    onChange={() => {}}
                                    value={''}
                                    name={'description'}
                                    error={null}
                                    id={'description'}
                                />
                            </div>
                            <p className={`${styles.existingLabelTitle} mt-5`}>Token Details : </p>
                            <p className={`${styles.formTitle} my-3`}>Network :</p>
                            <div>
                                <Select
                                    isSearchable={false}
                                    placeholder="Pairs"
                                    classNamePrefix="react-select__secondary"
                                // options={tifOptions}
                                // value={formData.typeTIF && tifOptions.find((el) => el.value === formData.typeTIF)}
                                // onChange={(e) => {
                                //     setFormData({ ...formData, ...{ typeTIF: e.value } })
                                // }}
                                />
                            </div>
                            <p className={`${styles.formTitle} my-3`}>Token Contract Address : (Contract address has to be pasted)</p>
                            <div className={`${styles.modalFormContainer}`}>
                                <PrimaryInput
                                    type="text"
                                    id="quantity"
                                    name={"quantity"}
                                    placeholder="Token Contract Address"
                                    // value={formData.quantity}
                                    // onChange={onChangeHandler}
                                    error={null}
                                    className={'primaryInputBgFour'}
                                />
                            </div>
                            <p className={`${styles.formTitle} my-3`}>Token Name :</p>
                            <div className={`${styles.modalFormContainer}`}>
                                <PrimaryInput
                                    type="text"
                                    id="quantity"
                                    name={"quantity"}
                                    placeholder="Token Name"
                                    // value={formData.quantity}
                                    // onChange={onChangeHandler}
                                    error={null}
                                    className={'primaryInputBgFour'}
                                />
                            </div>
                            <p className={`${styles.formTitle} my-3`}>Token Decimal :</p>
                            <div className={`${styles.modalFormContainer}`}>
                                <PrimaryInput
                                    type="text"
                                    id="quantity"
                                    name={"quantity"}
                                    placeholder="Token Decimal"
                                    // value={formData.quantity}
                                    // onChange={onChangeHandler}
                                    error={null}
                                    className={'primaryInputBgFour'}
                                />
                            </div>
                            <p className={`${styles.formTitle} my-3`}>Token Symbol :</p>
                            <div className={`${styles.modalFormContainer}`}>
                                <PrimaryInput
                                    type="text"
                                    id="quantity"
                                    name={"quantity"}
                                    placeholder="Token Symbol"
                                    // value={formData.quantity}
                                    // onChange={onChangeHandler}
                                    error={null}
                                    className={'primaryInputBgFour'}
                                />
                            </div>
                            <p className={`${styles.formTitle} my-3`}>Token Type : (e.g., utility, security, governance)</p>
                            <div>
                                <Select
                                    isSearchable={false}
                                    placeholder="Select"
                                    classNamePrefix="react-select__secondary"
                                // options={tifOptions}
                                // value={formData.typeTIF && tifOptions.find((el) => el.value === formData.typeTIF)}
                                // onChange={(e) => {
                                //     setFormData({ ...formData, ...{ typeTIF: e.value } })
                                // }}
                                />
                            </div>
                            <p className={`${styles.formTitle} my-3`}>Total Token Supply :</p>
                            <div className={`${styles.modalFormContainer}`}>
                                <PrimaryInput
                                    type="text"
                                    id="quantity"
                                    name={"quantity"}
                                    placeholder="Total Token Supply"
                                    // value={formData.quantity}
                                    // onChange={onChangeHandler}
                                    error={null}
                                    className={'primaryInputBgFour'}
                                />
                            </div>
                            <p className={`${styles.formTitle} my-3`}>Circulating Supply :</p>
                            <div className={`${styles.modalFormContainer}`}>
                                <PrimaryInput
                                    type="text"
                                    id="quantity"
                                    name={"quantity"}
                                    placeholder="Circulating Supply"
                                    // value={formData.quantity}
                                    // onChange={onChangeHandler}
                                    error={null}
                                    className={'primaryInputBgFour'}
                                />
                            </div>
                            <p className={`${styles.existingLabelTitle} mt-5`}>Project Team : </p>
                            <p className={`${styles.existingLabelTitle} mt-3`}>Team 1 </p>
                            <p className={`${styles.formTitle} my-3`}>Name :</p>
                            <div className={`${styles.modalFormContainer}`}>
                                <PrimaryInput
                                    type="text"
                                    id="quantity"
                                    name={"quantity"}
                                    placeholder="Name"
                                    // value={formData.quantity}
                                    // onChange={onChangeHandler}
                                    error={null}
                                    className={'primaryInputBgFour'}
                                />
                            </div>
                            <p className={`${styles.formTitle} my-3`}>Roles of Core Team Members :</p>
                            <div className={`${styles.modalFormContainer}`}>
                                <PrimaryInput
                                    type="text"
                                    id="quantity"
                                    name={"quantity"}
                                    placeholder="Roles of Core Team Members"
                                    // value={formData.quantity}
                                    // onChange={onChangeHandler}
                                    error={null}
                                    className={'primaryInputBgFour'}
                                />
                            </div>
                            <p className={`${styles.formTitle} my-3`}>LinkedIn Profile : (LinkedIn profile link has to be pasted)</p>
                            <div className={`${styles.modalFormContainer}`}>
                                <PrimaryInput
                                    type="text"
                                    id="quantity"
                                    name={"quantity"}
                                    placeholder="LinkedIn Profile"
                                    // value={formData.quantity}
                                    // onChange={onChangeHandler}
                                    error={null}
                                    className={'primaryInputBgFour'}
                                />
                            </div>
                            <p className={`${styles.formTitle} my-3`}>Relevant Experience in the Financial Markets :</p>
                            <div className={`${styles.modalFormContainer}`}>
                                <PrimaryTextarea
                                    placeholder={"Experience"}
                                    rows={5}
                                    className={'thirdTextarea'}
                                    onChange={() => {}}
                                    value={''}
                                    name={'description'}
                                    error={null}
                                    id={'description'}
                                />
                            </div>
                            <div className="my-3">
                                <Button
                                    isLoading={false}
                                    loadingText="Redirecting..."
                                    btnText="Add Team Member"
                                    // onClick={() => handleClose()}
                                    className="cardSuccessBtnSm"
                                    selectedValue={null}
                                />
                            </div>
                            <p className={`${styles.existingLabelTitle} mt-5`}>Company / Legal Entity Details : </p>
                            <p className={`${styles.formTitle} my-3`}>Company Common Name / Business Name :</p>
                            <div className={`${styles.modalFormContainer}`}>
                                <PrimaryInput
                                    type="text"
                                    id="quantity"
                                    name={"quantity"}
                                    placeholder="Company Common Name / Business Name"
                                    // value={formData.quantity}
                                    // onChange={onChangeHandler}
                                    error={null}
                                    className={'primaryInputBgFour'}
                                />
                            </div>
                            <p className={`${styles.formTitle} my-3`}>Company / Legal Entity Name :</p>
                            <div className={`${styles.modalFormContainer}`}>
                                <PrimaryInput
                                    type="text"
                                    id="quantity"
                                    name={"quantity"}
                                    placeholder="Company / Legal Entity Name"
                                    // value={formData.quantity}
                                    // onChange={onChangeHandler}
                                    error={null}
                                    className={'primaryInputBgFour'}
                                />
                            </div>
                            <p className={`${styles.formTitle} my-3`}>Company / Legal Entity Type :</p>
                            <div>
                                <Select
                                    isSearchable={false}
                                    placeholder="Select"
                                    classNamePrefix="react-select__secondary"
                                // options={tifOptions}
                                // value={formData.typeTIF && tifOptions.find((el) => el.value === formData.typeTIF)}
                                // onChange={(e) => {
                                //     setFormData({ ...formData, ...{ typeTIF: e.value } })
                                // }}
                                />
                            </div>
                            <p className={`${styles.formTitle} my-3`}>Country of Registration :</p>
                            <div>
                                <Select
                                    isSearchable={false}
                                    placeholder="Select"
                                    classNamePrefix="react-select__secondary"
                                // options={tifOptions}
                                // value={formData.typeTIF && tifOptions.find((el) => el.value === formData.typeTIF)}
                                // onChange={(e) => {
                                //     setFormData({ ...formData, ...{ typeTIF: e.value } })
                                // }}
                                />
                            </div>
                            <p className={`${styles.formTitle} my-3`}>Registered Office Address :</p>
                            <div className={`${styles.modalFormContainer}`}>
                                <PrimaryInput
                                    type="text"
                                    id="quantity"
                                    name={"quantity"}
                                    placeholder="Registered Office Address"
                                    // value={formData.quantity}
                                    // onChange={onChangeHandler}
                                    error={null}
                                    className={'primaryInputBgFour'}
                                />
                            </div>
                            <p className={`${styles.formTitle} my-3`}>Communication Office Address (if different than Registered Office) :</p>
                            <div className={`${styles.modalFormContainer}`}>
                                <PrimaryInput
                                    type="text"
                                    id="quantity"
                                    name={"quantity"}
                                    placeholder="Communication Office Address"
                                    // value={formData.quantity}
                                    // onChange={onChangeHandler}
                                    error={null}
                                    className={'primaryInputBgFour'}
                                />
                            </div>
                            <p className={`${styles.formTitle} my-3`}>Registered Office Phone Number (if available) :</p>
                            <div className={`${styles.phoneInputContainer} phoneInputContainer3`}>
                                <PhoneInput
                                    // countryCodeEditable={false}
                                    placeholder="Enter phone number"
                                    country={"us"}
                                    // onChange={handlePhoneNumber}
                                    // onBlur={handleBlurPhone}
                                    // onChange={(value, event) => {
                                    //   const { dialCode } = event;
                                    //   let newPhoneNo = value;
                                    //   console.log(
                                    //     "PHONE INPUTS",
                                    //     value,
                                    //     event
                                    //   );
                                    //   checkMobile(
                                    //     newPhoneNo.slice(dialCode.length)
                                    //   );
                                    //   setMobileNumber(
                                    //     newPhoneNo.slice(dialCode.length)
                                    //   );
                                    //   setCountryCode(dialCode);
                                    // }}
                                    autoFormat={true}
                                />
                            </div>
                            <p className={`${styles.formTitle} my-3`}>Official Representative Name :</p>
                            <div className={`${styles.modalFormContainer}`}>
                                <PrimaryInput
                                    type="text"
                                    id="quantity"
                                    name={"quantity"}
                                    placeholder="Official Representative Name"
                                    // value={formData.quantity}
                                    // onChange={onChangeHandler}
                                    error={null}
                                    className={'primaryInputBgFour'}
                                />
                            </div>
                            <p className={`${styles.formTitle} my-3`}>Official Representative Phone Number :</p>
                            <div className={`${styles.phoneInputContainer} phoneInputContainer3`}>
                                <PhoneInput
                                    // countryCodeEditable={false}
                                    placeholder="Enter phone number"
                                    country={"us"}
                                    // onChange={handlePhoneNumber}
                                    // onBlur={handleBlurPhone}
                                    // onChange={(value, event) => {
                                    //   const { dialCode } = event;
                                    //   let newPhoneNo = value;
                                    //   console.log(
                                    //     "PHONE INPUTS",
                                    //     value,
                                    //     event
                                    //   );
                                    //   checkMobile(
                                    //     newPhoneNo.slice(dialCode.length)
                                    //   );
                                    //   setMobileNumber(
                                    //     newPhoneNo.slice(dialCode.length)
                                    //   );
                                    //   setCountryCode(dialCode);
                                    // }}
                                    autoFormat={true}
                                />
                            </div>
                            <p className={`${styles.formTitle} my-3`}>Official Representative Email :</p>
                            <div className={`${styles.modalFormContainer}`}>
                                <PrimaryInput
                                    type="text"
                                    id="quantity"
                                    name={"quantity"}
                                    placeholder="Official Representative Email"
                                    // value={formData.quantity}
                                    // onChange={onChangeHandler}
                                    error={null}
                                    className={'primaryInputBgFour'}
                                />
                            </div>
                            <div className="mt-4">
                                <Button
                                    // isLoading={false}
                                    loadingText="Redirecting..."
                                    btnText="Next"
                                    // onClick={() => setOpenEditPairsModal(true)}
                                    className="cardSuccessBtnSm"
                                // selectedValue={null}
                                />
                            </div>
                        </div>
                    </div>
                </section>
            </main>
        </>
    )
}

export default ExistingToken

