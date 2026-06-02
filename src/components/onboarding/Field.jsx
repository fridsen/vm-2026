import clsx from 'clsx';

// White pill text input matching the onboarding forms — placeholder-only (the
// label is exposed to assistive tech via aria-label).
export default function Field({ label, className, ...props }) {
  return (
    <input
      aria-label={label}
      className={clsx(
        'h-12 w-full rounded-full bg-white px-5 font-barlow text-base font-medium text-[#0C162A] outline-none placeholder:text-[#0C162A]/[0.54]',
        className,
      )}
      {...props}
    />
  );
}
