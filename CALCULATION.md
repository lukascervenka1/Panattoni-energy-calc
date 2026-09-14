# Výpočetní vzorec kalkulačky

Tento dokument popisuje, jak kalkulačka dojde od zadaných hodnot k výsledné úspoře.
Zdrojový kód: [`src/lib/calc.ts`](src/lib/calc.ts). Konfigurační hodnoty (ceny, emisní
faktory, výchozí odhady): [`src/lib/data.ts`](src/lib/data.ts) + `data/config.json`
(vestavěná záloha) nebo list `Config` v napojeném Google Sheetu.

## 1. Vstupy

Uživatel zadává tři hodnoty (viz [`SliderField`](src/components/SliderField.tsx)):

| Vstup | Proměnná v kódu | Výchozí rozsah |
|---|---|---|
| Pronajatá plocha | `areaM2` | 500–200 000 m² |
| Spotřeba elektřiny | `eleKwhM2` | 0–500 kWh/(m²·rok) |
| Spotřeba plynu | `gasKwhM2` | 0–350 kWh/(m²·rok) |

`eleKwhM2` a `gasKwhM2` se přednastaví podle zvolené třídy PENB (krok 2 níže), ale
uživatel je může kdykoli přepsat skutečnou naměřenou spotřebou.

Pole elektřiny a plynu se v UI zobrazují a editují v **MWh/rok** (tak, jak spotřebu
lidé znají z vyúčtování) — kalkulačka hodnotu při zápisu přepočte na kanonickou
jednotku kWh/(m²·rok) pomocí aktuální `areaM2` a pod polem zobrazí dopočtenou
intenzitu jako drobný hint. Vnitřně (vstupy do vzorců níže) se vždy pracuje jen s
`eleKwhM2` / `gasKwhM2` v kWh/(m²·rok) — přepočet je čistě zobrazovací.
*Funkce: [`SliderField`](src/components/SliderField.tsx), `toMwh`/`fromMwh` v
[`CalculatorPage.tsx`](src/components/CalculatorPage.tsx).*

## 2. Výchozí odhad spotřeby podle třídy PENB

Když uživatel klikne na třídu A–G, kalkulačka nejdřív vezme celkový odhad spotřeby pro
danou třídu (`config.classDefaultsKwhM2[třída]`, např. C → 90 kWh/(m²·rok)) a rozpočítá
ho na elektřinu a plyn:

```
eleKwhM2  = round( classDefaultsKwhM2[třída] × eleShareDefault / 5 ) × 5
gasKwhM2  = round( classDefaultsKwhM2[třída] × gasShareDefault / 5 ) × 5
```

kde `eleShareDefault = 0,30` a `gasShareDefault = 0,70`. Zaokrouhluje se na nejbližších
5 kWh/m², aby hodnoty na posuvnících seděly na krok. Toto je jen **výchozí odhad**
spotřeby zadávané budovy — nemá nic společného s referenční (nabízenou) budovou
v kroku 4, ta má svůj vlastní, pevně daný mix.

*Funkce: [`suggestConsumptionSplit()`](src/lib/calc.ts).*

## 3. Aktuální spotřeba (PNE)

```
currentPneKwhM2 = eleKwhM2 + gasKwhM2
```

Pokud je `currentPneKwhM2 ≤ referencePneKwhM2` (viz krok 4), kalkulačka vrátí stav
„budova je na špičkové úrovni" a všechny úspory jsou 0 — dál se nepočítá.

## 4. Referenční (nabízená) budova

```
referencePneKwhM2   = config.referencePneKwhM2      // 35 kWh/(m²·rok)
referenceEleSharePct = config.referenceEleSharePct   // 1,00 (100 % elektřina)
```

Toto je **obchodní rozhodnutí, ne statistika odvozená z portfolia** — spotřeba
a palivový mix nabízené (nové) budovy, potvrzené 09/2026. Referenční budova běží
čistě na elektřině (tepelná čerpadla), bez fotovoltaiky — počítá se s ní za plnou
tržní cenu elektřiny (`elePriceEurKwh`).

