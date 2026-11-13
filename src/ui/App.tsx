import { useState } from 'preact/hooks';
import { runUpdate, useStore } from '../data/store';
import { Icon } from './icons';
import { LoginForm } from './LoginForm';
import { href, useRoute, type Route } from './router';
import { GarmentEdit } from './screens/GarmentEdit';
import { GarmentView } from './screens/GarmentView';
import { Inbox } from './screens/Inbox';
import { OutfitEdit } from './screens/OutfitEdit';
import { Outfits } from './screens/Outfits';
import { Settings } from './screens/Settings';
import { Wardrobe } from './screens/Wardrobe';

function Screen({ route }: { route: Route }) {
  switch (route.name) {
    case 'wardrobe':
      return <Wardrobe />;
    case 'garment':
      return <GarmentView id={route.id} />;
    case 'garment-edit':
      return <GarmentEdit id={route.id} />;
    case 'outfits':
      return <Outfits />;
    case 'outfit':
      return <OutfitEdit id={route.id} />;
    case 'inbox':
      return <Inbox />;
    case 'settings':
      return <Settings />;
  }
}

function tabOf(route: Route): string {
  if (route.name === 'garment' || route.name === 'garment-edit') return 'wardrobe';
  if (route.name === 'outfit') return 'outfits';
  return route.name;
}

export function App() {
  const route = useRoute();
  const { user, authReady, error, loading, inbox } = useStore();
  const [spinning, setSpinning] = useState(false);
  const tab = tabOf(route);

  async function onRefresh() {
    setSpinning(true);
    try {
      await runUpdate();
    } finally {
      setSpinning(false);
    }
  }

  return (
    <>
      {user && (
        <header class="top">
          <a href={href({ name: 'wardrobe' })} class="brand">
            <Icon name="hanger" size={22} />
            <span>Garderobe</span>
          </a>
          <nav class="row actions">
            <button class={`icon-btn ${spinning || loading ? 'spin' : ''}`} aria-label="Opdater" onClick={onRefresh}>
              <Icon name="refresh" size={21} />
            </button>
            <a href={href({ name: 'settings' })} class={`icon-btn ${tab === 'settings' ? 'on' : ''}`} aria-label="Konto">
              <Icon name="user" size={21} />
            </a>
          </nav>
        </header>
      )}
      <main class={user ? 'with-tabs' : undefined}>
        {error && <p class="warn">{error}</p>}
        {!authReady ? null : user ? <Screen route={route} /> : <LoginForm />}
      </main>
      {user && (
        <nav class="tabbar" aria-label="Sider">
          <a href={href({ name: 'wardrobe' })} class={tab === 'wardrobe' ? 'on' : undefined}>
            <Icon name="hanger" />
            Tøj
          </a>
          <a href={href({ name: 'outfits' })} class={tab === 'outfits' ? 'on' : undefined}>
            <Icon name="layers" />
            Outfits
          </a>
          <a href={href({ name: 'inbox' })} class={tab === 'inbox' ? 'on' : undefined}>
            <span class="tab-icon">
              <Icon name="inbox" />
              {inbox.length > 0 && <span class="badge">{inbox.length}</span>}
            </span>
            Indbakke
          </a>
        </nav>
      )}
    </>
  );
}
