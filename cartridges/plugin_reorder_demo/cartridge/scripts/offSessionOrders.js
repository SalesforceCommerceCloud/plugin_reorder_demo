/**
 * Creates an order for the given customer using a previously saved off session payment method.
 * @param {dw.customer.Customer} customer - customer
 * @returns {dw.order.Order} created order
 */
function createOrder(customer) {
    var BasketMgr = require('dw/order/BasketMgr');
    var PaymentTransaction = require('dw/order/PaymentTransaction');
    var SalesforcePaymentMethod = require('dw/extensions/payments/SalesforcePaymentMethod');
    var SalesforcePaymentsMgr = require('dw/extensions/payments/SalesforcePaymentsMgr');
    var Transaction = require('dw/system/Transaction');

    var basketCalculationHelpers = require('*/cartridge/scripts/helpers/basketCalculationHelpers');
    var configurationHelper = require('~/cartridge/scripts/configurationHelper');
    var COHelpers = require('*/cartridge/scripts/checkout/checkoutHelpers');
    var validationHelpers = require('*/cartridge/scripts/helpers/basketValidationHelpers');

    var order;
    Transaction.wrap(function () {
        // Create a basket
        var basket = BasketMgr.currentOrNewBasket;

        // Set customer information in basket
        basket.customerName = 'Ima Tester';
        basket.customerEmail = 'ima@tester.com';

        // Add a product
        basket.createProductLineItem('029407331258M', basket.defaultShipment);

        // Set the shipping address and shipping method
        COHelpers.copyShippingAddressToShipment({
            address: {
                firstName: 'Ima',
                lastName: 'Tester',
                address1: '1 Main St',
                address2: '',
                city: 'New York',
                postalCode: '01234',
                stateCode: 'NY',
                countryCode: 'USA',
                phone: '3333333333'
            },
            shippingMethod: '001'
        }, basket.defaultShipment);

        // Copy billing address from shipping address
        COHelpers.copyBillingAddressToBasket(basket.defaultShipment.shippingAddress, basket);

        // Calculate the basket
        basketCalculationHelpers.calculateTotals(basket);

        // Create the order
        order = COHelpers.createOrder(basket);

        // Get the off session payment methods
        var paymentMethods = SalesforcePaymentsMgr.getOffSessionPaymentMethods(customer);

        // Confirm the payment
        SalesforcePaymentsMgr.confirmPaymentIntent(order, paymentMethods[0], 'SUBSCRIPTION');

        // Validate Stripe payment
        var paymentIntentValidation = validationHelpers.validatePaymentIntent(order, true);
        if (!paymentIntentValidation.error) {
            var paymentInstrument = paymentIntentValidation.paymentInstrument;
            var paymentIntent = paymentIntentValidation.paymentIntent;

            // Update the details in the payment instrument
            var paymentDetails = paymentIntent.paymentMethod.getPaymentDetails(paymentInstrument);
            SalesforcePaymentsMgr.setPaymentDetails(paymentInstrument, paymentDetails);

            // Update the payment transaction
            var paymentTransaction = paymentInstrument.paymentTransaction;
            paymentTransaction.amount = paymentIntent.amount;
            paymentTransaction.transactionID = paymentIntent.ID;

            // "Auth" only if manual capture is enabled for credit card payment, everything else
            // is "Capture".
            var configuration = configurationHelper.getConfiguration();
            if (paymentIntent.paymentMethod.type === SalesforcePaymentMethod.TYPE_CARD
                && configuration.cardCaptureAutomatic === false) {
                paymentTransaction.type = PaymentTransaction.TYPE_AUTH;
            } else {
                paymentTransaction.type = PaymentTransaction.TYPE_CAPTURE;
            }
        }

        // Place the order
        var placeOrderResult = COHelpers.placeOrder(order, {});
        if (!placeOrderResult.error) {
            COHelpers.sendConfirmationEmail(order, order.customerLocaleID);
        }
    });

    return order;
}

/**
 * Reorder the same items placed in previous order using the previously saved off session payment method.
 * @param {dw.customer.Customer} customer - customer
 * @param {dw.order.Order} prevOrder - previous order
 * @param {dw.extensions.payments.SalesforcePaymentMethod} paymentMethod - payment method used in previous order
 * @returns {dw.order.Order} created order
 */
