# Frågor till uppdragsgivaren

**Version:** 0.2
**Syfte:** Få de svar som påverkar produktgräns, datarättigheter, säkerhet och första pilot.
**Arbetssätt:** Skriv svar, beslutsdatum och beslutsägare under varje fråga. Ett svar blir inte ett implementeringskrav förrän det har dokumenterats som ett godkänt beslut.

## Prioritet A: bör besvaras i första samtalet

### Q-001 Parterna och orden

Vad kallar Content Online relationen till IEEE, SAE och ASTM: publisher, leverantör, principal, uppdragsgivare eller något annat? Är de aldrig `kunder` i plattformens språk?

**Varför:** Fel ord skapar fel datamodell, navigation och avtalstolkning.
**Svar 2026-09-04:** Ja. IEEE, SAE och ASTM behandlas som publishers/partners. Universitet, myndigheter och företag är kundorganisationer.
**Beslutsägare och datum:**

### Q-002 Namn och antal publishers

Är `HSAE` i transkriptet egentligen **SAE International**? Är uppgiften om cirka 10 publishers korrekt, vilka är de och hur många olika statistik-/integrationsmönster finns i praktiken?

**Varför:** Källorna motsäger varandra och antal integrationsmönster påverkar scope mer än antal logotyper.
**Svar 2026-09-04:** `HSAE` är sannolikt en transkriptionsmiss för SAE International. Uppgiften om cirka tio publishers och den fullständiga listan återstår att verifiera.
**Beslutsägare och datum:**

### Q-003 Pilot och primär användare

Vilken verklig organisation är bäst pilotkund, vilka publishers köper den från och vem ska prova först: bibliotekarie, procurement, FoU-ansvarig eller någon annan?

**Varför:** Pilotens data och vardag ska styra första hela användarresan.
**Svar 2026-09-04:** Första pilotpersonan är en bibliotekarie på KTH. Det är ännu inte bekräftat att verklig KTH-data eller en faktisk KTH-pilot får användas.
**Beslutsägare och datum:**

### Q-004 Första kundvärdet och MVP-gränsen

Vilka högst tre uppgifter ska piloten kunna lösa utan att mejla Content Online? Presentationen visar först åtta MVP-moduler och senare fem kärnmoduler. Vilka ingår verkligen i första releasen?

**Varför:** Detta sätter V1-gränsen och gör att vi kan bygga en komplett vertikal resa.
**Svar 2026-09-04:** Ambitionen är att visa så mycket relevant funktionalitet som möjliga API:er och öppna källor tillåter, utan att påstå att en demo är en färdig kundintegration. Exakta tre kärnuppgifter ska fortfarande prioriteras.
**Beslutsägare och datum:**

### Q-005 Betydelsen av performance

När kunden vill se hur en resurs `presterar`, vilka beslut ska datan stödja? Behövs usage-trend, kostnad per användning, jämförelse mot föregående period, licensutnyttjande, benchmark eller något annat?

**Varför:** Ett diagram är inte värdefullt förrän mätetal och beslut hänger ihop.
**Svar 2026-09-04:** Kostnad per download är en bra KPI tillsammans med användning i stort. Standardvyer får gärna visa värdet fördelaktigt, men ska vara sanningsenliga och transparenta med källa, period, filter och beräkning.
**Beslutsägare och datum:**

### Q-006 Systemen som äger informationen

Vilka system eller dokument äger i dag kundorganisation, kontakt, produkt, avtal, abonnemang, renewal, faktura, dokument och supportärende? Finns API, testmiljö och representativ testdata?

**Varför:** Vi behöver veta var sanningen finns innan vi bygger en samlad vy eller skriver tillbaka data.
**Svar 2026-09-04:** Mycket finns i Salesforce. Annan relevant information finns bland annat i Fortnox. Exakt dataägarskap och tillgängliga API:er återstår att kartlägga.
**Beslutsägare och datum:**

### Q-007 MPS och rätten till usage-data

Vilken exakt MPS-tjänst används, för vilka publishers och kunder? Har Content Online egna credentials eller krävs kundens ID/godkännande? Får Content Online hämta, lagra, bearbeta och återvisa statistiken?

