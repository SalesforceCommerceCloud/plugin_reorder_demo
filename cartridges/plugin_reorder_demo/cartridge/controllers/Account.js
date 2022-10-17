'use strict';

var server = require('server');
server.extend(module.superModule);

server.get('Reorder', function (req, res, next) {
    var URLUtils = require('dw/web/URLUtils');
    var offSessionOrders = require('~/cartridge/scripts/offSessionOrders');
    var paymentHelpers = require('*/cartridge/scripts/helpers/paymentHelpers');
    var Order = require('dw/order/Order');

    var orderHistory = req.currentCustomer.raw.getOrderHistory();
    var orders = orderHistory.getOrders(
        'status!={0}',
        'creationDate desc',
        Order.ORDER_STATUS_REPLACED
    );

    var prevOrder;
    while (orders.hasNext()) {
        var curr = orders.next();
        if (curr.currentOrderNo === req.querystring.orderID) {
            prevOrder = curr;
            break;
        }
    }
    var paymentIntent = paymentHelpers.getPaymentIntent(prevOrder);
    var paymentMethod = paymentIntent.paymentMethod;

    var order = offSessionOrders.reorder(req.currentCustomer.raw, prevOrder, paymentMethod);
    res.redirect(URLUtils.url('Order-Details', 'orderID', order.orderNo));

    next();
});

module.exports = server.exports();
