import React, { useEffect } from 'react';
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import Home from './pages/Home';
import Profile from './pages/Profile';
import { useAuth } from './contexts/AuthContext';

const GlobalAuthObserver = ({ children }: { children: React.ReactNode }) => {
  const { currentUser, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (!loading && currentUser && location.pathname === '/') {
      navigate('/profile', { replace: true });
    }
  }, [currentUser, loading, location, navigate]);

  return <>{children}</>;
};

export default function App() {
  return (
    <GlobalAuthObserver>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/profile" element={<Profile />} />
      </Routes>
    </GlobalAuthObserver>
  );
}
