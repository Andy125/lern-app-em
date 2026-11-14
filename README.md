# Lernnest

Lern-App fürs iPad für die Vorbereitung auf Klassenarbeiten. Jeden Tag eine Tagesmission von rund 15 Minuten: drei kurze Etappen mit einer Bewegungspause dazwischen. Mit den Münzen vom Üben pflegt das Kind sein eigenes Tier, füttert es, zieht es an und richtet sein Zimmer ein. Kein Druck, keine Strafen, Sterne gehen nie verloren.

Die App ist eine Web-App ohne Build-Schritt (reines JavaScript im Ordner `public/`), läuft offline und wird über GitHub Pages veröffentlicht.

## Aufs iPad

1. Die Adresse der App in **Safari** öffnen (steht nach der ersten Veröffentlichung unter Settings → Pages).
2. Teilen → **Zum Home-Bildschirm**.
3. Ab jetzt die App immer über das Symbol auf dem Home-Bildschirm öffnen. Dann läuft sie im Vollbild, auch ohne Internet, und Safari löscht den Spielstand nicht.

Oben rechts steht die Versionsnummer. So sieht man nach einem Update, ob die neue Version angekommen ist.

## Was die App kann

- **Tagesmission**: drei Etappen à 6 Aufgaben (Aufwärmen, Neues entdecken, Festigen), dazwischen 30 Sekunden Bewegung. Bei mehreren Fächern ist es eine gemeinsame Mission: Das Fach mit der nächsten Arbeit bekommt «Neues» und «Festigen», ein anderes Fach wird zum Aufwärmen wiederholt. In den zwei Tagen vor einer Arbeit gehört die ganze Mission diesem Fach. Haben beide Fächer keinen Termin (oder denselben), wechselt der Schwerpunkt jeden Tag. Wer mittendrin aufhört, macht später mit der nächsten Etappe weiter. Danach gibt es Bonus-Runden ohne Limit.
- **Plan bis zur Arbeit**: Mit dem Datum der Arbeit verteilt die App die Themen auf die Tage. Zwei Tage vorher eine Probe-Arbeit, am Tag davor nur Wiederholen, am Tag selbst eine kurze Mutmacher-Runde.
- **Aufgabenarten**: Auswahl, Stimmt/Stimmt nicht, mehrere antippen, Reihenfolge, Zuordnen, Lückentext mit Wortkasten, Begriff schreiben, Zahl eingeben, Bild beschriften und Stelle im Bild antippen.
- **Hilfe in Stufen**: auf Wunsch ein Tipp; nach dem ersten Fehler ein Tipp, Richtiges bleibt stehen; nach dem zweiten Fehler die Lösung mit Erklärung und Merkhilfe. Die Aufgabe kommt in derselben Etappe noch einmal.
- **Fehlerkiste**: Falsches kommt wieder, bis es zweimal hintereinander richtig war.
- **Rechtschreibung im Sachfach**: Geschriebene Begriffe müssen erkennbar sein («Bluete», «Amfibien» zählen), die richtige Schreibweise wird freundlich gezeigt. Ein anderer Fachbegriff gilt nie als richtig. Für Rechtschreib-Aufgaben gibt es einen strengen Modus.
- **Warum?** Jedes Thema beginnt mit einer Frage aus dem Alltag des Kindes (zum Beispiel zum eigenen Hund) und erklärt, wozu man das wissen will. Nach Aufgaben erscheint ab und zu ein kurzer «Darum ist das wichtig»-Satz, und das Tier erzählt auf der Startseite «Wusstest du?»-Fakten.
- **Forschen & Basteln**: echte Aufträge zum Beobachten, Bauen (zum Beispiel mit Ofenknete) und Bewegen. Wer einen geschafft hat, tippt «Geschafft!» und bekommt Münzen.
- **Lernkarten** zum Nachlesen, mit Vorlesen.
- **Probe-Arbeit** wie eine echte Arbeit: keine Rückmeldung zwischendurch, Überspringen möglich, am Ende Ergebnis je Thema.
- **Das Tier**: Hund (Labrador in Foxred), Katze, Hase, Fuchs, Panda oder Hamster, eigene Zeichnungen. Es wächst mit den Punkten (Baby oder Welpe, Klein, Groß, Held). Bezahlt wird mit goldenen Münzen. Der Hund bekommt nur Hundefutter (Wasser, Futter, Leckerli, Hundekeks, Kauknochen, Kaustange), ins Zimmer kommen Hundekorb, Decke, Napf und Spielzeug.

## Ältere iPads

