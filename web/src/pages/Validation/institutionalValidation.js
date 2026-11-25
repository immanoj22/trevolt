/** Packages */
import * as Yup from 'yup';
import isEmpty from 'is-empty';


const validator = async (schema, data) => {
    try {
        await schema.validate(data, { abortEarly: false });
        return false;
    } catch (error) {
        // console.log("validatorerrorerror", error.inner)
        return error.inner.reduce((acc, err) => {
            acc[err.path] = err.message;
            return acc;
        }, {});
    }
}



export const validateInstitutionalForm = async (step, data) => {

    let regexQuery = "^(https?:\\/\\/)?((([-a-z0-9]{1,63}\\.)*?[a-z0-9]([-a-z0-9]{0,253}[a-z0-9])?\\.[a-z]{2,63})|((\\d{1,3}\\.){3}\\d{1,3}))(:\\d{1,5})?((\\/|\\?)((%[0-9a-f]{2})|[-\\w\\+\\.\\?\\/@~#&=])*)?$";
    let urlRegx = new RegExp(regexQuery, "i");


    let schema

    switch (step) {
        case 1:
            schema = Yup.object().shape({
                companyName: Yup.string().required('Company name is required'),
                companyWebsite: Yup.string().matches(
                    urlRegx, 'Invalid Website URL'
                ).required('Company website is required'),
                companyLogo: Yup.string().matches(
                    urlRegx, 'Invalid cloud URL'
                ).required('Company logo is required')
            });
            break;

        case 2:
            schema = Yup.object().shape({
                contactPersonName: Yup.string().required('Name is required'),
                contactPersonEmail: Yup.string().matches(
                    /^(?=.{5,50}$)(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,6}))$/,
                    'Invalid email address'
                ).required('Email is required'),
                contactPersonMobile: Yup.string().required('Mobile number is required'),
                contactPersonTelegram: Yup.string().matches(
                    urlRegx, 'Invalid Telegram Link'
                ).required('Telegram is required'),
                contactPersonWhatsapp: Yup.string().required('Whatsapp is required')
            });
            break;

        case 3:
            schema = Yup.object().shape({
                monthlyTurnover: Yup.string().required('Monthly Turnover is required'),
                businessType: Yup.string().required('Business Type is required'),
                // businessModel: Yup.string().required('Business Model is required'),
                businessWhatsapp: Yup.string().required('Business Whatsapp is required'),
                registrationNumber: Yup.string().required('Registration Number is required'),
                registrationAddress: Yup.string().required('Registration Address is required')
            });
            break;

        case 4:
            schema = Yup.object().shape({
                serviceRequest: Yup.string().required('Service Request is required'),
                description: Yup.string().required('Description is required')
            });
            break;

        default:
            return `Invalid method ${step}`
    }

    const error = await validator(schema, data);
    // console.log("validateInstitutionalForm_err", error);

    return Object.values(error).length > 0 ? { status: true, errors: error } : { status: false, errors: {} }

};