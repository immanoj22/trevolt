/** Packages */
import * as Yup from 'yup';
import isEmpty from 'is-empty';

/** Library */
import { isDisposableEmailDomain } from '../../lib/emailValidation';

const typeOptions = ["individual", "entity"];
const proofOptions = ['aadhaar', 'pan', 'passport', 'voterid'];

const validator = async (schema, data) => {
    try {
        // console.log("validatorvalidator", data);
        await schema.validate(data, { abortEarly: false });
        return false;
    } catch (error) {
        console.log("validatorerrorerror", error.inner)
        return error.inner.reduce((acc, err) => {
            acc[err.path] = err.message;
            return acc;
        }, {});
    }
}

export const validateUserRegister = async (data) => {

    const schema = Yup.object().shape({

        firstName: Yup.string()
            .max(50, 'First name cannot exceed 50 characters')
            .required('First name is required'),

        lastName: Yup.string()
            .max(50, 'Last name cannot exceed 50 characters')
            .required('Last name is required'),

        dob: Yup.string()
            .required('Date of birth is required')
            .max(new Date(), 'Date of birth cannot be in the future'),
        // .max(subYears(new Date(), 18), 'You must be at least 18 years old')

        email: Yup.string()
            .matches(
                /^(?=.{5,50}$)(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,6}))$/,
                'Invalid email address'
            ).required('Email is required'),

        password: Yup.string()
            .matches(
                /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?`~])[A-Za-z\d!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?`~]{8,32}$/,
                'Password must be at least 8 characters, include 1 uppercase letter, 1 lowercase letter, 1 number, and 1 special character'
            ).required('Password is required'),

        confirmPassword: Yup.string()
            .oneOf([Yup.ref('password'), null], 'Confirm Password not same as password')
            .required('Confirm Password is required'),

        checked: Yup.boolean()
            .oneOf([true], 'Please read & approve the Terms & Conditions.'),
    });

    const error = await validator(schema, data);

    if (Object.values(error).length > 0) {
        return { status: true, errors: error }
    } else {
        return { status: false, errors: {} }
    }

};

export const validateUserLogin = async (data) => {

    const schema = Yup.object().shape({

        email: Yup.string()
            .matches(
                /^(?=.{5,50}$)(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,6}))$/,
                'Invalid email address'
            ).required('Email is required'),

        password: Yup.string()
            //  .matches(
            //         /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?`~])[A-Za-z\d!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?`~]{8,32}$/,
            //         'Password must be at least 6 characters, include 1 uppercase letter, 1 lowercase letter, 1 number, and 1 special character'
            //     )
            .required('Password is required'),

    });

    const error = await validator(schema, data);

    if (Object.values(error).length > 0) {
        return { status: true, errors: error }
    } else {
        return { status: false, errors: {} }
    }

};

export const validateUserLoginVerification = async (data) => {

    const schema = Yup.object().shape({

        // email: Yup.string()
        //     .matches(
        //         /^(?=.{5,50}$)(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,6}))$/,
        //         'Invalid email address'
        //     ).required('Email is required'),

        // password: Yup.string()
        //     .matches(
        //         /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?`~])[A-Za-z\d!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?`~]{8,32}$/,
        //         'Password must be at least 6 characters, include 1 uppercase letter, 1 lowercase letter, 1 number, and 1 special character'
        //     ).required('Password is required'),

        otp: Yup.string()
            .required('OTP is required')
            .max(6, 'Enter a valid OTP')
            .matches(/^\d{4,6}$/, 'OTP must be 4 to 6 digits'),
        challengeId: Yup.string()
            .required('challengeId is required'),
        platform: Yup.string()
            .required('platform is required')

    });

    const error = await validator(schema, data);

    if (Object.values(error).length > 0) {
        return { status: true, errors: error }
    } else {
        return { status: false, errors: {} }
    }

};

export const validateresendLoginCode = async (data) => {

    const schema = Yup.object().shape({

        // email: Yup.string()
        //     .matches(
        //         /^(?=.{5,50}$)(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,6}))$/,
        //         'Invalid email address'
        //     ).required('Email is required'),
        challengeId: Yup.string()
            .required('challengeId is required'),
    });

    const error = await validator(schema, data);

    if (Object.values(error).length > 0) {
        return { status: true, errors: error }
    } else {
        return { status: false, errors: {} }
    }

};