Klíčové je, že referenční budova má **svůj vlastní, pevný mix — nezávislý na tom,
co zadá uživatel.** Dřívější verze vzorce (do 09/2026) tohle nedělala: cílovou
spotřebu cenově oceňovala stejným mixem, jaký měl na vstupu uživatel, takže
referenční budova v podstatě neexistovala jako samostatná entita — jen zrcadlila
vstup. To vedlo k tomu, že např. čistě plynová budova viděla nižší úsporu, než
by měla (protože kalkulačka jí dosazovala levný plyn i na cílovou stranu), a
naopak čistě elektrická budova viděla úsporu podhodnocenou.

## 5. Rozdíl ve spotřebě (energie)

```
deltaKwh = (currentPneKwhM2 − referencePneKwhM2) × areaM2
```

Celkový roční rozdíl ve spotřebě energie mezi současným stavem a referenční budovou,
v kWh za celou budovu. Je to čistě energetické číslo — nezávisí na palivovém mixu
ani na ceně, takže `annualSavingsMwh` a `reductionPct` (krok 7) jsou vždy kladné,
jakmile `currentPneKwhM2 > referencePneKwhM2`.

## 6. Náklady a emise — současná budova vs. referenční budova

Současná budova se oceňuje **svým vlastním mixem** (co zadal uživatel). Referenční
budova se oceňuje **svým vlastním, pevným mixem** (krok 4). Tohle jsou dva nezávislé
výpočty, ne jeden vážený průměr:

```
currentCostPerM2 = eleKwhM2 × elePriceEurKwh + gasKwhM2 × gasPriceEurKwh
currentCo2PerM2  = eleKwhM2 × eleCo2TPerKwh  + gasKwhM2 × gasCo2TPerKwh

referenceEleKwhM2 = referencePneKwhM2 × referenceEleSharePct
referenceGasKwhM2 = referencePneKwhM2 × (1 − referenceEleSharePct)
referenceCostPerM2 = referenceEleKwhM2 × elePriceEurKwh + referenceGasKwhM2 × gasPriceEurKwh
referenceCo2PerM2  = referenceEleKwhM2 × eleCo2TPerKwh  + referenceGasKwhM2 × gasCo2TPerKwh
```

Výchozí hodnoty (`data/config.json`, reálné sazby, bez FVE):

| Konstanta | Hodnota | Význam |
|---|---|---|
| `elePriceEurKwh` | 0,09 € | cena elektřiny za kWh |
| `gasPriceEurKwh` | 0,042 € | cena plynu za kWh |
| `eleCo2TPerKwh` | 0,00036 t | emisní faktor ELE (ČR mix, ERÚ/ČHMÚ) |
| `gasCo2TPerKwh` | 0,000202 t | emisní faktor plynu (MPO/IPCC) |

Elektřina je **2,14× dražší** za kWh než plyn. To má reálný důsledek: budova, která
je dnes efektivní, ale topí převážně (levným) plynem, může přechodem na čistě
elektrickou referenční budovu spotřebovat výrazně méně energie, a přesto na tom
finančně/emisně netratit ani nezískat — viz krok 7.

## 7. Výsledky

```
annualSavingsEurPerM2 = max( 0, currentCostPerM2 − referenceCostPerM2 )
annualSavingsEur      = round( annualSavingsEurPerM2 × areaM2 )
annualCo2SavingsT     = max( 0, round( (currentCo2PerM2 − referenceCo2PerM2) × areaM2 ) )
annualSavingsMwh      = round( deltaKwh / 1000 )
reductionPct          = round( (1 − referencePneKwhM2 / currentPneKwhM2) × 100 )

fiveYearSavingsEur    = annualSavingsEur × 5
tenYearSavingsEur     = annualSavingsEur × 10
hasFinancialSavings    = (currentCostPerM2 − referenceCostPerM2) > 0   // před zaokrouhlením na 0
```

