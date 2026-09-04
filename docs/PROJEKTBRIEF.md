# Projektbrief

**Version:** 0.3
**Datum:** 2026-09-04
**Status:** Första arbetsversion baserad på uppdragsgivarens beskrivning och Content Online-presentationen

## Projektet i en mening

Content Online vill skapa en säker B2B-kundplattform där varje kundorganisation kan förstå vad den köper, hur resurserna används, vad som behöver förnyas och vilka access-, dokument- eller supportfrågor som pågår.

## Bekräftad verksamhetsbild

Följande bygger på uppdragsgivarens transkriberade beskrivning i projektets aktuella dialog:

- Content Online är uppdragsgivaren för projektet.
- Content Online säljer forskningsinformation och tekniska standarder från amerikanska publishers på utvalda europeiska marknader.
- IEEE och ASTM nämns som centrala publishers. Underlagen växlar mellan `HSAE` och `SAE`; rätt namn måste bekräftas.
- Content Onlines kundorganisationer omfattar tekniska universitet och högskolor, myndigheter samt forskningsintensiva företag, bland annat inom fordon, försvar, halvledare och electrical engineering.
- Typiska motparter hos kundorganisationerna är bibliotekarier, inköp/procurement och FoU-ansvariga.
- Content Online äger kundrelationen men inte publishernas immateriella rättigheter eller innehåll.
- Kunden använder idag respektive publishers plattform för själva informationen.
- Det saknas en gemensam vy över inköp, användning, resultat, möjliga kompletterande köp, dokument och avtal.
- Plattformen ska skapa mer kundvärde och bidra till en starkare, mer långsiktig kundrelation.
- Varje publisher har ett eget eller publisheranknutet verktyg för att visa användning. IEEE står för den största andelen och använder MPS Insight.
- Ett centralt delmål är ett gemensamt konverterings- och visualiseringslager ovanpå MPS Insight samt separata adaptrar för respektive publisher/partner.
- En bibliotekarie på KTH används som första pilotpersona.
- Mycket affärsdata finns i Salesforce, medan annan relevant information finns i Fortnox och eventuellt fler system.

## Problem som plattformen ska lösa

En behörig kundperson behöver i dag sammanställa information från flera publishers och från direktkontakt med Content Online. Det gör det svårt att besvara grundläggande frågor:

- Vilka informationsprodukter och standardtjänster köper organisationen?
- Vilka avtal gäller och när behöver de förnyas?
- Hur används resurserna och hur tillförlitlig är statistiken?
- Finns accessproblem eller pågående supportärenden?
- Var finns relevanta avtal, rapporter och annan dokumentation?
- Vilka ytterligare produkter kan vara relevanta, och på vilka sakliga grunder?

## Aktörer

| Aktör | Arbetsdefinition | Status |
|---|---|---|
| Content Online | Kommersiell mellanpart och ägare av den samlade kundupplevelsen | Bekräftat, exakt avtalsroll öppen |
| Publisher | Organisation som tillhandahåller information, standarder eller databaser som Content Online representerar | Bekräftat, benämning öppen |
| Kundorganisation | Universitet, myndighet eller företag som köper via Content Online | Bekräftat |
| Kundperson | Behörig person hos kundorganisationen, exempelvis bibliotekarie, inköpare eller FoU-ansvarig | Bekräftat |
| Content Online-medarbetare | Intern användare som stödjer försäljning, förnyelse, access eller support | Källuppgift, roller öppna |

## Första produktbild

Följande är en arbetsmodell som behöver prioriteras och godkännas, inte ett beslutat V1-scope:

1. **Översikt** med abonnemang, kommande förnyelser, användningsindikatorer och pågående ärenden.
2. **Produkter och abonnemang** med avtalsperiod, publisher, accessmetod och relevanta dokument.
3. **Användning** med normaliserade mätetal, periodfilter, källa och datans aktualitet.
4. **Ärenden** för access och support med status och historik. Första versionen skapar tickets i stället för att automatiskt ändra publisheraccess.
5. **Rekommendationer** först när data, rättigheter och affärsregler är tillräckligt pålitliga.

## Usage-konvertering per publisher

Publishernas statistikverktyg och dataformat skiljer sig åt. Plattformen ska därför använda ett gemensamt internt usage-kontrakt:

```text
MPS Insight för IEEE ----\
Publisherverktyg A ------- > publisheradapter -> validering -> gemensam usage-modell -> visualisering
Publisherverktyg B -------/
```

MPS Insight är den första och viktigaste adaptern eftersom IEEE står för den största andelen. Lösningen får samtidigt inte göra MPS-formatet till hela produktens datamodell. Varje annan publisher får en egen adapter som bevarar källans betydelse, granularitet och begränsningar.

Öppna API:er, publika specifikationer och tillåtna exempelfiler kan användas för att få demonstrationen långt utan riktiga kunduppgifter. En integration eller datapunkt får bara beskrivas som live när den har verifierats mot behörig källa.

## Viktiga gränser

- Portalens inloggning är skild från kundens access till innehåll hos en publisher.
- En kundorganisation får aldrig kunna läsa en annan organisations data eller dokument.
- Publisherdata ska normaliseras bakom tydliga integrationer. UI:t ska inte byggas runt en leverantörs råformat.
- Demo- och mockdata ska alltid märkas som demo. En mockad synk får aldrig beskrivas som en genomförd extern synk.
- Rätt att hämta, lagra, bearbeta och återvisa usage-data måste bekräftas per källa.
- Plattformen ska i första hand länka till eller beskriva köpt innehåll. Lagring eller återpublicering av innehållet kräver uttrycklig rätt.
- Förinställda statistikvyer får lyfta fram legitimt kundvärde, men de får inte dölja ogynnsamma perioder, ändra definitioner eller ge en missvisande jämförelse. Källa, tidsperiod, filter och beräkning ska alltid framgå.

## Beslut som inte är fattade

- Vilken verklig KTH-miljö, avdelning eller testorganisation som får representera pilotpersonan.
- Det exakta antalet publishers och första publisher/datkälla i produktion.
- Exakt formel och datakälla för kostnad per download samt vilka övriga usage-mått som ska prioriteras.
- Exakt dataägarskap mellan Salesforce, Fortnox, publisherverktyg och eventuella andra system.
- MPS Insights API/export, dataåtkomst, credentials, kundmedgivande och datarättigheter.
- Om uppgiften att bara IEEE använder MPS avser Content Onlines arbetssätt; COUNTER Registry listar även ASTM Compass med MPS Technologies som report provider.
- Portalens autentisering, B2B-medlemskap, MFA och eventuell enterprise SSO.
- Dokumentlager, retention och känslighetsklassning.
- Applikationsstack, databas, B2B-auth och slutligt Vercel-/driftupplägg. Vercel är villkorat godkänt som kandidat för demo/låg-risk-pilot, inte för produktion.
- V1-scope, tidplan, budget och godkänd Definition of Done.

## Första verifierbara framgångshypotes

En bibliotekarie i en KTH-lik pilot kan logga in, se enbart sin organisation, förstå minst ett IEEE-abonnemang och dess MPS-baserade användningsdata, hitta rätt dokument samt skapa eller följa ett accessärende. Varje visad datapunkt har tydlig källa, period, beräkning och aktualitet.

Hypotesen blir ett produktkrav först när Content Online har valt pilot, arbetsflöde och acceptanskriterier.
