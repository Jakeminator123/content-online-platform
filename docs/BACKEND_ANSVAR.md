# Backendens ansvar och frontendkontrakt

**Version:** 0.1

**Datum:** 2026-09-04

**Status:** Bekräftad leveransgräns

## Ansvarsgräns

Detta repository äger backend, API-kontrakt, användare, autentiseringsintegration, behörighet, tenantisolering, usage-konvertering, affärsregler, tickets, persistence och tester.

Frontend byggs separat och kopplas in senare. Detta repo innehåller därför inte kundportalens visuella komponenter, frontend-routing eller design. Backend levererar ett stabilt, dokumenterat och testbart HTTP-API.

## Backend äger

- organisations-, identitets-, medlemskaps- och rollmodell,
- server-side autentisering och authorisering,
- kundportfölj, abonnemang och accessmetadata,
- publisher- och affärssystemsadapters,
- intern usage-modell och metric-register,
- härledda KPI:er med synlig beräkningsmetadata,
- dokumentmetadata och säkra dokumentreferenser,
- ticketflöde och historik,
- audit events, idempotens och synkstatus,
- OpenAPI-kontrakt och maskinläsbara felsvar,
- syntetiska fixtures och regressionstester.

## Frontend får lita på

- versionsmärkt API och stabila resurs-ID:n,
- att svar redan är tenant- och rollfiltrerade,
- att varje usagevärde innehåller korrekt label, källa, period, demo/live-status och kvalitet,
- att KPI:er innehåller beräkningsunderlag och varningar,
- förutsägbara felkoder för unauthenticated, forbidden/not found, conflict och upstream unavailable.

Frontend får visa eller dölja knappar för användbarhet, men backend gör alltid den slutliga behörighetskontrollen.

## Första API-yta

```text
GET    /v1/me
GET    /v1/organizations/{organizationId}/overview
GET    /v1/organizations/{organizationId}/portfolio
GET    /v1/organizations/{organizationId}/usage
GET    /v1/organizations/{organizationId}/documents
GET    /v1/organizations/{organizationId}/tickets
POST   /v1/organizations/{organizationId}/tickets
GET    /v1/organizations/{organizationId}/members
POST   /v1/organizations/{organizationId}/member-change-requests
```

Interna operationer får en separat `/v1/internal/*`-yta och policy. De blandas inte in i kund-API:t.

## Första vertikala backendresa

1. Två syntetiska kundorganisationer skapas.
2. En testidentitet mappas server-side till ett Kundadmin-medlemskap i organisation A.
3. En IEEE/MPS-fixture importeras genom den IEEE-specifika adaptern.
4. Kundadmin läser översikt, abonnemang, usage, källa och aktualitet.
5. Kundadmin skapar en access-ticket.
6. En Läsare kan läsa sin tillåtna vy och skapa ticket men inte läsa kostnad eller adminresurser.
7. Båda nekas all data från organisation B.
8. Samma fixture importeras igen utan dubbletter och audit/provenance verifieras.

Resan är nu implementerad med in-memory/testadapters, syntetiska data och ett maskinläsbart OpenAPI-kontrakt. Extern databas och riktig identitetsleverantör kopplas bakom kontrakt när beslut och credentials finns. Dokument- och medlemsändringsroutes i listan ovan är planerade men ännu inte implementerade.
