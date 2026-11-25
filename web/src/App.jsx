/** package import */

import React, { Suspense, useEffect } from 'react'
import { Route, Routes } from 'react-router-dom'
import toast, { Toaster } from "react-hot-toast";
import { HelmetProvider } from 'react-helmet-async';

/** local import */

import PageLoader from './components/Loader/PageLoader'

const Landing = React.lazy(() => import('./pages/Landing/Landing'))
const StaticLayout = React.lazy(() => import('./layout/StaticLayout/StaticLayout'))
const ContactUs = React.lazy(() => import('./pages/static/ContactUs'))
const Dashboard = React.lazy(() => import('./features/dashboard/Dashboard'))
const Wallet = React.lazy(() => import('./features/dashboard/Wallet'))
const Subaccount = React.lazy(() => import('./features/dashboard/Subaccount'))
const Verification = React.lazy(() => import('./features/dashboard/Verification'))
const Referral = React.lazy(() => import('./features/dashboard/Referral'))
const Security = React.lazy(() => import('./features/dashboard/Security'))
const History = React.lazy(() => import('./features/dashboard/History'))
const Settings = React.lazy(() => import('./features/dashboard/Settings'))
const MyProfile = React.lazy(() => import('./features/dashboard/MyProfile'))
const EmailManagement = React.lazy(() => import('./features/dashboard/EmailManagement'))
const NumberManagement = React.lazy(() => import('./features/dashboard/NumberManagement'))
const ManageActivity = React.lazy(() => import('./features/dashboard/ManageActivity'))
const APImanagement = React.lazy(() => import('./features/dashboard/APImanagement'))
const Deposit = React.lazy(() => import('./features/dashboard/Deposit'))
const Withdraw = React.lazy(() => import('./features/dashboard/Withdraw'))
const AddBank = React.lazy(() => import('./features/dashboard/AddBank'))
const EditBank = React.lazy(() => import('./features/dashboard/EditBank'))
const AffiliateLayout = React.lazy(() => import('./layout/AffiliateLayout/AffiliateLayout'))
const PageNotFound = React.lazy(() => import('./pages/static/PageNotFound'))
const FuturesTrading = React.lazy(() => import('./features/futuresTrading/FuturesTrading'))
const UserProtectedLayout = React.lazy(() => import('./layout/UserProtectedLayout/UserProtectedLayout'))
const Login = React.lazy(() => import('./pages/Auth/Login'))
const AuthLayout = React.lazy(() => import('./layout/AuthLayout/AuthLayout'))
const Register = React.lazy(() => import('./pages/Auth/Register'))
const ForgotPassword = React.lazy(() => import('./pages/Auth/ForgotPassword'))
const EmailActivation = React.lazy(() => import('./pages/Auth/Activation'))
const OptionsTrading = React.lazy(() => import('./features/optionsTrading/OptionsTrading'))
const PnlAnalytics = React.lazy(() => import('./features/dashboard/PnlAnalytics'))
const Position = React.lazy(() => import('./features/dashboard/Position'))
const APIManagementNew = React.lazy(() => import('./features/dashboard/APImanagementNew'))
const PrivacyPolicy = React.lazy(() => import('./pages/static/PrivacyPolicy'))
const TradingBot = React.lazy(() => import('./features/dashboard/TradingBot'))
const TermsAndConditions = React.lazy(() => import('./pages/static/TermsAndConditions'))
const CopyTradeLanding = React.lazy(() => import('./features/copyTrade/pages/CopyTradeLanding'))
const InstitutionalLanding = React.lazy(() => import('./features/institutional/pages/InstitutionalLanding'))
const AffiliateLanding = React.lazy(() => import('./features/affiliate/pages/AffiliateLanding'))
const AffiliateApply = React.lazy(() => import('./features/affiliate/pages/AffiliateApply'))
const InstitutionalDashboard = React.lazy(() => import('./features/institutional/pages/InstitutionalDashboard'))


// import Context

import SocketContext from "./context/socketContext";
import HelperRoute from './HelperRoute/HelperRoutes'
// import HelperRoute from './HelperRoute/HelperRoutes';


