import { useState } from 'react';
import { useAuth } from '../../hooks/useAuth.js';
import Field from './Field.jsx';
import OnboardingButton, { GoogleButton } from './OnboardingButton.jsx';
import OnboardingDivider from './OnboardingDivider.jsx';

const LOGIN_TIMEOUT_MS = 15_000;
const LOGIN_TIMEOUT_MESSAGE =
  'Inloggningen svarar inte. Stäng fliken och försök igen. Om problemet kvarstår: Safari → Inställningar → Avancerat → Webbsitedata → sök vm-2026-seven.vercel.app → ta bort.';

function withTimeout(promise, ms, message) {
  return Promise.race([
    promise,
    new Promise((_, reject) => {
      setTimeout(() => reject(new Error(message)), ms);
    }),
  ]);
}

export default function LoginScreen() {
  const { signInWithPassword, signInWithGoogle, sendPasswordReset } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [status, setStatus] = useState('idle'); // idle | submitting | google | reset-sent
  const [error, setError] = useState(null);

  const submit = async (e) => {
    e.preventDefault();
    setStatus('submitting');
    setError(null);
    try {
      await withTimeout(
        signInWithPassword(email, password),
        LOGIN_TIMEOUT_MS,
        LOGIN_TIMEOUT_MESSAGE,
      );
    } catch (err) {
      setError(err.message);
      setStatus('idle');
    }
  };

  const google = async () => {
    setStatus('google');
    setError(null);
    try {
      await signInWithGoogle();
    } catch (err) {
      setError(err.message);
      setStatus('idle');
    }
  };

  const reset = async () => {
    if (!email) {
      setError('Skriv in din email först, så skickar vi en återställningslänk.');
      return;
    }
    setError(null);
    try {
      await sendPasswordReset(email);
      setStatus('reset-sent');
    } catch (err) {
      setError(err.message);
    }
  };

  const busy = status === 'submitting' || status === 'google';

  return (
    <>
      <h1 className="text-center font-display text-[32px] leading-8 tracking-[-0.32px] text-lime">
        Logga in
      </h1>

      <form onSubmit={submit} className="flex flex-col gap-6">
        <div className="flex flex-col gap-6">
          <GoogleButton onClick={google} disabled={busy} />
          <OnboardingDivider>eller logga in med</OnboardingDivider>
          <div className="flex flex-col gap-4">
            <Field
              label="Emailadress"
              type="email"
              required
              autoComplete="email"
              placeholder="Emailadress"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <Field
              label="Lösenord"
              type="password"
              required
              autoComplete="current-password"
              placeholder="Lösenord"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
        </div>

        {status === 'reset-sent' && (
          <p className="font-barlow text-sm text-lime">
            Återställningslänk skickad till {email}.
          </p>
        )}
        {error && <p className="font-barlow text-sm text-red-400">{error}</p>}

        <div className="flex flex-col items-center gap-4">
          <OnboardingButton type="submit" variant="primary" disabled={busy}>
            {status === 'submitting' ? 'Loggar in…' : 'Logga in'}
          </OnboardingButton>
          <button
            type="button"
            onClick={reset}
            className="font-barlow text-sm font-medium tracking-[-0.14px] text-lime"
          >
            Glömt lösenord?
          </button>
        </div>
      </form>
    </>
  );
}
