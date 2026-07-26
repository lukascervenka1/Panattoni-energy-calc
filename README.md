# Panattoni — kalkulačka energetické úspory

Next.js aplikace, která klientovi spočítá orientační roční úsporu nákladů na energie
při přechodu ze stávající haly do energeticky úspornější budovy Panattoni. Vychází
z anonymizovaných dat portfolia Panattoni a ze studie *TOP 15 % energeticky
nejúspornějších budov v ČR* (Česká spořitelna / CEVRE Consultants / EnergySim, 2024).

## Jak to funguje

- Uživatel zvolí PENB třídu své budovy, plochu a spotřebu ELE/plynu (posuvníky se
  přednastaví podle třídy, ale jde je přepsat skutečnou spotřebou z vyúčtování).
- Aplikace spočítá roční úsporu v €, úsporu v MWh, snížení CO₂ a kumulativní úsporu
  za 10 let vůči referenční hodnotě (nejúspornější čtvrtina portfolia Panattoni).
- Pod kalkulačkou je tabulka anonymizovaných srovnatelných hal a rozklikávací
  sekce se zdroji a metodikou (viz [src/components/Methodology.tsx](src/components/Methodology.tsx)).
- Přesný výpočetní vzorec krok za krokem je v [CALCULATION.md](CALCULATION.md).

Vědomé rozhodnutí: **rok výstavby není vstupem do výpočtu.** Zdrojová studie na
reálných datech ukázala, že rok výstavby spolehlivě nekoreluje s energetickou
náročností budovy, a EU Taxonomie jeho použití jako proxy výslovně nedoporučuje.
Vlastní portfolio Panattoni to potvrzuje.

## Vývoj

```bash
npm install
npm run dev
```

Otevřete [http://localhost:3000](http://localhost:3000).

Bez nastavených proměnných prostředí aplikace běží na vestavěných datech v
`/data/buildings.json` a `/data/config.json` (odvozeno z interního Excelu, jména
nájemců a SPV odstraněna).

## Napojení na Google Sheet (živá data)

Aby bylo možné data v čase upravovat bez zásahu do kódu, aplikace umí místo
vestavěné zálohy číst dvě CSV publikovaná z Google Sheets. Šablony s aktuálními
daty najdete v [`reference/google-sheet-template/`](reference/google-sheet-template/)
(`buildings.csv`, `config.csv`).

### 1. Založte Google Sheet se dvěma listy

1. Vytvořte nový Google Sheet.
2. Přejmenujte první list na `Buildings`, druhý na `Config`.
3. Do `Buildings` vložte obsah `reference/google-sheet-template/buildings.csv`
   (File → Import → Upload, nebo ruční vložení).
   Sloupce: `id, park, category, area_m2, year_built, penb_class, pne_kwh_m2, pne_year`.
4. Do `Config` vložte obsah `reference/google-sheet-template/config.csv`.
   Formát je `key, value, note` — měňte pouze sloupec `value`, klíče (`ele_price_eur_kwh`,
   `class_default_a` … `class_default_g`, `class_boundary_a` … `class_boundary_g` atd.)
   nechte beze změny, aplikace podle nich hodnoty dohledává.

### 2. Publikujte oba listy zvlášť jako CSV

Pro **každý list zvlášť**:

1. File → Share → **Publish to web**.
2. V prvním rozbalovacím menu vyberte konkrétní list (`Buildings`, resp. `Config`) —
   ne "Entire document".
3. Ve druhém menu vyberte **Comma-separated values (.csv)**.
4. Klikněte **Publish** a zkopírujte vygenerovanou URL.

Sheet musí mít sdílení nastavené alespoň na "Anyone with the link — Viewer",
jinak publikovaný CSV endpoint nebude dostupný.

### 3. Nastavte proměnné prostředí

Lokálně zkopírujte `.env.example` do `.env.local` a vložte obě URL:

```bash
cp .env.example .env.local
```

```
SHEETS_BUILDINGS_CSV_URL=https://docs.google.com/.../pub?gid=...&single=true&output=csv
SHEETS_CONFIG_CSV_URL=https://docs.google.com/.../pub?gid=...&single=true&output=csv
```

Na Vercelu totéž nastavte v Project Settings → Environment Variables a znovu
nasaďte (redeploy).

Aplikace CSV znovu stahuje nejpozději každých 5 minut (`revalidate: 300` v
[src/lib/data.ts](src/lib/data.ts)) — změna v Google Sheetu se tedy na webu projeví
bez nutnosti nového nasazení. Pokud stažení selže nebo proměnné nejsou nastavené,
aplikace tiše spadne zpět na vestavěná data — nikdy nespadne s chybou. Barevná
tečka v horní liště webu ukazuje, který zdroj dat je právě aktivní.

## Nasazení

Tento adresář je připravený jako kompletní Next.js projekt, ale **není v něm
založené git repo** — to je záměr, repo a napojení na Vercel si zakládáte sami:

```bash
git init
git add .
git commit -m "Initial commit"
gh repo create panattoni-energy-calculator --private --source=. --push
```

Pak v [vercel.com/new](https://vercel.com/new) naimportujte repo a nastavte
proměnné prostředí z kroku výše.

## Citlivá data

`reference/` obsahuje zdrojový Excel, PDF studii a kolegův HTML návrh — **tyto
soubory jsou v `.gitignore`** (obsahují jména nájemců a jejich náklady na energie)
a nesmí se commitnout. Commitované jsou jen anonymizované CSV šablony v
`reference/google-sheet-template/`.
