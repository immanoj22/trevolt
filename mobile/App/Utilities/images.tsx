import React from "react";
import { Image, ImageStyle, ImageSourcePropType, StyleProp, ImageProps } from "react-native";
import { SvgProps } from "react-native-svg";

import { borderradius, windowwidth } from "./dimensions";

//svg imports
import BalanceBgImg from "../Assets/images/balance_bg.png";
import eyeIcon from "../Assets/svgicons/eyeicon.svg";
import ethIcon from "../Assets/svgicons/ethIcon.svg";
import Bottomclose from "../Assets/svgicons/back.svg";
import Future from "../Assets/svgicons/future.svg";
import Futureactive from "../Assets/svgicons/futureactive.svg";
import Home from "../Assets/svgicons/home.svg";
import Homeactive from "../Assets/svgicons/homeactive.svg";
import Portfolio from "../Assets/svgicons/portfolio.svg";
import Portfolioactive from "../Assets/svgicons/portfolioactive.svg";
import Option from "../Assets/svgicons/option.svg";
import Optionactive from "../Assets/svgicons/optionactive.svg";
import Orders from "../Assets/svgicons/orders.svg";
import Ordersactive from "../Assets/svgicons/ordersactive.svg";
import profile from "../Assets/images/user.png";
import exit from "../Assets/images/log-out.png";
import darkMode from "../Assets/images/dark-mode.png";
import preference from "../Assets/images/preference.png";
import trading from "../Assets/images/dispute.png";
import refer from "../Assets/images/refer.png";
import bank from "../Assets/images/banking.png";
import analytics from "../Assets/images/analytics.png";
import sub from "../Assets/images/google.png";
import security from "../Assets/images/shield.png";
import moneytransfer from "../Assets/images/money-transfer.png";
import pen from "../Assets/svgicons/pen.svg";
import penDark from "../Assets/svgicons/penDark.svg";
import Referearn from "../Assets/svgicons/refer_earn.svg";
import badge from "../Assets/images/badge.png";
import customerservice from "../Assets/images/customer-service.png"
import demo from "../Assets/images/demo.png";
import gear from "../Assets/images/gear.png";
import youtube from "../Assets/images/youtube.png";
import book from "../Assets/images/book.png"
import onrampPay from "../Assets/images/onrampPay.png";
import upiPay from "../Assets/images/upiPay.png";
import Copyicon from "../Assets/svgicons/copyicon.svg";
import Phonepay from "../Assets/images/phonepay.png";
import Menuprofile from "../Assets/svgicons/profile.svg";
import Addmoney from "../Assets/svgicons/addmoney.svg";
import Optionhome from "../Assets/svgicons/optionhome.svg";
import Futurehome from "../Assets/svgicons/futurehome.svg";
import Markethome from "../Assets/svgicons/market.svg";
import Copyhome from "../Assets/svgicons/copy.svg";
import Menuprofilelight from "../Assets/svgicons/profile light.svg";
import Addmoneylight from "../Assets/svgicons/addmoneylight.svg";
import Homelight from "../Assets/svgicons/homelight.svg";
import HomelightActive from "../Assets/svgicons/homelightactive.svg";
import Futurelight from "../Assets/svgicons/futurelight.svg";
import FuturelightActive from "../Assets/svgicons/futurelightactive.svg";
import Portfoliolight from "../Assets/svgicons/portfoliolight.svg";
import PortfoliolightActive from "../Assets/svgicons/portfoliolightactive.svg";
import Optionlight from "../Assets/svgicons/optionlight.svg";
import OptionlightActive from "../Assets/svgicons/optionlightactive.svg";
import Orderslight from "../Assets/svgicons/orderslight.svg";
import OrderslightActive from "../Assets/svgicons/orderslightactive.svg";
import Analyzes from "../Assets/svgicons/Analyze.svg";
import Dollarsymbol from "../Assets/svgicons/dollarsymbol.svg";
import Analyze from "../Assets/svgicons/Analyze.svg";
import Btcicon from "../Assets/images/bitcoin.png";
import Dollerbag from "../Assets/svgicons/dollerbag.svg";
import DollerbagLight from "../Assets/svgicons/dollerbagLight.svg";
import Graph from "../Assets/svgicons/graph.svg";
import TrashLight from "../Assets/svgicons/trashLight.svg";
import TrashDark from "../Assets/svgicons/trashDark.svg";
import Bottomclosedark from "../Assets/svgicons/backDark.svg";
import Star from "../Assets/svgicons/star.svg";
import Orderbook from "../Assets/svgicons/orderbook.svg";
import defaultOrder from "../Assets/svgicons/defaultOrder.svg";
import sellOrder from "../Assets/svgicons/sellOrder.svg";
import buyOrder from "../Assets/svgicons/buyOrder.svg";
import Crown from "../Assets/svgicons/crown.svg";
import Members from "../Assets/svgicons/members.svg";
import Heart from "../Assets/svgicons/heart.svg";
import darkUser from "../Assets/svgicons/darkUser.svg";
import Ethereum from "../Assets/images/ethereum.png";