**Varför:** Detta avgör om den centrala usage-funktionen är juridiskt och tekniskt möjlig.
**Svar 2026-09-04:** MPS Insight används för IEEE. IEEE har störst andel. Andra publishers använder egna lösningar och behöver individuella adapters. Credentials och rätt att lagra/återvisa data är fortfarande öppna.
**Beslutsägare och datum:**

### Q-008 Avtal och IP-gräns

Vilken metadata, usage, prisinformation, avtalsinformation, dokument och publishermaterial får plattformen visa? Finns begränsningar per publisher eller marknad?

**Varför:** Content Online äger inte innehållets IP och plattformen får inte skapa en otillåten återpublicering.
**Svar:**
**Beslutsägare och datum:**

### Q-009 Portalinloggning och kundbyte

Hur ska en KTH-bibliotekarie logga in: inbjudan via e-post, Microsoft-konto, KTH:s SSO eller annat? Behöver någon kunna växla mellan flera kundorganisationer, exempelvis en Content Online-medarbetare eller en person som arbetar för ett konsortium?

**Varför:** Identitet och organisationsmodell styr säkerhet, datamodell och val av auth-provider.
**Svar:** Inte besvarat ännu. Den tidigare formuleringen var för teknisk.
**Beslutsägare och datum:**

### Q-010 Hosting och bindande teknik

Är en modern webbapplikation på Vercel en godtagbar kandidat, eller finns bindande krav på befintlig IT-drift, EU-region eller särskilda underleverantörer?

**Varför:** GitHub och Vercel kan sättas upp snabbt, men teknikvalet måste följa kundens säkerhets- och driftkrav.
**Svar:** Vercels aktuella B2B-, säkerhets- och EU-förutsättningar ska kontrolleras mot officiell dokumentation innan beslut.
**Beslutsägare och datum:**

## Prioritet B: behövs innan V1 låses

### Q-011 Roller och intern drift

Vilka roller behöver finnas hos kunden och inom Content Online? Vem bjuder in användare, ändrar behörighet, ser känsliga dokument och hanterar synkfel?

**Svar:** Roller och behov av kundbyte behöver beskrivas med konkreta personer och arbetsuppgifter.
**Beslutsägare och datum:**

### Q-012 Renewal och ärenden

Beskriv renewal-, access- och supportflöden från start till avslut. Vem agerar i varje steg, vilka statusar behövs och ska portalen uppdatera ett annat system eller bara skapa en spårbar begäran?

**Svar 2026-09-04:** Accessändringar ska tills vidare skapa en ticket. Juridiskt bindande renewal-bekräftelse väntar till en senare fas. Övriga statusar och systemkopplingar är öppna.
**Beslutsägare och datum:**

### Q-013 Dokument

Vilka dokumenttyper ska visas, var ligger de i dag, vilka innehåller person-, pris- eller avtalskänslig information och hur länge ska de sparas?

**Svar 2026-09-04:** Ja, materialet uppges vara verkligt och godkänt för fortsatt användning. Specifika underlag och tillstånd bör ändå arkiveras innan offentlig extern användning.
**Beslutsägare och datum:**

### Q-014 Marknader, språk och tillgänglighet

Vilka länder och språk ska piloten stödja? Finns krav på WCAG-nivå, offentlig upphandling, datalagring eller lokala villkor?

**Svar:**
**Beslutsägare och datum:**

### Q-015 Säkerhet och driftansvar

Vilka krav finns på GDPR, EU-datalagring, loggning, retention, incidenthantering, penetrationstest, backup, RTO/RPO och support efter lansering?

**Svar:**
**Beslutsägare och datum:**

### Q-016 Leveransmål

Är nästa mål en klickbar/körbar demo, en teknisk integrationsverifiering eller en produktionspilot? Vilket datum, vilken budgetram och vilka godkännare gäller?

**Svar:**
**Beslutsägare och datum:**

### Q-017 Rekommendationer

Ska rekommendationer ingå i första piloten eller komma efter kärnflödena? Ska de ge kunden inköpsstöd, ge Content Online säljstöd eller båda, och hur ska en rekommendation förklaras?

**Svar:**
**Beslutsägare och datum:**

### Q-018 Presentationens bevis och användning

Är citaten, kundlogotyperna, effekttalen och tidslinjen i presentationen verkliga och godkända för fortsatt användning, eller är de endast illustrativa? Vad är lovat till kunden jämfört med en produktidé?

**Svar:**
**Beslutsägare och datum:**
