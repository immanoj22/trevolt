import React from 'react';
import { useContext, useEffect, useRef, useState } from 'react';
import { Alert, AppState, BackHandler, Platform } from 'react-native';
import { BottomSheetModal } from '@gorhom/bottom-sheet';
import { useIsFocused, useNavigation } from '@react-navigation/native';
import { useDispatch, useSelector } from 'react-redux';
import { initialWindowMetrics } from 'react-native-safe-area-context';
import Clipboard from '@react-native-clipboard/clipboard';
import DeviceInfo from "react-native-device-info";
import messaging from "@react-native-firebase/messaging";

import { showAppToast, ToastOptions } from '../../Components/Toast';
import { setUnreadCount } from '../../Slices/helper';
import ThemeContext from '../../Utilities/themecontext';
import { useLazyAffiliateDetailsQuery } from '../../Slices/affiliate';
import { setApiList, useLazyGetApiKeyQuery } from '../../Slices/apikey';
import { destroyStorage, getItem, setItem } from '../Storage/localstorage';
import { formatValue, isEmpty } from '../../Utilities/helerfunction';
import { setSubaccounts, useLazySubAccountQuery } from '../../Slices/subAccount';
import { setMyStrategy, useLazyMystrategyDetailsQuery } from '../../Slices/copy';
import { setPairlist, useLazyGetAllContractQuery } from '../../Slices/option';
import { authApi, setAffiliateData, SetDeviceinfo, setIsAuth, setUserData, useLazyNotificationQuery, useLazyUserDetailsQuery } from '../../Slices/auth';
import { update_getcurrencies, update_pricedetails, useLazyGetcurrencyQuery, useLazyPriceconversionQuery, setUserBalance } from '../../Slices/wallet';
import { setFuturePairData, setFutureTicker, setOpenOrders, setPositionOrders, setTradePairData, useAvailableMarginMutation, useLazyFutureOpenOrdersQuery, useLazyPairDetailsQuery, useLazyPositionOrdersQuery, UserRiskAndMarginDetails } from '../../Slices/future';
import { store, logoutAction } from '../../Slices';
import { FeeSettingsList, useLazyFeeSettingListQuery } from '../../Slices/feeSettings';

// Hoisted to module scope: `convert`/`convertSec` are called dozens of times per table
// render (every cell, every row), and constructing a new Intl.NumberFormat is a genuinely
// expensive operation to repeat that often on the JS thread — that repeated construction
// was a real, measurable contributor to "switching Calls/Puts tabs feels slow".
const usdFormatter = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' });
// INR is the default currency (getItem("convertCurrency") || "INR"), so this is the hot
// path both convert() and convertSec() hit on every cell by default - `amount.toLocaleString('en-IN')`
// below constructs a brand new Intl.NumberFormat internally on every call (same cost the
// comment above already flagged for USD), which on Hermes is expensive enough on a
// multi-row live-updating table (Option's T-shape tables, price ticks) to block the JS
// thread long enough to read as the whole app hanging.
const inrFormatter = new Intl.NumberFormat('en-IN');

// Single chokepoint every toast call in the app routes through (successtoast,
// failuretoast - both the hook-scoped one below and the standalone one further down -
// and the push-notification handler in App.tsx). The same logical event can end up
// calling showAppToast() more than once from independent, unrelated places: a screen's
// own catch block plus useApiError() both reacting to one failed request, several
// parallel in-flight requests each hitting their own error branch, an RTK Query retry
// repopulating the same error object, etc. Rather than chase down every individual
// call site that could double-fire, suppress a second call for the exact same
// message/description/type if it lands within this window of the first - a genuinely
// new toast (different text) is never affected.
const TOAST_DEDUP_WINDOW_MS = 600;
let lastToastKey: string | null = null;
let lastToastAt = 0;
export const showToastDeduped = (opts: ToastOptions) => {
    const key = `${opts.type}:${opts.message}:${opts.description ?? ""}`;
    const now = Date.now();
    if (key === lastToastKey && now - lastToastAt < TOAST_DEDUP_WINDOW_MS) return;
    lastToastKey = key;
    lastToastAt = now;
    showAppToast(opts);
};

