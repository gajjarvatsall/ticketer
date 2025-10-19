import { useState } from "react";
import { ticketService, Event } from "../services/api";
import { toast } from "sonner";
import { useAuth } from "../contexts/AuthContext";

interface BookingFormProps {
  event: Event;
  onBack: () => void;
  onSuccess: () => void;
}

export default function BookingForm({ event, onBack, onSuccess }: BookingFormProps) {
  const { user } = useAuth();
  const [selectedTickets, setSelectedTickets] = useState<Record<string, number>>({});
  const [customerInfo, setCustomerInfo] = useState({
    firstName: user?.firstName || "",
    lastName: user?.lastName || "",
    email: user?.email || "",
    phone: "",
  });
  const [step, setStep] = useState<"tickets" | "customer" | "confirm">("tickets");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const totalAmount = Object.entries(selectedTickets).reduce((total, [ticketName, quantity]) => {
    const ticket = event.ticketTypes.find((t) => t.name === ticketName);
    return total + (ticket ? ticket.price * quantity : 0);
  }, 0);

  const totalTickets = Object.values(selectedTickets).reduce((sum, qty) => sum + qty, 0);

  const handleTicketChange = (ticketName: string, quantity: number) => {
    setSelectedTickets(prev => ({
      ...prev,
      [ticketName]: Math.max(0, quantity),
    }));
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);

    try {
      const tickets = Object.entries(selectedTickets)
        .filter(([_, quantity]) => quantity > 0)
        .map(([ticketTypeName, quantity]) => ({
          ticketTypeName,
          quantity,
        }));

      const result = await ticketService.book({
        eventId: event._id,
        tickets,
        customerInfo: {
          firstName: customerInfo.firstName,
          lastName: customerInfo.lastName,
          email: customerInfo.email,
          phone: customerInfo.phone || undefined,
        },
      });

      toast.success(`Booking successful! Reference: ${result.bookingReference}`);
      onSuccess();
    } catch (err: any) {
      const errorMsg = err.response?.data?.error || err.message || "Booking failed";
      toast.error(errorMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const canProceedFromTickets = totalTickets > 0;
  const canProceedFromCustomer = customerInfo.firstName && customerInfo.lastName && customerInfo.email;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Book Tickets</h2>
            <button
              onClick={onBack}
              className="text-gray-400 hover:text-gray-600"
            >
              ✕
            </button>
          </div>

          {/* Progress Steps */}
          <div className="flex items-center mb-8">
            {["tickets", "customer", "confirm"].map((stepName, index) => (
              <div key={stepName} className="flex items-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                  step === stepName ? "bg-blue-600 text-white" :
                  ["tickets", "customer", "confirm"].indexOf(step) > index ? "bg-green-600 text-white" :
                  "bg-gray-200 text-gray-600"
                }`}>
                  {index + 1}
                </div>
                {index < 2 && (
                  <div className={`w-16 h-1 mx-2 ${
                    ["tickets", "customer", "confirm"].indexOf(step) > index ? "bg-green-600" : "bg-gray-200"
                  }`} />
                )}
              </div>
            ))}
          </div>

          {/* Step Content */}
          {step === "tickets" && (
            <div>
              <h3 className="text-lg font-semibold mb-4">Select Tickets</h3>
              <div className="space-y-4">
                {event.ticketTypes.map((ticket: any, index: number) => (
                  <div key={index} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h4 className="font-medium text-gray-900">{ticket.name}</h4>
                        {ticket.description && (
                          <p className="text-sm text-gray-600">{ticket.description}</p>
                        )}
                      </div>
                      <span className="text-lg font-bold text-gray-900">${ticket.price}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-500">
                        {ticket.quantity} available
                      </span>
                      {ticket.quantity > 0 ? (
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => handleTicketChange(ticket.name, (selectedTickets[ticket.name] || 0) - 1)}
                            className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center hover:bg-gray-300"
                            disabled={!selectedTickets[ticket.name]}
                          >
                            -
                          </button>
                          <span className="w-8 text-center">{selectedTickets[ticket.name] || 0}</span>
                          <button
                            onClick={() => handleTicketChange(ticket.name, (selectedTickets[ticket.name] || 0) + 1)}
                            className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center hover:bg-gray-300"
                            disabled={(selectedTickets[ticket.name] || 0) >= ticket.quantity}
                          >
                            +
                          </button>
                        </div>
                      ) : (
                        <span className="text-red-600 font-medium">Sold Out</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
              
              {totalAmount > 0 && (
                <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                  <div className="flex justify-between items-center">
                    <span className="font-medium">Total: {totalTickets} ticket(s)</span>
                    <span className="text-xl font-bold">${totalAmount}</span>
                  </div>
                </div>
              )}
            </div>
          )}

          {step === "customer" && (
            <div>
              <h3 className="text-lg font-semibold mb-4">Customer Information</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    First Name *
                  </label>
                  <input
                    type="text"
                    value={customerInfo.firstName}
                    onChange={(e) => setCustomerInfo(prev => ({ ...prev, firstName: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Last Name *
                  </label>
                  <input
                    type="text"
                    value={customerInfo.lastName}
                    onChange={(e) => setCustomerInfo(prev => ({ ...prev, lastName: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email *
                  </label>
                  <input
                    type="email"
                    value={customerInfo.email}
                    onChange={(e) => setCustomerInfo(prev => ({ ...prev, email: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Phone (Optional)
                  </label>
                  <input
                    type="tel"
                    value={customerInfo.phone}
                    onChange={(e) => setCustomerInfo(prev => ({ ...prev, phone: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>
          )}

          {step === "confirm" && (
            <div>
              <h3 className="text-lg font-semibold mb-4">Confirm Booking</h3>
              <div className="space-y-4">
                <div className="p-4 bg-gray-50 rounded-lg">
                  <h4 className="font-medium mb-2">Order Summary</h4>
                  {Object.entries(selectedTickets)
                    .filter(([_, quantity]) => quantity > 0)
                    .map(([ticketName, quantity]) => {
                      const ticket = event.ticketTypes.find((t) => t.name === ticketName);
                      return (
                        <div key={ticketName} className="flex justify-between text-sm mb-1">
                          <span>{ticketName} × {quantity}</span>
                          <span>${ticket ? (ticket.price * quantity).toFixed(2) : 0}</span>
                        </div>
                      );
                    })}
                  <div className="border-t pt-2 mt-2 flex justify-between font-bold">
                    <span>Total</span>
                    <span>${totalAmount.toFixed(2)}</span>
                  </div>
                </div>

                <div className="p-4 bg-gray-50 rounded-lg">
                  <h4 className="font-medium mb-2">Customer Information</h4>
                  <p className="text-sm text-gray-600">{customerInfo.firstName} {customerInfo.lastName}</p>
                  <p className="text-sm text-gray-600">{customerInfo.email}</p>
                  {customerInfo.phone && <p className="text-sm text-gray-600">{customerInfo.phone}</p>}
                </div>

                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-sm text-blue-800">
                    ℹ️ By completing this booking, you agree to the terms and conditions. 
                    A confirmation email will be sent to {customerInfo.email}.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="flex justify-between mt-8">
            <button
              onClick={() => {
                if (step === "customer") setStep("tickets");
                else if (step === "confirm") setStep("customer");
                else onBack();
              }}
              className="px-4 py-2 text-gray-600 hover:text-gray-800"
              disabled={isSubmitting}
            >
              {step === "tickets" ? "Cancel" : "Back"}
            </button>
            
            <button
              onClick={() => {
                if (step === "tickets") setStep("customer");
                else if (step === "customer") setStep("confirm");
                else handleSubmit();
              }}
              disabled={
                isSubmitting ||
                (step === "tickets" && !canProceedFromTickets) ||
                (step === "customer" && !canProceedFromCustomer)
              }
              className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
            >
              {isSubmitting ? "Processing..." : step === "confirm" ? "Complete Booking" : "Next"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
