# Bottom-up teststrategi

**Version:** 0.2
**Status:** Första backendgrunden implementerad med TypeScript, Hono, Zod/OpenAPI, Vitest och GitHub Actions

## Mål

Projektet ska byggas från verifierbara domänregler och datakontrakt upp till hela användarresor. Varje viktigt påstående ska kunna spåras från källa och beslut till ett acceptanskriterium och ett regressionstest.

```text
Källa -> fråga -> beslut -> atomärt krav -> invariant -> test -> verifieringsbevis
```

## Identifierare

| Prefix | Betydelse | Exempel |
|---|---|---|
| `SRC-` | Källa | `SRC-002` |
| `Q-` | Öppen fråga | `Q-007` |
| `DEC-` | Godkänt beslut | `DEC-usage-001` |
| `REQ-` | Atomärt produkt- eller systemkrav | `REQ-tenant-001` |
| `INV-` | Regel som alltid ska hålla | `INV-tenant-001` |
| `TEST-` | Automatiserat eller manuellt verifieringsfall | `TEST-api-tenant-001` |

## Kravmall

Varje krav ska minst innehålla:

- en entydig mening,
- status: föreslaget, godkänt, implementerat eller verifierat,
- källa och eventuellt beslut,
- beslutsägare och datum,
- acceptanskriterier,
- negativt fall,
- test-ID,
- vilket verifieringsbevis som krävs.

Exempel:

```markdown
ID: REQ-tenant-001
Krav: En kundperson får bara läsa abonnemang för organisationer där personen har ett aktivt medlemskap.
Källa: DEC-identity-001
Acceptans: API:t returnerar 404 eller 403 för ett abonnemang i en annan organisation.
Negativt fall: Ett manipulerat organizationId får inte ändra serverns scope.
Test: TEST-api-tenant-001, TEST-e2e-tenant-001
```

## Första invariantsamling

| ID | Invariant | Tidigaste testnivå |
|---|---|---|
| `INV-tenant-001` | Ingen användare kan läsa eller ändra en annan kundorganisations data. | Domän, repository, API och E2E |
| `INV-auth-001` | Portalidentitet och innehållsaccess är separata modeller. | Domän och kontrakt |
| `INV-source-001` | Usage-svar innehåller källa, period och aktualitet. | Schema, adapter och API |
| `INV-adapter-001` | Varje publisheradapter översätter till samma interna kontrakt utan att hitta på mätetal som källan saknar. | Kontrakt och integration |
| `INV-preset-001` | API:t för en förinställd statistikvy returnerar filter, period, källa och beräkning och får inte dölja andra giltiga utfall. | Domän, kontrakt och API |
| `INV-sync-001` | Återimport av samma källdata skapar inte oavsiktliga dubbletter. | Adapter och integration |
| `INV-mapping-001` | Okänd organisation eller produkt får aldrig mappas till närmaste gissning. | Domän och integration |
| `INV-demo-001` | Mockad data eller funktion markeras som demo i API-kontraktet och rapporteras aldrig som extern synk. | Schema och API |
| `INV-document-001` | Dokument hämtas först efter serverkontrollerat medlemskap och behörighet. | API, integration och säkerhetstest |
| `INV-request-001` | Ett ärende kan bara skapas för ett abonnemang inom användarens tillåtna organisationsscope. | Domän, API och E2E |
| `INV-secret-001` | Credentials förekommer inte i klientbundle, loggar, fixtures eller API-svar. | Build-, logg- och säkerhetstest |
| `INV-degradation-001` | Fel i en usage-källa görs synligt utan att abonnemangs- och dokument-API:er blir oanvändbara. | Integration och API |
| `INV-semantic-001` | Ett källmått får bara en kanonisk metric genom en explicit, versionshanterad semantisk mappning. | Domän och kontrakt |
| `INV-total-001` | För additiva mått motsvarar accepterad normaliserad totalsumma källans totalsumma; oförklarad avvikelse stoppar publicering. | Adapter och integration |
| `INV-aggregate-001` | Data summeras aldrig över publishers utan matchande definition och jämförbarhetsnyckel. | Domän och API |
| `INV-missing-001` | Saknad, partiell eller sen data tolkas aldrig som usage 0. | Adapter och API |
| `INV-cpd-001` | CPD/CPR använder samma tenant, produkt/allokering, kompatibel period, beslutad valuta och godkänt usage-mått. | Domän och integration |
| `INV-cpd-002` | Noll nämnare eller okänd paketallokering ger ingen definitiv CPD/CPR. | Domän och API |
| `INV-provenance-001` | Varje visad datapunkt kan spåras till synkkörning, adapterversion, mappingversion och källpost eller artifact-hash. | Schema, API och E2E |
| `INV-no-standard-001` | En publisher får inget verktyg, format eller mätetal genom antagande; varje capability kräver källbevis. | Kontrakt och integration |
| `INV-role-001` | Läsare kan inte utföra Kundadmin-operationer och ingen kundroll kan utföra intern operatörsåtgärd. | Domän och API |
| `INV-frontend-001` | Backend returnerar aldrig otillåtna fält med antagandet att frontend ska gömma dem. | Repository, API och säkerhetstest |

