import { useState } from 'react';
import { useAuth } from '../../hooks/useAuth.js';
import Field from './Field.jsx';
import OnboardingButton from './OnboardingButton.jsx';

// Fallback shown when a signed-in user has no profile yet and we couldn't
// derive a name automatically (e.g. a Google account without a name claim).
export default function CompleteProfileScreen() {
  const { user, saveProfile } = useAuth();
  const meta = user?.user_metadata || {};
  const full = (meta.full_name || meta.name || '').trim();
  const [first, ...rest] = full ? full.split(/\s+/) : [''];
  const [firstName, setFirstName] = useState(meta.first_name || first || '');
  const [lastName, setLastName] = useState(meta.last_name || rest.join(' ') || '');
  const [status, setStatus] = useState('idle');
  const [error, setError] = useState(null);

  const submit = async (e) => {
    e.preventDefault();
    setStatus('saving');
    setError(null);
    try {
      await saveProfile({ firstName: firstName.trim(), lastName: lastName.trim() });
    } catch (err) {
      setError(err.message);
      setStatus('idle');
    }
  };

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
            placeholder="Namn"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
          />
          <Field
            label="Efternamn"
            placeholder="Namnsson"
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
          />
        </div>

        {error && <p className="font-barlow text-sm text-red-400">{error}</p>}

        <div className="mt-auto pt-2">
          <OnboardingButton
            type="submit"
            variant="primary"
            disabled={status === 'saving' || firstName.trim().length < 2}
          >
            {status === 'saving' ? 'Sparar…' : 'Fortsätt'}
          </OnboardingButton>
        </div>
      </form>
    </>
  );
}
