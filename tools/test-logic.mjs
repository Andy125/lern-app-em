// Tests der Logik: Inhalte gültig, jede Aufgabe unabhängig nachgerechnet, Rechtschreibung, Speicher, Plan.
// Aufruf: node tools/test-logic.mjs
import { ladeLogik, pruefer } from "./lade.mjs";

const { L, FAECHER } = ladeLogik();
const { ok, ende } = pruefer("Logik");
const SEEDS = 40;

ok(FAECHER.length >= 1, "mindestens ein Fach geladen");

// ---------- Inhalte gültig ----------
for (const fach of FAECHER) {
  const F = fach.id;
  ok(typeof fach.name === "string" && fach.name && fach.icon, `${F}: Name und Icon`);
  ok(Array.isArray(fach.themen) && fach.themen.length >= 1, `${F}: hat Themen`);
  const ids = new Set();
  for (const th of fach.themen) {
    ok(th.id && th.name && Array.isArray(th.karten) && th.karten.length, `${F}/${th.id}: Thema mit Karten`);
    if (th.warum) ok(th.warum.frage && th.warum.text, `${F}/${th.id}: Warum-Einstieg mit Frage und Text`);
    if (th.fakten) ok(Array.isArray(th.fakten) && th.fakten.every((x) => typeof x === "string" && x.length > 10), `${F}/${th.id}: Fakten sind Sätze`);
    for (const k of th.karten) {
      const K = `${F}/${k.id}`;
      ok(!ids.has(k.id), `${K}: Karten-ID eindeutig`); ids.add(k.id);
      ok(L.TYPEN.includes(k.typ) || k.typ === "auftrag", `${K}: Typ bekannt (${k.typ})`);
      if (k.typ === "auftrag") ok(k.titel && k.text && ["basteln", "forschen", "bewegen"].includes(k.art), `${K}: Auftrag mit Titel, Text und Art`);
      // Platzhalter für den Hundenamen nur in Texten, nie in Lösungen, Optionen oder Lücken
      const loesungsFelder = JSON.stringify([k.begriff, k.antwort, k.falsch, k.paare, k.gruppen, k.schritte, k.text && k.typ === "luecke" ? k.text : "", k.marken, k.auch, k.en, k.de, k.auchEn, k.typ === "vokabel" ? k.satz : ""]);
      ok(!/\{hund/.test(loesungsFelder), `${K}: {hund} nicht in Lösungen oder Lücken`);
      ok(!/\{(?!hund3?\})[^}]*\}/.test(JSON.stringify([k.warum, k.merk, k.tipp, k.erklaerung, k.bedeutung, k.frage, k.typ === "vokabel" ? "" : k.satz, k.korrektur, k.titel, k.typ === "auftrag" ? k.text : ""])), `${K}: nur bekannte Platzhalter`);
      if (k.typ === "begriff") ok(k.begriff && k.bedeutung, `${K}: Begriff und Bedeutung`);
      if (k.typ === "frage") {
        ok(k.frage && k.antwort && Array.isArray(k.falsch) && k.falsch.length >= 2, `${K}: Frage, Antwort, mind. 2 falsche`);
        ok(!k.falsch.some((x) => L.norm(x) === L.norm(k.antwort)), `${K}: richtige Antwort nicht unter den falschen`);
      }
      if (k.typ === "zahl") ok(k.frage && typeof k.antwort === "number", `${K}: Zahl-Frage`);
      if (k.typ === "wahr") ok(k.satz && typeof k.wahr === "boolean" && (k.wahr || k.korrektur), `${K}: Satz, wahr/falsch, Korrektur bei falsch`);
      if (k.typ === "paare") {
        ok(k.paare.length >= 3, `${K}: mind. 3 Paare`);
        ok(new Set(k.paare.map((p) => L.norm(p[0]))).size === k.paare.length, `${K}: linke Seiten eindeutig`);
        ok(new Set(k.paare.map((p) => p[1])).size >= 3, `${K}: mind. 3 verschiedene rechte Seiten`);
      }
      if (k.typ === "gruppen") {
        const alle = Object.values(k.gruppen).flat();
        ok(Object.keys(k.gruppen).length >= 2, `${K}: mind. 2 Gruppen`);
        ok(new Set(alle.map(L.norm)).size === alle.length, `${K}: kein Eintrag in zwei Gruppen`);
      }
      if (k.typ === "reihe") ok(k.schritte.length >= 3 && new Set(k.schritte).size === k.schritte.length, `${K}: mind. 3 verschiedene Schritte`);
      if (k.typ === "luecke") {
        const luecken = [...String(k.text).matchAll(/\{([^}]+)\}/g)].map((m) => m[1]);
        ok(luecken.length >= 1, `${K}: mind. eine Lücke`);
        ok(!(k.extra || []).some((x) => luecken.includes(x)), `${K}: Extra-Wörter sind keine Lösungen`);
      }
      if (k.typ === "vokabel") {
        ok(k.en && k.de, `${K}: Vokabel mit en und de`);
        if (k.satz) ok((String(k.satz).match(/\{[^}]+\}/g) || []).length === 1, `${K}: Satz mit genau einer Lücke`);
      }
      // Mathe: erzeugte Aufgaben brauchen einen Titel und gültige Bereiche
      if (["teilen", "detektiv", "ueberschlag", "umkehr", "kopf", "sach", "passt"].includes(k.typ)) ok(typeof k.titel === "string" && k.titel.length > 3, `${K}: Titel für die Übersicht`);
      if (k.typ === "teilen" || k.typ === "detektiv" || k.typ === "ueberschlag") {
        const [s1, s2] = [].concat(k.stellen), [d1, d2] = [].concat(k.divisor);
        ok(s1 >= 3 && (s2 || s1) <= 6 && d1 >= 2 && (d2 || d1) <= 99, `${K}: Stellen und Divisor im Rahmen (Divisor höchstens zweistellig)`);
      }
      if (k.typ === "sach") {
        ok(k.text && /\{a\}/.test(k.text) && /\{b\}/.test(k.text) && k.frage && ["q", "r", "auf"].includes(k.antwort), `${K}: Sachaufgabe mit {a}, {b}, Frage und Antwortart`);
        if (k.antwort !== "q") ok(k.rest === true, `${K}: «${k.antwort}» braucht einen Rest`);
      }
      if (k.typ === "bild") {
        ok(k.svg && k.viewBox && k.marken.length >= 3, `${K}: Bild mit mind. 3 Marken`);
        ok(new Set(k.marken.map((m) => m.nr)).size === k.marken.length, `${K}: Nummern eindeutig`);
        ok(new Set(k.marken.map((m) => L.norm(m.begriff))).size === k.marken.length, `${K}: Begriffe eindeutig`);
        const [, , w, h] = k.viewBox.split(/\s+/).map(Number);
        ok(k.marken.every((m) => m.x >= 0 && m.y >= 0 && m.x <= w && m.y <= h), `${K}: Marken im Bild`);
        // Marken nicht übereinander: Tippfläche hat Radius 20 in Bildeinheiten, also mind. 40 Abstand
        for (const a of k.marken) for (const b of k.marken) if (a.nr < b.nr) ok(Math.hypot(a.x - b.x, a.y - b.y) >= 40, `${K}: Marken ${a.nr} und ${b.nr} liegen zu nah`);
      }
    }
  }
  const vok = fach.themen.flatMap((t) => t.karten).filter((k) => k.typ === "vokabel");
  ok(new Set(vok.map((k) => k.en.toLowerCase())).size === vok.length, `${F}: englische Wörter eindeutig`);
  ok(new Set(vok.map((k) => L.norm(k.de))).size === vok.length, `${F}: deutsche Bedeutungen eindeutig`);
  ok(vok.length === 0 || vok.length >= 4, `${F}: 0 oder mind. 4 Vokabeln (für Auswahl)`);
  const begriffKarten = fach.themen.flatMap((t) => t.karten).filter((k) => k.typ === "begriff");
  ok(begriffKarten.length === 0 || begriffKarten.length >= 3, `${F}: 0 oder mind. 3 Begriffe (für Auswahl)`);
  // Erklär-Folien: Titel, Inhalt, Beispielrechnungen und Check
  for (const th of fach.themen) for (const fo of th.erklaerung || []) {
    const E = `${F}/${th.id}/Erklärung «${fo.titel}»`;
    ok(fo.titel && (fo.text || fo.bild || fo.rechnung || fo.check), `${E}: Titel und Inhalt`);
    if (fo.bild) ok(/^<svg viewBox="0 0 \d+ \d+"/.test(fo.bild) && !/NaN|undefined/.test(fo.bild), `${E}: Bild ist ein gültiges SVG`);
    if (fo.rechnung) { const D = L.divSchritte(fo.rechnung.a, fo.rechnung.b); ok(fo.rechnung.bis === "alles" || (fo.rechnung.bis >= 0 && fo.rechnung.bis < L.divAblauf(D).length), `${E}: Beispielrechnung bis zu einem gültigen Schritt`); }
    if (fo.check) ok(fo.check.frage && fo.check.antwort && fo.check.falsch.length >= 2 && !fo.check.falsch.includes(fo.check.antwort), `${E}: Check mit einer richtigen und mind. zwei falschen Antworten`);
    ok(!/[\u2013\u2014]/.test(JSON.stringify(fo).replace(/<svg[^]*?<\/svg>/g, "")), `${E}: keine langen Gedankenstriche`);
  }
  for (const th of fach.themen) if (th.erklaerung) ok(th.erklaerung.some((fo) => fo.check), `${F}/${th.id}: Erklärung endet mit einem Check`);
}

