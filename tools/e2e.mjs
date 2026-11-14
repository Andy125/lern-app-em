// Browser-Test: spielt die App wie ein Kind durch (Willkommen, Tagesmission mit Fehlern und Bewegungspause,
// Tier, Fehlerkiste, Frei üben, Lernkarten, Probe) und prüft die Eltern-Übersicht.
// Aufruf: node tools/e2e.mjs [ordner-für-screenshots]
import fs from "node:fs";
import { oeffne, einrichten, aufgabe, ansicht, stand, loese, falsch, spieleEtappe, langDruecken, pruefer, VERSION } from "./helfer.mjs";

const bilder = process.argv[2];
if (bilder) fs.mkdirSync(bilder, { recursive: true });
const { ok, ende } = pruefer("Ablauf");
const H = "2026-11-12";
const { page, fehler, zu } = await oeffne();
const FID = await page.evaluate(() => window.LN_FAECHER[0].id);
const keinPlatzhalter = async (wo) => ok(!(await page.textContent("body")).includes("{hund"), `${wo}: kein {hund}-Platzhalter sichtbar`);
const foto = async (n) => { if (bilder) await page.screenshot({ path: `${bilder}/${n}.png`, fullPage: true }); };

// ---------- Willkommen ----------
ok((await page.textContent("#version")).includes(`Version ${VERSION}`), "Versionsnummer oben sichtbar");
await foto("01-willkommen");
await page.click("[data-act=w-name]");
ok((await ansicht(page)) === "willkommen", "ohne Namen geht es nicht weiter");
await einrichten(page, "Testkind", "hund", "Flocke");
let s = await stand(page);
ok(s.name === "Testkind" && s.tier.art === "hund" && s.tier.name === "Flocke" && s.muenzen === 10, "Name, Tier und Willkommensgeschenk gespeichert");
ok((await page.textContent(".sprechblase")).includes("Wusstest du"), "Tier erzählt einen Fakt zum Thema");
await keinPlatzhalter("Start");
ok((await page.textContent(".kacheln")).includes("Flocke"), "Tiername auf der Startseite");
ok(await page.locator("[data-act=kiste]").isDisabled(), "leere Fehlerkiste ist aus");
await foto("02-start");

