# Publisherintegrationer

**Version:** 0.1

**Datum:** 2026-09-04

**Status:** Första verifieringsmatris; inga live-credentials används

## Princip

Varje publisher/partner får en egen källprofil och adapter. En gemensam COUNTER-adapter kan återanvändas där standarden faktiskt stöds, men auth, capabilities, egna rapporter, rättigheter och produktsamband verifieras separat.

| Publisher/plattform | Offentlig teknisk bild | Första adapterväg | Verifieringsstatus |
|---|---|---|---|
| IEEE Xplore | IEEE anger MPS-baserade COUNTER R5.1-rapporter och SUSHI/COUNTER API | Standard-COUNTER R5.1 + avgränsade IEEE-extensions | Offentlig kapacitet verifierad; kundåtkomst och rätt att återvisa data öppna |
| ASTM Compass | COUNTER Registry listar för närvarande MPS Technologies som report provider | Capability discovery; anta inte att IEEE-konfiguration kan återanvändas | Offentlig kataloguppgift verifierad; Content Onlines verkliga arbetsflöde öppet |
| SAE | Källa och rapportformat ännu inte verifierade | Ny källprofil; COUNTER först om Registry/API bekräftar det | Öppet |
| Övriga publishers | Lista, verktyg och format saknas | En adapter per faktisk integrationsfamilj | Öppet |

Officiella uppslag: [COUNTER Registry](https://www.countermetrics.org/registry/), [IEEE Xplore i Registry](https://registry.countermetrics.org/platform/0657858f-f079-4200-a79e-1698cf36a95a) och [ASTM Compass i Registry](https://registry.countermetrics.org/platform/e4de3b8c-f570-4576-8d41-312242202c2a).

## Kontrollerad motsägelse

Projektets verksamhetsuppgift är att bara IEEE använder MPS. Den publika COUNTER Registry-posten för ASTM Compass anger samtidigt MPS Technologies som report provider. Båda uppgifterna kan vara begripliga om verksamhetsuppgiften avser Content Onlines nuvarande arbetssätt eller portalåtkomst, medan Registry beskriver underliggande teknik.

Arkitekturen ska därför inte hårdkoda `publisher = IEEE` till `provider = MPS`. Relationen modelleras separat och versionshanteras.

## Capability profile per källa

Följande fält ska fyllas innan en integration kallas live:

| Fält | Exempel eller kontroll |
|---|---|
| Publisher och plattform | IEEE / IEEE Xplore |
| Report provider | MPS Technologies eller annan verifierad leverantör |
| Standard och version | COUNTER R5.1 |
| Base URL | Hämtas från verifierad Registry-post eller avtalad dokumentation |
| Authfält | customer ID, requestor ID och/eller API key |
| Rapporter | Upptäcks via capabilities och testas per kundkonto |
| Publisherextensions | Dokumenteras separat från standardrapporter |
| Tillgänglig historik | Kontrolleras mot verkligt konto och avtal |
| Publiceringsfrekvens | Styr freshness-regeln |
| Rättigheter | Hämta, lagra, bearbeta, återvisa, retention |
| Organisationsmappning | Serverägd och explicit |
| Produktmappning | Exakt ID eller karantän |
| Testbevis | Syntetisk fixture + godkänd representativ synk |

## Externa affärssystem

Salesforce och Fortnox behandlas som separata business-systemadapters, inte publisheradapters.

- Salesforce har OAuth-skyddade API:er, men rätt org, objekt, fält och system-of-record måste kartläggas.
- Fortnox använder OAuth 2.0 och scopes. Fortnox anger att scopes ger både läs- och skrivrätt och inte kan begränsas till enbart läsning. En första integration måste därför begära minsta möjliga scope och ha egna spärrar mot writeback.
- Usage för KPI:ns nämnare och kostnad för täljaren får inte blandas ihop. Källan för varje del ska visas.

Källor: [Salesforce OAuth](https://developer.salesforce.com/docs/platform/connect-rest-api/guide/intro_using_oauth.html), [Fortnox OAuth](https://www.fortnox.se/developer/authorization) och [Fortnox scopes](https://www.fortnox.se/developer/guides-and-good-to-know/scopes).
