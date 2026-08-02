export type Locale = "cs" | "en";

export const LOCALES: Locale[] = ["cs", "en"];

export interface Translations {
  htmlLang: string;
  hero: {
    navLabel: string;
    title: string;
    subtitle: string;
  };
  step1Label: string;
  step2Label: string;
  sliders: {
    area: string;
    ele: string;
    gas: string;
    helper: string;
  };
  results: {
    optimalEyebrow: string;
    optimalConsumptionPrefix: string;
    optimalConsumptionSuffix: string;
    eyebrow: string;
    reductionSuffix: string;
    perM2Label: string;
    year1Label: string;
    year5Label: string;
    consumptionPrefix: string;
    savingsInfix: string;
    perYear: string;
  };
  kpi: {
    co2Label: string;
    co2Unit: string;
  };
  cta: {
    title: string;
    subtitle: string;
    button: string;
  };
  modal: {
    title: string;
    close: string;
  };
  buildingsTable: {
    toggle: string;
    colPark: string;
    colYear: string;
    colClass: string;
    colKwh: string;
    colArea: string;
    footnote: string;
    categories: Record<string, string>;
  };
  methodology: {
    toggle: string;
    referenceLabel: string;
    referenceText: string;
    classEstimateLabel: string;
    classEstimateText: string;
    yearBuiltLabel: string;
    yearBuiltNot: string;
    yearBuiltText: string;
    pricesLabel: string;
    pricesMidText: string;
    pricesTailText: string;
    disclaimer: string;
  };
  footer: {
    credibility: string;
    address: string;
    website: string;
    websiteUrl: string;
    copyright: string;
  };
}

