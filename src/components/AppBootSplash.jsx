// Neutral boot screen while auth session restores — matches page bg so pull-to-refresh
// does not flash the lime onboarding/login scene for signed-in users.
export default function AppBootSplash() {
  return (
    <div
      className="fixed inset-0 z-50 flex min-h-dvh items-center justify-center"
      aria-busy="true"
      aria-label="Laddar"
    >
      <p className="font-barlow text-base font-semibold text-ink">Laddar…</p>
    </div>
  );
}
