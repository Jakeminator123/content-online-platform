# Portalstruktur, kundsajter och sparat register

## En kontrollpanel, en runtime, många kundsajter

`content-online-platform` äger både Content Onlines interna kontrollpanel och den
delade kundportal-runtimen. En ny kund skapar inte ett repo, en kodkopia eller ett
Vercel-projekt. Den skapar en tenant-konfiguration som samma deployment läser.

| Område | Adress | Behörighet |
| --- | --- | --- |
| Content Online-admin | `https://content-online-platform.vercel.app/admin` | Intern Clerk-session och serverkontrollerad administratör |
| Designgranskning | `/demo/customer/kth` | Oföränderlig och tydligt märkt syntetisk fixture, utan databasberoende |
| Förhandsvisning | `/portal/{url-namn}` | Publik, varumärkesmärkt struktur utan verklig kunddata |
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

Publicering gör det säkra portalskalet tillgängligt. Innan DNS är klar används
förhandsvisningsvägen. Knappen **Koppla domän** använder Vercels projekt-domän-API
för att lägga till eller verifiera `*.portal.contentonline.se`. En wildcard räcker
för alla förstahands-subdomäner och kräver Vercels nameserver-metod.

Domänautomationen läser bara servervariablerna:

- `CUSTOMER_PORTAL_ROOT_DOMAIN` (publik konfiguration),
- `VERCEL_PROJECT_ID` och `VERCEL_TEAM_ID` (icke-hemliga identifierare),
- `VERCEL_AUTOMATION_TOKEN` (server-only, känslig och snävt behörig).

Utan token fungerar register, publicering och förhandsvisning fortfarande;
domänstatus stannar på **DNS väntar**. Ingen token eller Vercel-felpayload skickas
till webbläsaren.

## D-ID per kund

D-ID laddas bara i en publicerad kundportal vars agent är aktiverad och har en
giltig agent/client-key-konfiguration. KTH kan under migreringen använda de
befintliga servervariablerna `DID_AGENT_ID` och `DID_CLIENT_KEY`; nya kunder sparar
sin browser-konfiguration på sin tenant.

Varje D-ID client key ska begränsas till kundens exakta origin, exempelvis
`https://kth.portal.contentonline.se`. Under förhandsgranskning kan även
`https://content-online-platform.vercel.app` läggas till som en andra origin.
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

## Avveckling av gamla frontend-repot

`content-online-kundplatform-frontend` är nu migrationskälla, inte målarkitektur.
Det ska bevaras tills nya lösningen är mergad och produktionsverifierad, KTH och
wildcard-domänen fungerar, kundautentiseringen är färdig och rollback är beslutad.
Först därefter kan repot arkiveras och senare raderas separat.
