# Pravidlá pre Claude Code v tomto projekte

Tento súbor obsahuje pravidlá, ktoré sa Claude Code AI asistent zaväzuje
dodržiavať pri každej zmene v tomto projekte. Tieto pravidlá vychádzajú zo
skúseností pri stavbe aplikácie **KobesFlow** (Kobes Production s.r.o.),
kde sa za 4 mesiace ukázalo, čo funguje a čo nie.

**Cieľ týchto pravidiel:** aby projekt zostal udržateľný aj po mesiacoch
vývoja, dal sa bezpečne odovzdať budúcemu IT oddeleniu a aby každá zmena
bola predvídateľná.

---

## 1. Komunikácia

- **Píš a odpovedaj v slovenčine.** Užívateľ nie je programátor, vysvetľuj
  veci ľudskou rečou. Žiadny technický žargón bez vysvetlenia.
- Pri opise zmien **používaj analógie** (napr. „commit = ako Ctrl+S vo Worde
  s popisom" namiesto „git commit").
- Keď navrhuješ riešenie, **vždy stručne odôvodni prečo** — užívateľ chce
  rozumieť, nie len odsúhlasiť.

---

## 2. Pred každou väčšou zmenou — 2–3 mikro-rozhodnutia

Predtým, než začneš rozsiahly refactor alebo novú feature, **polož užívateľovi
2–3 cielené otázky** vo formáte:

> 1. Default value pre X: (a) Y, (b) Z?
> 2. Permission gating: (a) admin only, (b) feature-specific flag?
> 3. UI placement: (a) modal, (b) inline?
>
> Moje odporúčanie: **1a, 2b, 3a**.

Užívateľ odpíše buď `ok defaults` alebo `1b, 2a, 3a`. Až **PO POTVRDENÍ** začni
implementovať.

**Výnimka:** drobné bug-fixy a triviálne zmeny môžeš spraviť priamo bez otázok.

---

## 3. Po každej zmene — 4 kontroly + commit + push + deploy

```bash
npm run typecheck
npm test
npm run lint
npm run build
```

**Iba ak VŠETKY 4 sú zelené:**

```bash
git add <konkrétne súbory>
git commit -m "Krátky popis: čo + kto požiadal"
git push origin main
```

---

## 4. Commit message — slovenčinou, s vysvetlením prečo

```
Typ: Krátky popis (kto požiadal)

Vysvetlenie príčiny — prečo sa zmena stala.

Co-Authored-By: Claude <noreply@anthropic.com>
```

**Typy:** `Fix:`, `Pridané:`, `Zmenené:`, `Refaktor:`, `Cleanup:`

---

## 5. Špecifiká tohto projektu

### Stack
- React 18 + Vite + TypeScript (strict mode)
- Groq Whisper API pre transkripciu
- Claude Sonnet API pre generovanie záznamu zo stretnutia
- Cloudflare Pages pre hosting

### Kľúčové technické rozhodnutia
- **Audio kompresia:** Web Audio API → 16kHz mono WAV (z 50+ MB na ~10 MB)
- **Chunkovanie:** WAV chunks s vlastnou hlavičkou – raw M4A slice nie je platný audio súbor
- **API kľúč:** localStorage (nie env – appka beží čisto na frontende)
- **Kopírovanie:** clipboard API + execCommand fallback pre mobilné prehliadače

### Známe obmedzenia
- Groq Whisper limit: 25 MB per request → preto kompresia + chunkovanie
- Web Audio API: dekódovanie veľkého súboru môže trvať 10–30 sekúnd
- localStorage: API kľúč sa neuloží pri private/incognito móde

---

## 6. Čo NIKDY nerobiť bez explicitného povolenia

- Mazanie súborov / priečinkov
- `git reset --hard`, `git push --force`
- Inštalácia nových npm balíčkov mimo dependency-update commitu
- Rozsiahly refactor (viac ako 5 súborov naraz) bez mikro-rozhodnutí

---

*Posledná aktualizácia: 2026-06-04*
*Vychádza z KobesFlow projektu (Kobes Production s.r.o.)*