// ---------- Tagesmission ----------
await page.click("[data-act=mission]");
ok((await ansicht(page)) === "etappe-start" && (await page.textContent("main")).includes("Etappe 1 von 3"), "Etappe 1 von 3 startet");
const etappenFach = await page.evaluate(() => window.__LN.ui().runde.etappen.map((e) => e.fach));
ok(etappenFach[0] !== etappenFach[1] && etappenFach[1] === etappenFach[2], `gemeinsame Mission: Aufwärmen im einen Fach, Schwerpunkt im anderen (${etappenFach.join(", ")})`);
await keinPlatzhalter("Etappe 1");
await page.click("[data-act=etappe-los]");
await foto("03-aufgabe");
// erste Aufgabe: einmal falsch, dann richtig
let t = await falsch(page);
let R = await page.evaluate(() => window.__LN.ui().runde);
if (t.art === "wahr" || (t.art === "wahl" && t.optionen.length <= 2)) ok(R.status === "loesung", "bei Stimmt/Stimmt nicht gleich die Lösung");
else {
  ok(R.status === "tipp" && (await page.locator(".rueck.tipp").count()) === 1, "nach dem ersten Fehler: Tipp");
  await foto("04-tipp");
  await loese(page);
  ok((await page.evaluate(() => window.__LN.ui().runde.status)) === "richtig", "danach richtig gelöst");
}
s = await stand(page);
ok(Object.values(s.fehler).some((l) => l.includes(t.teil)), "Fehler liegt in der Fehlerkiste");
await page.click("[data-act=weiter]");
// zweite Aufgabe: zweimal falsch, dann kommt die Lösung und die Aufgabe kommt wieder
t = await aufgabe(page);
const specsVorher = await page.evaluate(() => window.__LN.ui().runde.specs.length);
await falsch(page);
if ((await page.evaluate(() => window.__LN.ui().runde.status)) === "tipp") await falsch(page);
ok((await page.evaluate(() => window.__LN.ui().runde.status)) === "loesung", "nach zwei Fehlern: Lösung mit Erklärung");
ok((await page.locator(".rueck.loesung").textContent()).length > 20, "Lösungskasten hat Text");
await foto("05-loesung");
ok((await page.evaluate(() => window.__LN.ui().runde.specs.length)) === specsVorher + 1, "Aufgabe kommt in der Etappe noch einmal");
await page.click("[data-act=weiter]");
while ((await ansicht(page)) === "runde") {
  const st = await page.evaluate(() => window.__LN.ui().runde.status);
  if (st === "richtig" || st === "loesung") await page.click("[data-act=weiter]"); else await loese(page);
}
ok((await ansicht(page)) === "etappe-ende", "Etappe 1 geschafft");
await foto("06-etappe-ende");
s = await stand(page);
ok(s.tage[H].etappen === 1 && !s.tage[H].mission, "eine Etappe gezählt");
await page.click("[data-act=bewegung]");
ok((await ansicht(page)) === "bewegung" && (await page.locator("#pause-weiter").isDisabled()), "Bewegungspause, Weiter erst nach der Zeit");
await foto("07-bewegung");
await page.waitForFunction(() => !document.getElementById("pause-weiter").disabled, null, { timeout: 5000 });
await page.click("#pause-weiter");
ok((await page.textContent("main")).includes("Etappe 2 von 3"), "Etappe 2 startet nach der Pause");
ok((await page.locator(".warum-box").count()) === 1, "Neues Thema beginnt mit der Warum-Frage");
if (etappenFach[1] === "bio") ok((await page.textContent(".warum-box")).includes("Flocke"), "Warum-Frage nennt den Hund");
await foto("07b-warum");
await spieleEtappe(page);
await page.click("[data-act=bewegung]");
await page.waitForFunction(() => !document.getElementById("pause-weiter").disabled, null, { timeout: 5000 });
await page.click("#pause-weiter");
await spieleEtappe(page);
ok((await ansicht(page)) === "mission-ende", "Tagesmission geschafft");
await foto("08-mission-ende");
s = await stand(page);
ok(s.tage[H].mission === true && s.tage[H].etappen === 3, "Mission im Tag eingetragen");
ok(s.muenzen > 40, `Münzen verdient (${s.muenzen})`);
ok(s.tage[H].aufgaben >= 18 && s.tage[H].sek >= 0, "Aufgaben gezählt");
await page.click("[data-act=heim]");
ok((await page.textContent("[data-act=mission]")).includes("Bonus"), "danach: Bonus-Runde");
ok((await page.locator(".etappe-punkt.fertig").count()) === 3, "drei Haken bei den Etappen");