// ---------- Mathe: schriftlich dividieren, unabhängig nachgerechnet ----------
// Schriftliche Division als Zeichenkette, ohne den Code der App
function langDivision(a, b) {
  const d = String(a); let i = 0, teil = Number(d[0]);
  while (teil < b && i < d.length - 1) { i++; teil = teil * 10 + Number(d[i]); }
  const out = [];
  for (;;) { const z = Math.floor(teil / b); out.push([teil, z, z * b, teil - z * b]); if (i === d.length - 1) break; i++; teil = (teil - z * b) * 10 + Number(d[i]); }
  return out;
}
const zahlAus = (txt) => Number(String(txt).replace(/[\s\u00a0]/g, ""));
{
  ok(JSON.stringify(langDivision(4218, 6)) === "[[42,7,42,0],[1,0,0,1],[18,3,18,0]]", "Beispiel 4218 : 6 von Hand");
  for (const [a, b] of [[4218, 6], [157, 4], [989, 43], [864, 12], [100000, 7], [12, 5], [7007, 7], [98765, 99]]) {
    const D = L.divSchritte(a, b);
    ok(D.quotient === Math.floor(a / b) && D.rest === a % b, `${a} : ${b} = ${Math.floor(a / b)} Rest ${a % b}`);
    ok(JSON.stringify(D.schritte.map((s) => [s.teil, s.ziffer, s.produkt, s.diff])) === JSON.stringify(langDivision(a, b)), `${a} : ${b}: Schritte wie von Hand`);
    const ab = L.divAblauf(D);
    ok(ab.length === 1 + 4 * D.schritte.length, `${a} : ${b}: Start, je Schritt Teilen, Mal, Minus, Runter (außer am Ende), Fertig`);
  }
  ok(L.zahlText(4218) === "4218" && L.zahlText(12500) === "12\u00a0500" && L.zahlText(1234567) === "1\u00a0234\u00a0567", "Zahlen wie im Schulbuch");
}
// ---------- Geometrie: aus den Koordinaten unabhängig nachgeprüft ----------
const amRand = (P) => Math.abs(P[0]) < 1e-9 || Math.abs(P[1]) < 1e-9 || Math.abs(P[0] - L.GEO.C) < 1e-9 || Math.abs(P[1] - L.GEO.Z) < 1e-9;
const gleich = (P, Q) => Math.abs(P[0] - Q[0]) < 1e-9 && Math.abs(P[1] - Q[1]) < 1e-9;
const lageAus = (a, b) => (a[0] * b[0] + a[1] * b[1] === 0 ? "senkrecht" : a[0] * b[1] - a[1] * b[0] === 0 ? "parallel" : "schraeg");
function pruefeGeo(teil, t, T) {
  ok(/^<svg viewBox="0 0 \d+ \d+"/.test(t.bild) && !/NaN|undefined|Infinity/.test(t.bild), `${T}: Bild ist ein gültiges SVG`);
  const g = t.geo;
  if (t.modus === "linie-wahl") {
    const [a, b] = g.von, typ = amRand(a) && amRand(b) ? "Gerade" : amRand(a) || amRand(b) ? "Strahl" : "Strecke";
    ok(typ === g.typ && t.loesung === typ + " AB", `${T}: Linie ist wirklich eine ${g.typ}`);
    if (typ === "Strecke") ok((gleich(a, g.A) && gleich(b, g.B)) || (gleich(a, g.B) && gleich(b, g.A)), `${T}: Strecke endet an A und B`);
    if (typ === "Strahl") ok(gleich(a, g.A) && !amRand(g.B), `${T}: Strahl beginnt bei A und läuft über B hinaus`);
  }
  if (t.modus === "linie-zaehlen") {
    const art = ([a, b]) => (amRand(a) && amRand(b) ? "Gerade" : amRand(a) || amRand(b) ? "Strahl" : "Strecke");
    ok(g.linien.every((l) => art(l.von) === l.typ), `${T}: jede Linie hat die Enden ihrer Art`);
    ok(t.loesung === g.linien.filter((l) => l.typ === g.frageTyp).length && g.linien.length >= 3, `${T}: richtig gezählt`);
  }
  if (t.modus === "lage-wahl") {
    const [a, b] = g.linien, lage = lageAus(a.d, b.d);
    ok(lage === g.lage && t.loesung === t.optionen[["senkrecht", "parallel", "schraeg"].indexOf(lage)], `${T}: Lage ${lage} stimmt`);
    if (lage === "parallel") ok((b.p[0] - a.p[0]) * a.d[1] - (b.p[1] - a.p[1]) * a.d[0] !== 0, `${T}: zwei verschiedene Parallelen`);
    if (lage === "schraeg") { const c = Math.abs(a.d[0] * b.d[0] + a.d[1] * b.d[1]) / Math.hypot(...a.d) / Math.hypot(...b.d); ok(c > 0.4 && c < 0.93, `${T}: deutlich schräg, nicht fast senkrecht oder fast parallel`); }
  }
  if (t.modus === "welche-wahl") {
    const [gg, ...rest] = g.linien;
    const passen = rest.filter((l) => lageAus(gg.d, l.d) === g.nach).map((l) => l.name);
    ok(passen.length === 1 && passen[0] === t.loesung, `${T}: genau eine Gerade ist ${g.nach} zu g (${passen.join(",")})`);
  }
  if (t.modus === "abstand-zahl" || t.modus === "abstand-parallel") {
    const quer = g.waag ? (g.punkt ? g.punkt.y : g.h[1]) : g.punkt ? g.punkt.x : g.h[0];
    ok(Math.abs(t.loesung - Math.abs(quer - g.lage) / 2) < 1e-9 && L.check(t, String(t.loesung).replace(".", ",")).ok, `${T}: Abstand ${t.loesung} cm stimmt und wird mit Komma angenommen`);
  }
  if (t.modus === "abstand-wahl") {
    const senk = g.linien.map(([P, Q], i) => ({ nr: String(i + 1), senk: g.waag ? P[0] === Q[0] : P[1] === Q[1] }));
    ok(senk.filter((x) => x.senk).length === 1 && senk.find((x) => x.senk).nr === t.loesung, `${T}: nur der richtige Weg steht senkrecht auf g`);
  }
}
function pruefeMathe(fach, teil, t, T) {
  const k = teil.karte;
  const bereich = (x, v) => { const [u, o] = [].concat(x); return v >= u && v <= (o == null ? u : o); };
  if (t.art === "division" || t.art === "ergebnis") {
    const [a, b] = t.text.split(" : ").map(zahlAus);
    ok(t.loesung.q === Math.floor(a / b) && t.loesung.r === a % b, `${T}: Ergebnis stimmt (${a} : ${b})`);
    ok(bereich(k.stellen, String(a).length) && bereich(k.divisor, b) && b % 10 !== 0, `${T}: Zahlen passen zur Karte (${a} : ${b})`);
    const hand = langDivision(a, b), nullDrin = hand.some((x) => x[1] === 0);
    if (k.rest === true) ok(a % b > 0, `${T}: mit Rest`);
    if (k.rest === false) ok(a % b === 0, `${T}: ohne Rest`);
    if (k.null === true) ok(nullDrin, `${T}: mit 0 im Ergebnis`);
    if (k.null === false) ok(!nullDrin, `${T}: ohne 0 im Ergebnis`);
    const anfang = String(hand[0][0]).length;
    if (k.anfang === "gross") ok(anfang === String(b).length, `${T}: Anfang so lang wie der Divisor`);
    if (k.anfang === "klein") ok(anfang === String(b).length + 1, `${T}: Anfang eine Stelle länger`);
    ok(L.check(t, { q: String(a / b | 0), r: a % b ? String(a % b) : "" }).ok, `${T}: richtige Antwort angenommen`);
    ok(!L.check(t, { q: String((a / b | 0) + 1), r: "" }).ok && !L.check(t, { q: "", r: "" }).ok, `${T}: falsche oder leere Antwort abgelehnt`);
    if (a % b) ok(!L.check(t, { q: String(a / b | 0), r: "" }).ok, `${T}: ohne Rest abgelehnt`);
    else ok(L.check(t, { q: String(a / b | 0), r: "0" }).ok, `${T}: Rest 0 gilt wie leer`);
    if (t.art === "division") {
      // Werkstatt einmal ganz durchspielen: jede richtige Eingabe passt, jede falsche wird abgelehnt
      ok(t.ablauf.length === 1 + 4 * hand.length, `${T}: Ablauf hat alle Schritte`);
      let alles = true, abgelehnt = true;
      t.ablauf.forEach((m, pos) => {
        if (m.typ === "fertig") return;
        const richtig = m.typ === "start" ? String(hand[0][0]) : m.typ === "runter" ? "runter" : String(m.wert);
        if (!L.divPruefe(t, pos, richtig).ok) alles = false;
        if (m.typ === "ziffer" || m.typ === "produkt" || m.typ === "diff") { const f = L.divPruefe(t, pos, String(m.wert + 1)); if (f.ok || !f.text) abgelehnt = false; }
        if (m.typ === "ziffer") { const h = hand[m.s]; if (h[1] !== m.wert) alles = false; }
      });
      ok(alles, `${T}: richtige Eingaben werden angenommen`);
      ok(abgelehnt, `${T}: falsche Eingaben werden mit Hinweis abgelehnt`);
      ok(t.anfaenge.includes(hand[0][0]) && t.anfaenge.length >= 2, `${T}: Anfang ist unter den Wahlmöglichkeiten`);
    }
    return;
  }
  if (t.art === "detektiv") {
    const Ly = t.layout, b = Ly.b, S = Ly.schritte;
    const falsch = [];
    if (Ly.quotientText !== S.map((s) => s.ziffer).join("")) falsch.push("q");
    let kette = true;
    S.forEach((s, i) => {
      if (s.produkt !== s.ziffer * b) falsch.push("p" + i);
      if (s.diff !== s.teil - s.produkt) falsch.push("d" + i);
      if (s.ziffer !== Math.floor(s.teil / b) && !falsch.includes("p" + i)) kette = false;
      if (i > 0 && s.teil !== S[i - 1].diff * 10 + Ly.ziffern[s.ende]) kette = false;
    });
    ok(kette, `${T}: alles außer dem Fehler ist folgerichtig gerechnet`);
    ok(falsch.length === 1 && falsch[0] === t.loesung, `${T}: genau ein Fehler, und zwar in ${t.loesung} (${falsch.join(",")})`);
    const a = Number(Ly.ziffern.join(""));
    ok(t.richtig === L.ergebnisText(Math.floor(a / b), a % b), `${T}: richtiges Ergebnis in der Erklärung`);
    ok(L.check(t, t.loesung).ok && t.zeilen.filter((z) => z !== t.loesung).every((z) => !L.check(t, z).ok), `${T}: nur die Fehlerzeile zählt`);
    if (k.fehler) ok(k.fehler.includes(t.fehlerArt), `${T}: Fehlerart passt zur Karte`);
    return;
  }
  if (t.modus === "ueberschlag-wahl") {
    const [a, b] = t.text.split(" : ").map(zahlAus), q = a / b;
    ok(q === Math.floor(q), `${T}: geht glatt auf`);
    const nah = t.optionen.filter((o) => Math.abs(Math.log10(zahlAus(o) / q)) < 0.3);
    ok(nah.length === 1 && nah[0] === t.loesung, `${T}: genau eine Option passt zur Größe von ${q}`);
    return;
  }
  if (t.modus === "plausibel") {
    const m = t.text.match(/^(.*) : (\d+) = (.*)$/); const a = zahlAus(m[1]), b = Number(m[2]), x = zahlAus(m[3]);
    ok(t.loesung === (x === a / b), `${T}: Stimmt genau dann, wenn das Ergebnis stimmt`);
    if (!t.loesung) ok(x * 5 < a / b || x > (a / b) * 5, `${T}: falsches Ergebnis ist per Überschlag erkennbar`);
    return;
  }
  if (t.modus === "umkehr") {
    const m = t.text.match(/^☐ : (\d+) = ([\d\s\u00a0]+?)(?: Rest (\d+))?$/);
    ok(!!m, `${T}: Aufgabe lesbar (${t.text})`); if (!m) return;
    const b = Number(m[1]), q = zahlAus(m[2]), r = Number(m[3] || 0);
    ok(r < b && t.loesung === q * b + r && Math.floor(t.loesung / b) === q && t.loesung % b === r, `${T}: fehlende Zahl stimmt`);
    return;
  }
  if (t.modus === "kopf") {
    const [a, b] = t.text.replace(" = ?", "").split(" : ").map(zahlAus);
    ok(t.loesung === a / b && a % b === 0, `${T}: Kopfrechnung stimmt (${a} : ${b})`);
    return;
  }
  if (t.modus === "sach") {
    const muster = new RegExp("^" + k.text.replace(/[.*+?^$()|[\]\\]/g, "\\$&").replace(/\{(?!a\}|b\})/g, "\\{").replace("{a}", "([\\d\\s\\u00a0]+)").replace("{b}", "([\\d\\s\\u00a0]+)") + "$");
    const m = t.text.match(muster);
    ok(!!m, `${T}: Zahlen im Text gefunden`); if (!m) return;
    const posA = k.text.indexOf("{a}"), posB = k.text.indexOf("{b}");
    const a = zahlAus(posA < posB ? m[1] : m[2]), b = zahlAus(posA < posB ? m[2] : m[1]);
    ok(bereich(k.a, a) && bereich(k.b, b), `${T}: Zahlen im Bereich (${a}, ${b})`);
    const q = Math.floor(a / b), r = a % b;
    if (k.rest === true) ok(r > 0, `${T}: es bleibt ein Rest`);
    if (k.rest === false) ok(r === 0, `${T}: geht glatt auf`);
    ok(t.loesung === (k.antwort === "r" ? r : k.antwort === "auf" ? q + 1 : q), `${T}: Antwort stimmt (${a} : ${b}, ${k.antwort})`);
    return;
  }
  if (t.modus === "passt-wahl" || t.modus === "passt-zahl") {
    const m = t.frage.match(/die (\d+) in (\d+)\?/); const b = Number(m[1]), n = Number(m[2]);
    ok(n < 10 * b && String(t.loesung) === String(Math.floor(n / b)), `${T}: ${b} passt ${Math.floor(n / b)}-mal in ${n}`);
    if (t.optionen) ok(t.optionen.filter((o) => Number(o) * b <= n && (Number(o) + 1) * b > n).length === 1, `${T}: genau eine Option passt`);
  }
}

