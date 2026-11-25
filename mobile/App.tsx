import React, { useState, useEffect } from 'react';
import { Platform, View } from 'react-native';
import { BottomSheetModalProvider } from '@gorhom/bottom-sheet';
import { PortalHost } from '@gorhom/portal';
import { SystemBars } from 'react-native-edge-to-edge';
import { DarkTheme, DefaultTheme, NavigationContainer, useNavigationContainerRef } from '@react-navigation/native';
import SplashScreen from 'react-native-splash-screen';
import { EventRegister } from 'react-native-event-listeners';
import { MenuProvider } from 'react-native-popup-menu';
import { KeyboardProvider } from 'react-native-keyboard-controller';
import NetInfo from "@react-native-community/netinfo";
import messaging from '@react-native-firebase/messaging';

import themes from './App/Utilities/theme';
import ThemeContext from './App/Utilities/themecontext';
import { ToastHost } from './App/Components/Toast';
import ErrorBoundary from './App/Components/ErrorBoundary';
// import Stacknavigator from './App/Navigations/stacknavigation';
// import AppNavigator from './App/Navigations/AppNavigator';
// import AuthNavigator from './App/Navigations/AuthNavigator';
import { Authstack, Appstack } from './App/Navigations/stacknavigation';
import { NotificationPermission } from './App/Utilities/permission';
import { getItem, setItem } from './App/Actions/Storage/localstorage';
import { useSelector } from 'react-redux';
import { setIsAuth } from './App/Slices/auth';
import useCustomHooks, { Deviceinfo, showToastDeduped } from './App/Actions/Hooks/customhook';

// Every notification tap lands on the in-app notifications list, whatever the
// notification was about. (There used to be a per-type map sending deposits to
// TransactionLogs, order events to the Orders tab, etc. - restore it here if
// per-type deep-linking is ever wanted again.)
const NOTIFICATION_SCREEN = 'Notification';

// The backend never sends a status/outcome field alongside a push notification
// (see newNotification() in Trevolt-backend/Modules/Notification/Hooks/notificationHook.js) —
// approve and reject both use the same `data.type`, only the title/body wording differs
// (e.g. "...rejected by admin." vs "...has been approved by admin."). So the toast color
// is inferred from that wording instead.
const NEGATIVE_NOTIFICATION_KEYWORDS = ['reject', 'cancel', 'fail', 'declin', 'liquidat'];
const getToastTypeForNotification = (title?: unknown, body?: unknown): 'success' | 'danger' => {
    const text = `${title ?? ''} ${body ?? ''}`.toLowerCase();
    return NEGATIVE_NOTIFICATION_KEYWORDS.some((keyword) => text.includes(keyword)) ? 'danger' : 'success';
};

// The Notification screen only exists in Appstack, so a tap while logged out
// (Authstack does not register it) must be skipped rather than navigated, or
// react-navigation throws "not handled by any navigator".
const navigateForNotification = (navigationRef: any, remoteMessage: any) => {
    if (!getItem("token")) return;

    const data = remoteMessage?.data || {};
    const params = { notificationId: data?.notificationId };

    const doNavigate = () => {
        navigationRef.navigate(NOTIFICATION_SCREEN as never, params as never);
    };

    // getInitialNotification() resolves before NavigationContainer finishes mounting
    // on a cold start — navigating before it's ready throws, so wait for onReady().
    if (navigationRef.isReady()) {
        doNavigate();
    } else {
        const unsubscribe = navigationRef.addListener('state', () => {
            if (navigationRef.isReady()) {
                unsubscribe();
                doNavigate();
            }
        });
    }
};

