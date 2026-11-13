import { useEffect, useState } from 'preact/hooks';
import { addInboxItem, deleteInboxItem, useStore } from '../../data/store';
import type { InboxItem } from '../../wardrobe/types';
import { Icon } from '../icons';
import { Img } from '../Img';

function Previews({ files, onRemove }: { files: File[]; onRemove: (i: number) => void }) {
  const [urls, setUrls] = useState<string[]>([]);
  useEffect(() => {
    const u = files.map((f) => URL.createObjectURL(f));
    setUrls(u);
    return () => u.forEach((x) => URL.revokeObjectURL(x));
  }, [files]);
  return (
    <div class="thumbs">
      {urls.map((u, i) => (
        <div key={u} class="thumb">
          <img src={u} alt="" />
          <button type="button" class="thumb-x" aria-label="Fjern billede" onClick={() => onRemove(i)}>
            <Icon name="x" size={14} />
          </button>
        </div>
      ))}
    </div>
  );
}

function Waiting({ item }: { item: InboxItem }) {
  const [busy, setBusy] = useState(false);
  async function remove() {
    if (!confirm('Fjern dette emne fra indbakken? Billederne slettes.')) return;
    setBusy(true);
    try {
      await deleteInboxItem(item);
    } catch (e) {
      alert((e as Error).message);
      setBusy(false);
    }
  }
  return (
    <li class="waiting">
      <div class="waiting-imgs">
        {item.photo_paths.slice(0, 4).map((p) => (
          <Img key={p} path={p} alt="Foto" class="waiting-img" />
        ))}
      </div>
      <div class="waiting-meta">
        <span>{item.note || <span class="muted">Ingen beskrivelse</span>}</span>
        <span class="sub">
          {item.photo_paths.length} {item.photo_paths.length === 1 ? 'billede' : 'billeder'} · {new Date(item.created_at).toLocaleDateString('da-DK', { day: 'numeric', month: 'short' })}
        </span>
      </div>
      <button class="icon-btn" disabled={busy} aria-label="Fjern" onClick={remove}>
        <Icon name="x" size={18} />
      </button>
    </li>
  );
}

/** One upload = one garment: label photos, garment photos and a short note. */
export function Inbox() {
  const { inbox } = useStore();
  const [files, setFiles] = useState<File[]>([]);
  const [note, setNote] = useState('');
  const [progress, setProgress] = useState<number | null>(null);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  async function submit(e: Event) {
    e.preventDefault();
    if (!files.length || progress !== null) return;
    setMsg(null);
    setProgress(0);
    try {
      await addInboxItem(files, note, setProgress);
      setFiles([]);
      setNote('');
      setMsg({ ok: true, text: 'Lagt i indbakken. Bed Codex eller Claude om at finde det.' });
    } catch (err) {
      setMsg({ ok: false, text: (err as Error).message });
    } finally {
      setProgress(null);
    }
  }

  return (
    <>
      <div class="page-head">
        <h2>Indbakke</h2>
        <p class="muted">Ét tøjstykke ad gangen: billede af labelen, billede af tøjet og et par ord.</p>
      </div>

      <form class="card stack" onSubmit={submit}>
        {files.length > 0 && <Previews files={files} onRemove={(i) => setFiles(files.filter((_, j) => j !== i))} />}
        <label class="button file-btn">
          <Icon name="camera" size={20} />
          {files.length ? 'Tilføj flere billeder' : 'Tag eller vælg billeder'}
          <input
            type="file"
            accept="image/*"
            multiple
            onChange={(e) => {
              const picked = Array.from(e.currentTarget.files ?? []);
              setFiles([...files, ...picked]);
              e.currentTarget.value = '';
            }}
          />
        </label>
        <textarea rows={2} placeholder="Kort beskrivelse, fx 'mørkeblå uldfrakke, købt hos Wood Wood 2023'" value={note} onInput={(e) => setNote(e.currentTarget.value)} />
        <button type="submit" class="primary" disabled={!files.length || progress !== null}>
          {progress !== null ? `Uploader ${progress}/${files.length} ...` : 'Læg i indbakken'}
        </button>
        {msg && <p class={msg.ok ? 'ok' : 'warn'} style="margin:0">{msg.text}</p>}
      </form>

      {inbox.length > 0 && (
        <>
          <h4>Venter ({inbox.length})</h4>
          <ul class="waiting-list">
            {inbox.map((i) => (
              <Waiting key={i.id} item={i} />
            ))}
          </ul>
        </>
      )}
    </>
  );
}
