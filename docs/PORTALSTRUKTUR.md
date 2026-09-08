# Portalstruktur och sparat register

## Två skilda åtkomstområden

| Område | Adress | Behörighet |
| --- | --- | --- |
| Content Online | https://content-online-platform.vercel.app/ | Intern Clerk-session och serverkontrollerad administratör |
| KTH:s syntetiska demo | https://fokus-psi-sable.vercel.app/o/kth/login | Befintliga kunddemokonton, endast syntetiska KTH-data |
| Publicerad ny kund | https://fokus-psi-sable.vercel.app/o/{url-namn} | Egen organisationsmärkt förhandsvisningsyta; `/login` är aktiveringssidan och riktiga kundkonton återstår |

Plattformens startsida är endast intern inloggning. Ingen KTH-inloggning visas där. Personalen väljer kund inne i kundregistret. Den fristående frontendens samma kodversion används för alla kundadresser: inget nytt repo eller Vercel-projekt behövs för varje organisation.

## Sparade ändringar

Det interna registret kan lägga till och redigera kunder, koppla publicister till kunder, publicera/avpublicera kundadresser samt arkivera och återställa kunder/publicister. Arkivering är återställbar och raderar inte relationer eller externa licenser. Återställning av kund ger utkast, inte automatisk återpublicering. URL-namn ändras eller återanvänds inte.

Ny kund börjar som utkast, utan KTH:s uppgifter eller demokonton. Publiceringsbekräftelsen anger att organisationsnamnet, kundytan och aktiveringssidan blir offentliga. Kundytan visar portalens framtida struktur med tydliga tomlägen men inga påhittade mätvärden, dokument eller produkter. En publicerad URL är inte en aktiverad identitet eller en dataintegration. Riktiga kundkonton, inbjudningar, tenant-medlemskap och två kundroller måste färdigställas innan verklig kunddata visas. Demoautentiseringen får aldrig återanvändas för dessa kunder.

## Lagring

En separat Neon Free-databas i Frankfurt, content-online-registry, har anslutits till endast backendprojektets Production. Ingen kundfrontend eller preview ansluts till denna databas. DATABASE_URL (alternativt POSTGRES_URL) läses endast på servern och kopieras aldrig till Git.

Tabellen co_registry_v1 innehåller ett versionsmärkt JSONB-register. Första anslutningen skapar tabellen och startposter idempotent utan att skriva över befintligt register. Skrivningar görs med parametriserade frågor och villkorad versionsuppdatering. Två samtidiga uppdateringar ger 409 för den förlorande skrivningen; klienten måste läsa om innan nytt försök.

Registret börjar med uttryckligt syntetiska KTH och publicisterna IEEE, SAE och ASTM. Statistik, produkter, anslutningar och användare i den tidigare visningsdemon är fortfarande fristående fixtures, inte levande data. Assistenten får inte automatiskt denna databas som modellkontext.

Ändringshistoriken innehåller de senaste 500 händelserna med tid, intern aktör och post-ID. Det är inte en fullständig permanent revisionslogg. Gränser: 1 000 kunder, 100 publicister. Normaliserade tabeller, längre revisionshistorik, backuprutin och dedikerad migrationshantering behöver införas vid större/skarp drift.

## Säkerhetsgränser

- /admin/api/registry kräver verifierad intern administratör även för GET.
- POST validerar kommandot och versionsnumret. Inga godtyckliga SQL-frågor eller hårda raderingar exponeras.
- /portal-directory/{slug} lämnar endast explicit publicerade namn, slug och demo/aktiveringsstatus. Inga användare, relationer, interna ID:n eller revisionshändelser.
- Okänd eller arkiverad kund får inte KTH-fallback. Databasfel ger otillgänglig status, aldrig påhittad tom framgång.
- KTH:s login och serverkontroller kontrollerar publiceringen. Andra sluggar kan aldrig skrivas om till KTH-dashboarden.
- Nya portaler visar en organisationsspecifik förhandsvisning med tomlägen; `/login` visar aktiveringsinformation, inte ett påhittat fungerande login.
- Kundidentiteter ger aldrig Content Online-behörighet.
- Preview saknar produktionsdatabasen och visar därför otillgängligt register. CI använder isolerade testdata; denna fallback spärras i alla Vercel-miljöer.

## Leverans och verifiering

Ändringar görs i GitHub och provas i GitHub Actions/Vercel, utan lokal utvecklingsserver. Tester omfattar entréseparering, URL-validering, tenant-avgränsning, publiceringslivscykel, arkivering, versionskonflikter, skyddade API:er och redigering utan att ändra demofixtures.

Den löpande publicerings- och liveverifieringsstatusen rapporteras separat från implementationen.
