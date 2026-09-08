# Content Online AI-assistent

**Version:** 0.5

**Datum:** 2026-09-08

**Status:** Implementerad pilot med dokumentationsbaserade svar, syntetisk kundbild och allowlistade kontrolljobb

## Placering och användare

Samma assistentkomponent visas på startsidan, admininloggningen, visningsdemon och den interna arbetsytan. Före inloggning visar den bara en publik beskrivning och länk till Content Onlines inloggning. Demo och intern admin delar arbetsytans gränssnitt, men demon ger aldrig intern behörighet. Frågor, kundbild och jobb aktiveras först efter samma Clerk-, origin- och allowlistkontroll som resten av `/admin/api/*`.

Kundkonton och rollen Kundadministratör ger inte åtkomst till den interna assistenten. Den första versionen är endast för Content Online-administratören.

## Vad assistenten kan nu

1. Svara på svenska om plattformens mål, innehåll, roller, datagränser, usage och nuvarande driftstatus. Svaren hämtar sin kontext från projektets dokumentation och ska skilja på **KAN NU**, **SKA KUNNA** och **INTE KLART**.
2. Visa den skyddade syntetiska pilotöversikten med kund, produkter, demokonton, roller och dokumenterad dataåtkomst. Personnamn, e-post, identitets-ID och kundnamn från arbetsytan skickas inte till OpenAI-modellen; modellkontexten innehåller minimerade roll- och organisationssummeringar. Den inskrivna frågan skickas däremot till OpenAI när AI används; detta anges vid inmatningsfältet. Inmatad text avidentifieras inte automatiskt. Användaren ska inte skriva personuppgifter, avtal eller hemligheter.
3. Lista och starta tre fördefinierade, skrivskyddade kontrolljobb. `platform-readiness` är förberett för daglig körning 06:10 UTC via Vercel Cron, men kräver att `CRON_SECRET` konfigurerats. Samma jobb kan startas manuellt från popupen.
4. Starta den befintliga D-ID Studio-agenten direkt i Fråga CO med video, D-ID:s egen textchatt och valfri mikrofon. Den startar först efter ett uttryckligt klick.

OpenAI Responses API används server-side med `store: false`. Om API:t eller nyckeln inte är tillgängligt svarar en begränsad lokal faktamotor i stället. Sådana svar märks uttryckligen **Faktasvar · AI är inte tillgänglig**, medan modellsvar märks **AI-svar**. Webbläsaren får aldrig API-nyckeln.

## D-ID-agent inuti Fråga CO

Efter verifierad intern inloggning kan användaren starta den fungerande Studio-agenten direkt i Fråga CO. Integrationen följer D-ID Agents Embed v2 i `full`-läge och visar video, agentens egen textchatt, mikrofon och omstart. Den använder agentens egna Instructions och Knowledge; versionshanterade kopior och testfrågor finns i [D-ID-paketet](d-id/README.md). Inga Studio-inställningar ändras automatiskt vid deployment.

Embed-konfigurationen hämtas från `/admin/api/assistant/presenter` efter befintlig adminbehörighetskontroll. D-ID-scriptet laddas först när användaren klickar **Starta agenten här**. `DID_CLIENT_KEY` kan vara den råa `ck_…`-nyckeln från Embed eller dess Base64-kodade form från en Studio-delningslänk; servern validerar och normaliserar alltid till rå client key innan embed-scriptet får den. API-nycklar accepteras aldrig.

Content Onlines skyddade backendchatt ligger kvar direkt under avataren och är ett separat samtal. Frågor, svar, Clerk-session, kundregister och jobb överförs inte mellan de två chattarna. Den tidigare `speak()`-kopplingen är borttagen för att ett svar i den interna textchatten inte av misstag ska bli en del av D-ID-samtalet. En liten separat-flik-länk finns kvar som reserv och byggs av servern utan en godtycklig redirect.

D-ID är avstängt som standard, tracking stängs av i embed-konfigurationen och användaren informeras före start. Samtal sker hos D-ID, mikrofon kräver webbläsarens godkännande och användning kan belasta ägarens krediter. Agenten får bara ha offentligt lämplig dokumentation, aldrig verklig kunddata eller adminverktyg. Verkliga kunddata får inte användas innan DPA, retention, dataresidency och övrig leverantörsbedömning är godkända.

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
- Ge kundanvändare en egen strikt tenantfiltrerad assistent efter ett separat produkt- och behörighetsbeslut.
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

D-ID-agenten är `v2_agt_4xrfqG8W`. `DID_AGENT_ID` och den frontendavsedda `DID_CLIENT_KEY` är konfigurerade som läsbara **Config**-värden för **All Environments** i Vercel-projektet `content-online-platform`. Det är ett uttryckligt pilotval: båda värdena används i webbläsarintegrationen och behandlas därför inte som serverhemligheter. Client key returneras ändå endast från det skyddade admin-API:t efter lyckad autentisering. D-ID API key ska aldrig läggas i repositoryt, markeras som Config eller skickas till webbläsaren.

Inför verkliga kunddata ska en separat embed client key användas och dess allowed domains begränsas till de exakta origins som faktiskt används. Den skärpningen är inte ett blockerande krav för den nuvarande syntetiska piloten. Ändringar av Vercels miljövariabler börjar gälla först i en ny deployment.

D-ID:s MCP-server är ett hjälpmedel för lokala utvecklarverktyg och dokumentations/API-arbete. Den är inte en runtime-del av Content Online, exponeras inte för slutanvändaren och får inte användas för att kringgå admin-API:ts behörighetskontroll.

Assistentens kundbild och statistikunderlag är syntetiska. Beständig kund- och publicistadministration finns separat enligt [portalstrukturen](PORTALSTRUKTUR.md); assistenten får inte automatiskt databasåtkomst. Verkliga externa dataintegrationer är inte verifierade i denna leverans.


## D-ID-start: regression och felsökning (2026-09-08)

Embed-scriptet måste ha `data-name="did-agent"` före infogning; D-ID:s bootstrap söker exakt den selektorn. HTTP 200 för scriptet betyder inte att avataren har initierats. Klienten väntar även på de asynkront registrerade API-metoderna, prenumererar på anslutnings- och felhändelser och har tidsgränser. Vid fel loggas endast det fasta steget `config`, `script`, `initialization` eller `connection`, aldrig nycklar, leverantörspayload eller chattinnehåll. Om ett laddat modulscript inte startar behövs omladdning; återförsök får inte lägga till fler cachade instanser.

Regressionstester kör det faktiska klientprogrammet mot en simulerad DOM och fördröjd D-ID-bootstrap. De gör inga betalda leverantörsanrop och ersätter inte ett autentiserat live-test av video/ljud.
