const mongoose = require("mongoose");

const eventSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200,
    },
    description: {
      type: String,
      required: true,
      maxlength: 2000,
    },
    category: {
      type: String,
      required: true,
      enum: ["concert", "conference", "workshop", "sports", "theater", "other"],
    },
    venue: {
      name: {
        type: String,
        required: true,
        trim: true,
      },
      address: {
        type: String,
        required: true,
        trim: true,
      },
      city: {
        type: String,
        required: true,
        trim: true,
      },
      capacity: {
        type: Number,
        required: true,
        min: 1,
      },
    },
    dateTime: {
      type: Date,
      required: true,
      validate: {
        validator: function (value) {
          // Allow dates that are at least 1 minute in the past to account for processing time
          const oneMinuteAgo = new Date(Date.now() - 60000);
          return value >= oneMinuteAgo;
        },
        message: "Event date cannot be in the past",
      },
    },
    duration: {
      type: Number, // in minutes
      required: true,
      min: 30,
    },
    ticketTypes: [
      {
        name: {
          type: String,
          required: true,
          trim: true,
        },
        price: {
          type: Number,
          required: true,
          min: 0,
        },
        quantity: {
          type: Number,
          required: true,
          min: 1,
        },
        description: {
          type: String,
          maxlength: 500,
        },
      },
    ],
    organizer: {
      name: {
        type: String,
        required: true,
        trim: true,
      },
      email: {
        type: String,
        required: true,
        match: [
          /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
          "Please enter a valid email",
        ],
      },
      phone: {
        type: String,
        trim: true,
      },
    },
    images: [
      {
        url: {
          type: String,
          required: true,
        },
        alt: {
          type: String,
          default: "",
        },
      },
    ],
    tags: [
      {
        type: String,
        trim: true,
        lowercase: true,
      },
    ],
    status: {
      type: String,
      enum: ["draft", "published", "cancelled", "completed"],
      default: "draft",
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for better query performance
eventSchema.index({ dateTime: 1 });
eventSchema.index({ category: 1 });
eventSchema.index({ status: 1 });
eventSchema.index({ "venue.city": 1 });
eventSchema.index({ tags: 1 });

// Virtual for total tickets
eventSchema.virtual("totalTickets").get(function () {
  return this.ticketTypes.reduce((total, type) => total + type.quantity, 0);
});

// Virtual for minimum price
eventSchema.virtual("minPrice").get(function () {
  if (this.ticketTypes.length === 0) return 0;
  return Math.min(...this.ticketTypes.map((type) => type.price));
});

eventSchema.set("toJSON", { virtuals: true });

module.exports = mongoose.model("Event", eventSchema);
