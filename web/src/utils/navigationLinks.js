import Images from "./Images";

export const navigationLinks = [
    {
        id: 1,
        name: "Dashboard",
        links: "/dashboard",
        img: Images.dashboard,
        activeLinks: ["/my-profile", '/add-bank'],
    },
    {
        id: 2,
        name: "Sub Account",
        links: "/sub-account",
        img: Images.subAccount,
        // activeLinks: ["/my-profile"],
    },
    {
        id: 3,
        name: "Positions",
        links: "/positions",
        img: Images.position,
        activeLinks: [],
    },
    {
        id: 4,
        name: "PNL Analytics",
        links: "/pnl-analytics",
        img: Images.pnlAnalytics,
        // activeLinks: ["/my-profile", '/add-bank'],
    },
    // {
    //     id: 5,
    //     name: "Wallet",
    //     links: "/wallet",
    //     img: Images.wallet,
    //     activeLinks: ["/deposit", "/withdraw",],
    // },
    {
        id: 51,
        name: "Deposit",
        links: "/deposit",
        img: Images.deposit,
        // activeLinks: ["/deposit", "/withdraw",],
    },
    {
        id: 52,
        name: "Withdraw",
        links: "/withdraw",
        img: Images.withdraw,
        // activeLinks: ["/deposit", "/withdraw",],
    },
    {
        id: 6,
        name: "Verification",
        links: "/verification",
        img: Images.verification,
        activeLinks: [],
    },
    {
        id: 7,
        name: "Referral",
        links: "/referral",
        img: Images.referral,
        // icon: () => <GrGroup fontSize={15} />,
        activeLinks: [],
    },
    {
        id: 8,
        name: "Security",
        links: "/security",
        img: Images.security,
        activeLinks: ["/email-management", "/number-management", "/manage-activity"],
    },
    {
        id: 9,
        name: "Trading Bot",
        links: "/trading-bot",
        img: Images.tradingBot,
    },
    {
        id: 10,
        name: "API Management",
        links: "/api-management",
        img: Images.apiManagement,
        // activeLinks: [""],
    },
    {
        id: 11,
        name: "History",
        links: "/history",
        img: Images.history,
        activeLinks: [],
    },
    // {
    //     id: 12,
    //     name: "Settings",
    //     links: "/settings",
    //     img: Images.settings,
    //     activeLinks: [],
    // },
    {
        id: 13,
        name: "Preferences",
        links: "/preferences",
        img: Images.preferencesIcon,
        activeLinks: [],
    },
    {
        id: 13,
        name: "Export",
        links: "/export",
        img: Images.exportIcon,
        activeLinks: [],
    },
];

export const institutionalLinks = [
    {
        id: 1,
        name: "Dashboard",
        links: "dashboard",
        img: Images.dashboard,
        activeLinks: [],
    },
    {
        id: 2,
        name: "Sub Account",
        links: "sub-account",
        img: Images.subAccountLogo,
        activeLinks: ["/institutional/add-sub-account"],
    },
    // {
    //     id: 3,
    //     name: "Settings",
    //     links: "user-profile",
    //     img: Images.userProfile,
    //     activeLinks: [],
    // },
    // {
    //     id: 4,
    //     name: "Risk Management",
    //     links: "risk-management",
    //     img: Images.riskManagement,
    //     activeLinks: [],
    // },
    // {
    //     id: 5,
    //     name: "Advanced Management",
    //     links: "advanced-management",
    //     img: Images.advancedManagement,
    //     activeLinks: ["/institutional/user-details"],
    // },

];

export const affiliateLinks = [
    {
        id: 1,
        name: "Dashboard",
        links: "dashboard",
        img: Images.dashboard,
        activeLinks: [],
    },
    {
        id: 3,
        name: "Reward Hub",
        links: "reward-hub",
        img: Images.userProfileAffiliateIcon,
        activeLinks: [],
    },
    // {
    //     id: 2,
    //     name: "Sub Affiliate",
    //     links: "sub-affiliate",
    //     img: Images.subAffiliateIcon,
    //     activeLinks: [],
    // },
    // {
    //     id: 3,
    //     name: "User Profile",
    //     links: "profile",
    //     img: Images.userProfileAffiliateIcon,
    //     activeLinks: [],
    // },
    // {
    //     id: 4,
    //     name: "Account Activities",
    //     links: "account-activities",
    //     img: Images.userActiveAffiliateIcon,
    //     activeLinks: [],
    // },

];

