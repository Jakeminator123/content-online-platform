# Content Online customer platform

Detta repository är dokumentations- och utvecklingsytan för Content Onlines planerade B2B-kundplattform.

**GitHub:** [Jakeminator123/content-online-platform](https://github.com/Jakeminator123/content-online-platform) (publikt repository)

Projektet befinner sig i behovs-, kontrakts- och tidig backendfas. Den första pilotpersonan är en bibliotekarie på KTH och rollen är Kundadmin. Frontend byggs separat och kopplas in senare. En körbar och testad Hono/TypeScript-backend finns nu med syntetiska data, men ingen databas, autentiseringsleverantör, extern liveintegration eller Vercel-deployment är ännu inkopplad.

## Produktmål

Kundplattformen ska ge behöriga personer hos Content Onlines kunder en samlad och spårbar bild av köpta informationsprodukter, användning, förnyelser, accessinformation, dokument och ärenden. MPS är IEEE:s verktyg för att bearbeta och visa dess siffror. Andra publishers kan ha ett annat verktyg, ett API, en fil eller inget motsvarande verktyg alls; ingen gemensam extern standard antas. Content Online-backenden får därför ett eget källneutralt konverteringslager och en importadapter per verklig källa. Plattformen kompletterar publishernas egna plattformar och återpublicerar inte skyddat innehåll utan uttrycklig rätt.

## Dokumentation

- [Projektbrief](docs/PROJEKTBRIEF.md)
- [Terminologi](docs/TERMINOLOGI.md)
- [Backendens ansvar och frontendkontrakt](docs/BACKEND_ANSVAR.md)
- [Behörighetsmodell](docs/BEHORIGHETSMODELL.md)
- [Usage-konvertering och datakontrakt](docs/USAGE_KONVERTERING.md)
- [Publisherintegrationer och verifieringsmatris](docs/PUBLISHER_INTEGRATIONER.md)
- [Vercel-bedömning för B2B](docs/VERCEL_B2B_BEDOMNING.md)
- [Frågor till uppdragsgivaren](docs/FRAGOR_TILL_UPPDRAGSGIVAREN.md)
- [Besluts- och faktalogg](docs/BESLUTSLOGG.md)
- [Källregister och auktoritet](docs/KALLREGISTER.md)
- [Bottom-up teststrategi](docs/TESTSTRATEGI.md)

## Kör backend lokalt

Kräver Node.js 24 och npm.

```powershell
npm install
npm run check
npm run dev
```

Den lokala demotjänsten binder endast till `127.0.0.1:3000`. OpenAPI-kontraktet finns på `http://127.0.0.1:3000/openapi.json`. Demoidentiteterna och all usage är syntetiska. Produktionsingången i `src/index.ts` är avsiktligt låst och returnerar `503` för skyddade routes tills en riktig B2B-identitetsleverantör har kopplats in.

Nu implementerad API-yta:

```text
GET  /health
GET  /openapi.json
GET  /v1/me
GET  /v1/organizations/{organizationId}/overview
GET  /v1/organizations/{organizationId}/portfolio
GET  /v1/organizations/{organizationId}/usage
GET  /v1/organizations/{organizationId}/tickets
POST /v1/organizations/{organizationId}/tickets
GET  /v1/organizations/{organizationId}/members
```

GitHub Actions kör typkontroll och 19 regressionstester vid push och pull request. Databas, riktig auth, dokument-API, medlemsändringsärenden och externa integrationer är nästa separata leveranssteg.

## Statusord

- **Bekräftat**: uttryckligen uppgett eller godkänt av Content Online i projektets aktuella dialog.
- **Verifierat**: kontrollerat mot ett verkligt system, avtal, API eller representativ data.
- **Källuppgift**: står i ett underlag men är ännu inte godkänt som projektbeslut.
- **Föreslaget**: en möjlig produkt- eller teknikriktning.
- **Öppet**: kräver svar eller beslut.

## Informationssäkerhet

Repositoryt ska inte innehålla credentials, tokens, verkliga kunddata eller licensierat publisherinnehåll. Endast material som hör direkt till uppdraget får påverka kravbilden. Publikt tillhandahållna COUNTER-exempel kan ligga till grund för demo-fixtures när återanvändningsvillkor, ursprung och demo-status framgår.

Eftersom repositoryt är publikt ska även framtida exempeldata vara helt syntetisk och fri från avtals-, kund- och användningsuppgifter som inte redan är avsedda för offentlig publicering.
