# Sådan lægger en assistent et tøjstykke ind

Frederik tager billeder af et tøjstykke: typisk labelen (mærke, størrelse, materiale, varenummer) og selve tøjet, nogle gange med en kort beskrivelse. Opgaven er at finde ud af præcis hvilket produkt det er og gemme det.

Billederne kommer på en af to måder:

- **Fra appens indbakke** (det normale). Ét indbakke-emne er ét tøjstykke. Hent dem med `node scripts/import-items.ts inbox`. Hvert emne bliver en mappe `import/inbox-<id>/` med `foto-1.jpg`, `foto-2.jpg` ..., `note.txt` (Frederiks beskrivelse) og en `item.json`-skabelon, hvor `inbox_id` og `user_note` allerede er udfyldt. Udfyld resten af `item.json` i den mappe, og lad `inbox_id` stå.
- **Direkte i chatten.** Opret selv en mappe pr. tøjstykke i `import/` med navnet `<mærke>-<kort-navn>`, fx `import/uniqlo-oxford-skjorte-blaa/`, og gem Frederiks billeder som `foto-1.jpg`, `foto-2.jpg` osv., hvis du har adgang til filerne. Hører billederne ikke tydeligt sammen, så spørg, hvilke der hører til samme tøjstykke, før du går videre.

Mappen `import/` kommer ikke i git.

## Fremgangsmåde

1. **Læs labelen.** Skriv alt ned, der står: mærke, størrelse, materiale med procenter, varenummer/style-nummer/artikelnummer, produktionsland og vaskesymboler. Teksten gemmes ordret i `label_text`. Varenummeret er den sikreste vej til det rigtige produkt.
2. **Find produktet.** Søg på mærke + varenummer først, derefter mærke + beskrivelse + farve. Brug gerne mærkets egen side, ellers en forhandler. Sammenlign med billedet af tøjet: farve, snit, knapper, lommer, logo.
3. **Opfind intet.** Er du ikke sikker på det præcise produkt, så sæt `confidence` til `"usikker"` eller `"sandsynlig"`, udfyld kun det, du ved fra labelen og billedet, og skriv i `flags`, hvad Frederik skal tjekke.
4. **Find et billede af tøjet. Det er påkrævet**, og det vises først i appen, fordi det er i bedre kvalitet end Frederiks egne billeder. Brug et rent packshot (tøjet alene på lys baggrund) fra mærket eller en forhandler. Søg også i arkiverede produktsider, gensalg (Vinted, Tradera, eBay, Sellpy) og billedsøgning på varenummeret, hvis produktet ikke sælges mere. Gem filen som `produkt.jpg` (eller `.png`/`.webp`) i mappen og linket i `image_url`.
   - Rækkefølge: præcis samme produkt og farve → samme model i en anden farve (skriv det i `flags`, fx `"Billedet viser samme model i grå; min er navy."`) → et billede af selve trøjen fra gensalg (skriv det i `flags`).
   - Billedet skal vise **samme model**. Et produkt, der bare ligner, er ikke godt nok.
   - Finder du intet, så **læg den ikke ind**. Fortæl Frederik, hvilke tøjstykker der mangler billede, og vent. Kun hvis Frederik siger ok, må du gemme med `--uden-billede`.
5. **Tjek og gem** med scriptet. Kør altid en tør test først:
   ```
   node scripts/import-items.ts add <mappe> --dry-run
   node scripts/import-items.ts add <mappe>
   ```
   `<mappe>` er navnet i `import/` eller en fuld sti. `add-all [--dry-run]` gør det samme for alle mapper, der ikke er importeret. Scriptet uploader `produkt.*` og `foto-*`, gemmer tøjstykket, markerer indbakke-emnet som behandlet og skriver en `.imported`-fil i mappen, så den ikke importeres to gange. Findes et tøjstykke med samme mærke og navn eller varenummer allerede, stopper scriptet; brug `--force`, hvis det virkelig er et nyt. `list [søg]` viser det, der allerede er gemt. Scriptet afviser en mappe uden `produkt.*`.

   **Billede til et tøjstykke, der allerede er gemt:** `list --uden-billede` viser dem, der mangler. Gem billedet et sted (fx i tøjstykkets mappe i `import/`) og kør:
   ```
   node scripts/import-items.ts set-image <id> <fil> [billed-url] --dry-run
   node scripts/import-items.ts set-image <id> <fil> [billed-url]
   ```
