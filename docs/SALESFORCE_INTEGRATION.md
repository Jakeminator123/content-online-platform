# Salesforce i Content Onlines arbetsyta

## Status för den första versionen

Den separata Salesforce-fliken visar endast serverns verkliga OAuth-status och de Account-kopplingar som uttryckligen har sparats i kundregistret. Fiktiva kontakter, affärer, ägare och förnyelser visas inte. OAuth/REST-grunden finns, men en sparad kundkoppling är inte bevis på att någon liveimport körs.

Arbetsantagandet är att Content Online har **en Salesforce-organisation** och att kunderna representeras av poster av typen Account. Varje intern kund får då högst en aktiv koppling till ett Account.Id. Om avsikten i stället är att ansluta flera Salesforce-organisationer, till exempel en separat organisation som ägs av varje kund, måste datamodell och OAuth-livscykel utformas för flera tenants.

## Föreslagen första riktiga version

1. Content Online ansluter Salesforce via OAuth 2.0 och en **External Client App**. Nya legacy Connected Apps är begränsade från Spring '26, så en ny integration ska inte byggas på det äldre appformatet.
2. Servern använder Salesforces Platform REST API för ett begränsat, läsande urval av Account, Contact och Opportunity.
3. En Content Online-administratör matchar en intern kund mot en Salesforce Account-post. Namnmatchning får föreslå, men Account.Id måste bekräftas och sparas som den stabila externa referensen.
4. Endast godkända fält lagras eller visas. Råa Salesforce-svar ska inte skrivas till loggar eller skickas till webbläsaren.
5. Varje synk får status, tidpunkt, källa, vald API-version och felkod utan leverantörens hemliga svar.

För stora datamängder kan Bulk API bedömas senare. Pilotens små, läsande frågor ska börja med Platform REST API och SOQL.

## Säker gräns

- Consumer Secret, access token och refresh token är serverhemligheter. De får aldrig ligga i Git, HTML, klient-JavaScript, URL-parametrar eller supportchatt.
- OAuth-callbacken måste ha en fast HTTPS-adress och verifierad state. PKCE ska användas. Begär bara api och refresh_token/offline_access om båda verkligen behövs.
- En särskild integrationsanvändare med ett minimalt Permission Set bör användas. Fält- och objekträttigheter i Salesforce är en del av säkerhetsgränsen.
- Salesforce-instansens origin måste komma från ett validerat OAuth-svar och matcha en tillåten Salesforce-domän innan servern gör anrop.
- Kunden i Content Online avgränsas av det interna kund-id:t. En Salesforce Account-referens får inte ensam bestämma vem som får läsa data.
- Frånkoppling ska återkalla token och stoppa framtida synk utan att radera revisionshistorik.

## Miljövariabler och Vercel

External Client App-konfigurationen tillhör endast Vercel-projektet
`content-online-platform`. Den får inte exponeras i den publika portalmallen eller någon kundroute.

Lokalt används `.env.local`, som är ignorerad av Git. I Vercel används krypterade,
server-only miljövariabler med separat scope för Development, Preview och Production.
Inget Salesforce-värde får ha prefixet `NEXT_PUBLIC_`.

| Variabel | Innehåll | Hemlig |
| --- | --- | --- |
| `SALESFORCE_LOGIN_URL` | `https://login.salesforce.com` för den valda trial/production-organisationen | Nej |
| `SALESFORCE_CLIENT_ID` | External Client Apps consumer key | Nej, men server-only |
| `SALESFORCE_CLIENT_SECRET` | External Client Apps consumer secret | Ja |
| `SALESFORCE_REDIRECT_URI` | Exakt callback för aktuell miljö | Nej |
| `SALESFORCE_API_VERSION` | Versionslåst Salesforce Platform API, nu `v67.0` | Nej |
| `SALESFORCE_OAUTH_STATE_SECRET` | Slumpnyckel för kortlivad OAuth state | Ja |
| `SALESFORCE_TOKEN_ENCRYPTION_KEY` | Separat 32-byte-nyckel för kryptering av sparade tokens | Ja |

Callback-adresserna som registreras i Salesforce är:

- produktion: `https://content-online-platform.vercel.app/admin/api/salesforce/oauth/callback`
- Preview: den exakta HTTPS-adressen för PR-deploymenten, tillagd först när den finns

Salesforce godkänner inte en vanlig HTTP-callback på localhost. Lokal browser-OAuth kräver därför en registrerad HTTPS-tunnel; den lokala demoservern behöver ingen OAuth för att visa prototypen.

