import axios, { Axios } from '../config/axios';
import { decryptObject } from '../lib/Cryptojs';


export const announcementList = async (data) => {
    try {
        const getData = await Axios({
            'url': '/announcement/announcementListForUser',
            'method': 'get',
            params: data
        })
        return {
            status: true,
            data: getData.data.result,
            message: getData.data.message,
            count: getData.data.count
        }
    } catch (error) {
        console.log("announcementList_err", error);
        return {
            status: false,
            error: error.response.data,
        }
    }
}