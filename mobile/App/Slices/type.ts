export interface authState {
    isloading?: Boolean;
    isAuth?: Boolean;
    authToken?: string;
    userData?: any;
    deviceinfo?: {
        deviceId?: String,
        deviceName?: String,
        fcmtoken?: String
    };
    affiliateData?: any,
    leverage?: any,
    panDetails?: any
}

export interface walletState {
    isloading?: Boolean;
    getcurrencies?: any;
    pricedetails?: any;
    wallet?: any;
}

export interface subAccountState {
    isloading?: Boolean;
    subaccounts?: any
}

export interface affiliateState {
    isloading?: Boolean;
}

export interface futureState {
    isloading?: Boolean;
    futurePairData?: any;
    // Flips to true the first time setFuturePairData runs (whether the API returned
    // pairs or not / even on failure - see triggerPairDetails). Lets screens tell
    // "still loading" apart from "loaded, but this pair genuinely has no futures
    // market" - both look like an empty/missing match against futurePairData
    // otherwise. Mirrors web's futurePairDataLoaded (redux/futureAction.js).
    futurePairDataLoaded?: boolean;
    // Live price fields keyed by tickerRoot ({ BTCUSDT: { marketPrice, last, change, ... } }).
    // Market-list rows subscribe to their own ticker here, so a price tick re-renders
    // one row instead of the whole list. Populated from setFuturePairData (initial
    // load) + setLivePrices (socket ticks).
    livePrices?: Record<string, any>;
    futureTicker?: any;
    futureTradePair?: any;
    positionDetails?: any;
    cancelOrdersList?: any;
    cancelType?: any,
    pairsList?: any,
    openOrderDetails?: any;
    underlyingStress?: any;
    riskAndMarginDetails?: any;
    makerFee: number;
    takerFee: number;
    liquiFee: number;
}

export interface feeState {
    isloading?: Boolean;
    feeSettingsList?: [];
}

export interface apiKeyActionState {
    isloading?: Boolean;
    apiList?: any
}

export interface cmsActionsState {
    isloading?: Boolean
}

export interface copyActionState {
    isloading?: Boolean
    myStrategy?: any
    allStrategy?: any
}

export interface optionActionState {
    isloading?: Boolean
    pairlist?: any
    callslist?: any
    putslist?: any
    options?: any
    contracts?: any
    underlyingPrice?: any
    makerFee?: any
    takerFee?: any
    premiumPercentage?: any
    strategyContracts?: any
    strategyMultiplier?: any
}