// Account, auth and wallet endpoints used by the web and mobile apps (AES envelope replies).
import { Router } from 'express';
import { db, tx, post, uid, now } from './db.js';
import { hashPassword, verifyPassword, signJwt, JWT_SECRET, setAuthCookie, clearAuthCookie } from './auth.js';
import { ApiError, walletView, freeMargin } from './engine.js';
import { user as baseUser } from './data.js';
import { userExtra } from './demo.js';

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const KEY = process.env.SECRET || 'demo';

// Profile object the apps read; the demo user keeps its richer showcase fields.
const userView = (u) => {
  const kyc = u.kyc_status, name = `${u.first_name || ''} ${u.last_name || ''}`.trim() || u.email.split('@')[0];
  const extra = u.id === 'user1' ? userExtra : { ...userExtra, loginHistory: [], bankAccounts: [], referralCode: u.account_id, userGreenId: u.account_id, tfaStatus: false, google: { enabled: false } };
  return { ...baseUser, ...extra, _id: u.id, userId: u.id, accountId: u.account_id, secretKey: KEY, firstName: u.first_name, lastName: u.last_name, name, accountName: name,
    userName: u.email.split('@')[0], email: u.email, kycStatus: kyc, status: u.status, createdAt: u.created_at, isDemo: u.id === 'user1',
    kycPanCardStatus: kyc, kycLiveNessStatus: kyc, kycAadharStatus: kyc, kycfinancialStatus: kyc, kycMobileStatus: kyc, externalKycStatus: kyc };
};

const pageArgs = (req, body) => {
  const p = Math.max(+(body.page || req.query.page) || 1, 1), limit = Math.min(Math.max(+(body.limit || req.query.limit) || 50, 1), 200);
  return { p, limit, offset: (p - 1) * limit };
};
const list = (data, count, p, limit) => ({ data, count, currentPage: p, nextPage: p * limit < count });