const useCustomHooks = () => {
    const theme = useContext(ThemeContext);
    const dispatch = useDispatch();
    const bottomsheetref = useRef<BottomSheetModal>(null);

    let navigation: any = null;
    let isFocused: boolean | null = null;

    try {
        navigation = useNavigation<any>();
        isFocused = useIsFocused();
    } catch (error) {
        navigation = null;
        isFocused = false;
    }

    const openbottomsheet = (ref: React.RefObject<BottomSheetModal | null>) => {
        ref?.current?.present();
    };
    const closebottomsheet = (ref: React.RefObject<BottomSheetModal | null>) => {
        const node: any = ref?.current;
        if (!node) return;
        // Every sheet in the app is a <BottomSheetModal> (via Components/bottomsheet).
        // Prefer dismiss() over close(): dismiss() calls willUnmountSheet() + forceClose()
        // and removes the sheet from the modal provider's stack deterministically, so the
        // full-screen backdrop is actually unmounted. close() only animates to index -1 and
        // leans on enableDismissOnClose + the onClose callback firing to eventually unmount -
        // if the JS thread is busy when that callback is due, the (now invisible) backdrop
        // lingers and keeps eating taps, which reads as the screen being frozen.
        if (typeof node.dismiss === 'function') node.dismiss();
        else if (typeof node.close === 'function') node.close();
    };

    const successtoast = (title?: any, des?: any, duration?: number) => {
        showToastDeduped({
            message: title,
            description: des,
            duration: duration ?? 2000,
            type: "success",
        });
    };

    const failuretoast = (title?: any, des?: any, duration?: number) => {
        showToastDeduped({
            message: title,
            description: des,
            duration: duration ?? 2000,
            type: "danger",
        });
    };

    const copyData = (data: any) => {
        Clipboard?.setString(data);
        successtoast("Copied Successfully");
    };

    const cleardata = () => {
        Cleardata()
    }

    // NARROW subscription: only `pricedetails` (used by convert*/convertSec below),
    // NOT the whole wallet slice. useCustomHooks() is called in ~193 components -
    // subscribing all of them to `state.wallet` meant every balance update
    // (setUserBalance, fired on every position-moving price tick) re-rendered the
    // entire app. `pricedetails` is always an array (see wallet slice).
    const pricedetails = useSelector((state: any) => state.wallet.pricedetails);

    const convertTo = (value: any, base: any, quote: any, pip: any = '') => {
        try {
            let amount = value
            if (base == quote) {
                return value
            }
            let conversionRate = pricedetails.find((val: any) => (val.pair == `${base}${quote}`))
            if (isEmpty(conversionRate)) {
                conversionRate = pricedetails.find((val: any) => (val.pair == `${quote}${base}`))
                conversionRate.price = 1 / conversionRate.price
            }
            amount = value * conversionRate.price
            amount = isNaN(amount) || !isFinite(amount) ? value : amount
            if (!isEmpty(pip)) {
                amount = amount.toFixed(pip)
            }
            return amount
        } catch (err) {
            console.log(err, "convertTo___err")
            return value
        }
    }

        const convertValueforChart = (value: any, pip = 2) => {
            const showCurrency = getItem("convertCurrency") || "INR";
            let amount: any = parseFloat(value)
            amount = isNaN(amount) || !isFinite(amount) ? 0 : amount
            let conversionRate = pricedetails.find((val: any) => (val.pair == `${"USDT"}${"INR"}`))
            if (amount !== 0 && !isEmpty(conversionRate) && (showCurrency !== "USD")) {
                amount = (parseFloat(value) * conversionRate.price)
            }
            amount = formatValue(amount, pip)
            return (showCurrency === 'INR' ? `${amount}` : `${amount}`)
        }

    const convert = (value: any, pip = 2, pair: string = "USDINR") => {
        const showCurrency = getItem("convertCurrency") || "INR";
        let isNotConvert = false
        try {
            let amount: any = parseFloat(value)
            amount = isNaN(amount) || !isFinite(amount) ? 0 : amount
            const findPair = pricedetails.find((e: any) => e?.pair === pair);
            if (amount !== 0 && !isEmpty(findPair) && (showCurrency !== "USDT")) {
                amount = (parseFloat(value) * findPair.price)
            }
            amount = formatValue(amount, pip)
            isNotConvert = typeof amount === 'string' && amount.split('').includes('<')
            return (showCurrency === 'INR' ? (isNotConvert ? amount : "₹ " + inrFormatter.format(amount)) : isNotConvert ? amount : usdFormatter.format(amount))

        } catch (err) {
        }
    }

    const convertSec = (value: any, pip = 2, pair: string = "USDINR") => {
        const showCurrency = getItem("convertCurrency") || "INR";
        let isNotConvert = false
        try {
            let amount: any = parseFloat(value)
            amount = isNaN(amount) || !isFinite(amount) ? 0 : amount
            const findPair = pricedetails.find((e: any) => e?.pair === pair);
            if (amount !== 0 && !isEmpty(findPair) && (showCurrency !== "INR")) {
                amount = (parseFloat(value) * findPair.price)
            }
            amount = formatValue(amount, pip)
            isNotConvert = typeof amount === 'string' && amount.split('').includes('<')
            return (showCurrency === 'INR' ? (isNotConvert ? amount : usdFormatter.format(amount)) : (isNotConvert ? amount : "₹ " + inrFormatter.format(amount)))

        } catch (err) {
        }
    }

    return {
        theme,
        dispatch,
        navigation,
        isFocused,
        bottomsheetref,
        openbottomsheet,
        closebottomsheet,
        initialWindowMetrics,
        successtoast,
        failuretoast,
        copyData,
        cleardata,
        convert,
        convertSec,
        convertTo,
        convertValueforChart
    };
};

