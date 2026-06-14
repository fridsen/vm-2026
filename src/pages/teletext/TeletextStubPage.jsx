import { TELETEXT_HOME_PAGE } from '../../teletext/constants.js';
import TeletextPageLink from '../../components/teletext/TeletextPageLink.jsx';

const STUB_COPY = {};

export default function TeletextStubPage({ pageType }) {
  return (
    <div className="teletext-stub">
      <p className="teletext-row teletext-row--cyan">
        {STUB_COPY[pageType] ?? 'Sidan är under utveckling.'}
      </p>
      <p className="teletext-row" style={{ marginTop: 18 }}>
        <TeletextPageLink page={TELETEXT_HOME_PAGE}>Tillbaka till {TELETEXT_HOME_PAGE}</TeletextPageLink>
      </p>
    </div>
  );
}
