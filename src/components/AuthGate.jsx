import { useState } from 'react';
import { useAuth } from '../hooks/useAuth.js';

// AuthGate wraps the routed UI. It renders:
//   1. A magic-link sign-in card when nobody is signed in.
//   2. A "set display name" card right after the first sign-in (no profile yet).
//   3. The children otherwise.
export default function AuthGate({ children }) {
  const { user, profile, loading, signInWithEmail, saveDisplayName } =
    useAuth();
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
          Skriv in din e-post så skickar vi en magisk länk för inloggning.
        </p>
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