export default useCustomHooks;

// POST /user/register_device_token runs through decryptRequest on the backend, so
// its body is encrypted with the user's secretkey (encrypt_secondary reads
// getItem("secretkey")). That key is only written once triggeruserdetails()
// resolves (HelperComponent's fetchUserData) — an async call kicked off in
// parallel with Deviceinfo() — and logout's destroyStorage() wipes it, so after
// every login it starts out empty. Sending before it lands encrypts with an empty
// passphrase, the backend fails to decrypt, and the request comes back
// "fcmtoken is required", which is why the token never reached deviceTokens after
// a login but did after a plain app restart (key already in storage).
// getItem is synchronous (MMKV) and returns '' when the key is absent.
const waitForSecretKey = async (timeoutMs = 20000) => {
    const deadline = Date.now() + timeoutMs;
    while (Date.now() < deadline) {
        if (!isEmpty(getItem('secretkey'))) return true;
        await new Promise((r) => setTimeout(r, 250));
    }
    return !isEmpty(getItem('secretkey'));
};

export function Deviceinfo() {
                    
    return async (dispatch?: any) => {
        try {
            // iOS: getToken() rejects if the device isn't registered for remote
            // messages yet — which happens on a cold first launch before APNs has
            // handed back a token. registerDeviceForRemoteMessages() is idempotent
            // and resolves once that's done. (No-op on Android.)
            if (Platform.OS === 'ios' && !messaging().isDeviceRegisteredForRemoteMessages) {
                await messaging().registerDeviceForRemoteMessages();
            }

            // getToken() can still transiently fail right after a fresh install
            // (APNs handshake, no network) — retry a couple of times before giving
            // up so this session doesn't stay unregistered until the next launch.
            let fcmtoken = '';
            for (let attempt = 0; attempt < 3 && !fcmtoken; attempt++) {
                try {
                    fcmtoken = await messaging().getToken();
                    console.log("🚀 ~ Deviceinfo ~ fcmtoken:", fcmtoken)
                } catch (tokenErr) {
                    if (attempt < 2) await new Promise((r) => setTimeout(r, 1500));
                }
            }

            const deviceId = await DeviceInfo.getUniqueId();
            const deviceName = await DeviceInfo.getDeviceName();
            console.log("🚀 ~ Deviceinfo ~ deviceName:", deviceName)
            dispatch(SetDeviceinfo({ fcmtoken, deviceId, deviceName }));

            if (!fcmtoken) {
                console.log('Deviceinfo: no FCM token obtained after retries');
                return;
            }

            // See waitForSecretKey above — without this the registration is sent
            // before the key exists and fails silently.
            if (!(await waitForSecretKey())) {
                console.log('Deviceinfo: secretkey never became available, skipping device-token registration');
                return;
            }

            // Unwrapped deliberately: .initiate() on its own swallows the failure,
            // which is what made a non-registering device look identical to a
            // working one. One retry covers a transient network blip.
            const payload = { fcmtoken, deviceId, deviceName, platform: Platform.OS };
            for (let attempt = 1; attempt <= 2; attempt++) {
                try {
                    await dispatch(authApi.endpoints.registerDeviceToken.initiate(payload)).unwrap();
                    console.log('Deviceinfo: device token registered');
                    return;
                } catch (err) {
                    console.log(`Deviceinfo: register_device_token failed (attempt ${attempt}/2)`, err);
                    if (attempt < 2) await new Promise((r) => setTimeout(r, 2000));
                }
            }
        } catch (error) {
            console.log('Deviceinfo error', error);
        }
    };
}

