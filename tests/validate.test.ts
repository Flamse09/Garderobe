import { describe, expect, it } from 'vitest';
import { validateItem } from '../src/wardrobe/validate';

const base = {
  name: 'Oxford-skjorte',
  brand: 'Uniqlo',
  category: 'Overdel',
  type: 'Skjorte',
  color: 'Lyseblå',
  materials: [{ fiber: 'Bomuld', percent: 100 }],
  seasons: ['forår', 'Sommer'],
  fit: 'slim',
  confidence: 'sikker',
  retail_price: 299,
  currency: 'dkk',
};

describe('validateItem', () => {
  it('accepts and normalises a full item', () => {
    const v = validateItem(base);
    expect(v.errors).toEqual([]);
    expect(v.item).toMatchObject({ color: 'lyseblå', seasons: ['forår', 'sommer'], currency: 'DKK', materials: [{ fiber: 'bomuld', percent: 100 }], flags: [], image_url: null });
  });

  it('requires name, category, type, color and confidence', () => {
    const v = validateItem({});
    expect(v.item).toBeNull();
    expect(v.errors).toEqual(expect.arrayContaining(['name mangler.', 'category mangler.', 'color mangler.', 'confidence mangler.']));
  });

  it('rejects a type that does not belong to the category', () => {
    const v = validateItem({ ...base, type: 'Jeans' });
    expect(v.item).toBeNull();
    expect(v.errors[0]).toContain('Ukendt type "Jeans" under Overdel');
  });

  it('rejects unknown colours and values', () => {
    const v = validateItem({ ...base, color: 'turkis', warmth: 'meget varm' });
    expect(v.errors).toHaveLength(2);
  });

  it('rejects non-http links', () => {
    expect(validateItem({ ...base, image_url: 'produkt.jpg' }).item).toBeNull();
  });

  it('warns when materials do not sum to 100 and when an unsure item has no flags', () => {
    const v = validateItem({ ...base, confidence: 'usikker', materials: [{ fiber: 'bomuld', percent: 60 }, { fiber: 'polyester', percent: 30 }] });
    expect(v.item).not.toBeNull();
    expect(v.warnings.join(' ')).toContain('90 %');
    expect(v.warnings.join(' ')).toContain('flags er tom');
  });

  it('defaults the currency to DKK when only a price is given', () => {
    const { currency, ...rest } = base;
    void currency;
    expect(validateItem(rest).item?.currency).toBe('DKK');
  });

  it('treats empty strings as null', () => {
    expect(validateItem({ ...base, brand: '  ', size: 'M' }).item).toMatchObject({ brand: null, size: 'M' });
  });
});
