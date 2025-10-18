const express = require("express");
const axios = require("axios");
const Order = require("../models/Order");
const { logger } = require("../utils/logger");
const { verifyAuth } = require("../middleware/auth");

const router = express.Router();

// Book tickets
router.post("/book", verifyAuth, async (req, res) => {
  try {
    const { eventId, tickets, customerInfo } = req.body;

    if (!eventId || !tickets || !customerInfo) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    // Get event details
    const eventResponse = await axios.get(
      `${process.env.EVENT_SERVICE_URL}/api/events/${eventId}`
    );
    const event = eventResponse.data.event;

    if (!event) {
      return res.status(404).json({ error: "Event not found" });
    }

    // Calculate total
    let totalAmount = 0;
    const orderTickets = [];

    for (const requestedTicket of tickets) {
      const eventTicket = event.ticketTypes.find(
        (t) => t.name === requestedTicket.ticketTypeName
      );

      if (!eventTicket) {
        return res.status(400).json({
          error: `Ticket type '${requestedTicket.ticketTypeName}' not found`,
        });
      }

      const subtotal = eventTicket.price * requestedTicket.quantity;
      totalAmount += subtotal;

      orderTickets.push({
        ticketType: {
          name: eventTicket.name,
          price: eventTicket.price,
        },
        quantity: requestedTicket.quantity,
        subtotal,
      });
    }

    // Generate booking reference
    const bookingReference =
      "BK" + Date.now() + Math.random().toString(36).substr(2, 5).toUpperCase();

    // Create order
    const order = new Order({
      userId: req.user.id,
      eventId,
      tickets: orderTickets,
      totalAmount,
      customerInfo,
      bookingReference,
      status: "pending",
    });

    await order.save();

    logger.info("Tickets booked successfully", {
      orderId: order._id,
      userId: req.user.id,
      eventId,
    });

    res.status(201).json({
      message: "Booking created successfully",
      orderId: order._id,
      bookingReference,
      totalAmount,
    });
  } catch (error) {
    logger.error("Error booking tickets:", error);
    res
      .status(500)
      .json({ error: "Internal server error", details: error.message });
  }
});

// Get user's orders
router.get("/orders", verifyAuth, async (req, res) => {
  try {
    const orders = await Order.find({ userId: req.user.id })
      .sort({ createdAt: -1 })
      .select("-__v");

    // Enrich with event details
    const enrichedOrders = await Promise.all(
      orders.map(async (order) => {
        try {
          const eventResponse = await axios.get(
            `${process.env.EVENT_SERVICE_URL}/api/events/${order.eventId}`
          );
          return {
            ...order.toJSON(),
            event: eventResponse.data.event,
          };
        } catch (error) {
          return {
            ...order.toJSON(),
            event: null,
          };
        }
      })
    );

    res.json({ orders: enrichedOrders });
  } catch (error) {
    logger.error("Error fetching orders:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Get specific order
router.get("/orders/:id", verifyAuth, async (req, res) => {
  try {
    const order = await Order.findOne({
      _id: req.params.id,
      userId: req.user.id,
    }).select("-__v");

    if (!order) {
      return res.status(404).json({ error: "Order not found" });
    }

    // Enrich with event details
    try {
      const eventResponse = await axios.get(
        `${process.env.EVENT_SERVICE_URL}/api/events/${order.eventId}`
      );
      res.json({
        order: {
          ...order.toJSON(),
          event: eventResponse.data.event,
        },
      });
    } catch (error) {
      res.json({ order: order.toJSON() });
    }
  } catch (error) {
    logger.error("Error fetching order:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Update order status (internal)
router.put("/orders/:id/status", async (req, res) => {
  try {
    const { status } = req.body;

    const order = await Order.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    );

    if (!order) {
      return res.status(404).json({ error: "Order not found" });
    }

    res.json({ order });
  } catch (error) {
    logger.error("Error updating order status:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

module.exports = router;
