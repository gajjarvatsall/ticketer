import { useState, useEffect } from "react";
import { ticketService, Order } from "../services/api";
import { toast } from "sonner";

export default function MyOrders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadOrders();
  }, []);

  const loadOrders = async () => {
    try {
      setLoading(true);
      const data = await ticketService.getMyOrders();
      setOrders(data.orders);
    } catch (error: any) {
      toast.error("Failed to load orders");
      console.error("Error loading orders:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="px-4 sm:px-0">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">My Orders</h1>

      {orders.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500 text-lg">No orders found.</p>
          <p className="text-gray-400 text-sm mt-2">
            Book some tickets to see your orders here.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {orders.map((order) => (
            <div key={order._id} className="bg-white rounded-lg shadow-md p-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    {order.event?.title || "Event"}
                  </h3>
                  <p className="text-sm text-gray-600">
                    Booking Reference: {order.bookingReference}
                  </p>
                  <p className="text-sm text-gray-600">
                    Order Date: {new Date(order.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <div className="text-right">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    order.status === "confirmed" ? "bg-green-100 text-green-800" :
                    order.status === "pending" ? "bg-yellow-100 text-yellow-800" :
                    order.status === "cancelled" ? "bg-red-100 text-red-800" :
                    "bg-gray-100 text-gray-800"
                  }`}>
                    {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                  </span>
                  <p className="text-lg font-bold text-gray-900 mt-1">
                    ${order.totalAmount.toFixed(2)}
                  </p>
                </div>
              </div>

              <div className="border-t pt-4">
                <h4 className="font-medium text-gray-900 mb-2">Tickets</h4>
                <div className="space-y-2">
                  {order.tickets.map((ticket, index) => (
                    <div key={index} className="flex justify-between text-sm">
                      <span>{ticket.ticketType.name} × {ticket.quantity}</span>
                      <span>${ticket.subtotal.toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="border-t pt-4 mt-4">
                <h4 className="font-medium text-gray-900 mb-2">Customer Information</h4>
                <div className="text-sm text-gray-600">
                  <p>{order.customerInfo.firstName} {order.customerInfo.lastName}</p>
                  <p>{order.customerInfo.email}</p>
                  {order.customerInfo.phone && <p>{order.customerInfo.phone}</p>}
                </div>
              </div>

              {order.event && (
                <div className="border-t pt-4 mt-4">
                  <h4 className="font-medium text-gray-900 mb-2">Event Details</h4>
                  <div className="text-sm text-gray-600">
                    <p>📅 {new Date(order.event.dateTime).toLocaleDateString('en-US', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}</p>
                    <p>📍 {order.event.venue.city}</p>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
