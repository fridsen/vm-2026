import { useState } from 'react';
import { useAuth } from '../../hooks/useAuth.js';
import { OnboardingCard } from './OnboardingShell.jsx';
import Field from './Field.jsx';
import OnboardingButton, { GoogleButton } from './OnboardingButton.jsx';

export default function SignupScreen({ onGoToLogin }) {
  const { signUpWithPassword, signInWithGoogle } = useAuth();
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [status, setStatus] = useState('idle'); // idle | submitting | google | sent
  const [error, setError] = useState(null);

  const submit = async (e) => {
    e.preventDefault();
    setStatus('submitting');
    setError(null);
    try {
      const { hasSession } = await signUpWithPassword({
        email,
        password,
        firstName: firstName.trim(),
        lastName: lastName.trim(),
      });
      // With a session, AuthProvider picks up the user and AuthGate advances.
      // Without one, Supabase requires email confirmation first.
      if (!hasSession) setStatus('sent');
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

  if (status === 'sent') {
    return (
      <OnboardingCard>
        <div className="flex flex-1 flex-col items-center justify-center gap-3 text-center">
          <h1 className="font-display text-[32px] leading-[32px] tracking-[-0.32px] text-lime">
            Kolla din mejl
          </h1>
          <p className="font-barlow text-base text-white/80">
            Vi har skickat en bekräftelselänk till {email}. Klicka på den för att
            aktivera ditt konto.
          </p>
        </div>
      </OnboardingCard>
    );
  }

  const busy = status !== 'idle';

  return (
    <OnboardingCard>
      <div className="flex flex-col items-center gap-1 text-center">
        <h1 className="font-display text-[32px] leading-[32px] tracking-[-0.32px] text-lime">
          Skapa nytt konto
        </h1>
        <p className="font-barlow text-base text-white">Kom igång att tippa!</p>
      </div>

      <form onSubmit={submit} className="flex flex-col gap-6">
        <GoogleButton onClick={google} disabled={busy} />

        <div className="h-px w-full bg-lime/30" />

        <div className="flex flex-col gap-4">
          <div className="flex gap-4">
            <Field
              label="Förnamn"
              required
              autoComplete="given-name"
              placeholder="Namn"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
            />
            <Field
              label="Efternamn"
              required
              autoComplete="family-name"
              placeholder="Namnsson"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
            />
          </div>
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
            minLength={6}
            autoComplete="new-password"
            placeholder="Välj lösenord"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>

        {error && <p className="font-barlow text-sm text-red-400">{error}</p>}

        <div className="mt-auto flex flex-col items-center gap-4 pt-2">
          <OnboardingButton type="submit" variant="primary" disabled={busy}>
            {status === 'submitting' ? 'Skapar konto…' : 'Gå med i VM-Tipset'}
          </OnboardingButton>
          <button
            type="button"
            onClick={onGoToLogin}
            className="font-barlow text-sm font-medium tracking-[-0.14px] text-lime"
          >
            Jag har redan ett konto
          </button>
        </div>
      </form>
    </OnboardingCard>
  );
}
