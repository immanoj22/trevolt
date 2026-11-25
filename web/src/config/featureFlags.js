/**
 * Temporary feature gates.
 *
 * These three features are only partially built. Rather than removing
 * routes or leaving half-finished UI reachable during client review, each
 * page is wrapped in the existing <ComingSoon /> component (same one
 * already used on Futures/Options trading when no pairs are configured)
 * and gated behind a flag here.
 *
 * To re-enable a feature once it's ready, just flip its flag to `false` —
 * no need to touch the page components themselves again.
 */
const featureFlags = {
  showOptionsTradingComingSoon: false,
  showAffiliateComingSoon: true,
  showInstitutionalComingSoon: true,
  // Demo Trade is a link to an external site (config.DEMO_URL), not an
  // internal page — see HeaderMenus.jsx, where the "Demo Trade" menu item's
  // target itself switches between the internal Coming Soon route and that
  // real external URL based on this flag.
  showDemoTradeComingSoon: false,
  // Applies to both the live and demo user panels — Algo Trading uses the
  // same page component/build for each, so gating it here covers both.
  showAlgoTradingComingSoon: true,
};

export default featureFlags;