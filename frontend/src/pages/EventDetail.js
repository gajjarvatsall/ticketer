import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { eventService, ticketService, paymentService } from '../services/api';
import { useAuth } from '../contexts/AuthContext';

const EventDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showBooking, setShowBooking] = useState(false);
  
  // Booking state
  const [selectedTickets, setSelectedTickets] = useState({});
  const [customerInfo, setCustomerInfo] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: ''
  });
  const [paymentDetails, setPaymentDetails] = useState({
    paymentMethod: 'credit_card',
    cardNumber: '',
    expiryMonth: '',
    expiryYear: '',
    cvv: '',
    cardholderName: ''
  });
  const [step, setStep] = useState('tickets'); // tickets, customer, payment, processing
  const [bookingError, setBookingError] = useState('');
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    fetchEvent();
  }, [id]);

  const fetchEvent = async () => {
    try {
      const response = await eventService.getById(id);
      setEvent(response.data.event);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load event');
    } finally {
      setLoading(false);
    }
  };

  const handleTicketChange = (ticketName, quantity) => {
    setSelectedTickets(prev => ({
      ...prev,
      [ticketName]: Math.max(0, parseInt(quantity) || 0)
    }));
  };

  const getTotalAmount = () => {
    let total = 0;
    Object.entries(selectedTickets).forEach(([ticketName, quantity]) => {
      const ticket = event?.ticketTypes.find(t => t.name === ticketName);
      if (ticket) {
        total += ticket.price * quantity;
      }
    });
    return total;
  };

  const getTotalTickets = () => {
    return Object.values(selectedTickets).reduce((sum, qty) => sum + qty, 0);
  };

  const handleBookTickets = async () => {
    if (!user) {
      navigate('/login');
      return;
    }
    setShowBooking(true);
    setStep('tickets');
  };

  const proceedToCustomerInfo = () => {
    if (getTotalTickets() === 0) {
      setBookingError('Please select at least one ticket');
      return;
    }
    setBookingError('');
    setStep('customer');
  };

  const proceedToPayment = () => {
    if (!customerInfo.firstName || !customerInfo.lastName || !customerInfo.email) {
      setBookingError('Please fill in all required fields');
      return;
    }
    setBookingError('');
    setStep('payment');
  };

  const completeBooking = async () => {
    if (!paymentDetails.cardNumber || !paymentDetails.expiryMonth || 
        !paymentDetails.expiryYear || !paymentDetails.cvv || !paymentDetails.cardholderName) {
      setBookingError('Please fill in all payment details');
      return;
    }

    setBookingError('');
    setProcessing(true);
    setStep('processing');

    try {
      // Create order
      const tickets = Object.entries(selectedTickets)
        .filter(([_, quantity]) => quantity > 0)
        .map(([ticketTypeName, quantity]) => ({
          ticketTypeName,
          quantity
        }));

      const orderResponse = await ticketService.book({
        eventId: id,
        tickets,
        customerInfo
      });

      const { orderId } = orderResponse.data;

      // Process payment
      const paymentResponse = await paymentService.process({
        orderId,
        paymentMethod: paymentDetails.paymentMethod,
        paymentDetails
      });

      if (paymentResponse.data.success) {
        alert('Booking successful! Check your orders page.');
        navigate('/my-orders');
      } else {
        setBookingError(paymentResponse.data.message || 'Payment failed');
        setStep('payment');
      }
    } catch (err) {
      setBookingError(err.response?.data?.error || 'Booking failed');
      setStep('payment');
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-xl">Loading...</div>
      </div>
    );
  }

  if (error || !event) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          {error || 'Event not found'}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {!showBooking ? (
        // Event Details View
        <div>
          <button
            onClick={() => navigate('/events')}
            className="mb-4 text-blue-600 hover:text-blue-800"
          >
            ← Back to Events
          </button>

          <div className="bg-white rounded-lg shadow-lg overflow-hidden">
            <div className="h-64 bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center">
              <h1 className="text-white text-4xl font-bold text-center px-8">
                {event.title}
              </h1>
            </div>

            <div className="p-8">
              <div className="flex items-center gap-4 mb-6">
                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                  {event.category}
                </span>
                <span className="text-gray-600">
                  📅 {new Date(event.dateTime).toLocaleString()}
                </span>
              </div>

              <div className="prose max-w-none mb-8">
                <h2>About This Event</h2>
                <p>{event.description}</p>
              </div>

              <div className="mb-8">
                <h2 className="text-2xl font-bold mb-4">Location</h2>
                <p className="text-gray-600">
                  📍 {event.venue?.name}<br />
                  {event.venue?.address}<br />
                  {event.venue?.city}
                </p>
              </div>

              <div className="mb-8">
                <h2 className="text-2xl font-bold mb-4">Ticket Types</h2>
                <div className="space-y-4">
                  {event.ticketTypes?.map((ticket, idx) => (
                    <div key={idx} className="border rounded-lg p-4 flex justify-between items-center">
                      <div>
                        <h3 className="font-semibold">{ticket.name}</h3>
                        {ticket.description && (
                          <p className="text-sm text-gray-600">{ticket.description}</p>
                        )}
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold text-blue-600">
                          ${ticket.price.toFixed(2)}
                        </div>
                        <div className="text-sm text-gray-500">
                          {ticket.quantity} available
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <button
                onClick={handleBookTickets}
                className="w-full bg-blue-600 text-white py-4 rounded-lg font-semibold text-lg hover:bg-blue-700 transition"
              >
                Book Tickets
              </button>
            </div>
          </div>
        </div>
      ) : (
        // Booking Flow
        <div className="bg-white rounded-lg shadow-lg p-8">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold">Book Tickets</h2>
            <button
              onClick={() => setShowBooking(false)}
              className="text-gray-400 hover:text-gray-600"
              disabled={processing}
            >
              ✕
            </button>
          </div>

          {/* Progress Steps */}
          <div className="flex items-center mb-8">
            {['tickets', 'customer', 'payment'].map((stepName, index) => (
              <div key={stepName} className="flex items-center flex-1">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium ${
                  step === stepName ? 'bg-blue-600 text-white' :
                  ['tickets', 'customer', 'payment'].indexOf(step) > index ? 'bg-green-600 text-white' :
                  'bg-gray-200 text-gray-600'
                }`}>
                  {index + 1}
                </div>
                {index < 2 && (
                  <div className={`flex-1 h-1 mx-2 ${
                    ['tickets', 'customer', 'payment'].indexOf(step) > index ? 'bg-green-600' : 'bg-gray-200'
                  }`} />
                )}
              </div>
            ))}
          </div>

          {bookingError && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
              {bookingError}
            </div>
          )}

          {/* Step Content */}
          {step === 'tickets' && (
            <div>
              <h3 className="text-lg font-semibold mb-4">Select Tickets</h3>
              <div className="space-y-4 mb-6">
                {event.ticketTypes?.map((ticket, idx) => (
                  <div key={idx} className="border rounded-lg p-4">
                    <div className="flex justify-between items-center">
                      <div>
                        <h4 className="font-semibold">{ticket.name}</h4>
                        <p className="text-sm text-gray-600">${ticket.price.toFixed(2)}</p>
                      </div>
                      <input
                        type="number"
                        min="0"
                        max={ticket.quantity}
                        value={selectedTickets[ticket.name] || 0}
                        onChange={(e) => handleTicketChange(ticket.name, e.target.value)}
                        className="w-20 px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                ))}
              </div>
              <div className="flex justify-between items-center mb-4 p-4 bg-gray-50 rounded">
                <span className="font-semibold">Total</span>
                <span className="text-2xl font-bold text-blue-600">
                  ${getTotalAmount().toFixed(2)}
                </span>
              </div>
              <button
                onClick={proceedToCustomerInfo}
                className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700"
              >
                Continue
              </button>
            </div>
          )}

          {step === 'customer' && (
            <div>
              <h3 className="text-lg font-semibold mb-4">Customer Information</h3>
              <div className="space-y-4 mb-6">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">First Name *</label>
                    <input
                      type="text"
                      value={customerInfo.firstName}
                      onChange={(e) => setCustomerInfo({...customerInfo, firstName: e.target.value})}
                      className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Last Name *</label>
                    <input
                      type="text"
                      value={customerInfo.lastName}
                      onChange={(e) => setCustomerInfo({...customerInfo, lastName: e.target.value})}
                      className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Email *</label>
                  <input
                    type="email"
                    value={customerInfo.email}
                    onChange={(e) => setCustomerInfo({...customerInfo, email: e.target.value})}
                    className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Phone (optional)</label>
                  <input
                    type="tel"
                    value={customerInfo.phone}
                    onChange={(e) => setCustomerInfo({...customerInfo, phone: e.target.value})}
                    className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
              <div className="flex gap-4">
                <button
                  onClick={() => setStep('tickets')}
                  className="flex-1 border border-gray-300 py-3 rounded-lg font-semibold hover:bg-gray-50"
                >
                  Back
                </button>
                <button
                  onClick={proceedToPayment}
                  className="flex-1 bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700"
                >
                  Continue
                </button>
              </div>
            </div>
          )}

          {step === 'payment' && (
            <div>
              <h3 className="text-lg font-semibold mb-4">Payment Information</h3>
              <div className="space-y-4 mb-6">
                <div>
                  <label className="block text-sm font-medium mb-1">Cardholder Name *</label>
                  <input
                    type="text"
                    value={paymentDetails.cardholderName}
                    onChange={(e) => setPaymentDetails({...paymentDetails, cardholderName: e.target.value})}
                    className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="John Doe"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Card Number *</label>
                  <input
                    type="text"
                    value={paymentDetails.cardNumber}
                    onChange={(e) => setPaymentDetails({...paymentDetails, cardNumber: e.target.value})}
                    className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="4111111111111111"
                    maxLength="16"
                    required
                  />
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Month *</label>
                    <input
                      type="text"
                      value={paymentDetails.expiryMonth}
                      onChange={(e) => setPaymentDetails({...paymentDetails, expiryMonth: e.target.value})}
                      className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="MM"
                      maxLength="2"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Year *</label>
                    <input
                      type="text"
                      value={paymentDetails.expiryYear}
                      onChange={(e) => setPaymentDetails({...paymentDetails, expiryYear: e.target.value})}
                      className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="YYYY"
                      maxLength="4"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">CVV *</label>
                    <input
                      type="text"
                      value={paymentDetails.cvv}
                      onChange={(e) => setPaymentDetails({...paymentDetails, cvv: e.target.value})}
                      className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="123"
                      maxLength="4"
                      required
                    />
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 p-4 rounded mb-6">
                <div className="flex justify-between mb-2">
                  <span>Subtotal</span>
                  <span>${getTotalAmount().toFixed(2)}</span>
                </div>
                <div className="flex justify-between font-bold text-lg pt-2 border-t">
                  <span>Total</span>
                  <span className="text-blue-600">${getTotalAmount().toFixed(2)}</span>
                </div>
              </div>
              <div className="flex gap-4">
                <button
                  onClick={() => setStep('customer')}
                  className="flex-1 border border-gray-300 py-3 rounded-lg font-semibold hover:bg-gray-50"
                  disabled={processing}
                >
                  Back
                </button>
                <button
                  onClick={completeBooking}
                  className="flex-1 bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 disabled:bg-gray-400"
                  disabled={processing}
                >
                  {processing ? 'Processing...' : 'Complete Booking'}
                </button>
              </div>
            </div>
          )}

          {step === 'processing' && (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-lg">Processing your payment...</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default EventDetail;
