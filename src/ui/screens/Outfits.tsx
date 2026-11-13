import { garmentImagePath, useStore } from '../../data/store';
import { Icon } from '../icons';
import { Img } from '../Img';
import { href } from '../router';

export function Outfits() {
  const { outfits, garments } = useStore();
  const byId = new Map(garments.map((g) => [g.id, g]));

  return (
    <>
      <div class="page-head">
        <h2>Outfits</h2>
        <p class="muted">{outfits.length === 0 ? 'Sæt tøj sammen og gem det.' : `${outfits.length} gemt`}</p>
      </div>
      <ul class="outfit-list">
        {outfits.map((o) => {
          const items = o.garment_ids.map((id) => byId.get(id)).filter((g) => !!g);
          return (
            <li key={o.id}>
              <a href={href({ name: 'outfit', id: o.id })} class="outfit-row">
                <div class="outfit-strip">
                  {items.slice(0, 5).map((g) => (
                    <Img key={g.id} path={garmentImagePath(g)} url={g.image_url} alt={g.name} class="strip-img" />
                  ))}
                </div>
                <div class="outfit-meta">
                  <span class="title">{o.name}</span>
                  <span class="sub">{items.map((g) => g.name).join(', ')}</span>
                </div>
              </a>
            </li>
          );
        })}
      </ul>
      {garments.length > 0 && (
        <a href={href({ name: 'outfit' })} class="fab" aria-label="Nyt outfit">
          <Icon name="plus" size={26} />
        </a>
      )}
    </>
  );
}
