export default function OnboardingDivider({ children }) {
  return (
    <div className="flex w-full items-center gap-2">
      <div className="h-px flex-1 bg-white/20" aria-hidden />
      <span className="font-barlow text-xs font-medium leading-5 text-white/40 whitespace-nowrap">
        {children}
      </span>
      <div className="h-px flex-1 bg-white/20" aria-hidden />
    </div>
  );
}