import Reward1 from "../Assets/images/rewardCardBg1.png";
import Reward2 from "../Assets/svgicons/rewardCardBg2.svg";
import Reward3 from "../Assets/svgicons/rewardCardBg3.svg";
import RewardIcon from "../Assets/svgicons/rewardIcon.svg";
import Earning from "../Assets/svgicons/earningIcon.svg";

import Logo from "../Assets/svgicons/logo.svg";
import Profit from "../Assets/svgicons/profitBg.svg";
import Loss from "../Assets/svgicons/loss.svg";
import TimerIcon from "../Assets/svgicons/timerIcon.svg";

import FaceBook from "../Assets/svgicons/facebook.svg";
import Insta from "../Assets/svgicons/insta.svg";
import Linkedin from "../Assets/svgicons/linkedin.svg";
import Message from "../Assets/svgicons/members.svg";
import Telegram from "../Assets/svgicons/telegram.svg";
import Twitter from "../Assets/svgicons/twitter.svg";
import whatsapp from "../Assets/svgicons/whatsapp.svg"
import Output from "../Assets/svgicons/output.svg";
import OutputWhite from "../Assets/svgicons/outputWite.svg";
import Copier from "../Assets/svgicons/copier.svg";


import AddWhite from "../Assets/svgicons/addWhite.svg";
import AddBlack from "../Assets/svgicons/addBlack.svg";
import GetWhite from "../Assets/svgicons/getWhite.svg";
import GetBlack from "../Assets/svgicons/getBlack.svg";

//pngs
import Card from "../Assets/images/card.png";
import CardLight from "../Assets/images/cardLight.png";
import Bannner1 from "../Assets/images/banner1.png";
import Normaltrade from "../Assets/images/normaltrade.png";
import Sei from "../Assets/images/sei.png";
import Fun from "../Assets/images/fun.png";
import Banner2 from "../Assets/images/banner2.png";
import Chartlight from "../Assets/images/lightchart.png";
import Man from '../Assets/images/man.png'
import google from '../Assets/images/gl.png'
import affiliate from "../Assets/images/affiliate.png";
import discord from "../Assets/images/discord.png";
import Facebook from "../Assets/images/Facebook.png";
import telegram from "../Assets/images/telegram.png";
import twich from "../Assets/images/twich.png";
import twitter from "../Assets/images/twitter.png";
import youtubes from "../Assets/images/youtubes.png";
import Inta from "../Assets/images/instagram.png";
import EmptyUser from "../Assets/svgicons/emptyUser.svg";
import NOdataLight from "../Assets/svgicons/noDataWhite.svg";
import NOdataDark from "../Assets/svgicons/noDataDark.svg";
import AppleDark from "../Assets/images/appleDark.png";
import AppleLight from "../Assets/images/appleLight.png";

import WebHook from "../Assets/images/webhook.png";
import Export from "../Assets/images/export.png";
import BNB from "../Assets/images/bnb.png";
import XRP from "../Assets/images/xrp.png";
import verifys from "../Assets/images/verifys.png";

import Telephone from "../Assets/images/telephone.png";
import Selfie from "../Assets/images/selfie.png";
import Identity from "../Assets/images/identity.png";
import Idcard from "../Assets/images/idcard.png";
import Group from "../Assets/images/group.png";
import PAN from "../Assets/images/pan.png";
import SBI from '../Assets/images/sbi.png'
import UPI from '../Assets/images/upi.svg'