/** import config */

import { socket } from "./config/socketConnectivity";
const InstitutionalLayout = React.lazy(() => import('./layout/InstitutionalLayout/InstitutionalLayout'))
const AffiliateDashboard = React.lazy(() => import('./features/affiliate/pages/AffiliateDashboard'))
const SubAffiliate = React.lazy(() => import('./features/affiliate/pages/SubAffiliate'))
const AffiliateUserActivities = React.lazy(() => import('./features/affiliate/pages/AffiliateUserActivities'))
const AffiliateMyProfile = React.lazy(() => import('./features/affiliate/pages/AffiliateProfile'))
const InstitutionalApplyDetails = React.lazy(() => import('./features/institutional/pages/InstitutionalApplyDetails'))
const CopyingTrade = React.lazy(() => import('./features/copyTrade/pages/CopyingTrade'))
const CopyProfileDashboard = React.lazy(() => import('./features/copyTrade/pages/CopyProfileDashboard'))
const CopierDashboard = React.lazy(() => import('./features/copyTrade/pages/CopierDashboard'))
const StakingLanding = React.lazy(() => import('./features/staking/pages/StakingLanding'))
const SubAccount = React.lazy(() => import('./features/institutional/pages/SubAccount'))
const AddSubAccount = React.lazy(() => import('./features/institutional/pages/AddSubAccount'))
const UserProfile = React.lazy(() => import('./features/institutional/pages/UserProfile'))
const RiskManagement = React.lazy(() => import('./features/institutional/pages/RiskManagement'))
const AdvancedManagement = React.lazy(() => import('./features/institutional/pages/AdvancedManagement'))
const UserDetails = React.lazy(() => import('./features/institutional/pages/UserDetails'))
const LaunchpadLanding = React.lazy(() => import('./features/launchpad/pages/LaunchpadLanding'))
const RequestTokenSelect = React.lazy(() => import('./features/launchpad/pages/RequestTokenSelect'))
const ExistingToken = React.lazy(() => import('./features/launchpad/pages/ExistingToken'))
const RubbyTemplate1 = React.lazy(() => import('./features/launchpad/pages/RubbyTemplate1'))
const SapphireTemplate3 = React.lazy(() => import('./features/launchpad/pages/SapphireTemplate3'))
const EmeraldTemplate2 = React.lazy(() => import('./features/launchpad/pages/EmeraldTemplate2'))
const SwapLanding = React.lazy(() => import('./features/swap/pages/SwapLanding'))
const AlgoTradingLanding = React.lazy(() => import('./features/algoTrading/pages/AlgoTradingLanding'))
const ApiKeys = React.lazy(() => import('./features/dashboard/ApiKey'))
const AffiliateRewardHub = React.lazy(() => import('./features/affiliate/pages/AffiliateRewardHub'))
const ShareLink = React.lazy(() => import('./pages/static/ShareLink'))
import CrispChat from './features/support/pages/cripsChat';
const AboutUs = React.lazy(() => import('./pages/static/AboutUs'))
const BlogLanding = React.lazy(() => import('./features/blog/pages/BlogLanding'))
const BlogDetails = React.lazy(() => import('./features/blog/pages/BlogDetails'))
const LearnPage = React.lazy(() => import('./features/learn/pages/LearnPage'))
const Notification = React.lazy(() => import('./features/notification/pages/Notification'))
const Preferences = React.lazy(() => import('./features/dashboard/Preferences'))
import NetworkStatus from './components/Modal/NetworkStatus';
const DeleteAccountPage = React.lazy(() => import('./pages/static/DeleteAcoount'))
import TradingChart from './features/futuresTrading/components/TradingChart';
const MobileChart = React.lazy(() => import('./features/futuresTrading/components/MobileChart'))
const MobileOptionChart = React.lazy(() => import('./features/optionsTrading/components/MobileOptionChart'))
import { useClickSound } from './hooks/useClickSound';
const PnlAnalyticsOverview = React.lazy(() => import('./features/dashboard/PnlAnalyticsOverview'))
const ExportData = React.lazy(() => import('./features/dashboard/ExportData'))
const LearnDetails = React.lazy(() => import('./features/learn/pages/LearnDetails'))
const FaqPage = React.lazy(() => import('./features/faq/pages/Faq'))
const ExpiredFutureAndOptions = React.lazy(() => import('./features/expiredFutureAndOptions/pages/ExpiredFutureAndOptions'))
import config from './config/env';
const Fees = React.lazy(() => import('./pages/static/Fees'))


