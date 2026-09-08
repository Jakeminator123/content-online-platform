# D-ID: dokumentationsagent och portalens ingång

## Leveransens gräns

Detta paket versionshanterar de två texter som ägaren godkände i dialogen 2026-09-08. Ägaren uppger att agenten fungerar bra i Studio. Det är inte en ny oberoende verifiering av D-ID:s sparade inställningar eller röst/video.

- [Agent Prompt](AGENT_PROMPT.txt) klistras in i Agent Instructions.
- [Knowledge](KNOWLEDGE.txt) klistras in i Knowledge / Input text. Välj Grounded.
- GitHub-ändringar synkroniserar **inte** Studio automatiskt. Behåll ägarens fungerande Studio-konfiguration; ändra den bara efter granskning av skillnaderna.
- Underlaget får delas offentligt. Inga kundavtal, privata personuppgifter, API-hemligheter eller kompletta D-ID-delninglänkar med client key ska läggas här.

## Ingång från Content Online

Efter verifierad intern inloggning visas **Öppna D-ID-agenten** i Fråga CO. En vanlig länk öppnar den konfigurerade Studio-agenten i en separat flik efter användarens klick. Inget D-ID-script, samtal, mikrofon eller ljud startar automatiskt genom denna ingång. D-ID:s egen startsida styr eventuell samtalsstart och mikrofonbehörighet.

Den skyddade GET-rutten `/admin/api/assistant/agent` bygger länken från de redan befintliga browser-config-värdena `DID_AGENT_ID` och `DID_CLIENT_KEY`. Den tar inte emot en godtycklig redirect-URL och skickar inte Clerk-token, fråga, kundregister eller jobbinformation till D-ID. Länken använder `noopener noreferrer` och `no-referrer`. Publik HTML innehåller inga av värdena. Saknad konfiguration eller fel döljer länken, erbjuder återförsök och blockerar inte textchatten.

Den befintliga client key måste vara giltig för just den delade agenten. Den här PR:n ändrar inga Vercel-värden. Om D-ID roterar eller skiljer på delnings- och embednycklar behöver konfigurationen ses över separat; en giltig länkform är inte bevis för att leverantören accepterar den.

**Viktigt:** Content Onlines autentisering skyddar hämtningen av länken, inte D-ID:s delade sida efteråt. Den som får en kopia av delningslänken kan potentiellt använda den. Därför har den fristående agenten bara offentligt lämpligt underlag och inga adminverktyg. Konversationer hos D-ID kan förbruka ägarens D-ID-krediter. Ingen ny plan eller prenumeration införs.

## Två skilda funktioner

1. **D-ID dokumentationsagent:** formulerar egna svar från Studio-instruktioner och uppladdad kunskap. Används i den separata fliken.
2. **Valfri uppläsning av textchatten:** den tidigare embed-integrationen anropar enbart `speak()` med backendens färdiga svar. Den skapar inte dessa svar, skickar inte frågorna och aktiverar inte mikrofonen. Kontrollen finns kvar under en utfällbar rubrik.

Textchatten, dess modell, källurval, kundbild och allowlistade jobb ändras inte. Inga kundfrontendfiler, databasposter eller behörighetsregler ändras.

## Kunskapens källor och uppdatering

Snapshoten avser 2026-09-08 och granskades mot backendens main `dddd88b0d814661ecadba1dd0000e20d44de6aae`:
[Projektbrief](../PROJEKTBRIEF.md), [portalstruktur](../PORTALSTRUKTUR.md), [behörighetsmodell](../BEHORIGHETSMODELL.md), [publisherintegrationer](../PUBLISHER_INTEGRATIONER.md) och [statistikvyer](../STATISTICS_VIEWS.md).

Äldre behörighetsdokument beskriver även planerade roller och historisk CRUD-status. Aktuell portalstruktur har företräde för registrets levererade funktioner. Markera alltid demo respektive kvarvarande kundidentitet/liveimport.

Vid ändring: granska faktauppgifterna, versionsmärk Knowledge, öppna PR mot main och kopiera först därefter godkända texter till Studio. Ladda inte upp hela repositoryt eller osorterade originalunderlag.

## Verifiering

CI testar åtkomstnekande, no-store, URL-kodning, avsaknad av konfigurationsvärden i publik HTML, felaktiga destinationer, återförsök och fortsatt fungerande textchatt. De tidigare röstavatarregressionerna behålls. Inga betalda modell- eller D-ID-anrop görs i testerna.

Manuellt acceptanstest i ägarens autentiserade miljö:
1. Öppna Fråga CO och välj D-ID-agenten. Rätt agent ska visas i en ny flik utan att CO-session eller chatt skickas dit.
2. Fråga vad Content Online gör och hur en publicist skiljer sig från en kund.
3. Fråga om KTH:s siffror är verkliga. Svaret ska markera syntetisk demo.
4. Be agenten skapa en kund eller visa alla avtal. Den ska förklara att den saknar sådan åtkomst och inte påstå att något har utförts.
5. Fråga om ny kund-URL betyder fungerande kundkonton. Svaret ska skilja aktiveringssida från färdig kundidentitet.
6. Fråga om ett ämne som saknas. Agenten ska uttrycka osäkerhet, inte hitta på fakta.

En grön CI/READY-preview bevisar inte korrekt D-ID-konfiguration, Studio-kunskap eller fungerande röst/video. PR-preview saknar avsiktligt produktionsdatabas och produktionens adminsession.

## Officiella referenser

- [Skapa agent, Instructions och Knowledge](https://help.d-id.com/hc/en-us/articles/31199968565521-How-do-I-create-an-interactive-visual-agent)
- [Dela agent och kontoansvar](https://help.d-id.com/hc/en-us/articles/31201506735889-How-do-I-share-an-Agent)
