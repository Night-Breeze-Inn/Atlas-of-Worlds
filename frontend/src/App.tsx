import React from 'react';
import type { JSX } from 'react';
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import WorldsListPage from './pages/WorldsListPage';
import CreateWorldPage from './pages/CreateWorldPage';
import HomePage from './pages/HomePage';
import Header from './components/Header';
import WorldDetailPage from './pages/WorldDetailPage';
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
  return (
    <Router>
      <div>
        <Header />
        <main style={{ padding: '1rem' }}>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route
              path="/my-worlds"
              element={
                <ProtectedRoute>
                  <WorldsListPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/worlds/create"
              element={
                <ProtectedRoute>
                  <CreateWorldPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/my-worlds/:worldId"
              element={
                <ProtectedRoute>
                  <WorldDetailPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="*"
              element={
                useAuth().isAuthenticated ? (
                  <Navigate to="/my-worlds" />
                ) : (
                  <Navigate to="/" />
                )
              }
            />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
