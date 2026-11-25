# Trevolt Admin

A small admin panel for the Trevolt demo. It lets an operator look at platform stats, manage users and their KYC status, approve or reject deposits and withdrawals, watch orders and positions, and edit instrument settings (spread, max leverage, status).

It is a React 18 + Vite app with plain CSS and `fetch`. There is no UI library and no state library.

## Run it

```
npm install
npm run dev
```

The dev server listens on http://localhost:5174. `npm run build` makes a production build in `dist/`.

## Environment variables

Copy `.env.example` to `.env` if you need to change anything.

- `VITE_API_URL` is the backend base URL. Default `http://localhost:5000/api`.
- `VITE_USE_MOCK` set to `true` to use built-in fake data. Default `false`.

## How it connects to the backend

Every request goes to `${VITE_API_URL}/admin/...` and follows `../docs/admin-api.md`. Responses look like `{ success, data, total }`. After `POST /admin/login` the JWT is saved in `localStorage` and sent as a Bearer token. A 401 clears it and sends you back to the login page. The admin demo credentials are in `../api/README.md`.

## Mock mode

Run `VITE_USE_MOCK=true npm run dev` and the app never calls the network. Any email and password are accepted.
The fake data lives in `src/mock/` and is only used by `src/api.js` when that flag is set. Changes are kept in memory and reset on reload.

## Layout

- `src/api.js` and `src/auth.js`: API client and token storage
- `src/pages/`: Login, Dashboard, Users, Transactions, Trading (orders and positions), Instruments
- `src/components/`: layout, table, badge, modal and other small pieces
- `src/styles.css`: all styles, with CSS variables for the light and dark themes
