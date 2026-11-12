---
name: lernnest-inhalte
description: Neue Lerninhalte für die Lernnest-App erstellen, aus Fotos von Lernzetteln, Hefteinträgen und Arbeiten. Nutzen bei: neues Thema, neue Arbeit, «hier sind die Fotos», «mach Aufgaben zu …», Schwächen auswerten, Plan bis zur Arbeit.
---

# Lernnest: Inhalte erstellen

Die Tochter (Klasse 5, Gymnasium Baden-Württemberg) findet Unterricht oft langweilig und will wissen, **warum** sie etwas lernen soll. Sie ist kreativ, bastelt gern und formt mit Ofenknete kleine Dinge (zum Beispiel Essen für Playmobil). Die Familie hat einen jungen Labrador. Inhalte holen sie genau dort ab.

## 1. Material auswerten

- Fotos, Arbeiten und Lernzettel kommen nach `privat/` und werden **nie** committet.
- Aus dem Material ablesen: Welche Themen, welche Fachbegriffe, welche Abbildungen (die Lehrkraft fragt oft genau die Heft-Abbildungen ab), welche Fehler in korrigierten Arbeiten.
- Mit dem Vater kurz besprechen: Was ist dran, wann ist die Arbeit, wo hakt es? Erst dann bauen.
- Abgleich mit dem Bildungsplan Baden-Württemberg für die Klassenstufe.

## 2. Aufbau eines Themas

- `warum`: eine Frage aus ihrem Alltag (am liebsten zum Hund zu Hause) plus 2 bis 4 Sätze, die die Antwort andeuten und zeigen, wozu das Wissen gut ist.
- `fakten`: 3 bis 4 «Wusstest du?»-Sätze zum Staunen. Nur geprüfte Fakten.
- Karten, die alle Begriffe und Abbildungen aus dem Heft abdecken. Für jede wichtige Abbildung eine `bild`-Karte (eigene SVG-Zeichnung, nie eingescannte Buchbilder). Marken mindestens 40 Einheiten auseinander.
- `warum` an Karten, wo ein Alltagsbezug echt ist. Lieber weniger als bemüht.
- `merk` für Merkhilfen und Eselsbrücken.
- 2 bis 3 `auftrag`-Karten je Thema: `basteln` (Knete, Pappe, Modell), `forschen` (beobachten, fühlen, vergleichen, am Hund nur sanft und mit Erwachsenen), `bewegen`.

Kartentypen und Felder: README, Abschnitt «Inhalte schreiben». Beispiel: `public/inhalte-bio.js`.

## 3. Regeln für Texte

- Deutsche Rechtschreibung mit ß (Schule in Deutschland), Guillemets «so», Du-Form, kurze Sätze, keine langen Gedankenstriche.
- Fachbegriffe genau so, wie sie im Heft stehen. Abweichende Schreibweisen als `auch` ergänzen.
- `{hund}` (Nominativ) und `{hund3}` (nach «von», «bei», «mit») für den Hund. Keine Fürwörter für den Hund. Keine echten Namen in die Dateien.
- Jede falsche Option muss eindeutig falsch sein. Bei Gruppen darf kein Eintrag zu zwei Gruppen passen.
- Ermutigend, nie abwertend. Kein «leicht», «einfach», «das solltest du wissen».

## 4. Prüfen

- `node tools/test-logic.mjs`: erzeugt jede Aufgabe aus vielen Startwerten und rechnet sie unabhängig aus den Inhalten nach (Lösung, Optionen, Eindeutigkeit, Rechtschreibung, kein Begriff gilt für einen anderen).
- Fakten, Zahlen und Aussagen gegen verlässliche Quellen prüfen. Unsichere Aussagen weglassen.
- Bilder ansehen: `node tools/e2e-geraete.mjs <ordner>` und die Screenshots der Bild-Aufgaben öffnen.

## 5. Plan bis zur Arbeit

Das Datum der Arbeit tragen die Eltern in der Eltern-Übersicht ein (oder es steht in `arbeit.datum`). Die App verteilt die Themen in Inhaltsreihenfolge auf die Tage, zwei Tage vorher Probe, am Tag davor Wiederholen, am Tag selbst Mutmacher. Themen deshalb in der Reihenfolge des Unterrichts anlegen.

## 6. Urheberrecht

Aufgaben selbst formulieren. Keine Aufgaben aus Schulbüchern, Arbeitsheften oder Verlagsmaterial abtippen. Material der Lehrkraft nur mit ihrer Erlaubnis verwenden. Abbildungen selbst als SVG zeichnen.

Danach weiter mit dem Skill `lernnest-release`.
