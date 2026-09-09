# Portalstruktur, kundsajter och sparat register

## En runtime, många kundportaler

`content-online-platform` äger Content Onlines interna kontrollpanel, skyddade
API:er, beständiga register och gemensamma kundportalruntime. Allt deployas i
Vercel-projektet `content-online-platform`. En ny kund skapar en
tenant-konfiguration som samma deployment läser; den skapar inte ett nytt
repository, en Git-gren eller ett Vercel-projekt.

## Kanoniska vägar

| Område | Adress | Funktion och behörighet |
| --- | --- | --- |
| Publik ingång | `/` | Content Online-landning. Kundinloggning öppnas som en modal ovanpå sidan. |
| Kundinloggning, reservväg | `/login` | Direktlänk till samma Clerk-baserade kundflöde. Kan bära en önskad portal som hjälp för valet, aldrig som behörighetsbevis. |
| Kundaktivering | `/registrera` | Aktiverar ett kundkonto för en serverregistrerad medlemsinbjudan. |
| Personaladministration | `/admin` | Separat serverkontrollerad behörighetsprövning för Content Online-personal. Den nuvarande piloten delar Clerk-webbläsarsession med kundflödet. |
| Kundportal | `/portal/{slug}` | Gemensamt, kundmärkt portalskal. Verklig kunddata kräver verifierat medlemskap. |
| KTH-pilot | `/portal/kth` | Uttryckligen syntetisk pilot med tydligt märkt presentationsdata. |
| Valfri kunddomän | Exempelvis `https://kund.portal.contentonline.se/` | Samma publicerade tenant och runtime efter exakt domänverifiering. |

Det finns inga publika `/demo`-endpoints, öppna tenantkataloger eller äldre
kompatibilitetsalias i den kanoniska modellen. Okända eller borttagna vägar ska
ge 404. Lokala och CI-baserade fixtures ska bara nås genom testharnessen.

## Kundens inloggningsflöde

1. Content Online lägger till portalmedlemmen i Neon. Om portalen är publicerad
   skickar backend automatiskt en personlig Clerk-inbjudan. En misslyckad
   e-postleverans rullar inte tillbaka medlemskapet och kan skickas igen från
   adminvyn.
2. Kunden aktiverar kontot via inbjudningslänken till `/registrera`. Sidan
   erbjuder inte fri registrering utan en giltig inbjudan.
3. Därefter öppnar kunden `/` och väljer kundinloggning. `/login` finns som
   direkt fallback för bokmärken och externa returflöden.
4. Clerk verifierar identiteten.
5. Servern läser aktiva medlemskap och returnerar tillåtna, publicerade
   portalposter via `/v1/portal-entries`.
6. Finns exakt en tillåten portal kan klienten öppna den direkt. Annars väljer
   användaren bland sina serverreturnerade organisationer.
7. `/portal/{slug}` verifierar sessionen och medlemskapet innan den visar
   kundskyddad status eller data.

