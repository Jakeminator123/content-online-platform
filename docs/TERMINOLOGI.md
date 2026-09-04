# Terminologi

**Version:** 0.2
**Status:** Levande arbetsdokument

Syftet är att ge verksamhet, design och kod samma språk. Termer med status **Öppet** får inte användas som om deras innebörd vore beslutad.

## Parter och användare

| Term | Arbetsdefinition | Status eller fråga |
|---|---|---|
| **Content Online (CO)** | Uppdragsgivaren. Säljer informationsprodukter och standarder från publishers på vissa europeiska marknader och hanterar kundrelationen. | Bekräftat. Exakt benämning på den kommersiella rollen ska bekräftas. |
| **Publisher** | Organisation som ger ut eller tillhandahåller forskningsinformation, standarder, databaser eller relaterade tjänster. IEEE, SAE och ASTM förekommer i underlagen. | Bekräftad partstyp. Använd hellre `publisher` än svenska `publicist`, som lätt misstolkas. |
| **Partner** | Publisher som Content Online representerar eller samarbetar med. I tekniska namn används partner för publisher-specifika adapters och datakopplingar. | Bekräftat som användbar projektterm. Exakt avtalsroll kan variera. |
| **Principal / huvudman** | Möjlig term för en publisher som Content Online representerar kommersiellt. | Öppet. Ska inte användas externt innan avtalsrollen är bekräftad. |
| **Kundorganisation** | Organisation som köper via Content Online, exempelvis ett universitet, en myndighet eller ett forskningsintensivt företag. | Bekräftat. |
| **Kundperson** | En användare eller kontakt hos kundorganisationen, exempelvis bibliotekarie, inköpare eller FoU-ansvarig. | Bekräftat på personnivå, behörigheter öppna. |
| **Tenant** | Den tekniska säkerhetsgräns som normalt motsvarar en kundorganisation och dess data. | Föreslaget. Konsortier och organisationshierarkier måste utredas. |
| **Content Online-medarbetare** | Intern användare som arbetar med kund, försäljning, förnyelse, access eller support. | Källuppgift. Roller och rättigheter öppna. |
| **Pilotpersona: KTH-bibliotekarie** | Första representativa användaren är en bibliotekarie på KTH som behöver förstå organisationens portfölj och användning. | Bekräftad arbetsriktning. Verklig pilotorganisation och dataåtkomst återstår. |

## Namngivna organisationer och system

| Term | Arbetsdefinition | Status eller fråga |
|---|---|---|
| **IEEE** | Amerikansk non-profit-organisation och central publisher/informationsleverantör i Content Onlines affär. | Bekräftat på övergripande nivå. Exakt produktportfölj och avtalsrelation öppna. |
| **SAE / HSAE** | Underlagen innehåller både `SAE` och det transkriberade `HSAE`. Trolig avsedd part är SAE, men detta får inte antas i avtal, data eller UI. | Måste bekräftas. |
| **ASTM** | Amerikansk organisation som tillhandahåller tekniska standarder och nämns som central publisher. | Bekräftat på övergripande nivå. Exakt produktportfölj och avtalsrelation öppna. |
| **MPS Insight** | Statistikplattform som IEEE använder för usage-data. MPS Insight är första och största integrationsspåret, men används inte av övriga publishers enligt nuvarande uppgift. | Bekräftad arbetsbild. Exakt API/export och behörighetsmodell ska verifieras. |
| **Salesforce** | Ett av Content Onlines centrala affärssystem där mycket kund- och abonnemangsrelaterad information finns. | Bekräftat på övergripande nivå. Objekt, fält och dataägarskap ska verifieras. |
| **Fortnox** | Ekonomisystem som innehåller delar av den relevanta affärsinformationen, exempelvis fakturarelaterad data. | Bekräftat på övergripande nivå. Exakta datatyper och integrationsbehov är öppna. |
| **GitHub** | Versionshantering, samarbete och framtida CI. | Publikt repository anslutet: `Jakeminator123/content-online-platform`. |
| **Vercel** | Kandidat för preview- och produktionshosting av en webbapplikation. | Föreslaget. Måste prövas mot säkerhet, region, kundkrav och vald arkitektur. |

