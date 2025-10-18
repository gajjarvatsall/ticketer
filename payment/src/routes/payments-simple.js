const express = require("express");
const axios = require("axios");
const Payment = require("../models/Payment");
const { logger } = require("../utils/logger");
const { verifyAuth } = require("../middleware/auth");

const router = express.Router();

// Simulate card brand detection
function getCardBrand(cardNumber) {
  const firstDigit = cardNumber.charAt(0);
  if (firstDigit === "4") return "Visa";
  if (firstDigit === "5") return "Mastercard";
  if (firstDigit === "3") return "American Express";
  return "Unknown";
}

// Process payment
router.post("/process", verifyAuth, async (req, res) => {
  try {
    const { orderId, paymentMethod, paymentDetails } = req.body;

    if (!orderId || !paymentMethod || !paymentDetails) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    // Get order details from ticket service
    const orderResponse = await axios.get(
      `${process.env.TICKET_SERVICE_URL}/api/tickets/orders/${orderId}`,
      { headers: { cookie: req.headers.cookie } }
    );

    const order = orderResponse.data.order;
    if (!order) {
      return res.status(404).json({ error: "Order not found" });
    }

    if (order.status !== "pending") {
      return res.status(400).json({ error: "Order is not in pending status" });
    }

    // Check for existing successful payment
    const existingPayment = await Payment.findOne({ orderId });
    if (existingPayment && existingPayment.status === "completed") {
      return res
        .status(400)
        .json({ error: "Payment already processed for this order" });
    }

    // Simulate payment processing (90% success rate)
    const success = Math.random() > 0.1;
    const transactionId = success
      ? "txn_" + Date.now() + Math.random().toString(36).substr(2, 8)
      : undefined;

    let cardLast4, cardBrand;
    if (paymentDetails.cardNumber) {
      cardLast4 = paymentDetails.cardNumber.slice(-4);
      cardBrand = getCardBrand(paymentDetails.cardNumber);
    }

    // Create payment record
    const payment = new Payment({
      orderId,
      userId: req.user.id,
      amount: order.totalAmount,
      currency: "USD",
      paymentMethod,
      status: success ? "completed" : "failed",
      gatewayResponse: {
        transactionId,
        responseCode: success ? "SUCCESS" : "DECLINED",
        responseMessage: success
          ? "Payment processed successfully"
          : "Payment declined by bank",
      },
      paymentDetails: {
        cardLast4,
        cardBrand,
      },
    });

    await payment.save();

    // Update order status if payment successful
    if (success) {
      await axios.put(
        `${process.env.TICKET_SERVICE_URL}/api/tickets/orders/${orderId}/status`,
        { status: "confirmed" }
      );

      logger.info("Payment processed successfully", {
        paymentId: payment._id,
        orderId,
        userId: req.user.id,
        amount: order.totalAmount,
      });

      res.json({
        success: true,
        message: "Payment processed successfully",
        paymentId: payment._id,
        transactionId,
        payment: {
          id: payment._id,
          status: payment.status,
          transactionId,
          amount: payment.amount,
        },
      });
    } else {
      logger.warn("Payment failed", {
        paymentId: payment._id,
        orderId,
      });

      res.status(400).json({
        success: false,
        message: "Payment failed. Please try again.",
        paymentId: payment._id,
      });
    }
  } catch (error) {
    logger.error("Error processing payment:", error);
    res
      .status(500)
      .json({ error: "Internal server error", details: error.message });
  }
});

// Get payment status
router.get("/status/:orderId", verifyAuth, async (req, res) => {
  try {
    const payment = await Payment.findOne({
      orderId: req.params.orderId,
    }).select("-__v");

    if (!payment) {
      return res.status(404).json({ error: "Payment not found" });
    }

    res.json({ payment });
  } catch (error) {
    logger.error("Error fetching payment status:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

module.exports = router;