export const translations: Record<Locale, Translations> = {
  cs: {
    htmlLang: "cs",
    hero: {
      navLabel: "Kalkulačka energetické úspory",
      title: "Kolik ušetříte v energeticky úspornější hale?",
      subtitle:
        "Zadejte parametry vaší současné budovy a porovnejte roční náklady na energie s nově budovanými halami od Panattoni.",
    },
    step1Label: "Třída PENB vaší stávající budovy",
    step2Label: "Parametry budovy",
    sliders: {
      area: "Pronajatá plocha",
      ele: "Spotřeba ELE",
      gas: "Spotřeba plyn",
      helper:
        "Výchozí hodnoty spotřeby jsou odhad na základě zvolené třídy PENB — pokud znáte skutečnou spotřebu budovy z vyúčtování, upravte posuvníky podle ní pro přesnější výsledek.",
    },
    results: {
      optimalEyebrow: "Vaše budova je na špičkové úrovni",
      optimalConsumptionPrefix: "Spotřeba",
      optimalConsumptionSuffix:
        "kWh/(m²·rok) — srovnatelné s nejúspornější čtvrtinou portfolia Panattoni.",
      eyebrow: "Kolik ušetříte na energiích",
      reductionSuffix: "méně energie než dnes",
      perM2Label: "Úspora na m² / rok",
      year1Label: "Za 1 rok",
      year5Label: "Za 5 let",
      consumptionPrefix: "Spotřeba:",
      savingsInfix: "· úspora",
      perYear: "MWh/rok",
    },
    kpi: {
      co2Label: "Snížení CO₂",
      co2Unit: "t CO₂ / rok",
    },
    cta: {
      title: "Pojďme šetřit energii i peníze",
      subtitle: "Probereme reálnou úsporu pro vaši halu a připravíme nabídku na míru.",
      button: "Kontaktujte nás",
    },
    modal: {
      title: "Spojte se s naším týmem",
      close: "Zavřít",
    },
    buildingsTable: {
      toggle: "Srovnatelné haly v portfoliu Panattoni",
      colPark: "Park / typologie",
      colYear: "Rok dokončení",
      colClass: "Třída",
      colKwh: "kWh/m²",
      colArea: "Plocha m²",
      footnote:
        "Anonymizovaná data z interního portfolia Panattoni. Hodnota kWh/m² je reálná fakturovaná spotřeba elektřiny a plynu za rok 2023–2024, ne hodnota z průkazu energetické náročnosti budovy (PENB). Jména nájemců a SPV nejsou zobrazena.",
      categories: {
        "Sklad & logistika": "Sklad & logistika",
        Výroba: "Výroba",
        "Sklad & výroba": "Sklad & výroba",
      },
    },
    methodology: {
      toggle: "Zdroje a metodika výpočtu",
      referenceLabel: "Referenční hodnota",
      referenceText:
        "odpovídá nejúspornější čtvrtině (P25) měřené spotřeby ve skladových a logistických halách portfolia Panattoni (interní data, N=35 hal, 2023–2024) — reálný, dosažitelný cíl, ne teoretické minimum.",
      classEstimateLabel: "Výchozí odhad spotřeby dle PENB třídy",
      classEstimateText:
        'vychází tam, kde je k dispozici, z mediánu naměřených dat portfolia (třídy B a C, malé vzorky N=4 a N=10). Třídy bez dostatku portfoliových dat (A, D–G) jsou dopočítány odhadem konzistentním s hranicí pro TOP 15 % nejúspornějších budov kategorie „Budova pro výrobu a skladování" (třída C ≤ 143 kWh/(m²·rok)) dle studie TOP 15 % energeticky nejúspornějších budov v ČR (Česká spořitelna / CEVRE Consultants / EnergySim, 2024, finální hybridní metoda, databáze ENEX MPO). Vždy je ale lepší nahradit odhad skutečnou naměřenou spotřebou z vyúčtování.',
      yearBuiltLabel: "Rok výstavby",
      yearBuiltNot: "není",
      yearBuiltText:
        "záměrně vstupem do výpočtu. Stejná studie (str. 30) na reálných datech ověřila, že rok výstavby nekoreluje spolehlivě s energetickou náročností budovy, a EU Taxonomie výslovně nedoporučuje používat jej jako náhradní ukazatel. Naše vlastní portfolio to potvrzuje — bez přímé souvislosti mezi stářím haly a naměřenou spotřebou.",
      pricesLabel: "Ceny energií a emisní faktory:",
      pricesMidText:
        "(reálné průměrné sazby portfolia Panattoni, 2024). Emisní faktory: ELE dle skladby ČR mixu (ERÚ/ČHMÚ, ø 0,36 t/MWh), plyn dle spalování zemního plynu (MPO/IPCC, ø 0,202 t/MWh). Podíl ELE/plyn ve výchozím odhadu spotřeby (",
      pricesTailText:
        ") odpovídá skutečnému mixu naměřenému v portfoliu skladových hal za rok 2024.",
      disclaimer:
        "Tato data slouží jako orientační odhad pro účely prvotní kalkulace. Pro přesnou nabídku vždy kontaktujte svého Panattoni account manažera.",
    },
    footer: {
      credibility:
        "Společnost Panattoni vede v žebříčku nejaktivnějších průmyslových developerů již osmý rok. Za poslední tři roky jsme dodali přes 14 milionů m² plochy dokončených průmyslových prostor za využití kapitálu ve výši cca 8,2 miliardy €.",
      address: "V Celnici 1034/6, 110 00 Praha 1",
      website: "panattonieurope.com",
      websiteUrl: "https://panattonieurope.com/cz-cz",
      copyright: "Kalkulačka slouží pro orientační odhad, nejde o závaznou nabídku.",
    },
  },
  en: {
    htmlLang: "en",
    hero: {
      navLabel: "Energy Savings Calculator",
      title: "How much could you save in a more energy-efficient warehouse?",
      subtitle:
        "Enter your current building's parameters and compare annual energy costs with newly built Panattoni halls.",
    },
    step1Label: "PENB energy class of your current building",
    step2Label: "Building parameters",
    sliders: {
      area: "Leased area",
      ele: "Electricity consumption",
      gas: "Gas consumption",
      helper:
        "Default consumption values are estimated from the selected PENB class — if you know the building's actual consumption from your bills, adjust the sliders accordingly for a more accurate result.",
    },
    results: {
      optimalEyebrow: "Your building is already best-in-class",
      optimalConsumptionPrefix: "Consumption",
      optimalConsumptionSuffix:
        "kWh/(m²·yr) — comparable to the most efficient quartile of the Panattoni portfolio.",
      eyebrow: "How much you'll save on energy",
      reductionSuffix: "less energy than today",
      perM2Label: "Savings per m² / year",
      year1Label: "Year 1",
      year5Label: "Over 5 years",
      consumptionPrefix: "Consumption:",
      savingsInfix: "· savings of",
      perYear: "MWh/yr",
    },
    kpi: {
      co2Label: "CO₂ reduction",
      co2Unit: "t CO₂ / yr",
    },
    cta: {
      title: "Let's start saving energy and money",
      subtitle: "We'll discuss the real savings for your building and prepare a tailored offer.",
      button: "Contact us",
    },
    modal: {
      title: "Get in touch with our team",
      close: "Close",
    },
    buildingsTable: {
      toggle: "Comparable buildings in the Panattoni portfolio",
      colPark: "Park / type",
      colYear: "Completion year",
      colClass: "Class",
      colKwh: "kWh/m²",
      colArea: "Area m²",
      footnote:
        "Anonymized data from Panattoni's internal portfolio. The kWh/m² figure is real billed electricity and gas consumption for 2023–2024, not the value declared on the building's energy performance certificate (PENB). Tenant and SPV names are not shown.",
      categories: {
        "Sklad & logistika": "Warehouse & logistics",
        Výroba: "Manufacturing",
        "Sklad & výroba": "Warehouse & manufacturing",
      },
    },
    methodology: {
      toggle: "Sources & calculation methodology",
      referenceLabel: "Reference value",
      referenceText:
        "corresponds to the most efficient quartile (P25) of measured consumption across warehouse and logistics buildings in the Panattoni portfolio (internal data, N=35 buildings, 2023–2024) — a real, achievable target, not a theoretical minimum.",
      classEstimateLabel: "The default consumption estimate by PENB class",
      classEstimateText:
        'is based, where available, on the median of measured portfolio data (classes B and C, small samples of N=4 and N=10). Classes without sufficient portfolio data (A, D–G) are estimated consistently with the TOP 15 % threshold for the most efficient buildings in the "Production and storage building" category (class C ≤ 143 kWh/(m²·yr)) per the study TOP 15 % Most Energy-Efficient Buildings in the Czech Republic (Česká spořitelna / CEVRE Consultants / EnergySim, 2024, final hybrid method, ENEX MPO database). It is always better to replace the estimate with actual measured consumption from your bills.',
      yearBuiltLabel: "Year of construction",
      yearBuiltNot: "is deliberately not",
      yearBuiltText:
        "used as an input to the calculation. The same study (p. 30) found, using real data, that construction year does not reliably correlate with a building's energy performance, and the EU Taxonomy explicitly advises against using it as a proxy. Our own portfolio confirms this — there is no direct link between a building's age and its measured consumption.",
      pricesLabel: "Energy prices and emission factors:",
      pricesMidText:
        "(real average Panattoni portfolio rates, 2024). Emission factors: electricity based on the Czech grid mix (ERÚ/ČHMÚ, avg. 0.36 t/MWh), gas based on natural gas combustion (MPO/IPCC, avg. 0.202 t/MWh). The electricity/gas split in the default consumption estimate (",
      pricesTailText:
        ") matches the actual mix measured across the warehouse portfolio in 2024.",
      disclaimer:
        "This data serves as an indicative estimate for initial calculation purposes only. For an exact offer, always contact your Panattoni account manager.",
    },
    footer: {
      credibility:
        "Panattoni has ranked among the most active industrial developers for the eighth year running. Over the past three years we've delivered more than 14 million m² of completed industrial space, deploying approximately €8.2 billion in capital.",
      address: "V Celnici 1034/6, 110 00 Prague 1",
      website: "panattonieurope.com",
      websiteUrl: "https://panattonieurope.com/en",
      copyright: "This calculator provides an indicative estimate only and is not a binding offer.",
    },
  },
};
