export default function LivePointsCard({ totalPoints, rows }) {
  return (
    <section className="live-points-card">
      <div className="live-points-total">
        <p className="live-points-heading">Totalpoäng</p>
        <p className="live-points-value">{totalPoints}</p>
      </div>
      <div className="live-points-breakdown">
        {rows.map((row, index) => (
          <div key={row.key} className="live-points-category">
            <div className="live-points-category-row">
              <div className="live-points-category-label">
                <span className={`live-points-dot ${row.dotClass}`} aria-hidden />
                <span>{row.label}</span>
              </div>
              <span className="live-points-category-value">{row.earned}</span>
            </div>
            {index < rows.length - 1 ? <div className="live-points-divider" aria-hidden /> : null}
          </div>
        ))}
      </div>
    </section>
  );
}
