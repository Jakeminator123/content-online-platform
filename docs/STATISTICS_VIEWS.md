# Statistikvyer, chatt och befintligt kontrolljobb

KTH:s syntetiska kundportal har presentationsvyer för tid, skolor, efterfrågan och förnyelser; budget visas endast för kundadministratörer. Dessa fixtures används för portaldesign och tester. De visas inte längre som verkliga KPI:er i Content Onlines produktionsadmin.

`src/admin/statistics-policy.ts` är den kanoniska dependency-fria policyn. Policyn prioriterar minskad användning över 5 %, efterfrågan utan tillgång och förnyelser inom 90 dagar, med förklaringar. Den behandlar inte saknad statistik som noll och flaggar gammal eller okänd rapportperiod. Urvalet ska gynna kundens förståelse, inte selektivt framställa resultaten som positiva.

`statistics.ts` använder enbart syntetiska KTH-observationer för `customer-kth-demo`, filtrerade på tilldelade produkt-ID:n. Andra kunder har tilldelningar men får inget fabricerat användningsunderlag. Namn, e-post, belopp och persondata skickas inte till någon ny tjänst.

## Befintligt jobb och chatt

Beräkningskoden finns kvar som isolerad fixturelogik och regressionstest för KTH-portalen. Den tidigare `platform-readiness`-cronrutten och manuella syntetiska adminjobb är borttagna. Ett riktigt jobbflöde får införas först med kundscope, beständig historik, idempotens och verifierad datakälla.

Statistik-/KPI-frågor besvaras deterministiskt med samma urvalsregler. Övriga frågor går till den oförändrade dokumentationsassistenten, med samma modellinställning och integritetsskydd. Ett chattsvar är inte en jobbkörning.

## Begränsning

All statistik i denna fixture är demo och `persisted: false` gäller. Produktionsadmin använder inte dessa siffror. Lagring och liveimport måste fortfarande beslutas. Budget dividerad med januari–augustis användning är inte faktisk periodiserad kostnad per nedladdning.

## Verifiering

`npm run check` testar typkontroll, auth-/tenant-/API-fall samt fixtureurval, kundspecifik filtrering, saknad data, escaping och JavaScript-syntax. Publika demovägar ingår inte i produktionskontraktet.
