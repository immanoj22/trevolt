// Trading endpoints: instruments, orders, positions, history, leverage (AES envelope replies).
import { Router } from 'express';
import * as engine from './engine.js';

export const tradeRoutes = ({ ok, h }) => {
  const r = Router();
  const view = (kind) => h((req) => ok(engine.list(req.user.id, kind, req.params.pair, req.query.page, req.query.limit)));

  r.get('/future/get_pair_details', h(() => ok({ data: engine.pairList() }), { auth: false }));
  r.post('/future/order_placing', h((req, b) => ok(engine.placeOrder(req.user, b), 'Order placed successfully')));
  r.get('/future/cancelOrder/:id', h((req) => { engine.cancelOrder(req.user.id, req.params.id); return ok({}, 'Order cancelled'); }));
  r.post('/future/cancelAllOrder', h((req, b) => {
    // an explicit id list cancels just those orders, otherwise everything open
    if (Array.isArray(b.orderId)) b.orderId.forEach((id) => { try { engine.cancelOrder(req.user.id, id); } catch { /* already gone */ } });
    else engine.cancelAllOrders(req.user.id);
    return ok({}, 'Orders cancelled');
  }));
  r.post('/future/closePosition', h((req, b) => ok(engine.closePosition(req.user.id, b), 'Position closed')));
  r.post('/future/closeAllPosition', h((req) => { engine.closeAllPositions(req.user.id); return ok({}, 'All positions closed'); }));
  r.post('/future/updateBracketOrders', h((req, b) => { engine.setBrackets(req.user.id, b); return ok({}, 'TP/SL updated'); }));
  r.post('/future/changeLeverage', h((req, b) => { engine.changeLeverage(req.user.id, b); return ok({}, 'Leverage updated'); }));

  // :pair is a pair id or "all"; :mode is the trade mode (only futures exists)
  r.get('/future/positionOrders/:pair/:mode', h((req) => ok(engine.openPositions(req.user.id, req.params.pair))));
  r.get('/future/openOrder/:pair/:mode', view('open'));
  r.get('/future/stopOrders/:pair/:mode', view('stop'));
  r.get('/future/orderHistory/:pair/:mode', view('history'));
  r.get('/future/filledHistory/:pair/:mode', view('fills'));
  r.get('/future/closedOrders/:pair/:mode', view('closed'));
  return r;
};
