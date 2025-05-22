import React, { createContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import type { JwtPayload } from '../../../backend/src/auth/auth.service';

const decodeJwt = (token: string): JwtPayload | null => {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload) as JwtPayload;
  } catch (error) {
    console.error('Failed to decode JWT:', error);
    return null;
  }
};


export interface AuthContextType {
  isAuthenticated: boolean;
  user: JwtPayload | null;
  token: string | null;
  login: (token: string) => void;
  logout: () => void;
  isLoading: boolean;
}

// eslint-disable-next-line react-refresh/only-export-components
export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<JwtPayload | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const storedToken = localStorage.getItem('accessToken');
    if (storedToken) {
      const decodedUser = decodeJwt(storedToken);
      if (decodedUser && decodedUser.exp && decodedUser.exp * 1000 > Date.now()) {
        setToken(storedToken);
        setUser(decodedUser);
      } else {
        localStorage.removeItem('accessToken');
      }
    }
    setIsLoading(false);
  }, []);

  const login = (newToken: string) => {
    localStorage.setItem('accessToken', newToken);
    const decodedUser = decodeJwt(newToken);
    setToken(newToken);
    setUser(decodedUser);
  };

  const logout = () => {
    localStorage.removeItem('accessToken');
    setToken(null);
    setUser(null);
    window.location.href = '/login';
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated: !!token, token, user, login, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
};