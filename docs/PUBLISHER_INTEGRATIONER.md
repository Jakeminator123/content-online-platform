# Publisherintegrationer

**Version:** 0.1

**Datum:** 2026-09-04

**Status:** Första verifieringsmatris; inga live-credentials används

## Princip

Varje publisher/partner får en egen källprofil och faktisk importväg. IEEE/MPS byggs först. För andra publishers får vi inte anta att ett verktyg, API eller standard finns; vägen kan vara ett annat API, fil/export, kontrollerad manuell import eller initialt ingen usage alls.

| Publisher/plattform | Offentlig teknisk bild | Första adapterväg | Verifieringsstatus |
|---|---|---|---|
| IEEE Xplore | MPS är IEEE:s konverterings-/statistikverktyg i verksamhetsbilden | IEEE/MPS-adapter; exakta exportsätt verifieras | Offentlig COUNTER/SUSHI-kapacitet känd; kundåtkomst och återvisningsrätt öppna |
| ASTM Compass | Content Onlines faktiska usagekälla är inte verifierad | Inventera först; anta varken MPS eller COUNTER | Öppet |
| SAE | Källa och rapportformat är inte verifierade | Inventera först; API, fil eller manuell import efter bevis | Öppet |
| Övriga publishers | Lista, verktyg och format saknas | En adapter per faktisk integrationsfamilj | Öppet |

Officiella uppslag: [COUNTER Registry](https://www.countermetrics.org/registry/), [IEEE Xplore i Registry](https://registry.countermetrics.org/platform/0657858f-f079-4200-a79e-1698cf36a95a) och [ASTM Compass i Registry](https://registry.countermetrics.org/platform/e4de3b8c-f570-4576-8d41-312242202c2a).

## Extern teknisk information är inte verksamhetsstandard

Den publika COUNTER Registry-posten för ASTM Compass har vid researchtillfället angett MPS Technologies som report provider. Det bevisar inte vilket verktyg eller dataflöde Content Online har tillgång till och får inte användas som integrationskrav.

I projektets verksamhetsmodell är MPS IEEE-spåret. Arkitekturen modellerar ändå publisher, provider och källkoppling som separata relationer så att tekniska detaljer kan verifieras utan att domänmodellen skrivs om.

## Capability profile per källa

Följande fält ska fyllas innan en integration kallas live:

| Fält | Exempel eller kontroll |
|---|---|
| Publisher och plattform | IEEE / IEEE Xplore |
| Källtyp | API, fil, portalrapport, kontrollerad manuell import eller ingen tillgänglig källa |
| Report provider | MPS Technologies eller annan verifierad leverantör |
| Standard och version, om tillämpligt | COUNTER R5.1 |
| Base URL, om tillämpligt | Hämtas från verifierad Registry-post eller avtalad dokumentation |
| Authfält, om tillämpligt | customer ID, requestor ID och/eller API key |
| Rapporter/exporter, om tillämpligt | Upptäcks eller dokumenteras och testas per kundkonto |
| Publisherextensions, om tillämpligt | Dokumenteras separat från standardrapporter |
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
