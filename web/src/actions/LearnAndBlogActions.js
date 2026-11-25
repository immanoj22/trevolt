import isEmpty from 'is-empty';
import axios from 'axios';
import { Axios, AxiosCms, axiosDecrypt, catchDecrypt } from '../config/axios';
import config from '../config/env';
import { decryptObject } from '../lib/Cryptojs';
import { RemoveItemLocalStorageItem } from '../lib/storage';

// get course

export const getCourse = async (data) => {
    // console.log('datadata', data)
    try {
        let respData = await AxiosCms({
            // 'url': `/cms/getPage/${data}`,
            'url': `/learn/getCourses`,
            'method': 'get',
            // secretKey: null
            params: data
        });

        // console.log('respDatasssss', respData);

        return {
            status: respData?.data?.success,
            message: respData?.data?.message,
            data: respData?.data?.result,
            error: respData?.data?.errors
        }
    } catch (err) {
        console.log("getLearn_err", err);
        return {
            status: err?.response?.data?.success,
            message: err?.response?.data?.message,
            error: err?.response?.data?.error
        }
    }
}

// get subCourse

export const getSubCourse = async (id) => {
    // console.log('datadata', data)
    try {
        let respData = await AxiosCms({
            'url': `/learn/getCourse/${id}`,
            // 'url': `/learn/getCourse`,
            'method': 'get',
            // params: id
        });


        return {
            status: respData?.data?.success,
            message: respData?.data?.message,
            data: respData?.data?.result,
            error: respData?.data?.errors
        }
    } catch (err) {
        console.log("getLearn_err", err);
        return {
            status: err?.response?.data?.success,
            message: err?.response?.data?.message,
            error: err?.response?.data?.error
        }
    }
}

// get blog

export const getBlog = async (data) => {
    // console.log('datadata', data)
    try {
        let respData = await AxiosCms({
            // 'url': `/cms/getPage/${data}`,
            'url': `/blog/getBlogs`,
            'method': 'get',
            // secretKey: null
            params: data
        });


        return {
            status: respData?.data?.success,
            message: respData?.data?.message,
            data: respData?.data?.result,
            error: respData?.data?.errors
        }
    } catch (err) {
        console.log("err", err);
        return {
            status: err?.response?.data?.success,
            message: err?.response?.data?.message,
            error: err?.response?.data?.error
        }
    }
}

// get subCourse

export const getParticularBlog = async (slug) => {
    // console.log('datadata', data)
    try {
        let respData = await AxiosCms({
            'url': `/blog/getBlog/${slug}`,
            // 'url': `/learn/getCourse`,
            'method': 'get',
            // params: id
        });

        // console.log('respDatasssss', respData);

        return {
            status: respData?.data?.success,
            message: respData?.data?.message,
            data: respData?.data?.result,
            error: respData?.data?.errors
        }
    } catch (err) {
        console.log("err", err);
        return {
            status: err?.response?.data?.success,
            message: err?.response?.data?.message,
            error: err?.response?.data?.error
        }
    }
}