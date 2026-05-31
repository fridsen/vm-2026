import { useState } from 'react';
import { useAuth } from '../hooks/useAuth.js';

// AuthGate wraps the routed UI. It renders:
//   1. A sign-in card (Google OAuth + magic-link email) when nobody is signed in.
//   2. A "set display name" card right after the first sign-in (no profile yet).
//   3. The children otherwise.
export default function AuthGate({ children }) {
  const {
    user,
    profile,
    loading,
    signInWithEmail,
    signInWithGoogle,
    saveDisplayName,
  } = useAuth();
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [status, setStatus] = useState('idle');
  const [error, setError] = useState(null);

  if (loading) {
    return <div className="p-8 text-center text-neutral-500">Laddar…</div>;
  }

  if (!user) {
    return (
      <div className="mx-auto mt-12 max-w-sm space-y-4 p-6">
        <h1 className="font-display text-2xl tracking-wide">VM-tipset 2026</h1>
        <p className="text-sm text-neutral-600">
          Logga in med Google eller skriv in din e-post så skickar vi en magisk
          länk.
        </p>
        <button
          type="button"
          className="flex w-full items-center justify-center gap-2 rounded-md border border-neutral-300 bg-white p-3 text-neutral-900 disabled:opacity-50"
          disabled={status === 'google' || status === 'sending'}
          onClick={async () => {
            setStatus('google');
            setError(null);
            try {
              await signInWithGoogle();
            } catch (err) {
              setError(err.message);
              setStatus('idle');
            }
          }}
        >
          <svg aria-hidden="true" className="h-5 w-5" viewBox="0 0 24 24">
            <path
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              fill="#4285F4"
            />
            <path
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              fill="#34A853"
            />
            <path
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              fill="#FBBC05"
            />
            <path
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              fill="#EA4335"
            />
          </svg>
          {status === 'google' ? 'Omdirigerar…' : 'Fortsätt med Google'}
        </button>
        <div className="relative py-1">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-neutral-200" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-white px-2 text-neutral-500">eller</span>
          </div>
        </div>
        <form
          className="space-y-3"
          onSubmit={async (e) => {
            e.preventDefault();
            setStatus('sending');
            setError(null);
            try {
              await signInWithEmail(email);
              setStatus('sent');
            } catch (err) {
              setError(err.message);
              setStatus('idle');
            }
          }}
        >
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="namn@domain.se"
            className="w-full rounded-md border border-neutral-300 p-3"
          />
          <button
            className="w-full rounded-md bg-neutral-900 p-3 text-white disabled:opacity-50"
            disabled={status === 'sending' || !email}
          >
            {status === 'sending' ? 'Skickar…' : 'Skicka länk'}
          </button>
          {status === 'sent' ? (
            <div className="text-sm text-green-700">
              Kolla din inkorg. Klicka på länken så är du inloggad.
            </div>
          ) : null}
          {error ? <div className="text-sm text-red-700">{error}</div> : null}
        </form>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="mx-auto mt-12 max-w-sm space-y-4 p-6">
        <h1 className="font-display text-2xl tracking-wide">Välkommen!</h1>
        <p className="text-sm text-neutral-600">
          Vad ska du heta i ligan? Detta visas i leaderboarden.
        </p>
        <form
          className="space-y-3"
          onSubmit={async (e) => {
            e.preventDefault();
            setStatus('saving');
            setError(null);
            try {
              await saveDisplayName(name.trim());
            } catch (err) {
              setError(err.message);
              setStatus('idle');
            }
          }}
        >
          <input
            type="text"
            required
            minLength={2}
            maxLength={32}
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="T.ex. Jimmy"
            className="w-full rounded-md border border-neutral-300 p-3"
          />
          <button
            className="w-full rounded-md bg-neutral-900 p-3 text-white disabled:opacity-50"
            disabled={status === 'saving' || name.trim().length < 2}
          >
            {status === 'saving' ? 'Sparar…' : 'Spara'}
          </button>
          {error ? <div className="text-sm text-red-700">{error}</div> : null}
        </form>
      </div>
    );
  }

  return children;
}
