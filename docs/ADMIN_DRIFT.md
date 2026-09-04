# Content Online-admin och kundportal

Uppdaterad 2026-09-05. Detta dokument skiljer levererad inloggning från planerad administration.

## Två portaler, olika ansvar

| Del | Vem? | Ansvar |
|---|---|---|
| Kundportal | Kundperson, exempelvis KTH-bibliotekarie | Bara den egna organisationens resurser. Kundadmin är en kundroll. |
| Intern administration | Content Onlines godkända administratör | Företagets kunder, användare, publicistregister och kundprodukttilldelningar. Funktionerna återstår. |
| Kundscope för operatör | Content Online-personal med särskild tilldelning | Befintlig backendmodell ger bara åtkomst till uttryckligen tilldelade kunder. Inte global administration. |

## Levererat

- Hono-plattformen har portalval och länkar till den befintliga kundfrontenden utan att kopiera eller blanda sessioner.
- `/admin/login` och `/admin/registrera` använder Clerk JS/UI. Den nya rollen heter `content_admin`.
- HTML-skalet på `/admin` är publikt men innehåller inga identitets- eller kunduppgifter. Personlig information hämtas från serverns skyddade `/admin/api/session` efter verifiering.
- API accepterar endast Clerk-bearertoken med plattformens uttryckliga `azp`/origin. Signatur och livslängd kontrolleras av SDK:n; servern kontrollerar även aktiv session, spärrstatus samt verifierad primär e-post mot serverns allowlist.
- En separat registreringsallowlist finns i Clerk. Testverifiering är avstängd. Ingen automatisk e-postinbjudan har skickats.
- Kundfrontendens `/content-online`-vägar leder till plattformens administration. KTH-demons cookies skickas inte vidare som behörighetsbevis.

## Första kontot

Öppna `/admin/registrera` på plattformen och använd den överenskomna adressen. Skapa ett eget lösenord eller använd ett tillåtet verifierat inloggningssätt. Verifiera adressen hos Clerk. Därefter kontrollerar backend behörigheten; att bara registrera sig ger inte adminrättigheter.

Ingen e-postadress, lösenord eller hemlig nyckel hör hemma i detta publika repository. Konfiguration:

- `CLERK_SECRET_KEY` och `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`: tillförs av Vercel Marketplace.
- `CONTENT_ONLINE_ADMIN_EMAIL`: server-only, satt som sensitive enbart i Vercels production-miljö.
- `.env.example`: namn utan värden.
- `scripts/configure-admin-auth.mjs`: explicit körd, idempotent registreringsallowlist för den konfigurerade adressen. Skickar inte e-post och skapar inte ett verifierat användarkonto.

## Återstår / får inte beskrivas som klart

1. Databas: Neon Free föreslaget i Frankfurt; provisionering pausad på användarens begäran. Ingen ersättningsdatabas eller lagring i webbläsaren används.
2. Administration: skapa/ändra/avaktivera kundkonton, organisationer, publicister och kundprodukttilldelningar samt beständig auditlogg.
3. Kundauth: frontendens gamla demonstrationskonton och reservnyckel får inte användas med riktiga kunddata. Skyddat `/v1/*` är ännu inte anslutet till Clerk eller produktionsmedlemskap.
4. Produktionsauth: nuvarande Clerk-nycklar är `pk_test_`/`sk_test_` trots att webbplatsen är publicerad på Vercel. Egen domän, DNS och Clerk-produktionsinstans krävs före skarp användning.
5. Första administratören behöver själv slutföra e-postverifieringen. Automatiska tester kan inte ersätta denna kontroll.
6. MPS/IEEE, övriga publishers, Salesforce, Fortnox och dokumentlagring: inga nya liveintegrationer i denna leverans.

## Verifiering

`npm run check` testar tidigare tenant-/KPI-kontrakt och nya negativa adminfall: fel adress, sekundär adress, overifierad adress, spärrat konto, kundcookie, främmande origin, saknad konfiguration, providerfel och skydd på samtliga `/admin/api/*`-metoder.

Efter publicering kontrolleras `/health`, portalval, kundportalens fasta redirect, login/registrering och att ogiltiga eller saknade tokens nekas. Publicerad inloggning är en pilot, inte en färdig administrationsprodukt.

## Källor

- [Clerk request-verifiering](https://clerk.com/docs/reference/backend/authenticate-request)
- [Clerk JavaScript-integration](https://clerk.com/docs/js-frontend/getting-started/quickstart)
- [Clerk produktionskrav](https://clerk.com/docs/guides/development/deployment/production)
