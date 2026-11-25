import React, { useContext, useEffect } from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { useDispatch, useSelector } from "react-redux";

import Bottomtab from "./bottomtab";
import { authSelector } from "../Slices/auth";
import ThemeContext from "../Utilities/themecontext";
import { helperSelector, update_sessonstatus } from "../Slices/helper";
import { Stacknavigationtypes } from "./navigationtypes";
import useCustomHooks, { Deviceinfo } from "../Actions/Hooks/customhook";
import { getItem } from "../Actions/Storage/localstorage";
import { MyTransition } from "../Utilities/navigationslide";

import OTP from "../Screens/Auth/OTP";
import Login from "../Screens/Auth/Login";
import Signup from "../Screens/Auth/Signup";
import ForgotPass from "../Screens/Auth/ForgotPass";
import TwoFactorAuth from "../Screens/Auth/TwoFactorAuth";
import ForgotPassword from "../Screens/Auth/ForgotPassword";

import UPIList from "../Screens/AddMoney/UPIList";
import Deposit from "../Screens/AddMoney/Deposit";
import Withdraw from "../Screens/AddMoney/Withdraw";
import AddMoneyHome from "../Screens/AddMoney/AddmoneyHome";
import AddUPIDetails from "../Screens/AddMoney/AddUPIDetails";
import AddBankDetail from "../Screens/AddMoney/AddBankDetail";
import DepositDetails from "../Screens/AddMoney/DepositDetails";

import Copytrade from "../Screens/Copy";
import Tradepairs from "../Screens/Copy/Setup";
import Tradedetail from "../Screens/Copy/Detail";
import GetCopierDetails from "../Screens/Copy/Copier";
import MasterTrader from "../Screens/Copy/BecomeTrade";

import Webhook2FA from "../Screens/Profile/AlgoTrading/Webhook2FA";
import CreateWebhook from "../Screens/Profile/AlgoTrading/CreateWebhook";
import WebhookVerification from "../Screens/Profile/AlgoTrading/WebhookVerification";

import Preference from "../Screens/Profile/Preference";
import Currency from "../Screens/Profile/Preference/Currency";
import ConfirmMessage from "../Screens/Profile/Preference/ConfirmMessage";
import ColorPreference from "../Screens/Profile/Preference/ColorPreference";
import Pushnotification from "../Screens/Profile/Preference/Pushnotification";

import Support from "../Screens/Profile/Others/Support";
import Features from "../Screens/Profile/Others/Features";
import Reference from "../Screens/Profile/Others/Reference";
import UpdateName from "../Screens/Profile/Others/UpdateName";
import ExportData from "../Screens/Profile/Others/ExportData";
import UpdateEmail from "../Screens/Profile/Others/UpdateEmail";
import BankDetails from "../Screens/Profile/Others/BankDetails";
import UpdatePassword from "../Screens/Profile/Others/UpdatePassword";
import Referaldashboard from "../Screens/Profile/Others/Referaldashboard";

import SubAccount from "../Screens/Profile/SubAccount";
import SubAccountCreate from "../Screens/Profile/SubAccount/Create";
import SubAccountManage from "../Screens/Profile/SubAccount/Manage";
import SubAccountDetails from "../Screens/Profile/SubAccount/Details";
import TransferFunds from "../Screens/Profile/SubAccount/TransferFunds";

import Security from "../Screens/Profile/Security";
import Email from "../Screens/Profile/Security/Email";
import TwoFactor from "../Screens/Profile/Security/2FA";
import PhoneNumber from "../Screens/Profile/Security/PhoneNumber";
import ChangeNumber from "../Screens/Profile/Security/ChangeNumber";
import RegisterNumber from "../Screens/Profile/Security/RegisterNumber";
import AccountActivity from "../Screens/Profile/Security/AccountActivity";

import MyAccount from "../Screens/Profile/MyAccount";
import AccountEdit from "../Screens/Profile/MyAccount/Edit";
import KYCPicture from "../Screens/Profile/MyAccount/KYC/KYCPicture";
import UnderReview from "../Screens/Profile/MyAccount/KYC/UnderReview";
import KYCVerification from "../Screens/Profile/MyAccount/KYC/KYCVerification";

