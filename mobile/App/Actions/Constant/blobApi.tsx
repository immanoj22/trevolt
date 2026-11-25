import RNFetchBlob from 'react-native-blob-util';

export const filePath: any = RNFetchBlob.fs.dirs;

export const blobApi = (method: any, url: any, headers: any, config = {}) => {
    return RNFetchBlob.config({
        fileCache: true,
        ...config
    }).fetch(method, url, headers);
};

export const androidDownload = (
    fileName: string,
    filePath: string,
    mimeType: string = 'application/octet-stream'
) => {
    return RNFetchBlob.android.addCompleteDownload({
        title: fileName,
        description: 'File downloaded by the app',
        mime: mimeType,
        path: filePath,
        showNotification: true,
    });
};