Die App läuft auch auf älteren iPads (iOS 12). Deshalb: keine Emoji, die erst später kamen (die Münze ist gezeichnet), kein CSS «inset», Abstände mit Rändern, wo Safari «gap» in Flexbox nicht kennt, und der lange Druck nutzt Touch-Ereignisse. `tools/test-version.mjs` prüft Emoji und «inset».

## Für Kinder mit Konzentrationsschwierigkeiten

Kurze Etappen mit sichtbarem Fortschritt, ein klarer nächster Schritt auf der Startseite, Bewegungspause, sofortige freundliche Rückmeldung, Tipps statt Strafen. In der Eltern-Übersicht lassen sich Etappenlänge, Pause, Töne, Vorlesen und ein ruhiger Modus ohne Animationen einstellen.

## Eltern-Übersicht

Auf der Startseite unten «Für Eltern: gedrückt halten» etwa zwei Sekunden lang drücken, bis der Knopf ganz gefüllt ist. Wer nur kurz tippt, bekommt eine Rechenaufgabe für Erwachsene als zweiten Weg (zum Beispiel, falls der lange Druck auf einem Gerät nicht klappt).

- **Fortschritt**: Bereitschaft je Thema, was noch wackelt, Übungszeit der letzten 7 Tage, Probe-Ergebnisse
- **Plan**: Titel und Datum der nächsten Arbeit, Tagesplan bis dahin
- **Einstellungen**: Aufgaben pro Etappe, Bewegungspause, Töne, ruhiger Modus, Vorlesen, Namen (auch der Name des Hundes zu Hause für die Warum-Texte)
- **Sicherung**: Sicherungsdatei speichern und laden, Zurücksetzen

## Spielstand

Der Spielstand liegt nur auf dem Gerät. Er wird mehrfach gesichert: Hauptspeicher, zweite Kopie und ein Spiegel in IndexedDB. Fehlt einer, springt der nächste ein. Dazu kommt die Sicherungsdatei (Eltern-Übersicht oder Versionsnummer antippen), die man in «Dateien» oder iCloud ablegt. Ältere iPads können oft keine Dateien speichern: Dann «Als Text kopieren» und den Text in einer Notiz aufheben; «Aus Text laden» holt alles zurück. Die Versionsanzeige wird orange, wenn die letzte Sicherungsdatei älter als 7 Tage ist.

## Inhalte schreiben

Jedes Fach ist eine Datei `public/inhalte-<fach>.js`, zum Beispiel `public/inhalte-bio.js` (Biologie Klasse 5, Knochen, Hund und Katze) und `public/inhalte-englisch.js` (Vokabeln). Sie wird in `public/index.html` vor `begleiter.js` eingebunden und in `public/sw.js` in `FILES` eingetragen. Gibt es mehrere Fächer, erscheinen oben Reiter.

```js
(function (root) {
  const F = root.LN_FAECHER || (root.LN_FAECHER = []);
  F.push({
    id: "bio", name: "Biologie", kurz: "Bio", icon: "🌱",
    arbeit: { titel: "Bio-Arbeit: Wirbeltiere", datum: "2026-11-26" },
    themen: [{
      id: "skelett", name: "Das Skelett", icon: "🦴",
      warum: { frage: "Warum fällt {hund} nicht in sich zusammen?", text: "Weil im Körper ein Gerüst aus Knochen steckt …" },
      fakten: ["Fast alle Säugetiere haben 7 Halswirbel."],
      karten: [ /* Karten */ ],
    }],
  });
})(typeof window !== "undefined" ? window : globalThis);
```

Kartentypen (jede Karte braucht eine eindeutige `id`; `tipp`, `erklaerung`, `merk` und `warum` sind freiwillig, aber hilfreich):

| Typ | Felder | Daraus wird |
|---|---|---|
| `begriff` | `begriff`, `bedeutung`, `auch` (weitere richtige Wörter), `streng` | Begriff wählen, Bedeutung wählen, Begriff schreiben |
| `frage` | `frage`, `antwort`, `falsch` (mind. 2), `schreiben: true` | Auswahl, auf Wunsch auch Schreiben |
| `zahl` | `frage`, `antwort`, `einheit`, `toleranz` | Zahl eingeben |
| `wahr` | `satz`, `wahr`, `korrektur` (bei falschen Sätzen) | Stimmt / Stimmt nicht |
| `paare` | `titel`, `paare: [[links, rechts], …]`, `frageWahl` | Zuordnen; wiederholt sich rechts, auch «Wohin gehört das?» |
| `gruppen` | `gruppen: { Name: [Einträge] }`, `frageWahl`, `frageAntippen` | Gruppe wählen, alle Passenden antippen |
| `reihe` | `titel`, `schritte` (in richtiger Reihenfolge) | Reihenfolge |
| `luecke` | `text` mit `{Lücken}`, `extra` (falsche Wörter für den Wortkasten) | Lückentext |
| `bild` | `titel`, `viewBox`, `svg`, `marken: [{ nr, x, y, begriff }]` | Nummer benennen, Stelle antippen, Begriff schreiben |
| `vokabel` | `en`, `de`, `auchEn` (weitere richtige Schreibweisen), `satz` mit einer `{Lücke}`, `satzFalsch` | Englisch → Deutsch wählen, Deutsch → Englisch wählen, Englisch schreiben (streng), Lückensatz |
| `auftrag` | `titel`, `text`, `art` (`basteln`, `forschen`, `bewegen`) | Mitmach-Auftrag unter «Forschen & Basteln», keine Quizfrage |

