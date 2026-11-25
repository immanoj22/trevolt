# Trevolt API

Small real backend for the Trevolt forex/CFD demo (web app, React Native app and admin panel).
Node ESM, Express, Socket.IO and the built-in `node:sqlite` (Node 22.5+; developed on Node 26). Data lives in `data/trevolt.db`, created and seeded on first start.

## Run

```
npm install
npm start                      # PORT=5000 by default
PORT=5100 npm start            # any other port
node --env-file=.env server.js # optional: load a .env copied from .env.example
```

Environment variables: `PORT`, `SECRET` (AES key, default `demo`), `JWT_SECRET`, `ADMIN_JWT_SECRET` (dev placeholders by default), `DB_FILE`.
Delete `data/` to reset to the seed data.

## Seed accounts (demo values, first run only)

Demo user: `alex@demo.com` / `Demo@12345` (verified KYC, ~USD 24.8k, open positions, orders and closed trades).
Two more users (`jordan@demo.com`, `sam@demo.com`, KYC pending) use the same password.
Admin: `admin@trevolt.test` / `Admin@12345`.
They can be changed through `SEED_*` variables (see `.env.example`) before the first start.

## The encrypted envelope

Clients send `{ token: AES(JSON body) }` and receive `AES(JSON)` of `{ success, status, statusCode, message, result }` (CryptoJS passphrase mode, key = `SECRET`).
`ok()` builds the envelope and `enc()` encrypts it in `server.js`; errors use the same shape with a 4xx status. 401 replies are plain JSON.
Admin endpoints and the chart (TradingView UDF) endpoints are plain JSON.

## Auth

`POST /user/login` returns `result.token` (HS256 JWT) and also sets an httpOnly `auth_token` cookie (`SameSite=Lax`). Send the token as the cookie (web) or `Authorization: Bearer` (mobile). Blocked users cannot log in and their tokens stop working. Admin tokens use a different secret and role.

## Endpoints

Real (SQLite-backed):

- Auth/account: `POST /user/registration`, `POST /user/login`, `POST /user/login_verification`, `GET /user/logout`, `GET /user/get_user_details`
- Wallet: `POST /future/availableMargin`, `GET /wallet/get_user_wallet`, `POST /user/get_transaction_history`, `POST /user/get_passbook_history`, `POST /wallet/internal_fiat_deposit`, `POST /wallet/internal_fiat_withdraw` (both create pending requests; a withdrawal holds the amount until an admin decides)
- Trading: `GET /future/get_pair_details`, `POST /future/order_placing`, `GET /future/cancelOrder/:id`, `POST /future/cancelAllOrder`, `POST /future/closePosition`, `POST /future/closeAllPosition`, `POST /future/updateBracketOrders` (TP/SL), `POST /future/changeLeverage`, `GET /future/{positionOrders,openOrder,stopOrders,orderHistory,filledHistory,closedOrders}/:pairId|all/:mode`
- Admin (`/api/admin`, see `../docs/admin-api.md`): `login`, `stats`, `users`, `users/:id` (+ `PATCH`, `adjust`), `transactions` (+ `PATCH` approve/reject), `orders`, `positions`, `instruments` (+ `PATCH`)

Still mock (static content): CMS, blog, learn, announcements, notifications, options chain, copy-trade strategies, referral, API keys, sub-accounts, P&L analytics charts, order book and recent trades, chart history candles.

Every route is also reachable under an `/api` prefix.

## Trading model

- Ten instruments seeded from `data.js`; a random-walk feed ticks every 1.5 s and emits `FututresPrice` (plus `FuturesorderBook`, `FuturesrecentTrade`).
- Market orders fill at ask (buy) or bid (sell) = mark +/- half the spread. Limit, stop and stop-limit orders rest and fill when price crosses.
- Positions are kept per instrument and side (long and short can coexist); a buy opens/adds to a long, a sell to a short, and `closePosition` realises PnL.
- Margin = notional / leverage, notional in USD. Free margin = balance minus position margin minus margin reserved by resting orders. Commission is USD 3.5 per lot on every fill.
- Positions are stopped out when equity falls below half of the used margin. Optional TP/SL close positions automatically.
- Socket events per user (room joined with `CREATE_ROOM`): `FuturesPositionOrder`, `FuturesopenOrder`, `Futurestoporder`, `FuturesorderHistory`, `FuturefilledHistory`, `FutureClosedPositionHistory`, `USER_BALANCE`.

Limits: the ledger is USD only (deposit currency is ignored), there is no OTP step, and a client-chosen `CREATE_ROOM` id is trusted unless the socket handshake carries a valid token.