## Produkt och affär

| Term | Arbetsdefinition | Status eller fråga |
|---|---|---|
| **Informationsprodukt** | Säljbar produkt eller tjänst som ger tillgång till forskningsinformation, standarder, databaser eller annat publisherinnehåll. | Föreslagen samlingsterm. Bekräfta Content Onlines eget språk. |
| **Customer platform / kundplattform** | Hela Content Online-tjänsten för samlad kundadministration, insikt och arbetsflöden. | Bekräftad produktidé. Exakt gräns mot publisherplattformarna öppen. |
| **Customer portal / kundportal** | Den inloggade yta där en kundperson använder plattformens funktioner. | Bekräftad produktidé. |
| **Admin view** | Intern vy där behöriga Content Online-medarbetare hanterar kunder, data eller ärenden. | Förekommer i presentationen. V1-scope och roller öppna. |
| **Forskningsdata** | Ordet används i transkriptet för det kunderna hämtar. Det kan avse publikationer, databaser, standarder eller faktisk forskningsdata. | Öppet och risk för missförstånd. Ska delas upp i korrekta innehållstyper. |
| **Standard** | Normativt tekniskt dokument eller standardprodukt från en standardiseringsorganisation. | Bekräftat som produktkategori. |
| **Abonnemang / subscription** | Kundorganisationens tidsbundna rätt att använda en informationsprodukt enligt ett avtal. | Källuppgift. Exakt relation mellan order, licens och subscription öppna. |
| **Entitlement / nyttjanderätt** | Den konkreta rätt en organisation har till en produkt, period, accessmetod och eventuell kvantitet. | Föreslagen domänterm utifrån presentationens abonnemangsvy. |
| **Subscription portfolio** | Kundorganisationens samlade abonnemang och nyttjanderätter. | Term från presentationen. Svensk UI-term ska beslutas. |
| **Avtal / licence agreement** | Juridiskt eller kommersiellt dokument som reglerar köp och användning. | Källuppgift. Dokumenttyper och lagringsplats öppna. |
| **Renewal / förnyelse** | Processen där ett abonnemang omprövas, offereras, godkänns och förlängs eller avslutas. | Källuppgift. Livscykel, ansvar och statusar måste beskrivas. |
| **Renewal workspace** | Samlad yta för datum, dokument, påminnelser, dialog och eventuellt godkännande av en förnyelse. | Produktidé från presentationen. Juridisk betydelse och systemkoppling öppna. |
| **Prestanda / performance** | Hur väl en köpt resurs skapar värde. Kan omfatta usage, trend, kostnad per användning, tillgänglighet eller måluppfyllelse. | Öppet. Får inte reduceras till en enda KPI innan Content Online definierat värdet. |
| **Rekommendation** | Databaserat förslag om relevant kompletterande köp, förnyelse eller åtgärd. | Önskat framtida värde. Förklaringskrav, datagrund och V1-prioritet öppna. |
| **Add-on / package offer** | Kompletterande produkt eller paketerat erbjudande kopplat till kundens portfölj eller behov. | Produktidé från presentationen. Affärsregler öppna. |
| **Stickiness / kundlojalitet** | Affärsmål att göra Content Online mer värdefullt och svårare att ersätta genom en bättre kundupplevelse. | Affärsuttryck, inte ett direkt mätbart produktkrav. Behöver KPI. |

## Identitet och access

