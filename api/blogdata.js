// Demo content for Blog and Learn. Illustrative only; no real prices, licences or audits are implied.
const P = (...p) => p.map((t) => `<p>${t}</p>`).join('');
const IMG = (n) => `/img/blog/${n}.svg`;
const LEARN = (s) => `http://localhost:5000/img/learn/${s}.html`;
const mk = (slug, title, category, date, read, image, blogdescription, body) => ({
  _id: `blog_${slug}`, slug, title, category, image: IMG(image), blogdescription, readTime: `${read} min read`,
  author: 'Trevolt Editorial', tags: [category.toLowerCase()], createdAt: date, updatedAt: date, status: 'active',
  meta_title: `${title} | Trevolt`, meta_description: blogdescription, meta_keywords: `${category}, Trevolt, forex broker`,
  content: `<p><em>${category} &middot; ${read} min read &middot; ${date.slice(0, 10)}</em></p>${body}`,
});

export const blogs = [
  mk('how-to-read-an-order-book', 'How to read an order book', 'Trading education', '2026-11-18T09:00:00Z', 5, 'orderbook',
    'Bids, asks, spread and depth explained, and what they tell you before you place an order.',
    P('An order book is a live list of resting buy orders (bids) and sell orders (asks) for a market. On a centralized platform like Trevolt, one execution engine keeps the quotes and pairs orders by price first, then by time. In forex the gap is quoted in pips, for example a 0.6 pip spread on EURUSD.',
      'The gap between the best bid and the best ask is the spread. A tight spread usually means a liquid market. Depth shows how much size sits at each price level, so a thin book means even a modest market order can move the price.',
      'A market order takes liquidity from the book and fills at the best available prices, which can mean slippage on large sizes. A limit order adds liquidity at a price you choose, but it may not fill if the market moves away.',
      'Large resting orders can look meaningful, but they can be cancelled at any time. Treat depth as context, not a prediction.')),
  mk('market-notes-volatility-and-leverage', 'Market notes: volatility and leverage', 'Market insights', '2026-11-12T09:00:00Z', 4, 'candles',
    'A general look at why volatile markets punish over-leveraged positions. Illustrative commentary only.',
    P('This is generic commentary for demonstration and not investment advice. No specific prices or forecasts are implied.',
      'When volatility rises, price swings get larger in both directions. With leverage, those swings are magnified against your margin, so the distance between your entry and your stop-out level shrinks. On a 1:100 account, a 1 percent move against you can consume all of the margin on that position.',
      'Traders often respond by lowering leverage, sizing positions smaller, and using stop orders. Watching spreads and swap / rollover costs is also useful, since spreads often widen around news and the daily rollover.',
      'Whatever your approach, decide your maximum acceptable loss before you open a position, not after.')),
  mk('protect-your-account-with-2fa', 'Protect your account: 2FA, whitelist and anti-phishing code', 'Security', '2026-11-05T09:00:00Z', 4, 'shield',
    'Four settings that make a trading account much harder to take over.',
    P('Because client funds sit in your trading account, protecting your login protects your funds. Start with two-factor authentication using an authenticator app rather than SMS where possible.',
      'Turn on the withdrawal whitelist so funds can only be sent to bank accounts you have approved. New accounts can be subject to a cooling-off period.',
      'Set an anti-phishing code. Genuine Trevolt emails include your code, and messages without it should be treated as suspicious.',
      'Use a unique, long password from a password manager, and never share one-time codes with anyone, including people claiming to be support.')),
  mk('how-we-think-about-custody', 'How client funds are protected at a broker', 'Security', '2026-10-29T09:00:00Z', 5, 'vault',
    'Segregated accounts, reconciliation and negative balance protection: a plain-language tour of how client funds are typically held.',
    P('On a centralized broker, your USD deposit is held in a client account at a bank, kept separate from the company\'s own funds. Your balance is an entry in the broker ledger that it owes you.',
      'Funds are reconciled daily against the bank balance. Withdrawals above a threshold may need extra review, and are paid back to a verified bank account in your own name.',
      'Many brokers also offer negative balance protection, so a gap in the market cannot take your account below zero. Trevolt is a demo product, so any figures shown in the app are placeholders.',
      'Good habits still apply: do not keep more with any broker than you need for trading.')),
  mk('perpetual-funding-explained', 'Swap and rollover on forex positions', 'Trading education', '2026-10-22T09:00:00Z', 5, 'funding',
    'How the daily swap / rollover charge or credit works when you hold a position overnight.',
    P('Spot forex positions have no expiry, but a position held past the daily rollover time (22:00 UTC in this demo) is rolled to the next value date. That roll carries a swap, which can be a charge or a credit.',
      'The swap reflects the interest rate difference between the two currencies in the pair. If you are long the higher-yielding currency you typically earn a credit; if you are short it you typically pay a charge. The broker also adds a markup.',
      'Swap is quoted in points per lot and is tripled once a week, usually on Wednesday, to cover the weekend. Holding a large position of several lots over many nights adds up.',
      'Check the swap long and swap short values on the instrument page before holding a position through rollover.')),
  mk('understanding-margin-and-liquidation', 'Understanding margin and liquidation', 'Trading education', '2026-10-15T09:00:00Z', 6, 'gauge',
    'Required margin, margin level and how a stop-out is reached.',
    P('Margin is the collateral you set aside to open a leveraged position. At 1:100, one standard lot of EURUSD (100,000 units) needs roughly 1 percent of its value, about 1,087 USD at a price of 1.0865. Margin level is equity divided by used margin.',
      'If losses push your margin level down to the stop-out level, positions are closed automatically, starting with the largest loser. In isolated margin only the margin assigned to that position is at risk, while cross margin shares your account balance across positions.',
      'Higher leverage moves the stop-out price closer to your entry. At 1:100, a move of roughly 1 percent against you can consume the margin on a position, before spreads and swap.',
      'Negative balance protection helps make sure a fast gap in price cannot take your account below zero.')),
  mk('verify-your-identity-kyc-guide', 'Verifying your identity: a KYC walkthrough', 'Product updates', '2026-10-08T09:00:00Z', 3, 'idcard',
    'What documents you need, how long a review can take and what unlocks after verification.',
    P('Identity verification (KYC) is required to unlock fiat deposits, withdrawals and higher limits. The flow has three steps: personal details, a government ID, and a live selfie.',
      'Use a clear, uncropped photo of an unexpired document in good light. Name and date of birth must match what you entered.',
      'Reviews are often automated and quick, though some cases go to manual review. In this demo, verification is simulated.',
      'Once approved, you can fund your account in USD and see your updated limits under Account.')),
  mk('new-perpetual-markets-and-vip-tiers', 'New instruments and VIP commission tiers', 'Listings', '2026-10-01T09:00:00Z', 3, 'listing',
    'New forex, metals and index CFDs plus volume-based commission tiers, all margined in USD (demo).',
    P('Trevolt has added further CFD instruments, including USDCHF, XAGUSD, USOIL and US30. Each shows its own pip size, lot size, spread, leverage cap (for example 1:100 on FX majors, 1:50 on metals) and swap values on the instrument page.',
      'Commissions follow a VIP ladder based on rolling 30-day trading volume in lots. Higher tiers lower the commission per lot. The Fees page lists the full schedule.',
      'Listings in this demo are illustrative and do not reflect real market availability.')),
];

