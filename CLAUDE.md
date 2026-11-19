# CoMove (vroeger Wandelbuddy)

De app heet voor gebruikers **CoMove** (titel, welkomscherm, icoon, meldingen). Interne namen blijven "wandelbuddy" (repository, map, Firebase-project, Worker, localStorage-sleutels `wb-*`): niet hernoemen, anders raken gebruikers hun aanmelding kwijt.

Schoolproject. Maxime is geen programmeur: praat en leg alles uit in eenvoudig Nederlands, werk stap voor stap, en vraag akkoord vóór je iets online zet.

## Wat de app is
Webapp waarin collega's een middagwandeling of andere activiteit plannen. Anderen zien die live en tikken op "Doe mee". Er is een herinnering 10 minuten vooraf, een filter "Alles / Mijn activiteiten", longen die vullen met stappen, badges en een managementdashboard.

## Waar alles staat
- Lokale map: `~/Desktop/wandelbuddy-app`
- Repository (op Maximes eigen GitHub-account `liebenmaxime-arch`): `liebenmaxime-arch/wandelbuddy`, branch `main`.
- **Online via Cloudflare Pages op `https://comove.pages.dev`** (project "comove", gekoppeld aan de repository: elke push naar `main` wordt automatisch online gezet, geen build-stap, output directory = hoofdmap). Cloudflare stuurt `/index.html` door naar `/` (308), dus nooit `index.html` apart in de service worker bewaren.
- Het vroegere adres `https://liebenmaxime-arch.github.io/wandelbuddy/` (GitHub Pages) is uitgezet op 19 nov 2026 (geeft 404). Opnieuw aanzetten kan met `gh api -X POST repos/liebenmaxime-arch/wandelbuddy/pages -f "source[branch]=main" -f "source[path]=/"`.
- In `push-worker/worker.js` staat `APP_URL` nog op het oude adres: dat is alleen het contactadres in de VAPID-handtekening (moet niet bereikbaar zijn). Bij de volgende keer dat de Worker opnieuw geplakt wordt, mag het naar `https://comove.pages.dev/`.
- Oude repository `walkingbuddybe/wandelbuddy` (https://walkingbuddybe.github.io/wandelbuddy/): Maxime heeft geen toegang meer tot dat account. Niet naar pushen; die link blijft de oude versie tonen.
- GitHub CLI staat in `~/.local/bin/gh` (niet in PATH). Ingelogd als `liebenmaxime-arch`.

## Bestanden (geen build-stap, relatieve paden)
- `index.html`: de pagina zelf (kop, navigatie, pop-up).
- `styles.css`: alle opmaak.
- `app.js`: alle logica (ES-module).
- `firebase-config.js`: publieke Firebase web-config (`export const firebaseConfig`). Moet blijven werken.
- `sports.js`: lijst "Andere sport" (272 sporten, Nederlands) met categorie → icoon (`CAT_ICONS`) en stappen/minuut (`CAT_SPM`).
- Opbouw als telefoon-app: de pagina scrolt nooit, alleen `#main` scrolt; de balk `.nav` is het onderste stuk (niet `position: fixed`). Naar boven scrollen = `toTop()`, niet `window.scrollTo`.
- Activiteit: `type` = wandelen | lopen | padel | fietsen | stretch (= "Yoga") | sport; `label` = de naam (bij "sport" de gekozen sport). Gebruik altijd `typeInfo(a)` voor naam, icoon, kleur, stappen en duurknoppen.
- Plannen: vertrekpunt start leeg en wordt nooit automatisch ingevuld. "Ander uur" begrijpt 1340, 13:40, 13u40, 13.40 (`parseTime`); "Andere duur" 5–240 min (`parseDur`). Tijdens het typen alleen `syncDraft()` (geen volledige render, anders sluit het toetsenbord op iPhone).

- `manifest.json`, `sw.js` (service worker) en `icons/` maken er een installeerbare web-app van. De service worker haalt eigen bestanden altijd eerst vers op (network-first) en cachet alleen de Firebase-bibliotheek; Firestore gaat er nooit door. Het browservenster in de Claude-app ondersteunt geen service workers: test die op de echte site of op een telefoon.

## Firebase
- Firestore, gratis Spark-plan, project `wandelbuddy-9c08c`.
- Collecties: `activities`, `joins`, `users`, `views`, `events`, `config`.
- Zonder geldige config valt de app terug op een lokale demo (localStorage).
- Lokaal testen: `python3 -m http.server 8080` in de projectmap en open `http://127.0.0.1:8080/`. Let op: lokaal testen gebruikt de echte database. Maak testdata herkenbaar (bedrijf "Testbedrijf Claude") en houd ze zo klein mogelijk.
- De huidige databaseregels laten NIET toe dat de app `users`, `events` of `views` verwijdert. Testdata daarin kan alleen via de Firebase-console weg (of later via een beheerdersaccount).
- Aanmelden: profiel-id `u_…` staat in localStorage `wb-pid`, bedrijfssleutel in `wb-ck`. Firebase Anonymous Auth staat aan (en Email/Password, voor de beheerders later). Profielen worden herkend op `nameKey` (genormaliseerde voornaam+achternaam) binnen het bedrijf; bedrijven op `companyKey` (zie `norm()` in app.js).
- Per bedrijf een eigen map (nieuwe versie):
  - `companies/{companyKey}` = { name, createdAt } (lijst met bedrijfsnamen, leesbaar voor elke aangemelde gebruiker)
  - `companies/{companyKey}/auth/{firebase-uid}` = { pid, at } (dit toestel hoort bij dit bedrijf; vereist door de regels)
  - `companies/{companyKey}/{activities|joins|users|views|events|config}` (alleen voor leden van dat bedrijf)
  - De oude mappen bovenaan (`activities`, `users`, ...) horen bij de oude link en blijven ongewijzigd.
- Databaseregels staan in `firestore.rules`. Na een wijziging moet Maxime ze zelf plakken in Firebase → Firestore → Rules → Publish.
- Regels in het kort: leden lezen activiteiten/joins/users/config van hun bedrijf; schrijven alleen hun eigen profiel (alleen photo/lastSeen/authUids mogen veranderen), eigen activiteiten en eigen joins; views/events alleen schrijven. Beheerders van het bedrijf lezen alles van dat bedrijf en passen config aan. Alleen de hoofdcode mag verwijderen.

## Beloningstekening (deel J)
- `rewards.js`: 12 eigen SVG-tekeningen (smoothie, pizza, ontbijt, koffie, ijsje, taart, frietjes, teamuitstap, broodjes, donuts, wafels, drankje) met trefwoorden (`findReward`, eerste trefwoord in de tekst wint). `rewardSvg(r, p)` tekent ze p% gevuld.
- In Samen vervangt `vReward` de longen als de beloning (`config.reward`) een tekening heeft; anders blijven de longen (`vLungs`). Doel gehaald → feestelijke tekst in de kaart + één keer per maand per toestel `celebrate()` (`checkGoal`, localStorage `wb-goal-<bedrijf>-<maand>`).
- Dashboard: live voorbeeld onder het beloningsvak (`rewardPreview`).

## Badges (deel I)
- 16 badges in `BADGES` (app.js), elk met eigen SVG-icoon. Berekend door `statsFor(uid)` / `earnedBadges(uid)` uit activiteiten en deelnames (geen opslag in de database).
- Felicitatie één keer per nieuwe badge: bijgehouden in localStorage `wb-badges-<bedrijf>-<profiel>`; eerste keer op een toestel stil. Getoond met `celebrate()` bovenaan (los van `toast()`).
- Aantal badges bij namen in "Wie doet er mee" (`badgeTag`), zonder ranglijst.
- Testen zonder database: kopieer de app naar een map in de scratchpad met `export const firebaseConfig = {};` → de app draait dan in de demo (localStorage `wandelbuddy-fb-demo-v1`).

## Pushmeldingen (deel F)
- Web Push met VAPID. Publieke sleutel + Worker-adres in `push-config.js`. Private sleutel staat alleen in `~/Desktop/wandelbuddy-geheimen/` (buiten de repo) en als geheim `VAPID_PRIVATE_JWK` in de Cloudflare Worker.
- Cloudflare Worker `wandelbuddy-push` (https://wandelbuddy-push.liebenmaxime.workers.dev), code in `push-worker/worker.js`. Maxime plakt die code zelf in Cloudflare (Edit code → Cmd+A → plakken → Deploy). **Laat Maxime altijd kopiëren uit TextEdit (open het bestand met `open -a TextEdit`), niet uit de chat**: bij kopiëren uit de chat raakte de API-sleutel beschadigd. Cron Trigger "Every minute" staat aan (Settings → Trigger events, daarna Save); de Worker werkt alleen van 6 tot 21 uur (Brussel). `/status` toont of de minuutcontrole loopt (laatste run in `config/pushworker`).
- De Worker leest Firestore als `robot@wandelbuddy-9c08c.firebaseapp.com` (in `admins` met company "*"); wachtwoord als geheim `ROBOT_PASSWORD`. Cloudflare-geheimen wijzigen: Settings → Variables and Secrets → Edit → **Rotate** → nieuwe waarde → Deploy.
- `/status` op de Worker toont of beide geheimen werken. `/run?c=<bedrijf>` wordt door de app aangeroepen na het plannen.
- Meldingsadressen: `companies/{c}/push/{id}`; verzendlogboek per persoon: `companies/{c}/pushlog/{n_|r_}<activiteit>_<profiel>` met velden `act` (bv. `n_<activiteit>`) en `pid`. Per run hoogstens `MAX_SENDS` (30) meldingen (gratis plan: max 50 externe oproepen); de rest volgt de minuut erna. Noteren gebeurt per activiteit in één `:commit` met `exists=false`-voorwaarden (`:batchWrite` is NIET toegestaan voor de robot).
- iPhone: alleen vanaf iOS 16.4 en vanuit de app op het beginscherm.
- Getest op 18 nov 2026: melding "nieuwe activiteit" komt aan op Maximes iPhone (Apple antwoordt 201). `/run?c=<bedrijf>` geeft een verslag (`log`) met aantallen en de status van Apple/Google; handig bij problemen.
- Afmelden: knop "Afmelden op dit toestel" in Samen (twee keer tikken binnen 5 s). Verwijdert het meldingsadres van dit toestel bij dat bedrijf, meldt een beheerder af en wist `wb-pid`/`wb-ck`; het profiel blijft bewaard (opnieuw aanmelden → "Ben jij dit?").
- Nog op te ruimen met de hoofdcode: testbedrijven "Testbedrijf Claude" en "Testbedrijf Claude B" (testgebruiker "Test Afmeld", van de afmeldtest).
- Herinneringen: elke deelnemer krijgt zijn eigen herinnering (pushlog `r_<activiteit>_<profiel>`), ook wie pas later meedoet.
- Eindtest gedaan op 18–19 nov 2026; alle testgegevens zijn opgeruimd. Enige bedrijf nu: Uhasselt met Maxime Lieben. Nog niet getest op de telefoon: de herinnering 10 min vooraf (minuutcontrole draaide toen nog niet).

## Beheerders (managementdashboard)
- Knop "Management" in het tabblad Samen → beheerderscode. De code is het wachtwoord van een Firebase Auth e-mail/wachtwoord-account. De app gebruikt een aparte Firebase-app "beheer" voor die sessie.
- E-mailadressen (verborgen in de app): `beheer-<companyKey>@wandelbuddy-9c08c.firebaseapp.com` per bedrijf, `team@wandelbuddy-9c08c.firebaseapp.com` voor de hoofdcode.
- Of een account beheerder is, staat in `admins/{uid}` = { company: "<companyKey>" } of { company: "*" } (hoofdcode). Alleen aan te passen in de Firebase-console.
- Bestaande accounts: `team@…` (company "*") en `beheer-testbedrijfclaude@…` (company "testbedrijfclaude", alleen voor tests).
- Nieuw bedrijf (bv. UHasselt): Authentication → Add user `beheer-uhasselt@wandelbuddy-9c08c.firebaseapp.com` met een code die Maxime kiest, daarna in Firestore `admins/{die UID}` met `company` = `uhasselt`.
- Codes nooit in de repository of in de chat zetten; Claude typt ze niet zelf in.
- Testen met codes: Maxime typt de code zelf in het browservenster naast de chat. Opruimen van testgegevens gebeurt met de hoofdcode via de Firebase-app "beheer" (auth-kaartjes kunnen niet opgesomd worden, die blijven onzichtbaar achter).

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
