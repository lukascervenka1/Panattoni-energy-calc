import type { PenbUploadError } from "./penbUpload";

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
  penb: {
    dropTitle: string;
    dropTitleActive: string;
    choose: string;
    dropHint: string;
    consent: string;
    consentNeeded: string;
    reading: string;
    successTitle: string;
    area: string;
    ele: string;
    gas: string;
    replace: string;
    orPickClass: string;
    /** Shown only when the certificate's figures didn't add up to its own total. */
    unverified: string;
    errors: Record<PenbUploadError | "network", string>;
  };
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
    costNeutralEyebrow: string;
    costNeutralNote: string;
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
    step2Label: "Neznáte spotřebu? Nahrajte průkaz PENB",
    classHelper:
      "Zvolením třídy PENB doplníme odhad spotřeby do polí výše. Pokud znáte skutečné hodnoty z vyúčtování, zadejte je raději přímo.",
    penb: {
      dropTitle: "Přetáhněte sem průkaz PENB",
      dropTitleActive: "Pusťte soubor sem",
      choose: "Vybrat soubor",
      dropHint: "PDF do 4 MB. Plochu i spotřebu z něj doplníme za vás.",
      consent:
        "Souhlasím, aby si Panattoni nahraný průkaz uložila a využila jej pro tento výpočet a pro anonymní srovnání energetické náročnosti budov.",
      consentNeeded: "Pro nahrání průkazu prosím potvrďte souhlas.",
      reading: "Čteme průkaz…",
      successTitle: "Hodnoty z průkazu jsme doplnili do polí výše",
      area: "Plocha",
      ele: "Elektřina",
      gas: "Plyn",
      replace: "Nahrát jiný průkaz",
      orPickClass: "nebo vyberte jen třídu PENB",
      unverified:
        "Některá čísla se nepodařilo ověřit proti součtu v průkazu — zkontrolujte je prosím.",
      errors: {
        forbidden: "Nahrání se nezdařilo. Obnovte prosím stránku a zkuste to znovu.",
        rate_limited: "Příliš mnoho pokusů za krátkou dobu. Zkuste to prosím za pár minut.",
        consent_required: "Pro nahrání průkazu prosím potvrďte souhlas.",
        missing_file: "Soubor se nepodařilo načíst. Zkuste to prosím znovu.",
        too_large:
          "Soubor je větší než 4 MB. Zkuste nahrát jen protokol průkazu, nebo zadejte hodnoty ručně.",
        not_pdf: "Nahrajte prosím průkaz ve formátu PDF.",
        unreadable: "Soubor se nepodařilo otevřít. Zkuste jiné PDF, nebo zadejte hodnoty ručně.",
        no_text:
          "Průkaz je zřejmě naskenovaný, takže z něj čísla neumíme přečíst. Zadejte je prosím ručně.",
        not_penb: "Tohle nevypadá jako průkaz energetické náročnosti budovy.",
        no_values:
          "Průkaz jsme přijali, ale spotřebu se z něj nepodařilo přečíst. Zadejte ji prosím ručně.",
        server: "Něco se pokazilo na naší straně. Zkuste to prosím znovu.",
        network: "Nepodařilo se spojit se serverem. Zkontrolujte připojení a zkuste to znovu.",
      },
    },
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
      costNeutralEyebrow: "Patříte mezi nejúspornější haly na trhu",
      costNeutralNote:
        "Vaše spotřeba na m² je už dnes výrazně pod běžným standardem. Ozvěte se nám — probereme, jak si tenhle náskok udržet i do budoucna.",
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
    step2Label: "Don't know your consumption? Upload your PENB certificate",
    classHelper:
      "Picking a PENB class fills the fields above with an estimate. If you know the actual figures from your bills, enter those instead.",
    penb: {
      dropTitle: "Drop your PENB certificate here",
      dropTitleActive: "Release to upload",
      choose: "Choose file",
      dropHint: "PDF up to 4 MB. We'll fill in the area and consumption for you.",
      consent:
        "I agree that Panattoni may store the uploaded certificate and use it for this calculation and for anonymous benchmarking of building energy performance.",
      consentNeeded: "Please confirm your consent to upload the certificate.",
      reading: "Reading certificate…",
      successTitle: "We've filled in the fields above from your certificate",
      area: "Area",
      ele: "Electricity",
      gas: "Gas",
      replace: "Upload a different certificate",
      orPickClass: "or just pick a PENB class",
      unverified:
        "Some figures couldn't be checked against the certificate's own total — please review them.",
      errors: {
        forbidden: "The upload failed. Please reload the page and try again.",
        rate_limited: "Too many attempts in a short time. Please try again in a few minutes.",
        consent_required: "Please confirm your consent to upload the certificate.",
        missing_file: "The file couldn't be read. Please try again.",
        too_large:
          "The file is larger than 4 MB. Try uploading just the certificate protocol, or enter the values manually.",
        not_pdf: "Please upload the certificate as a PDF.",
        unreadable: "The file couldn't be opened. Try another PDF, or enter the values manually.",
        no_text:
          "The certificate appears to be a scan, so we can't read the figures from it. Please enter them manually.",
        not_penb: "This doesn't look like a building energy performance certificate (PENB).",
        no_values:
          "We received the certificate but couldn't read the consumption from it. Please enter it manually.",
        server: "Something went wrong on our side. Please try again.",
        network: "Couldn't reach the server. Check your connection and try again.",
      },
    },
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
      costNeutralEyebrow: "You're already among the most efficient",
      costNeutralNote:
        "Your consumption per m² is already well below the market standard. Get in touch — we'll talk through how to keep that edge going forward.",
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