function App() {
    const navigationRef = useNavigationContainerRef();
    const { dispatch } = useCustomHooks()
    useEffect(() => {
        // alert(":")
        // setTimeout(() => {

        // }, 2000);
        SplashScreen.hide();
        NotificationPermission()
    }, []);

    const mobiletheme = getItem("mobiletheme")
    if (getItem("fxCurrencyInit") !== "1") { setItem("convertCurrency", "USDT"); setItem("fxCurrencyInit", "1"); }

    const [mode, setMode] = useState(mobiletheme == "dark" ? "dark" : "light")
    const [isConnected, setIsConnected] = useState(true);
    const [isAppStack, setAppStack] = useState(!!getItem("token"));
    const isAuth = useSelector((state: any) => state.auth.isAuth)
    useEffect(() => {
        // console.log("initial___call")
        if (getItem("token")) {
            dispatch(setIsAuth(true));
        } else {
            dispatch(setIsAuth(false));
        }
    }, [])

    useEffect(() => {
        if (getItem("token") || isAuth) {
            setAppStack(true)
        } else {
            setAppStack(false)
        }
    }, [isAuth])

    useEffect(() => {
        let eventListener: any = EventRegister.addEventListener(
            "mobiletheme",
            (data) => {
                setMode(data)
            }
        );
        return () => {
            EventRegister.removeEventListener(eventListener);
        };
    }, []);

    // Push notifications: tap-to-navigate (foreground tap, background tap, and
    // cold-start-from-notification), plus keeping the backend's stored FCM token fresh.
    useEffect(() => {
        // Diagnostics for "backend says sent, phone shows nothing". These tell you
        // WHICH of the two very different failures you have:
        //   - "FCM_RECEIVED foreground" logged  -> the message DID arrive; the app
        //     was open, so by design only the in-app toast runs (no tray entry).
        //   - nothing logged at all              -> the message never reached the device:
        //     OS notification permission is off, the registered token belongs to a
        //     different install, or (iOS) no APNs key is uploaded to Firebase.
        messaging().getAPNSToken?.().then?.((t) => console.log('FCM_APNS_TOKEN', Platform.OS, t ? 'present' : 'MISSING (iOS pushes cannot deliver)')).catch?.(() => { });
        messaging().hasPermission().then((status) => console.log('FCM_PERMISSION status =', status, '(0=denied 1=authorized 2=provisional)')).catch(() => { });

        // App was opened by tapping a notification while killed
        messaging()
            .getInitialNotification()
            .then((remoteMessage) => {
                if (remoteMessage) {
                    console.log('FCM_RECEIVED cold-start-tap', remoteMessage?.messageId, JSON.stringify(remoteMessage?.data ?? {}));
                    navigateForNotification(navigationRef, remoteMessage);
                }
            });

        // App was in the background and the user tapped the notification
        const unsubscribeOpenedApp = messaging().onNotificationOpenedApp((remoteMessage) => {
            console.log('FCM_RECEIVED background-tap', remoteMessage?.messageId, JSON.stringify(remoteMessage?.data ?? {}));
            navigateForNotification(navigationRef, remoteMessage);
        });

        // App is in the FOREGROUND. Deliberately does NOT raise a tray
        // notification: the user is already in the app, so it would be redundant.
        // Android/iOS suppress it for foregrounded apps anyway - we just don't
        // re-add one with a local-notification library. The lightweight in-app
        // toast stays as the foreground signal, and the unread badge/list still
        // update over the socket.
        // Background and quit are untouched: the backend sends a `notification`
        // payload, so the OS renders the tray entry itself.
        const unsubscribeOnMessage = messaging().onMessage(async (remoteMessage) => {
            const title = remoteMessage?.notification?.title ?? remoteMessage?.data?.title ?? '';
            const body = remoteMessage?.notification?.body ?? (remoteMessage?.data?.body as string | undefined);
            console.log('FCM_RECEIVED foreground', remoteMessage?.messageId, `title="${title}"`, '- in-app only, no tray notification by design');
            if (title || body) {
                showToastDeduped({ message: String(title), description: body, type: getToastTypeForNotification(title, body) });
            }
        });

        // Token can rotate at any time (reinstall, restore, expiry) — re-register when it does
        const unsubscribeTokenRefresh = messaging().onTokenRefresh(() => {
            (dispatch as any)(Deviceinfo());
        });

        return () => {
            unsubscribeOpenedApp();
            unsubscribeOnMessage();
            unsubscribeTokenRefresh();
        };
    }, [navigationRef]);

    const currentTheme = mode === 'light' ? themes.light : themes.dark;

    const navigationTheme = {
        ...(mode === 'light' ? DefaultTheme : DarkTheme),
        colors: {
            ...(mode === 'light' ? DefaultTheme.colors : DarkTheme.colors),
            background: currentTheme.background as string,
            card: currentTheme.background as string,
        },
    };

    const [currency, setCurrency] = useState("INR");

    useEffect(() => {
        const initCurrency = async () => {
            let storedCurrency = await getItem("convertCurrency");

            if (!storedCurrency) {
                storedCurrency = "INR";
                await setItem("convertCurrency", "INR");
            }

            setCurrency(storedCurrency);
        };

        initCurrency();
    }, []);

    useEffect(() => {
        const unsubscribe = NetInfo.addEventListener((state) => {
            const online = Boolean(state.isConnected);
            setIsConnected(online);

            // getCurrentRoute() types to `never` here because navigationRef has no
            // RootParamList generic wired up - it still returns a real route object
            // at runtime.
            const currentRoute = (navigationRef.getCurrentRoute() as any)?.name;

            if (!online) {
                if (currentRoute !== "NoInternet") {
                    navigationRef.navigate("NoInternet" as never);
                }
            } else {
                if (currentRoute === "NoInternet") {
                    navigationRef.goBack();
                }
            }
        });

        return () => unsubscribe();
    }, [navigationRef]);

    return (
        <ErrorBoundary>
            <View style={{ flex: 1, backgroundColor: currentTheme.background }} >
              {/* KeyboardProvider must sit ABOVE BottomSheetModalProvider (and its
                  internal @gorhom/portal + the <PortalHost> below): bottom-sheet content
                  is portaled out of the normal tree, so a KeyboardProvider nested any
                  lower doesn't cover it and react-native-keyboard-controller
                  (KeyboardAwareScrollView etc.) silently no-ops inside every sheet. */}
              <KeyboardProvider>
                <BottomSheetModalProvider>
                    {/* BottomSheetModalProvider already renders its own internal
                        @gorhom/portal PortalProvider around `children` (with a unique
                        host name it uses for sheet content) - nesting a second, separate
                        <PortalProvider> in here (as this used to do) shadows that context
                        for every descendant, so BottomSheetModal.present() ends up adding
                        its content to a portal host that's never actually rendered, and
                        every bottom sheet in the app silently fails to open. Popups
                        (DialogBox/CenterModal/etc.) render via <Portal> (default
                        hostName="root") into the single PortalHost below instead of a
                        native <Modal>, so they stay inside the normal view hierarchy
                        (correctly escaping any ScrollView they're triggered from) and
                        stack above regular screen content but below the ToastHost sibling
                        - so a toast is never hidden behind an open popup, and closing a
                        popup can never tear the toast down with it. */}
                    <MenuProvider>
                        <ThemeContext.Provider value={currentTheme}>
                            <SystemBars
                                style={mode === 'light' ? 'dark' : 'light'}
                                hidden={false}
                            />
                            <NavigationContainer ref={navigationRef} key={isAppStack ? "app" : "auth"} theme={navigationTheme} >
                                {isAppStack ? <Appstack /> : <Authstack />}
                            </NavigationContainer>
                        </ThemeContext.Provider>
                    </MenuProvider>
                    <PortalHost name="root" />
                    <ToastHost />
                </BottomSheetModalProvider>
              </KeyboardProvider>
            </View>
        </ErrorBoundary>
    );
}

export default App;