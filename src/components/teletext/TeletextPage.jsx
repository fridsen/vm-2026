import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import clsx from 'clsx';
import { useAuth } from '../../hooks/useAuth.js';
import { teletextDisplayName } from '../../utils/teletextDisplay.js';
import {
  LEADERBOARD_PAGE,
  TELETEXT_LIVE_SCORES_PAGE,
  TELETEXT_MATCHER_INDEX,
  TELETEXT_SECTION_NAV,
  TELETEXT_TIPS_GROUP_START,
  TELETEXT_TIPS_MATCH_START,
  leaderboardPageLabel,
} from '../../teletext/constants.js';
import {
  getFooterVariant,
  getNextPage,
  getPrevPage,
} from '../../teletext/pageRegistry.js';
import ThemeToggle from './ThemeToggle.jsx';
import TeletextPageLink from './TeletextPageLink.jsx';

function NavArrow({ direction, disabled, onClick }) {
  return (
    <button
      type="button"
      className="teletext-nav-btn"
      disabled={disabled}
      onClick={onClick}
      aria-label={direction === 'prev' ? 'Föregående sida' : 'Nästa sida'}
    >
      <svg viewBox="0 0 16 16" aria-hidden>
        {direction === 'prev' ? (
          <path d="M10 3 5 8l5 5" fill="none" stroke="currentColor" strokeWidth="2" />
        ) : (
          <path d="M6 3l5 5-5 5" fill="none" stroke="currentColor" strokeWidth="2" />
        )}
      </svg>
    </button>
  );
}

function FooterSep() {
  return (
    <span className="teletext-footer-sep" aria-hidden>
      *
    </span>
  );
}

function SectionLinksFooter() {
  return (
    <>
      <TeletextPageLink page={TELETEXT_MATCHER_INDEX}>Matcher {TELETEXT_MATCHER_INDEX}</TeletextPageLink>
      <FooterSep />
      {LEADERBOARD_PAGE != null ? (
        <TeletextPageLink page={LEADERBOARD_PAGE}>
          Ledare {leaderboardPageLabel()}
        </TeletextPageLink>
      ) : (
        <>Ledare {leaderboardPageLabel()}</>
      )}
      <FooterSep />
      <TeletextPageLink page={TELETEXT_LIVE_SCORES_PAGE}>
        Mål {TELETEXT_LIVE_SCORES_PAGE}
      </TeletextPageLink>
    </>
  );
}

function TipsNavFooter() {
  return (
    <>
      <TeletextPageLink page={TELETEXT_MATCHER_INDEX}>Matcher {TELETEXT_MATCHER_INDEX}</TeletextPageLink>
      <FooterSep />
      <TeletextPageLink page={TELETEXT_TIPS_GROUP_START}>Grupp {TELETEXT_TIPS_GROUP_START}</TeletextPageLink>
      <FooterSep />
      {LEADERBOARD_PAGE != null ? (
        <TeletextPageLink page={LEADERBOARD_PAGE}>Ledare {leaderboardPageLabel()}</TeletextPageLink>
      ) : (
        <>Ledare {leaderboardPageLabel()}</>
      )}
    </>
  );
}

function TeletextFooter({ pageNum }) {
  const variant = getFooterVariant(pageNum);
  if (variant === 'none') return null;

  let content = null;
  if (variant === 'section-links') content = <SectionLinksFooter />;
  else if (variant === 'tips-nav') content = <TipsNavFooter />;
  else if (variant === 'continuation') content = 'Fortsättning följer >>>';

  return <div className="teletext-footer-bar">{content}</div>;
}

function TeletextSectionMenu({ pageNum, onClose }) {
  return (
    <div className="teletext-nav-menu-wrap">
      <ul className="teletext-nav-menu" role="menu" aria-label="Hoppa till sektion">
        {TELETEXT_SECTION_NAV.map(({ page, label }) => (
          <li key={page} role="none">
            <TeletextPageLink
              page={page}
              className="teletext-nav-menu-link"
              variant={page === pageNum ? 'yellow' : 'cyan'}
              onClick={onClose}
            >
              {page} {label}
            </TeletextPageLink>
          </li>
        ))}
      </ul>
    </div>
  );
}

function TeletextNavPage({ pageNum, menuOpen, onToggle }) {
  return (
    <div className="teletext-nav-page">
      <button
        type="button"
        className={clsx('teletext-nav-page-btn', menuOpen && 'is-selected')}
        aria-expanded={menuOpen}
        aria-haspopup="menu"
        aria-label={`Sidnummer ${pageNum}, visa sektionsmeny`}
        onClick={onToggle}
      >
        {pageNum}
      </button>
    </div>
  );
}

export default function TeletextPage({ pageNum, title, children }) {
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const displayName = teletextDisplayName(profile, user);
  const prev = getPrevPage(pageNum);
  const next = getNextPage(pageNum);
  const [menuOpen, setMenuOpen] = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => {
    setMenuOpen(false);
  }, [pageNum]);

  useEffect(() => {
    if (!menuOpen) return undefined;

    function closeMenu() {
      setMenuOpen(false);
    }

    function onKeyDown(event) {
      if (event.key === 'Escape') closeMenu();
    }

    function onPointerDown(event) {
      if (!bottomRef.current?.contains(event.target)) closeMenu();
    }

    document.addEventListener('keydown', onKeyDown);
    document.addEventListener('pointerdown', onPointerDown);
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.removeEventListener('pointerdown', onPointerDown);
    };
  }, [menuOpen]);

  return (
    <div className="teletext-screen">
      <div className="teletext-top">
        <div className="teletext-top-left">
          <span className="teletext-page-num">{pageNum}</span>
          <span className="teletext-user">{displayName}</span>
        </div>
        <ThemeToggle className="teletext-byt" />
      </div>

      <div className="teletext-title-bar">{title}</div>

      <div className="teletext-content">{children}</div>

      <div className="teletext-bottom-chrome" ref={bottomRef}>
        {menuOpen ? (
          <TeletextSectionMenu pageNum={pageNum} onClose={() => setMenuOpen(false)} />
        ) : null}
        <TeletextFooter pageNum={pageNum} />
        <div className="teletext-nav">
          <NavArrow direction="prev" disabled={!prev} onClick={() => prev && navigate(`/t/${prev}`)} />
          <TeletextNavPage
            pageNum={pageNum}
            menuOpen={menuOpen}
            onToggle={() => setMenuOpen((open) => !open)}
          />
          <NavArrow direction="next" disabled={!next} onClick={() => next && navigate(`/t/${next}`)} />
        </div>
      </div>
    </div>
  );
}
