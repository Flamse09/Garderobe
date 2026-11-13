import { useState } from 'preact/hooks';
import { updateGarment, useStore } from '../../data/store';
import { CATEGORIES, CATEGORY_NAMES, COLOR_NAMES, FITS, FORMALITIES, PATTERNS, SEASONS, WARMTHS, type Category } from '../../wardrobe/catalog';
import type { Garment } from '../../wardrobe/types';
import { Icon } from '../icons';
import { href, navigate } from '../router';

type Form = Pick<
  Garment,
  'name' | 'brand' | 'product_name' | 'size' | 'category' | 'type' | 'color' | 'color_name' | 'pattern' | 'fit' | 'warmth' | 'formality' | 'seasons' | 'description' | 'product_url'
>;

function Select({ label, value, options, onChange, empty = true }: { label: string; value: string | null; options: readonly string[]; onChange: (v: string | null) => void; empty?: boolean }) {
  return (
    <label>
      {label}
      <select value={value ?? ''} onChange={(e) => onChange(e.currentTarget.value || null)}>
        {empty && <option value="">–</option>}
        {options.map((o) => (
          <option key={o} value={o}>{o}</option>
        ))}
      </select>
    </label>
  );
}

export function GarmentEdit({ id }: { id: string }) {
  const g = useStore().garments.find((x) => x.id === id);
  const [f, setF] = useState<Form | null>(g ? { ...g } : null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  if (!g || !f) return <p class="muted empty">Tøjstykket findes ikke.</p>;

  const patch = (p: Partial<Form>) => setF({ ...f, ...p });
  const text = (k: keyof Form) => ({ value: (f[k] as string | null) ?? '', onInput: (e: { currentTarget: HTMLInputElement | HTMLTextAreaElement }) => patch({ [k]: e.currentTarget.value.trim() ? e.currentTarget.value : null }) });
  const types = CATEGORIES[f.category as Category] ?? ['Andet'];

  async function save(e: Event) {
    e.preventDefault();
    if (!f!.name?.trim()) return setErr('Giv tøjstykket et navn.');
    setBusy(true);
    setErr(null);
    try {
      await updateGarment(id, { ...f!, name: f!.name.trim() });
      navigate({ name: 'garment', id }, true);
    } catch (e2) {
      setErr((e2 as Error).message);
      setBusy(false);
    }
  }

  return (
    <form class="stack" onSubmit={save}>
      <div class="row between back-row">
        <a href={href({ name: 'garment', id })} class="icon-btn" aria-label="Annuller">
          <Icon name="x" />
        </a>
        <h3 style="margin:0">Ret tøjstykke</h3>
        <span style="width:44px" />
      </div>
      <label>
        Navn
        <input value={f.name} onInput={(e) => patch({ name: e.currentTarget.value })} />
      </label>
      <div class="grid2">
        <label>
          Mærke
          <input {...text('brand')} />
        </label>
        <label>
          Størrelse
          <input {...text('size')} />
        </label>
      </div>
      <label>
        Produktnavn
        <input {...text('product_name')} />
      </label>
      <div class="grid2">
        <Select label="Kategori" value={f.category} options={CATEGORY_NAMES} empty={false} onChange={(v) => patch({ category: v!, type: CATEGORIES[v as Category].includes(f.type as never) ? f.type : 'Andet' })} />
        <Select label="Type" value={f.type} options={types} empty={false} onChange={(v) => patch({ type: v! })} />
      </div>
      <div class="grid2">
        <Select label="Farve" value={f.color} options={COLOR_NAMES} empty={false} onChange={(v) => patch({ color: v! })} />
        <label>
          Farvenavn
          <input {...text('color_name')} />
        </label>
      </div>
      <div class="grid2">
        <Select label="Mønster" value={f.pattern} options={PATTERNS} onChange={(v) => patch({ pattern: v })} />
        <Select label="Pasform" value={f.fit} options={FITS} onChange={(v) => patch({ fit: v })} />
      </div>
      <div class="grid2">
        <Select label="Varme" value={f.warmth} options={WARMTHS} onChange={(v) => patch({ warmth: v })} />
        <Select label="Stil" value={f.formality} options={FORMALITIES} onChange={(v) => patch({ formality: v })} />
      </div>
      <div>
        <label>Sæson</label>
        <div class="chips-wrap">
          {SEASONS.map((s) => {
            const on = f.seasons.includes(s);
            return (
              <button type="button" key={s} class={`chip ${on ? 'on' : ''}`} onClick={() => patch({ seasons: on ? f.seasons.filter((x) => x !== s) : [...f.seasons, s] })}>
                {s}
              </button>
            );
          })}
        </div>
      </div>
      <label>
        Beskrivelse
        <textarea rows={3} {...text('description')} />
      </label>
      <label>
        Link til produktet
        <input type="url" {...text('product_url')} />
      </label>
      {err && <p class="warn">{err}</p>}
      <button type="submit" class="primary big" disabled={busy}>Gem</button>
    </form>
  );
}
