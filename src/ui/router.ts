import { useEffect, useState } from 'preact/hooks';

export type Route =
  | { name: 'wardrobe' }
  | { name: 'garment'; id: string }
  | { name: 'garment-edit'; id: string }
  | { name: 'outfits' }
  | { name: 'outfit'; id?: string } // no id = new
  | { name: 'inbox' }
  | { name: 'settings' };

export function parseRoute(hash: string): Route {
  const [, first, second, third] = hash.replace(/^#/, '').split('/');
  if (first === 'g' && second) return third === 'ret' ? { name: 'garment-edit', id: second } : { name: 'garment', id: second };
  if (first === 'outfits') return second ? (second === 'ny' ? { name: 'outfit' } : { name: 'outfit', id: second }) : { name: 'outfits' };
  if (first === 'indbakke') return { name: 'inbox' };
  if (first === 'konto') return { name: 'settings' };
  return { name: 'wardrobe' };
}

export function href(r: Route): string {
  switch (r.name) {
    case 'wardrobe':
      return '#/';
    case 'garment':
      return `#/g/${r.id}`;
    case 'garment-edit':
      return `#/g/${r.id}/ret`;
    case 'outfits':
      return '#/outfits';
    case 'outfit':
      return `#/outfits/${r.id ?? 'ny'}`;
    case 'inbox':
      return '#/indbakke';
    case 'settings':
      return '#/konto';
  }
}

export function navigate(r: Route, replace = false): void {
  if (replace) location.replace(href(r));
  else location.hash = href(r);
}

export function useRoute(): Route {
  const [route, setRoute] = useState(() => parseRoute(location.hash));
  useEffect(() => {
    const onChange = () => {
      setRoute(parseRoute(location.hash));
      window.scrollTo(0, 0);
    };
    window.addEventListener('hashchange', onChange);
    return () => window.removeEventListener('hashchange', onChange);
  }, []);
  return route;
}
