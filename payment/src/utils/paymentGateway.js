// Dummy payment gateway for demonstration purposes
// In a real application, you would integrate with actual payment processors like Stripe, PayPal, etc.

const { logger } = require('./logger');

const processPayment = async (paymentData) => {
  const { amount, currency, paymentMethod, paymentDetails, orderId } = paymentData;
  
  logger.info('Processing payment', { orderId, amount, paymentMethod });

  // Simulate processing time
  await new Promise(resolve => setTimeout(resolve, 2000));

  // Generate a dummy transaction ID
  const transactionId = 'TXN_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);

  // Simulate payment success/failure (90% success rate)
  const success = Math.random() > 0.1;

  const response = {
    success,
    transactionId,
    responseCode: success ? 'SUCCESS' : 'DECLINED',
    responseMessage: success ? 'Payment processed successfully' : 'Payment declined by issuer',
    processingTime: 2000
  };

  if (success) {
    logger.info('Payment successful', { transactionId, orderId });
  } else {
    logger.warn('Payment failed', { orderId, reason: response.responseMessage });
  }

  return response;
};

const refundPayment = async (transactionId, amount, reason) => {
  logger.info('Processing refund', { transactionId, amount, reason });

  // Simulate processing time
  await new Promise(resolve => setTimeout(resolve, 1500));

  // Generate a dummy refund ID
  const refundId = 'REF_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);

  // Simulate refund success (95% success rate)
  const success = Math.random() > 0.05;

  const response = {
    success,
    refundId,
    responseCode: success ? 'REFUND_SUCCESS' : 'REFUND_FAILED',
    responseMessage: success ? 'Refund processed successfully' : 'Refund failed - contact support',
    processingTime: 1500
  };

  if (success) {
    logger.info('Refund successful', { refundId, transactionId });
  } else {
    logger.warn('Refund failed', { transactionId, reason: response.responseMessage });
  }

  return response;
};

module.exports = {
  processPayment,
  refundPayment
};