// ---------- Unabhängige Nachrechnung jeder Aufgabe ----------
// Erwartete Lösung direkt aus den Inhalten, ohne den Code des Generators.
function erwartet(fach, teil, modus, t) {
  const k = teil.karte;
  switch (modus) {
    case "begriff-wahl": case "begriff-schreiben": return k.begriff;
    case "erklaerung-wahl": return k.bedeutung;
    case "frage-wahl": case "frage-schreiben": return k.antwort;
    case "zahl": return k.antwort;
    case "wahr": return k.wahr;
    case "paar-wahl": return k.paare[teil.teil][1];
    case "gruppe-wahl": { const x = L.gruppenListe(k)[teil.teil][0]; return Object.keys(k.gruppen).find((g) => k.gruppen[g].includes(x)); }
    case "bild-wahl": case "bild-schreiben": { const nr = Number((t.frage.match(/Nummer (\d+)/) || [])[1]); return k.marken.find((m) => m.nr === nr).begriff; }
    case "bild-tippen": { const b = t.frage.replace("Tippe auf: ", ""); return k.marken.find((m) => m.begriff === b).nr; }
    case "reihe": return k.schritte;
    case "en-de-wahl": return k.de;
    case "de-en-wahl": case "de-en-schreiben": return k.en;
    case "satz-wahl": return (String(k.satz).match(/\{([^}]+)\}/) || [])[1];
    default: return undefined;
  }
}

