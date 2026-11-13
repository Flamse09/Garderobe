import { signOut } from '../../data/auth';
import { useStore } from '../../data/store';

export function Settings() {
  const { user, garments, outfits } = useStore();
  const value = garments.filter((g) => !g.archived && g.retail_price !== null && (g.currency ?? 'DKK') === 'DKK').reduce((s, g) => s + g.retail_price!, 0);
  return (
    <>
      <div class="page-head">
        <h2>Konto</h2>
      </div>
      <div class="card stack">
        <div>
          Logget ind som <strong>{user?.email}</strong>.
        </div>
        <div class="muted small">
          {garments.filter((g) => !g.archived).length} stykker tøj · {outfits.length} outfits
          {value > 0 && ` · nypris i alt ${value.toLocaleString('da-DK')} kr.`}
        </div>
        <button onClick={() => signOut()}>Log ud</button>
      </div>
    </>
  );
}
