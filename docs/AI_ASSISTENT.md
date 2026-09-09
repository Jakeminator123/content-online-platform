# Content Online AI-assistent

**Uppdaterad:** 2026-09-09
**Status:** Intern, dokumentationsbaserad pilot

## Två separata assistenter

- **Fråga CO** finns endast i den skyddade personalytan `/admin`. Den svarar om
  plattformens dokumenterade funktioner och nuläge.
- **D-ID-agenten** är valfri i respektive publicerad kundportal. Den får aldrig
  ge adminbehörighet eller tillgång till en annan kund.

Kundkonton och rollen Kundadministratör ger inte åtkomst till den interna
assistenten.

## Vad Fråga CO får använda

Assistenten får en kort versionshanterad kontext från:

- `PROJEKTBRIEF.md`
- `BEHORIGHETSMODELL.md`
- `ADMIN_DRIFT.md`
- `BACKEND_ANSVAR.md`
- `USAGE_KONVERTERING.md`
- detta dokument

Efter verifierad admininloggning lägger servern till en minimerad översikt med
aggregerade antal kunder, portalmedlemmar, publicister, domänstatus,
D-ID-aktivering och sparade Salesforce-kopplingar. Kundnamn, e-postadresser,
sluggar och identitetsleverantörens användar-ID skickas inte till modellen.

Den inskrivna frågan skickas till OpenAI när AI är tillgänglig. Inmatningen
avidentifieras inte automatiskt, därför ska användaren inte skriva
personuppgifter, avtal eller hemligheter.

OpenAI Responses API används server-side med `store: false`. Om modellen eller
API-nyckeln inte är tillgänglig används ett begränsat lokalt faktasvar.

## Tydliga gränser

Assistenten kan inte starta jobb, ändra registret eller läsa externa system.
Gamla syntetiska adminjobb och Vercel-cronrutten är borttagna. Menyvalen
**Cronjobb** och **Rapportflöde** visar de verkliga kundposterna och markerar
funktionen som inte ansluten tills en beständig kundspecifik jobbmodell finns.

Varje svar om nuläge ska skilja mellan **KAN NU**, **SKA KUNNA** och
**INTE KLART**. En sparad koppling får inte beskrivas som en utförd synk.

## D-ID i kundportalen

D-ID laddas endast på en publicerad `/portal/{slug}` där agenten är aktiverad.
KTH:s portal är en uttryckligen syntetisk pilot. Okända och avpublicerade
portaler får inget embed-script.

Agentens instruktioner och tillåtna klientverktyg finns i [D-ID-paketet](d-id/README.md).
Client key ska begränsas till exakt tillåten origin; en path som `/portal/kth`
är inte en origin. Samtal kan förbruka D-ID-krediter och mikrofon kräver
webbläsarens godkännande.

## Återstående arbete

- verifiera verkliga produkt-, usage- och rapportkällor per kund;
- införa beständig, idempotent jobbhistorik innan cronjobb aktiveras;
- besluta datarättigheter och fälturval innan externa CRM-data visas;
- verifiera leverantörsavtal och datahantering före verklig kunddata.

## Tekniska referenser

- [OpenAI Responses API](https://developers.openai.com/api/reference/resources/responses/methods/create)
- [D-ID Agents Embed](https://docs.d-id.com/docs/embed-quickstart)
- [D-ID Embed attributes](https://docs.d-id.com/docs/embed-attributes)
