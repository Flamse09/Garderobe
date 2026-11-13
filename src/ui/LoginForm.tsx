import { useState } from 'preact/hooks';
import { signIn } from '../data/auth';

const MIN_PASSWORD = 6;

/** Same account as Mise and Spilscore. */
export function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [msg, setMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const ready = email.includes('@') && password.length >= MIN_PASSWORD;

  async function submit(e: Event) {
    e.preventDefault();
    if (!ready || busy) return;
    setBusy(true);
    setMsg(null);
    try {
      setMsg(await signIn(email, password));
    } catch (err) {
      setMsg(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <form class="card stack login" onSubmit={submit}>
      <h2>Garderobe</h2>
      <p class="muted" style="margin:0">Log ind med samme konto som i Mise.</p>
      <input type="email" name="email" autoComplete="username" placeholder="E-mail" value={email} onInput={(e) => setEmail(e.currentTarget.value)} />
      <input type="password" name="password" autoComplete="current-password" placeholder="Adgangskode" value={password} onInput={(e) => setPassword(e.currentTarget.value)} />
      <button type="submit" class="primary" disabled={busy || !ready}>Log ind</button>
      {msg && <p class="warn" style="margin:0">{msg}</p>}
    </form>
  );
}
