import { useState } from 'react';
import { useAuth } from '../../hooks/useAuth.js';
import Field from './Field.jsx';
import OnboardingButton from './OnboardingButton.jsx';

// Shown when a signed-in user has no profile yet or is missing first/last name
// (e.g. Google without family_name).
export default function CompleteProfileScreen() {
  const { user, profile, saveProfile } = useAuth();
  const meta = user?.user_metadata || {};
  const full = (meta.full_name || meta.name || '').trim();
  const [firstFromFull, ...restFromFull] = full ? full.split(/\s+/) : [''];
  const [firstName, setFirstName] = useState(
    profile?.first_name || meta.first_name || firstFromFull || '',
  );
  const [lastName, setLastName] = useState(
    profile?.last_name || meta.last_name || restFromFull.join(' ') || '',
  );
  const [status, setStatus] = useState('idle');
  const [error, setError] = useState(null);

  const submit = async (e) => {
    e.preventDefault();
    const first = firstName.trim();
    const last = lastName.trim();
    if (first.length < 2) {
      setError('Ange ditt förnamn.');
      return;
    }
    if (last.length < 2) {
      setError('Ange ditt efternamn.');
      return;
    }
    setStatus('saving');
    setError(null);
    try {
      await saveProfile({ firstName: first, lastName: last });
    } catch (err) {
      setError(err.message);
      setStatus('idle');
    }
  };

  const canSubmit = firstName.trim().length >= 2 && lastName.trim().length >= 2;

  return (
    <>
      <div className="flex flex-col items-center gap-1 text-center">
        <h1 className="font-display text-[32px] leading-[32px] tracking-[-0.32px] text-lime">
          Välkommen!
        </h1>
        <p className="font-barlow text-base text-white">Vad ska du heta i ligan?</p>
      </div>

      <form onSubmit={submit} className="flex flex-1 flex-col gap-4">
        <div className="flex gap-4">
          <Field
            label="Förnamn"
            required
            autoComplete="given-name"
            placeholder="Förnamn"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
          />
          <Field
            label="Efternamn"
            required
            autoComplete="family-name"
            placeholder="Efternamn"
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
          />
        </div>

        {error && <p className="font-barlow text-sm text-red-400">{error}</p>}

        <div className="mt-auto pt-2">
          <OnboardingButton
            type="submit"
            variant="primary"
            disabled={status === 'saving' || !canSubmit}
          >
            {status === 'saving' ? 'Sparar…' : 'Fortsätt'}
          </OnboardingButton>
        </div>
      </form>
    </>
  );
}
