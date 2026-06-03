import { BrowserRouter, Navigate, Routes, Route } from 'react-router-dom';
import AuthProvider from './components/AuthProvider.jsx';
import TeamsProvider from './components/TeamsProvider.jsx';
import AuthGate from './components/AuthGate.jsx';
import Layout from './components/Layout.jsx';
import DashboardPage from './pages/DashboardPage.jsx';
import MatchesPage from './pages/MatchesPage.jsx';
import GroupStandingsPage from './pages/GroupStandingsPage.jsx';
import MinaTipsPage from './pages/MinaTipsPage.jsx';
import LeaderboardPage from './pages/LeaderboardPage.jsx';

export default function App() {
  return (
    <AuthProvider>
      <TeamsProvider>
        <AuthGate>
          <BrowserRouter>
          <Routes>
            <Route path="/" element={<Layout />}>
              <Route index element={<DashboardPage />} />
              <Route path="matcher" element={<MatchesPage />} />
              <Route path="grupper" element={<GroupStandingsPage />} />
              <Route path="slutspel" element={<Navigate to="/grupper?tab=slutspel" replace />} />
              <Route path="mina-tips" element={<MinaTipsPage />} />
              <Route path="leaderboard" element={<LeaderboardPage />} />
            </Route>
          </Routes>
          </BrowserRouter>
        </AuthGate>
      </TeamsProvider>
    </AuthProvider>
  );
}
