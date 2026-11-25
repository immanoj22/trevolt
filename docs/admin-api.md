# Admin API contract (api <-> admin)

Plain JSON (not encrypted). Base path `/api/admin`. Every route except `POST /login` needs `Authorization: Bearer <jwt>`.
Success: `{ "success": true, "data": ..., "total": <number, lists only> }`. Error: `{ "success": false, "message": "..." }` with a 4xx status.
Lists accept `page` (default 1) and `limit` (default 20).

| Method and path | Body / query | Returns `data` |
|---|---|---|
| `POST /login` | `{ email, password }` | `{ token, admin: { id, email, name } }` |
| `GET /stats` | | `{ users, newUsers7d, kycPending, depositsPending, withdrawalsPending, openOrders, openPositions, totalBalanceUSD, volume24hUSD, recent: [{ type, text, at }] }` |
| `GET /users` | `search`, `status`, `kyc` | `[{ id, accountId, email, name, kycStatus, status, balanceUSD, createdAt, lastLoginAt }]` |
| `GET /users/:id` | | user plus `positions[]`, `recentOrders[]`, `transactions[]` |
| `PATCH /users/:id` | `{ kycStatus?: pending/approved/rejected, status?: active/blocked }` | updated user |
| `POST /users/:id/adjust` | `{ amount (can be negative), note }` | `{ balanceUSD }` |
| `GET /transactions` | `type` (deposit/withdrawal), `status` (pending/approved/rejected) | `[{ id, type, userId, userEmail, amount, currency, method, reference, status, createdAt, processedAt }]` |
| `PATCH /transactions/:id` | `{ action: approve/reject, note? }` | updated transaction |
| `GET /orders` | `status` (open/filled/cancelled), `symbol` | `[{ id, userId, userEmail, symbol, side, type, quantity, price, filledQuantity, status, createdAt }]` |
| `GET /positions` | `symbol` | `[{ id, userId, userEmail, symbol, side, size, entryPrice, markPrice, pnl, margin, openedAt }]` |
| `GET /instruments` | | `[{ id, symbol, name, price, spreadPips, maxLeverage, minLot, status }]` |
| `PATCH /instruments/:id` | `{ spreadPips?, maxLeverage?, status?: active/disabled }` | updated instrument |

Rules: approving a deposit credits the user's USD balance; approving a withdrawal debits it (a withdrawal request already reserves the amount, so approve finalises it and reject returns it). Blocked users cannot log in or place orders. Admin credentials are demo seed values documented in `api/README.md`.
