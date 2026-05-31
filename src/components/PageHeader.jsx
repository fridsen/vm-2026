export default function PageHeader({ title, subtitle, right }) {
  return (
    <header className="flex items-start justify-between gap-3 pb-1">
      <div className="min-w-0">
        <h1 className="page-title">{title}</h1>
        {subtitle && <p className="page-subtitle">{subtitle}</p>}
      </div>
      {right && <div className="shrink-0">{right}</div>}
    </header>
  );
}