Kund- och personalbehörighet är separerade server-side, men den nuvarande
piloten använder samma Clerk-webbläsarsession för båda ingångarna. Utloggning i
det ena flödet loggar därför även ut det andra i samma webbläsarprofil. Den
kända test- och UX-begränsningen beskrivs närmare i
[`ADMIN_DRIFT.md`](./ADMIN_DRIFT.md#känd-sessionsbegränsning-i-pilotflödet).

En manuellt angiven slug, ett kundnamn, en e-postadress i klienten eller en egen
domän ger aldrig åtkomst. En väntande e-postinbjudan binds vid första godkända
inloggningen till identitetsleverantörens stabila användar-ID.

Det publika, kundmärkta portalskalet kan visas utan kunddata. Produkter,
statistik, dokument och ärenden ska däremot förbli låsta eller visa tydliga
tomlägen tills både medlemskap och verklig källa är verifierade.

## Vad Content Online kan styra

Det skyddade registret lagrar per kund:

- namn, oföränderlig slug, typ och publiceringsstatus;
- valda publicister och portaltemplate;
- primärfärg, accentfärg, rubrik, ingress och publik HTTPS-logotyp;
- valfri kunddomän och dess verifieringsstatus;
- portalmedlemmar och roller för icke-syntetiska kunder;
- om den gemensamma D-ID-agenten är aktiverad, en valfri komplett kundunik
  agentkonfiguration, hälsning, tonalitet och exakt tillåtna klientverktyg.

Nya kunder börjar som utkast med föreslagen slug, aktuell standarddashboard,
inga medlemskap och inga verkliga mätvärden. Publicering gör portalskalet
tillgängligt på `/portal/{slug}`. Den aktiverar inte automatiskt identitet,
publisheraccess, statistikimport eller D-ID.

KTH är en skyddad syntetisk post. Den kan inte få verkliga portalmedlemmar eller
raderas permanent. KTH:s produkter, användare och mätvärden återanvänds aldrig
för andra kunder.

## Publicering, arkivering och permanent radering

Publicering sker i den redan deployade gemensamma runtimen. Ingen kundspecifik
build eller deployment behövs. Avpublicering och arkivering gör portalen
otillgänglig för nya förfrågningar; arkivering bevarar posten för återställning.

Permanent radering är ett separat, destruktivt steg och tillåts bara för en redan
arkiverad, icke-syntetisk kund efter bekräftelse med kundnamn eller slug. Kunden
tas bort ur registret, sluggen frigörs och en minimal audit-händelse utan
kundinnehåll bevaras. En exakt ansluten kunddomän ska först kopplas loss från
samma Vercel-projekt.

## Domäner

En egen domän är valfri. Både wildcard-subdomäner och individuella kunddomäner
ska peka på Vercel-projektet `content-online-platform` och mappas server-side
till exakt en publicerad tenant.

Relevant konfiguration:

- `CUSTOMER_PORTAL_ROOT_DOMAIN` anger portalernas publika rotdomän;
- `CUSTOMER_PORTAL_WILDCARD_READY` sätts först efter verklig DNS-verifiering;
- `CUSTOMER_PORTAL_VERCEL_PROJECT_ID` och `CUSTOMER_PORTAL_VERCEL_TEAM_ID`
  identifierar samma plattformsprojekt vid individuell domänautomation;
- `VERCEL_AUTOMATION_TOKEN` är server-only och behövs bara för sådan automation.

Okänd, avpublicerad eller arkiverad kund ska ge 404. Ett register- eller
leverantörsfel ska ge ett tydligt otillgängligt läge, aldrig KTH-data eller
fabricerade tomdata som ser verifierade ut.

## D-ID-agent

D-ID hör till kundportalen, inte personaladministrationen. Widgetens script
laddas först efter att användaren har öppnat den. Agenten visas bara när kunden
är publicerad, funktionen är aktiverad och en komplett agent/client-key-
konfiguration kan lösas.

`DID_AGENT_ID` och `DID_CLIENT_KEY` är plattformens gemensamma
webbläsarkonfiguration. En kundunik override måste innehålla båda värdena; en
halv konfiguration ska nekas. Admin får visa konfigurationsstatus men aldrig
värdena.

Varje D-ID client key ska begränsas till exakt tillåten origin. För den delade
adressen är det `https://content-online-platform.vercel.app`, inte en
`/portal/{slug}`-path. En egen kunddomän måste tillåtas separat. En D-ID API key
är en serverhemlighet och får aldrig användas som client key.

Agentens verktyg får endast arbeta inom aktuell kundkontext och fasta
navigeringsmål. Tonalitet påverkar språkdräkt, aldrig fakta. Kostnader,
nedgångar, dataluckor och osäkerhet ska redovisas även när tonen är positiv.

## Lagring och datagräns

Neon-tabellen `co_registry_v1` lagrar versionsmärkt JSONB med optimistisk
samtidighetskontroll. Äldre poster fylls läsmässigt med säkra standardvärden.

- `/admin/api/registry` och domänautomation kräver verifierad intern admin.
- `/v1/portal-entries` kräver verifierad kundidentitet och härleder poster från
  serverägda medlemskap.
- Agent-context får inte lämna ut client key eller verklig statistik utan
  autentiserat tenantscope.
- Testfixtures har inga publika produktionsrutter. Skyddade adminplatshållare
  som ännu finns kvar ska tas bort när motsvarande registervy är levererad.
- KTH:s `/portal/kth` är det enda uttryckliga syntetiska kundundantaget.

Verklig kundstatistik, MPS-/COUNTER-importer, övriga publisherflöden, avtal,
kostnader och ärenden är inte liveanslutna. Icke-KTH-portaler ska därför visa
låsta eller tomma produktionslägen i stället för syntetiska exempel.

## Driftsverifiering

Vercel Production ska följa GitHub `main`. Efter leverans verifieras att den
stabila produktionsadressen pekar på en READY deployment med exakt samma Git-SHA
som aktuell `main`. En Preview eller en lyckad build är inte i sig bevis på
produktionssättning.
