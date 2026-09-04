# Besluts- och faktalogg

**Version:** 0.1
**Senast uppdaterad:** 2026-09-04

Loggen skiljer mellan bekräftad verksamhetsinformation, arbetsbeslut och sådant som fortfarande kräver verifiering.

## Bekräftat 2026-09-04

| ID | Uppgift eller beslut | Status |
|---|---|---|
| `FACT-001` | IEEE, SAE och ASTM är publishers/partners. Universitet, myndigheter och företag är kundorganisationer. | Bekräftat av användaren |
| `FACT-002` | `HSAE` bedöms vara en transkriptionsmiss för SAE International. | Sannolikt, slutlig namnkontroll kvar |
| `FACT-003` | Publishers har olika verktyg för usage. IEEE har störst andel och använder MPS Insight. | Bekräftat som verksamhetsbild |
| `DEC-001` | Ett centralt delmål är ett gemensamt konverterings- och visualiseringslager ovanpå MPS Insight samt en separat adapter per publisher/partner. | Arbetsbeslut |
| `DEC-002` | Första pilotpersonan är en bibliotekarie på KTH. | Arbetsbeslut |
| `DEC-003` | Själva innehållet ligger kvar på publisherplattformarna. Content Online-portalen samlar översikt, statistik och arbetsflöden. | Bekräftat |
| `DEC-004` | Kostnad per download är en prioriterad KPI tillsammans med användning i stort. | Arbetsbeslut, formel öppen |
| `DEC-005` | Statistik får ha värdeskapande standardvyer, men får inte ljuga eller bli missvisande. Filter, period, källa och beräkning ska vara synliga. | Produktprincip |
| `FACT-004` | Mycket information finns i Salesforce och annan relevant information i Fortnox. | Bekräftat på systemnivå, fältnivå öppen |
| `DEC-006` | Accessändringar skapar tills vidare en ticket. Portalen provisionerar inte publisheraccess automatiskt. | Arbetsbeslut |
| `DEC-007` | Juridiskt bindande renewal-bekräftelse skjuts upp. | Avgränsning |
| `FACT-005` | Presentationens logotyper, citat, effekttal och tidslinje uppges vara godkända/verkliga. | Bekräftat av användaren, specifika belägg bör arkiveras senare |
| `DEC-008` | Projektets GitHub-repository ska vara publikt och heta `Jakeminator123/content-online-platform`. | Genomfört 2026-09-04 |

## Kräver nästa verifiering

- Exakt lista över publishers och deras usageverktyg.
- MPS Insights API/export, credentials, kund-ID och datarättigheter.
- Formel och kostnadsgrund för kostnad per download.
- Vilka Salesforce- respektive Fortnoxfält som ska visas.
- Vilka öppna källor som får användas i en extern demo.
- KTH-personans exakta behov och om verklig KTH-data eller en syntetisk KTH-lik organisation ska användas.
- B2B-inloggning, medlemskap och roller.
- Godkänt hosting-, region- och säkerhetsupplägg.
