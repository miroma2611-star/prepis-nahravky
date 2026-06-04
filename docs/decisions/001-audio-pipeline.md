# ADR 001 – Audio pipeline: Web Audio API → WAV chunks

**Dátum:** 2026-06-04  
**Status:** Schválené

## Problém
Groq Whisper API má limit 25 MB per request. Nahrávky zo stretnutí bývajú
50–100 MB (M4A, 128kbps). Treba ich zmenšiť pred odoslaním.

## Rozhodnutie
Web Audio API → dekódovanie → 16kHz mono → WAV → split na 22 MB chunky.

## Alternatívy ktoré sme zamietli
- **FFmpeg.wasm** – veľký bundle (50+ MB), pomalý
- **Poslať raw M4A slice** – nefunguje, Groq: "not a valid media file"
- **Backend kompresia** – zbytočná komplexita, appka je čisto frontend

## Dôsledky
- Kompresia trvá 5–20 sekúnd pre 1-hodinovú nahrávku
- Výsledný WAV je ~10 MB namiesto 54 MB M4A
- Každý chunk musí mať vlastnú WAV hlavičku (44 bytov)
