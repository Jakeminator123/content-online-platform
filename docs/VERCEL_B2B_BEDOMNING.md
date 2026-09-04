# Vercel för Content Online B2B

**Version:** 0.1

**Bedömningsdatum:** 2026-09-04

**Bedömning:** Villkorat go för demo och låg-risk-pilot; inget automatiskt produktionsgodkännande

## Kort svar

Vercel är en rimlig kandidat för detta repos backend/API i en publik demo och en avgränsad B2B-pilot. Frontendens drift väljs i det separata frontendspåret. Att lösningen är B2B tar inte bort kraven på GDPR, upphandling, tenantisolering, loggning eller datarättigheter. Content Onlines kundbild omfattar dessutom universitet, myndigheter och försvarsanknutna verksamheter, vilket gör data- och leverantörskraven särskilt viktiga.

En Vercel-region i Stockholm betyder att funktionernas compute kan placeras där. Det betyder inte att all data, metadata, loggning och backup garanterat stannar i Sverige eller EU.

## Verifierade förutsättningar

- Vercels Hobby-plan är endast för personligt/icke-kommersiellt bruk. En verksamhetsdemo ska minst använda betald Pro.
- Vercels DPA gäller Pro och Enterprise.
- Funktioner kan placeras i Stockholm `arn1`, Frankfurt `fra1` eller Dublin `dub1`, men standardregionen är Washington `iad1` och måste därför ändras uttryckligen.
- Vercel uppger SOC 2 Type 2, ISO 27001:2022, GDPR-stöd och TISAX AL2.
- Vercels DPA anger att primära behandlingsanläggningar finns i USA och att data kan behandlas i USA och andra länder där Vercel eller subprocessorer verkar. Backuper beskrivs som globalt replikerade.
- DPA:n förbjuder kunder att inkludera känsliga personuppgifter eller särskilda kategorier av data i Customer Data.
- Automatisk DDoS-mitigering och grundläggande WAF finns, men flera avancerade styrmedel och organisationsfunktioner kräver Enterprise.

Källor: [Vercel Terms](https://vercel.com/legal/terms), [Vercel DPA](https://vercel.com/legal/dpa), [Security & Compliance](https://vercel.com/docs/security/compliance), [regioner](https://vercel.com/docs/regions) och [Vercel Firewall](https://vercel.com/docs/vercel-firewall).

## Inloggning: två skilda lager

Vercels SAML och Deployment Protection skyddar Vercel-teamet eller en hel deployment. De ersätter inte kundportalens identitet, medlemskap, roller och tenantkontroll.

KTH-bibliotekariens login behöver en separat B2B-authlösning. Servern måste vid varje request härleda tillåtna organisationer från ett aktivt medlemskap; ett `organizationId` från klienten är aldrig tillräckligt.

Källor: [Vercel SAML](https://vercel.com/docs/saml), [Deployment Protection](https://vercel.com/docs/deployment-protection) och [Shared Responsibility](https://vercel.com/docs/security/shared-responsibility).

## Go-villkor för demo/pilot

- Betald Pro, aldrig Hobby för verksamhetsbruk.
- Funktioner och vald databas i samma uttryckliga EU-region.
- Endast syntetisk eller uttryckligen godkänd, minimerad data i demo.
- Inga kundnamn, credentials, dokumenttitlar eller råa API-nycklar i URL:er eller loggar.
- Separat B2B-auth, server-side tenantkontroll och negativa tenanttester.
- DPA, subprocessorlista och överföringsbedömning godkänns av Content Online före persondata.
- Databas, filstorage, e-post, observability och auth prövas var för sig; `frontend på Vercel` avgör inte hela systemets dataresidency.

## När Enterprise eller annan arkitektur behövs

Enterprise bör prövas före produktion om kravbilden innehåller exempelvis team-SAML/SCIM, utökade audit logs, SIEM/drains, Secure Compute, Trusted IPs, SLA eller avancerad WAF.

Om ett bindande krav är att all data, loggar, metadata och backup aldrig lämnar EU kan nuvarande offentliga Vercel-dokumentation inte ensam styrka ett vanligt Vercel-upplägg. Då krävs en skriftlig leverantörsbekräftelse/Enterprise-lösning eller en hybrid där känslig backend och data ligger i en separat, godkänd EU-miljö.

Vercel ska inte användas för klassificerad, exportkontrollerad eller försvarskänslig information innan exakt regelverk och skriftligt godkännande finns.

## Aktuellt projektbeslut

GitHub-repot har nu en fastställd backendgräns men ännu ingen verifierad backenddeployment. Vercel kopplas när den körbara API-tjänsten och vald demo-/pilotnivå är verifierade lokalt. Frontend kopplas senare via API-kontraktet och behöver inte ligga i samma Vercel-projekt.
