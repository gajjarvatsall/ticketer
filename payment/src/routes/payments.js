const express = require('express');
const Joi = require('joi');
const axios = require('axios');
const Payment = require('../models/Payment');
const { logger } = require('../utils/logger');
const { verifyAuth } = require('../middleware/auth');
const { processPayment } = require('../utils/paymentGateway');

const router = express.Router();

// Validation schemas
const paymentSchema = Joi.object({
  orderId: Joi.string().required(),
  paymentMethod: Joi.string().valid('credit_card', 'debit_card', 'paypal', 'bank_transfer').required(),
  paymentDetails: Joi.object({
    cardNumber: Joi.string().when('...paymentMethod', {
      is: Joi.string().valid('credit_card', 'debit_card'),
      then: Joi.required(),
      otherwise: Joi.optional()
    }),
    expiryMonth: Joi.string().when('...paymentMethod', {
      is: Joi.string().valid('credit_card', 'debit_card'),
      then: Joi.required(),
      otherwise: Joi.optional()
    }),
    expiryYear: Joi.string().when('...paymentMethod', {
      is: Joi.string().valid('credit_card', 'debit_card'),
      then: Joi.required(),
      otherwise: Joi.optional()
    }),
    cvv: Joi.string().when('...paymentMethod', {
      is: Joi.string().valid('credit_card', 'debit_card'),
      then: Joi.required(),
      otherwise: Joi.optional()
    }),
    cardholderName: Joi.string().when('...paymentMethod', {
      is: Joi.string().valid('credit_card', 'debit_card'),
      then: Joi.required(),
      otherwise: Joi.optional()
    }),
    email: Joi.string().email().when('...paymentMethod', {
      is: 'paypal',
      then: Joi.required(),
      otherwise: Joi.optional()
    })
  }).required()
});

// Process payment
router.post('/process', verifyAuth, async (req, res) => {
  try {
    const { error, value } = paymentSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    const { orderId, paymentMethod, paymentDetails } = value;

    // Get order details from ticket service
    const orderResponse = await axios.get(
      `${process.env.TICKET_SERVICE_URL}/api/tickets/orders/${orderId}`,
      {
        headers: { cookie: req.headers.cookie }
      }
    );

    const order = orderResponse.data.order;
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    if (order.status !== 'pending') {
      return res.status(400).json({ error: 'Order is not in pending status' });
    }

    // Check if payment already exists
    const existingPayment = await Payment.findOne({ orderId });
    if (existingPayment && existingPayment.status === 'completed') {
      return res.status(400).json({ error: 'Payment already processed for this order' });
    }

    // Create payment record
    const payment = new Payment({
      orderId,
      userId: req.user.id,
      amount: order.totalAmount,
      paymentMethod,
      paymentDetails: {
        cardLast4: paymentDetails.cardNumber ? paymentDetails.cardNumber.slice(-4) : undefined,
        cardBrand: paymentDetails.cardNumber ? getCardBrand(paymentDetails.cardNumber) : undefined
      }
    });

    await payment.save();

    // Process payment through gateway
    try {
      payment.status = 'processing';
      await payment.save();

      const gatewayResponse = await processPayment({
        amount: order.totalAmount,
        currency: 'USD',
        paymentMethod,
        paymentDetails,
        orderId
      });

      // Update payment with gateway response
      payment.gatewayResponse = gatewayResponse;
      payment.status = gatewayResponse.success ? 'completed' : 'failed';
      await payment.save();

      if (gatewayResponse.success) {
        logger.info('Payment processed successfully', {
          paymentId: payment._id,
          orderId,
          userId: req.user.id,
          amount: order.totalAmount
        });

        res.json({
          message: 'Payment processed successfully',
          payment: {
            id: payment._id,
            status: payment.status,
            transactionId: gatewayResponse.transactionId,
            amount: payment.amount
          }
        });
      } else {
        logger.warn('Payment failed', {
          paymentId: payment._id,
          orderId,
          reason: gatewayResponse.responseMessage
        });

        res.status(400).json({
          error: 'Payment failed',
          message: gatewayResponse.responseMessage
        });
      }
    } catch (gatewayError) {
      payment.status = 'failed';
      payment.gatewayResponse = {
        responseCode: 'GATEWAY_ERROR',
        responseMessage: gatewayError.message
      };
      await payment.save();

      logger.error('Payment gateway error:', gatewayError);
      res.status(500).json({ error: 'Payment processing failed' });
    }
  } catch (error) {
    logger.error('Error processing payment:', error);
    if (error.response?.status === 404) {
      return res.status(404).json({ error: 'Order not found' });
    }
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get payment status
router.get('/status/:orderId', verifyAuth, async (req, res) => {
  try {
    const { orderId } = req.params;

    const payment = await Payment.findOne({ orderId, userId: req.user.id })
      .select('-paymentDetails -gatewayResponse.responseMessage');

    if (!payment) {
      return res.status(404).json({ error: 'Payment not found' });
    }

    res.json({ payment });
  } catch (error) {
    logger.error('Error fetching payment status:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Helper function to determine card brand
function getCardBrand(cardNumber) {
  const firstDigit = cardNumber.charAt(0);
  const firstTwoDigits = cardNumber.substring(0, 2);
  const firstFourDigits = cardNumber.substring(0, 4);

  if (firstDigit === '4') return 'Visa';
  if (firstTwoDigits >= '51' && firstTwoDigits <= '55') return 'Mastercard';
  if (firstTwoDigits === '34' || firstTwoDigits === '37') return 'American Express';
  if (firstFourDigits === '6011' || firstTwoDigits === '65') return 'Discover';
  
  return 'Unknown';
}

module.exports = router;
