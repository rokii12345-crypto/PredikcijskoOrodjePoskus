# GradnjaPlan

GradnjaPlan je spletna aplikacija za fizične osebe, ki gradijo hišo. Deluje kot poenostavljen
MS Project za gradnjo hiše: uporabnik ustvari projekt iz predloge, aplikacija zgradi terminski
plan aktivnosti, uporabnik nanje veže stroške in plačilna pravila, aplikacija pa iz tega izračuna
plačilne dogodke in mesečni denarni tok.

Glavno vprašanje, na katerega aplikacija odgovarja:

> Kdaj pri gradnji hiše potrebujem koliko denarja?

Podrobna specifikacija je v [`SPECIFIKACIJA.md`](./SPECIFIKACIJA.md), prompt, iz katerega je bila
aplikacija zgrajena, pa v [`PROMPT_ZA_CODEX.md`](./PROMPT_ZA_CODEX.md).

## Tehnologije

- Next.js 16 (App Router, Server Actions, Turbopack)
- TypeScript, React 19
- Supabase (Auth + Postgres, Row Level Security)
- Recharts za grafe denarnega toka
- Tailwind CSS

## Lokalni zagon

1. Namesti odvisnosti:

   ```bash
   npm install
   ```

2. Ustvari Supabase projekt in v SQL editorju zaženi [`supabase/schema.sql`](./supabase/schema.sql).

3. Kopiraj `.env.example` v `.env.local` in vpiši svoje Supabase vrednosti:

   ```bash
   cp .env.example .env.local
   ```

   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://tvoj-projekt.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=tvoj-anon-public-key
   ```

   **`.env.local` nikoli ne sme iti na GitHub.**

4. Zaženi razvojni strežnik:

   ```bash
   npm run dev
   ```

5. Odpri [http://localhost:3000](http://localhost:3000), registriraj uporabnika in ustvari prvi
   projekt.

## Struktura aplikacije

- `src/types` — skupni TypeScript tipi (Project, Task, CostItem, PaymentRule, PaymentEvent, ...).
- `src/data/templates` — predloga terminskega plana za novogradnjo hiše, plačilna pravila, demo
  stroški.
- `src/lib/scheduling` — `scheduleTasks` (FS odvisnosti, summary/milestone logika).
- `src/lib/costs` — `generatePaymentEvents`, `calculateCashflow`, `validateProject`.
- `src/lib/demo` — `createDemoProject`, iz katerega čarovnik za nov projekt ustvari začetne
  podatke.
- `src/lib/supabase` — brskalniški in strežniški Supabase odjemalec.
- `src/lib/data` — pretvorbe med Supabase vrsticami (snake_case) in aplikacijskimi tipi
  (camelCase) ter `recalculateProject`, ki po vsaki spremembi ponovno izračuna terminski plan in
  plačilne dogodke.
- `src/app/(app)` — zaščitene strani po prijavi: Moji projekti, čarovnik za nov projekt, Dashboard,
  Terminski plan, Stroški, Plačilni plan, Viri financiranja, Investitorji.
- `src/proxy.ts` — Next.js 16 "Proxy" (nekdanji middleware), ki osvežuje Supabase sejo in ščiti
  strani pod prijavo.

## Varnost

- Prijava in registracija potekata izključno prek Supabase Auth, gesla se ne shranjujejo ročno.
- V bazi je vklopljen Row Level Security — uporabnik vidi samo svoje projekte oziroma projekte,
  kjer je član.
- Supabase ključi so v `.env.local`, ki ni v Gitu.
- Kredit je v tej verziji poenostavljen vir financiranja (znesek, datum razpoložljivosti), ne
  bančni kalkulator obresti in anuitet.

## Objava na GitHub in Vercel

Podrobna navodila za GitHub, Supabase in Vercel so v [`DEPLOYMENT.md`](./DEPLOYMENT.md).

Ciljni GitHub repozitorij:

```text
https://github.com/rokii12345-crypto/PredikcijskoOrodjePoskus.git
```

Environment variables, ki jih moraš nastaviti na Vercelu (Production, Preview in Development):

```env
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
```
