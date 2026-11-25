export type Stacknavigationtypes = {
    Test: undefined,
    Login: undefined,
    Signup: undefined,
    OTP: undefined,
    AddMoneyHome: undefined,
    Profile: undefined,
    MyAccount: undefined,
    Dashboard: undefined,
    Deposit: undefined,
    AccountEdit: undefined,
    Preference: undefined,
    Pushnotification: undefined,
    Currency: undefined,
    ConfirmMessage: undefined,
    ColorPreference: undefined,
    CreateWebhook: undefined,
    WebhookVerification: { url: any },
    Webhook2FA: undefined,
    Reference: undefined,
    BankDetails: undefined,
    Support: undefined,
    Features: undefined,
    APIKeys: undefined,
    CreateAPIKey: undefined,
    Security: undefined,
    TwoFactor: undefined,
    Email: undefined
    AddBankDetail: undefined,
    UPIList: undefined,
    AddUPIDetails: undefined,
    Notification: { notificationId?: string } | undefined,
    QRcodeScanner: undefined,
    AccountActivity: undefined,
    PhoneNumber: undefined,
    ChangeNumber: undefined,
    SubAccount: { pageName: any },
    SubAccountCreate: undefined,
    SubAccountDetails: undefined,
    TransactionLogs: undefined,
    PnlAnalytics: undefined
    StrategyBuilder: undefined
    StrategyAddContracts: undefined
    StrategyAnalyze: {
        // Optional override so this screen can be opened for an arbitrary set of
        // positions (e.g. from the Positions tab's own Payoff button), not just the
        // Strategy Builder's own leg list. When omitted, falls back to redux
        // (optionTradeSelector's strategyContracts), same as before.
        contracts?: any[],
        positions?: any[],
        currentPrice?: number,
        baseCurrency?: string,
        multiplier?: number,
        onCloseSelected?: (positions: any[]) => void
    } | undefined
    KYCVerification: undefined,
    KYCPicture: undefined,
    UnderReview: undefined,
    Withdraw: undefined,
    DepositDetails: undefined
    MasterTrader: undefined
    Market: { tab?: 'Watchlist' | 'Futures' | 'Options' } | undefined,
    Buysell: {
        pageName: any,
        screen?: any,
        data?: any
    }
    Copytrade: undefined,
    Tradepairs: {
        type?: any
        data?: any
    },
    Tradedetail: {
        type: any
        data?: any
    },
    Seeall: {
        type: string,
        data?: any
    }
    ForgotPassword: undefined
    ForgotPass: undefined,
    TwoFactorAuth: undefined,
    UpdateName: undefined,
    UpdatePassword: undefined,
    UpdateEmail: undefined,
    RegisterNumber: undefined,
    SubAccountManage: { account: any }
    TransferFunds: undefined,
    AffiliateRegister: undefined,
    Overview: undefined,
    RecoveryUser: undefined,
    Referaldashboard: undefined
    EditAPIKey: undefined,
    ExportData: { type: any },
    Cmspage: { name: any },
    PnlAnalyticsOverview: undefined,
    GetCopierDetails: undefined,
    NoInternet: undefined,
    Verification: {
        popup?: any
    },
    PanCardStatus: undefined,
    Selfie: undefined,
    PanDetails: undefined,
    AdditionalDetails: undefined,
    DisplayName: undefined,
    Future:undefined
    FullViewChart: { ticker?: string } | undefined
}

export type BottomTabParamList = {
    Home: undefined
    Market: { tab?: 'Watchlist' | 'Futures' | 'Options' } | undefined
    Option: undefined
    Orders: undefined
    Chart: undefined
    Portfolio: undefined
    AddMoneyHome: undefined,
}
