// Moves garments between the app and the import/ folder, as the signed-in user (RLS applies; no service key).
//
//   node scripts/import-items.ts inbox                  fetch waiting inbox items into import/inbox-<id>/
//   node scripts/import-items.ts add <folder> [--dry-run] [--force] [--uden-billede]
//   node scripts/import-items.ts add-all [--dry-run]
//   node scripts/import-items.ts set-image <id> <file> [image-url] [--dry-run]
//   node scripts/import-items.ts list [search] [--uden-billede]
//
// Needs .env (VITE_SUPABASE_URL, VITE_SUPABASE_KEY) and .env.local (GARDEROBE_EMAIL, GARDEROBE_PASSWORD).
import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { basename, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { contentType, pickImages } from '../src/wardrobe/files.ts';
import { validateItem } from '../src/wardrobe/validate.ts';

const BUCKET = 'garderobe';
const root = fileURLToPath(new URL('..', import.meta.url));
const importDir = join(root, 'import');
for (const f of ['.env', '.env.local']) {
  const p = join(root, f);
  if (existsSync(p)) process.loadEnvFile(p);
}

const [cmd, ...rest] = process.argv.slice(2);
const flags = new Set(rest.filter((a) => a.startsWith('--')));
const args = rest.filter((a) => !a.startsWith('--'));
const dryRun = flags.has('--dry-run');

function fail(msg: string): never {
  console.error(msg);
  process.exit(1);
}

let session: { db: SupabaseClient; uid: string } | null = null;
async function connect() {
  if (session) return session;
  const { VITE_SUPABASE_URL: url, VITE_SUPABASE_KEY: key, GARDEROBE_EMAIL: email, GARDEROBE_PASSWORD: password } = process.env;
  if (!url || !key) fail('VITE_SUPABASE_URL/VITE_SUPABASE_KEY mangler i .env.');
  if (!email || !password) fail('GARDEROBE_EMAIL/GARDEROBE_PASSWORD mangler i .env.local. Frederik skal selv skrive dem ind.');
  const db = createClient(url, key, { auth: { persistSession: false } });
  const { data, error } = await db.auth.signInWithPassword({ email, password });
  if (error) fail(`Login fejlede: ${error.message}`);
  session = { db, uid: data.user.id };
  return session;
}

/** An empty item.json with what the inbox already knows. */
function template(inboxId: string, note: string | null) {
  return {
    name: null, brand: null, product_name: null, style_number: null, category: null, type: null, color: null, color_name: null,
    pattern: null, materials: [], size: null, fit: null, warmth: null, seasons: [], formality: null, description: null, care: null,
    made_in: null, retail_price: null, currency: null, product_url: null, image_url: null, confidence: null, flags: [],
    user_note: note, label_text: null, inbox_id: inboxId,
  };
}

async function pullInbox() {
  const { db } = await connect();
  const { data, error } = await db.from('wardrobe_inbox').select('*').eq('status', 'ny').order('created_at');
  if (error) fail(error.message);
  if (!data.length) return console.log('Indbakken er tom.');
  mkdirSync(importDir, { recursive: true });
  for (const item of data as { id: string; note: string | null; photo_paths: string[] }[]) {
    const dir = join(importDir, `inbox-${item.id.slice(0, 8)}`);
    if (existsSync(join(dir, 'item.json'))) {
      console.log(`Findes allerede: import/${basename(dir)}`);
      continue;
    }
    mkdirSync(dir, { recursive: true });
    for (const [n, path] of item.photo_paths.entries()) {
      const { data: blob, error: e } = await db.storage.from(BUCKET).download(path);
      if (e) fail(`Kunne ikke hente ${path}: ${e.message}`);
      writeFileSync(join(dir, `foto-${n + 1}.jpg`), Buffer.from(await blob.arrayBuffer()));
    }
    writeFileSync(join(dir, 'note.txt'), item.note ?? '');
    writeFileSync(join(dir, 'item.json'), JSON.stringify(template(item.id, item.note), null, 2) + '\n');
    console.log(`Hentet: import/${basename(dir)} (${item.photo_paths.length} billeder)${item.note ? ` – "${item.note}"` : ''}`);
  }
}

/** Validates and saves one folder. Returns false when it was skipped or rejected (add-all keeps going). */
async function addFolder(folder: string, strict: boolean): Promise<boolean> {
  const dir = resolve(folder.includes('/') || folder.includes('\\') ? folder : join(importDir, folder));
  const name = basename(dir);
  const reject = (msg: string) => {
    if (strict) fail(msg);
    console.error(msg);
    return false;
  };
  if (existsSync(join(dir, '.imported'))) return reject(`${name}: er allerede importeret (${readFileSync(join(dir, '.imported'), 'utf8').trim()}).`);
  const jsonPath = join(dir, 'item.json');
  if (!existsSync(jsonPath)) return reject(`${name}: item.json mangler.`);

  let raw: unknown;
  try {
    raw = JSON.parse(readFileSync(jsonPath, 'utf8'));
  } catch (e) {
    return reject(`${name}: kunne ikke læse item.json: ${(e as Error).message}`);
  }
  const v = validateItem(raw);
  for (const w of v.warnings) console.warn(`${name}: advarsel: ${w}`);
  if (!v.item) return reject(`${name}: afvist:\n- ${v.errors.join('\n- ')}`);
  const item = v.item;
  const { product, photos } = pickImages(readdirSync(dir));
  if (!product && !flags.has('--uden-billede')) {
    return reject(`${name}: produktbillede mangler. Find et billede af tøjet og gem det som produkt.jpg i mappen (se docs/IMPORT.md). Kun hvis Frederik har sagt ok: --uden-billede.`);
  }

  if (dryRun) {
    console.log(`${name}: OK – "${item.name}" [${item.category} / ${item.type}], ${item.confidence}, produktbillede: ${product ?? 'nej'}, egne billeder: ${item.inbox_id ? 'fra indbakken' : photos.length} (dry run, intet gemt).`);
    return true;
  }

  const { db, uid } = await connect();
  if (!flags.has('--force')) {
    const { data: existing } = await db.from('wardrobe_garments').select('id, name, brand, style_number');
    const dupe = existing?.find(
      (g) => (item.style_number && g.style_number === item.style_number && g.brand === item.brand) || (g.name.toLowerCase() === item.name.toLowerCase() && g.brand === item.brand),
    );
    if (dupe) return reject(`${name}: findes måske allerede: "${dupe.name}" (${dupe.id}). Brug --force for at gemme alligevel.`);
  }

  // Photos already uploaded through the app stay where they are; otherwise upload the folder's own.
  let photo_paths: string[] = [];
  if (item.inbox_id) {
    const { data: inbox, error } = await db.from('wardrobe_inbox').select('photo_paths').eq('id', item.inbox_id).single();
    if (error) return reject(`${name}: indbakke-emnet ${item.inbox_id} findes ikke: ${error.message}`);
    photo_paths = inbox.photo_paths;
  }

  const id = crypto.randomUUID();
  async function upload(file: string): Promise<string> {
    const path = `${uid}/garments/${id}/${file.toLowerCase()}`;
    const { error } = await db.storage.from(BUCKET).upload(path, readFileSync(join(dir, file)), { contentType: contentType(file), upsert: true });
    if (error) fail(`${name}: upload af ${file} fejlede: ${error.message}`);
    return path;
  }
  const image_path = product ? await upload(product) : null;
  if (!item.inbox_id) for (const f of photos) photo_paths.push(await upload(f));

  const { data, error } = await db.from('wardrobe_garments').insert({ ...item, id, image_path, photo_paths }).select('id, name').single();
  if (error) return reject(`${name}: ${error.message}`);
  if (item.inbox_id) {
    const u = await db.from('wardrobe_inbox').update({ status: 'behandlet', garment_id: id }).eq('id', item.inbox_id);
    if (u.error) console.warn(`${name}: gemt, men indbakke-emnet blev ikke markeret: ${u.error.message}`);
  }
  writeFileSync(join(dir, '.imported'), data.id + '\n');
  console.log(`${name}: gemt "${data.name}" (${data.id})${image_path ? ' med produktbillede' : ''}, ${photo_paths.length} egne billeder.`);
  return true;
}

/** Gives an existing garment a (new) product image, which is shown first. */
async function setImage(id: string, file: string, url: string | undefined) {
  const path = resolve(file);
  if (!existsSync(path)) fail(`Filen findes ikke: ${file}`);
  const { db, uid } = await connect();
  const { data: g, error } = await db.from('wardrobe_garments').select('id, name').eq('id', id).single();
  if (error) fail(`Tøjstykket ${id} findes ikke: ${error.message}`);
  if (dryRun) return console.log(`"${g.name}": ville få ${basename(path)} som produktbillede (dry run, intet gemt).`);
  const ext = basename(path).split('.').pop()!.toLowerCase();
  const storagePath = `${uid}/garments/${id}/produkt.${ext}`;
  const up = await db.storage.from(BUCKET).upload(storagePath, readFileSync(path), { contentType: contentType(path), upsert: true });
  if (up.error) fail(`Upload fejlede: ${up.error.message}`);
  const patch: Record<string, string> = { image_path: storagePath };
  if (url) patch.image_url = url;
  const u = await db.from('wardrobe_garments').update(patch).eq('id', id);
  if (u.error) fail(u.error.message);
  console.log(`"${g.name}": produktbillede gemt.`);
}

const usage =
  'Brug: inbox | add <mappe> [--dry-run] [--force] [--uden-billede] | add-all [--dry-run] | set-image <id> <fil> [billed-url] [--dry-run] | list [søg] [--uden-billede]';

switch (cmd) {
  case 'inbox':
    await pullInbox();
    break;
  case 'add':
    if (!args[0]) fail(usage);
    await addFolder(args[0], true);
    break;
  case 'add-all': {
    if (!existsSync(importDir)) fail('Mappen import/ findes ikke.');
    const dirs = readdirSync(importDir, { withFileTypes: true })
      .filter((d) => d.isDirectory() && !existsSync(join(importDir, d.name, '.imported')) && existsSync(join(importDir, d.name, 'item.json')))
      .map((d) => d.name);
    if (!dirs.length) {
      console.log('Ingen mapper venter på import.');
      break;
    }
    let ok = 0;
    for (const d of dirs) if (await addFolder(d, false)) ok++;
    console.log(`${ok} af ${dirs.length} ${dryRun ? 'er klar' : 'importeret'}.`);
    if (ok < dirs.length) process.exitCode = 1;
    break;
  }
  case 'set-image':
    if (!args[0] || !args[1]) fail(usage);
    await setImage(args[0], args[1], args[2]);
    break;
  case 'list': {
    const { db } = await connect();
    let q = db.from('wardrobe_garments').select('id, name, brand, category, type, confidence, archived').order('category').order('name');
    if (args[0]) q = q.ilike('name', `%${args[0]}%`);
    if (flags.has('--uden-billede')) q = q.is('image_path', null);
    const { data, error } = await q;
    if (error) fail(error.message);
    for (const g of data) console.log(`${g.id}  ${g.name}${g.brand ? ` (${g.brand})` : ''}  [${g.category} / ${g.type}]${g.confidence !== 'sikker' ? `  ${g.confidence}` : ''}${g.archived ? '  arkiveret' : ''}`);
    console.log(`${data.length} stykker.`);
    break;
  }
  default:
    fail(usage);
}
