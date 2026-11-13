// The fixed vocabularies from docs/IMPORT.md. Change both places together.

export const CATEGORIES = {
  Overdel: ['T-shirt', 'Langærmet T-shirt', 'Polo', 'Skjorte', 'Strik', 'Cardigan', 'Sweatshirt', 'Hættetrøje', 'Top', 'Andet'],
  Bukser: ['Jeans', 'Chinos', 'Pæne bukser', 'Shorts', 'Joggingbukser', 'Andet'],
  Overtøj: ['Jakke', 'Frakke', 'Blazer', 'Vest', 'Regnjakke', 'Dunjakke', 'Andet'],
  Sko: ['Sneakers', 'Pæne sko', 'Støvler', 'Sandaler', 'Løbesko', 'Andet'],
  Tilbehør: ['Bælte', 'Slips', 'Hue', 'Kasket', 'Halstørklæde', 'Handsker', 'Taske', 'Ur', 'Solbriller', 'Andet'],
  Sport: ['Løbetøj', 'Cykeltøj', 'Træningstøj', 'Andet'],
  Undertøj: ['Undertøj', 'Strømper', 'Nattøj', 'Andet'],
} as const;

export type Category = keyof typeof CATEGORIES;
export const CATEGORY_NAMES = Object.keys(CATEGORIES) as Category[];

/** Main colours with a swatch for the UI. */
export const COLORS: Record<string, string> = {
  sort: '#111111',
  hvid: '#f4f2ee',
  grå: '#9a9a9a',
  mørkegrå: '#4a4a4a',
  navy: '#1f2a44',
  blå: '#2f5fa8',
  lyseblå: '#9cc0e6',
  beige: '#d8c7a6',
  sand: '#c9b48a',
  brun: '#6b4a2f',
  grøn: '#3f7a4a',
  oliven: '#6b6b3a',
  rød: '#b8322b',
  bordeaux: '#6d1f2c',
  gul: '#e6c33d',
  orange: '#e0782f',
  pink: '#e7a3b8',
  lilla: '#7a5a9a',
  flerfarvet: 'conic-gradient(#b8322b, #e6c33d, #3f7a4a, #2f5fa8, #b8322b)',
};
export const COLOR_NAMES = Object.keys(COLORS);

export const PATTERNS = ['ensfarvet', 'striber', 'tern', 'prikker', 'print', 'mønstret'];
export const FITS = ['slim', 'regular', 'relaxed', 'oversized', 'skinny', 'tapered', 'straight'];
export const WARMTHS = ['let', 'mellem', 'varm'];
export const SEASONS = ['forår', 'sommer', 'efterår', 'vinter'];
export const FORMALITIES = ['afslappet', 'smart casual', 'pænt'];
export const CONFIDENCES = ['sikker', 'sandsynlig', 'usikker'] as const;
