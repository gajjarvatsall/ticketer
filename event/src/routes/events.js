const express = require('express');
const Joi = require('joi');
const Event = require('../models/Event');
const { logger } = require('../utils/logger');
const { verifyAuth, requireAdmin } = require('../middleware/auth');

const router = express.Router();

// Validation schemas
const eventSchema = Joi.object({
  title: Joi.string().trim().max(200).required(),
  description: Joi.string().max(2000).required(),
  category: Joi.string().valid('concert', 'conference', 'workshop', 'sports', 'theater', 'other').required(),
  venue: Joi.object({
    name: Joi.string().trim().required(),
    address: Joi.string().trim().required(),
    city: Joi.string().trim().required(),
    capacity: Joi.number().min(1).required()
  }).required(),
  dateTime: Joi.date().greater('now').required(),
  duration: Joi.number().min(30).required(),
  ticketTypes: Joi.array().items(
    Joi.object({
      name: Joi.string().trim().required(),
      price: Joi.number().min(0).required(),
      quantity: Joi.number().min(1).required(),
      description: Joi.string().max(500).optional()
    })
  ).min(1).required(),
  organizer: Joi.object({
    name: Joi.string().trim().required(),
    email: Joi.string().email().required(),
    phone: Joi.string().trim().optional()
  }).required(),
  images: Joi.array().items(
    Joi.object({
      url: Joi.string().uri().required(),
      alt: Joi.string().optional()
    })
  ).optional(),
  tags: Joi.array().items(Joi.string().trim().lowercase()).optional(),
  status: Joi.string().valid('draft', 'published').optional()
});

// Get all events (public)
router.get('/', async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      category,
      city,
      status = 'published',
      search,
      sortBy = 'dateTime',
      sortOrder = 'asc'
    } = req.query;

    const query = { isActive: true };
    
    if (category) query.category = category;
    if (city) query['venue.city'] = new RegExp(city, 'i');
    if (status) query.status = status;
    if (search) {
      query.$or = [
        { title: new RegExp(search, 'i') },
        { description: new RegExp(search, 'i') },
        { tags: new RegExp(search, 'i') }
      ];
    }

    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

    const events = await Event.find(query)
      .sort(sort)
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .select('-__v');

    const total = await Event.countDocuments(query);

    res.json({
      events,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    logger.error('Error fetching events:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get event by ID (public)
router.get('/:id', async (req, res) => {
  try {
    const event = await Event.findOne({
      _id: req.params.id,
      isActive: true,
      status: 'published'
    }).select('-__v');

    if (!event) {
      return res.status(404).json({ error: 'Event not found' });
    }

    res.json({ event });
  } catch (error) {
    logger.error('Error fetching event:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create event (admin only)
router.post('/', verifyAuth, requireAdmin, async (req, res) => {
  try {
    const { error, value } = eventSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    const event = new Event({
      ...value,
      createdBy: req.user.id
    });

    await event.save();

    logger.info('Event created successfully', { eventId: event._id, createdBy: req.user.id });

    res.status(201).json({
      message: 'Event created successfully',
      event
    });
  } catch (error) {
    logger.error('Error creating event:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update event (admin only)
router.put('/:id', verifyAuth, requireAdmin, async (req, res) => {
  try {
    const { error, value } = eventSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    const event = await Event.findOneAndUpdate(
      { _id: req.params.id, isActive: true },
      value,
      { new: true, runValidators: true }
    );

    if (!event) {
      return res.status(404).json({ error: 'Event not found' });
    }

    logger.info('Event updated successfully', { eventId: event._id, updatedBy: req.user.id });

    res.json({
      message: 'Event updated successfully',
      event
    });
  } catch (error) {
    logger.error('Error updating event:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete event (admin only)
router.delete('/:id', verifyAuth, requireAdmin, async (req, res) => {
  try {
    const event = await Event.findOneAndUpdate(
      { _id: req.params.id, isActive: true },
      { isActive: false },
      { new: true }
    );

    if (!event) {
      return res.status(404).json({ error: 'Event not found' });
    }

    logger.info('Event deleted successfully', { eventId: event._id, deletedBy: req.user.id });

    res.json({ message: 'Event deleted successfully' });
  } catch (error) {
    logger.error('Error deleting event:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get event categories (public)
router.get('/meta/categories', (req, res) => {
  const categories = ['concert', 'conference', 'workshop', 'sports', 'theater', 'other'];
  res.json({ categories });
});

module.exports = router;