let anzahl = 0;
for (const fach of FAECHER) {
  const teile = L.fachTeile(fach);
  const begriffe = L.alleBegriffe(fach);
  for (const teil of teile) for (const modus of new Set(L.modi(teil.karte))) for (let seed = 1; seed <= SEEDS; seed++) {
    const T = `${fach.id}/${teil.id}/${modus}/${seed}`;
    const t = L.makeTask(fach, teil.id, modus, seed);
    anzahl++;
    if (!t) { ok(false, `${T}: Aufgabe entsteht`); continue; }
    ok(JSON.stringify(t) === JSON.stringify(L.makeTask(fach, teil.id, modus, seed)), `${T}: gleicher Startwert, gleiche Aufgabe`);
    ok(t.frage && t.tipp && t.erklaerung, `${T}: Frage, Tipp und Erklärung vorhanden`);
    const e = erwartet(fach, teil, modus, t);
    if (L.TYPEN.indexOf(teil.karte.typ) >= L.TYPEN.indexOf("linie")) pruefeGeo(teil, t, T);
    else if (L.TYPEN.indexOf(teil.karte.typ) >= L.TYPEN.indexOf("teilen")) pruefeMathe(fach, teil, t, T);
    if (e !== undefined) ok(JSON.stringify(t.loesung) === JSON.stringify(e), `${T}: Lösung stimmt mit Inhalt (${JSON.stringify(t.loesung)} statt ${JSON.stringify(e)})`);
    switch (t.art) {
      case "wahl": {
        ok(t.optionen.length >= 2, `${T}: mind. 2 Optionen`);
        ok(new Set(t.optionen.map(L.norm)).size === t.optionen.length, `${T}: Optionen verschieden`);
        ok(t.optionen.filter((o) => o === t.loesung).length === 1, `${T}: Lösung genau einmal unter den Optionen`);
        ok(L.check(t, t.loesung).ok, `${T}: richtige Option wird angenommen`);
        for (const o of t.optionen) if (o !== t.loesung) ok(!L.check(t, o).ok, `${T}: falsche Option «${o}» wird abgelehnt`);
        // Keine falsche Option darf inhaltlich ebenfalls richtig sein
        if (modus === "paar-wahl") { const links = teil.karte.paare[teil.teil][0]; ok(t.optionen.filter((o) => teil.karte.paare.some((p) => p[0] === links && p[1] === o)).length === 1, `${T}: nur eine passende Gruppe`); }
        if (modus === "gruppe-wahl") { const x = t.text; ok(t.optionen.filter((g) => teil.karte.gruppen[g].includes(x)).length === 1, `${T}: Merkmal passt nur zu einer Gruppe`); }
        if (modus === "satz-wahl") {
          ok(t.text.includes("___") && !t.text.includes("{"), `${T}: Lückensatz mit Lücke`);
          // falsche Optionen stammen aus der anderen Wortart, damit sie nicht auch passen
          const vk = L.vokabelnFach(fach);
          for (const o of t.optionen) if (o !== t.loesung) { const q = vk.find((x) => L.satzLuecke(x) === o); ok(!q || L.istVerb(q) !== L.istVerb(teil.karte), `${T}: «${o}» ist andere Wortart`); }
        }
        if (modus === "en-de-wahl" || modus === "de-en-wahl") ok(t.optionen.length === 4, `${T}: 4 Optionen`);
        if (modus === "begriff-wahl") ok(!t.optionen.some((o) => o !== t.loesung && L.norm(o) === L.norm(t.loesung)), `${T}: kein doppelter Begriff`);
        break;
      }
      case "mehr": {
        const g = teil.karte.gruppen[t.gruppe];
        ok(t.loesung.every((x) => g.includes(x)), `${T}: alle Lösungen gehören zu ${t.gruppe}`);
        ok(t.optionen.filter((x) => !t.loesung.includes(x)).every((x) => !g.includes(x)), `${T}: keine richtige Antwort fehlt in der Lösung`);
        ok(t.loesung.length >= 1 && t.optionen.length > t.loesung.length, `${T}: es gibt Richtige und Falsche`);
        ok(L.check(t, t.loesung).ok && !L.check(t, t.optionen).ok, `${T}: Prüfung mehrfach`);
        break;
      }
      case "paare": {
        for (const l of t.links) ok(teil.karte.paare.some((p) => p[0] === l && p[1] === t.loesung[l]), `${T}: Paar ${l} stimmt mit Inhalt`);
        ok(t.links.includes(teil.karte.paare[teil.teil][0]), `${T}: Fokus-Paar ist dabei`);
        ok(new Set(t.rechts).size === t.rechts.length && t.rechts.length === t.links.length, `${T}: rechte Seiten eindeutig`);
        ok(t.links.length >= 2, `${T}: mind. 2 Paare`);
        ok(L.check(t, t.loesung).ok, `${T}: richtige Zuordnung angenommen`);
        const tausch = Object.assign({}, t.loesung); const [a, b] = t.links; [tausch[a], tausch[b]] = [tausch[b], tausch[a]];
        ok(!L.check(t, tausch).ok, `${T}: vertauschte Zuordnung abgelehnt`);
        break;
      }
      case "reihe":
        ok(t.items.length === t.loesung.length && t.items.slice().sort().join("|") === t.loesung.slice().sort().join("|"), `${T}: gleiche Schritte`);
        ok(t.items.some((x, i) => x !== t.loesung[i]), `${T}: nicht schon richtig sortiert`);
        ok(L.check(t, t.loesung).ok && !L.check(t, t.items).ok, `${T}: Prüfung Reihenfolge`);
        break;
      case "luecke": {
        let i = 0; const satz = t.teile.map((x) => (x === null ? t.loesung[i++] : x)).join("");
        ok(satz === String(teil.karte.text).replace(/[{}]/g, ""), `${T}: Lösung ergibt den Text`);
        ok(t.loesung.every((w) => t.bank.includes(w)), `${T}: alle Wörter in der Wortbank`);
        ok(L.check(t, t.loesung).ok, `${T}: Prüfung Lücke`);
        if (t.loesung.length >= 2 && new Set(t.loesung).size > 1) ok(!L.check(t, t.loesung.slice().reverse()).ok, `${T}: vertauscht abgelehnt`);
        break;
      }
      case "schreiben": {
        const r = L.check(t, t.loesung);
        ok(r.ok && r.exakt, `${T}: genaue Schreibweise ist richtig und exakt`);
        if (t.sprache === "en") {
          const ohneBuchstabe = t.loesung.replace(/[A-Za-z](?=[^A-Za-z]*$)/, "");
          ok(!L.check(t, ohneBuchstabe).ok, `${T}: Englisch: ein Buchstabe fehlt ist falsch`);
          ok(!L.check(t, "").ok, `${T}: leer ist nicht richtig`);
          // andere Wörter gelten nicht, außer sie haben alle gezeigten Bedeutungen (dann stehen sie in t.auch)
          if (seed === 1) for (const v of L.vokabelnFach(fach)) if (v.en !== t.loesung && !(t.auch || []).includes(v.en)) ok(!L.check(t, v.en).ok, `${T}: anderes Wort «${v.en}» falsch`);
          break;
        }
        ok(L.check(t, t.loesung.toLowerCase()).ok, `${T}: klein geschrieben erkennbar`);
        ok(!L.check(t, "").ok, `${T}: leer ist nicht richtig`);
        for (const b of begriffe) if (L.kern(b) !== L.kern(t.loesung) && !(t.auch || []).some((a) => L.kern(a) === L.kern(b))) ok(!L.check(t, b).ok, `${T}: anderer Begriff «${b}» wird nicht angenommen`);
        break;
      }
      case "zahl":
        ok(L.check(t, String(t.loesung)).ok, `${T}: Zahl angenommen`);
        ok(!L.check(t, String(t.loesung + (t.toleranz || 0) + 1)).ok, `${T}: falsche Zahl abgelehnt`);
        break;
      case "wahr": {
        const w = teil.karte.typ === "wahr" ? teil.karte.wahr : t.loesung;
        ok(L.check(t, w).ok && !L.check(t, !w).ok, `${T}: wahr/falsch`);
        break;
      }
      case "division": case "ergebnis": case "detektiv": break; // oben in pruefeMathe
      case "tippen":
        ok(L.check(t, t.loesung).ok, `${T}: richtige Stelle angenommen`);
        for (const m of teil.karte.marken) if (m.nr !== t.loesung) ok(!L.check(t, m.nr).ok, `${T}: falsche Stelle ${m.nr} abgelehnt`);
        break;
      default: ok(false, `${T}: unbekannte Art ${t.art}`);
    }
  }
}
ok(anzahl > 100, `genug Aufgaben geprüft (${anzahl})`);

