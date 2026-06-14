import { useMemo } from 'react';
import { useParams } from 'react-router-dom';
import TeletextPage from './TeletextPage.jsx';
import TeletextDashboardPage from '../../pages/teletext/TeletextDashboardPage.jsx';
import TeletextTipsMatchPage from '../../pages/teletext/TeletextTipsMatchPage.jsx';
import TeletextTipsGroupPage from '../../pages/teletext/TeletextTipsGroupPage.jsx';
import TeletextTipsWinnerPage from '../../pages/teletext/TeletextTipsWinnerPage.jsx';
import TeletextMatcherIndexPage from '../../pages/teletext/TeletextMatcherIndexPage.jsx';
import TeletextGroupPage from '../../pages/teletext/TeletextGroupPage.jsx';
import TeletextLiveScoresPage from '../../pages/teletext/TeletextLiveScoresPage.jsx';
import TeletextLeaderboardPage from '../../pages/teletext/TeletextLeaderboardPage.jsx';
import TeletextPageLink from './TeletextPageLink.jsx';
import { TELETEXT_HOME_PAGE } from '../../teletext/constants.js';
import { getPageTitle, resolvePageType } from '../../teletext/pageRegistry.js';

function TeletextNotFound() {
  return (
    <TeletextPage pageNum={0} title="SIDAN FINNS EJ">
      <p className="teletext-row teletext-row--cyan teletext-row--center">
        Ogiltigt sidnummer.
      </p>
      <p className="teletext-row teletext-row--center" style={{ marginTop: 18 }}>
        <TeletextPageLink page={TELETEXT_HOME_PAGE}>Tillbaka till {TELETEXT_HOME_PAGE}</TeletextPageLink>
      </p>
    </TeletextPage>
  );
}

function resolveContent(pageNum, pageType) {
  switch (pageType) {
    case 'dashboard':
      return TeletextDashboardPage;
    case 'tips-match':
      return TeletextTipsMatchPage;
    case 'tips-group':
      return TeletextTipsGroupPage;
    case 'tips-winner':
      return TeletextTipsWinnerPage;
    case 'matcher-index':
      return TeletextMatcherIndexPage;
    case 'group-detail':
      return TeletextGroupPage;
    case 'live-scores':
      return TeletextLiveScoresPage;
    case 'leaderboard':
      return TeletextLeaderboardPage;
    default:
      return null;
  }
}

export default function TeletextLayout() {
  const { page } = useParams();
  const pageNum = Number.parseInt(page, 10);
  const title = useMemo(
    () => (Number.isFinite(pageNum) ? getPageTitle(pageNum) : null),
    [pageNum],
  );
  const pageType = Number.isFinite(pageNum) ? resolvePageType(pageNum) : 'unknown';
  const Content = resolveContent(pageNum, pageType);

  if (!title || !Content) {
    return <TeletextNotFound />;
  }

  return (
    <TeletextPage pageNum={pageNum} title={title}>
      <Content pageNum={pageNum} pageType={pageType} />
    </TeletextPage>
  );
}
