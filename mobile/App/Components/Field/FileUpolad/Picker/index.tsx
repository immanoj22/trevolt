
import React, { ReactNode } from 'react';
import { PermissionsAndroid, Platform } from 'react-native';
import { launchCamera, launchImageLibrary, CameraOptions, ImageLibraryOptions, ImagePickerResponse } from 'react-native-image-picker';

import { failuretoast } from '../../../../Actions/Hooks/customhook';
import { mediaConfiguration, imagePick } from './Helper';

type PickerProps = {
    crop?: boolean;
    content?: (args: { pickableSource: (source: 'camera' | 'gallery' | 'document' | string) => void; uploadFile: (file: any) => void }) => ReactNode;
    uploadFile?: (file: any) => void;
    maxSize?: number;
    refRBSheet?: any;
};

const requestCameraPermission = async (): Promise<boolean> => {
    if (Platform.OS !== 'android') return true;
    try {
        const granted = await PermissionsAndroid.request(
            PermissionsAndroid.PERMISSIONS.CAMERA,
            {
                title: "Camera Permission",
                message: "Trevolt needs access to your camera to take a profile photo.",
                buttonNeutral: "Ask Me Later",
                buttonNegative: "Cancel",
                buttonPositive: "OK",
            }
        );
        return granted === PermissionsAndroid.RESULTS.GRANTED;
    } catch (e) {
        console.log("requestCameraPermission__Err", e);
        return false;
    }
};

const Picker: React.FC<PickerProps> = (props) => {
    const { content, uploadFile = () => { }, maxSize, refRBSheet = false } = props;

    const imagePickerResponse = (response: ImagePickerResponse) => {
        imagePick({ response, refRBSheet, uploadFile });
        refRBSheet?.current?.close()
    };

    const pickableSource = (source: 'camera' | 'gallery' | 'document' | string) => {
        if (source === 'document') {
            // documentPick(refRBSheet, maxSize, uploadFile);
        } else if (source === 'camera') {
            requestCameraPermission().then((granted) => {
                if (granted) {
                    launchCamera(mediaConfiguration.uploadSettings as CameraOptions, imagePickerResponse);
                } else {
                    failuretoast("Error", "Camera permission is required to take a photo");
                }
            });
        } else if (source === 'gallery') {
            launchImageLibrary(mediaConfiguration.uploadSettings as ImageLibraryOptions, imagePickerResponse);
        }
    };

    return <>{content && content({ pickableSource, uploadFile })}</>;
};

export default Picker;