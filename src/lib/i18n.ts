export type Locale = "cs" | "en";

export const LOCALES: Locale[] = ["cs", "en"];

export interface Translations {
  htmlLang: string;
  hero: {
    navLabel: string;
    title: string;
    subtitle: string;
    scope: string;
  };
  step1Label: string;
  step2Label: string;
  classHelper: string;
  sliders: {
    mwhUnit: string;
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
  benchmarks: {
    title: string;
    subtitle: string;
    unit: string;
    area: string;
    elecShare: string;
  };
  methodology: {
    toggle: string;
    referenceLabel: string;
    referenceText: string;
    classEstimateLabel: string;
    classEstimateText: string;
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
      scope: "Kalkulačka platí pro skladové haly, ne pro výrobní provozy.",
    },
    step1Label: "Parametry budovy",
    step2Label: "Neznáte spotřebu? Vyberte třídu PENB",
    classHelper:
      "Zvolením třídy PENB doplníme odhad spotřeby do polí výše. Pokud znáte skutečné hodnoty z vyúčtování, zadejte je raději přímo.",
    sliders: {
      mwhUnit: "MWh/rok",
      area: "Pronajatá plocha",
      ele: "Spotřeba elektřiny",
      gas: "Spotřeba plynu",
      helper:
        "Hodnoty můžete napsat přímo — spotřebu zadávejte v MWh za rok, tak jak ji najdete na vyúčtování. Pod polem se dopočítá spotřeba na m².",
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
    benchmarks: {
      title: "Naše nejúspornější haly",
      subtitle: "Takhle nízkou spotřebu dnes dosahují skladové haly Panattoni v běžném provozu.",
      unit: "kWh/m²·rok",
      area: "Plocha",
      elecShare: "Podíl elektřiny",
    },
    methodology: {
      toggle: "Zdroje a metodika výpočtu",
      referenceLabel: "Referenční hodnota",
      referenceText:
        "odpovídá nejúspornější čtvrtině měřené spotřeby ve skladových a logistických halách portfolia Panattoni — reálný, dosažitelný cíl, ne teoretické minimum.",
      classEstimateLabel: "Výchozí odhad spotřeby dle PENB třídy",
      classEstimateText:
        'vychází z mediánu naměřených dat portfolia. Třídy bez dostatku portfoliových dat (A, D–G) jsou dopočítány odhadem konzistentním s hranicí pro TOP 15 % nejúspornějších budov kategorie „Budova pro výrobu a skladování" (třída C ≤ 143 kWh/(m²·rok)) dle studie TOP 15 % energeticky nejúspornějších budov v ČR (Česká spořitelna / CEVRE Consultants / EnergySim, 2024, finální hybridní metoda, databáze ENEX MPO). Vždy je ale lepší nahradit odhad skutečnou naměřenou spotřebou z vyúčtování.',
      pricesLabel: "Ceny energií a emisní faktory:",
      pricesMidText:
        "Emisní faktory: ELE dle skladby ČR mixu (ERÚ/ČHMÚ, ø 0,36 t/MWh), plyn dle spalování zemního plynu (MPO/IPCC, ø 0,202 t/MWh). Podíl ELE/plyn ve výchozím odhadu spotřeby (",
      pricesTailText: ") odpovídá skutečnému mixu naměřenému v portfoliu skladových hal.",
      disclaimer:
        "Tato data slouží jako orientační odhad pro účely prvotní kalkulace. Pro přesnou nabídku vždy kontaktujte svého Panattoni account manažera.",
    },
    footer: {
      credibility:
        "Panattoni je největším developerem průmyslových nemovitostí a lídrem v oblasti udržitelné výstavby. Díky své globální působnosti nabízí klientům řešení přesně podle jejich potřeb – od výstavby na míru až po spekulativní projekty.",
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
      scope: "This calculator applies to warehouse halls, not manufacturing facilities.",
    },
    step1Label: "Building parameters",
    step2Label: "Don't know your consumption? Pick your PENB class",
    classHelper:
      "Picking a PENB class fills the fields above with an estimate. If you know the actual figures from your bills, enter those instead.",
    sliders: {
      mwhUnit: "MWh/yr",
      area: "Leased area",
      ele: "Electricity consumption",
      gas: "Gas consumption",
      helper:
        "You can type the values directly — enter consumption in MWh per year, as it appears on your bills. The per-m² figure is calculated below each field.",
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
    benchmarks: {
      title: "Our most efficient halls",
      subtitle: "This is the consumption Panattoni warehouses achieve in everyday operation.",
      unit: "kWh/m²·yr",
      area: "Area",
      elecShare: "Electricity share",
    },
    methodology: {
      toggle: "Sources & calculation methodology",
      referenceLabel: "Reference value",
      referenceText:
        "corresponds to the most efficient quartile of measured consumption across warehouse and logistics buildings in the Panattoni portfolio — a real, achievable target, not a theoretical minimum.",
      classEstimateLabel: "The default consumption estimate by PENB class",
      classEstimateText:
        'is based on the median of measured portfolio data. Classes without sufficient portfolio data (A, D–G) are estimated consistently with the TOP 15 % threshold for the most efficient buildings in the "Production and storage building" category (class C ≤ 143 kWh/(m²·yr)) per the study TOP 15 % Most Energy-Efficient Buildings in the Czech Republic (Česká spořitelna / CEVRE Consultants / EnergySim, 2024, final hybrid method, ENEX MPO database). It is always better to replace the estimate with actual measured consumption from your bills.',
      pricesLabel: "Energy prices and emission factors:",
      pricesMidText:
        "Emission factors: electricity based on the Czech grid mix (ERÚ/ČHMÚ, avg. 0.36 t/MWh), gas based on natural gas combustion (MPO/IPCC, avg. 0.202 t/MWh). The electricity/gas split in the default consumption estimate (",
      pricesTailText: ") matches the actual mix measured across the warehouse portfolio.",
      disclaimer:
        "This data serves as an indicative estimate for initial calculation purposes only. For an exact offer, always contact your Panattoni account manager.",
    },
    footer: {
      // Translated locally from marketing's CZ wording (not yet reviewed by
      // marketing in English) — flag if they want it checked before it ships.
      credibility:
        "Panattoni is the largest developer of industrial real estate and a leader in sustainable construction. With our global reach, we offer clients solutions tailored exactly to their needs – from build-to-suit to speculative projects.",
      address: "V Celnici 1034/6, 110 00 Prague 1",
      website: "panattonieurope.com",
      websiteUrl: "https://panattonieurope.com/en",
      copyright: "This calculator provides an indicative estimate only and is not a binding offer.",
    },
  },
};
