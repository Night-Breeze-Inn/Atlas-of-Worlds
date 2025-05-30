import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

const Header: React.FC = () => {
  const { isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className="bg-primary-100 flex h-16 w-full items-center justify-between px-4 shadow-md">
      <img src="/logo.png" alt="Logo" className="mr-2 h-8 w-8" />
      <nav className="flex items-center justify-between px-4">
        <ul className="flex space-x-4">
          <li>
            <Link to="/">Home Page</Link>
          </li>
          {!isAuthenticated ? (
            <li>
              <Link to="/login">Login</Link>
            </li>
          ) : (
            <>
              <li>
                <Link to="/my-worlds">My Worlds</Link>
              </li>
              <li>
                <button onClick={handleLogout}>Logout</button>
              </li>
            </>
          )}
        </ul>
      </nav>
    </header>
  );
};
export default Header;
