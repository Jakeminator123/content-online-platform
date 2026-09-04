# Besluts- och faktalogg

**Version:** 0.1
**Senast uppdaterad:** 2026-09-04

Loggen skiljer mellan bekräftad verksamhetsinformation, arbetsbeslut och sådant som fortfarande kräver verifiering.

## Bekräftat 2026-09-04

| ID | Uppgift eller beslut | Status |
|---|---|---|
| `FACT-001` | IEEE, SAE och ASTM är publishers/partners. Universitet, myndigheter och företag är kundorganisationer. | Bekräftat av användaren |
| `FACT-002` | `HSAE` bedöms vara en transkriptionsmiss för SAE International. | Sannolikt, slutlig namnkontroll kvar |
| `FACT-003` | IEEE har störst andel och använder MPS som konverterings-/statistikverktyg. Andra publishers kan ha annat verktyg, annat format eller inget motsvarande verktyg. | Bekräftat som verksamhetsbild |
| `DEC-001` | Content Online-backenden får ett eget källneutralt usage-konverteringslager: IEEE/MPS-adapter först och separat importväg per faktisk publisherkälla. Ingen gemensam extern standard antas. | Arbetsbeslut |
| `DEC-002` | Första pilotpersonan är en bibliotekarie på KTH. | Arbetsbeslut |
| `DEC-003` | Själva innehållet ligger kvar på publisherplattformarna. Content Online-portalen samlar översikt, statistik och arbetsflöden. | Bekräftat |
| `DEC-004` | Kostnad per download är fast avtalat pris för samma produkt och period dividerat med ett godkänt download-mått. Paket utan beslutad allokering visas på paketnivå. | Fast pris bekräftat av användaren; valuta, moms/krediter och download-definition öppna |
| `DEC-005` | Statistik får ha värdeskapande standardvyer, men får inte ljuga eller bli missvisande. Filter, period, källa och beräkning ska vara synliga. | Produktprincip |
| `FACT-004` | Mycket information finns i Salesforce och annan relevant information i Fortnox. | Bekräftat på systemnivå, fältnivå öppen |
| `DEC-006` | Accessändringar skapar tills vidare en ticket. Portalen provisionerar inte publisheraccess automatiskt. | Arbetsbeslut |
| `DEC-007` | Juridiskt bindande renewal-bekräftelse skjuts upp. | Avgränsning |
| `FACT-005` | Presentationens logotyper, citat, effekttal och tidslinje uppges vara godkända/verkliga. | Bekräftat av användaren, specifika belägg bör arkiveras senare |
| `DEC-008` | Projektets GitHub-repository ska vara publikt och heta `Jakeminator123/content-online-platform`. | Genomfört 2026-09-04 |
| `FACT-006` | IEEE:s officiella material bekräftar COUNTER R5.1 via MPS och SUSHI-stöd; kundrapporter kräver behörig åtkomst. | Offentligt verifierat 2026-09-04 |
| `FACT-007` | Externa tekniska kataloger kan beskriva underleverantörer på annat sätt än Content Onlines verksamhetsmodell. De får inte användas för att anta ett verktyg eller en standard för en publisher. | Källprincip |
| `DEC-009` | Officiella COUNTER R5.1-exempel kan användas som tekniska IEEE/MPS-liknande demo-fixtures efter villkorskontroll. De är inte en gemensam publisherstandard och får inte beskrivas som KTH- eller livedata. | Arbetsbeslut |
| `DEC-010` | Vercel är villkorad kandidat för demo/låg-risk-pilot på minst Pro. Full EU-residency eller reglerad produktion är inte godkänd. | Teknikbedömning, inte driftgodkännande |
| `DEC-011` | Ett Vercel-projekt skapas först när en körbar backend/API-tjänst finns och demo-/pilotnivå är vald. | Arbetsbeslut |
| `DEC-012` | Kundportalen har två kundroller: Kundadmin och Läsare. Bibliotekarien är Kundadmin. Content Online-operatör är en separat intern säkerhetsdomän. | Arbetsbeslut |
| `DEC-013` | Detta repo äger backend, auth-/användarmodell, tenantisolering, API-kontrakt, integrationer och tester. Frontend byggs separat och kopplas in senare. | Bekräftad leveransgräns |

## Kräver nästa verifiering

- Exakt lista över publishers och deras usageverktyg.
- MPS Insights API/export, credentials, kund-ID och datarättigheter.
- Exakt download-definition, valuta-, moms-, kredit- och paketregler för CPD. Fast pris är vald kostnadsgrund.
- Vilka Salesforce- respektive Fortnoxfält som ska visas.
- Vilka öppna källor som får användas i en extern demo.
- KTH-personans exakta behov och om verklig KTH-data eller en syntetisk KTH-lik organisation ska användas.
- B2B-loginmetod, medlemslivscykel och detaljerade rollrättigheter.
- Godkänt hosting-, region- och säkerhetsupplägg.
