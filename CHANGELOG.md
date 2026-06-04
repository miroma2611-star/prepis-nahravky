# Changelog

## [Unreleased]

### Pridané — Počiatočná verzia (2026-06-04)

Prvá verzia aplikácie Prepis Nahrávky. Požiadavka: Miroslav Masár potreboval
nástroj na prepis 57-minútových nahrávok zo stretnutí do textu, s automatickým
generovaním záznamu zo stretnutia.

**Čo táto verzia rieši:**
- Nahratie audio/video súboru (aj 50+ MB) priamo v prehliadači
- Automatická kompresia na 16kHz mono WAV (Groq Whisper limit je 25 MB)
- Rozdelenie na platné WAV chunky – každý chunk má vlastnú hlavičku
- Prepis cez Groq Whisper large-v3 (najlepšia presnosť pre slovenčinu)
- Generovanie záznamu zo stretnutia cez Claude Sonnet
- Uloženie Groq API kľúča do prehliadača – nezadávaš ho zakaždým
- Kopírovanie s fallback pre mobilné prehliadače
- Stiahnutie záznamu ako .txt súbor

**Tech stack:** React 18 + Vite + TypeScript, Cloudflare Pages