import TabHome from "../Assets/images/tab-home.png";
import TabMarket from "../Assets/images/tab-market.png";
import TabPortfolio from "../Assets/images/tab-portfolio.png";
import TabOption from "../Assets/images/tab-option.png";
import TabOrders from "../Assets/images/tab-orders.png";
import AlgoNew from "../Assets/svgicons/algoNew.svg";
import ChartNew from "../Assets/svgicons/chartNew.svg";
import CopyNew from "../Assets/svgicons/copyNew.svg";
import DemoNew from "../Assets/svgicons/demoNew.svg";
import EmptyCard from "../Assets/images/emptyCard.png";
import EmptyCardLight from "../Assets/images/emptyCardLight.png";
import Deposit from "../Assets/svgicons/deposit.svg";
import Withdrawal from "../Assets/svgicons/withdrawal.svg";
import Eye from "../Assets/svgicons/eye.svg";
import EyeCross from "../Assets/svgicons/eyeCross.svg";
import Announcement from "../Assets/svgicons/announcement.svg";
import NoFees from "../Assets/svgicons/noFees.svg";
import Logout from "../Assets/svgicons/logoutIcon.svg";

// sidebar icons
import MyAccount from "../Assets/svgicons/sidebaricons/myAccount.svg";
import MyAccountLight from "../Assets/svgicons/sidebaricons/myAccountLight.svg";
import Theme from "../Assets/svgicons/sidebaricons/theme.svg";
import ThemeLight from "../Assets/svgicons/sidebaricons/themeLight.svg";
import Verification from "../Assets/svgicons/sidebaricons/verification.svg";
import VerificationLight from "../Assets/svgicons/sidebaricons/verificationLight.svg";
import Preference from "../Assets/svgicons/sidebaricons/preference.svg";
import PreferenceLight from "../Assets/svgicons/sidebaricons/preferenceLight.svg";
import AlgoTrading from "../Assets/svgicons/sidebaricons/algoTrading.svg";
import AlgoTradingLight from "../Assets/svgicons/sidebaricons/algoTradingLight.svg";
import Refer from "../Assets/svgicons/sidebaricons/refer.svg";
import ReferLight from "../Assets/svgicons/sidebaricons/referLight.svg";
import BankDetails from "../Assets/svgicons/sidebaricons/bankDetails.svg";
import BankDetailsLight from "../Assets/svgicons/sidebaricons/bankDetailsLight.svg";
import Pnl from "../Assets/svgicons/sidebaricons/pnl.svg";
import PnlLight from "../Assets/svgicons/sidebaricons/pnlLight.svg";
import Transaction from "../Assets/svgicons/sidebaricons/transaction.svg";
import TransactionLight from "../Assets/svgicons/sidebaricons/transactionLight.svg";
import SubAccount from "../Assets/svgicons/sidebaricons/subAccount.svg";
import SubAccountLight from "../Assets/svgicons/sidebaricons/subAccountLight.svg";
import Security from "../Assets/svgicons/sidebaricons/security.svg";
import SecurityLight from "../Assets/svgicons/sidebaricons/securityLight.svg";
import Api from "../Assets/svgicons/sidebaricons/api.svg";
import ApiLight from "../Assets/svgicons/sidebaricons/apiLight.svg";
import Support from "../Assets/svgicons/sidebaricons/support.svg";
import SupportLight from "../Assets/svgicons/sidebaricons/supportLight.svg";
import Features from "../Assets/svgicons/sidebaricons/features.svg";
import FeaturesLight from "../Assets/svgicons/sidebaricons/featuresLight.svg";
import Affiliate from "../Assets/svgicons/sidebaricons/affiliate.svg";
import AffiliateLight from "../Assets/svgicons/sidebaricons/affiliateLight.svg";
import ExportSide from "../Assets/svgicons/sidebaricons/export.svg";
import ExportSideLight from "../Assets/svgicons/sidebaricons/exportLight.svg";

// bottom icons
import BottomHome from "../Assets/svgicons/bottomicons/bottom-home.svg";
import BottomMarket from "../Assets/svgicons/bottomicons/bottom-market.svg";
import BottomOptions from "../Assets/svgicons/bottomicons/bottom-options.svg";
import BottomOrders from "../Assets/svgicons/bottomicons/bottom-orders.svg";
import BottomPortfolio from "../Assets/svgicons/bottomicons/bottom-portfolio.svg";

