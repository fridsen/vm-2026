import logoUrl from '../../assets/wc2026-logo.png';

// FIFA World Cup 2026 logo (black "26" + gold trophy). Transparent PNG, so it
// reads on both the lime and black onboarding backgrounds.
export default function Logo({ className = 'h-[80px]' }) {
  return (
    <img
      src={logoUrl}
      alt="FIFA World Cup 2026"
      className={`${className} w-auto object-contain`}
      draggable="false"
    />
  );
}
