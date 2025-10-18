import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";

export const list = query({
  args: {
    category: v.optional(v.string()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    let query = ctx.db.query("events").withIndex("by_status", (q) => 
      q.eq("status", "published")
    );

    if (args.category) {
      query = ctx.db.query("events").withIndex("by_category", (q) => 
        q.eq("category", args.category!)
      ).filter((q) => q.eq(q.field("status"), "published"));
    }

    const events = await query
      .order("desc")
      .take(args.limit || 20);

    return Promise.all(
      events.map(async (event) => {
        const organizer = await ctx.db.get(event.organizerId);
        return {
          ...event,
          organizer: organizer ? { name: organizer.name, email: organizer.email } : null,
        };
      })
    );
  },
});

export const getById = query({
  args: { id: v.id("events") },
  handler: async (ctx, args) => {
    const event = await ctx.db.get(args.id);
    if (!event) return null;

    const organizer = await ctx.db.get(event.organizerId);
    
    // Calculate available tickets
    const orders = await ctx.db
      .query("orders")
      .withIndex("by_event", (q) => q.eq("eventId", args.id))
      .filter((q) => q.neq(q.field("status"), "cancelled"))
      .collect();

    const ticketsSold = new Map<string, number>();
    orders.forEach(order => {
      order.tickets.forEach(ticket => {
        const current = ticketsSold.get(ticket.ticketTypeName) || 0;
        ticketsSold.set(ticket.ticketTypeName, current + ticket.quantity);
      });
    });

    const ticketTypesWithAvailability = event.ticketTypes.map(ticketType => ({
      ...ticketType,
      sold: ticketsSold.get(ticketType.name) || 0,
      available: ticketType.quantity - (ticketsSold.get(ticketType.name) || 0),
    }));

    return {
      ...event,
      organizer: organizer ? { name: organizer.name, email: organizer.email } : null,
      ticketTypes: ticketTypesWithAvailability,
    };
  },
});

export const create = mutation({
  args: {
    title: v.string(),
    description: v.string(),
    date: v.number(),
    location: v.string(),
    category: v.string(),
    ticketTypes: v.array(v.object({
      name: v.string(),
      price: v.number(),
      quantity: v.number(),
      description: v.optional(v.string()),
    })),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Authentication required");
    }

    return await ctx.db.insert("events", {
      ...args,
      organizerId: userId,
      status: "published",
    });
  },
});

export const update = mutation({
  args: {
    id: v.id("events"),
    title: v.optional(v.string()),
    description: v.optional(v.string()),
    date: v.optional(v.number()),
    location: v.optional(v.string()),
    category: v.optional(v.string()),
    status: v.optional(v.union(v.literal("draft"), v.literal("published"), v.literal("cancelled"))),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Authentication required");
    }

    const event = await ctx.db.get(args.id);
    if (!event) {
      throw new Error("Event not found");
    }

    if (event.organizerId !== userId) {
      throw new Error("Not authorized to update this event");
    }

    const { id, ...updates } = args;
    await ctx.db.patch(args.id, updates);
  },
});

export const getMyEvents = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      return [];
    }

    return await ctx.db
      .query("events")
      .withIndex("by_organizer", (q) => q.eq("organizerId", userId))
      .order("desc")
      .collect();
  },
});
