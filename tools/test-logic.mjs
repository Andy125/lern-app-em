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
      const loesungsFelder = JSON.stringify([k.begriff, k.antwort, k.falsch, k.paare, k.gruppen, k.schritte, k.text && k.typ === "luecke" ? k.text : "", k.marken, k.auch]);
      ok(!/\{hund/.test(loesungsFelder), `${K}: {hund} nicht in Lösungen oder Lücken`);
      ok(!/\{(?!hund3?\})[^}]*\}/.test(JSON.stringify([k.warum, k.merk, k.tipp, k.erklaerung, k.bedeutung, k.frage, k.satz, k.korrektur, k.titel, k.typ === "auftrag" ? k.text : ""])), `${K}: nur bekannte Platzhalter`);
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
  const begriffKarten = fach.themen.flatMap((t) => t.karten).filter((k) => k.typ === "begriff");
  ok(begriffKarten.length === 0 || begriffKarten.length >= 3, `${F}: 0 oder mind. 3 Begriffe (für Auswahl)`);
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
        ok(L.check(t, t.loesung.toLowerCase()).ok, `${T}: klein geschrieben erkennbar`);
        ok(!L.check(t, "").ok, `${T}: leer ist nicht richtig`);
        for (const b of begriffe) if (L.kern(b) !== L.kern(t.loesung) && !(t.auch || []).some((a) => L.kern(a) === L.kern(b))) ok(!L.check(t, b).ok, `${T}: anderer Begriff «${b}» wird nicht angenommen`);
        break;
      }
      case "zahl":
        ok(L.check(t, String(t.loesung)).ok, `${T}: Zahl angenommen`);
        ok(!L.check(t, String(t.loesung + (t.toleranz || 0) + 1)).ok, `${T}: falsche Zahl abgelehnt`);
        break;
      case "wahr":
        ok(L.check(t, teil.karte.wahr).ok && !L.check(t, !teil.karte.wahr).ok, `${T}: wahr/falsch`);
        break;
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
  ok(L.kaufe(s, "krone").ok && s.traegt.includes("krone") && L.kaufe(s, "krone").grund === "schon", "Zubehör nur einmal");
  ok(L.stufe(0) === 0 && L.stufe(300) === 1 && L.stufe(2499) === 2 && L.stufe(9999) === 3, "Wachstums-Stufen");
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
  ok(fach.themen.every((t) => p.some((x) => L.teilById(fach, x.teil).thema === t.id)), `${fach.id}: Probe deckt alle Themen ab`);
  ok(p.every((x) => L.makeTask(fach, x.teil, x.modus, x.seed)), `${fach.id}: Probe-Aufgaben entstehen`);
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