// ---------- Tier ----------
await page.click(".kachel[data-act=tier]");
const m0 = (await stand(page)).muenzen;
ok((await page.locator("[data-act=kaufen][data-arg=kuchen]").count()) === 0 && (await page.locator("[data-act=kaufen][data-arg=kauknochen]").count()) === 1, "Hund bekommt nur Hundefutter, keinen Kuchen");
ok((await page.locator(".laden-ding svg.laden-bild").count()) >= 5 && (await page.locator(".muenzen svg.muenze").count()) === 1, "gezeichnete Bilder im Laden und goldene Münze oben");
await page.click("[data-act=kaufen][data-arg=leckerli]");
s = await stand(page);
ok(s.muenzen === m0 - 4 && s.gefuettert === 1, "Leckerli gefüttert");
ok((await page.locator(".kau").count()) === 1, "Tier mampft");
await page.click("[data-act=tier-reiter][data-arg=zubehoer]");
await page.click("[data-act=kaufen][data-arg=schleife]");
s = await stand(page);
ok(s.besitz.includes("schleife") && s.traegt.includes("schleife"), "Schleife gekauft und angezogen");
await page.click("[data-act=kaufen][data-arg=schleife]");
ok(!(await stand(page)).traegt.includes("schleife"), "Schleife wieder abgelegt");
await page.evaluate(() => { window.__LN.stand().muenzen = 2; });
await page.click("[data-act=kaufen][data-arg=krone]");
ok((await page.textContent(".sprechblase")).includes("fehlen noch"), "zu wenig Münzen: freundlicher Hinweis");
ok(!(await stand(page)).besitz.includes("krone"), "nichts gekauft ohne Münzen");
await page.evaluate(() => { window.__LN.stand().muenzen = 200; window.__LN.speichern(); });
await page.click("[data-act=tier-reiter][data-arg=zimmer]");
ok((await page.locator("[data-act=kaufen][data-arg=korb]").count()) === 1 && (await page.locator("[data-act=kaufen][data-arg=napf]").count()) === 1, "Zimmer: Hundekorb und Napf im Laden");
for (const id of ["korb", "decke", "napf", "ente"]) await page.click(`[data-act=kaufen][data-arg=${id}]`);
ok((await stand(page)).besitz.includes("korb") && (await stand(page)).besitz.includes("napf"), "Hundekorb und Napf gekauft");
await page.evaluate(() => { window.__LN.stand().besitz.push("pflanze", "ball"); window.__LN.speichern(); });
await page.click("[data-act=tier-reiter][data-arg=futter]"); await page.click("[data-act=tier-reiter][data-arg=zimmer]");
ok((await page.locator("[data-act=kaufen][data-arg=pflanze]").count()) === 1 && (await page.locator("[data-act=kaufen][data-arg=ball]").count()) === 1, "früher gekaufte Sachen bleiben sichtbar, nichts doppelt");
await foto("09-tier");
await page.click("[data-act=streicheln]");
ok((await page.locator(".herzen").count()) === 1, "Streicheln zeigt Herzen");

// ---------- Fehlerkiste ----------
// Die Fehler aus der Mission sind nach zweimal richtig schon wieder raus. Für den Test drei Fehler hineinlegen.
ok(((await stand(page)).fehler[FID] || []).length <= 2, "Fehler aus der Mission sind geübt und weitgehend raus");
await page.evaluate((fid) => { const s = window.__LN.stand(); const f = window.LN_FAECHER[0]; s.fehler[fid] = window.LN.fachTeile(f).filter((t, i) => i % 9 === 0).slice(0, 3).map((t) => t.id); window.__LN.speichern(); }, FID);
await page.click("[data-act=heim]");
const kiste = (await stand(page)).fehler[FID].length;
ok(kiste >= 1 && !(await page.locator("[data-act=kiste]").isDisabled()), "Fehlerkiste hat Einträge");
await page.click("[data-act=kiste]");
const nKiste = await spieleEtappe(page);
ok(nKiste === Math.min(10, kiste), `Fehlerkiste übt genau die Fehler (${nKiste})`);
ok((await ansicht(page)) === "runde-ende", "Fehlerkiste-Runde fertig");

// ---------- Frei üben ----------
await page.click("[data-act=heim]");
await page.click("[data-act=themen]");
ok((await page.locator(".thema-karte").count()) >= 2, "Themen zur Auswahl");
await foto("10-themen");
await page.click(".thema-karte >> nth=1");
await spieleEtappe(page);
ok((await ansicht(page)) === "runde-ende", "Thema geübt");

// ---------- Lernkarten ----------
await page.click("[data-act=heim]");
await page.click("[data-act=karten]");
ok((await page.locator(".lernkarte").count()) >= 3, "Lernkarten sichtbar");
await page.click("[data-act=karten-thema] >> nth=1");
ok((await page.locator(".lernkarte .fig svg").count()) >= 1 || (await page.locator(".lernkarte").count()) >= 1, "zweites Thema");
await foto("11-lernkarten");

