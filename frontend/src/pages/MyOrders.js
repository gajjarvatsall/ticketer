import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { ticketService } from "../services/api";

const MyOrders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchMyOrders();
  }, []);

  const fetchMyOrders = async () => {
    try {
      const response = await ticketService.getMyOrders();
      setOrders(response.data.orders || []);
    } catch (err) {
      setError(err.response?.data?.error || "Failed to load orders");
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "confirmed":
        return "bg-green-100 text-green-800";
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "cancelled":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-xl">Loading...</div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">My Orders</h1>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      {orders.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500 text-lg mb-4">
            You haven't booked any tickets yet.
          </p>
          <Link
            to="/events"
            className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700"
          >
            Browse Events
          </Link>
        </div>
      ) : (
        <div className="space-y-6">
          {orders.map((order) => (
            <div key={order._id} className="bg-white rounded-lg shadow-md p-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-xl font-bold mb-2">
                    {order.event?.title || "Event"}
                  </h3>
                  <p className="text-gray-600">
                    Booking Reference:{" "}
                    <span className="font-mono font-semibold">
                      {order.bookingReference}
                    </span>
                  </p>
                </div>
                <span
                  className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(order.status)}`}
                >
                  {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <h4 className="font-semibold mb-2">Customer Information</h4>
                  <p className="text-sm text-gray-600">
                    {order.customerInfo?.firstName}{" "}
                    {order.customerInfo?.lastName}
                  </p>
                  <p className="text-sm text-gray-600">
                    {order.customerInfo?.email}
                  </p>
                  {order.customerInfo?.phone && (
                    <p className="text-sm text-gray-600">
                      {order.customerInfo.phone}
                    </p>
                  )}
                </div>

                <div>
                  <h4 className="font-semibold mb-2">Event Details</h4>
                  {order.event ? (
                    <>
                      <p className="text-sm text-gray-600">
                        📅 {new Date(order.event.dateTime).toLocaleString()}
                      </p>
                      <p className="text-sm text-gray-600">
                        📍{" "}
                        {order.event.venue?.name ||
                          order.event.venue?.address ||
                          "N/A"}
                      </p>
                    </>
                  ) : (
                    <p className="text-sm text-gray-600">
                      Event details unavailable
                    </p>
                  )}
                </div>
              </div>

              <div className="border-t pt-4">
                <h4 className="font-semibold mb-2">Tickets</h4>
                <div className="space-y-2">
                  {order.tickets?.map((ticket, idx) => (
                    <div
                      key={idx}
                      className="flex justify-between items-center text-sm"
                    >
                      <span>
                        {ticket.ticketType?.name} x {ticket.quantity}
                      </span>
                      <span className="font-semibold">
                        $
                        {ticket.subtotal?.toFixed(2) ||
                          (ticket.ticketType?.price * ticket.quantity).toFixed(
                            2
                          )}
                      </span>
                    </div>
                  ))}
                </div>
                <div className="flex justify-between items-center mt-4 pt-4 border-t font-bold text-lg">
                  <span>Total</span>
                  <span>${order.totalAmount?.toFixed(2)}</span>
                </div>
              </div>

              <div className="mt-4 text-sm text-gray-500">
                Ordered on {new Date(order.createdAt).toLocaleString()}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MyOrders;