## Testlager

### 1. Domän- och schematester

Testa rena regler utan nätverk eller UI:

- roll och organisationsscope,
- renewal-datum och status,
- normalisering av usage-mätetal,
- data freshness,
- extern ID-mappning,
- validering av request och dokumentmetadata.

### 2. Adapter- och kontraktstester

Varje extern källa får versionshanterade, syntetiska, publikt tillhandahållna med kontrollerade återanvändningsvillkor eller rättighetsgodkända fixtures. För COUNTER börjar vi med standardens officiella R5.1-exempel. Testerna ska täcka giltigt svar, okänt mått, okänd produkt, partiell period, schemaändring, dubbelimport, historisk korrigering, noll usage, paketkostnad, 401/403, 429, timeout och 5xx.

Inga testfixtures får innehålla riktiga kunduppgifter eller hemligheter.

### 3. Repository- och integrationstester

Testa databasgränser, tenantfiltrering, idempotenta imports, audit, requesthistorik och kontrollerad dokumenthämtning. Testerna ska använda samma server-side scope som produktionskoden.

### 4. API- och säkerhetstester

Varje läsande och skrivande endpoint får minst ett positivt och ett negativt tenantfall. Manipulerade ID:n, saknat medlemskap, fel roll, replay och otillåten filtyp ska testas där de är relevanta.

### 5. Backendacceptans för den valda vertikala resan

Den första resan körs direkt mot API:t tills frontendkopplingen finns:

1. Skapa två syntetiska kundorganisationer.
2. Autentisera en Kundadmin och en Läsare i organisation A.
3. Importera en IEEE/MPS-liknande fixture två gånger och verifiera idempotens.
4. Läs rätt organisation, abonnemang, usage, källa och aktualitet.
5. Verifiera att Läsaren inte får kostnad, avtal eller adminresurser.
6. Skapa och följ ett access- eller supportärende.
7. Försök läsa motsvarande resurser i organisation B och verifiera att åtkomst nekas.
8. Verifiera audit events och full provenance.

Cross-repo E2E för den kompletta användarresan aktiveras när frontendkopplingen finns.

## Regression och leveransgrindar

En ändring är inte verifierad enbart för att en build är grön. Relevanta grindar redovisas separat:

- typkontroll,
- lint,
- fokuserade domän- och kontraktstester,
- OpenAPI-/JSON-schema-kompatibilitet,
- integrationstester,
- produktionsbuild,
- backendacceptans för påverkad användarresa,
- säkerhets- och tenanttest,
- preview-verifiering,
- produktionsverifiering efter separat godkänd deployment.

Varje fel som når demo, pilot eller produktion ska först få ett reproducerande regressionstest på lägsta rimliga nivå och därefter en fix.

## Vad som ännu inte är valt

GitHub Actions är vald som första CI-grind. Databas, identitetsleverantör och slutligt hostingupplägg återstår. Frontendens tillgänglighets- och E2E-grindar ägs av frontendspåret men ska senare ingå i den gemensamma leveransverifieringen.
