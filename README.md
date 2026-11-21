# Lernnest

Lern-App fürs iPad für die Vorbereitung auf Klassenarbeiten in Biologie, Englisch und Mathe, gestaltet für junge Teenager (dunkles Design, Level und Ränge, Spielhalle). Jeden Tag eine Mission von rund 15 Minuten: drei kurze Etappen mit einer Bewegungspause dazwischen. Wer genau arbeitet, verdient Tokens für zwei kleine Spiele. Mit Münzen pflegt das Kind seinen Hund. Keine Strafen, Sterne und XP gehen nie verloren.

Die App ist eine Web-App ohne Build-Schritt (reines JavaScript im Ordner `public/`), läuft offline und wird über GitHub Pages veröffentlicht.

## Aufs iPad

1. Die Adresse der App in **Safari** öffnen (steht nach der ersten Veröffentlichung unter Settings → Pages).
2. Teilen → **Zum Home-Bildschirm**.
3. Ab jetzt die App immer über das Symbol auf dem Home-Bildschirm öffnen. Dann läuft sie im Vollbild, auch ohne Internet, und Safari löscht den Spielstand nicht.

Oben rechts steht die Versionsnummer. So sieht man nach einem Update, ob die neue Version angekommen ist.

## Was die App kann

- **Tagesmission**: drei Etappen à 6 Aufgaben (Aufwärmen, Neues entdecken, Festigen), dazwischen 30 Sekunden Bewegung. Bei mehreren Fächern ist es eine gemeinsame Mission: Das Fach mit der nächsten Arbeit bekommt «Neues» und «Festigen», ein anderes Fach wird zum Aufwärmen wiederholt (welches, wechselt täglich). In den zwei Tagen vor einer Arbeit gehört die ganze Mission diesem Fach. Haben beide Fächer keinen Termin (oder denselben), wechselt der Schwerpunkt jeden Tag. Wer mittendrin aufhört, macht später mit der nächsten Etappe weiter. Danach gibt es Bonus-Runden ohne Limit.
- **Plan bis zur Arbeit**: Mit dem Datum der Arbeit verteilt die App die Themen auf die Tage. Zwei Tage vorher eine Probe-Arbeit, am Tag davor nur Wiederholen, am Tag selbst eine kurze Mutmacher-Runde.
- **Aufgabenarten**: Auswahl, Stimmt/Stimmt nicht, mehrere antippen, Reihenfolge, Zuordnen, Lückentext mit Wortkasten, Begriff schreiben, Zahl eingeben, Bild beschriften und Stelle im Bild antippen.
- **Hilfe in Stufen**: auf Wunsch ein Tipp; nach dem ersten Fehler ein Tipp, Richtiges bleibt stehen; nach dem zweiten Fehler die Lösung mit Erklärung und Merkhilfe. Die Aufgabe kommt in derselben Etappe noch einmal.
- **Fehlerkiste**: Falsches kommt wieder, bis es zweimal hintereinander richtig war.
- **Rechtschreibung im Sachfach**: Geschriebene Begriffe müssen erkennbar sein («Bluete», «Amfibien» zählen), die richtige Schreibweise wird freundlich gezeigt. Ein anderer Fachbegriff gilt nie als richtig. Für Rechtschreib-Aufgaben gibt es einen strengen Modus.
- **Warum?** Jedes Thema beginnt mit einer Frage aus dem Alltag des Kindes (zum Beispiel zum eigenen Hund) und erklärt, wozu man das wissen will. Nach Aufgaben erscheint ab und zu ein kurzer «Darum ist das wichtig»-Satz, und der Hund erzählt auf der Startseite einen «Fun Fact».
- **Challenges**: echte Aufträge zum Beobachten, Bauen (zum Beispiel mit Ofenknete) und Bewegen. Wer einen geschafft hat, tippt «Geschafft!» und bekommt Münzen und XP.
- **Lernkarten** zum Nachlesen, mit Vorlesen.
- **Probe-Arbeit** wie eine echte Arbeit: keine Rückmeldung zwischendurch, Überspringen möglich, am Ende Ergebnis je Thema.
- **Belohnung nach Leistung**: Münzen gibt es nur für Aufgaben, die auf Anhieb richtig sind (+1, alle 5 in Folge +1 extra). XP: 10 auf Anhieb, 3 nach einem Fehler. Eine Etappe bringt 2 Münzen ab der Hälfte richtig und 10 XP ab 80 %. Wiederholte Aufgaben zählen nicht als «auf Anhieb».
- **Level und Ränge**: Level 2 ab 100 XP, jedes weitere Level braucht 100 XP mehr. Ränge Rookie, Explorer (3), Pro (6), Expert (10), Legend (15). Mit dem Level werden App-Designs frei (Nacht, Hell, Ozean ab 3, Sunset ab 5, Galaxy ab 8).
- **Spielhalle**: Ein Token ist eine Spielrunde. Tokens gibt es für jede Etappe mit mindestens 80 % auf Anhieb (5 von 6), für die geschaffte Mission und für eine Probe-Arbeit ab 80 %. Zwei Spiele: «Sky Jump» (der Hund springt von Wolke zu Wolke nach oben bis ins All, gelenkt mit links und rechts, wandernde Wolken, Bröckel-Wolken und Federn, drei Minuten) und «Run» (der eigene Hund springt über Hindernisse und Gruben, sammelt Knochen). Höchstens 5 Runden am Tag, einstellbar. Das frühere Spiel «Blöcke» ist ab Version 6 weg, sein Rekord bleibt im Spielstand.
- **Mathe: schriftlich dividieren** (Divisor höchstens zweistellig, wie im Bildungsplan Klasse 5/6). Sechs Themen von «Teilen verstehen» bis «Rechnen im Alltag». Die Zahlen erzeugt die App jedes Mal neu, nichts lässt sich auswendig lernen.
  - **Rechen-Werkstatt**: Die Division wird auf Karopapier Schritt für Schritt gerechnet, wie im Heft: Anfang wählen, dann die «4-Move-Combo» Teilen, Mal, Minus, Runter. Eingabe über einen Ziffernblock. Jeder Schritt wird sofort geprüft, ein Fehler bekommt einen Hinweis, der genau diesen Fehler erklärt («Zu viel: 8 · 6 = 48, das ist mehr als 42»). Nach zwei Fehlern an derselben Stelle trägt die App die Zahl ein. Stufen: zuerst geführt mit Einmaleins-Leiter, dann Profi-Modus ohne Hilfen, dann nur noch das Ergebnis (gerechnet auf Papier, wie in der Arbeit). Auf Anhieb zählt nur eine Rechnung ganz ohne Fehler; dafür gibt es den Stempel «Perfekt».
  - **So geht's**: Erklärungen je Thema mit Bildern (Geld verteilen und wechseln, damit klar wird, warum man «runterholt») und durchgerechneten Beispielen. Am Ende ein Check; wer ihn auf Anhieb schafft, bekommt einmal 15 XP.
  - **Aufgabenarten**: Detektiv (in einer fertigen Rechnung den einen Fehler finden: vergessene 0, falsch abgezogen, falsch malgenommen), Überschlag (wie groß ist das Ergebnis ungefähr, kann das stimmen?), fehlende Zahl (Probe rückwärts), Kopfrechnen mit Nullen, «Wie oft passt 23 in 98?», Sachaufgaben (volle Tüten, alle unterbringen, was bleibt übrig) und Boss-Aufgaben mit Extra-Münzen.
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
| `teilen` | `titel`, `stellen`, `divisor` ([von, bis]), `rest`, `null` (true: muss, false: darf nicht), `anfang` (`gross`, `klein`), `boss` | Schriftliche Division: Werkstatt, Profi, nur Ergebnis |
| `detektiv` | `titel`, `stellen`, `divisor`, `fehler` (`null`, `minus`, `mal`) | Fehler in einer fertigen Rechnung finden |
| `ueberschlag` | `titel`, `stellen`, `divisor` | Größe des Ergebnisses wählen, «Kann das stimmen?» |
| `umkehr` | `titel`, `stellen` (des Ergebnisses), `divisor`, `rest` | «☐ : 7 = 86»: fehlende Zahl |
| `kopf` | `titel`, `form` (`einmaleins`, `nullen`, `zehner`) | Kopfrechnen |
| `passt` | `titel`, `divisor` | «Wie oft passt 23 in 98?» |
| `sach` | `titel`, `text` mit `{a}` und `{b}`, `frage`, `antwort` (`q` Ergebnis, `r` Rest, `auf` eins mehr für den Rest), `a`, `b` ([von, bis]), `rest`, `einheit` | Sachaufgabe mit neuen Zahlen |

