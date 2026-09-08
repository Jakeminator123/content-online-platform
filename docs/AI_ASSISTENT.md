# Content Online AI-assistent

**Version:** 0.6

**Datum:** 2026-09-08

**Status:** Implementerad pilot med dokumentationsbaserade svar, syntetisk kundbild och allowlistade kontrolljobb

## Placering och användare

Samma assistentkomponent visas på startsidan, admininloggningen, visningsdemon och den interna arbetsytan. Före inloggning visar den bara en publik beskrivning och länk till Content Onlines inloggning. Demo och intern admin delar arbetsytans gränssnitt, men demon ger aldrig intern behörighet. Frågor, kundbild och jobb aktiveras först efter samma Clerk-, origin- och allowlistkontroll som resten av `/admin/api/*`.

Kundkonton och rollen Kundadministratör ger inte åtkomst till den interna assistenten. Den första versionen är endast för Content Online-administratören.

## Vad assistenten kan nu

1. Svara på svenska om plattformens mål, innehåll, roller, datagränser, usage och nuvarande driftstatus. Svaren hämtar sin kontext från projektets dokumentation och ska skilja på **KAN NU**, **SKA KUNNA** och **INTE KLART**.
2. Visa den skyddade syntetiska pilotöversikten med kund, produkter, demokonton, roller och dokumenterad dataåtkomst. Personnamn, e-post, identitets-ID och kundnamn från arbetsytan skickas inte till OpenAI-modellen; modellkontexten innehåller minimerade roll- och organisationssummeringar. Den inskrivna frågan skickas däremot till OpenAI när AI används; detta anges vid inmatningsfältet. Inmatad text avidentifieras inte automatiskt. Användaren ska inte skriva personuppgifter, avtal eller hemligheter.
3. Lista och starta tre fördefinierade, skrivskyddade kontrolljobb. `platform-readiness` är förberett för daglig körning 06:10 UTC via Vercel Cron, men kräver att `CRON_SECRET` konfigurerats. Samma jobb kan startas manuellt från popupen.

OpenAI Responses API används server-side med `store: false`. Om API:t eller nyckeln inte är tillgängligt svarar en begränsad lokal faktamotor i stället. Sådana svar märks uttryckligen **Faktasvar · AI är inte tillgänglig**, medan modellsvar märks **AI-svar**. Webbläsaren får aldrig API-nyckeln.

## D-ID-agent på kundportalerna

D-ID-agenten är flyttad från Fråga CO till den separata kundfrontenden. Den laddas endast på kundadresser under `/o/{slug}` som det publika kataloganropet bekräftar som publicerade, inklusive KTH-demon. Okända, avpublicerade och otillgängliga portaler får inget embed-script. Agentens versionshanterade Instructions, Knowledge och testfrågor finns i [D-ID-paketet](d-id/README.md); en deployment ändrar inte Studio automatiskt.

Content Onlines skyddade backendchatt finns kvar i admin och är ett helt separat samtal. Frågor, svar, Clerk-session, kundregister, jobb, organisationsnamn och slug överförs inte till D-ID. Kundfrontenden tillför bara den domänbegränsade webbläsarkonfiguration som D-ID:s embed behöver.

Samtal hos D-ID kan belasta ägarens krediter och mikrofon kräver webbläsarens godkännande. Agenten får bara använda offentligt lämplig dokumentation, aldrig verklig kunddata eller adminverktyg. Verkliga kunddata får inte användas innan DPA, retention, dataresidency och övrig leverantörsbedömning är godkända.

## Jobb och säkerhetsgräns

Assistenten kan inte skapa ett valfritt kommando, ändra jobbkod eller köra användarens text som kod. Endast följande jobbid:n accepteras:

- `platform-readiness`: läser status för lagring och datakällor.
- `customer-scope-audit` (visningsnamn **Kund- och rollöversikt**): räknar syntetiska kundorganisationer och konton. Jobbet verifierar inte faktisk åtkomst eller tenantisolering och är inte en säkerhetsgranskning.
- `renewal-preflight`: kontrollerar om verifierad avtalsdata finns; skapar inget bindande underlag.

Cron-endpointen kräver Vercels server-only `CRON_SECRET`. Manuella körningar kräver verifierad Content Online-admin. Jobbresultaten sparas inte ännu. Det separata kund- och publicistregistret har beständig lagring, men det innebär inte sparad jobbhistorik.

