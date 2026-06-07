import clsx from 'clsx';
import { formatDistanceToNow } from 'date-fns';
import { sv } from 'date-fns/locale';

function stripHtml(text) {
  return text
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function ExternalIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
      <path
        d="M10 2h4v4M6.5 8.5 13 2M10 10h4v4H2V6h4"
        stroke="#60748D"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function NewsRow({ article }) {
  const when = formatDistanceToNow(new Date(article.publishedAt), {
    addSuffix: true,
    locale: sv,
  });

  return (
    <a
      href={article.url}
      target="_blank"
      rel="noopener noreferrer"
      className={clsx('home-news-row', !article.imageUrl && 'home-news-row--no-thumb')}
    >
      {article.imageUrl ? (
        <img src={article.imageUrl} alt="" className="home-news-thumb" loading="lazy" />
      ) : null}
      <div className="home-news-body">
        <div className="home-news-meta">
          <span>{article.source}</span>
          <span aria-hidden>·</span>
          <time dateTime={article.publishedAt}>{when}</time>
        </div>
        <h3>{article.title}</h3>
        {article.summary && <p>{stripHtml(article.summary)}</p>}
      </div>
      <ExternalIcon />
    </a>
  );
}

export default function NewsFeedCard({ articles, loading }) {
  return (
    <section className="home-card stagger-child" aria-busy={loading}>
      <div className="home-card-header">
        <div>
          <h2>VM-nyheter</h2>
          <p>Senaste från svenska sportmedier</p>
        </div>
      </div>

      <div className="home-news-list">
        {loading && articles.length === 0 && (
          <p className="home-news-empty">Hämtar nyheter…</p>
        )}
        {!loading && articles.length === 0 && (
          <p className="home-news-empty">
            Inga nyheter ännu. De synkas automatiskt var 30:e minut.
          </p>
        )}
        {articles.map((article) => (
          <NewsRow key={article.id} article={article} />
        ))}
      </div>
    </section>
  );
}