Access- och refresh-token är anslutningsdata, inte deploy-konfiguration. De ska därför
inte läggas i `.env.local` eller Vercel Environment Variables. De lagras krypterade i
en separat, skyddad tabell och lämnas aldrig ut av registry- eller workspace-API:t.

Trial-kontot används först i Development/Preview. Production får egna värden först när
integrationen har granskats, mergats till `main` och callbacken är liveverifierad.

### Layoutprincip

Salesforce Lightning används som informations- och interaktionsreferens: tydliga
postlistor, status, relaterade poster och aktivitet. Content Online behåller däremot
sin egen navigering, typografi, färgskala och komponenthierarki. Vi kopierar alltså
inte Salesforce HTML/CSS eller dess visuella varumärke; kundgranskningen ska kännas
som en naturlig del av Content Onlines interna arbetsyta.

## Data som behöver beslutas

Prototypen föreslår följande minsta fältkarta:

| Salesforce | Content Online | Beslut |
| --- | --- | --- |
| Account.Id | Extern kundreferens | Nödvändig |
| Account.Name | Kundnamn vid granskning | Läsbar, ingen automatisk överskrivning |
| Account.Owner.Name | Kundansvarig | Bekräfta om den ska visas |
| Contact | Kontaktöversikt | Välj exakta fält; börja gärna med antal och roll |
| Opportunity.StageName | Affärssteg | Bekräfta |
| Opportunity.CloseDate | Förnyelse/avslutsdatum | Bekräfta betydelsen |
| Opportunity.Amount | Affärsvärde | Lägg inte till utan uttryckligt behov och behörighetsbeslut |

## Vad jag behöver från uppdragsgivaren

Skicka inte nycklar eller tokens. Följande icke-hemliga uppgifter räcker för nästa steg:

1. Salesforce-kontots **Organization Edition** och om det är Developer, Trial, Sandbox eller Production.
2. Bekräftelse på att Content Onlines kunder ligger som Account, eller namnet på det objekt som används i stället.
3. Vilka fält en Content Online-medarbetare ska kunna granska för en kund, och vilka som uttryckligen inte ska visas.
4. Om integrationen ska vara enbart läsande i första versionen.
5. Vem som kan agera Salesforce-administratör och skapa External Client App samt Permission Set.
6. Bekräftelse på om det är en gemensam Salesforce-organisation eller flera kundägda organisationer.

I Salesforce hittas utgåvan normalt under **Setup → Company Information → Organization Edition**. API-åtkomst ingår normalt i Enterprise, Unlimited, Performance och Developer Edition. Professional kräver normalt ett separat API-tillägg, medan Group och Essentials saknar API-åtkomst.

## Levererat och återstående

Levererat i första PR:n:

1. Serverkonfiguration och validering utan hemligheter i klienten.
2. OAuth-start och callback med signerad state, PKCE och krypterad refresh-token i en separat databastabell.
3. Begränsad, läsande Account-sökning med mockade testfall.
4. Registerkommandon för unik Account.Id-koppling per Content Online-kund.
5. En registerbaserad Salesforce-flik med OAuth-status och granskade Account-kopplingar.
6. Serververifierad Account-sökning och import av en vald Account-post som ett opublicerat kundutkast. Namn och Account.Id läses på nytt från Salesforce vid importen; webbläsaren kan inte bestämma kundnamnet.

Ett importerat testunderlag skapar inte en publik kundsajt, portalmedlem eller statistik. Administratören måste separat granska varumärke, behörighet och publicering i kundflödet.

Efter merge återstår auktorisering av testkontot mot den live callbacken, beslut om tillåtna Contact-/Opportunity-fält och en separat verifierad import innan sådana värden får visas.

Officiella Salesforce-källor:

- [Salesforce editions with API access](https://help.salesforce.com/s/articleView?id=000005140&language=en_US&type=1)
- [Configure External Client App OAuth settings](https://help.salesforce.com/s/articleView?id=sf.configure_external_client_app_oauth_settings.htm&language=en_US)
- [New Connected Apps can no longer be created in Spring '26](https://help.salesforce.com/s/articleView?id=005228017&language=en_US&type=1)
- [Summer '26 uses Salesforce API version 67.0](https://developer.salesforce.com/blogs/2026/06/the-salesforce-developers-guide-to-the-summer-26-release)
- [Connect REST API limits and when to use Platform REST API](https://developer.salesforce.com/docs/platform/connect-rest-api/guide/intro_rate_limits.html)
