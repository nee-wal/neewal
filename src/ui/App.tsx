
import { HashRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Recorder from './pages/Recorder'; // We'll create this next
import './index.css';
import type { JSX } from "react";

// Guard for protected routes
function RequireAuth({ children }: { children: JSX.Element }) {
  const { session, isGuest, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return <div className="flex h-screen items-center justify-center text-white">Loading...</div>;
  }

  if (!session && !isGuest) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
}

// Guard for public routes (redirect to home if already logged in)
function PublicOnly({ children }: { children: JSX.Element }) {
  const { session, loading } = useAuth();

  if (loading) {
    return <div className="flex h-screen items-center justify-center text-white">Loading...</div>;
  }

  // Only redirect if "real" user session exists. Guests should be able to access login/signup.
  if (session) {
    return <Navigate to="/" replace />;
  }

  return children;
}

function App() {
  return (
    <AuthProvider>
      <HashRouter>
        <Routes>
          <Route path="/login" element={
            <PublicOnly>
              <Login />
            </PublicOnly>
          } />
          <Route path="/signup" element={
            <PublicOnly>
              <Signup />
            </PublicOnly>
          } />
          <Route path="/" element={
            <RequireAuth>
              <Recorder />
            </RequireAuth>
          } />
        </Routes>
      </HashRouter>
    </AuthProvider>
  );
}

export default App;
