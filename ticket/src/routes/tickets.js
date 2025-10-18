const express = require('express');
const Joi = require('joi');
const axios = require('axios');
const Ticket = require('../models/Ticket');
const Order = require('../models/Order');
const { logger } = require('../utils/logger');
const { verifyAuth } = require('../middleware/auth');

const router = express.Router();

// Validation schemas
const bookingSchema = Joi.object({
  eventId: Joi.string().required(),
  tickets: Joi.array().items(
    Joi.object({
      ticketType: Joi.string().required(),
      quantity: Joi.number().min(1).required()
    })
  ).min(1).required(),
  customerInfo: Joi.object({
    firstName: Joi.string().trim().required(),
    lastName: Joi.string().trim().required(),
    email: Joi.string().email().required(),
    phone: Joi.string().optional()
  }).required()
});

// Get available tickets for an event
router.get('/event/:eventId', async (req, res) => {
  try {
    const { eventId } = req.params;

    // Get event details from event service
    const eventResponse = await axios.get(`${process.env.EVENT_SERVICE_URL}/api/events/${eventId}`);
    const event = eventResponse.data.event;

    if (!event) {
      return res.status(404).json({ error: 'Event not found' });
    }

    // Get or create tickets for this event
    let tickets = await Ticket.find({ eventId, isActive: true });

    if (tickets.length === 0) {
      // Create tickets based on event ticket types
      tickets = await Promise.all(
        event.ticketTypes.map(async (ticketType) => {
          const ticket = new Ticket({
            eventId,
            ticketType: {
              name: ticketType.name,
              price: ticketType.price,
              description: ticketType.description
            },
            quantity: ticketType.quantity,
            availableQuantity: ticketType.quantity
          });
          return await ticket.save();
        })
      );
    }

    res.json({ tickets, event });
  } catch (error) {
    logger.error('Error fetching tickets:', error);
    if (error.response?.status === 404) {
      return res.status(404).json({ error: 'Event not found' });
    }
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Book tickets
router.post('/book', verifyAuth, async (req, res) => {
  try {
    const { error, value } = bookingSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    const { eventId, tickets: requestedTickets, customerInfo } = value;

    // Get event details
    const eventResponse = await axios.get(`${process.env.EVENT_SERVICE_URL}/api/events/${eventId}`);
    const event = eventResponse.data.event;

    if (!event) {
      return res.status(404).json({ error: 'Event not found' });
    }

    // Get available tickets
    const availableTickets = await Ticket.find({ eventId, isActive: true });

    // Validate ticket availability and calculate total
    let totalAmount = 0;
    const orderTickets = [];

    for (const requestedTicket of requestedTickets) {
      const availableTicket = availableTickets.find(
        t => t.ticketType.name === requestedTicket.ticketType
      );

      if (!availableTicket) {
        return res.status(400).json({ 
          error: `Ticket type '${requestedTicket.ticketType}' not found` 
        });
      }

      if (availableTicket.availableQuantity < requestedTicket.quantity) {
        return res.status(400).json({ 
          error: `Not enough tickets available for '${requestedTicket.ticketType}'` 
        });
      }

      const subtotal = availableTicket.ticketType.price * requestedTicket.quantity;
      totalAmount += subtotal;

      orderTickets.push({
        ticketType: {
          name: availableTicket.ticketType.name,
          price: availableTicket.ticketType.price
        },
        quantity: requestedTicket.quantity,
        subtotal
      });
    }

    // Create order
    const order = new Order({
      userId: req.user.id,
      eventId,
      tickets: orderTickets,
      totalAmount,
      customerInfo
    });

    await order.save();

    // Update ticket availability
    for (const requestedTicket of requestedTickets) {
      await Ticket.findOneAndUpdate(
        { eventId, 'ticketType.name': requestedTicket.ticketType },
        { $inc: { availableQuantity: -requestedTicket.quantity } }
      );
    }

    logger.info('Tickets booked successfully', { 
      orderId: order._id, 
      userId: req.user.id,
      eventId 
    });

    res.status(201).json({
      message: 'Tickets booked successfully',
      order
    });
  } catch (error) {
    logger.error('Error booking tickets:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get user's orders
router.get('/orders', verifyAuth, async (req, res) => {
  try {
    const orders = await Order.find({ userId: req.user.id })
      .sort({ createdAt: -1 })
      .select('-__v');

    // Get event details for each order
    const ordersWithEvents = await Promise.all(
      orders.map(async (order) => {
        try {
          const eventResponse = await axios.get(
            `${process.env.EVENT_SERVICE_URL}/api/events/${order.eventId}`
          );
          return {
            ...order.toObject(),
            event: eventResponse.data.event
          };
        } catch (error) {
          logger.warn('Could not fetch event details for order', { orderId: order._id });
          return order.toObject();
        }
      })
    );

    res.json({ orders: ordersWithEvents });
  } catch (error) {
    logger.error('Error fetching orders:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get order details
router.get('/orders/:id', verifyAuth, async (req, res) => {
  try {
    const order = await Order.findOne({
      _id: req.params.id,
      userId: req.user.id
    }).select('-__v');

    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    // Get event details
    try {
      const eventResponse = await axios.get(
        `${process.env.EVENT_SERVICE_URL}/api/events/${order.eventId}`
      );
      order.event = eventResponse.data.event;
    } catch (error) {
      logger.warn('Could not fetch event details for order', { orderId: order._id });
    }

    res.json({ order });
  } catch (error) {
    logger.error('Error fetching order:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
