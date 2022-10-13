'use strict';

var server = require('server');
server.extend(module.superModule);

server.append('Show', function (req, res, next) {
    var URLUtils = require('dw/web/URLUtils');
    var AccountModel = require('*/cartridge/models/account');
    var configurationHelper = require('~/cartridge/scripts/configurationHelper');

    configurationHelper.appendConfiguration(res);
    var viewData = res.getViewData();

    if (viewData.commercePaymentsConfiguration.multiStepCheckoutEnabled) {
        var paymentMethods = AccountModel.getCustomerPaymentMethods(req.currentCustomer.raw);

        viewData.viewSavedPaymentsUrl = URLUtils.url('PaymentInstruments-ListPaymentMethods').toString();
        viewData.addPaymentUrl = null;
        if (paymentMethods.empty) {
            viewData.payment = null;
        } else {
            viewData.payment = paymentMethods[0];
        }
    }

    res.setViewData(viewData);
    next();
});

server.get('CreateOffSessionOrder', server.middleware.https, function (req, res, next) {
    var URLUtils = require('dw/web/URLUtils');
    var offSessionOrders = require('~/cartridge/scripts/offSessionOrders');

    var order = offSessionOrders.createOrder(req.currentCustomer.raw);
    res.redirect(URLUtils.url('Order-Details', 'orderID', order.orderNo));
    next();
});

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
