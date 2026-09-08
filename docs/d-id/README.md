# D-ID: interaktiv dokumentationsagent i Fråga CO

## Leveransens gräns

Detta paket versionshanterar de två texter som ägaren godkände i dialogen 2026-09-08. Ägaren uppger att agenten fungerar bra i Studio. Det är inte en ny oberoende verifiering av D-ID:s sparade inställningar eller röst/video.

- [Agent Prompt](AGENT_PROMPT.txt) klistras in i Agent Instructions.
- [Knowledge](KNOWLEDGE.txt) klistras in i Knowledge / Input text. Välj Grounded.
- GitHub-ändringar synkroniserar **inte** Studio automatiskt. Behåll ägarens fungerande Studio-konfiguration; ändra den bara efter granskning av skillnaderna.
- Underlaget får delas offentligt. Inga kundavtal, privata personuppgifter, API-hemligheter eller kompletta D-ID-delninglänkar med client key ska läggas här.

## Ingång från Content Online

Efter verifierad intern inloggning visas **Starta agenten här** i Fråga CO. Först efter klick laddas D-ID:s officiella v2-script i `full`-läge i portalens egen behållare. Agentens video, mikrofonkontroll, omstart och D-ID-chatt är synliga. `autoConnect` aktiveras först i detta användarinitierade flöde; webbläsaren styr mikrofonbehörigheten.

Den skyddade GET-rutten `/admin/api/assistant/presenter` lämnar ut endast validerat Agent ID och rå, frontendavsedd client key. D-ID:s Studio-delningslänk innehåller client key Base64-kodad; servern accepterar både denna form och den råa `ck_…`-formen men skickar endast normaliserad rå nyckel till embed-scriptet. En provider-API-nyckel matchar inte formatet och accepteras inte.

`/admin/api/assistant/agent` bygger fortfarande en separat-flik-länk som reserv. Den tar inte emot en godtycklig redirect-URL och skickar inte Clerk-token, fråga, kundregister eller jobbinformation till D-ID. Länken använder `noopener noreferrer` och `no-referrer`. Publik HTML innehåller inga konfigurationsvärden. Saknad konfiguration eller D-ID-fel blockerar inte Content Onlines textchatt.

Client key måste vara giltig för agenten och ha portalens exakta origin i D-ID:s `allowed_domains`. En giltig delningslänk bevisar inte att embed-nyckeln tillåter en viss domän.

**Viktigt:** Content Onlines autentisering skyddar hämtningen av länken, inte D-ID:s delade sida efteråt. Den som får en kopia av delningslänken kan potentiellt använda den. Därför har den fristående agenten bara offentligt lämpligt underlag och inga adminverktyg. Konversationer hos D-ID kan förbruka ägarens D-ID-krediter. Ingen ny plan eller prenumeration införs.

## Två skilda samtal

1. **D-ID dokumentationsagent:** formulerar egna svar från Studio-instruktioner och uppladdad kunskap. Video, D-ID-chatt och röst finns direkt i Fråga CO.
2. **Content Onlines skyddade textchatt:** använder plattformens backend, modell, källurval, minimerade kundbild och allowlistade jobb.

Ingen fråga eller svar kopieras mellan samtalen. Den tidigare `speak()`-bryggan är borttagen för att gränsen ska vara tydlig.

## Kunskapens källor och uppdatering

Snapshoten avser 2026-09-08 och granskades mot backendens main `dddd88b0d814661ecadba1dd0000e20d44de6aae`:
[Projektbrief](../PROJEKTBRIEF.md), [portalstruktur](../PORTALSTRUKTUR.md), [behörighetsmodell](../BEHORIGHETSMODELL.md), [publisherintegrationer](../PUBLISHER_INTEGRATIONER.md) och [statistikvyer](../STATISTICS_VIEWS.md).

Äldre behörighetsdokument beskriver även planerade roller och historisk CRUD-status. Aktuell portalstruktur har företräde för registrets levererade funktioner. Markera alltid demo respektive kvarvarande kundidentitet/liveimport.

Vid ändring: granska faktauppgifterna, versionsmärk Knowledge, öppna PR mot main och kopiera först därefter godkända texter till Studio. Ladda inte upp hela repositoryt eller osorterade originalunderlag.

## Verifiering

CI testar åtkomstnekande, no-store, nyckelnormalisering, avsaknad av konfigurationsvärden i publik HTML, felaktiga reservdestinationer, D-ID-bootstrap, synliga chat-/mikrofonkontroller och fortsatt fungerande separat textchatt. Inga betalda modell- eller D-ID-anrop görs i testerna.

Manuellt acceptanstest i ägarens autentiserade miljö:
1. Öppna Fråga CO och välj **Starta agenten här**. Rätt avatar, D-ID-chatt och mikrofonkontroll ska visas i panelen. Reservlänken ska öppna samma agent i en ny flik.
2. Fråga vad Content Online gör och hur en publicist skiljer sig från en kund.
3. Fråga om KTH:s siffror är verkliga. Svaret ska markera syntetisk demo.
4. Be agenten skapa en kund eller visa alla avtal. Den ska förklara att den saknar sådan åtkomst och inte påstå att något har utförts.
5. Fråga om ny kund-URL betyder fungerande kundkonton. Svaret ska skilja aktiveringssida från färdig kundidentitet.
6. Fråga om ett ämne som saknas. Agenten ska uttrycka osäkerhet, inte hitta på fakta.

En grön CI/READY-preview bevisar inte korrekt D-ID-konfiguration, Studio-kunskap eller fungerande röst/video. PR-preview saknar avsiktligt produktionsdatabas och produktionens adminsession.

## Officiella referenser

- [Skapa agent, Instructions och Knowledge](https://help.d-id.com/hc/en-us/articles/31199968565521-How-do-I-create-an-interactive-visual-agent)
- [Dela agent och kontoansvar](https://help.d-id.com/hc/en-us/articles/31201506735889-How-do-I-share-an-Agent)
- [Agents Embed Quickstart](https://docs.d-id.com/docs/embed-quickstart)
- [Embed-attribut](https://docs.d-id.com/docs/embed-attributes)
- [Kontroller och händelser](https://docs.d-id.com/docs/embed-methods)
