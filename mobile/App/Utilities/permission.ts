import { Alert, Linking, PermissionsAndroid, Platform } from 'react-native';
import { check, request, PERMISSIONS, RESULTS, Permission } from 'react-native-permissions';
import messaging from "@react-native-firebase/messaging";
import { getItem, setItem } from "../Actions/Storage/localstorage";

const NOTIFICATION_PROMPT_DISMISSED_KEY = "notificationPromptDismissed";

type PermissionStatus = 'granted' | 'blocked' | 'denied';

const handlePermission = async (permission: Permission): Promise<PermissionStatus> => {
    const status = await check(permission);

    switch (status) {
        case RESULTS.GRANTED:
            return 'granted';

        case RESULTS.DENIED:
            const requestStatus = await request(permission);
            if (requestStatus === RESULTS.GRANTED) return 'granted';
            if (requestStatus === RESULTS.BLOCKED) return 'blocked';
            return 'denied';

        case RESULTS.BLOCKED:
            return 'blocked';

        default:
            return 'denied';
    }
};

export const checkCameraPermission = async (): Promise<PermissionStatus> => {
    const permission =
        Platform.OS === 'ios'
            ? PERMISSIONS.IOS.CAMERA
            : PERMISSIONS.ANDROID.CAMERA;

    return await handlePermission(permission);
};

export const checkGalleryPermission = async (): Promise<PermissionStatus> => {
    const permission =
        Platform.OS === 'ios'
            ? PERMISSIONS.IOS.PHOTO_LIBRARY
            : Number(Platform.Version) >= 33
                ? PERMISSIONS.ANDROID.READ_MEDIA_IMAGES
                : PERMISSIONS.ANDROID.READ_EXTERNAL_STORAGE;

    return await handlePermission(permission);
};

export const requestStoragePermission = async () => {
    if (Platform.OS !== "android") return true;

    if (Platform.Version >= 33) {
        const granted = await PermissionsAndroid.request(
            PermissionsAndroid.PERMISSIONS.READ_MEDIA_IMAGES
        );
        return granted === PermissionsAndroid.RESULTS.GRANTED;
    }

    const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE
    );

    return granted === PermissionsAndroid.RESULTS.GRANTED;
};

const showNotificationSettingsAlert = (message: string) => {
    Alert.alert(
        "Notifications !",
        message,
        [
            {
                text: "Cancel",
                style: "cancel",
                onPress: () => {
                    setItem(NOTIFICATION_PROMPT_DISMISSED_KEY, "true");
                },
            },
            {
                text: "Go to Settings",
                onPress: () => {
                    Linking.openSettings();
                },
            },
        ]
    );
};

export const NotificationPermission = async () => {
    try {
        if (Platform.OS === "android") {
            // ✅ Android 13+ requires POST_NOTIFICATIONS permission
            const currentStatus = await PermissionsAndroid.check(
                PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS
            );

            if (currentStatus) {
                console.log("Notification permission granted for Android");
                return true
            }

            // The OS prompt only appears once per install; after that,
            // request() just resolves immediately with the same denied
            // status, so re-requesting on every launch has no effect
            // other than letting us know whether to nag the user again.
            const granted = await PermissionsAndroid.request(
                PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS
            );

            if (granted === PermissionsAndroid.RESULTS.GRANTED) {
                console.log("Notification permission granted for Android");
                return true
            }

            if (getItem(NOTIFICATION_PROMPT_DISMISSED_KEY) !== "true") {
                showNotificationSettingsAlert("To receive notifications, please enable them in your Android settings.");
            }
            return false

        } else if (Platform.OS === "ios") {
            // ✅ iOS notification permission request
            const authStatus = await messaging().requestPermission({
                alert: true,
                badge: true,
                sound: true,
            });

            const enabled =
                authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
                authStatus === messaging.AuthorizationStatus.PROVISIONAL;

            if (enabled) {
                console.log("Notification permission granted for iOS");
                return true

            } else {
                console.log("Notification permission denied for iOS");
                if (getItem(NOTIFICATION_PROMPT_DISMISSED_KEY) !== "true") {
                    showNotificationSettingsAlert("To receive notifications, please enable them in your iPhone settings.");
                }
                return false
            }
        }
    } catch (error) {
        console.warn("requestNotificationPermission error:", error);
    }
};