| Term | Arbetsdefinition | Status eller fråga |
|---|---|---|
| **Portalautentisering** | Hur en person loggar in i Content Onlines kundplattform och kopplas till rätt organisation och roll. | Måste hållas separat från innehållsaccess. Lösning öppen. |
| **Portalauthorisering** | Serverns beslut om vilken organisationsdata och vilka funktioner en autentiserad person får använda. | Grundkrav. |
| **Innehållsaccess** | Hur en kundorganisation eller användare får tillgång till en köpt produkt hos publishern. | Bekräftat behov, separat från portalinloggning. |
| **Accessmetod** | Mekanism för innehållsaccess, exempelvis IP-intervall, Shibboleth, OpenAthens eller named users. | Källuppgift. Varierar per publisher och produkt. |
| **IP-access / IP-intervall** | Publishern tillåter åtkomst från registrerade nätverksadresser. | Källuppgift. |
| **Shibboleth** | Federerad identitetslösning som kan användas för åtkomst till publisherinnehåll. | Källuppgift. Ska inte automatiskt antas vara portalens login. |
| **OpenAthens** | Federerad accesslösning som kan ge användare tillgång till externa informationsresurser. | Källuppgift. Ska inte automatiskt antas vara portalens login. |
| **Named user** | Access som knyts till en särskild användaridentitet hos en publisher. | Källuppgift. |
| **Seat / token model** | Kvantitets- eller konsumtionsmodell för en viss produkt, exempelvis antal användarplatser eller tokens. | Förekommer i presentationen. Betydelse varierar per produkt. |
| **Membership / medlemskap** | Kopplingen mellan en portalidentitet, en kundorganisation och en roll. | Föreslagen domänterm. |
| **Tenant-isolering** | Garantin att en användare aldrig kan läsa eller ändra en annan kundorganisations data. | Säkerhetskritiskt grundkrav. |

## Usage, data och integration

