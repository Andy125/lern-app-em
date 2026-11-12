// Biologie Klasse 5, Gymnasium Baden-Württemberg: Knochen, Hund und Katze.
// Angelehnt an den Bildungsplan (Skelett im Vergleich zum Menschen, Schädel und Gebiss, Sohlen-, Zehen-
// und Zehenspitzengänger, Hund und Katze als Jäger). Aufgaben selbst geschrieben, nicht aus Büchern abgetippt.
// {hund} wird in der App durch den Namen des Hundes zu Hause ersetzt (Eltern-Übersicht), sonst «dein Hund».
// {hund3} ist dasselbe nach «von», «bei», «mit» (sonst «deinem Hund»). Keine Fürwörter (er/sie) für den Hund verwenden.
(function (root) {
  "use strict";
  const F = root.LN_FAECHER || (root.LN_FAECHER = []);

  // ---------- Zeichenhilfen für die Bilder ----------
  const K = "#f3ead8", R = "#8a7a62", ORANGE = "#f6b26b";
  const knochen = (x1, y1, x2, y2, b, extra) =>
    `<g${extra ? " " + extra : ""}><line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${R}" stroke-width="${b + 4}" stroke-linecap="round"/>` +
    `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${K}" stroke-width="${b}" stroke-linecap="round"/>` +
    `<circle cx="${x1}" cy="${y1}" r="${(b * 0.7).toFixed(1)}" fill="${K}" stroke="${R}" stroke-width="2"/><circle cx="${x2}" cy="${y2}" r="${(b * 0.7).toFixed(1)}" fill="${K}" stroke="${R}" stroke-width="2"/></g>`;
  const bez = (a, c, e, t) => [(1 - t) * (1 - t) * a[0] + 2 * (1 - t) * t * c[0] + t * t * e[0], (1 - t) * (1 - t) * a[1] + 2 * (1 - t) * t * c[1] + t * t * e[1]];
  const wirbel = (a, c, e, n, r) => { let s = ""; for (let i = 0; i <= n; i++) { const [x, y] = bez(a, c, e, i / n); s += `<ellipse cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" rx="${r}" ry="${(r * 0.8).toFixed(1)}" fill="${K}" stroke="${R}" stroke-width="2"/>`; } return s; };

  // Skelett eines Hundes, Blick von der Seite
  function hundeskelett() {
    let s = `<line x1="10" y1="293" x2="470" y2="293" stroke="#d8cbb4" stroke-width="2" stroke-dasharray="6 6"/>`;
    // Beine auf der anderen Seite (blass, dahinter)
    s += `<g opacity=".38">` + knochen(196, 168, 214, 206, 8) + knochen(212, 208, 206, 256, 7) + knochen(206, 262, 210, 282, 5) + knochen(210, 284, 196, 291, 4)
      + knochen(392, 134, 376, 192, 8) + knochen(378, 196, 408, 236, 7) + knochen(406, 240, 402, 278, 5) + knochen(402, 280, 388, 291, 4) + `</g>`;
    // Rippen und Brustbein
    for (let x = 188; x <= 304; x += 14.5) {
      const ys = bez([176, 104], [250, 86], [318, 98], (x - 176) / 142)[1] + 4;
      const yb = 192 - Math.max(0, x - 250) * 0.55;
      s += `<path d="M${x} ${ys.toFixed(1)} Q${x - 16} ${((ys + yb) / 2).toFixed(1)} ${x + 8} ${yb.toFixed(1)}" stroke="${R}" stroke-width="7" fill="none" stroke-linecap="round"/><path d="M${x} ${ys.toFixed(1)} Q${x - 16} ${((ys + yb) / 2).toFixed(1)} ${x + 8} ${yb.toFixed(1)}" stroke="${K}" stroke-width="3.5" fill="none" stroke-linecap="round"/>`;
    }
    s += knochen(196, 195, 262, 192, 6);
    // Wirbelsäule: Hals, Rücken, Lende, Kreuzbein, Schwanz
    s += wirbel([126, 84], [150, 90], [176, 104], 4, 6.5) + wirbel([176, 104], [250, 86], [318, 98], 10, 7) + wirbel([318, 98], [344, 102], [366, 110], 3, 7.5);
    s += wirbel([366, 110], [382, 112], [398, 116], 2, 7) + wirbel([398, 116], [450, 118], [462, 184], 11, 4.5);
    // Schädel und Unterkiefer
    s += `<path d="M132 70 Q124 46 96 48 Q68 50 58 68 L28 84 Q22 92 30 97 L60 102 Q92 112 122 104 Q138 94 132 70 Z" fill="${K}" stroke="${R}" stroke-width="2.5"/>`;
    s += `<ellipse cx="92" cy="74" rx="11" ry="9" fill="#fffdf8" stroke="${R}" stroke-width="2"/>`;
    s += `<path d="M32 102 Q72 116 116 110 L120 118 Q72 130 36 110 Z" fill="${K}" stroke="${R}" stroke-width="2.5"/>`;
    s += `<path d="M44 99 L48 111 L52 100 Z" fill="#fff" stroke="${R}" stroke-width="1.5"/>`;
    // Schulterblatt, Vorderbein
    s += `<path d="M182 100 L216 106 L186 170 Q172 150 182 100 Z" fill="${K}" stroke="${R}" stroke-width="2.5"/>`;
    s += knochen(182, 168, 198, 206, 9) + knochen(198, 208, 190, 256, 7) + `<circle cx="190" cy="262" r="5" fill="${K}" stroke="${R}" stroke-width="2"/>` + knochen(190, 266, 194, 282, 5) + knochen(194, 284, 178, 291, 4);
    // Becken, Hinterbein
    s += `<path d="M350 98 L406 110 Q412 124 400 130 L374 140 Q356 132 350 98 Z" fill="${K}" stroke="${R}" stroke-width="2.5"/>`;
    s += knochen(378, 132, 360, 192, 9) + `<circle cx="353" cy="190" r="5" fill="${K}" stroke="${R}" stroke-width="2"/>` + knochen(362, 194, 394, 236, 8) + knochen(392, 238, 406, 228, 6);
    s += knochen(392, 240, 386, 278, 6) + knochen(386, 280, 370, 291, 4);
    return s;
  }

  // Drei Hinterbeine: Mensch, Hund, Rind. Die Ferse ist orange.
  function dreiBeine() {
    let s = `<line x1="10" y1="271" x2="470" y2="271" stroke="#d8cbb4" stroke-width="2" stroke-dasharray="6 6"/>`;
    // Mensch: Sohlengänger
    s += knochen(96, 30, 92, 140, 10) + `<circle cx="85" cy="140" r="5" fill="${K}" stroke="${R}" stroke-width="2"/>` + knochen(92, 146, 96, 236, 9);
    s += knochen(92, 254, 46, 262, 7) + knochen(44, 264, 24, 267, 5) + `<ellipse cx="104" cy="258" rx="13" ry="10" fill="${ORANGE}" stroke="${R}" stroke-width="2"/>`;
    // Hund: Zehengänger
    s += knochen(250, 30, 222, 110, 10) + `<circle cx="215" cy="108" r="5" fill="${K}" stroke="${R}" stroke-width="2"/>` + knochen(224, 114, 268, 184, 9);
    s += knochen(266, 192, 258, 250, 7) + knochen(258, 254, 240, 265, 5) + `<ellipse cx="277" cy="183" rx="11" ry="9" fill="${ORANGE}" stroke="${R}" stroke-width="2"/>`;
    s += `<ellipse cx="243" cy="268" rx="12" ry="4" fill="#a1887f"/>`;
    // Rind: Zehenspitzengänger
    s += knochen(410, 30, 392, 96, 11) + `<circle cx="385" cy="96" r="5.5" fill="${K}" stroke="${R}" stroke-width="2"/>` + knochen(394, 102, 430, 148, 10);
    s += knochen(428, 156, 424, 234, 8) + knochen(424, 238, 421, 252, 6) + `<ellipse cx="439" cy="146" rx="11" ry="9" fill="${ORANGE}" stroke="${R}" stroke-width="2"/>`;
    s += `<path d="M408 252 L434 252 L438 270 L404 270 Z" fill="#5d4037"/>`;
    s += [["Mensch", 70], ["Hund", 250], ["Rind", 420]].map(([t, x]) => `<text x="${x}" y="292" text-anchor="middle" font-size="17" fill="#6d5d4b" font-family="system-ui, sans-serif">${t}</text>`).join("");
    return s;
  }

  // Schädel eines Hundes mit Gebiss, Blick von der Seite
  function hundegebiss() {
    const Z = "#fffefa";
    const zahn = (d) => `<path d="${d}" fill="${Z}" stroke="${R}" stroke-width="1.6" stroke-linejoin="round"/>`;
    let s = `<path d="M368 74 Q344 30 268 36 Q196 42 140 66 L62 92 Q40 100 46 114 L58 122 L300 126 Q356 124 378 104 Q386 88 368 74 Z" fill="${K}" stroke="${R}" stroke-width="2.5"/>`;
    s += `<ellipse cx="268" cy="76" rx="22" ry="16" fill="#fffdf8" stroke="${R}" stroke-width="2"/><ellipse cx="60" cy="104" rx="7" ry="5" fill="#d9ccb4"/>`;
    s += `<path d="M228 100 Q268 112 320 100" stroke="${R}" stroke-width="2" fill="none"/>`;
    s += `<path d="M50 148 L300 150 Q338 148 352 118 L364 122 Q356 170 304 176 L70 172 Q48 166 50 148 Z" fill="${K}" stroke="${R}" stroke-width="2.5"/>`;
    // untere Zähne
    s += [56, 64, 72].map((x) => `<rect x="${x}" y="137" width="7" height="13" rx="2" fill="${Z}" stroke="${R}" stroke-width="1.5"/>`).join("");
    s += zahn("M106 150 L122 150 L115 118 Z") + zahn("M140 150 L158 150 L149 136 Z") + zahn("M170 150 L190 150 L180 134 Z") + zahn("M200 150 L220 150 L210 134 Z");
    s += zahn("M230 150 L282 150 L276 132 L262 140 L250 128 L238 142 Z") + zahn("M290 150 L322 150 L320 138 L292 138 Z");
    // obere Zähne
    s += [52, 60, 68].map((x) => `<rect x="${x}" y="120" width="7" height="15" rx="2" fill="${Z}" stroke="${R}" stroke-width="1.5"/>`).join("");
    s += zahn("M86 122 L106 122 L97 170 Z") + zahn("M124 124 L142 124 L133 140 Z") + zahn("M154 124 L174 124 L164 141 Z") + zahn("M186 124 L206 124 L196 142 Z");
    s += zahn("M218 124 L272 124 L262 148 L250 137 L236 158 L224 140 Z") + zahn("M282 124 L314 124 L312 139 L284 139 Z") + zahn("M318 124 L338 122 L336 135 L320 137 Z");
    return s;
  }

  F.push({
    id: "bio",
    name: "Biologie",
    kurz: "Bio",
    icon: "🦴",
    arbeit: { titel: "Bio-Arbeit: Knochen, Hund und Katze", datum: null },
    themen: [
      // ======================================================================
      {
        id: "skelett",
        name: "Das Skelett",
        icon: "🦴",
        warum: {
          frage: "Warum fällt {hund} nicht wie ein Wackelpudding in sich zusammen?",
          text: "Weil im Körper ein Gerüst aus Knochen steckt: das Skelett. Es hält den Körper in Form, schützt Herz, Lunge und Gehirn und macht zusammen mit den Muskeln jede Bewegung möglich. Wer das Skelett kennt, versteht, wie ein Tier rennt, springt und kuschelt.",
        },
        fakten: [
          "Fast alle Säugetiere haben 7 Halswirbel. Die Giraffe auch! Ihre Wirbel sind nur viel länger.",
          "Mensch, Hund und Katze haben im Grunde die gleichen Knochen. Sie sind nur verschieden lang und geformt.",
          "Hunde haben 13 Rippenpaare, wir Menschen 12.",
          "Im Inneren vieler Knochen liegt das Knochenmark. Dort entstehen jeden Tag neue Blutzellen.",
        ],
        karten: [
          {
            typ: "bild", id: "sk-bild", titel: "Das Skelett eines Hundes", viewBox: "0 0 480 300", svg: hundeskelett(),
            marken: [
              { nr: 1, x: 100, y: 58, begriff: "der Schädel" },
              { nr: 2, x: 74, y: 118, begriff: "der Unterkiefer" },
              { nr: 3, x: 248, y: 94, begriff: "die Wirbelsäule" },
              { nr: 4, x: 262, y: 152, begriff: "die Rippen" },
              { nr: 5, x: 192, y: 128, begriff: "das Schulterblatt" },
              { nr: 6, x: 190, y: 187, begriff: "der Oberarmknochen" },
              { nr: 7, x: 382, y: 116, begriff: "das Becken" },
              { nr: 8, x: 369, y: 162, begriff: "der Oberschenkelknochen" },
              { nr: 9, x: 404, y: 226, begriff: "die Ferse" },
              { nr: 10, x: 446, y: 141, begriff: "die Schwanzwirbel" },
            ],
            merk: "Von vorn nach hinten: Schädel, Wirbelsäule mit Rippen, Becken, Schwanz. Vorne hängt das Bein am Schulterblatt, hinten am Becken.",
            warum: "Wenn die Tierärztin ein Röntgenbild von {hund3} anschaut, sieht sie genau diese Knochen.",
          },
          {
            typ: "paare", id: "sk-schutz", titel: "Was macht dieser Knochen? Ordne zu.",
            paare: [
              ["Schädel", "schützt das Gehirn"],
              ["Rippen", "schützen Herz und Lunge"],
              ["Wirbelsäule", "schützt das Rückenmark"],
              ["Becken", "verbindet die Hinterbeine mit der Wirbelsäule"],
              ["Schulterblatt", "verbindet das Vorderbein mit dem Rumpf"],
            ],
            tipp: "Was liegt in der Nähe? Unter dem Schädel liegt das Gehirn, hinter den Rippen schlägt das Herz.",
          },
          {
            typ: "frage", id: "sk-aufgaben", frage: "Welche drei Aufgaben hat das Skelett?",
            antwort: "stützen, schützen, Bewegung ermöglichen",
            falsch: ["wärmen, verdauen, atmen", "sehen, hören, riechen", "schützen, verdauen, schwimmen"],
            merk: "Die drei S und ein B: Stützen, Schützen und Bewegen.",
            warum: "Ohne Stütze kein Stehen, ohne Schutz kein sicheres Gehirn, ohne Knochen kein Rennen und Springen.",
          },
          { typ: "begriff", id: "sk-skelett", begriff: "das Skelett", bedeutung: "Das Gerüst aus allen Knochen eines Körpers." },
          { typ: "begriff", id: "sk-wirbeltier", begriff: "das Wirbeltier", bedeutung: "Ein Tier mit einer Wirbelsäule aus vielen einzelnen Wirbeln, zum Beispiel Hund, Katze, Mensch, Vogel und Fisch." },
          { typ: "begriff", id: "sk-wirbelsaeule", begriff: "die Wirbelsäule", bedeutung: "Die Achse des Körpers aus vielen kleinen, beweglichen Wirbeln. Beim Hund reicht sie vom Kopf bis zur Schwanzspitze." },
          {
            typ: "begriff", id: "sk-gelenk", begriff: "das Gelenk", bedeutung: "Eine bewegliche Verbindung zwischen zwei Knochen, zum Beispiel das Knie.",
            warum: "Bei Welpen wachsen Knochen und Gelenke noch. Darum sollen große Welpen wie Labradore wenig Treppen steigen und nicht von hohen Stellen springen.",
          },
          { typ: "wahr", id: "sk-gleich", satz: "Mensch und Hund haben im Grunde die gleichen Knochen.", wahr: true, erklaerung: "Stimmt. Oberarm, Elle, Speiche, Oberschenkel: Alles gibt es bei beiden. Nur Länge und Form sind anders." },
          { typ: "wahr", id: "sk-giraffe", satz: "Eine Giraffe hat viel mehr Halswirbel als ein Hund.", wahr: false, korrektur: "Beide haben 7 Halswirbel. Bei der Giraffe ist jeder Wirbel nur viel länger." },
          { typ: "zahl", id: "sk-halswirbel", frage: "Wie viele Halswirbel haben Hund, Katze und Mensch?", antwort: 7, tipp: "Es ist bei fast allen Säugetieren gleich, sogar bei der Giraffe." },
          { typ: "luecke", id: "sk-luecke", text: "Der {Schädel} schützt das Gehirn. Die {Rippen} bilden zusammen mit dem Brustbein den Brustkorb. Die {Wirbelsäule} ist die Achse des Körpers.", extra: ["Becken", "Ferse"] },
          {
            typ: "auftrag", id: "sk-knete", art: "basteln", titel: "Skelett aus Ofenknete",
            text: "Forme aus Knete ein kleines Hundeskelett: einen Schädel, eine Wirbelsäule aus vielen kleinen Kugeln, ein paar Rippen und vier Beine. Härte es mit einem Erwachsenen im Ofen. Dann beschrifte es mit kleinen Papierfähnchen: Schädel, Wirbelsäule, Rippen, Becken.",
          },
          {
            typ: "auftrag", id: "sk-rippen", art: "forschen", titel: "Rippen fühlen",
            text: "Leg deine Hand auf deine eigenen Rippen und atme tief ein. Was passiert? Fühl dann ganz sanft an der Seite von {hund3}. Wie viele Rippen kannst du spüren?",
          },
        ],
      },
      // ======================================================================
      {
        id: "laufen",
        name: "Auf Zehen unterwegs",
        icon: "🐾",
        warum: {
          frage: "Warum ist {hund} beim Rennen so viel schneller als du?",
          text: "Weil ein Hund auf den Zehen läuft. Seine Ferse berührt nie den Boden. Dadurch wird das Bein länger und jeder Schritt weiter. Schau dir das Hinterbein an: Das Gelenk, das nach hinten zeigt, ist nicht das Knie. Es ist die Ferse!",
        },
        fakten: [
          "Das Gelenk, das beim Hund hinten am Bein nach hinten zeigt, ist die Ferse, nicht das Knie.",
          "Pferde und Rinder laufen auf Zehenspitzen. Ihre Hufe sind so etwas wie sehr dicke Zehennägel.",
          "Bären laufen wie wir Menschen auf der ganzen Sohle.",
        ],
        karten: [
          {
            typ: "bild", id: "lf-bild", titel: "Hinterbeine von Mensch, Hund und Rind (die Ferse ist orange)", viewBox: "0 0 480 300", svg: dreiBeine(),
            marken: [
              { nr: 1, x: 52, y: 236, begriff: "der Sohlengänger" },
              { nr: 2, x: 222, y: 246, begriff: "der Zehengänger" },
              { nr: 3, x: 456, y: 236, begriff: "der Zehenspitzengänger" },
              { nr: 4, x: 290, y: 166, begriff: "die Ferse" },
              { nr: 5, x: 206, y: 96, begriff: "das Knie" },
            ],
            merk: "Je höher die Ferse über dem Boden, desto länger das Bein und desto schneller das Tier.",
            warum: "So erkennst du an jedem Tier, ob es ein schneller Läufer ist.",
          },
          {
            typ: "paare", id: "lf-tiere", titel: "Wie läuft dieses Tier? Ordne zu.", frageWahl: "Wie läuft dieses Tier?",
            paare: [["Mensch", "Sohlengänger"], ["Bär", "Sohlengänger"], ["Hund", "Zehengänger"], ["Katze", "Zehengänger"], ["Rind", "Zehenspitzengänger"], ["Pferd", "Zehenspitzengänger"]],
            tipp: "Wo ist die Ferse? Auf dem Boden, in der Luft oder ganz weit oben?",
          },
          { typ: "begriff", id: "lf-sohle", begriff: "der Sohlengänger", bedeutung: "Ein Tier, das mit der ganzen Fußsohle auftritt, auch mit der Ferse. Beispiele: Mensch, Bär." },
          { typ: "begriff", id: "lf-zehe", begriff: "der Zehengänger", bedeutung: "Ein Tier, das nur auf den Zehen läuft. Die Ferse ist hoch über dem Boden. Beispiele: Hund, Katze.", warum: "Darum läuft {hund} so leicht und federnd." },
          { typ: "begriff", id: "lf-spitze", begriff: "der Zehenspitzengänger", bedeutung: "Ein Tier, das nur auf den Spitzen der Zehen läuft, geschützt von Hufen. Beispiele: Pferd, Rind." },
          {
            typ: "frage", id: "lf-vorteil", frage: "Welchen Vorteil hat ein Tier, das auf den Zehen läuft?",
            antwort: "Das Bein ist länger, die Schritte sind weiter: Das Tier ist schneller.",
            falsch: ["Das Tier kann besser schwimmen.", "Das Tier hat wärmere Füße.", "Das Tier kann besser riechen."],
          },
          { typ: "wahr", id: "lf-knie", satz: "Das Gelenk, das beim Hund am Hinterbein nach hinten zeigt, ist das Knie.", wahr: false, korrektur: "Es ist die Ferse. Das Knie sitzt weiter oben, nah am Bauch." },
          { typ: "wahr", id: "lf-ferse", satz: "Bei einem Zehengänger berührt die Ferse beim Laufen nicht den Boden.", wahr: true },
          {
            typ: "reihe", id: "lf-bein", titel: "Das Hinterbein des Hundes von oben nach unten: Bringe in die richtige Reihenfolge.",
            schritte: ["Becken", "Oberschenkelknochen", "Knie", "Unterschenkelknochen", "Ferse", "Mittelfußknochen", "Zehenknochen"],
            tipp: "Oben hängt das Bein am Becken. Ganz unten berühren die Zehen den Boden.",
          },
          {
            typ: "auftrag", id: "lf-gehen", art: "bewegen", titel: "Lauf wie ein Tier",
            text: "Geh 10 Schritte wie ein Sohlengänger (ganzer Fuß), 10 wie ein Zehengänger (nur auf den Fußballen) und 10 wie ein Zehenspitzengänger (ganz auf den Zehenspitzen). Was ist am leisesten? Womit wärst du am schnellsten?",
          },
          {
            typ: "auftrag", id: "lf-ferse-finden", art: "forschen", titel: "Die Ferse finden",
            text: "Wenn {hund} ganz entspannt bei dir liegt: Taste vorsichtig ein Hinterbein entlang. Findest du die Ferse, die nach hinten zeigt? Und das Knie weiter oben am Bauch? Vergleiche mit deinem eigenen Bein.",
          },
        ],
      },
      // ======================================================================
      {
        id: "gebiss",
        name: "Zähne verraten das Futter",
        icon: "🦷",
        warum: {
          frage: "Warum hat {hund} so spitze Zähne, und warum fallen bald welche aus?",
          text: "An den Zähnen kann man ablesen, was ein Tier frisst. Hunde stammen vom Wolf ab, einem Jäger. Darum haben sie ein Fleischfressergebiss mit langen Fangzähnen und scharfen Reißzähnen. Welpen haben zuerst Milchzähne. Ab etwa dem vierten Lebensmonat fallen sie aus und die bleibenden Zähne wachsen nach.",
        },
        fakten: [
          "Ein erwachsener Hund hat 42 Zähne, ein Welpe nur 28 Milchzähne.",
          "Eine Katze hat 30 Zähne, also weniger als ein Hund.",
          "Ein Rind hat oben vorne gar keine Schneidezähne, sondern eine harte Platte.",
        ],
        karten: [
          {
            typ: "bild", id: "gb-bild", titel: "Der Schädel eines Hundes mit Gebiss", viewBox: "0 0 460 250", svg: hundegebiss(),
            marken: [
              { nr: 1, x: 32, y: 130, begriff: "die Schneidezähne" },
              { nr: 2, x: 97, y: 148, begriff: "der Fangzahn" },
              { nr: 3, x: 246, y: 134, begriff: "der Reißzahn" },
              { nr: 4, x: 306, y: 131, begriff: "die Backenzähne" },
              { nr: 5, x: 186, y: 164, begriff: "der Unterkiefer" },
            ],
            merk: "Von vorn nach hinten: Schneidezähne, Fangzahn, kleine Backenzähne, Reißzahn, Backenzähne.",
            warum: "Bald verliert {hund} Milchzähne. Dann kannst du die echten Zähne mit diesem Bild vergleichen.",
          },
          {
            typ: "paare", id: "gb-aufgabe", titel: "Welcher Zahn macht was? Ordne zu.",
            paare: [
              ["Fangzähne", "packen und halten die Beute"],
              ["Reißzähne", "zerschneiden Fleisch wie eine Schere"],
              ["Schneidezähne", "nagen Fleischreste vom Knochen"],
              ["Backenzähne", "zerkleinern und zerquetschen das Futter"],
            ],
          },
          { typ: "begriff", id: "gb-fang", begriff: "der Fangzahn", auch: ["Eckzahn"], bedeutung: "Langer, spitzer Eckzahn. Mit ihm packt und hält ein Raubtier seine Beute." },
          { typ: "begriff", id: "gb-reiss", begriff: "der Reißzahn", bedeutung: "Großer, scharfer Backenzahn eines Raubtiers. Der obere und der untere arbeiten zusammen wie eine Schere." },
          {
            typ: "begriff", id: "gb-milch", begriff: "der Milchzahn", bedeutung: "Einer der ersten Zähne eines jungen Tiers. Er fällt später aus und ein bleibender Zahn wächst nach.",
            warum: "Gerade erlebst du das bei {hund3}: Während des Zahnwechsels kauen Welpen besonders gern auf allem herum.",
          },
          { typ: "begriff", id: "gb-fleisch", begriff: "das Fleischfressergebiss", bedeutung: "Gebiss mit langen Fangzähnen und scharfen Reißzähnen, wie bei Hund und Katze." },
          { typ: "begriff", id: "gb-pflanze", begriff: "das Pflanzenfressergebiss", bedeutung: "Gebiss mit breiten, flachen Backenzähnen zum Zermahlen von Gras, wie beim Rind." },
          {
            typ: "gruppen", id: "gb-gruppen", frageWahl: "Zu welchem Gebiss passt das?", frageAntippen: "Tippe alles an, was passt zum",
            gruppen: {
              "Fleischfressergebiss": ["lange, spitze Fangzähne", "scharfe Reißzähne wie eine Schere"],
              "Pflanzenfressergebiss": ["breite Backenzähne zum Zermahlen", "oben vorne eine harte Platte statt Schneidezähnen", "eine große Zahnlücke"],
            },
          },
          { typ: "zahl", id: "gb-42", frage: "Wie viele Zähne hat ein erwachsener Hund?", antwort: 42, tipp: "Es sind mehr als 40." },
          { typ: "zahl", id: "gb-28", frage: "Wie viele Milchzähne hat ein Hundewelpe?", antwort: 28, tipp: "Es sind weniger als 30." },
          { typ: "wahr", id: "gb-katze", satz: "Eine Katze hat mehr Zähne als ein Hund.", wahr: false, korrektur: "Die Katze hat 30 Zähne, der Hund 42." },
          {
            typ: "auftrag", id: "gb-detektiv", art: "forschen", titel: "Zahn-Detektivin",
            text: "Schau zusammen mit einem Erwachsenen vorsichtig in das Maul von {hund3}. Findest du die Fangzähne? Bald fallen die ersten Milchzähne aus. Wenn ihr einen findet: Heb ihn auf und vergleiche ihn später mit einem neuen Zahn.",
          },
          {
            typ: "auftrag", id: "gb-knete", art: "basteln", titel: "Gebisse aus Ofenknete",
            text: "Forme zwei kleine Gebisse aus Knete: eines vom Hund mit spitzen Fangzähnen und Reißzähnen und eines vom Rind mit breiten, flachen Backenzähnen. Vielleicht bekommen deine Playmobil-Figuren dazu passendes Futter?",
          },
        ],
      },
      // ======================================================================
      {
        id: "jaeger",
        name: "Hund und Katze: zwei Jäger",
        icon: "🐺",
        warum: {
          frage: "Warum klackern die Krallen von {hund3} auf dem Boden, während eine Katze lautlos schleicht?",
          text: "Hund und Katze sind beide Jäger, aber mit verschiedenen Tricks. Der Hund ist ein Hetzjäger wie sein Vorfahre, der Wolf: Er rennt der Beute lange hinterher. Seine Krallen sind immer draußen und geben Halt beim Rennen. Die Katze ist ein Schleichjäger: Sie schleicht sich leise an und springt dann. Ihre Krallen kann sie einziehen.",
        },
        fakten: [
          "Der Hund stammt vom Wolf ab, die Hauskatze von der Falbkatze, einer Wildkatze aus Afrika.",
          "Katzen ziehen ihre Krallen beim Laufen ein. So bleiben sie scharf und machen kein Geräusch.",
          "Mit ihren Tasthaaren findet sich die Katze auch im Dunkeln zurecht.",
        ],
        karten: [
          {
            typ: "gruppen", id: "jg-merkmale", frageWahl: "Passt das zum Hund oder zur Katze?", frageAntippen: "Tippe alles an, was passt zu:",
            gruppen: {
              "Hund (Hetzjäger)": ["rennt der Beute lange hinterher", "Krallen sind immer draußen", "jagt im Rudel wie der Wolf"],
              "Katze (Schleichjäger)": ["schleicht sich leise an", "kann die Krallen einziehen", "lauert und springt blitzschnell", "jagt allein"],
            },
          },
          { typ: "begriff", id: "jg-hetz", begriff: "der Hetzjäger", bedeutung: "Ein Jäger, der seine Beute über eine lange Strecke verfolgt, bis sie müde ist. Beispiele: Wolf, Hund.", warum: "Darum liebt {hund} Ballspiele und Rennen: Das Jagen steckt noch im Hund." },
          { typ: "begriff", id: "jg-schleich", begriff: "der Schleichjäger", bedeutung: "Ein Jäger, der sich leise anschleicht oder lauert und dann blitzschnell zuspringt. Beispiel: Katze." },
          { typ: "begriff", id: "jg-ballen", begriff: "der Zehenballen", auch: ["Ballen", "Pfotenballen"], bedeutung: "Weiche Polster unter den Zehen. Sie dämpfen die Schritte, darum ist die Katze so leise." },
          { typ: "begriff", id: "jg-tasthaare", begriff: "die Tasthaare", auch: ["Schnurrhaare"], bedeutung: "Lange, steife Haare an der Schnauze. Mit ihnen ertastet die Katze ihre Umgebung, auch im Dunkeln." },
          { typ: "frage", id: "jg-wolf", frage: "Von welchem Tier stammt der Hund ab?", antwort: "vom Wolf", falsch: ["vom Fuchs", "vom Bären", "vom Schakal"], warum: "Darum hat {hund} das Gebiss und die Beine eines Jägers." },
          { typ: "frage", id: "jg-falb", frage: "Von welchem Tier stammt die Hauskatze ab?", antwort: "von der Falbkatze, einer Wildkatze", falsch: ["vom Löwen", "vom Luchs", "vom Tiger"] },
          { typ: "wahr", id: "jg-krallen", satz: "Ein Hund kann seine Krallen einziehen wie eine Katze.", wahr: false, korrektur: "Nur die Katze kann ihre Krallen einziehen. Beim Hund sind sie immer draußen und geben beim Rennen Halt." },
          {
            typ: "reihe", id: "jg-maus", titel: "So jagt eine Katze eine Maus: Bringe in die richtige Reihenfolge.",
            schritte: ["Die Katze hört die Maus rascheln.", "Sie schleicht sich auf weichen Ballen leise an.", "Sie springt blitzschnell los.", "Sie packt die Maus mit den ausgefahrenen Krallen.", "Sie tötet die Maus mit einem Biss der Fangzähne."],
          },
          {
            typ: "auftrag", id: "jg-spiel", art: "forschen", titel: "Jagdspiel beobachten",
            text: "Zieh ein Spielzeug an einer Schnur über den Boden. Rennt {hund} hinterher wie ein Hetzjäger oder schleicht sich an wie eine Katze? Hör auch auf die Krallen auf dem Boden.",
          },
          {
            typ: "auftrag", id: "jg-pfote", art: "basteln", titel: "Katzenpfote mit Krallen",
            text: "Bastle eine Katzenpfote aus Pappe. Befestige Krallen aus Knete an Papierstreifen, die du durch kleine Schlitze nach hinten ziehen kannst. So siehst du, wie die Katze ihre Krallen einzieht und ausfährt.",
          },
        ],
      },
    ],
  });
})(typeof window !== "undefined" ? window : globalThis);
