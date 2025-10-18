import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { format } from 'date-fns';
import { useAuth } from '../contexts/AuthContext';

const EventDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [event, setEvent] = useState(null);
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [booking, setBooking] = useState(false);
  
  // Booking form state
  const [selectedTickets, setSelectedTickets] = useState({});
  const [customerInfo, setCustomerInfo] = useState({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    email: user?.email || '',
    phone: ''
  });

  useEffect(() => {
    fetchEventDetails();
  }, [id]);

  useEffect(() => {
    if (user) {
      setCustomerInfo(prev => ({
        ...prev,
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        email: user.email || ''
      }));
    }
  }, [user]);

  const fetchEventDetails = async () => {
    try {
      const [eventResponse, ticketsResponse] = await Promise.all([
        axios.get(`${process.env.REACT_APP_EVENT_SERVICE_URL || 'http://localhost:3002'}/api/events/${id}`),
        axios.get(`${process.env.REACT_APP_TICKET_SERVICE_URL || 'http://localhost:3003'}/api/tickets/event/${id}`)
      ]);
      
      setEvent(eventResponse.data.event);
      setTickets(ticketsResponse.data.tickets);
    } catch (error) {
      setError('Failed to load event details');
      console.error('Error fetching event details:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleTicketQuantityChange = (ticketType, quantity) => {
    setSelectedTickets(prev => ({
      ...prev,
      [ticketType]: Math.max(0, quantity)
    }));
  };

  const calculateTotal = () => {
    return Object.entries(selectedTickets).reduce((total, [ticketType, quantity]) => {
      const ticket = tickets.find(t => t.ticketType.name === ticketType);
      return total + (ticket ? ticket.ticketType.price * quantity : 0);
    }, 0);
  };

  const handleBooking = async (e) => {
    e.preventDefault();
    
    if (!user) {
      navigate('/login');
      return;
    }

    const bookingTickets = Object.entries(selectedTickets)
      .filter(([_, quantity]) => quantity > 0)
      .map(([ticketType, quantity]) => ({ ticketType, quantity }));

    if (bookingTickets.length === 0) {
      alert('Please select at least one ticket');
      return;
    }

    setBooking(true);
    
    try {
      const response = await axios.post(
        `${process.env.REACT_APP_TICKET_SERVICE_URL || 'http://localhost:3003'}/api/tickets/book`,
        {
          eventId: id,
          tickets: bookingTickets,
          customerInfo
        },
        { withCredentials: true }
      );

      navigate(`/booking-confirmation/${response.data.order._id}`);
    } catch (error) {
      alert(error.response?.data?.error || 'Booking failed');
      console.error('Booking error:', error);
    } finally {
      setBooking(false);
    }
  };

  if (loading) {
    return <div className="loading">Loading event details...</div>;
  }

  if (error) {
    return <div className="error">{error}</div>;
  }

  if (!event) {
    return <div className="error">Event not found</div>;
  }

  const totalAmount = calculateTotal();
  const hasSelectedTickets = Object.values(selectedTickets).some(qty => qty > 0);

  return (
    <div className="container">
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '40px', alignItems: 'start' }}>
        {/* Event Details */}
        <div>
          {event.images && event.images.length > 0 && (
            <img 
              src={event.images[0].url} 
              alt={event.images[0].alt || event.title}
              style={{ width: '100%', height: '400px', objectFit: 'cover', borderRadius: '8px', marginBottom: '20px' }}
            />
          )}

          <h1>{event.title}</h1>
          
          <div style={{ marginBottom: '20px' }}>
            <div style={{ marginBottom: '10px' }}>
              <strong>📅 Date & Time:</strong> {format(new Date(event.dateTime), 'PPP p')}
            </div>
            <div style={{ marginBottom: '10px' }}>
              <strong>📍 Venue:</strong> {event.venue.name}
            </div>
            <div style={{ marginBottom: '10px' }}>
              <strong>🏙️ Location:</strong> {event.venue.address}, {event.venue.city}
            </div>
            <div style={{ marginBottom: '10px' }}>
              <strong>⏱️ Duration:</strong> {event.duration} minutes
            </div>
            <div style={{ marginBottom: '10px' }}>
              <strong>🎭 Category:</strong> {event.category.charAt(0).toUpperCase() + event.category.slice(1)}
            </div>
          </div>

          <div>
            <h3>Description</h3>
            <p style={{ lineHeight: '1.6', color: '#666' }}>{event.description}</p>
          </div>

          <div style={{ marginTop: '30px' }}>
            <h3>Organizer</h3>
            <div>
              <strong>Name:</strong> {event.organizer.name}<br />
              <strong>Email:</strong> {event.organizer.email}<br />
              {event.organizer.phone && (
                <>
                  <strong>Phone:</strong> {event.organizer.phone}
                </>
              )}
            </div>
          </div>

          {event.tags && event.tags.length > 0 && (
            <div style={{ marginTop: '30px' }}>
              <h3>Tags</h3>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                {event.tags.map((tag, index) => (
                  <span 
                    key={index}
                    style={{ 
                      backgroundColor: '#f0f0f0', 
                      padding: '5px 10px', 
                      borderRadius: '15px', 
                      fontSize: '0.9rem' 
                    }}
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Booking Form */}
        <div className="card" style={{ position: 'sticky', top: '20px' }}>
          <h3>Book Tickets</h3>
          
          <form onSubmit={handleBooking}>
            {/* Ticket Selection */}
            <div style={{ marginBottom: '20px' }}>
              <h4>Select Tickets</h4>
              {tickets.map(ticket => (
                <div key={ticket._id} style={{ marginBottom: '15px', padding: '15px', border: '1px solid #ddd', borderRadius: '5px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                    <div>
                      <strong>{ticket.ticketType.name}</strong>
                      <div style={{ color: '#666', fontSize: '0.9rem' }}>
                        ${ticket.ticketType.price}
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <button
                        type="button"
                        onClick={() => handleTicketQuantityChange(ticket.ticketType.name, (selectedTickets[ticket.ticketType.name] || 0) - 1)}
                        style={{ width: '30px', height: '30px', border: '1px solid #ddd', background: 'white', cursor: 'pointer' }}
                      >
                        -
                      </button>
                      <span style={{ minWidth: '20px', textAlign: 'center' }}>
                        {selectedTickets[ticket.ticketType.name] || 0}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleTicketQuantityChange(ticket.ticketType.name, (selectedTickets[ticket.ticketType.name] || 0) + 1)}
                        disabled={selectedTickets[ticket.ticketType.name] >= ticket.availableQuantity}
                        style={{ width: '30px', height: '30px', border: '1px solid #ddd', background: 'white', cursor: 'pointer' }}
                      >
                        +
                      </button>
                    </div>
                  </div>
                  {ticket.ticketType.description && (
                    <div style={{ fontSize: '0.9rem', color: '#666' }}>
                      {ticket.ticketType.description}
                    </div>
                  )}
                  <div style={{ fontSize: '0.9rem', color: '#666' }}>
                    Available: {ticket.availableQuantity}
                  </div>
                </div>
              ))}
            </div>

            {/* Customer Information */}
            {hasSelectedTickets && (
              <div style={{ marginBottom: '20px' }}>
                <h4>Customer Information</h4>
                <div className="form-group">
                  <label>First Name</label>
                  <input
                    type="text"
                    className="form-control"
                    value={customerInfo.firstName}
                    onChange={(e) => setCustomerInfo(prev => ({ ...prev, firstName: e.target.value }))}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Last Name</label>
                  <input
                    type="text"
                    className="form-control"
                    value={customerInfo.lastName}
                    onChange={(e) => setCustomerInfo(prev => ({ ...prev, lastName: e.target.value }))}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Email</label>
                  <input
                    type="email"
                    className="form-control"
                    value={customerInfo.email}
                    onChange={(e) => setCustomerInfo(prev => ({ ...prev, email: e.target.value }))}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Phone (Optional)</label>
                  <input
                    type="tel"
                    className="form-control"
                    value={customerInfo.phone}
                    onChange={(e) => setCustomerInfo(prev => ({ ...prev, phone: e.target.value }))}
                  />
                </div>
              </div>
            )}

            {/* Total and Book Button */}
            {hasSelectedTickets && (
              <div>
                <div style={{ marginBottom: '20px', padding: '15px', backgroundColor: '#f8f9fa', borderRadius: '5px' }}>
                  <strong>Total: ${totalAmount.toFixed(2)}</strong>
                </div>
                
                {user ? (
                  <button 
                    type="submit" 
                    className="btn btn-primary" 
                    style={{ width: '100%' }}
                    disabled={booking}
                  >
                    {booking ? 'Processing...' : 'Book Now'}
                  </button>
                ) : (
                  <div>
                    <p style={{ marginBottom: '10px', color: '#666' }}>
                      Please log in to book tickets
                    </p>
                    <button 
                      type="button"
                      onClick={() => navigate('/login')}
                      className="btn btn-primary" 
                      style={{ width: '100%' }}
                    >
                      Login to Book
                    </button>
                  </div>
                )}
              </div>
            )}
          </form>
        </div>
      </div>
    </div>
  );
};

export default EventDetail;
