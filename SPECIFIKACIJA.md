# GradnjaPlan — začetna specifikacija

## Namen aplikacije

GradnjaPlan je spletna aplikacija za fizične osebe, ki gradijo hišo. Aplikacija deluje kot poenostavljen MS Project za gradnjo hiše:

1. uporabnik ustvari projekt,
2. izbere predlogo za novogradnjo hiše,
3. aplikacija ustvari terminski plan aktivnosti,
4. uporabnik na aktivnosti veže stroške,
5. stroški imajo plačilna pravila,
6. aplikacija izračuna plačilne dogodke,
7. iz plačilnih dogodkov izračuna mesečni stroškovni plan,
8. aplikacija prikaže, kdaj uporabnik potrebuje koliko denarja.

Glavna logika:

```text
Aktivnost → strošek → plačilno pravilo → plačilni dogodki → mesečni denarni tok
```

## Prva verzija aplikacije

MVP naj podpira:

- registracijo in prijavo uporabnikov,
- shranjevanje projektov v bazo,
- predlogo za novogradnjo hiše,
- terminski plan v obliki tabele in enostavnega Gantt prikaza,
- vnos investitorjev,
- vnos virov financiranja,
- stroške vezane na aktivnosti,
- plačilna pravila,
- izračun plačil po mesecih,
- izračun črpanja kredita,
- osnovna opozorila.

## Ključni pojmi

### Projekt

Projekt predstavlja eno gradnjo hiše.

### Aktivnost

Aktivnost je planska enota, podobno kot v MS Projectu. Ima začetek, konec, trajanje in predhodnike.

### Strošek

Strošek je finančna postavka, vezana na aktivnost. Primer: PZI, komunalni prispevek, temelji, fasada.

### Plačilno pravilo

Plačilno pravilo določi, kdaj se strošek plača. Primer: 30 % ob začetku in 70 % ob zaključku aktivnosti.

### Plačilni dogodek

Plačilni dogodek je konkreten datum in znesek. Aplikacija ga izračuna iz aktivnosti in plačilnega pravila.

### Vir financiranja

Vir financiranja določa, iz česa se plačilo pokrije: lastna sredstva, kredit, rezerva, pomoč družine itd.

## Pomembna odločitev za MVP

Kredit v prvi verziji ni bančni kalkulator. Kredit je samo vir financiranja z:

- imenom,
- najvišjim zneskom,
- datumom, od kdaj je na voljo.

Aplikacija mora preveriti:

- ali je plačilo iz kredita pred datumom razpoložljivosti kredita,
- ali skupno črpanje preseže znesek kredita,
- koliko kredita ostane.