interface Hardwarebackpress {
    title?: string,
    des?: string,
    yesfn?: () => void
}

export const useHardwareBackPress = ({
    title,
    des,
    yesfn

}: Hardwarebackpress) => {
    const isfouced = useIsFocused()
    useEffect(() => {
        const onBackPress = () => {
            if (title) {
                Alert.alert(`${title}`, `${des}`, [
                    {
                        text: 'Cancel',
                        onPress: () => null,
                        style: 'cancel',
                    },
                    {
                        text: 'YES',
                        onPress: yesfn,
                    },
                ]);
                return true;

            }
            else {
                yesfn?.()
                return true;

            }
        };
        const backHandler = BackHandler.addEventListener('hardwareBackPress', onBackPress);
        return () => backHandler.remove();
    }, [title, des, yesfn, isfouced]);
};

export const useIsForeground = () => {
    const [isForeground, setIsForeground] = useState<boolean>(true)

    useEffect(() => {
        const onChange = (state?: string) => {
            setIsForeground(state === 'active')
        }
        const listener = AppState.addEventListener('change', onChange)
        return () => listener.remove()
    }, [setIsForeground])

    return isForeground
}

interface commonalert {
    title: string,
    des: string,
    yes: () => void
}

export const Commonalert = ({
    title = "Alert!",
    des = "Alert for this",
    yes
}: commonalert) => {
    Alert.alert(`${title}`, `${des}`, [
        {
            text: 'Cancel',
            onPress: () => null,
            style: 'cancel',
        },
        {
            text: 'YES',
            onPress: yes,
        },
    ]);
}

