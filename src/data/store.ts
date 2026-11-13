import { useEffect, useState } from 'preact/hooks';
import type { Garment, GarmentInput, InboxItem, Outfit } from '../wardrobe/types';
import { supabase } from './supabase';

export const BUCKET = 'garderobe';

interface State {
  user: { id: string; email: string } | null;
  authReady: boolean;
  garments: Garment[];
  outfits: Outfit[];
  inbox: InboxItem[]; // only the ones still waiting
  loading: boolean;
  error: string | null;
}

const CACHE_KEY = 'garderobe.cache.v1';

function readCache(): Pick<State, 'garments' | 'outfits' | 'inbox'> {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (raw) return { garments: [], outfits: [], inbox: [], ...JSON.parse(raw) };
  } catch {
    // ignore
  }
  return { garments: [], outfits: [], inbox: [] };
}

function writeCache() {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify({ garments: state.garments, outfits: state.outfits, inbox: state.inbox }));
  } catch {
    // ignore
  }
}

let state: State = { user: null, authReady: false, loading: false, error: null, ...readCache() };
const listeners = new Set<() => void>();

function set(patch: Partial<State>) {
  state = { ...state, ...patch };
  if ('garments' in patch || 'outfits' in patch || 'inbox' in patch) writeCache();
  listeners.forEach((l) => l());
}

export function useStore(): State {
  const [, setSnap] = useState(state);
  useEffect(() => {
    const l = () => setSnap(state);
    listeners.add(l);
    l();
    return () => void listeners.delete(l);
  }, []);
  return state;
}

type OutfitRow = Omit<Outfit, 'garment_ids'> & { wardrobe_outfit_items: { garment_id: string; position: number }[] };

function toOutfit(row: OutfitRow): Outfit {
  const { wardrobe_outfit_items: items, ...rest } = row;
  return { ...rest, garment_ids: [...items].sort((a, b) => a.position - b.position).map((i) => i.garment_id) };
}

async function load() {
  set({ loading: true, error: null });
  const [g, o, i] = await Promise.all([
    supabase.from('wardrobe_garments').select('*').order('created_at', { ascending: false }),
    supabase.from('wardrobe_outfits').select('*, wardrobe_outfit_items(garment_id, position)').order('created_at', { ascending: false }),
    supabase.from('wardrobe_inbox').select('*').eq('status', 'ny').order('created_at', { ascending: false }),
  ]);
  const err = g.error ?? o.error ?? i.error;
  if (err) {
    const missing = /does not exist|schema cache/.test(err.message);
    return set({ loading: false, error: missing ? 'Databasen er ikke sat op endnu. Kør supabase/migrations/001_wardrobe.sql i Supabase.' : err.message });
  }
  set({
    garments: g.data as Garment[],
    outfits: (o.data as OutfitRow[]).map(toOutfit),
    inbox: i.data as InboxItem[],
    loading: false,
  });
}

let inFlight: Promise<void> | null = null;
export function refresh(): Promise<void> {
  if (!state.user) return Promise.resolve();
  inFlight ??= load().finally(() => (inFlight = null));
  return inFlight;
}

let updateHandler: () => Promise<unknown> = refresh;
export const setUpdateHandler = (h: () => Promise<unknown>) => (updateHandler = h);
export const runUpdate = () => updateHandler();

export function startStore() {
  supabase.auth.onAuthStateChange((event, session) => {
    const user = session ? { id: session.user.id, email: session.user.email ?? '' } : null;
    const changed = user?.id !== state.user?.id;
    set({ user, authReady: true });
    if (!user) {
      if (event === 'SIGNED_OUT') set({ garments: [], outfits: [], inbox: [] });
    } else if (changed) {
      // Defer: calling Supabase inside this callback can deadlock the auth lock.
      setTimeout(() => void load(), 0);
    }
  });
  window.addEventListener('online', () => state.user && void load());
}

// ---------- Images ----------

const urlCache = new Map<string, { url: string; until: number }>();
const HOUR = 3600;

/** Signed URLs for private storage paths, cached for most of their hour. */
export async function signedUrls(paths: string[]): Promise<Record<string, string>> {
  const now = Date.now();
  const missing = [...new Set(paths)].filter((p) => !(urlCache.get(p)?.until! > now));
  if (missing.length) {
    const { data } = await supabase.storage.from(BUCKET).createSignedUrls(missing, HOUR);
    for (const d of data ?? []) if (d.signedUrl && d.path) urlCache.set(d.path, { url: d.signedUrl, until: now + (HOUR - 300) * 1000 });
  }
  return Object.fromEntries(paths.map((p) => [p, urlCache.get(p)?.url ?? '']));
}