/** code start */


// Silences console.log/debug/info/warn in production so app logging never
// leaks into end-user browser consoles. console.error is left untouched so
// real errors (and any error-tracking hook on it) still surface.
const disableConsoleOutput = () => {
  console.log = () => { };
  console.debug = () => { };
  console.info = () => { };
  console.warn = () => { };
};

const App = () => {
  useClickSound();
  if (config.ENV == "live") {
    disableConsoleOutput();
  }

  return (
    <>

      <Toaster containerClassName='customToastConatiner' />
      <NetworkStatus />
      <SocketContext.Provider value={{ socket }}>
        <HelperRoute />
        {/* <CrispChat /> disabled in showcase build */}
        <Suspense fallback={<PageLoader />}>
          <Routes>
            {/* Auth routes */}

            <Route element={<AuthLayout />} >
              <Route path='/login' element={<Login />} />
              <Route path='/register' element={<Register />} />
              <Route path='/register/:code' element={<Register />} />
              <Route path='/affiliate/:code' element={<Register />} />
              <Route path='/forgot' element={<ForgotPassword />} />
              <Route path='/reset-password' element={<ForgotPassword />} />
              <Route path='/activation/:id' element={<EmailActivation />} />
              <Route path='/verify-old-email/:userId' element={<MyProfile />} />
              <Route path='/verify-new-email/:userId' element={<MyProfile />} />
              {/* <Route path='/delete-account' element={<DeleteAccountPage />} /> */}
            </Route>

            {/* Static routes - (It includes Header, children, Footer) */}

            <Route element={<StaticLayout />} >
              <Route index element={<Landing />} />
              <Route path='share/:url?' element={<ShareLink />} />
              <Route path='contact-us' element={<ContactUs />} />
              <Route path='privacy-policy' element={<PrivacyPolicy />} />
              <Route path='terms-and-conditions' element={<TermsAndConditions />} />

              {/* Affiliate */}
              <Route path='affiliate' element={<AffiliateLanding />} />
              <Route path='affiliate-apply' element={<AffiliateApply />} />

              {/* copy trade */}
              <Route path='copy-trade' element={<CopyTradeLanding />} />
              <Route path='copyingTrade' element={<CopyingTrade />} />
              <Route path='/copier/profile' element={<CopyProfileDashboard />} />
              <Route path='/trader/profile' element={<CopyProfileDashboard />} />
              <Route path='/copier-dashboard' element={<CopierDashboard />} />

              {/* swap  */}
              <Route path='/currency-conversion' element={<SwapLanding />} />

              {/* staking  */}
              <Route path='/staking' element={<StakingLanding />} />

              {/* launchpad  */}
              <Route path='/launchpad' element={<LaunchpadLanding />} />
              <Route path='/request-token-types' element={<RequestTokenSelect />} />
              <Route path='/launchTokens/existing-token' element={<ExistingToken />} />
              <Route path='/launchpadDetails/rubby' element={<RubbyTemplate1 />} />
              <Route path='/launchpadDetails/sapphire' element={<SapphireTemplate3 />} />
              <Route path='/launchPadDetail/rubby/Test' element={<EmeraldTemplate2 />} />

              {/* Institutional */}
              <Route path='institutional' element={<InstitutionalLanding />} />
              <Route path='institutional-apply' element={<InstitutionalApplyDetails />} />

              {/* algo-trading  */}
              <Route path='/algo-trading' element={<AlgoTradingLanding />} />
              {/* About Us  */}
              <Route path='/about-us' element={<AboutUs />} />

              {/* Blog  */}
              <Route path='/blog' element={<BlogLanding />} />
              <Route path='/blog-details/:slug?' element={<BlogDetails />} />
              {/* learn  */}
              <Route path='/learn' element={<LearnPage />} />
              <Route path='/learn-details' element={<LearnDetails />} />

              {/* faq  */}
              <Route path='/faq' element={<FaqPage />} />

              {/* Notification  */}
              <Route path='/notification' element={<Notification />} />

              {/* Fees  */}
              <Route path='/fees' element={<Fees />} />

              {/* Expired future and options  */}
              <Route path='/expired-futures-and-options' element={<ExpiredFutureAndOptions />} />
            </Route >


            {/* Trade pages - (It includes Header, children only) */}

            < Route path='futures/:tikerRoot?' element={< FuturesTrading />} />
            < Route path='options/:underlyingSymbol?/:tikerRoot?' element={< OptionsTrading />} />
            < Route path='futures-chart/:tikerRoot?' element={< MobileChart />} />
            < Route path='options-chart/:tikerRoot?' element={< MobileOptionChart />} />

            {/* User Protected routes */}

            <Route element={<UserProtectedLayout />} >
              <Route path='delete-account' element={<DeleteAccountPage />} />
              <Route path='dashboard' element={<Dashboard />} />
              <Route path='my-profile' element={<MyProfile />} />
              <Route path='add-bank' element={<AddBank />} />
              <Route path='edit-bank' element={<EditBank />} />
              <Route path='deposit' element={<Deposit />} />
              <Route path='withdraw' element={<Withdraw />} />
              <Route path='wallet' element={<Wallet />} />
              <Route path='sub-account' element={<Subaccount />} />
              <Route path='verification' element={<Verification />} />
              <Route path='pnl-analytics' element={<PnlAnalytics />} />
              <Route path='pnl-overview' element={<PnlAnalyticsOverview />} />
              <Route path='referral' element={<Referral />} />
              <Route path='security' element={<Security />} />
              <Route path='email-management' element={<EmailManagement />} />
              <Route path='number-management' element={<NumberManagement />} />
              <Route path='manage-activity' element={<ManageActivity />} />
              <Route path='history' element={<History />} />
              <Route path='settings' element={<Settings />} />
              <Route path='trading-bot' element={<TradingBot />} />
              {/* <Route path='api-management' element={<APImanagement />} /> */}
              <Route path='positions' element={<Position />} />
              <Route path='preferences' element={<Preferences />} />
              <Route path='api-management' element={<APIManagementNew />} />
              <Route path='api-keys' element={<ApiKeys />} />
              <Route
                path="export/:id?" element={<ExportData />} />
              {/* Notification  */}
              <Route path='/notification' element={<Notification />} />
            </Route>



            {/* affiliate protected routes */}
            <Route path='affiliate' element={<AffiliateLayout />}>
              <Route path='dashboard' element={<AffiliateDashboard />} />
              <Route path='sub-affiliate' element={<SubAffiliate />} />
              <Route path='account-activities' element={<AffiliateUserActivities />} />
              <Route path='profile' element={<AffiliateMyProfile />} />
              <Route path='reward-hub' element={<AffiliateRewardHub />} />
            </Route>

            {/* Institutional protected routes */}
            <Route path='institutional' element={<InstitutionalLayout />} >
              <Route path='dashboard' element={<InstitutionalDashboard />} />
              <Route path='sub-account' element={<SubAccount />} />
              <Route path='add-sub-account' element={<AddSubAccount />} />
              <Route path='user-profile' element={<UserProfile />} />
              <Route path='risk-management' element={<RiskManagement />} />
              <Route path='advanced-management' element={<AdvancedManagement />} />
              <Route path='user-details' element={<UserDetails />} />
            </Route>

            {/* Catch-all */}

            <Route path='*' element={<PageNotFound />} />

            {/* SUPPORT routes */}
            {/* <Route path='crispchat' element={<CrispChat />}>
          </Route> */}

          </Routes >
        </Suspense>
      </SocketContext.Provider >

    </>
  )
}

export default App