
import { BASE_URL } from "@env";
import { Alert, Platform } from "react-native";
import RNBlobUtil from 'react-native-blob-util';

import { getItem } from "../Actions/Storage/localstorage";

export const getCsvDownloader = async (data: any, fileName: string = "report.csv") => {
    try {
        const queryParams = new URLSearchParams(data).toString();
        const url = `${BASE_URL}/user/export_csv?${queryParams}`;

        const downloadDir =
            Platform.OS === "android"
                ? RNBlobUtil.fs.dirs.DownloadDir
                : RNBlobUtil.fs.dirs.DocumentDir;

        const filePath = `${downloadDir}/${fileName}`;

        const res = await RNBlobUtil.config({
            fileCache: true,
            appendExt: "csv",
            path: filePath,
            addAndroidDownloads: {
                useDownloadManager: true,
                notification: true,
                mime: "text/csv",
                mediaScannable: true,
                title: fileName,
                description: "Downloading Excel file..."
            }
        }).fetch(
            'GET',
            url,
            {
                'Authorization': `Bearer ${getItem("token")}`
            }
        );

        return {
            status: true,
            data: 'file://' + res.path(),
            message: 'CSV file downloaded successfully!',
        };

    } catch (e: any) {
        console.log("getCsvDownloader_err", e);
        return { status: false, error: e.message || "Failed to download CSV", data: {} };
    }
};

export const getExcelDownloader = async (data: any, fileName: string = "report.xlsx") => {
    try {
        const queryParams = new URLSearchParams(data).toString();

        const url = `${BASE_URL}/user/export_xls?${queryParams}`;


        const downloadDir =
            Platform.OS === "android"
                ? RNBlobUtil.fs.dirs.DownloadDir
                : RNBlobUtil.fs.dirs.DocumentDir;

        const filePath = `${downloadDir}/${fileName}`;

        const res = await RNBlobUtil.config({
            fileCache: true,
            appendExt: "xlsx",
            path: filePath,
            addAndroidDownloads: {
                useDownloadManager: true,
                notification: true,
                mime: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                mediaScannable: true,
                title: fileName,
                description: "Downloading Excel file..."
            }
        }).fetch(
            'GET',
            url,
            {
                'Authorization': `Bearer ${getItem("token")}`
            }
        );

        return {
            status: true,
            data: 'file://' + res.path(),
            message: 'Excel file downloaded successfully!',
        };

    } catch (e: any) {
        console.error("getExcelDownloader_err", e);
        Alert.alert("Error downloading file", e.message || "Unknown error");
        return {
            status: false,
            error: e.message || "Failed to download Excel",
            data: {}
        };
    }
};

export const getPdfDownloader = async (data: Record<string, any>, fileName: string) => {
    try {
        const token = await getItem("token");
        const queryParams = new URLSearchParams(data).toString();
        const url = `${BASE_URL}/user/export_pdf?${queryParams}`;

        const downloadDir =
            Platform.OS === "android"
                ? RNBlobUtil.fs.dirs.DownloadDir
                : RNBlobUtil.fs.dirs.DocumentDir;

        const filePath = `${downloadDir}/${fileName}`;

        const res = await RNBlobUtil.config({
            fileCache: true,
            appendExt: 'pdf',
            path: filePath,
            addAndroidDownloads: Platform.OS === 'android' ? {
                useDownloadManager: true,
                notification: true,
                mime: 'application/pdf',
                mediaScannable: true,
                title: `${fileName}`,
                description: 'Downloading PDF file...',
            } : undefined,
        }).fetch('GET', url, {
            'Authorization': `Bearer ${token}`
        });

        return {
            status: true,
            data: 'file://' + res.path(),
            message: 'PDF downloaded and opened successfully!',
        };

    } catch (e: any) {
        console.log("getPdfDownloader_err", e);
        return { status: false, error: e.message || "Failed to download PDF", data: {} };
    }
};