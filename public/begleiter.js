// Das Tier zum Pflegen und sein Zimmer. Alles als SVG gezeichnet, eigene Figuren, keine Bilddateien.
(function (root) {
  "use strict";

  const ARTEN = {
    hund: {
      name: "Hund", farbe: "#c8773f", bauch: "#e2a66c", dunkel: "#97521f", innen: "#e7b9a0", nase: 9,
      ohren: () => "",
      // Labrador: weiche Hängeohren, kräftiger Otterschwanz, Foxred
      ohrenVorne: (A) => `<path d="M60 52 Q40 60 42 98 Q46 116 60 112 Q72 92 74 62 Z" fill="${A.dunkel}"/><path d="M140 52 Q160 60 158 98 Q154 116 140 112 Q128 92 126 62 Z" fill="${A.dunkel}"/>`,
      schwanz: (A) => `<path class="wedel" d="M144 166 Q176 160 180 128" stroke="${A.farbe}" stroke-width="15" fill="none" stroke-linecap="round"/>`,
      gesicht: (A) => `<ellipse cx="100" cy="106" rx="25" ry="17" fill="${A.bauch}"/>`,
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
    krone: `<path d="M74 34 L78 10 L90 26 L100 6 L110 26 L122 10 L126 34 Z" fill="#f2c94c" stroke="#d4a017" stroke-width="2"/><circle cx="100" cy="24" r="3.5" fill="#e63946"/>`,
  };
  // Reihenfolge beim Zeichnen: Halstuch unten, Krone ganz oben
  const ZUBEHOER_REIHE = ["halstuch", "brille", "muetze", "schleife", "blume", "krone"];
  const GROESSE = [0.78, 0.88, 1, 1];

  function tierSvg(art, o) {
    o = o || {};
    const A = ARTEN[art] || ARTEN.katze;
    const mood = o.mood || "froh";
    const st = Math.max(0, Math.min(3, o.stufe || 0));
    const sc = GROESSE[st];
    let s = A.schwanz(A);
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
    ball: `<circle cx="318" cy="232" r="14" fill="#ef476f"/><path d="M304 232 Q318 222 332 232 M318 218 L318 246" stroke="#fff" stroke-width="3" fill="none"/>`,
  };
  const ZIMMER_REIHE = ["lichter", "bild", "regal", "teppich", "kissen", "pflanze", "bastel", "lampe", "ball"];

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
    return `<svg class="zimmer-svg" viewBox="0 0 400 260" role="img" aria-label="Zimmer">${s}</svg>`;
  }

  root.LN_TIER = { ARTEN, tierSvg, zimmerSvg, ZUBEHOER: Object.keys(ZUBEHOER), ZIMMER: Object.keys(ZIMMER) };
})(typeof window !== "undefined" ? window : globalThis);