import ChartTabIcon from "../Assets/svgicons/chartTabIcon.svg";
import ChartTabWhiteIcon from "../Assets/svgicons/chartTabWhiteIcon.svg";
import ChartTabIconLight from "../Assets/svgicons/chartTabIconLight.svg";
import TelephoneIcon from "../Assets/svgicons/telephoneSvg.svg";
import IdCardIcon from "../Assets/svgicons/idcardSvg.svg";
import IdentityIcon from "../Assets/svgicons/identitySvg.svg";
import SelfieIcon from "../Assets/svgicons/selfieSvg.svg";
import TelephoneIconLight from "../Assets/svgicons/telephoneSvgLight.svg";
import IdCardIconLight from "../Assets/svgicons/idcardSvgLight.svg";
import IdentityIconLight from "../Assets/svgicons/identitySvgLight.svg";
import SelfieIconLight from "../Assets/svgicons/selfieSvgLight.svg";
import Megaphone from "../Assets/svgicons/megaphone.svg";
import YoutubeIcon from "../Assets/svgicons/youtube.svg";
import MegaphoneLight from "../Assets/svgicons/megaphoneLight.svg";
import YoutubeIconLight from "../Assets/svgicons/youtubeLight.svg";

export const icons = {
    BalanceBg_Img: BalanceBgImg,
    EyeIcon: eyeIcon,
    EthIcon: ethIcon,
    Bottomclose: Bottomclose,
    Future: Future,
    Futureactive: Futureactive,
    Home: Home,
    Homeactive: Homeactive,
    Portfolio: Portfolio,
    Portfolioactive: Portfolioactive,
    Option: Option,
    Optionactive: Optionactive,
    Orders: Orders,
    Ordersactive: Ordersactive,
    Profile: profile,
    Exit: exit,
    DarkMode: darkMode,
    Preference: preference,
    Trading: trading,
    Refer: refer,
    Bank: bank,
    Analytics: analytics,
    SubAccount: sub,
    Security: security,
    Moneytransfer: moneytransfer,
    Pen: pen,
    PenDark: penDark,
    ReferEarn: Referearn,
    Badge: badge,
    CustomerService: customerservice,
    Demo: demo,
    Gear: gear,
    Youtube: youtube,
    Book: book,
    OnrampPay: onrampPay,
    UpiPay: upiPay,
    Menuprofile: Menuprofile,
    Copyicon: Copyicon,
    Phonepay: Phonepay,
    Addmoney: Addmoney,
    Optionhome: Optionhome,
    Futurehome: Futurehome,
    Markethome: Markethome,
    Copyhome: Copyhome,
    Menuprofilelight: Menuprofilelight,
    Addmoneylight: Addmoneylight,
    Homelight: Homelight,
    HomelightActive: HomelightActive,
    Futurelight: Futurelight,
    FuturelightActive: FuturelightActive,
    Portfoliolight: Portfoliolight,
    PortfoliolightActive: PortfoliolightActive,
    Optionlight: Optionlight,
    OptionlightActive: OptionlightActive,
    Orderslight: Orderslight,
    OrderslightActive: OrderslightActive,
    Analyzes: Analyzes,
    TrashLight: TrashLight,
    TrashDark: TrashDark,
    Bottomclosedark: Bottomclosedark,
    Dollarsymbol: Dollarsymbol,
    Analyze: Analyze,
    Dollerbag: Dollerbag,
    DollerbagLight: DollerbagLight,
    Graph: Graph,
    Star: Star,
    Orderbook: Orderbook,
    defaultOrder: defaultOrder,
    sellOrder: sellOrder,
    buyOrder: buyOrder,
    Crown: Crown,
    Members: Members,
    Heart: Heart,
    DarkUser: darkUser,
    EmptyUser: EmptyUser,
    NOdataLight: NOdataLight,
    NOdataDark: NOdataDark,
    Logo: Logo,
    Profit: Profit,
    Loss: Loss,
    WebHook: WebHook,
    Export: Export,
    Reward1: Reward1,
    Reward2: Reward2,
    Reward3: Reward3,
    Earning: Earning,
    RewardIcon: RewardIcon,
    TimerIcon: TimerIcon,
    FaceBook: FaceBook,
    Insta: Insta,
    Linkedin: Linkedin,
    Message: Message,
    Telegram: Telegram,
    Twitter: Twitter,
    whatsapp: whatsapp,
    Output: Output,
    OutputWhite: OutputWhite,
    Copier: Copier,
    AddWhite: AddWhite,
    AddBlack: AddBlack,
    GetWhite: GetWhite,
    GetBlack: GetBlack,
    verifys: verifys,
    Telephone: Telephone,
    Selfie: Selfie,
    Identity: Identity,
    Idcard: Idcard,
    Group: Group,
    AppleDark: AppleDark,
    AppleLight: AppleLight,
    PAN: PAN,
    SBI: SBI,
    UPI: UPI,
    AlgoNew: AlgoNew,
    ChartNew: ChartNew,
    CopyNew: CopyNew,
    DemoNew: DemoNew,
    Deposit: Deposit,
    Withdrawal: Withdrawal,
    Eye: Eye,
    EyeCross: EyeCross,
    Announcement: Announcement,
    NoFees: NoFees,
    Logout: Logout,

    // sidebar icons 
    MyAccount: MyAccount,
    MyAccountLight: MyAccountLight,
    Theme: Theme,
    ThemeLight: ThemeLight,
    Verification: Verification,
    VerificationLight: VerificationLight,
    PreferenceSide: Preference,
    PreferenceSideLight: PreferenceLight,
    AlgoTrading: AlgoTrading,
    AlgoTradingLight: AlgoTradingLight,
    ReferSide: Refer,
    ReferSideLight: ReferLight,
    BankDetails: BankDetails,
    BankDetailsLight: BankDetailsLight,
    Pnl: Pnl,
    PnlLight: PnlLight,
    Transaction: Transaction,
    TransactionLight: TransactionLight,
    SubAccountSide: SubAccount,
    SubAccountSideLight: SubAccountLight,
    SecuritySide: Security,
    SecuritySideLight: SecurityLight,
    Api: Api,
    ApiLight: ApiLight,
    Support: Support,
    SupportLight: SupportLight,
    Features: Features,
    FeaturesLight: FeaturesLight,
    AffiliateSide: Affiliate,
    AffiliateSideLight: AffiliateLight,
    ExportSide: ExportSide,
    ExportSideLight: ExportSideLight,

    // bottom icons
    BottomHome: BottomHome,
    BottomMarket: BottomMarket,
    BottomOptions: BottomOptions,
    BottomOrders: BottomOrders,
    BottomPortfolio: BottomPortfolio,

    ChartTabIcon: ChartTabIcon,
    ChartTabWhiteIcon: ChartTabWhiteIcon,
    ChartTabIconLight: ChartTabIconLight,
    TelephoneIcon: TelephoneIcon,
    IdCardIcon: IdCardIcon,
    IdentityIcon: IdentityIcon,
    SelfieIcon: SelfieIcon,
    TelephoneIconLight: TelephoneIconLight,
    IdCardIconLight: IdCardIconLight,
    IdentityIconLight: IdentityIconLight,
    SelfieIconLight: SelfieIconLight,
    Megaphone: Megaphone,
    YoutubeIcon: YoutubeIcon,
    MegaphoneLight: MegaphoneLight,
    YoutubeIconLight: YoutubeIconLight,
};

