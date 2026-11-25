import React, { useEffect } from 'react'
import style from './staticPage.module.css';
import { InputComponent, InputFileComponent, InputTextareaComponent } from '../../components/Input/InputFields';
import Button from '../../components/Button/Button';
import PhoneInput from "react-phone-input-2";
import "react-phone-input-2/lib/style.css";

const ContactUs = () => {
    useEffect(() => {
        window.scrollTo({
            top: 0,
            behavior: "smooth"
        })
    }, [])
    return (
        <div className={style.contactUs}>
            <div className='container custom-container py-4 py-xl-5'>
                <div className='row justify-content-center'>
                    <div className='col-xl-9'>
                        <div className={style.contactUsCard}>
                            <h3 className={style.title + " mb-2"}>Contact Us</h3>
                            <p className={style.description}>
                                We're committed to providing you with the best possible experience. If you have any questions, concerns, or feedback, we're here to help.
                            </p>
                            <div className='row mt-4'>
                                <div className='col-xl-6 mb-2'>
                                    <InputComponent label={"Name"} type="text" placeholder={"Enter Your Name"} />
                                </div>
                                <div className='col-xl-6 mb-2'>
                                    <InputComponent label={"Email"} type="email" placeholder={"Enter Your Email"} />
                                </div>
                                <div className='col-xl-6 mb-2'>
                                    <div className={style.contactNumber}>
                                        <label className={style.formLabel}>Phone Number</label>
                                        <div className={`${style.flexAdjust} mt-2`}>
                                            <div className={`${style.phoneInputContainer} phoneInputContainer2`}>
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


                                        </div>

                                        {/* <p className={`text-danger mt-2`}>
                                            error
                                        </p> */}
                                    </div>
                                </div>
                                <div className='col-xl-6 mb-2'>
                                    <InputFileComponent label={"Upload your file"} type="file" />
                                </div>
                                <div className='col-xl-6'>
                                    <InputTextareaComponent label={"Your message for us"} type="email" placeholder={"Enter your message"} rows={5} />
                                </div>


                            </div>
                            <div className={`${style.submitBtn} mt-4 d-flex align-items-center justify-content-center`}>
                                <Button
                                    btnText="Submit"
                                    type="button"
                                    className="successFillRectangleBtn"
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default ContactUs;