**Nikdy se nezobrazuje záporná úspora.** Peníze a CO₂ se floorují na 0 —
**nezávisle na sobě** (jedna metrika může být 0, zatímco druhá zůstává reálně
kladná — např. třída B: 0 € úspora, ale 13 t CO₂ ročně). `annualSavingsMwh`
a `reductionPct` se nikdy nefloorují, protože jsou čistě energetické a v téhle
větvi výpočtu (currentPneKwhM2 > referencePneKwhM2) jsou vždy kladné.

`hasFinancialSavings` drží informaci o tom, jestli k floorování došlo, *před*
zaokrouhlením na euro — UI ji používá k volbě mezi třemi stavy panelu
([`ResultsHero.tsx`](src/components/ResultsHero.tsx)):

| Stav | Podmínka | Co se ukáže |
|---|---|---|
| Normální úspora | `!isOptimal && hasFinancialSavings` | %, €/m², €/rok, €/5 let |
| Nulová finanční úspora | `!isOptimal && !hasFinancialSavings` | %, ale místo tří dlaždic pozitivní věta (žádná € čísla) |
| Už na špičce | `isOptimal` (currentPneKwhM2 ≤ referencePneKwhM2) | 0 € a text o špičkové úrovni |

`annualSavingsEurPerM2` je nezávislý na ploše (`areaM2` se v jeho výrazu vykrátí) —
je to čistě „o kolik € na m² ročně přijdete tím, že budova stojí víc, než by stála
referenční". Pětiletá a desetiletá úspora jsou prosté násobky roční úspory (bez
diskontování, bez predikce vývoje cen energií — jde o ilustrativní, ne finanční
projekci).

## Shrnutí jako jeden výpočet

```
náklady_dnes = spotřeba_ELE × cena_ELE + spotřeba_plyn × cena_plynu
náklady_ref  = 35 × 1,00 × cena_ELE                              // referenční budova, čistě elektrická

úspora [€/rok] = max(0, náklady_dnes − náklady_ref) × plocha
```

## Ověření výpočtu

Vzorec je pokrytý testy — spustíte je příkazem:

```
npm test
```

Testy běží na vestavěném test runneru Node.js (žádné další závislosti), zdroj je
v `tests/`:

| Soubor | Co ověřuje |
|---|---|
| `tests/calc.test.ts` | Vzorec proti ručně dopočítaným hodnotám (ne přepočtem z kódu) — rozpad dle třídy PENB, nezávislé oceňování současné a referenční budovy, floor na 0 u nákladů/CO₂ (samostatně pro každou metriku), zlomový bod pro mix 30:70, chování na hranici referenční hodnoty, invarianty a formátování čísel. |
| `tests/csv.test.ts` | Parser CSV z Google Sheetu — uvozovky, čárky uvnitř polí, CRLF, chybějící sloupce. |
| `tests/data.test.ts` | Shodu `data/*.json` se šablonou v `reference/google-sheet-template/*.csv` (obojí se udržuje ručně, takže hrozí rozjetí) a rozsahy hodnot. |
| `tests/security.test.ts` | Odolnost proti nepřátelským datům z Google Sheetu a proti tomu, co může návštěvník napsat do polí — plus kontrolu bezpečnostních hlaviček. |

Dva referenční příklady (třída C a D při 15 000 m²) jsou navíc ověřené proti
číslům, která reálně zobrazuje běžící aplikace.

## Kde se dají hodnoty měnit

Všechny konstanty v krocích 2, 4 a 6 (ceny, emisní faktory, mix výchozího odhadu,
referenční budova, výchozí odhady po třídách) se dají upravovat bez zásahu do kódu
přes list `Config` v napojeném Google Sheetu — viz
[README.md](README.md#napojení-na-google-sheet-živá-data). Bez napojeného sheetu
se použijí hodnoty z `data/config.json`.
