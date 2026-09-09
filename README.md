# Content Online-plattformen

Detta repository är den enda driftauktoriteten för Content Onlines interna
administration och gemensamma kundportal. Samma kodbas och Vercel-projekt driver
en publik ingång, kundinloggning, personaladministration och alla publicerade
kundportaler. En kund är en tenant-konfiguration i registret, inte ett eget
repository eller Vercel-projekt.

**GitHub:** [Jakeminator123/content-online-platform](https://github.com/Jakeminator123/content-online-platform)

Plattformen är en publicerad pilot. KTH är den uttryckligen syntetiska piloten på
`/portal/kth`; dess produkter, användare och mätvärden är presentationsdata.
KTH är inte grundmallen för nya kunder. Nya kundposter får en neutral
standardkonfiguration och delar endast portalruntime och valbar portalprofil med
piloten.
Verklig kundstatistik, publisherdata och andra livekällor är ännu inte anslutna.

## Kanoniska adresser

| Adress | Funktion |
| --- | --- |
| [`/`](https://content-online-platform.vercel.app/) | Publik Content Online-ingång. Kundinloggningen öppnas som en dialog ovanpå sidan. |
| [`/login`](https://content-online-platform.vercel.app/login) | Direkt reservlänk till samma kundinloggning, exempelvis efter en extern omdirigering. |
| [`/registrera`](https://content-online-platform.vercel.app/registrera) | Aktivering av kundkonto för en adress som Content Online har kopplat till en organisation. |
| [`/admin`](https://content-online-platform.vercel.app/admin) | Separat arbetsyta för Content Online-personal. `/admin/login` är dess inloggning. |
| `/portal/{url-namn}` | Den gemensamma, kundanpassade portalruntimen. |

Det finns inga publika `/demo`-rutter eller äldre kompatibilitetsalias i den
kanoniska modellen. Okända adresser ska ge 404 i stället för att öppna en
parallell inloggning eller portal.

En valfri verifierad kunddomän kan peka på samma tenant i samma Vercel-projekt.
Den behövs inte för att publicera kundens `/portal/{url-namn}`-adress.

## Identitet och datagräns

Kundinloggningen använder en gemensam Clerk-identitet och det serverägda
medlemsregistret i Neon. När Content Online lägger till en medlem till en
publicerad kundportal skickar backend en personlig Clerk-inbjudan; fri
registrering utan inbjudan erbjuds inte.
`/v1/portal-entries` returnerar endast publicerade portaler som den verifierade
identiteten har ett aktivt medlemskap i. En slug eller URL ger aldrig behörighet.

Personalinloggningen under `/admin` har en separat kontroll: aktiv Clerk-session,
verifierad primär e-post och Content Onlines serverkonfigurerade allowlist.
Kundmedlemskap, kundcookies och klientmetadata ger inte intern adminbehörighet.

Det beständiga registret lagrar kunder, publicister, portalinställningar,
publiceringsstatus och en minimal medlemsallowlist. Personal kan publicera,
avpublicera och arkivera kundportaler. En arkiverad, icke-syntetisk kund kan
raderas permanent efter uttrycklig bekräftelse; kundsluggen blir då åter
tillgänglig och en minimal audit-händelse bevaras.

KTH är undantaget från riktiga medlemskonton och permanent radering. Andra
kundportaler visar säkra tomlägen tills deras verkliga dataflöden har anslutits.
Publika fixture-rutter är borttagna. Den skyddade adminytan använder samma
beständiga register i samtliga vyer och visar ärliga tomlägen för produktdata,
cronjobb, rapportflöden och externa källor som ännu inte är anslutna.

## Kundportal och D-ID

Alla kunder använder samma portaltemplate med kundens namn, färger, uppladdade
PNG-/JPG-/WebP-logotyp eller publik HTTPS-logotyp,
publicister och valfria domäninställningar. D-ID-agenten hör till kundportalen,
inte personaladministrationen, och laddas först när användaren öppnar den.
Content Online styr hälsning, tonalitet och tillåtna verktyg, men tonaliteten får
aldrig påverka fakta, kostnader, nedgångar eller osäkerhet.

D-ID API-nycklar och Vercel-automationstokens är serverhemligheter. En D-ID
client key är webbläsarkonfiguration och ska begränsas till exakt tillåten origin.
Se [D-ID-dokumentationen](docs/d-id/README.md).

## Produktmål och återstående integrationer

Målet är att ge behöriga personer hos Content Onlines kunder en spårbar bild av
informationsprodukter, användning, förnyelser, dokument och ärenden. MPS är
IEEE:s verktyg för dess siffror; andra publicister kan erbjuda API, filimport
eller inget gemensamt format. Plattformen behöver därför ett källneutralt
konverteringslager och en adapter per verifierad källa.

Följande ska inte beskrivas som live ännu:

- verklig kundstatistik eller verifierade COUNTER-importer;
- automatisk synk från MPS, andra publicister eller affärssystem;
- verkliga kostnader, avtal, förnyelsebeslut eller licensprovisionering;
- produktionsgodkänd kunddrift innan identitetsmiljö, avtal och datakällor har
  verifierats för den berörda kunden.

## Utveckling och verifiering

Kräver Node.js 24 och npm.

```powershell
npm ci
npm run check
```

Lokala och CI-baserade webbläsarkontroller får använda syntetiska fixtures, men
de ska startas av testharnessen och får inte skapa publika `/demo`-endpoints.
GitHub Actions kör typkontroll, regressionstester och isolerade registertester
vid pull requests och push till `main`.

Efter merge ska den stabila produktionsadressen verifieras mot en READY
Vercel-deployment vars Git-SHA är exakt samma som GitHub `main`.

## Dokumentation

- [Portalstruktur och tenantmodell](docs/PORTALSTRUKTUR.md)
- [Aktuell drift och återstående arbete](docs/ADMIN_DRIFT.md)
- [Behörighetsmodell](docs/BEHORIGHETSMODELL.md)
- [Backendens ansvar och frontendkontrakt](docs/BACKEND_ANSVAR.md)
- [Usage-konvertering och datakontrakt](docs/USAGE_KONVERTERING.md)
- [Publisherintegrationer](docs/PUBLISHER_INTEGRATIONER.md)
- [Salesforce-integration](docs/SALESFORCE_INTEGRATION.md)
- [Content Online AI-assistent](docs/AI_ASSISTENT.md)
- [D-ID-agentens portalanslutning](docs/d-id/README.md)
- [Teststrategi](docs/TESTSTRATEGI.md)

## Informationssäkerhet

Repositoryt får inte innehålla credentials, tokens, verkliga kunddata eller
licensierat publisherinnehåll. Exempeldata ska vara helt syntetisk, tydligt märkt
och begränsad till lokala tester, CI och den uttryckliga KTH-piloten.
