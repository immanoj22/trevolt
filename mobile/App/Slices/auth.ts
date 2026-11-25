import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { createApi } from '@reduxjs/toolkit/query/react';

import { authState } from "./type";
import { ENDPOINTS } from "../Actions/Constant/constant";
import { getQueryParamString } from "../Utilities/helerfunction";
import { encryptedBaseQuery } from "../Actions/Constant/encryption";

export const initialState: authState = {
    authToken: "",
    isAuth: false,
    userData: {},
    deviceinfo: {
        fcmtoken: "",
        deviceId: "",
        deviceName: "",
    },
    affiliateData: {},
    leverage: 1,
    panDetails: []
}

const auth = createSlice({
    name: 'auth',
    initialState,
    reducers: {
        setIsAuth: (state, action: PayloadAction<boolean>) => {
            state.isAuth = action.payload;
        },
        setUserData: (state, action: any) => {
            // ~50 screens do `const { field } = useSelector(state => state.auth.userData)`
            // with no null guard - a falsy payload here (a null `result.data` in an
            // otherwise-successful API envelope, a caller passing undefined) would crash
            // every one of them the next time they render, caught only by the root
            // ErrorBoundary ("Something went wrong"). Never let this become falsy.
            state.userData = action.payload ?? {};
        },
        SetDeviceinfo: (state, action: PayloadAction<any>) => {
            state.deviceinfo = action.payload;
        },
        setAffiliateData: (state, action: any) => {
            state.affiliateData = action.payload;
        },
        setUserLeverage: (state, action: any) => {
            state.leverage = action.payload;
        },
        setPanDetails: (state, action: any) => {
            state.panDetails = action.payload;
        },
        setFavStrategies: (state, action: PayloadAction<any[]>) => {
            if (state.userData) {
                state.userData = { ...state.userData, favStradegies: action.payload };
            }
        }
    },
});

export const { setUserData, SetDeviceinfo, setAffiliateData, setUserLeverage, setPanDetails, setIsAuth, setFavStrategies } = auth.actions;

export const authSelector = (state: { auth: authState }) => state.auth;

export default auth.reducer;