const art = (slug, title, description, c) => ({ id: slug, title, description, url: LEARN(slug), body: c });
const tidy = (a) => ({ id: a.id, title: a.title, description: a.description, url: a.url });

export const articles = {
  'getting-started': [
    art('what-is-an-order-book', 'What is an order book?', 'The order book lists all open buy and sell orders for a market. Bids are buy orders, asks are sell orders. The best bid and best ask set the spread, measured in pips, and the execution engine pairs orders by best price first, then earliest time. Depth shows how much size sits at each level. Large market orders consume several levels and can fill at worse average prices, called slippage. In forex, spreads are quoted in pips, so EURUSD at 0.6 pips is cheaper to trade than XAUUSD at 25 points.', null),
    art('order-types-explained', 'Order types: market, limit and stop', 'A market order fills immediately at the best available prices. A limit order sets your price and waits in the book; it may fill partially or not at all. A stop order stays dormant until the trigger price is reached, then becomes a market or limit order. Take-profit and stop-loss levels attached to an order help control risk. Pick the type that matches whether you value certainty of fill or certainty of price.', null),
    art('complete-kyc-verification', 'How to complete KYC verification', 'Open Account, then Verification. Enter your legal name and date of birth, upload a clear photo of an unexpired government ID, and take a live selfie. Details must match your document. Most reviews finish quickly but can take longer if manual checks are needed. After approval your deposit and withdrawal limits increase and funding in USD opens. This demo simulates the process.', null),
  ],
  'futures-perpetuals-options': [
    art('what-is-a-perpetual-contract', 'What is a forex CFD?', 'A forex CFD is a contract that tracks the price of a currency pair such as EURUSD, with no expiry date. You can go long or short using margin, so you gain or lose based on price changes without owning the currency. Size is in lots, where 1 lot is 100,000 units, and price moves are measured in pips. Positions held overnight pay or earn a swap. Because positions are leveraged, for example 1:100, gains and losses are both amplified.', null),
    art('funding-rate-explained', 'Swap and rollover, step by step', 'Swap is a charge or credit applied when a position is held past the daily rollover time, 22:00 UTC in this demo. It reflects the interest rate difference between the two currencies in the pair, plus a broker markup. Swap is quoted per lot for long and short positions and is tripled once a week to cover the weekend. Check the swap values on the instrument page before holding through rollover.', null),
    art('options-basics', 'Options basics: calls, puts and premium', 'An option gives the buyer the right, not the obligation, to trade at a strike price by expiry. A call profits when price rises above the strike plus premium; a put profits when price falls below the strike minus premium. The premium is the most a buyer can lose. Sellers collect premium but can face large losses and need margin. Time decay and implied volatility affect option prices.', null),
  ],
  'risk-management': [
    art('margin-and-liquidation', 'Margin, leverage and stop-out', 'Required margin opens a position and margin level (equity divided by used margin) keeps it open. Leverage such as 1:100 lets you control larger size with less collateral but pulls the stop-out price closer to entry. Isolated margin limits risk to the margin assigned to one position; cross margin shares your account balance. If margin level falls to the stop-out level, positions are closed automatically, and negative balance protection covers gaps beyond zero.', null),
    art('position-sizing-and-stop-losses', 'Position sizing and stop-losses', 'Decide the amount you are willing to lose on a trade first, often a small percentage of your account. Divide it by the distance between entry and stop price to find position size. Place a stop-loss where your idea is proven wrong, not where it is convenient. Avoid adding leverage just to hit a target size. Spreads, swap and slippage should be part of your plan. In forex, divide your risk amount by the stop distance in pips and the pip value per lot to get your lot size.', null),
  ],
  'account-security': [
    art('secure-your-account', 'Secure your account in five steps', 'Use a unique long password from a password manager. Turn on authenticator-app two-factor authentication. Set an anti-phishing code that appears in genuine emails. Review active devices and sessions regularly. Never share one-time codes or screen-share with strangers. Support will never ask for your password or 2FA code.', null),
    art('withdrawal-whitelist-and-phishing', 'Withdrawal whitelist and spotting phishing', 'A withdrawal whitelist restricts transfers to bank accounts you approved, so an attacker who gains access still cannot send funds elsewhere. New addresses may carry a cooling-off period. Phishing messages create urgency, use look-alike domains and ask for logins or codes. Type the web address yourself or use a bookmark, verify the anti-phishing code, and double-check the account details of every withdrawal destination.', null),
  ],
};

const cats = [
  ['getting-started', 'Getting started', 'Order books, order types and account verification for new traders.'],
  ['futures-perpetuals-options', 'Forex, CFDs and options', 'How forex and CFD contracts work, including lots, pips, swap and options basics.'],
  ['risk-management', 'Risk management', 'Margin, leverage, stop-out, position sizing and stop-losses.'],
  ['account-security', 'Account security', 'Practical steps to protect a trading account.'],
];

export const courses = cats.map(([slug, courseName, courseDescription]) => ({
  _id: `course_${slug}`, courseName, courseDescription, courseLink: articles[slug][0].url,
  SUBCOURSE: articles[slug].map(tidy), createdAt: '2026-11-01T09:00:00Z', status: 'active',
}));
export const allArticles = Object.values(articles).flat();
