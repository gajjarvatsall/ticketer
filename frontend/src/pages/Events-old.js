import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import axios from 'axios';
import { format } from 'date-fns';

const Events = () => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState({});
  const [searchParams, setSearchParams] = useSearchParams();

  // Filter states
  const [filters, setFilters] = useState({
    search: searchParams.get('search') || '',
    category: searchParams.get('category') || '',
    city: searchParams.get('city') || '',
    page: parseInt(searchParams.get('page')) || 1
  });

  const categories = ['concert', 'conference', 'workshop', 'sports', 'theater', 'other'];

  useEffect(() => {
    fetchEvents();
  }, [filters]);

  const fetchEvents = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value) params.append(key, value);
      });

      const response = await axios.get(
        `${process.env.REACT_APP_EVENT_SERVICE_URL || 'http://localhost:3002'}/api/events?${params}`
      );
      
      setEvents(response.data.events);
      setPagination(response.data.pagination);
      
      // Update URL params
      setSearchParams(params);
    } catch (error) {
      setError('Failed to load events');
      console.error('Error fetching events:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({
      ...prev,
      [key]: value,
      page: 1 // Reset to first page when filters change
    }));
  };

  const handlePageChange = (newPage) => {
    setFilters(prev => ({ ...prev, page: newPage }));
  };

  const clearFilters = () => {
    setFilters({
      search: '',
      category: '',
      city: '',
      page: 1
    });
  };

  return (
    <div className="container">
      <h1>Events</h1>

      {/* Filters */}
      <div className="card" style={{ marginBottom: '30px' }}>
        <h3>Filter Events</h3>
        
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px', marginBottom: '20px' }}>
          <div className="form-group">
            <label>Search</label>
            <input
              type="text"
              className="form-control"
              placeholder="Search events..."
              value={filters.search}
              onChange={(e) => handleFilterChange('search', e.target.value)}
            />
          </div>

          <div className="form-group">
            <label>Category</label>
            <select
              className="form-control"
              value={filters.category}
              onChange={(e) => handleFilterChange('category', e.target.value)}
            >
              <option value="">All Categories</option>
              {categories.map(cat => (
                <option key={cat} value={cat}>
                  {cat.charAt(0).toUpperCase() + cat.slice(1)}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label>City</label>
            <input
              type="text"
              className="form-control"
              placeholder="Enter city..."
              value={filters.city}
              onChange={(e) => handleFilterChange('city', e.target.value)}
            />
          </div>
        </div>

        <button onClick={clearFilters} className="btn btn-secondary">
          Clear Filters
        </button>
      </div>

      {/* Results */}
      {loading ? (
        <div className="loading">Loading events...</div>
      ) : error ? (
        <div className="error">{error}</div>
      ) : (
        <>
          <div style={{ marginBottom: '20px', color: '#666' }}>
            {pagination.total} event(s) found
          </div>

          {events.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px', color: '#666' }}>
              <p>No events found matching your criteria.</p>
              <button onClick={clearFilters} className="btn btn-primary">
                View All Events
              </button>
            </div>
          ) : (
            <>
              <div className="event-grid">
                {events.map(event => (
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
                      
                      <div style={{ margin: '10px 0', fontSize: '0.9rem', color: '#666' }}>
                        {event.category.charAt(0).toUpperCase() + event.category.slice(1)}
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

              {/* Pagination */}
              {pagination.pages > 1 && (
                <div className="pagination">
                  <button
                    onClick={() => handlePageChange(pagination.page - 1)}
                    disabled={pagination.page <= 1}
                  >
                    Previous
                  </button>
                  
                  {Array.from({ length: pagination.pages }, (_, i) => i + 1).map(page => (
                    <button
                      key={page}
                      onClick={() => handlePageChange(page)}
                      className={pagination.page === page ? 'active' : ''}
                    >
                      {page}
                    </button>
                  ))}
                  
                  <button
                    onClick={() => handlePageChange(pagination.page + 1)}
                    disabled={pagination.page >= pagination.pages}
                  >
                    Next
                  </button>
                </div>
              )}
            </>
          )}
        </>
      )}
    </div>
  );
};

export default Events;
