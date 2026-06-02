import clsx from 'clsx';

// White text input with a faint Barlow label, matching the onboarding forms.
export default function Field({ label, className, ...props }) {
  return (
    <label className={clsx('flex w-full flex-col gap-2', className)}>
      <span className="font-barlow text-xs font-medium text-white/40">{label}</span>
      <input
        className="h-11 w-full rounded-[10px] bg-white px-4 font-barlow text-base text-black outline-none placeholder:text-black/40"
        {...props}
      />
    </label>
  );
}