// ---------- Rechtschreibung (nachsichtig, aber kein anderer Begriff) ----------
const W = (e, z, andere) => L.pruefeWort(e, z, { andere: andere || [] });
ok(W("Blüte", "die Blüte").ok && W("Blüte", "die Blüte").exakt, "Blüte exakt (ohne Artikel)");
ok(W("die Blüte", "die Blüte").exakt, "mit Artikel exakt");
ok(W("blüte", "die Blüte").ok && !W("blüte", "die Blüte").exakt, "klein: erkennbar, nicht exakt");
for (const [e, z] of [["Bluete", "Blüte"], ["Blühte", "Blüte"], ["Amfibien", "Amphibien"], ["Reptilin", "Reptilien"], ["Kaulquape", "Kaulquappe"], ["Kaulkwappe", "Kaulquappe"], ["Bestaubung", "Bestäubung"], ["Fruchtknotten", "Fruchtknoten"], ["Säugetire", "Säugetiere"], ["Wirbeltir", "Wirbeltier"], ["Kelchblat", "Kelchblatt"]])
  ok(W(e, z).ok, `«${e}» wird als «${z}» erkannt`);
for (const [e, z] of [["Fisch", "Frosch"], ["Narbe", "Nabel"], ["Griff", "Griffel"], ["Blatt", "Blüte"], ["wechselwarm", "gleichwarm"], ["Kelchblatt", "Kronblatt"], ["xyz", "Pollen"], ["Pol", "Pollen"]])
  ok(!W(e, z).ok, `«${e}» wird nicht als «${z}» angenommen`);
