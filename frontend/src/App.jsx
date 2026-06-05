import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useEffect } from 'react';
import { useAuthStore } from './store/authStore';
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import WorkspacePage from './pages/WorkspacePage';
import HistoryPage from './pages/HistoryPage';
import SettingsPage from './pages/SettingsPage';
import AppLayout from './components/layout/AppLayout';

const Protected = ({ children }) => useAuthStore(s => s.isAuthenticated) ? children : <Navigate to="/login" replace />;
const Public = ({ children }) => useAuthStore(s => s.isAuthenticated) ? <Navigate to="/dashboard" replace /> : children;

export default function App() {
  const initAuth = useAuthStore(s => s.initAuth);
  useEffect(() => { initAuth(); }, []);
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<Public><LoginPage /></Public>} />
        <Route path="/register" element={<Public><RegisterPage /></Public>} />
        <Route path="/dashboard" element={<Protected><AppLayout><DashboardPage /></AppLayout></Protected>} />
        <Route path="/workspace" element={<Protected><AppLayout><WorkspacePage /></AppLayout></Protected>} />
        <Route path="/workspace/:taskId" element={<Protected><AppLayout><WorkspacePage /></AppLayout></Protected>} />
        <Route path="/history" element={<Protected><AppLayout><HistoryPage /></AppLayout></Protected>} />
        <Route path="/settings" element={<Protected><AppLayout><SettingsPage /></AppLayout></Protected>} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
