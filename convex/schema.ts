import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
import { authTables } from "@convex-dev/auth/server";

const applicationTables = {
  events: defineTable({
    title: v.string(),
    description: v.string(),
    date: v.number(),
    location: v.string(),
    imageUrl: v.optional(v.string()),
    category: v.string(),
    organizerId: v.id("users"),
    status: v.union(v.literal("draft"), v.literal("published"), v.literal("cancelled")),
    ticketTypes: v.array(v.object({
      name: v.string(),
      price: v.number(),
      quantity: v.number(),
      description: v.optional(v.string()),
    })),
  })
    .index("by_organizer", ["organizerId"])
    .index("by_status", ["status"])
    .index("by_category", ["category"])
    .index("by_date", ["date"]),

  orders: defineTable({
    userId: v.id("users"),
    eventId: v.id("events"),
    tickets: v.array(v.object({
      ticketTypeName: v.string(),
      price: v.number(),
      quantity: v.number(),
      subtotal: v.number(),
    })),
    totalAmount: v.number(),
    status: v.union(
      v.literal("pending"),
      v.literal("confirmed"),
      v.literal("cancelled"),
      v.literal("refunded")
    ),
    customerInfo: v.object({
      firstName: v.string(),
      lastName: v.string(),
      email: v.string(),
      phone: v.optional(v.string()),
    }),
    bookingReference: v.string(),
    paymentId: v.optional(v.string()),
  })
    .index("by_user", ["userId"])
    .index("by_event", ["eventId"])
    .index("by_status", ["status"])
    .index("by_booking_reference", ["bookingReference"]),

  payments: defineTable({
    orderId: v.id("orders"),
    userId: v.id("users"),
    amount: v.number(),
    currency: v.string(),
    paymentMethod: v.union(
      v.literal("credit_card"),
      v.literal("debit_card"),
      v.literal("paypal")
    ),
    status: v.union(
      v.literal("pending"),
      v.literal("processing"),
      v.literal("completed"),
      v.literal("failed"),
      v.literal("refunded")
    ),
    transactionId: v.optional(v.string()),
    cardLast4: v.optional(v.string()),
    cardBrand: v.optional(v.string()),
  })
    .index("by_order", ["orderId"])
    .index("by_user", ["userId"])
    .index("by_status", ["status"]),
};

export default defineSchema({
  ...authTables,
  ...applicationTables,
});
