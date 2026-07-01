# Prompt za Codex — GradnjaPlan

Deluj kot senior full-stack developer, produktni arhitekt in strokovnjak za aplikacije za projektno vodenje.

Gradim aplikacijo **GradnjaPlan**. To je spletna aplikacija za načrtovanje gradnje hiše. Aplikacija naj bo zasnovana podobno kot poenostavljen MS Project, vendar posebej za fizične osebe, ki gradijo hišo.

## Glavni cilj aplikacije

Uporabnik naj najprej izdela terminski plan gradnje hiše, nato pa na aktivnosti veže stroške. Aplikacija mora iz terminskega plana, stroškov in plačilnih pravil izračunati, **kdaj uporabnik potrebuje koliko denarja**.

Osnovna logika aplikacije:

```text
projekt
  → aktivnosti / faze
    → stroški
      → plačilna pravila
        → plačilni dogodki
          → mesečni stroškovni plan
```

## Tehnologija

Uporabi:

- Next.js
- TypeScript
- React
- Supabase Auth za prijavo
- Supabase PostgreSQL za bazo
- Vercel za gostovanje
- Recharts za grafe
- preprost lasten Gantt prikaz za MVP

Ne uporabljaj še kompleksne MS Project knjižnice. Za začetek naredi preprost Gantt: levo tabela aktivnosti, desno časovni stolpci z vrsticami aktivnosti.

## Pomembno glede varnosti

- Gesel ne shranjuj ročno.
- Uporabi Supabase Auth.
- V bazi naj bo Row Level Security.
- Uporabnik lahko dostopa samo do svojih projektov oziroma do projektov, kjer je član.
- API ključi naj bodo v `.env.local`, ne v kodi.
- GitHub ne sme vsebovati skrivnih ključev ali uporabniških podatkov.

## Obseg MVP

Implementiraj MVP v tem vrstnem redu:

### 1. Podatkovni model

Uporabi začetne tipe v `src/types/index.ts`.

Glavni tipi:

- Project
- Investor
- FundingSource
- Task
- Dependency
- CostItem
- PaymentRule
- PaymentEvent
- MonthlyCashflowRow
- ProjectAlert

### 2. Predloge

Uporabi začetne datoteke:

- `src/data/templates/houseOptions.si.json`
- `src/data/templates/paymentRules.si.json`
- `src/data/templates/houseTemplate.si.json`
- `src/data/templates/demoCostItems.si.json`

Aplikacija naj zna iz predloge ustvariti nov projekt.

### 3. Terminsko planiranje

Implementiraj funkcijo:

```ts
scheduleTasks(projectStartDate, tasks)
```

Za MVP podpri samo odvisnosti tipa FS, torej finish-to-start.

Pravila:

- Če aktivnost nima predhodnikov, se začne na datum začetka projekta.
- Če ima predhodnike, se začne po najpoznejšem koncu predhodnika + lagDays.
- endDate = startDate + durationDays.
- Summary aktivnosti prevzamejo min startDate in max endDate otrok.
- Milestone ima durationDays = 0.

### 4. Generiranje plačil

Implementiraj funkcijo:

```ts
generatePaymentEvents(costItems, tasks, paymentRules)
```

Pravila:

- Za vsak strošek poišči aktivnost po `taskCode`.
- Poišči plačilno pravilo po `paymentRuleCode`.
- Za vsak del pravila ustvari plačilni dogodek.
- Datum plačila je task.startDate ali task.endDate + lagDays.
- Znesek je relevantni znesek * percent / 100.
- Relevantni znesek:
  - actualAmount, če obstaja,
  - contractedAmount, če obstaja,
  - estimatedAmount drugače.

### 5. Mesečni cashflow

Implementiraj funkcijo:

```ts
calculateCashflow(paymentEvents, costItems, tasks, fundingSources, investors)
```

Aplikacija mora izračunati:

- plačila po mesecih,
- plačila iz lastnih sredstev,
- plačila iz kredita,
- kumulativno porabo,
- kumulativno črpanje kredita,
- deleže investitorjev.

Če je `defaultFundingSourceType = loan`, naj gre plačilo v kredit. Če je `own_funds`, naj gre v lastna sredstva. Če je `mixed`, naj za MVP 50 % razdeli v kredit in 50 % v lastna sredstva.

### 6. Validacija in opozorila

Implementiraj funkcijo:

```ts
validateProject(project, tasks, costItems, paymentEvents, fundingSources)
```

Opozorila:

- plačilo iz kredita je pred datumom razpoložljivosti kredita,
- skupno črpanje kredita presega razpoložljivi kredit,
- strošek je vezan na neobstoječo aktivnost,
- aktivnost nima izračunanega datuma,
- plačilno pravilo ne obstaja,
- vsota plačil se bistveno razlikuje od zneska stroška,
- v naslednjih 30 dneh so večja planirana plačila.

### 7. UI zasloni

Naredi naslednje zaslone:

1. Login / register
2. Moji projekti
3. Nov projekt — čarovnik
4. Dashboard projekta
5. Terminski plan
6. Stroški
7. Plačilni plan
8. Viri financiranja
9. Investitorji

### 8. Dashboard

Dashboard naj prikaže:

- skupni planirani strošek,
- plan z rezervo,
- lastna sredstva,
- kredit,
- koliko kredita je že planirano za črpanje,
- preostanek kredita,
- plačila v naslednjih 30 dneh,
- najdražji mesec,
- datum predvidene vselitve,
- graf mesečnega denarnega toka,
- graf kumulativnega stroška,
- seznam opozoril.

### 9. Terminski plan

Terminski plan naj ima:

- WBS kodo,
- naziv aktivnosti,
- trajanje,
- začetek,
- konec,
- predhodnike,
- default funding source,
- osnovni Gantt prikaz.

Uporabnik naj lahko spreminja:

- trajanje,
- ime aktivnosti,
- začetek projekta,
- ali je aktivnost vključena ali izključena,
- stroške na aktivnosti.

### 10. Stroški

Stroški naj bodo vezani na aktivnosti.

Tabela naj vsebuje:

- aktivnost,
- naziv stroška,
- status,
- ocenjeno,
- pogodbeno,
- dejansko,
- plačilno pravilo,
- vir financiranja.

### 11. Plačilni plan

Tabela naj prikaže:

- datum,
- aktivnost,
- strošek,
- naziv plačila,
- znesek,
- vir financiranja,
- status.

### 12. Supabase

Pripravi SQL shemo iz `supabase/schema.sql`.

Uporabi RLS. Uporabnik naj vidi samo svoje projekte.

## Začetne datoteke

V projektu so pripravljene začetne datoteke:

- `src/types/index.ts`
- `src/data/templates/houseOptions.si.json`
- `src/data/templates/paymentRules.si.json`
- `src/data/templates/houseTemplate.si.json`
- `src/data/templates/demoCostItems.si.json`
- `src/lib/scheduling/scheduleTasks.ts`
- `src/lib/costs/generatePaymentEvents.ts`
- `src/lib/costs/calculateCashflow.ts`
- `src/lib/costs/validateProject.ts`
- `src/lib/demo/createDemoProject.ts`
- `supabase/schema.sql`

Najprej preveri te datoteke, popravi tipizacijo, nato implementiraj manjkajoč UI.

## Pomembno

Ne kompliciraj prve verzije. Ne dodajaj še:

- bančnih obresti,
- anuitet,
- upload dokumentov,
- kritične poti,
- real-time sodelovanja,
- MS Project importa,
- PDF poročil.

Najprej naredi uporabno aplikacijo, ki iz terminskega plana in stroškov pove:

> Kdaj potrebujem koliko denarja?

## Objavljanje in GitHub/Vercel

V projektu je datoteka `DEPLOYMENT.md`. Upoštevaj jo pri pripravi aplikacije.

Dodatno pripravi:

- `.env.example`,
- jasen README z lokalnim zagonom,
- opozorilo, da `.env.local` ne sme iti na GitHub,
- navodilo, katere environment variables mora uporabnik nastaviti na Vercelu.

Aplikacija mora biti pripravljena za deploy na Vercel iz GitHub repozitorija.

## Ciljni GitHub repozitorij

Projekt naj bo pripravljen za objavo v obstoječi GitHub repozitorij:

```text
https://github.com/rokii12345-crypto/PredikcijskoOrodjePoskus.git
```

Repo se imenuje `PredikcijskoOrodjePoskus`, vendar aplikacija, ki jo gradimo, je GradnjaPlan.

V README in DEPLOYMENT navodilih uporabi ta repo URL. Ne predlagaj ustvarjanja novega GitHub repozitorija, razen kot opombo, da bi bilo to mogoče kasneje.