import Test from "../Screens/test";
import Cmspage from "../Screens/Cmspages";
import Seeall from "../Screens/Home/seall";
import Market from "../Screens/Market/market";
import NoInternet from "../Screens/NoInternet";
import Buysell from "../Screens/Buysell/buysell";
import Overview from "../Screens/Affiliate/Overview";
import StrategyBuilder from "../Screens/Option/StrategyBuilder";
import StrategyAddContracts from "../Screens/Option/StrategyBuilder/AddContracts";
import StrategyAnalyze from "../Screens/Option/StrategyBuilder/Analyze";
import AffiliateRegister from "../Screens/Affiliate/Register";
import QRcodeScanner from "../Screens/Qrscanner/QRcodeScanner";
import Notification from "../Screens/Nofitication/Notification";

import APIKeys from "../Screens/Profile/APIKeys";
import EditAPIKey from "../Screens/Profile/APIKeys/EditApi";
import CreateAPIKey from "../Screens/Profile/APIKeys/Create";

import PnlAnalytics from "../Screens/Profile/PnLAnalytics/PnlAnalytics";
import PnlAnalyticsOverview from "../Screens/Profile/PnLAnalytics/Overview";

import Profile from "../Screens/Profile";
import TransactionLogs from "../Screens/Profile/TransactionLogs/Transactionlogs";
import Verification from "../Screens/Profile/Verification";
import PanCardStatus from "../Screens/Profile/Verification/PanCardStatus";
import Selfie from "../Screens/Profile/Verification/SelfieVerification";
import PanDetails from "../Screens/Profile/Verification/PanDetails";
import AdditionalDetails from "../Screens/Profile/Verification/AdditionalDetails";
import DisplayName from "../Screens/Profile/MyAccount/DisplayName";
import HelperScreen from "../Components/HelperComponent";
import Future from "../Screens/FutureNew/future";
import FullViewChart from "../Screens/Chart/chart";

const Stack = createNativeStackNavigator<Stacknavigationtypes>();

export const Authstack: React.FC = () => {
    const theme = useContext(ThemeContext);
    return (
        <Stack.Navigator
            screenOptions={{ ...MyTransition, contentStyle: { backgroundColor: theme.background } }}
            initialRouteName={'Login'} >
            <Stack.Group>
                <Stack.Screen name={"Login"} component={Login} />
                <Stack.Screen name={"Signup"} component={Signup} />
                <Stack.Screen name={"OTP"} component={OTP} />
                <Stack.Screen name={"ForgotPassword"} component={ForgotPassword} />
                <Stack.Screen name={"ForgotPass"} component={ForgotPass} />
                <Stack.Screen name={"TwoFactorAuth"} component={TwoFactorAuth} />
                <Stack.Screen name={'Seeall'} component={Seeall} />
                <Stack.Screen name={"NoInternet"} component={NoInternet} />
                {/* This pre-login stack and the authenticated one below it are two
                    separate sibling navigators, not nested - Cmspage was only registered
                    in the authenticated one, so Login/Signup's "Terms of Service"/
                    "Privacy Policy" links (which navigate before the user is signed in)
                    always hit "was not handled by any navigator", regardless of the
                    Text/onPress wiring. Registered here too so it's reachable pre-login. */}
                <Stack.Screen name={"Cmspage"} component={Cmspage} />

            </Stack.Group>
        </Stack.Navigator>
    )
}