export const authApi = createApi({
    reducerPath: 'authapi',
    baseQuery: encryptedBaseQuery,

    endpoints: (builder) => ({
        register: builder.mutation({
            query: (payload) => ({
                url: `${ENDPOINTS.register}`,
                method: 'POST',
                body: payload,
                meta: {
                    isprimary: true,
                    // SECURITY: signs the request so the backend can skip CAPTCHA
                    // (see MOBILE_REQUEST_SIGNING.pdf) — only set here and on login,
                    // matching the two routes verifyCaptcha() is actually mounted on.
                    isSigned: true
                }
            }),
        }),

        login: builder.mutation({
            query: (payload) => ({
                url: `${ENDPOINTS.login}`,
                method: 'POST',
                body: payload,
                meta: {
                    isprimary: true,
                    isSigned: true
                }
            }),
        }),

        loginVerify: builder.mutation({
            query: (payload) => ({
                url: `${ENDPOINTS.loginVerify}`,
                method: 'POST',
                body: payload,
                meta: {
                    isprimary: true
                }
            }),
        }),

        forgotPassword: builder.mutation({
            query(payload) {
                const queryParams = getQueryParamString(payload);
                return {
                    url: ENDPOINTS.forgotPassword + queryParams,
                    method: 'GET',
                    meta: {
                        isget: true
                    }
                }

            },
        }),

        changeforgotPass: builder.mutation({
            query: (payload) => ({
                url: `${ENDPOINTS.forgotPassword}`,
                method: 'POST',
                body: payload,
                meta: {
                    isprimary: true
                }

            }),
        }),

        resendLoginCode: builder.mutation({
            query: (payload) => ({
                url: `${ENDPOINTS.resendlogin}`,
                method: 'POST',
                body: payload,
                meta: {
                    isprimary: true
                }
            }),
        }),

        resendCode: builder.query({
            query: () => ({
                url: `${ENDPOINTS.resend}`,
                method: 'get',
                meta: {
                    isgetsecondary: true
                }
            }),
        }),


        userDetails: builder.query({
            query: () => ({
                url: `${ENDPOINTS.userDetails}`,
                method: 'GET',
                meta: {
                    isget: true
                }
            }),
        }),

        updateSettings: builder.mutation({
            // Migrated off multipart: this route now carries the profile image as a
            // base64 envelope in a plain JSON body (backend decodeBase64Files(['attachment'])).
            // Callers build the body via toBase64UploadBody(); non-file callers
            // (name/settings updates) just pass a plain object through unchanged.
            query(payload) {
                return {
                    url: ENDPOINTS.updateSettings,
                    body: payload,
                    method: 'POST',
                    meta: {
                        isjson: true
                    },
                }
            },
        }),

        changeEmail: builder.mutation({
            query: (payload) => ({
                url: `${ENDPOINTS.changeEmail}`,
                method: 'POST',
                body: payload
            }),
        }),

        changePasswrod: builder.mutation({
            query: (payload) => ({
                url: `${ENDPOINTS.changePassword}`,
                method: 'POST',
                body: payload,
            }),
        }),


        verificationMobile: builder.mutation({
            query: (payload) => ({
                url: `${ENDPOINTS.verificationMobileCode}`,
                method: 'POST',
                body: payload,
            }),
        }),


        verifyNumber: builder.mutation({
            query: (payload) => ({
                url: `${ENDPOINTS.verifyMobile}`,
                method: 'POST',
                body: payload,
            }),
        }),

        verifyNewMobile: builder.mutation({
            query: (payload) => ({
                url: `${ENDPOINTS.changeMobileNum}`,
                method: 'PATCH',
                body: payload,
            }),
        }),

        internalkyc: builder.mutation({
            // Migrated off multipart: KYC front/back images now go as an array of
            // base64 envelopes in a plain JSON body (backend
            // decodeBase64Files(['attachments'])). Caller builds via toBase64UploadBody().
            query(payload) {
                return {
                    url: ENDPOINTS.internalkyc,
                    body: payload,
                    method: 'POST',
                    meta: {
                        isjson: true
                    },
                }
            },
        }),

        sendOldMobile: builder.mutation({
            query: (payload) => ({
                url: `${ENDPOINTS.changeMobileNum}`,
                method: 'POST',
                body: payload,
            }),
        }),

        verifyOldMobile: builder.mutation({
            query: (payload) => ({
                url: `${ENDPOINTS.changeMobileNum}`,
                method: 'PUT',
                body: payload,
            }),
        }),

        twofactorauthsetup: builder.query({
            query: () => ({
                url: `${ENDPOINTS.twofa}`,
                method: 'GET',
                meta: {
                    isgetsecondary: true
                }
            }),
        }),

        enabletwofa: builder.mutation({
            query: (payload) => ({
                url: `${ENDPOINTS.twofa}`,
                method: 'PUT',
                body: payload,
            }),
        }),

        disabletwofa: builder.mutation({
            query: (payload) => ({
                url: `${ENDPOINTS.twofa}`,
                method: 'PATCH',
                body: payload,
            }),
        }),

        // fcmtoken (this device's push token, optional) tells the backend which
        // deviceTokens entry to drop, so logging out here doesn't stop pushes on
        // any other device this account is still signed into.
        logout: builder.query({
            query: (fcmtoken?: string) => ({
                url: fcmtoken ? `${ENDPOINTS.logout}?fcmtoken=${encodeURIComponent(fcmtoken)}` : `${ENDPOINTS.logout}`,
                method: 'GET',
                meta: {
                    isget: true
                }
            }),
        }),

        updateTwofaType: builder.query({
            query(payload) {
                const queryParams = getQueryParamString(payload);
                return {
                    url: ENDPOINTS.twofatype + queryParams,
                    method: 'GET',
                    meta: {
                        isgetsecondary: true
                    }
                }

            },
        }),

        recoveryUser: builder.mutation({
            query(payload) {
                const queryParams = getQueryParamString(payload);
                return {
                    url: ENDPOINTS.recoverUser + queryParams,
                    method: 'GET',
                    meta: {
                        isget: true,
                    },
                }
            },
        }),

        recoveryUserOTP: builder.mutation({
            query: (payload) => ({
                url: `${ENDPOINTS.recoverUser}`,
                method: 'PUT',
                body: payload,
                meta: {
                    isprimary: true
                }
            }),
        }),

        cashfreekyc: builder.mutation({
            query: (payload) => ({
                url: `${ENDPOINTS.cashfree}`,
                method: 'POST',
            }),
        }),

        cashfreestatus: builder.query({
            query() {
                return {
                    url: ENDPOINTS.cashfreestatus,
                    method: 'GET',
                    meta: {
                        isgetsecondary: true
                    }
                }
            },
        }),

        referaldetails: builder.query({
            query() {
                return {
                    url: ENDPOINTS.referaldetails,
                    method: 'GET',
                    meta: {
                        isgetsecondary: true
                    }
                }

            },
        }),

        referalhistory: builder.query({
            query(payload) {
                const queryParams = getQueryParamString(payload);
                return {
                    url: ENDPOINTS.referalhistory + queryParams,
                    method: 'GET',
                    meta: {
                        isgetsecondary: true
                    }
                }
            },
        }),

        notification: builder.query({
            query: ({ page, limit, showRead }) => ({
                url: `${ENDPOINTS.notification}?page=${page}&limit=${limit}&showRead=${showRead}`,
                method: 'GET',
                meta: {
                    isget: true,
                },
            }),
        }),

        updateNotification: builder.mutation({
            query: (payload) => ({
                url: `${ENDPOINTS.updateNotification}`,
                method: 'POST',
                body: payload,
            }),
        }),

        registerDeviceToken: builder.mutation({
            query: (payload) => ({
                url: `${ENDPOINTS.registerDeviceToken}`,
                method: 'POST',
                body: payload,
            }),
        }),

        signupWithGoogle: builder.mutation({
            query: (payload) => ({
                url: `${ENDPOINTS.googleSignup}`,
                method: 'POST',
                body: payload,
                meta: {
                    isprimary: true
                }
            }),
        }),

        announcement: builder.query({
            query: ({ page, limit }) => ({
                url: `${ENDPOINTS.announcement}?limit=${limit}&page=${page}`,
                method: 'GET',
                meta: {
                    isget: true,
                },
            }),
        }),

        getverifyQR: builder.mutation({
            query: (token) => ({
                url: `${ENDPOINTS.verifyQR}?token=${token}`,
                method: 'get',
                meta: {
                    isgetsecondary: true
                }
            }),
        }),

        verifyQR: builder.mutation({
            query: (payload) => ({
                url: `${ENDPOINTS.verifyQR}`,
                method: 'POST',
                body: payload,
            }),
        }),

        allsession: builder.query({
            query: () => ({
                url: `${ENDPOINTS.allsession}`,
                method: 'GET',
                meta: {
                    isgetsecondary: true,
                },
            }),
        }),

        deleteSession: builder.mutation({
            query: (payload) => ({
                url: `${ENDPOINTS.deleteSession}`,
                method: 'POST',
                body: payload,
            }),
        }),

        trendingTrade: builder.query({
            query: () => ({
                url: `${ENDPOINTS.trendingTrade}`,
                method: 'GET',
                meta: {
                    isget: true,
                },
            }),
        }),

        trendingPopular: builder.query({
            query: () => ({
                url: `${ENDPOINTS.trendingPopular}`,
                method: 'GET',
                meta: {
                    isget: true,
                },
            }),
        }),

        tradePairs: builder.query({
            query: () => ({
                url: `${ENDPOINTS.tradePairs}`,
                method: 'GET',
                meta: {
                    isget: true,
                },
            }),
        }),

        panCardCreate: builder.mutation({
            // Migrated off multipart: PAN image now goes as a base64 envelope in a
            // plain JSON body (backend decodeBase64Files(['files'])). Caller builds
            // via toBase64UploadBody().
            query(payload) {
                return {
                    url: ENDPOINTS.panCardCreate,
                    body: payload,
                    method: 'POST',
                    meta: {
                        isjson: true
                    },
                }
            },
        }),

        checkFaceLiveness: builder.mutation({
            // Migrated off multipart: selfie now goes as a base64 envelope in a plain
            // JSON body (backend decodeBase64Files(['image'])). Caller builds via
            // toBase64UploadBody().
            query(payload) {
                return {
                    url: ENDPOINTS.checkFace,
                    body: payload,
                    method: 'POST',
                    meta: {
                        isjson: true
                    },
                }
            },
        }),

        additionalVerification: builder.mutation({
            query: (payload) => ({
                url: `${ENDPOINTS.additionalVerification}`,
                method: 'POST',
                body: payload,
            }),
        }),

        singInWithApple: builder.mutation({
            query: (payload) => ({
                url: `${ENDPOINTS.singInWithApple}`,
                method: 'POST',
                body: payload,
                meta: {
                    isprimary: true
                }
            }),
        }),


    })
});
export const {
    useRegisterMutation,
    useLoginMutation,
    useLoginVerifyMutation,
    useForgotPasswordMutation,
    useChangeforgotPassMutation,
    useResendLoginCodeMutation,
    useLazyResendCodeQuery,
    useLazyUserDetailsQuery,
    useUpdateSettingsMutation,
    useChangeEmailMutation,
    useChangePasswrodMutation,
    useVerifyNumberMutation,
    useVerificationMobileMutation,
    useInternalkycMutation,
    useVerifyNewMobileMutation,
    useSendOldMobileMutation,
    useVerifyOldMobileMutation,
    useLazyTwofactorauthsetupQuery,
    useEnabletwofaMutation,
    useDisabletwofaMutation,
    useLazyLogoutQuery,
    useLazyUpdateTwofaTypeQuery,
    useRecoveryUserMutation,
    useRecoveryUserOTPMutation,
    useCashfreekycMutation,
    useLazyCashfreestatusQuery,
    useLazyReferaldetailsQuery,
    useLazyReferalhistoryQuery,
    useLazyNotificationQuery,
    useUpdateNotificationMutation,
    useSignupWithGoogleMutation,
    useRegisterDeviceTokenMutation,
    useLazyAnnouncementQuery,
    useVerifyQRMutation,
    useGetverifyQRMutation,
    useLazyAllsessionQuery,
    useDeleteSessionMutation,
    useLazyTrendingTradeQuery,
    useLazyTradePairsQuery,
    useLazyTrendingPopularQuery,
    usePanCardCreateMutation,
    useCheckFaceLivenessMutation,
    useAdditionalVerificationMutation,
    useSingInWithAppleMutation,
} = authApi;