// Mathematik Klasse 5, Gymnasium Baden-Württemberg: geometrische Grundbegriffe.
// Strecke, Strahl (Halbgerade), Gerade; zueinander senkrecht (orthogonal) und parallel; Abstand.
// Aufgaben selbst geschrieben. Die Bilder auf Karopapier erzeugt die App jedes Mal neu (logic.js, Abschnitt Geometrie).
// {hund} wird in der App durch den Namen des Hundes ersetzt. Keine Fürwörter für den Hund.
(function (root) {
  "use strict";
  const F = root.LN_FAECHER || (root.LN_FAECHER = []);
  const LN = root.LN;
  const px = LN.geoPx;
  const LILA = "#4b3fb0", GRUEN = "#0f9c7e", ORANGE = "#e5662a", TEXT = "#2b2550";

  // ---------- Zeichenhilfen für die Erklär-Bilder (Karopapier aus logic.js) ----------
  const strecke = (a, b, o) => Object.assign({ von: [a, b] }, o || {});
  const gerade = (p, d, name, farbe) => LN.gerade(p, d, name, farbe);
  // Rechter Winkel: kleines Quadrat mit Punkt am Schnittpunkt S zwischen den Richtungen u und v
  function rechterWinkel(S, u, v, farbe) {
    const lu = Math.hypot(u[0], u[1]), lv = Math.hypot(v[0], v[1]), k = 0.7;
    const a = [S[0] + (u[0] / lu) * k, S[1] + (u[1] / lu) * k], b = [S[0] + (v[0] / lv) * k, S[1] + (v[1] / lv) * k];
    const c = [a[0] + (v[0] / lv) * k, a[1] + (v[1] / lv) * k], m = [S[0] + ((u[0] / lu + v[0] / lv) * k) / 2, S[1] + ((u[1] / lu + v[1] / lv) * k) / 2];
    return `<path d="M${px(a[0])} ${px(a[1])} L${px(c[0])} ${px(c[1])} L${px(b[0])} ${px(b[1])}" fill="none" stroke="${farbe || ORANGE}" stroke-width="2.5"/><circle cx="${px(m[0])}" cy="${px(m[1])}" r="2.6" fill="${farbe || ORANGE}"/>`;
  }
  const schild = (x, y, t, farbe, gr) => `<text x="${px(x)}" y="${px(y)}" text-anchor="middle" font-size="${gr || 15}" font-weight="700" fill="${farbe || TEXT}" font-family="Sora, system-ui, sans-serif">${t}</text>`;
  const kasten = (x, y, b, h, t) => `<rect x="${px(x)}" y="${px(y)}" width="${b * LN.GEO.K}" height="${h * LN.GEO.K}" rx="8" fill="#fff" stroke="#d9d3ee" stroke-width="2"/>` + schild(x + b / 2, y + h / 2 + 0.25, t, TEXT, 15);
  // Pfeil mit Spitzen an beiden Enden für Abstände
  function massPfeil(a, b, text, farbe) {
    const f = farbe || ORANGE, d = [b[0] - a[0], b[1] - a[1]], l = Math.hypot(d[0], d[1]), u = [d[0] / l, d[1] / l], n = [-u[1], u[0]];
    const spitze = (p, s) => `<path d="M${px(p[0])} ${px(p[1])} L${px(p[0] - s * u[0] * 0.4 + n[0] * 0.22)} ${px(p[1] - s * u[1] * 0.4 + n[1] * 0.22)} L${px(p[0] - s * u[0] * 0.4 - n[0] * 0.22)} ${px(p[1] - s * u[1] * 0.4 - n[1] * 0.22)} Z" fill="${f}"/>`;
    return `<line x1="${px(a[0])}" y1="${px(a[1])}" x2="${px(b[0])}" y2="${px(b[1])}" stroke="${f}" stroke-width="2.5"/>` + spitze(b, 1) + spitze(a, -1) + (text ? schild((a[0] + b[0]) / 2 + n[0] * 0.9 + 0.4, (a[1] + b[1]) / 2 + n[1] * 0.9 + 0.2, text, f, 15) : "");
  }
  // Geodreieck: lange Kante auf einer Linie, Mittellinie senkrecht dazu
  function geodreieck(S, u, groesse, drehe) {
    const l = Math.hypot(u[0], u[1]), e = [u[0] / l, u[1] / l], n = drehe ? [e[1], -e[0]] : [-e[1], e[0]], g = groesse || 4;
    const A = [S[0] - e[0] * g, S[1] - e[1] * g], B = [S[0] + e[0] * g, S[1] + e[1] * g], C = [S[0] + n[0] * g, S[1] + n[1] * g];
    let s = `<path d="M${px(A[0])} ${px(A[1])} L${px(B[0])} ${px(B[1])} L${px(C[0])} ${px(C[1])} Z" fill="#9ad8ff" fill-opacity=".35" stroke="#2a6fdb" stroke-width="2"/>`;
    s += `<line x1="${px(S[0])}" y1="${px(S[1])}" x2="${px(C[0])}" y2="${px(C[1])}" stroke="#2a6fdb" stroke-width="2" stroke-dasharray="5 4"/>`;
    for (let i = -g + 0.5; i < g; i += 0.5) { const p = [S[0] + e[0] * i, S[1] + e[1] * i], q = [p[0] + n[0] * (Number.isInteger(i) ? 0.35 : 0.2), p[1] + n[1] * (Number.isInteger(i) ? 0.35 : 0.2)]; s += `<line x1="${px(p[0])}" y1="${px(p[1])}" x2="${px(q[0])}" y2="${px(q[1])}" stroke="#2a6fdb" stroke-width="1.5"/>`; }
    return s + schild(S[0] + n[0] * 0.75, S[1] + n[1] * 0.75 + 0.2, "0", "#2a6fdb", 12);
  }
  // Treppe aus Kästchen: so viele zur Seite, so viele hoch oder runter
  function treppe(S, d, farbe) {
    const Z = [S[0] + d[0], S[1]], E = [S[0] + d[0], S[1] + d[1]];
    return `<path d="M${px(S[0])} ${px(S[1])} L${px(Z[0])} ${px(Z[1])} L${px(E[0])} ${px(E[1])}" fill="none" stroke="${farbe}" stroke-width="3" stroke-dasharray="4 4"/>`;
  }
  const bild = (linien, punkte, extra) => LN.geoSvg(linien.filter(Boolean), punkte || [], extra || "");

  // Strecke, Strahl, Gerade nebeneinander
  const bildStrecke = bild([strecke([4, 6], [12, 3], { farbe: LILA })], [{ x: 4, y: 6, name: "A" }, { x: 12, y: 3, name: "B" }], schild(8, 8.6, "Anfang und Ende: eine Strecke", TEXT, 15));
  const bildStrahl = bild([strecke([3, 7], [16, 7 - 13 * 3 / 8], { farbe: LILA })], [{ x: 3, y: 7, name: "A" }, { x: 11, y: 4, name: "B" }], schild(7.5, 9.2, "Anfang bei A, kein Ende: ein Strahl", TEXT, 15));
  const bildGerade = bild([gerade([4, 6], [8, -3], "g", LILA)], [{ x: 4, y: 6, name: "A" }, { x: 12, y: 3, name: "B" }], schild(8, 9.2, "kein Anfang, kein Ende: eine Gerade", TEXT, 15));
  const bildVergleich = bild([strecke([1, 2.5], [6, 2.5], { farbe: LILA, dick: 4 }), strecke([1, 5.5], [16, 5.5], { farbe: GRUEN, dick: 4 }), strecke([0, 8.5], [16, 8.5], { farbe: ORANGE, dick: 4 })],
    [{ x: 1, y: 2.5, name: "A" }, { x: 6, y: 2.5, name: "B" }, { x: 1, y: 5.5, name: "C" }, { x: 6, y: 5.5, name: "D" }, { x: 3, y: 8.5, name: "E" }, { x: 8, y: 8.5, name: "F" }],
    schild(11, 2.8, "Strecke AB", LILA) + schild(11, 4.8, "Strahl CD", GRUEN) + schild(12, 7.8, "Gerade EF", ORANGE));
  const bildVierPunkte = bild([strecke([3, 2], [11, 2]), strecke([11, 2], [12, 8]), strecke([12, 8], [4, 8]), strecke([4, 8], [3, 2]), strecke([3, 2], [12, 8]), strecke([11, 2], [4, 8])], [{ x: 3, y: 2, name: "A" }, { x: 11, y: 2, name: "B" }, { x: 12, y: 8, name: "C", dy: 18 }, { x: 4, y: 8, name: "D", dy: 18 }], schild(14, 5.2, "6 Strecken", ORANGE, 16));
  // senkrecht
  const bildSenkrecht = bild([gerade([8, 5], [2, 1], "g", LILA), gerade([8, 5], [-1, 2], "h", GRUEN)], [], rechterWinkel([8, 5], [2, 1], [-1, 2]) + schild(12.2, 9.3, "g ⊥ h", ORANGE, 18));
  const bildGeodreieck = bild([gerade([8, 6], [1, 0], "g", LILA), gerade([8, 6], [0, 1], "h", GRUEN)], [], geodreieck([8, 6], [1, 0], 4.5));
  const bildTreppe = bild([gerade([7, 6], [2, -1], "g", LILA), gerade([7, 6], [1, 2], "h", GRUEN)], [], treppe([7, 6], [2, -1], LILA) + treppe([7, 6], [1, 2], GRUEN) + schild(12.6, 5.7, "2 rüber, 1 hoch", LILA, 13) + schild(10.6, 8.3, "1 rüber, 2 runter", GRUEN, 13) + rechterWinkel([7, 6], [2, -1], [1, 2]));
  const bildSchraegSenkrecht = bild([gerade([8, 5], [1, 1], "g", LILA), gerade([8, 5], [1, -1], "h", GRUEN)], [], rechterWinkel([8, 5], [1, 1], [1, -1]) + schild(8, 1.2, "auch schräg: g ⊥ h", ORANGE, 16));
  // parallel
  const bildParallel = bild([gerade([0, 6], [3, -1], "g", LILA), gerade([0, 9], [3, -1], "h", GRUEN)], [], massPfeil([4.5, 4.5], [5.4, 7.2], "") + massPfeil([11.1, 2.3], [12, 5], "") + schild(13, 8.8, "g ∥ h", ORANGE, 18) + schild(8.2, 8.9, "überall gleich weit", ORANGE, 13));
  const bildParallelPruefen = bild([gerade([0, 3], [1, 0], "g", LILA), gerade([0, 7], [1, 0], "h", GRUEN), gerade([6, 0], [0, 1], "k", ORANGE)], [], rechterWinkel([6, 3], [1, 0], [0, 1]) + rechterWinkel([6, 7], [1, 0], [0, 1]) + schild(12, 5.3, "k ⊥ g und k ⊥ h", ORANGE, 15) + schild(12, 9.4, "also g ∥ h", ORANGE, 15));
  const bildSchienen = `<svg viewBox="0 0 640 230" role="img" aria-hidden="true"><rect width="640" height="230" fill="#cfe8ff"/><rect y="90" width="640" height="140" fill="#9ccf7a"/><path d="M250 230 L316 90 M390 230 L324 90" stroke="#6b6b78" stroke-width="7"/>` + [0, 1, 2, 3, 4, 5, 6].map((i) => { const y = 225 - i * i * 3.2 - i * 6; const w = 150 - (225 - y) * 0.95; return `<rect x="${320 - w / 2 - 10}" y="${y - 3}" width="${w + 20}" height="6" fill="#8d6e63"/>`; }).join("") + `<text x="430" y="60" font-size="17" font-weight="700" fill="${TEXT}" font-family="Sora, system-ui, sans-serif">Sieht so aus, als</text><text x="430" y="82" font-size="17" font-weight="700" fill="${TEXT}" font-family="Sora, system-ui, sans-serif">liefen sie zusammen.</text><text x="20" y="60" font-size="17" font-weight="700" fill="${GRUEN}" font-family="Sora, system-ui, sans-serif">In echt: parallel!</text></svg>`;
  // Abstand
  const bildAbstand = bild([gerade([0, 8], [1, 0], "g", LILA), strecke([8, 2], [8, 8], { farbe: GRUEN, dick: 3.5 }), strecke([8, 2], [3, 8], { farbe: "#b9b3d6", gestrichelt: true, dick: 2.5 }), strecke([8, 2], [14, 8], { farbe: "#b9b3d6", gestrichelt: true, dick: 2.5 })], [{ x: 8, y: 2, name: "P" }], rechterWinkel([8, 8], [1, 0], [0, -1], GRUEN) + schild(10.6, 5.2, "kürzester Weg", GRUEN, 14));
  const bildMessen = bild([gerade([0, 8], [1, 0], "g", LILA)], [{ x: 9, y: 4, name: "P" }], geodreieck([9, 8], [0, -1], 4.2, true) + massPfeil([10.3, 8], [10.3, 4], "2 cm"));
  const bildKaestchen = bild([gerade([0, 8], [1, 0], "g", LILA), strecke([6, 3], [6, 8], { farbe: GRUEN, dick: 3.5 })], [{ x: 6, y: 3, name: "P" }], [3.5, 4.5, 5.5, 6.5, 7.5].map((y, i) => schild(6.8, y + 0.2, String(i + 1), ORANGE, 13)).join("") + schild(11.5, 5, "5 Kästchen = 2,5 cm", ORANGE, 16));
  const bildAbstandParallel = bild([gerade([0, 2], [1, 0], "g", LILA), gerade([0, 7], [1, 0], "h", GRUEN)], [], massPfeil([3, 2], [3, 7], "") + massPfeil([9, 2], [9, 7], "") + massPfeil([14, 2], [14, 7], "") + schild(6, 4.8, "überall 2,5 cm", ORANGE, 15));

  F.push({
    id: "geometrie",
    name: "Geometrie",
    kurz: "Geometrie",
    icon: "📐",
    arbeit: { titel: "Mathe-Arbeit: Geometrie", datum: null },
    themen: [
      {
        id: "linien",
        name: "Strecke, Strahl, Gerade",
        icon: "📏",
        warum: { frage: "{hund} rennt quer über die Wiese zum Ball. Ist der Weg eine Strecke, ein Strahl oder eine Gerade?", text: "Der Weg hat einen Anfang und ein Ende, also ist er eine Strecke. In Mathe gibt es drei Arten von geraden Linien, und jede hat einen eigenen Namen. Damit kann man ganz genau sagen, was gemeint ist, zum Beispiel beim Zeichnen von Plänen und Karten." },
        fakten: [
          "Das Wort «Geometrie» kommt aus dem Griechischen und heißt «Erdvermessung».",
          "Durch zwei Punkte geht genau eine Gerade.",
          "Zwischen 4 Punkten kannst du 6 Strecken zeichnen, zwischen 5 Punkten schon 10.",
        ],
        erklaerung: [
          { titel: "Die Strecke", bild: bildStrecke, text: ["Eine Strecke hat einen Anfangspunkt und einen Endpunkt. Sie hört genau bei A und bei B auf.", "Weil sie zwei Enden hat, kannst du sie mit dem Lineal messen. Man sagt «die Strecke AB»."] },
          { titel: "Der Strahl", bild: bildStrahl, text: ["Ein Strahl hat einen Anfangspunkt, aber kein Ende. Er beginnt bei A, läuft durch B und dann immer weiter.", "Stell dir das Licht einer Taschenlampe vor: Es beginnt an der Lampe und hört nicht auf. Ein anderes Wort für Strahl ist Halbgerade."] },
          { titel: "Die Gerade", bild: bildGerade, text: ["Eine Gerade hat weder Anfang noch Ende. Sie läuft in beide Richtungen unendlich weit.", "Im Heft zeichnest du nur ein Stück davon, bis zum Rand. Geraden bekommen oft kleine Buchstaben, zum Beispiel g oder h."] },
          { titel: "Alle drei im Vergleich", bild: bildVergleich, text: ["Schau immer auf die Enden: Zwei Enden heißt Strecke. Ein Anfang und dann bis zum Rand heißt Strahl. Bis zum Rand auf beiden Seiten heißt Gerade.", "Messen kann man nur Strecken. Strahlen und Geraden sind unendlich lang."] },
          { titel: "Wie viele Strecken?", bild: bildVierPunkte, text: ["Bei vier Punkten kannst du jeden Punkt mit jedem verbinden. Das sind 6 Strecken: AB, AC, AD, BC, BD und CD.", "Trick: Jeder Punkt hat 3 Partner, das sind 4 · 3 = 12. Jede Strecke hast du dabei doppelt gezählt, also 12 : 2 = 6."] },
          { titel: "Check", check: { frage: "Welche Linie hat einen Anfang, aber kein Ende?", antwort: "Strahl", falsch: ["Strecke", "Gerade"], erklaerung: "Der Strahl beginnt an einem Punkt und läuft dann unendlich weiter." } },
        ],
        karten: [
          { typ: "begriff", id: "g-strecke", begriff: "die Strecke", bedeutung: "Gerade Linie mit Anfangspunkt und Endpunkt. Man kann sie messen.", merk: "Strecke: zwei Enden, wie ein Stück Schnur zwischen zwei Fingern." },
          { typ: "begriff", id: "g-strahl", begriff: "der Strahl", bedeutung: "Gerade Linie mit einem Anfangspunkt, aber ohne Ende.", auch: ["Halbgerade", "die Halbgerade"], merk: "Wie das Licht einer Taschenlampe." },
          { typ: "begriff", id: "g-gerade", begriff: "die Gerade", bedeutung: "Gerade Linie ohne Anfang und ohne Ende. Sie ist unendlich lang." },
          { typ: "linie", id: "g-linie", titel: "Strecke, Strahl oder Gerade?", zaehlen: true },
          { typ: "wahr", id: "g-gerade-messen", satz: "Eine Gerade kann man mit dem Lineal messen.", wahr: false, korrektur: "Eine Gerade ist unendlich lang, deshalb kann man sie nicht messen. Messen kann man nur Strecken." },
          { typ: "frage", id: "g-vier-punkte", frage: "Wie viele Strecken kannst du zwischen 4 Punkten zeichnen, wenn du jeden mit jedem verbindest?", antwort: "6", falsch: ["4", "8", "12"], erklaerung: "AB, AC, AD, BC, BD, CD: das sind 6. Rechnung: 4 · 3 : 2 = 6." },
          { typ: "wahr", id: "g-zwei-punkte", satz: "Durch zwei Punkte geht genau eine Gerade.", wahr: true, erklaerung: "Stimmt. Leg ein Lineal an zwei Punkte: Es gibt nur eine Möglichkeit." },
          { typ: "frage", id: "g-fuenf-punkte", frage: "Wie viele Strecken gibt es zwischen 5 Punkten, wenn du jeden mit jedem verbindest?", antwort: "10", falsch: ["5", "15", "20"], erklaerung: "Jeder Punkt hat 4 Partner: 5 · 4 = 20. Jede Strecke ist doppelt gezählt, also 20 : 2 = 10." },
          { typ: "auftrag", id: "g-knete-linien", art: "basteln", titel: "Knete-Linien", text: "Roll aus Ofenknete eine kurze Wurst und drück an beide Enden eine kleine Kugel: Das ist eine Strecke. Dann eine Wurst mit nur einer Kugel, die über den Tischrand hinausläuft: ein Strahl. Und eine, die an beiden Seiten über den Rand reicht: eine Gerade." },
          { typ: "auftrag", id: "g-linien-jagd", art: "forschen", titel: "Linien-Jagd", text: "Such in deinem Zimmer fünf Strecken, zum Beispiel Tischkanten oder Regalbretter. Miss zwei davon mit dem Lineal. Fällt dir etwas ein, das man sich als Strahl vorstellen kann?" },
        ],
      },
      {
        id: "senkrecht",
        name: "Zueinander senkrecht",
        icon: "📐",
        warum: { frage: "Warum hängt ein Bild gerade und warum wackelt ein Regal nicht?", text: "Weil die Linien im rechten Winkel aufeinander stehen. Das nennt man in Mathe senkrecht oder orthogonal. Du findest es überall: Fensterkreuz, Tischbein und Tischplatte, die Linien in deinem Karoheft." },
        fakten: [
          "Ein rechter Winkel hat 90 Grad.",
          "«Orthogonal» kommt aus dem Griechischen: «orthos» heißt «gerade, richtig», «gonia» heißt «Winkel».",
          "Die Linien in deinem Karoheft stehen alle senkrecht aufeinander.",
        ],
        erklaerung: [
          { titel: "Rechter Winkel", bild: bildSenkrecht, text: ["Zwei Geraden sind zueinander senkrecht, wenn sie einen rechten Winkel bilden. Ein anderes Wort dafür ist orthogonal.", "Man schreibt g ⊥ h. Den rechten Winkel zeichnet man als kleines Viereck mit Punkt."] },
          { titel: "Achtung: auch schräg!", bild: bildSchraegSenkrecht, text: ["Im Alltag heißt «senkrecht» oft «von oben nach unten». In Mathe ist das anders: Es geht nur um den rechten Winkel zwischen den beiden Linien.", "Deshalb können zwei Geraden auch schräg im Heft liegen und trotzdem zueinander senkrecht sein."] },
          { titel: "Prüfen mit dem Geodreieck", bild: bildGeodreieck, text: ["Leg die lange Kante des Geodreiecks genau auf g, die 0 auf den Schnittpunkt.", "Läuft h genau über die Mittellinie (die Linie von der 0 nach oben), dann gilt g ⊥ h."] },
          { titel: "Prüfen mit Kästchen", bild: bildTreppe, text: ["Auf Karopapier geht es auch ohne Geodreieck: g geht 2 Kästchen nach rechts und 1 nach oben.", "Die Senkrechte vertauscht die Zahlen und dreht eine Richtung um: 1 nach rechts und 2 nach unten."] },
          { titel: "Check", check: { frage: "Welches Zeichen bedeutet «senkrecht zueinander»?", antwort: "⊥", falsch: ["∥", "="], erklaerung: "g ⊥ h heißt: g und h stehen senkrecht aufeinander. Das Zeichen sieht selbst aus wie ein rechter Winkel." } },
        ],
        karten: [
          { typ: "begriff", id: "g-senkrecht", begriff: "senkrecht", bedeutung: "Zwei Linien bilden einen rechten Winkel. Man schreibt g ⊥ h.", auch: ["orthogonal", "zueinander senkrecht"] },
          { typ: "lage", id: "g-lage-senkrecht", titel: "Senkrecht oder nicht?", lagen: ["senkrecht", "schraeg"], richtungen: "diagonal" },
          { typ: "frage", id: "g-90", frage: "Wie viele Grad hat ein rechter Winkel?", antwort: "90°", falsch: ["45°", "100°", "180°"], erklaerung: "Ein rechter Winkel hat 90 Grad, wie die Ecke eines Blatts Papier." },
          { typ: "welche", id: "g-welche-senkrecht", titel: "Finde die Senkrechte", frage: "senkrecht" },
          { typ: "wahr", id: "g-senkrecht-alltag", satz: "Senkrecht heißt in Mathe immer: von oben nach unten.", wahr: false, korrektur: "In Mathe heißt senkrecht: Die beiden Linien bilden einen rechten Winkel. Sie dürfen dabei auch schräg im Heft liegen." },
          { typ: "lage", id: "g-lage-senkrecht-schraeg", titel: "Senkrecht mit Kästchen-Treppe", lagen: ["senkrecht", "schraeg"], richtungen: "schraeg" },
          { typ: "wahr", id: "g-umgekehrt", satz: "Wenn g ⊥ h gilt, dann gilt auch h ⊥ g.", wahr: true, erklaerung: "Stimmt. Der rechte Winkel ist derselbe, egal mit welcher Geraden du anfängst." },
          { typ: "auftrag", id: "g-faltwinkel", art: "basteln", titel: "Faltwinkel", text: "Falte ein Blatt Papier einmal irgendwie. Dann falte es noch einmal so, dass die erste Faltkante genau auf sich selbst liegt. Die Ecke ist ein rechter Winkel! Prüf damit fünf Ecken in deinem Zimmer." },
          { typ: "auftrag", id: "g-winkel-jagd", art: "forschen", titel: "Rechte-Winkel-Jagd", text: "Wie viele rechte Winkel findest du in fünf Minuten? Fensterkreuz, Buchecken, Fliesen. Prüf jeden mit dem Geodreieck oder deinem Faltwinkel." },
          { typ: "auftrag", id: "g-roboter", art: "bewegen", titel: "Roboter-Spiel", text: "Jemand aus deiner Familie ist ein Roboter und darf nur geradeaus gehen und sich um einen rechten Winkel drehen. Lotse ihn mit «Geradeaus», «Rechts drehen» und «Links drehen» durch die Wohnung bis zum Körbchen von {hund3}." },
        ],
      },
      {
        id: "parallel",
        name: "Zueinander parallel",
        icon: "🛤️",
        warum: { frage: "Warum fällt ein Zug nicht von den Schienen?", text: "Die beiden Schienen haben überall den gleichen Abstand. Sie sind parallel. Würden sie zusammenlaufen, käme der Zug nicht weiter. Parallele Linien findest du auch bei Notenlinien, Zebrastreifen und den Zeilen im Heft." },
        fakten: [
          "Die Schienen der meisten Bahnstrecken in Deutschland sind 1435 Millimeter voneinander entfernt. Das nennt man Normalspur.",
          "Auf Fotos scheinen Schienen in der Ferne zusammenzulaufen. In Wirklichkeit bleiben sie parallel.",
          "Das Zeichen ∥ für parallel besteht selbst aus zwei parallelen Strichen.",
        ],
        erklaerung: [
          { titel: "Parallel", bild: bildParallel, text: ["Zwei Geraden sind parallel, wenn sie überall den gleichen Abstand haben. Sie schneiden sich nie, auch nicht weit außerhalb des Hefts.", "Man schreibt g ∥ h."] },
          { titel: "Prüfen mit einer Senkrechten", bild: bildParallelPruefen, text: ["Zeichne eine Gerade k, die senkrecht auf g steht. Steht k auch senkrecht auf h, dann sind g und h parallel.", "Mit dem Geodreieck: Leg die Mittellinie auf g und schau, ob h genau auf einer der Linien liegt, die parallel zur langen Kante laufen."] },
          { titel: "Prüfen mit Kästchen", bild: bild([LN.gerade([0, 7], [2, -1], "g", LILA), LN.gerade([4, 9], [2, -1], "h", GRUEN)], [], treppe([2, 6], [2, -1], LILA) + treppe([8, 6], [2, -1], GRUEN) + schild(3.4, 3.9, "2 rüber, 1 hoch", LILA, 13) + schild(10.4, 7.6, "2 rüber, 1 hoch", GRUEN, 13)), text: ["Parallele Geraden machen genau dieselbe Kästchen-Treppe.", "Geht g 2 nach rechts und 1 hoch, dann muss auch h 2 nach rechts und 1 hoch gehen."] },
          { titel: "Eine Täuschung", bild: bildSchienen, text: ["Schienen sehen in der Ferne so aus, als würden sie sich treffen. Das liegt nur am Blick in die Ferne.", "Deshalb prüft man in Mathe nicht mit Augenmaß, sondern mit dem Geodreieck oder mit Kästchen."] },
          { titel: "Check", check: { frage: "Es gilt g ∥ h und h ∥ k. Wie liegen g und k zueinander?", antwort: "parallel", falsch: ["senkrecht", "Das kann man nicht sagen."], erklaerung: "g hat dieselbe Richtung wie h, und h dieselbe wie k. Also haben g und k dieselbe Richtung: g ∥ k." } },
        ],
        karten: [
          { typ: "begriff", id: "g-parallel", begriff: "parallel", bedeutung: "Zwei Geraden haben überall den gleichen Abstand und schneiden sich nie. Man schreibt g ∥ h.", auch: ["zueinander parallel"] },
          { typ: "lage", id: "g-lage-alle", titel: "Senkrecht, parallel oder weder noch?", richtungen: "diagonal" },
          { typ: "frage", id: "g-zeichen-parallel", frage: "Welches Zeichen bedeutet «parallel»?", antwort: "∥", falsch: ["⊥", "≈", "="], erklaerung: "g ∥ h heißt: g und h sind parallel." },
          { typ: "welche", id: "g-welche-parallel", titel: "Finde die Parallele", frage: "parallel" },
          { typ: "wahr", id: "g-nicht-schneiden", satz: "Zwei Geraden, die sich im Heft nicht schneiden, sind immer parallel.", wahr: false, korrektur: "Vielleicht schneiden sie sich erst außerhalb des Hefts. Parallel sind sie nur, wenn der Abstand überall gleich ist." },
          { typ: "lage", id: "g-lage-schwer", titel: "Lage mit Kästchen-Treppen", richtungen: "schraeg" },
          { typ: "wahr", id: "g-zwei-senkrechte", satz: "Stehen g und h beide senkrecht auf k, dann sind g und h parallel.", wahr: true, erklaerung: "Stimmt. Beide bilden mit k einen rechten Winkel, also laufen sie in dieselbe Richtung." },
          { typ: "welche", id: "g-welche-mix", titel: "Senkrecht oder parallel gesucht", frage: "gemischt" },
          { typ: "auftrag", id: "g-knete-schienen", art: "basteln", titel: "Knete-Schienen", text: "Roll aus Ofenknete zwei lange, dünne Würste und leg sie parallel nebeneinander. Leg kleine Schwellen quer darüber, alle gleich lang. Prüf mit dem Lineal an drei Stellen, ob der Abstand gleich bleibt. Passt ein Playmobil-Wagen darauf?" },
          { typ: "auftrag", id: "g-parallel-fotos", art: "forschen", titel: "Parallel-Fotojagd", text: "Fotografiere mit einem Erwachsenen fünf Dinge mit parallelen Linien: Zebrastreifen, Treppenstufen, Notenlinien. Schau dir die Fotos an: Wo sehen die Linien so aus, als würden sie zusammenlaufen?" },
          { typ: "auftrag", id: "g-parallel-gassi", art: "bewegen", titel: "Parallel-Gassi", text: "Geh mit {hund3} und einem Erwachsenen spazieren. Lauft eine Weile genau parallel zur Bordsteinkante, mit immer gleichem Abstand. Wie lange schafft {hund} das?" },
        ],
      },
      {
        id: "abstand",
        name: "Abstand",
        icon: "📍",
        warum: { frage: "{hund} will vom Spielplatz so schnell wie möglich zum Bach, der schnurgerade vorbeifließt. Welcher Weg ist der kürzeste?", text: "Der kürzeste Weg von einem Punkt zu einer Geraden steht immer senkrecht auf ihr. Seine Länge heißt Abstand. Das brauchen alle, die Pläne zeichnen, und alle, die schnell ans Ziel wollen." },
        fakten: [
          "Ein Kästchen im Schulheft ist 5 Millimeter breit. Zwei Kästchen sind also 1 Zentimeter.",
          "Der Abstand zwischen zwei parallelen Geraden ist überall gleich groß.",
          "Liegt ein Punkt auf der Geraden, ist sein Abstand zu ihr 0.",
        ],
        erklaerung: [
          { titel: "Der kürzeste Weg", bild: bildAbstand, text: ["Von P zu g gibt es viele Wege. Der kürzeste steht senkrecht auf g.", "Die Länge dieses kürzesten Wegs ist der Abstand von P zu g."] },
          { titel: "Abstand messen", bild: bildMessen, text: ["Leg die Mittellinie des Geodreiecks auf g. Schieb es, bis die lange Kante durch P geht.", "Jetzt kannst du den Abstand direkt an der Skala ablesen: Die 0 liegt auf g."] },
          { titel: "Kästchen zählen", bild: bildKaestchen, text: ["Auf Karopapier kannst du auch zählen, wenn g waagerecht oder senkrecht liegt.", "Ein Kästchen ist 0,5 cm. 5 Kästchen sind 5 · 0,5 cm = 2,5 cm."] },
          { titel: "Abstand von Parallelen", bild: bildAbstandParallel, text: ["Bei zwei parallelen Geraden ist der Abstand überall gleich.", "Du misst ihn genauso: senkrecht von der einen Geraden zur anderen."] },
          { titel: "Check", check: { frage: "Welcher Weg von P zur Geraden g ist der Abstand?", antwort: "der Weg, der senkrecht auf g steht", falsch: ["der längste Weg", "der Weg, der schräg auf g trifft"], erklaerung: "Der Abstand ist der kürzeste Weg, und der steht immer senkrecht auf der Geraden." } },
        ],
        karten: [
          { typ: "begriff", id: "g-abstand", begriff: "der Abstand", bedeutung: "Die Länge des kürzesten Wegs von einem Punkt zu einer Geraden. Dieser Weg steht senkrecht auf der Geraden." },
          { typ: "abstand", id: "g-abstand-punkt", titel: "Abstand Punkt und Gerade" },
          { typ: "frage", id: "g-kaestchen-cm", frage: "Wie viele Zentimeter sind 6 Kästchen im Heft?", antwort: "3 cm", falsch: ["6 cm", "12 cm", "1,5 cm"], erklaerung: "Ein Kästchen ist 0,5 cm. 6 · 0,5 cm = 3 cm." },
          { typ: "wahr", id: "g-kuerzester", satz: "Der Abstand ist immer der kürzeste Weg.", wahr: true, erklaerung: "Stimmt. Deshalb steht er senkrecht auf der Geraden." },
          { typ: "abstand", id: "g-abstand-parallel", titel: "Abstand von Parallelen", art: "parallel" },
          { typ: "wahr", id: "g-abstand-schraeg", satz: "Für den Abstand misst du einen schrägen Weg vom Punkt zur Geraden.", wahr: false, korrektur: "Der Abstand wird senkrecht gemessen. Jeder schräge Weg ist länger." },
          { typ: "lage", id: "g-lage-wdh", titel: "Wiederholung: Lage von Geraden", richtungen: "schraeg" },
          { typ: "linie", id: "g-linie-wdh", titel: "Wiederholung: Strecke, Strahl, Gerade" },
          { typ: "auftrag", id: "g-kuerzester-weg", art: "bewegen", titel: "Der kürzeste Weg", text: "Stell dich im Garten oder auf dem Spielplatz einige Schritte von einem geraden Zaun oder einer Mauer entfernt hin. Geh einmal schräg und einmal senkrecht zum Zaun und zähl jedes Mal deine Schritte. Welcher Weg war kürzer?" },
          { typ: "auftrag", id: "g-schatzkarte", art: "basteln", titel: "Schatzkarte", text: "Zeichne auf Karopapier eine Schatzkarte mit einem geraden Fluss g. Versteck den Schatz P genau 3 cm vom Fluss entfernt. Lass jemanden aus deiner Familie den Schatz mit dem Geodreieck finden." },
        ],
      },
    ],
  });
})(typeof window !== "undefined" ? window : globalThis);