//export pngs
export const image = {
    card: Card,
    cardLight: CardLight,
    Bannner1: Bannner1,
    Normaltrade: Normaltrade,
    Sei: Sei,
    Fun: Fun,
    Banner2: Banner2,
    Btcicon: Btcicon,
    Chartlight: Chartlight,
    Man: Man,
    google: google,
    Affiliate: affiliate,
    Discord: discord,
    Facebook: Facebook,
    Telegram: telegram,
    Twich: twich,
    Twitter: twitter,
    Youtubes: youtubes,
    Inta: Inta,
    ETHICon: Ethereum,
    Export: Export,
    BNB: BNB,
    XRP: XRP,
    TabHome: TabHome,
    TabMarket: TabMarket,
    TabPortfolio: TabPortfolio,
    TabOption: TabOption,
    TabOrders: TabOrders,
    EmptyCard: EmptyCard,
    EmptyCardLight: EmptyCardLight
}

type name =
    | "Addmoney"
    | "Addmoneylight"
    | "BalanceBg_Img"
    | "Bank"
    | "Bottomclose"
    | "Copyhome"
    | "Copyicon"
    | "EthIcon"
    | "EyeIcon"
    | "Future"
    | "Futureactive"
    | "Futurehome"
    | "Futurelight"
    | "FuturelightActive"
    | "Home"
    | "Homeactive"
    | "Homelight"
    | "HomelightActive"
    | "Markethome"
    | "Menuprofile"
    | "Menuprofilelight"
    | "OnrampPay"
    | "Option"
    | "Optionactive"
    | "Optionhome"
    | "Optionlight"
    | "OptionlightActive"
    | "Orders"
    | "Ordersactive"
    | "Orderslight"
    | "OrderslightActive"
    | "Pen"
    | "PenDark"
    | "Phonepay"
    | "Portfolio"
    | "Portfolioactive"
    | "Portfoliolight"
    | "PortfoliolightActive"
    | "ReferEarn"
    | "UpiPay"
    | "Dollarsymbol"
    | "Dollerbag"
    | "DollerbagLight"
    | "Graph"
    | "Analyze"
    | "TrashLight"
    | "TrashDark"
    | "Bottomclosedark"
    | "Dollarsymbol"
    | "Star"
    | "Orderbook"
    | "defaultOrder"
    | "sellOrder"
    | "buyOrder"
    | "Crown"
    | "Members"
    | "Heart"
    | "DarkUser"
    | "EmptyUser"
    | "NOdataLight"
    | "NOdataDark"
    | "Logo"
    | "Profit"
    | "Loss"
    | "WebHook"
    | "Export"
    | "Reward1"
    | "Reward2"
    | "Reward3"
    | "Earning"
    | "RewardIcon"
    | "TimerIcon"
    | "Twitter"
    | "FaceBook"
    | "whatsapp"
    | "Telegram"
    | "Linkedin"
    | "Insta"
    | "Output"
    | "OutputWhite"
    | "Copier"
    | "AddWhite"
    | "AddBlack"
    | "GetBlack"
    | "GetWhite"
    | "SBI"
    | "UPI"
    | "AlgoNew"
    | "ChartNew"
    | "CopyNew"
    | "DemoNew"
    | "Deposit"
    | "Withdrawal"
    | "Eye"
    | "EyeCross"
    | "Announcement"
    | "NoFees"
    | "Logout"
    | "BottomHome"
    | "BottomMarket"
    | "BottomOptions"
    | "BottomOrders"
    | "BottomPortfolio"
    | "ChartTabIcon"
    | "ChartTabWhiteIcon"
    | "ChartTabIconLight"
    | "TelephoneIcon"
    | "IdCardIcon"
    | "IdentityIcon"
    | "SelfieIcon"
    | "TelephoneIconLight"
    | "IdCardIconLight"
    | "IdentityIconLight"
    | "SelfieIconLight"
    | "Megaphone"
    | "YoutubeIcon"
    | "MegaphoneLight"
    | "YoutubeIconLight"

