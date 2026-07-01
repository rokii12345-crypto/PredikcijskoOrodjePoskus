# DEPLOYMENT — GitHub, Supabase in Vercel

Ta dokument opisuje, kako aplikacijo GradnjaPlan objaviti iz lokalnega računalnika na GitHub in nato na Vercel.

Za ta projekt uporabljamo obstoječi GitHub repozitorij:

```text
https://github.com/rokii12345-crypto/PredikcijskoOrodjePoskus.git
```

Repo ima sicer staro ime `PredikcijskoOrodjePoskus`, vendar bo v njem aplikacija GradnjaPlan.

---

## 1. Predpogoji

Namesti oziroma pripravi:

- Node.js LTS
- Git
- GitHub račun
- Vercel račun
- Supabase račun
- VS Code

Opcijsko:

- GitHub CLI

---

## 2. Ustvari Next.js projekt

Če projekt še ne obstaja, ga ustvari:

```bash
npx create-next-app@latest gradnjaplan --typescript --eslint --app --src-dir
cd gradnjaplan
```

Nato v projekt kopiraj vsebino starter paketa:

```text
src/
supabase/
README.md
SPECIFIKACIJA.md
PROMPT_ZA_CODEX.md
DEPLOYMENT.md
.env.example
```

Namesti priporočene knjižnice:

```bash
npm install @supabase/supabase-js @supabase/ssr recharts date-fns
```

Zaženi lokalno:

```bash
npm run dev
```

Odpri:

```text
http://localhost:3000
```

---

## 3. Supabase

### 3.1 Ustvari Supabase projekt

1. Prijavi se v Supabase.
2. Ustvari nov projekt.
3. Kopiraj Project URL.
4. Kopiraj anon public key.
5. V SQL editorju zaženi datoteko:

```text
supabase/schema.sql
```

### 3.2 Lokalni environment

Ustvari datoteko `.env.local`:

```bash
cp .env.example .env.local
```

Vpiši vrednosti:

```env
NEXT_PUBLIC_SUPABASE_URL=https://tvoj-projekt.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=tvoj-anon-public-key
```

Nikoli ne commitaj `.env.local`.

---

## 4. GitHub — objava v obstoječi repo

Ciljni GitHub repo:

```text
https://github.com/rokii12345-crypto/PredikcijskoOrodjePoskus.git
```

### 4.1 Preveri, ali je Git že inicializiran

V terminalu v mapi projekta zaženi:

```bash
git status
```

Če dobiš napako, da mapa ni Git repozitorij, naredi:

```bash
git init
```

### 4.2 Preveri remote

```bash
git remote -v
```

Če remote še ni nastavljen, dodaj:

```bash
git remote add origin https://github.com/rokii12345-crypto/PredikcijskoOrodjePoskus.git
```

Če remote že obstaja, ampak kaže drugam, ga popravi:

```bash
git remote set-url origin https://github.com/rokii12345-crypto/PredikcijskoOrodjePoskus.git
```

### 4.3 Prvi commit

```bash
git add .
git commit -m "Initial GradnjaPlan MVP"
```

Če ti Git napiše, da ni sprememb, pomeni, da je vse že commitano.

### 4.4 Push na GitHub

Za objavo v glavno vejo uporabi:

```bash
git branch -M main
git push -u origin main
```

Če repo na GitHubu že vsebuje stare datoteke in dobiš napako, najprej naredi pull:

```bash
git pull origin main --rebase
```

Nato ponovno:

```bash
git push -u origin main
```

Če pride do konfliktov, jih najprej ročno reši v VS Code, nato:

```bash
git add .
git rebase --continue
git push -u origin main
```

### 4.5 Pomembno

Ne uporabljaj `--force`, razen če zavestno želiš prepisati zgodovino repozitorija.

Za običajen začetek je varneje:

```bash
git pull origin main --rebase
git push -u origin main
```

---

## 5. Vercel

### 5.1 Uvozi projekt

1. Prijavi se v Vercel.
2. Klikni **Add New Project**.
3. Izberi GitHub repo:

```text
PredikcijskoOrodjePoskus
```

4. Framework Preset naj bo **Next.js**.
5. Build command naj ostane privzeto:

```bash
npm run build
```

6. Output directory naj ostane prazno oziroma privzeto za Next.js.
7. Dodaj environment variables.

### 5.2 Environment variables na Vercelu

V Vercel Project Settings dodaj:

```env
NEXT_PUBLIC_SUPABASE_URL=https://tvoj-projekt.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=tvoj-anon-public-key
```

Dodaj jih za:

- Production,
- Preview,
- Development, če uporabljaš Vercel pull.

### 5.3 Deploy

Klikni **Deploy**.

Po uspešnem buildu dobiš URL v obliki:

```text
https://ime-projekta.vercel.app
```

Ker je GitHub repo imenovan `PredikcijskoOrodjePoskus`, lahko Vercel predlaga podobno ime projekta. V Vercelu ga lahko preimenuješ v `gradnjaplan`, tudi če GitHub repo ostane `PredikcijskoOrodjePoskus`.

---

## 6. Delo po spremembah

Ko narediš spremembe:

```bash
git status
git add .
git commit -m "Opis spremembe"
git push
```

Vercel bo ob pushu na GitHub samodejno naredil nov deployment.

---

## 7. Kaj ne sme iti na GitHub

Ne commitaj:

```text
.env.local
.env
Supabase service role key
uporabniških podatkov
izvozov baze
računov, pogodb, ponudb
```

V GitHub gre:

```text
koda
template podatki
demo podatki
SQL schema
navodila
```

---

## 8. Priporočen `.gitignore`

Preveri, da `.gitignore` vsebuje:

```gitignore
node_modules
.next
.env
.env.local
.env*.local
.vercel
```

---

## 9. Preverjanje pred objavo

Pred vsakim pushom preveri:

```bash
npm run lint
npm run build
```

Če build lokalno pade, bo zelo verjetno padel tudi na Vercelu.

---

## 10. Minimalni produkcijski checklist

Preden aplikacijo uporablja kdo drug:

- Supabase RLS je vključen.
- Vsi podatki so vezani na `owner_user_id` ali članstvo v projektu.
- `.env.local` ni na GitHubu.
- Vercel environment variables so nastavljene.
- Registracija in prijava delujeta.
- Uporabnik vidi samo svoje projekte.
- Demo podatki niso pomešani z realnimi uporabniškimi podatki.
- Kredit je jasno označen kot poenostavljen vir financiranja, ne bančni izračun.
