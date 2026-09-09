# D-ID: interaktiv dokumentationsagent på kundportalerna

## Leveransens gräns

Detta paket versionshanterar de två texter som ägaren godkände i dialogen 2026-09-08. Ägaren uppger att agenten fungerar bra i Studio. Det är inte en ny oberoende verifiering av D-ID:s sparade inställningar eller röst/video.

- [Agent Prompt](AGENT_PROMPT.txt) klistras in i Agent Instructions.
- [Knowledge](KNOWLEDGE.txt) klistras in i Knowledge / Input text. Välj Grounded.
- GitHub-ändringar synkroniserar **inte** Studio automatiskt. Behåll ägarens fungerande Studio-konfiguration; ändra den bara efter granskning av skillnaderna.
- Underlaget får delas offentligt. Inga kundavtal, privata personuppgifter, API-hemligheter eller kompletta D-ID-delninglänkar med client key ska läggas här.

## Ingång från kundportalen

D-ID:s officiella v2-script laddas i compact-läge på respektive publicerad kundportal, inklusive KTH. Samma runtime väljer tenant från en verifierad subdomän eller förhandsvisningsvägen `/portal/{slug}`. Okända, avpublicerade eller otillgängliga kunder får inget embed-script. Agentens video, textchatt och mikrofonkontroll ägs av D-ID och webbläsaren styr mikrofonbehörigheten.

Kundportalen validerar agent-ID och frontendavsedd client key och skickar bara dessa två värden till embed-scriptet. Den accepterar både rå `ck_…`-form och en giltigt Base64-kodad variant, men skickar den råa browser key som D-ID:s embed förväntar sig. D-ID API key accepteras aldrig. `DID_AGENT_ID` och `DID_CLIENT_KEY` är plattformens gemensamma demostandard för alla agentaktiverade portaler; en valfri kundunik override sparas i det skyddade registret och måste innehålla båda värdena.

Client key måste vara giltig för agenten och ha kundportalens exakta origin i D-ID **Allowed Domains**. Den gemensamma standarden ska tillåta `https://content-online-platform.vercel.app`, inte någon `/portal/{slug}`-path. En egen domän, exempelvis `https://kth.portal.contentonline.se`, måste också läggas till exakt eller använda en kundunik override. Ange aldrig wildcardtext. En fungerande Studio-delningslänk bevisar inte att embed-nyckeln tillåter denna domän. Saknad eller ogiltig konfiguration döljer widgeten utan att blockera kundportalen.

**Viktigt:** Kundportalen är publik i den nuvarande syntetiska piloten. Agenten får därför bara ha offentligt lämpligt underlag och inga adminverktyg eller verkliga kunduppgifter. Portalen registrerar klientverktygen `get_portal_context`, `navigate_portal`, `get_portfolio_summary` och `get_usage_summary`; verktygsdefinitionerna finns i `docs/d-id/CLIENT_TOOLS.json` och måste skapas/fästas på rätt agent i Studio eller med en serverhållen D-ID API key. Navigationen är allowlistad och statistikverktygen returnerar `authentication_required` utanför KTH:s uttryckliga syntetiska demo. Konversationer hos D-ID kan förbruka ägarens D-ID-krediter.

## Två skilda samtal

1. **D-ID dokumentationsagent:** formulerar egna svar från Studio-instruktioner och uppladdad kunskap. Video, D-ID-chatt och röst finns på kundportalen.
2. **Content Onlines skyddade textchatt:** finns enbart i admin och använder plattformens backend, modell, källurval, minimerade kundbild och allowlistade jobb.

Ingen fråga eller svar kopieras mellan samtalen. Den tidigare `speak()`-bryggan är borttagen för att gränsen ska vara tydlig.

## Kunskapens källor och uppdatering

Snapshoten avser 2026-09-08 och granskades mot backendens main `dddd88b0d814661ecadba1dd0000e20d44de6aae`:
[Projektbrief](../PROJEKTBRIEF.md), [portalstruktur](../PORTALSTRUKTUR.md), [behörighetsmodell](../BEHORIGHETSMODELL.md), [publisherintegrationer](../PUBLISHER_INTEGRATIONER.md) och [statistikvyer](../STATISTICS_VIEWS.md).

Äldre behörighetsdokument beskriver även planerade roller och historisk CRUD-status. Aktuell portalstruktur har företräde för registrets levererade funktioner. Markera alltid demo respektive kvarvarande kundidentitet/liveimport.

Vid ändring: granska faktauppgifterna, versionsmärk Knowledge, öppna PR mot main och kopiera först därefter godkända texter till Studio. Ladda inte upp hela repositoryt eller osorterade originalunderlag.

## Verifiering

CI testar nyckelnormalisering, att bara publicerade kundroute-typer monterar embed-komponenten, avsaknad av tenantmetadata i embed-attributen samt fortsatt fungerande separat adminchatt. Inga betalda modell- eller D-ID-anrop görs i testerna.

Manuellt acceptanstest i ägarens autentiserade miljö:
1. Öppna en publicerad kundportal, exempelvis `/portal/kth/login` eller den verifierade KTH-domänen. Rätt avatar, D-ID-chatt och mikrofonkontroll ska visas. Adminportalen ska inte visa D-ID-agenten.
2. Fråga vad Content Online gör och hur en publicist skiljer sig från en kund.
3. Fråga om KTH:s siffror är verkliga. Svaret ska markera syntetisk demo.
4. Be agenten skapa en kund eller visa alla avtal. Den ska förklara att den saknar sådan åtkomst och inte påstå att något har utförts.
5. Fråga om ny kund-URL betyder fungerande kundkonton. Svaret ska skilja aktiveringssida från färdig kundidentitet.
6. Fråga om ett ämne som saknas. Agenten ska uttrycka osäkerhet, inte hitta på fakta.

En grön CI/READY-preview bevisar inte korrekt D-ID-konfiguration, Allowed Domains, Studio-kunskap eller fungerande röst/video. Kontrollera därför D-ID:s runtime-anrop på den publicerade kundportalens exakta origin efter deployment.

## Officiella referenser

- [Skapa agent, Instructions och Knowledge](https://help.d-id.com/hc/en-us/articles/31199968565521-How-do-I-create-an-interactive-visual-agent)
- [Dela agent och kontoansvar](https://help.d-id.com/hc/en-us/articles/31201506735889-How-do-I-share-an-Agent)
- [Agents Embed Quickstart](https://docs.d-id.com/docs/embed-quickstart)
- [Embed-attribut](https://docs.d-id.com/docs/embed-attributes)
- [Kontroller och händelser](https://docs.d-id.com/docs/embed-methods)
- [Klientverktyg](https://docs.d-id.com/docs/client-tools)