ok(!W("Kronblat", "Kelchblatt", ["Kronblatt"]).ok, "näher an einem anderen Begriff: abgelehnt");
ok(L.pruefeWort("Blüte", "Blüte", { streng: true }).ok && L.pruefeWort("die  Blüte ", "die Blüte", { streng: true }).ok, "streng: genau ist richtig");
ok(!L.pruefeWort("blüte", "Blüte", { streng: true }).ok && !L.pruefeWort("Bluete", "Blüte", { streng: true }).ok, "streng: klein oder ue ist falsch");
ok(W("Blütenstaub", "Pollen", []).ok === false && L.pruefeWort("Blütenstaub", "der Pollen", { auch: ["Blütenstaub"] }).exakt, "Alternative mit auch");
// Kein Begriff eines Fachs wird für einen anderen angenommen
for (const fach of FAECHER) {
  const b = L.alleBegriffe(fach);
  for (const z of b) for (const e of b) if (z !== e) ok(!W(e, z, b.filter((x) => x !== z)).ok, `${fach.id}: «${e}» gilt nicht als «${z}»`);
}
{
  const E = L.pruefeEnglisch;
  ok(E("dog", "dog").ok && E(" dog ", "dog").ok, "Englisch: genau richtig");
  ok(!E("Dog", "dog").ok && E("Dog", "dog").grossKlein, "Englisch: Großschreibung zählt (englische Nomen klein)");
  ok(E("bark", "to bark").ok && E("to bark", "to bark").ok && E("the dog", "dog").ok, "Englisch: to, a, the dürfen fehlen oder dabei sein");
  ok(!E("dgo", "dog").ok && E("dgo", "dog").fast, "Englisch: Buchstabendreher ist falsch, aber fast");
  ok(E("Good girl", "Good girl!").ok && E("leash", "lead", ["leash"]).ok, "Englisch: Satzzeichen egal, Alternativen zählen");
  ok(!E("cat", "dog").ok && !E("", "dog").ok, "Englisch: anderes Wort und leer falsch");
}
ok(L.parseZahl("1.000") === 1000 && L.parseZahl("3,5") === 3.5 && L.parseZahl("12 500") === 12500 && isNaN(L.parseZahl("zwölf")), "Zahlen lesen");

// ---------- Spielstand ----------
for (const roh of [null, undefined, "kaputt", 42, [], { muenzen: "abc" }, { fortschritt: "x" }, { tage: { "kein-datum": {} } }]) {
  const s = L.migrate(roh);
  ok(s.v === 1 && s.muenzen >= 0 && typeof s.fortschritt === "object" && s.einst.etappe >= 3, `migrate(${JSON.stringify(roh)}) liefert gültigen Stand`);
}
{
  const s = L.migrate({ name: "Kim", muenzen: -4, punkte: 12.7, besitz: ["krone", "krone", 5], traegt: ["krone", "brille"], tier: { art: "katze", name: "Mia" }, einst: { etappe: 99, ruhig: true, vorlesen: "ja" }, unbekannt: 1, fortschritt: { bio: { a: { box: 9, sterne: 2, n: 3 } } }, plan: { bio: { arbeit: "2026-12-01", start: "falsch" } } });
  ok(s.name === "Kim" && s.muenzen === 0 && s.punkte === 12, "Zahlen werden bereinigt");
  ok(s.besitz.length === 1 && s.traegt.join() === "krone", "Besitz ohne Doppelte, getragen nur, was man hat");
  ok(s.einst.etappe === 12 && s.einst.ruhig === true && s.einst.vorlesen === false, "Einstellungen begrenzt");
  ok(!("unbekannt" in s), "Unbekannte Felder fallen weg");
  ok(s.fortschritt.bio.a.box === 5 && s.fortschritt.bio.a.sterne === 2, "Fortschritt begrenzt und erhalten");
  ok(s.plan.bio.arbeit === "2026-12-01" && s.plan.bio.start === null, "Plan-Daten geprüft");
  const zweimal = L.migrate(JSON.parse(JSON.stringify(s)));
  ok(JSON.stringify(zweimal) === JSON.stringify(s), "migrate ist stabil (zweimal gleich)");
}
{
  const s = L.defaults();
  L.record(s, "f", "x", false, "2026-11-12");
  ok(s.fehler.f.includes("x"), "Fehler kommt in die Fehlerkiste");
  L.record(s, "f", "x", true, "2026-11-12");
  ok(s.fehler.f.includes("x"), "einmal richtig: bleibt in der Kiste");
  L.record(s, "f", "x", true, "2026-11-13");
  ok(!s.fehler.f.includes("x"), "zweimal hintereinander richtig: raus aus der Kiste");
  for (let i = 0; i < 6; i++) L.record(s, "f", "y", true, "2026-11-13");
  const st = s.fortschritt.f.y.sterne;
  L.record(s, "f", "y", false, "2026-11-14"); L.record(s, "f", "y", false, "2026-11-14");
  ok(st === 3 && s.fortschritt.f.y.sterne === 3, "Sterne gehen nicht verloren");
}
{
  const s = L.defaults(); s.muenzen = 4;
  ok(!L.kaufe(s, "kuchen").ok && s.muenzen === 4, "zu wenig Münzen: nichts passiert");
  ok(L.kaufe(s, "apfel").ok && s.muenzen === 1 && s.gefuettert === 1, "Snack kaufen und füttern");
  s.muenzen = 100;
  ok(L.kaufe(s, "brille").ok && s.traegt.includes("brille") && L.kaufe(s, "brille").grund === "schon", "Zubehör nur einmal");
  ok(L.stufe(0) === 0 && L.stufe(300) === 1 && L.stufe(2499) === 2 && L.stufe(9999) === 3, "Wachstums-Stufen");
}

