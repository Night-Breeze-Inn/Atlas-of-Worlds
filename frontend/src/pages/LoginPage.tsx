import React, { useState } from 'react';
import type { FormEvent } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import { useNavigate, useLocation, Navigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import apiClient from '../services/api';
import type { LoginResponse } from '../../../backend/src/auth/auth.service';

const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const auth = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  type LocationState = { from?: { pathname?: string } };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);
    setIsLoading(true);
    try {
      const response = await apiClient.post<LoginResponse>('/auth/login', {
        email,
        password,
      });
      auth.login(response.data.accessToken);
      navigate(
        (location.state as LocationState)?.from?.pathname || '/my-worlds',
        { replace: true },
      );
    } catch (err: unknown) {
      let errorMessage = 'An unexpected error occurred during login.';
      if (axios.isAxiosError(err)) {
        if (
          err.response &&
          err.response.data &&
          typeof err.response.data.message === 'string'
        ) {
          errorMessage = err.response.data.message;
        } else if (typeof err.message === 'string') {
          errorMessage = err.message;
        }
      } else if (err instanceof Error) {
        errorMessage = err.message;
      }
      setError(errorMessage);
      console.error('Login error:', err);
      console.error('Login error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  if (auth.isAuthenticated) {
    return (
      <Navigate
        to={(location.state as LocationState)?.from?.pathname || '/my-worlds'}
        replace
      />
    );
  }

  return (
    <div className="login-page">
      <h2 className="login-page-title">Login</h2>
      <form onSubmit={handleSubmit}>
        <div className="login-page-form-group">
          <label htmlFor="email">Email:</label>
          <input
            type="email"
            id="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        <div className="login-page-form-group">
          <label htmlFor="password">Password:</label>
          <input
            type="password"
            id="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        {error && <p style={{ color: 'red' }}>{error}</p>}
        <button type="submit" disabled={isLoading}>
          {isLoading ? 'Logging in...' : 'Login'}
        </button>
      </form>
      {/* Optional: Link to registration page */}
      <p>
        Don't have an account? <Link to="/register">Register here</Link>
      </p>
    </div>
  );
};

export default LoginPage;
