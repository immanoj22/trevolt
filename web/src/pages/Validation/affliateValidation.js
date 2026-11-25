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



export const validateAffiliateForm = async (data) => {

    const regexQuery = "^(https?:\\/\\/)?((([-a-z0-9]{1,63}\\.)*?[a-z0-9]([-a-z0-9]{0,253}[a-z0-9])?\\.[a-z]{2,63})|((\\d{1,3}\\.){3}\\d{1,3}))(:\\d{1,5})?((\\/|\\?)((%[0-9a-f]{2})|[-\\w\\+\\.\\?\\/@~#&=])*)?$"
    const urlRegx = new RegExp(regexQuery, "i");
    // const urlRegx = /^(https?:\/\/)?([a-zA-Z0-9.-]+\.[a-zA-Z]{2,})(:[0-9]{1,5})?(\/.*)?$/;

    let schema = Yup.object().shape({


        youtube: Yup.string()
            .test("is-url", "Enter a valid URL", value => !value || urlRegx.test(value))
            .required("Youtube is required"),

        telegram: Yup.string()
            .test("is-url", "Enter a valid URL", value => !value || urlRegx.test(value))
            .required("Telegram is required"),

        discord: Yup.string()
            .test("is-url", "Enter a valid URL", value => !value || urlRegx.test(value))
            .required("Discord is required"),

        instagram: Yup.string()
            .test("is-url", "Enter a valid URL", value => !value || urlRegx.test(value))
            .required("Instagram is required"),
        twitch: Yup.string()
            .test("is-url", "Enter a valid URL", value => !value || urlRegx.test(value))
            .required("Twitch is required"),
        facebook: Yup.string()
            .test("is-url", "Enter a valid URL", value => !value || urlRegx.test(value))
            .required("Invalid facebook URL"),
        x: Yup.string()
            .test("is-url", "Enter a valid URL", value => !value || urlRegx.test(value))
            .required("X is required"),


        // placeOfResidence: Yup.string().required('Place of residence is required'),
        fullName: Yup.string().required('Full name is required'),
        contactInformation: Yup.string().required('Contact information is required'),
        channelDetails: Yup.string().required('Channel details are required'),
        followersCount: Yup.string().required('Followers count is required'),
        tradingExperience: Yup.string().required('Trading experience is required'),
        promotionIdeas: Yup.string().required('Promotion ideas is required'),
        referralCode: Yup.string()
            .min(6, '* Referral code min 6 character required')
            .max(8, '* Referral code max 8 character required')
            .required('* Referral code is required'),

    });

    const error = await validator(schema, data);

    return Object.values(error).length > 0 ? { status: true, errors: error } : { status: false, errors: {} }

};