Ein Thema mit `bonus: true` (zum Beispiel «Hunde-Englisch») gibt es beim freien Üben und in den Lernkarten, es zählt aber nicht für den Plan bis zur Arbeit und nicht für die Probe.

Englische Vokabeln werden streng geprüft: Groß- und Kleinschreibung zählt, «to», «a», «an», «the» am Anfang dürfen fehlen. Beim Lückensatz stammen die falschen Wörter aus der anderen Wortart (Nomen gegen Verben, erkannt an «to»), damit nur eine Lösung passt; mit `satzFalsch` lassen sie sich selbst festlegen. Englische Wörter werden mit englischer Stimme vorgelesen.

`{hund}` in Texten wird durch den Namen des Hundes zu Hause ersetzt (sonst «dein Hund»), `{hund3}` nach «von», «bei», «mit» (sonst «deinem Hund»). In Lösungen und Lücken sind Platzhalter nicht erlaubt. Für den Hund keine Fürwörter (er, sie) verwenden, damit jeder Satz mit und ohne Namen stimmt.

Bei Bildern müssen die Marken mindestens 40 Bildeinheiten auseinanderliegen (der Test prüft das).

## Entwickeln und testen

```
npm ci                                  # einmal: Playwright installieren
npx playwright install chromium         # einmal: Browser für die Tests
npm test                                # Logik, Inhalte, Version (schnell)
node tools/test-logic.mjs               # jede Aufgabe aus jedem Startwert unabhängig nachgerechnet
node tools/e2e.mjs [ordner]             # spielt die App wie ein Kind durch, optional mit Screenshots
node tools/e2e-speicher.mjs             # Spielstand: Neuladen, Kopie, IndexedDB, kaputter und alter Stand
node tools/e2e-geraete.mjs [ordner]     # iPad hochkant, quer, Handy: Überlauf, Tippflächen, Schriftgröße
node tools/test-offline.mjs             # startet ohne Internet
node tools/test-update.mjs [ref]        # Update über die Vorgängerversion (Standard HEAD~1): Spielstand bleibt
node tools/monkey.mjs 300 1             # zufälliges Durchklicken (Schritte, Startwert)
node tools/make-icons.mjs [tierart]     # App-Icons neu zeichnen
```

Mit einem vorhandenen Chrome statt des Playwright-Browsers: `CHROME_PATH=/pfad/zu/chrome node tools/e2e.mjs`.

## Veröffentlichen

Bei jedem Pull Request laufen alle Tests in GitHub Actions. Nach dem Merge in `main` wird `public/` über GitHub Pages veröffentlicht. Dafür einmal in den Repository-Einstellungen unter **Pages** als Quelle **GitHub Actions** wählen.

Bei jeder Änderung an `public/` die Versionsnummer in `public/version.js` und den Cache-Namen in `public/sw.js` gemeinsam erhöhen. Der genaue Ablauf steht im Skill `.claude/skills/lernnest-release`.

## Datenschutz und Urheberrecht

Das Repository und die Seite sind öffentlich. Deshalb kommen **keine Namen, Noten, Fotos von Arbeiten oder Lernzetteln** hinein. Der Name des Kindes und des Tiers werden nur auf dem Gerät gespeichert. Fotos und Material zum Auswerten liegen lokal im Ordner `privat/`, der nicht hochgeladen wird.

Aufgaben werden selbst geschrieben, angelehnt an die Themen. Material der Lehrkraft nur mit ihrer Erlaubnis, Aufgaben aus Schulbüchern und Übungsheften nicht abtippen.

## Herkunft

Die Idee stammt von der Lern-App eines befreundeten Vaters für seine Kinder. Lernnest ist neu geschrieben und mit Claude Code gebaut.
