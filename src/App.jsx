import { BrowserRouter, Routes, Route } from 'react-router-dom';
import AuthProvider from './components/AuthProvider.jsx';
import AuthGate from './components/AuthGate.jsx';
import Layout from './components/Layout.jsx';
import DashboardPage from './pages/DashboardPage.jsx';
import MatchesPage from './pages/MatchesPage.jsx';
import GroupStandingsPage from './pages/GroupStandingsPage.jsx';
import KnockoutPage from './pages/KnockoutPage.jsx';
import TopScorersPage from './pages/TopScorersPage.jsx';
import LeaderboardPage from './pages/LeaderboardPage.jsx';

export default function App() {
  return (
    <AuthProvider>
      <AuthGate>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Layout />}>
              <Route index element={<DashboardPage />} />
              <Route path="matcher" element={<MatchesPage />} />
              <Route path="grupper" element={<GroupStandingsPage />} />
              <Route path="slutspel" element={<KnockoutPage />} />
              <Route path="skytteliga" element={<TopScorersPage />} />
              <Route path="leaderboard" element={<LeaderboardPage />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </AuthGate>
    </AuthProvider>
  );
}
