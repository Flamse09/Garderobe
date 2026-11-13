import { CATEGORIES, COLOR_NAMES, CONFIDENCES, FITS, FORMALITIES, PATTERNS, SEASONS, WARMTHS, type Category } from './catalog.ts';
import type { GarmentInput, Material } from './types.ts';

export interface Validation {
  item: GarmentInput | null;
  errors: string[];
  warnings: string[];
}

const KNOWN = new Set([
  'name', 'brand', 'product_name', 'style_number', 'category', 'type', 'color', 'color_name', 'pattern', 'materials',
  'size', 'fit', 'warmth', 'seasons', 'formality', 'description', 'care', 'made_in', 'retail_price', 'currency',
  'product_url', 'image_url', 'confidence', 'flags', 'user_note', 'label_text', 'inbox_id',
]);

function str(v: unknown): string | null {
  if (v === null || v === undefined) return null;
  if (typeof v === 'number') return String(v);
  if (typeof v !== 'string') return null;
  const t = v.trim();
  return t === '' ? null : t;
}

const lower = (v: unknown) => str(v)?.toLowerCase() ?? null;

/** Checks an item.json against docs/IMPORT.md and normalises it for the database. */
export function validateItem(raw: unknown): Validation {
  const errors: string[] = [];
  const warnings: string[] = [];
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return { item: null, errors: ['item.json skal være et objekt.'], warnings };
  const r = raw as Record<string, unknown>;

  for (const k of Object.keys(r)) if (!KNOWN.has(k)) warnings.push(`Ukendt felt ignoreres: ${k}`);

  const name = str(r.name);
  if (!name) errors.push('name mangler.');

  const category = str(r.category);
  const type = str(r.type);
  if (!category) errors.push('category mangler.');
  else if (!(category in CATEGORIES)) errors.push(`Ukendt category "${category}". Brug en af: ${Object.keys(CATEGORIES).join(', ')}.`);
  else if (!type) errors.push('type mangler.');
  else if (!(CATEGORIES[category as Category] as readonly string[]).includes(type))
    errors.push(`Ukendt type "${type}" under ${category}. Brug en af: ${CATEGORIES[category as Category].join(', ')}.`);

  const color = lower(r.color);
  if (!color) errors.push('color mangler.');
  else if (!COLOR_NAMES.includes(color)) errors.push(`Ukendt color "${color}". Brug en af: ${COLOR_NAMES.join(', ')}.`);

  const confidence = lower(r.confidence);
  if (!confidence) errors.push('confidence mangler.');
  else if (!(CONFIDENCES as readonly string[]).includes(confidence)) errors.push(`confidence skal være ${CONFIDENCES.join(', ')}.`);

  function oneOf(field: string, list: string[]): string | null {
    const v = lower(r[field]);
    if (v && !list.includes(v)) {
      errors.push(`Ukendt ${field} "${v}". Brug en af: ${list.join(', ')}, eller null.`);
      return null;
    }
    return v;
  }
  const pattern = oneOf('pattern', PATTERNS);
  const fit = oneOf('fit', FITS);
  const warmth = oneOf('warmth', WARMTHS);
  const formality = oneOf('formality', FORMALITIES);

  let seasons: string[] = [];
  if (r.seasons !== undefined && r.seasons !== null) {
    if (!Array.isArray(r.seasons)) errors.push('seasons skal være en liste.');
    else {
      seasons = r.seasons.map(lower).filter((s): s is string => !!s);
      const bad = seasons.filter((s) => !SEASONS.includes(s));
      if (bad.length) errors.push(`Ukendte seasons: ${bad.join(', ')}. Brug ${SEASONS.join(', ')}.`);
    }
  }

  const materials: Material[] = [];
  if (r.materials !== undefined && r.materials !== null) {
    if (!Array.isArray(r.materials)) errors.push('materials skal være en liste.');
    else
      for (const m of r.materials) {
        const fiber = m && typeof m === 'object' ? lower((m as Record<string, unknown>).fiber) : null;
        const p = m && typeof m === 'object' ? (m as Record<string, unknown>).percent : null;
        if (!fiber) {
          errors.push('Hvert materiale skal have en fiber.');
          continue;
        }
        if (p !== null && p !== undefined && (typeof p !== 'number' || p <= 0 || p > 100)) errors.push(`Ugyldig procent for ${fiber}.`);
        materials.push({ fiber, percent: typeof p === 'number' ? p : null });
      }
    const total = materials.reduce((s, m) => s + (m.percent ?? 0), 0);
    if (materials.every((m) => m.percent !== null) && materials.length && Math.round(total) !== 100)
      warnings.push(`Materialerne summer til ${total} %, ikke 100 %.`);
  }

  let retail_price: number | null = null;
  if (r.retail_price !== undefined && r.retail_price !== null) {
    if (typeof r.retail_price !== 'number' || r.retail_price < 0) errors.push('retail_price skal være et tal.');
    else retail_price = r.retail_price;
  }
  const currency = str(r.currency)?.toUpperCase() ?? null;
  if (currency && !/^[A-Z]{3}$/.test(currency)) errors.push('currency skal være en ISO-kode som DKK.');
  if (retail_price !== null && !currency) warnings.push('retail_price uden currency; DKK antages.');

  function url(field: string): string | null {
    const v = str(r[field]);
    if (v && !/^https?:\/\//.test(v)) {
      errors.push(`${field} skal være et http(s)-link.`);
      return null;
    }
    return v;
  }
  const product_url = url('product_url');
  const image_url = url('image_url');

  let flags: string[] = [];
  if (r.flags !== undefined && r.flags !== null) {
    if (!Array.isArray(r.flags)) errors.push('flags skal være en liste.');
    else flags = r.flags.map(str).filter((f): f is string => !!f);
  }
  if (confidence && confidence !== 'sikker' && flags.length === 0) warnings.push(`confidence er "${confidence}", men flags er tom. Skriv hvad Frederik skal tjekke.`);

  const inbox_id = str(r.inbox_id);
  if (inbox_id && !/^[0-9a-f-]{36}$/i.test(inbox_id)) errors.push('inbox_id er ikke et gyldigt id.');

  if (errors.length) return { item: null, errors, warnings };
  return {
    item: {
      name: name!,
      brand: str(r.brand),
      product_name: str(r.product_name),
      style_number: str(r.style_number),
      category: category!,
      type: type!,
      color: color!,
      color_name: str(r.color_name),
      pattern,
      materials,
      size: str(r.size),
      fit,
      warmth,
      seasons,
      formality,
      description: str(r.description),
      care: str(r.care),
      made_in: str(r.made_in),
      retail_price,
      currency: currency ?? (retail_price !== null ? 'DKK' : null),
      product_url,
      image_url,
      confidence: confidence as GarmentInput['confidence'],
      flags,
      user_note: str(r.user_note),
      label_text: str(r.label_text),
      inbox_id,
    },
    errors,
    warnings,
  };
}
