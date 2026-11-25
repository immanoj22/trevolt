import { Axios } from "../config/axios";

export const newSubscribe = async (data) => {
    try {
            let respData = await Axios({
                'url': `user/newsSubscribe`,
                'method': 'post',
                data
            });
            return {
                status: respData.data.success,
                message: respData.data.message,
                result: respData.data.result,
                errors: respData.data.errors
            }
        } catch (e) {
            console.log("newSubscribe_err", e);
            return {
                status: err.response.data.success,
                message: err.response.data.message,
                error: err.response.data.error
            }
        }
}