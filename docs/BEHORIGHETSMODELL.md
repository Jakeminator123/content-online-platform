# Behörighetsmodell

**Version:** 0.1

**Datum:** 2026-09-04

**Status:** Roller är arbetsbeslut; rättighetsmatrisen är föreslagen säker standard tills Content Online godkänner detaljerna

## Roller

Kundportalen har två nivåer:

1. **Kundadmin** – bibliotekarien i pilotresan.
2. **Läsare** – en kundanvändare med begränsad åtkomst.

Content Online-personal hanteras som **Content Online-operatör** i en separat intern säkerhetsdomän. Operatören är inte en högre kundroll och blir inte medlem i alla kundorganisationer.

### Förtydligande 2026-09-05: företagsadministration

**Content Online-administratör (`content_admin`)** är en separat intern administrativ roll, inte KTH:s Kundadmin och inte automatiskt samma sak som en kundtilldelad operatör. Uppdraget omfattar att Content Online ska kunna hantera kundorganisationer, användare, sitt publicistregister och kundernas produkt-/publicisttilldelningar.

Den första interna inloggningen använder Clerk och serververifierad primär e-post på en uttrycklig allowlist. En skyddad, skrivskyddad intern arbetsyta finns för pilotkonfigurationen. En separat publik `/demo` visar enbart syntetiska fixtures och ger ingen adminsession eller rätt till `/admin/api/*`. Kundförhandsvisningar härleds från varje fiktiv organisations produkt-ID:n. CRUD-funktionerna och databaslagringen är ännu inte implementerade. Tabellen nedan beskriver fortfarande kund-/operatörskontraktet, inte en levererad fullständig skrivande administrationsyta. Se [aktuell drift och återstående arbete](ADMIN_DRIFT.md).

Tilldelning i kundportalen ska skiljas från faktisk licens-/accessprovisionering hos en publisher. Att Content Online ändrar vad kunden ser i portalen får inte påstås ändra ett externt avtal eller publisherkonto.

## Kundadminens föreslagna överblick

Bibliotekariens uppgift förtydligas som en organisationsomfattande överblick över allt som Content Online har gjort tillgängligt för den egna kunden:

- produkter, abonnemang, publishers och accessläge,
- användningsdata med källa, period, definition och datatäckning,
- godkända kostnads-KPI:er och deras beräkning,
- tillåtna dokument och avtalsmetadata,
- förnyelsedatum och icke-bindande status,
- organisationens tickets och historik,
- organisationens portalanvändare och deras roller.

Kundadmin får inte se en annan kundorganisation, ändra källdata eller credentials, provisionera publisheraccess eller göra juridiskt bindande renewal-godkännanden. Ändring av portalmedlem, roll eller publisheraccess skapar i V1 en ticket till Content Online i stället för att verkställas direkt.

## Läsare – föreslagen säker standard

Läsaren får se den egna organisationens aktiva portfölj, publicerade usage-översikt och dokument som är märkta för vanliga användare. Läsaren får skapa och följa sina egna tickets.

Som säker utgångspunkt ser Läsaren inte kostnader, CPD, avtal eller andra användares tickets. Detta kan öppnas senare genom ett uttryckligt beslut.

## Content Online-operatör – föreslagen säker standard

En operatör kan arbeta med tilldelade kundorganisationer, hantera tickets, verkställa godkända användarändringar, följa imports/synkfel och administrera publisher- och affärssystemsanslutningar.

Operatören måste välja ett aktivt kundscope innan kunddata öppnas. Valet, ändamålet och åtgärden auditloggas. Det finns ingen dold global `isAdmin` som automatiskt ger obegränsad åtkomst.

## Föreslagen enkel behörighetsmatris

| Förmåga | Läsare | Kundadmin | CO-operatör |
|---|---:|---:|---:|
| Se egen aktiv portfölj | Ja | Ja, komplett tillåten bild | Vid tilldelat kundscope |
| Se usage | Översikt | Full organisationsvy | Data och importkvalitet |
| Se kostnad/CPD | Nej som standard | Ja | Ja, inom tilldelat scope |
| Se dokument | Allmänna kunddokument | Alla tillåtna kunddokument | Publicerar/klassificerar |
| Se tickets | Egna | Organisationens | Tilldelade kunder |
| Skapa ticket | Ja | Ja | Ja |
| Ändra portalmedlem/roll direkt | Nej | Nej; begär via ticket | Verkställer godkänd ändring |
| Ändra publisheraccess direkt | Nej | Nej; begär via ticket | Nej i V1; ticketflöde |
| Hantera källkopplingar | Nej | Nej | Ja |

## Backendregler

- Identitetsleverantören bevisar vem personen är; Content Online-backend beslutar vad personen får göra.
- Varje kundägd post bär `tenantId`: medlemskap, portfölj, usage, kostnad, dokument, ticket, export, cache och synkjobb.
- Tenant-scope härleds från ett aktivt medlemskap eller en uttrycklig intern operatörstilldelning. Ett `tenantId` från frontend är aldrig behörighetsbevis.
- Backend returnerar minsta tillåtna data. Frontendfiltrering är inte en säkerhetsmekanism.
- En person kan ha ett separat medlemskap och en roll per organisation; byte av organisation är explicit och auditloggat.
- Audit events är append-only och innehåller aktör, roll, tenant, åtgärd, resurs-ID, UTC-tid, resultat och request-ID, men aldrig lösenord, tokens eller råa secrets.
- Alla negativa tenant- och rollfall får regressionstest.
