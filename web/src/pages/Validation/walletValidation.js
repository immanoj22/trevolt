/** Packages */
import * as Yup from 'yup';
import isEmpty from 'is-empty';


const validator = async (schema, data) => {
    try {
        // console.log("validatorvalidator", data);
        await schema.validate(data, { abortEarly: false });
        return false;
    } catch (error) {
        return error.inner.reduce((acc, err) => {
            acc[err.path] = err.message;
            return acc;
        }, {});
    }
};



export const validateBankAccount = async (data) => {
    try {
        const schema = Yup.object().shape({
            bankName: Yup.string()
                .required('* Bank Name is required'),
            accountNo: Yup.string()
                .required('* Account Number is required')
                .matches(/^\d{9,18}$/, '* Account Number must be 9 to 18 digits'),
            holderName: Yup.string()
                .required('* Holder Name is required'),
            bankcode: Yup.string()
                .required('* Bank Code is required'),
            country: Yup.string()
                .required('* Country is required'),
            city: Yup.string()
                .required('* City is required'),
            bankAddress: Yup.string()
                .required('* Bank Address is required'),
        });

        const error = await validator(schema, data);

        if (Object.values(error).length > 0) {
            return { status: true, errors: error }
        } else {
            return { status: false, errors: {} }
        }
    } catch (e) {
        console.log("validateAddBankAccount__Err", e);
    }
};