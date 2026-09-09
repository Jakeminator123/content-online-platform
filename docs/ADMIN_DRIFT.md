# Content Online-admin och kundportal

Uppdaterad 2026-09-09. Detta dokument beskriver aktuell produktionsmodell och
skiljer levererade funktioner från ännu ej anslutna datakällor.

## En plattform, två behörighetsdomäner

| Del | Primär användare | Ansvar |
| --- | --- | --- |
| Publik ingång och kundinloggning | Kundperson | `/` visar Content Online och öppnar kundlogin som overlay. `/login` är direkt fallback och `/registrera` hanterar kontoaktivering. |
| Kundportal | Kundmedlem | `/portal/{slug}` visar endast den egna organisationens tillåtna portalskal och data. |
| Intern administration | Content Online-personal | `/admin` hanterar kundorganisationer, portalmedlemmar, publicister, publicering och anslutningsstatus. |

Kundadmin är en roll inne i en kundorganisation. Content
Online-administratören är en separat intern roll och blir inte automatiskt
medlem hos någon kund.

Den kanoniska produktionsytan innehåller inga publika `/demo`-rutter,
tenantkataloger eller äldre login-/portalalias. KTH är det enda publika
undantaget: `/portal/kth` är en tydligt märkt syntetisk pilot. Några skyddade
adminvyer använder ännu syntetiska platshållare; de ska ersättas av registerdata
eller ärliga tomlägen och får inte beskrivas som live.

## Levererat

### Ingång och kundidentitet

- `/` är den publika Content Online-ingången och öppnar kundinloggningen i en
  modal utan att skicka användaren till en parallell sajt.
- `/login` erbjuder samma kundflöde som direkt fallback. `/registrera` hanterar
  aktivering av en förregistrerad kundmedlem.
- En verifierad Clerk-session får anropa `/v1/portal-entries`. Servern returnerar
  bara publicerade icke-syntetiska portaler som identiteten har aktivt medlemskap
  i.
- En väntande e-postadress binds vid första godkända inloggningen till Clerks
  stabila användar-ID. En senare användare av samma adress ärver inte rollen.
- Ett konto kan ha medlemskap i flera organisationer. Slug, queryparameter och
  klientval är aldrig behörighetsbevis.
- Kundportalen verifierar samma medlemskap innan den markerar åtkomsten som
  verifierad. Utan medlemskap visas ingen verklig kunddata.

### Intern administration

- `/admin/login` och `/admin/registrera` använder en separat Clerk-konfiguration
  för Content Online-personal.
- Servern kräver aktiv session, icke spärrat konto, verifierad primär e-post och
  matchning mot Content Onlines serverkonfigurerade allowlist.
- Det skyddade registret är beständigt och hanterar kunder, publicister,
  portalinställningar, publiceringsstatus, medlemskap och domänstatus.
- Kundposter kan skapas, ändras, publiceras, avpubliceras och arkiveras.
  Permanent radering kräver en redan arkiverad icke-syntetisk kund och uttrycklig
  bekräftelse; KTH är skyddad.
- Portalmedlemmar hanteras inne i respektive kundorganisation. Det skapar inte
  automatiskt ett Clerk-konto eller någon publisherbehörighet.
- Publicering använder den gemensamma portalruntimen. Den skapar inte ett repo,
  Vercel-projekt eller en deployment per kund.
- Content Onlines interna textassistent är separerad från kundportalens valfria
  D-ID-agent.

### Kundportal

- Samma template används för alla tenants och kan anpassas med namn, färger,
  logotyp, publicister, ingress, valfri domän och D-ID-konfiguration.
- KTH-portalen visar uttryckligt märkt presentationsdata. Den får inte användas
  som fallback för en annan kund.
- Icke-KTH-kunder får ett kundmärkt skal med låsta eller tomma lägen tills deras
  verkliga källor har verifierats.
- D-ID laddas först när användaren öppnar agenten. Agenten får bara använda
  tillåten kundkontext och får inte påverka adminbehörighet.

## Kanoniska adresser

```text
/                    publik landning + kundlogin-overlay
/login               direkt fallback för kundinloggning
/registrera           aktivering av kundkonto
/admin                Content Online-personal
/admin/login          personalinloggning
/portal/{slug}        gemensam tenantportal
/portal/kth           uttryckligen syntetisk KTH-pilot
```

Alla andra tidigare demo- och kompatibilitetsvägar ligger utanför
produktionskontraktet och ska ge 404.

## Konfiguration

Hemligheter och känsliga värden ligger i Vercel eller respektive leverantör,
aldrig i Git.

- `CLERK_SECRET_KEY` och `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` konfigurerar
  identitetsleverantören.
- `CONTENT_ONLINE_ADMIN_EMAIL` är server-only och avgränsar den första interna
  administratören.
- `DID_AGENT_ID` och `DID_CLIENT_KEY` är portalens gemensamma
  webbläsarkonfiguration. Client key ska begränsas till exakt tillåten origin.
- `VERCEL_AUTOMATION_TOKEN` är server-only och används endast för explicit
  domänautomation mot samma plattformsprojekt.
- `.env.example` beskriver namn och ofarliga standardvärden, aldrig credentials.

Den publicerade piloten använder fortfarande en Clerk-utvecklingsinstans.
Produktionsinstans, domän- och leverantörskonfiguration måste verifieras innan
verkliga kundkonton eller kunddata tas i drift.

## Inte live ännu

Följande får inte beskrivas som levererat produktionsdata:

1. Verklig kundstatistik, kostnader, förnyelser eller verifierade
   COUNTER-rapporter.
2. Automatisk import från MPS/IEEE eller andra publicister.
3. Operativa Salesforce-, Fortnox- eller dokumentflöden. Anslutnings- och
   OAuth-grund kan finnas utan att någon liveimport är aktiv.
4. Publisherprovisionering eller ändring av externa licenser och avtal.
5. Beständig kundspecifik rapportkörning, cronjobb och rapportleverans. Sådana
   kontroller ska visa ett ärligt ej anslutet läge tills serverflödet finns.
6. Automatiskt indexerad dokumentkunskap för den interna assistenten.

Produktionsadmin får inte fylla dessa luckor med testfixtures. Ett saknat flöde
ska visas som ej anslutet eller otillgängligt.

## Verifiering

`npm run check` kör typkontroll och regressionstester för kund-, tenant- och
adminavgränsning. Lokala webbläsartester och CI får använda egna syntetiska
fixtures, men fixtures får inte exponeras via Production.

Efter merge kontrolleras separat:

- att GitHub `main` innehåller den avsedda ändringen;
- att Vercel Production är READY;
- att Production-deploymentens Git-SHA exakt motsvarar `main`;
- att `/`, kundlogin, `/admin` och `/portal/kth` fungerar;
- att borttagna demo- och legacyvägar ger 404;
- att skyddade API:er nekar ogiltiga eller felaktigt scopade sessioner.

En grön Preview, en lokal testkörning eller en lyckad build räcker inte ensam som
bevis på produktionssättning.

## Källor

- [Clerk request-verifiering](https://clerk.com/docs/reference/backend/authenticate-request)
- [Clerk JavaScript-integration](https://clerk.com/docs/js-frontend/getting-started/quickstart)
- [Clerk produktionskrav](https://clerk.com/docs/guides/development/deployment/production)
