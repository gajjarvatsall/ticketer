import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";

export const create = mutation({
  args: {
    eventId: v.id("events"),
    tickets: v.array(v.object({
      ticketTypeName: v.string(),
      quantity: v.number(),
    })),
    customerInfo: v.object({
      firstName: v.string(),
      lastName: v.string(),
      email: v.string(),
      phone: v.optional(v.string()),
    }),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Authentication required");
    }

    const event = await ctx.db.get(args.eventId);
    if (!event) {
      throw new Error("Event not found");
    }

    if (event.status !== "published") {
      throw new Error("Event is not available for booking");
    }

    // Check ticket availability and calculate total
    const orderTickets = [];
    let totalAmount = 0;

    for (const requestedTicket of args.tickets) {
      const ticketType = event.ticketTypes.find(
        t => t.name === requestedTicket.ticketTypeName
      );

      if (!ticketType) {
        throw new Error(`Ticket type '${requestedTicket.ticketTypeName}' not found`);
      }

      // Check availability
      const existingOrders = await ctx.db
        .query("orders")
        .withIndex("by_event", (q) => q.eq("eventId", args.eventId))
        .filter((q) => q.neq(q.field("status"), "cancelled"))
        .collect();

      const soldTickets = existingOrders.reduce((total, order) => {
        const ticketsSold = order.tickets
          .filter(t => t.ticketTypeName === requestedTicket.ticketTypeName)
          .reduce((sum, t) => sum + t.quantity, 0);
        return total + ticketsSold;
      }, 0);

      const availableQuantity = ticketType.quantity - soldTickets;

      if (availableQuantity < requestedTicket.quantity) {
        throw new Error(`Not enough tickets available for '${requestedTicket.ticketTypeName}'. Available: ${availableQuantity}`);
      }

      const subtotal = ticketType.price * requestedTicket.quantity;
      totalAmount += subtotal;

      orderTickets.push({
        ticketTypeName: ticketType.name,
        price: ticketType.price,
        quantity: requestedTicket.quantity,
        subtotal,
      });
    }

    // Generate booking reference
    const bookingReference = 'BK' + Date.now() + Math.random().toString(36).substr(2, 5).toUpperCase();

    const orderId = await ctx.db.insert("orders", {
      userId,
      eventId: args.eventId,
      tickets: orderTickets,
      totalAmount,
      status: "pending",
      customerInfo: args.customerInfo,
      bookingReference,
    });

    return { orderId, bookingReference, totalAmount };
  },
});

export const getMyOrders = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      return [];
    }

    const orders = await ctx.db
      .query("orders")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .order("desc")
      .collect();

    return Promise.all(
      orders.map(async (order) => {
        const event = await ctx.db.get(order.eventId);
        return {
          ...order,
          event,
        };
      })
    );
  },
});

export const getById = query({
  args: { id: v.id("orders") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Authentication required");
    }

    const order = await ctx.db.get(args.id);
    if (!order) {
      throw new Error("Order not found");
    }

    if (order.userId !== userId) {
      throw new Error("Not authorized to view this order");
    }

    const event = await ctx.db.get(order.eventId);
    const payment = await ctx.db
      .query("payments")
      .withIndex("by_order", (q) => q.eq("orderId", args.id))
      .first();

    return {
      ...order,
      event,
      payment,
    };
  },
});

export const updateStatus = mutation({
  args: {
    id: v.id("orders"),
    status: v.union(v.literal("confirmed"), v.literal("cancelled"), v.literal("refunded")),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Authentication required");
    }

    const order = await ctx.db.get(args.id);
    if (!order) {
      throw new Error("Order not found");
    }

    if (order.userId !== userId) {
      throw new Error("Not authorized to update this order");
    }

    await ctx.db.patch(args.id, { status: args.status });
  },
});
