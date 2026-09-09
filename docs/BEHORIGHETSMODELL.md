# Behörighetsmodell

**Version:** 0.3

**Datum:** 2026-09-09

**Status:** Identitets- och tenantgränsen är implementerad för pilotflödet.
Detaljerade rättigheter till framtida livefunktioner är fortfarande föreslagna.

## En identitet, separata behörighetsdomäner

Plattformen använder Clerk som gemensam identitetsleverantör och Neon som
auktoritativt register för roller, kundmedlemskap och tenantscope. Den skiljer
strikt mellan kundmedlemskap och Content Onlines interna administration.

| Domän | Ingång | Roller |
| --- | --- | --- |
| Kund | `/` med login-overlay, eller `/login` som fallback | Kundadmin, Läsare |
| Content Online | `/admin` och `/admin/login` | Content Online-administratör; framtida kundscopad operatör |

En Content Online-administratör är inte en högre kundroll och blir inte
automatiskt medlem i kundorganisationerna. På motsvarande sätt ger ett
kundmedlemskap aldrig intern adminbehörighet.

Det finns inga publika `/demo`-inloggningar eller äldre login-alias i
produktionsmodellen. Testidentiteter och fixtures används bara lokalt och i CI
och får aldrig godtas som session eller behörighetsbevis i Production.

KTH är en uttryckligen syntetisk pilot på `/portal/kth`. Den ska inte få verkliga
portalmedlemmar, är inte en källa till livekunddata och kan inte användas som
fallback för en annan tenant.

## Levererad kundidentitet

Kundflödet fungerar i följande ordning:

1. Content Online sparar medlemskapet i Neon. För en publicerad portal synkar
   backend adressen till Clerk-instansens signup-allowlist utan separat mejl och
   skapar därefter en personlig Clerk-inbjudan till samma adress.
2. Inbjudningslänken öppnar `/registrera`; fri registrering utan inbjudan erbjuds
   inte.
3. Clerk verifierar identiteten.
4. Backend läser aktiva serverägda medlemskap.
5. `/v1/portal-entries` returnerar bara publicerade portaler som identiteten får
   använda.
6. `/portal/{slug}` verifierar samma medlemskap innan skyddad kundstatus eller
   data får visas.

En e-postadress används bara för en väntande inbjudan. Vid första godkända
inloggningen binds medlemskapet till identitetsleverantörens stabila användar-ID.
Slug, queryparameter, kunddomän och frontendval är aldrig behörighetsbevis.

Samma person kan ha en separat roll i flera organisationer. Ett konto utan aktivt
medlemskap ser ingen kundportal. Inaktivering av ett medlemskap ska slå igenom
server-side även om användaren fortfarande har en giltig Clerk-session.

## Levererad intern adminidentitet

Content Online-personal använder `/admin/login`. Servern kräver:

- giltig token från rätt Clerk-origin;
- aktiv och icke spärrad session;
- verifierad primär e-post;
- matchning mot den serverkonfigurerade interna allowlisten.

Publik admin-HTML innehåller inga person- eller kunduppgifter. De hämtas först
från skyddade `/admin/api/*` efter serververifiering. Kundcookies,
kundadministratörsroller och klientredigerbar metadata accepteras aldrig som
intern behörighet.

## Kundroller

### Kundadmin

Kundadmin är en roll inom en specifik kundorganisation. Målbilden är en
organisationsomfattande överblick över de informationsprodukter och flöden som
Content Online har gjort tillgängliga för just den kunden:

- produkter, abonnemang, publicister och accessläge;
- användningsdata med källa, period, definition och täckning;
- godkända kostnads-KPI:er och deras beräkning;
- dokument och avtalsmetadata som rollen får läsa;
- förnyelsedatum och icke-bindande status;
- organisationens ärenden och historik;
- organisationens portalmedlemmar och roller.

Kundadmin får inte se en annan kund, ändra källdata eller credentials,
provisionera publisheraccess eller göra juridiskt bindande förnyelsebeslut.
Ändringar av medlemskap eller publisheraccess ska gå genom ett kontrollerat
Content Online-flöde när detta byggs; medlemskap i portalen ändrar inte ett
externt avtal.

### Läsare

Läsaren ska kunna se den egna organisationens tillåtna portfölj,
usage-översikt och allmänna kunddokument samt skapa och följa egna ärenden.

Som säker utgångspunkt ser Läsaren inte kostnader, CPD, avtal eller andra
användares ärenden. Detta kan öppnas först genom ett uttryckligt produktbeslut.

## Interna roller

### Content Online-administratör

Den levererade `content_admin`-rollen hanterar det beständiga registret:
kundorganisationer, portalmedlemmar, publicister, publicering, arkivering,
domänstatus och portalinställningar. Rollen och dess autentisering är separerade
från kundportalen.

### Kundscopad operatör

En framtida operatörsroll kan arbeta med uttryckligen tilldelade
kundorganisationer, hantera ärenden och följa importer. Operatören ska välja ett
aktivt kundscope innan kunddata öppnas. Denna mer detaljerade delegering är en
målbild och ska inte beskrivas som levererad enbart för att `content_admin`
finns.

## Föreslagen rättighetsmatris för livefunktioner

Tabellen beskriver målbilden när verkliga produkter, statistik, kostnader,
dokument och ärenden har anslutits. Dessa datakällor är inte live ännu.

| Förmåga | Läsare | Kundadmin | CO-operatör |
| --- | ---: | ---: | ---: |
| Se egen aktiv portfölj | Ja | Ja, komplett tillåten bild | Vid tilldelat kundscope |
| Se usage | Översikt | Full organisationsvy | Data och importkvalitet |
| Se kostnad/CPD | Nej som standard | Ja | Ja, inom tilldelat scope |
| Se dokument | Allmänna kunddokument | Alla tillåtna kunddokument | Publicerar/klassificerar |
| Se ärenden | Egna | Organisationens | Tilldelade kunder |
| Skapa ärende | Ja | Ja | Ja |
| Ändra portalmedlem/roll direkt | Nej | Kontrollerat kundflöde | Verkställer godkänd ändring |
| Ändra publisheraccess direkt | Nej | Nej; begär ändring | Nej i första versionen; kontrollerat flöde |
| Hantera källkopplingar | Nej | Nej | Ja |

## Backendregler

- Identitetsleverantören bevisar vem personen är; Content Online-backend beslutar
  vad personen får göra.
- Varje kundägd post bär ett tenant-ID: medlemskap, portfölj, usage, kostnad,
  dokument, ärende, export, cache och synkjobb.
- Tenant-scope härleds från aktivt medlemskap eller uttrycklig intern
  operatörstilldelning. Ett tenant-ID från frontend är aldrig behörighetsbevis.
- Backend returnerar minsta tillåtna data. Frontendfiltrering är inte en
  säkerhetsmekanism.
- Organisationbyte är explicit och ska auditloggas.
- Audit-händelser innehåller aktör, roll, tenant, åtgärd, resurs-ID, UTC-tid,
  resultat och request-ID, men aldrig lösenord, tokens eller råa hemligheter.
- Alla negativa tenant-, sessions- och rollfall ska regressionstestas.
- Saknad livekälla ska ge ett låst, ej anslutet eller otillgängligt läge. Den får
  aldrig ersättas med testfixtures i Production.