interface ImageProp {
    width?: any;
    height?: any;
    borderRadius?: any;
    resizeMode?: "center" | "contain" | "cover" | "none" | "repeat" | "stretch";
    style?: StyleProp<ImageStyle>;
    source?: ImageSourcePropType;
    props?: ImageProps,
    type: "svg" | "image",
    name?: name,
    fill?: string,
    svgprops?: SvgProps
}

export default function Images({
    width = windowwidth * 0.1,
    height = windowwidth * 0.1,
    borderRadius = borderradius * 1,
    resizeMode = "contain",
    style,
    source,
    type = "image",
    name,
    props,
    fill,
    svgprops
}: ImageProp) {
    if (type == "image" && source) {
        return (
            <Image
                source={source}
                resizeMode={resizeMode}
                style={[{ width: width, height: height, borderRadius: borderRadius, tintColor: fill }, style]}
                {...props}
            />
        );
    }
    if (type == "svg" && name) {
        const Component = icons?.[name];
        return <Component
            width={width}
            height={height}
            style={style}
            {...svgprops}
        />;
    }
}

export const Lotties = {
    scanqr: require("../Assets/lotties/scan.json"),
    internet: require("../Assets/lotties/internet.json"),
    docscanning: require("../Assets/lotties/docscanning.json"),
    face: require("../Assets/lotties/face.json"),
    verified: require("../Assets/lotties/verified.json"),
    loader: require("../Assets/lotties/loader.json")
}