Ein Thema kann `erklaerung` haben: eine Liste von Folien mit `titel`, `text` (Absätze), `bild` (SVG, 640 breit), `rechnung` (`{ a, b, bis }`, `bis` ist die Anzahl gezeigter Schritte oder `"alles"`, `leiter: true` zeigt die Einmaleins-Leiter) und am Ende `check` (`frage`, `antwort`, `falsch`, `erklaerung`). Die Erklärung erscheint unter «So geht's», in den Lernkarten und am Anfang einer Etappe mit neuem Stoff.

Ein Thema mit `bonus: true` (zum Beispiel «Hunde-Englisch») gibt es beim freien Üben und in den Lernkarten, es zählt aber nicht für den Plan bis zur Arbeit und nicht für die Probe.

Englische Vokabeln werden streng geprüft: Groß- und Kleinschreibung zählt, «to», «a», «an», «the» am Anfang dürfen fehlen. Beim Lückensatz stammen die falschen Wörter aus der anderen Wortart (Nomen gegen Verben, erkannt an «to»), damit nur eine Lösung passt; mit `satzFalsch` lassen sie sich selbst festlegen. Englische Wörter werden mit englischer Stimme vorgelesen.

`{hund}` in Texten wird durch den Namen des Hundes zu Hause ersetzt (sonst «dein Hund»), `{hund3}` nach «von», «bei», «mit» (sonst «deinem Hund»). In Lösungen und Lücken sind Platzhalter nicht erlaubt. Für den Hund keine Fürwörter (er, sie) verwenden, damit jeder Satz mit und ohne Namen stimmt.

