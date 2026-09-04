# Terminologi

**Version:** 0.4
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
| **Kundadmin** | Kundrollen för bibliotekarien. Ser hela den tillåtna bilden för sin egen organisation. Ändring av portalmedlem, roll eller publisheraccess begärs via ticket i V1. | Arbetsbeslut. |
| **Läsare** | Begränsad kundroll som ser publicerad portfölj och usage inom sin organisation men inte kostnader, avtal eller andra användares tickets som standard. | Arbetsbeslut; detaljrättigheter kan förfinas. |
| **Content Online-operatör** | Separat intern roll för support, användarärenden, synk, mapping och källkopplingar över uttryckligen tilldelade kundscope. Inte en högre kundroll. | Föreslagen intern modell. |

## Namngivna organisationer och system

| Term | Arbetsdefinition | Status eller fråga |
|---|---|---|
| **IEEE** | Amerikansk non-profit-organisation och central publisher/informationsleverantör i Content Onlines affär. | Bekräftat på övergripande nivå. Exakt produktportfölj och avtalsrelation öppna. |
| **SAE / HSAE** | Underlagen innehåller både `SAE` och det transkriberade `HSAE`. Trolig avsedd part är SAE, men detta får inte antas i avtal, data eller UI. | Måste bekräftas. |
| **ASTM** | Amerikansk organisation som tillhandahåller tekniska standarder och nämns som central publisher. | Bekräftat på övergripande nivå. Exakt produktportfölj och avtalsrelation öppna. |
| **MPS / MPS Insight** | IEEE:s verktyg för att konvertera, bearbeta och visa sina usage-siffror i projektets verksamhetsbild. Det är en IEEE-specifik källa och inte plattformens gemensamma modell. | Bekräftat av uppdragsdialogen. Exakt export/API, credentials och rättigheter ska verifieras. |
| **Salesforce** | Ett av Content Onlines centrala affärssystem där mycket kund- och abonnemangsrelaterad information finns. | Bekräftat på övergripande nivå. Objekt, fält och dataägarskap ska verifieras. |
| **Fortnox** | Ekonomisystem som innehåller delar av den relevanta affärsinformationen, exempelvis fakturarelaterad data. | Bekräftat på övergripande nivå. Exakta datatyper och integrationsbehov är öppna. |
| **GitHub** | Versionshantering, samarbete och framtida CI. | Publikt repository anslutet: `Jakeminator123/content-online-platform`. |
| **Vercel** | Kandidat för hosting av backend/API i detta repo. Frontendens hosting beslutas i det separata frontendspåret. | Villkorad kandidat. Måste prövas mot säkerhet, region, kundkrav och vald arkitektur. |

## Produkt och affär

| Term | Arbetsdefinition | Status eller fråga |
|---|---|---|
| **Informationsprodukt** | Säljbar produkt eller tjänst som ger tillgång till forskningsinformation, standarder, databaser eller annat publisherinnehåll. | Föreslagen samlingsterm. Bekräfta Content Onlines eget språk. |
| **Customer platform / kundplattform** | Hela Content Online-tjänsten för samlad kundadministration, insikt och arbetsflöden. | Bekräftad produktidé. Exakt gräns mot publisherplattformarna öppen. |
| **Customer portal / kundportal** | Den inloggade yta där en kundperson använder plattformens funktioner. | Bekräftad produktidé. |
| **Content Online-operatörsvy** | Separat intern vy där behöriga Content Online-medarbetare arbetar med uttryckligen tilldelade kunder, data eller ärenden. Ska inte sammanblandas med kundens Kundadmin-roll. | Föreslagen ersättning för presentationens tvetydiga `Admin view`. |
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
| **Publisherkälla för usage** | Det som faktiskt finns för en publisher: verktyg, API, fil/export, rapport eller i vissa fall ingen maskinläsbar källa alls. | Bekräftat variationsmönster. Inventering per publisher krävs. |
| **Usage Conversion Layer / usage-konverteringslager** | Backendkomponenten ovanpå MPS Insight och andra publisherkällor som validerar, översätter och märker data innan den returneras genom ett källneutralt API-kontrakt. | Bekräftat delmål. Arbetsnamn. |
| **Publisheradapter / partneradapter** | En separat koppling för en verifierad publisherkälla: API, fil, portalrapport eller kontrollerad manuell import. Den översätter till den interna usage-modellen utan att tappa källans betydelse. Ingen adapter hittas på innan en faktisk källa finns. | Bekräftad arkitekturriktning. |
| **Gemensam usage-modell** | Intern modell för de fält och mätetal som kan jämföras eller visas gemensamt, med bevarad källa och definition. | Bekräftad arkitekturriktning. |
| **Kostnad per download (CPD)** | Fast avtalat pris för samma produkt och period dividerat med ett uttryckligen godkänt antal downloads. Exempel: 100 000 kr / 10 000 downloads = 10 kr per download. | Prioriterad KPI. Fast pris är beslutad kostnadsgrund; valuta, moms, paketallokering och download-definition återstår. |
| **Förinställd statistikvy** | Ett valt standardfilter eller en standardjämförelse som hjälper kunden se relevant värde direkt. | Tillåten produktprincip om urvalet är sakligt, transparent och inte vilseleder. |
| **Öppna källor** | Publikt tillgängliga API-dokument, standarder, demodata eller andra lagligt användbara källor som kan driva en trovärdig demo utan riktiga kunddata. | Ska skiljas från `open source software` och från fritt återanvändbart publisherinnehåll. |
| **COUNTER** | En existerande branschstandard för vissa usage-rapporter. Den kan vara tekniskt relevant för IEEE/MPS eller andra verifierade källor men är inte en bekräftad gemensam standard för Content Onlines publishers. | Verifierad extern möjlighet, inte ett generellt projektantagande. |
| **SUSHI / COUNTER API** | REST-gränssnitt för maskinell hämtning där en källa faktiskt stöder COUNTER. | Möjlig IEEE/MPS-importväg. Får inte antas finnas för andra publishers. |
| **Source-native metric / källmått** | Ett mätetal som bevaras med källans namn och definition när semantisk mappning till ett gemensamt mått saknas. | Föreslagen domänterm. |
| **Comparability key / jämförbarhetsnyckel** | Versionsmärkt markör som anger att två mätetal har tillräckligt lika definition för den uttryckligen tillåtna jämförelsen eller summeringen. | Föreslagen domänterm. |
| **Datatäckning** | Om källdatan för vald period är komplett, partiell eller okänd och till vilket datum den är komplett. | Krävs för sanningsenlig visualisering. |
| **Kostnadsgrund** | Det fasta avtalade priset för samma produkt och period som usage-måttet. | Bekräftat. Moms, krediter, valuta och paket behöver fortfarande exakta regler. |
| **Allokeringsmetod** | Beslutad regel för att fördela en paketkostnad på produkter eller mätetal. | Krävs innan produktspecifik CPD visas för paket. |
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