// ---------- Forschen & Basteln ----------
await page.click("[data-act=heim]");
await page.click("[data-act=auftraege]");
ok((await page.locator(".auftrag").count()) >= 4, "Mitmach-Aufträge sichtbar");
await keinPlatzhalter("Aufträge");
await foto("11b-auftraege");
const mA = (await stand(page)).muenzen;
const aid = await page.getAttribute("[data-act=auftrag-fertig] >> nth=0", "data-arg");
await page.click("[data-act=auftrag-fertig] >> nth=0");
s = await stand(page);
ok(s.auftraege[aid] === H && s.muenzen === mA + 8, "Auftrag geschafft: +8 Münzen, Datum gespeichert");
ok((await page.locator(".auftrag.erledigt").count()) === 1, "Auftrag als geschafft markiert");
ok((await page.locator(`[data-act=auftrag-fertig][data-arg="${aid}"]`).count()) === 0, "kein zweites Mal Münzen");

// ---------- Probe ----------
await page.click("[data-act=heim]");
await page.click("[data-act=probe-start]");
await page.click("[data-act=probe-los]");
await foto("12-probe");
await page.click("[data-act=probe-skip]");
let probeN = 0;
while ((await ansicht(page)) === "probe" && probeN < 40) { await loese(page, { probe: true }); probeN++; }
ok((await ansicht(page)) === "probe-ende", "Probe fertig");
ok((await page.textContent("main")).includes("100 %"), "alles richtig: 100 %");
s = await stand(page);
ok(s.proben[FID].length === 1 && s.proben[FID][0].prozent === 100, "Probe gespeichert");
await foto("13-probe-ende");
await page.click("[data-act=heim]");