export const useApihooks = () => {
    const dispatch = useDispatch();
    const [getcurrency, { data: currency }] = useLazyGetcurrencyQuery()
    const [priceconversion, { data: price }] = useLazyPriceconversionQuery()
    const [subAccount] = useLazySubAccountQuery()
    const [userDetails] = useLazyUserDetailsQuery();
    const [affiliateDetails] = useLazyAffiliateDetailsQuery();
    const [pairDetails] = useLazyPairDetailsQuery();
    const [positionOrders] = useLazyPositionOrdersQuery();
    const [futureAvailableMargin] = useAvailableMarginMutation();
    const [getApikeys] = useLazyGetApiKeyQuery();
    const [mystrategy] = useLazyMystrategyDetailsQuery();
    const [futureOpenOrders] = useLazyFutureOpenOrdersQuery();
    const [notification] = useLazyNotificationQuery();
    const [getAllContract] = useLazyGetAllContractQuery();
    const [feeSettingList] = useLazyFeeSettingListQuery();

    useEffect(() => {
        if (currency) {
            dispatch(update_getcurrencies(currency?.result?.data))
        }
    }, [currency])

    useEffect(() => {
        if (price) {
            dispatch(update_pricedetails(price?.result?.data))
        }
    }, [price])

    const Fetchcurrencies = () => {
        getcurrency(true)
        priceconversion(true)
    }

    const triggerFeeSettingList = async () => {
        const res = await feeSettingList(true);
        console.log(res?.data?.result, "triggerFeeSettingList")
        dispatch(FeeSettingsList(res?.data?.result?.data))
    }

    const triggeruserdetails = async () => {
        const res = await userDetails(true);
        // Was `res?.data.result?.data` - missing the `?.` after `.data`, so on any
        // request failure (res.data is undefined, error is on res.error instead) this
        // threw instead of skipping the update. Thrown from inside fetchUserData's
        // sequential await chain, that silently aborted every fetch after this one
        // (subaccounts, positions, open orders, notifications, affiliate, api keys,
        // strategies) on a single transient user-details failure.
        dispatch(setUserData(res?.data?.result?.data))
        setItem("secretkey", res?.data?.result?.data?.secretKey)
    }

    const triggeraffiliate = async () => {
        const res = await affiliateDetails({ range: '1W' });
        dispatch(setAffiliateData(res?.data?.result))
    }

    const Fetchsubaccounts = async () => {
        const subres = await subAccount(true)
        dispatch(setSubaccounts(subres?.data?.result))
    }

    const triggerPairDetails = async () => {
        const res = await pairDetails(true)
        const pairDetail = res?.data?.result?.data?.filter((val: any) => { return val.status == 'active' });
        const result = getItem("futurespair")
        const pairToken = result ?? res?.data?.result?.data?.[0]?.tickerRoot;
        dispatch(setFuturePairData(pairDetail));
        if (pairDetail) {
            if (isEmpty(pairDetail)) return;
            let currency: any = pairToken;
            let pairDet = pairDetail.find((val: any) => val.tickerRoot === currency);
            if (!pairDet) {
                currency = pairDetail[0].tickerRoot;
                pairDet = pairDetail[0];
                setItem("futurespair", currency);
            }
            dispatch(setTradePairData(pairDet));
            dispatch(setFutureTicker(pairDet));
            let riskAndMarginDetails = pairDetail.reduce((acc: any, pos: any) => {
                if (isEmpty(acc[`${pos.baseCurrency}`])) {
                    acc[`${pos.baseCurrency}`] = {
                        maintenanceMargin: 0,
                        initialMargin: 0
                    }
                }
                return acc;
            }, {});
            dispatch(UserRiskAndMarginDetails(riskAndMarginDetails))
        }
    }

    const triggerAvailableMargin = async () => {
        const payload = {
            convertCurrency: "USDT",
        };
        const data = await futureAvailableMargin(payload).unwrap();
        dispatch(setUserBalance(data?.result));
    };

    const triggerpositionOrders = async () => {
        const params = {
            'pairId': 'all',
            'tradeMode': 'all'
        }
        const res = await positionOrders(params);
        dispatch(setPositionOrders(res?.data?.result?.data));
    }

    const triggerOpendOrders = async () => {
        const params = {
            pairId: "all",
            tradeMode: "all",
            page: 1,
            limit: 10
        };
        const response = await futureOpenOrders(params).unwrap();
        dispatch(setOpenOrders(response?.result.data))
    }

    const triggerfetchApiKeyLists = async () => {
        const res = await getApikeys(true);
        dispatch(setApiList(res?.data?.result?.data));
    }

    const mystrategyDetails = async () => {
        const res = await mystrategy(true);
        dispatch(setMyStrategy(res?.data?.result));
    }

    const triggerOptionLists = async () => {
        const response = await getAllContract(true);
        // Never overwrite already-populated pairlist with an empty/failed result —
        // this call races with other screens' own fallback fetches of the same list
        // (e.g. Home/market.tsx), and whichever resolves last must not be allowed to
        // blow away good data with [] just because it failed or was slower.
        if (response?.data?.result?.length) {
            dispatch(setPairlist(response.data.result));
        }
    }

    const triggergetNotification = async () => {
        try {
            const payload = {
                page: 1,
                limit: 10,
                showRead: false
            }
            const response = await notification(payload).unwrap();
            if (response?.success) {
                const unreadCounts = response?.result?.data?.filter((item: any) => !item.isRead).length;
                dispatch(setUnreadCount(unreadCounts));
            }
        } catch (error) {
            console.log("getNotifications_err", error)
        }
    }

    return {
        Fetchcurrencies,
        triggeruserdetails,
        triggeraffiliate,
        Fetchsubaccounts,
        triggerPairDetails,
        triggerpositionOrders,
        triggerAvailableMargin,
        triggerfetchApiKeyLists,
        mystrategyDetails,
        triggerOpendOrders,
        triggergetNotification,
        triggerOptionLists,
        triggerFeeSettingList
    }
}

