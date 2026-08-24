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
| Spotřeba elektřiny | `eleKwhM2` | 0–600 kWh/(m²·rok) |
| Spotřeba plynu | `gasKwhM2` | 0–400 kWh/(m²·rok) |

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
ho na elektřinu a plyn podle reálného mixu portfolia:

```
eleKwhM2  = round( classDefaultsKwhM2[třída] × eleShareDefault / 5 ) × 5
gasKwhM2  = round( classDefaultsKwhM2[třída] × gasShareDefault / 5 ) × 5
```

kde `eleShareDefault = 0,30` a `gasShareDefault = 0,70` (metodika platná od 08/2026;
odpovídá plynem dominovanému mixu naměřenému v portfoliu — 2024 vychází ELE 46 % /
plyn 54 %). Zaokrouhluje se na nejbližších 5 kWh/m², aby hodnoty na posuvnících
seděly na krok.

*Funkce: [`suggestConsumptionSplit()`](src/lib/calc.ts).*

## 3. Aktuální spotřeba (PNE)

```
currentPneKwhM2 = eleKwhM2 + gasKwhM2
```

Pokud je `currentPneKwhM2 ≤ referencePneKwhM2` (viz krok 4), kalkulačka vrátí stav
„budova je na špičkové úrovni" a všechny úspory jsou 0 — dál se nepočítá.

## 4. Referenční hodnota

```
referencePneKwhM2 = config.referencePneKwhM2   // 30 kWh/(m²·rok)
```

Odpovídá nejúspornější čtvrtině (P25) reálně naměřené spotřeby ve skladových a
logistických halách portfolia Panattoni (N=35, 2023–2024) — je to tedy reálný,
dosažitelný cíl, ne teoretické minimum. Podrobnosti a zdroje viz
[`Methodology.tsx`](src/components/Methodology.tsx) v aplikaci.

## 5. Rozdíl ve spotřebě

```
deltaKwh = (currentPneKwhM2 − referencePneKwhM2) × areaM2
```

Celkový roční rozdíl ve spotřebě energie mezi současným stavem a referenční hodnotou,
v kWh za celou budovu.

## 6. Smíšená cena a emisní faktor

Protože ELE a plyn mají různou cenu i emisní faktor, spočítá se jejich vážený průměr
podle aktuálního poměru ELE/plyn v zadané spotřebě:

```
priceBlend = (eleKwhM2 × elePriceEurKwh + gasKwhM2 × gasPriceEurKwh) / currentPneKwhM2
co2Blend   = (eleKwhM2 × eleCo2TPerKwh  + gasKwhM2 × gasCo2TPerKwh)  / currentPneKwhM2
```

Výchozí hodnoty (`data/config.json`, reálné sazby portfolia Panattoni 2024):

| Konstanta | Hodnota | Význam |
|---|---|---|
| `elePriceEurKwh` | 0,09 € | cena elektřiny za kWh |
| `gasPriceEurKwh` | 0,042 € | cena plynu za kWh |
| `eleCo2TPerKwh` | 0,00036 t | emisní faktor ELE (ČR mix, ERÚ/ČHMÚ) |
| `gasCo2TPerKwh` | 0,000202 t | emisní faktor plynu (MPO/IPCC) |

## 7. Výsledky

```
annualSavingsEur      = round( deltaKwh × priceBlend )
annualSavingsEurPerM2 = deltaKwh × priceBlend / areaM2   // = (currentPneKwhM2 − referencePneKwhM2) × priceBlend
annualCo2SavingsT     = round( deltaKwh × co2Blend )
annualSavingsMwh      = round( deltaKwh / 1000 )
reductionPct          = round( (1 − referencePneKwhM2 / currentPneKwhM2) × 100 )

fiveYearSavingsEur    = annualSavingsEur × 5
```

`annualSavingsEurPerM2` je nezávislý na ploše (`areaM2` se v jeho výrazu vykrátí) —
je to čistě „o kolik € na m² ročně přijdete tím, že budova spotřebovává víc než
referenční hodnota". Pětiletá úspora je prostý násobek roční úspory (bez
diskontování, bez predikce vývoje cen energií — jde o ilustrativní, ne finanční
projekci).

## Shrnutí jako jeden výpočet

Pro rychlou orientaci, celý výpočet roční úspory v jednom výrazu:

```
úspora [€/rok] = (spotřeba_ELE + spotřeba_plyn − 30) × plocha × smíšená_cena
```

kde `smíšená_cena` je vážený průměr cen ELE a plynu podle jejich podílu na aktuální
spotřebě.

## Kde se dají hodnoty měnit

Všechny konstanty v krocích 2, 4 a 6 (ceny, emisní faktory, mix, referenční hodnota,
výchozí odhady po třídách) se dají upravovat bez zásahu do kódu přes list `Config`
v napojeném Google Sheetu — viz [README.md](README.md#napojení-na-google-sheet-živá-data).
Bez napojeného sheetu se použijí hodnoty z `data/config.json`.
