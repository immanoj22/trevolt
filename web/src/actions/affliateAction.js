import isEmpty from 'is-empty';
import axios, { Axios } from '../config/axios';

/** redux */
import { AffliateDetails } from '../redux/action';


export const affiliateRegister = async (data, key, dispatch) => {
    try {
        let respData = await Axios({
            'url': `/affiliate/affiliate_register`,
            'method': 'post',
            data,
            secretKey: key
        });
        if (respData.data.success) {
            dispatch(AffliateDetails({ affiliateDetails: respData.data.result }))
        }
        return {
            status: respData.data.success,
            message: respData.data.message,
            result: respData.data.result,
            errors: respData.data.errors
        }
    } catch (e) {
        console.log("affiliateRegister_err", e);
        return {
            status: err.response.data.success,
            message: err.response.data.message,
            error: err.response.data.error
        }
    }
}

export const getAffiliateDetails = async (dispatch, range = "1W") => {
    try {

        let respData = await Axios({
            'url': `/affiliate/get_affliate_details`,
            'method': 'get',
            'params': { range },
        });
        if (respData.data.success) {
            const result = respData.data.result;
            dispatch(
                AffliateDetails({
                    affiliateDetails: {
                        ...result,
                        range
                    }
                })
            );
            // dispatch(AffliateDetails({ affiliateDetails: respData.data.result }));
        }

        return { status: true, message: respData.data.message, data: respData?.data?.result?.data || 0 }
    } catch (e) {
        console.log("getAffiliateDetails_err", e);
        return { status: false, error: e?.response?.data?.errors }
    }
}


export const affiliateSummaryDetails = async (code, key) => {
    try {

        let respData = await Axios({
            'url': `/affiliate/affiliate_summary_details/${code}`,
            'method': 'get',
            'secretKey': key
        });
        return {
            status: respData.data.success,
            message: respData.data.message,
            result: respData.data.result,
            errors: respData.data.errors
        }
    } catch (e) {
        console.log("affiliateSummaryDetails_err", e);
        return { status: false, error: e?.response?.data?.errors }
    }
}

export const manageClicks = async (code) => {
    try {
        let respData = await Axios({
            'url': `/affiliate/manage_clicks/${code}`,
            'method': 'get'
        });

    } catch (e) {
        console.log("manageClicks_err", e);
        return { status: false, error: e?.response?.data?.errors }
    }
}

export const affiliateCommissionDetails = async (data, key) => {
    try {

        let respData = await Axios({
            'url': `/affiliate/affiliate_commission_details`,
            'method': 'get',
            'params': data,
            'secretKey': key
        });
        return {
            status: respData.data.success,
            message: respData.data.message,
            result: respData.data.result,
            errors: respData.data.errors
        }
    } catch (e) {
        console.log("affiliateCommissionDetails_err", e);
        return { status: false, error: e.response.data.errors }
    }
}

export const claimRewardCommission = async (key) => {
    try {

        let respData = await Axios({
            'url': `/affiliate/claim_reward_commission`,
            'method': 'get',
            'secretKey': key
        });
        return {
            status: respData.data.success,
            message: respData.data.message,
            result: respData.data.result,
            errors: respData.data.errors
        }
    } catch (e) {
        console.log("claimRewardCommission_err", e);
        return { status: false, error: e.response.data.errors }
    }
}