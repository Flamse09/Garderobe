import type { Garment } from './types';

const fold = (s: string) => s.toLowerCase().normalize('NFKD').replace(/[̀-ͯ]/g, '');

/** Garments matching every word of the query in name, brand, type, colour, material or size. */
export function searchGarments(garments: Garment[], query: string, category: string | null): Garment[] {
  const words = fold(query).split(/\s+/).filter(Boolean);
  return garments.filter((g) => {
    if (category && g.category !== category) return false;
    if (!words.length) return true;
    const hay = fold(
      [g.name, g.brand, g.product_name, g.type, g.category, g.color, g.color_name, g.size, g.pattern, ...g.materials.map((m) => m.fiber), ...g.seasons, g.formality]
        .filter(Boolean)
        .join(' '),
    );
    return words.every((w) => hay.includes(w));
  });
}
