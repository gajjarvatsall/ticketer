import { useState } from "react";
import { useMutation, useAction } from "convex/react";
import { api } from "../../convex/_generated/api";

interface BookingFormProps {
  event: any;
  onClose: () => void;
  onSuccess: () => void;
}

export default function BookingForm({ event, onClose, onSuccess }: BookingFormProps) {
  const [selectedTickets, setSelectedTickets] = useState<Record<string, number>>({});
  const [customerInfo, setCustomerInfo] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
  });
  const [paymentDetails, setPaymentDetails] = useState({
    paymentMethod: "credit_card" as const,
    cardNumber: "",
    expiryMonth: "",
    expiryYear: "",
    cvv: "",
    cardholderName: "",
  });
  const [step, setStep] = useState<"tickets" | "customer" | "payment" | "processing">("tickets");
  const [error, setError] = useState("");

  const createOrder = useMutation(api.orders.create);
  const processPayment = useAction(api.payments.processPayment);

  const totalAmount = Object.entries(selectedTickets).reduce((total, [ticketName, quantity]) => {
    const ticket = event.ticketTypes.find((t: any) => t.name === ticketName);
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
    setError("");
    setStep("processing");

    try {
      // Create order
      const tickets = Object.entries(selectedTickets)
        .filter(([_, quantity]) => quantity > 0)
        .map(([ticketTypeName, quantity]) => ({
          ticketTypeName,
          quantity,
        }));

      const orderResult = await createOrder({
        eventId: event._id,
        tickets,
        customerInfo: {
          firstName: customerInfo.firstName,
          lastName: customerInfo.lastName,
          email: customerInfo.email,
          phone: customerInfo.phone || undefined,
        },
      });

      // Process payment
      const paymentResult = await processPayment({
        orderId: orderResult.orderId,
        paymentMethod: paymentDetails.paymentMethod,
        paymentDetails: {
          cardNumber: paymentDetails.cardNumber,
          expiryMonth: paymentDetails.expiryMonth,
          expiryYear: paymentDetails.expiryYear,
          cvv: paymentDetails.cvv,
          cardholderName: paymentDetails.cardholderName,
        },
      });

      if (paymentResult.success) {
        onSuccess();
      } else {
        setError(paymentResult.message || "Payment failed");
        setStep("payment");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
      setStep("payment");
    }
  };

  const canProceedFromTickets = totalTickets > 0;
  const canProceedFromCustomer = customerInfo.firstName && customerInfo.lastName && customerInfo.email;
  const canProceedFromPayment = paymentDetails.cardNumber && paymentDetails.expiryMonth && 
    paymentDetails.expiryYear && paymentDetails.cvv && paymentDetails.cardholderName;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Book Tickets</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
              disabled={step === "processing"}
            >
              ✕
            </button>
          </div>

          {/* Progress Steps */}
          <div className="flex items-center mb-8">
            {["tickets", "customer", "payment"].map((stepName, index) => (
              <div key={stepName} className="flex items-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                  step === stepName ? "bg-blue-600 text-white" :
                  ["tickets", "customer", "payment"].indexOf(step) > index ? "bg-green-600 text-white" :
                  "bg-gray-200 text-gray-600"
                }`}>
                  {index + 1}
                </div>
                {index < 2 && (
                  <div className={`w-16 h-1 mx-2 ${
                    ["tickets", "customer", "payment"].indexOf(step) > index ? "bg-green-600" : "bg-gray-200"
                  }`} />
                )}
              </div>
            ))}
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
              {error}
            </div>
          )}

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
                        {ticket.available} available
                      </span>
                      {ticket.available > 0 ? (
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
                            disabled={(selectedTickets[ticket.name] || 0) >= ticket.available}
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

          {step === "payment" && (
            <div>
              <h3 className="text-lg font-semibold mb-4">Payment Information</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Cardholder Name *
                  </label>
                  <input
                    type="text"
                    value={paymentDetails.cardholderName}
                    onChange={(e) => setPaymentDetails(prev => ({ ...prev, cardholderName: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Card Number *
                  </label>
                  <input
                    type="text"
                    value={paymentDetails.cardNumber}
                    onChange={(e) => setPaymentDetails(prev => ({ ...prev, cardNumber: e.target.value.replace(/\D/g, '') }))}
                    placeholder="1234 5678 9012 3456"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Month *
                    </label>
                    <select
                      value={paymentDetails.expiryMonth}
                      onChange={(e) => setPaymentDetails(prev => ({ ...prev, expiryMonth: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    >
                      <option value="">MM</option>
                      {Array.from({ length: 12 }, (_, i) => (
                        <option key={i + 1} value={String(i + 1).padStart(2, '0')}>
                          {String(i + 1).padStart(2, '0')}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Year *
                    </label>
                    <select
                      value={paymentDetails.expiryYear}
                      onChange={(e) => setPaymentDetails(prev => ({ ...prev, expiryYear: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    >
                      <option value="">YYYY</option>
                      {Array.from({ length: 10 }, (_, i) => (
                        <option key={i} value={String(new Date().getFullYear() + i)}>
                          {new Date().getFullYear() + i}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      CVV *
                    </label>
                    <input
                      type="text"
                      value={paymentDetails.cvv}
                      onChange={(e) => setPaymentDetails(prev => ({ ...prev, cvv: e.target.value.replace(/\D/g, '').slice(0, 4) }))}
                      placeholder="123"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>
                </div>
              </div>

              <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                <h4 className="font-medium mb-2">Order Summary</h4>
                {Object.entries(selectedTickets)
                  .filter(([_, quantity]) => quantity > 0)
                  .map(([ticketName, quantity]) => {
                    const ticket = event.ticketTypes.find((t: any) => t.name === ticketName);
                    return (
                      <div key={ticketName} className="flex justify-between text-sm">
                        <span>{ticketName} × {quantity}</span>
                        <span>${ticket ? ticket.price * quantity : 0}</span>
                      </div>
                    );
                  })}
                <div className="border-t pt-2 mt-2 flex justify-between font-bold">
                  <span>Total</span>
                  <span>${totalAmount}</span>
                </div>
              </div>
            </div>
          )}

          {step === "processing" && (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Processing your payment...</p>
            </div>
          )}

          {/* Navigation Buttons */}
          {step !== "processing" && (
            <div className="flex justify-between mt-8">
              <button
                onClick={() => {
                  if (step === "customer") setStep("tickets");
                  else if (step === "payment") setStep("customer");
                  else onClose();
                }}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                {step === "tickets" ? "Cancel" : "Back"}
              </button>
              
              <button
                onClick={() => {
                  if (step === "tickets") setStep("customer");
                  else if (step === "customer") setStep("payment");
                  else handleSubmit();
                }}
                disabled={
                  (step === "tickets" && !canProceedFromTickets) ||
                  (step === "customer" && !canProceedFromCustomer) ||
                  (step === "payment" && !canProceedFromPayment)
                }
                className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                {step === "payment" ? "Complete Payment" : "Next"}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
