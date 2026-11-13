import { useEffect, useState } from 'preact/hooks';
import { signedUrls } from '../data/store';

/** Shows a private storage image (via a signed URL), or an external link, or a placeholder letter. */
export function Img({ path, url, alt, class: cls }: { path?: string | null; url?: string | null; alt: string; class?: string }) {
  const [src, setSrc] = useState<string | null>(path ? null : (url ?? null));
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setFailed(false);
    if (!path) return setSrc(url ?? null);
    let live = true;
    signedUrls([path]).then((m) => live && setSrc(m[path] || url || null));
    return () => void (live = false);
  }, [path, url]);

  if (!src || failed) return <div class={`img-fallback ${cls ?? ''}`}>{alt.slice(0, 1).toUpperCase()}</div>;
  return <img class={cls} src={src} alt={alt} loading="lazy" onError={() => setFailed(true)} />;
}
