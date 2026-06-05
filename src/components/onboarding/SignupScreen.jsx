import { useState } from 'react';
import { useAuth } from '../../hooks/useAuth.js';
import Field from './Field.jsx';
import OnboardingButton, { GoogleButton } from './OnboardingButton.jsx';
import OnboardingDivider from './OnboardingDivider.jsx';

export default function SignupScreen() {
  const { signUpWithPassword, signInWithGoogle } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [status, setStatus] = useState('idle'); // idle | submitting | google | sent
  const [error, setError] = useState(null);

  const submit = async (e) => {
    e.preventDefault();
    const parts = name.trim().split(/\s+/).filter(Boolean);
    if (parts.length < 2) {
      setError('Ange både förnamn och efternamn.');
      return;
    }
    const firstName = parts[0];
    const lastName = parts.slice(1).join(' ');
    setStatus('submitting');
    setError(null);
    try {
      const { hasSession } = await signUpWithPassword({
        email,
        password,
        firstName,
        lastName,
      });
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
      <div className="flex flex-col items-center justify-center gap-3 py-6 text-center">
        <h1 className="font-display text-[32px] leading-8 tracking-[-0.32px] text-lime">
          Kolla din mejl
        </h1>
        <p className="font-barlow text-base text-white/80">
          Vi har skickat en bekräftelselänk till {email}. Klicka på den för att
          aktivera ditt konto.
        </p>
      </div>
    );
  }

  const busy = status !== 'idle';

  return (
    <>
      <h1 className="text-center font-display text-[32px] leading-8 tracking-[-0.32px] text-lime">
        Skapa konto
      </h1>

      <form onSubmit={submit} className="flex flex-col gap-6">
        <div className="flex flex-col gap-6">
          <GoogleButton onClick={google} disabled={busy} />
          <OnboardingDivider>eller registrera dig med</OnboardingDivider>
          <div className="flex flex-col gap-4">
            <Field
              label="Förnamn och efternamn"
              required
              autoComplete="name"
              placeholder="Förnamn & efternamn"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
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
              minLength={6}
              autoComplete="new-password"
              placeholder="Lösenord"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
        </div>

        {error && <p className="font-barlow text-sm text-red-400">{error}</p>}

        <div className="flex flex-col items-center">
          <OnboardingButton type="submit" variant="primary" disabled={busy}>
            {status === 'submitting' ? 'Skapar konto…' : 'Gå med i VM-Tipset'}
          </OnboardingButton>
        </div>
      </form>
    </>
  );
}