// export const Fetchcurrencies = (effect: any) => {
//     const dispatch = useDispatch()
//     const [getcurrency, { data: currency }] = useLazyGetcurrencyQuery()
//     const [priceconversion, { data: price }] = useLazyPriceconversionQuery()

//     useEffect(() => {
//         getcurrency(true)
//         priceconversion(true)
//     }, [effect])

//     useEffect(() => {
//         if (currency) {
//             dispatch(update_getcurrencies(currency?.result?.data))
//         }
//     }, [currency])

//     useEffect(() => {
//         if (price) {
//             dispatch(update_pricedetails(price?.result?.data))
//         }
//     }, [price])

//     return null
// }

export const Switchaccounts = (effect: any) => {
    const [subAccount, { data: suacc }] = useLazySubAccountQuery()
    const [userDetails, { data: profile }] = useLazyUserDetailsQuery();
    const dispatch = useDispatch()
    useEffect(() => {
        subAccount(true)
        userDetails(true)
    }, [effect])

}

export const capitalizeFirst = (str: string) => {
    if (!str) return "";
    return str.charAt(0).toUpperCase() + str.slice(1);
};


export const Cleardata = () => {
    const dispatch = store.dispatch
    console.log("cleardata_call")
    destroyStorage()
    // navigation.navigate("Login")
    dispatch(setIsAuth(false))
    // The manual Logout flow (Profile/index.tsx) additionally dispatches this after
    // calling cleardata(), which resets every slice - including wallet/future/option/
    // subAccount and every RTK Query cache - back to initial state. This function is
    // also what runs on a FORCE_LOGOUT socket event (password/email change, admin
    // deactivation, AML block — signing in on another device no longer kicks this
    // session), which was missing that dispatch entirely: the first
    // session's stale balances/positions/option chain/sub-accounts stayed in the store
    // through the login screen, then crashed whichever Dashboard-mounted screen read
    // them first as soon as a second login succeeded on this device.
    dispatch(logoutAction())
}


export const failuretoast = (title?: any, des?: any, duration?: number) => {
    showToastDeduped({
        message: title,
        description: des,
        duration: duration ?? 2000,
        type: "danger",
    });
};