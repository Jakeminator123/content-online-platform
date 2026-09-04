# Content Online AI-assistent

**Version:** 0.1

**Datum:** 2026-09-05

**Status:** Implementerad pilot med dokumentationsbaserade svar, syntetisk kundbild och allowlistade kontrolljobb

## Placering och användare

Assistenten visas som en chattbubbla på Content Onlines egen admininloggning. Före inloggning visar den bara en publik beskrivning av arbetsytan. Frågor, kundbild och jobb aktiveras först efter samma Clerk-, origin- och allowlistkontroll som resten av `/admin/api/*`.

Kundkonton och rollen Kundadministratör ger inte åtkomst till den interna assistenten. Den första versionen är endast för Content Online-administratören.

## Vad assistenten kan nu

1. Svara på svenska om plattformens mål, innehåll, roller, datagränser, usage och nuvarande driftstatus. Svaren hämtar sin kontext från projektets dokumentation och ska skilja på **KAN NU**, **SKA KUNNA** och **INTE KLART**.
2. Visa den skyddade syntetiska pilotöversikten med kund, produkter, demokonton, roller och dokumenterad dataåtkomst. Personnamn, e-post, identitets-ID och kundnamn från arbetsytan skickas inte till OpenAI-modellen; modellkontexten innehåller minimerade roll- och organisationssummeringar.
3. Lista och starta tre fördefinierade, skrivskyddade kontrolljobb. `platform-readiness` körs även dagligen 06:10 UTC via Vercel Cron. Samma jobb kan startas manuellt från popupen.

OpenAI Responses API används server-side med `store: false`. Om API:t eller nyckeln inte är tillgängligt svarar en begränsad lokal faktamotor i stället. Webbläsaren får aldrig API-nyckeln.

## Jobb och säkerhetsgräns

Assistenten kan inte skapa ett valfritt kommando, ändra jobbkod eller köra användarens text som kod. Endast följande jobbid:n accepteras:

- `platform-readiness`: läser status för lagring och datakällor.
- `customer-scope-audit`: summerar pilotens kund- och rollgränser.
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
