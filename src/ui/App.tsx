
import { HashRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { RecordingProvider } from './context/RecordingContext';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Recorder from './pages/Recorder';
import Videos from './pages/Videos';
import RegionSelectorPage from './pages/RegionSelectorPage';
import CountdownPage from './pages/CountdownPage';
import VideoEditorRoute from './pages/VideoEditorRoute';
import { MainLayout } from './components/MainLayout';
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
      <RecordingProvider>
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
            <Route path="/region-selector" element={<RegionSelectorPage />} />
            <Route path="/countdown" element={<CountdownPage />} />
            <Route path="/" element={
              <RequireAuth>
                <MainLayout>
                  <Recorder />
                </MainLayout>
              </RequireAuth>
            } />
            <Route path="/videos" element={
              <RequireAuth>
                <MainLayout>
                  <Videos />
                </MainLayout>
              </RequireAuth>
            } />
            <Route path="/editor" element={
              <RequireAuth>
                <MainLayout>
                  <VideoEditorRoute />
                </MainLayout>
              </RequireAuth>
            } />
          </Routes>
        </HashRouter>
      </RecordingProvider>
    </AuthProvider>
  );
}

export default App;