function reorder(customer, prevOrder, paymentMethod) {
    var BasketMgr = require('dw/order/BasketMgr');
    var PaymentTransaction = require('dw/order/PaymentTransaction');
    var SalesforcePaymentMethod = require('dw/extensions/payments/SalesforcePaymentMethod');
    var SalesforcePaymentsMgr = require('dw/extensions/payments/SalesforcePaymentsMgr');
    var Transaction = require('dw/system/Transaction');

    var basketCalculationHelpers = require('*/cartridge/scripts/helpers/basketCalculationHelpers');
    var configurationHelper = require('*/cartridge/scripts/configurationHelper');
    var COHelpers = require('*/cartridge/scripts/checkout/checkoutHelpers');
    var validationHelpers = require('*/cartridge/scripts/helpers/basketValidationHelpers');
    var collections = require('*/cartridge/scripts/util/collections');

    var order;
    Transaction.wrap(function () {
        // Create a basket
        var basket = BasketMgr.currentOrNewBasket;

        // Set customer information in basket
        basket.customerName = customer.profile.firstName + ' ' + customer.profile.lastName;
        basket.customerEmail = customer.profile.email;

        // Add products
        var allLineItems = prevOrder.allProductLineItems;
        collections.forEach(allLineItems, function (pli) {
            basket.createProductLineItem(pli.productID, pli.quantity, basket.defaultShipment);
        });

        // Set the shipping address and shipping method
        var shippingAddress = prevOrder.shipments[0].shippingAddress;
        var shippingData = {
            address: {
                firstName: shippingAddress.firstName,
                lastName: shippingAddress.lastName,
                address1: shippingAddress.address1,
                address2: shippingAddress.address2,
                city: shippingAddress.city,
                postalCode: shippingAddress.postalCode,
                stateCode: shippingAddress.stateCode,
                countryCode: shippingAddress.countryCode,
                phone: shippingAddress.phone
            }
        };

        // Copy billing address from shipping address
        COHelpers.copyShippingAddressToShipment({
            address: shippingData.address,
            shippingMethod: prevOrder.shipments[0].shippingMethodID
        }, basket.defaultShipment);

        COHelpers.copyBillingAddressToBasket(prevOrder.billingAddress, basket);

        // Calculate the basket
        basketCalculationHelpers.calculateTotals(basket);

        // Create the order
        order = COHelpers.createOrder(basket);

        // add note to source order
        prevOrder.addNote('Reorder note', 'Used to create new order ' + order.currentOrderNo + ' to make the purchase again.');

        // Confirm the payment
        SalesforcePaymentsMgr.confirmPaymentIntent(order, paymentMethod, 'SUBSCRIPTION');

        // Validate Stripe payment
        var paymentIntentValidation = validationHelpers.validatePaymentIntent(order, true);
        if (!paymentIntentValidation.error) {
            var paymentInstrument = paymentIntentValidation.paymentInstrument;
            var paymentIntent = paymentIntentValidation.paymentIntent;

            // Update the details in the payment instrument
            var paymentDetails = paymentIntent.paymentMethod.getPaymentDetails(paymentInstrument);
            SalesforcePaymentsMgr.setPaymentDetails(paymentInstrument, paymentDetails);

            // Update the payment transaction
            var paymentTransaction = paymentInstrument.paymentTransaction;
            paymentTransaction.amount = paymentIntent.amount;
            paymentTransaction.transactionID = paymentIntent.ID;

            // "Auth" only if manual capture is enabled for credit card payment, everything else
            // is "Capture".
            var configuration = configurationHelper.getConfiguration();
            if (paymentIntent.paymentMethod.type === SalesforcePaymentMethod.TYPE_CARD
                && configuration.cardCaptureAutomatic === false) {
                paymentTransaction.type = PaymentTransaction.TYPE_AUTH;
            } else {
                paymentTransaction.type = PaymentTransaction.TYPE_CAPTURE;
            }
        }

        // Place the order
        var placeOrderResult = COHelpers.placeOrder(order, {});
        if (!placeOrderResult.error) {
            COHelpers.sendConfirmationEmail(order, order.customerLocaleID);
        }
    });

    return order;
}

exports.createOrder = createOrder;
exports.reorder = reorder;
exports.execute = function () {
    var CustomerMgr = require('dw/customer/CustomerMgr');
    var Status = require('dw/system/Status');

    var customer = CustomerMgr.getCustomerByCustomerNumber('00000001');
    createOrder(customer);
    return new Status(Status.OK);
};
