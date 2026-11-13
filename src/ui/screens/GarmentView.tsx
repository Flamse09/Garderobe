import { useState } from 'preact/hooks';
import { updateGarment, useStore } from '../../data/store';
import { COLORS } from '../../wardrobe/catalog';
import type { Garment } from '../../wardrobe/types';
import { Icon } from '../icons';
import { Img } from '../Img';
import { href, navigate } from '../router';

const CONFIDENCE_TEXT: Record<Garment['confidence'], string> = {
  sikker: 'Produktet er fundet',
  sandsynlig: 'Sandsynligvis det rigtige produkt',
  usikker: 'Kun ud fra label og billede',
};

export function Swatch({ color }: { color: string }) {
  return <span class="swatch" style={{ background: COLORS[color] ?? 'transparent' }} />;
}

function money(n: number, currency: string | null) {
  return `${n.toLocaleString('da-DK')} ${currency === 'DKK' || !currency ? 'kr.' : currency}`;
}

export function GarmentView({ id }: { id: string }) {
  const { garments, outfits } = useStore();
  const g = garments.find((x) => x.id === id);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  if (!g) return <p class="muted empty">Tøjstykket findes ikke.</p>;

  const images = [g.image_path, ...g.photo_paths].filter((p): p is string => !!p);
  const inOutfits = outfits.filter((o) => o.garment_ids.includes(g.id));

  async function toggleArchive() {
    setBusy(true);
    setErr(null);
    try {
      await updateGarment(g!.id, { archived: !g!.archived });
      if (!g!.archived) navigate({ name: 'wardrobe' }, true);
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  const facts: [string, string | null][] = [
    ['Mærke', g.brand],
    ['Produkt', g.product_name],
    ['Varenummer', g.style_number],
    ['Type', `${g.category} · ${g.type}`],
    ['Størrelse', g.size],
    ['Pasform', g.fit],
    ['Farve', [g.color, g.color_name && `(${g.color_name})`].filter(Boolean).join(' ')],
    ['Mønster', g.pattern],
    ['Materiale', g.materials.map((m) => (m.percent ? `${m.percent} % ${m.fiber}` : m.fiber)).join(', ') || null],
    ['Varme', g.warmth],
    ['Sæson', g.seasons.join(', ') || null],
    ['Stil', g.formality],
    ['Nypris', g.retail_price !== null ? money(g.retail_price, g.currency) : null],
    ['Lavet i', g.made_in],
    ['Vask', g.care],
  ];

  return (
    <article class="garment">
      <div class="row between back-row">
        <a href={href({ name: 'wardrobe' })} class="icon-btn" aria-label="Tilbage">
          <Icon name="back" />
        </a>
        <a href={href({ name: 'garment-edit', id: g.id })} class="icon-btn" aria-label="Ret">
          <Icon name="edit" />
        </a>
      </div>

      <div class="gallery">
        {images.length ? images.map((p) => <Img key={p} path={p} alt={g.name} class="gallery-img" />) : <Img url={g.image_url} alt={g.name} class="gallery-img" />}
      </div>

      <h2 class="garment-title">
        <Swatch color={g.color} /> {g.name}
      </h2>
      {g.description && <p class="lead">{g.description}</p>}

      {(g.confidence !== 'sikker' || g.flags.length > 0) && (
        <div class="warn small">
          <div class="row">
            <Icon name="alert" size={18} /> <strong>{CONFIDENCE_TEXT[g.confidence]}</strong>
          </div>
          {g.flags.length > 0 && (
            <ul>
              {g.flags.map((f) => (
                <li key={f}>{f}</li>
              ))}
            </ul>
          )}
        </div>
      )}

      <dl class="facts">
        {facts
          .filter(([, v]) => v)
          .map(([k, v]) => (
            <div key={k}>
              <dt>{k}</dt>
              <dd>{v}</dd>
            </div>
          ))}
      </dl>

      {g.product_url && (
        <a class="button" href={g.product_url} target="_blank" rel="noopener noreferrer">
          <Icon name="link" size={18} /> Se produktet
        </a>
      )}

      {inOutfits.length > 0 && (
        <>
          <h4>Indgår i</h4>
          <div class="tags">
            {inOutfits.map((o) => (
              <a key={o.id} class="tag" href={href({ name: 'outfit', id: o.id })}>{o.name}</a>
            ))}
          </div>
        </>
      )}

      {g.user_note && (
        <div class="sticky-note">
          <h3>Din beskrivelse</h3>
          <p>{g.user_note}</p>
        </div>
      )}
      {g.label_text && (
        <details class="source">
          <summary>Tekst fra labelen</summary>
          <pre class="source">{g.label_text}</pre>
        </details>
      )}

      {err && <p class="warn">{err}</p>}
      <button class="danger" disabled={busy} onClick={toggleArchive}>
        {g.archived ? 'Hent tilbage fra arkivet' : 'Arkivér (har det ikke længere)'}
      </button>
    </article>
  );
}