export const validateKycVerification = async (data) => {
    let schema = {};
    if (data?.step == 1) {
        schema = Yup.object().shape({
            kycType: Yup.string()
                .oneOf(typeOptions, "Invalid KYC type. Must be 'individual' or 'entity'")
                .required("KYC type is required"),
            type: Yup.string()
                .oneOf(proofOptions, "Invalid card type. Must be aadharCard, panCard, voterID, or passport")
                .required("Proof card type is required")
        });
    } else if (data?.step == 2) {
        schema = Yup.object().shape({
            frontImage: Yup.mixed()
                .test("fileType", "Invalid image type", (value) => {
                    if (!value) return false;
                    return (
                        typeof value === "string" || // base64 or URL
                        (value instanceof File && ["image/jpeg", "image/png"].includes(value.type))
                    )
                        .required("Front image is required");
                }),
            backImage: Yup.mixed()
                .test("fileType", "Invalid image type", (value) => {
                    if (!value) return false;
                    return (
                        typeof value === "string" ||
                        (value instanceof File && ["image/jpeg", "image/png"].includes(value.type))
                    );
                })
                .required("Back image is required")
        });
    }


    const error = await validator(schema, data);

    if (Object.values(error).length > 0) {
        return { status: true, errors: error }
    } else {
        return { status: false, errors: {} }
    }
};

export const validate2FA = async (data) => {
    try {

        let schema = Yup.object().shape({
            secret: Yup.string()
                .required('Secret key is required'),

            code: Yup.string()
                .required('Code is required')
                .matches(/^\d+$/, 'Code must contain only digits')
                .min(6, 'Code must be more than 6 digits'),

            uri: Yup.string()
                .required('URI is required'),

        });

        const error = await validator(schema, data);

        if (Object.values(error).length > 0) {
            return { status: true, errors: error }
        } else {
            return { status: false, errors: {} }
        }
    } catch (e) {
        console.log("validateEnable2FA__Err", e)
    }
};


export const validateChangeEmail = async (data) => {
    try {
        const schema = Yup.object().shape({
            requestedEmail: Yup.string().matches(
                /^(?=.{5,50}$)(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,6}))$/,
                'Invalid email address'
            )
                .test(
                    'no-disposable-domain',
                    'Disposable or temporary email addresses are not allowed. Please use a valid email address.',
                    (value) => !isDisposableEmailDomain(value)
                )
                .required('Email is required'),
            checkValue: Yup.boolean()
                .oneOf([true], 'Please check option'),
        });

        const error = await validator(schema, data);
        // SECURITY FIX: removed console.log of sensitive client-side data (secretKey/password/OTP)

        if (Object.values(error).length > 0) {
            return { status: true, errors: error }
        } else {
            return { status: false, errors: {} }
        }
    } catch (e) {
        console.log("validateEnable2FA__Err", e)
    }
};


export const validateUserSettings = async (data) => {
    try {
        let schema = {}
        if (data?.filter == "userName") {
            schema = Yup.object().shape({
                userName: Yup.string()
                    .max(50, 'User name cannot exceed 50 characters')
                    .required('User name is required'),
            });
        } else {
            schema = Yup.object().shape({
                firstName: Yup.string()
                    .max(50, 'First name cannot exceed 50 characters')
                    .required('First name is required'),

                lastName: Yup.string()
                    .max(50, 'Last name cannot exceed 50 characters')
                    .required('Last name is required'),
            });
        }

        const error = await validator(schema, data);
        // SECURITY FIX: removed console.log of sensitive client-side data (secretKey/password/OTP)

        if (Object.values(error).length > 0) {
            return { status: true, errors: error }
        } else {
            return { status: false, errors: {} }
        }
    } catch (e) {
        console.log("validateEnable2FA__Err", e)
    }
};


