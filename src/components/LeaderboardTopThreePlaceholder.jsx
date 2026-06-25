import topThreeTrophyIcon from '../assets/leaderboard/top-three-trophy.svg';

export default function LeaderboardTopThreePlaceholder() {
  return (
    <section className="lb-top-three-placeholder" aria-label="Topp 3">
      <div className="lb-top-three-placeholder-icon">
        <img src={topThreeTrophyIcon} alt="" width={40} height={40} />
      </div>
      <div className="lb-top-three-placeholder-copy">
        <h2>Avgörs efter finalen</h2>
        <p>
          Alla har tippat vinnare, tvåa och trea. Poängen delas ut när VM är avgjort och då
          visas poängen här.
        </p>
      </div>
      <div className="lb-top-three-placeholder-podium" aria-hidden>
        <span className="lb-top-three-podium-step is-second" />
        <span className="lb-top-three-podium-step is-first" />
        <span className="lb-top-three-podium-step is-third" />
      </div>
    </section>
  );
}