export const userRoutes = ({ ok, h }) => {
  const r = Router();

  r.post('/user/registration', h((req, b) => {
    const email = String(b.email || '').trim().toLowerCase(), errors = {};
    if (!EMAIL.test(email)) errors.email = 'Enter a valid email address';
    if (String(b.password || '').length < 8) errors.password = 'Password must be at least 8 characters';
    if (b.confirmPassword !== undefined && b.confirmPassword !== b.password) errors.confirmPassword = 'Passwords do not match';
    if (!errors.email && db.prepare('SELECT 1 FROM users WHERE email = ?').get(email)) errors.email = 'Email is already registered';
    if (Object.keys(errors).length) throw new ApiError(Object.values(errors)[0], 400, errors);
    const n = db.prepare('SELECT COUNT(*) n FROM users').get().n;
    db.prepare('INSERT INTO users (id, account_id, email, first_name, last_name, dob, password_hash, created_at) VALUES (?,?,?,?,?,?,?,?)')
      .run(uid('usr'), `ACC${1001 + n}`, email, b.firstName || '', b.lastName || '', b.dob || null, hashPassword(b.password), now());
    return ok({}, 'Registration successful. You can now log in.');
  }, { auth: false }));

  // login_verification is only reached by clients after an OTP step, which this backend never asks for; it behaves like login.
  const login = h((req, b, res) => {
    const u = db.prepare('SELECT * FROM users WHERE email = ?').get(String(b.email || '').trim().toLowerCase());
    if (!u || !verifyPassword(b.password, u.password_hash)) {
      const msg = 'Invalid email or password';
      throw new ApiError(msg, 400, { email: msg, password: msg });
    }
    if (u.status === 'blocked') throw new ApiError('Your account has been blocked. Please contact support.');
    db.prepare('UPDATE users SET last_login_at = ? WHERE id = ?').run(now(), u.id);
    const token = signJwt({ userId: u.id, accountId: u.account_id, role: 'user', showWelcomeCard: false }, JWT_SECRET);
    setAuthCookie(res, token);
    return ok({ isLogged: true, token, status: 'success' }, 'Login successful');
  }, { auth: false });
  r.post('/user/login', login);
  r.post('/user/login_verification', login);

  r.get('/user/logout', h((req, b, res) => { clearAuthCookie(res); return ok({}, 'Logged out'); }, { auth: false }));
  r.get('/user/get_user_details', h((req) => ok({ data: userView(req.user) })));

  // ---- wallet ----
  r.post('/future/availableMargin', h((req) => ok(walletView(req.user.id))));
  r.get('/wallet/get_user_wallet', h((req) => {
    const w = walletView(req.user.id);
    return ok({ data: [{ _id: 'USD', balance: w.walletBalance, futuresBalance: w.availableBalance, optionBalance: 0, pip: 2 }], count: 1, currentPage: 1, nextPage: false });
  }));

  // deposit and withdrawal requests stay pending until an admin processes them
  r.post('/wallet/internal_fiat_deposit', h((req, b) => {
    const amount = +b.amount;
    if (!(amount > 0)) throw new ApiError('Enter a valid amount', 400, { amount: 'Amount is required' });
    db.prepare('INSERT INTO requests (id, user_id, type, amount, method, reference, created_at) VALUES (?,?,?,?,?,?,?)')
      .run(uid('req'), req.user.id, 'deposit', amount, b.pay_mode || null, b.transactionNumber || null, now());
    return ok({}, 'Deposit request submitted. It will be credited once approved.');
  }));
  r.post('/wallet/internal_fiat_withdraw', h((req, b) => {
    const amount = +b.amount;
    if (!(amount > 0)) throw new ApiError('Enter a valid amount', 400, { amount: 'Amount is required' });
    if (amount > freeMargin(req.user.id)) throw new ApiError('Insufficient available balance', 400, { amount: 'Insufficient available balance' });
    // reserve the amount now; admin approval finalises it, rejection returns it
    tx(() => {
      const id = uid('req');
      db.prepare('INSERT INTO requests (id, user_id, type, amount, method, reference, created_at) VALUES (?,?,?,?,?,?,?)')
        .run(id, req.user.id, 'withdrawal', amount, b.pay_mode || b.paymentMethod || null, b.accountNo || null, now());
      post(req.user.id, 'withdrawal', -amount, id, 'Withdrawal request');
    });
    return ok({}, 'Withdrawal request submitted. Funds are held until it is processed.');
  }));

  r.post('/user/get_transaction_history', h((req, b) => {
    const { p, limit, offset } = pageArgs(req, b);
    const total = db.prepare('SELECT COUNT(*) n FROM requests WHERE user_id = ?').get(req.user.id).n;
    const rows = db.prepare('SELECT * FROM requests WHERE user_id = ? ORDER BY created_at DESC LIMIT ? OFFSET ?').all(req.user.id, limit, offset);
    return ok(list(rows.map((t) => ({ _id: t.id, currencyId: t.currency, transferType: t.type === 'deposit' ? 'credit' : 'debit', status: t.status === 'approved' ? 'completed' : t.status,
      transactionAmount: t.amount, finalAmount: t.amount, createdAt: t.created_at, updatedAt: t.processed_at || t.created_at })), total, p, limit));
  }));
  r.post('/user/get_passbook_history', h((req, b) => {
    const { p, limit, offset } = pageArgs(req, b);
    const total = db.prepare('SELECT COUNT(*) n FROM ledger WHERE user_id = ?').get(req.user.id).n;
    const rows = db.prepare('SELECT * FROM ledger WHERE user_id = ? ORDER BY id DESC LIMIT ? OFFSET ?').all(req.user.id, limit, offset);
    return ok(list(rows.map((t) => ({ _id: `l${t.id}`, currencyId: 'USD', transferType: t.amount >= 0 ? 'credit' : 'debit', status: 'completed', type: t.type, note: t.note,
      transactionAmount: Math.abs(t.amount), finalAmount: Math.abs(t.amount), balanceAfter: t.balance_after, createdAt: t.created_at, updatedAt: t.created_at })), total, p, limit));
  }));

  return r;
};