// ---------- Eltern ----------
await page.click("#eltern-knopf");
ok((await ansicht(page)) === "start" && (await page.locator(".dialog").textContent()).includes("Für Eltern"), "kurzes Tippen: Hinweis mit Rechenaufgabe statt Eltern-Übersicht");
const tor = await page.evaluate(() => window.__LN.ui().tor);
await page.fill("#tor-eingabe", String(tor.a * tor.b + 1)); await page.click("[data-act=tor-ok]");
ok((await ansicht(page)) === "start", "falsche Rechnung öffnet nicht");
const tor2 = await page.evaluate(() => window.__LN.ui().tor);
await page.fill("#tor-eingabe", String(tor2.a * tor2.b)); await page.click("[data-act=tor-ok]");
ok((await ansicht(page)) === "eltern", "richtige Rechnung öffnet die Eltern-Übersicht");
await page.click("[data-act=heim]");
// Langer Druck mit dem Finger (Touch-Ereignisse wie auf dem iPad)
{
  await page.locator("#eltern-knopf").scrollIntoViewIfNeeded();
  const bx = await page.locator("#eltern-knopf").boundingBox();
  const cdp = await page.context().newCDPSession(page);
  await cdp.send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [{ x: bx.x + bx.width / 2, y: bx.y + bx.height / 2 }] });
  await page.waitForTimeout(100);
  const breite = await page.evaluate(() => parseFloat(document.querySelector("#eltern-knopf .fuell").style.width) || 0);
  ok(breite > 0, `beim Drücken füllt sich der Knopf (${breite} %)`);
  await page.waitForTimeout(350);
  await cdp.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
  ok((await ansicht(page)) === "eltern", "langer Druck mit dem Finger öffnet die Eltern-Übersicht");
  await page.click("[data-act=heim]");
}
await langDruecken(page, "#eltern-knopf", 450);
ok((await ansicht(page)) === "eltern", "langer Druck mit der Maus öffnet die Eltern-Übersicht");
ok((await page.locator(".tage-balken > div").count()) === 7, "Übungszeit für 7 Tage");
await foto("14-eltern");
await page.click("[data-act=eltern-reiter][data-arg=plan]");
await page.fill("#arbeit-titel", "Bio-Arbeit");
await page.fill("#arbeit-datum", "2026-11-26");
await page.click("[data-act=plan-speichern]");
s = await stand(page);
ok(s.plan[FID].arbeit === "2026-11-26" && s.plan[FID].start === H && s.plan[FID].titel === "Bio-Arbeit", "Arbeit eingetragen");
ok((await page.locator("table.plan tr").count()) === 15 && (await page.locator("table.plan tr.heute").count()) === 1, "Plan mit 15 Tagen, heute markiert");
await foto("15-plan");
await page.click("[data-act=eltern-reiter][data-arg=einst]");
await page.selectOption("#e-etappe", "4");
await page.uncheck("#e-pause");
await page.check("#e-ruhig");
s = await stand(page);
ok(s.einst.etappe === 4 && s.einst.pause === false && s.einst.ruhig === true, "Einstellungen gespeichert");
ok(await page.evaluate(() => document.body.classList.contains("ruhig")), "ruhiger Modus aktiv");
await page.fill("#e-tiername", "Fuchsi");
await page.fill("#e-hund", "Testhund");
await page.click("[data-act=namen-speichern]");
ok((await stand(page)).tier.name === "Fuchsi" && (await stand(page)).hund === "Testhund", "Tier umbenannt, Hundename gespeichert");
await page.click("[data-act=heim]");
await page.click("[data-act=karten]");
ok((await page.textContent("main")).includes("Testhund") && !(await page.textContent("main")).includes("Fuchsi fällt"), "Warum-Texte nennen den Hund zu Hause");
await keinPlatzhalter("Lernkarten mit Hundename");
await page.click("[data-act=heim]");
ok((await page.textContent(".countdown")).includes("14 Tage") && (await page.textContent(".countdown")).includes("Bio-Arbeit"), "Countdown zur Arbeit");
ok((await page.textContent(".mission")).includes("Bio: Neues zu «Das Skelett»") && (await page.textContent(".mission")).includes("Aufwärmen Englisch"), "Mission zeigt Schwerpunkt Bio (Arbeit zuerst) und Aufwärmen Englisch");

// ---------- Englisch: Fach wählen, Vokabeln, strenge Rechtschreibung ----------
ok((await page.locator(".fach-tab").count()) === 2, "zwei Fächer als Reiter");
await page.click("[data-act=fach][data-arg=englisch]");
ok((await stand(page)).fach === "englisch" && (await page.locator(".fach-tab.aktiv").textContent()).includes("Englisch"), "Englisch gewählt");
await page.click("[data-act=karten]");
ok((await page.locator("table.vokabeln tbody tr").count()) >= 15, "Vokabelliste in den Lernkarten");
ok((await page.locator("[data-act=sag-en]").count()) >= 15, "jede Vokabel zum Anhören");
await page.click("[data-act=heim]");
await page.click("[data-act=themen]");
await page.click("[data-act=thema][data-arg=hunde-englisch]");
await page.click("[data-act=etappe-los]");
await page.evaluate(() => { const R = window.__LN.ui().runde; R.specs.splice(R.i + 1, 0, { teil: "w2-dog", modus: "de-en-schreiben", seed: 1 }); });
await loese(page); await page.click("[data-act=weiter]");
t = await aufgabe(page);
ok(t.modus === "de-en-schreiben" && t.loesung === "dog", "Schreibaufgabe Deutsch → Englisch");
ok((await page.getAttribute("#eingabe", "autocapitalize")) === "none", "iPad schreibt den ersten Buchstaben nicht automatisch groß");
await page.fill("#eingabe", "Dog"); await page.click("[data-act=pruefen]");
ok((await page.evaluate(() => window.__LN.ui().runde.status)) === "tipp" && (await page.textContent(".rueck.tipp")).includes("Kleinschreibung"), "«Dog» statt «dog»: freundlicher Hinweis auf Kleinschreibung");
await page.fill("#eingabe", "dog"); await page.click("[data-act=pruefen]");
ok((await page.evaluate(() => window.__LN.ui().runde.status)) === "richtig", "«dog» ist richtig");
ok((await page.locator(".rueck.gut [data-act=sag-en]").count()) === 1, "Aussprache zum Anhören");
await foto("16-englisch");
await page.click("[data-act=weiter]");
while ((await ansicht(page)) === "runde") { const st = await page.evaluate(() => window.__LN.ui().runde.status); if (st === "richtig" || st === "loesung") await page.click("[data-act=weiter]"); else await loese(page); }
ok((await stand(page)).fortschritt.englisch && Object.keys((await stand(page)).fortschritt.englisch).length >= 5, "Fortschritt im Fach Englisch");
await page.click("[data-act=heim]");
await page.click("[data-act=fach][data-arg=bio]");
await keinPlatzhalter("Englisch");

