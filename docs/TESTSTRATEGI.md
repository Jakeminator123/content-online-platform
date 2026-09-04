# Bottom-up teststrategi

**Version:** 0.1
**Status:** Metod beslutad för dokumentationen, verktyg och ramverk öppna

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
| `INV-source-001` | Visad usage har källa, period och aktualitet. | Schema, adapter och UI |
| `INV-adapter-001` | Varje publisheradapter översätter till samma interna kontrakt utan att hitta på mätetal som källan saknar. | Kontrakt och integration |
| `INV-preset-001` | En förinställd statistikvy visar filter, period, källa och beräkning och får inte dölja att andra giltiga vyer ger ett annat resultat. | Domän, UI och E2E |
| `INV-sync-001` | Återimport av samma källdata skapar inte oavsiktliga dubbletter. | Adapter och integration |
| `INV-mapping-001` | Okänd organisation eller produkt får aldrig mappas till närmaste gissning. | Domän och integration |
| `INV-demo-001` | Mockad data eller funktion markeras som demo och rapporteras aldrig som extern synk. | UI och E2E |
| `INV-document-001` | Dokument hämtas först efter serverkontrollerat medlemskap och behörighet. | API, integration och säkerhetstest |
| `INV-request-001` | Ett ärende kan bara skapas för ett abonnemang inom användarens tillåtna organisationsscope. | Domän, API och E2E |
| `INV-secret-001` | Credentials förekommer inte i klientbundle, loggar, fixtures eller API-svar. | Build-, logg- och säkerhetstest |
| `INV-degradation-001` | Fel i en usage-källa görs synligt utan att abonnemangs- och dokumentvyer blir oanvändbara. | Integration och E2E |
| `INV-semantic-001` | Ett källmått får bara en kanonisk metric genom en explicit, versionshanterad semantisk mappning. | Domän och kontrakt |
| `INV-total-001` | För additiva mått motsvarar accepterad normaliserad totalsumma källans totalsumma; oförklarad avvikelse stoppar publicering. | Adapter och integration |
| `INV-aggregate-001` | Data summeras aldrig över publishers utan matchande definition och jämförbarhetsnyckel. | Domän, API och UI |
| `INV-missing-001` | Saknad, partiell eller sen data tolkas aldrig som usage 0. | Adapter, API och UI |
| `INV-cpd-001` | CPD/CPR använder samma tenant, produkt/allokering, kompatibel period, beslutad valuta och godkänt usage-mått. | Domän och integration |
| `INV-cpd-002` | Noll nämnare, okänd kostnadsgrund eller okänd paketallokering ger ingen definitiv CPD/CPR. | Domän och UI |
| `INV-provenance-001` | Varje visad datapunkt kan spåras till synkkörning, adapterversion, mappingversion och källpost eller artifact-hash. | Schema, API och E2E |

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

### 5. E2E för den valda vertikala resan

När Q-003 och Q-004 har besvarats låses en enda pilotresa. Ett troligt första flöde är:

1. Logga in som en representativ kundperson.
2. Se rätt organisation och abonnemang.
3. Öppna ett abonnemang och förstå access, dokument och aktualitet.
4. Filtrera usage för vald period och produkt.
5. Skapa ett access- eller supportärende.
6. Se ärendet med korrekt status och historik.
7. Försök läsa motsvarande resurser i en annan tenant och verifiera att åtkomst nekas.

## Regression och leveransgrindar

En ändring är inte verifierad enbart för att en build är grön. Relevanta grindar redovisas separat:

- typkontroll,
- lint,
- fokuserade domän- och kontraktstester,
- integrationstester,
- produktionsbuild,
- E2E för påverkad användarresa,
- tillgänglighetskontroll,
- säkerhets- och tenanttest,
- preview-verifiering,
- produktionsverifiering efter separat godkänd deployment.

Varje fel som når demo, pilot eller produktion ska först få ett reproducerande regressionstest på lägsta rimliga nivå och därefter en fix.

## Vad som ännu inte är valt

Testframework, CI-leverantör, webbramverk, databas och hosting väljs först efter Q-006, Q-007, Q-009, Q-010 och Q-015. GitHub Actions och Vercel Preview är möjliga delar av leveranskedjan men är inte beslutade genom detta dokument.
