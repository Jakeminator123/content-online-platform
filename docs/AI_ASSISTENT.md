# Content Online AI-assistent

**Version:** 0.2

**Datum:** 2026-09-05

**Status:** Implementerad pilot med dokumentationsbaserade svar, syntetisk kundbild och allowlistade kontrolljobb

## Placering och användare

Samma assistentkomponent visas på startsidan, admininloggningen, visningsdemon och den interna arbetsytan. Före inloggning visar den bara en publik beskrivning och länk till Content Onlines inloggning. Demo och intern admin delar arbetsytans gränssnitt, men demon ger aldrig intern behörighet. Frågor, kundbild och jobb aktiveras först efter samma Clerk-, origin- och allowlistkontroll som resten av `/admin/api/*`.

Kundkonton och rollen Kundadministratör ger inte åtkomst till den interna assistenten. Den första versionen är endast för Content Online-administratören.

## Vad assistenten kan nu

1. Svara på svenska om plattformens mål, innehåll, roller, datagränser, usage och nuvarande driftstatus. Svaren hämtar sin kontext från projektets dokumentation och ska skilja på **KAN NU**, **SKA KUNNA** och **INTE KLART**.
2. Visa den skyddade syntetiska pilotöversikten med kund, produkter, demokonton, roller och dokumenterad dataåtkomst. Personnamn, e-post, identitets-ID och kundnamn från arbetsytan skickas inte till OpenAI-modellen; modellkontexten innehåller minimerade roll- och organisationssummeringar. Den inskrivna frågan skickas däremot till OpenAI när AI används; detta anges vid inmatningsfältet. Inmatad text avidentifieras inte automatiskt. Användaren ska inte skriva personuppgifter, avtal eller hemligheter.
3. Lista och starta tre fördefinierade, skrivskyddade kontrolljobb. `platform-readiness` är förberett för daglig körning 06:10 UTC via Vercel Cron, men kräver att `CRON_SECRET` konfigurerats. Samma jobb kan startas manuellt från popupen.

OpenAI Responses API används server-side med `store: false`. Om API:t eller nyckeln inte är tillgängligt svarar en begränsad lokal faktamotor i stället. Sådana svar märks uttryckligen **Faktasvar · AI är inte tillgänglig**, medan modellsvar märks **AI-svar**. Webbläsaren får aldrig API-nyckeln.

## Jobb och säkerhetsgräns

Assistenten kan inte skapa ett valfritt kommando, ändra jobbkod eller köra användarens text som kod. Endast följande jobbid:n accepteras:

- `platform-readiness`: läser status för lagring och datakällor.
- `customer-scope-audit` (visningsnamn **Kund- och rollöversikt**): räknar syntetiska kundorganisationer och konton. Jobbet verifierar inte faktisk åtkomst eller tenantisolering och är inte en säkerhetsgranskning.
- `renewal-preflight`: kontrollerar om verifierad avtalsdata finns; skapar inget bindande underlag.

Cron-endpointen kräver Vercels server-only `CRON_SECRET`. Manuella körningar kräver verifierad Content Online-admin. Resultaten sparas inte eftersom beständig lagring ännu saknas.

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

## Aktivering och verifieringsgräns

Ägaren hanterar `OPENAI_API_KEY` separat, server-side i det befintliga Vercel-projektet. Inga nycklar skapas eller kopieras med denna integration. Efter ändrad miljökonfiguration behövs en ny deployment och ett separat autentiserat live-test. CI använder injicerade testnycklar och simulerade providers, inte betalda modellanrop.

Dokumentationen beskriver en syntetisk, skrivskyddad pilot. Beständig administration och externa integrationer ingår inte i denna leverans.
