# Statistikvyer, chatt och befintligt kontrolljobb

Adminarbetsytan får tydligare KPI-kort, en kundspecifik insiktsyta och jämförelser per produkt, publicist och förändring. KTH:s kundportal har ytterligare perspektiv för tid, skolor, efterfrågan och förnyelser; budget visas endast för kundadministratörer. Befintliga flöden, behörigheter och jobballowlist är kvar.

`src/admin/statistics-policy.ts` är samma dependency-fria policy/version som `lib/statistics-policy.ts` i `content-online-kundplatform-frontend`. Håll båda filer synkroniserade. Den prioriterar minskad användning över 5 %, efterfrågan utan tillgång och förnyelser inom 90 dagar, med förklaringar. Den behandlar inte saknad statistik som noll och flaggar gammal eller okänd rapportperiod. Urvalet ska gynna kundens förståelse, inte selektivt framställa resultaten som positiva.

`statistics.ts` använder enbart syntetiska KTH-observationer för `customer-kth-demo`, filtrerade på tilldelade produkt-ID:n. Andra kunder har tilldelningar men får inget fabricerat användningsunderlag. Namn, e-post, belopp och persondata skickas inte till någon ny tjänst.

## Befintligt jobb och chatt

`platform-readiness` kör samma beräkning vid den befintliga cronrutten och vid manuell start från chattens Jobb-flik. Resultatet innehåller maskinläsbara `statistics` och begripliga `facts` för befintlig jobbvisning. Schema, CRON_SECRET-kontroll och allowlist ändras inte. Inga fria kommandon, externa skrivningar eller nya AI-anrop introduceras.

Statistik-/KPI-frågor besvaras deterministiskt med samma urvalsregler. Övriga frågor går till den oförändrade dokumentationsassistenten, med samma modellinställning och integritetsskydd. Ett chattsvar är inte en jobbkörning.

## Begränsning

All data är fortfarande demo. `persisted: false` gäller. Sidvisning och cron räknar själva; kunden läser inte ett sparat resultat från senaste cron. Lagring, liveimport och produktionsidentitet måste fortfarande beslutas. Budget dividerad med januari–augustis användning är inte faktisk periodiserad kostnad per nedladdning.

## Verifiering

`npm run check` testar typkontroll, befintliga auth-/tenant-/cron-/API-fall samt urval, delat jobbresultat, kundspecifik filtrering, saknad data, escaping och JavaScript-syntax. Chromiumkontrollen öppnar den offentliga visningsdemon; den simulerar inte en inloggad Clerk-användare.
