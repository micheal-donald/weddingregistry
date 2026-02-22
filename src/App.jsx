import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { ToastProvider } from './components/Toast';
import ProtectedRoute from './components/ProtectedRoute';
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import OnboardingPage from './pages/OnboardingPage';
import RegistryPage from './pages/RegistryPage';
import AdminDashboardPage from './pages/AdminDashboardPage';

function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/dashboard" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
          <Route path="/new" element={<ProtectedRoute><OnboardingPage /></ProtectedRoute>} />
          <Route path="/:slug" element={<RegistryPage />} />
          <Route path="/:slug/admin" element={<ProtectedRoute><AdminDashboardPage /></ProtectedRoute>} />
        </Routes>
      </ToastProvider>
    </AuthProvider>
  );
}

export default App;
