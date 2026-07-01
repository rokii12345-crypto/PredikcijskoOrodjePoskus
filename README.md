# GradnjaPlan

GradnjaPlan je spletna aplikacija za fizične osebe, ki gradijo hišo. Deluje kot poenostavljen
MS Project za gradnjo hiše: uporabnik ustvari projekt iz predloge, aplikacija zgradi terminski
plan aktivnosti, uporabnik nanje veže stroške in plačilna pravila, aplikacija pa iz tega izračuna
plačilne dogodke in mesečni denarni tok.

Glavno vprašanje, na katerega aplikacija odgovarja:

> Kdaj pri gradnji hiše potrebujem koliko denarja?

Podrobna specifikacija je v [`SPECIFIKACIJA.md`](./SPECIFIKACIJA.md), prompt, iz katerega je bila
aplikacija prvotno zasnovana, pa v [`PROMPT_ZA_CODEX.md`](./PROMPT_ZA_CODEX.md). Ta prvotna
zasnova je predvidevala Supabase; razlog za odmik na samostojno arhitekturo je pojasnjen spodaj in
v [`DEPLOYMENT.md`](./DEPLOYMENT.md).

## Tehnologije

- Next.js 16 (App Router, Server Actions, Turbopack)
- TypeScript, React 19
- SQLite prek `@libsql/client` — lokalna datoteka za razvoj, [Turso](https://turso.tech) (gostovan
  SQLite) za produkcijo na Vercelu
- Lastna e-pošta/geslo prijava (scrypt hash, podpisan session cookie)
- Recharts za grafe denarnega toka
- Tailwind CSS

Za lokalni razvoj aplikacija ne potrebuje nobenega zunanjega računa — edina obvezna nastavitev je
skrivnost za podpisovanje sej (`AUTH_SECRET`). Za javno postavitev na Vercelu (ker ta nima
trajnega diska) je dodatno potreben brezplačen Turso račun — glej
[`DEPLOYMENT.md`](./DEPLOYMENT.md).

## Lokalni zagon

1. Namesti odvisnosti:

   ```bash
   npm install
   ```

2. Ustvari `.env.local` s skrivnostjo za podpisovanje sej:

   ```bash
   cp .env.example .env.local
   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
   ```

   Izpis prilepi kot vrednost `AUTH_SECRET` v `.env.local`. `DATABASE_URL`/`DATABASE_AUTH_TOKEN`
   pusti prazna — potrebna sta samo za Vercel (glej `DEPLOYMENT.md`).

   **`.env.local` nikoli ne sme iti na GitHub.**

3. Zaženi razvojni strežnik:

   ```bash
   npm run dev
   ```

4. Odpri [http://localhost:3000](http://localhost:3000), registriraj uporabnika in ustvari prvi
   projekt. Podatki se shranijo v `data/gradnjaplan.db` (samodejno ustvarjena SQLite datoteka, v
   `.gitignore`).

## Struktura aplikacije

- `src/types` — skupni TypeScript tipi (Project, Task, CostItem, PaymentRule, PaymentEvent, ...).
- `src/data/templates` — predloga terminskega plana za novogradnjo hiše, plačilna pravila, demo
  stroški.
- `src/lib/scheduling` — `scheduleTasks` (FS odvisnosti, summary/milestone logika).
- `src/lib/costs` — `generatePaymentEvents`, `calculateCashflow`, `validateProject`.
- `src/lib/demo` — `createDemoProject`, iz katerega čarovnik za nov projekt ustvari začetne
  podatke.
- `src/lib/db` — `@libsql/client` povezava in inicializacija sheme; `DATABASE_URL` odloči, ali gre
  za lokalno datoteko ali gostovano Turso bazo.
- `src/lib/auth` — hashiranje gesel (`scrypt`), podpisovanje/preverjanje session cookieja
  (`AUTH_SECRET`), `getCurrentUser`/`requireUser` za strani in server actions.
- `src/lib/data/queries.ts` — vse (asinhrone) poizvedbe nad bazo, `hasProjectAccess` (avtorizacija
  na ravni aplikacije namesto Supabase RLS) in `recalculateProject`, ki po vsaki spremembi ponovno
  izračuna terminski plan in plačilne dogodke.
- `src/app/(app)` — zaščitene strani po prijavi: Moji projekti, čarovnik za nov projekt, Dashboard,
  Terminski plan, Stroški, Plačilni plan, Viri financiranja, Investitorji.
- `src/proxy.ts` — Next.js 16 "Proxy" (nekdanji middleware), ki preverja podpisan session cookie in
  ščiti strani pod prijavo.

## Varnost

- Prijava in registracija: gesla se nikoli ne shranjujejo v čistem besedilu, ampak kot
  `scrypt` hash + naključna sol (`src/lib/auth/password.ts`).
- Seja je HMAC-podpisan cookie (`httpOnly`, `sameSite=lax`, v produkciji `secure`) — ni je mogoče
  ponarediti brez `AUTH_SECRET`.
- Avtorizacija: vsaka poizvedba, ki dostopa do projekta, preveri lastništvo/članstvo
  (`hasProjectAccess` v `src/lib/data/queries.ts`), preden vrne ali spremeni podatke.
- `AUTH_SECRET` in `DATABASE_AUTH_TOKEN` sta v `.env.local`, ki ni v Gitu; lokalna baza `data/` je
  prav tako izključena iz Gita.
- Kredit je v tej verziji poenostavljen vir financiranja (znesek, datum razpoložljivosti), ne
  bančni kalkulator obresti in anuitet.

## Objava na GitHub in Vercel

Podrobna navodila (GitHub push, ustvarjanje Turso baze, Vercel environment variables) so v
[`DEPLOYMENT.md`](./DEPLOYMENT.md).

Ciljni GitHub repozitorij:

```text
https://github.com/rokii12345-crypto/PredikcijskoOrodjePoskus.git
```

Okoljske spremenljivke, ki jih je treba nastaviti na Vercelu:

```env
AUTH_SECRET=...
DATABASE_URL=libsql://...
DATABASE_AUTH_TOKEN=...
```
