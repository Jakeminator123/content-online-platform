# Usage-konvertering och gemensamt datakontrakt

**Version:** 0.1

**Datum:** 2026-09-04

**Status:** Föreslagen teknisk grund; liveåtkomst och datarättigheter är inte verifierade

## Syfte

Content Online ska kunna visa användning från flera publishers utan att låtsas att deras mätetal betyder samma sak. Lösningen är ett gemensamt konverteringslager med en adapter per källa och ett versionshanterat internt kontrakt.

```text
IEEE / MPS -----------\
ASTM / källa öppen ----> adapter -> validering -> usage-observationer -> sakliga vyer
SAE / källa öppen ----/
```

Detta lager återpublicerar inte publisherinnehåll. Det hanterar tillåten usage-data, metadata och provenance.

## Vad som är byggbart med öppna källor

COUNTER Release 5.1 ger ett officiellt, maskinläsbart kontrakt för jämförbar användningsrapportering. Standarden beskriver ett REST-gränssnitt, ofta kallat SUSHI eller COUNTER API, med bland annat:

- publik `GET /r51/status`,
- `GET /r51/reports` för tillgängliga rapporter,
- `GET /r51/reports/{report_id}` för en rapport,
- `GET /r51/members` för konsortier och flersite-kunder.

COUNTER publicerar [officiella exempelrapporter](https://cop5.countermetrics.org/en/5.1/appendices/g-sample-counter-reports-and-standard-views.html) i JSON, TSV och Excel. De kan ligga till grund för stabila regression-fixtures efter kontroll av återanvändningsvillkoren. Tills dess länkar repot till originalen i stället för att återpublicera dem. Det gör att hela import-, normaliserings- och visualiseringsflödet kan byggas utan KTH-data, MPS-credentials eller ett påstående om liveintegration.

Institutionsspecifika rapporter är däremot inte öppna. [COUNTERs autentiseringskrav](https://cop5.countermetrics.org/en/5.1/08-sushi/02-authentication-and-security-for-counter-sushi-api.html) kräver TLS och customer ID + requestor ID och/eller API-nyckel för allt utom statusytan.

## IEEE och MPS – verifierad offentlig bild

- IEEE uppger att institutionsstatistik tillhandahålls via en COUNTER-kompatibel MPS-yta och att SUSHI stöds.
- IEEE gick över till COUNTER R5.1 under 2025 och anger att kalenderår 2026 rapporteras i R5.1.
- IEEE erbjuder både COUNTER-standardrapporter och egna utökade rapporter. En IEEE-utökning får inte antas finnas hos en annan publisher.
- Riktiga kundrapporter kräver behörigt institutionskonto och rätt att behandla och återvisa datan.

Källor: [IEEE COUNTER Usage Reports](https://ieeexplore.ieee.org/Xplorehelp/administrators-and-librarians/counter-usage-reports), [IEEE:s R5.1-information](https://innovate.ieee.org/update-for-ieee-xplore-institutional-subscribers-regarding-usage-statistics-reports/) och [COUNTER API](https://cop5.countermetrics.org/en/5.1/08-sushi/index.html).

## Kanonisk minsta datapunkt

`UsageObservationV1` är den minsta datapunkt som får visas:

```ts
type UsageObservationV1 = {
  schemaVersion: "usage-observation/v1";
  tenantId: string;
  publisherId: string;
  providerId: string;
  productId: string;
  entitlementId?: string;

  period: {
    start: string;
    endExclusive: string;
    granularity: "day" | "month" | "year" | "report-period";
  };

  metric: {
    sourceCode: string;
    sourceLabel: string;
    canonicalCode?: string;
    definitionVersion: string;
    unit: "count";
    semanticStatus: "exact" | "source-native";
    comparabilityKey?: string;
  };

  value: number;
  dimensions: Record<string, string>;

  provenance: {
    mode: "live" | "demo";
    reportType: string;
    reportVersion?: string;
    sourceRecordKey: string;
    sourceArtifactHash?: string;
    syncRunId: string;
    fetchedAt: string;
    sourceUpdatedAt?: string;
    adapterId: string;
    adapterVersion: string;
    mappingVersion: string;
  };

  quality: {
    coverage: "complete" | "partial" | "unknown";
    freshness: "fresh" | "delayed" | "stale" | "unknown";
    warnings: string[];
  };
};
```

`tenantId` sätts från en serverägd koppling mellan kundorganisation och källkonto. Den får aldrig litas in från publisherns rådata eller från klienten.

## Adapterkontrakt

Varje publisherkälla implementerar samma fyra logiska operationer:

```ts
interface PublisherUsageAdapter {
  describeCapabilities(): AdapterCapabilities;
  fetch(request: FetchRequest): Promise<SourceBatch>;
  normalize(batch: SourceBatch, context: ServerOwnedMappingContext): Promise<NormalizationResult>;
  classifyError(error: unknown): AdapterError;
}
```

Kontraktet ska fungera för COUNTER API, annan API, exportfil och syntetisk demokälla. Credentials stannar server-side. Normalisering är deterministisk och versionsmärkt. Resultatet skiljer accepterade observationer, avvisade poster och varningar åt.

Produkt- och organisationsmappning måste vara exakt. En okänd post sätts i karantän; den mappas aldrig till den närmaste gissningen.

## Metric-register och jämförbarhet

Varje mätetal registreras med källkod, källdefinition, eventuell kanonisk kod, definitionens version, enhet, tillåtna dimensioner, aggregeringsregel och `comparabilityKey`.

`download`, `request`, `investigation`, `search` och `access denied` är inte synonymer. Två mått får bara summeras eller jämföras mellan publishers när deras semantik och `comparabilityKey` verkligen matchar.

I COUNTER betyder `Total_Item_Requests` att fulltext eller innehåll har laddats ned **eller visats**. UI:t bör därför kalla det `fulltextförfrågningar` eller använda källans exakta term, inte automatiskt `downloads`. För jämförelser mellan journalplattformar är `Unique_Item_Requests` ofta mindre påverkat av hur plattformen levererar HTML och PDF. Se [COUNTERs metric-definitioner](https://cop5.countermetrics.org/en/5.1/03-specifications/03-counter-report-common-attributes-and-elements.html).

## Kostnad per download eller request

Kostnad lagras separat från usage. KPI:n är en härledd vy:

```text
CPD eller CPR = godkänd allokerad kostnad för produkt och period
               -------------------------------------------------
               godkänt usage-mått för samma produkt och period
```

KPI:n får bara visas definitivt när kostnadsgrund, moms/krediter, valuta, period, eventuell paketeringsallokering och mätetalets definition är kända.

- Noll i nämnaren visas som `Ej beräkningsbar`, aldrig som kostnad 0.
- Partiell usage ger en preliminär eller blockerad KPI.
- En paketkostnad visas på paketnivå tills en allokeringsmodell är godkänd.
- Om nämnaren är `Total_Item_Requests` ska KPI:n heta kostnad per item request/fulltextförfrågan, inte kostnad per download.
- Täljare, nämnare, valuta, period och allokeringsmetod ska kunna öppnas från KPI:n.

## Sanningsenlig standardvy

Föreslagen första standardvy, om källorna ger komplett månadsdata:

- senaste tolv kompletta månaderna,
- jämförelse med föregående motsvarande period bara när båda är kompletta,
- alla aktiva abonnemang inkluderade,
- usage och kostnad per usage bredvid varandra,
- synliga filter, källa, period, datatäckning och beräkning,
- separata publisherdiagram när måtten inte är jämförbara.

Vyn får lyfta verkligt värde med en i förväg beslutad regel, exempelvis sortering på högst användning. Den får inte dynamiskt välja den period eller baseline som råkar ge mest positivt resultat. Exkluderade produkter och felande källor ska synas.

## Leveranssteg

1. Validera officiella COUNTER-fixtures mot ett lokalt schema.
2. Normalisera en journalrapport och visa källa, period, metric och demo-status.
3. Lägg till CPD/CPR med syntetisk kostnad och blockeringsregler.
4. Verifiera IEEE/MPS capabilities med ett uttryckligen godkänt testkonto.
5. Lägg till en andra publisher först efter att dess verkliga källa, semantik och rättigheter är kartlagda.

## Definition av `live`

En integration får kallas live först när endpoint, autentisering, kundmappning, rapporttyper, datarättighet, lagring, återvisning och minst en representativ synk har verifierats. Fram till dess heter den `demo`, `fixturebaserad` eller `tekniskt förberedd`.
