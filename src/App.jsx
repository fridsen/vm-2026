import { BrowserRouter, Navigate, Routes, Route } from 'react-router-dom';
import AuthProvider from './components/AuthProvider.jsx';
import TeamsProvider from './components/TeamsProvider.jsx';
import AuthGate from './components/AuthGate.jsx';
import AppDataProvider from './components/AppDataProvider.jsx';
import Layout from './components/Layout.jsx';
import DashboardPage from './pages/DashboardPage.jsx';
import MatchesPage from './pages/MatchesPage.jsx';
import GroupStandingsPage from './pages/GroupStandingsPage.jsx';
import MinaTipsPage from './pages/MinaTipsPage.jsx';
import LeaderboardPage from './pages/LeaderboardPage.jsx';
import ProfilePage from './pages/ProfilePage.jsx';
import AdminPaymentsPage from './pages/AdminPaymentsPage.jsx';
import AdminPredictionHistoryPage from './pages/AdminPredictionHistoryPage.jsx';
import AdminSyncPage from './pages/AdminSyncPage.jsx';
import PortraitGate from './components/PortraitGate.jsx';
import AppUpdatePrompt from './components/AppUpdatePrompt.jsx';
import TeletextLayout from './components/teletext/TeletextLayout.jsx';
import ThemeProvider from './components/teletext/ThemeProvider.jsx';

export default function App() {
  return (
    <AuthProvider>
      <TeamsProvider>
        <AppUpdatePrompt />
        <AuthGate>
          <PortraitGate />
          <AppDataProvider>
          <BrowserRouter>
          <ThemeProvider>
          <Routes>
            <Route path="/t/:page" element={<TeletextLayout />} />
            <Route path="/" element={<Layout />}>
              <Route index element={<DashboardPage />} />
              <Route path="matcher" element={<MatchesPage />} />
              <Route path="grupper" element={<GroupStandingsPage />} />
              <Route path="slutspel" element={<Navigate to="/grupper?tab=slutspel" replace />} />
              <Route path="mina-tips" element={<MinaTipsPage />} />
              <Route path="leaderboard" element={<LeaderboardPage />} />
              <Route path="profile" element={<ProfilePage />} />
              <Route path="admin/betalningar" element={<AdminPaymentsPage />} />
              <Route path="admin/sync" element={<AdminSyncPage />} />
              <Route path="admin/tipphistorik" element={<AdminPredictionHistoryPage />} />
            </Route>
          </Routes>
          </ThemeProvider>
          </BrowserRouter>
          </AppDataProvider>
        </AuthGate>
      </TeamsProvider>
    </AuthProvider>
  );
}