export const imageValidation = async (attachment) => {
    try {
        let error = "";
        const specialCharRegex = /[!@#$%^&*":{}<>]/
        let validFile = ["png", "jpeg", "jpg"]
        if (attachment.length > 1) {
            attachment.map((file) => {
                let filesize = file.size;
                let fileExtention = file.name.split(".")
                const fileType = file.name.split(".")[file.name.split(".").length - 1]
                if (!validFile.some((val) => fileType.includes(val))) {
                    error = "picture updated failed, please upload PNG, JPG, JPEG files";
                } else if (filesize > 3000000 || filesize < 2) {                        //3000 kb in bytes 3000000
                    error = "Image Size should be less than 3000 Kb";
                } else if (fileExtention.length > 1) {
                    error = "Invalid file name: Multiple extensions are not allowed (e.g., WhatsApp.34.png).";
                } else if (specialCharRegex.test(fileExtention[0])) {
                    error = 'Invalid file name: Special characters (!@#$%^&*":{}<>) are not allowed.'
                } else if (attachment.name.length > 15) {
                    error = "Length of Profile picture file name should be lesser than or equal to 15 characters"
                }
            })
        }
        else {
            let filesize = attachment.size;
            let fileExtention = attachment.name.split(".")
            const fileType = attachment.name.split(".")[attachment.name.split(".").length - 1]


            if (!validFile.some((val) => fileType.includes(val))) {
                error = "Profile picture updated failed, please upload PNG, JPG, JPEG files";
            } else if (filesize > 3000000) {
                error = "Image Size should be less than 3000 Kb";
            } else if (fileExtention.length > 2) {
                error = "Invalid file name: Multiple extensions are not allowed (e.g., WhatsApp.34.png).";
            } else if (specialCharRegex.test(fileExtention[0])) {
                error = 'Invalid file name: Special characters (!@#$%^&*":{}<>) are not allowed.'
            } else if (attachment.name.length > 15) {
                error = "Length of Profile picture file name should be lesser than or equal to 15 characters"
            }
        }
        if (Object.values(error).length > 0) {
            return { status: true, errors: error }
        } else {
            return { status: false, errors: {} }
        }
    } catch (e) {
        console.log("imageValidation__Err", e)
    }
};


export const validateForgotEmail = async (data) => {
    try {
        const schema = Yup.object().shape({
            email: Yup.string().matches(
                /^(?=.{5,50}$)(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,6}))$/,
                'Invalid email address'
            ).required('Email is required')
        });

        const error = await validator(schema, data);
        if (Object.values(error).length > 0) {
            return { status: true, errors: error }
        } else {
            return { status: false, errors: {} }
        }
    } catch (e) {
        console.log("validateEnable2FA__Err", e)
    }
};


export const validateResetPassword = async (data) => {
    try {
        const schema = Yup.object().shape({
            email: Yup.string()
                .matches(
                    /^(?=.{5,50}$)(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,6}))$/,
                    'Invalid email address'
                ).required('Email is required'),
            otp: Yup.string()
                .required('OTP is required')
                .matches(/^\d{4,6}$/, 'OTP must be 4 to 6 digits'),
            password: Yup.string()
                .matches(
                    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?`~])[A-Za-z\d!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?`~]{8,32}$/,
                    'Password must be at least 8 characters, include 1 uppercase letter, 1 lowercase letter, 1 number, and 1 special character'
                ).required('Password is required'),
            confirmPassword: Yup.string()
                .oneOf([Yup.ref('password'), null], 'Confirm Password not same as password')
                .required('Confirm Password is required'),
            method: Yup.string()
                .required('Method is required')
        });

        const error = await validator(schema, data);
        // SECURITY FIX: removed console.log of sensitive client-side data (secretKey/password/OTP)
        if (Object.values(error).length > 0) {
            return { status: true, errors: error }
        } else {
            return { status: false, errors: {} }
        }
    } catch (e) {
        console.log("validateEnable2FA__Err", e)
    }
};



