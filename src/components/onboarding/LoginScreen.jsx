import { useState } from 'react';
import { useAuth } from '../../hooks/useAuth.js';
import Field from './Field.jsx';
import OnboardingButton, { GoogleButton } from './OnboardingButton.jsx';

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
      await signInWithPassword(email, password);
      // AuthProvider picks up the session and AuthGate advances.
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
      <div className="flex flex-col items-center gap-1 text-center">
        <h1 className="font-display text-[32px] leading-[32px] tracking-[-0.32px] text-lime">
          Logga in
        </h1>
        <p className="font-barlow text-base text-white">Kom igång att tippa!</p>
      </div>

      <form onSubmit={submit} className="flex flex-col gap-6">
        <GoogleButton onClick={google} disabled={busy} />

        <div className="flex w-full items-center gap-2">
          <div className="h-px flex-1 bg-white/20" />
          <span className="font-barlow text-xs font-medium text-white/40">
            eller logga in med
          </span>
          <div className="h-px flex-1 bg-white/20" />
        </div>

        <div className="flex flex-col gap-4">
          <Field
            label="Email"
            type="email"
            required
            autoComplete="email"
            placeholder="Din email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <Field
            label="Lösenord"
            type="password"
            required
            autoComplete="current-password"
            placeholder="Ditt lösenord"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>

        {status === 'reset-sent' && (
          <p className="font-barlow text-sm text-lime">
            Återställningslänk skickad till {email}.
          </p>
        )}
        {error && <p className="font-barlow text-sm text-red-400">{error}</p>}

        <div className="mt-auto flex flex-col items-center gap-4 pt-2">
          <OnboardingButton type="submit" variant="primary" disabled={busy}>
            {status === 'submitting' ? 'Loggar in…' : 'Logga in'}
          </OnboardingButton>
          <button
            type="button"
            onClick={reset}
            className="font-barlow text-sm font-medium tracking-[-0.14px] text-lime"
          >
            Glömt lösenord
          </button>
        </div>
      </form>
    </>
  );
}