Bei Bildern müssen die Marken mindestens 40 Bildeinheiten auseinanderliegen (der Test prüft das).

## Entwickeln und testen

```
npm ci                                  # einmal: Playwright installieren
npx playwright install chromium         # einmal: Browser für die Tests
npm test                                # Logik, Inhalte, Version (schnell)
node tools/test-logic.mjs               # jede Aufgabe aus jedem Startwert unabhängig nachgerechnet (Divisionen von Hand)
node tools/test-spiele.mjs              # Spielregeln; ein Autopilot zeigt, dass jede Strecke in Sky Jump und Run schaffbar ist
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

## Englisch-App für Erwachsene

Unter `public/englisch/` liegt eine eigenständige Lern-App für Business-Englisch in Meetings und Coachings (B1 zu B2), erreichbar unter `/englisch/`. Sie hat einen eigenen Offline-Speicher und einen eigenen Spielstand und berührt Lernnest nicht. Änderungen dort brauchen keine neue Lernnest-Version.

## Datenschutz und Urheberrecht

Das Repository und die Seite sind öffentlich. Deshalb kommen **keine Namen, Noten, Fotos von Arbeiten oder Lernzetteln** hinein. Der Name des Kindes und des Tiers werden nur auf dem Gerät gespeichert. Fotos und Material zum Auswerten liegen lokal im Ordner `privat/`, der nicht hochgeladen wird.

Aufgaben werden selbst geschrieben, angelehnt an die Themen. Material der Lehrkraft nur mit ihrer Erlaubnis, Aufgaben aus Schulbüchern und Übungsheften nicht abtippen.

## Herkunft

Die Idee stammt von der Lern-App eines befreundeten Vaters für seine Kinder. Lernnest ist neu geschrieben und mit Claude Code gebaut.
