---
name: lernnest-release
description: Fester Ablauf für jede Änderung an der Lernnest-App (Code oder Inhalte) bis zur Veröffentlichung auf GitHub Pages. Nutzen bei: neue Version, Fehler beheben, Inhalte einspielen, «mach einen PR», «veröffentlichen», «release».
---

# Lernnest: Änderung bis zur Veröffentlichung

Die App läuft auf dem iPad eines Kindes. Ein Fehler, der den Spielstand löscht oder die App nicht starten lässt, ist das Schlimmste, was passieren kann. Deshalb gilt für jede Änderung derselbe Ablauf.

## Ablauf

1. **Neuer Branch** von `main`: `claude/<kurzes-thema>`. Nie direkt auf `main` arbeiten.
2. **Ändern.** Inhalte nach dem Skill `lernnest-inhalte`.
3. **Version erhöhen**, sobald sich etwas in `public/` ändert: `public/version.js` (`n` und `date`) und in `public/sw.js` den Cache-Namen `lernnest-v<n>` gemeinsam. Neue Dateien in `public/` in `FILES` in `sw.js` eintragen, neue Inhaltsdateien zusätzlich in `public/index.html` vor `begleiter.js`.
4. **Lokal testen**, alles muss grün sein:
   ```
   npm test
   node tools/e2e.mjs
   node tools/e2e-speicher.mjs
   node tools/e2e-geraete.mjs
   node tools/test-offline.mjs
   node tools/monkey.mjs 300 1
   ```
   Ohne Playwright-Browser: `CHROME_PATH=/pfad/zu/chrome` davor setzen.
5. **Ansehen**: `node tools/e2e.mjs <ordner>` und `node tools/e2e-geraete.mjs <ordner>` speichern Screenshots. Neue oder geänderte Ansichten anschauen, bevor der PR rausgeht (Überlauf, abgeschnittene Texte, zu kleine Bilder).
6. **Commit und Pull Request** gegen `main`, kurze deutsche Beschreibung: was sich für das Kind ändert, was getestet wurde.
7. **CI abwarten** (GitHub Actions, Workflow «Testen und veröffentlichen»). Bei Rot: Ursache beheben, nicht Tests abschwächen.
8. **Vor dem Merge den Vater fragen.** Erst nach seinem Okay mergen (Squash). Nach dem Merge veröffentlicht die CI `public/` auf GitHub Pages.
9. **Rückmeldung** an den Vater: neue Versionsnummer und was sich ändert. Auf dem iPad die App einmal schließen und neu öffnen, dann steht die neue Nummer oben.

## Spielstand: harte Regeln

- Nie Felder aus dem Spielstand entfernen oder umbenennen, ohne `migrate()` in `public/logic.js` so zu erweitern, dass alte Stände weiterlaufen. `tools/test-logic.mjs` und `tools/e2e-speicher.mjs` prüfen das; bei Änderungen am Stand dort einen Fall mit einem alten Stand ergänzen.
- Speicherschlüssel `lernnest-v1` und `lernnest-v1-bak` nie ändern.
- Kein Code, der beim Start Daten löscht.

## Datenschutz

Das Repository ist öffentlich. Nie hinein: Namen des Kindes, des Hundes oder der Familie, Noten, Fotos von Arbeiten, Lernzetteln oder Heften, Namen von Schule oder Lehrkraft. Solches Material liegt lokal in `privat/` (steht in `.gitignore`). Vor jedem Commit `git status` und den Diff auf so etwas prüfen.
