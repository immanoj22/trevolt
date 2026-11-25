import axios, { Axios, axiosDecrypt } from '../config/axios';

export const feeSettingList = async () => {
    try {
        let respData = await Axios({
            'url': `/fee/fee_settings_list`,
            'method': 'get'
        });
        return {
            status: true,
            message: respData.data.message,
            result: respData?.data?.result
        }
    } catch (e) {
        console.log("futureAccountAvailableMargin__err", e);
        return {
            status: false,
            error: e.response.data.errors
        }
    }
}