## Dokumenterad kontext

Kunskapsunderlaget är en kort, versionshanterad sammanfattning av:

- `PROJEKTBRIEF.md`
- `BEHORIGHETSMODELL.md`
- `ADMIN_DRIFT.md`
- `BACKEND_ANSVAR.md`
- `USAGE_KONVERTERING.md`
- detta dokument

Syntetisk adminstatus läggs till per request efter behörighetskontrollen. Modellen har inga verktyg och kan därför inte själv läsa externa system eller verkställa en åtgärd.

## Ska kunna senare

- Hämta live-data först efter att kundauth, tenantfiltrering, rättigheter, DPA/datahantering och respektive integration har godkänts.
- Köra riktiga import- och kvalitetsjobb när beständig jobbhistorik, idempotens, auditlogg och felhantering finns.
- Ge varje kund en egen tenantfiltrerad agent eller kundspecifik kunskap efter ett separat produkt-, behörighets- och datahanteringsbeslut. Pilotagenten är gemensam och har bara offentligt lämplig dokumentation.
- Indexera dokumentation automatiskt efter en beslutad pipeline; den nuvarande kunskapskontexten uppdateras i kodgranskade ändringar.

Assistenten får aldrig beskriva en demo, planerad funktion eller misslyckad kontroll som live eller genomförd.

## Tekniska referenser

- [OpenAI Responses API](https://developers.openai.com/api/reference/resources/responses/methods/create)
- [Vercel Cron Jobs](https://vercel.com/docs/cron-jobs)
- [D-ID Agents Embed](https://docs.d-id.com/docs/embed-quickstart)
- [D-ID Embed Controls](https://docs.d-id.com/docs/embed-methods)
- [D-ID Embed Events](https://docs.d-id.com/docs/embed-events)
- [D-ID MCP för utvecklarverktyg](https://docs.d-id.com/docs/mcp)

## Aktivering och verifieringsgräns

Ägaren hanterar `OPENAI_API_KEY` separat, server-side i det befintliga Vercel-projektet. Inga nycklar skapas eller kopieras med denna integration. Efter ändrad miljökonfiguration behövs en ny deployment och ett separat autentiserat live-test. CI använder injicerade testnycklar och simulerade providers, inte betalda modellanrop.

D-ID-agentens `DID_AGENT_ID` och frontendavsedda `DID_CLIENT_KEY` hör till Vercel-projektet `fokus`, som levererar kundfrontenden. De är webbläsarkonfiguration och sätts som läsbara **Config**-värden för alla miljöer; en D-ID API key får aldrig läggas i repositoryt, markeras som Config eller skickas till webbläsaren. Saknad eller ogiltig konfiguration döljer widgeten utan att blockera portalen.

Embed-nyckelns allowed domains ska begränsas till den exakta kundportal-origin som faktiskt används. För den publicerade piloten är det `https://fokus-psi-sable.vercel.app`. Ändringar av Vercels miljövariabler börjar gälla först i en ny deployment.

D-ID:s MCP-server är ett hjälpmedel för lokala utvecklarverktyg och dokumentations/API-arbete. Den är inte en runtime-del av Content Online, exponeras inte för slutanvändaren och får inte användas för att kringgå admin-API:ts behörighetskontroll.

Assistentens kundbild och statistikunderlag är syntetiska. Beständig kund- och publicistadministration finns separat enligt [portalstrukturen](PORTALSTRUKTUR.md); assistenten får inte automatiskt databasåtkomst. Verkliga externa dataintegrationer är inte verifierade i denna leverans.


## D-ID-start: regression och felsökning (2026-09-08)

Kundfrontenden använder D-ID:s officiella modulscript med `data-name="did-agent"` och compact-läge. Regressionstester verifierar konfigurationsvalidering, att båda kundroute-typerna kräver en publicerad portal och att ingen tenantmetadata läggs i embed-attributen. De gör inga betalda leverantörsanrop.

HTTP 200 för scriptet bevisar inte en fungerande agent. Efter varje deployment krävs därför ett kundportaltest som verifierar att D-ID:s runtime-anrop lyckas och att rätt avatar och chattkontroller visas. Ett 401-fel brukar betyda att den exakta origin saknas i client keyns Allowed Domains.
