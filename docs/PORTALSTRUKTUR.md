# Portalstruktur, kundsajter och sparat register

## En kontrollpanel, en delad frontend, många kundsajter

`content-online-platform` äger Content Onlines interna kontrollpanel, de skyddade
API:erna och det beständiga registret. `content-online-kundplatform-frontend` är
den gemensamma kundportal-appen i Vercel-projektet `fokus`. En ny kund skapar inte
ett repo, en kodkopia eller ett Vercel-projekt. Den skapar en tenant-konfiguration
som den delade frontend-deploymenten läser via det publika, begränsade
portalkatalog-API:t.

| Område | Adress | Behörighet |
| --- | --- | --- |
| Content Online-admin | `https://content-online-platform.vercel.app/admin` | Intern Clerk-session och serverkontrollerad administratör |
| Designgranskning | `/demo/customer/kth` | Oföränderlig och tydligt märkt syntetisk fixture, utan databasberoende |
| Förhandsvisning | `https://fokus-psi-sable.vercel.app/o/{url-namn}` | Publik, varumärkesmärkt struktur utan verklig kunddata |
| Kunddomän | `https://{url-namn}.portal.contentonline.se` | Samma publicerade tenant via Vercel wildcard |
| KTH | `kth` | Syntetisk pilot; alla exempel märks som demo |

Kundens URL väljer tenant men bevisar aldrig medlemskap. Verklig portfölj,
statistik, dokument och ärenden kräver senare ett serververifierat kundmedlemskap.

## Vad Content Online kan styra

Det skyddade registret sparar per kund:

- namn, oföränderligt URL-namn, publiceringsstatus och publicister;
- portal-mall (`insight`, `library` eller `minimal`);
- primärfärg, accentfärg, rubrik, ingress och publik HTTPS-logotyp;
- önskad kunddomän och Vercels verifieringsstatus;
- D-ID agent-ID, frontendavsedd client key, hälsning, positivitet 1–10 och
  exakt allowlistade klientverktyg.

Nya kunder börjar som utkast med en föreslagen domän
`{url-namn}.portal.contentonline.se`, inga publicister, inga konton och inga
kundvärden. KTH:s data, identiteter och konfiguration kopieras aldrig till dem.

## Publicering och domäner

Publicering gör det säkra portalskalet tillgängligt i den delade frontend-appen.
Innan DNS är klar används förhandsvisningsvägen på `fokus`. Wildcard-domänen
`*.portal.contentonline.se` kopplas en gång till Vercel-projektet `fokus`; därefter
fungerar varje ny förstahands-subdomän utan ett API-anrop eller projekt per kund.
Arkivering tar bort den publika sajten vid nästa serverförfrågan men bevarar
kundposten och inställningarna för återställning.

Domänstatusen läser servervariablerna:

- `CUSTOMER_PORTAL_ROOT_DOMAIN` (publik konfiguration),
- `CUSTOMER_PORTAL_WILDCARD_READY` (sätts först efter verklig DNS-verifiering).

Individuella anpassade domäner kan vid behov använda de särskilda
`CUSTOMER_PORTAL_VERCEL_PROJECT_ID`, `CUSTOMER_PORTAL_VERCEL_TEAM_ID` och en
server-only `VERCEL_AUTOMATION_TOKEN`. Projekt-ID:t måste då peka på `fokus`,
aldrig adminprojektet. Den normala wildcard-vägen behöver ingen långlivad token.
Innan flaggan är verifierad fungerar register, publicering och den delade
förhandsvisningen fortfarande; domänstatus visas som **DNS väntar**.

## D-ID per kund

D-ID laddas bara i en publicerad kundportal vars agent är aktiverad och har en
giltig agent/client-key-konfiguration. KTH kan under migreringen använda de
befintliga servervariablerna `DID_AGENT_ID` och `DID_CLIENT_KEY`; nya kunder sparar
sin browser-konfiguration på sin tenant.

Varje D-ID client key ska begränsas till kundens exakta origin, exempelvis
`https://kth.portal.contentonline.se`. Under förhandsgranskning kan även
`https://fokus-psi-sable.vercel.app` läggas till som en andra origin.
En path eller wildcardtext ska inte anges i D-ID Allowed Domains. En D-ID API key
är en serverhemlighet och får aldrig lagras som client key.

Portalens klient registrerar bara dessa handler-namn:

- `get_portal_context`,
- `navigate_portal`,
- `get_portfolio_summary`,
- `get_usage_summary`.

Navigation accepterar fem fasta sektioner och gör inga fria DOM-klick. De övriga
verktygen returnerar syntetisk demo eller `authentication_required` tills verklig
kundautentisering finns. D-ID-verktygen måste dessutom skapas och fästas på rätt
agent i Studio/API; en browser client key kan inte administrera agenten.

Positivitet styr språkdräkt, inte fakta. Även vid 10 måste agenten redovisa
kostnader, nedgångar, luckor, osäkerhet och källstatus. Ekonomisk nytta får aldrig
påstås utan ett verifierat underlag.

## Lagring och säkerhetsgräns

Neon-tabellen `co_registry_v1` fortsätter använda versionsmärkt JSONB och
optimistisk samtidighetskontroll. Äldre poster migreras läsmässigt med säkra
standardvärden för `site`; ingen separat destruktiv databas-migration krävs.

- `/admin/api/registry` och domänautomationen kräver verifierad intern admin.
- `/portal-directory/{slug}` lämnar endast publicerad presentationsmetadata.
- Agent-context lämnar aldrig client key och aldrig verklig statistik utan
  autentiserat tenantscope.
- Okänd, avpublicerad eller arkiverad kund ger 404 och får ingen KTH-fallback.
- Databas- och leverantörsfel ger otillgängligt läge, inte fabricerade tomdata.

## Separata driftsgränser

Adminprojektet och kundfrontendens `fokus`-projekt har varsin deployment och varsin
ansvarsgräns. De delar inte autentisering eller runtime-hemligheter. Kundfrontend
läser enbart explicit publicerad presentationsmetadata; registret och Neon stannar
i backendprojektet.