// ---------- Laden für den Hund, Hundefreunde ----------
{
  const zub = L.SHOP.zubehoer, zim = L.SHOP.hund.zimmer;
  ok(zub.length === 17 && zim.length === 20, `doppelt so viel im Laden (${zub.length} Outfit-Teile, ${zim.length} Zimmer-Sachen)`);
  ok(new Set(zub.map((d) => d.id)).size === zub.length && new Set(zim.map((d) => d.id)).size === zim.length, "jede Sache nur einmal im Laden");
  ok(zub.every((d) => d.platz) && zub.every((d) => d.preis >= 30) && zim.every((d) => d.preis >= 25), "jedes Outfit-Teil hat eine Körperstelle, nichts ist geschenkt");
  const summe = zub.concat(zim).reduce((a, d) => a + d.preis, 0) + L.FREUNDE.reduce((a, f) => a + f.preis, 0);
  ok(summe > 8000, `alles zusammen kostet viel (${summe} Münzen), das reicht für viele Wochen`);
  ok(L.FREUNDE.length === 12 && L.FREUNDE.every((f) => f.name && f.rasse && f.fakt && f.trick && f.motto), "zwölf Hundefreunde mit Steckbrief");
  const s = L.defaults(); s.tier = { art: "hund", name: "X" }; s.muenzen = 5000;
  ok(L.kaufe(s, "krone").grund === "bedingung" && s.muenzen === 5000, "Krone erst ab Level 8, auch mit genug Münzen");
  s.punkte = L.levelStart(8);
  ok(L.kaufe(s, "krone").ok, "ab Level 8 gibt es die Krone");
  ok(L.kaufe(s, "partyhut").ok && s.traegt.includes("partyhut") && !s.traegt.includes("krone"), "eine Sache pro Körperstelle: der Partyhut ersetzt die Krone");
  ok(L.kaufe(s, "pulli").ok && L.kaufe(s, "hoodie").ok && s.traegt.includes("hoodie") && !s.traegt.includes("pulli") && s.traegt.includes("partyhut"), "Hoodie ersetzt den Pulli, der Hut bleibt");
  ok(L.kaufe(s, "fotowand").grund === "bedingung", "Fotowand erst mit drei Hundefreunden");
  // Einladen
  const g = L.defaults(); g.muenzen = 70;
  ok(!L.einladen(g, "lotte", "2026-11-27").ok && !g.freunde.lotte, "zu wenig Münzen: niemand kommt");
  g.muenzen = 500;
  ok(!L.einladen(g, "berta", "2026-11-27").ok, "Berner Sennenhund erst ab Level 10");
  ok(L.einladen(g, "lotte", "2026-11-27").ok && g.muenzen === 420 && g.besuch === "lotte", "Dackel eingeladen, kommt sofort zu Besuch");
  ok(!L.einladen(g, "lotte", "2026-11-27").ok && g.muenzen === 420, "niemand doppelt einladen");
  // Freundschaft wächst einmal pro Tag mit geschaffter Mission
  const r1 = L.freundschaftsTag(g, "2026-11-27"), r2 = L.freundschaftsTag(g, "2026-11-27");
  ok(r1 && r1.herzen === 1 && r2 === null, "ein Herz pro Tag, nicht mehr");
  for (const d of ["2026-11-28", "2026-11-29", "2026-11-30"]) L.freundschaftsTag(g, d);
  const m = g.muenzen, r5 = L.freundschaftsTag(g, "2026-12-01");
  ok(r5.herzen === 5 && r5.geschenk === L.LOHN.freundGeschenk && g.muenzen === m + L.LOHN.freundGeschenk, "bei fünf Herzen beste Freunde und ein Geschenk");
  ok(L.freundschaftsTag(g, "2026-12-02") === null, "mehr als fünf Herzen gibt es nicht");
  ok(L.bedingung(g, { art: "serie", wert: 5 }).soll === 5 && L.bedingung(g, { art: "freunde", wert: 3 }).ist === 1, "Bedingungen zählen richtig");
  // alter Stand ohne Freunde, kaputte Daten
  const alt = L.migrate({ v: 2, muenzen: 10, tier: { art: "hund", name: "X" } });
  ok(alt.freunde && typeof alt.freunde === "object" && alt.besuch === "" && alt.spiele.kart.best === 0 && alt.spiele.kart.siege === 0, "alter Stand bekommt Freunde und Kart");
  const kaputt = L.migrate({ v: 7, freunde: { lotte: { herzen: 99 }, quatsch: 5 }, besuch: "niemand" });
  ok(kaputt.besuch === "" && (!kaputt.freunde.lotte || kaputt.freunde.lotte.herzen <= 5) && !kaputt.freunde.quatsch, "kaputte Freunde-Daten werden repariert");
  // Kart-Siege
  const k = L.defaults(); L.spielEnde(k, "kart", 1500, 1); L.spielEnde(k, "kart", 900, 3);
  ok(k.spiele.kart.siege === 1 && k.spiele.kart.best === 1500, "Kart: Siege und Rekord");
}

// ---------- Level, Tokens, Spielhalle ----------
{
  ok([0, 99, 100, 299, 300, 599, 600, 1000].map(L.level).join() === "1,1,2,2,3,3,4,5", "Level aus XP: 100, 300, 600, 1000 …");
  for (let n = 1; n < 30; n++) ok(L.level(L.levelStart(n)) === n && L.level(L.levelStart(n + 1) - 1) === n, `Level ${n} beginnt genau bei ${L.levelStart(n)} XP`);
  ok(L.rang(1) === "Rookie" && L.rang(3) === "Explorer" && L.rang(9) === "Pro" && L.rang(20) === "Legend", "Ränge");
  ok(L.tokenNoetig(6) === 5 && L.tokenNoetig(8) === 7 && L.tokenNoetig(4) === 4, "Token: 80 % auf Anhieb (5 von 6)");
  ok(L.LOHN.richtig === 1 && L.LOHN.spaeter === 0, "Münzen nur für Richtiges auf Anhieb");
  const s = L.defaults(); const H = "2026-11-17";
  ok(!L.spielStart(s, "run", H).ok && L.spielStart(s, "run", H).grund === "tokens", "ohne Token kein Spiel");
  s.tokens = 9; s.einst.spieleProTag = 2;
  ok(L.spielStart(s, "run", H).ok && L.spielStart(s, "bloecke", H).ok && s.tokens === 7, "Spiel kostet einen Token");
  ok(L.spielStart(s, "run", H).grund === "limit" && s.tokens === 7, "Tageslimit: kein drittes Spiel, kein Token weg");
  ok(L.spielEnde(s, "run", 120).rekord && !L.spielEnde(s, "run", 80).rekord && s.spiele.run.best === 120, "Rekord wird gemerkt");
  const m = L.migrate({ tokens: -3, spiele: { run: { best: "x" } }, theme: "gibtsnicht", einst: { spieleProTag: 99 } });
  ok(m.tokens === 0 && m.spiele.run.best === 0 && m.spiele.sprung.best === 0 && m.theme === "nacht" && m.einst.spieleProTag === 20, "Spielhalle-Daten werden bereinigt");
  // Stand aus Version 5: Blöcke-Rekord bleibt erhalten, Sky Jump kommt dazu
  const alt = L.migrate({ spiele: { run: { best: 50, runden: 3 }, bloecke: { best: 900, runden: 4 } } });
  ok(alt.spiele.bloecke.best === 900 && alt.spiele.run.best === 50 && alt.spiele.sprung.runden === 0, "alter Stand: Rekorde bleiben, neues Spiel startet bei 0");
  ok(L.spielStart(Object.assign(L.defaults(), { tokens: 1 }), "sprung", H).ok, "Sky Jump kostet wie Run einen Token");
  // Erklärungen: XP einmal je Thema
  const e = L.defaults();
  ok(L.erklaerungGeschafft(e, "mathe/combo", H) && e.punkte === L.LOHN.punkteErklaerung && !L.erklaerungGeschafft(e, "mathe/combo", H) && e.punkte === L.LOHN.punkteErklaerung, "Erklärung: XP nur beim ersten Mal");
  ok(L.migrate(JSON.parse(JSON.stringify(e))).gesehen["mathe/combo"] === H && Object.keys(L.migrate({ gesehen: { x: "kaputt" } }).gesehen).length === 0, "Erklärungen bleiben gespeichert, kaputte Daten fallen weg");
  ok(L.THEMES.every((t) => t.id && t.name && t.ab >= 1) && L.THEMES.filter((t) => t.ab === 1).length >= 2, "Themes mit Freischalt-Level");
}