export const Appstack: React.FC = () => {
    // const authToken = getItem("token")
    const dispatch = useDispatch<any>()
    const { failuretoast, cleardata } = useCustomHooks()
    const theme = useContext(ThemeContext);
    useEffect(() => {
        dispatch(Deviceinfo())
    }, [])
    // const { sessionexpired } = useSelector(helperSelector)
    // useEffect(() => {
    //     console.log("sessionexpired_clear_call")
    //     if (sessionexpired) {
    //         failuretoast("Expired!", "Your session has expired!")
    //         cleardata()
    //         update_sessonstatus(false)
    //     }
    // }, [sessionexpired])

    // const { userData, isAuth } = useSelector(authSelector)
    return (
        <>
            <HelperScreen />
            <Stack.Navigator
                screenOptions={{ ...MyTransition, contentStyle: { backgroundColor: theme.background } }}
                initialRouteName={'Dashboard'}
            >
                <Stack.Screen name={'Seeall'} component={Seeall} />
                <Stack.Screen name={"Tradepairs"} component={Tradepairs} />
                <Stack.Screen name={"Market"} component={Market} />
                <Stack.Screen name={"Copytrade"} component={Copytrade} />
                <Stack.Screen name={"Tradedetail"} component={Tradedetail} />
                <Stack.Screen name={"Buysell"} component={Buysell} />
                <Stack.Screen name={'Test'} component={Test} />
                <Stack.Screen name={'Dashboard'} component={Bottomtab} />
                <Stack.Screen name={'AddMoneyHome'} component={AddMoneyHome} />
                <Stack.Screen name={'UPIList'} component={UPIList} />
                <Stack.Screen name={'Deposit'} component={Deposit} />
                <Stack.Screen name={'AddBankDetail'} component={AddBankDetail} />
                <Stack.Screen name={'AddUPIDetails'} component={AddUPIDetails} />
                <Stack.Screen name={"Profile"} component={Profile} />
                <Stack.Screen name={"MyAccount"} component={MyAccount} />
                <Stack.Screen name={"AccountEdit"} component={AccountEdit} />
                <Stack.Screen name={"Preference"} component={Preference} />
                <Stack.Screen name={"ColorPreference"} component={ColorPreference} />
                <Stack.Screen name={"Currency"} component={Currency} />
                <Stack.Screen name={"ConfirmMessage"} component={ConfirmMessage} />
                <Stack.Screen name={"Pushnotification"} component={Pushnotification} />
                <Stack.Screen name={"CreateWebhook"} component={CreateWebhook} />
                <Stack.Screen name={"Webhook2FA"} component={Webhook2FA} />
                <Stack.Screen name={"WebhookVerification"} component={WebhookVerification} />
                <Stack.Screen name="Reference" component={Reference} />
                <Stack.Screen name={"BankDetails"} component={BankDetails} />
                <Stack.Screen name={"Support"} component={Support} />
                <Stack.Screen name={"Features"} component={Features} />
                <Stack.Screen name={"APIKeys"} component={APIKeys} />
                <Stack.Screen name={"CreateAPIKey"} component={CreateAPIKey} />
                <Stack.Screen name={"Security"} component={Security} />
                <Stack.Screen name={"TwoFactor"} component={TwoFactor} />
                <Stack.Screen name={"Email"} component={Email} />
                <Stack.Screen name={"Notification"} component={Notification} />
                <Stack.Screen name={"QRcodeScanner"} component={QRcodeScanner} />
                <Stack.Screen name={"AccountActivity"} component={AccountActivity} />
                <Stack.Screen name={"PhoneNumber"} component={PhoneNumber} />
                <Stack.Screen name={"ChangeNumber"} component={ChangeNumber} />
                <Stack.Screen name={"SubAccount"} component={SubAccount} />
                <Stack.Screen name={"SubAccountCreate"} component={SubAccountCreate} />
                <Stack.Screen name={"SubAccountDetails"} component={SubAccountDetails} />
                <Stack.Screen name={"StrategyBuilder"} component={StrategyBuilder} />
                <Stack.Screen name={"StrategyAddContracts"} component={StrategyAddContracts} />
                <Stack.Screen name={"StrategyAnalyze"} component={StrategyAnalyze} />
                <Stack.Screen name={"TransactionLogs"} component={TransactionLogs} />
                <Stack.Screen name={"PnlAnalytics"} component={PnlAnalytics} />
                <Stack.Screen name={"KYCVerification"} component={KYCVerification} />
                <Stack.Screen name={"KYCPicture"} component={KYCPicture} />
                <Stack.Screen name={"UnderReview"} component={UnderReview} />
                <Stack.Screen name={"Withdraw"} component={Withdraw} />
                <Stack.Screen name={"DepositDetails"} component={DepositDetails} />
                <Stack.Screen name={"MasterTrader"} component={MasterTrader} />
                <Stack.Screen name={"UpdateName"} component={UpdateName} />
                <Stack.Screen name={"UpdatePassword"} component={UpdatePassword} />
                <Stack.Screen name={"UpdateEmail"} component={UpdateEmail} />
                <Stack.Screen name={"RegisterNumber"} component={RegisterNumber} />
                <Stack.Screen name={"SubAccountManage"} component={SubAccountManage} />
                <Stack.Screen name={"TransferFunds"} component={TransferFunds} />
                <Stack.Screen name={"AffiliateRegister"} component={AffiliateRegister} />
                <Stack.Screen name={"Overview"} component={Overview} />
                <Stack.Screen name={"Referaldashboard"} component={Referaldashboard} />
                <Stack.Screen name={"EditAPIKey"} component={EditAPIKey} />
                <Stack.Screen name={"ExportData"} component={ExportData} />
                <Stack.Screen name={"Cmspage"} component={Cmspage} />
                <Stack.Screen name={"PnlAnalyticsOverview"} component={PnlAnalyticsOverview} />
                <Stack.Screen name={"GetCopierDetails"} component={GetCopierDetails} />
                <Stack.Screen name={"NoInternet"} component={NoInternet} />
                <Stack.Screen name={"Verification"} component={Verification} />
                <Stack.Screen name={"PanCardStatus"} component={PanCardStatus} />
                <Stack.Screen name={"Selfie"} component={Selfie} />
                <Stack.Screen name={"PanDetails"} component={PanDetails} />
                <Stack.Screen name={"AdditionalDetails"} component={AdditionalDetails} />
                <Stack.Screen name={"DisplayName"} component={DisplayName} />
                <Stack.Screen name={"Future"} component={Future} />
                <Stack.Screen name={"FullViewChart"} component={FullViewChart} />
            </Stack.Navigator>
        </>
    )
}

