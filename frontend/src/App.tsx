import React from 'react';
import type { JSX } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Link } from 'react-router-dom';
import './App.css';
import LoginPage from './pages/LoginPage';
import WorldsListPage from './pages/WorldsListPage';
import { useAuth } from './hooks/useAuth';

const ProtectedRoute: React.FC<{ children: JSX.Element }> = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return <div>Loading authentication status...</div>;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  return children;
};

function App() {
  const { isAuthenticated, logout, user } = useAuth();

  return (
    <Router>
      <div>
        <nav>
          <ul>
            <li><Link to="/">Home (Worlds)</Link></li>
            {!isAuthenticated ? (
              <li><Link to="/login">Login</Link></li>
            ) : (
              <>
                <li><span>Welcome, {user?.username || 'User'}!</span></li>
                <li><button onClick={logout}>Logout</button></li>
              </>
            )}
          </ul>
        </nav>
        <hr />
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <WorldsListPage />
              </ProtectedRoute>
            }
          />
          {/* Routes */}
          <Route path="*" element={<Navigate to="/" />} />=
        </Routes>
      </div>
    </Router>
  );
}

export default App;