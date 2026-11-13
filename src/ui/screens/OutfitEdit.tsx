import { useState } from 'preact/hooks';
import { deleteOutfit, garmentImagePath, saveOutfit, useStore } from '../../data/store';
import { CATEGORY_NAMES } from '../../wardrobe/catalog';
import { Icon } from '../icons';
import { Img } from '../Img';
import { href, navigate } from '../router';

/** Builds a new outfit (no id) or edits one: tap garments to add or remove them. */
export function OutfitEdit({ id }: { id?: string }) {
  const { outfits, garments } = useStore();
  const existing = id ? outfits.find((o) => o.id === id) : undefined;
  const [name, setName] = useState(existing?.name ?? '');
  const [note, setNote] = useState(existing?.note ?? '');
  const [picked, setPicked] = useState<string[]>(existing?.garment_ids ?? []);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  if (id && !existing) return <p class="muted empty">Outfittet findes ikke.</p>;

  const available = garments.filter((g) => !g.archived || picked.includes(g.id));
  const byId = new Map(garments.map((g) => [g.id, g]));
  const toggle = (gid: string) => setPicked(picked.includes(gid) ? picked.filter((x) => x !== gid) : [...picked, gid]);

  async function save() {
    if (!name.trim()) return setErr('Giv outfittet et navn.');
    if (!picked.length) return setErr('Vælg mindst ét tøjstykke.');
    setBusy(true);
    setErr(null);
    try {
      await saveOutfit({ name: name.trim(), note: note.trim() || null, garment_ids: picked }, id);
      navigate({ name: 'outfits' }, true);
    } catch (e) {
      setErr((e as Error).message);
      setBusy(false);
    }
  }

  async function remove() {
    if (!id || !confirm(`Slet "${existing!.name}"? Tøjet bliver ikke slettet.`)) return;
    setBusy(true);
    try {
      await deleteOutfit(id);
      navigate({ name: 'outfits' }, true);
    } catch (e) {
      setErr((e as Error).message);
      setBusy(false);
    }
  }

  return (
    <div class="stack">
      <div class="row between back-row">
        <a href={href({ name: 'outfits' })} class="icon-btn" aria-label="Tilbage">
          <Icon name="back" />
        </a>
        <h3 style="margin:0">{id ? 'Ret outfit' : 'Nyt outfit'}</h3>
        <span style="width:44px" />
      </div>

      <div class="outfit-preview">
        {picked.length === 0 ? (
          <p class="muted small center">Tryk på tøj nedenfor for at sætte det sammen.</p>
        ) : (
          picked.map((gid) => {
            const g = byId.get(gid);
            return g ? (
              <button key={gid} class="preview-item" onClick={() => toggle(gid)} aria-label={`Fjern ${g.name}`}>
                <Img path={garmentImagePath(g)} url={g.image_url} alt={g.name} class="preview-img" />
                <span>{g.name}</span>
              </button>
            ) : null;
          })
        )}
      </div>

      <input placeholder="Navn, fx Kontor fredag" value={name} onInput={(e) => setName(e.currentTarget.value)} />
      <input placeholder="Note (valgfri)" value={note} onInput={(e) => setNote(e.currentTarget.value)} />

      {CATEGORY_NAMES.map((c) => {
        const list = available.filter((g) => g.category === c);
        if (!list.length) return null;
        return (
          <section key={c}>
            <h4>{c}</h4>
            <ul class="pick-grid">
              {list.map((g) => (
                <li key={g.id}>
                  <button class={`pick ${picked.includes(g.id) ? 'on' : ''}`} onClick={() => toggle(g.id)}>
                    <Img path={garmentImagePath(g)} url={g.image_url} alt={g.name} class="pick-img" />
                    {picked.includes(g.id) && (
                      <span class="pick-check">
                        <Icon name="check" size={16} />
                      </span>
                    )}
                    <span class="pick-name">{g.name}</span>
                  </button>
                </li>
              ))}
            </ul>
          </section>
        );
      })}

      {err && <p class="warn">{err}</p>}
      <button class="primary big" disabled={busy} onClick={save}>Gem outfit</button>
      {id && (
        <button class="danger" disabled={busy} onClick={remove}>Slet outfit</button>
      )}
    </div>
  );
}
