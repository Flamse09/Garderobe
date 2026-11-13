import { describe, expect, it } from 'vitest';
import { contentType, pickImages } from '../src/wardrobe/files';

describe('pickImages', () => {
  it('finds the product image and orders photos by number', () => {
    expect(pickImages(['item.json', 'foto-10.jpg', 'foto-2.JPG', 'produkt.webp', 'foto-1.jpeg', 'note.txt', 'foto-3.heic'])).toEqual({
      product: 'produkt.webp',
      photos: ['foto-1.jpeg', 'foto-2.JPG', 'foto-10.jpg'],
    });
  });

  it('handles a folder without images', () => {
    expect(pickImages(['item.json'])).toEqual({ product: null, photos: [] });
  });
});

describe('contentType', () => {
  it('maps extensions', () => {
    expect(contentType('a.PNG')).toBe('image/png');
    expect(contentType('a.webp')).toBe('image/webp');
    expect(contentType('a.jpeg')).toBe('image/jpeg');
  });
});
