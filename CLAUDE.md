# Wandelbuddy

Schoolproject. Maxime is geen programmeur: praat en leg alles uit in eenvoudig Nederlands, werk stap voor stap, en vraag akkoord vóór je iets online zet.

## Wat de app is
Webapp waarin collega's een middagwandeling of andere activiteit plannen. Anderen zien die live en tikken op "Doe mee". Er is een herinnering 10 minuten vooraf, een filter "Alles / Mijn activiteiten", longen die vullen met stappen, badges en een managementdashboard.

## Waar alles staat
- Lokale map: `~/Desktop/wandelbuddy-app`
- Nieuwe repository (op Maximes eigen GitHub-account `liebenmaxime-arch`): `liebenmaxime-arch/wandelbuddy`, branch `main`, online via GitHub Pages op `https://liebenmaxime-arch.github.io/wandelbuddy/`.
- Oude repository `walkingbuddybe/wandelbuddy` (https://walkingbuddybe.github.io/wandelbuddy/): Maxime heeft geen toegang meer tot dat account. Niet naar pushen; die link blijft de oude versie tonen.
- GitHub CLI staat in `~/.local/bin/gh` (niet in PATH). Ingelogd als `liebenmaxime-arch`.

## Bestanden (geen build-stap, relatieve paden, werkt op GitHub Pages)
- `index.html`: de pagina zelf (kop, navigatie, pop-up).
- `styles.css`: alle opmaak.
- `app.js`: alle logica (ES-module).
- `firebase-config.js`: publieke Firebase web-config (`export const firebaseConfig`). Moet blijven werken.

## Firebase
- Firestore, gratis Spark-plan, project `wandelbuddy-9c08c`.
- Collecties: `activities`, `joins`, `users`, `views`, `events`, `config`.
- Zonder geldige config valt de app terug op een lokale demo (localStorage).
- Lokaal testen: `python3 -m http.server 8080` in de projectmap en open `http://127.0.0.1:8080/`. Let op: lokaal testen gebruikt de echte database. Maak testdata herkenbaar en ruim ze op.

## Regels
- Alles GRATIS: geen betaalplannen, geen kredietkaart, geen App Store of Google Play. Geen Firebase Cloud Functions, geen Firebase Storage.
- Alle tekst in de app is in het Nederlands (Vlaams), kort en vriendelijk.
- Bestaande functies blijven behouden, tenzij Maxime vraagt ze te veranderen.
- Geen survey, feedbackknop, weerbericht of extra functies die niet gevraagd zijn.
- Moet goed werken op iPhone en Android.
- De repository is openbaar: zet er geen geheimen in (wachtwoorden, beheerderscodes, private sleutels). De Firebase web-config en de publieke VAPID-sleutel mogen erin; de private VAPID-sleutel komt alleen als geheim in de Cloudflare Worker.
- Gaat er na een push iets mis: zet meteen de vorige werkende versie terug (git revert + push) en vertel Maxime wat er gebeurde.

## Werkwijze voor elke aanpassing
1. Maxime typt feedback of een wens.
2. Zeg kort in gewone taal wat je gaat veranderen. Is iets onduidelijk, vraag het eerst.
3. Pas de code aan en test lokaal.
4. Vraag "Zal ik dit online zetten?". Pas na Maximes "ja": `git commit` (korte Nederlandse beschrijving) en `git push` naar `main`.
5. Zeg wanneer het online staat en dat testers de pagina even moeten vernieuwen.

## Planning (stap 2, nog te doen)
Nieuwe versie voor de test bij UHasselt: aanmelden (voornaam, achternaam, bedrijf met voorstellen, Firebase Anonymous Auth), per bedrijf een eigen omgeving, profiel met foto (128×128 JPEG in Firestore), managementdashboard alleen voor beheerders (e-mail/wachtwoord-accounts, per bedrijf een code plus een hoofdcode, echte Firestore-regels), installeerbare web-app (manifest, icoon, service worker), echte pushmeldingen via Web Push (VAPID) en een gratis Cloudflare Worker met Cron Trigger, stappen blijven voorbeeldcijfers, betere planner (Yoga in plaats van Stretchen met sleutel `stretch`, "Andere sport" met 150+ sporten en zoekbalk, eigen kalender, "Ander uur" als tekstvak, "Andere duur" 5–240 min, vertrekpunt nooit automatisch invullen), minstens 8 extra badges met felicitatie, en een beloningstekening (min. 8 eigen SVG's) die zich vult in plaats van de longen.
