import { useState } from 'preact/hooks';
import { garmentImagePath, useStore } from '../../data/store';
import { CATEGORY_NAMES } from '../../wardrobe/catalog';
import { searchGarments } from '../../wardrobe/search';
import { href } from '../router';
import { Img } from '../Img';

export function Wardrobe() {
  const { garments, inbox, loading } = useStore();
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState<string | null>(null);
  const [showArchived, setShowArchived] = useState(false);

  const active = garments.filter((g) => g.archived === showArchived);
  const shown = searchGarments(active, query, category);
  const counts = Object.fromEntries(CATEGORY_NAMES.map((c) => [c, active.filter((g) => g.category === c).length]));
  const archivedCount = garments.filter((g) => g.archived).length;

  return (
    <>
      <div class="page-head">
        <h2>{showArchived ? 'Arkiveret' : 'Tøj'}</h2>
        <p class="muted">{active.length} {active.length === 1 ? 'stykke' : 'stykker'}</p>
      </div>
      <input type="search" placeholder="Søg: mærke, farve, materiale ..." value={query} onInput={(e) => setQuery(e.currentTarget.value)} />
      <div class="scroll-row">
        <div class="chips">
          <button class={`chip ${category === null ? 'on' : ''}`} onClick={() => setCategory(null)}>Alt</button>
          {CATEGORY_NAMES.filter((c) => counts[c] > 0).map((c) => (
            <button key={c} class={`chip ${category === c ? 'on' : ''}`} onClick={() => setCategory(category === c ? null : c)}>
              {c} <span class="chip-n">{counts[c]}</span>
            </button>
          ))}
        </div>
      </div>

      {shown.length === 0 ? (
        <div class="empty muted">
          {garments.length === 0 && !loading ? (
            <>
              <p>Ingen tøj endnu.</p>
              <p class="small">
                Tag billeder af label og tøj under <a href={href({ name: 'inbox' })}>Indbakke</a>.{' '}
                {inbox.length > 0 && `${inbox.length} venter på at blive fundet.`}
              </p>
            </>
          ) : (
            <p>Intet matcher.</p>
          )}
        </div>
      ) : (
        <ul class="grid">
          {shown.map((g) => (
            <li key={g.id}>
              <a href={href({ name: 'garment', id: g.id })} class="tile">
                <Img path={garmentImagePath(g)} url={g.image_url} alt={g.name} class="tile-img" />
                {g.confidence !== 'sikker' && <span class="tile-flag" title="Skal tjekkes">!</span>}
                <span class="tile-name">{g.name}</span>
                <span class="tile-sub">{[g.brand, g.size].filter(Boolean).join(' · ') || g.type}</span>
              </a>
            </li>
          ))}
        </ul>
      )}

      {(archivedCount > 0 || showArchived) && (
        <button class="link archive-toggle" onClick={() => setShowArchived(!showArchived)}>
          {showArchived ? 'Tilbage til tøjet' : `Vis arkiveret (${archivedCount})`}
        </button>
      )}
    </>
  );
}
