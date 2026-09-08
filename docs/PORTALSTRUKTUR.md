# Portalstruktur, kundsajter och sparat register

## En kontrollpanel, en Vercel-runtime, många kundsajter

`content-online-platform` äger Content Onlines interna kontrollpanel, de skyddade
API:erna, det beständiga registret och den gemensamma kundportal-runtime som
deployas i Vercel-projektet `content-online-platform`. **Fokus** är en portal-mall
i detta repository, inte ett separat kundrepo eller Vercel-projekt. En ny kund
skapar bara en tenant-konfiguration som samma deployment läser från registret.

| Område | Adress | Behörighet |
| --- | --- | --- |
| Content Online-admin | `https://content-online-platform.vercel.app/admin` | Intern Clerk-session och serverkontrollerad administratör |
| Designgranskning | `/demo/customer/kth` | Oföränderlig och tydligt märkt syntetisk fixture, utan databasberoende |
| Kundsida | `https://content-online-platform.vercel.app/portal/{url-namn}` | Publik, varumärkesmärkt struktur utan verklig kunddata |
| Valfri kunddomän | `https://{url-namn}.portal.contentonline.se` | Kan senare peka på samma publicerade tenant |
| KTH | `kth` | Syntetisk pilot; alla exempel märks som demo |

Kundens URL väljer tenant men bevisar aldrig medlemskap. Verklig portfölj,
statistik, dokument och ärenden kräver senare ett serververifierat kundmedlemskap.

## Vad Content Online kan styra

Det skyddade registret sparar per kund:

- namn, oföränderligt URL-namn, publiceringsstatus och publicister;
- portal-mall (`Fokus` är den kompletta standardmallen; `library` och `minimal` är varianter);
- primärfärg, accentfärg, rubrik, ingress och publik HTTPS-logotyp;
- önskad kunddomän och Vercels verifieringsstatus;
- D-ID agent-ID, frontendavsedd client key, hälsning, positivitet 1–10 och
  exakt allowlistade klientverktyg.

Nya kunder börjar som utkast med en föreslagen slug, inga publicister, ingen egen
domän, inga konton och inga kundvärden. Efter publicering blir sidan tillgänglig
på `/portal/{url-namn}`. KTH:s data, identiteter och konfiguration kopieras aldrig
till dem.

## Publicering och domäner

Publicering gör det säkra portalskalet tillgängligt direkt i den redan deployade
plattformen. Ingen ny build, Git-branch, deployment eller DNS-post behövs per
kund. Arkivering tar bort den publika sajten vid nästa serverförfrågan men bevarar
kundposten och inställningarna för återställning.

En egen domän är valfri. Om `*.portal.contentonline.se` senare kopplas till
Vercel-projektet `content-online-platform` fungerar varje ny
förstahands-subdomän mot samma runtime utan ett projekt per kund.

Domänstatusen läser servervariablerna:

- `CUSTOMER_PORTAL_ROOT_DOMAIN` (publik konfiguration),
- `CUSTOMER_PORTAL_WILDCARD_READY` (sätts först efter verklig DNS-verifiering).

Individuella anpassade domäner kan vid behov använda de särskilda
`CUSTOMER_PORTAL_VERCEL_PROJECT_ID`, `CUSTOMER_PORTAL_VERCEL_TEAM_ID` och en
server-only `VERCEL_AUTOMATION_TOKEN`. Projekt-ID:t måste då peka på
`content-online-platform`. Den vanliga `/portal/{url-namn}`-adressen och en
verifierad wildcard-väg behöver ingen långlivad token. Innan DNS är verifierad
fungerar register, publicering och plattformens kundadress fortfarande.

## D-ID per kund

D-ID laddas bara i en publicerad kundportal vars agent är aktiverad och har en
giltig agent/client-key-konfiguration. KTH kan under migreringen använda de
befintliga servervariablerna `DID_AGENT_ID` och `DID_CLIENT_KEY`; nya kunder sparar
sin browser-konfiguration på sin tenant.

Varje D-ID client key ska begränsas till den exakta origin som används. För den
delade kundadressen är det `https://content-online-platform.vercel.app`; en path
som `/portal/kth` eller wildcardtext ska inte anges i D-ID Allowed Domains. Om en
egen kunddomän aktiveras läggs även den origin till. En D-ID API key är en
serverhemlighet och får aldrig lagras som client key.

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

## Driftsgräns och migration

Admin och kundsidor delar Vercel-projekt men inte behörighetsmodell. Kundroutes
läser endast publicerade tenantposter; admin-API:er kräver fortsatt verifierad
Content Online-identitet. Det äldre `content-online-kundplatform-frontend`/`fokus`
är endast en bevarad migrationskälla tills den inbyggda Fokus-mallen har godkänts
i produktion och kan arkiveras återställningsbart.
