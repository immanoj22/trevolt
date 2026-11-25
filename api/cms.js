// Fictional marketing copy for the Trevolt showcase (served as CMS content).
const card = (title, description) => ({ title, description });
const sec = (identifier, o = {}) => ({ identifier, sectionTitle: '', sectionSubTitle: '', sectionDescription: '', CARD: [], ...o });
const home = {
  SECTION: [
    sec('home-crypto-derivatives', { sectionTitle: 'Trade Forex, Metals And Indices With Precision' }),
    sec('home-derivatives', { sectionDescription: 'Forex, CFDs and options on one centralized platform with USD margin. Tight spreads from 0.6 pips, deep liquidity and an institutional-grade risk engine for every verified trader.' }),
    sec('home-seamless-trading', {
      sectionTitle: 'Seamless Trading, Built For Speed',
      sectionDescription: 'From your first order to advanced strategies, Trevolt keeps execution fast and your risk visible.',
      CARD: [card('Lightning Execution', 'Our central execution engine fills your orders in milliseconds when the market moves, with tight spreads on every instrument.'),
             card('Smart Risk Controls', 'Cross and portfolio margin, bracket orders and live stop-out levels keep exposure under control.'),
             card('Pro Charting', 'Advanced charts with 100+ indicators, drawing tools and one-click trading directly on the chart.'),
             card('Copy Top Traders', 'Follow verified lead traders and mirror their trades automatically from your Trevolt account, with full transparency on results.')] }),
    sec('affiliate-seamless-trading', { CARD: [card('Clear, real-time P&L', ''), card('', ''), card('', ''), card('', '')] }),
    sec('home-videos', { CARD: [] }),
    sec('home-greenex-trading-app', { sectionTitle: 'Trade Anywhere With The Trevolt App', sectionSubTitle: 'Your markets in your pocket',
      sectionDescription: 'Place orders, track positions and manage risk from your phone with the same speed and clarity as the desktop terminal.' }),
    sec('home-greenex-features', {
      sectionTitle: 'Everything You Need To Trade With Confidence',
      sectionDescription: 'A complete forex and CFD toolkit, from lot-based execution to automated strategies.',
      CARD: [card('Forex & CFDs', 'Leverage up to 1:100 on FX majors, gold, silver, oil and indices with transparent swap / rollover and stop-out protection.'),
             card('Options Trading', 'Full option chains with live greeks, strategy builder and payoff analytics.'),
             card('Copy & Algo Trading', 'Follow top strategies or automate your own with webhooks and API access.'),
             card('Secure By Design', 'Segregated client funds, 2FA, withdrawal whitelists and negative balance protection safeguard your account.')] }),
    sec('home-trader-first-experience', {
      sectionTitle: 'A Trader-First Experience',
      sectionDescription: 'Every screen is designed around one goal: helping you make faster, better-informed decisions.',
      CARD: [card('Clear P&L', 'Real-time unrealized and realized P&L across every position and sub-account.'),
             card('Flexible Margin', 'Choose cross or portfolio margin and adjust leverage per instrument in seconds.'),
             card('Deep Analytics', 'Daily equity curves, win rate, fees and volume reports to sharpen your edge.'),
             card('Instant Alerts', 'Price alerts and order notifications delivered across web and mobile.')] }),
    sec('home-24-trading-support', { sectionTitle: '24/5 Support, Always On',
      sectionDescription: 'Our customer support team and help center are available around the clock, because forex markets run 24 hours a day, five days a week. Verified accounts get priority tickets.' }),
    sec('home-faq', { sectionTitle: 'Frequently Asked Questions',
      CARD: [card('What can I trade on Trevolt?', 'You can trade forex pairs such as EURUSD, GBPUSD and USDJPY, plus gold, silver, oil, US30 and FX options. Prices are quoted in pips, size is in lots and everything is margined and settled in USD.'),
             card('How does margin work?', 'Trevolt supports cross and portfolio margin. Your available margin and liquidation price update live as prices move.'),
             card('Is this a real exchange?', 'No. Trevolt is a demonstration product built to showcase trading-platform design and engineering. All data is fictional.'),
             card('How are my funds held?', 'Trevolt is a centralized broker: client funds are held in segregated accounts, separate from company funds (demo data).'),
             card('Do I need to verify my identity?', 'Yes. Accounts complete KYC (identity and address) before depositing fiat or withdrawing, as part of our AML program.'),
             card('Can I copy other traders?', 'Yes. Browse strategies, review their performance and copy them with one click.')] }),
  ],
};
const img = (n) => `/img/${n}`;
const about = { SECTION: [
  sec('about-trading-vision', { sectionTitle: 'Built For Serious Trading', sectionDescription: 'Trevolt is a centralized forex and CFD broker with fast central execution, segregated client accounts and institutional-grade risk controls, designed so every trader gets fast, fair execution.',
    CARD: [{ Image: img('aboutusBannerImageOne.svg') }, { Image: img('aboutusBannerImageTwo.svg') }, { Image: img('aboutusBannerImageThree.svg') }, { Image: img('aboutusBannerImageFour.svg') }] }),
  sec('about-trader-smarterteam', { sectionTitle: 'A Team Focused On Reliability', sectionDescription: 'Engineers, risk analysts and support specialists work around the clock to keep markets liquid and accounts safe.',
    CARD: [card('Matching engine', 'Low-latency order execution with transparent pricing and tight spreads.'), card('Risk and custody', 'Segregated client funds, withdrawal whitelists and continuous monitoring.'),
           card('Compliance', 'KYC verification and account protections for every customer.'), card('Support', 'Human support available 24/7 across web and mobile.')] }),
  sec('about-simplify-platform', { sectionTitle: 'Simple On The Surface, Robust Underneath', sectionSubTitle: 'One account for every market',
    sectionDescription: 'Deposit in USD or other fiat, trade forex, CFDs and options, and withdraw to your verified bank accounts, all from a single USD account.',
    CARD: [{ title: 'Unified account', subtitle: 'Forex, CFD and options margin in one place', Image: img('aboutusTradersImage.svg') }] }),
  sec('about-trader-empowerment', { sectionTitle: 'Tools That Help You Decide', sectionDescription: 'Live quotes, depth charts, P&L analytics and risk views give traders the information they need.' }),
] };
const algo = { SECTION: [
  sec('algo-why-choose', { sectionTitle: 'Why Automate With Trevolt', sectionDescription: 'Run strategies through the 24/5 market week with webhooks and an API that connects directly to the trading platform.',
    CARD: [card('Webhook signals', 'Send alerts from your charting platform and place orders automatically.'), card('Low latency', 'Orders go straight to the central execution engine.'), card('Risk limits', 'Position and loss limits protect every automated strategy.'), card('Full audit trail', 'Every automated order is logged and exportable.')] }),
  sec('algo-crypto-simplicity', { sectionTitle: 'Automation, Simplified', CARD: [card('Connect', 'Create an API key with the permissions you need.'), card('Configure', 'Define lot size, leverage and risk rules.'), card('Run', 'Let your strategy trade while you monitor results.')] }),
  sec('algo-crypto-growth-tools', { sectionTitle: 'Built-In Growth Tools', CARD: [card('Backtesting', 'Review strategy results before going live.'), card('Alerts', 'Get notified when a strategy opens or closes a position.')] }),
] };
const inst = { SECTION: [
  sec('institution-built-for-professionals', { sectionTitle: 'Built For Professional Desks', sectionDescription: 'Sub-accounts, advanced APIs and dedicated support for funds, prop desks and market makers.' }),
  sec('institution-crypto-simplicity', { sectionTitle: 'Institutional Workflow, Simplified', sectionDescription: 'Onboarding, custody and reporting designed around how professional teams operate.',
    CARD: [card('KYB onboarding', 'Streamlined business verification and account setup.'), card('Sub-accounts', 'Separate strategies and clients with isolated margin.'), card('Custody controls', 'Withdrawal controls and multi-approver policies.'), card('Reporting', 'Daily statements and exportable trade history.')] }),
  sec('institution-signature-service', { sectionTitle: 'White-Glove Service', sectionDescription: 'A dedicated account manager and priority support for institutional clients.', CARD: [card('Dedicated manager', ''), card('Priority support', '')] }),
] };
const generic = (title, desc) => ({ SECTION: [sec('page-hero', { sectionTitle: title, sectionDescription: desc })] });
export const pages = {
  Home: home,
  'About us': about,
  Affiliate: generic('Trevolt Affiliate Program', 'Share Trevolt with your community and earn a share of trading fees.'),
  'Algo Trading': algo,
  Institutional: inst,
};