6. **Fortæl Frederik** kort, hvad der blev gemt, hvor sikker du er, og hvilke `flags` Frederik skal tjekke.

Scriptet logger ind som Frederik med `GARDEROBE_EMAIL` og `GARDEROBE_PASSWORD` fra `.env.local`. Vis eller udskriv aldrig værdierne.

## Format (`item.json`)

```json
{
  "name": "Oxford-skjorte",
  "brand": "Uniqlo",
  "product_name": "Oxford Slim Fit Shirt",
  "style_number": "450254",
  "category": "Overdel",
  "type": "Skjorte",
  "color": "lyseblå",
  "color_name": "61 Blue",
  "pattern": "ensfarvet",
  "materials": [{ "fiber": "bomuld", "percent": 100 }],
  "size": "M",
  "fit": "slim",
  "warmth": "let",
  "seasons": ["forår", "sommer", "efterår"],
  "formality": "smart casual",
  "description": "Lyseblå oxford-skjorte i slim fit med button-down-krave.",
  "care": "Maskinvask 40 °C, må ikke tørretumbles.",
  "made_in": "Vietnam",
  "retail_price": 299,
  "currency": "DKK",
  "product_url": "https://www.uniqlo.com/...",
  "image_url": "https://image.uniqlo.com/...jpg",
  "confidence": "sikker",
  "flags": [],
  "user_note": "Frederiks egen beskrivelse, ordret",
  "label_text": "Al tekst fra labelen, ordret"
}
```

### Felter

- **Påkrævet:** `name`, `category`, `type`, `color`, `confidence`.
- `name`: kort dansk navn, som man ville sige det ("Oxford-skjorte", "Mørke jeans", "Hvide sneakers").
- `category` og `type` (vælg fra listen; passer intet, så brug `Andet` og forklar i `flags`):
  - **Overdel:** T-shirt, Langærmet T-shirt, Polo, Skjorte, Strik, Cardigan, Sweatshirt, Hættetrøje, Top, Andet
  - **Bukser:** Jeans, Chinos, Pæne bukser, Shorts, Joggingbukser, Andet
  - **Overtøj:** Jakke, Frakke, Blazer, Vest, Regnjakke, Dunjakke, Andet
  - **Sko:** Sneakers, Pæne sko, Støvler, Sandaler, Løbesko, Andet
  - **Tilbehør:** Bælte, Slips, Hue, Kasket, Halstørklæde, Handsker, Taske, Ur, Solbriller, Andet
  - **Sport:** Løbetøj, Cykeltøj, Træningstøj, Andet
  - **Undertøj:** Undertøj, Strømper, Nattøj, Andet
- `color`: hovedfarven på dansk, én af: sort, hvid, grå, mørkegrå, navy, blå, lyseblå, beige, sand, brun, grøn, oliven, rød, bordeaux, gul, orange, pink, lilla, flerfarvet. `color_name` er producentens eget farvenavn.
- `pattern`: ensfarvet, striber, tern, prikker, print, mønstret.
- `materials`: fibre på dansk med procent fra labelen (bomuld, uld, merinould, polyester, polyamid, elastan, hør, viskose, kashmir, læder, ruskind, dun, ...).
- `fit`: slim, regular, relaxed, oversized, skinny, tapered, straight, eller `null`.
- `warmth`: let, mellem eller varm.
- `seasons`: en eller flere af forår, sommer, efterår, vinter.
- `formality`: afslappet, smart casual eller pænt.
- `retail_price`: nyprisen som tal, hvis den kan findes; ellers `null`. `currency` som ISO-kode.
- `confidence`:
  - `sikker`: varenummer eller produktside passer, og billedet stemmer.
  - `sandsynlig`: mærke og model passer, men farve, år eller variant er ikke bekræftet.
  - `usikker`: kun det, der kan læses på labelen og ses på billedet.
- `flags`: én kort sætning pr. ting, Frederik skal tjekke.
- Ukendte felter sættes til `null` (eller `[]` for lister). Gæt ikke.