export const validatefiatDeposit = async (data) => {
    try {
        let ShapeData = {
            accountId: Yup.string()
                .required('* Account Id  is required'),
            amount: Yup.string()
                .test(
                    'is-greater-than-zero',
                    '* Deposit amount must be greater than zero',
                    value => parseFloat(value) > 0
                )
                .required('* Amount is required'),

            currencyId: Yup.string()
                .required('* Currency Id  is required'),
            pay_mode: Yup.string()
                .required('* Pay mode Id  is required'),
            upi_channel: Yup.string()
                .when("pay_mode", {
                    is: "UPI",
                    then: (schema) =>
                        schema.oneOf(["INTENT", "COLLECT"]).required("UPI channel is required"),
                    otherwise: (schema) => schema.notRequired(),
                }),
            transactionNumber: Yup
                .string()
                .when("pay_mode", {
                    is: "BANK",
                    then: (schema) =>
                        schema.required('* TransactionNumber  is required'),
                    otherwise: (schema) => schema.notRequired(),
                }),
        }
        const schema = Yup.object().shape(ShapeData);

        const error = await validator(schema, data);

        if (Object.values(error).length > 0) {
            return { status: true, errors: error }
        } else {
            return { status: false, errors: {} }
        }
    } catch (e) {
        console.log("validateEnable2FA__Err", e)
    }
};



export const validatechangePassword = async (data) => {
    try {
        const schema = Yup.object().shape({
            oldPassword: Yup.string()
                .required("Old password is required."),

            newPassword: Yup.string()
                .matches(
                    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?`~])[A-Za-z\d!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?`~]{8,16}$/,
                    'Password must be 8-16 characters, include 1 uppercase letter, 1 lowercase letter, 1 number, and 1 special character'
                ).required('Password is required'),

            confirmPassword: Yup.string()
                .required("Confirm password is required.")
                .oneOf([Yup.ref('newPassword'), null], 'The passwords you entered do not match. Please ensure both passwords are the same.'),
        });

        const error = await validator(schema, data);
        // SECURITY FIX: removed console.log of sensitive client-side data (secretKey/password/OTP)

        if (Object.values(error).length > 0) {
            return { status: true, errors: error }
        } else {
            return { status: false, errors: {} }
        }

    } catch (e) {
        console.log("validatechangePassword__Err", e)
    }
}



export const validateWalletTransfer = async (data) => {
    try {
        const schema = Yup.object().shape({
            amount: Yup.string()
                .required('Amount is required'),
            transferFrom: Yup.string()
                .required('Select the transfer from'),
            transferTo: Yup.string()
                .required('Select the transfer to'),
            symbol: Yup.string()
                .required('Symbol is required'),
        });

        const error = await validator(schema, data);

        if (Object.values(error).length > 0) {
            return { status: true, errors: error }
        } else {
            return { status: false, errors: {} }
        }
    } catch (e) {
        console.log("validateWalletTransfer__Err", e)
    }
};


export const validateUserRecovery = async (data) => {

    const schema = Yup.object().shape({

        firstName: Yup.string()
            .max(50, 'First name cannot exceed 50 characters')
            .required('First name is required'),

        lastName: Yup.string()
            .max(50, 'Last name cannot exceed 50 characters')
            .required('Last name is required')
    });

    const error = await validator(schema, data);

    if (Object.values(error).length > 0) {
        return { status: true, errors: error }
    } else {
        return { status: false, errors: {} }
    }
}



export const validateRecovery = async (data) => {
    try {
        let schema = {}
        if (data?.type == "email") {
            schema = Yup.object().shape({
                type: Yup.string().required('Type is required'),
                challengeId: Yup.string().required('challengeId is required'),
                useremail: Yup.string().matches(
                    /^(?=.{5,50}$)(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,6}))$/,
                    'Invalid email address'
                ).required('Email is required'),
            });

        }

        if (data?.type == "mobile") {
            schema = Yup.object().shape({
                type: Yup.string().required('Type is required'),
                challengeId: Yup.string().required('challengeId is required'),
                mobileNumber: Yup.number()
                    .moreThan(5, 'The number must be greater than 5')
                    // .max(11, 'The number cannot exceed 10')
                    .required('PhoneNumber is required'),
            });
        }

        const error = await validator(schema, data);
        if (Object.values(error).length > 0) {
            return { status: true, errors: error }
        } else {
            return { status: false, errors: {} }
        }
    } catch (e) {
        console.log("validateRecovery__err", e)
    }
};