/** The best picture of a garment: our stored product image, the user's photo, or the shop's link. */
export function garmentImagePath(g: Garment): string | null {
  return g.image_path ?? g.photo_paths[0] ?? null;
}

/** Downscales a photo to at most `max` px on the long side and re-encodes it as JPEG. */
export async function compressImage(file: File, max = 1600, quality = 0.85): Promise<Blob> {
  const bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' });
  const scale = Math.min(1, max / Math.max(bitmap.width, bitmap.height));
  const w = Math.round(bitmap.width * scale);
  const h = Math.round(bitmap.height * scale);
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  canvas.getContext('2d')!.drawImage(bitmap, 0, 0, w, h);
  bitmap.close();
  return new Promise((resolve, reject) => canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('Kunne ikke komprimere billedet.'))), 'image/jpeg', quality));
}

// ---------- Inbox ----------

/** Uploads the photos and creates one inbox item for one garment. */
export async function addInboxItem(files: File[], note: string, onProgress?: (done: number) => void) {
  if (!state.user) throw new Error('Ikke logget ind.');
  const id = crypto.randomUUID();
  const paths: string[] = [];
  for (const [n, file] of files.entries()) {
    const blob = await compressImage(file);
    const path = `${state.user.id}/inbox/${id}/foto-${n + 1}.jpg`;
    const { error } = await supabase.storage.from(BUCKET).upload(path, blob, { contentType: 'image/jpeg', upsert: true });
    if (error) throw new Error(error.message);
    paths.push(path);
    onProgress?.(n + 1);
  }
  const { data, error } = await supabase.from('wardrobe_inbox').insert({ id, note: note.trim() || null, photo_paths: paths }).select().single();
  if (error) throw new Error(error.message);
  set({ inbox: [data as InboxItem, ...state.inbox] });
}

export async function deleteInboxItem(item: InboxItem) {
  const { error } = await supabase.from('wardrobe_inbox').delete().eq('id', item.id);
  if (error) throw new Error(error.message);
  if (item.photo_paths.length) await supabase.storage.from(BUCKET).remove(item.photo_paths);
  set({ inbox: state.inbox.filter((x) => x.id !== item.id) });
}

// ---------- Garments ----------

function upsertGarment(row: Garment) {
  set({ garments: state.garments.map((g) => (g.id === row.id ? row : g)) });
}

export async function updateGarment(id: string, patch: Partial<GarmentInput> & { archived?: boolean }) {
  const { data, error } = await supabase.from('wardrobe_garments').update(patch).eq('id', id).select().single();
  if (error) throw new Error(error.message);
  upsertGarment(data as Garment);
}

// ---------- Outfits ----------

async function writeItems(outfitId: string, garmentIds: string[]) {
  const del = await supabase.from('wardrobe_outfit_items').delete().eq('outfit_id', outfitId);
  if (del.error) throw new Error(del.error.message);
  if (!garmentIds.length) return;
  const ins = await supabase.from('wardrobe_outfit_items').insert(garmentIds.map((garment_id, position) => ({ outfit_id: outfitId, garment_id, position })));
  if (ins.error) throw new Error(ins.error.message);
}

/** Creates (no id) or updates an outfit. Returns its id. */
export async function saveOutfit(input: { name: string; note: string | null; garment_ids: string[] }, id?: string): Promise<string> {
  const fields = { name: input.name, note: input.note };
  const q = id ? supabase.from('wardrobe_outfits').update(fields).eq('id', id) : supabase.from('wardrobe_outfits').insert(fields);
  const { data, error } = await q.select().single();
  if (error) throw new Error(error.message);
  const row = data as Omit<Outfit, 'garment_ids'>;
  await writeItems(row.id, input.garment_ids);
  const outfit: Outfit = { ...row, garment_ids: input.garment_ids };
  set({ outfits: id ? state.outfits.map((o) => (o.id === id ? outfit : o)) : [outfit, ...state.outfits] });
  return row.id;
}

export async function deleteOutfit(id: string) {
  const { error } = await supabase.from('wardrobe_outfits').delete().eq('id', id);
  if (error) throw new Error(error.message);
  set({ outfits: state.outfits.filter((o) => o.id !== id) });
}
