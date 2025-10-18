import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { format } from 'date-fns';

const Home = () => {
  const [featuredEvents, setFeaturedEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchFeaturedEvents();
  }, []);

  const fetchFeaturedEvents = async () => {
    try {
      const response = await axios.get(
        `${process.env.REACT_APP_EVENT_SERVICE_URL || 'http://localhost:3002'}/api/events?limit=6&sortBy=dateTime&sortOrder=asc`
      );
      setFeaturedEvents(response.data.events);
    } catch (error) {
      setError('Failed to load featured events');
      console.error('Error fetching featured events:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="loading">Loading featured events...</div>;
  }

  if (error) {
    return <div className="error">{error}</div>;
  }

  return (
    <div className="container">
      {/* Hero Section */}
      <section style={{ textAlign: 'center', padding: '60px 0', backgroundColor: '#f8f9fa', margin: '0 -20px 40px', borderRadius: '8px' }}>
        <h1 style={{ fontSize: '3rem', marginBottom: '20px', color: '#333' }}>
          Discover Amazing Events
        </h1>
        <p style={{ fontSize: '1.2rem', color: '#666', marginBottom: '30px' }}>
          Book tickets for concerts, conferences, workshops, and more
        </p>
        <Link to="/events" className="btn btn-primary" style={{ fontSize: '1.1rem', padding: '15px 30px' }}>
          Browse All Events
        </Link>
      </section>

      {/* Featured Events */}
      <section>
        <h2 style={{ marginBottom: '30px', textAlign: 'center' }}>Featured Events</h2>
        
        {featuredEvents.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px', color: '#666' }}>
            <p>No events available at the moment.</p>
            <p>Check back soon for exciting events!</p>
          </div>
        ) : (
          <div className="event-grid">
            {featuredEvents.map(event => (
              <div key={event._id} className="event-card">
                {event.images && event.images.length > 0 && (
                  <img 
                    src={event.images[0].url} 
                    alt={event.images[0].alt || event.title}
                    className="event-image"
                  />
                )}
                
                <div className="event-content">
                  <h3 className="event-title">{event.title}</h3>
                  
                  <div className="event-date">
                    📅 {format(new Date(event.dateTime), 'PPP p')}
                  </div>
                  
                  <div className="event-location">
                    📍 {event.venue.name}, {event.venue.city}
                  </div>
                  
                  <div className="event-price">
                    From ${event.minPrice}
                  </div>
                  
                  <div style={{ marginTop: '15px' }}>
                    <Link 
                      to={`/events/${event._id}`} 
                      className="btn btn-primary"
                      style={{ width: '100%' }}
                    >
                      View Details
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Categories Section */}
      <section style={{ marginTop: '60px', textAlign: 'center' }}>
        <h2 style={{ marginBottom: '30px' }}>Browse by Category</h2>
        
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '20px' }}>
          {[
            { name: 'Concerts', emoji: '🎵', category: 'concert' },
            { name: 'Conferences', emoji: '💼', category: 'conference' },
            { name: 'Workshops', emoji: '🛠️', category: 'workshop' },
            { name: 'Sports', emoji: '⚽', category: 'sports' },
            { name: 'Theater', emoji: '🎭', category: 'theater' },
            { name: 'Other', emoji: '🎪', category: 'other' }
          ].map(cat => (
            <Link 
              key={cat.category}
              to={`/events?category=${cat.category}`}
              style={{ 
                textDecoration: 'none',
                color: 'inherit',
                padding: '30px 20px',
                backgroundColor: 'white',
                borderRadius: '8px',
                boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                transition: 'transform 0.2s'
              }}
              onMouseOver={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
              onMouseOut={(e) => e.currentTarget.style.transform = 'translateY(0)'}
            >
              <div style={{ fontSize: '2rem', marginBottom: '10px' }}>{cat.emoji}</div>
              <div style={{ fontWeight: 'bold' }}>{cat.name}</div>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
};

export default Home;
