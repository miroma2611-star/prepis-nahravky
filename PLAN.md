# PLAN.md – Prepis Nahrávky

## Stav projektu
✅ v0.1.0 – Základná verzia (2026-06-04)

## Hotové
- [x] React + Vite + TypeScript strict setup
- [x] Groq Whisper integrácia
- [x] Audio kompresia (Web Audio API → 16kHz WAV)
- [x] WAV chunkovanie s platnými hlavičkami
- [x] Claude Sonnet – generovanie záznamu zo stretnutia
- [x] localStorage pre API kľúč
- [x] Kopírovanie s fallback pre mobile
- [x] Unit testy (format, wavSplitter)
- [x] CLAUDE.md, CHANGELOG.md, HANDOVER.md

## Ďalší vývoj (nápady)
- [ ] História prepisov (posledných 10) v localStorage
- [ ] Tmavý režim
- [ ] Export do .docx
- [ ] Podpora viacerých súborov naraz
- [ ] Zobrazenie časových pečiatok (Groq Whisper verbose mode)
- [ ] iOS Safari fix pre Web Audio API

## Architektúra rozhodnutia
Pozri docs/decisions/ priečinok.