// const Stacknavigator: React.FC = () => {

//     const authToken = getItem("token")
//     const dispatch = useDispatch<any>()
//     const { failuretoast, cleardata } = useCustomHooks()
//     useEffect(() => {
//         // dispatch(Deviceinfo())
//     }, [])
//     const { sessionexpired } = useSelector(helperSelector)
//     useEffect(() => {
//         if (sessionexpired) {
//             failuretoast("Expired!", "Your session has expired!")
//             cleardata()
//         }
//     }, [sessionexpired])

//     const { userData, isAuth } = useSelector(authSelector)

//     return (
//         <>
//             {
//                 !isAuth ?
//                     <Stack.Navigator
//                         screenOptions={MyTransition}
//                         initialRouteName={"Login"}
//                     >
//                         <Stack.Screen name={"Login"} component={Login} />
//                         <Stack.Screen name={"Signup"} component={Signup} />
//                         <Stack.Screen name={"OTP"} component={OTP} />
//                         <Stack.Screen name={"ForgotPassword"} component={ForgotPassword} />
//                         <Stack.Screen name={"ForgotPass"} component={ForgotPass} />
//                     </Stack.Navigator> :
//                     <Stack.Navigator
//                         screenOptions={MyTransition}
//                         initialRouteName={authToken ? 'Dashboard' : 'Login'}
//                     >
//                         <Stack.Screen name={'Seeall'} component={Seeall} />
//                         <Stack.Screen name={"Tradepairs"} component={Tradepairs} />
//                         <Stack.Screen name={"Market"} component={Market} />
//                         <Stack.Screen name={"Copytrade"} component={Copytrade} />
//                         <Stack.Screen name={"Tradedetail"} component={Tradedetail} />
//                         <Stack.Screen name={"Buysell"} component={Buysell} />
//                         <Stack.Screen name={"Signup"} component={Signup} />
//                         <Stack.Screen name={"OTP"} component={OTP} />
//                         <Stack.Screen name={'Test'} component={Test} />
//                         <Stack.Screen name={'Dashboard'} component={Bottomtab} />
//                         <Stack.Screen name={'AddMoneyHome'} component={AddMoneyHome} />
//                         <Stack.Screen name={'UPIList'} component={UPIList} />
//                         <Stack.Screen name={'Deposit'} component={Deposit} />
//                         <Stack.Screen name={'AddBankDetail'} component={AddBankDetail} />
//                         <Stack.Screen name={'AddUPIDetails'} component={AddUPIDetails} />
//                         <Stack.Screen name={"Profile"} component={Profile} />
//                         <Stack.Screen name={"MyAccount"} component={MyAccount} />
//                         <Stack.Screen name={"AccountEdit"} component={AccountEdit} />
//                         <Stack.Screen name={"Preference"} component={Preference} />
//                         <Stack.Screen name={"ColorPreference"} component={ColorPreference} />
//                         <Stack.Screen name={"Currency"} component={Currency} />
//                         <Stack.Screen name={"ConfirmMessage"} component={ConfirmMessage} />
//                         <Stack.Screen name={"Pushnotification"} component={Pushnotification} />
//                         <Stack.Screen name={"CreateWebhook"} component={CreateWebhook} />
//                         <Stack.Screen name={"Webhook2FA"} component={Webhook2FA} />
//                         <Stack.Screen name={"WebhookVerification"} component={WebhookVerification} />
//                         <Stack.Screen name="Reference" component={Reference} />
//                         <Stack.Screen name={"BankDetails"} component={BankDetails} />
//                         <Stack.Screen name={"Support"} component={Support} />
//                         <Stack.Screen name={"Features"} component={Features} />
//                         <Stack.Screen name={"APIKeys"} component={APIKeys} />
//                         <Stack.Screen name={"CreateAPIKey"} component={CreateAPIKey} />
//                         <Stack.Screen name={"Security"} component={Security} />
//                         <Stack.Screen name={"TwoFactor"} component={TwoFactor} />
//                         <Stack.Screen name={"Email"} component={Email} />
//                         <Stack.Screen name={"Notification"} component={Notification} />
//                         <Stack.Screen name={"QRcodeScanner"} component={QRcodeScanner} />
//                         <Stack.Screen name={"AccountActivity"} component={AccountActivity} />
//                         <Stack.Screen name={"PhoneNumber"} component={PhoneNumber} />
//                         <Stack.Screen name={"ChangeNumber"} component={ChangeNumber} />
//                         <Stack.Screen name={"SubAccount"} component={SubAccount} />
//                         <Stack.Screen name={"SubAccountCreate"} component={SubAccountCreate} />
//                         <Stack.Screen name={"SubAccountDetails"} component={SubAccountDetails} />
//                         <Stack.Screen name={"CreateBasket"} component={CreateBasket} />
//                         <Stack.Screen name={"TransactionLogs"} component={TransactionLogs} />
//                         <Stack.Screen name={"PnlAnalytics"} component={PnlAnalytics} />
//                         <Stack.Screen name={"KYCVerification"} component={KYCVerification} />
//                         <Stack.Screen name={"KYCPicture"} component={KYCPicture} />
//                         <Stack.Screen name={"UnderReview"} component={UnderReview} />
//                         <Stack.Screen name={"Withdraw"} component={Withdraw} />
//                         <Stack.Screen name={"DepositDetails"} component={DepositDetails} />
//                         <Stack.Screen name={"MasterTrader"} component={MasterTrader} />
//                         <Stack.Screen name={"ForgotPassword"} component={ForgotPassword} />
//                         <Stack.Screen name={"ForgotPass"} component={ForgotPass} />
//                         <Stack.Screen name={"TwoFactorAuth"} component={TwoFactorAuth} />
//                         <Stack.Screen name={"UpdateName"} component={UpdateName} />
//                         <Stack.Screen name={"UpdatePassword"} component={UpdatePassword} />
//                         <Stack.Screen name={"UpdateEmail"} component={UpdateEmail} />
//                         <Stack.Screen name={"RegisterNumber"} component={RegisterNumber} />
//                         <Stack.Screen name={"SubAccountManage"} component={SubAccountManage} />
//                         <Stack.Screen name={"TransferFunds"} component={TransferFunds} />
//                         <Stack.Screen name={"AffiliateRegister"} component={AffiliateRegister} />
//                         <Stack.Screen name={"Overview"} component={Overview} />
//                         <Stack.Screen name={"Referaldashboard"} component={Referaldashboard} />
//                         <Stack.Screen name={"EditAPIKey"} component={EditAPIKey} />
//                         <Stack.Screen name={"ExportData"} component={ExportData} />
//                         <Stack.Screen name={"Cmspage"} component={Cmspage} />
//                         <Stack.Screen name={"PnlAnalyticsOverview"} component={PnlAnalyticsOverview} />
//                         <Stack.Screen name={"GetCopierDetails"} component={GetCopierDetails} />
//                         <Stack.Screen name={"NoInternet"} component={NoInternet} />
//                         <Stack.Screen name={"Verification"} component={Verification} />
//                         <Stack.Screen name={"PanCardStatus"} component={PanCardStatus} />
//                         <Stack.Screen name={"Selfie"} component={Selfie} />
//                         <Stack.Screen name={"PanDetails"} component={PanDetails} />
//                         <Stack.Screen name={"AdditionalDetails"} component={AdditionalDetails} />
//                         <Stack.Screen name={"DisplayName"} component={DisplayName} />
//                     </Stack.Navigator>
//             }
//         </>
//     )
// }

// export default Stacknavigator;
