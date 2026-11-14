// Das Tier zum Pflegen und sein Zimmer. Alles als SVG gezeichnet, eigene Figuren, keine Bilddateien.
(function (root) {
  "use strict";

  const ARTEN = {
    hund: {
      // Labrador-Welpe in Foxred, etwas naturgetreuer gezeichnet: breiter Kopf, Schnauze mit großer schwarzer Nase,
      // weiche Hängeohren, hellere Brust, kräftige Pfoten
      name: "Hund", farbe: "#b8622a", bauch: "#d99a5c", dunkel: "#94491b", hell: "#cf8346", nase: 9,
      zeichne: (A, mood) => {
        const fell = "url(#ln-hund-fell)", kopf = "url(#ln-hund-kopf)", ohr = "url(#ln-hund-ohr)";
        let s = `<defs>
          <radialGradient id="ln-hund-kopf" cx="50%" cy="30%" r="70%"><stop offset="0" stop-color="${A.hell}"/><stop offset=".55" stop-color="${A.farbe}"/><stop offset="1" stop-color="${A.dunkel}"/></radialGradient>
          <radialGradient id="ln-hund-fell" cx="50%" cy="35%" r="75%"><stop offset="0" stop-color="${A.hell}"/><stop offset=".6" stop-color="${A.farbe}"/><stop offset="1" stop-color="${A.dunkel}"/></radialGradient>
          <linearGradient id="ln-hund-ohr" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${A.farbe}"/><stop offset="1" stop-color="${A.dunkel}"/></linearGradient>
          <radialGradient id="ln-hund-brust" cx="50%" cy="35%" r="60%"><stop offset="0" stop-color="${A.bauch}"/><stop offset=".55" stop-color="${A.bauch}" stop-opacity=".8"/><stop offset="1" stop-color="${A.bauch}" stop-opacity="0"/></radialGradient>
        </defs>`;
        // Schwanz, Hinterbeine, Körper
        s += `<path class="wedel" d="M140 178 Q184 182 180 148" stroke="${A.farbe}" stroke-width="13" fill="none" stroke-linecap="round"/>`;
        s += `<ellipse cx="64" cy="168" rx="27" ry="23" fill="${fell}"/><ellipse cx="136" cy="168" rx="27" ry="23" fill="${fell}"/>`;
        s += `<ellipse cx="50" cy="190" rx="16" ry="7" fill="${A.farbe}"/><ellipse cx="150" cy="190" rx="16" ry="7" fill="${A.farbe}"/>`;
        s += `<path d="M62 126 Q54 176 74 192 L126 192 Q146 176 138 126 Q120 110 100 110 Q80 110 62 126 Z" fill="${fell}"/>`;
        s += `<ellipse cx="100" cy="140" rx="30" ry="30" fill="url(#ln-hund-brust)"/>`;
        // Vorderbeine mit großen Welpenpfoten
        s += `<path d="M77 136 Q74 166 76 188 L95 188 Q97 164 95 136 Z" fill="${A.farbe}"/><path d="M105 136 Q103 164 105 188 L124 188 Q126 166 123 136 Z" fill="${A.farbe}"/>`;
        s += `<path d="M82 140 Q80 164 82 184" stroke="${A.hell}" stroke-width="4" fill="none" stroke-linecap="round" opacity=".6"/><path d="M110 140 Q108 164 110 184" stroke="${A.hell}" stroke-width="4" fill="none" stroke-linecap="round" opacity=".6"/>`;
        s += `<ellipse cx="85" cy="190" rx="14" ry="8" fill="${A.hell}"/><ellipse cx="115" cy="190" rx="14" ry="8" fill="${A.hell}"/>`;
        s += `<path d="M80 186 L80 193 M85 185 L85 194 M90 186 L90 193 M110 186 L110 193 M115 185 L115 194 M120 186 L120 193" stroke="${A.dunkel}" stroke-width="1.6" stroke-linecap="round" opacity=".7"/>`;
        // Kopf
        s += `<path d="M54 78 Q52 38 100 34 Q148 38 146 78 Q146 106 128 118 Q116 126 100 126 Q84 126 72 118 Q54 106 54 78 Z" fill="${kopf}"/>`;
        s += `<path d="M92 44 Q100 40 108 44" stroke="${A.dunkel}" stroke-width="2" fill="none" opacity=".35"/>`;
        // Schnauze mit hellerem Nasenrücken
        s += `<path d="M79 98 Q78 82 100 80 Q122 82 121 98 Q122 118 100 124 Q78 118 79 98 Z" fill="${A.farbe}"/>`;
        s += `<ellipse cx="100" cy="86" rx="9" ry="14" fill="${A.hell}" opacity=".55"/>`;
        s += `<path d="M84 112 Q100 122 116 112" stroke="${A.dunkel}" stroke-width="5" fill="none" opacity=".25" stroke-linecap="round"/>`;
        // Augen: dunkelbraun, mandelförmig, mit Lichtpunkt und leichtem Brauenschatten
        if (mood === "jubel" || mood === "mampf") s += `<path d="M73 84 Q82 75 91 84 M109 84 Q118 75 127 84" stroke="#2a1a12" stroke-width="4" fill="none" stroke-linecap="round"/>`;
        else s += `<path d="M71 75 Q81 69 90 75 M110 75 Q119 69 129 75" stroke="${A.dunkel}" stroke-width="3" fill="none" opacity=".55" stroke-linecap="round"/>`
          + `<ellipse class="auge" cx="82" cy="83" rx="7.5" ry="7" fill="#3b2316"/><ellipse class="auge" cx="118" cy="83" rx="7.5" ry="7" fill="#3b2316"/>`
          + `<circle cx="82" cy="83.5" r="4.6" fill="#140b07"/><circle cx="118" cy="83.5" r="4.6" fill="#140b07"/><circle cx="84.5" cy="80.5" r="2.1" fill="#fff"/><circle cx="120.5" cy="80.5" r="2.1" fill="#fff"/>`;
        // Nase: groß, schwarz, mit Glanz
        s += `<path d="M87 96 Q100 89 113 96 Q114 106 100 109 Q86 106 87 96 Z" fill="#231a17"/><ellipse cx="96" cy="95" rx="4.5" ry="2" fill="#fff" opacity=".35"/>`;
        s += `<ellipse cx="94" cy="101" rx="2.2" ry="1.6" fill="#000" opacity=".6"/><ellipse cx="106" cy="101" rx="2.2" ry="1.6" fill="#000" opacity=".6"/>`;
        // Maul
        if (mood === "jubel") s += `<path d="M86 112 Q100 130 114 112 Q100 117 86 112 Z" fill="#6b2a22"/><path d="M93 117 Q100 134 107 117 Z" fill="#e9858a"/>`;
        else if (mood === "mampf") s += `<ellipse class="kau" cx="100" cy="116" rx="8" ry="5" fill="#6b2a22"/>`;
        else s += `<path d="M100 109 L100 113 M100 113 Q93 119 87 114 M100 113 Q107 119 113 114" stroke="#3a1f14" stroke-width="2.4" fill="none" stroke-linecap="round"/>`;
        s += [[88, 107], [85, 103], [112, 107], [115, 103]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="1.1" fill="#3a1f14" opacity=".7"/>`).join("");
        // Hängeohren vor dem Kopf
        s += `<path d="M64 50 Q44 54 40 80 Q37 106 51 115 Q63 110 69 90 Q74 64 64 50 Z" fill="${ohr}"/>`;
        s += `<path d="M136 50 Q156 54 160 80 Q163 106 149 115 Q137 110 131 90 Q126 64 136 50 Z" fill="${ohr}"/>`;
        return s;
      },
    },
    katze: {
      name: "Katze", farbe: "#f2a65a", bauch: "#fde3c3", dunkel: "#d9853b", innen: "#f7b7b2",
      ohren: (A) => `<polygon points="60,62 56,16 94,44" fill="${A.farbe}"/><polygon points="66,54 63,28 85,45" fill="${A.innen}"/>
        <polygon points="140,62 144,16 106,44" fill="${A.farbe}"/><polygon points="134,54 137,28 115,45" fill="${A.innen}"/>`,
      schwanz: (A) => `<path d="M140 170 Q190 172 178 118" stroke="${A.farbe}" stroke-width="15" fill="none" stroke-linecap="round"/>`,
      gesicht: (A) => `<path d="M92 44 L95 56 M100 42 L100 56 M108 44 L105 56" stroke="${A.dunkel}" stroke-width="4" stroke-linecap="round"/>
        <path d="M58 98 L76 100 M58 108 L76 106 M142 98 L124 100 M142 108 L124 106" stroke="#7a5a44" stroke-width="2" stroke-linecap="round"/>`,
    },
    hase: {
      name: "Hase", farbe: "#e6e0d8", bauch: "#ffffff", dunkel: "#c9bfb2", innen: "#f6b8c4",
      ohren: (A) => `<ellipse cx="80" cy="30" rx="13" ry="36" fill="${A.farbe}" transform="rotate(-8 80 30)"/><ellipse cx="80" cy="32" rx="6" ry="27" fill="${A.innen}" transform="rotate(-8 80 32)"/>
        <ellipse cx="120" cy="30" rx="13" ry="36" fill="${A.farbe}" transform="rotate(8 120 30)"/><ellipse cx="120" cy="32" rx="6" ry="27" fill="${A.innen}" transform="rotate(8 120 32)"/>`,
      schwanz: () => `<circle cx="150" cy="170" r="14" fill="#ffffff"/>`,
      gesicht: () => `<rect x="95" y="108" width="5" height="8" rx="1.5" fill="#fff" stroke="#d8d0c6"/><rect x="100" y="108" width="5" height="8" rx="1.5" fill="#fff" stroke="#d8d0c6"/>`,
    },
    fuchs: {
      name: "Fuchs", farbe: "#e8743b", bauch: "#fff4e6", dunkel: "#5b3a29", innen: "#fff4e6",
      ohren: (A) => `<polygon points="58,62 52,12 94,42" fill="${A.farbe}"/><polygon points="55,30 52,12 66,22" fill="${A.dunkel}"/><polygon points="64,52 60,28 84,44" fill="${A.innen}"/>
        <polygon points="142,62 148,12 106,42" fill="${A.farbe}"/><polygon points="145,30 148,12 134,22" fill="${A.dunkel}"/><polygon points="136,52 140,28 116,44" fill="${A.innen}"/>`,
      schwanz: (A) => `<ellipse cx="164" cy="146" rx="20" ry="40" fill="${A.farbe}" transform="rotate(35 164 146)"/><ellipse cx="183" cy="118" rx="10" ry="13" fill="#fff" transform="rotate(35 183 118)"/>`,
      gesicht: (A) => `<path d="M56 92 Q70 126 100 124 Q130 126 144 92 Q124 104 100 100 Q76 104 56 92 Z" fill="${A.bauch}"/>`,
    },
    panda: {
      name: "Panda", farbe: "#f6f6f4", bauch: "#ffffff", dunkel: "#2f2f2f", innen: "#2f2f2f", arme: "#2f2f2f", flecken: true,
      ohren: (A) => `<circle cx="62" cy="46" r="16" fill="${A.dunkel}"/><circle cx="138" cy="46" r="16" fill="${A.dunkel}"/>`,
      schwanz: () => "",
      gesicht: (A) => `<ellipse cx="82" cy="86" rx="13" ry="17" fill="${A.dunkel}" transform="rotate(25 82 86)"/><ellipse cx="118" cy="86" rx="13" ry="17" fill="${A.dunkel}" transform="rotate(-25 118 86)"/>`,
    },
    hamster: {
      name: "Hamster", farbe: "#e7b36a", bauch: "#fff3df", dunkel: "#c98f44", innen: "#f6b8b0",
      ohren: (A) => `<circle cx="64" cy="48" r="13" fill="${A.farbe}"/><circle cx="64" cy="48" r="7" fill="${A.innen}"/><circle cx="136" cy="48" r="13" fill="${A.farbe}"/><circle cx="136" cy="48" r="7" fill="${A.innen}"/>`,
      schwanz: () => "",
      gesicht: (A) => `<ellipse cx="66" cy="104" rx="20" ry="17" fill="${A.bauch}"/><ellipse cx="134" cy="104" rx="20" ry="17" fill="${A.bauch}"/><ellipse cx="100" cy="108" rx="14" ry="11" fill="${A.bauch}"/>`,
    },
  };

  function augen(A, mood) {
    if (mood === "jubel" || mood === "mampf") return `<path d="M73 86 Q82 76 91 86 M109 86 Q118 76 127 86" stroke="${A.flecken ? "#fff" : "#2b2b2b"}" stroke-width="4.5" fill="none" stroke-linecap="round"/>`;
    if (A.flecken) return `<circle cx="83" cy="86" r="7" fill="#fff"/><circle cx="117" cy="86" r="7" fill="#fff"/><circle cx="84" cy="87" r="4.5" fill="#222"/><circle cx="116" cy="87" r="4.5" fill="#222"/><circle cx="85.5" cy="85" r="1.6" fill="#fff"/><circle cx="117.5" cy="85" r="1.6" fill="#fff"/>`;
    return `<ellipse class="auge" cx="82" cy="86" rx="7" ry="9" fill="#2b2b2b"/><ellipse class="auge" cx="118" cy="86" rx="7" ry="9" fill="#2b2b2b"/><circle cx="84.5" cy="82.5" r="2.6" fill="#fff"/><circle cx="120.5" cy="82.5" r="2.6" fill="#fff"/>`;
  }
  function mund(mood) {
    if (mood === "mampf") return `<ellipse class="kau" cx="100" cy="112" rx="8" ry="6" fill="#8a3b3b"/>`;
    if (mood === "jubel") return `<path d="M88 106 Q100 124 112 106 Z" fill="#8a3b3b"/><path d="M94 114 Q100 120 106 114" fill="#f28b8b"/>`;
    return `<path d="M90 106 Q95 113 100 107 Q105 113 110 106" stroke="#5a3a2a" stroke-width="3" fill="none" stroke-linecap="round"/>`;
  }
  const ZUBEHOER = {
    halstuch: `<path d="M68 124 Q100 140 132 124 L124 136 Q100 150 76 136 Z" fill="#e63946"/><path d="M92 136 L100 160 L110 136 Z" fill="#c92f3b"/><circle cx="90" cy="132" r="2.5" fill="#fff"/><circle cx="110" cy="132" r="2.5" fill="#fff"/>`,
    brille: `<circle cx="82" cy="86" r="14" fill="#cfe8ff" fill-opacity=".25" stroke="#333" stroke-width="3.5"/><circle cx="118" cy="86" r="14" fill="#cfe8ff" fill-opacity=".25" stroke="#333" stroke-width="3.5"/><path d="M96 85 Q100 81 104 85" stroke="#333" stroke-width="3.5" fill="none"/>`,
    muetze: `<path d="M58 60 Q60 22 100 20 Q140 22 142 60 Z" fill="#457b9d"/><path d="M100 56 Q140 50 166 62 Q140 70 100 64 Z" fill="#2f5d7c"/><circle cx="100" cy="20" r="6" fill="#f2c94c"/>`,
    schleife: `<g transform="translate(134 44) rotate(20)"><polygon points="0,0 -18,-11 -18,11" fill="#e84a7a"/><polygon points="0,0 18,-11 18,11" fill="#e84a7a"/><circle r="5" fill="#c2185b"/></g>`,
    blume: `<g transform="translate(62 48)"><circle cx="0" cy="-9" r="6.5" fill="#fff"/><circle cx="8.5" cy="-3" r="6.5" fill="#fff"/><circle cx="5.5" cy="7.5" r="6.5" fill="#fff"/><circle cx="-5.5" cy="7.5" r="6.5" fill="#fff"/><circle cx="-8.5" cy="-3" r="6.5" fill="#fff"/><circle r="5" fill="#f2c94c"/></g>`,
    halsband: `<path d="M66 121 Q100 137 134 121 L133 129 Q100 146 67 129 Z" fill="#2a6fdb" stroke="#1d4f9e" stroke-width="1.5"/><circle cx="100" cy="141" r="5.5" fill="#f2c94c" stroke="#c9a227" stroke-width="1.5"/>`,
    krone: `<path d="M74 34 L78 10 L90 26 L100 6 L110 26 L122 10 L126 34 Z" fill="#f2c94c" stroke="#d4a017" stroke-width="2"/><circle cx="100" cy="24" r="3.5" fill="#e63946"/>`,
  };
  // Reihenfolge beim Zeichnen: Halstuch unten, Krone ganz oben
  const ZUBEHOER_REIHE = ["halsband", "halstuch", "brille", "muetze", "schleife", "blume", "krone"];
  const GROESSE = [0.78, 0.88, 1, 1];

  function tierSvg(art, o) {
    o = o || {};
    const A = ARTEN[art] || ARTEN.katze;
    const mood = o.mood || "froh";
    const st = Math.max(0, Math.min(3, o.stufe || 0));
    const sc = GROESSE[st];
    let s = "";
    if (A.zeichne) s = A.zeichne(A, mood);
    else {
    s += A.schwanz(A);
    s += `<ellipse cx="100" cy="150" rx="50" ry="40" fill="${A.farbe}"/><ellipse cx="100" cy="158" rx="31" ry="27" fill="${A.bauch}"/>`;
    s += `<ellipse cx="78" cy="187" rx="16" ry="9" fill="${A.dunkel}"/><ellipse cx="122" cy="187" rx="16" ry="9" fill="${A.dunkel}"/>`;
    s += A.ohren(A);
    s += `<circle cx="100" cy="84" r="46" fill="${A.farbe}"/>`;
    s += A.gesicht(A);
    if (A.ohrenVorne) s += A.ohrenVorne(A);
    s += `<ellipse cx="68" cy="104" rx="8" ry="5" fill="#f4a0a0" opacity=".55"/><ellipse cx="132" cy="104" rx="8" ry="5" fill="#f4a0a0" opacity=".55"/>`;
    s += augen(A, mood);
    s += `<ellipse cx="100" cy="99" rx="${A.nase || 6}" ry="${(A.nase || 6) * 0.7}" fill="#4a2e22"/>`;
    s += mund(mood);
    const arm = A.arme || A.farbe;
    s += `<ellipse cx="70" cy="146" rx="11" ry="16" fill="${arm}" transform="rotate(24 70 146)"/><ellipse cx="130" cy="146" rx="11" ry="16" fill="${arm}" transform="rotate(-24 130 146)"/>`;
    }
    for (const z of ZUBEHOER_REIHE) if ((o.traegt || []).includes(z)) s += ZUBEHOER[z];
    if (st === 3) s += `<g class="glanz"><path d="M26 60 l4 10 l10 4 l-10 4 l-4 10 l-4 -10 l-10 -4 l10 -4 Z" fill="#f2c94c"/><path d="M172 40 l3 7 l7 3 l-7 3 l-3 7 l-3 -7 l-7 -3 l7 -3 Z" fill="#f2c94c"/></g>`;
    const g = `<g transform="translate(100 196) scale(${sc}) translate(-100 -196)">${s}</g>`;
    if (o.nurInhalt) return g;
    return `<svg class="tier-svg${o.klasse ? " " + o.klasse : ""}" viewBox="0 0 200 200" role="img" aria-label="${A.name}">${g}</svg>`;
  }

  // Das Zimmer: Gegenstände erscheinen, sobald sie gekauft sind
  const ZIMMER = {
    lichter: `<path d="M0 14 Q50 40 100 16 Q150 40 200 16 Q250 40 300 16 Q350 40 400 14" stroke="#6d5d4b" stroke-width="2" fill="none"/>` + [[25, 26, "#f94144"], [75, 30, "#f9c74f"], [125, 26, "#90be6d"], [175, 30, "#577590"], [225, 26, "#f3722c"], [275, 30, "#f9c74f"], [325, 26, "#43aa8b"], [375, 28, "#f94144"]].map(([x, y, c]) => `<circle cx="${x}" cy="${y}" r="5" fill="${c}"/>`).join(""),
    bild: `<rect x="262" y="42" width="78" height="56" rx="4" fill="#8d6e63"/><rect x="268" y="48" width="66" height="44" fill="#bde0fe"/><path d="M268 92 L290 64 L304 80 L314 70 L334 92 Z" fill="#6a994e"/><circle cx="322" cy="58" r="6" fill="#ffd166"/>`,
    regal: `<rect x="160" y="70" width="80" height="6" fill="#a1887f"/><rect x="160" y="110" width="80" height="6" fill="#a1887f"/>` + [[164, "#e76f51", 32], [174, "#2a9d8f", 28], [183, "#e9c46a", 34], [194, "#264653", 30], [205, "#f4a261", 26]].map(([x, c, h]) => `<rect x="${x}" y="${70 - h}" width="9" height="${h}" fill="${c}"/>`).join("") + `<circle cx="224" cy="100" r="9" fill="#90be6d"/><rect x="218" y="100" width="12" height="10" fill="#bc6c25"/>`,
    teppich: `<ellipse cx="200" cy="230" rx="130" ry="22" fill="#b39ddb"/><ellipse cx="200" cy="230" rx="108" ry="15" fill="none" stroke="#9575cd" stroke-width="3" stroke-dasharray="8 6"/>`,
    kissen: `<ellipse cx="200" cy="226" rx="74" ry="17" fill="#f48fb1"/><ellipse cx="200" cy="221" rx="62" ry="10" fill="#f8bbd0"/>`,
    pflanze: `<path d="M22 196 L58 196 L52 232 L28 232 Z" fill="#c1693c"/><path d="M40 196 Q20 160 30 140 Q44 166 40 196 M40 196 Q56 158 70 150 Q62 178 40 196 M40 196 Q40 160 46 128 Q54 164 40 196" fill="#4f9d69"/>`,
    lampe: `<line x1="368" y1="120" x2="368" y2="232" stroke="#6d5d4b" stroke-width="5"/><ellipse cx="368" cy="234" rx="16" ry="5" fill="#6d5d4b"/><path d="M346 120 L390 120 L380 92 L356 92 Z" fill="#ffd166"/><ellipse class="lampenlicht" cx="368" cy="150" rx="40" ry="60" fill="#fff3b0" opacity=".25"/>`,
    bastel: `<rect x="70" y="196" width="66" height="7" rx="2" fill="#a1887f"/><rect x="74" y="203" width="5" height="32" fill="#8d6e63"/><rect x="127" y="203" width="5" height="32" fill="#8d6e63"/><circle cx="82" cy="190" r="6" fill="#f4a261"/><circle cx="82" cy="190" r="2.2" fill="#a1887f"/><path d="M93 196 L109 196 L101 182 Z" fill="#f9c74f"/><circle cx="101" cy="191" r="1.8" fill="#e63946"/><circle cx="98" cy="194" r="1.5" fill="#e63946"/><rect x="114" y="187" width="15" height="9" rx="4" fill="#90be6d"/><rect x="114" y="187" width="15" height="3" rx="1.5" fill="#f8bbd0"/>`,
    decke: `<path d="M100 222 Q200 206 300 222 L310 252 Q200 266 90 252 Z" fill="#6f9fc0"/><path d="M130 216 L122 258 M170 211 L166 262 M210 210 L212 263 M250 212 L256 262 M286 218 L296 256" stroke="#a9c9de" stroke-width="5" opacity=".7"/><path d="M96 236 Q200 222 304 236" stroke="#a9c9de" stroke-width="5" fill="none" opacity=".7"/>`,
    korb: `<ellipse cx="200" cy="216" rx="90" ry="18" fill="#7a4a22"/><ellipse cx="200" cy="222" rx="80" ry="14" fill="#efd3a8"/>`,
    leine: `<rect x="141" y="40" width="10" height="6" rx="2" fill="#6d5d4b"/><path d="M146 46 Q132 78 146 110" stroke="#c0392b" stroke-width="4" fill="none" stroke-linecap="round"/><path d="M146 46 Q160 78 146 110" stroke="#c0392b" stroke-width="4" fill="none" stroke-linecap="round"/><rect x="142" y="108" width="8" height="10" rx="2" fill="#b0b0b0"/>`,
    ball: `<circle cx="318" cy="232" r="14" fill="#ef476f"/><path d="M304 232 Q318 222 332 232 M318 218 L318 246" stroke="#fff" stroke-width="3" fill="none"/>`,
  };
  const ZIMMER_REIHE = ["lichter", "bild", "regal", "leine", "teppich", "decke", "korb", "kissen", "pflanze", "bastel", "lampe"];
  const VORNE = {
    korb: `<path d="M110 222 Q200 244 290 222 L284 248 Q200 264 116 248 Z" fill="#a8692f"/><path d="M118 232 Q200 250 282 232 M120 241 Q200 258 280 241" stroke="#7a4a22" stroke-width="2" fill="none"/><path d="M140 232 L138 254 M170 238 L169 259 M200 240 L200 261 M230 238 L231 259 M260 232 L262 254" stroke="#7a4a22" stroke-width="1.6"/>`,
    napf: `<path d="M296 238 L322 238 L318 252 L300 252 Z" fill="#2e86c1"/><ellipse cx="309" cy="238" rx="13" ry="4" fill="#aed6f1"/><path d="M326 238 L352 238 L348 252 L330 252 Z" fill="#c0392b"/><ellipse cx="339" cy="238" rx="13" ry="4" fill="#8d5524"/><circle cx="335" cy="237" r="1.6" fill="#5d3a1a"/><circle cx="341" cy="238" r="1.6" fill="#5d3a1a"/><circle cx="338" cy="236" r="1.4" fill="#5d3a1a"/>`,
    ball: `<circle cx="262" cy="248" r="11" fill="#ef476f"/><path d="M251 248 Q262 240 273 248 M262 237 L262 259" stroke="#fff" stroke-width="2.5" fill="none"/>`,
    kauseil: `<path d="M88 248 Q110 236 132 248" stroke="#e9d8a6" stroke-width="7" fill="none" stroke-linecap="round"/><path d="M92 246 L98 241 M104 242 L110 238 M116 241 L122 240 M126 244 L130 246" stroke="#c0392b" stroke-width="2.5"/><circle cx="88" cy="248" r="5.5" fill="#d4a373"/><circle cx="132" cy="248" r="5.5" fill="#d4a373"/>`,
    ente: `<ellipse cx="62" cy="248" rx="13" ry="8" fill="#f9d423"/><circle cx="70" cy="238" r="7" fill="#f9d423"/><path d="M76 238 L84 240 L76 242 Z" fill="#f39c12"/><circle cx="72" cy="236" r="1.4" fill="#222"/>`,
    frisbee: `<ellipse cx="170" cy="254" rx="19" ry="5.5" fill="#e74c3c"/><ellipse cx="170" cy="253" rx="11" ry="3" fill="none" stroke="#f5b7b1" stroke-width="2"/>`,
    kuscheltier: `<ellipse cx="280" cy="226" rx="11" ry="10" fill="#c9a07a"/><circle cx="280" cy="210" r="8" fill="#c9a07a"/><circle cx="273" cy="203" r="3.5" fill="#c9a07a"/><circle cx="287" cy="203" r="3.5" fill="#c9a07a"/><ellipse cx="280" cy="213" rx="3.5" ry="2.5" fill="#e8d5c0"/><circle cx="277" cy="208" r="1.2" fill="#222"/><circle cx="283" cy="208" r="1.2" fill="#222"/>`,
  };
  const VORNE_REIHE = ["korb", "kuscheltier", "napf", "kauseil", "ente", "frisbee", "ball"];

  function zimmerSvg(art, o) {
    o = o || {};
    const besitz = o.besitz || [];
    // Wand und Boden reichen über den Bildrand hinaus, damit das Zimmer auch in breiten Rahmen voll ist
    let s = `<rect x="-800" y="-200" width="2000" height="396" fill="#fbe9d0"/><rect x="-800" y="196" width="2000" height="300" fill="#e3bc8c"/>`;
    s += [216, 236].map((y) => `<line x1="-800" y1="${y}" x2="1200" y2="${y}" stroke="#d4a873" stroke-width="2"/>`).join("");
    s += `<rect x="34" y="34" width="96" height="76" rx="6" fill="#fff"/><rect x="40" y="40" width="84" height="64" fill="#cde7f7"/><line x1="82" y1="40" x2="82" y2="104" stroke="#fff" stroke-width="5"/><line x1="40" y1="72" x2="124" y2="72" stroke="#fff" stroke-width="5"/>`;
    for (const z of ZIMMER_REIHE) if (besitz.includes(z)) s += ZIMMER[z];
    const tier = tierSvg(art, { mood: o.mood, stufe: o.stufe, traegt: o.traegt, nurInhalt: true });
    s += `<g class="tier-im-zimmer" transform="translate(115 66) scale(0.85)">${tier}</g>`;
    for (const z of VORNE_REIHE) if (besitz.includes(z)) s += VORNE[z];
    return `<svg class="zimmer-svg" viewBox="0 0 400 260" role="img" aria-label="Zimmer">${s}</svg>`;
  }

  // Bilder für den Laden: Zimmersachen als Ausschnitt ihrer Zeichnung, Futter eigens gezeichnet
  const AUSSCHNITT = { korb: "104 196 192 70", decke: "88 202 226 66", napf: "292 228 64 28", ball: "248 234 28 28", kauseil: "80 232 60 26", ente: "46 228 42 30", frisbee: "148 244 44 16", kuscheltier: "264 196 32 40", leine: "126 36 40 86" };
  const FUTTER = {
    wasser: `<path d="M5 20 L35 20 L31 33 L9 33 Z" fill="#2e86c1"/><ellipse cx="20" cy="20" rx="15" ry="4.5" fill="#aed6f1"/><path d="M20 5 Q26 13 20 16 Q14 13 20 5 Z" fill="#5dade2"/>`,
    futter: `<path d="M5 22 L35 22 L31 34 L9 34 Z" fill="#c0392b"/><ellipse cx="20" cy="22" rx="15" ry="4.5" fill="#8d5524"/>` + [[13, 19], [18, 17], [23, 19], [27, 18], [16, 21], [22, 21]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="2.6" fill="#a0522d" stroke="#5d3a1a" stroke-width=".8"/>`).join(""),
    leckerli: `<rect x="8" y="14" width="24" height="12" rx="6" fill="#a0522d" transform="rotate(-20 20 20)"/><path d="M12 22 L28 16" stroke="#d98c5f" stroke-width="2" transform="rotate(0)"/>`,
    hundekeks: `<path d="M9 14 a4 4 0 1 1 5 -4 L26 10 a4 4 0 1 1 5 4 a4 4 0 1 1 -5 4 L14 18 a4 4 0 1 1 -5 -4 Z" fill="#deb887" stroke="#a0784d" stroke-width="1.2" transform="translate(0 8)"/><circle cx="16" cy="22" r="1" fill="#a0784d"/><circle cx="21" cy="21" r="1" fill="#a0784d"/><circle cx="25" cy="23" r="1" fill="#a0784d"/>`,
    kauknochen: `<g transform="rotate(-25 20 20)"><rect x="10" y="17" width="20" height="6" fill="#fbf6ea" stroke="#c9b99a" stroke-width="1"/><circle cx="9" cy="16" r="4.5" fill="#fbf6ea" stroke="#c9b99a"/><circle cx="9" cy="24" r="4.5" fill="#fbf6ea" stroke="#c9b99a"/><circle cx="31" cy="16" r="4.5" fill="#fbf6ea" stroke="#c9b99a"/><circle cx="31" cy="24" r="4.5" fill="#fbf6ea" stroke="#c9b99a"/><rect x="10" y="17.5" width="20" height="5" fill="#fbf6ea"/></g>`,
    kaustange: `<g transform="rotate(-35 20 20)"><rect x="6" y="16" width="28" height="8" rx="4" fill="#b5651d"/><path d="M10 16 L14 24 M16 16 L20 24 M22 16 L26 24 M28 16 L31 22" stroke="#7b3f00" stroke-width="1.6"/></g>`,
  };
  function ladenIcon(id) {
    if (FUTTER[id]) return `<svg class="laden-bild" viewBox="0 0 40 40" aria-hidden="true">${FUTTER[id]}</svg>`;
    if (AUSSCHNITT[id]) return `<svg class="laden-bild" viewBox="${AUSSCHNITT[id]}" aria-hidden="true">${ZIMMER[id] || ""}${VORNE[id] || ""}</svg>`;
    return "";
  }
  // Goldene Münze (statt Emoji, das ältere iPads nicht kennen)
  const muenze = () => `<svg class="muenze" viewBox="0 0 24 24" aria-hidden="true"><defs><radialGradient id="ln-gold" cx="35%" cy="30%" r="75%"><stop offset="0" stop-color="#fff6c2"/><stop offset=".45" stop-color="#f6c744"/><stop offset="1" stop-color="#c98b0b"/></radialGradient></defs><circle cx="12" cy="12" r="11" fill="url(#ln-gold)" stroke="#a87405" stroke-width="1.2"/><circle cx="12" cy="12" r="7.6" fill="none" stroke="#d9a21b" stroke-width="1.2"/><g fill="#b07c08"><ellipse cx="12" cy="14.2" rx="3" ry="2.4"/><circle cx="8.6" cy="10.6" r="1.3"/><circle cx="10.8" cy="8.9" r="1.3"/><circle cx="13.2" cy="8.9" r="1.3"/><circle cx="15.4" cy="10.6" r="1.3"/></g></svg>`;

  root.LN_TIER = { ARTEN, tierSvg, zimmerSvg, ladenIcon, muenze, ZUBEHOER: Object.keys(ZUBEHOER), ZIMMER: Object.keys(ZIMMER).concat(Object.keys(VORNE).filter((k) => !ZIMMER[k])) };
})(typeof window !== "undefined" ? window : globalThis);
