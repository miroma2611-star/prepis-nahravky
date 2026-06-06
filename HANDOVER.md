# Handover – Prepis Nahrávky

Praktický manuál pre každého kto preberie správu tejto aplikácie.

## Kde je čo

| Čo | Kde |
|---|---|
| Kód | github.com/miroma2611-star/prepis-nahravky |
| Hosting | Cloudflare Pages (kovobel-prepis.pages.dev) |
| Groq API | console.groq.com (účet Miroslav Masár) |

## Lokálny vývoj

```bash
git clone https://github.com/miroma2611-star/prepis-nahravky
cd prepis-nahravky
npm install
npm run dev
# Otvor http://localhost:5173
```

## Deploy

Automatický po každom `git push origin main` – Cloudflare Pages sleduje GitHub.

Manuálny deploy nie je potrebný.

## Ako funguje technicky

1. Užívateľ nahráva audio/video súbor
2. Web Audio API ho dekóduje a skomprimuje na 16kHz mono WAV
3. WAV sa rozdelí na chunky max 22 MB s platnými hlavičkami
4. Každý chunk sa pošle Groq Whisper API
5. Texty sa poskladajú do jedného prepisu
6. Voliteľne: Claude Sonnet vygeneruje záznam zo stretnutia

## Známe problémy

- Veľmi dlhé nahrávky (2+ hodiny) môžu trvať dlho pri kompresii
- iOS Safari: Web Audio API môže vyžadovať interakciu užívateľa pred dekódovaním
- Private/incognito: API kľúč sa neuloží (localStorage je blokovaný)

## Kontakt

Miroslav Masár – miroslav.masar@kovobel.sk
