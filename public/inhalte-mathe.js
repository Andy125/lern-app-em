// Mathematik Klasse 5, Gymnasium Baden-Württemberg: schriftlich dividieren.
// Nach dem Bildungsplan 2016 (Klassen 5/6): natürliche Zahlen schriftlich dividieren, Divisor höchstens zweistellig,
// mit Überschlag und Probe. Aufgaben selbst geschrieben; die Rechnungen erzeugt die App aus Startwerten (logic.js),
// deshalb kommen immer neue Zahlen und nichts lässt sich auswendig lernen.
// Jedes Thema hat «erklaerung»: Folien mit Bild oder durchgerechnetem Beispiel und einem Check am Ende.
// {hund} wird in der App durch den Namen des Hundes zu Hause ersetzt, sonst «dein Hund». Keine Fürwörter für den Hund.
(function (root) {
  "use strict";
  const F = root.LN_FAECHER || (root.LN_FAECHER = []);

  // ---------- Zeichenhilfen für die Erklär-Bilder ----------
  // Jedes Bild ist ein fertiges SVG, 640 breit
  const svg = (hoehe, innen) => `<svg viewBox="0 0 640 ${hoehe}" role="img" aria-hidden="true">${innen}</svg>`;
  const LILA = "#4b3fb0", TEXT = "#2b2550", LEISE = "#7a7399";
  const schrift = (x, y, t, gr, farbe, extra) => `<text x="${x}" y="${y}" font-size="${gr || 16}" fill="${farbe || TEXT}" font-family="Sora, system-ui, sans-serif"${extra ? " " + extra : ""}>${t}</text>`;
  // Geld: Hunderter-Schein, Zehner-Schein, Ein-Euro-Münze
  function geld(typ, x, y) {
    if (typ === "h") return `<rect x="${x}" y="${y}" width="46" height="24" rx="4" fill="#a8d8a2" stroke="#4f8f4b" stroke-width="2"/>` + schrift(x + 23, y + 17, "100", 13, "#2f5d2c", 'text-anchor="middle" font-weight="700"');
    if (typ === "z") return `<rect x="${x}" y="${y}" width="34" height="20" rx="3" fill="#f6b3ad" stroke="#c0605a" stroke-width="2"/>` + schrift(x + 17, y + 14.5, "10", 12, "#7a2d28", 'text-anchor="middle" font-weight="700"');
    return `<circle cx="${x + 10}" cy="${y + 10}" r="10" fill="#f3d27a" stroke="#b8912e" stroke-width="2"/>` + schrift(x + 10, y + 14.5, "1", 12, "#6b5212", 'text-anchor="middle" font-weight="700"');
  }
  const GROESSE = { h: [52, 30], z: [40, 25], e: [25, 25] };
  function stapel(typ, n, x0, y0, proZeile) {
    let s = "";
    for (let i = 0; i < n; i++) s += geld(typ, x0 + (i % proZeile) * GROESSE[typ][0], y0 + Math.floor(i / proZeile) * GROESSE[typ][1]);
    return s;
  }
  // Oben: was noch zu verteilen ist (Hunderter, Zehner, Einer). Unten: was jedes der drei Kinder schon hat.
  function verteilBild(topf, je, notiz) {
    let s = `<rect x="0" y="0" width="640" height="340" fill="#fffdf8"/>` + schrift(16, 26, "Noch zu verteilen", 16, LILA, 'font-weight="700"');
    [["h", "Hunderter"], ["z", "Zehner"], ["e", "Einer"]].forEach(([typ, name], i) => {
      const x = 16 + i * 210;
      s += `<rect x="${x}" y="38" width="196" height="136" rx="12" fill="#f1eefb" stroke="#d9d3ee" stroke-width="2"/>` + schrift(x + 12, 58, name + ": " + topf[typ], 14, LEISE, 'font-weight="700"');
      s += stapel(typ, topf[typ], x + 12, 68, typ === "h" ? 3 : typ === "z" ? 4 : 7);
    });
    ["Du", "Zoe", "Ben"].forEach((name, i) => {
      const x = 16 + i * 210;
      s += `<rect x="${x}" y="186" width="196" height="146" rx="12" fill="#fff" stroke="#b7a8ff" stroke-width="2"/>` + schrift(x + 12, 208, name, 15, LILA, 'font-weight="700"');
      s += stapel("h", je.h, x + 12, 218, 3) + stapel("z", je.z, x + 12, 252, 4) + stapel("e", je.e, x + 12, 284, 7);
    });
    if (notiz) s += `<rect x="330" y="8" width="296" height="26" rx="8" fill="#F2773A"/>` + schrift(478, 26, notiz, 14, "#fff", 'text-anchor="middle" font-weight="700"');
    return s;
  }
  // Leckerli als kleiner Knochen
  const leckerli = (x, y) => `<g transform="translate(${x} ${y})"><rect x="-10" y="-3.5" width="20" height="7" rx="3" fill="#f3ead8" stroke="#8a7a62" stroke-width="1.6"/><circle cx="-10" cy="-3.5" r="4" fill="#f3ead8" stroke="#8a7a62" stroke-width="1.6"/><circle cx="-10" cy="3.5" r="4" fill="#f3ead8" stroke="#8a7a62" stroke-width="1.6"/><circle cx="10" cy="-3.5" r="4" fill="#f3ead8" stroke="#8a7a62" stroke-width="1.6"/><circle cx="10" cy="3.5" r="4" fill="#f3ead8" stroke="#8a7a62" stroke-width="1.6"/></g>`;
  const napf = (x, y, n) => {
    let s = `<path d="M${x - 70} ${y} Q${x} ${y + 70} ${x + 70} ${y} Z" fill="#5AA9FF" stroke="#2a6fdb" stroke-width="3"/><ellipse cx="${x}" cy="${y}" rx="70" ry="12" fill="#cfe5ff" stroke="#2a6fdb" stroke-width="3"/>`;
    for (let i = 0; i < n; i++) s += leckerli(x - 33 + (i % 3) * 33, y - 14 - Math.floor(i / 3) * 16);
    return s;
  };
  const tuete = (x, y, n, k) => {
    let s = `<g transform="translate(${x} ${y}) scale(${k})"><path d="M0 0 L90 0 L82 96 L8 96 Z" fill="#ffe7c9" stroke="#c08a4a" stroke-width="3"/>`;
    for (let i = 0; i < n; i++) s += leckerli(28 + (i % 2) * 34, 22 + Math.floor(i / 2) * 25);
    return s + "</g>";
  };
  function napfBild() {
    let s = `<rect width="640" height="230" fill="#fffdf8"/>`;
    s += napf(120, 140, 4) + napf(320, 140, 4) + napf(520, 140, 4);
    return s + schrift(320, 40, "12 Leckerli, 3 Näpfe: in jeden Napf 4", 20, TEXT, 'text-anchor="middle" font-weight="700"') + schrift(320, 215, "12 : 3 = 4", 22, LILA, 'text-anchor="middle" font-weight="700"');
  }
  function tuetenBild(gesamt, proTuete) {
    const voll = Math.floor(gesamt / proTuete), rest = gesamt % proTuete;
    let s = `<rect width="640" height="230" fill="#fffdf8"/>`;
    const n = voll + (rest ? 1 : 0), k = Math.min(1, 610 / (n * 110)), w = 110 * k, start = 320 - (n * w - 20 * k) / 2;
    for (let i = 0; i < voll; i++) s += tuete(start + i * w, 60 + (1 - k) * 48, proTuete, k);
    if (rest) { for (let i = 0; i < rest; i++) s += leckerli(start + voll * w + 22 + (i % 2) * 30, 120 + Math.floor(i / 2) * 22); s += schrift(start + voll * w + 38, 182, "übrig", 15, "#c0605a", 'text-anchor="middle" font-weight="700"'); }
    s += schrift(320, 36, `${gesamt} Leckerli, immer ${proTuete} in eine Tüte`, 20, TEXT, 'text-anchor="middle" font-weight="700"');
    return s + schrift(320, 215, `${gesamt} : ${proTuete} = ${voll}${rest ? " Rest " + rest : ""}`, 22, LILA, 'text-anchor="middle" font-weight="700"');
  }
  // Die Namen der Zahlen beim Teilen
  function namenBild() {
    let s = `<rect width="640" height="200" fill="#fffdf8"/>`;
    [[150, "84"], [240, ":"], [320, "4"], [400, "="], [490, "21"]].forEach(([x, t]) => { s += schrift(x, 80, t, 46, TEXT, 'text-anchor="middle" font-weight="700"'); });
    const pfeil = (x, name, unter, farbe) => `<line x1="${x}" y1="100" x2="${x}" y2="130" stroke="${farbe}" stroke-width="3"/><path d="M${x - 6} 106 L${x} 96 L${x + 6} 106 Z" fill="${farbe}"/>` + schrift(x, 156, name, 20, farbe, 'text-anchor="middle" font-weight="700"') + schrift(x, 180, unter, 14, LEISE, 'text-anchor="middle"');
    return s + pfeil(150, "Dividend", "wird geteilt", "#e5662a") + pfeil(320, "Divisor", "teilt", "#2a6fdb") + pfeil(490, "Quotient", "Ergebnis", "#0f9c7e");
  }
  // Überschlag: runden, im Kopf teilen, vergleichen
  function ueberschlagBild() {
    let s = `<rect width="640" height="220" fill="#fffdf8"/>`;
    s += schrift(30, 50, "4 218 : 6", 30, TEXT, 'font-weight="700"') + schrift(240, 50, "≈", 30, LEISE) + schrift(290, 50, "4 200 : 6 = 700", 30, LILA, 'font-weight="700"');
    s += `<rect x="30" y="80" width="270" height="56" rx="12" fill="#d8f7ee" stroke="#0f9c7e" stroke-width="2"/>` + schrift(165, 116, "703  passt zu 700", 22, "#0b6b56", 'text-anchor="middle" font-weight="700"');
    s += `<rect x="330" y="80" width="280" height="56" rx="12" fill="#ffe3e7" stroke="#d9475c" stroke-width="2"/>` + schrift(470, 116, "73  viel zu klein", 22, "#a3283a", 'text-anchor="middle" font-weight="700"');
    return s + schrift(320, 186, "Runde so, dass du im Kopf teilen kannst.", 18, TEXT, 'text-anchor="middle"');
  }

  F.push({
    id: "mathe",
    name: "Mathematik",
    kurz: "Mathe",
    icon: "➗",
    arbeit: { titel: "Mathe-Arbeit: Schriftlich dividieren", datum: null },
    themen: [
      {
        id: "verstehen",
        name: "Teilen verstehen",
        icon: "🍪",
        warum: { frage: "{hund} bekommt 84 Leckerli für 4 Wochen. Wie viele sind das pro Woche?", text: "Abzählen dauert ewig. Mit Teilen geht es in Sekunden: 84 : 4 = 21. Teilen brauchst du ständig, beim Taschengeld, bei Pizza für alle oder bei der Frage, wie viele Busse eine Klasse braucht." },
        fakten: [
          "Das Zeichen : fürs Teilen hat Gottfried Wilhelm Leibniz bekannt gemacht. 1684 hat er es zum ersten Mal in einer Veröffentlichung benutzt.",
          "Das Zeichen ÷ stammt von Johann Heinrich Rahn aus dem Kanton Zürich. Es stand 1659 in seinem Buch «Teutsche Algebra».",
          "In der Schule schreibt man in Deutschland meist den Doppelpunkt. Auf Taschenrechnern steht dagegen fast immer ÷.",
          "«Quotient» kommt vom lateinischen Wort «quotiens». Das heißt «wie oft», genau das fragst du beim Teilen.",
        ],
        erklaerung: [
          { titel: "Teilen heißt: gerecht verteilen", bild: svg(230, napfBild()), text: ["Du hast 12 Leckerli und 3 Näpfe. In jeden Napf sollen gleich viele. Das sind 4.", "In Mathe schreibst du: 12 : 3 = 4. Du sprichst: «12 geteilt durch 3 ist 4.»"] },
          { titel: "Oder: aufteilen in Päckchen", bild: svg(230, tuetenBild(12, 4)), text: ["Du packst immer 4 Leckerli in eine Tüte. Wie viele Tüten werden es? 3.", "Auch das ist Teilen: 12 : 4 = 3. Du fragst: Wie oft passt die 4 in die 12?"] },
          { titel: "Die Namen der Zahlen", bild: svg(200, namenBild()), text: ["Die Zahl, die geteilt wird, heißt Dividend. Die Zahl, durch die du teilst, heißt Divisor. Das Ergebnis heißt Quotient.", "Merkhilfe: Divi-DEND steht am Anfang, der Divi-SOR sorgt fürs Teilen."] },
          { titel: "Teilen ist Malnehmen rückwärts", text: ["Wenn du 7 · 8 = 56 weißt, kennst du auch 56 : 8 = 7 und 56 : 7 = 8.", "Deshalb ist das Einmaleins dein wichtigstes Werkzeug. Jede schriftliche Division besteht aus lauter kleinen Einmaleins-Aufgaben."] },
          { titel: "Der Nullen-Trick", text: ["4 200 : 6? Lass die Nullen erst weg: 42 : 6 = 7. Dann hängst du die zwei Nullen wieder an: 700.", "Bei 2 400 : 30 darfst du bei beiden Zahlen eine Null streichen: 240 : 3 = 80."] },
          { titel: "Check", check: { frage: "Bei 84 : 4 = 21: Wie heißt die 21?", antwort: "Quotient", falsch: ["Dividend", "Divisor"], erklaerung: "Das Ergebnis heißt Quotient. 84 ist der Dividend, 4 der Divisor." } },
        ],
        karten: [
          { typ: "begriff", id: "m-dividend", begriff: "der Dividend", bedeutung: "Die Zahl, die geteilt wird. Bei 84 : 4 = 21 ist es die 84.", merk: "Divi-DEND steht am Anfang." },
          { typ: "begriff", id: "m-divisor", begriff: "der Divisor", bedeutung: "Die Zahl, durch die geteilt wird. Bei 84 : 4 = 21 ist es die 4.", merk: "Der Divi-SOR sorgt fürs Teilen." },
          { typ: "begriff", id: "m-quotient", begriff: "der Quotient", bedeutung: "Das Ergebnis beim Teilen. Bei 84 : 4 = 21 ist es die 21.", merk: "Quotient kommt von «quotiens», lateinisch für «wie oft»." },
          { typ: "kopf", id: "m-kopf-1x1", titel: "Einmaleins rückwärts", form: "einmaleins" },
          { typ: "luecke", id: "m-namen-luecke", titel: "Setze die Namen ein.", text: "Bei 84 : 4 = 21 ist 84 der {Dividend}, 4 der {Divisor} und 21 der {Quotient}.", extra: ["Rest", "Faktor"] },
          { typ: "wahr", id: "m-umkehr-wahr", satz: "Teilen ist die Umkehrung vom Malnehmen.", wahr: true, erklaerung: "Stimmt: Aus 7 · 8 = 56 folgt 56 : 8 = 7." },
          { typ: "kopf", id: "m-kopf-nullen", titel: "Nullen-Trick", form: "nullen" },
          { typ: "wahr", id: "m-null-teilen", satz: "Durch 0 kann man teilen, dann kommt 0 heraus.", wahr: false, korrektur: "Durch 0 kann man nicht teilen. Wie oft passt 0 in 5? Egal wie oft du 0 nimmst, du kommst nie auf 5." },
          { typ: "umkehr", id: "m-umkehr", titel: "Welche Zahl fehlt?", stellen: [2, 2], divisor: [2, 9] },
          { typ: "kopf", id: "m-kopf-zehner", titel: "Durch Zehnerzahlen", form: "zehner" },
          { typ: "auftrag", id: "m-knete-kekse", art: "basteln", titel: "Knete-Kekse verteilen", text: "Forme aus Ofenknete 24 kleine Kekse. Verteile sie gerecht auf 2, 3, 4 und 6 Teller und schreib jedes Mal die Rechnung auf, zum Beispiel 24 : 3 = 8. Probier dann 5 Teller: Was passiert?" },
          { typ: "auftrag", id: "m-leckerli-packung", art: "forschen", titel: "Wie lange reicht die Packung?", text: "Zähle mit einem Erwachsenen, wie viele Leckerli in einer Packung sind. Überlegt, wie viele {hund} am Tag bekommt. Wie viele Tage reicht die Packung? Schreib die Rechnung auf." },
        ],
      },
      {
        id: "combo",
        name: "Die 4-Move-Combo",
        icon: "🎮",
        warum: { frage: "Wie teilst du 852 Leckerli gerecht auf 4 Hunde auf?", text: "So große Zahlen schaffst du nicht mehr im Kopf. Beim schriftlichen Dividieren zerlegst du die Aufgabe in kleine Schritte, die du mit dem Einmaleins lösen kannst. Es sind immer dieselben vier Moves, Stelle für Stelle." },
        fakten: [
          "Beim schriftlichen Addieren und Subtrahieren fängst du rechts an. Beim Dividieren fängst du links an, bei der größten Stelle.",
          "Bei einer vierstelligen Zahl geteilt durch eine einstellige machst du die Combo höchstens viermal hintereinander.",
          "Das schriftliche Teilen klappt mit jeder noch so großen Zahl. Du brauchst dafür nur das Einmaleins.",
        ],
        erklaerung: [
          { titel: "Warum das funktioniert", bild: svg(340, verteilBild({ h: 4, z: 5, e: 6 }, { h: 0, z: 0, e: 0 })), text: ["Ihr seid zu dritt und habt 456 € gewonnen: 4 Hunderter, 5 Zehner und 6 Einer. Wie teilt ihr gerecht?", "Der Trick: Du fängst mit den größten Scheinen an."] },
          { titel: "1. Die Hunderter", bild: svg(340, verteilBild({ h: 1, z: 5, e: 6 }, { h: 1, z: 0, e: 0 }, "4 : 3 = 1, Rest 1")), text: ["4 Hunderter für 3 Kinder: Jedes bekommt 1 Hunderter. 1 Hunderter bleibt übrig."] },
          { titel: "2. Wechseln", bild: svg(340, verteilBild({ h: 0, z: 15, e: 6 }, { h: 1, z: 0, e: 0 }, "1 Hunderter = 10 Zehner")), text: ["Den übrigen Hunderter wechselst du in 10 Zehner. Mit den 5 Zehnern sind es jetzt 15 Zehner.", "Genau das ist später das Runterholen: Der Rest rutscht zur nächsten Stelle."] },
          { titel: "3. Die Zehner", bild: svg(340, verteilBild({ h: 0, z: 0, e: 6 }, { h: 1, z: 5, e: 0 }, "15 : 3 = 5")), text: ["15 Zehner für 3 Kinder: Jedes bekommt 5 Zehner. Nichts bleibt übrig."] },
          { titel: "4. Die Einer", bild: svg(340, verteilBild({ h: 0, z: 0, e: 0 }, { h: 1, z: 5, e: 2 }, "6 : 3 = 2")), text: ["6 Einer für 3 Kinder: Jedes bekommt 2.", "Jedes Kind hat jetzt 1 Hunderter, 5 Zehner und 2 Einer, also 152 €."] },
          { titel: "So sieht das im Heft aus", rechnung: { a: 456, b: 3, bis: "alles" }, text: ["Jede Zeile im Heft ist ein Schritt beim Verteilen. 4 : 3 = 1, Rest 1. Dann die 5 runterholen: 15 Zehner. 15 : 3 = 5. Dann die 6 runterholen: 6 : 3 = 2.", "Ergebnis: 456 : 3 = 152."] },
          { titel: "Die 4-Move-Combo", text: ["1. Teilen: Wie oft passt der Divisor hinein? Die Ziffer kommt ins Ergebnis.", "2. Mal: Ziffer mal Divisor. Das Produkt schreibst du darunter.", "3. Minus: Abziehen. Was übrig bleibt, muss kleiner als der Divisor sein.", "4. Runter: Die nächste Ziffer herunterholen. Dann geht die Combo von vorn los, bis keine Ziffer mehr übrig ist.", "Merkspruch: «Tiger malen mit Rot» (Teilen, Mal, Minus, Runter)."] },
          { titel: "Los geht's: 852 : 4", rechnung: { a: 852, b: 4, bis: 1 }, text: ["Womit fängst du an? Die 4 passt in die 8. Also fängst du mit der 8 an.", "Teilen: Wie oft passt 4 in 8? 2-mal. Die 2 kommt ins Ergebnis."] },
          { titel: "Mal, Minus, Runter", rechnung: { a: 852, b: 4, bis: 5 }, text: ["Mal: 2 · 4 = 8. Minus: 8 − 8 = 0. Runter: Die 5 kommt herunter, jetzt steht da 5.", "Und wieder von vorn: Wie oft passt 4 in 5?"] },
          { titel: "Fertig", rechnung: { a: 852, b: 4, bis: "alles" }, text: ["4 passt 1-mal in 5, Rest 1. Die 2 runter: 12. 4 passt 3-mal in 12, Rest 0.", "852 : 4 = 213. Keine Ziffer mehr übrig, also fertig."] },
          { titel: "Wenn der Anfang zu klein ist", rechnung: { a: 156, b: 4, bis: 1 }, text: ["Bei 156 : 4 passt die 4 nicht in die 1. Dann nimmst du die nächste Ziffer dazu: 15.", "Das Ergebnis hat dann eine Stelle weniger: 156 : 4 = 39."] },
          { titel: "Check", check: { frage: "Welcher Move kommt nach «Mal»?", antwort: "Minus", falsch: ["Runterholen", "Teilen"], erklaerung: "Die Reihenfolge ist Teilen, Mal, Minus, Runter. Tiger malen mit Rot." } },
        ],
        karten: [
          { typ: "reihe", id: "m-moves", titel: "Bring die vier Moves in die richtige Reihenfolge.", schritte: ["Teilen", "Malnehmen", "Abziehen", "Runterholen"], merk: "Tiger malen mit Rot: Teilen, Mal, Minus, Runter." },
          { typ: "teilen", id: "m-d3", titel: "Dreistellig durch einstellig", stellen: 3, divisor: [2, 9], rest: false, null: false, anfang: "gross" },
          { typ: "wahr", id: "m-links", satz: "Beim schriftlichen Dividieren fängt man rechts an, wie beim Addieren.", wahr: false, korrektur: "Beim Dividieren fängst du links an, bei der größten Stelle. Beim Addieren und Subtrahieren fängst du rechts an." },
          { typ: "teilen", id: "m-d4", titel: "Vierstellig durch einstellig", stellen: 4, divisor: [2, 9], rest: false, null: false, anfang: "gross" },
          { typ: "frage", id: "m-anfang", frage: "Womit fängst du bei 156 : 4 an?", antwort: "mit 15", falsch: ["mit 1", "mit 156", "mit 56"], erklaerung: "Die 4 passt nicht in die 1. Also nimmst du die nächste Ziffer dazu: 15." },
          { typ: "teilen", id: "m-klein", titel: "Anfang zu klein", stellen: [3, 4], divisor: [3, 9], rest: false, null: false, anfang: "klein" },
          { typ: "wahr", id: "m-kleiner", satz: "Nach dem Minus muss die Zahl kleiner sein als der Divisor.", wahr: true, erklaerung: "Stimmt. Sonst hätte der Divisor noch einmal hineingepasst, und deine Ziffer war zu klein." },
          { typ: "frage", id: "m-nach-runter", frage: "Was machst du nach dem Runterholen?", antwort: "Wieder teilen", falsch: ["Abziehen", "Malnehmen", "Aufhören"], erklaerung: "Nach dem Runterholen beginnt die Combo von vorn: Teilen, Mal, Minus, Runter." },
          { typ: "auftrag", id: "m-combo-tanz", art: "bewegen", titel: "Combo-Tanz", text: "Erfinde zu jedem Move eine Bewegung, zum Beispiel Teilen: Arme auseinander. Mal: Arme kreuzen. Minus: in die Hocke. Runter: auf den Boden tippen. Rechne 852 : 4 und mach bei jedem Schritt die Bewegung." },
          { typ: "auftrag", id: "m-geld-spiel", art: "basteln", titel: "Geld-Wechsel-Spiel", text: "Bastle aus Papier 4 Hunderter, 10 Zehner und 10 Ein-Euro-Münzen. Teile 456 € auf 3 Kuscheltiere auf, genau wie in der Erklärung. An welcher Stelle musst du wechseln?" },
        ],
      },
      {
        id: "nullfalle",
        name: "Die Null-Falle",
        icon: "🕳️",
        warum: { frage: "73 oder 703: Ist das nicht fast dasselbe?", text: "Nein! 703 ist fast zehnmal so viel wie 73. Eine vergessene 0 ist einer der häufigsten Fehler in Mathearbeiten. Mit einem Überschlag erkennst du ihn in fünf Sekunden." },
        fakten: [
          "Eine vergessene 0 macht das Ergebnis ungefähr zehnmal kleiner: 73 statt 703.",
          "Die Ziffer 0 kam über Indien und die arabische Welt nach Europa. Die römischen Zahlen kennen keine 0.",
          "Jede Ziffer, die du herunterholst, bringt eine Ziffer ins Ergebnis. Daran erkennst du, wie lang das Ergebnis sein muss.",
        ],
        erklaerung: [
          { titel: "Wenn der Divisor nicht passt", rechnung: { a: 4218, b: 6, bis: 5 }, text: ["4 218 : 6. Am Anfang: 42 : 6 = 7, Rest 0. Dann holst du die 1 herunter.", "Wie oft passt 6 in 1? Gar nicht, also 0-mal. Diese 0 musst du ins Ergebnis schreiben!"] },
          { titel: "Mit der 0 geht es weiter", rechnung: { a: 4218, b: 6, bis: "alles" }, text: ["0 · 6 = 0, und 1 − 0 = 1. Dann die 8 herunter: 18. 18 : 6 = 3.", "Ergebnis: 703, nicht 73."] },
          { titel: "Der Überschlag-Check", bild: svg(220, ueberschlagBild()), text: ["Runde den Dividenden so, dass du im Kopf teilen kannst: 4 218 ist ungefähr 4 200. Und 4 200 : 6 = 700.", "703 passt zu 700. 73 ist viel zu klein, da fehlt eine 0."] },
          { titel: "Die Zähl-Regel", rechnung: { a: 4218, b: 6, bis: 1 }, text: ["Du fängst mit 42 an. Danach stehen noch 2 Ziffern im Dividenden: die 1 und die 8.", "Jede heruntergeholte Ziffer bringt eine Ziffer ins Ergebnis. Also hat das Ergebnis 1 + 2 = 3 Ziffern."] },
          { titel: "Check", check: { frage: "Was ist 4 218 : 6?", antwort: "703", falsch: ["73", "7003"], erklaerung: "Überschlag: 4 200 : 6 = 700. Nur 703 passt dazu." } },
        ],
        karten: [
          { typ: "wahr", id: "m-null-rein", satz: "Wenn der Divisor nach dem Runterholen nicht hineinpasst, schreibst du eine 0 ins Ergebnis.", wahr: true, erklaerung: "Stimmt. Er passt 0-mal hinein, also kommt die 0 ins Ergebnis. Dann holst du die nächste Ziffer herunter." },
          { typ: "teilen", id: "m-null3", titel: "Null im Ergebnis (dreistellig)", stellen: 3, divisor: [2, 9], rest: false, null: true },
          { typ: "ueberschlag", id: "m-ueberschlag", titel: "Überschlag", stellen: [3, 4], divisor: [2, 9] },
          { typ: "begriff", id: "m-ueberschlag-begriff", begriff: "der Überschlag", bedeutung: "Eine schnelle Rechnung mit gerundeten Zahlen. Sie zeigt, wie groß das Ergebnis ungefähr sein muss.", auch: ["Überschlagsrechnung"] },
          { typ: "teilen", id: "m-null4", titel: "Null im Ergebnis (vierstellig)", stellen: 4, divisor: [2, 9], rest: false, null: true },
          { typ: "detektiv", id: "m-det-null", titel: "Detektiv: die vergessene Null", stellen: [3, 4], divisor: [2, 9], fehler: ["null"] },
          { typ: "wahr", id: "m-null-weg", satz: "Eine 0 im Ergebnis kann man weglassen, sie ist ja nichts wert.", wahr: false, korrektur: "Ohne die 0 rutschen die anderen Ziffern an die falsche Stelle: 73 statt 703 ist fast zehnmal zu wenig." },
          { typ: "frage", id: "m-stellen", frage: "Bei 4 218 : 6 fängst du mit 42 an. Danach stehen noch zwei Ziffern im Dividenden. Wie viele Ziffern hat das Ergebnis?", antwort: "3", falsch: ["2", "4"], erklaerung: "Die 42 bringt eine Ziffer, jede heruntergeholte Ziffer noch eine: 1 + 2 = 3. Das Ergebnis ist 703." },
          { typ: "auftrag", id: "m-null-jagd", art: "forschen", titel: "Null-Jagd", text: "Denk dir drei Divisionen aus, bei denen eine 0 im Ergebnis steht. Trick: Nimm ein Ergebnis mit 0, zum Beispiel 305, und rechne 305 · 7 = 2 135. Dann ist 2 135 : 7 deine Aufgabe. Lass jemanden aus deiner Familie rechnen. Tappt er in die Null-Falle?" },
        ],
      },
      {
        id: "rest",
        name: "Mit Rest",
        icon: "🧩",
        warum: { frage: "Du hast 50 Hundekekse und packst immer 6 in eine Tüte. Was passiert mit den übrigen?", text: "Nicht jede Teilung geht glatt auf. Was übrig bleibt, ist der Rest. Und dann musst du überlegen: Zählen nur die vollen Tüten, oder brauchst du für den Rest noch eine?" },
        fakten: [
          "Ein Jahr hat 365 Tage. 365 : 7 = 52 Rest 1. Deshalb fällt dein Geburtstag meist jedes Jahr auf den nächsten Wochentag.",
          "Eine Zahl geht ohne Rest durch 3, wenn ihre Quersumme durch 3 geht. Bei 252 ist die Quersumme 2 + 5 + 2 = 9, also ist 252 : 3 = 84 ohne Rest.",
          "Gerade Zahlen gehen immer glatt durch 2. Bei ungeraden Zahlen bleibt immer der Rest 1.",
        ],
        erklaerung: [
          { titel: "Wenn etwas übrig bleibt", bild: svg(230, tuetenBild(14, 4)), text: ["14 Leckerli, immer 4 in eine Tüte. 3 Tüten werden voll, 2 Leckerli bleiben übrig.", "Man schreibt: 14 : 4 = 3 Rest 2."] },
          { titel: "Im Heft", rechnung: { a: 157, b: 4, bis: "alles" }, text: ["157 : 4. Die Combo läuft wie immer. Am Ende ist keine Ziffer mehr zum Herunterholen da, aber es bleibt 1 übrig.", "Das ist der Rest: 157 : 4 = 39 Rest 1."] },
          { titel: "Der Rest ist immer kleiner", text: ["Teilst du durch 4, kann der Rest nur 0, 1, 2 oder 3 sein.", "Bleiben 4 oder mehr übrig, hätte die 4 noch einmal hineingepasst. Dann war deine Ziffer zu klein."] },
          { titel: "Die Probe mit Rest", text: ["Ergebnis mal Divisor, dann den Rest dazu. Kommt der Dividend heraus, stimmt alles.", "39 · 4 = 156, und 156 + 1 = 157. Stimmt!"] },
          { titel: "Lies die Frage genau", bild: svg(230, tuetenBild(50, 6)), text: ["50 : 6 = 8 Rest 2.", "«Wie viele Tüten werden voll?» 8. «Wie viele Tüten brauchst du für alle Kekse?» 9, denn die 2 übrigen brauchen auch eine Tüte. «Wie viele bleiben übrig?» 2."] },
          { titel: "Check", check: { frage: "50 Kekse, immer 6 in eine Tüte. Wie viele Tüten brauchst du für alle Kekse?", antwort: "9", falsch: ["8", "2", "6"], erklaerung: "50 : 6 = 8 Rest 2. 8 Tüten sind voll, für die 2 übrigen brauchst du noch eine: 9." } },
        ],
        karten: [
          { typ: "begriff", id: "m-rest", begriff: "der Rest", bedeutung: "Was übrig bleibt, wenn eine Teilung nicht glatt aufgeht. Er ist immer kleiner als der Divisor." },
          { typ: "teilen", id: "m-rest3", titel: "Dreistellig mit Rest", stellen: 3, divisor: [3, 9], rest: true, null: false },
          { typ: "wahr", id: "m-rest-gross", satz: "Der Rest darf auch größer sein als der Divisor.", wahr: false, korrektur: "Der Rest ist immer kleiner als der Divisor. Sonst hätte der Divisor noch einmal hineingepasst." },
          { typ: "sach", id: "m-sach-tueten", titel: "Volle Tüten", text: "Du backst {a} Hundekekse und packst immer {b} in eine Tüte.", frage: "Wie viele Tüten werden voll?", antwort: "q", a: [40, 99], b: [4, 9], rest: true, einheit: "Tüten" },
          { typ: "begriff", id: "m-probe", begriff: "die Probe", bedeutung: "Die Rechnung rückwärts zum Prüfen: Ergebnis mal Divisor, plus Rest. Dann muss der Dividend herauskommen." },
          { typ: "teilen", id: "m-rest4", titel: "Vierstellig mit Rest", stellen: 4, divisor: [3, 9], rest: true },
          { typ: "umkehr", id: "m-umkehr-rest", titel: "Welche Zahl fehlt? (mit Rest)", stellen: [2, 3], divisor: [3, 9], rest: true },
          { typ: "sach", id: "m-sach-autos", titel: "Alle mitnehmen", text: "{a} Kinder fahren zum Schwimmbad. In jedes Auto passen {b} Kinder.", frage: "Wie viele Autos braucht ihr mindestens?", antwort: "auf", a: [21, 59], b: [3, 4], rest: true, einheit: "Autos" },
          { typ: "sach", id: "m-sach-perlen", titel: "Was bleibt übrig?", text: "Du hast {a} Perlen aus Ofenknete geformt und fädelst immer {b} auf ein Armband.", frage: "Wie viele Perlen bleiben übrig?", antwort: "r", a: [50, 200], b: [6, 9], rest: true, einheit: "Perlen" },
          { typ: "detektiv", id: "m-det-rechnen", titel: "Detektiv: Rechenfehler", stellen: [3, 4], divisor: [3, 9], fehler: ["minus", "mal"] },
          { typ: "auftrag", id: "m-armbaender", art: "basteln", titel: "Knete-Armbänder", text: "Forme 30 kleine Perlen aus Ofenknete. Wie viele Armbänder mit je 7 Perlen kannst du auffädeln? Wie viele Perlen bleiben übrig? Rechne erst, dann fädel nach und mach die Probe." },
        ],
      },
      {
        id: "zweistellig",
        name: "Zweistellig teilen",
        icon: "🚀",
        warum: { frage: "Eure Klasse hat 1 344 € für den Ausflug gesammelt. Ihr seid 28 Kinder. Wie viel ist das pro Kind?", text: "Oft teilst du durch Zahlen wie 12, 24 oder 28: Monate, Stunden, Kinder in der Klasse. Das geht mit denselben vier Moves. Nur das Teilen ist kniffliger. Dafür gibt es die Einmaleins-Leiter." },
        fakten: [
          "Schon die Babylonier haben mit der 60 gerechnet. Die 60 lässt sich ohne Rest durch 1, 2, 3, 4, 5, 6, 10, 12, 15, 20, 30 und 60 teilen.",
          "Ein Tag hat 24 Stunden. 24 lässt sich ohne Rest durch 1, 2, 3, 4, 6, 8, 12 und 24 teilen.",
          "1 344 : 28 = 48. Jedes Kind bekommt also 48 € für den Ausflug.",
        ],
        erklaerung: [
          { titel: "Gleiche Moves, größerer Divisor", rechnung: { a: 864, b: 12, bis: 1 }, text: ["864 : 12. Passt die 12 in die 8? Nein. Also nimmst du 86.", "Teilen: Wie oft passt 12 in 86?"] },
          { titel: "Die Einmaleins-Leiter", rechnung: { a: 864, b: 12, bis: 1, leiter: true }, text: ["Schreib dir die Vielfachen von 12 auf: 12, 24, 36, 48, 60, 72, 84, 96, 108.", "Die größte Zahl, die noch in 86 passt, ist 84. Das ist 7 · 12. Also passt die 12 siebenmal hinein."] },
          { titel: "Schätzen mit Runden", text: ["Ohne Leiter hilft Runden. Bei 98 : 23 denkst du: 23 ist ungefähr 20. Und 20 passt etwa 4-mal in 98.", "Dann prüfst du: 4 · 23 = 92. Das passt, und 5 · 23 = 115 wäre zu viel. Also 4."] },
          { titel: "Fertig gerechnet", rechnung: { a: 864, b: 12, bis: "alles" }, text: ["86 − 84 = 2. Die 4 herunter: 24. 12 passt 2-mal in 24, Rest 0.", "864 : 12 = 72. Probe: 72 · 12 = 864."] },
          { titel: "Check", check: { frage: "Wie oft passt 23 in 98?", antwort: "4", falsch: ["3", "5"], erklaerung: "4 · 23 = 92 passt, 5 · 23 = 115 ist zu viel. Also 4-mal, Rest 6." } },
        ],
        karten: [
          { typ: "passt", id: "m-passt", titel: "Wie oft passt das?", divisor: [11, 49] },
          { typ: "teilen", id: "m-z3", titel: "Dreistellig durch zweistellig", stellen: 3, divisor: [11, 29], rest: false, null: false },
          { typ: "wahr", id: "m-zwei-anfang", satz: "Bei einem zweistelligen Divisor fängst du immer mit genau zwei Ziffern an.", wahr: false, korrektur: "Nicht immer. Bei 864 : 12 passen die ersten zwei Ziffern (86). Bei 1 344 : 28 ist 13 zu klein, dann nimmst du 134." },
          { typ: "teilen", id: "m-z4", titel: "Vierstellig durch zweistellig", stellen: 4, divisor: [11, 49], rest: false },
          { typ: "kopf", id: "m-kopf-zehner2", titel: "Nullen streichen", form: "zehner" },
          { typ: "teilen", id: "m-zrest", titel: "Zweistellig mit Rest", stellen: [3, 4], divisor: [11, 39], rest: true },
          { typ: "ueberschlag", id: "m-ueberschlag2", titel: "Überschlag zweistellig", stellen: [4, 5], divisor: [11, 49] },
          { typ: "sach", id: "m-sach-klasse", titel: "Klassenkasse", text: "Eure Klasse hat {a} € für einen Ausflug gesammelt. Ihr seid {b} Kinder.", frage: "Wie viel Euro sind das für jedes Kind?", antwort: "q", a: [400, 1500], b: [24, 30], rest: false, einheit: "€" },
          { typ: "teilen", id: "m-boss-z", titel: "Boss: fünfstellig durch zweistellig", stellen: 5, divisor: [12, 49], boss: true },
          { typ: "auftrag", id: "m-leiter", art: "forschen", titel: "Deine Leiter", text: "Schreib die Einmaleins-Leiter von 24 auf ein Blatt: 24, 48, 72 und so weiter bis 9 · 24. Prüfe jede Zahl mit dem Taschenrechner eines Erwachsenen. Häng das Blatt über deinen Schreibtisch." },
        ],
      },
      {
        id: "alltag",
        name: "Rechnen im Alltag",
        icon: "🐶",
        warum: { frage: "Wie lange reicht eine Packung Leckerli für {hund}?", text: "Teilen steckt in vielen Alltagsfragen: Wie lange reicht das Futter, wie lange musst du sparen, wie viele Busse braucht die Schule? Der Trick ist, aus dem Text die richtige Rechnung zu machen." },
        fakten: [
          "In Deutschland muss im Laden bei vielen Waren auch der Grundpreis stehen, zum Beispiel der Preis pro Kilogramm. Er entsteht durch Teilen und hilft beim Vergleichen.",
          "Rechnest du mit Cent statt mit Euro, bleibt beim Teilen alles ohne Komma: 3 € sind 300 Cent.",
        ],
        erklaerung: [
          { titel: "Vom Text zur Rechnung", text: ["1. Was weißt du? 2. Was ist gefragt? 3. Schreib die Rechnung auf. 4. Rechne. 5. Schreib einen Antwortsatz.", "Beispiel: Eine Packung hat 96 Leckerli. {hund} bekommt jeden Tag 4. Gefragt: Wie viele Tage reicht die Packung? Rechnung: 96 : 4 = 24. Antwort: Die Packung reicht 24 Tage."] },
          { titel: "Passt die Antwort?", text: ["Prüf am Ende, ob die Zahl sinnvoll ist. Eine Packung, die 2 400 Tage reicht, wäre seltsam.", "Und lies die Frage noch einmal: Sind nur die vollen Tüten gefragt, oder musst du alle unterbringen? Dann brauchst du für den Rest noch eins mehr."] },
          { titel: "Check", check: { frage: "Eine Packung hat 96 Leckerli. Jeden Tag gibt es 4. Wie viele Tage reicht die Packung?", antwort: "24 Tage", falsch: ["240 Tage", "100 Tage", "92 Tage"], erklaerung: "96 : 4 = 24. Überschlag: 100 : 4 = 25, das passt." } },
        ],
        karten: [
          { typ: "sach", id: "m-sach-leckerli", titel: "Leckerli-Vorrat", text: "Ein Beutel hat {a} Leckerli. {hund} bekommt jeden Tag {b} Stück.", frage: "Wie viele Tage reicht der Beutel?", antwort: "q", a: [60, 300], b: [3, 8], rest: false, einheit: "Tage" },
          { typ: "sach", id: "m-sach-sparen", titel: "Sparen", text: "Du willst Kopfhörer für {a} € kaufen. Jede Woche legst du {b} € zur Seite.", frage: "Wie viele Wochen musst du mindestens sparen?", antwort: "auf", a: [40, 150], b: [4, 9], rest: true, einheit: "Wochen" },
          { typ: "sach", id: "m-sach-karten", titel: "Sammelkarten", text: "{a} Sammelkarten werden gerecht an {b} Kinder verteilt.", frage: "Wie viele Karten bekommt jedes Kind?", antwort: "q", a: [100, 999], b: [3, 9], rest: false, einheit: "Karten" },
          { typ: "sach", id: "m-sach-playmobil", titel: "Knete-Bäckerei", text: "Du formst {a} Brötchen aus Ofenknete für deinen Playmobil-Laden. In jeden Korb passen {b}.", frage: "Wie viele Körbe brauchst du für alle Brötchen?", antwort: "auf", a: [30, 150], b: [6, 12], rest: true, einheit: "Körbe" },
          { typ: "sach", id: "m-sach-kino", titel: "Kino", text: "{b} Freundinnen kaufen zusammen Kinokarten und Popcorn für {a} €. Sie teilen gerecht.", frage: "Wie viel Euro zahlt jede?", antwort: "q", a: [24, 99], b: [3, 6], rest: false, einheit: "€" },
          { typ: "sach", id: "m-sach-busse", titel: "Busse", text: "Die Schule macht einen Ausflug mit {a} Kindern. In einen Bus passen {b} Kinder.", frage: "Wie viele Busse braucht die Schule?", antwort: "auf", a: [100, 400], b: [42, 56], rest: true, einheit: "Busse" },
          { typ: "detektiv", id: "m-det-alle", titel: "Detektiv: alle Fehler", stellen: [4, 5], divisor: [3, 9] },
          { typ: "teilen", id: "m-boss-mix", titel: "Boss: fünfstellig durch einstellig", stellen: 5, divisor: [3, 9], boss: true },
          { typ: "auftrag", id: "m-preis", art: "forschen", titel: "Preis-Detektiv", text: "Schau beim Einkaufen mit einem Erwachsenen auf eine Großpackung, zum Beispiel 6 Joghurts zusammen. Rechne den Preis in Cent um und teile: Was kostet ein Joghurt? Ist die Großpackung billiger als 6 einzelne?" },
        ],
      },
    ],
  });
})(typeof window !== "undefined" ? window : globalThis);