// ---------- Etappen und Probe ----------
for (const fach of FAECHER) {
  const s = L.defaults();
  const th = fach.themen[0].id;
  const e = L.buildEtappe(fach, s, { n: 6, seed: 5, art: "neu", themen: [th] });
  ok(e.length === Math.min(6, L.fachTeile(fach).length), `${fach.id}: Etappe hat 6 Aufgaben`);
  ok(new Set(e.map((x) => x.teil)).size === e.length, `${fach.id}: keine doppelten Lernteile`);
  ok(e.every((x) => L.makeTask(fach, x.teil, x.modus, x.seed)), `${fach.id}: alle Aufgaben der Etappe entstehen`);
  ok(e.every((x) => L.teilById(fach, x.teil).thema === th), `${fach.id}: neue Etappe bleibt im Thema`);
  ok(JSON.stringify(e) === JSON.stringify(L.buildEtappe(fach, s, { n: 6, seed: 5, art: "neu", themen: [th] })), `${fach.id}: Etappe reproduzierbar`);
  L.record(s, fach.id, e[0].teil, false, "2026-11-12");
  const k = L.buildEtappe(fach, s, { n: 6, seed: 9, art: "kiste" });
  ok(k.length === 1 && k[0].teil === e[0].teil, `${fach.id}: Kiste-Etappe nimmt nur die Fehlerkiste`);
  const f = L.buildEtappe(fach, s, { n: 6, seed: 9, art: "fehler" });
  ok(f.length === 6 && f.some((x) => x.teil === e[0].teil), `${fach.id}: Fehler-Etappe beginnt mit der Kiste und füllt auf`);
  const w = L.buildEtappe(fach, s, { n: 6, seed: 9, art: "wdh" });
  ok(w.some((x) => x.teil === e[0].teil), `${fach.id}: Wiederholung enthält den Fehler`);
  const p = L.buildProbe(fach, s, { n: 12, seed: 3 });
  ok(p.length === Math.min(12, L.fachTeile(fach).length) || p.length === 12, `${fach.id}: Probe hat 12 Aufgaben`);
  ok(L.planThemen(fach).every((t) => p.some((x) => L.teilById(fach, x.teil).thema === t.id)), `${fach.id}: Probe deckt alle Themen ab (ohne Bonus)`);
  ok(p.every((x) => !fach.themen.find((t) => t.id === L.teilById(fach, x.teil).thema).bonus) || L.planThemen(fach).some((t) => t.bonus), `${fach.id}: Probe ohne Bonus-Themen`);
  ok(p.every((x) => L.makeTask(fach, x.teil, x.modus, x.seed)), `${fach.id}: Probe-Aufgaben entstehen`);
  ok(p.every((x) => L.teilById(fach, x.teil).karte.typ !== "teilen" || x.modus === "teilen-ergebnis"), `${fach.id}: in der Probe wird auf Papier geteilt`);
  for (let i = 0; i < 6; i++) for (const x of L.fachTeile(fach)) L.record(s, fach.id, x.id, true, "2026-11-13");
  ok(L.bereitschaft(s, fach) === 100, `${fach.id}: alles sicher = 100 %`);
}

// ---------- Plan ----------
{
  const th = ["a", "b", "c"];
  const p = L.planListe("2026-11-12", "2026-11-26", th);
  ok(p.length === 15 && p[0].datum === "2026-11-12" && p[14].datum === "2026-11-26", "Plan: ein Eintrag pro Tag");
  ok(p[14].art === "mut" && p[13].art === "wiederholen" && p[12].art === "probe", "Plan: Probe, Wiederholen, Mut-Tag am Ende");
  ok(th.every((t) => p.some((e) => e.art === "lernen" && e.themen.includes(t))), "Plan: jedes Thema hat Lerntage");
  const reihenfolge = p.filter((e) => e.art === "lernen").map((e) => th.indexOf(e.themen[0]));
  ok(reihenfolge.every((x, i) => i === 0 || x >= reihenfolge[i - 1]), "Plan: Themen in Reihenfolge");
  ok(p.some((e) => e.art === "mix"), "Plan: gemischte Tage vor der Probe");
  const kurz = L.planListe("2026-11-12", "2026-11-15", ["a", "b", "c", "d"]);
  ok(kurz.length === 4 && ["a", "b", "c", "d"].every((t) => kurz.some((e) => e.art === "lernen" && e.themen.includes(t))), "kurzer Plan: alle Themen trotzdem dran");
  ok(L.planListe("2026-11-12", "2026-11-12", th).map((e) => e.art).join() === "mut", "Arbeit heute: nur Mut-Tag");
  ok(L.planTag(null, "2026-11-20", th, "2026-11-25").art === "frei", "nach der Arbeit: frei");
  ok(L.planTag(null, null, th, "2026-11-25").art === "mix", "ohne Datum: gemischt");
  ok(L.planTag("2026-11-30", "2026-12-05", th, "2026-11-20").art === "lernen", "Start in der Zukunft: ab heute planen");
  for (const tag of p) ok(L.etappenFuer(tag).length >= 1, `Etappen für ${tag.art}`);
  ok(L.tageBis("2026-03-28", "2026-03-30") === 2 && L.plusTage("2026-10-24", 2) === "2026-10-26", "Datum über Zeitumstellung");
}

ende();
