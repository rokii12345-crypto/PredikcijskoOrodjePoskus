# DEPLOYMENT — GitHub, Vercel in Turso

Ta dokument opisuje, kako aplikacijo GradnjaPlan poganjati lokalno, objaviti na GitHub in jo
gostiti na Vercelu, brez odvisnosti od Supabase.

Ciljni GitHub repozitorij:

```text
https://github.com/rokii12345-crypto/PredikcijskoOrodjePoskus.git
```

Repo ima sicer staro ime `PredikcijskoOrodjePoskus`, vendar je v njem aplikacija GradnjaPlan.

## Zakaj brez Supabase

Prvotna zasnova (glej `SPECIFIKACIJA.md`, `PROMPT_ZA_CODEX.md`) je predvidevala Supabase Auth +
Postgres. Aplikacija je bila naknadno preusmerjena na samostojno arhitekturo:

- **Podatki**: SQLite (prek `@libsql/client`) — lokalno datoteka `data/gradnjaplan.db`, v
  produkciji na Vercelu pa gostovana baza pri [Turso](https://turso.tech) (isti SQLite dialekt,
  dosegljiv prek omrežja, ker Vercel nima trajnega diska). Shema in vsi poizvedbeni ukazi so
  identični v obeh primerih.
- **Prijava**: lastna e-pošta/geslo prijava (geslo hashirano z `scrypt`), seja je podpisan cookie
  (HMAC s skrivnostjo `AUTH_SECRET`) — brez zunanjega auth ponudnika.
- **Avtorizacija**: namesto Supabase Row Level Security vsaka poizvedba v `src/lib/data/queries.ts`
  preveri lastništvo/članstvo projekta v aplikacijski kodi (`hasProjectAccess`).

## 1. Predpogoji

- Node.js 18+.
- Git.
- GitHub račun (za `git push`).
- Za javno postavitev na Vercelu: Vercel račun in brezplačen [Turso](https://turso.tech) račun.

## 2. Namestitev

```bash
npm install
```

## 3. Okoljske spremenljivke

```bash
cp .env.example .env.local
```

- `AUTH_SECRET` — obvezna. Generiraj z:

  ```bash
  node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
  ```

- `DATABASE_URL` / `DATABASE_AUTH_TOKEN` — neobvezni za lokalni razvoj. Če ju pustiš prazna,
  aplikacija uporabi lokalno datoteko `data/gradnjaplan.db`. Nastaviti ju je treba samo za
  postavitev na Vercel (glej spodaj).

Nikoli ne commitaj `.env.local`.

## 4. Lokalni zagon

```bash
npm run dev
```

Odpri [http://localhost:3000](http://localhost:3000), registriraj uporabnika in ustvari prvi
projekt. Podatki se privzeto shranjujejo v `data/gradnjaplan.db` (v `.gitignore`).

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
data/                 (lokalna SQLite baza z uporabniškimi podatki)
```

`.gitignore` že izključuje `.env*`, `/data` in `node_modules`.

## 7. Preverjanje pred objavo

```bash
npm run lint
npm run build
```

## 8. Postavitev na Vercel (s Turso bazo)

Vercel poganja aplikacijo v serverless funkcijah, ki nimajo trajnega diska — lokalna SQLite
datoteka se tam ne bi ohranila med zahtevki. Zato je za Vercel potrebna gostovana SQLite-kompatibilna
baza pri [Turso](https://turso.tech).

### 8.1 Ustvari Turso bazo

1. Ustvari brezplačen račun na [turso.tech](https://turso.tech) (ali z Turso CLI: `turso auth signup`).
2. Ustvari bazo:

   ```bash
   turso db create gradnjaplan
   ```

3. Pridobi connection URL:

   ```bash
   turso db show gradnjaplan --url
   ```

   Izpiše nekaj oblike `libsql://gradnjaplan-<tvoj-username>.turso.io`.

4. Ustvari auth token:

   ```bash
   turso db tokens create gradnjaplan
   ```

Če ne želiš namestiti CLI-ja, oboje najdeš tudi v Turso spletnem vmesniku (nadzorna plošča baze →
"Connect").

### 8.2 Uvozi projekt v Vercel

1. Prijavi se v Vercel in klikni **Add New Project**.
2. Izberi GitHub repo `PredikcijskoOrodjePoskus`.
3. Framework Preset naj bo **Next.js** (samodejno zaznano), build command ostane privzet
   (`npm run build` oz. `next build`).
4. Pod **Environment Variables** dodaj (za Production, Preview in Development):

   ```env
   AUTH_SECRET=...            # generiraj kot v razdelku 3
   DATABASE_URL=libsql://...  # iz `turso db show`
   DATABASE_AUTH_TOKEN=...    # iz `turso db tokens create`
   ```

5. Klikni **Deploy**.

Po uspešnem buildu dobiš URL v obliki `https://ime-projekta.vercel.app`. Vercel bo ob vsakem pushu
na `main` samodejno naredil nov deployment.

## 9. Samostojno gostovanje (alternativa Vercelu)

Če ne uporabljaš Vercela, aplikacija enako dobro teče kot navaden Node.js proces s **trajnim
diskom** (VPS, Docker, Railway, Fly.io, Render) — takrat Turso sploh ni potreben, `DATABASE_URL`
pusti prazen in aplikacija uporabi lokalno datoteko `data/gradnjaplan.db`, dokler je ta mapa na
trajnem volumnu.

```bash
npm run build
npm run start
```

## 10. Delo po spremembah

```bash
git status
git add .
git commit -m "Opis spremembe"
git push
```

## 11. Minimalni produkcijski checklist

- `AUTH_SECRET` je nastavljen v produkciji (Vercel env vars ali strežniško okolje) in ni v Gitu.
- Na Vercelu sta nastavljena `DATABASE_URL` in `DATABASE_AUTH_TOKEN` (Turso); pri samostojnem
  gostovanju je `data/` na trajnem disku.
- `.env.local` ni na GitHubu.
- Registracija in prijava delujeta, uporabnik vidi samo svoje projekte
  (`hasProjectAccess` v `src/lib/data/queries.ts`).
- Kredit je jasno označen kot poenostavljen vir financiranja, ne bančni izračun.
