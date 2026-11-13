import { describe, expect, it } from 'vitest';
import { searchGarments } from '../src/wardrobe/search';
import type { Garment } from '../src/wardrobe/types';

function g(over: Partial<Garment>): Garment {
  return {
    id: crypto.randomUUID(), owner_id: 'u', name: 'x', brand: null, product_name: null, style_number: null, category: 'Overdel', type: 'Skjorte',
    color: 'hvid', color_name: null, pattern: null, materials: [], size: null, fit: null, warmth: null, seasons: [], formality: null,
    description: null, care: null, made_in: null, retail_price: null, currency: null, product_url: null, image_url: null, confidence: 'sikker',
    flags: [], user_note: null, label_text: null, inbox_id: null, image_path: null, photo_paths: [], archived: false, created_at: '', updated_at: '',
    ...over,
  };
}

const items = [
  g({ name: 'Oxford-skjorte', brand: 'Uniqlo', color: 'lyseblå', materials: [{ fiber: 'bomuld', percent: 100 }] }),
  g({ name: 'Mørke jeans', category: 'Bukser', type: 'Jeans', color: 'navy' }),
  g({ name: 'Strik', type: 'Strik', color: 'grå', materials: [{ fiber: 'merinould', percent: 100 }] }),
];

describe('searchGarments', () => {
  it('matches all words across fields, ignoring case and accents', () => {
    expect(searchGarments(items, 'uniqlo BOMULD', null).map((x) => x.name)).toEqual(['Oxford-skjorte']);
    expect(searchGarments(items, 'MØRKE', null).map((x) => x.name)).toEqual(['Mørke jeans']);
    expect(searchGarments(items, 'skjorte lyseblå', null)).toHaveLength(1);
  });

  it('filters by category', () => {
    expect(searchGarments(items, '', 'Bukser').map((x) => x.name)).toEqual(['Mørke jeans']);
    expect(searchGarments(items, 'merino', 'Overdel').map((x) => x.name)).toEqual(['Strik']);
  });
});
