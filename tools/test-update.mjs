// Update-Test: Erst die vorherige Version der App starten und spielen, dann auf derselben Adresse
// die neue Version ausliefern. Der Spielstand muss vollständig erhalten bleiben, die neue Versionsnummer
// muss oben stehen, und auch offline muss danach die neue Version laufen.
// Aufruf: node tools/test-update.mjs [alter-public-ordner | git-ref]   (Standard: HEAD~1)
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { execSync } from "node:child_process";
import { starteServer, starteBrowser } from "./server.mjs";
import { PUBLIC, ROOT } from "./lade.mjs";
import { pruefer, einrichten, VERSION } from "./helfer.mjs";

const arg = process.argv[2] || "HEAD~1";
let alt = arg;
if (!fs.existsSync(arg)) {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "lernnest-alt-"));
  try { execSync(`git archive ${arg} public | tar -x -C ${tmp}`, { cwd: ROOT, stdio: ["ignore", "ignore", "pipe"] }); }
  catch (e) { console.log(`Update: keine Vorgängerversion unter «${arg}» gefunden, Test übersprungen.`); process.exit(0); }
  alt = path.join(tmp, "public");
}
const altVersion = Number((fs.readFileSync(path.join(alt, "version.js"), "utf8").match(/n:\s*(\d+)/) || [])[1]);
const { ok, ende } = pruefer("Update");
if (!fs.existsSync(arg)) {
  const geaendert = execSync(`git diff --name-only ${arg} -- public`, { cwd: ROOT }).toString().trim();
  ok(!geaendert || VERSION > altVersion, `public/ hat sich geändert, also muss die Versionsnummer steigen (alt ${altVersion}, neu ${VERSION})`);
}

const srv = await starteServer(alt);
const b = await starteBrowser();
const ctx = await b.newContext({ viewport: { width: 820, height: 1180 }, hasTouch: true });
await ctx.addInitScript(() => { window.__LN_TEST = { heute: "2026-11-12", pauseMs: 100, elternMs: 200 }; });
const page = await ctx.newPage();
const fehler = [];
page.on("pageerror", (e) => fehler.push(e.message));
await page.goto(srv.url);
await page.evaluate(() => navigator.serviceWorker.ready);
ok((await page.textContent("#version")).includes(`Version ${altVersion}`), `alte Version ${altVersion} läuft`);
await einrichten(page, "Testkind", "hund", "Testwelpe");
await page.evaluate(() => {
  const s = window.__LN.stand();
  s.muenzen = 123; s.punkte = 456; s.besitz.push("krone", "kissen"); s.traegt.push("krone"); s.gefuettert = 9;
  s.tage["2026-11-11"] = { sek: 900, aufgaben: 18, richtig: 16, etappen: 3, mission: true };
  window.__LN.speichern();
});
await page.waitForTimeout(600); // IndexedDB-Spiegel wird verzögert geschrieben
const vorher = await page.evaluate(() => JSON.parse(localStorage.getItem("lernnest-v1")));

// Jetzt das Update ausliefern
srv.setWurzel(PUBLIC);
await page.reload();
await page.waitForTimeout(400);
await page.reload();
ok((await page.textContent("#version")).includes(`Version ${VERSION}`), `nach dem Update steht Version ${VERSION} oben`);
const nachher = await page.evaluate(() => JSON.parse(JSON.stringify(window.__LN.stand())));
ok(nachher.name === vorher.name && nachher.tier.name === vorher.tier.name && nachher.tier.art === vorher.tier.art, "Name und Tier sind noch da");
ok(nachher.muenzen === 123 && nachher.punkte === 456 && nachher.gefuettert === 9, "Münzen, Punkte und Futter sind noch da");
ok(["krone", "kissen"].every((x) => nachher.besitz.includes(x)) && nachher.traegt.includes("krone"), "Zubehör und Zimmer sind noch da");
ok(nachher.tage["2026-11-11"] && nachher.tage["2026-11-11"].mission === true, "Übungstage sind noch da");
for (const k of Object.keys(vorher)) ok(k in nachher, `Feld «${k}» gibt es nach dem Update noch`);
ok((await page.locator(".mission").count()) === 1, "nach dem Update die Startseite, nicht die Begrüßung");

// Offline nach dem Update: die neue Version kommt aus dem Speicher
await page.evaluate(() => navigator.serviceWorker.ready);
await page.waitForTimeout(500);
await ctx.setOffline(true);
await page.reload();
ok((await page.textContent("#version")).includes(`Version ${VERSION}`), "offline läuft die neue Version");
ok((await page.evaluate(() => window.__LN.stand().muenzen)) === 123, "offline ist der Spielstand da");
ok(fehler.length === 0, "keine Seitenfehler: " + fehler.join(" | "));
await ctx.close(); await b.close(); await srv.stop();
ende();
