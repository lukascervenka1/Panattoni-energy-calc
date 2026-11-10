# Panattoni — kalkulačka energetické úspory

Next.js aplikace, která klientovi spočítá orientační roční úsporu nákladů na energie
při přechodu ze stávající haly do energeticky úspornější budovy Panattoni. Vychází
z anonymizovaných dat portfolia Panattoni a ze studie *TOP 15 % energeticky
nejúspornějších budov v ČR* (Česká spořitelna / CEVRE Consultants / EnergySim, 2024).

## Jak to funguje

- Uživatel zvolí PENB třídu své budovy, plochu a spotřebu ELE/plynu (posuvníky se
  přednastaví podle třídy, ale jde je přepsat skutečnou spotřebou z vyúčtování),
  nebo nahraje PDF svého průkazu PENB a hodnoty se doplní z něj (viz
  [Nahrání průkazu PENB](#nahrání-průkazu-penb)).
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
`/data/benchmarks.json` a `/data/config.json` (odvozeno z interního Excelu, jména
nájemců a SPV odstraněna).

`benchmarks.json` obsahuje **jen 3 vybrané nejnovější haly**, které se klientovi
ukazují jako benchmark — ne celé portfolio. Podmínkou pro zařazení je celý rok
naměřené fakturované spotřeby: první kalendářní rok po dokončení haly je vždy
neúplný a vychází z něj nereálně nízká čísla.

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

Po nasazení na finální doménu nastavte ještě `SITE_URL` (např.
`https://kalkulacka.panattonieurope.com`). Používá se jen pro absolutní adresu
náhledového obrázku odkazu (Open Graph) — když ji nenastavíte, Vercel dosadí
URL konkrétního nasazení, takže náhled bude fungovat, ale bude ukazovat na
adresu daného deploye místo na produkční doménu.

Aplikace CSV znovu stahuje nejpozději každých 5 minut (`revalidate: 300` v
[src/lib/data.ts](src/lib/data.ts)) — změna v Google Sheetu se tedy na webu projeví
bez nutnosti nového nasazení. Pokud stažení selže nebo proměnné nejsou nastavené,
aplikace tiše spadne zpět na vestavěná data — nikdy nespadne s chybou. Barevná
tečka v horní liště webu ukazuje, který zdroj dat je právě aktivní.

## Nahrání průkazu PENB

Návštěvník může místo ručního zadání nahrát PDF svého průkazu energetické
náročnosti budovy. Kalkulačka z něj přečte energeticky vztažnou plochu a dodanou
energii po energonositelích (sekce B protokolu), doplní je do polí a průkaz si
uloží pro budování vlastních dat. Jak se hodnoty z průkazu dostanou do výpočtu
(a proč se energie okolního prostředí nepočítá), viz
[CALCULATION.md](CALCULATION.md#hodnoty-z-nahraného-průkazu-penb).

| Soubor | Co dělá |
|---|---|
| [src/components/PenbUpload.tsx](src/components/PenbUpload.tsx) | Drag & drop / výběr souboru, souhlas, stavy nahrávání |
| [src/app/api/penb/route.ts](src/app/api/penb/route.ts) | Endpoint: kontroly, čtení PDF, uložení |
| [src/lib/penbReader.ts](src/lib/penbReader.ts) | Spustí čtení v samostatném vlákně a hlídá mu čas a paměť |
| [src/lib/penbWorker.ts](src/lib/penbWorker.ts), [src/lib/penbPdf.ts](src/lib/penbPdf.ts) | To vlákno: vytažení textu z PDF (pdf.js) |
| [src/lib/penb.ts](src/lib/penb.ts) | Čtení hodnot z textu průkazu (čistá funkce, pokrytá testy) |
| [src/lib/penbStore.ts](src/lib/penbStore.ts) | Uložení do Vercel Blob |

### Zapnutí ukládání (jednorázově ve Vercelu)

1. Vercel → projekt → **Storage → Create → Blob**, přístup zvolte **Private**.
2. Store připojte k projektu (Production i Preview). Vercel sám přidá proměnnou
   `BLOB_STORE_ID` a funkce se k úložišti přihlašují automaticky (OIDC) — pak je
   potřeba nový deploy. Starší store místo toho přidá `BLOB_READ_WRITE_TOKEN`;
   funguje obojí.
3. Bez těchto proměnných vše funguje dál, jen se průkazy **neukládají** (v logu
   je varování `[penb] no Blob store configured`).
4. Region funkcí (Settings → Functions) nastavte na **Frankfurt (fra1)**, stejně
   jako je Blob store — jinak průkazy s osobními údaji putují přes USA.

Uložené průkazy najdete ve Vercelu pod **Storage → (váš Blob store) → Browser**,
složka `penb/`. Ke každému průkazu jsou dva soubory se stejným názvem (SHA-256
obsahu, takže opakované nahrání téhož PDF nevytváří duplikát):

- `<hash>.pdf` — původní průkaz,
- `<hash>.json` — co jsme z něj přečetli (plocha, MWh po energonositelích,
  evidenční číslo, obec, typ využití, datum vyhotovení), čas nahrání, jazyk a
  verze souhlasu, se kterou návštěvník souhlasil.

Záměrně se **neukládá** IP adresa, původní název souboru ani nic o prohlížeči.
Průkazy, které nejdou přečíst vůbec (sken bez textu, PDF, které není PENB), se
neukládají — nevíme, co obsahují. Průkaz, který je PENB, ale tabulku z něj
přečíst nejde, se uloží (s `parseError`), aby šel doplnit ručně.

### Ochrana endpointu

Přijímá jen POST z vlastní domény (kontrola `Origin`), max. 4 MB, jen soubory
s PDF hlavičkou (ne podle přípony), max. 150 stran a 200 000 textových prvků.
Z PDF se nic nevykresluje ani nespouští. Samotné čtení běží v **samostatném
vlákně** (worker thread), které se okamžitě ukončí po 15 s nebo když paměť
samo zabere víc než 384 MB (Hobby plán dává funkci 1 GB) — PDF se dá zabalit tak, že ~1 MB souboru se rozbalí
na gigabajty, a bez toho by shodil celou funkci včetně požadavků ostatních
návštěvníků. Reálné průkazy se čtou do 1 s a do 200 MB. Limit 10 nahrání za 10 minut na
IP je jen orientační (na serverless běží zvlášť v každé instanci) — **skutečný
rate limit nastavte ve Vercel Firewall**: Firewall → Rules → nové pravidlo pro
cestu `/api/penb`, akce *Rate limit* (např. 10 požadavků / 10 min / IP).

### Souhlas a GDPR

Text souhlasu je v [src/lib/i18n.ts](src/lib/i18n.ts) (`penb.consent`).
**Ostrý provoz schválilo právní oddělení Panattoni (11/2026).** Kalkulačka je
plně použitelná i bez nahrání průkazu, takže souhlas je dobrovolný, ne
podmínka služby. Průkaz obsahuje osobní údaje energetického specialisty
(jméno, telefon, e-mail) a často název stavebníka/vlastníka. Blob nic
automaticky nemaže — průkazy se mažou ručně ve Vercelu.

Při změně textu souhlasu zvyšte `PENB_CONSENT_VERSION` v
[src/lib/penbUpload.ts](src/lib/penbUpload.ts) — ukládá se ke každému průkazu.

### Známé limity

Kalkulačka umí číst dva zdroje čísel:

1. **Protokol podle vyhlášky 264/2020**, sekce B (celková dodaná energie po
   energonositelích) — novější průkazy.
2. **Přiložený výpočet z programu Energie** (Svoboda Software), tabulka
   „Součty pro jednotlivé energonositele“ — u starších průkazů podle vyhlášky
   78/2013, kde jsou protokolové strany často nečitelné. Bere se jen první
   výpočet; druhý („DOPORUČENÍ“) je stav po navržených opatřeních.

Ověřeno na 10 reálných průkazech (10/2026): **6 přečteno, všechny se součty
sedícími na tabulku průkazu.** Zbylé 4 přečíst nejde, protože v nich čísla nejsou
jako text — sken štítku, tabulky vložené jako obrázek (starý průkaz
z PowerPointu) a dva průkazy, jejichž tabulky jsou v PDF uložené písmem bez
převodu na znaky (z textu vyjde `!"#$%&'(…`). Na ty by bylo potřeba OCR. Návštěvník
v tom případě dostane výzvu zadat hodnoty ručně a průkaz se (je-li to PENB)
uloží k ručnímu doplnění.

S každým novým vzorkem je dobré pustit lokální kontrolu — jde zadat jeden
soubor i celou složku:

```bash
PENB_SAMPLE_PDF=/cesta/k/prukazu.pdf npm test
PENB_SAMPLE_PDF=/cesta/ke/slozce npm test
```

Skutečné průkazy do repa nepatří (osobní údaje specialisty), testy proto
používají syntetické.

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
