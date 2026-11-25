import { useEffect, useLayoutEffect, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import isEmpty from 'is-empty'
import { useContext } from "react";
import { jwtDecode } from 'jwt-decode'

//context
import SocketContext from "../context/socketContext";


/** Redux */
import { AssetDetail } from "../redux/walletaction";
import { AccessToken, IsAuth, UserBalance, UserDetails, UserSubAccountList, AffliateDetails, UserPositionDetails, UserOpenOrderDetails } from "../redux/action";
import { FuturePairData, FutureTicker, UnderlyingStress } from "../redux/futureAction";

/** LIB */
import { RemoveItemLocalStorageItem } from "../lib/storage";
import { decryptObject } from "../lib/Cryptojs";

/** Actions */
import { futureAvailableMargin, futureOpenOrders, futurePositionOrders, getFuturePairList } from "../actions/futureActions";
import { getUserDetailsHooks, logoutHooks } from "../actions/userAction";
import { getInstitutionDetails } from "../actions/institutionAction";
import { getAllUnderlyingAssetDetails } from "../actions/OptionTradeAction";
import { OptionContractDetail, OptionTicker, UnderlyingDetails } from "../redux/optionAction";
import { getAffiliateDetails } from "../actions/affliateAction";
import { getSubAccount } from "../actions/subAccountAction";
import { getPriceConversionList } from "../actions/currencyAction";
import { PriceConversionList } from "../redux/currencyAction";
import { getPorfitCalculation, openOrdersAsposition } from "../lib/calculation";
import { notificationToast } from "../lib/notificationToast";
import { getApikeys } from "../actions/apikeyAction";
import { ApiKeyList } from "../redux/apikeyAction";
import config from "../config/env";
import usePortfolioHook from "../hooks/usePortfolioHook";
import { getAllStrategy, getMyStrategy } from "../actions/copyTradeAction";
import { allStrategies, myStrategies } from "../redux/copytradeAction";
import { useLocation, useNavigate } from "react-router-dom";
import { feeSettingList } from "../actions/feeSettingAction";
import { FeeSettingsList } from "../redux/feeReduxAction";

export const ExportHooks = {
    navigate: null,
}

const HelperRoute = () => {

    const dispatch = useDispatch();
    const navigate = useNavigate();
    const location = useLocation();
    ExportHooks.navigate = navigate;

    const { isAuthStatus, positionDetails, wallet, userdetails, openOrderDetails, affiliateDetails } = useSelector((state) => state.user)
    const { futurePairData } = useSelector((state) => state.future);
    const { underlyingDetails, optionContractData, optionTicker } = useSelector((state) => state.option);
    const { priceConversionList } = useSelector((state) => state.currency);
    const socketContext = useContext(SocketContext);

    const futurePairsData = useRef(futurePairData)
    const ConversionList = useRef(priceConversionList)
    const PositionDetails = useRef(positionDetails)
    const userWalletDetails = useRef(wallet)
    // const accountId = useRef(userdetails.accountId)
    const Userdetails = useRef(userdetails)
    const Underlyingdetails = useRef(underlyingDetails)
    const optioncontract = useRef(optionContractData)
    const optionticker = useRef(optionTicker)
    const { computePortfolioMargins } = usePortfolioHook()
    // useEffect(() => {
    //     setInterval(() => {
    //         notificationToast("Welcome", "hi hi ih ihi hihihi")
    //     }, 5000)
    // }, [])

    // console.log("HelperRoute__isAuthStatus", affiliateDetails)

    const fetchUserData = async () => {
        try {
            // SECURITY FIX (VAPT: "Token Storage Security" — Points 44/49/70):
            // previously read the raw JWT back out of localStorage and
            // decoded it client-side just to pass its `secretKey` claim
            // into getUserDetailsHooks(). The JWT itself is no longer
            // stored anywhere in the browser — auth now flows through the
            // httpOnly cookie the backend set on login (axios
            // withCredentials: true sends it automatically), and
            // getUserDetailsHooks() doesn't actually need a key argument to
            // authenticate (it decrypts its own response with the default
            // app secret). The non-sensitive "isLoggedIn" flag is just a
            // hint to attempt the call; a missing/expired cookie still
            // correctly fails the request.
            const hasSessionFlag = localStorage.getItem('isLoggedIn');
            if (hasSessionFlag) {
                const resp = await getUserDetailsHooks();
                let result = resp?.data;
                if (result?.success) {
                    let userdata = result?.result?.data
                    dispatch(UserDetails({ userdetails: userdata }));
                    fetchUserBalance(userdata)
                    FetchSubAccountList(userdata)
                    FetchPositionOrders(userdata)
                    fetchApiKeyLists(userdata)
                    if (userdata.marginMode == 'portfolio') {
                        FetchOpenOrders(userdata)
                    }
                }
            }
        } catch (e) {
            console.log('fetchUserData__Err', e);
        }
    }

    const fetchUnderlyingAssetList = async () => {
        try {
            const resp = await getAllUnderlyingAssetDetails();
            const result = resp?.data;
            if (result?.length > 0) {
                dispatch(UnderlyingDetails({ underlyingDetails: result }));
            }
        } catch (e) {
            console.log('fetchAssetData_err', e);
        }
    }
    const fetchDerivativePairList = () => {
        try {
            getFuturePairList(dispatch)
        } catch (err) {
            console.log(err, 'fetchPairList__err')
        }
    }

    const fetchInstitutionDetails = async () => {
        try {
            getInstitutionDetails(dispatch)
        } catch (err) {
            console.log(err, 'fetchPairList__err')
        }
    }

    const fetchAffilliteDetails = async () => {
        try {
            getAffiliateDetails(dispatch)
        } catch (err) {
            console.log(err, 'fetchPairList__err')
        }
    }

    const fetchUserBalance = async (userdetails) => {
        try {
            const payload = {
                convertCurrency: "USDT",
            }
            const data = await futureAvailableMargin(payload, userdetails?.secretKey);
            dispatch(UserBalance({ wallet: data.data }))
        } catch (e) {
            console.log("fetchUserBalance__err", e);
        }
    }

    const FetchSubAccountList = async (userdetails) => {
        try {
            const { result, status } = await getSubAccount(userdetails?.secretKey);
            dispatch(UserSubAccountList({ subAccountList: result }))
        } catch (e) {
            console.log("FetchSubAccountList_err", e);
        }
    }

    const FetchPriceConversionList = async () => {
        try {
            const { result, status } = await getPriceConversionList();
            dispatch(PriceConversionList({ priceConversionList: result.data }))
        } catch (err) {
            console.log(err, "FetchPriceConversionList__err")
        }
    }

    const FetchPositionOrders = async (userdetails) => {
        try {
            let params = {
                'tradeMode': 'all',
                'pairId': 'all'
            }
            const { record, status } = await futurePositionOrders(params, {}, userdetails.secretKey);
            dispatch(UserPositionDetails({ positionDetails: record }))
        } catch (err) {
            console.log(err, "FetchPositionOrders__err")
        }
    }

    const fetchApiKeyLists = async (userdetails) => {
        try {
            const { result, status } = await getApikeys(userdetails.secretKey);
            if (status) {
                dispatch(ApiKeyList({ apikeys: result.data }))
            }
        } catch (e) {
            console.log(err, "fetchApiKeyLists_err")
        }
    }

    const FetchOpenOrders = async (userdetails) => {
        try {
            const { record, status } = await futureOpenOrders('all', {}, userdetails.secretKey, 'all');
            dispatch(UserOpenOrderDetails({ openOrderDetails: record }))
        } catch (err) {
            console.log(err, "FetchPositionOrders__err")
        }
    }


    const FetchFeeSettings = async () => {
        try {
            const { result, status } = await feeSettingList();
            dispatch(FeeSettingsList({ feeSettingsList: result?.data }))
        } catch (err) {
            console.log(err, "FetchPositionOrders__err")
        }
    }

    const ArrangePositionOrder = (result) => {
        try {
            if (PositionDetails.current.length > 0) {
                let PositionData = [...PositionDetails.current]
                let index = PositionData.findIndex((el => el.pairName == result.tickerRoot))
                // console.log(index, 'ArrangePositionOrder')
                if (index != -1) {
                    let positionOrder = { ...PositionData[index] }
                    // console.log(index, 'ArrangePositionOrder', positionOrder)
                    positionOrder['close_price'] = result.marketPrice
                    const { profit, percentage } = getPorfitCalculation(positionOrder?.entryPrice, positionOrder.close_price, positionOrder.positionFilled, positionOrder.positionSide)
                    positionOrder['pnl'] = profit
                    positionOrder['pnl_percen'] = percentage
                    PositionData[index] = positionOrder
                    dispatch(UserPositionDetails({ positionDetails: PositionData }))
                    CalculateunRealizedPnL(PositionData)
                }
            }
        } catch (err) {
            console.log(err, 'ArrangePositionOrder__err')
        }
    }

    const CalculateunRealizedPnL = async (PositionDetails) => {
        try {
            let unRealizedPnL = PositionDetails.reduce((UPNL = 0, val) => {
                UPNL = parseFloat(UPNL) + parseFloat(val.pnl)
                return UPNL
            }, 0)
            // console.log(unRealizedPnL, "CalculateunRealizedPnL")
            let wallet = { ...userWalletDetails.current }
            const userdetails = Userdetails.current
            wallet.unRealizedPnL = parseFloat(unRealizedPnL)
            wallet.tradingBalance = parseFloat(wallet.walletBalance) + parseFloat(unRealizedPnL)
            if (userdetails.marginMode == 'cross') {
                wallet.availableBalance = (wallet.walletBalance + wallet.unRealizedPnL) - (wallet.freezeBalance);
            } else if (userdetails.marginMode == 'portfolio') {
                let openToPosition = openOrdersAsposition(openOrderDetails)
                let originalPositions = [...PositionDetails, ...openToPosition]
                const { riskMargin, marginFloor, initialMargin, maintenanceMargin } = await computePortfolioMargins(originalPositions, userdetails.marginMode, wallet.unRealizedPnL)
                wallet.totalMargin = initialMargin
                wallet.freezeBalance = initialMargin
                wallet.availableBalance = (wallet.walletBalance + wallet.unRealizedPnL) - (wallet.freezeBalance);
                wallet.totalMaintainMargin = maintenanceMargin
            }
            dispatch(UserBalance({ wallet: wallet }))
        } catch (err) {
            console.log(err, "CalculateunRealizedPnL___err")
        }
    }


    useEffect(() => {
        futurePairsData.current = futurePairData
    }, [futurePairData])

    useEffect(() => {
        PositionDetails.current = positionDetails
    }, [positionDetails])

    useEffect(() => {
        userWalletDetails.current = wallet
    }, [wallet])

    useEffect(() => {
        ConversionList.current = priceConversionList
    }, [priceConversionList])

    useEffect(() => {
        // accountId.current = userdetails.accountId
        Userdetails.current = userdetails
    }, [userdetails])

    useEffect(() => {
        Underlyingdetails.current = underlyingDetails
    }, [underlyingDetails])

    useEffect(() => {
        optioncontract.current = optionContractData
    }, [optionContractData])


    useEffect(() => {
        optionticker.current = optionTicker
    }, [optionTicker])

    useEffect(() => {
        if (location.pathname === '/affiliate/dashboard' && isEmpty(affiliateDetails)) {
            navigate('/affiliate');
        }
    }, [location.pathname, affiliateDetails]);

    useEffect(() => {
        fetchDerivativePairList()
        FetchPriceConversionList()
        fetchUnderlyingAssetList();
        // CopyTrade
        getAllStrategys()
        FetchFeeSettings()
        if (isAuthStatus) {
            getMyStrategys()
            fetchUserData();
            fetchInstitutionDetails()
            fetchAffilliteDetails()
        }
    }, [isAuthStatus]);

    useEffect(() => {

        socketContext.socket.on('STRATEGY_STATUS_UPDATED', () => {
            getMyStrategys()
        });

        socketContext.socket.on('USER_DETAILS', (result) => {
            if (!isEmpty(result)) {
                dispatch(UserDetails({ userdetails: result }))
            }
        });

        socketContext.socket.on('USER_BALANCE', (result) => {
            if (!isEmpty(result) && Userdetails.current.accountId == result.accountId) {
                dispatch(UserBalance({ wallet: result }))
            }
        });

        socketContext.socket.on('AFFILIATE_DETAILS', (result) => {
            if (!isEmpty(result)) {
                dispatch(AffliateDetails({ affiliateDetails: result }));
            }
        });
        socketContext.socket.on('USER_ACCOUNT_DETAILS', (result) => {
            if (!isEmpty(result)) {
                dispatch(UserSubAccountList({ subAccountList: result }))
            }
        });


        socketContext.socket.on('FORCE_LOGOUT', async () => {
            // ROOT-CAUSE FIX: the backend already scopes this event to the
            // specific user's socket room (socketEmitOne), so receiving it
            // here is sufficient on its own — the old payload/token
            // comparison predates the httpOnly-cookie auth migration and no
            // longer makes sense (the frontend has no token of its own to
            // compare against; `localStorage.getItem('token')` is always
            // empty now). Worse, that comparison (`eventToken != 'token'`)
            // caused logoutHooks() — the ONLY thing that clears the
            // server-side httpOnly auth_token cookie — to be silently
            // skipped whenever the backend emitted the literal sentinel
            // string "token" as the payload (two call sites do). That left
            // the cookie valid after a "forced" logout, so a later
            // session-rehydrate call (e.g. GlobalProvider on next page
            // load) could still succeed and resurrect the session. Always
            // clearing it here removes that gap.
            await logoutHooks();
            RemoveItemLocalStorageItem({ key: "isLoggedIn" }); // SECURITY FIX (VAPT: Points 44/49/70): raw JWT no longer stored; only clear the session hint flag
            dispatch(AccessToken({ accessToken: "" }));
            dispatch(IsAuth({ isAuth: false }));
            setTimeout(() => {
                window.location.href = `${window.location.origin}/login`;
            }, 500)
        });

        socketContext.socket.on('qr:kill', async () => {
            let getData = await logoutHooks();
            let responseData = getData?.data;
            if (responseData?.success) {
                RemoveItemLocalStorageItem({ key: "isLoggedIn" }); // SECURITY FIX (VAPT: Points 44/49/70): raw JWT no longer stored; only clear the session hint flag
                dispatch(AccessToken({ accessToken: "" }));
                dispatch(IsAuth({ isAuth: false }));
                window.location.href = `${window.location.origin}/login`;
            }
        });

        socketContext.socket.on('FututresPrice', (result) => {
            let tempPairList = [...futurePairsData.current];
            let pairIndex = tempPairList.findIndex((el => el.tickerRoot == result.tickerRoot))
            if (pairIndex != -1) {
                tempPairList[pairIndex] = { ...tempPairList[pairIndex], ...result }
                ArrangePositionOrder(result)
            }
            if (tempPairList.length > 0) {
                dispatch(FuturePairData({ pairData: tempPairList }))
                futurePairsData.current = tempPairList
            }

            // let futurespair = localStorage.getItem("futurespair");

            // if (futurespair == result.tickerRoot) {
            //     // console.log("FututresPrice_socket_datas", result)
            //     dispatch(FutureTicker({ tikerData: result }))
            // }
        })

        socketContext.socket.on('PRICE_CONVERSION_LIST', (result) => {
            let tempList = [...ConversionList.current]
            let findIndex = tempList.findIndex((el => el.pair.toString() == result.pair.toString()))
            if (findIndex != -1) {
                tempList[findIndex] = { ...tempList[findIndex], ...result }
            } else if (findIndex != -1) {
                tempList.push(result)
            }
            dispatch(PriceConversionList({ priceConversionList: tempList }))
        })

        socketContext.socket.on('FuturesPositionOrder', (result) => {
            if (result.accountId == Userdetails.current.accountId) {
                PositionDetails.current = result.data
                dispatch(UserPositionDetails({ positionDetails: result.data }))
            }
        })

        // FuturesInsuranceFundInsufficient — see its own dedicated useEffect below
        // (kept out of this block: this effect re-runs whenever Userdetails.current
        // changes and has no cleanup, so anything registered here can stack into
        // duplicate listeners over a session).

        //push notificationn ----->

        socketContext.socket.on('USER_NOTIFICATION', (result) => {
            if (!socketContext?.socket) return;
            if (result?.accountId == Userdetails.current.accountId) {
                notificationToast(result?.title, result?.message)
            }
            return () => {
                socketContext.socket.off('USER_NOTIFICATION', handleNotification);
            };
            // if (!isEmpty(result)) {
            //     dispatch(UserDetails({ userdetails: result }))
            // }
        });

        socketContext.socket.on('APIKEY_DETAILS', (result) => {
            if (!isEmpty(result)) {
                dispatch(ApiKeyList({ apikeys: result }))
            }
        });

        socketContext.socket.on('UNDER_LYING_STRESS', (result) => {
            // console.log("socket underlyingStress for future", result)
            if (!isEmpty(result)) {
                dispatch(UnderlyingStress({ underlyingStress: result }))
            }
        });

        socketContext.socket.on('UnderlyingPriceUpdate', (result) => {
            let tempPairList = [...Underlyingdetails.current];
            let pairIndex = tempPairList.findIndex((el => el.symbol == result.underlyingAsset))
            // console.log("socket underlyingStress for future", tempPairList, result, pairIndex)
            if (pairIndex != -1) {
                tempPairList[pairIndex] = { ...tempPairList[pairIndex], 'marketPrice': result?.price }
                dispatch(UnderlyingDetails({ underlyingDetails: tempPairList }))
            }
        });

        socketContext.socket.on("OptionPriceUpdate", (result) => {
            const [, , , type] = result?.tickerRoot?.split('-')
            let tempPairList = { ...optioncontract.current };
            ArrangePositionOrder(result)
            if (type == 'C') {
                let findIndex = tempPairList?.callpair?.findIndex((val) => (val?.tickerRoot == result?.tickerRoot))
                if (findIndex != -1) {
                    tempPairList.callpair[findIndex] = { ...tempPairList['callpair'][findIndex], ...result }
                    dispatch(OptionContractDetail({ optionContractData: tempPairList }))
                }
            }
            if (type == 'P') {
                let findIndex = tempPairList.putpair.findIndex((val) => (val.tickerRoot == result?.tickerRoot))
                if (findIndex != -1) {
                    tempPairList.putpair[findIndex] = { ...tempPairList['putpair'][findIndex], ...result }
                    dispatch(OptionContractDetail({ optionContractData: tempPairList }))
                }
            }

            let tempTicker = { ...optionticker.current }
            if (tempTicker.tickerRoot == result.tickerRoot) {
                tempTicker = { ...tempTicker, ...result }
                dispatch(OptionTicker({ tikerData: tempTicker }));
            }
        });

        if (Userdetails?.current?.marginMode == 'portfolio') {
            socketContext?.socket?.on('FuturesopenOrder', (result) => {
                if (!isEmpty(result)) {
                    dispatch(UserOpenOrderDetails({ openOrderDetails: result.data }))
                }
            });
        }

    }, [Userdetails.current]);

    // ─── Insurance fund gate toast (user_to_platform matching mode) ───────────
    // Separate, mount-once effect with proper cleanup, so this listener never
    // stacks into duplicates the way the block above can. Purely informational
    // — the order was NOT filled and is resting as 'open' because the platform
    // couldn't cover it right now; no redux state changes here.
    useEffect(() => {
        const handleFundInsufficient = (result) => {
            notificationToast("Order Pending", result?.message || "Platform fund not available. Your order has been opened in trade.")
        };
        socketContext.socket.on('FuturesInsuranceFundInsufficient', handleFundInsufficient);
        return () => {
            socketContext.socket.off('FuturesInsuranceFundInsufficient', handleFundInsufficient);
        };
    }, []);

    // ─── Partial insurance fund fill ───────────────────────────────────────
    // Fires when the fund could only cover PART of a new order — some of it
    // filled immediately, the rest was split off into a fresh resting order
    // that will fill automatically once the fund is topped up.
    useEffect(() => {
        const handlePartialFundFill = (result) => {
            notificationToast("Order Partially Filled", result?.message || "Part of your order filled now; the remainder is open and waiting for the fund to be topped up.")
        };
        socketContext.socket.on('FuturesPartialFundFill', handlePartialFundFill);
        return () => {
            socketContext.socket.off('FuturesPartialFundFill', handlePartialFundFill);
        };
    }, []);

    // ─── Market Depth Protection toast (user_to_platform matching mode) ──────
    // Same reasoning as the fund-insufficient effect above — separate,
    // mount-once, proper cleanup. Fires when a limit order's price deviates
    // from the live market price by more than the pair's allowed slippage.
    useEffect(() => {
        const handleSlippageExceeded = (result) => {
            notificationToast("Order Pending", result?.message || "Your order price is too far from the current market price. Your order has been opened in trade.")
        };
        socketContext.socket.on('FuturesSlippageExceeded', handleSlippageExceeded);
        return () => {
            socketContext.socket.off('FuturesSlippageExceeded', handleSlippageExceeded);
        };
    }, []);

    // ─── Maker Only orders resting ─────────────────────────────────────────
    // Fires when a maker-only order is placed but held back from filling
    // immediately, since a genuine maker order should only fill once the
    // live market price naturally moves to meet it — never right at
    // placement, even if the price is technically safe.
    useEffect(() => {
        const handleMakerOnlyResting = (result) => {
            notificationToast("Order Resting", result?.message || "Your maker-only order is resting — it will fill once the market price reaches it.")
        };
        socketContext.socket.on('FuturesMakerOnlyResting', handleMakerOnlyResting);
        return () => {
            socketContext.socket.off('FuturesMakerOnlyResting', handleMakerOnlyResting);
        };
    }, []);

    // ─── Auto-Deleveraging (ADL) position reduced ──────────────────────────
    useEffect(() => {
        const handleAdlReduced = (result) => {
            notificationToast("Position Auto-Reduced", result?.message || "One of your positions was automatically reduced due to Auto-Deleveraging.")
        };
        socketContext.socket.on('FuturesAdlReduced', handleAdlReduced);
        return () => {
            socketContext.socket.off('FuturesAdlReduced', handleAdlReduced);
        };
    }, []);

    // ─── Live refresh of options underlying/contract list ─────────────────
    // Fires when an admin adds/updates an underlying asset or option
    // contracts. Previously the underlying asset list was only fetched once
    // on mount/login (see fetchUnderlyingAssetList() below), so a newly
    // added underlying/contract wouldn't appear on an already-open Options
    // page until the user manually refreshed the browser (showing
    // undefined/NaN in the meantime). Re-fetching here keeps it live without
    // touching any existing data flow, reducer, or UI.
    useEffect(() => {
        const handleUnderlyingListUpdated = (result) => {
            fetchUnderlyingAssetList();
        };
        socketContext.socket.on('OPTION_UNDERLYING_LIST_UPDATED', handleUnderlyingListUpdated);
        return () => {
            socketContext.socket.off('OPTION_UNDERLYING_LIST_UPDATED', handleUnderlyingListUpdated);
        };
    }, []);

    // ─── Live futures pair list updates ─────────────────────────────────
    // Same idea as OPTION_UNDERLYING_LIST_UPDATED above, for futures pairs.
    // Admin adding/activating/editing a pair (AddPair/EditPair on the
    // backend) now emits FUTURE_PAIR_LIST_UPDATED — without this listener
    // an already-open Futures page (including the Coming Soon state for
    // "zero active pairs", and a pair that just got deactivated while the
    // user is actively viewing it) would only pick up the change on a
    // manual browser refresh.
    useEffect(() => {
        const handleFuturePairListUpdated = (result) => {
            fetchDerivativePairList();
        };
        socketContext.socket.on('FUTURE_PAIR_LIST_UPDATED', handleFuturePairListUpdated);
        return () => {
            socketContext.socket.off('FUTURE_PAIR_LIST_UPDATED', handleFuturePairListUpdated);
        };
    }, []);

    // ─── Retroactive leverage tier enforcement ────────────────────────────
    // Fires when an admin tightens Dynamic Leverage Tiers and an existing
    // open position of this user now exceeds the new limit. Purely a
    // notification — the position itself is untouched; the user needs to
    // manually reduce it or contact support.
    useEffect(() => {
        const handleLeverageTierViolation = (result) => {
            notificationToast("Leverage Limit Updated", result?.message || "One of your open positions now exceeds the platform's updated leverage limit.")
        };
        socketContext.socket.on('LeverageTierViolation', handleLeverageTierViolation);
        return () => {
            socketContext.socket.off('LeverageTierViolation', handleLeverageTierViolation);
        };
    }, []);

    // useEffect(() => {
    //     navigator.geolocation.getCurrentPosition(
    //         (position) => {
    //             console.log(position, "getCurrentPosition")
    //             const data = {
    //                 latitude: position.coords.latitude,
    //                 longitude: position.coords.longitude,
    //                 accuracy: position.coords.accuracy,
    //                 timestamp: new Date().toISOString()
    //             };

    //             setLocation(data);
    //             setLoading(false);

    //             // send to backend
    //             onSuccess(data);
    //         },
    //         (err) => {
    //             setLoading(false);

    //             switch (err.code) {
    //                 case err.PERMISSION_DENIED:
    //                     setError(
    //                         "Location access is mandatory for onboarding. Please enable location in your browser settings."
    //                     );
    //                     break;
    //                 case err.POSITION_UNAVAILABLE:
    //                     setError("Unable to determine your location. Please try again.");
    //                     break;
    //                 case err.TIMEOUT:
    //                     setError("Location request timed out. Please retry.");
    //                     break;
    //                 default:
    //                     setError("Something went wrong while fetching location.");
    //             }
    //         },
    //         {
    //             enableHighAccuracy: true,
    //             timeout: 10000,
    //             maximumAge: 0
    //         }
    //     );
    // }, [])

    useLayoutEffect(() => {
        document.body.setAttribute("data-theme-type", config.ENV);
    }, [])



    const getAllStrategys = async () => {
        try {
            const allStrategy = await getAllStrategy()
            if (allStrategy.data.success) {
                dispatch(allStrategies({ allStrategies: allStrategy.data.result }));
            }
        } catch (error) {
            console.log("getAllStrategys_err", error)
        }
    }

    const getMyStrategys = async () => {
        try {
            const mySStrategy = await getMyStrategy()
            if (mySStrategy.data.success) {
                dispatch(myStrategies({ myStrategies: mySStrategy.data.result }));
            }
        } catch (error) {
            console.log("getMyStrategys_err", error)
        }
    }
};


export default HelperRoute;