import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  return (
    <nav className="navbar">
      <div className="container">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Link to="/" className="navbar-brand">
            EventTickets
          </Link>
          
          <ul className="navbar-nav">
            <li className="nav-item">
              <Link to="/events" className="nav-link">Events</Link>
            </li>
            
            {user ? (
              <>
                <li className="nav-item">
                  <Link to="/profile" className="nav-link">
                    {user.firstName} {user.lastName}
                  </Link>
                </li>
                <li className="nav-item">
                  <button 
                    onClick={handleLogout}
                    className="nav-link"
                    style={{ background: 'none', border: 'none', cursor: 'pointer' }}
                  >
                    Logout
                  </button>
                </li>
              </>
            ) : (
              <>
                <li className="nav-item">
                  <Link to="/login" className="nav-link">Login</Link>
                </li>
                <li className="nav-item">
                  <Link to="/register" className="nav-link">Register</Link>
                </li>
              </>
            )}
          </ul>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
