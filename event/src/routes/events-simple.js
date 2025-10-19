const express = require("express");
const Event = require("../models/Event");
const { logger } = require("../utils/logger");
const { verifyAuth } = require("../middleware/auth");

const router = express.Router();

// Get all events (simplified)
router.get("/", async (req, res) => {
  try {
    const { category } = req.query;

    const query = { status: "published", isActive: true };
    if (category) query.category = category.toLowerCase();

    const events = await Event.find(query)
      .sort({ dateTime: 1 })
      .limit(50)
      .select("-__v");

    res.json({ events });
  } catch (error) {
    logger.error("Error fetching events:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Get event by ID
router.get("/:id", async (req, res) => {
  try {
    const event = await Event.findOne({
      _id: req.params.id,
      isActive: true,
    }).select("-__v");

    if (!event) {
      return res.status(404).json({ error: "Event not found" });
    }

    res.json({ event });
  } catch (error) {
    logger.error("Error fetching event:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Create event (authenticated users)
router.post("/", verifyAuth, async (req, res) => {
  try {
    const { title, description, date, location, category, ticketTypes } =
      req.body;

    if (
      !title ||
      !description ||
      !date ||
      !location ||
      !category ||
      !ticketTypes
    ) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const event = new Event({
      title,
      description,
      category: category.toLowerCase(),
      venue: {
        name: location,
        address: location,
        city: location.split(",")[0] || location,
        capacity: ticketTypes.reduce((sum, t) => sum + (t.quantity || 0), 0),
      },
      dateTime: new Date(date),
      duration: 120, // default 2 hours
      ticketTypes,
      organizer: {
        name: `${req.user.firstName} ${req.user.lastName}`,
        email: req.user.email,
      },
      status: "published",
      createdBy: req.user.id,
    });

    await event.save();

    logger.info("Event created successfully", {
      eventId: event._id,
      createdBy: req.user.id,
    });

    res.status(201).json({
      message: "Event created successfully",
      event,
    });
  } catch (error) {
    logger.error("Error creating event:", error);

    // Handle validation errors with more detail
    if (error.name === "ValidationError") {
      const validationErrors = Object.values(error.errors).map(
        (err) => err.message
      );
      return res.status(400).json({
        error: "Validation failed",
        details: validationErrors.join(", "),
      });
    }

    res
      .status(500)
      .json({ error: "Internal server error", details: error.message });
  }
});

// Get user's events
router.get("/my/events", verifyAuth, async (req, res) => {
  try {
    const events = await Event.find({
      createdBy: req.user.id,
      isActive: true,
    })
      .sort({ createdAt: -1 })
      .select("-__v");

    res.json({ events });
  } catch (error) {
    logger.error("Error fetching user events:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

module.exports = router;
