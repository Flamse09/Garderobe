const IMAGE = /\.(jpe?g|png|webp)$/i;

/** Picks the product image and the user's photos (foto-1, foto-2, ... in number order) from a folder listing. */
export function pickImages(files: string[]): { product: string | null; photos: string[] } {
  const product = files.find((f) => /^produkt\./i.test(f) && IMAGE.test(f)) ?? null;
  const num = (f: string) => Number(/^foto-(\d+)\./i.exec(f)?.[1] ?? 0);
  const photos = files.filter((f) => /^foto-\d+\./i.test(f) && IMAGE.test(f)).sort((a, b) => num(a) - num(b));
  return { product, photos };
}

export function contentType(file: string): string {
  const ext = file.split('.').pop()!.toLowerCase();
  return ext === 'png' ? 'image/png' : ext === 'webp' ? 'image/webp' : 'image/jpeg';
}
