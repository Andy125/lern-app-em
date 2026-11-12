// Spielstand nie verlieren: Neuladen, zweite Kopie, IndexedDB-Spiegel, kaputter Speicher, alter Stand.
// Aufruf: node tools/e2e-speicher.mjs
import { oeffne, einrichten, stand, pruefer } from "./helfer.mjs";

const { ok, ende } = pruefer("Speicher");
const KEY = "lernnest-v1", BAK = KEY + "-bak";
const { page, fehler, zu } = await oeffne();
await einrichten(page);
await page.evaluate(() => { const s = window.__LN.stand(); s.muenzen = 77; s.besitz.push("krone"); window.__LN.speichern(); });
await page.waitForTimeout(500); // IndexedDB wird kurz verzögert geschrieben
// Vor jeder Änderung von außen: App einfrieren, sonst schreibt sie beim Neuladen ihren Stand zurück
const frier = () => page.evaluate(() => { window.__LN_TEST.einfrieren = true; });
const warte = (bed) => page.waitForFunction(bed, null, { timeout: 5000 }).then(() => true, () => false);

await page.reload();
ok((await stand(page)).muenzen === 77 && (await page.locator(".mission").count()) === 1, "nach Neuladen alles da");

await frier();
await page.evaluate((k) => localStorage.removeItem(k), KEY);
await page.reload();
ok((await stand(page)).muenzen === 77, "Hauptspeicher weg: zweite Kopie springt ein");
ok(await page.evaluate((k) => !!localStorage.getItem(k), KEY), "Hauptspeicher wiederhergestellt");

await frier();
await page.evaluate(([k, b]) => { localStorage.removeItem(k); localStorage.removeItem(b); }, [KEY, BAK]);
await page.reload();
ok(await warte(() => window.__LN.stand().muenzen === 77), "beide Kopien weg: IndexedDB stellt wieder her");
ok(await warte(() => document.querySelector(".mission") !== null), "danach wieder die Startseite statt Willkommen");

await frier();
await page.evaluate(([k]) => localStorage.setItem(k, "{kaputt"), [KEY]);
await page.reload();
ok((await stand(page)).muenzen === 77, "kaputter Hauptspeicher: Kopie wird genommen");
ok(await page.evaluate((k) => localStorage.getItem(k + "-defekt") === "{kaputt", KEY), "kaputter Stand wird zur Untersuchung aufgehoben");

// Ein älterer oder halber Stand (zum Beispiel aus einer früheren Version) wird ergänzt, nicht verworfen
await page.waitForTimeout(400);
await frier();
await page.evaluate(([k, b]) => { const alt = JSON.stringify({ name: "Testkind", tier: { art: "hase", name: "Hoppel" }, muenzen: 5, erstellt: 1 }); localStorage.setItem(k, alt); localStorage.setItem(b, alt); }, [KEY, BAK]);
await page.reload();
const s = await stand(page);
ok(s.tier.name === "Hoppel" && s.muenzen === 5 && s.einst.etappe === 6 && typeof s.fortschritt === "object", "alter Stand wird mit Standardwerten ergänzt");
ok((await page.locator(".mission").count()) === 1, "alter Stand startet normal");

// Mitten in der Etappe schließen: geschaffte Etappen bleiben, die Mission geht dort weiter
await page.click("[data-act=mission]");
await page.evaluate(() => { const s = window.__LN.stand(); s.tage["2026-11-12"] = { sek: 100, aufgaben: 6, richtig: 6, etappen: 1, mission: false }; window.__LN.speichern(); window.__LN_TEST.einfrieren = true; });
await page.reload();
ok((await page.textContent("[data-act=mission]")).includes("Etappe 2"), "Mission geht mit Etappe 2 weiter");
await page.click("[data-act=mission]");
ok((await page.textContent("main")).includes("Etappe 2 von 3"), "Etappe 2 startet");

// Neuer Tag: Mission beginnt von vorn, alter Tag bleibt in der Statistik
await zu();
const z = await oeffne({ test: { heute: "2026-11-13" } });
await z.page.evaluate(() => { window.__LN_TEST.einfrieren = true; });
await z.page.evaluate(([k, b]) => { const st = { name: "Testkind", tier: { art: "fuchs", name: "F" }, erstellt: 1, tage: { "2026-11-12": { sek: 600, aufgaben: 18, richtig: 15, etappen: 3, mission: true } } }; localStorage.setItem(k, JSON.stringify(st)); localStorage.setItem(b, JSON.stringify(st)); }, [KEY, BAK]);
await z.page.reload();
ok((await z.page.textContent("[data-act=mission]")).includes("Los geht"), "neuer Tag: neue Mission");
ok((await z.page.textContent(".fuss")).includes("1 Tag"), "gestern zählt in der Woche");
ok(fehler.length === 0 && z.fehler.length === 0, "keine Fehler in der Konsole: " + fehler.concat(z.fehler).join(" | "));
await z.zu();
ende();
