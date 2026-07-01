# DEPLOYMENT — GitHub in samostojno gostovanje

Ta dokument opisuje, kako aplikacijo GradnjaPlan poganjati lokalno, objaviti na GitHub in jo
gostiti brez odvisnosti od zunanjih storitev (Supabase, Vercel Postgres ipd.).

Ciljni GitHub repozitorij:

```text
https://github.com/rokii12345-crypto/PredikcijskoOrodjePoskus.git
```

Repo ima sicer staro ime `PredikcijskoOrodjePoskus`, vendar je v njem aplikacija GradnjaPlan.

## Zakaj brez Supabase

Prvotna zasnova (glej `SPECIFIKACIJA.md`, `PROMPT_ZA_CODEX.md`) je predvidevala Supabase Auth +
Postgres. Aplikacija je bila naknadno preusmerjena na povsem samostojno arhitekturo, da jo je
mogoče zgraditi, pognati in preveriti brez ročnega ustvarjanja zunanjih računov:

- **Podatki**: vgrajen `node:sqlite` (Node.js 22.5+), datoteka `data/gradnjaplan.db`. Brez native
  odvisnosti, brez ločenega DB strežnika.
- **Prijava**: lastna e-pošta/geslo prijava (geslo hashirano z `scrypt`), seja je podpisan cookie
  (HMAC s skrivnostjo `AUTH_SECRET`) — brez zunanjega auth ponudnika.
- **Avtorizacija**: namesto Supabase Row Level Security vsaka poizvedba v `src/lib/data/queries.ts`
  preveri lastništvo/članstvo projekta v aplikacijski kodi (`hasProjectAccess`).

Če boš kasneje želel pravo javno produkcijsko postavitev z več hkratnimi uporabniki na
serverless platformi (Vercel), glej razdelek [Selitev na Postgres](#11-selitev-na-postgres-kasneje).

## 1. Predpogoji

- Node.js 22.5+ (aplikacija je razvita in preizkušena na Node.js 24; potreben je vgrajen
  `node:sqlite`).
- Git.
- GitHub račun (za `git push`).

## 2. Namestitev

```bash
npm install
```

## 3. Okoljska spremenljivka

Aplikacija potrebuje samo eno skrivnost — `AUTH_SECRET`, s katero se podpisujejo prijavni
cookieji.

```bash
cp .env.example .env.local
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Izpis prilepi kot vrednost `AUTH_SECRET` v `.env.local`. Nikoli ne commitaj `.env.local`.

## 4. Lokalni zagon

```bash
npm run dev
```

Odpri [http://localhost:3000](http://localhost:3000), registriraj uporabnika in ustvari prvi
projekt. Podatki se shranjujejo v `data/gradnjaplan.db` (samodejno ustvarjeno, v `.gitignore`).

## 5. GitHub — objava v obstoječi repo

### 5.1 Preveri, ali je Git že inicializiran

```bash
git status
```

Če dobiš napako, da mapa ni Git repozitorij:

```bash
git init
```

### 5.2 Preveri remote

```bash
git remote -v
```

Če remote še ni nastavljen:

```bash
git remote add origin https://github.com/rokii12345-crypto/PredikcijskoOrodjePoskus.git
```

Če remote že obstaja, ampak kaže drugam:

```bash
git remote set-url origin https://github.com/rokii12345-crypto/PredikcijskoOrodjePoskus.git
```

### 5.3 Commit in push

```bash
git add .
git commit -m "Opis spremembe"
git branch -M main
git push -u origin main
```

Če repo na GitHubu že vsebuje druge datoteke:

```bash
git pull origin main --rebase
git push -u origin main
```

Ne uporabljaj `--force`, razen če zavestno želiš prepisati zgodovino repozitorija.

## 6. Kaj ne sme iti na GitHub

Ne commitaj:

```text
.env.local
.env
data/                 (SQLite baza z uporabniškimi podatki)
```

`.gitignore` že izključuje `.env*`, `/data` in `node_modules`.

## 7. Preverjanje pred objavo

```bash
npm run lint
npm run build
```

## 8. Samostojno gostovanje (produkcija)

Ker SQLite podatke hrani v datoteki na disku, aplikacija za produkcijo potrebuje gostovanje s
**trajnim diskom** — dolgo živeč Node.js proces, ne kratkotrajne (stateless) serverless funkcije.
Primerno: VPS, Docker kontejner, Railway, Fly.io, Render (Node/Docker storitev, ne "serverless").

```bash
npm run build
npm run start
```

Nastavi okoljski spremenljivki na strežniku:

```env
AUTH_SECRET=...           # isti generator kot zgoraj
NODE_ENV=production
```

Poskrbi, da je mapa `data/` na trajnem volumnu (persistent disk/volume), sicer se ob vsakem
redeployu baza izbriše.

### Vercel

**Vercel serverless funkcije nimajo trajnega diska** — vsak zahtevek lahko teče v novi instanci,
zato se SQLite datoteka ne ohrani med zahtevki in ta postavitev na Vercelu ni zanesljiva za
resnično večuporabniško uporabo. Za Vercel uporabi razdelek spodaj o selitvi na Postgres.

## 9. Delo po spremembah

```bash
git status
git add .
git commit -m "Opis spremembe"
git push
```

## 10. Minimalni produkcijski checklist

- `AUTH_SECRET` je nastavljen na produkcijskem strežniku in ni v Gitu.
- `data/` (SQLite baza) je na trajnem disku/volumnu.
- `.env.local` ni na GitHubu.
- Registracija in prijava delujeta, uporabnik vidi samo svoje projekte
  (`hasProjectAccess` v `src/lib/data/queries.ts`).
- Kredit je jasno označen kot poenostavljen vir financiranja, ne bančni izračun.

## 11. Selitev na Postgres (kasneje)

Če boš želel javno produkcijsko postavitev na serverless platformi (Vercel + kredit), je najlažja
pot:

1. Zamenjaj `src/lib/db/index.ts` in `src/lib/data/queries.ts` z ekvivalentnim slojem nad
   Postgres (npr. `pg` ali Supabase). Poslovna logika (`src/lib/scheduling`, `src/lib/costs`) ostane
   nespremenjena, ker dela samo s tipi iz `src/types/index.ts`.
2. Zamenjaj lastno sejo (`src/lib/auth`) s ponudnikom, ki podpira serverless (Supabase Auth,
   Auth.js ...), ali obdrži isti podpisan-cookie pristop — deluje enako dobro tudi na Postgresu.
3. `hasProjectAccess` v `src/lib/data/queries.ts` prevedi v SQL poizvedbo/RLS pravilo na novi bazi.