// ---------- Sicherung ----------
await langDruecken(page, "#eltern-knopf", 450);
await page.click("[data-act=eltern-reiter][data-arg=sicherung]");
const [dl] = await Promise.all([page.waitForEvent("download"), page.click("[data-act=sicherung]")]);
const datei = await dl.path();
const inhalt = JSON.parse(fs.readFileSync(datei, "utf8"));
ok(inhalt.app === "lernnest" && inhalt.stand.name === "Testkind" && inhalt.version === VERSION, "Sicherungsdatei enthält den Stand");
ok((await page.textContent("#version")).includes("gesichert"), "Version zeigt: gesichert");
const vorher = await stand(page);
await page.click("[data-act=reset]");
await page.click("[data-act=reset-ja]");
ok((await ansicht(page)) === "willkommen" && (await stand(page)).muenzen === 0, "zurückgesetzt");
await einrichten(page, "Test", "panda", "Pan");
await langDruecken(page, "#eltern-knopf", 450);
await page.click("[data-act=eltern-reiter][data-arg=sicherung]");
await page.setInputFiles("#sicherung-datei", datei);
await page.waitForFunction(() => window.__LN.stand().name === "Testkind", null, { timeout: 5000 });
s = await stand(page);
ok(s.muenzen === vorher.muenzen && s.tier.name === "Fuchsi" && s.proben[FID].length === 1, "Sicherung geladen, alles wieder da");
ok((await ansicht(page)) === "start", "nach dem Laden: Startseite");
await langDruecken(page, "#eltern-knopf", 450);
await page.click("[data-act=eltern-reiter][data-arg=sicherung]");
// Sicherung als Text (für ältere iPads)
await page.click("[data-act=text-kopieren]");
const text = await page.inputValue("#sicher-text");
ok(JSON.parse(text).app === "lernnest" && JSON.parse(text).stand.name === "Testkind", "Sicherung als Text enthält den Stand");
await page.evaluate(() => { const s = window.__LN.stand(); s.muenzen = 1; window.__LN.speichern(); });
await page.fill("#lade-text", text); await page.click("[data-act=text-laden]");
ok((await stand(page)).muenzen === JSON.parse(text).stand.muenzen, "Sicherung aus Text geladen");
await langDruecken(page, "#eltern-knopf", 450);
await page.click("[data-act=eltern-reiter][data-arg=sicherung]");
await page.setInputFiles("#sicherung-datei", { name: "x.json", mimeType: "application/json", buffer: Buffer.from('{"hallo":1}') });
await page.waitForTimeout(300);
ok((await stand(page)).name === "Testkind", "falsche Datei ändert nichts");

ok(fehler.length === 0, "keine Fehler in der Konsole: " + fehler.join(" | "));
await zu();
ende();
