export interface Material {
  fiber: string;
  percent: number | null;
}

/** What docs/IMPORT.md describes, as stored in wardrobe_garments. */
export interface GarmentInput {
  name: string;
  brand: string | null;
  product_name: string | null;
  style_number: string | null;
  category: string;
  type: string;
  color: string;
  color_name: string | null;
  pattern: string | null;
  materials: Material[];
  size: string | null;
  fit: string | null;
  warmth: string | null;
  seasons: string[];
  formality: string | null;
  description: string | null;
  care: string | null;
  made_in: string | null;
  retail_price: number | null;
  currency: string | null;
  product_url: string | null;
  image_url: string | null;
  confidence: 'sikker' | 'sandsynlig' | 'usikker';
  flags: string[];
  user_note: string | null;
  label_text: string | null;
  inbox_id: string | null;
}

export interface Garment extends GarmentInput {
  id: string;
  owner_id: string;
  image_path: string | null;
  photo_paths: string[];
  archived: boolean;
  created_at: string;
  updated_at: string;
}

export interface Outfit {
  id: string;
  owner_id: string;
  name: string;
  note: string | null;
  created_at: string;
  garment_ids: string[]; // in position order, joined from wardrobe_outfit_items
}

export interface InboxItem {
  id: string;
  owner_id: string;
  note: string | null;
  photo_paths: string[];
  status: 'ny' | 'behandlet';
  garment_id: string | null;
  created_at: string;
}
