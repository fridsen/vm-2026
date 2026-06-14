import { Link } from 'react-router-dom';
import clsx from 'clsx';

export default function TeletextPageLink({
  page,
  children,
  className,
  variant = 'cyan',
  external = false,
  href,
  onClick,
}) {
  if (external && href) {
    return (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className={clsx('teletext-link teletext-link--external', className)}
        onClick={onClick}
      >
        {children}
      </a>
    );
  }

  if (page == null) {
    return <span className={className}>{children}</span>;
  }

  return (
    <Link
      to={`/t/${page}`}
      className={clsx(
        'teletext-link',
        variant === 'yellow' && 'teletext-link--yellow',
        className,
      )}
      onClick={onClick}
    >
      {children}
    </Link>
  );
}

export function TeletextSeparator({ page, children }) {
  return (
    <div className="teletext-separator">
      <div className="teletext-separator-blocks" aria-hidden>
        {Array.from({ length: 16 }, (_, i) => (
          <span key={i} className="teletext-separator-block" />
        ))}
      </div>
      {page != null ? (
        <TeletextPageLink page={page} variant="yellow">
          {children}
        </TeletextPageLink>
      ) : (
        <span className="teletext-row teletext-row--yellow">{children}</span>
      )}
      <div className="teletext-separator-blocks" aria-hidden>
        {Array.from({ length: 16 }, (_, i) => (
          <span key={i} className="teletext-separator-block" />
        ))}
      </div>
    </div>
  );
}
