import React, { useState } from 'react';
import type { FormEvent } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import { useNavigate, useLocation, Navigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import apiClient from '../services/api';
import type { LoginResponse } from '@atlas-of-worlds/types';

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
    <div className="flex min-h-screen flex-col items-center justify-center px-4 py-12 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-8 rounded-xl bg-white p-8 shadow-2xl sm:p-10">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-pink-700 sm:text-4xl">
            Sign in to Atlas of Worlds
          </h2>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <input type="hidden" name="remember" defaultValue="true" />
          <div className="-space-y-px rounded-md shadow-sm">
            <div>
              <label htmlFor="email" className="sr-only">
                {' '}
                Email address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                className="relative block w-full appearance-none rounded-none rounded-t-md border border-gray-300 bg-white px-3 py-3 text-gray-900 placeholder-gray-500 focus:z-10 focus:border-[oklch(var(--color-pink-500))] focus:ring-[oklch(var(--color-pink-500))] focus:outline-none sm:text-sm dark:border-gray-700 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400"
                placeholder="Email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div>
              <label htmlFor="password" className="sr-only">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                className="relative block w-full appearance-none rounded-none rounded-b-md border border-gray-300 bg-white px-3 py-3 text-gray-900 placeholder-gray-500 focus:z-10 focus:border-[oklch(var(--color-pink-500))] focus:ring-[oklch(var(--color-pink-500))] focus:outline-none sm:text-sm dark:border-gray-700 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          {error && (
            <p className="text-center text-sm text-[oklch(var(--color-red-500))] dark:text-[oklch(var(--color-red-400))]">
              {error}
            </p>
          )}

          <div>
            <button
              type="submit"
              disabled={isLoading}
              className="group relative flex w-full justify-center rounded-md border border-transparent bg-[oklch(var(--color-pink-600))] px-4 py-3 text-sm font-medium text-white transition-colors hover:bg-[oklch(var(--color-pink-700))] focus:ring-2 focus:ring-[oklch(var(--color-pink-500))] focus:ring-offset-2 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isLoading ? (
                <>
                  <svg
                    className="mr-3 -ml-1 h-5 w-5 animate-spin text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  Logging in...
                </>
              ) : (
                'Sign in'
              )}
            </button>
          </div>
        </form>
        <p className="mt-4 text-center text-sm text-gray-600 dark:text-gray-400">
          Don't have an account?{' '}
          <Link
            to="/register"
            className="font-medium text-[oklch(var(--color-pink-600))] hover:text-[oklch(var(--color-pink-500))] dark:text-[oklch(var(--color-pink-400))] dark:hover:text-[oklch(var(--color-pink-300))]"
          >
            Register here
          </Link>
        </p>
      </div>
    </div>
  );
};

export default LoginPage;
