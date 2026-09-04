# Content Online customer platform

Detta repository är dokumentations- och utvecklingsytan för Content Onlines planerade B2B-kundplattform.

**GitHub:** [Jakeminator123/content-online-platform](https://github.com/Jakeminator123/content-online-platform) (publikt repository)

Projektet befinner sig i behovs- och verifieringsfas. Den första pilotpersonan är en bibliotekarie på KTH. Ingen applikationsstack, databas, autentiseringsleverantör, extern dataintegration eller Vercel-deployment är ännu beslutad eller inkopplad.

## Produktmål

Kundplattformen ska ge behöriga personer hos Content Onlines kunder en samlad och spårbar bild av köpta informationsprodukter, användning, förnyelser, accessinformation, dokument och ärenden. Ett centralt delmål är ett gemensamt konverterings- och visualiseringslager ovanpå MPS Insight för IEEE och motsvarande, individuella adapters för andra publishers. Plattformen kompletterar publishernas egna plattformar och återpublicerar inte skyddat innehåll utan uttrycklig rätt.

## Dokumentation

- [Projektbrief](docs/PROJEKTBRIEF.md)
- [Terminologi](docs/TERMINOLOGI.md)
- [Usage-konvertering och datakontrakt](docs/USAGE_KONVERTERING.md)
- [Publisherintegrationer och verifieringsmatris](docs/PUBLISHER_INTEGRATIONER.md)
- [Vercel-bedömning för B2B](docs/VERCEL_B2B_BEDOMNING.md)
- [Frågor till uppdragsgivaren](docs/FRAGOR_TILL_UPPDRAGSGIVAREN.md)
- [Besluts- och faktalogg](docs/BESLUTSLOGG.md)
- [Källregister och auktoritet](docs/KALLREGISTER.md)
- [Bottom-up teststrategi](docs/TESTSTRATEGI.md)

## Statusord

- **Bekräftat**: uttryckligen uppgett eller godkänt av Content Online i projektets aktuella dialog.
- **Verifierat**: kontrollerat mot ett verkligt system, avtal, API eller representativ data.
- **Källuppgift**: står i ett underlag men är ännu inte godkänt som projektbeslut.
- **Föreslaget**: en möjlig produkt- eller teknikriktning.
- **Öppet**: kräver svar eller beslut.

## Informationssäkerhet

Repositoryt ska inte innehålla credentials, tokens, verkliga kunddata eller licensierat publisherinnehåll. Endast material som hör direkt till uppdraget får påverka kravbilden. Publikt tillhandahållna COUNTER-exempel kan ligga till grund för demo-fixtures när återanvändningsvillkor, ursprung och demo-status framgår.

Eftersom repositoryt är publikt ska även framtida exempeldata vara helt syntetisk och fri från avtals-, kund- och användningsuppgifter som inte redan är avsedda för offentlig publicering.
