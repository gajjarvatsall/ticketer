import { mutation, query, action } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";
import { api } from "./_generated/api";

export const processPayment = action({
  args: {
    orderId: v.id("orders"),
    paymentMethod: v.union(v.literal("credit_card"), v.literal("debit_card"), v.literal("paypal")),
    paymentDetails: v.object({
      cardNumber: v.optional(v.string()),
      expiryMonth: v.optional(v.string()),
      expiryYear: v.optional(v.string()),
      cvv: v.optional(v.string()),
      cardholderName: v.optional(v.string()),
      email: v.optional(v.string()),
    }),
  },
  handler: async (ctx, args): Promise<{
    success: boolean;
    paymentId: string;
    transactionId?: string;
    message: string;
  }> => {
    // Get order details
    const order: any = await ctx.runQuery(api.orders.getById, { id: args.orderId });
    if (!order) {
      throw new Error("Order not found");
    }

    if (order.status !== "pending") {
      throw new Error("Order is not in pending status");
    }

    // Check if payment already exists
    const existingPayment = await ctx.runQuery(api.payments.getByOrderId, { orderId: args.orderId });
    if (existingPayment && existingPayment.status === "completed") {
      throw new Error("Payment already processed for this order");
    }

    // Simulate payment processing
    const success = Math.random() > 0.1; // 90% success rate for demo
    const transactionId = success ? 'txn_' + Date.now() + Math.random().toString(36).substr(2, 8) : undefined;

    let cardLast4, cardBrand;
    if (args.paymentDetails.cardNumber) {
      cardLast4 = args.paymentDetails.cardNumber.slice(-4);
      cardBrand = getCardBrand(args.paymentDetails.cardNumber);
    }

    // Create payment record
    const paymentId: string = await ctx.runMutation(api.payments.create, {
      orderId: args.orderId,
      amount: order.totalAmount,
      currency: "USD",
      paymentMethod: args.paymentMethod,
      status: success ? "completed" : "failed",
      transactionId,
      cardLast4,
      cardBrand,
    });

    // Update order status if payment successful
    if (success) {
      await ctx.runMutation(api.orders.updateStatus, {
        id: args.orderId,
        status: "confirmed",
      });
    }

    return {
      success,
      paymentId,
      transactionId,
      message: success ? "Payment processed successfully" : "Payment failed. Please try again.",
    };
  },
});

export const create = mutation({
  args: {
    orderId: v.id("orders"),
    amount: v.number(),
    currency: v.string(),
    paymentMethod: v.union(v.literal("credit_card"), v.literal("debit_card"), v.literal("paypal")),
    status: v.union(v.literal("pending"), v.literal("processing"), v.literal("completed"), v.literal("failed")),
    transactionId: v.optional(v.string()),
    cardLast4: v.optional(v.string()),
    cardBrand: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Authentication required");
    }

    return await ctx.db.insert("payments", {
      ...args,
      userId,
    });
  },
});

export const getByOrderId = query({
  args: { orderId: v.id("orders") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      return null;
    }

    return await ctx.db
      .query("payments")
      .withIndex("by_order", (q) => q.eq("orderId", args.orderId))
      .filter((q) => q.eq(q.field("userId"), userId))
      .first();
  },
});

export const getMyPayments = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      return [];
    }

    return await ctx.db
      .query("payments")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .order("desc")
      .collect();
  },
});

function getCardBrand(cardNumber: string): string {
  const firstDigit = cardNumber.charAt(0);
  const firstTwoDigits = cardNumber.substring(0, 2);
  const firstFourDigits = cardNumber.substring(0, 4);

  if (firstDigit === '4') return 'Visa';
  if (firstTwoDigits >= '51' && firstTwoDigits <= '55') return 'Mastercard';
  if (firstTwoDigits === '34' || firstTwoDigits === '37') return 'American Express';
  if (firstFourDigits === '6011' || firstTwoDigits === '65') return 'Discover';
  
  return 'Unknown';
}
