# Garderobe

Frederiks private garderobe-app: alt Frederiks tøj, outfits og hvad der mangler. En Preact/Vite-PWA på GitHub Pages med Supabase som database (samme Supabase-projekt og login som Spilscore og Mise).

- **Lægge et tøjstykke ind:** følg [docs/IMPORT.md](docs/IMPORT.md). Frederik lægger billeder i appens indbakke; hent dem med `node scripts/import-items.ts inbox`, udfyld `item.json`, og gem med `node scripts/import-items.ts add <mappe>`. Skriv aldrig direkte i databasen på anden vis.
- **Login til scriptet:** står i `.env.local` (`GARDEROBE_EMAIL`, `GARDEROBE_PASSWORD`), som Frederik selv udfylder. Vis eller udskriv aldrig værdierne.
- **Databaseskema:** `supabase/migrations/`. Tabellerne hedder `wardrobe_*`, billederne ligger i den private bucket `garderobe` under `<bruger-id>/`. Frederik kører nye migrationer i Supabase → SQL Editor.
- **Kommandoer:** `npm run dev`, `npm test`, `npm run build`. Kør `npm test` og `npm run build` før commit.
- **Projektet er privat** og må ikke logges i Daily-loggen.