| Term | Arbetsdefinition | Status eller fråga |
|---|---|---|
| **Usage / användningsdata** | Mätdata om hur en informationsprodukt används under en period. | Bekräftat behov. Mätetal, granularitet och rättigheter öppna. |
| **Usage intelligence** | Tolkad användningsbild som hjälper kunden förstå trend, avvikelse eller åtgärdsbehov. | Produktidé från presentationen. Kräver definierade mätetal och beslut. |
| **Publisherverktyg för usage** | Den lösning som en publisher använder för att tillhandahålla eller visualisera sin användningsstatistik. Olika publishers kan ha olika verktyg, API:er och exportformat. | Bekräftad domänförutsättning. Inventering per publisher krävs. |
| **Usage Conversion Layer / usage-konverteringslager** | Plattformskomponenten ovanpå MPS Insight och andra publisherkällor som validerar, översätter och märker data innan den visas i ett gemensamt format. | Bekräftat delmål. Arbetsnamn. |
| **Publisheradapter / partneradapter** | En separat koppling för en publisher som läser dess API eller filformat och översätter till den gemensamma usage-modellen utan att tappa källans betydelse. | Bekräftad arkitekturriktning. |
| **Gemensam usage-modell** | Intern modell för de fält och mätetal som kan jämföras eller visas gemensamt, med bevarad källa och definition. | Bekräftad arkitekturriktning. |
| **Kostnad per download (CPD)** | Avtalskostnad dividerad med ett tydligt definierat antal downloads för samma produkt och period. | Prioriterad KPI. Förkortning, kostnadsgrund, valuta, period och download-definition ska bekräftas. |
| **Förinställd statistikvy** | Ett valt standardfilter eller en standardjämförelse som hjälper kunden se relevant värde direkt. | Tillåten produktprincip om urvalet är sakligt, transparent och inte vilseleder. |
| **Öppna källor** | Publikt tillgängliga API-dokument, standarder, demodata eller andra lagligt användbara källor som kan driva en trovärdig demo utan riktiga kunddata. | Ska skiljas från `open source software` och från fritt återanvändbart publisherinnehåll. |
| **COUNTER** | Branschstandard för jämförbar användningsrapportering av elektroniska informationsresurser. | Källuppgift. Version och stödda rapporter ska verifieras per datakälla. |
| **SUSHI / COUNTER API** | Maskinellt gränssnitt för att hämta COUNTER-rapporter. | Källuppgift. Exakt endpoint och autentisering ska verifieras. |
| **Usage metric** | Namngivet mätetal, exempelvis requests, investigations, searches eller turnaways. | Föreslaget. Produktbetydelsen måste beskrivas per mätetal. |
| **Rådata** | Data i källsystemets ursprungliga format innan validering och normalisering. | Föreslaget. Lagringsrätt och retention öppna. |
| **Normaliserad usage** | Intern, versionshanterad modell som gör olika källors mätetal jämförbara utan att dölja deras ursprung. | Föreslagen kärnprincip. |
| **Datakälla / provider** | Externt system eller filflöde som levererar data till plattformen. | Föreslagen samlingsterm. |
| **Adapter** | Avgränsad kod som översätter mellan en extern källa och plattformens interna kontrakt. | Föreslagen arkitekturterm. |
| **System of record** | Det system som äger den auktoritativa versionen av en viss uppgift. | Måste beslutas separat för kund, avtal, renewal, ärende och dokument. |
| **Provenance / dataursprung** | Metadata som visar vilken källa, post, import och tidpunkt en uppgift kommer från. | Föreslaget spårbarhetskrav. |
| **Data freshness / aktualitet** | Hur gammal informationen är i förhållande till källan och överenskommen uppdateringsfrekvens. | Föreslaget produkt- och driftmått. |
| **SyncRun / synkkörning** | Spårbar import eller synk med start, slut, källa, resultat, varningar och fel. | Föreslagen domänterm. |
| **Idempotent import** | Samma källdata kan importeras igen utan oavsiktliga dubbletter eller ändrat resultat. | Föreslaget regressionskrav. |
| **Writeback** | När portalen skriver ett ärende, en status eller annan ändring tillbaka till ett externt system. | Öppet för V1. Ägarskap och konfliktregler krävs. |
| **Ticket** | Spårbar begäran om accessändring eller support. I första versionen registrerar portalen en ticket i stället för att automatiskt provisionera access hos publishern. | Bekräftad V1-riktning. |
| **Audit-händelse** | Oföränderlig eller skyddad loggpost som visar en viktig åtkomst eller förändring. | Föreslaget säkerhets- och spårbarhetskrav. |
| **Document vault / dokumentyta** | Sökbar, behörighetsstyrd yta för avtal, fakturor, rapporter, produktmaterial och utbildning. | Produktidé från presentationen. Källsystem, rättigheter och retention öppna. |
| **Support center** | Kundens yta för frågor, ärenden, status och historik. | Produktidé från presentationen. Integration eller ny funktion är öppet. |

## Leveransnivåer

| Term | Arbetsdefinition | Status eller fråga |
|---|---|---|
| **Demo / mock** | Körbar produktbild med syntetisk eller lokal data och utan påstådd liveintegration. | Rekommenderad tidig leveransnivå. |
| **MVP** | Minsta produktomfattning som prövar verkligt kundvärde. | Betydelsen måste godkännas; får inte automatiskt likställas med produktion. |
| **V1 / produktionspilot** | Första produktionssatta versionen för en riktig pilotkund, med beslutad säkerhet och verklig dataväg. | Föreslagen definition. Scope öppet. |

## Språkregler tills vidare

- Använd **publisher** när det är viktigt att skilja innehållsleverantören från Content Onlines kundorganisation.
- Använd **kundorganisation** för den köpande organisationen och **kundperson** för en individ.
- Skriv **portalautentisering** och **innehållsaccess** som två olika begrepp.
- Skriv **usage/användningsdata** med namngivet mätetal i stället för det odefinierade ordet **prestanda**.
- Märk varje ännu obekräftad teknisk eller kommersiell uppgift som **Källuppgift**, **Föreslaget** eller **Öppet**.
